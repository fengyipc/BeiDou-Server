---
name: quest-wz-translate
description: |
  Translates Quest.wz game strings to Simplified Chinese for this MapleStory server repo.
  Use when editing wz-zh-CN/Quest.wz XML, batch-translating quests, resuming translation from progress JSON,
  or aligning terms with glossary/gmlingua. Covers QuestInfo/Say/Act strings, reference lookup from wz/Quest.wz
  when zh-CN text is unreadable (e.g. question marks), in-place write-back rules, and parallel Subagent workflows
  via batch_export.py / batch_merge.py (e.g. 50 units per batch).
---

# Quest.wz 中文翻译（项目 Skill）

**目标语言**：简体中文（与 `glossary` 的 `zh` 及 `wz-zh-CN` 目录一致）。

## 必读文档

- WZ 结构：[docs/27-wz-data-parsing.md](../../../docs/27-wz-data-parsing.md) §8 Quest.wz
- 任务系统语义：[docs/11-quest-module.md](../../../docs/11-quest-module.md)
- 通用术语检索：先遵循 [.codebuddy/skills/gmlingua/SKILL.md](../../../.codebuddy/skills/gmlingua/SKILL.md)（`glossary_lookup.py`、[glossary_schema.md](../../../.codebuddy/skills/gmlingua/references/glossary_schema.md)）

## 数据范围

| 角色 | 路径 |
|------|------|
| 扫描与写回 | `wz-zh-CN/Quest.wz/`（仅此树被修改） |
| 只读参考 | `wz/Quest.wz/`（当 `wz-zh-CN` 中某段为不可读占位时，按 **同 questId + 同 XML 文件 + 同逻辑路径** 取原文再译） |

## 工作流

1. **生成/更新进度表**（从仓库根 `gms-server` 执行）：

   ```bash
   python .cursor/skills/quest-wz-translate/scripts/scan_quest_wz.py --merge
   ```

2. **按 `targetZh` 与 glossary 翻译**：对 `needsTranslation: true` 的单元，优先用 `referenceText`（若有）作为源文；否则用 `sourceText`。韩文/英文先译成自然中文，再用 `glossary_lookup.py` 对齐专有名词（可试 `--field-type quest00`）。

3. **写回 XML**：只改 `wz-zh-CN/Quest.wz` 下对应文件；保留 `#b` `#k` `#p` `#m` `#t` `#i` `#c`、`\n`、`\r` 等客户端标记；属性中的 `"` 须写成 `&quot;`，`&` 注意转义。

## 双树规则（简）

- **不可读**（如去掉 `#…#` 标记后几乎全是 `?` / `U+FFFD`）：以 `wz/Quest.wz` 同路径 `referenceText` 为准翻译；若参考缺失，仅依赖 `sourceText` 或人工。
- **`wz/Quest.wz` 永不写入**。

## 并行 Subagent（每批 50 条）

**原则**：多路并行时**不要**多人同时直接改同一份 `quest-translation-memory.json`（易覆盖）。应 **导出批次 → 各 Subagent 只译本批 → 主 Agent 串行合并**。

1. **主 Agent（编排）**在 `gms-server` 根目录导出第 `N` 批（每批 50 条 `needsTranslation`，按 `unitId` 排序）：

   ```bash
   python .cursor/skills/quest-wz-translate/scripts/batch_export.py --batch-index N --batch-size 50
   ```

   默认输出：`tools/quest-wz-translate/batches/batch-NNNN.json`。

2. **Subagent**：只读取该 batch 内 `units`，按上文规则翻译；产出 **`batch-NNNN.done.json`**（或任意文件名），结构二选一：
   - `{"updates": [ {"unitId": "…", "targetZh": "…", "status": "done", "glossaryRefs": null } ]}`
   - 或带完整条目的 `{"units": [ … ]}`（需含 `unitId` 与译文字段）。

3. **主 Agent（单线程）合并**回总表（对每个完成的 batch **顺序执行一次**）：

   ```bash
   python .cursor/skills/quest-wz-translate/scripts/batch_merge.py tools/quest-wz-translate/batches/batch-NNNN.done.json
   ```

4. **写回 `wz-zh-CN/Quest.wz` XML**：建议仍 **串行** 或 **按 XML 文件分片** 并行，避免同一 `.xml` 多进程同时写。

5. **重新扫描**（可选）：合并一批并改完 XML 后，可用 `scan_quest_wz.py --merge` 与磁盘对齐。

### 给编排 Agent 的提示（可复制）

在新对话中粘贴：

> 你是编排 Agent：工作区为 `gms-server`，遵循 Skill `.cursor/skills/quest-wz-translate/SKILL.md`。用 `batch_export.py` 按 `--batch-index` 每次导出 50 条待译；为每个 batch 派一个 Subagent，只翻译该 JSON 中的 `units`，返回 `updates` 数组（`unitId` + `targetZh` + `status: done`）。你在主线程**依次**对每个 batch 调用 `batch_merge.py` 合并进 `tools/quest-wz-translate/quest-translation-memory.json`，不要并行写同一 memory 文件。术语用 `glossary_lookup.py`。译完再写回 `wz-zh-CN/Quest.wz`（只改中文树）。

## 辅助脚本

- `scripts/scan_quest_wz.py`：扫描、不可读检测、`referenceText` 填充、`--merge` 续进度。
- `scripts/batch_export.py` / `scripts/batch_merge.py`：并行分批导出、串行合并。
- 详见 [scripts/README.md](scripts/README.md)；进阶：[references/workflow.md](references/workflow.md)。
