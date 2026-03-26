# Spec Coding 规范环境

## 概述

本目录为 BeiDou-Server 项目建立的 **Spec-Driven Development（规范驱动开发）** 环境，旨在通过结构化的工作流提升代码质量和开发可预测性。

## 核心理念

> **意图驱动开发**：在确定"如何做"之前，先明确"做什么"和"为什么做"

## 工作流阶段

| 阶段 | 名称 | 产物 | 核心问题 |
|------|------|------|----------|
| 0 | Constitution | 项目原则 | 我们遵循什么价值观？ |
| 1 | Spec | 功能规范 | 我们要构建什么？ |
| 2 | Plan | 技术计划 | 我们如何实现？ |
| 3 | Tasks | 任务清单 | 具体执行步骤是什么？ |
| 4 | Implement | 代码实现 | 按计划执行 |
| 5 | Review | 代码审查 | 符合规范吗？ |

## 目录结构

```
spec/
├── README.md                    # 本文件
├── 00-constitution/             # 项目指导原则
│   └── constitution.md
├── 01-specs/                    # 功能规范文档
│   └── README.md
├── 02-plans/                    # 技术实现计划
│   └── README.md
├── 03-tasks/                    # 任务清单
│   └── README.md
├── 04-reviews/                  # 代码审查记录
│   └── README.md
└── templates/                    # 文档模板
    ├── spec-template.md
    ├── plan-template.md
    ├── tasks-template.md
    └── review-template.md
```

## 自动识别机制

CodeBuddy 将根据任务特征自动选择工作流：

### 完整流程场景（走完所有阶段）
- 新功能开发
- 系统重构
- 多模块联动修改
- 架构调整

### 简化流程场景（跳过部分阶段）
- 快速修复（fix）→ Spec → Implement → Review
- 单一模块小改动 → Implement → Review
- 文档更新 → Review
- 紧急热修 → Implement → Review（后补 Spec/Plan）

### 判断依据

CodeBuddy 会分析：
1. 任务描述中的关键词（新功能、重构、修复、文档等）
2. 影响范围（单文件/单模块/多模块/架构级）
3. 复杂度评估（代码行数、依赖关系、风险等级）
4. 紧急程度标记（hotfix、urgent 等）

## 强制执行策略

1. **工作流产物必须齐全**才能进入下一阶段
2. **Review 通过是代码合并的必要条件**
3. **规范文档优先**：实现必须符合 Spec/Plan，不符合需先更新文档
4. **变更必须同步**：代码变更后，相关文档必须同步更新

## 使用指南

### 启动新的开发任务

```
用户: "我想添加一个新的职业：影武者"
CodeBuddy: 检测为新功能开发，启动完整工作流
```

### 查看当前进行中的任务

```
用户: "查看当前 spec 状态"
CodeBuddy: 列出所有进行中的 Spec/Plan/Tasks
```

### 快速修复场景

```
用户: "修复角色升级时经验不正确的 bug"
CodeBuddy: 识别为快速修复，启动简化流程
```

## 与现有文档的关系

- `docs/17-development-guide.md` - 开发流程指南
- `docs/18-coding-standards.md` - 编码规范
- `spec/` - Spec 规范环境（本文档体系）

**规范优先级**：spec 目录下的规范文件 > docs 目录下的通用规范

---

*最后更新: 2026-03-27*
