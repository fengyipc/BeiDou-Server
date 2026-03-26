# Spec 驱动开发工作流 - 快速参考

## 工作流类型判断

### 完整流程 (6 phases)
**触发条件**:
- 新功能开发
- 系统重构
- 多模块改动
- 架构调整

**流程**: Constitution → Spec → Plan → Tasks → Implement → Review

### 简化流程 (2 phases)
**触发条件**:
- Bug 修复 (fix)
- 单文件/单模块改动
- 简单任务

**流程**: Implement → Review

## 文档位置

| 文档类型 | 位置 |
|----------|------|
| Constitution | `spec/00-constitution/constitution.md` |
| Spec | `spec/01-specs/{feature}/spec.md` |
| Plan | `spec/02-plans/{feature}/plan.md` |
| Tasks | `spec/03-tasks/{feature}/tasks.md` |
| Review | `spec/04-reviews/{feature}/review.md` |

## 文档编号规则

| 类型 | 格式 | 示例 |
|------|------|------|
| Spec | `SPEC-YYYY-NNN` | `SPEC-2026-001` |
| Plan | `PLAN-YYYY-NNN` | `PLAN-2026-001` |
| Tasks | `TASKS-YYYY-NNN` | `TASKS-2026-001` |
| Review | `REVIEW-YYYY-NNN` | `REVIEW-2026-001` |

## 状态流转

### Spec 状态
`draft` → `clarifying` → `approved` → `implemented`

### Plan 状态
`draft` → `reviewing` → `approved` → `implemented`

### Tasks 状态
`pending` → `doing` → `done` (或 `blocked`)

### Review 结论
`pending` → `approved` / `requested_changes` / `rejected`

## 任务分类前缀

| 前缀 | 分类 |
|------|------|
| `DB-` | 数据库任务 |
| `SVC-` | 后端服务任务 |
| `NET-` | 网络协议任务 |
| `SCR-` | 脚本任务 |
| `TEST-` | 测试任务 |
| `DOC-` | 文档任务 |

## 任务优先级

| 优先级 | 说明 |
|--------|------|
| `P0` | 必须完成，阻塞主线 |
| `P1` | 应该完成，功能核心 |
| `P2` | 可以完成，增强功能 |
| `P3` | 后续处理，优化改进 |

## 质量门禁

合并前必须满足：
- [ ] 所有 Spec 验收标准达成
- [ ] 所有 Plan 任务完成
- [ ] 所有 Review `[must-fix]` 已处理
- [ ] 测试通过（如有）
- [ ] 文档已更新

## 例外情况

紧急 hotfix 可先合入，但需：
1. Commit 标记 `[例外]`
2. 24 小时内补齐文档
3. PR 说明原因
