# LabOS - Industrial Smart Laboratory Automation

LabOS is an AI-assisted laboratory automation system for occupancy-aware lights, fans, and AC control. The system uses computer vision for people counting, MQTT for messaging, a Raspberry Pi broker/runtime layer, ESP32 relay nodes, and Home Assistant for dashboard visibility.

The current system is already working, so changes should be made conservatively. Vision scripts must publish people count/status only. Relay decisions belong to the LabOS stability controller and ESP32 relay node.

## Current Architecture

```text
Back Camera YOLO / Hailo Vision
  -> MQTT people count on lab/vision/#
  -> LabOS Stability Controller
  -> MQTT relay commands on lab/control/relayX/set
  -> ESP32 Relay Node
  -> Lights / Fans / AC
  -> Home Assistant dashboard
```

## Repository Layout

```text
Lab automation/
  LabVision-AI/       Windows/RTX training, evaluation, dataset, ONNX export
  LabVision-Hailo/    Raspberry Pi + Hailo AI HAT+ deployment package
  Lab footage/        local lab video footage
  runs/               older training/evaluation outputs
```

## LabVision-AI

Use this folder for model work:

- dataset preparation
- labeling and review
- YOLO training/evaluation
- hard-negative mining
- ONNX export for Hailo compilation
- Windows/RTX validation

Important files:

- `production_inference_mqtt.py`: safe AI MQTT publisher for people count/status only.
- `extract_backcam_frames.py`: back-camera frame extraction.
- `prepare_backcam_dataset.py`: dataset split preparation.
- `evaluate_backcam_labos.py`: LabOS-specific evaluation.
- `mine_backcam_hard_negatives.py`: false-positive mining.
- `active_learning_backcam.py`: active-learning loop.
- `export_backcam_hailo_onnx.py`: exports the selected backcam model to ONNX.

Do not overwrite old model weights. Keep the trained back-camera model separate from `yolov8s_final.pt`.

## LabVision-Hailo

Use this folder for Raspberry Pi + Hailo AI HAT+ deployment only.

Prepared artifacts:

- `models/onnx/backcam_yolov8s_improved_v1_960.onnx`
- `calibration/backcam_v1/images/`
- `scripts/install_ai_hat_plus.sh`
- `scripts/verify_ai_hat_plus.sh`

The final compiled Hailo model should be placed at:

```text
LabVision-Hailo/models/hef/backcam_yolov8s_improved_v1_hailo8.hef
```

## MQTT Safety Rules

Vision scripts may publish only:

```text
lab/vision/people_count
lab/vision/people_count/state
lab/vision/status
```

Vision scripts must never publish:

```text
lab/control/relayX/set
lab/relay/X/command
lab/automation/mode
```

Relay command topics are reserved for the stability controller:

```text
lab/control/relay1/set
lab/control/relay2/set
lab/control/relay3/set
lab/control/relay4/set
lab/control/relay5/set
lab/control/relay6/set
lab/control/relay7/set
lab/control/relay8/set
```

Relay command messages must not use `retain=True`.

## Current Model Direction

The selected back-camera candidate is:

```text
LabVision-AI/runs/detect/runs/labos/backcam_yolov8s_improved_v1/weights/best.pt
```

For Hailo deployment, this has been exported to:

```text
LabVision-Hailo/models/onnx/backcam_yolov8s_improved_v1_960.onnx
```

The Hailo `.hef` is still pending and must be compiled with the Hailo Linux toolchain.

## Production Notes

- Use `production_inference_mqtt.py` for AI MQTT count publishing on Windows/RTX.
- Use `LabVision-Hailo` for Raspberry Pi + Hailo deployment.
- Do not run legacy `mqtt_bridge.py` or old `occupancy_engine.py` as production automation without patch review.
- Keep Home Assistant as dashboard/manual visibility unless automation changes are explicitly approved.
- Keep ESP32 relay firmware changes separate and reviewed before flashing.

