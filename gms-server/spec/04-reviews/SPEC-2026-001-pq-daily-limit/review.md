# 审查记录 SPEC-2026-001

## 对照 Spec 自检

| 项 | 结果 |
|----|------|
| `getEligibleParty` 后按次数过滤 | 已实现 `PartyQuestDailyLog.filterEligible` |
| 组队 `startInstance` 成功进本后记账 | 已在 `registerParty` 之后、`setEligibleMembers(null)` 前 `recordAttempts` |
| 每日清理 PQ 行 | 已在 `ExpeditionBossLog.resetBossLogTable` 日重置分支增加 `PQ_%` DELETE |
| 默认关闭 | `pq_daily_limit_enabled` 默认 `false` |
| Flyway 与 `bosslog` DDL | `V2.0.3` 将 `bosstype` 改为 VARCHAR(32) |

## 备注

- 未改 NPC 脚本；超额时仍可能显示泛化「不符合条件」提示。
