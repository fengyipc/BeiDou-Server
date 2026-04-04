#!/usr/bin/env python3
"""Search WZ game data by ID or name.

Run from the gms-server root:
    python .cursor/skills/wz-search/scripts/wz_search.py <command> --id <ID> | --name <keyword>

Commands: npc, item, quest, map, mob, skill, equip, craft
"""

import argparse
import json
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_DIR = Path(os.environ.get("WZ_BASE", "."))
WZ_DIR = BASE_DIR / "wz"
WZ_ZH_DIR = BASE_DIR / "wz-zh-CN"
INDEX_PATH = BASE_DIR / "tools" / "wz-search" / "wz-index.json"

_index_cache: dict | None = None


def load_index() -> dict:
    global _index_cache
    if _index_cache is not None:
        return _index_cache
    if not INDEX_PATH.exists():
        print(f"Index not found at {INDEX_PATH}. Run build_index.py first:", file=sys.stderr)
        print(f"  python .cursor/skills/wz-search/scripts/build_index.py", file=sys.stderr)
        sys.exit(1)
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        _index_cache = json.load(f)
    return _index_cache


def parse_xml(path: Path) -> ET.Element | None:
    try:
        return ET.parse(path).getroot()
    except ET.ParseError:
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
    result = []
    for child in elem:
        if child.tag == "int":
            try:
                result.append(int(child.get("value")))
            except (TypeError, ValueError):
                pass
    return result


def collect_item_entries(elem: ET.Element) -> list[dict]:
    items = []
    for child in elem:
        if child.tag == "imgdir":
            entry = {}
            for sub in child:
                if sub.tag == "int":
                    try:
                        entry[sub.get("name")] = int(sub.get("value"))
                    except (TypeError, ValueError):
                        pass
                elif sub.tag == "string":
                    entry[sub.get("name")] = sub.get("value")
            if entry:
                items.append(entry)
    return items


# ---------------------------------------------------------------------------
# Search helpers
# ---------------------------------------------------------------------------
def search_entries(section: str, entry_id: str | None, name_keyword: str | None,
                   limit: int) -> list[tuple[str, dict]]:
    """Return matching (id, data) tuples from the index section."""
    index = load_index()
    data = index.get(section, {})
    results = []

    if entry_id is not None:
        entry_id = str(entry_id)
        if entry_id in data:
            results.append((entry_id, data[entry_id]))
        return results

    if name_keyword is not None:
        kw_lower = name_keyword.lower()
        for eid, edata in data.items():
            name_en = edata.get("name", "").lower()
            name_zh = edata.get("name_zh", "").lower()
            street_en = edata.get("streetName", "").lower()
            street_zh = edata.get("streetName_zh", "").lower()
            map_name_en = edata.get("mapName", "").lower()
            map_name_zh = edata.get("mapName_zh", "").lower()
            searchable = f"{name_en}|{name_zh}|{street_en}|{street_zh}|{map_name_en}|{map_name_zh}"
            if kw_lower in searchable:
                results.append((eid, edata))
            if len(results) >= limit:
                break

    return results[:limit]


def search_entries_filtered(section: str, name_keyword: str | None, limit: int,
                            predicate) -> list[tuple[str, dict]]:
    """Like search_entries but with an additional filter predicate on the data dict."""
    index = load_index()
    data = index.get(section, {})
    results = []
    if name_keyword is None:
        return results
    kw_lower = name_keyword.lower()
    for eid, edata in data.items():
        if not predicate(edata):
            continue
        name_en = edata.get("name", "").lower()
        name_zh = edata.get("name_zh", "").lower()
        searchable = f"{name_en}|{name_zh}"
        if kw_lower in searchable:
            results.append((eid, edata))
        if len(results) >= limit:
            break
    return results


def resolve_name(section: str, entry_id) -> str:
    """Look up a name from the index for cross-reference display."""
    index = load_index()
    data = index.get(section, {})
    entry = data.get(str(entry_id), {})
    name_zh = entry.get("name_zh") or entry.get("mapName_zh", "")
    name_en = entry.get("name") or entry.get("mapName", "")
    if name_zh and name_en:
        return f"{name_zh} / {name_en}"
    return name_zh or name_en or str(entry_id)


# ---------------------------------------------------------------------------
# Formatters
# ---------------------------------------------------------------------------
def fmt_npc(eid: str, d: dict, detail: bool) -> str:
    lines = [f"[NPC {eid}] {d.get('name_zh', '')} / {d.get('name', '')}"]
    func_parts = []
    if d.get("func_zh"):
        func_parts.append(d["func_zh"])
    if d.get("func"):
        func_parts.append(d["func"])
    if func_parts:
        lines.append(f"  功能: {' / '.join(func_parts)}")

    maps = d.get("maps", [])
    if maps:
        map_strs = [f"{m} ({resolve_name('map', m)})" for m in maps[:10]]
        lines.append(f"  地图: {', '.join(map_strs)}")

    if detail:
        # Related quests (scan quest index for npc_start/npc_complete matching this NPC)
        index = load_index()
        related = []
        npc_id_int = int(eid) if eid.isdigit() else None
        if npc_id_int is not None:
            for qid, qdata in index.get("quest", {}).items():
                if qdata.get("npc_start") == npc_id_int or qdata.get("npc_complete") == npc_id_int:
                    qname = qdata.get("name_zh") or qdata.get("name", "")
                    role = []
                    if qdata.get("npc_start") == npc_id_int:
                        role.append("接")
                    if qdata.get("npc_complete") == npc_id_int:
                        role.append("交")
                    related.append(f"    {qid}: {qname} [{'/'.join(role)}]")
        if related:
            lines.append(f"  关联任务 ({len(related)}):")
            lines.extend(related[:20])
            if len(related) > 20:
                lines.append(f"    ... 共 {len(related)} 条")

        # Check if script file exists
        for scripts_dir in ["scripts-zh-CN/npc", "scripts/npc"]:
            script_path = BASE_DIR / scripts_dir / f"{eid}.js"
            if script_path.exists():
                lines.append(f"  脚本: {scripts_dir}/{eid}.js")

    return "\n".join(lines)


def fmt_item(eid: str, d: dict, detail: bool) -> str:
    lines = [f"[Item {eid}] {d.get('name_zh', '')} / {d.get('name', '')}"]
    cat = d.get("category", "")
    subcat = d.get("subcategory", "")
    cat_str = f"{cat}/{subcat}" if subcat else cat
    if cat_str:
        lines.append(f"  分类: {cat_str}")
    desc_zh = d.get("desc_zh", "")
    desc_en = d.get("desc", "")
    if desc_zh:
        lines.append(f"  描述(ZH): {desc_zh[:120]}")
    if desc_en:
        lines.append(f"  描述(EN): {desc_en[:120]}")

    if detail:
        item_detail = _load_item_detail(eid)
        if item_detail:
            for k, v in item_detail.items():
                lines.append(f"  {k}: {v}")

    return "\n".join(lines)


def _load_item_detail(item_id: str) -> dict:
    """Load price/spec from Item.wz for consumable or other item types."""
    result = {}
    padded = item_id.zfill(8)
    prefix = padded[:4]
    category_dirs = {
        "02": "Consume", "05": "Cash", "04": "Etc",
        "03": "Install", "50": "Pet",
    }
    cat_prefix = padded[:2]
    cat_dir = category_dirs.get(cat_prefix)
    if cat_dir:
        path = WZ_DIR / "Item.wz" / cat_dir / f"{prefix}.img.xml"
        root = parse_xml(path)
        if root is not None:
            # Try both padded (02000004) and unpadded (2000004)
            entry = get_child_imgdir(root, padded)
            if entry is None:
                entry = get_child_imgdir(root, item_id)
            if entry is not None:
                info = get_child_imgdir(entry, "info")
                if info is not None:
                    price = get_child_int(info, "price")
                    if price is not None:
                        result["price"] = price
                    slot_max = get_child_int(info, "slotMax")
                    if slot_max is not None:
                        result["slotMax"] = slot_max
                spec = get_child_imgdir(entry, "spec")
                if spec is not None:
                    for child in spec:
                        if child.tag == "int":
                            result[f"spec.{child.get('name')}"] = child.get("value")
    return result


def fmt_quest(eid: str, d: dict, detail: bool) -> str:
    lines = [f"[Quest {eid}] {d.get('name_zh', '')} / {d.get('name', '')}"]
    area_label = d.get("areaLabel", "")
    if area_label:
        lines.append(f"  区域: {area_label}")
    if d.get("parent"):
        lines.append(f"  系列: {d.get('parent_zh', '')} / {d.get('parent', '')}")
    if d.get("lvmin"):
        lines.append(f"  最低等级: {d['lvmin']}")
    if d.get("jobs"):
        lines.append(f"  职业限制: {d['jobs']}")

    npc_start = d.get("npc_start")
    npc_complete = d.get("npc_complete")
    if npc_start:
        lines.append(f"  接任务NPC: {npc_start} ({resolve_name('npc', npc_start)})")
    if npc_complete:
        lines.append(f"  交任务NPC: {npc_complete} ({resolve_name('npc', npc_complete)})")

    if d.get("prevQuests"):
        pq_strs = [f"{p['id']}(state={p.get('state')})" for p in d["prevQuests"]]
        lines.append(f"  前置任务: {', '.join(pq_strs)}")
    if d.get("nextQuest"):
        lines.append(f"  后续任务: {d['nextQuest']} ({resolve_name('quest', d['nextQuest'])})")

    if d.get("reward_exp"):
        lines.append(f"  奖励经验: {d['reward_exp']}")
    if d.get("reward_money"):
        lines.append(f"  奖励金币: {d['reward_money']}")
    if d.get("reward_items"):
        for ri in d["reward_items"]:
            item_name = resolve_name("item", ri["id"])
            lines.append(f"  奖励物品: {ri['id']} x{ri.get('count', 1)} ({item_name})")

    if detail:
        _append_quest_detail(eid, lines)

    return "\n".join(lines)


def _append_quest_detail(qid: str, lines: list[str]):
    """Load full Check/Act/Say detail for a quest."""
    # Check.img.xml — full requirements
    check_path = WZ_DIR / "Quest.wz" / "Check.img.xml"
    root = parse_xml(check_path)
    if root is not None:
        entry = get_child_imgdir(root, qid)
        if entry is not None:
            stage0 = get_child_imgdir(entry, "0")
            if stage0 is not None:
                items = get_child_imgdir(stage0, "item")
                if items is not None:
                    req_items = collect_item_entries(items)
                    for ri in req_items:
                        iname = resolve_name("item", ri.get("id", 0))
                        lines.append(f"  触发需要物品: {ri.get('id')} x{ri.get('count', 1)} ({iname})")
                mob_dir = get_child_imgdir(stage0, "mob")
                if mob_dir is not None:
                    for me in mob_dir:
                        if me.tag == "imgdir":
                            mid = get_child_int(me, "id")
                            cnt = get_child_int(me, "count")
                            if mid:
                                mname = resolve_name("mob", mid)
                                lines.append(f"  触发需要击杀: {mid} x{cnt} ({mname})")
            stage1 = get_child_imgdir(entry, "1")
            if stage1 is not None:
                items = get_child_imgdir(stage1, "item")
                if items is not None:
                    req_items = collect_item_entries(items)
                    for ri in req_items:
                        iname = resolve_name("item", ri.get("id", 0))
                        lines.append(f"  完成需要物品: {ri.get('id')} x{ri.get('count', 1)} ({iname})")
                mob_dir = get_child_imgdir(stage1, "mob")
                if mob_dir is not None:
                    for me in mob_dir:
                        if me.tag == "imgdir":
                            mid = get_child_int(me, "id")
                            cnt = get_child_int(me, "count")
                            if mid:
                                mname = resolve_name("mob", mid)
                                lines.append(f"  完成需要击杀: {mid} x{cnt} ({mname})")

    # Say.img.xml — dialogue summary
    say_path = WZ_ZH_DIR / "Quest.wz" / "Say.img.xml"
    if not say_path.exists():
        say_path = WZ_DIR / "Quest.wz" / "Say.img.xml"
    root = parse_xml(say_path)
    if root is not None:
        entry = get_child_imgdir(root, qid)
        if entry is not None:
            for stage in entry:
                if stage.tag != "imgdir":
                    continue
                stage_name = stage.get("name")
                label = "接任务" if stage_name == "0" else "交任务" if stage_name == "1" else f"阶段{stage_name}"
                dialogue_lines = []
                for child in stage:
                    if child.tag == "string":
                        text = child.get("value", "")
                        if text:
                            dialogue_lines.append(text[:100])
                if dialogue_lines:
                    lines.append(f"  对话({label}):")
                    for dl in dialogue_lines[:5]:
                        lines.append(f"    \"{dl}\"")
                    if len(dialogue_lines) > 5:
                        lines.append(f"    ... 共 {len(dialogue_lines)} 条")


def fmt_map(eid: str, d: dict, detail: bool) -> str:
    lines = [f"[Map {eid}] {d.get('mapName_zh', '')} / {d.get('mapName', '')}"]
    street_parts = []
    if d.get("streetName_zh"):
        street_parts.append(d["streetName_zh"])
    if d.get("streetName"):
        street_parts.append(d["streetName"])
    if street_parts:
        lines.append(f"  街道: {' / '.join(street_parts)}")
    if d.get("region"):
        lines.append(f"  区域: {d['region']}")

    if detail:
        _append_map_detail(eid, lines)

    return "\n".join(lines)


def _append_map_detail(map_id: str, lines: list[str]):
    """Load NPCs, mobs, portals from the actual map XML file."""
    padded = map_id.zfill(9)
    bucket = f"Map{padded[0]}"
    map_path = WZ_DIR / "Map.wz" / "Map" / bucket / f"{padded}.img.xml"
    if not map_path.exists():
        return

    root = parse_xml(map_path)
    if root is None:
        return

    info = get_child_imgdir(root, "info")
    if info is not None:
        town = get_child_int(info, "town")
        if town:
            lines.append(f"  城镇: 是")
        ret_map = get_child_int(info, "returnMap")
        if ret_map is not None and ret_map != 999999999:
            lines.append(f"  returnMap: {ret_map} ({resolve_name('map', ret_map)})")
        forced = get_child_int(info, "forcedReturn")
        if forced is not None and forced != 999999999:
            lines.append(f"  forcedReturn: {forced} ({resolve_name('map', forced)})")
        bgm = get_child_str(info, "bgm")
        if bgm:
            lines.append(f"  BGM: {bgm}")

    life = get_child_imgdir(root, "life")
    if life is not None:
        npcs = []
        mobs = []
        for spawn in life:
            if spawn.tag != "imgdir":
                continue
            stype = get_child_str(spawn, "type")
            sid = get_child_str(spawn, "id")
            if not sid:
                continue
            sid_clean = str(int(sid)) if sid.isdigit() else sid
            if stype == "n":
                npcs.append(sid_clean)
            elif stype == "m":
                mobs.append(sid_clean)
        if npcs:
            unique_npcs = list(dict.fromkeys(npcs))
            npc_strs = [f"{n} ({resolve_name('npc', n)})" for n in unique_npcs[:15]]
            lines.append(f"  NPC ({len(unique_npcs)}):")
            for ns in npc_strs:
                lines.append(f"    {ns}")
        if mobs:
            unique_mobs = list(dict.fromkeys(mobs))
            mob_strs = [f"{m} ({resolve_name('mob', m)})" for m in unique_mobs[:15]]
            lines.append(f"  怪物 ({len(unique_mobs)}):")
            for ms in mob_strs:
                lines.append(f"    {ms}")

    portal = get_child_imgdir(root, "portal")
    if portal is not None:
        portals = []
        for p in portal:
            if p.tag != "imgdir":
                continue
            tm = get_child_int(p, "tm")
            pn = get_child_str(p, "pn")
            if tm is not None and tm != 999999999:
                portals.append(f"{pn} -> {tm} ({resolve_name('map', tm)})")
        if portals:
            lines.append(f"  传送门 ({len(portals)}):")
            for ps in portals[:10]:
                lines.append(f"    {ps}")


def fmt_mob(eid: str, d: dict, detail: bool) -> str:
    lines = [f"[Mob {eid}] {d.get('name_zh', '')} / {d.get('name', '')}"]
    if d.get("level"):
        lines.append(f"  等级: {d['level']}")
    if d.get("maxHP"):
        lines.append(f"  HP: {d['maxHP']}")
    if d.get("exp"):
        lines.append(f"  EXP: {d['exp']}")

    if detail:
        stat_fields = [
            ("maxMP", "MP"), ("PADamage", "物理攻击"), ("PDDamage", "物理防御"),
            ("MADamage", "魔法攻击"), ("MDDamage", "魔法防御"),
            ("acc", "命中"), ("eva", "回避"), ("speed", "速度"),
            ("undead", "不死系"),
        ]
        for field, label in stat_fields:
            val = d.get(field)
            if val is not None:
                lines.append(f"  {label}: {val}")

        maps = d.get("maps", [])
        if maps:
            map_strs = [f"{m} ({resolve_name('map', m)})" for m in maps[:10]]
            lines.append(f"  出现地图 ({len(maps)}):")
            for ms in map_strs:
                lines.append(f"    {ms}")
            if len(maps) > 10:
                lines.append(f"    ... 共 {len(maps)} 张")

        drops = d.get("drops", [])
        if drops:
            drop_strs = [f"{dr} ({resolve_name('item', dr)})" for dr in drops[:15]]
            lines.append(f"  掉落物品 ({len(drops)}):")
            for ds in drop_strs:
                lines.append(f"    {ds}")
            if len(drops) > 15:
                lines.append(f"    ... 共 {len(drops)} 种")

    return "\n".join(lines)


def fmt_skill(eid: str, d: dict, detail: bool) -> str:
    lines = [f"[Skill {eid}] {d.get('name_zh', '')} / {d.get('name', '')}"]
    book_parts = []
    if d.get("bookName_zh"):
        book_parts.append(d["bookName_zh"])
    if d.get("bookName"):
        book_parts.append(d["bookName"])
    if book_parts:
        lines.append(f"  职业书: {' / '.join(book_parts)}")
    if d.get("job"):
        lines.append(f"  职业前缀: {d['job']}")

    desc_zh = d.get("desc_zh", "")
    desc_en = d.get("desc", "")
    if desc_zh:
        lines.append(f"  描述(ZH): {desc_zh[:150]}")
    if desc_en:
        lines.append(f"  描述(EN): {desc_en[:150]}")

    if detail:
        h_levels = d.get("h", [])
        if h_levels:
            lines.append(f"  等级属性:")
            for i, h in enumerate(h_levels, 1):
                lines.append(f"    Lv.{i}: {h}")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Equip: on-demand from Character.wz
# ---------------------------------------------------------------------------
def cmd_equip(args):
    if args.id:
        results = search_entries("item", args.id, None, args.limit)
    else:
        results = search_entries_filtered("item", args.name, args.limit,
                                          lambda d: d.get("category") == "Eqp")

    if not results:
        print("No equipment found.")
        return

    for eid, d in results:
        lines = [f"[Equip {eid}] {d.get('name_zh', '')} / {d.get('name', '')}"]
        if d.get("subcategory"):
            lines.append(f"  槽位: {d['subcategory']}")
        if d.get("desc"):
            lines.append(f"  描述(EN): {d['desc'][:120]}")
        if d.get("desc_zh"):
            lines.append(f"  描述(ZH): {d['desc_zh'][:120]}")

        if args.detail:
            detail = _load_equip_detail(eid)
            if detail:
                req_labels = {
                    "reqLevel": "等级", "reqSTR": "力量", "reqDEX": "敏捷",
                    "reqINT": "智力", "reqLUK": "运气", "reqJob": "职业",
                }
                inc_labels = {
                    "incSTR": "力量", "incDEX": "敏捷", "incINT": "智力", "incLUK": "运气",
                    "incPAD": "攻击力", "incMAD": "魔法攻击", "incPDD": "物理防御", "incMDD": "魔法防御",
                    "incMHP": "HP", "incMMP": "MP", "incACC": "命中", "incEVA": "回避",
                    "incJump": "跳跃", "incSpeed": "移速",
                }
                reqs = [(req_labels.get(k, k), v) for k, v in detail.items() if k.startswith("req")]
                incs = [(inc_labels.get(k, k), v) for k, v in detail.items() if k.startswith("inc")]
                if reqs:
                    lines.append(f"  需求: {', '.join(f'{l}:{v}' for l, v in reqs)}")
                if incs:
                    lines.append(f"  增益: {', '.join(f'{l}+{v}' for l, v in incs)}")
                if detail.get("tuc"):
                    lines.append(f"  可升级次数: {detail['tuc']}")
                if detail.get("price"):
                    lines.append(f"  价格: {detail['price']}")
                if detail.get("cash"):
                    lines.append(f"  现金装备: 是")

        if args.json:
            output = {"id": eid, **d}
            if args.detail:
                output["equip_detail"] = _load_equip_detail(eid)
            print(json.dumps(output, ensure_ascii=False))
        else:
            print("\n".join(lines))
            print()


def _load_equip_detail(item_id: str) -> dict:
    """Search Character.wz subdirectories for the equip file and extract stats."""
    char_wz = WZ_DIR / "Character.wz"
    if not char_wz.is_dir():
        return {}

    # Equipment ID format: SSSSSSSS where first 2-3 digits indicate slot
    # Build filename: zero-pad to 8 digits
    padded = item_id.zfill(8)
    filename = f"{padded}.img.xml"

    # Search all subdirectories
    for subdir in char_wz.iterdir():
        if not subdir.is_dir():
            continue
        candidate = subdir / filename
        if candidate.exists():
            return _parse_equip_info(candidate, padded)

    return {}


def _parse_equip_info(path: Path, item_id: str) -> dict:
    root = parse_xml(path)
    if root is None:
        return {}
    info = get_child_imgdir(root, "info")
    if info is None:
        return {}

    result = {}
    stat_fields = [
        "reqLevel", "reqSTR", "reqDEX", "reqINT", "reqLUK", "reqJob",
        "incSTR", "incDEX", "incINT", "incLUK",
        "incPDD", "incMDD", "incPAD", "incMAD",
        "incMHP", "incMMP", "incACC", "incEVA",
        "incJump", "incSpeed",
        "tuc", "price", "cash", "only", "tradeBlock",
    ]
    for field in stat_fields:
        val = get_child_int(info, field)
        if val is not None and val != 0:
            result[field] = val

    return result


# ---------------------------------------------------------------------------
# Craft
# ---------------------------------------------------------------------------
def cmd_craft(args):
    index = load_index()
    crafts = index.get("craft", {})

    results = []
    if args.item:
        item_id = str(args.item)
        # Search by recipe ID or by output item
        for rid, rdata in crafts.items():
            rid_clean = rid.lstrip("0") if rid.startswith("0") else rid
            item_clean = item_id.lstrip("0") if item_id.startswith("0") else item_id
            if rid_clean == item_clean or rid == item_id:
                results.append((rid, rdata))
            elif rdata.get("randomReward"):
                for rw in rdata["randomReward"]:
                    if str(rw.get("item")) == item_id or str(rw.get("item")) == item_clean:
                        results.append((rid, rdata))
                        break
            if len(results) >= args.limit:
                break

    if not results:
        print("No craft recipes found.")
        return

    for rid, rdata in results:
        if args.json:
            print(json.dumps({"recipe_id": rid, **rdata}, ensure_ascii=False))
        else:
            lines = [f"[Craft {rid}]"]
            if rdata.get("reqLevel"):
                lines.append(f"  所需等级: {rdata['reqLevel']}")
            if rdata.get("meso"):
                lines.append(f"  所需金币: {rdata['meso']}")
            if rdata.get("itemNum"):
                lines.append(f"  产出数量: {rdata['itemNum']}")
            if rdata.get("tuc"):
                lines.append(f"  升级次数: {rdata['tuc']}")

            if rdata.get("recipe"):
                lines.append(f"  原料:")
                for mat in rdata["recipe"]:
                    mat_id = mat.get("id") or mat.get("item") or 0
                    iname = resolve_name("item", mat_id)
                    lines.append(f"    {mat_id} x{mat.get('count', 1)} ({iname})")

            if rdata.get("randomReward"):
                lines.append(f"  随机产物:")
                for rw in rdata["randomReward"]:
                    iname = resolve_name("item", rw.get("item", 0))
                    lines.append(f"    {rw['item']} x{rw.get('itemNum', 1)} (概率:{rw.get('prob', '?')}) ({iname})")

            print("\n".join(lines))
            print()


# ---------------------------------------------------------------------------
# Generic command handler for npc/item/quest/map/mob/skill
# ---------------------------------------------------------------------------
def cmd_generic(args, section: str, formatter):
    results = search_entries(section, args.id, args.name, args.limit)
    if not results:
        print(f"No {section} results found.")
        return

    for eid, d in results:
        if args.json:
            print(json.dumps({"id": eid, **d}, ensure_ascii=False))
        else:
            print(formatter(eid, d, args.detail))
            print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Search WZ game data")
    sub = parser.add_subparsers(dest="command")

    common_args = [
        (["--id"], {"type": str, "default": None, "help": "Exact ID lookup"}),
        (["--name"], {"type": str, "default": None, "help": "Name substring search (EN/ZH)"}),
        (["--limit"], {"type": int, "default": 10, "help": "Max results (default 10)"}),
        (["--json"], {"action": "store_true", "help": "Output JSON format"}),
        (["--detail"], {"action": "store_true", "help": "Load detailed info from WZ files"}),
    ]

    for cmd_name in ("npc", "item", "quest", "map", "mob", "skill"):
        p = sub.add_parser(cmd_name, help=f"Search {cmd_name}")
        for flags, kwargs in common_args:
            p.add_argument(*flags, **kwargs)

    p_equip = sub.add_parser("equip", help="Search equipment with stats")
    for flags, kwargs in common_args:
        p_equip.add_argument(*flags, **kwargs)

    p_craft = sub.add_parser("craft", help="Search craft recipes")
    p_craft.add_argument("--item", type=str, default=None, help="Item ID (recipe or output)")
    p_craft.add_argument("--limit", type=int, default=10, help="Max results")
    p_craft.add_argument("--json", action="store_true", help="Output JSON format")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    formatters = {
        "npc": fmt_npc,
        "item": fmt_item,
        "quest": fmt_quest,
        "map": fmt_map,
        "mob": fmt_mob,
        "skill": fmt_skill,
    }

    if args.command in formatters:
        if not args.id and not args.name:
            print(f"Error: --id or --name required for {args.command}", file=sys.stderr)
            sys.exit(1)
        cmd_generic(args, args.command, formatters[args.command])
    elif args.command == "equip":
        if not args.id and not args.name:
            print("Error: --id or --name required for equip", file=sys.stderr)
            sys.exit(1)
        cmd_equip(args)
    elif args.command == "craft":
        if not args.item:
            print("Error: --item required for craft", file=sys.stderr)
            sys.exit(1)
        cmd_craft(args)


if __name__ == "__main__":
    main()
