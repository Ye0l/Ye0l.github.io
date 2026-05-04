#!/usr/bin/env bash
set -u

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_PATH="${LOG_PATH:-"$PROJECT_DIR/data/fetch.log"}"

printf '[%s] ranking change hook placeholder executed\n' "$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')" >> "$LOG_PATH"
