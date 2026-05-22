# Linux Hailo Compile Notes

This step is done on a Linux machine with the Hailo Dataflow Compiler / Hailo Model Zoo version that supports Hailo-8.

Input files from `LabVision-Hailo`:

- `models/onnx/backcam_yolov8s_improved_v1_960.onnx`
- calibration folder: `calibration/backcam_v1/images`

Expected output:

- `models/hef/backcam_yolov8s_improved_v1_hailo8.hef`

Important:

- Target hardware architecture must be Hailo-8 for the 26 TOPS AI HAT+.
- Use representative back-camera calibration images, not clean sample images only.
- Keep the model single-class: `person`.
- Validate the `.hef` with local video before MQTT.

The exact Hailo compile command depends on the installed Hailo Model Zoo/Dataflow Compiler version and YOLO parser configuration. Use the Hailo-8 compatible Model Zoo path, not a Hailo-10/Hailo-15-only path.
