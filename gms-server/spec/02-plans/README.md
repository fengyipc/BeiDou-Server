# 技术实现计划 Plans

本目录存放技术实现计划文档。

## 目录结构

```
02-plans/
├── README.md           # 本文件
└── [关联Spec编号]/     # 按 Spec 关联组织
    └── plan-xxx.md     # 计划文档
```

## 计划编号规则

`PLAN-YYYY-NNN`
- `YYYY`: 年份
- `NNN`: 序号

示例：`PLAN-2026-001`

## 状态说明

| 状态 | 说明 |
|------|------|
| `draft` | 草稿中 |
| `reviewing` | 审查中 |
| `approved` | 已批准 |
| `rejected` | 已拒绝 |
| `implemented` | 已实现 |

## 创建新计划

1. 关联的 Spec 必须已批准
2. 复制 `templates/plan-template.md` 作为基础
3. 填写技术方案
4. 提交审查

---

*最后更新: 2026-03-27*
