import argparse
import csv
from pathlib import Path

import cv2
from ultralytics import YOLO


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def iter_images(images_dir):
    images_dir = Path(images_dir)
    for path in sorted(images_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            yield path


def yolo_line_from_xyxy(box, image_width, image_height):
    x1, y1, x2, y2 = box
    x_center = ((x1 + x2) / 2.0) / image_width
    y_center = ((y1 + y2) / 2.0) / image_height
    width = (x2 - x1) / image_width
    height = (y2 - y1) / image_height
    return f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"


def auto_label_image(model, image_path, labels_dir, review_dir, imgsz, conf, iou, device):
    image = cv2.imread(str(image_path))
    if image is None:
        return {"image": str(image_path), "status": "read_failed", "person_count": 0}

    height, width = image.shape[:2]
    result = model.predict(
        image,
        classes=[0],
        imgsz=imgsz,
        conf=conf,
        iou=iou,
        device=device,
        verbose=False,
    )[0]

    labels_dir.mkdir(parents=True, exist_ok=True)
    label_path = labels_dir / f"{image_path.stem}.txt"

    lines = []
    confidences = []
    boxes = result.boxes
    if boxes is not None and len(boxes) > 0:
        for xyxy, score in zip(boxes.xyxy.cpu().numpy(), boxes.conf.cpu().numpy()):
            lines.append(yolo_line_from_xyxy(xyxy, width, height))
            confidences.append(float(score))

    label_path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")

    review_dir.mkdir(parents=True, exist_ok=True)
    review_path = review_dir / image_path.name
    annotated = result.plot()
    cv2.imwrite(str(review_path), annotated)

    return {
        "image": str(image_path),
        "label": str(label_path),
        "review_image": str(review_path),
        "status": "ok",
        "person_count": len(lines),
        "min_conf": min(confidences) if confidences else "",
        "max_conf": max(confidences) if confidences else "",
    }


def main():
    parser = argparse.ArgumentParser(description="Pre-label back-camera frames using the copied LabOS teacher model.")
    parser.add_argument("--model", default="labos_backcam_teacher_yolov8s.pt", help="Teacher model path.")
    parser.add_argument("--images", default="datasets/labos_backcam_people/extracted_frames", help="Images to pre-label.")
    parser.add_argument("--labels", default="datasets/labos_backcam_people/teacher_labels", help="Output YOLO label folder.")
    parser.add_argument("--review", default="datasets/labos_backcam_people/teacher_review", help="Annotated review images.")
    parser.add_argument("--report", default="datasets/labos_backcam_people/teacher_autolabel_report.csv", help="CSV report path.")
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--conf", type=float, default=0.35)
    parser.add_argument("--iou", type=float, default=0.5)
    parser.add_argument("--device", default="0")
    args = parser.parse_args()

    model = YOLO(args.model)
    rows = []
    for image_path in iter_images(args.images):
        row = auto_label_image(
            model=model,
            image_path=image_path,
            labels_dir=Path(args.labels),
            review_dir=Path(args.review),
            imgsz=args.imgsz,
            conf=args.conf,
            iou=args.iou,
            device=args.device,
        )
        rows.append(row)
        print(f"{Path(row['image']).name}: {row['person_count']} people")

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", newline="", encoding="utf-8") as handle:
        fieldnames = ["image", "label", "review_image", "status", "person_count", "min_conf", "max_conf"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Auto-labeled {len(rows)} images.")
    print(f"Review every label before training. Report: {report_path}")


if __name__ == "__main__":
    main()

