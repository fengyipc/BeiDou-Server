#!/usr/bin/env python3
"""Merge Subagent translation results back into quest-translation-memory.json (single-writer)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_MEMORY = Path("tools/quest-wz-translate/quest-translation-memory.json")


def main() -> int:
    ap = argparse.ArgumentParser(description="Merge batch updates into translation memory JSON.")
    ap.add_argument("--memory", "-m", type=Path, default=DEFAULT_MEMORY)
    ap.add_argument(
        "updates_file",
        type=Path,
        help='JSON with {"updates": [...]} or {"units": [...]}',
    )
    ap.add_argument("--cwd", type=Path, help="chdir before resolving paths")
    args = ap.parse_args()

    if args.cwd:
        os.chdir(args.cwd.resolve())
    else:
        script = Path(__file__).resolve()
        gms = script.parent.parent.parent.parent
        if (gms / "wz-zh-CN").is_dir():
            os.chdir(gms)

    mem_path = args.memory.resolve()
    if not mem_path.is_file():
        print(f"Error: memory not found: {mem_path}", file=sys.stderr)
        return 1

    up_path = args.updates_file.resolve()
    if not up_path.is_file():
        print(f"Error: updates file not found: {up_path}", file=sys.stderr)
        return 1

    with open(mem_path, encoding="utf-8") as f:
        doc = json.load(f)
    with open(up_path, encoding="utf-8") as f:
        patch_doc = json.load(f)

    index: dict[str, dict[str, Any]] = {u["unitId"]: u for u in doc.get("units", [])}

    patches: list[dict[str, Any]] = []
    if "updates" in patch_doc:
        patches = patch_doc["updates"]
    elif "units" in patch_doc:
        patches = patch_doc["units"]
    else:
        print("Error: updates file must contain 'updates' or 'units' array", file=sys.stderr)
        return 1

    now = datetime.now(timezone.utc).isoformat()
    merged = 0
    missing = 0
    for p in patches:
        uid = p.get("unitId")
        if not uid or uid not in index:
            missing += 1
            continue
        tgt = index[uid]
        if "targetZh" in p:
            tgt["targetZh"] = p["targetZh"]
        if "status" in p:
            tgt["status"] = p["status"]
        if "glossaryRefs" in p:
            tgt["glossaryRefs"] = p["glossaryRefs"]
        if p.get("status") == "done" and p.get("targetZh"):
            tgt["needsTranslation"] = False
        tgt["updatedAt"] = p.get("updatedAt") or now
        merged += 1

    if missing:
        print(f"Warning: {missing} unitId(s) not found in memory", file=sys.stderr)

    pending = sum(1 for u in doc["units"] if u.get("needsTranslation"))
    doc["stats"]["needsTranslation"] = pending
    doc["stats"]["totalUnits"] = len(doc["units"])

    with open(mem_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Merged {merged} unit(s) into {mem_path}; needsTranslation count = {pending}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
