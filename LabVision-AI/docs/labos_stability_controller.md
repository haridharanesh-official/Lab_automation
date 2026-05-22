# LabOS Stability Controller

This is the separate relay decision layer for LabOS.

It is intentionally separate from AI inference:

```text
AI vision publishes people count -> stability controller decides relay targets -> ESP32 executes relays
```

## Safety Rules

- AI scripts must never publish relay commands.
- This controller is the only process that should publish relay commands.
- Relay command topics are `lab/control/relay1/set` through `lab/control/relay8/set`.
- Relay commands are published with `retain=False`.
- Legacy `lab/relay/X/command` topics are not used.

## Subscribed Topics

```text
lab/vision/people_count
lab/vision/people_count/state
```

## Published Topics

Relay commands, only in `--live` mode:

```text
lab/control/relay1/set
lab/control/relay2/set
lab/control/relay3/set
lab/control/relay4/set
lab/control/relay5/set
lab/control/relay6/set
lab/control/relay7/set
lab/control/relay8/set
```

Controller diagnostics:

```text
lab/controller/status
lab/controller/heartbeat
```

## Tier Mapping

```text
Tier 0: 0 people    -> all OFF
Tier 1: 1-4 people  -> relay 1, relay 3
Tier 2: 5-10 people -> relay 1, 2, 3, 4
Tier 3: 11-17       -> relay 1, 2, 3, 4, 5, 6, 7
Tier 4: 18+         -> relay 1, 2, 3, 4, 5, 6, 7, 8
```

## Run In Dry-Run Mode

Use this first. It subscribes to people count and logs planned relay actions, but it does not publish relay commands.

First run the offline safety self-test:

```powershell
cd "C:\Users\prith\Downloads\Lab automation\LabVision-AI"
.\.venv\Scripts\python.exe labos_stability_controller.py --self-test
```

```powershell
cd "C:\Users\prith\Downloads\Lab automation\LabVision-AI"
.\.venv\Scripts\python.exe labos_stability_controller.py --broker hari.local
```

Monitor MQTT:

```bash
mosquitto_sub -h hari.local -t "lab/#" -v
```

## Run Live

Only run this after dry-run behavior is verified.

```powershell
cd "C:\Users\prith\Downloads\Lab automation\LabVision-AI"
.\.venv\Scripts\python.exe labos_stability_controller.py --broker hari.local --live
```

## Important Defaults

- Median window: 5 count updates
- Upgrade delay: 30 seconds
- Downgrade delay: 180 seconds
- Vision stale timeout: 30 seconds
- Vision failsafe timeout: 300 seconds
- AC minimum OFF time: 180 seconds
- AC minimum ON time: 300 seconds
- Relay stagger delay: 1 second

By default, vision failsafe does not force relays off. Add `--failsafe-off` if you explicitly want tier 0 after a prolonged vision outage.
