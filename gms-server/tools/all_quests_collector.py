#!/usr/bin/env python3
"""
Collect ALL quests from WZ data, grouped by QuestCategory area.
Parses QuestInfo, Check, Act, NPC/Map strings, and NPC locations.
Includes date-limited / event / medal / party quests with special tags.
Filters adventurer-accessible quests only.
Outputs: JSON data, Markdown summary, HTML interactive quest map.
"""

import xml.etree.ElementTree as ET
import json
import os
import sys
import html as html_lib
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZH_DIR = os.path.join(BASE_DIR, "wz-zh-CN")
EN_DIR = os.path.join(BASE_DIR, "wz")

# ---------------------------------------------------------------------------
# Area definitions from QuestCategory.img.xml
# ---------------------------------------------------------------------------
ALL_AREAS = {
    6: "失去记忆的英雄",
    10: "职业",
    15: "冒险骑士团",
    20: "彩虹岛",
    23: "明珠港",
    24: "射手村",
    25: "勇士部落",
    26: "魔法密林",
    27: "废弃都市",
    28: "诺特勒斯",
    29: "林中之城",
    30: "黄金海岸与婚礼村",
    31: "未来之城",
    32: "新加坡",
    33: "天空之城",
    34: "冰峰雪域",
    35: "水下世界",
    36: "新叶城",
    37: "玩具城",
    38: "地球防御本部",
    39: "童话村",
    40: "日本",
    41: "神木村",
    42: "阿里安特",
    43: "玛加提亚",
    44: "武陵桃园",
    45: "东方神州",
    46: "时间神殿",
    47: "组队任务",
    48: "海外旅游",
    49: "马来西亚",
    50: "活动",
    51: "勋章",
}

SPECIAL_TAG_AREAS = {47, 50, 51}

AREA_DISPLAY_ORDER = [
    20, 23, 24, 25, 26, 27, 28, 29, 30,
    33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45,
    31, 32, 46, 48, 49,
    6, 10, 15,
    47, 50, 51,
    -1,
]

AREA_COLORS = {
    6: "#9b59b6", 10: "#1abc9c", 15: "#e67e22",
    20: "#2ecc71", 23: "#4A90D9", 24: "#27AE60", 25: "#E67E22",
    26: "#8E44AD", 27: "#C0392B", 28: "#2980B9", 29: "#16A085",
    30: "#F39C12", 31: "#3498db", 32: "#e74c3c", 33: "#9b59b6",
    34: "#1abc9c", 35: "#2980b9", 36: "#27ae60", 37: "#e91e63",
    38: "#ff5722", 39: "#8bc34a", 40: "#ff9800", 41: "#4caf50",
    42: "#ff5722", 43: "#607d8b", 44: "#795548", 45: "#f44336",
    46: "#673ab7", 47: "#00bcd4", 48: "#3f51b5", 49: "#009688",
    50: "#ff6f00", 51: "#ffd700", -1: "#757575",
}

# ---------------------------------------------------------------------------
# Adventurer jobs
# ---------------------------------------------------------------------------
NON_ADVENTURER_JOB_RANGES = [
    (1000, 1999),  # KoC
    (2000, 2999),  # Aran / Evan
    (3000, 3999),  # Resistance
]


def is_adventurer_job(job_id):
    for lo, hi in NON_ADVENTURER_JOB_RANGES:
        if lo <= job_id <= hi:
            return False
    return True


def get_job_restriction_text(jobs):
    if not jobs:
        return "所有职业"
    adv_jobs = [j for j in jobs if is_adventurer_job(j)]
    if not adv_jobs:
        return "非冒险家专属"
    base_classes = set()
    for j in adv_jobs:
        if j == 0:
            base_classes.add("初心者")
        elif 100 <= j <= 132:
            base_classes.add("战士系")
        elif 200 <= j <= 232:
            base_classes.add("魔法师系")
        elif 300 <= j <= 322:
            base_classes.add("弓箭手系")
        elif 400 <= j <= 422:
            base_classes.add("飞侠系")
        elif 500 <= j <= 522:
            base_classes.add("海盗系")
    if len(base_classes) >= 5 and "初心者" not in base_classes:
        return "所有职业"
    if len(base_classes) >= 6:
        return "所有职业"
    ordered = ["初心者", "战士系", "魔法师系", "弓箭手系", "飞侠系", "海盗系"]
    return ", ".join(c for c in ordered if c in base_classes)


# ---------------------------------------------------------------------------
# WZ loaders (unchanged from before)
# ---------------------------------------------------------------------------

def parse_xml(path):
    try:
        return ET.parse(path).getroot()
    except Exception as e:
        print(f"[WARN] Failed to parse {path}: {e}", file=sys.stderr)
        return None


def load_npc_names():
    npc_zh, npc_en = {}, {}
    root = parse_xml(os.path.join(ZH_DIR, "String.wz", "Npc.img.xml"))
    if root is not None:
        for node in root:
            nid = node.get("name")
            for child in node:
                if child.get("name") == "name":
                    npc_zh[int(nid)] = child.get("value", "")
    root = parse_xml(os.path.join(EN_DIR, "String.wz", "Npc.img.xml"))
    if root is not None:
        for node in root:
            nid = node.get("name")
            for child in node:
                if child.get("name") == "name":
                    npc_en[int(nid)] = child.get("value", "")
    return npc_zh, npc_en


def load_npc_locations():
    loc = {}
    root = parse_xml(os.path.join(EN_DIR, "Etc.wz", "NpcLocation.img.xml"))
    if root is None:
        root = parse_xml(os.path.join(ZH_DIR, "Etc.wz", "NpcLocation.img.xml"))
    if root is not None:
        for node in root:
            nid = int(node.get("name"))
            maps = []
            for child in node:
                if child.tag == "int":
                    maps.append(int(child.get("value", "0")))
            if maps:
                loc[nid] = maps
    return loc


def load_map_names():
    maps_zh = {}
    root = parse_xml(os.path.join(ZH_DIR, "String.wz", "Map.img.xml"))
    if root is not None:
        for region in root:
            for mapnode in region:
                mname = mapnode.get("name", "")
                if not mname.isdigit():
                    continue
                mid = int(mname)
                street = ""
                name = ""
                for child in mapnode:
                    if child.get("name") == "streetName":
                        street = child.get("value", "")
                    elif child.get("name") == "mapName":
                        name = child.get("value", "")
                maps_zh[mid] = {"street": street, "map": name}
    return maps_zh


def load_mob_names():
    mob_zh = {}
    root = parse_xml(os.path.join(ZH_DIR, "String.wz", "Mob.img.xml"))
    if root is not None:
        for node in root:
            mid = int(node.get("name"))
            for child in node:
                if child.get("name") == "name":
                    mob_zh[mid] = child.get("value", "")
    return mob_zh


def load_item_names():
    item_zh = {}
    for fname in ["Eqp.img.xml", "Consume.img.xml", "Etc.img.xml",
                   "Cash.img.xml", "Ins.img.xml", "Pet.img.xml"]:
        path = os.path.join(ZH_DIR, "String.wz", fname)
        if not os.path.exists(path):
            continue
        root = parse_xml(path)
        if root is None:
            continue
        _collect_item_names(root, item_zh)
    return item_zh


def _collect_item_names(node, result):
    if node.tag == "imgdir":
        name_attr = node.get("name", "")
        if name_attr.isdigit():
            iid = int(name_attr)
            for child in node:
                if child.get("name") == "name":
                    result[iid] = child.get("value", "")
                    return
        for child in node:
            _collect_item_names(child, result)


def load_quest_info():
    quests = {}
    root = parse_xml(os.path.join(ZH_DIR, "Quest.wz", "QuestInfo.img.xml"))
    if root is None:
        return quests
    for node in root:
        qid = int(node.get("name"))
        q = {"id": qid, "name": "", "parent": "", "area": -1, "autoStart": False}
        for child in node:
            cname = child.get("name")
            if cname == "name":
                q["name"] = child.get("value", "")
            elif cname == "parent":
                q["parent"] = child.get("value", "")
            elif cname == "area":
                q["area"] = int(child.get("value", "-1"))
            elif cname == "autoStart":
                q["autoStart"] = child.get("value", "0") == "1"
            elif cname == "0":
                q["summary0"] = child.get("value", "")
            elif cname == "1":
                q["summary1"] = child.get("value", "")
            elif cname == "2":
                q["summary2"] = child.get("value", "")
        quests[qid] = q
    return quests


def load_quest_check():
    checks = {}
    root = parse_xml(os.path.join(ZH_DIR, "Quest.wz", "Check.img.xml"))
    if root is None:
        root = parse_xml(os.path.join(EN_DIR, "Quest.wz", "Check.img.xml"))
    if root is None:
        return checks
    for node in root:
        qid = int(node.get("name"))
        start_check = {}
        end_check = {}
        for phase in node:
            pname = phase.get("name")
            data = _parse_check_phase(phase)
            if pname == "0":
                start_check = data
            elif pname == "1":
                end_check = data
        checks[qid] = {"start": start_check, "end": end_check}
    return checks


def _parse_check_phase(node):
    data = {}
    for child in node:
        cname = child.get("name")
        if cname == "npc":
            data["npc"] = int(child.get("value", "0"))
        elif cname == "lvmin":
            data["lvmin"] = int(child.get("value", "0"))
        elif cname == "lvmax":
            data["lvmax"] = int(child.get("value", "0"))
        elif cname == "start":
            data["date_start"] = child.get("value", "")
        elif cname == "end":
            data["date_end"] = child.get("value", "")
        elif cname == "interval":
            data["interval"] = int(child.get("value", "0"))
        elif cname == "job":
            jobs = []
            for jnode in child:
                jobs.append(int(jnode.get("value", "0")))
            data["jobs"] = jobs
        elif cname == "quest":
            for qnode in child:
                pq = {}
                for qchild in qnode:
                    if qchild.get("name") == "id":
                        pq["id"] = int(qchild.get("value", "0"))
                    elif qchild.get("name") == "state":
                        pq["state"] = int(qchild.get("value", "0"))
                data.setdefault("prereq_quests", []).append(pq)
        elif cname == "item":
            items = []
            for inode in child:
                itm = {}
                for ichild in inode:
                    if ichild.get("name") == "id":
                        itm["id"] = int(ichild.get("value", "0"))
                    elif ichild.get("name") == "count":
                        itm["count"] = int(ichild.get("value", "0"))
                items.append(itm)
            data["items"] = items
        elif cname == "mob":
            mobs = []
            for mnode in child:
                mob = {}
                for mchild in mnode:
                    if mchild.get("name") == "id":
                        mob["id"] = int(mchild.get("value", "0"))
                    elif mchild.get("name") == "count":
                        mob["count"] = int(mchild.get("value", "0"))
                mobs.append(mob)
            data["mobs"] = mobs
    return data


def load_quest_act():
    acts = {}
    root = parse_xml(os.path.join(ZH_DIR, "Quest.wz", "Act.img.xml"))
    if root is None:
        root = parse_xml(os.path.join(EN_DIR, "Quest.wz", "Act.img.xml"))
    if root is None:
        return acts
    for node in root:
        qid = int(node.get("name"))
        start_act = {}
        end_act = {}
        for phase in node:
            pname = phase.get("name")
            data = _parse_act_phase(phase)
            if pname == "0":
                start_act = data
            elif pname == "1":
                end_act = data
        acts[qid] = {"start": start_act, "end": end_act}
    return acts


def _parse_act_phase(node):
    data = {}
    for child in node:
        cname = child.get("name")
        if cname == "exp":
            data["exp"] = int(child.get("value", "0"))
        elif cname == "money":
            data["money"] = int(child.get("value", "0"))
        elif cname == "pop":
            data["fame"] = int(child.get("value", "0"))
        elif cname == "nextQuest":
            data["nextQuest"] = int(child.get("value", "0"))
        elif cname == "npc":
            data["npc"] = int(child.get("value", "0"))
        elif cname == "lvmin":
            data["lvmin"] = int(child.get("value", "0"))
        elif cname == "item":
            items = []
            for inode in child:
                itm = {}
                for ichild in inode:
                    icname = ichild.get("name")
                    if icname == "id":
                        itm["id"] = int(ichild.get("value", "0"))
                    elif icname == "count":
                        itm["count"] = int(ichild.get("value", "0"))
                    elif icname == "prop":
                        itm["prop"] = int(ichild.get("value", "0"))
                    elif icname == "gender":
                        itm["gender"] = int(ichild.get("value", "0"))
                    elif icname == "job":
                        itm["job"] = int(ichild.get("value", "0"))
                    elif icname == "dateExpire":
                        itm["dateExpire"] = ichild.get("value", "")
                items.append(itm)
            data["items"] = items
        elif cname == "skill":
            skills = []
            for snode in child:
                sk = {}
                for schild in snode:
                    if schild.get("name") == "id":
                        sk["id"] = int(schild.get("value", "0"))
                    elif schild.get("name") == "masterLevel":
                        sk["masterLevel"] = int(schild.get("value", "0"))
                    elif schild.get("name") == "skillLevel":
                        sk["skillLevel"] = int(schild.get("value", "0"))
                skills.append(sk)
            data["skills"] = skills
    return data


# ---------------------------------------------------------------------------
# Classification helpers
# ---------------------------------------------------------------------------

def has_date_restriction(check_data):
    sc = check_data.get("start", {})
    return bool(sc.get("date_start") or sc.get("date_end"))


def is_adventurer_accessible(check_data):
    sc = check_data.get("start", {})
    jobs = sc.get("jobs")
    if jobs is None:
        return True
    return any(is_adventurer_job(j) for j in jobs)


def clean_ms_text(text):
    """Strip MapleStory formatting codes for readable display."""
    import re
    if not text:
        return ""
    t = text.replace("\\r\\n", "\n").replace("\\n", "\n")
    t = t.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    t = re.sub(r'#[bknrpge]', '', t)
    t = re.sub(r'#[fivdolsqcwBW]\d*', '', t)
    t = re.sub(r'#[pmtci][^#]*#', '', t)
    t = re.sub(r'#[A-Z]', '', t)
    t = re.sub(r'\s*\n\s*\n\s*', '\n', t)
    return t.strip()


def classify_quest(area_code, date_restricted):
    tags = []
    if date_restricted:
        tags.append("限时")
    if area_code == 50:
        tags.append("活动")
    if area_code == 51:
        tags.append("勋章")
    if area_code == 47:
        tags.append("组队任务")
    return tags


# ---------------------------------------------------------------------------
# Quest chain builder
# ---------------------------------------------------------------------------

def build_quest_chains(quests, acts, checks):
    next_map = {}
    prev_map = defaultdict(list)

    for qid, act in acts.items():
        nq = act.get("end", {}).get("nextQuest")
        if nq and nq in quests:
            next_map[qid] = nq
            prev_map[nq].append(qid)
        nq = act.get("start", {}).get("nextQuest")
        if nq and nq in quests and qid not in next_map:
            next_map[qid] = nq
            prev_map[nq].append(qid)

    for qid, check in checks.items():
        if qid not in quests:
            continue
        prereqs = check.get("start", {}).get("prereq_quests", [])
        for pq in prereqs:
            pid = pq.get("id")
            state = pq.get("state", 0)
            if pid and pid in quests and state == 2:
                if pid not in next_map:
                    next_map[pid] = qid

    chains = []
    visited = set()

    def find_chain_root(qid):
        seen = {qid}
        current = qid
        while current in prev_map:
            parents = [p for p in prev_map[current] if p in quests]
            if not parents:
                break
            parent = parents[0]
            if parent in seen:
                break
            seen.add(parent)
            current = parent
        return current

    def walk_chain(start):
        chain = []
        current = start
        seen = set()
        while current and current not in seen:
            if current in quests:
                chain.append(current)
            seen.add(current)
            current = next_map.get(current)
        return chain

    for qid in sorted(quests.keys()):
        if qid in visited:
            continue
        root = find_chain_root(qid)
        if root in visited:
            continue
        chain = walk_chain(root)
        if not chain:
            continue
        for c in chain:
            visited.add(c)
        chains.append(chain)

    for qid in sorted(quests.keys()):
        if qid not in visited:
            chains.append([qid])
            visited.add(qid)

    return chains


# ---------------------------------------------------------------------------
# NPC / map resolvers
# ---------------------------------------------------------------------------

def resolve_npc_info(npc_id, npc_zh, npc_en, npc_locs, maps_zh):
    return {
        "id": npc_id,
        "name_zh": npc_zh.get(npc_id, ""),
        "name_en": npc_en.get(npc_id, ""),
        "locations": [
            {"id": mid, "street": maps_zh.get(mid, {}).get("street", ""),
             "name": maps_zh.get(mid, {}).get("map", "")}
            for mid in npc_locs.get(npc_id, [])
        ],
    }


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    print("Loading WZ data...", file=sys.stderr)
    npc_zh, npc_en = load_npc_names()
    npc_locs = load_npc_locations()
    maps_zh = load_map_names()
    mob_names = load_mob_names()
    item_names = load_item_names()
    quest_info = load_quest_info()
    quest_check = load_quest_check()
    quest_act = load_quest_act()
    print(f"  Total quests in WZ: {len(quest_info)}, NPCs: {len(npc_zh)}, Maps: {len(maps_zh)}", file=sys.stderr)

    # -- collect all quests, tag them --
    all_quests = {}
    stats = {"total": 0, "excluded_job": 0, "date_limited": 0}

    for qid, qi in quest_info.items():
        area = qi.get("area", -1)
        check = quest_check.get(qid, {"start": {}, "end": {}})

        if not is_adventurer_accessible(check):
            stats["excluded_job"] += 1
            continue

        date_restricted = has_date_restriction(check)
        if date_restricted:
            stats["date_limited"] += 1

        qi["_tags"] = classify_quest(area, date_restricted)
        all_quests[qid] = qi
        stats["total"] += 1

    print(f"  Adventurer-accessible: {stats['total']} "
          f"(excluded {stats['excluded_job']} non-adventurer, "
          f"{stats['date_limited']} have date tags)", file=sys.stderr)

    # -- build chains --
    chains = build_quest_chains(all_quests, quest_act, quest_check)
    chain_map = {}
    for chain in chains:
        cname = all_quests.get(chain[0], {}).get("parent", "") \
                or all_quests.get(chain[0], {}).get("name", "")
        for idx, qid in enumerate(chain):
            chain_map[qid] = {
                "chain_name": cname,
                "position": idx + 1,
                "total": len(chain),
                "chain": chain,
            }

    # -- build result entries --
    result = []
    for qid in sorted(all_quests.keys()):
        qi = all_quests[qid]
        check = quest_check.get(qid, {"start": {}, "end": {}})
        act = quest_act.get(qid, {"start": {}, "end": {}})
        sc = check.get("start", {})
        ec = check.get("end", {})
        sa = act.get("start", {})
        ea = act.get("end", {})

        start_npc_id = sc.get("npc") or sa.get("npc")
        end_npc_id = ec.get("npc")
        start_npc = resolve_npc_info(start_npc_id, npc_zh, npc_en, npc_locs, maps_zh) if start_npc_id else None
        end_npc = resolve_npc_info(end_npc_id, npc_zh, npc_en, npc_locs, maps_zh) if end_npc_id else None

        jobs = sc.get("jobs")

        kill_reqs = [
            {"id": m.get("id", 0),
             "name": mob_names.get(m.get("id", 0), f"Mob#{m.get('id',0)}"),
             "count": m.get("count", 0)}
            for m in ec.get("mobs", [])
        ]
        collect_reqs = [
            {"id": i.get("id", 0),
             "name": item_names.get(i.get("id", 0), f"Item#{i.get('id',0)}"),
             "count": i.get("count", 0)}
            for i in ec.get("items", [])
        ]
        rewards_items = [
            {"id": i.get("id", 0),
             "name": item_names.get(i.get("id", 0), f"Item#{i.get('id',0)}"),
             "count": i.get("count", 0), "prop": i.get("prop", -1)}
            for i in ea.get("items", [])
        ]

        ci = chain_map.get(qid, {})
        area_code = qi.get("area", -1)

        desc_before = clean_ms_text(qi.get("summary0", ""))
        desc_progress = clean_ms_text(qi.get("summary1", ""))
        desc_done = clean_ms_text(qi.get("summary2", ""))

        entry = {
            "id": qid,
            "name": qi.get("name", ""),
            "parent": qi.get("parent", ""),
            "area_code": area_code,
            "area_name": ALL_AREAS.get(area_code, f"未知({area_code})"),
            "tags": qi.get("_tags", []),
            "lvmin": sc.get("lvmin", 0),
            "lvmax": sc.get("lvmax", 0),
            "job_restriction": get_job_restriction_text(jobs),
            "jobs_raw": jobs,
            "autoStart": qi.get("autoStart", False),
            "interval": sc.get("interval"),
            "start_npc": start_npc,
            "end_npc": end_npc,
            "prereq_quests": sc.get("prereq_quests", []),
            "kill_requirements": kill_reqs,
            "collect_requirements": collect_reqs,
            "description": {
                "before": desc_before,
                "in_progress": desc_progress,
                "completed": desc_done,
            },
            "rewards": {
                "exp": ea.get("exp", 0),
                "money": ea.get("money", 0),
                "fame": ea.get("fame", 0),
                "items": rewards_items,
            },
            "next_quest": ea.get("nextQuest") or sa.get("nextQuest"),
            "chain": {
                "chain_name": ci.get("chain_name", qi.get("name", "")),
                "position": ci.get("position", 1),
                "total": ci.get("total", 1),
                "chain_quest_ids": ci.get("chain", [qid]),
            },
        }
        result.append(entry)

    # -- area statistics --
    by_area = defaultdict(list)
    for e in result:
        by_area[e["area_code"]].append(e)

    print(f"  Areas with quests: {len(by_area)}", file=sys.stderr)
    for ac in AREA_DISPLAY_ORDER:
        if ac in by_area:
            print(f"    {ALL_AREAS.get(ac, f'未知({ac})')}: {len(by_area[ac])}", file=sys.stderr)

    # -- outputs --
    os.makedirs(os.path.join(BASE_DIR, "docs"), exist_ok=True)

    json_path = os.path.join(BASE_DIR, "docs", "all_quests_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  JSON: {json_path}", file=sys.stderr)

    md_path = os.path.join(BASE_DIR, "docs", "all_quests_summary.md")
    generate_markdown(result, chains, all_quests, item_names, md_path)
    print(f"  Markdown: {md_path}", file=sys.stderr)

    html_path = os.path.join(BASE_DIR, "docs", "all_quests_map.html")
    generate_html(result, chains, all_quests, html_path)
    print(f"  HTML: {html_path}", file=sys.stderr)

    print("Done!", file=sys.stderr)


# ---------------------------------------------------------------------------
# Markdown generator
# ---------------------------------------------------------------------------

def generate_markdown(result, chains, all_quests, item_names, md_path):
    by_area = defaultdict(list)
    for e in result:
        by_area[e["area_code"]].append(e)

    lines = []
    lines.append("# 冒险岛 全区域任务总览\n")
    lines.append(f"共收录 **{len(result)}** 个任务，覆盖 **{len(by_area)}** 个区域。\n")
    lines.append("筛选条件：冒险家五大职业可接取。限时/活动/勋章/组队任务已标注分类。\n")

    # -- TOC --
    lines.append("## 目录\n")

    region_groups = [
        ("金银岛", [20, 23, 24, 25, 26, 27, 28, 29, 30]),
        ("天空之城 & 冰雪", [33, 34, 35]),
        ("新叶城 & 玩具城", [36, 37, 38, 39]),
        ("日本 & 中东 & 中国", [40, 41, 42, 43, 44, 45]),
        ("其他区域", [31, 32, 46, 48, 49]),
        ("职业 & 特殊", [6, 10, 15]),
        ("特殊分类", [47, 50, 51]),
    ]

    for gname, area_codes in region_groups:
        area_list = [(ac, by_area[ac]) for ac in area_codes if ac in by_area]
        if not area_list:
            continue
        total = sum(len(v) for _, v in area_list)
        lines.append(f"### {gname} ({total})")
        for ac, entries in area_list:
            aname = ALL_AREAS.get(ac, f"未知({ac})")
            tag = ""
            if ac == 50:
                tag = " ⚡活动"
            elif ac == 51:
                tag = " 🏅勋章"
            elif ac == 47:
                tag = " 👥组队"
            lines.append(f"- [{aname}](#{aname}) ({len(entries)}个任务){tag}")
    lines.append("")

    # unlisted areas
    listed = set()
    for _, acs in region_groups:
        listed.update(acs)
    unlisted = sorted(ac for ac in by_area if ac not in listed)
    if unlisted:
        lines.append("### 未分类")
        for ac in unlisted:
            aname = ALL_AREAS.get(ac, f"未知({ac})")
            lines.append(f"- [{aname}](#{aname}) ({len(by_area[ac])}个任务)")
        lines.append("")

    # -- per-area sections --
    ordered_areas = []
    for _, acs in region_groups:
        ordered_areas.extend(acs)
    ordered_areas.extend(unlisted)

    for ac in ordered_areas:
        if ac not in by_area:
            continue
        aname = ALL_AREAS.get(ac, f"未知({ac})")
        entries = sorted(by_area[ac], key=lambda x: (x["lvmin"], x["id"]))

        area_tag = ""
        if ac == 50:
            area_tag = " ⚡"
        elif ac == 51:
            area_tag = " 🏅"
        elif ac == 47:
            area_tag = " 👥"

        lines.append(f"## {aname}{area_tag}\n")

        seen_chains = set()
        for entry in entries:
            ci = entry["chain"]
            if ci["total"] > 1:
                chain_key = tuple(ci["chain_quest_ids"])
                if chain_key in seen_chains:
                    continue
                seen_chains.add(chain_key)
                lines.append(f"### 📋 任务链：{ci['chain_name']} ({ci['total']}个任务)\n")
                for idx, cqid in enumerate(ci["chain_quest_ids"]):
                    ce = next((e for e in result if e["id"] == cqid), None)
                    if ce:
                        _format_quest_md(lines, ce)
                lines.append("")
            else:
                _format_quest_md(lines, entry)

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def _format_quest_md(lines, entry):
    lvl = f"Lv.{entry['lvmin']}" if entry['lvmin'] else "Lv.?"
    if entry['lvmax']:
        lvl += f"~{entry['lvmax']}"

    npc_name = ""
    npc_loc = ""
    if entry["start_npc"]:
        npc_name = entry["start_npc"]["name_zh"] or entry["start_npc"]["name_en"]
        if entry["start_npc"]["locations"]:
            npc_loc = entry["start_npc"]["locations"][0]["name"]

    tag_str = ""
    if entry["tags"]:
        tag_str = " " + " ".join(f"[{t}]" for t in entry["tags"])

    lines.append(f"- **{entry['name']}** (ID:{entry['id']}) — {lvl}{tag_str}")

    detail_parts = []
    if npc_name:
        detail_parts.append(f"NPC: {npc_name}")
    if npc_loc:
        detail_parts.append(f"位置: {npc_loc}")
    if entry["job_restriction"] != "所有职业":
        detail_parts.append(f"职业: {entry['job_restriction']}")
    if entry.get("interval") is not None and entry["interval"] >= 0:
        detail_parts.append("🔄可重复" if entry["interval"] == 0
                            else f"🔄间隔{entry['interval']}分钟")
    if detail_parts:
        lines.append(f"  - {' | '.join(detail_parts)}")

    if entry["kill_requirements"]:
        kills = ", ".join(f"{m['name']}×{m['count']}" for m in entry["kill_requirements"])
        lines.append(f"  - 击杀: {kills}")
    if entry["collect_requirements"]:
        items = ", ".join(f"{i['name']}×{i['count']}" for i in entry["collect_requirements"])
        lines.append(f"  - 收集: {items}")

    rewards = []
    rw = entry["rewards"]
    if rw["exp"]:
        rewards.append(f"经验{rw['exp']}")
    if rw["money"]:
        rewards.append(f"金币{rw['money']}")
    if rw["fame"]:
        rewards.append(f"人气{rw['fame']}")
    for itm in rw.get("items", []):
        if itm["count"] > 0:
            rewards.append(f"{itm['name']}×{itm['count']}")
        elif itm["count"] < 0:
            rewards.append(f"回收{itm['name']}×{abs(itm['count'])}")
    if rewards:
        lines.append(f"  - 奖励: {', '.join(rewards)}")

    desc = entry.get("description", {})
    if desc.get("before"):
        first_line = desc["before"].split("\n")[0][:120]
        lines.append(f"  - 📝接受前: {first_line}")
    if desc.get("in_progress"):
        first_line = desc["in_progress"].split("\n")[0][:120]
        lines.append(f"  - 📝进行中: {first_line}")
    if desc.get("completed"):
        first_line = desc["completed"].split("\n")[0][:120]
        lines.append(f"  - 📝完成后: {first_line}")


# ---------------------------------------------------------------------------
# HTML generator
# ---------------------------------------------------------------------------

def generate_html(result, chains, all_quests, html_path):
    by_area = defaultdict(list)
    for e in result:
        by_area[e["area_code"]].append(e)

    total_quests = len(result)
    total_chains = len([c for c in chains if len(c) > 1])
    total_areas = len(by_area)
    date_limited = sum(1 for e in result if "限时" in e["tags"])
    event_cnt = sum(1 for e in result if e["area_code"] == 50)
    medal_cnt = sum(1 for e in result if e["area_code"] == 51)

    # area tabs order
    active_areas = [ac for ac in AREA_DISPLAY_ORDER if ac in by_area]
    extra = sorted(ac for ac in by_area if ac not in set(AREA_DISPLAY_ORDER))
    active_areas.extend(extra)

    quest_data_js = {e["id"]: e for e in result}

    h = []  # html parts

    h.append(f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>冒险岛全区域任务总览</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:#0a0e17;color:#e0e0e0;min-height:100vh}}
.header{{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:24px 40px;border-bottom:2px solid #e94560;text-align:center}}
.header h1{{color:#e94560;font-size:26px;margin-bottom:6px}}
.header .sub{{color:#888;font-size:13px}}
.stats{{display:flex;justify-content:center;gap:24px;padding:12px;background:#111827;border-bottom:1px solid #1f2937;flex-wrap:wrap}}
.stats .s{{text-align:center;min-width:60px}}
.stats .s .n{{font-size:22px;font-weight:bold;color:#e94560}}
.stats .s .l{{font-size:11px;color:#6b7280}}
.controls{{padding:12px 24px;background:#111827;border-bottom:1px solid #1f2937;display:flex;flex-wrap:wrap;gap:8px;align-items:center}}
.controls label{{color:#9ca3af;font-size:12px;margin-right:4px}}
.controls select,.controls input{{background:#1f2937;border:1px solid #374151;color:#e0e0e0;padding:5px 10px;border-radius:6px;font-size:12px}}
.controls input[type=text]{{width:180px}}
.tab-bar{{display:flex;overflow-x:auto;background:#111827;border-bottom:2px solid #1f2937;padding:0 12px}}
.tab-btn{{padding:10px 14px;cursor:pointer;border:none;background:transparent;color:#9ca3af;font-size:12px;border-bottom:3px solid transparent;transition:all .2s;white-space:nowrap}}
.tab-btn:hover{{color:#e0e0e0;background:#1f2937}}
.tab-btn.active{{color:#e94560;border-bottom-color:#e94560}}
.tab-btn .cnt{{background:#374151;padding:0 6px;border-radius:10px;font-size:10px;margin-left:4px}}
.tab-btn.active .cnt{{background:#e94560;color:#fff}}
.tab-btn .tag{{font-size:9px;margin-left:2px}}
.main{{display:flex;min-height:calc(100vh - 260px)}}
.qlist{{width:400px;min-width:360px;overflow-y:auto;border-right:1px solid #1f2937;background:#0d1117;max-height:calc(100vh - 260px)}}
.qi{{padding:10px 14px;border-bottom:1px solid #1a1f2e;cursor:pointer;transition:background .15s}}
.qi:hover{{background:#161b22}}
.qi.sel{{background:#1c2333;border-left:3px solid #e94560}}
.qi .qn{{font-weight:600;font-size:13px;color:#e0e0e0}}
.qi .qm{{font-size:11px;color:#6b7280;margin-top:2px;display:flex;gap:8px;flex-wrap:wrap}}
.qi .qm .lv{{color:#f59e0b}}
.qi .qm .npc{{color:#60a5fa}}
.qi .qm .badge{{padding:0 5px;border-radius:8px;font-size:10px}}
.qi .qm .b-chain{{background:#4338ca;color:#c7d2fe}}
.qi .qm .b-repeat{{background:#065f46;color:#6ee7b7}}
.qi .qm .b-date{{background:#7c2d12;color:#fdba74}}
.qi .qm .b-event{{background:#92400e;color:#fde68a}}
.qi .qm .b-medal{{background:#78350f;color:#fcd34d}}
.qi .qm .b-party{{background:#164e63;color:#67e8f9}}
.dpanel{{flex:1;overflow-y:auto;padding:24px;max-height:calc(100vh - 260px)}}
.dpanel .empty{{text-align:center;padding:80px 20px;color:#4b5563}}
.dcard{{background:#161b22;border:1px solid #21262d;border-radius:12px;padding:20px;max-width:700px}}
.dcard h2{{color:#e94560;font-size:18px;margin-bottom:4px}}
.dcard .qid{{color:#6b7280;font-size:12px;margin-bottom:14px}}
.dsec{{margin-top:14px}}
.dsec h3{{color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;border-bottom:1px solid #21262d;padding-bottom:3px}}
.dr{{display:flex;gap:6px;margin:3px 0;font-size:13px}}
.dr .lb{{color:#6b7280;min-width:65px}}
.dr .vl{{color:#d1d5db}}
.rtag{{display:inline-block;padding:2px 7px;border-radius:6px;font-size:11px;margin:2px}}
.rtag.exp{{background:#3b2f1a;color:#fbbf24}}
.rtag.money{{background:#1a3b2f;color:#6ee7b7}}
.rtag.fame{{background:#3b1a2f;color:#f9a8d4}}
.rtag.item{{background:#1e3a5f;color:#93c5fd}}
.cview{{margin-top:16px;padding:14px;background:#0d1117;border:1px solid #21262d;border-radius:10px}}
.cview h3{{color:#c084fc;font-size:14px;margin-bottom:10px}}
.cflow{{display:flex;align-items:center;flex-wrap:wrap;gap:4px}}
.cnode{{background:#1e1e3f;border:1px solid #4338ca;border-radius:8px;padding:5px 10px;font-size:11px;color:#c7d2fe;cursor:pointer;transition:all .2s}}
.cnode:hover{{background:#2e2e5f}}
.cnode.cur{{background:#4338ca;color:#fff;font-weight:bold}}
.carr{{color:#4338ca;font-size:14px}}
.chain-panel{{padding:24px;overflow-y:auto;max-height:calc(100vh - 260px)}}
.cgrp{{background:#161b22;border:1px solid #21262d;border-radius:12px;padding:16px;margin-bottom:16px}}
.cgrp h3{{color:#c084fc;font-size:15px;margin-bottom:8px}}
.cgrp .cm{{color:#6b7280;font-size:11px;margin-bottom:8px}}
.chor{{display:flex;align-items:center;flex-wrap:wrap;gap:5px}}
.chn{{background:#1e1e3f;border:1px solid #4338ca;border-radius:8px;padding:8px 12px;min-width:100px;text-align:center;cursor:pointer;transition:all .2s}}
.chn:hover{{background:#2e2e5f;transform:translateY(-2px)}}
.chn .nn{{font-size:12px;color:#c7d2fe;font-weight:600}}
.chn .nl{{font-size:10px;color:#9ca3af;margin-top:2px}}
.chn .ni{{font-size:9px;color:#4b5563}}
.cha{{color:#6366f1;font-size:18px}}
.vtgl{{display:flex;gap:4px;margin-left:auto}}
.vb{{padding:5px 12px;border:1px solid #374151;background:#1f2937;color:#9ca3af;border-radius:6px;cursor:pointer;font-size:12px}}
.vb.act{{background:#e94560;color:#fff;border-color:#e94560}}
.hid{{display:none!important}}
.tag-filter-row{{display:flex;gap:6px;flex-wrap:wrap;align-items:center}}
.tag-filter-row label{{font-size:11px;color:#9ca3af;cursor:pointer;display:flex;align-items:center;gap:3px}}
.tag-filter-row input{{accent-color:#e94560}}
</style>
</head>
<body>
<div class="header">
<h1>🗺️ 冒险岛 全区域任务总览</h1>
<div class="sub">MapleStory v83 · 冒险家五大职业 · 含限时/活动/勋章/组队任务（已标注）</div>
</div>
<div class="stats">
<div class="s"><div class="n">{total_quests}</div><div class="l">任务总数</div></div>
<div class="s"><div class="n">{total_chains}</div><div class="l">任务链</div></div>
<div class="s"><div class="n">{total_areas}</div><div class="l">区域</div></div>
<div class="s"><div class="n">{date_limited}</div><div class="l">限时任务</div></div>
<div class="s"><div class="n">{event_cnt}</div><div class="l">活动任务</div></div>
<div class="s"><div class="n">{medal_cnt}</div><div class="l">勋章任务</div></div>
</div>
<div class="controls">
<label>搜索:</label>
<input type="text" id="si" placeholder="任务名/NPC名/ID..." oninput="fq()">
<label>等级:</label>
<select id="lf" onchange="fq()">
<option value="">全部</option>
<option value="0-10">0~10</option>
<option value="11-20">11~20</option>
<option value="21-30">21~30</option>
<option value="31-40">31~40</option>
<option value="41-50">41~50</option>
<option value="51-70">51~70</option>
<option value="71-100">71~100</option>
<option value="101-999">101+</option>
</select>
<label>职业:</label>
<select id="jf" onchange="fq()">
<option value="">全部</option>
<option value="all">所有职业可接</option>
<option value="warrior">战士系</option>
<option value="mage">魔法师系</option>
<option value="bowman">弓箭手系</option>
<option value="thief">飞侠系</option>
<option value="pirate">海盗系</option>
</select>
<div class="tag-filter-row">
<label><input type="checkbox" id="tf_date" onchange="fq()" checked> 限时</label>
<label><input type="checkbox" id="tf_event" onchange="fq()" checked> 活动</label>
<label><input type="checkbox" id="tf_medal" onchange="fq()" checked> 勋章</label>
<label><input type="checkbox" id="tf_party" onchange="fq()" checked> 组队</label>
</div>
<div class="vtgl">
<button class="vb act" onclick="sv('list')" id="vl">📋 列表</button>
<button class="vb" onclick="sv('chain')" id="vc">🔗 任务链</button>
</div>
</div>
""")

    # -- tab bar --
    h.append('<div class="tab-bar" id="tb">')
    h.append(f'<button class="tab-btn active" onclick="sa(\'all\')">全部<span class="cnt">{total_quests}</span></button>')
    for ac in active_areas:
        aname = ALL_AREAS.get(ac, f"未知({ac})")
        cnt = len(by_area[ac])
        tag = ""
        if ac == 50:
            tag = '<span class="tag">⚡</span>'
        elif ac == 51:
            tag = '<span class="tag">🏅</span>'
        elif ac == 47:
            tag = '<span class="tag">👥</span>'
        h.append(f'<button class="tab-btn" onclick="sa(\'{ac}\')">{html_lib.escape(aname)}{tag}<span class="cnt">{cnt}</span></button>')
    h.append('</div>')

    # -- list view --
    h.append('<div class="main" id="lv">')
    h.append('<div class="qlist" id="ql">')

    for entry in sorted(result, key=lambda x: (x["area_code"], x["lvmin"], x["id"])):
        qid = entry["id"]
        npc_name = ""
        if entry["start_npc"]:
            npc_name = entry["start_npc"]["name_zh"] or entry["start_npc"]["name_en"]
        lvl = f"Lv.{entry['lvmin']}" if entry['lvmin'] else "Lv.?"
        badges = ""
        if entry["chain"]["total"] > 1:
            badges += f'<span class="badge b-chain">{entry["chain"]["position"]}/{entry["chain"]["total"]}</span>'
        if entry.get("interval") is not None and entry["interval"] is not None and entry["interval"] >= 0:
            badges += '<span class="badge b-repeat">可重复</span>'
        for t in entry.get("tags", []):
            if t == "限时":
                badges += '<span class="badge b-date">限时</span>'
            elif t == "活动":
                badges += '<span class="badge b-event">活动</span>'
            elif t == "勋章":
                badges += '<span class="badge b-medal">勋章</span>'
            elif t == "组队任务":
                badges += '<span class="badge b-party">组队</span>'

        jobs_data = json.dumps(entry.get("jobs_raw") or [])
        tags_data = json.dumps(entry.get("tags", []))
        search_text = html_lib.escape(f"{entry['name']} {npc_name} {qid}")

        h.append(f'<div class="qi" data-qid="{qid}" data-area="{entry["area_code"]}" '
                 f'data-lv="{entry["lvmin"]}" data-jobs=\'{jobs_data}\' data-tags=\'{tags_data}\' '
                 f'data-s="{search_text}" onclick="sq({qid})">'
                 f'<div class="qn">{html_lib.escape(entry["name"])}</div>'
                 f'<div class="qm"><span class="lv">{lvl}</span>'
                 f'<span class="npc">{html_lib.escape(npc_name)}</span>{badges}</div></div>')

    h.append('</div>')  # qlist

    h.append('<div class="dpanel" id="dp"><div class="empty">'
             '<p style="font-size:48px;margin-bottom:20px">🗺️</p>'
             '<p>选择左侧任务查看详情</p></div></div>')
    h.append('</div>')  # main list view

    # -- chain view --
    h.append('<div class="chain-panel hid" id="cv">')
    for ac in active_areas:
        if ac not in by_area:
            continue
        aname = ALL_AREAS.get(ac, f"?({ac})")
        area_chains = []
        seen = set()
        for entry in sorted(by_area[ac], key=lambda x: (x["lvmin"], x["id"])):
            ci = entry["chain"]
            if ci["total"] > 1:
                ck = tuple(ci["chain_quest_ids"])
                if ck not in seen:
                    seen.add(ck)
                    area_chains.append(ci)
        if not area_chains:
            continue

        color = AREA_COLORS.get(ac, "#e94560")
        h.append(f'<div class="cag" data-area="{ac}">')
        h.append(f'<h2 style="color:{color};margin-bottom:12px">{html_lib.escape(aname)} 任务链</h2>')
        for ci in area_chains:
            h.append(f'<div class="cgrp"><h3>{html_lib.escape(ci["chain_name"])}</h3>'
                     f'<div class="cm">{ci["total"]}个任务</div><div class="chor">')
            for idx, cqid in enumerate(ci["chain_quest_ids"]):
                ce = next((e for e in result if e["id"] == cqid), None)
                if ce:
                    lv = f'Lv.{ce["lvmin"]}' if ce["lvmin"] else ''
                    h.append(f'<div class="chn" onclick="sq({cqid});sv(\'list\')">'
                             f'<div class="nn">{html_lib.escape(ce["name"])}</div>'
                             f'<div class="nl">{lv}</div><div class="ni">#{cqid}</div></div>')
                    if idx < len(ci["chain_quest_ids"]) - 1:
                        h.append('<span class="cha">→</span>')
            h.append('</div></div>')
        h.append('</div>')

    h.append('</div>')  # chain-panel

    # -- JS --
    h.append('<script>')
    h.append(f'const QD={json.dumps(quest_data_js, ensure_ascii=False)};')
    h.append(f'const AN={json.dumps(ALL_AREAS, ensure_ascii=False)};')
    h.append(r"""
let cA='all',cV='list';
function sa(a){cA=a;document.querySelectorAll('.tab-btn').forEach((b,i)=>{
if(a==='all'&&i===0)b.classList.add('active');
else if(b.textContent.includes(AN[a]))b.classList.add('active');
else b.classList.remove('active')});fq();
document.querySelectorAll('.cag').forEach(g=>{
if(a==='all'||g.dataset.area===String(a))g.classList.remove('hid');else g.classList.add('hid')})}

function sv(v){cV=v;
document.getElementById('lv').classList.toggle('hid',v!=='list');
document.getElementById('cv').classList.toggle('hid',v!=='chain');
document.getElementById('vl').classList.toggle('act',v==='list');
document.getElementById('vc').classList.toggle('act',v==='chain')}

function fq(){
const s=document.getElementById('si').value.toLowerCase();
const lr=document.getElementById('lf').value;
const jf=document.getElementById('jf').value;
const showDate=document.getElementById('tf_date').checked;
const showEvent=document.getElementById('tf_event').checked;
const showMedal=document.getElementById('tf_medal').checked;
const showParty=document.getElementById('tf_party').checked;
let[lMin,lMax]=[0,999];if(lr){[lMin,lMax]=lr.split('-').map(Number)}
document.querySelectorAll('.qi').forEach(it=>{
const a=it.dataset.area,lv=parseInt(it.dataset.lv)||0;
const st=it.dataset.s.toLowerCase();
const jobs=JSON.parse(it.dataset.jobs||'[]');
const tags=JSON.parse(it.dataset.tags||'[]');
let ok=true;
if(cA!=='all'&&a!==String(cA))ok=false;
if(s&&!st.includes(s))ok=false;
if(lv<lMin||lv>lMax)ok=false;
if(!showDate&&tags.includes('限时'))ok=false;
if(!showEvent&&tags.includes('活动'))ok=false;
if(!showMedal&&tags.includes('勋章'))ok=false;
if(!showParty&&tags.includes('组队任务'))ok=false;
if(jf){
if(jf==='all'){if(jobs.length>0)ok=false}
else{const R={warrior:[100,132],mage:[200,232],bowman:[300,322],thief:[400,422],pirate:[500,522]};
if(jobs.length>0&&R[jf]){const[lo,hi]=R[jf];if(!jobs.some(j=>(j>=lo&&j<=hi)||j===0))ok=false}}}
it.style.display=ok?'':'none'})}

function sq(qid){
const q=QD[qid];if(!q)return;
document.querySelectorAll('.qi').forEach(i=>i.classList.toggle('sel',i.dataset.qid==qid));
const p=document.getElementById('dp');
const e=s=>{const d=document.createElement('div');d.textContent=s;return d.innerHTML};
let ni='';
if(q.start_npc){const n=q.start_npc.name_zh||q.start_npc.name_en||'?';
const l=(q.start_npc.locations||[]).map(x=>x.name).join(', ');
ni=`<div class="dr"><span class="lb">接取NPC</span><span class="vl">${e(n)} (${e(l)})</span></div>`}
if(q.end_npc&&(!q.start_npc||q.end_npc.id!==q.start_npc.id)){
const n=q.end_npc.name_zh||q.end_npc.name_en||'?';
const l=(q.end_npc.locations||[]).map(x=>x.name).join(', ');
ni+=`<div class="dr"><span class="lb">交付NPC</span><span class="vl">${e(n)} (${e(l)})</span></div>`}
let kh='';if(q.kill_requirements&&q.kill_requirements.length){
kh='<div class="dsec"><h3>击杀要求</h3>';
q.kill_requirements.forEach(m=>{kh+=`<div class="dr"><span class="vl">🗡️ ${e(m.name)} × ${m.count}</span></div>`});kh+='</div>'}
let ch='';if(q.collect_requirements&&q.collect_requirements.length){
ch='<div class="dsec"><h3>收集要求</h3>';
q.collect_requirements.forEach(i=>{ch+=`<div class="dr"><span class="vl">📦 ${e(i.name)} × ${i.count}</span></div>`});ch+='</div>'}
let rh='';const rw=q.rewards||{};
if(rw.exp||rw.money||rw.fame||(rw.items&&rw.items.length)){
rh='<div class="dsec"><h3>奖励</h3><div style="display:flex;flex-wrap:wrap;gap:4px">';
if(rw.exp)rh+=`<span class="rtag exp">经验 ${rw.exp.toLocaleString()}</span>`;
if(rw.money)rh+=`<span class="rtag money">金币 ${rw.money.toLocaleString()}</span>`;
if(rw.fame)rh+=`<span class="rtag fame">人气 ${rw.fame}</span>`;
if(rw.items)rw.items.forEach(i=>{
if(i.count>0)rh+=`<span class="rtag item">${e(i.name)} ×${i.count}</span>`;
else if(i.count<0)rh+=`<span class="rtag item">回收 ${e(i.name)} ×${Math.abs(i.count)}</span>`});
rh+='</div></div>'}
let dh='';const ds=q.description||{};
if(ds.before||ds.in_progress||ds.completed){
dh='<div class="dsec"><h3>任务描述</h3>';
if(ds.before)dh+=`<div class="dr"><span class="lb" style="color:#60a5fa">接受前</span><span class="vl" style="white-space:pre-wrap;font-size:12px;line-height:1.5">${e(ds.before)}</span></div>`;
if(ds.in_progress)dh+=`<div class="dr"><span class="lb" style="color:#fbbf24">进行中</span><span class="vl" style="white-space:pre-wrap;font-size:12px;line-height:1.5">${e(ds.in_progress)}</span></div>`;
if(ds.completed)dh+=`<div class="dr"><span class="lb" style="color:#34d399">完成后</span><span class="vl" style="white-space:pre-wrap;font-size:12px;line-height:1.5">${e(ds.completed)}</span></div>`;
dh+='</div>'}
let cv='';if(q.chain&&q.chain.total>1){
cv=`<div class="cview"><h3>🔗 任务链：${e(q.chain.chain_name)} (${q.chain.position}/${q.chain.total})</h3><div class="cflow">`;
q.chain.chain_quest_ids.forEach((c,i)=>{const cq=QD[c];const nm=cq?cq.name:'?';
cv+=`<div class="cnode${c===qid?' cur':''}" onclick="sq(${c})">${e(nm)}</div>`;
if(i<q.chain.chain_quest_ids.length-1)cv+='<span class="carr">→</span>'});cv+='</div></div>'}
const lv=q.lvmin?`Lv.${q.lvmin}${q.lvmax?'~'+q.lvmax:''}`:'Lv.?';
let ri='';if(q.interval!==null&&q.interval!==undefined&&q.interval>=0)ri=q.interval===0?'🔄 可重复':`🔄 间隔${q.interval}分钟`;
let tgs=q.tags&&q.tags.length?q.tags.map(t=>`<span class="badge ${t==='限时'?'b-date':t==='活动'?'b-event':t==='勋章'?'b-medal':'b-party'}" style="font-size:11px;padding:2px 6px;border-radius:6px">${e(t)}</span>`).join(' '):'';
p.innerHTML=`<div class="dcard">
<h2>${e(q.name)}</h2>
<div class="qid">ID: ${q.id} · ${e(q.area_name)} · ${lv} ${ri} ${tgs}</div>
<div class="dsec"><h3>基本信息</h3>
<div class="dr"><span class="lb">职业限制</span><span class="vl">${e(q.job_restriction)}</span></div>
${ni}</div>${dh}${kh}${ch}${rh}${cv}</div>`;
if(cV!=='list')sv('list');
const si=document.querySelector(`.qi[data-qid="${qid}"]`);if(si)si.scrollIntoView({behavior:'smooth',block:'nearest'})}
document.addEventListener('DOMContentLoaded',()=>fq());
""")
    h.append('</script></body></html>')

    with open(html_path, "w", encoding="utf-8") as f:
        f.write("\n".join(h))


if __name__ == "__main__":
    main()
