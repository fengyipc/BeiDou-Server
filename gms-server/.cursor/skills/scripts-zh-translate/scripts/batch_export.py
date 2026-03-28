#!/usr/bin/env python3
"""Export one batch of units (needsTranslation) from script-translation-memory.json for parallel agents."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

DEFAULT_MEMORY = Path("tools/scripts-zh-translate/script-translation-memory.json")
DEFAULT_OUT_DIR = Path("tools/scripts-zh-translate/batches")


def find_gms_root(script_path: Path) -> Path | None:
    p = script_path.resolve()
    for _ in range(10):
        if (p / "scripts-zh-CN").is_dir():
            return p
        p = p.parent
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="Export a batch of pending script translation units.")
    ap.add_argument("--memory", "-m", type=Path, default=DEFAULT_MEMORY)
    ap.add_argument("--batch-index", "-b", type=int, default=0, help="0-based batch index")
    ap.add_argument("--batch-size", "-n", type=int, default=50)
    ap.add_argument("-o", "--output", type=Path, help="Output JSON path (default: batches/batch-{index:04d}.json)")
    ap.add_argument("--cwd", type=Path, help="chdir before resolving paths")
    args = ap.parse_args()

    if args.cwd:
        os.chdir(args.cwd.resolve())
    else:
        gms = find_gms_root(Path(__file__))
        if gms is not None:
            os.chdir(gms)

    mem_path = args.memory.resolve()
    if not mem_path.is_file():
        print(f"Error: memory not found: {mem_path}", file=sys.stderr)
        return 1

    with open(mem_path, encoding="utf-8") as f:
        doc = json.load(f)

    pending = [u for u in doc.get("units", []) if u.get("needsTranslation")]
    pending.sort(key=lambda x: x.get("unitId", ""))

    start = args.batch_index * args.batch_size
    batch = pending[start : start + args.batch_size]

    out_path = args.output
    if out_path is None:
        DEFAULT_OUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = DEFAULT_OUT_DIR / f"batch-{args.batch_index:04d}.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_doc = {
        "batchIndex": args.batch_index,
        "batchSize": args.batch_size,
        "startOffset": start,
        "totalPending": len(pending),
        "memoryPath": str(mem_path),
        "units": batch,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_doc, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Exported {len(batch)} units (pending {len(pending)} total) -> {out_path}")
    if len(batch) == 0:
        print("No units in this batch (index past end).", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
