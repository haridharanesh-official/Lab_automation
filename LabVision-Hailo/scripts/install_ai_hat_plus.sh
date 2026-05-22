#!/usr/bin/env bash
set -euo pipefail

echo "Updating Raspberry Pi OS packages..."
sudo apt update
sudo apt full-upgrade -y
sudo rpi-eeprom-update -a || true

echo "Installing AI HAT+ dependencies for Hailo-8/Hailo-8L vision hardware..."
sudo apt install -y dkms
sudo apt install -y hailo-all

echo "Installing camera utilities and Python MQTT helper..."
sudo apt install -y rpicam-apps python3-venv python3-pip mosquitto-clients

echo
echo "Install step complete. Reboot now:"
echo "  sudo reboot"

