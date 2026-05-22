# Legacy Files - Do Not Run

This folder preserves old experimental Hailo-side files.

Reason they are not active:

- The old `hailo_app.py` imports `occupancy_engine.py`.
- The old `occupancy_engine.py` can publish relay commands.
- LabVision-Hailo must be a vision sensor only.

Do not use these files for production unless they are audited and patched.

