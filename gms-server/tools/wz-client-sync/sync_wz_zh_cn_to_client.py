#!/usr/bin/env python3
"""
Write wz-zh-CN/*.img.xml (HaRepacker-style) to client loose .img files (GMS classic / v83-style).

Layout (default):
  wz-zh-CN/String.wz/MonsterBook.img.xml  ->  <client-root>/String/MonsterBook.img

Optional: --git-last-commits N or --git-rev-range FROM TO limits work to *.img.xml that appear
in `git diff` for that range and still exist under --wz-zh-cn.

Skips XML that contains unsupported nodes (canvas, sound, uol, …); use HaRepacker for those.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from wz_img_writer import UnsupportedXmlNode, encode_img_xml_to_bytes, xml_bytes_contain_unsupported


def _git_toplevel(start_dir: Path) -> Path:
    p = subprocess.run(
        ["git", "-C", str(start_dir), "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        msg = (p.stderr or p.stdout or "").strip() or "git rev-parse failed"
        raise RuntimeError(msg)
    return Path(p.stdout.strip())


def _git_diff_name_only(repo_root: Path, rev_a: str, rev_b: str) -> list[str]:
    p = subprocess.run(
        ["git", "-C", str(repo_root), "diff", "--name-only", rev_a, rev_b],
        capture_output=True,
        text=True,
    )
    if p.returncode != 0:
        msg = (p.stderr or "").strip() or "git diff failed"
        raise RuntimeError(msg)
    return [line.strip() for line in p.stdout.splitlines() if line.strip()]


def collect_img_xml_paths_from_git(
    wz_zh_cn_root: Path,
    repo_root: Path,
    rev_a: str,
    rev_b: str,
) -> list[Path]:
    """Paths under wz_zh_cn_root that appear in git diff and are existing *.img.xml files."""
    wz_resolved = wz_zh_cn_root.resolve()
    repo_resolved = repo_root.resolve()
    out: list[Path] = []
    seen: set[Path] = set()
    for rel in _git_diff_name_only(repo_resolved, rev_a, rev_b):
        candidate = (repo_resolved / rel).resolve()
        if not candidate.is_file():
            continue
        try:
            candidate.relative_to(wz_resolved)
        except ValueError:
            continue
        if not candidate.name.endswith(".img.xml"):
            continue
        if candidate in seen:
            continue
        seen.add(candidate)
        out.append(candidate)
    out.sort()
    return out


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
    git_group = ap.add_mutually_exclusive_group()
    git_group.add_argument(
        "--git-last-commits",
        type=int,
        metavar="N",
        help="Only process *.img.xml that changed between HEAD~N and HEAD (git diff)",
    )
    git_group.add_argument(
        "--git-rev-range",
        nargs=2,
        metavar=("FROM", "TO"),
        help="Only process *.img.xml changed in git range, e.g. HEAD~5 HEAD or abc123 def456",
    )
    ap.add_argument(
        "--git-repo",
        type=Path,
        default=None,
        help="Git repository root (default: git toplevel containing --wz-zh-cn)",
    )
    args = ap.parse_args()

    wz_root = args.wz_zh_cn.resolve()
    client_root = args.client_root.resolve()
    if not wz_root.is_dir():
        print(f"Error: --wz-zh-cn not a directory: {wz_root}", file=sys.stderr)
        return 1

    xml_paths: list[Path]
    if args.git_last_commits is not None:
        if args.git_last_commits < 1:
            print("Error: --git-last-commits N requires N >= 1", file=sys.stderr)
            return 1
        rev_a = f"HEAD~{args.git_last_commits}"
        rev_b = "HEAD"
        try:
            repo = (args.git_repo.resolve() if args.git_repo else _git_toplevel(wz_root))
            xml_paths = collect_img_xml_paths_from_git(wz_root, repo, rev_a, rev_b)
        except RuntimeError as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1
    elif args.git_rev_range is not None:
        rev_a, rev_b = args.git_rev_range
        try:
            repo = (args.git_repo.resolve() if args.git_repo else _git_toplevel(wz_root))
            xml_paths = collect_img_xml_paths_from_git(wz_root, repo, rev_a, rev_b)
        except RuntimeError as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1
    else:
        xml_paths = sorted(wz_root.rglob("*.img.xml"))

    if (args.git_last_commits is not None or args.git_rev_range is not None) and not xml_paths:
        print(
            "Note: no existing *.img.xml under --wz-zh-cn in this git range.",
            file=sys.stderr,
        )

    processed = 0
    skipped_unsupported = 0
    skipped_error = 0

    for xml_path in xml_paths:
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
