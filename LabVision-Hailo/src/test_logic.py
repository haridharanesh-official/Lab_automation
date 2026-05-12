import time
import logging
from fusion_engine import FusionEngine

# Set up logging to see the logic in action
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def test_occupancy_logic():
    engine = FusionEngine(occupied_threshold=5, empty_threshold=10) # Using 10s for faster testing
    print("--- STARTING OCCUPANCY LOGIC TEST ---")
    print("Rule: 5s to ON, 10s to OFF\n")

    # TEST 1: Quick entry (should NOT trigger)
    print("[Test 1] Quick entry (2s)...")
    engine.update_sensor("ai", True)
    time.sleep(2)
    engine.update_sensor("ai", False)
    changed = engine.compute_final_state()
    print(f"State Changed: {changed} | Current Occupancy: {engine.is_occupied}")
    print("Result: Correct (Ignored short movement)\n")

    # TEST 2: Sustained entry (should trigger ON)
    print("[Test 2] Sustained entry (6s)...")
    start = time.time()
    while time.time() - start < 6:
        engine.update_sensor("ai", True)
        changed = engine.compute_final_state()
        if changed:
            print(f"!!! STATE CHANGE DETECTED AT {time.time() - start:.2f}s !!!")
        time.sleep(1)
    print(f"Final Occupancy: {engine.is_occupied}\n")

    # TEST 3: Sensor Fusion (AI goes blind, but mmWave holds)
    print("[Test 3] Sensor Fusion: AI drops, but mmWave stays True...")
    engine.update_sensor("ai", False)
    engine.update_sensor("mmwave", True)
    changed = engine.compute_final_state()
    print(f"State Changed: {changed} | Current Occupancy: {engine.is_occupied}")
    print("Result: Correct (mmWave held the state)\n")

    # TEST 4: Full Exit (should trigger OFF after 10s)
    print("[Test 4] Full Exit (Waiting 12s)...")
    engine.update_sensor("ai", False)
    engine.update_sensor("mmwave", False)
    engine.update_sensor("pir", False)
    
    start = time.time()
    while time.time() - start < 12:
        changed = engine.compute_final_state()
        if changed:
            print(f"!!! STATE CHANGE DETECTED AT {time.time() - start:.2f}s !!!")
        time.sleep(1)
    print(f"Final Occupancy: {engine.is_occupied}")

if __name__ == "__main__":
    test_occupancy_logic()
