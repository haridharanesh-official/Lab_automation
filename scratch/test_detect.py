from ultralytics import YOLO
import cv2
import os

model_path = "LabVision-AI/yolov8s_final.pt"
video_path = "Lab footage/iot lab front cam 1 crowded.mp4"

if not os.path.exists(model_path):
    print("Model not found!")
    exit(1)

if not os.path.exists(video_path):
    print("Video not found!")
    exit(1)

model = YOLO(model_path)
cap = cv2.VideoCapture(video_path)

ret, frame = cap.read()
if ret:
    results = model(frame, classes=[0], conf=0.35, imgsz=1280)
    person_count = len(results[0].boxes)
    print(f"=== VERIFICATION RESULTS ===")
    print(f"Loaded: {model_path}")
    print(f"Detections in first frame: {person_count} people")
    for i, box in enumerate(results[0].boxes):
        print(f"  Person {i+1}: confidence {float(box.conf[0]):.2f}")
else:
    print("Could not read frame from video.")

cap.release()
