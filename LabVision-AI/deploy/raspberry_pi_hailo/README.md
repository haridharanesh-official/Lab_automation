# LabOS Raspberry Pi + Hailo AI HAT+ Readiness Pack

This folder contains the source copy of Raspberry Pi 5 + AI HAT+ 26 TOPS setup helpers. The organized Pi deployment package lives in `LabVision-Hailo/`.

The LabOS model is not deployed to Hailo as `.pt`. The required runtime artifact is `.hef`.

Current prepared artifacts on the Windows workstation:

- ONNX compile input: `exports/hailo/backcam_yolov8s_improved_v1_960.onnx`
- Calibration images: `exports/hailo/calibration/backcam_v1/images`
- Source model: `runs/detect/runs/labos/backcam_yolov8s_improved_v1/weights/best.pt`

Current organized deployment copies:

- ONNX compile input: `../LabVision-Hailo/models/onnx/backcam_yolov8s_improved_v1_960.onnx`
- Calibration images: `../LabVision-Hailo/calibration/backcam_v1/images`
- HEF target folder: `../LabVision-Hailo/models/hef/`

## Setup Order

1. Install Raspberry Pi OS 64-bit Trixie.
2. Mount the AI HAT+ while the Pi is powered off.
3. Boot and run `install_ai_hat_plus.sh`.
4. Reboot.
5. Run `verify_ai_hat_plus.sh`.
6. Compile ONNX to Hailo-8 `.hef` on a Linux Hailo toolchain machine.
7. Copy the `.hef` to `LabVision-Hailo/models/hef/`.
8. Test local video/camera inference without MQTT.
9. Only after local count is stable, connect MQTT publishing.

## Safety Boundary

The Hailo detector must only publish:

- `lab/vision/people_count`
- `lab/vision/people_count/state`
- `lab/vision/status`

It must never publish relay topics. Relay decisions stay in the existing LabOS controller / ESP32 relay node.

## Files

- `install_ai_hat_plus.sh`: installs Raspberry Pi AI HAT+ dependencies.
- `verify_ai_hat_plus.sh`: checks whether the Hailo device and camera stack are visible.
- `labos-backcam-hailo.service.example`: future systemd service template after the Hailo runtime script exists.
- `labos_hailo_env.example`: environment variables for the future runtime.
- `copy_hailo_artifacts_to_pi.ps1`: Windows-side helper to copy ONNX/calibration files to a Linux compile/Pi target with `scp`.
