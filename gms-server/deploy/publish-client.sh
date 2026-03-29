#!/usr/bin/env bash
# Pack changed files under client/ (excluding versions.json) since last publish, upload zip +
# client/versions.json to COS under the same bucket prefix .../updates/ (default).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/cos-common.sh
source "$SCRIPT_DIR/cos-common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Publishes to cos://\${COS_BUCKET}/\${CLIENT_COS_PREFIX}/ (default prefix: updates).

Only committed changes are included (same as publish.sh): git diff from remote client-publish.json
headCommit to HEAD under client/, excluding versions.json. Commit client files before running.

Options:
  --allow-empty   Allow a zip with no file members (only if you really need a metadata-only bump).
  -h, --help

Environment (see deploy/cos.env):
  COS_BUCKET, COS_REGION or COS_ENDPOINT, COS_SECRET_ID, COS_SECRET_KEY
  CLIENT_COS_PREFIX   Object prefix for client updates (default: updates)
  CLIENT_INITIAL_FROM_COMMIT / INITIAL_FROM_COMMIT
                      Required on first run when remote client-publish.json is missing (40-char SHA).
  CLIENT_NEW_VERSION  Override auto patch bump (e.g. 1.2.0)
EOF
}

ALLOW_EMPTY=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-empty) ALLOW_EMPTY=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

load_cos_env

require_coscli
require_helper_py

if [[ -z "${COS_BUCKET:-}" ]]; then
  echo "COS_BUCKET is required" >&2
  exit 1
fi

CLIENT_COS_PREFIX="${CLIENT_COS_PREFIX:-updates}"
export COS_PREFIX="$CLIENT_COS_PREFIX"

CLIENT_DIR="$SERVER_ROOT/client"
VERSIONS_JSON="$CLIENT_DIR/versions.json"
STATE_KEY="client-publish.json"

[[ -d "$CLIENT_DIR" ]] || {
  echo "Missing client directory: $CLIENT_DIR" >&2
  exit 1
}
[[ -f "$VERSIONS_JSON" ]] || {
  echo "Missing $VERSIONS_JSON" >&2
  exit 1
}

cd "$SERVER_ROOT"

to="$(git rev-parse HEAD)"
if [[ ! "$to" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Could not read HEAD commit" >&2
  exit 1
fi

PREV_STATE="$(mktemp)"
FILES_RAW="$(mktemp)"
FILES_CLIENT_REL="$(mktemp)"
STATE_TMP=""
PATCH_ZIP=""
cleanup() {
  rm -f "$PREV_STATE" "$FILES_RAW" "$FILES_CLIENT_REL" "$STATE_TMP"
  [[ -n "$PATCH_ZIP" && -f "$PATCH_ZIP" ]] && rm -f "$PATCH_ZIP"
}
trap cleanup EXIT

from=""
if cos_cp_down "$STATE_KEY" "$PREV_STATE" 2>/dev/null; then
  python3 "$HELPER_PY" json_validate "$PREV_STATE"
  export BEIDOU_PREV_STATE="$PREV_STATE"
  from="$(python3 -c "import json, os; print(json.load(open(os.environ['BEIDOU_PREV_STATE'],encoding='utf-8'))['headCommit'])")"
else
  from="${CLIENT_INITIAL_FROM_COMMIT:-${INITIAL_FROM_COMMIT:-}}"
  if [[ ! "$from" =~ ^[0-9a-f]{40}$ ]]; then
    echo "No remote $STATE_KEY. Set CLIENT_INITIAL_FROM_COMMIT (or INITIAL_FROM_COMMIT) to baseline (40-char SHA)." >&2
    exit 1
  fi
fi

git cat-file -e "${from}^{commit}" 2>/dev/null || {
  echo "from commit not found in repo: $from" >&2
  exit 1
}

if [[ "$from" == "$to" ]]; then
  echo "Nothing to publish: client publish head already matches HEAD ($to)" >&2
  exit 0
fi

git diff --name-only "$from..$to" -- client ':!client/versions.json' > "$FILES_RAW"
git_prefix="$(git rev-parse --show-prefix 2>/dev/null || true)"
git_prefix="${git_prefix%/}"
if [[ -n "$git_prefix" ]]; then
  sed "s|^${git_prefix}/||" "$FILES_RAW" | grep -E '^client/' > "$FILES_CLIENT_REL" || true
else
  grep -E '^client/' "$FILES_RAW" > "$FILES_CLIENT_REL" || true
fi

# Paths inside the zip are relative to client/ (game overlay layout).
sed 's|^client/||' "$FILES_CLIENT_REL" | sed '/^$/d' > "$FILES_RAW"
mv "$FILES_RAW" "$FILES_CLIENT_REL"

if [[ ! -s "$FILES_CLIENT_REL" ]]; then
  echo "No changed files under client/ (excluding versions.json) between $from and $to." >&2
  exit 1
fi

PATCH_ZIP="$(mktemp).zip"
python3 "$HELPER_PY" zip_paths "$CLIENT_DIR" "$FILES_CLIENT_REL" "$PATCH_ZIP"

zip_count="$(python3 -c "import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); print(sum(1 for i in z.infolist() if not i.is_dir()))" "$PATCH_ZIP")"
if [[ "$zip_count" -eq 0 ]]; then
  if [[ "$ALLOW_EMPTY" != true ]]; then
    echo "Zip has no file members (deleted-only diff?). Use --allow-empty to publish anyway." >&2
    exit 1
  fi
fi

if [[ ! -s "$PATCH_ZIP" ]]; then
  echo "Zip is missing or empty: $PATCH_ZIP" >&2
  exit 1
fi

patch_sha="$(sha256_file "$PATCH_ZIP" | tr -d '\n')"
st="$(short_sha "$to")"

export BEIDOU_VERSIONS_PATH="$VERSIONS_JSON" BEIDOU_PATCH_SHA="$patch_sha" BEIDOU_SHORT_SHA="$st"
export BEIDOU_NEW_VER="${CLIENT_NEW_VERSION:-}"
new_meta="$(python3 <<'PY'
import json
import os
import re

path = os.environ["BEIDOU_VERSIONS_PATH"]
sha = os.environ["BEIDOU_PATCH_SHA"]
st = os.environ["BEIDOU_SHORT_SHA"]
override = (os.environ.get("BEIDOU_NEW_VER") or "").strip()

with open(path, encoding="utf-8") as f:
    data = json.load(f)
if not isinstance(data, list):
    raise SystemExit("versions.json must be a JSON array")

def bump_patch(v: str) -> str:
    parts = v.split(".")
    if not parts or not re.fullmatch(r"\d+", parts[-1] or ""):
        raise SystemExit(f"Cannot bump patch on last segment of version: {v!r}")
    parts[-1] = str(int(parts[-1]) + 1)
    return ".".join(parts)

if override:
    ver = override
elif data:
    ver = bump_patch(data[-1]["version"])
else:
    ver = "1.0.0"

zip_name = f"{ver}-client-{st}.zip"
entry = {"version": ver, "patch_url": zip_name, "checksum": sha}
data.append(entry)
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print(f"{ver}\t{zip_name}")
PY
)"

new_ver="${new_meta%%	*}"
zip_name="${new_meta#*	}"

python3 "$HELPER_PY" json_validate "$VERSIONS_JSON"

cos_cp_up "$PATCH_ZIP" "$zip_name"
cos_cp_up "$VERSIONS_JSON" "versions.json"

STATE_TMP="$(mktemp)"
export BEIDOU_HEAD="$to" BEIDOU_STATE_TMP="$STATE_TMP"
python3 <<'PY'
import json, os

with open(os.environ["BEIDOU_STATE_TMP"], "w", encoding="utf-8") as f:
    json.dump({"headCommit": os.environ["BEIDOU_HEAD"]}, f, indent=2)
    f.write("\n")
PY
cos_cp_up "$STATE_TMP" "$STATE_KEY"

echo "Published client update version=$new_ver zip=$zip_name head=$to -> $(cos_uri "$zip_name")"
