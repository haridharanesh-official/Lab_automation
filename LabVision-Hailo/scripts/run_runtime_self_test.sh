#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
python3 src/hailo_backcam_runtime.py --self-test

