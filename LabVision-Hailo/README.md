# LabVision-Hailo

Raspberry Pi + Hailo AI HAT+ deployment package for LabOS back-camera people detection.

This folder is for running the LabOS vision model on the Raspberry Pi with Hailo acceleration. It must behave like a vision sensor only: detect people, publish people count/status, and never control relays.

## Safety Boundary

Allowed publish topics:

- `lab/vision/people_count`
- `lab/vision/people_count/state`
- `lab/vision/status`

Forbidden from this folder:

- `lab/control/relayX/set`
- `lab/relay/X/command`
- `lab/automation/mode`

Relay control belongs to the separate LabOS stability controller and ESP32 relay node.

## Folder Layout

```text
LabVision-Hailo/
  calibration/backcam_v1/images/   Hailo INT8 calibration images
  docs/                            deployment notes copied from LabVision-AI
  legacy_do_not_run/src_old/       old experimental files preserved for reference
  logs/                            runtime logs
  models/onnx/                     ONNX input for Hailo compiler
  models/hef/                      final compiled .hef goes here later
  scripts/                         Pi install/verify/copy helpers
  src/                             active safe runtime code
```

## Prepared Artifacts

- `models/onnx/backcam_yolov8s_improved_v1_960.onnx`
- `calibration/backcam_v1/images/` with 200 representative back-camera calibration images

The `.hef` is not generated on Windows. Compile the ONNX with the Hailo Linux toolchain, then copy the final file to:

```text
models/hef/backcam_yolov8s_improved_v1_hailo8.hef
```

## Raspberry Pi First Boot

Recommended hardware target:

- Raspberry Pi 5
- Raspberry Pi AI HAT+ 26 TOPS
- Raspberry Pi OS 64-bit
- MQTT broker reachable as `hari.local`

Run on the Pi:

```bash
cd ~/LabVision-Hailo/scripts
chmod +x install_ai_hat_plus.sh verify_ai_hat_plus.sh
./install_ai_hat_plus.sh
sudo reboot
```

After reboot:

```bash
cd ~/LabVision-Hailo/scripts
./verify_ai_hat_plus.sh
./run_runtime_self_test.sh
```

For the complete upload and bring-up sequence, use:

```text
docs/tomorrow_upload_runbook.md
```

## Current Status

This package is organized and ready for Pi/Hailo setup. The final Hailo `.hef` still needs to be compiled after the Hailo Linux toolchain is available.

## Active vs Legacy Code

The active runtime folder is intentionally small:

```text
src/
  hailo_backcam_runtime.py
  safe_mqtt.py
  README.md
```

Old experimental files were preserved in `legacy_do_not_run/src_old/`. They are not deleted, but they should not be used as production runtime because the old path included an occupancy engine that could publish relay commands.
