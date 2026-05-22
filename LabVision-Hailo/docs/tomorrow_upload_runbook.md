# Tomorrow Upload And Bring-Up Runbook

Use this when the Raspberry Pi 5 and Hailo AI HAT+ are in hand.

## 1. Copy Project To Pi

From Windows PowerShell:

```powershell
cd "C:\Users\prith\Downloads\Lab automation"
scp -r .\LabVision-Hailo pi@hari.local:~/LabVision-Hailo
```

If the hostname is not ready yet, use the Pi IP address instead of `hari.local`.

## 2. Install Hailo Stack

On the Raspberry Pi:

```bash
cd ~/LabVision-Hailo/scripts
chmod +x install_ai_hat_plus.sh verify_ai_hat_plus.sh run_runtime_self_test.sh run_mock_vision_publish.sh
./install_ai_hat_plus.sh
sudo reboot
```

After reboot:

```bash
cd ~/LabVision-Hailo/scripts
./verify_ai_hat_plus.sh
./run_runtime_self_test.sh
```

## 3. Verify MQTT Without Relays

On another terminal:

```bash
mosquitto_sub -h hari.local -t "lab/vision/#" -v
```

On the Pi:

```bash
cd ~/LabVision-Hailo/scripts
./run_mock_vision_publish.sh
```

Expected topics:

```text
lab/vision/people_count
lab/vision/people_count/state
lab/vision/status
```

Forbidden topics:

```text
lab/control/relayX/set
lab/relay/X/command
lab/automation/mode
```

## 4. Compile HEF

The ONNX file is ready:

```text
models/onnx/backcam_yolov8s_improved_v1_960.onnx
```

Compile it on the Hailo Linux toolchain into:

```text
models/hef/backcam_yolov8s_improved_v1_hailo8.hef
```

## 5. Hailo Runtime Status

`src/hailo_backcam_runtime.py` is ready for:

- offline safety self-test
- MQTT publish test with `--mock-count`
- HEF/camera preflight after the `.hef` is present

Final tensor postprocess wiring must be completed after the `.hef` output names and tensor layout are verified on the Pi.

