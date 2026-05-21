from ultralytics import YOLO
import cv2
import os
import glob

def validate_model(model_path, test_dir, output_dir):
    print(f"Validating model: {model_path}")
    model = YOLO(model_path)
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    test_dir_to_use = test_dir
    if not os.path.exists(test_dir_to_use):
        if os.path.exists("dataset_raw"):
            test_dir_to_use = "dataset_raw"
            print(f"Directory '{test_dir}' not found. Falling back to '{test_dir_to_use}' for validation.")
        else:
            print(f"Error: Neither '{test_dir}' nor 'dataset_raw' was found.")
            return
            
    test_files = glob.glob(os.path.join(test_dir_to_use, "*.jpg"))[:5]
    
    # Safe self-healing device detection
    import torch
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
        
    for i, img_path in enumerate(test_files):
        results = model(img_path, device=device)
        # Process results list
        for result in results:
            # Save annotated image
            annotated_img = result.plot()
            out_path = os.path.join(output_dir, f"val_result_{i}.jpg")
            cv2.imwrite(out_path, annotated_img)
            
            # Print detections
            for box in result.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                print(f"Image {i}: Detected {model.names[cls]} with confidence {conf:.2f}")

if __name__ == "__main__":
    validate_model(
        "LabVision-AI/yolov8s_final.pt", 
        "test data", 
        "val_results"
    )
