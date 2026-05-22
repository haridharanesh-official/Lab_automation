# ESP32 And Home Assistant Audit Checklist

The ESP32 firmware and Home Assistant YAML are not in this workspace. Use this checklist when those files are available.

## ESP32 Firmware

- [ ] Uses `lab/control/relay1/set` through `lab/control/relay8/set`.
- [ ] Publishes `lab/control/relay1/state` through `lab/control/relay8/state`.
- [ ] Publishes `lab/control/status`.
- [ ] Does not subscribe to legacy `lab/relay/X/command`.
- [ ] Relay state is published after every command.
- [ ] Relay command payloads are consistently `ON` / `OFF`.
- [ ] Boot state sets all relays OFF before connecting Wi-Fi.
- [ ] Active-low relay logic is handled explicitly.
- [ ] Avoids ESP32 boot-strapping GPIO pins for relay inputs.
- [ ] Uses watchdog timer.
- [ ] Wi-Fi reconnect is non-blocking.
- [ ] MQTT reconnect is non-blocking.
- [ ] MQTT last will publishes offline status.
- [ ] Does not restore old ON states automatically after reboot unless approved.

## Home Assistant

- [ ] MQTT relay state entities point to `lab/control/relayX/state`.
- [ ] Relay command entities point to `lab/control/relayX/set`.
- [ ] No duplicate old `lab/relay/...` entities remain active.
- [ ] People count sensor uses `lab/vision/people_count/state`.
- [ ] JSON sensor can read `lab/vision/people_count`.
- [ ] `lab/vision/status` is treated as JSON, not plain `online`, unless templated.
- [ ] Home Assistant does not duplicate the stability controller automation.
- [ ] Manual override controls are separate and explicitly approved.

