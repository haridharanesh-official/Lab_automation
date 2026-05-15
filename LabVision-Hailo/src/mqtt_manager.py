import paho.mqtt.client as mqtt
import json
import time
import logging
import psutil
import os

class MQTTManager:
    """
    Industrial-grade MQTT Handler with Reconnect Logic and Subscriptions
    """
    def __init__(self, broker="localhost", port=1883, client_id="LabVision_Hailo"):
        self.broker = broker
        self.port = port
        
        # Paho MQTT 2.0 Compatibility
        try:
            from paho.mqtt.enums import CallbackAPIVersion
            self.client = mqtt.Client(CallbackAPIVersion.VERSION2, client_id=client_id)
        except (ImportError, AttributeError):
            self.client = mqtt.Client(client_id)
        
        # Callbacks for fusion engine
        self.on_pir_update = None
        self.on_mmwave_update = None
        
        self.logger = logging.getLogger("MQTTManager")
        
        # Configure client
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.logger.info("Connected to MQTT Broker")
            # Subscribe to external sensor topics
            self.client.subscribe("lab/lab101/+/pir/state")
            self.client.subscribe("lab/lab101/+/mmwave/state")
        else:
            self.logger.error(f"Failed to connect, return code {rc}")

    def _on_disconnect(self, client, userdata, rc):
        self.logger.warning("Disconnected from MQTT Broker. Attempting reconnect...")
        
    def _on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            payload = msg.payload.decode()
            
            if "pir" in topic and self.on_pir_update:
                self.on_pir_update(payload == "1" or payload.lower() == "true")
            elif "mmwave" in topic and self.on_mmwave_update:
                self.on_mmwave_update(payload == "1" or payload.lower() == "true")
                
        except Exception as e:
            self.logger.error(f"Error parsing MQTT message: {e}")

    def connect(self):
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
        except Exception as e:
            self.logger.error(f"MQTT Connection Error: {e}")

    def publish_state(self, topic, state_dict):
        """Publishes the fused occupancy state"""
        self.client.publish(topic, json.dumps(state_dict), retain=True)
        # self.logger.debug(f"Published state to {topic}")

    def publish_heartbeat(self):
        """Publishes system health status"""
        try:
            # Get uptime from /proc/uptime (Linux specific)
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.readline().split()[0])
        except:
            uptime_seconds = 0

        heartbeat = {
            "status": "online",
            "uptime_seconds": uptime_seconds,
            "cpu_load_percent": psutil.cpu_percent(),
            "memory_usage_percent": psutil.virtual_memory().percent,
            "timestamp": time.time()
        }
        self.client.publish("lab/lab101/system/heartbeat", json.dumps(heartbeat))
