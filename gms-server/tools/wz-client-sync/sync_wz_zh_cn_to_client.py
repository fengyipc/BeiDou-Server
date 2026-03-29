#!/usr/bin/env python3
"""
Write wz-zh-CN/*.img.xml (HaRepacker-style) to client loose .img files (GMS classic / v83-style).

Layout (default):
  wz-zh-CN/String.wz/MonsterBook.img.xml  ->  <client-root>/String/MonsterBook.img

Skips XML that contains unsupported nodes (canvas, sound, uol, …); use HaRepacker for those.
"""

from __future__ import annotations

import argparse
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from wz_img_writer import UnsupportedXmlNode, encode_img_xml_to_bytes, xml_bytes_contain_unsupported


def xml_path_to_client_img(xml_path: Path, wz_zh_cn_root: Path, client_root: Path) -> Path:
    rel = xml_path.relative_to(wz_zh_cn_root)
    parts = rel.parts
    if len(parts) < 2:
        raise ValueError(f"Expected <Category.wz>/<name>.img.xml, got: {rel}")
    category = parts[0]
    if not category.endswith(".wz"):
        raise ValueError(f"Expected first segment *.wz, got: {category}")
    folder = category[: -len(".wz")]
    fname = parts[-1]
    if not fname.endswith(".img.xml"):
        raise ValueError(f"Expected *.img.xml, got: {fname}")
    img_name = fname[: -len(".xml")]
    return client_root / folder / img_name


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--wz-zh-cn",
        type=Path,
        default=Path("wz-zh-CN"),
        help="Root of localized XML tree (default: wz-zh-CN)",
    )
    ap.add_argument(
        "--client-root",
        type=Path,
        required=True,
        help="Client img root (e.g. .../Data/String parent containing String/, Quest/, …)",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Print target paths only; do not write files",
    )
    ap.add_argument(
        "--verbose",
        action="store_true",
        help="Print each file written or skipped",
    )
    args = ap.parse_args()

    wz_root = args.wz_zh_cn.resolve()
    client_root = args.client_root.resolve()
    if not wz_root.is_dir():
        print(f"Error: --wz-zh-cn not a directory: {wz_root}", file=sys.stderr)
        return 1

    processed = 0
    skipped_unsupported = 0
    skipped_error = 0

    for xml_path in sorted(wz_root.rglob("*.img.xml")):
        try:
            dest = xml_path_to_client_img(xml_path, wz_root, client_root)
        except ValueError as e:
            if args.verbose:
                print(f"skip layout {xml_path}: {e}", file=sys.stderr)
            skipped_error += 1
            continue

        data = xml_path.read_bytes()
        bad = xml_bytes_contain_unsupported(data)
        if bad:
            if args.verbose:
                print(f"skip unsupported {xml_path}: {bad}")
            skipped_unsupported += 1
            continue

        if args.dry_run:
            print(f"{xml_path} -> {dest}")
            processed += 1
            continue

        try:
            blob = encode_img_xml_to_bytes(data)
        except (UnsupportedXmlNode, ET.ParseError) as e:
            print(f"Error encoding {xml_path}: {e}", file=sys.stderr)
            skipped_error += 1
            continue

        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(blob)
        processed += 1
        if args.verbose:
            print(f"wrote {dest} ({len(blob)} bytes)")

    print(
        f"Done: {processed} {'to write (dry-run)' if args.dry_run else 'written'}, "
        f"{skipped_unsupported} skipped (unsupported XML), {skipped_error} errors."
    )
    return 0 if skipped_error == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
