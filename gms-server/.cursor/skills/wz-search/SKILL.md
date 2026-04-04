---
name: wz-search
description: |
  Search and query MapleStory WZ game data by ID or name. Covers NPC, Item, Quest, Map, Mob, Skill,
  Equipment stats, and Crafting recipes. Pulls from both wz/ (EN) and wz-zh-CN/ (ZH) sources.
  Use when looking up any game entity information for development, debugging, translation, or data review.
---

# WZ 游戏数据搜索

在 `gms-server` 根目录执行所有命令。

## 快速开始

```bash
# 1. 首次使用：构建索引（约 10-30 秒，之后自动检测是否需要重建）
python .cursor/skills/wz-search/scripts/build_index.py

# 2. 搜索
python .cursor/skills/wz-search/scripts/wz_search.py <子命令> --id <ID> 或 --name <关键词>
```

## 子命令

| 子命令 | 说明 | 示例 |
|--------|------|------|
| `npc` | NPC 信息 | `wz_search.py npc --id 1012000` |
| `item` | 物品信息（消耗/材料/现金/宠物/椅子） | `wz_search.py item --name "Elixir"` |
| `quest` | 任务信息 | `wz_search.py quest --id 2010` |
| `map` | 地图信息 | `wz_search.py map --name "Henesys"` |
| `mob` | 怪物信息 | `wz_search.py mob --name "蜗牛"` |
| `skill` | 技能信息 | `wz_search.py skill --name "Arrow Rain"` |
| `equip` | 装备详情（属性需求 + 增益） | `wz_search.py equip --id 1302000` |
| `craft` | 合成配方 | `wz_search.py craft --item 4250000` |

## 通用参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--id ID` | 精确 ID 查询 | - |
| `--name KEYWORD` | 名称子串匹配（中英文均可，不区分大小写） | - |
| `--limit N` | 限制结果数量 | 10 |
| `--json` | 输出 JSON 格式 | 否（默认人类可读文本） |
| `--detail` | 加载详细信息（按需解析额外 WZ 文件） | 否 |

## 各子命令输出字段

### npc
- 基础：ID, 名称(EN/ZH), 功能(func), 所在地图(ID+名称)
- `--detail`：关联任务列表, 是否有 NPC 脚本文件

### item
- 基础：ID, 名称(EN/ZH), 描述, 分类(Consume/Cash/Etc/Ins/Pet)
- `--detail`：价格, 堆叠上限, 使用效果（消耗品 spec）

### quest
- 基础：ID, 名称(EN/ZH), 区域, 关联 NPC
- `--detail`：触发条件（等级/职业/前置任务/物品）, 完成条件（物品/击杀怪物）, 奖励（经验/金币/物品）, 前后任务链, 对话摘要

### map
- 基础：ID, 街道名(EN/ZH), 地图名(EN/ZH)
- `--detail`：NPC 列表, 怪物列表, 传送门目标, returnMap, BGM, 是否城镇

### mob
- 基础：ID, 名称(EN/ZH), 等级, HP, EXP
- `--detail`：全属性（攻防/命中/回避）, 出现地图, 掉落物品

### skill
- 基础：ID, 名称(EN/ZH), 描述, 所属职业/书名
- `--detail`：各等级属性（h1, h2, …）

### equip
- 基础：ID, 名称(EN/ZH), 描述, 装备槽位
- `--detail`：需求属性(reqLevel/reqSTR/…), 增益属性(incSTR/incPDD/…), 升级次数(tuc), 价格

### craft
- 配方 ID, 产出物品, 所需等级, 所需金币, 原料列表(物品ID+数量), 随机产物

## 索引

索引存储在 `tools/wz-search/wz-index.json`。`build_index.py` 会记录 WZ 文件的修改时间。
如果 WZ 文件有变更，重新运行 `build_index.py` 即可更新。

## 数据来源

| 数据 | 名称/字符串 | 属性/详情 |
|------|-------------|-----------|
| NPC | `String.wz/Npc.img.xml` | `Etc.wz/NpcLocation.img.xml`, `Quest.wz/Check.img.xml` |
| 物品 | `String.wz/{Eqp,Consume,Cash,Etc,Ins,Pet}.img.xml` | `Item.wz/…`, `Character.wz/…` |
| 任务 | `Quest.wz/QuestInfo.img.xml` | `Quest.wz/{Check,Act,Say}.img.xml` |
| 地图 | `String.wz/Map.img.xml` | `Map.wz/Map/Map*/{id}.img.xml` |
| 怪物 | `String.wz/Mob.img.xml` | `Mob.wz/{id}.img.xml`, `String.wz/MonsterBook.img.xml` |
| 技能 | `String.wz/Skill.img.xml` | `Skill.wz/{job}.img.xml` |
| 装备 | `String.wz/Eqp.img.xml` | `Character.wz/{slot}/{id}.img.xml` |
| 合成 | — | `Etc.wz/ItemMake.img.xml` |
