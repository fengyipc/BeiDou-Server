# 技术实现计划 Plan

## 基本信息

| 字段 | 内容 |
|------|------|
| 计划编号 | PLAN-2026-001 |
| 关联 Spec | SPEC-2026-001 |
| 创建日期 | 2026-03-30 |
| 状态 | approved |

---

## 1. 技术决策

| 决策项 | 方案 | 理由 |
|--------|------|------|
| 存储 | 复用 `bosslog_daily`，`bosstype = PQ_<EventName>` | 与远征共用每日滚动；需 DDL 将 ENUM 改为 VARCHAR |
| 校验与记账 | `EventManager.getEligibleParty` 过滤；`startInstance(Party,...)` 成功路径写入 | 单点维护，脚本零改动 |
| 配置 | `game_config` server 键 | 与现有 GameConfig 一致 |

## 2. 类与模块

| 类 | 职责 |
|----|------|
| `PartyQuestDailyLog` | 解析配置、计数、过滤成员、INSERT |
| `ExpeditionBossLog` | 每日重置中增加 `PQ_%` 清理 |

---

*关联 Spec: SPEC-2026-001*
