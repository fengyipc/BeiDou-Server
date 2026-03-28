#!/usr/bin/env bash
# Shared helpers for COS publish/update scripts. Source from deploy/*.sh (do not execute).

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
HELPER_PY="$DEPLOY_DIR/cos-helper.py"
STATE_FILE="${BEIDOU_STATE_FILE:-$DEPLOY_DIR/.beidou-deploy-state}"
COSCLI_BIN="${COSCLI:-coscli}"

load_cos_env() {
  if [[ -f "$DEPLOY_DIR/cos.env" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$DEPLOY_DIR/cos.env"
    set +a
  fi
}

normalize_prefix() {
  local p="${COS_PREFIX:-}"
  p="${p#/}"
  if [[ -n "$p" && "${p: -1}" != / ]]; then
    p="${p}/"
  fi
  printf '%s' "$p"
}

object_key() {
  local name="$1"
  printf '%s%s' "$(normalize_prefix)" "$name"
}

cos_endpoint() {
  if [[ -n "${COS_ENDPOINT:-}" ]]; then
    printf '%s' "$COS_ENDPOINT"
    return
  fi
  if [[ -z "${COS_REGION:-}" ]]; then
    echo "COS_REGION or COS_ENDPOINT is required when using COS_SECRET_ID/COS_SECRET_KEY" >&2
    exit 1
  fi
  printf 'cos.%s.myqcloud.com' "$COS_REGION"
}

cos_cli() {
  local -a args=("$COSCLI_BIN")
  if [[ -n "${COS_SECRET_ID:-}" && -n "${COS_SECRET_KEY:-}" ]]; then
    args+=(--init-skip=true -e "$(cos_endpoint)" -i "$COS_SECRET_ID" -k "$COS_SECRET_KEY")
  elif [[ -n "${COS_ENDPOINT:-}" ]]; then
    args+=(-e "$COS_ENDPOINT")
  fi
  args+=("$@")
  "${args[@]}"
}

cos_uri() {
  local key="$1"
  if [[ -z "${COS_BUCKET:-}" ]]; then
    echo "COS_BUCKET is required (e.g. mybucket-1250000000)" >&2
    exit 1
  fi
  printf 'cos://%s/%s' "$COS_BUCKET" "$(object_key "$key")"
}

require_coscli() {
  command -v "$COSCLI_BIN" >/dev/null 2>&1 || {
    echo "coscli not found. Install from https://github.com/tencentyun/coscli/releases and set COSCLI=/path/to/coscli if needed." >&2
    exit 1
  }
}

require_helper_py() {
  [[ -f "$HELPER_PY" ]] || {
    echo "Missing $HELPER_PY" >&2
    exit 1
  }
}

cos_cp_up() {
  local src="$1"
  local key="$2"
  require_coscli
  cos_cli cp "$src" "$(cos_uri "$key")"
}

cos_cp_down() {
  local key="$1"
  local dest="$2"
  require_coscli
  cos_cli cp "$(cos_uri "$key")" "$dest"
}

sha256_file() {
  require_helper_py
  python3 "$HELPER_PY" sha256 "$1"
}

short_sha() {
  local s="$1"
  printf '%s' "${s:0:12}"
}
