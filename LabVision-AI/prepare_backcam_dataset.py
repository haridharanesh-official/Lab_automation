import argparse
import shutil
from collections import defaultdict
from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


DATA_YAML = """path: datasets/labos_backcam_people
train: images/train
val: images/val
test: images/test
names:
  0: person
"""


def group_key(image_path):
    parts = image_path.stem.split("__")
    if len(parts) >= 2:
        return "__".join(parts[:2])
    return image_path.stem.split("_f")[0]


def split_blocks(items, train_ratio=0.70, val_ratio=0.20):
    train_end = int(len(items) * train_ratio)
    val_end = train_end + int(len(items) * val_ratio)
    return items[:train_end], items[train_end:val_end], items[val_end:]


def ensure_dataset_dirs(dataset_dir):
    for subdir in [
        "images/train",
        "images/val",
        "images/test",
        "labels/train",
        "labels/val",
        "labels/test",
        "raw_videos",
        "extracted_frames",
        "hard_negatives",
    ]:
        (dataset_dir / subdir).mkdir(parents=True, exist_ok=True)


def copy_split(image_paths, split_name, dataset_dir, labels_dir):
    image_out = dataset_dir / "images" / split_name
    label_out = dataset_dir / "labels" / split_name

    for image_path in image_paths:
        target_image = image_out / image_path.name
        shutil.copy2(image_path, target_image)

        source_label = labels_dir / f"{image_path.stem}.txt"
        target_label = label_out / f"{image_path.stem}.txt"
        if source_label.exists():
            shutil.copy2(source_label, target_label)
        else:
            target_label.write_text("", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Prepare LabOS back-camera YOLO dataset with block-safe splits.")
    parser.add_argument("--images", default="datasets/labos_backcam_people/extracted_frames", help="Extracted/labeled image folder.")
    parser.add_argument("--labels", default=None, help="YOLO label folder. Defaults to --images.")
    parser.add_argument("--dataset", default="datasets/labos_backcam_people", help="Output dataset folder.")
    args = parser.parse_args()

    images_dir = Path(args.images)
    labels_dir = Path(args.labels) if args.labels else images_dir
    dataset_dir = Path(args.dataset)

    ensure_dataset_dirs(dataset_dir)

    images = sorted(path for path in images_dir.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS)
    groups = defaultdict(list)
    for image in images:
        groups[group_key(image)].append(image)

    train_images = []
    val_images = []
    test_images = []

    for key in sorted(groups):
        group_images = sorted(groups[key])
        train, val, test = split_blocks(group_images)
        train_images.extend(train)
        val_images.extend(val)
        test_images.extend(test)

    copy_split(train_images, "train", dataset_dir, labels_dir)
    copy_split(val_images, "val", dataset_dir, labels_dir)
    copy_split(test_images, "test", dataset_dir, labels_dir)

    (dataset_dir / "data.yaml").write_text(DATA_YAML, encoding="utf-8")

    print(f"Prepared dataset: {dataset_dir}")
    print(f"train={len(train_images)}, val={len(val_images)}, test={len(test_images)}")
    print("Split was performed within video/time groups to reduce near-duplicate leakage.")


if __name__ == "__main__":
    main()

