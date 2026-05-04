#!/usr/bin/env bash
set -u

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-"$PROJECT_DIR/.venv/bin/python"}"
DB_PATH="${DB_PATH:-"$PROJECT_DIR/data/cc_ranking.sqlite3"}"
LOG_PATH="${LOG_PATH:-"$PROJECT_DIR/data/fetch.log"}"
HOOK_SCRIPT="${1:-${CC_RANKING_CHANGE_HOOK:-"$PROJECT_DIR/scripts/on_ranking_changed.sh"}}"
VERBOSE="${VERBOSE:-auto}"

START_HM="${START_HM:-1500}"
END_HM="${END_HM:-1800}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-600}"

mkdir -p "$PROJECT_DIR/data"
cd "$PROJECT_DIR" || exit 1

log() {
  line="[$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M:%S %Z')] $*"
  printf '%s\n' "$line" >> "$LOG_PATH"
  if [ "$VERBOSE" = "1" ] || { [ "$VERBOSE" = "auto" ] && [ -t 1 ]; }; then
    printf '%s\n' "$line"
  fi
}

run_fetch_once() {
  "$PYTHON_BIN" -m cc_ranking.fetch --db "$DB_PATH" --change-exit-code >> "$LOG_PATH" 2>&1
}

while true; do
  now_hm="$(TZ=Asia/Seoul date '+%H%M')"

  if [ "$now_hm" -lt "$START_HM" ]; then
    log "waiting for poll window: now=${now_hm}, start=${START_HM}, end=${END_HM}"
    sleep 60
    continue
  fi

  if [ "$now_hm" -gt "$END_HM" ]; then
    log "poll window ended without ranking changes"
    exit 0
  fi

  log "polling ranking page"
  run_fetch_once
  fetch_status=$?

  if [ "$fetch_status" -eq 10 ]; then
    log "ranking data changed; exporting static data"
    if "$PYTHON_BIN" -m cc_ranking.export_static >> "$LOG_PATH" 2>&1; then
      log "static data export completed"
    else
      log "static data export failed"
      exit 1
    fi

    if [ -x "$HOOK_SCRIPT" ]; then
      log "running change hook: $HOOK_SCRIPT"
      "$HOOK_SCRIPT" >> "$LOG_PATH" 2>&1
      hook_status=$?
      log "change hook exited with status $hook_status"
      exit "$hook_status"
    fi

    log "change hook is not executable or does not exist: $HOOK_SCRIPT"
    exit 0
  fi

  if [ "$fetch_status" -ne 0 ]; then
    log "fetch failed with status $fetch_status"
  else
    log "no ranking changes detected"
  fi

  now_hm="$(TZ=Asia/Seoul date '+%H%M')"
  if [ "$now_hm" -ge "$END_HM" ]; then
    log "poll window ended without ranking changes"
    exit 0
  fi

  sleep "$INTERVAL_SECONDS"
done
