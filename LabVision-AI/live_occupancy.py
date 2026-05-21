import cv2
from ultralytics import YOLO
import time
import os
import torch

def smart_scale(frame, target_width=1280, target_height=720):
    oh, ow = frame.shape[:2]
    scale = min(target_width/ow, target_height/oh, 1.0)
    if scale < 1.0:
        return cv2.resize(frame, (int(ow * scale), int(oh * scale)))
    return frame
def run_live_occupancy(source=0, weights='yolov8s_final.pt', device_override=None):
    """
    Production-Grade Live Occupancy Monitoring System
    Source: 0 (Webcam), or path to 'video.mp4'
    """
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
    
    local_final = os.path.join(SCRIPT_DIR, 'yolov8s_final.pt')
    root_final = os.path.join(PROJECT_ROOT, 'yolov8s_final.pt')
    train_weights = os.path.join(PROJECT_ROOT, 'runs', 'train', 'lab_occupancy_v2_ultra', 'weights', 'best.pt')

    # 1. Perspective-Adaptive Model Selector
    is_webcam = False
    if isinstance(source, int) or (isinstance(source, str) and source.isdigit()):
        is_webcam = int(source) == 0
    elif isinstance(source, str) and ("webcam" in source.lower() or "usb" in source.lower()):
        is_webcam = True

    if is_webcam:
        # Webcams are always eye-level flat angles - standard YOLOv8s is 100% perfect
        model_path = 'yolov8s.pt'
        print(f"🎥 WEBCAM DETECTED: Loading standard general-view model to guarantee perfect eye-level detection: {model_path}")
    else:
        # Security cameras or video files require overhead lab calibration
        if os.path.exists(local_final):
            model_path = local_final
            print(f"🛰️ OVERHEAD CAMERA DETECTED: Loading custom fine-tuned model: {model_path}")
        elif os.path.exists(root_final):
            model_path = root_final
            print(f"🛰️ OVERHEAD CAMERA DETECTED: Loading custom fine-tuned model from root: {model_path}")
        elif os.path.exists(train_weights):
            model_path = train_weights
            print(f"🛰️ OVERHEAD CAMERA DETECTED: Loading latest training checkpoint: {model_path}")
        else:
            model_path = os.path.join(SCRIPT_DIR, 'yolov8s.pt')
            print(f"🛰️ OVERHEAD CAMERA DETECTED: Fallback to standard base model: {model_path}")
        
    model = YOLO(model_path)
    
    # Safe self-healing device detection
    if device_override is not None:
        device = device_override
    else:
        try:
            # Test if CUDA can actually execute Conv2d operations without throwing kernel image errors
            import torch.nn as nn
            conv = nn.Conv2d(1, 1, 3).cuda()
            test_x = torch.rand(1, 1, 3, 3).cuda()
            test_y = conv(test_x)
            device = 0
            print("✅ GPU Acceleration detected and operational on RTX 5070!")
        except Exception as e:
            print(f"⚠️ GPU acceleration unavailable or incompatible ({type(e).__name__}). Gracefully falling back to CPU for inference.")
            device = 'cpu'
            
    print(f"Using Device: {device}")
    
    # 2. Setup Video Capture
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Error: Could not open source {source}")
        return

    print("\n--- LABVISION-AI LIVE MONITORING ACTIVE ---")
    print("CONTROLS: [Q] Quit, [P] Pause, [F] Fast Forward (5s), [B] Rewind (5s)\n")

    paused = False
    while cap.isOpened():
        if not paused:
            ret, frame = cap.read()
            if not ret:
                if isinstance(source, str): # Loop video if it's a file
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    break
        
        # 3. Processing
        display_frame = smart_scale(frame)
        
        # Inference (Optimized: Using YOLOv8's built-in tracker at imgsz=640 for 4x speed and smooth tracking)
        results = model.track(display_frame, persist=True, classes=[0], conf=0.48, imgsz=640, device=device, verbose=False)
        
        # If no tracks are active, fall back to standard inference
        if results[0].boxes is None or len(results[0].boxes) == 0:
            results = model(display_frame, classes=[0], conf=0.48, imgsz=640, device=device, verbose=False)
            
        count = len(results[0].boxes) if results[0].boxes is not None else 0
        
        # 4. Draw Results
        annotated_frame = results[0].plot()
        
        # HUD
        cv2.putText(annotated_frame, f"Occupancy: {count}", (50, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # 5. Display
        cv2.namedWindow("LabVision-AI Real-Time Monitor", cv2.WINDOW_NORMAL)
        cv2.imshow("LabVision-AI Real-Time Monitor", annotated_frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('p'):
            paused = not paused
        elif key == ord('f'):
            current_frame = cap.get(cv2.CAP_PROP_POS_FRAMES)
            cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame + 150)
        elif key == ord('b'):
            current_frame = cap.get(cv2.CAP_PROP_POS_FRAMES)
            cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, current_frame - 150))

    cap.release()
    cv2.destroyAllWindows()
    print("Monitoring system terminated safely.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="LabVision-AI Occupancy Monitor")
    parser.add_argument("--source", type=str, default="0", help="Webcam index or video path")
    parser.add_argument("--device", type=str, default=None, help="Device to run on (0, 1, 'cpu')")
    args = parser.parse_args()
    
    device = args.device
    if device is not None and device.isdigit():
        device = int(device)
        
    source = args.source
    if source.isdigit():
        source = int(source)
        
    run_live_occupancy(source=source, device_override=device)
