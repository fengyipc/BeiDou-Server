---
name: scripts-zh-translate
description: |
  Batch-translates remaining English (or Korean) player-visible strings in scripts-zh-CN npc/quest/reactor
  JS to Simplified Chinese. Uses translation memory JSON, batch export/merge for Subagents, and safe UTF-8
  byte-offset apply. Align terminology with gmlingua glossary. Mirrors quest-wz-translate orchestration.
---

# scripts-zh-CN 脚本玩家文案中文化

**目标语言**：简体中文（与 `wz-zh-CN`、`glossary` 的 `zh` 一致）。

## 必读文档

- 脚本结构与 API：[docs/28-scripting-development.md](../../../docs/28-scripting-development.md)（`cm` / `qm` / `rm`、NextLevel、`#b#k` 等标记）
- 脚本加载顺序：[docs/13-scripting-module.md](../../../docs/13-scripting-module.md)
- 术语检索：[.codebuddy/skills/gmlingua/SKILL.md](../../../.codebuddy/skills/gmlingua/SKILL.md)（`glossary_lookup.py`）

## 数据范围

| 角色 | 路径 |
|------|------|
| 扫描与写回 | `scripts-zh-CN/npc/`、`scripts-zh-CN/quest/`、`scripts-zh-CN/reactor/` |
| 只读参考 | `scripts/npc/`、`scripts/quest/`、`scripts/reactor/`（同名相对路径，用于 `referenceText`） |

## 工作流

在仓库 **`gms-server` 根目录**执行（脚本位于 `.cursor/skills/scripts-zh-translate/scripts/`）。

### 1. 生成 / 更新翻译记忆

```bash
python .cursor/skills/scripts-zh-translate/scripts/scan_script_strings.py --merge
```

首次不加 `--merge` 会新建 `tools/scripts-zh-translate/script-translation-memory.json`。

### 2. 并行 Subagent（每批 50 条）

**原则**：多路并行时**不要**同时直接改同一份 `script-translation-memory.json`。应 **导出批次 → 各 Subagent 只译本批 → 主 Agent 串行合并**。

1. **主 Agent** 导出第 `N` 批：

   ```bash
   python .cursor/skills/scripts-zh-translate/scripts/batch_export.py --batch-index N --batch-size 50
   ```

   输出：`tools/scripts-zh-translate/batches/batch-NNNN.json`。

2. **Subagent**：只读本 batch 的 `units`，按 `referenceText`（若有）或 `sourceText` 译为自然中文，并用 `glossary_lookup.py` 对齐专有名词；产出 `batch-NNNN.done.json`：

   ```json
   {
     "updates": [
       { "unitId": "…", "targetZh": "…", "status": "done", "glossaryRefs": null }
     ]
   }
   ```

3. **主 Agent（单线程）**依次合并：

   ```bash
   python .cursor/skills/scripts-zh-translate/scripts/batch_merge.py tools/scripts-zh-translate/batches/batch-NNNN.done.json
   ```

### 3. 写回 JS

```bash
python .cursor/skills/scripts-zh-translate/scripts/apply_script_translations.py
```

可先 `--dry-run` 查看将替换的单元数量。写回后建议再执行一次 `scan_script_strings.py --merge` 校验。

## 规则摘要

- 保留 `#b` `#r` `#k` `#L` `#l` `#h #` `#t[…]#`、`\r\n` 等客户端标记；不要改 `#p` `#m` 等 ID 占位。
- **默认 `scripts/` 永不写入**（仅作英文参考）。
- `unitId` 含 UTF-8 字节偏移；文件被手工改动后若校验失败，应重新扫描再应用。

## 给编排 Agent 的提示（可复制）

> 你是编排 Agent：工作区为 `gms-server`，遵循 Skill `.cursor/skills/scripts-zh-translate/SKILL.md`。用 `batch_export.py` 按 `--batch-index` 每次导出 50 条 `needsTranslation`；为每个 batch 派一个 Subagent，只翻译该 JSON 中的 `units`，返回 `updates`（`unitId` + `targetZh` + `status: done`）。你在主线程**依次**对每个 batch 调用 `batch_merge.py` 合并进 `tools/scripts-zh-translate/script-translation-memory.json`，不要并行写同一 memory。术语用 `glossary_lookup.py`。合并后运行 `apply_script_translations.py` 写回 `scripts-zh-CN`。

## 辅助脚本

见 [scripts/README.md](scripts/README.md)。
