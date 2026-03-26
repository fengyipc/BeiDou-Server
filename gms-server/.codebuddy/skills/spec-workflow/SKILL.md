---
name: spec-workflow
description: |
  This skill should be used when developing new features, fixing bugs, or performing any coding tasks
  in the BeiDou-Server MapleStory game server project. It implements Spec-Driven Development workflow
  with Constitution, Spec, Plan, Tasks, Implement, and Review phases. The skill ensures code follows
  project conventions, maintains documentation consistency, and enforces quality standards.
  Trigger scenarios: user asks to add features, fix bugs, refactor code, or any development task.
---

# Spec-Workflow Skill

## Purpose

This skill establishes a structured Spec-Driven Development workflow for the BeiDou-Server project,
ensuring all code changes go through proper planning, documentation, and review phases.

## Workflow Overview

```
User Request → [Auto-Detect] → Complete Flow OR Simplified Flow
                                    ↓
                    Constitution → Spec → Plan → Tasks → Implement → Review
```

## Auto-Detection Rules

Analyze the user's request to determine workflow type:

### Complete Flow (All 6 phases)
- Keywords: "新功能"、"新模块"、"重构"、"架构调整"、"多模块"
- Impact: Multi-module or architecture-level changes
- Complexity: High (estimated >100 lines or multiple files)

### Simplified Flow (Skip to Implement → Review)
- Keywords: "修复"、"fix"、"bug"、"quick"、"hotfix"
- Impact: Single file or single module
- Complexity: Low (estimated <50 lines)

### Documentation Flow (Review only)
- Keywords: "文档"、"docs"、"注释"、"readme"
- Impact: Documentation only
- Skip Plan/Tasks

## Phase Execution

### Phase 0: Constitution
Reference: `references/constitution.md`

Before any development, load and follow the project constitution principles:
- Code quality: correctness, readability, maintainability
- Game server specifics: player experience, data integrity, security, performance
- Development process: spec-first, small commits, code review
- AI principles: intent confirmation, transparent decisions, controlled generation

### Phase 1: Spec (功能规范)
Reference: `references/spec-template.md`

1. Create spec document at `spec/01-specs/XXX/spec.md`
2. Document:
   - Feature overview and background
   - Core functionality requirements
   - User interaction flows
   - Business rules and constraints
   - Acceptance criteria
   - Impact analysis (modules, database, interfaces)
3. Assign spec number: `SPEC-YYYY-NNN`

### Phase 2: Plan (技术计划)
Reference: `references/plan-template.md`

1. Create plan document at `spec/02-plans/XXX/plan.md`
2. Document:
   - Technical decisions and architecture
   - Module/class design
   - API/interface design
   - Database schema changes
   - Implementation strategy
   - Testing strategy
   - Risk assessment
3. Assign plan number: `PLAN-YYYY-NNN`

### Phase 3: Tasks (任务清单)
Reference: `references/tasks-template.md`

1. Create tasks document at `spec/03-tasks/XXX/tasks.md`
2. Break down implementation into executable tasks:
   - Database tasks (DB- prefix)
   - Service tasks (SVC- prefix)
   - Network tasks (NET- prefix)
   - Script tasks (SCR- prefix)
   - Test tasks (TEST- prefix)
   - Documentation tasks (DOC- prefix)
3. Set priorities: P0 (must), P1 (should), P2 (could), P3 (later)
4. Identify dependencies between tasks

### Phase 4: Implement (代码实现)

Execute tasks following the plan:

1. **Follow project conventions**:
   - Java 21 with Spring Boot 3.2.3
   - Package: `org.gms.*`
   - Naming: PascalCase classes, camelCase methods/variables
   - Use Lombok annotations appropriately
   - Reference: `docs/18-coding-standards.md`

2. **Code format requirements**:
   - 4-space indentation (no tabs)
   - Line length: ≤120 characters
   - Braces: same-line opening, separate closing line
   - Import order: java.* → javax.* → org.gms.* → others

3. **Required checks before completing**:
   - All acceptance criteria met
   - No hardcoded values (use constants)
   - Proper error handling
   - Logging for important operations
   - Thread safety for concurrent access

### Phase 5: Review (代码审查)
Reference: `references/review-template.md`

1. Create review document at `spec/04-reviews/XXX/review.md`
2. Complete checklist:
   - Functional correctness
   - Security (input validation, permission checks)
   - Code quality (naming, formatting, comments)
   - Performance (database queries, concurrency)
   - Testing coverage
   - Documentation updates
3. Mark findings: `[must-fix]`, `[should-fix]`, `[suggest]`, `[nit]`

## Documentation Updates

When code changes are made, update relevant docs in same commit:

| Code Change | Required Doc Updates |
|-------------|---------------------|
| New feature | Spec, Plan, Tasks, Review |
| Bug fix | Review (with fix description) |
| API change | `docs/19-api-documentation.md` |
| Config change | `docs/26-configuration.md` |
| Database change | `docs/15-database-tables.md` |
| New module | `docs/03-project-structure.md` |

## Exception Handling

### Emergency Hotfix
For urgent fixes that cannot wait for full workflow:

1. Implement fix immediately
2. Mark commit with `[例外]`
3. In PR description, explain the exception
4. Complete documentation within 24 hours

### Experimental Features
For experimental work:

1. Create feature branch
2. Complete full workflow on branch
3. Merge only after complete review

## Quality Gates

The following are required before merging:

- [ ] All Spec acceptance criteria met
- [ ] All Plan tasks completed
- [ ] All Review `[must-fix]` items resolved
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] No `[nit]` issues remaining

## Template Files Location

All templates are in `spec/templates/`:
- `spec-template.md` - Spec document template
- `plan-template.md` - Plan document template
- `tasks-template.md` - Tasks document template
- `review-template.md` - Review document template

Full constitution: `spec/00-constitution/constitution.md`

## Workflow Commands Reference

### Starting a new feature
```
User: "我想添加一个新职业：影武者"
CodeBuddy: Create SPEC → Create PLAN → Create TASKS → Implement → Review
```

### Starting a bug fix
```
User: "修复角色升级时经验不正确的bug"
CodeBuddy: (Simplified) Analyze bug → Implement fix → Review
```

### Checking status
```
User: "查看当前spec状态"
CodeBuddy: List active specs, plans, tasks, and pending reviews
```
