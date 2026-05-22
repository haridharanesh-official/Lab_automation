# LabOS Production Acceptance Checklist

Use this before connecting automation to real lab loads.

## Vision

- [ ] Back camera image is stable.
- [ ] Empty lab does not false-trigger people.
- [ ] Sitting people are detected.
- [ ] Far/back-side people are detected.
- [ ] Crowded lab count is acceptable.
- [ ] Camera disconnect is detected.
- [ ] Vision status publishes to `lab/vision/status`.

## Hailo

- [ ] `hailortcli fw-control identify` detects the Hailo-8 device.
- [ ] `hailortcli scan` lists the device.
- [ ] `.hef` exists in `models/hef/`.
- [ ] Runtime self-test passes.
- [ ] Mock MQTT publish test passes.
- [ ] Real video preflight opens source.

## Stability Controller

- [ ] Controller self-test passes.
- [ ] Dry-run mode receives people count.
- [ ] Dry-run relay plan matches tier mapping.
- [ ] Live mode is enabled only after dry-run approval.
- [ ] Relay commands use `retain=False`.
- [ ] Relay commands use `lab/control/relayX/set`.
- [ ] AC lockout works.
- [ ] Relay stagger works.
- [ ] Vision timeout works.

## ESP32 Relay Node

- [ ] Safe boot all relays OFF.
- [ ] Subscribes to `lab/control/relayX/set`.
- [ ] Publishes `lab/control/relayX/state`.
- [ ] Publishes `lab/control/status`.
- [ ] Watchdog enabled.
- [ ] Non-blocking Wi-Fi reconnect.
- [ ] Non-blocking MQTT reconnect.

## Home Assistant

- [ ] People count displays.
- [ ] Vision status displays.
- [ ] Controller status displays.
- [ ] Relay states display.
- [ ] No duplicate automation controls relays.
- [ ] `lab/vision/status` JSON is not used as plain-text availability without a template.

## Hardware

- [ ] Relay supply sized correctly.
- [ ] AC wiring fused/protected.
- [ ] Enclosure installed.
- [ ] Labels installed.
- [ ] Emergency cutoff accessible.
- [ ] Fan/AC inductive load protection considered.

