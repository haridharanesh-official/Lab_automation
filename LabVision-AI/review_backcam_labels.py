import argparse
from pathlib import Path

import cv2


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def read_yolo_boxes(label_path, image_width, image_height):
    boxes = []
    if not label_path.exists():
        return boxes
    for line in label_path.read_text(encoding="utf-8").splitlines():
        parts = line.split()
        if len(parts) < 5:
            continue
        _, xc, yc, bw, bh = parts[:5]
        xc = float(xc) * image_width
        yc = float(yc) * image_height
        bw = float(bw) * image_width
        bh = float(bh) * image_height
        x1 = int(round(xc - bw / 2))
        y1 = int(round(yc - bh / 2))
        x2 = int(round(xc + bw / 2))
        y2 = int(round(yc + bh / 2))
        boxes.append([x1, y1, x2, y2])
    return boxes


def write_yolo_boxes(label_path, boxes, image_width, image_height):
    label_path.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    for x1, y1, x2, y2 in boxes:
        x1 = max(0, min(image_width - 1, x1))
        x2 = max(0, min(image_width - 1, x2))
        y1 = max(0, min(image_height - 1, y1))
        y2 = max(0, min(image_height - 1, y2))
        if x2 <= x1 or y2 <= y1:
            continue
        xc = ((x1 + x2) / 2) / image_width
        yc = ((y1 + y2) / 2) / image_height
        bw = (x2 - x1) / image_width
        bh = (y2 - y1) / image_height
        lines.append(f"0 {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}")
    label_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def scale_box(box, scale):
    return [int(round(v * scale)) for v in box]


def unscale_box(box, scale):
    return [int(round(v / scale)) for v in box]


def point_inside_box(x, y, box):
    x1, y1, x2, y2 = box
    return x1 <= x <= x2 and y1 <= y <= y2


def delete_box_at(boxes, x, y):
    index = find_box_at(boxes, x, y)
    if index is None:
        return False
    boxes.pop(index)
    return True


def find_box_at(boxes, x, y):
    candidates = []
    for index, box in enumerate(boxes):
        if point_inside_box(x, y, box):
            x1, y1, x2, y2 = box
            candidates.append(((x2 - x1) * (y2 - y1), index))
    if not candidates:
        return None
    _, selected_index = min(candidates)
    return selected_index


def draw_boxes(image, boxes, current_box=None, selected_index=None, message=""):
    canvas = image.copy()
    for index, (x1, y1, x2, y2) in enumerate(boxes, start=1):
        color = (0, 0, 255) if selected_index == index - 1 else (0, 220, 0)
        thickness = 3 if selected_index == index - 1 else 2
        cv2.rectangle(canvas, (x1, y1), (x2, y2), color, thickness)
        cv2.putText(
            canvas,
            str(index),
            (x1, max(22, y1 - 6)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color,
            2,
            cv2.LINE_AA,
        )
    if current_box:
        x1, y1, x2, y2 = current_box
        cv2.rectangle(canvas, (x1, y1), (x2, y2), (0, 220, 255), 2)

    h, w = canvas.shape[:2]
    cv2.rectangle(canvas, (0, 0), (w, 86), (0, 0, 0), -1)
    cv2.putText(
        canvas,
        message,
        (16, 34),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.78,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        canvas,
        "Drag=add | Click box=select | x/Delete=delete selected | d=delete last | r=reload | c=clear | s=save | q=quit",
        (16, 68),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.58,
        (220, 220, 220),
        2,
        cv2.LINE_AA,
    )
    return canvas


def review_images(args):
    images_dir = Path(args.images)
    labels_dir = Path(args.labels)
    start_labels_dir = Path(args.start_labels) if args.start_labels else labels_dir
    hints_dir = Path(args.hints) if args.hints else None

    image_paths = [p for p in sorted(images_dir.iterdir()) if p.suffix.lower() in IMAGE_EXTENSIONS]
    if args.start:
        image_paths = image_paths[args.start :]
    if args.limit:
        image_paths = image_paths[: args.limit]

    window = "Backcam Label Correction"
    hint_window = "Low-confidence hints"
    cv2.namedWindow(window, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window, args.window_width, args.window_height)

    if hints_dir:
        cv2.namedWindow(hint_window, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(hint_window, args.window_width, args.window_height)

    for image_index, image_path in enumerate(image_paths, start=1):
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"Skipping unreadable image: {image_path}")
            continue

        original_h, original_w = image.shape[:2]
        scale = min(args.window_width / original_w, args.window_height / original_h, 1.0)
        display_w = int(original_w * scale)
        display_h = int(original_h * scale)
        display_image = cv2.resize(image, (display_w, display_h))

        label_path = labels_dir / f"{image_path.stem}.txt"
        start_label_path = start_labels_dir / f"{image_path.stem}.txt"
        boxes = [scale_box(box, scale) for box in read_yolo_boxes(label_path, original_w, original_h)]
        start_boxes = [scale_box(box, scale) for box in read_yolo_boxes(start_label_path, original_w, original_h)]

        hint_path = hints_dir / image_path.name if hints_dir else None
        if hint_path and hint_path.exists():
            hint = cv2.imread(str(hint_path))
            if hint is not None:
                hint = cv2.resize(hint, (display_w, display_h))
                cv2.imshow(hint_window, hint)

        drawing = False
        start_point = None
        current_box = None
        selected_index = None

        def mouse_callback(event, x, y, _flags, _param):
            nonlocal drawing, start_point, current_box, boxes, selected_index
            if event == cv2.EVENT_LBUTTONDOWN:
                selected_index = find_box_at(boxes, x, y)
                if selected_index is not None:
                    drawing = False
                    current_box = None
                    return
                drawing = True
                start_point = (x, y)
                current_box = [x, y, x, y]
            elif event == cv2.EVENT_MOUSEMOVE and drawing:
                current_box = [
                    min(start_point[0], x),
                    min(start_point[1], y),
                    max(start_point[0], x),
                    max(start_point[1], y),
                ]
            elif event == cv2.EVENT_MOUSEMOVE:
                selected_index = find_box_at(boxes, x, y)
            elif event == cv2.EVENT_LBUTTONUP and drawing:
                drawing = False
                x1 = min(start_point[0], x)
                y1 = min(start_point[1], y)
                x2 = max(start_point[0], x)
                y2 = max(start_point[1], y)
                if x2 - x1 <= 4 and y2 - y1 <= 4:
                    selected_index = find_box_at(boxes, x, y)
                else:
                    boxes.append([x1, y1, x2, y2])
                    selected_index = len(boxes) - 1
                current_box = None
            elif event == cv2.EVENT_RBUTTONDOWN:
                if delete_box_at(boxes, x, y):
                    selected_index = None

        cv2.setMouseCallback(window, mouse_callback)

        while True:
            message = f"{image_index}/{len(image_paths)} {image_path.name} | boxes={len(boxes)} | expected visible people usually 23"
            cv2.imshow(window, draw_boxes(display_image, boxes, current_box, selected_index, message))
            key = cv2.waitKey(20) & 0xFF
            if key in (ord("s"), ord("S")):
                original_boxes = [unscale_box(box, scale) for box in boxes]
                write_yolo_boxes(label_path, original_boxes, original_w, original_h)
                print(f"Saved {len(boxes)} boxes: {label_path}")
                break
            if key in (ord("n"), ord("N")):
                print(f"Skipped without saving: {image_path.name}")
                break
            if key in (ord("x"), ord("X"), 8, 127) and selected_index is not None:
                boxes.pop(selected_index)
                selected_index = None
            if key in (ord("d"), ord("D")) and boxes:
                boxes.pop()
                selected_index = None
            if key in (ord("r"), ord("R")):
                boxes = [box[:] for box in start_boxes]
                selected_index = None
            if key in (ord("c"), ord("C")):
                boxes = []
                selected_index = None
            if key in (ord("q"), ord("Q"), 27):
                cv2.destroyAllWindows()
                return

    cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="Correct YOLO person labels for the LabOS back-camera review pack.")
    parser.add_argument("--images", default="datasets/labos_backcam_people/review_backcam_crowded_23/images_raw")
    parser.add_argument("--labels", default="datasets/labos_backcam_people/review_backcam_crowded_23/labels_corrected")
    parser.add_argument("--start-labels", default="datasets/labos_backcam_people/review_backcam_crowded_23/labels_start")
    parser.add_argument("--hints", default="datasets/labos_backcam_people/review_backcam_crowded_23/review_overlay_lowconf_hints")
    parser.add_argument("--start", type=int, default=0, help="Zero-based image index to start from.")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--window-width", type=int, default=1280)
    parser.add_argument("--window-height", type=int, default=720)
    args = parser.parse_args()
    review_images(args)


if __name__ == "__main__":
    main()
