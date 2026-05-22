import argparse
import json
import logging
import time
from pathlib import Path

import cv2

from safe_mqtt import SafeVisionMQTT, count_to_tier


DEFAULT_HEF = "models/hef/backcam_yolov8s_improved_v1_hailo8.hef"
DEFAULT_MODEL_NAME = "backcam_yolov8s_improved_v1_hailo8"


def setup_logger(verbose: bool) -> logging.Logger:
    logger = logging.getLogger("labvision_hailo")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    logger.handlers.clear()

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)
    return logger


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="LabVision-Hailo people-count runtime. Publishes only LabOS vision topics."
    )
    parser.add_argument("--self-test", action="store_true", help="Run offline safety checks and exit.")
    parser.add_argument("--source", default="0", help="Camera index, video file, or RTSP URL.")
    parser.add_argument("--hef", default=DEFAULT_HEF, help="Compiled Hailo .hef model path.")
    parser.add_argument("--mqtt-host", default="hari.local")
    parser.add_argument("--mqtt-port", type=int, default=1883)
    parser.add_argument("--camera", default="back_camera")
    parser.add_argument("--model-name", default=DEFAULT_MODEL_NAME)
    parser.add_argument("--publish", action="store_true", help="Publish MQTT vision topics. Default prints only.")
    parser.add_argument("--mock-count", type=int, default=None, help="Publish/print a fixed count without Hailo.")
    parser.add_argument("--interval", type=float, default=1.0, help="Publish/print interval in seconds.")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args()


def run_self_test() -> None:
    mqtt = SafeVisionMQTT()
    blocked = False
    try:
        mqtt.publish("lab/control/relay1/set", "ON")
    except RuntimeError:
        blocked = True
    if not blocked:
        raise AssertionError("safe MQTT did not block relay topic")

    tier_cases = {0: 0, 1: 1, 4: 1, 5: 2, 10: 2, 11: 3, 17: 3, 18: 4}
    for count, tier in tier_cases.items():
        actual = count_to_tier(count)
        if actual != tier:
            raise AssertionError(f"count_to_tier({count}) returned {actual}, expected {tier}")

    print("LabVision-Hailo runtime self-test OK")


class LabVisionHailoRuntime:
    def __init__(self, args: argparse.Namespace, logger: logging.Logger):
        self.args = args
        self.logger = logger
        self.mqtt = SafeVisionMQTT(args.mqtt_host, args.mqtt_port)

    def run(self) -> None:
        if self.args.mock_count is not None:
            self._run_mock_count()
            return

        hef_path = Path(self.args.hef)
        if not hef_path.exists():
            raise FileNotFoundError(
                f"Missing HEF file: {hef_path}. Compile ONNX to HEF first, or use --mock-count for MQTT tests."
            )

        self._run_hailo_preflight(hef_path)

    def _connect_mqtt_if_needed(self) -> None:
        if self.args.publish:
            self.mqtt.connect()
            self.mqtt.publish_status("online", self.args.model_name, self.args.camera)
            self.logger.info("MQTT publishing enabled to %s:%s", self.args.mqtt_host, self.args.mqtt_port)
        else:
            self.logger.info("MQTT publishing disabled. Use --publish after local validation.")

    def _run_mock_count(self) -> None:
        count = max(0, int(self.args.mock_count))
        self._connect_mqtt_if_needed()
        self.logger.info("Mock count mode active: count=%s", count)
        try:
            while True:
                self._emit_count(count, count)
                time.sleep(self.args.interval)
        except KeyboardInterrupt:
            self.logger.info("Stopping mock count mode")
        finally:
            if self.args.publish:
                self.mqtt.publish_status("offline", self.args.model_name, self.args.camera)
                self.mqtt.disconnect()

    def _run_hailo_preflight(self, hef_path: Path) -> None:
        try:
            import hailo_platform  # noqa: F401
        except ImportError as exc:
            raise RuntimeError(
                "Hailo runtime package is not installed. Run scripts/install_ai_hat_plus.sh on the Pi first."
            ) from exc

        self._connect_mqtt_if_needed()
        self.logger.info("HEF found: %s", hef_path)
        self.logger.info("Opening source for preflight: %s", self.args.source)

        source = int(self.args.source) if str(self.args.source).isdigit() else self.args.source
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open camera/video source: {self.args.source}")

        cap.release()
        raise NotImplementedError(
            "HEF and camera preflight passed. Final Hailo tensor postprocess must be wired after HEF output names are verified on the Pi."
        )

    def _emit_count(self, stable_count: int, raw_count: int) -> None:
        tier = count_to_tier(stable_count)
        payload = {
            "count": stable_count,
            "raw_count": raw_count,
            "tier": tier,
            "status": "online",
            "model": self.args.model_name,
            "camera": self.args.camera,
            "timestamp": time.time(),
        }
        if self.args.publish:
            self.mqtt.publish_count(
                stable_count,
                raw_count,
                tier,
                self.args.model_name,
                self.args.camera,
            )
        else:
            self.logger.info("VISION PAYLOAD %s", json.dumps(payload))


def main() -> None:
    args = parse_args()
    if args.self_test:
        run_self_test()
        return

    logger = setup_logger(args.verbose)
    runtime = LabVisionHailoRuntime(args, logger)
    runtime.run()


if __name__ == "__main__":
    main()
