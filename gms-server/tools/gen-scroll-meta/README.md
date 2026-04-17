# gen-scroll-meta

从 `wz/Item.wz/Consume/*.img.xml` 提取每个卷轴的 `info` 节点下的 `inc*` 属性、成功率等元数据，并生成"防御卷轴 ID 白名单"。

> 本工具仅在 WZ 数据变更或需要刷新白名单时**离线运行**，不在运行时被游戏服务端 / 脚本调用。

## 用法

在仓库根目录执行：

```bash
node tools/gen-scroll-meta/index.js
```

或进入本目录：

```bash
cd tools/gen-scroll-meta
node index.js
```

运行后将在当前目录输出两份产物：

| 文件 | 用途 |
|------|------|
| `scroll-meta.json` | 完整元数据，数组项含 `id / incs / success / cursed / isDefense / sourceFile`，按 `id` 升序，可用于开发者 diff、排查与审计 |
| `scroll-defense-ids.js` | 仅防御卷轴 ID 数组常量 `DEFENSE_SCROLL_IDS`，供 `scripts-zh-CN/BeiDouSpecial/兑换卷轴.js` 复制合并 |

## 防御卷轴判定规则

一个卷轴被判定为**防御卷轴**，当且仅当：

- 其 `info` 节点下**存在至少一个** `inc*` 属性；
- 所有 `inc*` 属性均属于以下集合：

| 字段 | 含义 |
|------|------|
| `incPDD` | 物理防御力 |
| `incMDD` | 魔法防御力 |
| `incMHP` | 最大 HP |
| `incMMP` | 最大 MP |

任何含 `incPAD / incMAD / incSTR / incDEX / incINT / incLUK / incACC / incEVA / incSpeed / incJump` 等字段的卷轴都**不是**防御卷轴。

## 约定与注意事项

- 解析层面只识别 `<int name="inc*" value="N"/>` 字段，对 `<uol>`（UOL 引用）、`<canvas>`（图片）等节点一律忽略。
- 物品 ID 在 WZ 中以 8 位字符串形式出现（如 `02040001`），输出 JSON 时会去除前导 0，转为 7 位数字（`2040001`），与游戏物品 ID 对齐。
- 输出保证稳定：JSON 固定 2 空格缩进、键有序；ID 数组按升序排列。多次运行产物 diff 应为空。
- 无第三方依赖：仅使用 Node.js 内置 `fs` / `path`。

## 合并到 兑换卷轴.js 的流程

1. 运行 `node tools/gen-scroll-meta/index.js` 生成最新 `scroll-defense-ids.js`；
2. 将其中 `DEFENSE_SCROLL_IDS` 数组内容复制到 `scripts-zh-CN/BeiDouSpecial/兑换卷轴.js` 对应常量处；
3. 通过 `isDefenseScroll(itemId)` 工具函数在运行时查询，避免脚本直接依赖本工具。
