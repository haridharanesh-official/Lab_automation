import json
import time

import paho.mqtt.client as mqtt


TOPIC_COUNT = "lab/vision/people_count"
TOPIC_COUNT_STATE = "lab/vision/people_count/state"
TOPIC_STATUS = "lab/vision/status"

BLOCKED_TOPIC_PREFIXES = (
    "lab/control/",
    "lab/relay/",
    "lab/automation/",
)


class SafeVisionMQTT:
    def __init__(self, broker: str = "hari.local", port: int = 1883, client_id: str = "LabVision_Hailo"):
        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id)
        except AttributeError:
            self.client = mqtt.Client(client_id)

        self.broker = broker
        self.port = port
        self.connected = False
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc):
        self.connected = rc == 0

    def _on_disconnect(self, client, userdata, rc):
        self.connected = False

    def connect(self) -> None:
        self.client.connect(self.broker, self.port, 60)
        self.client.loop_start()

    def disconnect(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()
        self.connected = False

    def publish(self, topic: str, payload: str, qos: int = 1, retain: bool = False) -> bool:
        for prefix in BLOCKED_TOPIC_PREFIXES:
            if topic.startswith(prefix):
                raise RuntimeError(f"Blocked unsafe publish topic: {topic}")
        if not self.connected:
            return False
        self.client.publish(topic, payload, qos=qos, retain=retain)
        return True

    def publish_count(
        self,
        count: int,
        raw_count: int,
        tier: int,
        model: str,
        camera: str,
        status: str = "online",
    ) -> None:
        payload = {
            "count": int(count),
            "raw_count": int(raw_count),
            "tier": int(tier),
            "status": status,
            "model": model,
            "camera": camera,
            "timestamp": time.time(),
        }
        self.publish(TOPIC_COUNT, json.dumps(payload), qos=1, retain=True)
        self.publish(TOPIC_COUNT_STATE, str(int(count)), qos=1, retain=True)

    def publish_status(self, status: str, model: str, camera: str) -> None:
        payload = {
            "status": status,
            "model": model,
            "camera": camera,
            "timestamp": time.time(),
        }
        self.publish(TOPIC_STATUS, json.dumps(payload), qos=1, retain=True)


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

