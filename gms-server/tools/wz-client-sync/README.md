# wz-zh-CN → 客户端 `.img` 同步

将仓库内 HaRepacker 风格的 `wz-zh-CN/**/*.img.xml` 编码为 GMS 经典 WZ 二进制 `.img`（与 V083 等老客户端散文件布局兼容）。

## 依赖

```bash
cd tools/wz-client-sync
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## 用法

`--client-root` 指向客户端资源根目录（其下应有 `String/`、`Quest/`、`Etc/` 等子目录，与 `String.wz`、`Quest.wz` 对应）：

```bash
# 仅预览输出路径
.venv/bin/python sync_wz_zh_cn_to_client.py \
  --wz-zh-cn ../../wz-zh-CN \
  --client-root /path/to/your/client/img/root \
  --dry-run

# 实际写入
.venv/bin/python sync_wz_zh_cn_to_client.py \
  --wz-zh-cn ../../wz-zh-CN \
  --client-root /path/to/your/client/img/root \
  --verbose
```

映射规则：`wz-zh-CN/String.wz/Foo.img.xml` → `<client-root>/String/Foo.img`。

## 限制

- 仅支持 XML 中的 `imgdir`、`string`、`int`、`short`、`float`、`double`、`null`、`vector`。含 **`canvas` / `sound` / `uol` / `convex` 等** 的文件会跳过（当前仓库仅 `Etc.wz/EmotionEffect.img.xml` 因 `canvas` 被跳过），需用 HaRepacker 等工具处理。
- 字符串使用与官方一致的 GMS IV + 默认 UserKey；游戏内中文正常时，UTF-8 XML 会按 MapleLib 规则写入 Unicode 串。

## 自检

`_dustinlieu_reader/` 为只读解析器（已修正扩展块与 offset 串的解析）。可在脚本中调用 `encode_img_xml_to_bytes` + `load_image_from_bytes` 做往返测试。
