import torch
from ultralytics import YOLO

model_a = YOLO("yolov8s.pt")
model_b = YOLO("LabVision-AI/yolov8s_final.pt")

dict_a = model_a.model.state_dict()
dict_b = model_b.model.state_dict()

print("Model A (Standard YOLOv8s) keys:", len(dict_a.keys()))
print("Model B (Custom YOLOv8s) keys:", len(dict_b.keys()))

matching_keys = []
mismatched_keys = []

for k in dict_b.keys():
    if k in dict_a:
        if dict_a[k].shape == dict_b[k].shape:
            matching_keys.append(k)
        else:
            mismatched_keys.append((k, dict_a[k].shape, dict_b[k].shape))
    else:
        print(f"Key only in Model B: {k}")

print(f"Matching keys with identical shapes: {len(matching_keys)}")
print(f"Mismatched keys/shapes: {len(mismatched_keys)}")
for k, shape_a, shape_b in mismatched_keys:
    print(f"  {k}: standard={shape_a} vs custom={shape_b}")
