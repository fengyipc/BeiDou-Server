#!/usr/bin/env python3
"""Apply targetZh from script-translation-memory.json to scripts-zh-CN JS (UTF-8 byte offsets)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

DEFAULT_MEMORY = Path("tools/scripts-zh-translate/script-translation-memory.json")


def find_gms_root(script_path: Path) -> Path | None:
    p = script_path.resolve()
    for _ in range(10):
        if (p / "scripts-zh-CN").is_dir():
            return p
        p = p.parent
    return None


def js_double_quoted_string(s: str) -> str:
    """Escape for a JS double-quoted string literal (UTF-8 source)."""
    out = ['"']
    for c in s:
        o = ord(c)
        if c == "\\":
            out.append("\\\\")
        elif c == '"':
            out.append('\\"')
        elif c == "\n":
            out.append("\\n")
        elif c == "\r":
            out.append("\\r")
        elif c == "\t":
            out.append("\\t")
        elif o < 0x20:
            out.append(f"\\x{o:02x}")
        else:
            out.append(c)
    out.append('"')
    return "".join(out)


def decode_js_string_literal(segment: str) -> str | None:
    segment = segment.strip()
    if len(segment) < 2 or segment[0] != '"' or segment[-1] != '"':
        return None
    inner = segment[1:-1]
    out: list[str] = []
    i = 0
    while i < len(inner):
        c = inner[i]
        if c != "\\":
            out.append(c)
            i += 1
            continue
        if i + 1 >= len(inner):
            return None
        n = inner[i + 1]
        if n in '"\\':
            out.append(n)
            i += 2
        elif n == "n":
            out.append("\n")
            i += 2
        elif n == "r":
            out.append("\r")
            i += 2
        elif n == "t":
            out.append("\t")
            i += 2
        elif n == "u" and i + 5 < len(inner):
            try:
                out.append(chr(int(inner[i + 2 : i + 6], 16)))
            except ValueError:
                return None
            i += 6
        elif n == "x" and i + 3 < len(inner):
            try:
                out.append(chr(int(inner[i + 2 : i + 4], 16)))
            except ValueError:
                return None
            i += 4
        else:
            out.append(n)
            i += 2
    return "".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description="Apply translations to scripts-zh-CN JS files.")
    ap.add_argument("--memory", "-m", type=Path, default=DEFAULT_MEMORY)
    ap.add_argument("--dry-run", action="store_true", help="Print counts only; do not write files.")
    ap.add_argument("--cwd", type=Path, help="chdir before resolving paths")
    args = ap.parse_args()

    if args.cwd:
        os.chdir(args.cwd.resolve())
    else:
        gms = find_gms_root(Path(__file__))
        if gms is not None:
            os.chdir(gms)

    base = Path.cwd()
    mem_path = args.memory.resolve()
    if not mem_path.is_file():
        print(f"Error: memory not found: {mem_path}", file=sys.stderr)
        return 1

    with open(mem_path, encoding="utf-8") as f:
        doc = json.load(f)

    applicable = [
        u
        for u in doc.get("units", [])
        if not u.get("needsTranslation")
        and u.get("targetZh") is not None
        and str(u.get("targetZh", "")).strip() != ""
        and u.get("status") != "skipped"
    ]

    by_file: dict[str, list[dict[str, Any]]] = {}
    for u in applicable:
        rel = u.get("file", "")
        if not rel.startswith("scripts-zh-CN/"):
            continue
        by_file.setdefault(rel, []).append(u)

    changed_files = 0
    replaced = 0
    errors: list[str] = []

    for rel, group in sorted(by_file.items()):
        path = base / rel.replace("/", os.sep)
        if not path.is_file():
            errors.append(f"missing file: {rel}")
            continue
        raw = bytearray(path.read_bytes())
        group_sorted = sorted(group, key=lambda x: x.get("byteStart", 0), reverse=True)
        file_replaced = 0
        file_errors: list[str] = []
        for u in group_sorted:
            bs = u.get("byteStart")
            be = u.get("byteEnd")
            src = u.get("sourceText", "")
            tgt = u.get("targetZh")
            if bs is None or be is None or bs < 0 or be > len(raw) or bs >= be:
                file_errors.append(f"{u.get('unitId')}: bad span")
                continue
            slice_bytes = bytes(raw[bs:be])
            try:
                seg = slice_bytes.decode("utf-8")
            except UnicodeDecodeError:
                file_errors.append(f"{rel}: utf-8 decode at {bs}")
                continue
            decoded = decode_js_string_literal(seg)
            if decoded != src:
                file_errors.append(f"{rel}:{u.get('line')}: source mismatch for sourceText")
                continue
            new_lit = js_double_quoted_string(str(tgt))
            new_b = new_lit.encode("utf-8")
            raw[bs:be] = new_b
            file_replaced += 1

        if file_errors:
            errors.extend(file_errors)
            continue

        if file_replaced == 0:
            continue

        replaced += file_replaced
        changed_files += 1
        if not args.dry_run:
            path.write_bytes(bytes(raw))

    if args.dry_run:
        print(f"dry-run: files touched={changed_files}, replacements={replaced}")
    else:
        print(f"Applied replacements={replaced} across {changed_files} file(s)")

    for msg in errors[:30]:
        print(f"  ! {msg}", file=sys.stderr)
    if len(errors) > 30:
        print(f"  ... and {len(errors) - 30} more", file=sys.stderr)
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
