import argparse
import re
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".m4v"}


def slugify(value):
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_") or "video"


def iter_videos(input_path):
    input_path = Path(input_path)
    if input_path.is_file() and input_path.suffix.lower() in VIDEO_EXTENSIONS:
        yield input_path
        return

    for path in sorted(input_path.rglob("*")):
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS:
            yield path


def save_review_frame(frame, output_root, category, video_slug, timestamp_ms, frame_index):
    out_dir = output_root / category
    out_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{category}__{video_slug}__t{timestamp_ms:08d}ms__f{frame_index:06d}.jpg"
    return cv2.imwrite(str(out_dir / filename), frame)


def scan_video(model, video_path, output_root, imgsz, device, seconds):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"WARNING: could not open {video_path}")
        return 0

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    frame_interval = max(1, int(round(fps * seconds)))
    video_slug = slugify(video_path.stem)
    saved = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        frame_index = int(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1
        if frame_index % frame_interval != 0:
            continue

        timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
        result_low = model.predict(frame, classes=[0], imgsz=imgsz, conf=0.15, iou=0.5, device=device, verbose=False)[0]
        boxes = result_low.boxes
        if boxes is None or len(boxes) == 0:
            continue

        confs = boxes.conf.cpu().numpy()
        areas = []
        for box in boxes.xyxy.cpu().numpy():
            x1, y1, x2, y2 = box
            areas.append(max(0.0, (x2 - x1) * (y2 - y1)))
        median_area = float(np.median(areas)) if areas else 0.0

        if np.any((confs >= 0.15) & (confs <= 0.45)):
            saved += int(save_review_frame(frame, output_root, "low_confidence", video_slug, timestamp_ms, frame_index))
        if len(confs) >= 4:
            saved += int(save_review_frame(frame, output_root, "crowded_or_grouped", video_slug, timestamp_ms, frame_index))
        if median_area > 0 and median_area < 2500:
            saved += int(save_review_frame(frame, output_root, "small_or_far_people", video_slug, timestamp_ms, frame_index))

    cap.release()
    print(f"{video_path.name}: saved {saved} review frames")
    return saved


def main():
    parser = argparse.ArgumentParser(description="Collect back-camera active-learning review frames.")
    parser.add_argument("--model", default="runs/labos/backcam_yolo11s/weights/best.pt")
    parser.add_argument("--input", required=True, help="Unseen back-camera video file or folder.")
    parser.add_argument("--output", default="datasets/labos_backcam_people/active_learning")
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--device", default="0")
    parser.add_argument("--seconds", type=float, default=1.0)
    args = parser.parse_args()

    output_root = Path(args.output)
    output_root.mkdir(parents=True, exist_ok=True)
    model = YOLO(args.model)

    total = 0
    for video_path in iter_videos(args.input):
        total += scan_video(model, video_path, output_root, args.imgsz, args.device, args.seconds)

    print(f"Saved {total} active-learning frames to {output_root}")
    print("Correct labels manually, add reviewed samples to the dataset, then retrain as a new version.")


if __name__ == "__main__":
    main()

