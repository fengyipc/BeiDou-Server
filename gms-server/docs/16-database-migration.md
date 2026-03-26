# 数据迁移

## 1. 数据迁移概述

### 1.1 什么是数据迁移

数据迁移是指将数据从一个数据库版本迁移到另一个版本的过程。在 BeiDou-Server 项目中，随着游戏功能的迭代，数据库结构可能需要添加新表、修改现有表结构或初始化新的游戏数据。Flyway 迁移工具通过版本化的 SQL 脚本确保数据库结构变更可追踪、可重复执行。

### 1.2 项目迁移策略

BeiDou-Server 采用以下迁移策略：

| 策略 | 说明 |
|------|------|
| 版本化迁移 | 每个迁移脚本具有唯一版本号，按顺序执行 |
| 自动执行 | 应用启动时 Flyway 自动检测并执行待执行的迁移 |
| 幂等性设计 | 迁移脚本使用 `CREATE TABLE IF NOT EXISTS` 等语句确保重复执行安全 |
| 历史记录 | 所有迁移执行记录保存在 `flyway_history` 表中 |

### 1.3 迁移文件位置

迁移脚本存放于以下目录：

```
src/main/resources/db/migration/
```

### 1.4 当前迁移版本

截至当前版本，项目已完成 **V1.0.0** 至 **V2.0.2** 共计 **90+** 个迁移脚本，主要包括：

| 版本范围 | 主要内容 |
|----------|----------|
| V1.0.0 ~ V1.0.5 | 核心表创建（账号、角色、好友、bbs 等） |
| V1.0.6 ~ V1.0.9 | 角色扩展表（背包、任务、技能等） |
| V1.0.10 ~ V1.0.49 | 游戏功能表（活动、家族、工会、商店等） |
| V1.0.50 ~ V1.0.67 | 数据初始化（商品数据、怪物数据等） |
| V1.1.0 ~ V1.8.5 | 功能扩展与配置表 |
| V2.0.0 ~ V2.0.2 | 游戏配置更新 |

---

## 2. 迁移工具

### 2.1 Flyway 简介

BeiDou-Server 使用 **Flyway** 作为数据库迁移工具。Flyway 是一个开源的数据库迁移工具，支持版本化迁移，可以通过简单的 SQL 脚本管理数据库变更。

**版本信息：**

| 组件 | 版本 |
|------|------|
| Flyway | 9.15.2 |
| MySQL Connector | 8.4.0 |
| 数据库 | MySQL 8.0+ |

### 2.2 配置说明

Flyway 在 `application.yml` 中的配置如下：

```yaml
spring:
  flyway:
    # 禁用版本验证（开发环境开启，生产环境建议关闭）
    validate-on-migrate: false
```

### 2.3 迁移脚本命名规范

迁移脚本必须遵循以下命名规范：

```
V{版本号}__{描述}.sql
```

**命名规则：**

- `V`：版本前缀（大写）
- `{版本号}`：数字格式，支持点号分隔（如 `1.0.0`、`1.0.1`、`2.0.0`）
- `__`：双下划线分隔版本号和描述
- `{描述}`：简短描述，使用下划线分隔单词

**正确示例：**

```
V1.0.0__create_accounts.sql
V1.0.6__create_characters.sql
V1.7.0__create_game_config.sql
V2.0.0__insert_game_config_quest_complete_gain_max_hp.sql
```

### 2.4 迁移脚本结构

每个迁移脚本应包含以下内容：

```sql
-- 迁移说明注释
-- 执行目的：创建账号表
-- 执行时间：2024-01-01

-- 创建表语句
CREATE TABLE IF NOT EXISTS `accounts`
(
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(13) NOT NULL DEFAULT '',
    -- ... 其他字段
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. 迁移流程

### 3.1 迁移执行时机

Flyway 迁移在应用启动时自动执行。执行顺序如下：

```
应用启动 → Flyway 检测 → 执行待执行迁移 → 应用就绪
```

### 3.2 首次启动流程

首次启动项目时，Flyway 会执行以下操作：

1. **检测数据库**：连接 MySQL 数据库
2. **创建历史表**：如不存在，创建 `flyway_history` 表
3. **扫描迁移脚本**：扫描 `db/migration/` 目录下的所有 SQL 文件
4. **按版本排序**：根据版本号从小到大排序
5. **执行迁移脚本**：依次执行每个待执行的迁移脚本
6. **记录历史**：每个执行的迁移记录到 `flyway_history` 表

### 3.3 增量迁移流程

当项目发布新版本需要更新数据库时：

1. 开发者在 `db/migration/` 目录下创建新的迁移脚本
2. 脚本版本号应大于当前最大版本号
3. 应用启动时 Flyway 自动检测并执行新迁移
4. 已在 `flyway_history` 表中的迁移不会重复执行

### 3.4 迁移脚本示例

**创建新表：**

```sql
-- V1.7.0__create_game_config.sql
CREATE TABLE IF NOT EXISTS `game_config`
(
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(64) NOT NULL DEFAULT '',
    `value` TEXT,
    `type` VARCHAR(32) NOT NULL DEFAULT 'string',
    `description` VARCHAR(255) DEFAULT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**插入初始数据：**

```sql
-- V1.7.1__insert_game_config_data.sql
INSERT INTO `game_config` (`key`, `value`, `type`, `description`) VALUES
('server.name', 'BeiDou-Server', 'string', '服务器名称'),
('server.exp_rate', '1', 'int', '经验倍率'),
('server.meso_rate', '1', 'int', '金币倍率');
```

**修改表结构：**

```sql
-- V1.8.0__alter_game_config_add_column.sql
ALTER TABLE `game_config` ADD COLUMN `group` VARCHAR(32) NOT NULL DEFAULT 'default' AFTER `type`;
```

---

## 4. 数据库备份

### 4.1 备份的重要性

在进行任何数据库结构变更之前，强烈建议进行数据库备份。备份可以确保在迁移失败或数据丢失时能够快速恢复。

### 4.2 完整备份

使用 `mysqldump` 命令进行完整备份：

```bash
# 备份整个数据库
mysqldump -u root -p beidou > beidou_backup_$(date +%Y%m%d).sql

# 备份并压缩
mysqldump -u root -p beidou | gzip > beidou_backup_$(date +%Y%m%d).sql.gz
```

### 4.3 备份特定表

```bash
# 备份指定表
mysqldump -u root -p beidou characters accounts > tables_backup.sql
```

### 4.4 定时备份策略

建议生产环境设置定时备份任务：

```bash
# Linux crontab 示例：每天凌晨 3 点备份
0 3 * * * mysqldump -u root -p'password' beidou | gzip > /backup/beidou_$(date +\%Y\%m\%d).sql.gz
```

### 4.5 备份存储

- 备份文件应存储在服务器以外的位置
- 定期验证备份文件的完整性
- 保留最近 N 天的备份（建议至少 7 天）

---

## 5. 数据验证

### 5.1 迁移验证的重要性

迁移脚本执行完成后，需要验证迁移是否成功以及数据完整性。

### 5.2 验证方法

#### 5.2.1 检查 Flyway 历史表

```sql
-- 查看所有已执行的迁移
SELECT * FROM flyway_history ORDER BY installed_rank;

-- 查看最近执行的迁移
SELECT * FROM flyway_history ORDER BY installed_rank DESC LIMIT 5;
```

#### 5.2.2 检查表结构

```sql
-- 查看表是否存在
SHOW TABLES LIKE 'game_config';

-- 查看表结构
DESC game_config;

-- 查看索引
SHOW INDEX FROM game_config;
```

#### 5.2.3 验证数据

```sql
-- 统计记录数
SELECT COUNT(*) FROM game_config;

-- 抽样检查数据
SELECT * FROM game_config LIMIT 10;
```

### 5.3 自动化验证脚本

```sql
-- 验证迁移成功性的检查清单
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'beidou') AS table_count,
    (SELECT COUNT(*) FROM flyway_history WHERE success = 1) AS successful_migrations,
    (SELECT COUNT(*) FROM flyway_history WHERE success = 0) AS failed_migrations;
```

---

## 6. 回滚方案

### 6.1 回滚策略概述

数据库迁移的回滚需要谨慎处理。Flyway 本身支持回滚，但最佳实践是通过新的迁移脚本修复问题而非回滚。

### 6.2 回滚方案选择

| 场景 | 推荐方案 |
|------|----------|
| 迁移脚本有错误 | 创建新的修复迁移脚本 |
| 需要恢复到备份点 | 从备份文件恢复 |
| 版本升级需要回滚 | 清理 Flyway 历史后重新执行正确迁移 |

### 6.3 从备份恢复

```bash
# 停止应用服务
# ...

# 恢复数据库
mysql -u root -p beidou < beidou_backup_20260327.sql
```

### 6.4 重新执行迁移

如需重新执行所有迁移：

```sql
-- 清理 Flyway 历史（保留表结构）
DELETE FROM beidou.flyway_history;

-- 或完全重置（删除所有表）
DROP DATABASE beidou;
CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

然后重启应用，Flyway 将重新执行所有迁移脚本。

### 6.5 修复性迁移

**推荐做法**：创建新的迁移脚本修复问题，而不是回滚。

```sql
-- 例如：需要撤销某个 ALTER TABLE 操作
-- 创建修复脚本
-- V1.9.0__fix_game_config.sql
ALTER TABLE `game_config` DROP COLUMN IF EXISTS `broken_column`;
```

---

## 7. 常见问题

### 7.1 Flyway 迁移失败

#### Q: 迁移时报错 "Migration checksum mismatch"

**A:** 迁移脚本被修改过。Flyway 会校验脚本的 checksum，如与历史记录不匹配会报错。

**解决方案：**

1. 如果脚本确实被修改，确认修改是否正确
2. 更新 Flyway 历史表中的 checksum：
   ```sql
   UPDATE flyway_history SET checksum = <new_checksum> WHERE script = 'V1.0.0__xxx.sql';
   ```
3. 或清理历史后重新执行：
   ```sql
   DELETE FROM flyway_history WHERE script = 'V1.0.0__xxx.sql';
   ```

---

#### Q: 迁移失败后如何处理？

**A:** 按以下步骤处理：

1. **查看错误日志**：确定失败原因
2. **修复脚本**：修改迁移脚本或创建新的修复脚本
3. **清理历史**：
   ```sql
   DELETE FROM flyway_history WHERE installed_rank > <failed_rank>;
   ```
4. **重启应用**：Flyway 会重新执行失败的迁移

---

#### Q: 提示 "Table 'xxx' already exists"

**A:** 迁移脚本被重复执行或表已存在。

**排查：**

1. 检查 `flyway_history` 表中是否有重复记录
2. 确认迁移脚本使用了 `CREATE TABLE IF NOT EXISTS`
3. 如脚本已执行且需要重新创建，先 `DROP TABLE IF EXISTS`

---

#### Q: 非 root 用户迁移失败？

**A:** 数据库用户权限不足。

**解决方案：**

```sql
-- 授予必要权限
GRANT ALL PRIVILEGES ON beidou.* TO 'your_username'@'localhost';
GRANT SELECT ON performance_schema.user_variables_by_thread TO 'your_username'@'localhost';
GRANT SHOW VIEW ON mysql.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

---

### 7.2 数据问题

#### Q: 迁移后数据丢失

**A:** 立即从备份恢复。

```bash
mysql -u root -p beidou < beidou_backup.sql
```

---

#### Q: 如何确认迁移脚本执行顺序正确？

**A:** 检查 `flyway_history` 表：

```sql
SELECT installed_rank, version, description, success, installed_on 
FROM flyway_history 
ORDER BY installed_rank;
```

确保 `installed_rank` 连续且 `success` 全部为 1。

---

#### Q: 迁移脚本执行很慢怎么办？

**A:** 大数据量的 INSERT 操作可能导致迁移缓慢。

**优化建议：**

1. 分批插入数据
2. 临时禁用索引，插入完成后再创建
3. 调整 MySQL 缓冲池大小

---

### 7.3 开发环境问题

#### Q: 如何在开发环境重置数据库？

**A:** 两种方式：

**方式一：清理 Flyway 历史（保留数据）**
```sql
DELETE FROM beidou.flyway_history;
```
然后重启应用，所有迁移将重新执行。

**方式二：完全重置（删除所有表）**
```sql
DROP DATABASE beidou;
CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```
然后重启应用。

---

#### Q: 如何跳过某些迁移？

**A:** 可以直接操作 `flyway_history` 表：

```sql
-- 标记某个迁移为已执行
INSERT INTO flyway_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES (5, '1.0.5', 'skip_description', 'SQL', 'V1.0.5__skip.sql', 0, 'admin', NOW(), 0, 1);
```

**注意：** 仅在确定跳过安全的情况下操作。

---

### 7.4 生产环境注意事项

#### Q: 生产环境迁移需要注意什么？

**A:** 以下是生产环境迁移的最佳实践：

| 注意事项 | 说明 |
|----------|------|
| 提前备份 | 迁移前务必完整备份数据库 |
| 测试环境验证 | 先在测试环境执行确认无误 |
| 低峰期执行 | 选择业务低峰期进行迁移 |
| 准备回滚方案 | 确认可快速回滚到备份点 |
| 监控执行 | 观察迁移执行日志和数据库状态 |
| 增量部署 | 避免一次性执行大量迁移 |

---

#### Q: 如何在不重启应用的情况下执行迁移？

**A:** 使用 Flyway 命令行工具：

```bash
# 下载 Flyway 命令行工具
# 执行迁移
flyway -url=jdbc:mysql://localhost:3306/beidou -user=root -password=root migrate
```

---

## 8. 相关资源

### 8.1 配置文件

- 应用配置：`src/main/resources/application.yml`
- 数据库配置：`mybatis-flex.datasource.mysql`

### 8.2 关键表

| 表名 | 说明 |
|------|------|
| `flyway_history` | Flyway 迁移历史记录 |
| `accounts` | 账号表 |
| `characters` | 角色表 |
| `game_config` | 游戏配置表 |

### 8.3 相关文档

- [数据库架构](./14-database-architecture.md)
- [数据表说明](./15-database-tables.md)
- [故障排查](./23-troubleshooting.md)
- [常见问题](./33-faq.md)

---

## 9. 附录

### 9.1 Flyway 命令行操作

```bash
# 查看 Flyway 版本
flyway -v

# 执行迁移
flyway -url=jdbc:mysql://localhost:3306/beidou -user=root -password=root migrate

# 查看状态
flyway -url=jdbc:mysql://localhost:3306/beidou -user=root -password=root info

# 清理所有表（危险）
flyway -url=jdbc:mysql://localhost:3306/beidou -user=root -password=root clean
```

### 9.2 MySQL 连接配置参考

```yaml
mybatis-flex:
  datasource:
    mysql:
      type: com.alibaba.druid.pool.DruidDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      username: root
      password: root
```

---

*文档版本: 1.0*
*最后更新: 2026-03-27*
