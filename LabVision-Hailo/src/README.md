# Active Runtime Code

This folder is reserved for safe Hailo runtime code.

Current file:

- `safe_mqtt.py`: MQTT helper that can publish only LabOS vision topics and blocks relay/automation topics.

Old experimental files were moved to:

```text
legacy_do_not_run/src_old/
```

Those files are preserved for reference but should not be used as the production Hailo runtime because they include an old occupancy engine path.

