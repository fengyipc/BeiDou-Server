#!/usr/bin/env bash
# Stop BeiDou.jar if running, run COS update, then start the server.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/cos-common.sh
source "$SCRIPT_DIR/cos-common.sh"

load_cos_env

FOREGROUND=false
if [[ "${1:-}" == "--foreground" ]]; then
  FOREGROUND=true
fi

stop_server() {
  local pids
  pids="$(pgrep -f 'java.*BeiDou\.jar' 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//' || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  echo "Stopping BeiDou.jar PIDs: $pids"
  # shellcheck disable=SC2086
  kill -TERM $pids 2>/dev/null || true
  local waited=0
  while [[ $waited -lt 30 ]]; do
    pids="$(pgrep -f 'java.*BeiDou\.jar' 2>/dev/null || true)"
    [[ -z "$pids" ]] && break
    sleep 1
    waited=$((waited + 1))
  done
  pids="$(pgrep -f 'java.*BeiDou\.jar' 2>/dev/null | tr '\n' ' ' | sed 's/[[:space:]]*$//' || true)"
  if [[ -n "$pids" ]]; then
    echo "Force killing: $pids" >&2
    # shellcheck disable=SC2086
    kill -KILL $pids 2>/dev/null || true
  fi
}

stop_server

"$SCRIPT_DIR/update.sh"

JAVA_BIN="${BEIDOU_JAVA:-}"
if [[ -z "$JAVA_BIN" && -x "$SERVER_ROOT/jdk-21.0.2/bin/java" ]]; then
  JAVA_BIN="$SERVER_ROOT/jdk-21.0.2/bin/java"
elif [[ -z "$JAVA_BIN" ]]; then
  JAVA_BIN="java"
fi

cd "$SERVER_ROOT"
JAR="$SERVER_ROOT/BeiDou.jar"
[[ -f "$JAR" ]] || {
  echo "Missing $JAR (update.sh should have placed it)" >&2
  exit 1
}

read -r -a JVM_EXTRA <<< "${BEIDOU_JAVA_OPTS:-}"

if [[ "$FOREGROUND" == true ]]; then
  exec "$JAVA_BIN" "${JVM_EXTRA[@]}" -Dspring.config.location=application.yml -jar "$JAR"
else
  mkdir -p "$SERVER_ROOT/logs"
  nohup "$JAVA_BIN" "${JVM_EXTRA[@]}" -Dspring.config.location=application.yml -jar "$JAR" \
    >>"$SERVER_ROOT/logs/beidou.log" 2>&1 &
  echo "Started BeiDou.jar in background (logs -> $SERVER_ROOT/logs/beidou.log)"
fi
