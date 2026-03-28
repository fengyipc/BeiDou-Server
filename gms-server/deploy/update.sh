#!/usr/bin/env bash
# Download version.json from Tencent COS, apply incremental patches, refresh BeiDou.jar.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/cos-common.sh
source "$SCRIPT_DIR/cos-common.sh"

load_cos_env

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --init-commit SHA   Write local state with appliedCommit=SHA (no COS download).
  --bootstrap KEY     Download zip at KEY (relative to COS_PREFIX), extract to server root, then continue.
  -h, --help          Show this help.

Environment / cos.env:
  COS_BUCKET, COS_REGION (or COS_ENDPOINT), COS_PREFIX
  COS_SECRET_ID, COS_SECRET_KEY (optional if coscli is pre-configured)
  BEIDOU_STATE_FILE   Override state file (default: deploy/.beidou-deploy-state)
EOF
}

INIT_COMMIT=""
BOOTSTRAP_KEY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --init-commit)
      INIT_COMMIT="${2:?}"
      shift 2
      ;;
    --bootstrap)
      BOOTSTRAP_KEY="${2:?}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

write_state() {
  export BEIDOU_W_COMMIT="$1"
  export BEIDOU_W_JARSHA="${2:-}"
  export BEIDOU_W_PATH="$STATE_FILE"
  mkdir -p "$(dirname "$STATE_FILE")"
  python3 <<'PY'
import json, os
p = os.environ["BEIDOU_W_PATH"]
state = {
    "appliedCommit": os.environ["BEIDOU_W_COMMIT"],
    "artifactSha256": os.environ.get("BEIDOU_W_JARSHA", ""),
}
with open(p, "w", encoding="utf-8") as f:
    json.dump(state, f, indent=2)
    f.write("\n")
PY
}

if [[ -n "$INIT_COMMIT" ]]; then
  if [[ ! "$INIT_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
    echo "--init-commit must be a full 40-char hex SHA" >&2
    exit 1
  fi
  write_state "$INIT_COMMIT" ""
  echo "Wrote $STATE_FILE with appliedCommit=$INIT_COMMIT"
  exit 0
fi

require_coscli
require_helper_py

if [[ -z "${COS_BUCKET:-}" ]]; then
  echo "COS_BUCKET is required" >&2
  exit 1
fi

VERSION_LOCAL="$(mktemp)"
cleanup() { rm -f "$VERSION_LOCAL" "${TMP_JAR:-}" "${TMP_ZIP:-}"; }
trap cleanup EXIT

cos_cp_down "version.json" "$VERSION_LOCAL"

export BEIDOU_VER_JSON="$VERSION_LOCAL"
schema="$(python3 -c "import json,os; d=json.load(open(os.environ['BEIDOU_VER_JSON'],encoding='utf-8')); print(d.get('schema',''))")"
if [[ "$schema" != "1" ]]; then
  echo "Unsupported or missing version.json schema (expected schema=1)" >&2
  exit 1
fi

head_commit="$(python3 -c "import json,os; d=json.load(open(os.environ['BEIDOU_VER_JSON'],encoding='utf-8')); print(d['headCommit'])")"
artifact_blob="$(python3 -c "import json,os; d=json.load(open(os.environ['BEIDOU_VER_JSON'],encoding='utf-8')); print(d['artifact']['key'])")"
artifact_sha="$(python3 -c "import json,os; d=json.load(open(os.environ['BEIDOU_VER_JSON'],encoding='utf-8')); print(d['artifact']['sha256'])")"

if [[ -n "$BOOTSTRAP_KEY" ]]; then
  TMP_ZIP="$(mktemp)"
  cos_cp_down "$BOOTSTRAP_KEY" "$TMP_ZIP"
  got="$(sha256_file "$TMP_ZIP" | tr -d '\n')"
  echo "Bootstrap zip sha256=$got (not verified; use a trusted source)"
  python3 "$HELPER_PY" unzip "$TMP_ZIP" "$SERVER_ROOT"
  rm -f "$TMP_ZIP"
  TMP_ZIP=""
fi

if [[ ! -f "$STATE_FILE" ]]; then
  cat <<EOF >&2
Missing state file: $STATE_FILE
First-time setup:
  git checkout <baseline> then: $(basename "$0") --init-commit <40-char-sha>
Or: $(basename "$0") --bootstrap <key-to-full-zip> then --init-commit ...
EOF
  exit 1
fi

export BEIDOU_STATE_PATH="$STATE_FILE"
applied="$(python3 -c "import json,os; print(json.load(open(os.environ['BEIDOU_STATE_PATH'],encoding='utf-8')).get('appliedCommit',''))")"
if [[ ! "$applied" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid appliedCommit in $STATE_FILE" >&2
  exit 1
fi

apply_patch_chain() {
  local current="$1"
  local target="$2"
  while [[ "$current" != "$target" ]]; do
    export BEIDOU_CURRENT="$current"
    local patch_json
    patch_json="$(python3 <<'PY'
import json, os
ver = json.load(open(os.environ["BEIDOU_VER_JSON"], encoding="utf-8"))
cur = os.environ["BEIDOU_CURRENT"]
for p in ver.get("patches") or []:
    if p.get("fromCommit") == cur:
        print(json.dumps(p, separators=(",", ":")))
        break
else:
    raise SystemExit(1)
PY
)" || {
      echo "No patch step from $current toward $target (broken chain)." >&2
      exit 1
    }

    local artifact_only to_commit
    artifact_only="$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('artifactOnly', False))" "$patch_json")"
    to_commit="$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['toCommit'])" "$patch_json")"

    if [[ "$artifact_only" != "True" ]]; then
      local pkey psha
      pkey="$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['key'])" "$patch_json")"
      psha="$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['sha256'])" "$patch_json")"
      TMP_ZIP="$(mktemp)"
      cos_cp_down "$pkey" "$TMP_ZIP"
      got="$(sha256_file "$TMP_ZIP" | tr -d '\n')"
      if [[ "$got" != "$psha" ]]; then
        echo "SHA256 mismatch for patch $pkey" >&2
        exit 1
      fi
      python3 "$HELPER_PY" unzip "$TMP_ZIP" "$SERVER_ROOT"
      rm -f "$TMP_ZIP"
      TMP_ZIP=""
    fi
    current="$to_commit"
    write_state "$current" ""
  done
}

if [[ "$applied" != "$head_commit" ]]; then
  apply_patch_chain "$applied" "$head_commit"
fi

jar_dest="$SERVER_ROOT/BeiDou.jar"
TMP_JAR="$(mktemp)"
cos_cp_down "$artifact_blob" "$TMP_JAR"
got_jar="$(sha256_file "$TMP_JAR" | tr -d '\n')"
if [[ "$got_jar" != "$artifact_sha" ]]; then
  echo "SHA256 mismatch for artifact (expected $artifact_sha got $got_jar)" >&2
  exit 1
fi
chmod 644 "$TMP_JAR" 2>/dev/null || true
mv -f "$TMP_JAR" "$jar_dest"
TMP_JAR=""
write_state "$head_commit" "$artifact_sha"

echo "Update complete: appliedCommit=$head_commit, jar -> $jar_dest"
