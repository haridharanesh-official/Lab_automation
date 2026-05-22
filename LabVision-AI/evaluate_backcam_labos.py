import argparse
import csv
import json
import time
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


def count_to_tier(count):
    if count >= 18:
        return 4
    if count >= 11:
        return 3
    if count >= 5:
        return 2
    if count >= 1:
        return 1
    return 0


def load_count_ground_truth(csv_path):
    if not csv_path:
        return {}

    data = {}
    with open(csv_path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            data[float(row["time_sec"])] = int(row["count"])
    return data


def nearest_ground_truth(gt_counts, time_sec):
    if not gt_counts:
        return None
    nearest_time = min(gt_counts, key=lambda key: abs(key - time_sec))
    return gt_counts[nearest_time]


def evaluate_video(model, source, imgsz, conf, iou, device, gt_counts=None, empty_lab=False):
    cap = cv2.VideoCapture(str(source))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open source: {source}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 30.0

    frame_interval = max(1, int(round(fps)))
    predictions = []
    false_positive_frames = 0
    occupied_missed_frames = 0
    compared_frames = 0
    frame_index = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if frame_index % frame_interval != 0:
            frame_index += 1
            continue

        time_sec = frame_index / fps
        result = model.predict(frame, classes=[0], imgsz=imgsz, conf=conf, iou=iou, device=device, verbose=False)[0]
        pred_count = len(result.boxes) if result.boxes is not None else 0
        gt_count = nearest_ground_truth(gt_counts, time_sec) if gt_counts else None

        if empty_lab and pred_count > 0:
            false_positive_frames += 1

        if gt_count is not None:
            compared_frames += 1
            if gt_count > 0 and pred_count == 0:
                occupied_missed_frames += 1

        predictions.append({
            "time_sec": round(time_sec, 3),
            "pred_count": pred_count,
            "gt_count": gt_count,
            "tier": count_to_tier(pred_count),
        })
        frame_index += 1

    cap.release()

    duration_hours = max((frame_index / fps) / 3600.0, 1e-9)
    mae_values = [abs(item["pred_count"] - item["gt_count"]) for item in predictions if item["gt_count"] is not None]

    return {
        "source": str(source),
        "duration_hours": duration_hours,
        "sampled_frames": len(predictions),
        "false_positives_per_hour": false_positive_frames / duration_hours if empty_lab else None,
        "missed_person_rate": occupied_missed_frames / compared_frames if compared_frames else None,
        "people_count_mae": float(np.mean(mae_values)) if mae_values else None,
        "predictions": predictions,
    }


def main():
    parser = argparse.ArgumentParser(description="Evaluate LabOS back-camera model with automation-focused metrics.")
    parser.add_argument("--model", default="runs/labos/backcam_yolo11s/weights/best.pt")
    parser.add_argument("--data", default="datasets/labos_backcam_people/data.yaml")
    parser.add_argument("--source", help="Optional video source for LabOS-specific count evaluation.")
    parser.add_argument("--ground-truth-counts", help="CSV with columns: time_sec,count")
    parser.add_argument("--empty-lab", action="store_true", help="Treat source as empty-lab footage for FP/hour.")
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--conf", type=float, default=0.35)
    parser.add_argument("--iou", type=float, default=0.5)
    parser.add_argument("--device", default="0")
    parser.add_argument("--output", default="runs/labos/backcam_eval")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    model = YOLO(args.model)
    report = {
        "model": args.model,
        "data": args.data,
        "timestamp": time.time(),
        "metrics": {},
        "scenario_metrics": {},
    }

    metrics = model.val(data=args.data, imgsz=args.imgsz, conf=args.conf, iou=args.iou, device=args.device)
    report["metrics"] = {
        "precision": float(np.mean(metrics.box.p)),
        "recall": float(np.mean(metrics.box.r)),
        "map50": float(metrics.box.map50),
        "map50_95": float(metrics.box.map),
    }

    if args.source:
        gt_counts = load_count_ground_truth(args.ground_truth_counts)
        report["scenario_metrics"]["source_video"] = evaluate_video(
            model=model,
            source=args.source,
            imgsz=args.imgsz,
            conf=args.conf,
            iou=args.iou,
            device=args.device,
            gt_counts=gt_counts,
            empty_lab=args.empty_lab,
        )

    report_path = output_dir / "backcam_labos_eval.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["metrics"], indent=2))
    print(f"Saved report: {report_path}")


if __name__ == "__main__":
    main()

