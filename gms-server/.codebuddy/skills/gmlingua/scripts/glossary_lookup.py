#!/usr/bin/env python3
"""
Glossary Lookup Tool for MapleStory Game Text Translation
Supports multiple search modes: by ID, by text content, by category, by field type
"""

import json
import os
import sys
import argparse
from pathlib import Path

# Compute path: scripts/ -> gmlingua/ -> skills/ -> .codebuddy/ -> workspace root -> glossary
GLOSSARY_PATH = Path(__file__).parent.parent.parent.parent.parent / "glossary" / "glossary.json"

def load_glossary():
    """Load the glossary JSON file with UTF-8 encoding"""
    with open(GLOSSARY_PATH, encoding='utf-8') as f:
        return json.load(f)

def search_by_id(glossary, query):
    """Search by ID (numeric or wz path like 'Cash.img')"""
    results = []
    query_lower = query.lower()
    for entry in glossary.get('entries', []):
        entry_id = str(entry.get('id', '')).lower()
        if query_lower == entry_id or query_lower in entry_id:
            results.append(entry)
    return results

def search_by_zh(glossary, query, limit=20):
    """Search by Chinese text (partial match)"""
    results = []
    query_lower = query.lower()
    for entry in glossary.get('entries', []):
        zh = entry.get('zh', '').lower()
        if query_lower in zh:
            results.append(entry)
    results.sort(key=lambda x: 0 if x.get('zh', '').lower() == query_lower else 1)
    return results[:limit]

def search_by_en(glossary, query, limit=20):
    """Search by English text (partial match)"""
    results = []
    query_lower = query.lower()
    for entry in glossary.get('entries', []):
        en = entry.get('en', '').lower()
        if query_lower in en:
            results.append(entry)
    results.sort(key=lambda x: 0 if x.get('en', '').lower() == query_lower else 1)
    return results[:limit]

def filter_by_category(entries, category):
    """Filter entries by category"""
    if not category:
        return entries
    return [e for e in entries if e.get('category', '').lower() == category.lower()]

def filter_by_field_type(entries, field_type):
    """Filter entries by field type"""
    if not field_type:
        return entries
    return [e for e in entries if e.get('fieldType', '').lower() == field_type.lower()]

def format_entry(entry, idx):
    """Format a single entry for display"""
    zh = entry.get('zh', 'N/A')[:50]
    en = entry.get('en', 'N/A')[:50]
    cat = entry.get('category', 'N/A')
    ft = entry.get('fieldType', 'N/A')
    entry_id = entry.get('id', 'N/A')
    source = entry.get('source', 'N/A')
    print(f"  [{idx}] ID: {entry_id}")
    print(f"      ZH: {zh}")
    print(f"      EN: {en}")
    print(f"      Category: {cat}, FieldType: {ft}")
    print(f"      Source: {source}")
    print()

def main():
    parser = argparse.ArgumentParser(description='Glossary Lookup Tool')
    parser.add_argument('query', help='Search query (ID, Chinese text, or English text)')
    parser.add_argument('--category', '-c', help='Filter by category')
    parser.add_argument('--field-type', '-f', help='Filter by field type (name, desc, Title, etc.)')
    parser.add_argument('--limit', '-l', type=int, default=20, help='Maximum results to show')
    parser.add_argument('--mode', '-m', choices=['auto', 'id', 'zh', 'en'], default='auto',
                        help='Search mode: auto (default), id, zh (Chinese), en (English)')

    args = parser.parse_args()

    if not os.path.exists(GLOSSARY_PATH):
        print(f"Error: Glossary file not found at {GLOSSARY_PATH}", file=sys.stderr)
        sys.exit(1)

    glossary = load_glossary()
    total = glossary.get('totalCount', 0)
    print(f"Loaded glossary with {total} entries\n")

    query = args.query.strip()
    results = []

    # Determine search mode
    mode = args.mode

    if mode == 'auto':
        # Auto-detect: if query is purely numeric or looks like wz path, search by ID
        if query.isdigit() or '.' in query:
            mode = 'id'
        # Otherwise search by Chinese text
        else:
            mode = 'zh'

    if mode == 'id':
        results = search_by_id(glossary, query)
    elif mode == 'zh':
        results = search_by_zh(glossary, query, args.limit)
    elif mode == 'en':
        results = search_by_en(glossary, query, args.limit)

    # Apply filters
    if args.category:
        results = filter_by_category(results, args.category)
    if args.field_type:
        results = filter_by_field_type(results, args.field_type)

    # Limit results
    results = results[:args.limit]

    if not results:
        print(f"No results found for: {query}")
        if mode == 'zh':
            print("  Trying English search as fallback...")
            results = search_by_en(glossary, query, args.limit)
            results = results[:args.limit]
        if args.category or args.field_type:
            print("  Trying without filters as fallback...")
            if mode == 'id':
                results = search_by_id(glossary, query)
            elif mode == 'zh':
                results = search_by_zh(glossary, query, args.limit)
            else:
                results = search_by_en(glossary, query, args.limit)
            results = results[:args.limit]

    if results:
        print(f"Found {len(results)} result(s) for: {query}")
        print(f"Mode: {mode}, Category: {args.category or 'any'}, FieldType: {args.field_type or 'any'}\n")
        for idx, entry in enumerate(results, 1):
            format_entry(entry, idx)
    else:
        print(f"No results found for: {query}")

if __name__ == '__main__':
    main()
