import cv2
import threading
import queue
import time
import logging
import os
from occupancy_engine import OccupancyEngine
from mqtt_manager import MQTTManager

import numpy as np
import json
# Import Hailo only if available
try:
    from hailo_platform import HEF, Device, VDevice, InferVStreams, ConfigureVStreams, InputVStreamParams, OutputVStreamParams, FormatType # type: ignore
    HAILO_AVAILABLE = True
except ImportError:
    HAILO_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("LabVision-Hailo")

class HailoApp:
    def __init__(self, rtsp_url, model_path, mqtt_broker="localhost"):
        self.rtsp_url = rtsp_url
        self.model_path = model_path
        
        # Threads & Queues
        self.frame_queue = queue.Queue(maxsize=2) # Only keep latest 2 frames to avoid lag
        self.running = True
        
        # Modules
        self.mqtt = MQTTManager(broker=mqtt_broker)
        self.engine = OccupancyEngine(self.mqtt.client)
        
        # Setup MQTT Callbacks for external sensors
        self.mqtt.on_pir_update = lambda v: self.engine.update(self.engine.stable_count + (1 if v else 0))
        self.mqtt.on_mmwave_update = lambda v: self.engine.update(self.engine.stable_count + (1 if v else 0))
        
    def _capture_thread(self):
        """GStreamer-based RTSP Capture with HW Decoding"""
        # Optimized for Pi 5 HW Decoding
        gst_pipeline = (
            f"rtspsrc location={self.rtsp_url} latency=100 ! "
            "rtph264depay ! h264parse ! v4l2h264dec ! "
            "videoconvert ! appsink drop=true max-buffers=1"
        )
        
        # Fallback to simple capture if RTSP is just '0' (webcam)
        source = self.rtsp_url if not self.rtsp_url.isdigit() else int(self.rtsp_url)
        cap = cv2.VideoCapture(gst_pipeline, cv2.CAP_GSTREAMER) if "rtsp" in str(source) else cv2.VideoCapture(source)
        
        if not cap.isOpened():
            logger.error("Could not open RTSP stream")
            self.running = False
            return

        logger.info("Starting Capture Thread")
        while self.running:
            ret, frame = cap.read()
            if not ret:
                logger.warning("RTSP Stream Disconnected. Reconnecting...")
                cap.release()
                time.sleep(5)
                cap = cv2.VideoCapture(gst_pipeline, cv2.CAP_GSTREAMER)
                continue
            
            # Use a non-blocking put to keep the queue fresh
            if self.frame_queue.full():
                try: self.frame_queue.get_nowait()
                except queue.Empty: pass
            self.frame_queue.put(frame)
            
        cap.release()

    def _inference_thread(self):
        """Hailo-8 Accelerated Inference Engine"""
        if not HAILO_AVAILABLE:
            logger.warning("HailoRT not found! Running in MOCK/CPU mode.")
            self._mock_inference_loop()
            return

        logger.info(f"Loading Hailo Model: {self.model_path}")
        # --- HAILO INITIALIZATION ---
        # 1. Target the first available VDevice
        with VDevice() as target:
            # 2. Load HEF
            hef = HEF(self.model_path)
            
            # 3. Configure Streams
            configure_params = ConfigureVStreams.get_default_params(hef)
            network_group = target.configure(hef, configure_params)[0]
            
            input_vstream_params = InputVStreamParams.make_from_network_group(network_group, format_type=FormatType.UINT8)
            output_vstream_params = OutputVStreamParams.make_from_network_group(network_group, format_type=FormatType.FLOAT32)
            
            with InferVStreams(network_group, input_vstream_params, output_vstream_params) as (inputs, outputs):
                logger.info("Hailo Inference Pipeline ACTIVE")
                while self.running:
                    try:
                        frame = self.frame_queue.get(timeout=1)
                        # Preprocess (Resize to 640x640 for YOLO)
                        input_data = cv2.resize(frame, (640, 640))
                        
                        # Async Inference
                        infer_results = network_group.run(inputs, outputs, [input_data])
                        
                        # --- POST-PROCESSING ---
                        # (This is where you parse YOLO boxes)
                        person_count = self._parse_yolo_results(infer_results)
                        self.engine.update(person_count)
                    except queue.Empty:
                        continue

    def _mock_inference_loop(self):
        """Mock loop for testing without Hailo hardware"""
        while self.running:
            try:
                frame = self.frame_queue.get(timeout=1)
                # Mock logic: detect 1 person for testing
                self.engine.update(1)
                time.sleep(0.03) # Simulate 30 FPS
            except queue.Empty:
                continue

    def _parse_yolo_results(self, results):
        """
        Parses Hailo output tensors (1, 5, 8400) into person detection.
        Format: [batch, 5, 8400] where 5 is [cx, cy, w, h, confidence]
        """
        if not results or len(results) == 0:
            return False

        # Hailo returns results as a list of numpy arrays from vstreams
        # For our model, it's a single output tensor
        output_tensor = results[0] # Shape (1, 5, 8400)
        
        # Squeeze batch and transpose to (8400, 5)
        predictions = np.squeeze(output_tensor).T
        
        # Filter by confidence threshold (e.g., 0.5)
        conf_threshold = 0.5
        scores = predictions[:, 4]
        mask = scores > conf_threshold
        
        person_count = int(np.sum(mask))
        if person_count > 0:
            logger.debug(f"Detected {person_count} people with max score: {np.max(scores)}")
        
        return person_count

    def _logic_thread(self):
        """Occupancy Computation and MQTT Publishing"""
        logger.info("Starting Logic Thread")
        self.mqtt.connect()
        
        MQTT_TOPIC_COUNT = "lab/vision/people_count"
        last_publish_time = 0
        PUBLISH_INTERVAL = 1

        while self.running:
            now = time.time()
            
            # 1. Publish Telemetry to Home Assistant (Every 1s)
            if (now - last_publish_time) >= PUBLISH_INTERVAL:
                payload = {
                    "count": self.engine.stable_count,
                    "raw_count": self.engine.stable_count, # Mocked as stable for Pi
                    "tier": self.engine.current_tier,
                    "status": "online"
                }
                self.mqtt.client.publish(MQTT_TOPIC_COUNT, json.dumps(payload), qos=1, retain=True)
                self.mqtt.client.publish(f"{MQTT_TOPIC_COUNT}/state", str(self.engine.stable_count), qos=1, retain=True)
                last_publish_time = now
            
            # 2. Heartbeat every 60s
            if int(now) % 60 == 0:
                self.mqtt.publish_heartbeat()
                
            time.sleep(0.5)

    def start(self):
        threads = [
            threading.Thread(target=self._capture_thread),
            threading.Thread(target=self._inference_thread),
            threading.Thread(target=self._logic_thread)
        ]
        
        for t in threads:
            t.daemon = True
            t.start()
            
        try:
            while self.running: time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            self.running = False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="LabVision-Hailo Production Monitor")
    parser.add_argument("--source", type=str, default="0", help="Webcam ID, RTSP URL, or Video File path")
    parser.add_argument("--weights", type=str, default="models/yolov8s_lab.hef", help="Path to .hef model")
    parser.add_argument("--mqtt", type=str, default="localhost", help="MQTT Broker IP")
    args = parser.parse_args()

    # Convert numeric source for local webcam
    source = args.source
    if source.isdigit():
        source = int(source)
    elif os.path.exists(source):
        # Resolve absolute path for video files to avoid GStreamer confusion
        source = os.path.abspath(source)

    app = HailoApp(
        rtsp_url=source,
        model_path=args.weights,
        mqtt_broker=args.mqtt
    )
    app.start()
