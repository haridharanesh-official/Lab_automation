# LabOS Back-Camera Hailo HAT+ Deployment

This is the isolated deployment path for running the LabOS back-camera people detector on a Raspberry Pi 5 with the Raspberry Pi AI HAT+ 26 TOPS variant.

## Target

- Hardware: Raspberry Pi 5 + Raspberry Pi AI HAT+ 26 TOPS.
- Accelerator: Hailo-8, INT8.
- Selected model: `runs/detect/runs/labos/backcam_yolov8s_improved_v1/weights/best.pt`.
- Deployment model artifact: Hailo Executable Format, `.hef`.
- LabOS behavior: detect people and publish only LabOS vision topics. Relay control stays outside the detector.

## Artifact Flow

```text
best.pt -> static FP32 ONNX -> Hailo HAR -> quantized HAR -> Hailo HEF -> Raspberry Pi runtime
```

Do not copy a PyTorch `.pt` model to the Hailo runtime and expect acceleration. Hailo needs a compiled `.hef`.

## What Runs Where

Windows RTX workstation / `LabVision-AI`:

```powershell
cd "C:\Users\prith\Downloads\Lab automation\LabVision-AI"
.\.venv\Scripts\python.exe export_backcam_hailo_onnx.py
.\.venv\Scripts\python.exe prepare_hailo_calibration_backcam.py --limit 200 --clear
```

This creates:

- `exports/hailo/backcam_yolov8s_improved_v1_960.onnx`
- `exports/hailo/calibration/backcam_v1/images/`

Those artifacts are copied into `LabVision-Hailo` as:

- `models/onnx/backcam_yolov8s_improved_v1_960.onnx`
- `calibration/backcam_v1/images/`

Linux Hailo compile machine:

Use the Hailo AI Software Suite / Dataflow Compiler and Hailo Model Zoo version that supports Hailo-8. The current Model Zoo master is aimed at newer Hailo-10/Hailo-15 targets, while Hailo-8/Hailo-8L support is documented on the Hailo Model Zoo v2.x path with Dataflow Compiler v3.x.

The compile stage is expected to produce:

```text
models/hef/backcam_yolov8s_improved_v1_hailo8.hef
```

Raspberry Pi:

Copy the `.hef` into `LabVision-Hailo/models/hef/` and run a HailoRT/GStreamer/Python runtime wrapper that publishes only:

- `lab/vision/people_count`
- `lab/vision/people_count/state`
- `lab/vision/status`

Never publish relay topics from the Hailo detector.

## Compile Notes

For a custom YOLO model, the Hailo compile step usually needs:

- Static ONNX input shape.
- Representative calibration images from the real back camera.
- A matching YOLO parser/postprocess configuration.
- Hailo-8 hardware architecture target, not Hailo-8L and not Hailo-10H.

Start with `imgsz=960` because it matches the current backcam model tests. If the Pi pipeline is too slow or compilation struggles, export a second ONNX at `imgsz=640` and compare recall on far/small people before switching.

## Pi Runtime Requirements

Before integrating with LabOS MQTT, verify the HAT:

```bash
hailortcli fw-control identify
hailortcli scan
```

Then verify the HEF with a local video first. Only after the count is stable should it be connected to MQTT.

## Safety Rules

- Keep `yolov8s_final.pt` untouched.
- Keep `backcam_yolov8s_improved_v1/weights/best.pt` as the selected candidate and copy/export from it.
- Do not modify ESP32 code, Home Assistant YAML, relay controller code, or existing MQTT bridge code for this Hailo export step.
- Hailo detector publishes people count only.
- Keep relay decisions inside the existing LabOS stability controller / ESP32 relay node.
