from ultralytics import YOLO
import os

model_path = "LabVision-AI/yolov8s_final.pt"
if os.path.exists(model_path):
    model = YOLO(model_path)
    print("=== MODEL CLASSES ===")
    print(model.names)
else:
    print(f"Model not found at {model_path}")
