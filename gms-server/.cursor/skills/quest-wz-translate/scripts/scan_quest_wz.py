#!/usr/bin/env python3
"""Scan wz-zh-CN/Quest.wz; optional reference from wz/Quest.wz. Emit translation memory JSON."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

VERSION = 1
DEFAULT_FILES = ("QuestInfo.img.xml", "Say.img.xml", "Act.img.xml")


def _strip_wz_tokens(s: str) -> str:
    t = re.sub(r"#[^#]*#", " ", s)
    t = re.sub(r"#[0-9a-zA-Z]{1,3}", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def has_cjk(s: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", s))


def has_hangul(s: str) -> bool:
    return bool(re.search(r"[\uac00-\ud7a3]", s))


def has_latin_letters(s: str) -> bool:
    return bool(re.search(r"[A-Za-z]", s))


def is_unreadable(s: str) -> bool:
    if not s or not s.strip():
        return False
    t = _strip_wz_tokens(s)
    if len(t) < 2:
        return False
    q, rep, n = t.count("?"), t.count("\ufffd"), len(t)
    if n >= 3 and (q + rep) / n >= 0.55:
        return True
    if q >= 5 and q / n >= 0.5:
        return True
    return False


def is_skipped_empty_or_trivial(s: str) -> bool:
    if not s or not s.strip():
        return True
    s = s.strip()
    if re.fullmatch(r"[\d\s\W_]+", s) and not has_cjk(s) and not has_hangul(s) and not has_latin_letters(s):
        return True
    return False


def detect_script(s: str) -> str:
    cjk, ko, lat = has_cjk(s), has_hangul(s), has_latin_letters(s)
    if cjk and ko:
        return "mixed"
    if cjk:
        return "zh"
    if ko:
        return "ko"
    if lat:
        return "latin"
    return "unknown"


def needs_translation(source: str, unreadable: bool) -> bool:
    if is_skipped_empty_or_trivial(source):
        return False
    if unreadable:
        return True
    if has_hangul(source):
        return True
    if has_cjk(source) and not unreadable:
        return False
    if has_latin_letters(source) or re.search(r"[^\x00-\x7f\u4e00-\u9fff]", source):
        return True
    return False


def unit_id(file_name: str, logical_path: str) -> str:
    return hashlib.sha256(f"{file_name}|{logical_path}".encode("utf-8")).hexdigest()


def find_string_by_path(root: ET.Element, path_parts: list[str], field_name: str) -> str | None:
    """path_parts includes root imgdir name (e.g. QuestInfo.img); XML root is that same node — skip duplicate."""
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
            return c.get("value")
    return None


def walk_imgdir(node: ET.Element, parts: list[str], file_name: str, out: list[dict[str, Any]]) -> None:
    if node.tag != "imgdir":
        return
    name = node.get("name") or ""
    cur = parts + [name]
    for child in node:
        if child.tag == "string":
            field = child.get("name") or ""
            logical_path = "/".join(cur) + "/" + field
            qid = cur[1] if len(cur) > 1 else ""
            out.append(
                {
                    "file": file_name,
                    "logicalPath": logical_path,
                    "questId": qid,
                    "value": child.get("value") or "",
                }
            )
        elif child.tag == "imgdir":
            walk_imgdir(child, cur, file_name, out)


def parse_xml_file(path: Path) -> ET.Element:
    root = ET.parse(path).getroot()
    if root.tag != "imgdir":
        raise ValueError(f"Expected root imgdir in {path}")
    return root


def collect_units(xml_path: Path) -> list[dict[str, Any]]:
    root = parse_xml_file(xml_path)
    out: list[dict[str, Any]] = []
    walk_imgdir(root, [], xml_path.name, out)
    return out


def build_memory_unit(
    rec: dict[str, Any],
    *,
    use_reference: bool,
    ref_root: Path | None,
    ref_cache: dict[str, ET.Element],
) -> dict[str, Any]:
    file_name = rec["file"]
    logical_path = rec["logicalPath"]
    value = rec["value"]
    quest_id = rec["questId"]
    unread = is_unreadable(value)
    ref_text: str | None = None
    ref_src: str | None = None
    if use_reference and ref_root is not None and (unread or needs_translation(value, unread)):
        parts = logical_path.split("/")
        if len(parts) >= 2:
            field_name = parts[-1]
            path_to_parent = parts[:-1]
            ref_file = ref_root / file_name
            if ref_file.is_file():
                try:
                    if file_name not in ref_cache:
                        ref_cache[file_name] = parse_xml_file(ref_file)
                    rroot = ref_cache[file_name]
                    ref_text = find_string_by_path(rroot, path_to_parent, field_name)
                    if ref_text is not None:
                        try:
                            ref_src = str(ref_file.relative_to(Path.cwd()))
                        except ValueError:
                            ref_src = str(ref_file)
                except (ET.ParseError, ValueError):
                    ref_text = None

    nt = needs_translation(value, unread)
    status = "skipped" if is_skipped_empty_or_trivial(value) else ("pending" if nt else "skipped")

    return {
        "unitId": unit_id(file_name, logical_path),
        "questId": quest_id,
        "file": file_name,
        "path": logical_path,
        "sourceText": value,
        "referenceText": ref_text,
        "referenceSource": ref_src if ref_text is not None else None,
        "needsTranslation": nt and status != "skipped",
        "detectedScript": detect_script(value),
        "unreadable": unread,
        "status": status,
        "targetZh": None,
        "glossaryRefs": None,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }


def merge_units(
    old_units: dict[str, dict[str, Any]],
    new_list: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    merged: list[dict[str, Any]] = []
    for nu in new_list:
        uid = nu["unitId"]
        o = old_units.get(uid)
        if o is None:
            merged.append(nu)
            continue
        if o.get("sourceText") == nu["sourceText"]:
            keep = dict(nu)
            keep["status"] = o.get("status", nu["status"])
            keep["targetZh"] = o.get("targetZh")
            keep["glossaryRefs"] = o.get("glossaryRefs")
            if o.get("targetZh") and o.get("status") == "done":
                keep["needsTranslation"] = False
            merged.append(keep)
        else:
            nu["status"] = "pending" if nu.get("needsTranslation") else nu.get("status", "pending")
            nu["targetZh"] = None
            merged.append(nu)
    return merged


def main() -> int:
    ap = argparse.ArgumentParser(description="Scan Quest.wz and build translation memory JSON.")
    ap.add_argument("--wz-root", type=Path, default=Path("wz-zh-CN/Quest.wz"))
    ap.add_argument("--reference-root", type=Path, default=Path("wz/Quest.wz"))
    ap.add_argument("--no-reference", action="store_true")
    ap.add_argument("--files", type=str, default=",".join(DEFAULT_FILES))
    ap.add_argument("-o", "--output", type=Path, default=Path("tools/quest-wz-translate/quest-translation-memory.json"))
    ap.add_argument("--merge", action="store_true")
    ap.add_argument("--cwd", type=Path, help="chdir before resolving paths")
    args = ap.parse_args()

    if args.cwd:
        os.chdir(args.cwd.resolve())
    else:
        script = Path(__file__).resolve()
        gms_root = script.parent.parent.parent.parent
        if (gms_root / "wz-zh-CN").is_dir():
            os.chdir(gms_root)

    wz_root = args.wz_root.resolve()
    ref_root = None if args.no_reference else args.reference_root.resolve()
    file_names = [f.strip() for f in args.files.split(",") if f.strip()]

    if not wz_root.is_dir():
        print(f"Error: wz-root not found: {wz_root}", file=sys.stderr)
        return 1

    all_new: list[dict[str, Any]] = []
    per_file_counts: dict[str, int] = {}
    ref_cache: dict[str, ET.Element] = {}

    for fn in file_names:
        xp = wz_root / fn
        if not xp.is_file():
            print(f"Warning: skip missing file {xp}", file=sys.stderr)
            continue
        recs = collect_units(xp)
        per_file_counts[fn] = len(recs)
        for rec in recs:
            all_new.append(
                build_memory_unit(
                    rec,
                    use_reference=not args.no_reference,
                    ref_root=ref_root,
                    ref_cache=ref_cache,
                )
            )

    old_by_id: dict[str, dict[str, Any]] = {}
    if args.merge and args.output.is_file():
        try:
            with open(args.output, encoding="utf-8") as f:
                old = json.load(f)
            for u in old.get("units", []):
                old_by_id[u["unitId"]] = u
        except (json.JSONDecodeError, OSError) as e:
            print(f"Warning: could not merge from {args.output}: {e}", file=sys.stderr)

    final_units = merge_units(old_by_id, all_new) if args.merge else all_new
    pending = sum(1 for u in final_units if u.get("needsTranslation"))

    out_doc = {
        "version": VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "wzRoot": str(wz_root),
        "referenceRoot": None if ref_root is None else str(ref_root),
        "filesScanned": file_names,
        "stats": {
            "totalUnits": len(final_units),
            "needsTranslation": pending,
            "perFile": per_file_counts,
        },
        "units": final_units,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out_doc, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Wrote {args.output} ({len(final_units)} units, {pending} need translation)")
    for fn, c in per_file_counts.items():
        print(f"  {fn}: {c} string nodes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
