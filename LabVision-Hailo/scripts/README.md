# LabOS Raspberry Pi + Hailo AI HAT+ Scripts

This folder contains setup and verification helpers for Raspberry Pi 5 + AI HAT+ 26 TOPS.

The LabOS model is not deployed to Hailo as `.pt`. The required runtime artifact is `.hef`.

Current prepared artifacts in `LabVision-Hailo`:

- ONNX compile input: `models/onnx/backcam_yolov8s_improved_v1_960.onnx`
- Calibration images: `calibration/backcam_v1/images`
- HEF target folder: `models/hef/`

## Setup Order

1. Install Raspberry Pi OS 64-bit Trixie.
2. Mount the AI HAT+ while the Pi is powered off.
3. Boot and run `install_ai_hat_plus.sh`.
4. Reboot.
5. Run `verify_ai_hat_plus.sh`.
6. Compile ONNX to Hailo-8 `.hef` on a Linux Hailo toolchain machine.
7. Copy the `.hef` to `models/hef/`.
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
- `run_runtime_self_test.sh`: runs the LabVision-Hailo offline safety self-test.
- `run_mock_vision_publish.sh`: publishes a mock people count to verify MQTT vision topics.
- `labos-backcam-hailo.service.example`: future systemd service template after the Hailo runtime script exists.
- `labos_hailo_env.example`: environment variables for the future runtime.
- `copy_hailo_artifacts_to_pi.ps1`: Windows-side helper to copy ONNX/calibration files to a Linux compile/Pi target with `scp`.
