# Hailo Calibration Images

The calibration image folder is:

```text
calibration/backcam_v1/images/
```

These images are used for Hailo INT8 quantization during ONNX to HEF compilation.

The local workstation currently has 200 representative back-camera calibration images in that folder. They are not committed by default because the repository ignores image files and the full calibration pack is large.

To recreate the calibration pack from `LabVision-AI`:

```powershell
cd "C:\Users\prith\Downloads\Lab automation\LabVision-AI"
.\.venv\Scripts\python.exe prepare_hailo_calibration_backcam.py --limit 200 --clear
```

Then copy the generated images into:

```text
LabVision-Hailo/calibration/backcam_v1/images/
```

