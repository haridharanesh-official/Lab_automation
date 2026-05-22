import argparse
import json
import logging
import signal
import time
from collections import deque
from logging.handlers import RotatingFileHandler
from pathlib import Path

import paho.mqtt.client as mqtt


MQTT_BROKER = "hari.local"
MQTT_PORT = 1883

TOPIC_VISION_JSON = "lab/vision/people_count"
TOPIC_VISION_STATE = "lab/vision/people_count/state"
TOPIC_CONTROLLER_STATUS = "lab/controller/status"
TOPIC_CONTROLLER_HEARTBEAT = "lab/controller/heartbeat"

RELAY_TOPICS = {i: f"lab/control/relay{i}/set" for i in range(1, 9)}
AC_RELAYS = {7, 8}

TIER_TARGETS = {
    0: set(),
    1: {1, 3},
    2: {1, 2, 3, 4},
    3: {1, 2, 3, 4, 5, 6, 7},
    4: {1, 2, 3, 4, 5, 6, 7, 8},
}

BLOCKED_AI_OR_LEGACY_TOPICS = (
    "lab/relay/",
    "lab/automation/",
)


def count_to_tier(count: int) -> int:
    if count >= 18:
        return 4
    if count >= 11:
        return 3
    if count >= 5:
        return 2
    if count >= 1:
        return 1
    return 0


def setup_logger(log_path: Path, verbose: bool) -> logging.Logger:
    logger = logging.getLogger("labos_stability_controller")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    console.setLevel(logging.DEBUG if verbose else logging.INFO)
    logger.addHandler(console)

    log_path.parent.mkdir(parents=True, exist_ok=True)
    file_handler = RotatingFileHandler(
        log_path, maxBytes=1_000_000, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)

    return logger


class LabOSStabilityController:
    def __init__(self, args: argparse.Namespace, logger: logging.Logger):
        self.args = args
        self.logger = logger
        self.running = True
        self.live = args.live

        self.history: deque[int] = deque(maxlen=args.median_window)
        self.raw_count = 0
        self.stable_count = 0
        self.current_tier = 0
        self.target_tier = 0
        self.pending_tier = 0
        self.pending_since = 0.0
        self.last_vision_ts = 0.0

        self.relay_states = {i: False for i in range(1, 9)}
        self.last_relay_change_ts = 0.0
        self.ac_last_on = {i: 0.0 for i in AC_RELAYS}
        self.ac_last_off = {i: 0.0 for i in AC_RELAYS}

        self.last_heartbeat_ts = 0.0
        self.last_status = "starting"
        self.manual_hold = args.manual_hold

        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, args.client_id)
        except AttributeError:
            self.client = mqtt.Client(args.client_id)

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.logger.info("Connected to MQTT broker %s:%s", self.args.broker, self.args.port)
            client.subscribe(TOPIC_VISION_JSON, qos=1)
            client.subscribe(TOPIC_VISION_STATE, qos=1)
            self.publish_status("online")
        else:
            self.logger.error("MQTT connect failed with code %s", rc)

    def _on_disconnect(self, client, userdata, rc):
        self.logger.warning("MQTT disconnected with code %s", rc)

    def _on_message(self, client, userdata, msg):
        try:
            count = self._parse_count(msg.topic, msg.payload.decode("utf-8", errors="replace"))
        except ValueError as exc:
            self.logger.warning("Ignored invalid vision payload on %s: %s", msg.topic, exc)
            return

        self.last_vision_ts = time.time()
        self.raw_count = count
        self.history.append(count)
        self.stable_count = int(sorted(self.history)[len(self.history) // 2])
        self._update_tier_candidate()

    def _parse_count(self, topic: str, payload: str) -> int:
        if topic == TOPIC_VISION_STATE:
            return max(0, int(float(payload.strip())))
        if topic == TOPIC_VISION_JSON:
            data = json.loads(payload)
            return max(0, int(data.get("count", data.get("raw_count", 0))))
        raise ValueError(f"unexpected topic {topic}")

    def _update_tier_candidate(self):
        new_tier = count_to_tier(self.stable_count)
        now = time.time()
        if new_tier != self.pending_tier:
            self.pending_tier = new_tier
            self.pending_since = now
            self.logger.info(
                "Tier candidate %s from stable_count=%s raw_count=%s",
                new_tier,
                self.stable_count,
                self.raw_count,
            )

        if new_tier == self.current_tier:
            self.target_tier = new_tier
            return

        delay = self.args.upgrade_delay if new_tier > self.current_tier else self.args.downgrade_delay
        if now - self.pending_since >= delay:
            self.logger.info("Tier accepted: %s -> %s", self.current_tier, new_tier)
            self.current_tier = new_tier
            self.target_tier = new_tier

    def start(self):
        self.client.connect(self.args.broker, self.args.port, 60)
        self.client.loop_start()
        self.logger.info(
            "Controller started in %s mode. Relay publishes are %s.",
            "LIVE" if self.live else "DRY-RUN",
            "enabled" if self.live else "disabled",
        )
        if self.manual_hold:
            self.logger.warning("Manual hold enabled. Relay outputs will not change.")

        try:
            while self.running:
                self._tick()
                time.sleep(0.2)
        finally:
            self.publish_status("offline")
            self.client.loop_stop()
            self.client.disconnect()

    def stop(self, signum=None, frame=None):
        self.logger.info("Shutdown requested")
        self.running = False

    def _tick(self):
        now = time.time()
        self._handle_vision_timeout(now)
        self._apply_target_relays(now)
        if now - self.last_heartbeat_ts >= self.args.heartbeat_interval:
            self.publish_heartbeat(now)
            self.last_heartbeat_ts = now

    def _handle_vision_timeout(self, now: float):
        if self.last_vision_ts <= 0:
            self.publish_status_once("waiting_for_vision")
            return

        age = now - self.last_vision_ts
        if age >= self.args.failsafe_timeout:
            self.publish_status_once("vision_failsafe")
            if self.args.failsafe_off:
                self.current_tier = 0
                self.target_tier = 0
            return

        if age >= self.args.vision_timeout:
            self.publish_status_once("vision_stale")
        else:
            self.publish_status_once("online")

    def _apply_target_relays(self, now: float):
        if self.manual_hold:
            return

        desired_on = TIER_TARGETS[self.target_tier]
        desired_states = {i: i in desired_on for i in range(1, 9)}

        for relay_id in range(1, 9):
            desired = desired_states[relay_id]
            current = self.relay_states[relay_id]
            if desired == current:
                continue

            if now - self.last_relay_change_ts < self.args.relay_stagger:
                return

            if not self._ac_allowed(relay_id, desired, now):
                continue

            self._set_relay(relay_id, desired, now)
            return

    def _ac_allowed(self, relay_id: int, desired_on: bool, now: float) -> bool:
        if relay_id not in AC_RELAYS:
            return True

        if desired_on:
            off_age = now - self.ac_last_off[relay_id]
            if self.ac_last_off[relay_id] > 0 and off_age < self.args.ac_min_off:
                self.logger.debug("AC relay %s ON blocked for %.1fs", relay_id, self.args.ac_min_off - off_age)
                return False
            return True

        on_age = now - self.ac_last_on[relay_id]
        if self.ac_last_on[relay_id] > 0 and on_age < self.args.ac_min_on:
            self.logger.debug("AC relay %s OFF blocked for %.1fs", relay_id, self.args.ac_min_on - on_age)
            return False
        return True

    def _set_relay(self, relay_id: int, desired_on: bool, now: float):
        topic = RELAY_TOPICS[relay_id]
        payload = "ON" if desired_on else "OFF"
        self._assert_safe_relay_topic(topic)

        self.relay_states[relay_id] = desired_on
        self.last_relay_change_ts = now
        if relay_id in AC_RELAYS:
            if desired_on:
                self.ac_last_on[relay_id] = now
            else:
                self.ac_last_off[relay_id] = now

        if self.live:
            self.client.publish(topic, payload, qos=1, retain=False)
            action = "PUBLISHED"
        else:
            action = "DRY-RUN"

        self.logger.info(
            "%s relay%d -> %s topic=%s stable_count=%s tier=%s",
            action,
            relay_id,
            payload,
            topic,
            self.stable_count,
            self.target_tier,
        )

    def _assert_safe_relay_topic(self, topic: str):
        for blocked in BLOCKED_AI_OR_LEGACY_TOPICS:
            if topic.startswith(blocked):
                raise RuntimeError(f"Refusing unsafe/legacy relay topic: {topic}")
        if topic not in RELAY_TOPICS.values():
            raise RuntimeError(f"Unexpected relay topic: {topic}")

    def publish_status_once(self, status: str):
        if status != self.last_status:
            self.publish_status(status)

    def publish_status(self, status: str):
        self.last_status = status
        payload = {
            "status": status,
            "mode": "live" if self.live else "dry_run",
            "manual_hold": self.manual_hold,
            "stable_count": self.stable_count,
            "raw_count": self.raw_count,
            "tier": self.current_tier,
            "target_tier": self.target_tier,
            "timestamp": time.time(),
        }
        self.client.publish(TOPIC_CONTROLLER_STATUS, json.dumps(payload), qos=1, retain=True)
        self.logger.info("Controller status: %s", status)

    def publish_heartbeat(self, now: float):
        payload = {
            "status": self.last_status,
            "mode": "live" if self.live else "dry_run",
            "stable_count": self.stable_count,
            "raw_count": self.raw_count,
            "tier": self.current_tier,
            "target_tier": self.target_tier,
            "vision_age_seconds": None if self.last_vision_ts <= 0 else round(now - self.last_vision_ts, 2),
            "relay_states": {str(k): ("ON" if v else "OFF") for k, v in self.relay_states.items()},
            "timestamp": now,
        }
        self.client.publish(TOPIC_CONTROLLER_HEARTBEAT, json.dumps(payload), qos=1, retain=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="LabOS production stability controller.")
    parser.add_argument("--self-test", action="store_true", help="Run offline safety checks and exit.")
    parser.add_argument("--broker", default=MQTT_BROKER)
    parser.add_argument("--port", type=int, default=MQTT_PORT)
    parser.add_argument("--client-id", default="LabOS_Stability_Controller")
    parser.add_argument("--live", action="store_true", help="Actually publish relay commands. Default is dry-run.")
    parser.add_argument("--manual-hold", action="store_true", help="Keep current relay states; do not change outputs.")
    parser.add_argument("--median-window", type=int, default=5)
    parser.add_argument("--upgrade-delay", type=float, default=30.0)
    parser.add_argument("--downgrade-delay", type=float, default=180.0)
    parser.add_argument("--vision-timeout", type=float, default=30.0)
    parser.add_argument("--failsafe-timeout", type=float, default=300.0)
    parser.add_argument("--failsafe-off", action="store_true", help="After failsafe timeout, target tier 0.")
    parser.add_argument("--ac-min-off", type=float, default=180.0)
    parser.add_argument("--ac-min-on", type=float, default=300.0)
    parser.add_argument("--relay-stagger", type=float, default=1.0)
    parser.add_argument("--heartbeat-interval", type=float, default=30.0)
    parser.add_argument("--log-path", default="logs/labos_stability_controller.log")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args()


def run_self_test() -> None:
    tier_cases = {
        0: 0,
        1: 1,
        4: 1,
        5: 2,
        10: 2,
        11: 3,
        17: 3,
        18: 4,
        30: 4,
    }
    for count, expected_tier in tier_cases.items():
        actual = count_to_tier(count)
        if actual != expected_tier:
            raise AssertionError(f"count_to_tier({count}) returned {actual}, expected {expected_tier}")

    for relay_id, topic in RELAY_TOPICS.items():
        expected = f"lab/control/relay{relay_id}/set"
        if topic != expected:
            raise AssertionError(f"relay {relay_id} topic {topic} != {expected}")
        if topic.startswith("lab/relay/") or topic.startswith("lab/automation/"):
            raise AssertionError(f"unsafe relay topic: {topic}")

    expected_tier_targets = {
        0: set(),
        1: {1, 3},
        2: {1, 2, 3, 4},
        3: {1, 2, 3, 4, 5, 6, 7},
        4: {1, 2, 3, 4, 5, 6, 7, 8},
    }
    if TIER_TARGETS != expected_tier_targets:
        raise AssertionError("tier relay mapping does not match LabOS production mapping")

    print("LabOS stability controller self-test OK")


def main():
    args = parse_args()
    if args.self_test:
        run_self_test()
        return

    logger = setup_logger(Path(args.log_path), args.verbose)
    controller = LabOSStabilityController(args, logger)
    signal.signal(signal.SIGINT, controller.stop)
    signal.signal(signal.SIGTERM, controller.stop)
    controller.start()


if __name__ == "__main__":
    main()
