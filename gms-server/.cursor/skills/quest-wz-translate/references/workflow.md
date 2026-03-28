# Quest.wz 翻译工作流补充

## Glossary 检索（与 gmlingua 一致）

```bash
# 在 gms-server 根目录执行
python .codebuddy/skills/gmlingua/scripts/glossary_lookup.py "<词或 ID>" --limit 20
python .codebuddy/skills/gmlingua/scripts/glossary_lookup.py "<英文片段>" --mode en --field-type quest00
```

## 韩文源

1. 先理解剧情，译为通顺简体中文。
2. 用 glossary 的 **英文或中文** 核对 NPC、地图、道具、技能名；`--mode en` 适合从英文关键词反查。

## 不可读 `wz-zh-CN` + `wz` 参考

1. 以扫描结果中的 `referenceText` 为主译；占位符结构应与 `sourceText` 一致（同样数量的 `#…#`）。
2. 译完将 `targetZh` 填入 memory JSON，再写回 `wz-zh-CN` 对应 `string` 的 `value`。

## 写回注意

- 文件编码 UTF-8。
- XML 属性：`"` → `&quot;`，`&` → `&amp;`，`'` → `&apos;`（与现有文件风格一致即可）。
