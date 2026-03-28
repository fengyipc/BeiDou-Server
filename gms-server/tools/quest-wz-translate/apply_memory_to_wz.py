#!/usr/bin/env python3
"""Apply targetZh from quest-translation-memory.json to wz-zh-CN/Quest.wz XML files."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from xml.etree import ElementTree as ET


def parse_xml_file(path: Path) -> ET.Element:
    root = ET.parse(path).getroot()
    if root.tag != "imgdir":
        raise ValueError(f"Expected root imgdir in {path}")
    return root


def find_string_element(root: ET.Element, path_parts: list[str], field_name: str) -> ET.Element | None:
    """Same navigation as scan_quest_wz.find_string_by_path, returns the <string> element."""
    i = 0
    if path_parts and path_parts[0] == root.get("name"):
        i = 1
    node: ET.Element | None = root
    for p in path_parts[i:]:
        if node is None:
            return None
        nxt = None
        for c in node:
            if c.tag == "imgdir" and c.get("name") == p:
                nxt = c
                break
        node = nxt
    if node is None:
        return None
    for c in node:
        if c.tag == "string" and c.get("name") == field_name:
            return c
    return None


def logical_path_to_parts(logical_path: str) -> tuple[list[str], str]:
    parts = logical_path.split("/")
    if len(parts) < 2:
        raise ValueError(f"Bad logical path: {logical_path}")
    return parts[:-1], parts[-1]


def main() -> int:
    ap = argparse.ArgumentParser(description="Write targetZh from memory into wz-zh-CN/Quest.wz XML.")
    ap.add_argument(
        "--memory",
        type=Path,
        default=Path("tools/quest-wz-translate/quest-translation-memory.json"),
    )
    ap.add_argument("--wz-root", type=Path, default=Path("wz-zh-CN/Quest.wz"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--cwd", type=Path, help="chdir before resolving paths")
    args = ap.parse_args()

    if args.cwd:
        os.chdir(args.cwd.resolve())
    else:
        here = Path(__file__).resolve()
        gms = here.parent.parent.parent
        if (gms / "wz-zh-CN").is_dir():
            os.chdir(gms)

    mem_path = args.memory.resolve()
    wz_root = args.wz_root.resolve()
    if not mem_path.is_file():
        print(f"Error: memory not found: {mem_path}", file=sys.stderr)
        return 1
    if not wz_root.is_dir():
        print(f"Error: wz-root not found: {wz_root}", file=sys.stderr)
        return 1

    with open(mem_path, encoding="utf-8") as f:
        doc = json.load(f)

    units = doc.get("units", [])
    to_apply: list[dict] = []
    for u in units:
        if u.get("needsTranslation"):
            continue
        tz = u.get("targetZh")
        if not tz or not str(tz).strip():
            continue
        to_apply.append(u)

    by_file: dict[str, list[dict]] = {}
    for u in to_apply:
        fn = u.get("file")
        if not fn:
            continue
        by_file.setdefault(fn, []).append(u)

    total_written = 0
    missing = 0
    for fn, lst in sorted(by_file.items()):
        xp = wz_root / fn
        if not xp.is_file():
            print(f"Warning: skip missing file {xp}", file=sys.stderr)
            continue
        root = parse_xml_file(xp)
        for u in lst:
            path_parts, field_name = logical_path_to_parts(u["path"])
            el = find_string_element(root, path_parts, field_name)
            if el is None:
                missing += 1
                print(f"Warning: no node {path_parts}/{field_name} in {fn}", file=sys.stderr)
                continue
            el.set("value", u["targetZh"])
            total_written += 1
        if args.dry_run:
            continue
        tree = ET.ElementTree(root)
        ET.indent(tree, space="    ", level=0)
        out_header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        with open(xp, "wb") as f:
            f.write(out_header.encode("utf-8"))
            tree.write(f, encoding="utf-8", xml_declaration=False)

    print(f"Applied {total_written} string(s); missing nodes: {missing}")
    if args.dry_run:
        print("(dry-run: no files written)")
    return 0 if missing == 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
