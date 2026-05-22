import cv2
from ultralytics import YOLO
import paho.mqtt.client as mqtt
import json
import time
import os
import argparse
from collections import deque
import numpy as np

# --- CONFIGURATION ---
MQTT_BROKER = "hari.local"
MQTT_PORT = 1883
MQTT_TOPIC_COUNT = "lab/vision/people_count"
MQTT_TOPIC_STATUS = "lab/vision/status"
CLIENT_ID = "LabVision_AI_Sensor_V2"

# SAFETY: Hardcoded blocklist to prevent AI script from controlling relays
BLOCKED_TOPIC_PREFIXES = [
    "lab/control/",
    "lab/relay/",
    "lab/automation/",
]

class SafeMQTTClient:
    """Wrapper to guarantee we never publish to restricted topics."""
    def __init__(self, broker, port, client_id):
        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id)
        except AttributeError:
            self.client = mqtt.Client(client_id)
            
        self.broker = broker
        self.port = port
        self.client.on_connect = self._on_connect
        self.connected = False
        
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("✅ Connected to MQTT Broker!")
            self.connected = True
        else:
            print(f"❌ Connection failed: {rc}")
            
    def connect(self):
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
        except Exception as e:
            print(f"⚠️ MQTT Error: {e}")
            
    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()
        self.connected = False

    def publish(self, topic, payload, qos=0, retain=False):
        for blocked in BLOCKED_TOPIC_PREFIXES:
            if topic.startswith(blocked):
                print(f"🚨 CRITICAL SECURITY BLOCK: Attempted to publish to restricted topic '{topic}'. Request dropped.")
                return False
                
        if not self.connected:
            return False
            
        self.client.publish(topic, payload, qos=qos, retain=retain)
        return True

def count_to_tier(count):
    if count >= 18:
        return 4
    if count >= 11:
        return 3
    if count >= 5:
        return 2
    if count >= 1:
        return 1
    return 0


def run_production_inference(source, conf_thresh, iou_thresh, debug=False, device_override=None, model_filename='yolov8s_final.pt', camera='back_camera'):
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(SCRIPT_DIR, model_filename) if os.path.exists(os.path.join(SCRIPT_DIR, model_filename)) else model_filename
    model_label = os.path.splitext(os.path.basename(model_path))[0]
        
    print(f"📦 Loading production model: {model_path}")
    model = YOLO(model_path)
    
    if device_override is None:
        try:
            import torch.nn as nn
            import torch
            conv = nn.Conv2d(1, 1, 3).cuda()
            device = '0'
        except Exception:
            device = 'cpu'
    else:
        device = device_override

    # Connect MQTT
    mqtt_client = SafeMQTTClient(MQTT_BROKER, MQTT_PORT, CLIENT_ID)
    mqtt_client.connect()
    
    # Send online status
    mqtt_client.publish(MQTT_TOPIC_COUNT, json.dumps({
        "count": 0,
        "raw_count": 0,
        "tier": 0,
        "status": "online",
        "model": model_label,
        "camera": camera,
        "timestamp": time.time()
    }), qos=1, retain=True)
    mqtt_client.publish(MQTT_TOPIC_STATUS, json.dumps({
        "status": "online",
        "model": model_label,
        "camera": camera,
        "timestamp": time.time()
    }), qos=1, retain=True)

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"❌ Error: Could not open source {source}")
        return

    # Median smoothing buffer (e.g. 30 frames = 1 second at 30fps)
    count_buffer = deque(maxlen=30)
    last_stable_count = -1
    
    print("\n🛡️ Production Inference Active. Safe-publish mode ENABLED.")
    print(f"Listening on source: {source}")
    
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                if isinstance(source, str) and not source.isdigit():
                    # Loop video
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                break
                
            # Optional ByteTrack via model.track()
            # We filter for class 0 (person)
            results = model.track(frame, persist=True, classes=[0], conf=conf_thresh, iou=iou_thresh, device=device, verbose=False)
            
            raw_count = len(results[0].boxes) if results[0].boxes is not None else 0
            count_buffer.append(raw_count)
            
            # Stable count via median
            stable_count = int(np.median(count_buffer))
            
            # Publish if stable count changed
            if stable_count != last_stable_count:
                payload = json.dumps({
                    "count": stable_count,
                    "raw_count": raw_count,
                    "tier": count_to_tier(stable_count),
                    "status": "online",
                    "model": model_label,
                    "camera": camera,
                    "timestamp": time.time()
                })
                mqtt_client.publish(MQTT_TOPIC_COUNT, payload, qos=1, retain=True)
                mqtt_client.publish(f"{MQTT_TOPIC_COUNT}/state", str(stable_count), qos=1, retain=True)
                print(f"📡 Published: {stable_count} people (raw: {raw_count})")
                last_stable_count = stable_count
                
            if debug:
                annotated_frame = results[0].plot()
                cv2.putText(annotated_frame, f"Stable: {stable_count} (Raw: {raw_count})", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.imshow("LabOS Production Debug", annotated_frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
    finally:
        cap.release()
        if debug: cv2.destroyAllWindows()
        # Publish offline status gracefully
        mqtt_client.publish(MQTT_TOPIC_COUNT, json.dumps({
            "count": last_stable_count,
            "raw_count": raw_count,
            "tier": count_to_tier(last_stable_count),
            "status": "offline",
            "model": model_label,
            "camera": camera,
            "timestamp": time.time()
        }), qos=1, retain=True)
        mqtt_client.publish(MQTT_TOPIC_STATUS, json.dumps({
            "status": "offline",
            "model": model_label,
            "camera": camera,
            "timestamp": time.time()
        }), qos=1, retain=True)
        mqtt_client.disconnect()
        print("\nShutdown complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=str, default="0", help="Camera index or video file")
    parser.add_argument("--conf", type=float, default=0.48, help="Confidence threshold")
    parser.add_argument("--iou", type=float, default=0.50, help="NMS IOU threshold")
    parser.add_argument("--debug", action="store_true", help="Show video feed window")
    parser.add_argument("--device", type=str, default=None, help="Device (0, 'cpu')")
    parser.add_argument("--model", type=str, default="yolov8s_final.pt", help="Model file to load")
    parser.add_argument("--camera", type=str, default="back_camera", help="Camera label included in MQTT payload")
    
    args = parser.parse_args()
    
    src = int(args.source) if args.source.isdigit() else args.source
    run_production_inference(src, args.conf, args.iou, args.debug, args.device, args.model, args.camera)
