import time
import logging

class FusionEngine:
    """
    Industrial Sensor Fusion & Occupancy Logic
    Combines AI detections with PIR and mmWave data.
    """
    def __init__(self, occupied_threshold=5, empty_threshold=20):
        self.occupied_threshold = occupied_threshold
        self.empty_threshold = empty_threshold
        
        # Internal sensor states
        self.states = {
            "ai": False,
            "pir": False,
            "mmwave": False
        }
        
        # Temporal state tracking
        self.is_occupied = False
        self.last_detection_time = 0
        self.first_detection_time = 0
        
        self.logger = logging.getLogger("FusionEngine")

    def update_sensor(self, sensor_type, value):
        """Update a specific sensor state (ai, pir, mmwave)"""
        if sensor_type in self.states:
            self.states[sensor_type] = bool(value)
            # self.logger.debug(f"Sensor {sensor_type} updated to {value}")

    def compute_final_state(self):
        """
        Determines logical occupancy based on temporal rules:
        - ON: Any sensor triggers it for 'occupied_threshold' seconds.
        - OFF: All sensors must be empty for 'empty_threshold' seconds.
        """
        now = time.time()
        any_detected = any(self.states.values())
        
        # --- OCCUPANCY "ON" LOGIC ---
        if any_detected:
            self.last_detection_time = now
            if self.first_detection_time == 0:
                self.first_detection_time = now
            
            # Transition to Occupied (after 5s buffer)
            if not self.is_occupied:
                if (now - self.first_detection_time) >= self.occupied_threshold:
                    self.is_occupied = True
                    self.logger.info("STATE CHANGE: OCCUPIED")
                    return True # Indicates a change
        else:
            # No sensors detecting anything
            self.first_detection_time = 0
            
            # --- OCCUPANCY "OFF" LOGIC ---
            if self.is_occupied:
                # All sensors must be empty for 20 seconds
                if (now - self.last_detection_time) >= self.empty_threshold:
                    self.is_occupied = False
                    self.logger.info("STATE CHANGE: EMPTY")
                    return True # Indicates a change
        
        return False # No state change

    def get_state_json(self):
        """Return the current system status for MQTT publishing"""
        return {
            "occupied": self.is_occupied,
            "sensors": self.states,
            "timestamp": time.time()
        }
