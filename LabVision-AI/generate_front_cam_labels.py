import os
import cv2
import numpy as np
from ultralytics import YOLO

def generate_front_cam_annotations():
    print("🚀 Initializing Front Camera Auto-Labeler for Active Learning...")
    
    # Path setup
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    calib_dir = os.path.join(SCRIPT_DIR, 'manual_calibration')
    
    if not os.path.exists(calib_dir):
        print(f"❌ Error: {calib_dir} directory not found.")
        return
        
    # Find all front camera jpg files
    all_files = os.listdir(calib_dir)
    front_crowded = sorted([f for f in all_files if 'front cam 1 crowded' in f and f.endswith('.jpg')])
    front_morning = sorted([f for f in all_files if 'front cam morning' in f and f.endswith('.jpg')])
    front_night = sorted([f for f in all_files if 'front cam night' in f and f.endswith('.jpg')])
    
    print(f"📊 Found in manual_calibration:")
    print(f"  - Crowded front cam images: {len(front_crowded)}")
    print(f"  - Morning front cam images: {len(front_morning)}")
    print(f"  - Night front cam images: {len(front_night)}")
    
    # Select 5 representative images from each category (spaced out)
    def select_representative(file_list, num_samples=5):
        if not file_list:
            return []
        if len(file_list) <= num_samples:
            return file_list
        indices = np.linspace(0, len(file_list) - 1, num_samples, dtype=int)
        return [file_list[i] for i in indices]
        
    selected_crowded = select_representative(front_crowded, 5)
    selected_morning = select_representative(front_morning, 5)
    selected_night = select_representative(front_night, 5)
    
    target_images = selected_crowded + selected_morning + selected_night
    print(f"\n🎯 Selected {len(target_images)} key representative frames for calibration review:")
    for img in target_images:
        print(f"  - {img}")
        
    # Load model on CPU to avoid GPU VRAM conflicts with the active background training
    model_path = os.path.join(SCRIPT_DIR, 'yolov8s_final.pt')
    if not os.path.exists(model_path):
        model_path = os.path.join(SCRIPT_DIR, 'yolov8s.pt')
        print(f"⚠️ yolov8s_final.pt not found. Using baseline model: {model_path}")
    else:
        print(f"✅ Loading current active model: {model_path}")
        
    print("🧠 Loading YOLO model on CPU...")
    model = YOLO(model_path)
    
    print("🔮 Running inference to pre-populate annotations...")
    annotated_count = 0
    
    for img_name in target_images:
        img_path = os.path.join(calib_dir, img_name)
        label_path = os.path.join(calib_dir, img_name.replace('.jpg', '.txt'))
        
        img = cv2.imread(img_path)
        if img is None:
            print(f"  ⚠️ Failed to read {img_name}")
            continue
            
        # Run inference (person class is 0, conf=0.20 for high sensitivity)
        results = model(img, classes=[0], conf=0.20, verbose=False, device='cpu')
        
        boxes_to_save = []
        for result in results:
            boxes = result.boxes.xywhn.cpu().numpy() # normalized xywh format
            for box in boxes:
                boxes_to_save.append(box)
                
        # Write labels to manual_calibration
        with open(label_path, 'w') as f:
            for box in boxes_to_save:
                f.write(f"0 {box[0]:.6f} {box[1]:.6f} {box[2]:.6f} {box[3]:.6f}\n")
                
        print(f"  ✍️ Auto-annotated {img_name} with {len(boxes_to_save)} detections.")
        annotated_count += 1
        
    print(f"\n🎉 Successfully pre-populated annotations for {annotated_count} front-camera calibration frames!")
    print("👉 You can now run `mini_annotator.py` to inspect, correct, and save them.")

if __name__ == '__main__':
    generate_front_cam_annotations()
