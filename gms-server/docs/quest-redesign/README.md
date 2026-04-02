# 冒险岛任务系统重构项目

## 项目目标

将冒险岛 v83 的任务系统从零散的独立任务重构为 **主线 + 副线 + 支线** 三层结构：

- **主线**：沿等级引导跨区域旅行的完整冒险故事（Lv10~180）
- **副线**：各区域内的完整主题故事线（每条 5~20 个任务）
- **支线**：个别 NPC 的独立短故事（2~5 个任务）

## 文档索引

| 文件 | 内容 | 状态 |
|------|------|------|
| [PROGRESS.md](PROGRESS.md) | **项目进度跟踪** — 整体框架 + Boss总表 + 各幕概览 | 持续更新 |
| [act1-victoria-island.md](act1-victoria-island.md) | 第一幕·金银岛：主线现状 + 10 条副线 + 支线 + 衔接设计 | **进行中** |
| act2-ossyria.md | 第二幕·神秘岛：天空之城 + 冰峰雪域 + 水下世界 | 待开始 |
| act3-time-and-dragon.md | 第三幕·时间与龙：玩具城 + 神木村 | 待开始 |
| act4-temple-of-time.md | 第四幕·时间尽头：时间神殿 | 待开始 |
| independent-regions.md | 独立区域副线：地球防御总部/武陵/沙漠/童话村/海外 | 待开始 |

## 主线等级路线

```
Lv.1~10    彩虹岛（教程）
Lv.10~35   金银岛（第一幕：职业线 → 地狱大公 Lv32）
Lv.35~50   天空之城（第二幕·上：城市危机 + 上古魔书前半）
Lv.45~55   水下世界浅海（第二幕·穿插：海洋异变 → 歇尔夫 Lv45）
Lv.55~75   冰峰雪域（第二幕·下：上古魔书后半 → 雪山魔女 Lv64 → 黑山老妖 Lv74）
Lv.75~105  玩具城（第三幕·上：死守玩具城 → 时间门神+黑甲凶灵 Lv108）
Lv.100~130 神木村（第三幕·下：龙之大陆 → 火焰龙 Lv105 → 大海兽 Lv120）
Lv.120~160 时间神殿（第四幕：追忆→后悔→忘却 → 品克缤 Lv180）
```

## 设计原则

- **最大化复用**：优先将现有任务编入框架，最小化新建任务
- **不造新实体**：不新增游戏中不存在的 NPC、怪物；尽量不新增物品。所有设计基于现有 WZ 数据中已有的实体
- **因果链条**：每条线的任务之间要有叙事逻辑
- **等级匹配**：Boss 等级与玩家等级差控制在 10 级以内
- **职业共享**：主线和副线不限职业（职业专属内容标注 `[职业限定]`）

## 相关参考文档

- [all_quests_data.json](../all_quests_data.json) — 全量任务结构化数据（供检索、统计与编排对照）
- [11-quest-module.md](../11-quest-module.md) — 服务端任务模块：生命周期、条件/奖励与脚本入口
- [27-wz-data-parsing.md §8 Quest.wz](../27-wz-data-parsing.md#quest-wz-data) — WZ 解析文档：`QuestInfo` / `Check` / `Act` / `Say` 与任务 ID 关联
- [victoria_quests_summary.md](../victoria_quests_summary.md) — 金银岛全部 357 个任务汇总
- [victoria-npc-profiles.md](../victoria-npc-profiles.md) — 金银岛 55 位 NPC 画像
- [ossyria-npc-profiles.md](../ossyria-npc-profiles.md) — 神秘岛 NPC 画像
- [ludibrium-npc-profiles.md](../ludibrium-npc-profiles.md) — 玩具城地区 NPC 画像
- [region-level-distribution.md](../region-level-distribution.md) — 全区域怪物/任务等级分布
- [job-quest-analysis.md](../job-quest-analysis.md) — 职业任务分析
