import os
import cv2
import numpy as np
from ultralytics import YOLO
from tqdm import tqdm

def is_blurry(image, threshold=70.0):
    """Rule 7: Mark/remove frames that are extremely blurry."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    fm = cv2.Laplacian(gray, cv2.CV_64F).var()
    return fm < threshold

def auto_label_perfect():
    import torch
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
        print(f"⚠️ GPU acceleration unavailable or incompatible ({type(e).__name__}). Gracefully falling back to CPU.")
        device = 'cpu'

    print("Loading high-precision YOLOv8l model...")
    model = YOLO('yolov8l.pt') 
    
    # Path setup
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
    
    input_dir = os.path.join(PROJECT_ROOT, 'dataset_raw')
    output_dir = os.path.join(SCRIPT_DIR, 'auto_labeled_labels')
    log_file = os.path.join(SCRIPT_DIR, 'labeling_quality_report.txt')

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    images = sorted([f for f in os.listdir(input_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    
    skipped_blurry = 0
    labeled_count = 0
    suspect_frames = []

    print(f"Processing {len(images)} images with EXPERT RULES...")
    
    with open(log_file, 'w') as log:
        log.write("LABVISION-AI QUALITY REPORT\n")
        log.write("===========================\n\n")

        for img_name in tqdm(images):
            img_path = os.path.join(input_dir, img_name)
            label_path = os.path.join(output_dir, img_name.rsplit('.', 1)[0] + '.txt')
            
            # Skip if already labeled
            if os.path.exists(label_path):
                labeled_count += 1
                continue

            img = cv2.imread(img_path)
            if img is None:
                continue

            # Rule 7: Blur Check
            if is_blurry(img):
                skipped_blurry += 1
                log.write(f"[SKIP] Blurry: {img_name}\n")
                continue
            
            # Rule 1-4: High Precision Inference
            # Conf=0.20 (Calibrated based on User Audit to close 1.20x sensitivity gap)
            results = model(img, classes=[0], conf=0.20, verbose=False, device=device) 
            
            suspect_log = os.path.join(SCRIPT_DIR, 'suspect_audit.txt')
            with open(label_path, 'w') as f:
                found_person = False
                confidences = []
                for result in results:
                    boxes = result.boxes.xywhn.cpu().numpy()
                    confs = result.boxes.conf.cpu().numpy()
                    for i, box in enumerate(boxes):
                        found_person = True
                        conf = confs[i]
                        confidences.append(conf)
                        f.write(f"0 {box[0]:.6f} {box[1]:.6f} {box[2]:.6f} {box[3]:.6f}\n")
                        
                        # Real-time suspect logging
                        is_suspect = False
                        reason = ""
                        if box[2] > 0.8 or box[3] > 0.8:
                            is_suspect = True
                            reason = f"Box too large ({conf:.2f})"
                        elif conf < 0.5:
                            is_suspect = True
                            reason = f"Low confidence ({conf:.2f})"
                            
                        if is_suspect:
                            with open(suspect_log, 'a') as sl:
                                sl.write(f"[SUSPECT] {img_name} - {reason}\n")
                            suspect_frames.append((img_name, reason))

                if not found_person:
                    pass
                else:
                    avg_conf = np.mean(confidences)

            labeled_count += 1

        log.write(f"\nFinal Stats:\n")
        log.write(f"Total Frames: {len(images)}\n")
        log.write(f"Successfully Labeled: {labeled_count}\n")
        log.write(f"Skipped (Blurry): {skipped_blurry}\n")
        log.write(f"Suspect frames identified: {len(suspect_frames)}\n")
        for s in suspect_frames:
            log.write(f"[SUSPECT] {s[0]} - {s[1]}\n")

    print(f"\nExpert Labeling Complete!")
    print(f"Processed {len(images)} frames.")
    print(f"Quality report generated: {log_file}")

if __name__ == "__main__":
    auto_label_perfect()
