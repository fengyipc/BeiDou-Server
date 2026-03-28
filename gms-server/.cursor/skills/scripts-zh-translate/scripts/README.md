# scripts-zh-translate 脚本

在 **`gms-server` 仓库根目录**执行以下命令（路径相对于该根目录）。

## 依赖

```bash
npm install
```

需要 `devDependencies` 中的 `@babel/parser`（由 `extract_script_strings.mjs` 使用）。

## 命令

| 脚本 | 作用 |
|------|------|
| `scan_script_strings.py` | 扫描 `scripts-zh-CN` 的 npc/quest/reactor，写入 `tools/scripts-zh-translate/script-translation-memory.json` |
| `scan_script_strings.py --merge` | 同上，并按「文件 + sourceText + callee」顺序合并已有 `targetZh` |
| `batch_export.py --batch-index N` | 导出第 N 批待译单元到 `tools/scripts-zh-translate/batches/` |
| `batch_merge.py batches/batch-XXXX.done.json` | 将 Subagent 产出的 `updates` 合并进 memory |
| `apply_script_translations.py` | 按 UTF-8 字节区间把 `targetZh` 写回 `.js` |
| `apply_script_translations.py --dry-run` | 仅校验，不写文件 |

### 示例

```bash
python .cursor/skills/scripts-zh-translate/scripts/scan_script_strings.py --merge
python .cursor/skills/scripts-zh-translate/scripts/batch_export.py --batch-index 0 --batch-size 50
python .cursor/skills/scripts-zh-translate/scripts/batch_merge.py tools/scripts-zh-translate/batches/batch-0000.done.json
python .cursor/skills/scripts-zh-translate/scripts/apply_script_translations.py --dry-run
python .cursor/skills/scripts-zh-translate/scripts/apply_script_translations.py
```

## 输出路径

- 记忆文件：`tools/scripts-zh-translate/script-translation-memory.json`
- 批次目录：`tools/scripts-zh-translate/batches/`

可将上述路径加入 `.gitignore`，或纳入版本管理以便团队共享进度，按项目习惯选择。

## 解析失败

若 `scan_script_strings.py` 报告 `parseErrors > 0`，查看 memory 中 `stats.parseErrorFiles`。常见原因：字符串里含未转义的英文双引号（如 `"Sigils"` 写在双引号字符串内）、或脚本本身花括号不匹配。需先修正对应 `.js` 后再重新扫描。
