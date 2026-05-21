import cv2
import os
from ultralytics import YOLO
import torch

def test_video_inference(video_path, model_path, output_path, max_frames=150):
    print(f"Loading model: {model_path}")
    model = YOLO(model_path)
    
    # Safe self-healing device detection
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
    
    if not os.path.exists(video_path):
        print(f"Error: Video file '{video_path}' not found.")
        return
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video '{video_path}'.")
        return
        
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"Video Resolution: {width}x{height}, FPS: {fps}, Total Frames: {total_frames}")
    print(f"Processing up to {max_frames} frames to save a quick test sample...")
    
    # Setup VideoWriter
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frame_count = 0
    while cap.isOpened() and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Run inference (only detect 'person' which is class 0)
        results = model(frame, classes=[0], conf=0.35, device=device, verbose=False)
        
        # Annotate
        annotated_frame = results[0].plot()
        person_count = len(results[0].boxes)
        
        # Add a premium HUD overlay
        cv2.rectangle(annotated_frame, (20, 20), (380, 80), (0, 0, 0), -1)
        cv2.putText(annotated_frame, f"Occupancy Count: {person_count}", (30, 60),
                    cv2.FONT_HERSHEY_DUPLEX, 0.9, (0, 255, 255), 2)
                    
        out.write(annotated_frame)
        frame_count += 1
        if frame_count % 30 == 0:
            print(f"Processed {frame_count}/{max_frames} frames...")
            
    cap.release()
    out.release()
    print(f"Annotated video saved successfully to '{output_path}'!")

if __name__ == "__main__":
    video = "Lab footage/iot lab back cam 1 crowded.mp4"
    model = "LabVision-AI/yolov8s_final.pt"
    output = "back_cam_annotated.mp4"
    test_video_inference(video, model, output)
