# COS 发布与自动更新

依赖：[coscli](https://github.com/tencentyun/coscli/releases)（或配置好的 `~/.cos.yaml`）、Python 3、`git`、`mvn`（打包由 `cos-helper.py` 标准库完成，无需系统 `zip` 命令）。

## Windows（原生 PowerShell）

`.sh` 脚本在 Windows 上需 **Git Bash / WSL** 才能直接跑。若要在 **cmd / PowerShell** 下使用，请用同目录下的 **`.ps1`**（逻辑与 bash 版一致）：

| Bash | PowerShell |
|------|------------|
| `deploy/publish.sh` | `deploy/publish.ps1` |
| `deploy/update.sh` | `deploy/update.ps1` |
| `deploy/run-with-update.sh` | `deploy/run-with-update.ps1` |

示例（在 `gms-server` 根目录打开 PowerShell）：

```powershell
# 若未开远程脚本执行：Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
.\deploy\update.ps1 -InitCommit <40位SHA>
.\deploy\publish.ps1
.\deploy\run-with-update.ps1              # 后台，日志 logs\beidou.log
.\deploy\run-with-update.ps1 -Foreground  # 前台
```

需已安装 **coscli**（可加入 PATH 或通过环境变量 `COSCLI` 指向 `coscli.exe`）、**Python 3**（`python` / `python3` / `py -3`，或通过 `PYTHON` 指定解释器路径）。`cos.env` 与 Linux/macOS 相同。

## 配置

1. 复制 [`cos.env.example`](cos.env.example) 为 `cos.env` 并填写 `COS_BUCKET`、`COS_PREFIX`、`COS_REGION`（或 `COS_ENDPOINT`）。

### 本地挂载（免 coscli 更新）

若已将 COS 桶挂载到本机目录（例如 `/cos`），可在 `cos.env` 中设置 **`COS_LOCAL_ROOT=/cos`**。此时 **`update.sh` / `update.ps1`** 会从本地路径读取对象，规则与线上键一致：`$COS_LOCAL_ROOT` + `COS_PREFIX` + 逻辑键（与 `version.json` 里 `artifact.key` / 补丁 `key` 拼成的完整路径相同，例如 `/cos/ms-server-updates/version.json`）。**仍需保留 `COS_PREFIX`**，以便与发布端路径一致；**可不配置 `COS_BUCKET`**（仅更新脚本）。**`publish.sh` 仍走 coscli 上传**，不受此项影响。
2. 认证二选一：
   - 本机执行过一次 `coscli config init`；
   - 或在 `cos.env` 中设置 `COS_SECRET_ID` / `COS_SECRET_KEY`（脚本会通过 `--init-skip` 传入 coscli）。

## version.json（COS 上）

由 `publish.sh` 维护，默认对象键为 `{COS_PREFIX}version.json`。字段：`schema`（固定 `1`）、`headCommit`、`artifact`（`key` + `sha256`）、`patches`（有序增量：`fromCommit` → `toCommit`，含资源 zip 的 `key`/`sha256`，或仅 `artifactOnly: true`）。

## 首次发布

COS 上尚无 `version.json` 时，设置与当前磁盘内容一致的基线提交：

```bash
export INITIAL_FROM_COMMIT=<40 位 SHA>   # 与当前 scripts/wz 等目录匹配的提交
./deploy/publish.sh
```

## 日常发布

在 `gms-server` 根执行（会先 `mvn package -DskipTests`）：

```bash
source deploy/cos.env   # 或事先 export
./deploy/publish.sh
```

- `--artifact-only`：不打资源增量包，只发 jar + `artifactOnly` 补丁段。
- `--require-resource-change`：若 `RESOURCE_PATHS` 下无变更则失败。
- `--skip-maven`：使用已有 `target/BeiDou.jar`。

## 运行机首次部署

1. `git checkout` 到与线上链起点一致的提交（或准备好完整资源树）。
2. 写入本地状态（与当前树对应）：

```bash
./deploy/update.sh --init-commit <40 位 SHA>
```

3. 之后执行 `./deploy/update.sh` 即可按 `patches` 链拉增量并覆盖 `BeiDou.jar`。

可选：先 `./deploy/update.sh --bootstrap <COS 上全量 zip 的相对键>` 解压全量，再 `--init-commit` 对齐链首。

## 启动并自动更新

```bash
./deploy/run-with-update.sh              # 后台，日志 logs/beidou.log
./deploy/run-with-update.sh --foreground # 前台
```

会先结束占用 `BeiDou.jar` 的 Java 进程，再执行 `update.sh`，最后用与 [`launch.sh`](../launch.sh) 相同参数启动（优先 `jdk-21.0.2/bin/java`）。

## 注意事项

- 增量 zip **不删除** 远端已删文件；删除资源需另做清理或发全量包。
- 多人同时 `publish.sh` 可能写坏 `version.json`，请串行发布。
- `COS_PREFIX` 与各对象键在清单里均为相对前缀的路径，勿重复拼接。

更多说明见 [docs/06-startup-guide.md](../docs/06-startup-guide.md) 中的「COS 自动更新」一节。
