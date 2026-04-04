#!/usr/bin/env python3
"""Build a search index from WZ XML files for fast game data lookup.

Run from the gms-server root:
    python .cursor/skills/wz-search/scripts/build_index.py
"""

import json
import os
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(os.environ.get("WZ_BASE", "."))
WZ_DIR = BASE_DIR / "wz"
WZ_ZH_DIR = BASE_DIR / "wz-zh-CN"
INDEX_PATH = BASE_DIR / "tools" / "wz-search" / "wz-index.json"


def parse_xml(path: Path) -> ET.Element | None:
    try:
        return ET.parse(path).getroot()
    except ET.ParseError as e:
        print(f"  [WARN] XML parse error in {path}: {e}", file=sys.stderr)
        return None


def get_child_str(elem: ET.Element, name: str) -> str | None:
    for child in elem:
        if child.tag == "string" and child.get("name") == name:
            return child.get("value")
    return None


def get_child_int(elem: ET.Element, name: str) -> int | None:
    for child in elem:
        if child.tag == "int" and child.get("name") == name:
            try:
                return int(child.get("value"))
            except (TypeError, ValueError):
                pass
    return None


def get_child_imgdir(elem: ET.Element, name: str) -> ET.Element | None:
    for child in elem:
        if child.tag == "imgdir" and child.get("name") == name:
            return child
    return None


def collect_int_values(elem: ET.Element) -> list[int]:
    """Collect all <int> children's values as a list."""
    result = []
    for child in elem:
        if child.tag == "int":
            try:
                result.append(int(child.get("value")))
            except (TypeError, ValueError):
                pass
    return result


def collect_item_entries(elem: ET.Element) -> list[dict]:
    """Collect item entries: [{id, count, ...}]. Handles both 'id' and 'item' keys."""
    items = []
    for child in elem:
        if child.tag == "imgdir":
            entry = {}
            item_id = get_child_int(child, "id")
            if item_id is None:
                item_id = get_child_int(child, "item")
            if item_id is not None:
                entry["id"] = item_id
            count = get_child_int(child, "count")
            if count is not None:
                entry["count"] = count
            if entry:
                items.append(entry)
    return items


# ---------------------------------------------------------------------------
# NPC index
# ---------------------------------------------------------------------------
def build_npc_index() -> dict:
    print("  Building NPC index...")
    npcs = {}

    # EN names
    en_path = WZ_DIR / "String.wz" / "Npc.img.xml"
    root = parse_xml(en_path)
    if root is not None:
        for entry in root:
            if entry.tag == "imgdir":
                npc_id = entry.get("name")
                name = get_child_str(entry, "name")
                func = get_child_str(entry, "func")
                npcs[npc_id] = {"name": name or "", "func": func or ""}

    # ZH names
    zh_path = WZ_ZH_DIR / "String.wz" / "Npc.img.xml"
    root = parse_xml(zh_path)
    if root is not None:
        for entry in root:
            if entry.tag == "imgdir":
                npc_id = entry.get("name")
                if npc_id not in npcs:
                    npcs[npc_id] = {"name": "", "func": ""}
                npcs[npc_id]["name_zh"] = get_child_str(entry, "name") or ""
                func_zh = get_child_str(entry, "func")
                if func_zh:
                    npcs[npc_id]["func_zh"] = func_zh

    # NPC locations from Etc.wz/NpcLocation.img.xml
    loc_path = WZ_DIR / "Etc.wz" / "NpcLocation.img.xml"
    root = parse_xml(loc_path)
    if root is not None:
        for entry in root:
            if entry.tag == "imgdir":
                npc_id = entry.get("name")
                maps = [v for v in collect_int_values(entry) if v >= 0]
                if npc_id in npcs:
                    npcs[npc_id]["maps"] = maps
                else:
                    npcs[npc_id] = {"name": "", "func": "", "maps": maps}

    print(f"    {len(npcs)} NPCs indexed")
    return npcs


# ---------------------------------------------------------------------------
# Item index (Consume, Cash, Etc, Ins, Pet from String.wz)
# ---------------------------------------------------------------------------
def build_item_index() -> dict:
    print("  Building Item index...")
    items = {}

    flat_files = {
        "Consume": "Consume.img.xml",
        "Cash": "Cash.img.xml",
        "Ins": "Ins.img.xml",
        "Pet": "Pet.img.xml",
    }

    for category, filename in flat_files.items():
        for lang, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
            path = wz_dir / "String.wz" / filename
            root = parse_xml(path)
            if root is None:
                continue
            for entry in root:
                if entry.tag != "imgdir":
                    continue
                item_id = entry.get("name")
                if item_id not in items:
                    items[item_id] = {"category": category}
                if lang == "en":
                    items[item_id]["name"] = get_child_str(entry, "name") or ""
                    desc = get_child_str(entry, "desc")
                    if desc:
                        items[item_id]["desc"] = desc
                else:
                    items[item_id]["name_zh"] = get_child_str(entry, "name") or ""
                    desc_zh = get_child_str(entry, "desc")
                    if desc_zh:
                        items[item_id]["desc_zh"] = desc_zh

    # Etc.img.xml has nested structure: Etc.img -> Etc -> itemId
    for lang, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
        path = wz_dir / "String.wz" / "Etc.img.xml"
        root = parse_xml(path)
        if root is None:
            continue
        etc_root = get_child_imgdir(root, "Etc")
        if etc_root is None:
            continue
        for entry in etc_root:
            if entry.tag != "imgdir":
                continue
            item_id = entry.get("name")
            if item_id not in items:
                items[item_id] = {"category": "Etc"}
            if lang == "en":
                items[item_id]["name"] = get_child_str(entry, "name") or ""
                desc = get_child_str(entry, "desc")
                if desc:
                    items[item_id]["desc"] = desc
            else:
                items[item_id]["name_zh"] = get_child_str(entry, "name") or ""
                desc_zh = get_child_str(entry, "desc")
                if desc_zh:
                    items[item_id]["desc_zh"] = desc_zh

    # Eqp.img.xml has nested structure: Eqp -> subcategory -> itemId
    for lang, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
        path = wz_dir / "String.wz" / "Eqp.img.xml"
        root = parse_xml(path)
        if root is None:
            continue
        eqp_root = get_child_imgdir(root, "Eqp")
        if eqp_root is None:
            continue
        for subcat in eqp_root:
            if subcat.tag != "imgdir":
                continue
            subcat_name = subcat.get("name")
            for entry in subcat:
                if entry.tag != "imgdir":
                    continue
                item_id = entry.get("name")
                if item_id not in items:
                    items[item_id] = {"category": "Eqp", "subcategory": subcat_name}
                elif "subcategory" not in items[item_id]:
                    items[item_id]["category"] = "Eqp"
                    items[item_id]["subcategory"] = subcat_name
                if lang == "en":
                    items[item_id]["name"] = get_child_str(entry, "name") or ""
                    desc = get_child_str(entry, "desc")
                    if desc:
                        items[item_id]["desc"] = desc
                else:
                    items[item_id]["name_zh"] = get_child_str(entry, "name") or ""
                    desc_zh = get_child_str(entry, "desc")
                    if desc_zh:
                        items[item_id]["desc_zh"] = desc_zh

    print(f"    {len(items)} items indexed")
    return items


# ---------------------------------------------------------------------------
# Quest index
# ---------------------------------------------------------------------------
def build_quest_index() -> dict:
    print("  Building Quest index...")
    quests = {}

    # QuestInfo (EN)
    for lang, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
        path = wz_dir / "Quest.wz" / "QuestInfo.img.xml"
        root = parse_xml(path)
        if root is None:
            continue
        for entry in root:
            if entry.tag != "imgdir":
                continue
            qid = entry.get("name")
            if qid not in quests:
                quests[qid] = {}
            if lang == "en":
                quests[qid]["name"] = get_child_str(entry, "name") or ""
                parent = get_child_str(entry, "parent")
                if parent:
                    quests[qid]["parent"] = parent
            else:
                quests[qid]["name_zh"] = get_child_str(entry, "name") or ""
                parent_zh = get_child_str(entry, "parent")
                if parent_zh:
                    quests[qid]["parent_zh"] = parent_zh

            area = get_child_int(entry, "area")
            if area is not None:
                quests[qid]["area"] = area
            auto_start = get_child_int(entry, "autoStart")
            if auto_start:
                quests[qid]["autoStart"] = 1

    # QuestCategory labels
    cat_path = WZ_DIR / "Etc.wz" / "QuestCategory.img.xml"
    cat_root = parse_xml(cat_path)
    area_labels = {}
    if cat_root is not None:
        for child in cat_root:
            if child.tag == "string":
                val = child.get("value", "")
                if val and val != "empty":
                    area_labels[child.get("name")] = val

    for qid, q in quests.items():
        area_val = q.get("area")
        if area_val is not None:
            label = area_labels.get(str(area_val))
            if label:
                q["areaLabel"] = label

    # Check.img.xml — extract NPC IDs, prerequisite quests, level requirements
    for lang_label, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
        path = wz_dir / "Quest.wz" / "Check.img.xml"
        root = parse_xml(path)
        if root is None:
            continue
        if lang_label == "zh":
            break  # structure is the same; EN is authoritative for mechanics
        for entry in root:
            if entry.tag != "imgdir":
                continue
            qid = entry.get("name")
            if qid not in quests:
                quests[qid] = {}
            # Stage 0 = start conditions
            stage0 = get_child_imgdir(entry, "0")
            if stage0 is not None:
                npc_start = get_child_int(stage0, "npc")
                if npc_start is not None:
                    quests[qid]["npc_start"] = npc_start
                lvmin = get_child_int(stage0, "lvmin")
                if lvmin is not None:
                    quests[qid]["lvmin"] = lvmin
                # prerequisite quests
                preq = get_child_imgdir(stage0, "quest")
                if preq is not None:
                    prev_quests = []
                    for pq in preq:
                        if pq.tag == "imgdir":
                            pid = get_child_int(pq, "id")
                            pstate = get_child_int(pq, "state")
                            if pid is not None:
                                prev_quests.append({"id": pid, "state": pstate})
                    if prev_quests:
                        quests[qid]["prevQuests"] = prev_quests
                # required jobs
                jobs_dir = get_child_imgdir(stage0, "job")
                if jobs_dir is not None:
                    jobs = collect_int_values(jobs_dir)
                    if jobs:
                        quests[qid]["jobs"] = jobs

            # Stage 1 = complete conditions
            stage1 = get_child_imgdir(entry, "1")
            if stage1 is not None:
                npc_complete = get_child_int(stage1, "npc")
                if npc_complete is not None:
                    quests[qid]["npc_complete"] = npc_complete

    # Act.img.xml — extract rewards (exp, money, items, nextQuest)
    path = WZ_DIR / "Quest.wz" / "Act.img.xml"
    root = parse_xml(path)
    if root is not None:
        for entry in root:
            if entry.tag != "imgdir":
                continue
            qid = entry.get("name")
            if qid not in quests:
                quests[qid] = {}
            # Stage 1 = completion rewards
            stage1 = get_child_imgdir(entry, "1")
            if stage1 is not None:
                exp = get_child_int(stage1, "exp")
                if exp is not None:
                    quests[qid]["reward_exp"] = exp
                money = get_child_int(stage1, "money")
                if money is not None:
                    quests[qid]["reward_money"] = money
                nq = get_child_int(stage1, "nextQuest")
                if nq is not None:
                    quests[qid]["nextQuest"] = nq
                item_dir = get_child_imgdir(stage1, "item")
                if item_dir is not None:
                    reward_items = collect_item_entries(item_dir)
                    positive = [i for i in reward_items if i.get("count", 0) > 0]
                    if positive:
                        quests[qid]["reward_items"] = positive

    print(f"    {len(quests)} quests indexed")
    return quests


# ---------------------------------------------------------------------------
# Map index
# ---------------------------------------------------------------------------
def build_map_index() -> dict:
    print("  Building Map index...")
    maps = {}

    for lang, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
        path = wz_dir / "String.wz" / "Map.img.xml"
        root = parse_xml(path)
        if root is None:
            continue
        # Map.img.xml has multiple region groups (maple, victoria, ossyria, elin, etc.)
        for region in root:
            if region.tag != "imgdir":
                continue
            region_name = region.get("name")
            for entry in region:
                if entry.tag != "imgdir":
                    continue
                map_id = entry.get("name")
                if map_id not in maps:
                    maps[map_id] = {"region": region_name}
                if lang == "en":
                    maps[map_id]["streetName"] = get_child_str(entry, "streetName") or ""
                    maps[map_id]["mapName"] = get_child_str(entry, "mapName") or ""
                    desc = get_child_str(entry, "mapDesc")
                    if desc:
                        maps[map_id]["mapDesc"] = desc
                else:
                    maps[map_id]["streetName_zh"] = get_child_str(entry, "streetName") or ""
                    maps[map_id]["mapName_zh"] = get_child_str(entry, "mapName") or ""

    print(f"    {len(maps)} maps indexed")
    return maps


# ---------------------------------------------------------------------------
# Mob index
# ---------------------------------------------------------------------------
def build_mob_index() -> dict:
    print("  Building Mob index...")
    mobs = {}

    # Names from String.wz
    for lang, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
        path = wz_dir / "String.wz" / "Mob.img.xml"
        root = parse_xml(path)
        if root is None:
            continue
        for entry in root:
            if entry.tag != "imgdir":
                continue
            mob_id = entry.get("name")
            if mob_id not in mobs:
                mobs[mob_id] = {}
            if lang == "en":
                mobs[mob_id]["name"] = get_child_str(entry, "name") or ""
            else:
                mobs[mob_id]["name_zh"] = get_child_str(entry, "name") or ""

    # MonsterBook: maps and drops
    mb_path = WZ_DIR / "String.wz" / "MonsterBook.img.xml"
    root = parse_xml(mb_path)
    if root is not None:
        for entry in root:
            if entry.tag != "imgdir":
                continue
            mob_id = entry.get("name")
            if mob_id not in mobs:
                mobs[mob_id] = {}
            map_dir = get_child_imgdir(entry, "map")
            if map_dir is not None:
                mobs[mob_id]["maps"] = collect_int_values(map_dir)
            reward_dir = get_child_imgdir(entry, "reward")
            if reward_dir is not None:
                mobs[mob_id]["drops"] = collect_int_values(reward_dir)

    # Basic stats from Mob.wz (scan all mob files for level/hp/exp)
    mob_wz = WZ_DIR / "Mob.wz"
    if mob_wz.is_dir():
        count = 0
        for f in sorted(mob_wz.iterdir()):
            if not f.name.endswith(".img.xml"):
                continue
            mob_id_padded = f.name.replace(".img.xml", "")
            mob_id = str(int(mob_id_padded))  # strip leading zeros
            root = parse_xml(f)
            if root is None:
                continue
            info = get_child_imgdir(root, "info")
            if info is None:
                continue
            if mob_id not in mobs:
                mobs[mob_id] = {}
            for field in ("level", "maxHP", "maxMP", "exp", "PADamage",
                          "PDDamage", "MADamage", "MDDamage", "acc", "eva",
                          "speed", "undead"):
                val = get_child_int(info, field)
                if val is not None:
                    mobs[mob_id][field] = val
            count += 1
        print(f"    Scanned {count} mob WZ files for stats")

    print(f"    {len(mobs)} mobs indexed")
    return mobs


# ---------------------------------------------------------------------------
# Skill index
# ---------------------------------------------------------------------------
def build_skill_index() -> dict:
    print("  Building Skill index...")
    skills = {}
    book_names = {}

    for lang, wz_dir in [("en", WZ_DIR), ("zh", WZ_ZH_DIR)]:
        path = wz_dir / "String.wz" / "Skill.img.xml"
        root = parse_xml(path)
        if root is None:
            continue
        for entry in root:
            if entry.tag != "imgdir":
                continue
            sid = entry.get("name")
            bn = get_child_str(entry, "bookName")
            if bn:
                key = "bookName" if lang == "en" else "bookName_zh"
                book_names[sid] = book_names.get(sid, {})
                book_names[sid][key] = bn
                continue
            if sid not in skills:
                skills[sid] = {}
            if lang == "en":
                skills[sid]["name"] = get_child_str(entry, "name") or ""
                desc = get_child_str(entry, "desc")
                if desc:
                    skills[sid]["desc"] = desc
                # h-level descriptions
                h_levels = []
                for i in range(1, 31):
                    h = get_child_str(entry, f"h{i}")
                    if h:
                        h_levels.append(h)
                    else:
                        break
                if h_levels:
                    skills[sid]["h"] = h_levels
            else:
                skills[sid]["name_zh"] = get_child_str(entry, "name") or ""
                desc_zh = get_child_str(entry, "desc")
                if desc_zh:
                    skills[sid]["desc_zh"] = desc_zh

    # Map skill IDs to book/job names
    for sid, sk in skills.items():
        # Skill ID format: JJJJSSSS where J=job prefix
        job_prefix = sid[:3] if len(sid) >= 7 else sid[:len(sid) - 4] if len(sid) > 4 else "000"
        if job_prefix in book_names:
            if "bookName" in book_names[job_prefix]:
                sk["bookName"] = book_names[job_prefix]["bookName"]
            if "bookName_zh" in book_names[job_prefix]:
                sk["bookName_zh"] = book_names[job_prefix]["bookName_zh"]
        sk["job"] = job_prefix

    print(f"    {len(skills)} skills indexed")
    return skills


# ---------------------------------------------------------------------------
# Craft index
# ---------------------------------------------------------------------------
def build_craft_index() -> dict:
    print("  Building Craft index...")
    crafts = {}

    path = WZ_DIR / "Etc.wz" / "ItemMake.img.xml"
    root = parse_xml(path)
    if root is None:
        return crafts

    for station in root:
        if station.tag != "imgdir":
            continue
        station_id = station.get("name")
        for recipe in station:
            if recipe.tag != "imgdir":
                continue
            recipe_id = recipe.get("name")
            entry = {"station": station_id}
            entry["reqLevel"] = get_child_int(recipe, "reqLevel")
            entry["meso"] = get_child_int(recipe, "meso")
            entry["itemNum"] = get_child_int(recipe, "itemNum")
            entry["tuc"] = get_child_int(recipe, "tuc")

            recipe_dir = get_child_imgdir(recipe, "recipe")
            if recipe_dir is not None:
                materials = collect_item_entries(recipe_dir)
                if materials:
                    entry["recipe"] = materials

            reward_dir = get_child_imgdir(recipe, "randomReward")
            if reward_dir is not None:
                rewards = []
                for rw in reward_dir:
                    if rw.tag == "imgdir":
                        item_id = get_child_int(rw, "item")
                        num = get_child_int(rw, "itemNum")
                        prob = get_child_int(rw, "prob")
                        if item_id is not None:
                            rewards.append({"item": item_id, "itemNum": num, "prob": prob})
                if rewards:
                    entry["randomReward"] = rewards

            # Clean None values
            entry = {k: v for k, v in entry.items() if v is not None}
            crafts[recipe_id] = entry

    print(f"    {len(crafts)} craft recipes indexed")
    return crafts


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    start = time.time()
    print(f"Building WZ search index from {BASE_DIR.resolve()}")

    if not WZ_DIR.is_dir():
        print(f"ERROR: wz/ directory not found at {WZ_DIR.resolve()}", file=sys.stderr)
        sys.exit(1)

    index = {
        "_meta": {
            "built_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "base_dir": str(BASE_DIR.resolve()),
        },
        "npc": build_npc_index(),
        "item": build_item_index(),
        "quest": build_quest_index(),
        "map": build_map_index(),
        "mob": build_mob_index(),
        "skill": build_skill_index(),
        "craft": build_craft_index(),
    }

    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)

    elapsed = time.time() - start
    size_mb = INDEX_PATH.stat().st_size / 1024 / 1024
    print(f"\nIndex written to {INDEX_PATH} ({size_mb:.1f} MB) in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
