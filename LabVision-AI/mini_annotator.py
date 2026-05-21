import cv2
import os
import numpy as np

def mini_annotate():
    calib_dir = os.path.join('LabVision-AI', 'manual_calibration')
    if not os.path.exists(calib_dir):
        print("Error: manual_calibration folder not found.")
        return

    import argparse
    parser = argparse.ArgumentParser(description="Interactive Mini-Annotator")
    parser.add_argument('--filter', type=str, default=None, help="Filter images by filename substring (e.g. 'back cam')")
    parser.add_argument('--limit', type=int, default=None, help="Limit the number of images to annotate")
    parser.add_argument('--unlabeled-only', action='store_true', help="Only show images without existing annotations")
    parser.add_argument('--labeled-only', action='store_true', help="Only show images with existing annotations")
    args, unknown = parser.parse_known_args()

    frames = [f for f in os.listdir(calib_dir) if f.endswith('.jpg')]
    
    if args.filter:
        frames = [f for f in frames if args.filter.lower() in f.lower()]
        print(f"🔍 Filtered to {len(frames)} images matching '{args.filter}'")
        
    if args.unlabeled_only:
        frames = [f for f in frames if not os.path.exists(os.path.join(calib_dir, f.replace('.jpg', '.txt')))]
        print(f"🔍 Filtered to {len(frames)} unlabeled images")

    if args.labeled_only:
        frames = [f for f in frames if os.path.exists(os.path.join(calib_dir, f.replace('.jpg', '.txt')))]
        print(f"🔍 Filtered to {len(frames)} labeled images")
        
    if args.limit and len(frames) > args.limit:
        # Spaced out sampling across the entire timeline to maximize training diversity
        indices = np.linspace(0, len(frames) - 1, args.limit, dtype=int)
        frames = [frames[i] for i in indices]
        print(f"📊 Spaced out sampling: Selected {len(frames)} key representative frames for calibration.")

    # Target display size
    MAX_W, MAX_H = 1280, 720

    for f_name in frames:
        img_path = os.path.join(calib_dir, f_name)
        label_path = os.path.join(calib_dir, f_name.replace('.jpg', '.txt'))
        
        orig_img = cv2.imread(img_path)
        if orig_img is None: continue
        
        oh, ow, _ = orig_img.shape
        
        # Calculate scaling factor
        scale = min(MAX_W/ow, MAX_H/oh, 1.0)
        dw, dh = int(ow * scale), int(oh * scale)
        img = cv2.resize(orig_img, (dw, dh))
        
        boxes = [] # Stores scaled coordinates
        
        # Load existing labels and scale them to display size
        if os.path.exists(label_path):
            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.split()
                    if len(parts) >= 5:
                        cls, x, y, bw, bh = map(float, parts[:5])
                        # Convert to pixels (scaled)
                        x1 = int((x - bw/2) * dw)
                        y1 = int((y - bh/2) * dh)
                        x2 = int((x + bw/2) * dw)
                        y2 = int((y + bh/2) * dh)
                        boxes.append([x1, y1, x2, y2])

        def draw_callback(event, x, y, flags, param):
            nonlocal boxes, drawing, start_point, temp_img
            if event == cv2.EVENT_LBUTTONDOWN:
                drawing = True
                start_point = (x, y)
            elif event == cv2.EVENT_MOUSEMOVE:
                if drawing:
                    temp_img = img_display.copy()
                    cv2.rectangle(temp_img, start_point, (x, y), (0, 255, 255), 2)
            elif event == cv2.EVENT_LBUTTONUP:
                drawing = False
                end_point = (x, y)
                boxes.append([min(start_point[0], end_point[0]), min(start_point[1], end_point[1]),
                              max(start_point[0], end_point[0]), max(start_point[1], end_point[1])])

        drawing = False
        start_point = (0, 0)
        temp_img = img.copy()
        
        cv2.namedWindow('Mini-Annotator')
        cv2.setMouseCallback('Mini-Annotator', draw_callback)
        
        print(f"\nAnnotating: {f_name} (Scaled to {dw}x{dh})")
        print("CONTROLS: [s] Save & Next, [r] Reset, [q] Quit")
        
        while True:
            img_display = img.copy()
            for b in boxes:
                cv2.rectangle(img_display, (b[0], b[1]), (b[2], b[3]), (0, 255, 0), 2)
            
            if drawing:
                cv2.imshow('Mini-Annotator', temp_img)
            else:
                cv2.imshow('Mini-Annotator', img_display)
                
            key = cv2.waitKey(1) & 0xFF
            if key == ord('s'):
                # Save to YOLO format (must scale back to original or use normalized)
                with open(label_path, 'w') as lf:
                    for b in boxes:
                        # Since YOLO is normalized, we just normalize by the current display size
                        bw = (b[2] - b[0]) / dw
                        bh = (b[3] - b[1]) / dh
                        xc = (b[0] + b[2]) / (2 * dw)
                        yc = (b[1] + b[3]) / (2 * dh)
                        lf.write(f"0 {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}\n")
                print(f"Saved {len(boxes)} boxes to {label_path}")
                break
            elif key == ord('r'):
                boxes = []
                print("Boxes reset.")
            elif key == ord('q'):
                cv2.destroyAllWindows()
                return

    cv2.destroyAllWindows()
    print("\nCalibration Complete! Let me know when you are done.")

    cv2.destroyAllWindows()
    print("\nCalibration Complete! Let me know when you are done.")

if __name__ == "__main__":
    mini_annotate()
