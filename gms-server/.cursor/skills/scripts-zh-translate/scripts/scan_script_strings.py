#!/usr/bin/env python3
"""Scan scripts-zh-CN npc/quest/reactor for player-visible strings; emit translation memory JSON."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

VERSION = 1

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_MEMORY = Path("tools/scripts-zh-translate/script-translation-memory.json")
EXTRACTOR = SCRIPT_DIR / "extract_script_strings.mjs"


def has_cjk(s: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", s))


def has_hangul(s: str) -> bool:
    return bool(re.search(r"[\uac00-\ud7a3]", s))


def has_latin_letters(s: str) -> bool:
    return bool(re.search(r"[A-Za-z]", s))


def is_skipped_empty_or_trivial(s: str) -> bool:
    if not s or not s.strip():
        return True
    s = s.strip()
    if re.fullmatch(r"[\d\s\W_]+", s) and not has_cjk(s) and not has_hangul(s) and not has_latin_letters(s):
        return True
    return False


def strip_ms_player_markup(s: str) -> str:
    """Remove common Maple client inline tokens (#b/#k/#t123# / #i…#) before language detection."""
    t = s
    for _ in range(48):
        n = t
        n = re.sub(r"#[tTiIoOpPmMcC]\d+#", "", n)
        n = re.sub(r"#[fF][^#]*#", "", n)
        n = re.sub(r"#-?\d+#", "", n)
        n = re.sub(r"#[Ll]\d+#", "", n)
        n = re.sub(r"#[hH]\s", " ", n)
        n = re.sub(r"#[bBkKrRgGeEnNdD](?![0-9A-Za-z])", "", n)
        n = re.sub(r"#[lL](?![0-9A-Za-z])", "", n)
        if n == t:
            break
        t = n
    return t


def has_non_ascii_letter(remainder: str) -> bool:
    """Non-ASCII Unicode letters (e.g. Cyrillic) still need translation; CJK/Hangul handled above."""
    return any(ord(c) >= 128 and unicodedata.category(c).startswith("L") for c in remainder)


def needs_translation(source: str) -> bool:
    if is_skipped_empty_or_trivial(source):
        return False
    if has_hangul(source):
        return True
    if has_cjk(source):
        return False
    stripped = strip_ms_player_markup(source)
    if is_skipped_empty_or_trivial(stripped):
        return False
    if has_hangul(stripped):
        return True
    if has_cjk(stripped):
        return False
    if has_latin_letters(stripped) or has_non_ascii_letter(stripped):
        return True
    return False


def unit_id(file_name: str, byte_start: int, source_text: str, callee: str) -> str:
    key = f"{file_name}|{byte_start}|{callee}|{source_text}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def zh_cn_to_scripts_ref(zh_path: str) -> str | None:
    if not zh_path.startswith("scripts-zh-CN/"):
        return None
    return "scripts/" + zh_path[len("scripts-zh-CN/") :]


def script_file_suffix(relative_path: str) -> str:
    """`npc/9201135.js` — same for scripts/ and scripts-zh-CN/ paths."""
    for prefix in ("scripts-zh-CN/", "scripts/"):
        if relative_path.startswith(prefix):
            return relative_path[len(prefix) :]
    return relative_path


def build_ast_reference_lookup(en_files: list[dict[str, Any]]) -> dict[tuple[str, str], str]:
    """Map (file suffix, referenceKey) -> English sourceText from scripts/ extract."""
    m: dict[tuple[str, str], str] = {}
    for ent in en_files:
        rel = ent.get("relativePath", "")
        suf = script_file_suffix(rel)
        for u in ent.get("units", []):
            rk = u.get("referenceKey")
            if not rk:
                continue
            st = u.get("sourceText")
            if isinstance(st, str):
                m[(suf, str(rk))] = st
    return m


def reference_string_at_bytes(scripts_root: Path, ref_rel: str, byte_start: int, byte_end: int) -> str | None:
    ref_path = scripts_root / ref_rel.replace("/", os.sep)
    if not ref_path.is_file():
        return None
    raw = ref_path.read_bytes()
    if byte_start < 0 or byte_end > len(raw) or byte_start >= byte_end:
        return None
    return raw[byte_start:byte_end].decode("utf-8", errors="replace")


def decode_js_string_literal(segment: str) -> str | None:
    """Decode a JS double-quoted string literal including surrounding quotes."""
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


def build_merge_queues(old_units: list[dict[str, Any]]) -> dict[tuple[str, str, str], deque[dict[str, Any]]]:
    key_units: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for u in old_units:
        k = (u.get("file", ""), u.get("sourceText", ""), u.get("callee", ""))
        key_units[k].append(u)
    return {k: deque(sorted(v, key=lambda x: (x.get("line", 0), x.get("column", 0), x.get("byteStart", 0)))) for k, v in key_units.items()}


def merge_unit_fields(new_u: dict[str, Any], queues: dict[tuple[str, str, str], deque[dict[str, Any]]]) -> None:
    k = (new_u["file"], new_u["sourceText"], new_u["callee"])
    q = queues.get(k)
    if not q:
        return
    old = q.popleft()
    if old.get("targetZh") is not None:
        new_u["targetZh"] = old["targetZh"]
    if old.get("glossaryRefs") is not None:
        new_u["glossaryRefs"] = old["glossaryRefs"]
    if old.get("status"):
        new_u["status"] = old["status"]
    if old.get("updatedAt"):
        new_u["updatedAt"] = old["updatedAt"]
    if old.get("needsTranslation") is False and old.get("targetZh") is not None:
        new_u["needsTranslation"] = False


def run_extractor(base: Path, subdirs: str | None = None) -> dict[str, Any]:
    if not EXTRACTOR.is_file():
        raise FileNotFoundError(f"Extractor not found: {EXTRACTOR}")
    cmd = ["node", str(EXTRACTOR), "--base", str(base)]
    if subdirs:
        cmd.extend(["--subdirs", subdirs])
    proc = subprocess.run(
        cmd,
        cwd=str(base),
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"extract_script_strings.mjs failed:\n{proc.stderr or proc.stdout}")
    return json.loads(proc.stdout)


def main() -> int:
    ap = argparse.ArgumentParser(description="Scan zh-CN script strings into translation memory.")
    ap.add_argument("--memory", "-m", type=Path, default=DEFAULT_MEMORY)
    ap.add_argument("--merge", action="store_true", help="Preserve targetZh from existing memory (match file+sourceText+callee order).")
    ap.add_argument("--cwd", type=Path, help="chdir before resolving paths")
    args = ap.parse_args()

    if args.cwd:
        os.chdir(args.cwd.resolve())
    else:
        p = SCRIPT_DIR.resolve()
        gms: Path | None = None
        for _ in range(10):
            if (p / "scripts-zh-CN").is_dir():
                gms = p
                break
            p = p.parent
        if gms is not None:
            os.chdir(gms)

    base = Path.cwd()
    mem_path = args.memory.resolve()
    mem_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        raw_zh = run_extractor(base)
        raw_en = run_extractor(base, "scripts/npc,scripts/quest,scripts/reactor")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    ref_lookup = build_ast_reference_lookup(raw_en.get("files", []))
    raw = raw_zh

    old_units: list[dict[str, Any]] = []
    if args.merge and mem_path.is_file():
        with open(mem_path, encoding="utf-8") as f:
            old_doc = json.load(f)
        old_units = old_doc.get("units", [])

    queues = build_merge_queues(old_units) if args.merge else {}

    now = datetime.now(timezone.utc).isoformat()
    units: list[dict[str, Any]] = []
    parse_errors = 0
    parse_error_files: list[str] = []
    stats_by_cat: dict[str, int] = defaultdict(int)
    needs_count = 0

    for ent in raw.get("files", []):
        rel = ent.get("relativePath", "")
        category = ent.get("category", "npc")
        if ent.get("error"):
            parse_errors += 1
            parse_error_files.append(rel)
        ref_rel = zh_cn_to_scripts_ref(rel)

        for u in ent.get("units", []):
            if u.get("hasInterpolation"):
                continue
            source_text = u.get("sourceText", "")
            callee = u.get("callee", "")
            byte_start = u.get("byteStart", 0)
            byte_end = u.get("byteEnd", 0)
            line = u.get("line", 0)
            column = u.get("column", 0)

            uid = unit_id(rel, byte_start, source_text, callee)
            need = needs_translation(source_text)

            ref_text: str | None = None
            rk = u.get("referenceKey")
            if ref_rel and rk:
                ref_text = ref_lookup.get((script_file_suffix(rel), str(rk)))
            if ref_text is None and ref_rel:
                raw_seg = reference_string_at_bytes(base, ref_rel, byte_start, byte_end)
                if raw_seg is not None:
                    dec = decode_js_string_literal(raw_seg)
                    if dec is not None:
                        ref_text = dec

            row: dict[str, Any] = {
                "unitId": uid,
                "category": category,
                "file": rel,
                "byteStart": byte_start,
                "byteEnd": byte_end,
                "line": line,
                "column": column,
                "callee": callee,
                "sourceText": source_text,
                "referenceText": ref_text,
                "template": u.get("template", False),
                "needsTranslation": need,
                "targetZh": None,
                "status": "pending" if need else "skipped",
                "glossaryRefs": None,
                "updatedAt": now,
            }
            if rk:
                row["referenceKey"] = str(rk)
            if not need:
                row["targetZh"] = source_text

            if args.merge and queues:
                merge_unit_fields(row, queues)

            if need and row.get("targetZh") is not None and str(row["targetZh"]).strip() != "":
                row["needsTranslation"] = False
                if row.get("status") == "pending":
                    row["status"] = "done"

            units.append(row)
            stats_by_cat[category] += 1
            if row["needsTranslation"]:
                needs_count += 1

    doc: dict[str, Any] = {
        "version": VERSION,
        "generatedAt": now,
        "scriptsZhRoot": str(base / "scripts-zh-CN"),
        "referenceRoot": str(base / "scripts"),
        "stats": {
            "totalUnits": len(units),
            "needsTranslation": needs_count,
            "parseErrors": parse_errors,
            "parseErrorFiles": parse_error_files,
            "perCategory": dict(stats_by_cat),
        },
        "units": units,
    }

    with open(mem_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(
        f"Wrote {mem_path} — units={len(units)}, needsTranslation={needs_count}, parseErrors={parse_errors}"
        + (f" ({', '.join(parse_error_files)})" if parse_error_files else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
