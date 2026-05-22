import time
from collections import deque

class OccupancyEngine:
    """
    Industrial-grade Occupancy Stabilizer and Tier Engine for LabOS.
    Implements Temporal Hysteresis and HVAC Compressor Protection.
    """
    def __init__(self, client):
        self.client = client
        self.history = deque(maxlen=150) # 150 frame window for deep smoothing
        
        # Current Stable State
        self.stable_count = 0
        self.current_tier = 0
        
        # Relay States (False = OFF, True = ON)
        self.relay_states = {i: False for i in range(1, 9)}
        
        # Timers for Hysteresis (Last time the TIER suggested a change)
        self.target_states = {i: False for i in range(1, 9)}
        self.timer_start = {i: 0 for i in range(1, 9)}
        
        # AC Specific Protection (Anti-Short Cycle)
        self.ac_last_on_time = 0
        self.ac_last_off_time = 0
        self.MIN_AC_RUNTIME = 300 # 5 minutes
        self.MIN_AC_OFFTIME = 180 # 3 minutes
        
        # Topic Mappings
        self.RELAY_TOPICS = {i: f"lab/relay/{i}/command" for i in range(1, 9)}

    def update(self, raw_count):
        """Processes raw YOLO count and manages relay transitions"""
        self.history.append(raw_count)
        
        # 1. Median Smoothing (Eliminates YOLO flicker/outliers)
        sorted_history = sorted(list(self.history))
        if len(sorted_history) > 0:
            self.stable_count = sorted_history[len(sorted_history)//2]
        
        # 2. Determine Goal Tier based on Stable Count
        goal_tier = 0
        if self.stable_count >= 18: goal_tier = 4
        elif self.stable_count >= 11: goal_tier = 3
        elif self.stable_count >= 5: goal_tier = 2
        elif self.stable_count >= 1: goal_tier = 1
        else: goal_tier = 0
        
        self.current_tier = goal_tier
        
        # 3. Apply Temporal Hysteresis
        self._process_hysteresis(goal_tier)

    def _process_hysteresis(self, goal_tier):
        now = time.time()
        
        # Map Tiers to Relay Targets
        tier_targets = {i: False for i in range(1, 9)}
        if goal_tier >= 1: # 1-4 People
            tier_targets[1] = True # Zone A Lights
            tier_targets[3] = True # Fan A1
        if goal_tier >= 2: # 5-10 People
            tier_targets[2] = True # Zone B Lights
            tier_targets[4] = True # Fan A2
        if goal_tier >= 3: # 11+ People
            tier_targets[5] = True # Fan A3
            tier_targets[6] = True # Fan A4
            tier_targets[7] = True # AC A
        if goal_tier >= 4: # 18+ People
            tier_targets[8] = True # AC B

        for i in range(1, 9):
            # --- GLOBAL DEEP STABILITY (2m ON, 3m OFF) ---
            on_delay = 120   # Must be stable for 2 minutes to turn ON
            off_delay = 180  # Must be empty/lower for 3 minutes to turn OFF

            # --- HYSTERESIS ENGINE ---
            if tier_targets[i] != self.relay_states[i]:
                # If we aren't already timing this change, start the timer
                if tier_targets[i] != self.target_states[i]:
                    self.target_states[i] = tier_targets[i]
                    self.timer_start[i] = now
                
                # Check if enough time has passed
                required_wait = on_delay if tier_targets[i] else off_delay
                if (now - self.timer_start[i]) >= required_wait:
                    self._attempt_relay_flip(i, tier_targets[i], now)
            else:
                # Reset target if it matches current state (prevents ghost timers)
                self.target_states[i] = self.relay_states[i]

    def _attempt_relay_flip(self, index, new_state, now):
        """Final gatekeeper with AC protection logic"""
        
        # AC Compressor Protection (Anti-Short Cycle)
        if index in [7, 8]:
            if new_state: # Trying to turn ON
                if (now - self.ac_last_off_time) < self.MIN_AC_OFFTIME:
                    return # Block: Compressor needs to rest
            else: # Trying to turn OFF
                if (now - self.ac_last_on_time) < self.MIN_AC_RUNTIME:
                    return # Block: Compressor must run minimum time

        # Commit Change
        self.relay_states[index] = new_state
        if index in [7, 8]:
            if new_state: self.ac_last_on_time = now
            else: self.ac_last_off_time = now

        # Publish to MQTT
        payload = "ON" if new_state else "OFF"
        self.client.publish(self.RELAY_TOPICS[index], payload, qos=1, retain=True)
        
        print(f"[{time.strftime('%H:%M:%S')}] ⚡ RELAY {index} -> {payload} (Smoothed Count: {self.stable_count})")
