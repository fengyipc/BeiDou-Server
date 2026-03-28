#!/usr/bin/env bash
# Build BeiDou.jar, optionally pack resource delta zip, upload to COS, update version.json.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/cos-common.sh
source "$SCRIPT_DIR/cos-common.sh"

load_cos_env

RESOURCE_PATHS="${RESOURCE_PATHS:-scripts scripts-zh-CN wz wz-zh-CN}"
ARTIFACT_ONLY=false
REQUIRE_RESOURCE_CHANGE=false
SKIP_MAVEN=false

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  --artifact-only             Do not pack resource zip; publish jar + artifactOnly patch only.
  --require-resource-change   Exit 1 if no tracked resource files changed between from..HEAD.
  --skip-maven                Skip mvn package (use existing target/BeiDou.jar).
  -h, --help

Environment:
  COS_BUCKET, COS_REGION or COS_ENDPOINT, COS_PREFIX
  COS_SECRET_ID, COS_SECRET_KEY (optional if coscli pre-configured)
  INITIAL_FROM_COMMIT         Required when remote version.json does not exist yet (40-char SHA).
  RESOURCE_PATHS              Space-separated paths under server root (default: scripts scripts-zh-CN wz wz-zh-CN)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --artifact-only) ARTIFACT_ONLY=true; shift ;;
    --require-resource-change) REQUIRE_RESOURCE_CHANGE=true; shift ;;
    --skip-maven) SKIP_MAVEN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

require_coscli
require_helper_py

if [[ -z "${COS_BUCKET:-}" ]]; then
  echo "COS_BUCKET is required" >&2
  exit 1
fi

cd "$SERVER_ROOT"

to="$(git rev-parse HEAD)"
if [[ ! "$to" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Could not read HEAD commit" >&2
  exit 1
fi

PREV_FILE="$(mktemp)"
NEW_VER="$(mktemp)"
FILES_TMP="$(mktemp)"
PATCH_ZIP=""
cleanup() {
  rm -f "$PREV_FILE" "$NEW_VER" "$FILES_TMP"
  [[ -n "$PATCH_ZIP" && -f "$PATCH_ZIP" ]] && rm -f "$PATCH_ZIP"
}
trap cleanup EXIT

if cos_cp_down "version.json" "$PREV_FILE" 2>/dev/null; then
  python3 "$HELPER_PY" json_validate "$PREV_FILE"
  export BEIDOU_PREV_PATH="$PREV_FILE"
  from="$(python3 -c "import json,os; print(json.load(open(os.environ['BEIDOU_PREV_PATH'],encoding='utf-8'))['headCommit'])")"
else
  echo '{}' > "$PREV_FILE"
  from="${INITIAL_FROM_COMMIT:-}"
  if [[ ! "$from" =~ ^[0-9a-f]{40}$ ]]; then
    echo "No remote version.json. Set INITIAL_FROM_COMMIT to the baseline (40-char SHA) for first publish." >&2
    exit 1
  fi
fi

git cat-file -e "${from}^{commit}" 2>/dev/null || {
  echo "from commit not found in repo: $from" >&2
  exit 1
}

if [[ "$from" == "$to" ]]; then
  echo "Nothing to publish: remote head already matches HEAD ($to)" >&2
  exit 0
fi

# shellcheck disable=SC2086
git diff --name-only "$from..$to" -- $RESOURCE_PATHS > "$FILES_TMP"
has_resources=false
if [[ -s "$FILES_TMP" ]]; then
  has_resources=true
fi

if [[ "$REQUIRE_RESOURCE_CHANGE" == true && "$has_resources" != true ]]; then
  echo "No resource changes under RESOURCE_PATHS; exiting (--require-resource-change)." >&2
  exit 1
fi

if [[ "$ARTIFACT_ONLY" == true ]]; then
  has_resources=false
fi

patch_type=artifactOnly
if [[ "$has_resources" == true ]]; then
  patch_type=resource
  PATCH_ZIP="$(mktemp).zip"
  python3 "$HELPER_PY" zip_paths "$SERVER_ROOT" "$FILES_TMP" "$PATCH_ZIP"
  if [[ ! -s "$PATCH_ZIP" ]]; then
    echo "Resource list non-empty but zip is empty (missing files?)" >&2
    exit 1
  fi
fi

if [[ "$SKIP_MAVEN" != true ]]; then
  mvn -q -f "$SERVER_ROOT/pom.xml" package -DskipTests
fi

JAR_PATH="$SERVER_ROOT/target/BeiDou.jar"
[[ -f "$JAR_PATH" ]] || {
  echo "Missing $JAR_PATH (run mvn package or drop --skip-maven)" >&2
  exit 1
}

jar_sha="$(sha256_file "$JAR_PATH" | tr -d '\n')"
st="$(short_sha "$to")"
sf="$(short_sha "$from")"
artifact_key="releases/BeiDou-${st}.jar"
patch_key="releases/patches/patch-${sf}-${st}.zip"

cos_cp_up "$JAR_PATH" "$artifact_key"

if [[ "$patch_type" == resource ]]; then
  patch_sha="$(sha256_file "$PATCH_ZIP" | tr -d '\n')"
  cos_cp_up "$PATCH_ZIP" "$patch_key"
  export BEIDOU_JSON_FROM="$from" BEIDOU_JSON_TO="$to" BEIDOU_JSON_KEY="$patch_key" BEIDOU_JSON_SHA="$patch_sha"
  patch_obj="$(python3 <<'PY'
import json, os
print(json.dumps({
    "fromCommit": os.environ["BEIDOU_JSON_FROM"],
    "toCommit": os.environ["BEIDOU_JSON_TO"],
    "key": os.environ["BEIDOU_JSON_KEY"],
    "sha256": os.environ["BEIDOU_JSON_SHA"],
}, separators=(",", ":")))
PY
)"
else
  export BEIDOU_JSON_FROM="$from" BEIDOU_JSON_TO="$to"
  patch_obj="$(python3 <<'PY'
import json, os
print(json.dumps({
    "fromCommit": os.environ["BEIDOU_JSON_FROM"],
    "toCommit": os.environ["BEIDOU_JSON_TO"],
    "artifactOnly": True,
}, separators=(",", ":")))
PY
)"
fi

export BEIDOU_VER_OUT="$NEW_VER" BEIDOU_HEAD="$to" BEIDOU_JAR_KEY="$artifact_key" BEIDOU_JAR_SHA="$jar_sha"
export BEIDOU_PATCH_JSON="$patch_obj" BEIDOU_PREV_PATH="$PREV_FILE"
python3 <<'PY'
import json, os

out_path = os.environ["BEIDOU_VER_OUT"]
head = os.environ["BEIDOU_HEAD"]
artifact = {"key": os.environ["BEIDOU_JAR_KEY"], "sha256": os.environ["BEIDOU_JAR_SHA"]}
patch = json.loads(os.environ["BEIDOU_PATCH_JSON"])
prev_path = os.environ["BEIDOU_PREV_PATH"]

with open(prev_path, encoding="utf-8") as f:
    raw = f.read().strip()
prev = json.loads(raw) if raw else {}
patches = list(prev.get("patches") or [])
patches.append(patch)

doc = {
    "schema": 1,
    "headCommit": head,
    "artifact": artifact,
    "patches": patches,
}
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=2)
    f.write("\n")
PY

python3 "$HELPER_PY" json_validate "$NEW_VER"

cos_cp_up "$NEW_VER" "version.json.new"
cos_cli cp "$(cos_uri "version.json.new")" "$(cos_uri "version.json")" -f
cos_cli rm "$(cos_uri "version.json.new")" -f 2>/dev/null || true

echo "Published head=$to artifact=$artifact_key patch=$patch_type"
