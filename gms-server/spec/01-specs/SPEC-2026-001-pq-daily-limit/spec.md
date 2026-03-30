# 功能规范文档 Spec

## 基本信息

| 字段 | 内容 |
|------|------|
| 规范编号 | SPEC-2026-001 |
| 功能名称 | 组队副本每日参与次数限制 |
| 创建日期 | 2026-03-30 |
| 最后更新 | 2026-03-30 |
| 状态 | implemented |
| 负责人 | — |

---

## 1. 功能概述

### 1.1 背景

运营需要对组队 Party Quest（PQ）副本按角色限制每日进入次数，防止过度刷取；需与现有 Spec-Driven 流程对齐，并在服务端集中校验与记账。

### 1.2 目标

- 按**角色**（character id）统计每个 PQ（以 Event 脚本名为准）的每日参与次数。
- 支持**全局开关**、**默认次数**、**按副本名单独覆盖**；可选**排除名单**不参与限制。
- 默认开启限制，默认每日 5 次（可在 `game_config` 关闭或调整）。

### 1.3 范围

- **包含**：通过 `EventManager.getEligibleParty` + `startInstance(Party, ...)` 进入的组队 PQ 流程；成功 `registerParty` 后记一次参与。
- **不包含**：单人 `startInstance(Character)`、远征 BOSS（已有 `ExpeditionBossLog`）、非标准调用顺序（未先 `getEligibleParty`）的脚本行为。

---

## 2. 功能需求

### 2.1 核心功能

| 功能点 | 描述 | 优先级 |
|--------|------|--------|
| F001 | 在 `getEligibleParty` 返回后，按配置过滤已达当日上限的成员 | P0 |
| F002 | 在组队 PQ 成功开图后，为每位实际进本成员写入一条当日记录 | P0 |
| F003 | 每日与远征 bosslog 同日滚动清理 PQ 记录 | P0 |
| F004 | GameConfig 可配置开关、默认次数、覆盖 Map、排除列表 | P0 |

### 2.2 用户交互流程

队长与 NPC 对话 → `getEligibleParty`（脚本条件 + 次数过滤）→ 若仍满足人数等条件则可 `startInstance` → 成功进本后计次。

### 2.3 数据需求

| 数据 | 来源 | 存储 |
|------|------|------|
| 参与记录 | 成功开图 | `bosslog_daily.bosstype = PQ_<EventName>` |

---

## 3. 业务规则

### 3.1 规则

| 规则编号 | 规则描述 |
|----------|----------|
| BR001 | 计次维度为角色 + PQ（EventManager 名称，与 `scripts/event` 脚本名一致） |
| BR002 | 仅在组队 `startInstance` 成功且已 `registerParty` 后写入 |
| BR003 | 过滤后若不再满足脚本内人数/队长等条件，返回空列表，NPC 沿用原有泛化提示 |

### 3.2 异常处理

| 场景 | 处理方式 |
|------|----------|
| 全局关闭 | 不做过滤与额外写入（与未上线功能一致） |
| 副本在排除列表 | 不限制 |

---

## 4. 验收标准

- 开启限制且默认 1 次时，同一角色同一 PQ 第二次当日无法再出现在 `getEligibleParty` 结果中（在等级地图等仍满足的前提下）。
- 成功进本后 `bosslog_daily` 中对应 `PQ_*` 行数增加。
- 每日任务跑完后前一日 PQ 记录被清理。

---

## 5. 影响分析

### 5.1 数据库变更

- `bosslog_daily` / `bosslog_weekly` 的 `bosstype` 需支持 `PQ_*` 字符串（若原为 ENUM 则改为 VARCHAR）。

### 5.2 配置项（server）

- `pq_daily_limit_enabled`（boolean，默认 true）
- `pq_daily_limit_default`（int，默认 5）
- `pq_daily_limit_overrides`（JSON 对象，键为 Event 名）
- `pq_daily_limit_excluded`（JSON 字符串数组，可选）

---

## 6. 关联文档

- [spec/02-plans/SPEC-2026-001-pq-daily-limit/plan.md](../../02-plans/SPEC-2026-001-pq-daily-limit/plan.md)

---

*规范编号: SPEC-2026-001*
