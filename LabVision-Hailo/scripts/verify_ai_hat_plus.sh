#!/usr/bin/env bash
set -euo pipefail

echo "Checking Hailo device identity..."
hailortcli fw-control identify

echo
echo "Scanning Hailo devices..."
hailortcli scan || true

echo
echo "Checking kernel logs..."
dmesg | grep -i hailo | tail -n 40 || true

echo
echo "Checking camera stack..."
rpicam-hello --list-cameras || true

echo
echo "Checking MQTT broker reachability..."
mosquitto_pub -h hari.local -t lab/vision/status -m '{"status":"pi_hailo_check"}' -r

echo
echo "Expected result:"
echo "- Hailo device is visible as Hailo-8 for the 26 TOPS HAT+."
echo "- /dev/hailo0 appears in kernel logs."
echo "- Camera is listed if connected."
echo "- MQTT status test reaches hari.local."

