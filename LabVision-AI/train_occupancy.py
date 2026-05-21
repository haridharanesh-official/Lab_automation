from ultralytics import YOLO
import torch
import os

def train_model():
    # Safe self-healing device detection
    try:
        # Test if CUDA can actually execute Conv2d operations without throwing kernel image errors
        import torch.nn as nn
        conv = nn.Conv2d(1, 1, 3).cuda()
        test_x = torch.rand(1, 1, 3, 3).cuda()
        test_y = conv(test_x)
        device = '0'
        print("✅ GPU Acceleration detected and operational on RTX 5070!")
    except Exception as e:
        print(f"⚠️ GPU acceleration unavailable or incompatible ({type(e).__name__}). Gracefully falling back to CPU for training.")
        device = 'cpu'
        # Optimize CPU multi-threading for Core Ultra 9 285K
        torch.set_num_threads(20)
        print("⚡ Multi-threading optimized: Using 20 CPU threads for Core Ultra 9 285K.")
    
    # Load existing fine-tuned model if available, otherwise fall back to base
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
    model_path = os.path.join(SCRIPT_DIR, 'yolov8s_final.pt')
    if os.path.exists(model_path):
        print(f"Loading existing trained model for fine-tuning: {model_path}")
    else:
        model_path = os.path.join(SCRIPT_DIR, 'yolov8s.pt')
        print(f"yolov8s_final.pt not found. Training from base model: {model_path}")
        
    model = YOLO(model_path)
    
    # Training parameters optimized for occupancy detection
    results = model.train(
        data=os.path.join(SCRIPT_DIR, 'data.yaml'),
        epochs=15, # Extended epochs for deep un-frozen backbone convergence
        patience=10, # Give it plenty of room to converge
        freeze=2, # Unfreeze 95% of the entire model to allow complete shape customization
        imgsz=640, # 640x640 is standard for Hailo compiled HEF models
        batch=32, # Maximize CPU vectorization speed
        workers=0, # Windows pagefile stability
        device=device,
        name='lab_occupancy_v2_ultra',
        project=os.path.join(PROJECT_ROOT, 'runs', 'train'),
        exist_ok=True,
        
        # --- ULTIMATE AUGMENTATIONS FOR ZERO MISTAKES ---
        degrees=30.0,      # Handle human shapes in any walking direction/angle
        translate=0.2,     # Robustness to cut-off bodies near corners
        scale=0.8,         # Extreme scale robustness (tiny distant or massive near people)
        shear=5.0,         # Slanted camera angles
        perspective=0.0005,# Emulate other security lens distortions
        fliplr=0.5,        # Horizontal motion mirroring
        flipud=0.5,        # Vertical motion mirroring (crucial for overhead cameras!)
        hsv_h=0.020,       # Extreme hue variations (handles camera glare)
        hsv_s=0.9,         # Extreme saturation variations
        hsv_v=0.6,         # Extreme lighting variations (shadows to bright sunbeams)
        mosaic=1.0,        # Blends 4 frames into 1 for tiny/crowded details
        mixup=0.3,         # Overlays overlapping humans for heavy occlusion robustness!
        
        # --- ULTIMATE LOSS TUNING FOR ZERO FALSE POSITIVES ---
        box=10.0,          # Tighter box regression (eradicates duplicate overlap boxes)
        cls=2.0,           # Massive penalty for calling any desk/chair a person!
        dfl=2.0,           # Highly precise bounding boundaries
    )

    
    print("Training completed successfully!")
    print(f"Model saved to: {results.save_dir}")
    
    # Automatically copy the best weight file to yolov8s_final.pt
    import shutil
    best_weights = os.path.join(results.save_dir, 'weights', 'best.pt')
    target_weights = os.path.join(SCRIPT_DIR, 'yolov8s_final.pt')
    if os.path.exists(best_weights):
        shutil.copy2(best_weights, target_weights)
        print(f"Successfully updated active model: {target_weights}")


if __name__ == '__main__':
    train_model()
