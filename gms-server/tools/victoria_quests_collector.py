#!/usr/bin/env python3
"""
Collect all Victoria Island quests from WZ data.
Parses QuestInfo, Check, Act, NPC/Map strings, and NPC locations.
Filters: area 23-30 (Victoria Island), excludes date-limited/event quests,
only adventurer-accessible quests.
Outputs: JSON data, Markdown summary, HTML quest chain visualization.
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

VI_AREAS = {
    23: "明珠港",
    24: "射手村",
    25: "勇士部落",
    26: "魔法密林",
    27: "废弃都市",
    28: "诺特勒斯",
    29: "林中之城",
    30: "黄金海岸与婚礼村",
}

ADVENTURER_JOBS = set()
for base in [0]:
    ADVENTURER_JOBS.add(base)
for cls_base in [100, 200, 300, 400, 500]:
    for off in range(0, 33):
        ADVENTURER_JOBS.add(cls_base + off)

JOB_CLASS_NAMES = {
    0: "初心者",
    100: "战士", 110: "剑客", 111: "勇士", 112: "英雄",
    120: "准骑士", 121: "骑士", 122: "圣骑士",
    130: "枪战士", 131: "龙骑士", 132: "黑骑士",
    200: "魔法师", 210: "火毒法师", 211: "火毒巫师", 212: "火毒魔导师",
    220: "冰雷法师", 221: "冰雷巫师", 222: "冰雷魔导师",
    230: "牧师", 231: "祭司", 232: "主教",
    300: "弓箭手", 310: "猎人", 311: "射手", 312: "神射手",
    320: "弩弓手", 321: "游侠", 322: "箭神",
    400: "飞侠", 410: "刺客", 411: "隐士", 412: "隐士(夜行者)",
    420: "侠客", 421: "独行客", 422: "暗影双刀",
    500: "海盗", 510: "拳手", 511: "斗士", 512: "冲锋队长",
    520: "火枪手", 521: "大副", 522: "船长",
}

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
            prereqs = []
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


def has_date_restriction(check_data):
    sc = check_data.get("start", {})
    if sc.get("date_start") or sc.get("date_end"):
        return True
    return False


def is_adventurer_accessible(check_data):
    sc = check_data.get("start", {})
    jobs = sc.get("jobs")
    if jobs is None:
        return True
    for j in jobs:
        if is_adventurer_job(j):
            return True
    return False


def get_job_restriction_text(jobs):
    if not jobs:
        return "所有职业"
    adv_jobs = [j for j in jobs if is_adventurer_job(j)]
    if not adv_jobs:
        return "所有职业"
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
                if qid not in [p for p in prev_map[qid]]:
                    pass

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

    all_qids = set(quests.keys())
    for qid in sorted(all_qids):
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

    for qid in sorted(all_qids):
        if qid not in visited:
            chains.append([qid])
            visited.add(qid)

    return chains


def resolve_npc_info(npc_id, npc_zh, npc_en, npc_locs, maps_zh):
    name_zh = npc_zh.get(npc_id, "")
    name_en = npc_en.get(npc_id, "")
    locs = npc_locs.get(npc_id, [])
    map_infos = []
    for mid in locs:
        mi = maps_zh.get(mid, {})
        map_infos.append({
            "id": mid,
            "street": mi.get("street", ""),
            "name": mi.get("map", ""),
        })
    return {
        "id": npc_id,
        "name_zh": name_zh,
        "name_en": name_en,
        "locations": map_infos,
    }


def determine_quest_location(qid, checks, npc_locs, maps_zh):
    check = checks.get(qid, {})
    npc_id = check.get("start", {}).get("npc")
    if not npc_id:
        npc_id = check.get("end", {}).get("npc")
    if npc_id:
        locs = npc_locs.get(npc_id, [])
        for mid in locs:
            mi = maps_zh.get(mid, {})
            return mi.get("map", f"Map#{mid}"), mi.get("street", "")
    return "", ""


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

    print(f"  Quests: {len(quest_info)}, NPCs: {len(npc_zh)}, Maps: {len(maps_zh)}", file=sys.stderr)

    vi_quests = {}
    excluded_date = 0
    excluded_job = 0

    for qid, qi in quest_info.items():
        area = qi.get("area", -1)
        if area not in VI_AREAS:
            continue

        check = quest_check.get(qid, {"start": {}, "end": {}})

        if has_date_restriction(check):
            excluded_date += 1
            continue

        if not is_adventurer_accessible(check):
            excluded_job += 1
            continue

        vi_quests[qid] = qi

    print(f"  Victoria Island quests: {len(vi_quests)} "
          f"(excluded {excluded_date} date-limited, {excluded_job} non-adventurer)",
          file=sys.stderr)

    chains = build_quest_chains(vi_quests, quest_act, quest_check)

    chain_map = {}
    for chain in chains:
        chain_id = chain[0]
        for idx, qid in enumerate(chain):
            chain_map[qid] = {
                "chain_id": chain_id,
                "chain_name": vi_quests.get(chain[0], {}).get("parent", "")
                              or vi_quests.get(chain[0], {}).get("name", ""),
                "position": idx + 1,
                "total": len(chain),
                "chain": chain,
            }

    result = []
    for qid in sorted(vi_quests.keys()):
        qi = vi_quests[qid]
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

        map_name, street_name = determine_quest_location(qid, quest_check, npc_locs, maps_zh)

        jobs = sc.get("jobs")
        job_text = get_job_restriction_text(jobs)

        kill_reqs = []
        for mob in ec.get("mobs", []):
            mob_id = mob.get("id", 0)
            mob_name = mob_names.get(mob_id, f"Mob#{mob_id}")
            kill_reqs.append({"id": mob_id, "name": mob_name, "count": mob.get("count", 0)})

        collect_reqs = []
        for itm in ec.get("items", []):
            iid = itm.get("id", 0)
            iname = item_names.get(iid, f"Item#{iid}")
            collect_reqs.append({"id": iid, "name": iname, "count": itm.get("count", 0)})

        rewards_items = []
        for itm in ea.get("items", []):
            iid = itm.get("id", 0)
            iname = item_names.get(iid, f"Item#{iid}")
            rewards_items.append({
                "id": iid, "name": iname,
                "count": itm.get("count", 0),
                "prop": itm.get("prop", -1),
            })

        chain_info = chain_map.get(qid, {})

        entry = {
            "id": qid,
            "name": qi.get("name", ""),
            "parent": qi.get("parent", ""),
            "area_code": qi.get("area", -1),
            "area_name": VI_AREAS.get(qi.get("area", -1), "未知"),
            "lvmin": sc.get("lvmin", 0),
            "lvmax": sc.get("lvmax", 0),
            "job_restriction": job_text,
            "jobs_raw": jobs,
            "autoStart": qi.get("autoStart", False),
            "interval": sc.get("interval"),
            "start_npc": start_npc,
            "end_npc": end_npc,
            "location_map": map_name,
            "location_street": street_name,
            "prereq_quests": sc.get("prereq_quests", []),
            "kill_requirements": kill_reqs,
            "collect_requirements": collect_reqs,
            "rewards": {
                "exp": ea.get("exp", 0),
                "money": ea.get("money", 0),
                "fame": ea.get("fame", 0),
                "items": rewards_items,
            },
            "next_quest": ea.get("nextQuest") or sa.get("nextQuest"),
            "chain": {
                "chain_name": chain_info.get("chain_name", qi.get("name", "")),
                "position": chain_info.get("position", 1),
                "total": chain_info.get("total", 1),
                "chain_quest_ids": chain_info.get("chain", [qid]),
            },
        }
        result.append(entry)

    json_path = os.path.join(BASE_DIR, "docs", "victoria_quests_data.json")
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"  JSON data: {json_path}", file=sys.stderr)

    generate_markdown(result, chains, vi_quests, quest_check, quest_act, npc_zh, maps_zh, item_names, mob_names)
    generate_html(result, chains, vi_quests, quest_check, quest_act, npc_zh, npc_en, maps_zh, item_names, mob_names)

    print("Done!", file=sys.stderr)


def generate_markdown(result, chains, vi_quests, checks, acts, npc_zh, maps_zh, item_names, mob_names):
    by_area = defaultdict(list)
    for entry in result:
        by_area[entry["area_code"]].append(entry)

    lines = []
    lines.append("# 金银岛（Victoria Island）任务总览\n")
    lines.append(f"共收录 **{len(result)}** 个任务，覆盖 {len(by_area)} 个区域。\n")
    lines.append("筛选条件：非限时、非活动、冒险家五大职业可接取。\n")

    lines.append("## 目录\n")
    area_order = [23, 24, 25, 26, 27, 28, 29, 30]
    for ac in area_order:
        if ac in by_area:
            area_name = VI_AREAS[ac]
            count = len(by_area[ac])
            lines.append(f"- [{area_name}](#{area_name}) ({count}个任务)")
    lines.append("")

    chain_index = {}
    for chain in chains:
        if len(chain) > 1:
            root = chain[0]
            qi = vi_quests.get(root, {})
            cname = qi.get("parent", "") or qi.get("name", "")
            for qid in chain:
                chain_index[qid] = (cname, chain)

    for ac in area_order:
        if ac not in by_area:
            continue
        area_name = VI_AREAS[ac]
        entries = sorted(by_area[ac], key=lambda x: (x["lvmin"], x["id"]))

        lines.append(f"## {area_name}\n")

        seen_chains = set()
        for entry in entries:
            qid = entry["id"]
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
                        _format_quest_entry(lines, ce, idx + 1, item_names)
                lines.append("")
            else:
                _format_quest_entry(lines, entry, None, item_names)

    md_path = os.path.join(BASE_DIR, "docs", "victoria_quests_summary.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"  Markdown: {md_path}", file=sys.stderr)


def _format_quest_entry(lines, entry, chain_pos, item_names):
    prefix = f"**[{chain_pos}]** " if chain_pos else ""
    lvl = f"Lv.{entry['lvmin']}" if entry['lvmin'] else "Lv.?"
    if entry['lvmax']:
        lvl += f"~{entry['lvmax']}"

    npc_name = ""
    npc_loc = ""
    if entry["start_npc"]:
        npc_name = entry["start_npc"]["name_zh"] or entry["start_npc"]["name_en"]
        if entry["start_npc"]["locations"]:
            loc = entry["start_npc"]["locations"][0]
            npc_loc = loc["name"]

    job_info = ""
    if entry["job_restriction"] != "所有职业":
        job_info = f" | 职业限制: {entry['job_restriction']}"

    repeat_info = ""
    if entry.get("interval") is not None and entry["interval"] >= 0:
        if entry["interval"] == 0:
            repeat_info = " | 🔄可重复"
        else:
            repeat_info = f" | 🔄间隔{entry['interval']}分钟"

    lines.append(f"- {prefix}**{entry['name']}** (ID:{entry['id']}) — {lvl}")
    detail_parts = []
    if npc_name:
        detail_parts.append(f"NPC: {npc_name}")
    if npc_loc:
        detail_parts.append(f"位置: {npc_loc}")
    if job_info:
        detail_parts.append(job_info.strip(" |"))
    if repeat_info:
        detail_parts.append(repeat_info.strip(" |"))

    if detail_parts:
        lines.append(f"  - {' | '.join(detail_parts)}")

    if entry["kill_requirements"]:
        kills = ", ".join(f"{m['name']}×{m['count']}" for m in entry["kill_requirements"])
        lines.append(f"  - 击杀: {kills}")
    if entry["collect_requirements"]:
        items = ", ".join(f"{i['name']}×{i['count']}" for i in entry["collect_requirements"])
        lines.append(f"  - 收集: {items}")

    rewards = []
    if entry["rewards"]["exp"]:
        rewards.append(f"经验{entry['rewards']['exp']}")
    if entry["rewards"]["money"]:
        rewards.append(f"金币{entry['rewards']['money']}")
    if entry["rewards"]["fame"]:
        rewards.append(f"人气{entry['rewards']['fame']}")
    if entry["rewards"]["items"]:
        for itm in entry["rewards"]["items"]:
            if itm["count"] > 0:
                rewards.append(f"{itm['name']}×{itm['count']}")
            elif itm["count"] < 0:
                rewards.append(f"回收{itm['name']}×{abs(itm['count'])}")
    if rewards:
        lines.append(f"  - 奖励: {', '.join(rewards)}")


def generate_html(result, chains, vi_quests, checks, acts, npc_zh, npc_en, maps_zh, item_names, mob_names):
    by_area = defaultdict(list)
    for entry in result:
        by_area[entry["area_code"]].append(entry)

    area_order = [23, 24, 25, 26, 27, 28, 29, 30]
    area_colors = {
        23: "#4A90D9", 24: "#27AE60", 25: "#E67E22",
        26: "#8E44AD", 27: "#C0392B", 28: "#2980B9",
        29: "#16A085", 30: "#F39C12",
    }

    multi_chains = [c for c in chains if len(c) > 1]

    html_parts = []
    html_parts.append("""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>金银岛任务总览 - Victoria Island Quest Map</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #0a0e17;
  color: #e0e0e0;
  min-height: 100vh;
}
.header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 30px 40px;
  border-bottom: 2px solid #e94560;
  text-align: center;
}
.header h1 { color: #e94560; font-size: 28px; margin-bottom: 8px; }
.header .subtitle { color: #888; font-size: 14px; }
.stats-bar {
  display: flex; justify-content: center; gap: 30px;
  padding: 15px; background: #111827; border-bottom: 1px solid #1f2937;
}
.stat-item { text-align: center; }
.stat-num { font-size: 24px; font-weight: bold; color: #e94560; }
.stat-label { font-size: 12px; color: #6b7280; }
.controls {
  padding: 15px 30px; background: #111827;
  border-bottom: 1px solid #1f2937;
  display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
}
.controls label { color: #9ca3af; font-size: 13px; margin-right: 5px; }
.controls select, .controls input {
  background: #1f2937; border: 1px solid #374151; color: #e0e0e0;
  padding: 6px 12px; border-radius: 6px; font-size: 13px;
}
.controls input[type="text"] { width: 200px; }
.tab-bar {
  display: flex; overflow-x: auto; background: #111827;
  border-bottom: 2px solid #1f2937; padding: 0 20px;
}
.tab-btn {
  padding: 12px 20px; cursor: pointer; border: none;
  background: transparent; color: #9ca3af; font-size: 14px;
  border-bottom: 3px solid transparent; transition: all .2s;
  white-space: nowrap;
}
.tab-btn:hover { color: #e0e0e0; background: #1f2937; }
.tab-btn.active { color: #e94560; border-bottom-color: #e94560; }
.tab-btn .count {
  background: #374151; padding: 1px 7px; border-radius: 10px;
  font-size: 11px; margin-left: 5px;
}
.tab-btn.active .count { background: #e94560; color: white; }

.main-content { display: flex; min-height: calc(100vh - 250px); }
.quest-list-panel {
  width: 420px; min-width: 420px; overflow-y: auto;
  border-right: 1px solid #1f2937; background: #0d1117;
  max-height: calc(100vh - 250px);
}
.quest-item {
  padding: 12px 16px; border-bottom: 1px solid #1a1f2e;
  cursor: pointer; transition: background .15s;
}
.quest-item:hover { background: #161b22; }
.quest-item.selected { background: #1c2333; border-left: 3px solid #e94560; }
.quest-item .q-name { font-weight: 600; font-size: 14px; color: #e0e0e0; }
.quest-item .q-meta {
  font-size: 12px; color: #6b7280; margin-top: 3px;
  display: flex; gap: 10px; flex-wrap: wrap;
}
.quest-item .q-meta .lv { color: #f59e0b; }
.quest-item .q-meta .npc { color: #60a5fa; }
.quest-item .q-meta .chain-badge {
  background: #4338ca; color: #c7d2fe; padding: 0 6px;
  border-radius: 8px; font-size: 11px;
}
.quest-item .q-meta .repeat-badge {
  background: #065f46; color: #6ee7b7; padding: 0 6px;
  border-radius: 8px; font-size: 11px;
}

.detail-panel {
  flex: 1; overflow-y: auto; padding: 30px;
  max-height: calc(100vh - 250px);
}
.detail-panel .empty-state {
  text-align: center; padding: 80px 20px; color: #4b5563;
}
.detail-card {
  background: #161b22; border: 1px solid #21262d; border-radius: 12px;
  padding: 24px; max-width: 700px;
}
.detail-card h2 { color: #e94560; font-size: 20px; margin-bottom: 4px; }
.detail-card .q-id { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
.detail-section { margin-top: 18px; }
.detail-section h3 {
  color: #9ca3af; font-size: 13px; text-transform: uppercase;
  letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #21262d;
  padding-bottom: 4px;
}
.detail-row { display: flex; gap: 8px; margin: 4px 0; font-size: 14px; }
.detail-row .label { color: #6b7280; min-width: 70px; }
.detail-row .value { color: #d1d5db; }
.reward-tag {
  display: inline-block; background: #1e3a5f; color: #93c5fd;
  padding: 2px 8px; border-radius: 6px; font-size: 12px; margin: 2px;
}
.reward-tag.exp { background: #3b2f1a; color: #fbbf24; }
.reward-tag.money { background: #1a3b2f; color: #6ee7b7; }
.reward-tag.fame { background: #3b1a2f; color: #f9a8d4; }

.chain-view {
  margin-top: 20px; padding: 16px;
  background: #0d1117; border: 1px solid #21262d; border-radius: 10px;
}
.chain-view h3 { color: #c084fc; font-size: 15px; margin-bottom: 12px; }
.chain-flow {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.chain-node {
  background: #1e1e3f; border: 1px solid #4338ca; border-radius: 8px;
  padding: 6px 12px; font-size: 12px; color: #c7d2fe; cursor: pointer;
  transition: all .2s;
}
.chain-node:hover { background: #2e2e5f; }
.chain-node.current { background: #4338ca; color: white; font-weight: bold; }
.chain-arrow { color: #4338ca; font-size: 16px; }

/* Chain diagram view */
.chain-diagram-panel {
  padding: 30px; overflow-y: auto;
  max-height: calc(100vh - 250px);
}
.chain-group {
  background: #161b22; border: 1px solid #21262d; border-radius: 12px;
  padding: 20px; margin-bottom: 20px;
}
.chain-group h3 { color: #c084fc; font-size: 16px; margin-bottom: 12px; }
.chain-group .chain-meta { color: #6b7280; font-size: 12px; margin-bottom: 10px; }
.chain-horizontal {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
}
.chain-h-node {
  background: #1e1e3f; border: 1px solid #4338ca; border-radius: 8px;
  padding: 10px 14px; min-width: 120px; text-align: center; cursor: pointer;
  transition: all .2s;
}
.chain-h-node:hover { background: #2e2e5f; transform: translateY(-2px); }
.chain-h-node .cn-name { font-size: 13px; color: #c7d2fe; font-weight: 600; }
.chain-h-node .cn-lv { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.chain-h-node .cn-id { font-size: 10px; color: #4b5563; }
.chain-h-arrow { color: #6366f1; font-size: 20px; }

.view-toggle {
  display: flex; gap: 5px; margin-left: auto;
}
.view-btn {
  padding: 6px 14px; border: 1px solid #374151; background: #1f2937;
  color: #9ca3af; border-radius: 6px; cursor: pointer; font-size: 13px;
}
.view-btn.active { background: #e94560; color: white; border-color: #e94560; }
.hidden { display: none !important; }
</style>
</head>
<body>
<div class="header">
  <h1>🏝️ 金银岛（Victoria Island）任务总览</h1>
  <div class="subtitle">MapleStory v83 · 冒险家五大职业可接取 · 非限时/非活动</div>
</div>
""")

    total_quests = len(result)
    total_chains = len([c for c in chains if len(c) > 1])
    total_areas = len(by_area)

    html_parts.append(f"""
<div class="stats-bar">
  <div class="stat-item"><div class="stat-num">{total_quests}</div><div class="stat-label">任务总数</div></div>
  <div class="stat-item"><div class="stat-num">{total_chains}</div><div class="stat-label">任务链</div></div>
  <div class="stat-item"><div class="stat-num">{total_areas}</div><div class="stat-label">覆盖区域</div></div>
</div>
<div class="controls">
  <label>搜索:</label>
  <input type="text" id="searchInput" placeholder="任务名/NPC名/ID..." oninput="filterQuests()">
  <label>等级:</label>
  <select id="levelFilter" onchange="filterQuests()">
    <option value="">全部等级</option>
    <option value="0-10">0~10</option>
    <option value="11-20">11~20</option>
    <option value="21-30">21~30</option>
    <option value="31-40">31~40</option>
    <option value="41-50">41~50</option>
    <option value="51-60">51~60</option>
    <option value="61-70">61~70</option>
    <option value="71-999">71+</option>
  </select>
  <label>职业:</label>
  <select id="jobFilter" onchange="filterQuests()">
    <option value="">全部职业</option>
    <option value="all">所有职业可接</option>
    <option value="warrior">战士系</option>
    <option value="mage">魔法师系</option>
    <option value="bowman">弓箭手系</option>
    <option value="thief">飞侠系</option>
    <option value="pirate">海盗系</option>
  </select>
  <div class="view-toggle">
    <button class="view-btn active" onclick="switchView('list')" id="viewListBtn">📋 列表</button>
    <button class="view-btn" onclick="switchView('chain')" id="viewChainBtn">🔗 任务链</button>
  </div>
</div>
""")

    html_parts.append('<div class="tab-bar" id="tabBar">')
    html_parts.append(f'<button class="tab-btn active" onclick="switchArea(\'all\')">全部<span class="count">{total_quests}</span></button>')
    for ac in area_order:
        if ac in by_area:
            aname = VI_AREAS[ac]
            cnt = len(by_area[ac])
            html_parts.append(f'<button class="tab-btn" onclick="switchArea(\'{ac}\')">{aname}<span class="count">{cnt}</span></button>')
    html_parts.append('</div>')

    html_parts.append('<div class="main-content" id="listView">')
    html_parts.append('<div class="quest-list-panel" id="questListPanel">')

    for entry in sorted(result, key=lambda x: (x["area_code"], x["lvmin"], x["id"])):
        qid = entry["id"]
        npc_name = ""
        if entry["start_npc"]:
            npc_name = entry["start_npc"]["name_zh"] or entry["start_npc"]["name_en"]
        lvl_str = f"Lv.{entry['lvmin']}" if entry['lvmin'] else "Lv.?"
        chain_badge = ""
        if entry["chain"]["total"] > 1:
            chain_badge = f'<span class="chain-badge">{entry["chain"]["position"]}/{entry["chain"]["total"]}</span>'
        repeat_badge = ""
        if entry.get("interval") is not None and entry["interval"] is not None and entry["interval"] >= 0:
            repeat_badge = '<span class="repeat-badge">可重复</span>'

        jobs_raw = entry.get("jobs_raw") or []
        jobs_data = json.dumps(jobs_raw)

        html_parts.append(f'''<div class="quest-item" data-qid="{qid}" data-area="{entry["area_code"]}"
  data-lvmin="{entry["lvmin"]}" data-jobs='{jobs_data}'
  data-search="{html_lib.escape(entry['name'])} {html_lib.escape(npc_name)} {qid}"
  onclick="selectQuest({qid})">
  <div class="q-name">{html_lib.escape(entry["name"])}</div>
  <div class="q-meta">
    <span class="lv">{lvl_str}</span>
    <span class="npc">{html_lib.escape(npc_name)}</span>
    {chain_badge}{repeat_badge}
  </div>
</div>''')

    html_parts.append('</div>')  # quest-list-panel
    html_parts.append('''<div class="detail-panel" id="detailPanel">
  <div class="empty-state">
    <p style="font-size:48px;margin-bottom:20px">🗺️</p>
    <p>选择左侧任务查看详情</p>
  </div>
</div>''')
    html_parts.append('</div>')  # main-content list view

    html_parts.append('<div class="chain-diagram-panel hidden" id="chainView">')
    for ac in area_order:
        if ac not in by_area:
            continue
        area_name = VI_AREAS[ac]
        area_chains = []
        seen = set()
        for entry in sorted(by_area[ac], key=lambda x: (x["lvmin"], x["id"])):
            ci = entry["chain"]
            if ci["total"] > 1:
                chain_key = tuple(ci["chain_quest_ids"])
                if chain_key not in seen:
                    seen.add(chain_key)
                    area_chains.append(ci)

        if not area_chains:
            continue

        html_parts.append(f'<div class="chain-area-group" data-area="{ac}">')
        html_parts.append(f'<h2 style="color:{area_colors.get(ac,"#e94560")};margin-bottom:15px">{area_name} 任务链</h2>')

        for ci in area_chains:
            cname = ci["chain_name"]
            html_parts.append(f'<div class="chain-group">')
            html_parts.append(f'<h3>{html_lib.escape(cname)}</h3>')
            html_parts.append(f'<div class="chain-meta">{ci["total"]}个任务</div>')
            html_parts.append('<div class="chain-horizontal">')
            for idx, cqid in enumerate(ci["chain_quest_ids"]):
                ce = next((e for e in result if e["id"] == cqid), None)
                if ce:
                    lvstr = f'Lv.{ce["lvmin"]}' if ce["lvmin"] else ''
                    html_parts.append(f'''<div class="chain-h-node" onclick="selectQuest({cqid}); switchView('list')">
  <div class="cn-name">{html_lib.escape(ce["name"])}</div>
  <div class="cn-lv">{lvstr}</div>
  <div class="cn-id">#{cqid}</div>
</div>''')
                    if idx < len(ci["chain_quest_ids"]) - 1:
                        html_parts.append('<span class="chain-h-arrow">→</span>')
            html_parts.append('</div>')  # chain-horizontal
            html_parts.append('</div>')  # chain-group

        html_parts.append('</div>')  # chain-area-group

    # Single quests without chains
    html_parts.append('</div>')  # chain-diagram-panel

    quest_data_js = {}
    for entry in result:
        quest_data_js[entry["id"]] = entry

    html_parts.append('<script>')
    html_parts.append(f'const QUEST_DATA = {json.dumps(quest_data_js, ensure_ascii=False)};')
    html_parts.append(f'const VI_AREAS = {json.dumps(VI_AREAS, ensure_ascii=False)};')
    html_parts.append('''

let currentArea = 'all';
let currentView = 'list';

function switchArea(area) {
  currentArea = area;
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    if (area === 'all' && i === 0) btn.classList.add('active');
    else if (btn.textContent.includes(VI_AREAS[area])) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  filterQuests();

  document.querySelectorAll('.chain-area-group').forEach(g => {
    if (area === 'all' || g.dataset.area === area) g.classList.remove('hidden');
    else g.classList.add('hidden');
  });
}

function switchView(view) {
  currentView = view;
  document.getElementById('listView').classList.toggle('hidden', view !== 'list');
  document.getElementById('chainView').classList.toggle('hidden', view !== 'chain');
  document.getElementById('viewListBtn').classList.toggle('active', view === 'list');
  document.getElementById('viewChainBtn').classList.toggle('active', view === 'chain');
}

function filterQuests() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const levelRange = document.getElementById('levelFilter').value;
  const jobFilter = document.getElementById('jobFilter').value;

  let [lvMin, lvMax] = [0, 999];
  if (levelRange) {
    [lvMin, lvMax] = levelRange.split('-').map(Number);
  }

  document.querySelectorAll('.quest-item').forEach(item => {
    const area = item.dataset.area;
    const lv = parseInt(item.dataset.lvmin) || 0;
    const searchText = item.dataset.search.toLowerCase();
    const jobs = JSON.parse(item.dataset.jobs || '[]');

    let show = true;
    if (currentArea !== 'all' && area !== currentArea) show = false;
    if (search && !searchText.includes(search)) show = false;
    if (lv < lvMin || lv > lvMax) show = false;

    if (jobFilter) {
      if (jobFilter === 'all') {
        if (jobs.length > 0) show = false;
      } else {
        const ranges = {
          warrior: [100,132], mage: [200,232],
          bowman: [300,322], thief: [400,422], pirate: [500,522]
        };
        if (jobs.length > 0 && ranges[jobFilter]) {
          const [lo, hi] = ranges[jobFilter];
          const hasJob = jobs.some(j => (j >= lo && j <= hi) || j === 0);
          if (!hasJob) show = false;
        }
      }
    }

    item.style.display = show ? '' : 'none';
  });
}

function selectQuest(qid) {
  const q = QUEST_DATA[qid];
  if (!q) return;

  document.querySelectorAll('.quest-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.qid == qid);
  });

  const panel = document.getElementById('detailPanel');
  const e = s => {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  };

  let npcInfo = '';
  if (q.start_npc) {
    const npcName = q.start_npc.name_zh || q.start_npc.name_en || '?';
    const npcLocs = (q.start_npc.locations || []).map(l => l.name).join(', ');
    npcInfo = `<div class="detail-row"><span class="label">接取NPC</span><span class="value">${e(npcName)} (${e(npcLocs)})</span></div>`;
  }
  if (q.end_npc && (!q.start_npc || q.end_npc.id !== q.start_npc.id)) {
    const npcName = q.end_npc.name_zh || q.end_npc.name_en || '?';
    const npcLocs = (q.end_npc.locations || []).map(l => l.name).join(', ');
    npcInfo += `<div class="detail-row"><span class="label">交付NPC</span><span class="value">${e(npcName)} (${e(npcLocs)})</span></div>`;
  }

  let killHtml = '';
  if (q.kill_requirements && q.kill_requirements.length > 0) {
    killHtml = '<div class="detail-section"><h3>击杀要求</h3>';
    q.kill_requirements.forEach(m => {
      killHtml += `<div class="detail-row"><span class="value">🗡️ ${e(m.name)} × ${m.count}</span></div>`;
    });
    killHtml += '</div>';
  }

  let collectHtml = '';
  if (q.collect_requirements && q.collect_requirements.length > 0) {
    collectHtml = '<div class="detail-section"><h3>收集要求</h3>';
    q.collect_requirements.forEach(i => {
      collectHtml += `<div class="detail-row"><span class="value">📦 ${e(i.name)} × ${i.count}</span></div>`;
    });
    collectHtml += '</div>';
  }

  let rewardHtml = '';
  const rw = q.rewards || {};
  let hasReward = rw.exp || rw.money || rw.fame || (rw.items && rw.items.length > 0);
  if (hasReward) {
    rewardHtml = '<div class="detail-section"><h3>奖励</h3><div style="display:flex;flex-wrap:wrap;gap:4px">';
    if (rw.exp) rewardHtml += `<span class="reward-tag exp">经验 ${rw.exp.toLocaleString()}</span>`;
    if (rw.money) rewardHtml += `<span class="reward-tag money">金币 ${rw.money.toLocaleString()}</span>`;
    if (rw.fame) rewardHtml += `<span class="reward-tag fame">人气 ${rw.fame}</span>`;
    if (rw.items) {
      rw.items.forEach(itm => {
        if (itm.count > 0) rewardHtml += `<span class="reward-tag">${e(itm.name)} ×${itm.count}</span>`;
        else if (itm.count < 0) rewardHtml += `<span class="reward-tag">回收 ${e(itm.name)} ×${Math.abs(itm.count)}</span>`;
      });
    }
    rewardHtml += '</div></div>';
  }

  let chainHtml = '';
  if (q.chain && q.chain.total > 1) {
    chainHtml = `<div class="chain-view"><h3>🔗 任务链：${e(q.chain.chain_name)} (${q.chain.position}/${q.chain.total})</h3><div class="chain-flow">`;
    q.chain.chain_quest_ids.forEach((cid, idx) => {
      const cq = QUEST_DATA[cid];
      const name = cq ? cq.name : '?';
      const cls = cid === qid ? 'chain-node current' : 'chain-node';
      chainHtml += `<div class="${cls}" onclick="selectQuest(${cid})">${e(name)}</div>`;
      if (idx < q.chain.chain_quest_ids.length - 1) chainHtml += '<span class="chain-arrow">→</span>';
    });
    chainHtml += '</div></div>';
  }

  const lvl = q.lvmin ? `Lv.${q.lvmin}${q.lvmax ? '~' + q.lvmax : ''}` : 'Lv.?';
  let repeatInfo = '';
  if (q.interval !== null && q.interval !== undefined && q.interval >= 0) {
    repeatInfo = q.interval === 0 ? '🔄 可重复' : `🔄 间隔${q.interval}分钟`;
  }

  panel.innerHTML = `
    <div class="detail-card">
      <h2>${e(q.name)}</h2>
      <div class="q-id">ID: ${q.id} · ${e(q.area_name)} · ${lvl} ${repeatInfo}</div>
      <div class="detail-section">
        <h3>基本信息</h3>
        <div class="detail-row"><span class="label">职业限制</span><span class="value">${e(q.job_restriction)}</span></div>
        ${npcInfo}
      </div>
      ${killHtml}
      ${collectHtml}
      ${rewardHtml}
      ${chainHtml}
    </div>`;

  if (currentView !== 'list') switchView('list');
  const selItem = document.querySelector(`.quest-item[data-qid="${qid}"]`);
  if (selItem) selItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.addEventListener('DOMContentLoaded', () => filterQuests());
''')
    html_parts.append('</script>')
    html_parts.append('</body></html>')

    html_path = os.path.join(BASE_DIR, "docs", "victoria_quests_map.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))
    print(f"  HTML: {html_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
