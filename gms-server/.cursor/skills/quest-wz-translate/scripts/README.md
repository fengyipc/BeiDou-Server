# scan_quest_wz.py

在 **`gms-server` 仓库根目录**下执行（脚本会自动 `chdir` 到该根，或通过 `--cwd` 指定）。

## 用法

```bash
python .cursor/skills/quest-wz-translate/scripts/scan_quest_wz.py
python .cursor/skills/quest-wz-translate/scripts/scan_quest_wz.py --merge
python .cursor/skills/quest-wz-translate/scripts/scan_quest_wz.py --no-reference
python .cursor/skills/quest-wz-translate/scripts/scan_quest_wz.py --files QuestInfo.img.xml
```

## 输出

默认写入 `tools/quest-wz-translate/quest-translation-memory.json`。字段见 Skill 与生成文件内注释。

## Git

若文件过大，可在 `tools/quest-wz-translate/.gitignore` 中忽略 `quest-translation-memory.json`。

---

# batch_export.py / batch_merge.py

并行翻译：先导出每批 50 条，Subagent 只产出 `updates`；主 Agent **串行** `batch_merge`。

```bash
# 导出第 0 批（50 条）
python .cursor/skills/quest-wz-translate/scripts/batch_export.py --batch-index 0 --batch-size 50

# 将 Subagent 写好的结果合并回总表（updates 文件含 {"updates":[...]}）
python .cursor/skills/quest-wz-translate/scripts/batch_merge.py tools/quest-wz-translate/batches/batch-0000.done.json
```

`batch_merge` 的输入示例：

```json
{
  "updates": [
    {
      "unitId": "<sha256>",
      "targetZh": "简体中文译文",
      "status": "done",
      "glossaryRefs": null
    }
  ]
}
```
