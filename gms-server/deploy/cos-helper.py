#!/usr/bin/env python3
"""Small helpers for deploy scripts: checksums and safe zip extraction."""
from __future__ import annotations

import hashlib
import json
import os
import sys
import zipfile


def sha256_file(path: str) -> None:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    print(h.hexdigest())


def _safe_member_path(dest_root: str, member_name: str) -> str:
    if member_name.startswith("/") or member_name.startswith("\\"):
        raise SystemExit(f"unsafe zip member (absolute): {member_name!r}")
    parts = member_name.replace("\\", "/").split("/")
    if ".." in parts:
        raise SystemExit(f"unsafe zip member (..): {member_name!r}")
    target = os.path.normpath(os.path.join(dest_root, *parts))
    dest_abs = os.path.abspath(dest_root)
    if dest_abs.endswith(os.sep):
        prefix = dest_abs
    else:
        prefix = dest_abs + os.sep
    target_abs = os.path.abspath(target)
    if target_abs != dest_abs and not target_abs.startswith(prefix):
        raise SystemExit(f"unsafe zip member (escapes root): {member_name!r}")
    return target


def unzip_safe(zip_path: str, dest_root: str) -> None:
    dest_root = os.path.abspath(dest_root)
    os.makedirs(dest_root, exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        for m in zf.infolist():
            if m.is_dir():
                continue
            _ = _safe_member_path(dest_root, m.filename)
        zf.extractall(dest_root)


def zip_paths(root: str, list_file: str, out_zip: str) -> None:
    root = os.path.abspath(root)
    with open(list_file, encoding="utf-8") as f:
        paths = [line.strip() for line in f if line.strip()]
    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for rel in paths:
            rel = rel.replace("\\", "/").lstrip("/")
            if not rel or rel.endswith("/"):
                continue
            fp = os.path.normpath(os.path.join(root, rel))
            if not fp.startswith(root + os.sep) and fp != root:
                raise SystemExit(f"unsafe path in list: {rel!r}")
            if os.path.isfile(fp):
                zf.write(fp, rel)
            else:
                print(f"skip missing (deleted?): {rel}", file=sys.stderr)


def main() -> None:
    if len(sys.argv) < 2:
        print(
            "usage: cos-helper.py sha256 <file> | unzip <zip> <dest_root> | zip_paths <root> <list.txt> <out.zip>",
            file=sys.stderr,
        )
        sys.exit(2)
    cmd = sys.argv[1]
    if cmd == "sha256":
        if len(sys.argv) != 3:
            sys.exit(2)
        sha256_file(sys.argv[2])
    elif cmd == "unzip":
        if len(sys.argv) != 4:
            sys.exit(2)
        unzip_safe(sys.argv[2], sys.argv[3])
    elif cmd == "zip_paths":
        if len(sys.argv) != 5:
            sys.exit(2)
        zip_paths(sys.argv[2], sys.argv[3], sys.argv[4])
    elif cmd == "json_validate":
        if len(sys.argv) != 3:
            sys.exit(2)
        with open(sys.argv[2], encoding="utf-8") as f:
            json.load(f)
    else:
        print(f"unknown command: {cmd}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
