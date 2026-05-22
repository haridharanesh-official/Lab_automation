import argparse
import re
from pathlib import Path

import cv2


VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".m4v"}


def slugify(value):
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_") or "video"


def laplacian_variance(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return cv2.Laplacian(gray, cv2.CV_64F).var()


def frame_difference_score(prev_gray, frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (160, 90), interpolation=cv2.INTER_AREA)
    if prev_gray is None:
        return gray, 999.0
    diff = cv2.absdiff(prev_gray, gray)
    return gray, float(diff.mean())


def iter_videos(input_path):
    input_path = Path(input_path)
    if input_path.is_file() and input_path.suffix.lower() in VIDEO_EXTENSIONS:
        yield input_path
        return

    for path in sorted(input_path.rglob("*")):
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS:
            yield path


def extract_from_video(video_path, output_dir, camera_name, seconds, frames, blur_threshold, diff_threshold):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"WARNING: could not open {video_path}")
        return 0

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    interval = max(1, int(frames if frames else round(fps * seconds)))
    output_dir.mkdir(parents=True, exist_ok=True)

    saved = 0
    seen = 0
    prev_gray = None
    video_slug = slugify(video_path.stem)
    camera_slug = slugify(camera_name)

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        frame_index = int(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1
        if frame_index % interval != 0:
            continue

        seen += 1
        blur_score = laplacian_variance(frame)
        if blur_score < blur_threshold:
            continue

        current_gray, diff_score = frame_difference_score(prev_gray, frame)
        if diff_score < diff_threshold:
            continue
        prev_gray = current_gray

        timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
        filename = f"{camera_slug}__{video_slug}__t{timestamp_ms:08d}ms__f{frame_index:06d}.jpg"
        if cv2.imwrite(str(output_dir / filename), frame):
            saved += 1

    cap.release()
    print(f"{video_path.name}: sampled={seen}, saved={saved}")
    return saved


def main():
    parser = argparse.ArgumentParser(description="Extract back-camera frames for LabOS YOLO training.")
    parser.add_argument("--input", required=True, help="Back-camera video file or folder.")
    parser.add_argument("--output", default="datasets/labos_backcam_people/extracted_frames", help="Frame output folder.")
    parser.add_argument("--camera-name", default="back_camera", help="Camera name embedded in filenames.")
    parser.add_argument("--seconds", type=float, default=1.5, help="Extract one frame every N seconds.")
    parser.add_argument("--frames", type=int, default=None, help="Extract one frame every N frames. Overrides --seconds.")
    parser.add_argument("--blur-threshold", type=float, default=25.0, help="Skip frames blurrier than this Laplacian variance.")
    parser.add_argument("--diff-threshold", type=float, default=2.0, help="Skip near-duplicate frames below this mean pixel difference.")
    args = parser.parse_args()

    total = 0
    output_dir = Path(args.output)
    for video_path in iter_videos(args.input):
        total += extract_from_video(
            video_path=video_path,
            output_dir=output_dir,
            camera_name=args.camera_name,
            seconds=args.seconds,
            frames=args.frames,
            blur_threshold=args.blur_threshold,
            diff_threshold=args.diff_threshold,
        )

    print(f"Saved {total} frames to {output_dir}")


if __name__ == "__main__":
    main()

