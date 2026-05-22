import argparse
import re
from pathlib import Path

import cv2
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


def mine_video(model, video_path, output_dir, imgsz, conf, iou, device, seconds):
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

        result = model.predict(frame, classes=[0], imgsz=imgsz, conf=conf, iou=iou, device=device, verbose=False)[0]
        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            continue

        timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
        filename = f"hard_negative__{video_slug}__t{timestamp_ms:08d}ms__f{frame_index:06d}.jpg"
        if cv2.imwrite(str(output_dir / filename), frame):
            saved += 1

    cap.release()
    print(f"{video_path.name}: saved {saved} candidate false-positive frames")
    return saved


def main():
    parser = argparse.ArgumentParser(description="Mine back-camera hard negatives from empty/object-heavy footage.")
    parser.add_argument("--model", default="runs/labos/backcam_yolo11s/weights/best.pt")
    parser.add_argument("--input", required=True, help="Empty/object-heavy back-camera video file or folder.")
    parser.add_argument("--output", default="datasets/labos_backcam_people/hard_negatives")
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--conf", type=float, default=0.35)
    parser.add_argument("--iou", type=float, default=0.5)
    parser.add_argument("--device", default="0")
    parser.add_argument("--seconds", type=float, default=1.0)
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    model = YOLO(args.model)

    total = 0
    for video_path in iter_videos(args.input):
        total += mine_video(model, video_path, output_dir, args.imgsz, args.conf, args.iou, args.device, args.seconds)

    print(f"Saved {total} hard-negative review frames to {output_dir}")
    print("Human review is required before adding these as empty-label training images.")


if __name__ == "__main__":
    main()

