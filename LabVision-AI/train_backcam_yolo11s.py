import argparse
from pathlib import Path

from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser(description="Train a separate LabOS back-camera YOLO11s model.")
    parser.add_argument("--model", default="yolo11s.pt", help="Base model. Does not overwrite this file.")
    parser.add_argument("--data", default="datasets/labos_backcam_people/data.yaml")
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--epochs", type=int, default=150)
    parser.add_argument("--batch", default="-1")
    parser.add_argument("--device", default="0")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--patience", type=int, default=40)
    parser.add_argument("--project", default="runs/labos")
    parser.add_argument("--name", default="backcam_yolo11s")
    parser.add_argument("--close-mosaic", type=int, default=20)
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset YAML not found: {data_path}")

    model = YOLO(args.model)
    results = model.train(
        data=str(data_path),
        imgsz=args.imgsz,
        epochs=args.epochs,
        batch=int(args.batch) if str(args.batch).lstrip("-").isdigit() else args.batch,
        device=args.device,
        workers=args.workers,
        patience=args.patience,
        project=args.project,
        name=args.name,
        exist_ok=False,
        close_mosaic=args.close_mosaic,
    )

    print(f"Training finished. Best weights should be under: {results.save_dir}/weights/best.pt")
    print("This script does not overwrite yolov8s_final.pt or any production model.")


if __name__ == "__main__":
    main()

