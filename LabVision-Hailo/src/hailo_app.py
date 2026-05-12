import cv2
import threading
import queue
import time
import logging
from fusion_engine import FusionEngine
from mqtt_manager import MQTTManager

# Import Hailo only if available
try:
    from hailo_platform import HEF, Device, VDevice, InferVStreams, ConfigureVStreams, InputVStreamParams, OutputVStreamParams, FormatType
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
        self.fusion = FusionEngine()
        self.mqtt = MQTTManager(broker=mqtt_broker)
        
        # Setup MQTT Callbacks
        self.mqtt.on_pir_update = self.fusion.update_sensor
        self.mqtt.on_mmwave_update = self.fusion.update_sensor
        
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
                        person_detected = self._parse_yolo_results(infer_results)
                        
                        self.fusion.update_sensor("ai", person_detected)
                    except queue.Empty:
                        continue

    def _mock_inference_loop(self):
        """Mock loop for testing without Hailo hardware"""
        while self.running:
            try:
                frame = self.frame_queue.get(timeout=1)
                # Mock logic: detect anything as 'true' for now
                self.fusion.update_sensor("ai", True)
                time.sleep(0.03) # Simulate 30 FPS
            except queue.Empty:
                continue

    def _parse_yolo_results(self, results):
        """Parses Hailo output tensors into person detection (Stub)"""
        # Implementation depends on your specific YOLO version export
        # Return True if 'person' class confidence > 0.5
        return True

    def _logic_thread(self):
        """Occupancy Computation and MQTT Publishing"""
        logger.info("Starting Logic Thread")
        self.mqtt.connect()
        
        while self.running:
            # 1. Update Fusion Engine
            state_changed = self.fusion.compute_final_state()
            
            # 2. Publish ONLY on change
            if state_changed:
                state = self.fusion.get_state_json()
                self.mqtt.publish_state("lab/lab101/zoneA/occupancy/state", state)
            
            # 3. Heartbeat every 30s
            if int(time.time()) % 30 == 0:
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
    # Example usage
    app = HailoApp(
        rtsp_url="rtsp://admin:pass@192.168.1.100:554/live",
        model_path="models/yolov8s_lab.hef",
        mqtt_broker="localhost"
    )
    app.start()
