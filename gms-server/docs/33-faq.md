# 常见问题

## 1. FAQ概述

本文档汇总了 BeiDou-Server（ MapleStory 游戏服务器模拟器）使用过程中常见的問題与解答。通过分类整理，帮助用户快速定位和解决各类问题。

### 1.1 项目技术栈

| 组件 | 技术 |
|------|------|
| 服务器框架 | Spring Boot 3.2.3 + Undertow |
| 数据库 | MySQL 8.0+ |
| ORM | MyBatis-Flex |
| 网络通信 | Netty |
| 脚本引擎 | GraalVM JavaScript |
| 数据库连接池 | Druid |
| JDK版本 | Java 21 |

### 1.2 常用端口

| 端口 | 用途 |
|------|------|
| 8686 | API服务端口（Web管理界面） |
| 8484 | 客户端登录端口 |
| 8787 | 前端Vue应用端口 |

### 1.3 快速链接

- [环境配置文档](./04-environment-setup.md)
- [故障排查文档](./23-troubleshooting.md)
- [配置管理文档](./26-configuration.md)
- [GM命令手册](./25-gm-commands.md)

---

## 2. 环境配置问题

### 2.1 JDK相关问题

#### Q: 提示 "UnsupportedClassVersionError" 或需要 JDK 21

**A:** 项目要求 JDK 21 或更高版本。

**解决方案：**

1. 确认已安装 JDK 21：
   ```bash
   java -version
   ```

2. 检查 `JAVA_HOME` 环境变量：
   ```bash
   # Windows
   echo %JAVA_HOME%

   # Linux/Mac
   echo $JAVA_HOME
   ```

3. 如未安装，访问 [OpenJDK](https://adoptium.net/) 下载安装

4. 在 IDEA 中配置 Project SDK：File → Project Structure → Platform Settings → SDKs

---

#### Q: 不同 JDK 版本会影响项目吗？

**A:** 会。JDK 21 是项目的最低要求，使用更低版本将无法编译和运行。

- JDK 21+: 完全支持
- JDK 17-20: 部分支持，但可能存在兼容性问题
- JDK 17 以下: 不支持

---

### 2.2 Maven相关问题

#### Q: Maven 依赖下载失败或速度极慢

**A:** 可以配置阿里云镜像加速下载。

**解决方案：**

项目已配置阿里云镜像（见 `pom.xml`），如仍有问题：

1. 清除本地缓存：
   ```bash
   mvn clean
   ```

2. 强制更新依赖：
   ```bash
   mvn clean install -U
   ```

3. 检查网络连接

4. 确认防火墙未阻止 Maven 访问仓库

---

#### Q: 依赖显示为红色或报 "Cannot resolve symbol"

**A:** 通常是依赖未下载完成或本地仓库损坏。

**解决方案：**

1. 重新下载依赖：
   ```bash
   mvn dependency:resolve
   ```

2. 如无效，删除本地仓库缓存后重试：
   ```bash
   # 删除 ~/.m2/repository 目录
   # 然后重新运行
   mvn clean install -U
   ```

---

### 2.3 MySQL相关问题

#### Q: MySQL 服务无法启动

**A:** 检查 MySQL 服务状态和配置。

**Windows 系统：**
```bash
# 检查服务状态
net start | findstr MySQL

# 启动服务
net start mysql
```

**Linux 系统：**
```bash
# 检查服务状态
sudo systemctl status mysql

# 启动服务
sudo systemctl start mysql

# 设置开机自启
sudo systemctl enable mysql
```

---

#### Q: 数据库连接被拒绝 (Connection refused)

**A:** 按以下顺序排查：

1. 确认 MySQL 服务正在运行
2. 检查端口是否正确（默认 3306）
3. 验证用户名和密码
4. 检查用户权限配置
5. 确认防火墙允许 MySQL 连接

```bash
# 测试 MySQL 连接
mysql -u root -p
```

---

#### Q: 提示 "Access denied for user" 或 "Unknown database"

**A:** 数据库用户权限不足或数据库不存在。

**解决方案：**

1. 创建数据库（如不存在）：
   ```sql
   CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```

2. 授予用户权限：
   ```sql
   GRANT ALL PRIVILEGES ON beidou.* TO 'your_username'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. 如使用 root 用户，确认密码正确

---

#### Q: 非 root 用户需要哪些额外权限？

**A:** 根据项目要求，非 root 用户需要以下额外权限：

```sql
-- performance_schema 库 user_variables_by_thread 表的 select 权限
GRANT SELECT ON performance_schema.user_variables_by_thread TO 'your_username'@'localhost';

-- mysql 库的 show view 权限
GRANT SHOW VIEW ON mysql.* TO 'your_username'@'localhost';

FLUSH PRIVILEGES;
```

---

#### Q: MySQL 8.0+ 密码认证问题

**A:** MySQL 8.0+ 默认使用 `caching_sha2_password` 插件，可能导致旧版客户端连接失败。

**解决方案：**
```sql
ALTER USER 'your_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

---

## 3. 编译构建问题

### 3.1 编译错误

#### Q: 编译时报 "package does not exist" 或 "cannot find symbol"

**A:** 通常是依赖未正确下载或模块路径问题。

**解决方案：**

1. 确保在项目根目录（包含 `pom.xml` 的目录）执行 Maven 命令
2. 更新依赖：
   ```bash
   mvn clean dependency:resolve
   ```
3. 在 IDEA 中：File → Invalidate Caches → Restart

---

#### Q: Lombok 相关的编译错误（getter/setter找不到）

**A:** Lombok 插件未正确安装或启用。

**解决方案：**

1. 确认 IDEA 已安装 Lombok 插件
2. 启用注解处理器：
   - File → Settings → Build, Execution, Deployment → Compiler → Annotation Processors
   - 勾选 "Enable annotation processing"
3. 确保 `lombok.version` 在 `pom.xml` 中正确定义

---

#### Q: Maven 构建成功但运行时提示找不到主类

**A:** 检查 `pom.xml` 中的主类配置和打包配置。

**确认配置：**
```xml
<properties>
    <mainClass>org.gms.ServerApplication</mainClass>
</properties>

<build>
    <finalName>BeiDou</finalName>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <mainClass>${mainClass}</mainClass>
            </configuration>
        </plugin>
    </plugins>
</build>
```

---

### 3.2 打包问题

#### Q: 打包后 JAR 文件很小或无法运行

**A:** 检查打包配置和依赖范围。

**解决方案：**

1. 使用完整打包命令：
   ```bash
   mvn clean package
   ```

2. 确认不是使用 `spring-boot-maven-plugin` 的 thin jar 模式

3. 检查生成的 JAR 文件大小（应大于 50MB）

4. 运行测试：
   ```bash
   java -jar target/BeiDou.jar
   ```

---

## 4. 运行启动问题

### 4.1 启动失败

#### Q: 启动时报 "Address already in use"

**A:** 端口被占用。

**排查步骤：**

```bash
# Windows: 查找占用端口的进程
netstat -ano | findstr "8686"   # API 端口
netstat -ano | findstr "8484"   # 登录端口

# Linux: 查找占用端口的进程
lsof -i :8686
lsof -i :8484
```

**解决方案：**

1. 结束占用端口的进程：
   ```bash
   # Windows
   taskkill /PID <进程ID> /F

   # Linux
   kill -9 <PID>
   ```

2. 或修改 `application.yml` 中的端口配置：
   ```yaml
   server:
     port: 8687  # 改为其他可用端口
   gms:
     service:
       login-port: 8485  # 改为其他可用端口
   ```

---

#### Q: 启动后无响应或卡住不动

**A:** 按以下顺序排查：

1. **检查数据库连接**：
   - MySQL 服务是否启动
   - 数据库配置是否正确
   - 数据库用户权限是否足够

2. **检查 Flyway 迁移**：
   - 查看日志中的迁移信息
   - 尝试清理 `flyway_history` 表后重启

3. **检查端口占用**：
   - 确认所需端口未被占用

4. **查看日志**：
   - 检查 `logs/` 目录下的日志文件
   - 关注启动过程中的错误信息

---

#### Q: IDEA 运行时提示 "Working directory not set"

**A:** 需要设置正确的工作目录。

**解决方案：**

根据 README.md 的说明，如果是直接打开的 Cosmic 目录运行，需要在 server 的编译配置里设置 Working directory 为 gms-server。

1. 打开 Run/Debug Configurations
2. 选择 ServerApplication 配置
3. 设置 Working directory 为: `$PROJECT_DIR$/gms-server`

---

### 4.2 启动后访问问题

#### Q: Swagger UI 无法访问

**A:** 检查 Swagger 配置和访问地址。

**确认配置：**
```yaml
springdoc:
  api-docs:
    enabled: true
  swagger-ui:
    enabled: true
```

**访问地址：**
```
http://localhost:8686/swagger-ui/index.html
```

**解决方案：**

1. 确认服务器已启动
2. 确认 `server.port` 配置为 8686
3. 检查防火墙设置

---

#### Q: 登录接口返回 401 Unauthorized

**A:** 检查 JWT 配置和登录凭据。

**默认管理员账号：**
- 用户名: `admin`
- 密码: `admin123`（首次登录后请立即修改）

**测试登录：**
```bash
curl -X POST "http://localhost:8686/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## 5. 网络连接问题

### 5.1 客户端连接问题

#### Q: 游戏客户端无法连接登录端口

**A:** 检查防火墙、网络配置和服务器设置。

**排查步骤：**

1. **检查防火墙**：
   ```bash
   # Windows
   netsh advfirewall firewall show rule name=all | findstr 8484

   # Linux
   sudo iptables -L -n | grep 8484
   ```

2. **确认服务器监听地址**：
   ```yaml
   gms:
     service:
       wan-host: 127.0.0.1  # 确认公网 IP 配置正确
       lan-host: 127.0.0.1
       login-port: 8484
   ```

3. **测试端口连通性**：
   ```bash
   # Windows
   telnet 服务器IP 8484

   # Linux
   nc -zv 服务器IP 8484
   ```

**解决方案：**

1. 开放防火墙端口：
   ```bash
   # Linux
   sudo firewall-cmd --add-port=8484/tcp --permanent
   sudo firewall-cmd --reload
   ```

2. 使用内网 IP 时确保客户端和服务器在同一网络

---

#### Q: 客户端频繁掉线

**A:** 检查网络稳定性和心跳设置。

**可能原因：**

1. 网络不稳定
2. 服务器负载过高
3. 心跳超时
4. 客户端版本与服务器不兼容

**解决方案：**

1. 检查服务器负载和资源使用情况
2. 查看日志中的 `IdleStateEvent` 或心跳相关警告
3. 确认客户端版本与服务器兼容
4. 检查是否存在网络设备（路由器、防火墙）超时设置

---

#### Q: 如何配置服务器 IP？

**A:** 在 `application.yml` 中配置。

```yaml
gms:
  service:
    # 公网ip - 用于外部客户端连接
    wan-host: 你的公网IP
    # 局域网ip - 用于内网连接
    lan-host: 192.168.1.100
    # 本地ip - 用于本地连接
    localhost: 127.0.0.1
```

**注意：**
- `wan-host` 是客户端连接服务器使用的 IP
- 确保客户端网络可以访问该 IP

---

### 5.2 Netty 相关问题

#### Q: 日志显示 "channelInactive" 或 "exceptionCaught"

**A:** Netty 通道异常断开。

**常见异常类型：**

| 异常类型 | 原因 | 处理方式 |
|----------|------|----------|
| `InvalidPacketHeaderException` | 非法数据包 | 关闭会话，可能是外挂 |
| `IOException` | 网络中断 | 清理会话资源 |

**排查方法：**

查看 `Client.java` 中的异常处理代码，根据异常类型判断原因。

---

## 6. 数据库问题

### 6.1 Flyway 迁移问题

#### Q: Flyway 迁移失败或报错

**A:** 检查数据库配置和迁移脚本。

**排查步骤：**

1. 查看详细错误日志
2. 检查 `src/main/resources/db/migration/` 目录下的 SQL 文件
3. 确认数据库连接正常

**解决方案：**

1. 清理 Flyway 历史（谨慎操作）：
   ```sql
   DELETE FROM beidou.flyway_history;
   ```

2. 或禁用 Flyway 验证：
   ```yaml
   spring:
     flyway:
       validate-on-migrate: false
   ```

3. 检查数据库字符集：
   ```sql
   CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```

---

#### Q: 迁移脚本未执行或表未创建

**A:** 按以下顺序排查：

1. 检查 `flyway_history` 表记录
2. 确认迁移脚本命名格式正确：`V{version}__{description}.sql`
3. 检查数据库用户是否有创建表的权限
4. 查看应用启动日志中的 Flyway 信息

---

### 6.2 数据查询问题

#### Q: 数据查询缓慢或超时

**A:** 检查数据库索引和查询效率。

**解决方案：**

1. 检查数据库索引是否完整
2. 优化 MySQL 配置：
   ```ini
   [mysqld]
   innodb_buffer_pool_size = 2G
   innodb_log_file_size = 256M
   slow_query_log = 1
   long_query_time = 2
   ```

3. 使用 `EXPLAIN` 分析查询：
   ```sql
   EXPLAIN SELECT * FROM your_table WHERE condition;
   ```

---

#### Q: 连接池耗尽 "Connection is not available"

**A:** 增加连接池配置或检查连接泄漏。

**解决方案：**

1. 增加连接池配置：
   ```yaml
   mybatis-flex:
     datasource:
       mysql:
         initial-size: 5
         min-idle: 5
         max-active: 20
   ```

2. 检查是否存在数据库连接泄漏（未关闭连接）

---

### 6.3 数据管理问题

#### Q: 如何备份数据库？

**A:** 使用 MySQL 备份命令。

```bash
# 备份整个数据库
mysqldump -u root -p beidou > beidou_backup.sql

# 备份指定表
mysqldump -u root -p beidou table_name > table_backup.sql

# 恢复数据库
mysql -u root -p beidou < beidou_backup.sql
```

---

#### Q: 如何重置数据库？

**A:** 两种方法：

**方法一：删除并重建（开发环境）**
```sql
DROP DATABASE beidou;
CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```
然后重启应用，Flyway 会自动执行所有迁移脚本。

**方法二：清理 Flyway 历史**
```sql
DELETE FROM beidou.flyway_history;
```
然后重启应用，Flyway 会重新执行所有迁移脚本。

---

## 7. 游戏功能问题

### 7.1 角色相关问题

#### Q: 玩家卡在地图无法移动

**A:** 服务器有自动解救机制。

**自动解救：**

服务器会自动尝试解救卡地图的玩家，查看日志：
```
[WARN ] 玩家卡地图，正在尝试解救... Player{accountId=xxx} 地图名称
```

**解决方案：**

1. 等待服务器自动解救
2. 管理员使用 GM 命令将玩家移出地图：`!warp <地图ID>`
3. 检查 `sysRescue` 相关日志

---

#### Q: 角色数据异常（物品消失、属性错误）

**A:** 按以下顺序排查：

1. 检查数据库连接是否稳定
2. 查看事务处理日志
3. 确认是否存在并发问题

**解决方案：**

1. 从数据库备份恢复数据
2. 管理员使用命令修复玩家数据
3. 检查数据同步机制

---

#### Q: 玩家无法登录，提示认证失败

**A:** 检查以下配置：

1. **JWT 配置**：
   ```yaml
   jwt:
     secret: "你的自定义UUID"
     duration: 1800000  # 30分钟
   ```

2. **账号状态**：检查账号是否被封禁

3. **数据库用户表**：检查 `login` 表数据是否正常

---

### 7.2 地图相关问题

#### Q: 地图加载失败或显示空白

**A:** 检查以下配置：

1. **WZ 文件**：确认 `wz/` 目录下的地图文件完整
2. **地图缓存**：尝试清除缓存后重新加载
3. **地图ID**：确认地图ID存在

**解决方案：**

使用 GM 命令重新加载地图：
```
!reloadMap
```

---

#### Q: 怪物不刷新或刷新异常

**A:** 检查以下配置：

1. 怪物刷新间隔配置
2. 地图怪物上限
3. 怪物刷新点配置

**解决方案：**

1. 检查 `MonsterInformationProvider` 配置
2. 使用 GM 命令刷新怪物：
   ```
   !spawn <怪物ID> [数量]
   ```

---

### 7.3 物品相关问题

#### Q: 物品无法使用或消失

**A:** 检查以下方面：

1. **物品冷却时间**：部分物品有冷却时间
2. **物品耐久度**：装备类物品可能耐久度为0
3. **背包空间**：背包是否已满
4. **交易状态**：物品是否处于交易中

---

#### Q: 商店无法打开或购买物品

**A:** 检查商店配置。

**解决方案：**

1. 使用 GM 命令重新加载商店：
   ```
   !reloadShops
   ```

2. 检查 NPC 是否存在：
   ```
   !search npc <NPC名称>
   ```

---

### 7.4 任务相关问题

#### Q: 任务无法接取或完成

**A:** 按以下顺序排查：

1. **任务前置条件**：是否满足任务接取条件（等级、前置任务等）
2. **任务道具**：是否持有任务所需道具
3. **任务怪物**：是否需要击杀特定怪物

**解决方案：**

使用 GM 命令完成任务：
```
!completequest <任务ID>
```

或重置任务：
```
!resetquest <任务ID>
```

---

#### Q: 事件实例冲突 "EventInstanceInProgressException"

**A:** 等待当前事件实例结束或重启事件管理器。

**解决方案：**

1. 等待当前事件实例结束
2. 重启事件管理器
3. 检查事件脚本配置

---

## 8. GM命令问题

### 8.1 权限相关

#### Q: GM 命令不生效或提示权限不足

**A:** 检查 GM 等级是否足够。

**GM 权限等级说明：**

| 等级 | 名称 | 可用命令范围 |
|------|------|-------------|
| 0 | 普通玩家 | 基础玩家命令 |
| 1 | 初级 GM | 初级管理命令 |
| 2 | GM | 中级管理命令 |
| 3 | 高级 GM | 高级管理命令 |
| 4 | 管理员 | 服务器配置命令 |
| 5 | 开发者 | 调试命令 |
| 6 | 系统管理员 | 所有命令 |

**设置 GM 等级：**
```
!setgmlevel <玩家名称> <等级>
```
需要等级 6 权限。

---

#### Q: 如何成为 GM？

**A:** 有以下方式：

1. **通过数据库设置**：
   ```sql
   UPDATE account SET gm >= 1 WHERE name = '玩家名称';
   ```

2. **通过 GM 命令**（需要等级 6 权限）：
   ```
   !setgmlevel <玩家名称> <等级>
   ```

**注意：** 首次登录管理员账号：`admin / admin123`，请立即修改密码。

---

### 8.2 命令使用问题

#### Q: 命令格式正确但不执行

**A:** 按以下顺序排查：

1. **权限等级**：是否具备该命令所需的 GM 等级
2. **命令格式**：参数是否正确（空格、引号等）
3. **目标存在性**：目标玩家/物品/地图等是否存在
4. **命令开关**：某些功能可能有全局开关

---

#### Q: 传送命令 (!warp) 无法使用

**A:** 检查以下配置：

1. **地图ID是否正确**：地图 ID 应为 9 位数字
2. **地图是否存在**：使用 `!whereami` 查看当前位置
3. **权限等级**：需要 GM 等级 2 或以上

**常用地图ID：**
| 地图名称 | ID |
|---------|-----|
| 射手村 | 100000000 |
| 魔法森林 | 200000000 |
| 勇士部落 | 100000100 |
| 琳杜半岛 | 500000000 |

---

#### Q: 物品命令 (!item) 生成物品失败

**A:** 检查物品 ID 是否正确。

**解决方案：**

1. 使用搜索命令查找物品 ID：
   ```
   !search item <物品名称>
   ```

2. 确认背包空间充足

3. 确认物品 ID 类型正确

---

## 9. 脚本问题

### 9.1 脚本引擎问题

#### Q: NPC/任务脚本无法加载

**A:** 检查脚本引擎和脚本文件。

**可能原因：**

1. **脚本文件语法错误**：JavaScript 语法问题
2. **脚本引擎配置**：GraalVM JS 配置问题
3. **文件路径错误**：脚本文件路径不正确

**排查方法：**

1. 检查 `logs/` 目录下的错误日志
2. 确认 `scripts/` 目录下脚本文件存在
3. 检查脚本文件语法

---

#### Q: 脚本执行报错或无响应

**A:** 检查脚本内容和执行环境。

**解决方案：**

1. 查看服务器日志中的脚本错误信息
2. 检查脚本文件语法（特别是 JavaScript 语法）
3. 确认脚本引用的 NPC/任务 ID 存在

**脚本文件位置：**
- NPC 脚本: `scripts/npc/`
- 任务脚本: `scripts/quest/`
- 事件脚本: `scripts/event/`
- 传送门脚本: `scripts/portal/`

---

### 9.2 脚本编写问题

#### Q: 如何编写自定义 NPC 脚本？

**A:** 参考项目中的示例脚本。

**基础结构：**
```javascript
// scripts/npc/示例NPC.js
var status = -1;

function start() {
    cm.sendOk("你好，我是示例NPC。");
    cm.dispose();
}
```

**可用的玩家对象 (cm)：**
| 方法 | 说明 |
|------|------|
| `cm.sendOk(msg)` | 发送消息对话框 |
| `cm.sendYesNo(msg)` | 发送是/否对话框 |
| `cm.sendNext(msg)` | 发送下一步对话框 |
| `cm.dispose()` | 关闭对话 |
| `cm.gainItem(id, count)` | 给予物品 |
| `cm.getPlayer()` | 获取玩家对象 |

---

#### Q: 脚本中如何获取玩家数据？

**A:** 使用 `cm.getPlayer()` 获取玩家对象。

```javascript
var player = cm.getPlayer();
var name = player.getName();
var level = player.getLevel();
var meso = player.getMeso();
```

---

## 10. 性能问题

### 10.1 服务器性能

#### Q: 服务器运行卡顿或响应缓慢

**A:** 检查服务器资源使用情况。

**排查步骤：**

1. **检查 CPU 使用率**：
   ```bash
   jstat -gcutil <pid> 1000
   ```

2. **检查内存使用**：
   ```bash
   jmap -heap <pid>
   ```

3. **生成线程 dump**：
   ```bash
   jstack <pid> > thread_dump.txt
   ```

**解决方案：**

1. 调整 JVM 参数：
   ```bash
   java -Xms2G -Xmx4G -XX:+UseG1GC -XX:MaxGCPauseMillis=200
   ```

2. 优化数据库查询

3. 启用连接池

4. 异步处理非核心逻辑

---

#### Q: 内存持续增长或 OOM

**A:** 可能是内存泄漏。

**排查方法：**

1. 使用 VisualVM 或 JProfiler 监控内存
2. 定期生成 heap dump 对比
3. 检查未关闭的资源：
   - 数据库连接
   - 文件流
   - Netty Channel

**常见原因：**

1. 静态集合存储过多对象
2. 未正确关闭数据库连接
3. 监听器未注销

---

### 10.2 数据库性能

#### Q: 数据库查询缓慢

**A:** 启用慢查询日志分析。

**解决方案：**

1. 启用慢查询日志：
   ```sql
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 2;
   ```

2. 使用 `EXPLAIN` 分析查询：
   ```sql
   EXPLAIN SELECT * FROM your_table WHERE condition;
   ```

3. 添加适当索引

4. 优化 MySQL 配置

---

## 11. 其他问题

### 11.1 日志相关

#### Q: 日志文件在哪里？如何配置？

**A:** 日志配置位于 `logback-spring.xml`。

**默认日志位置：** `logs/` 目录

**配置日志级别：**
```yaml
logging:
  level:
    root: INFO
    org.gms: DEBUG
    org.gms.exception: DEBUG
```

---

#### Q: 如何查看关键日志信息？

**A:** 以下是常见日志关键词：

| 关键词 | 含义 | 建议操作 |
|--------|------|----------|
| `BizException` | 业务异常 | 查看具体错误码 |
| `RuntimeException` | 运行时异常 | 检查代码逻辑 |
| `channelInactive` | 连接断开 | 检查网络 |
| `卡地图` | 玩家卡地图 | 等待自动解救 |
| `disconnect` | 玩家断开连接 | 正常行为 |

---

### 11.2 安全相关

#### Q: 如何修改 JWT Secret？

**A:** 生产环境必须修改 JWT Secret。

**生成新 Secret：**
```bash
# Windows PowerShell
powershell -Command "[guid]::NewGuid().ToString()"

# Linux/Mac
uuidgen
```

**修改配置：**
```yaml
jwt:
  secret: "你的新UUID"
```

---

#### Q: 限流误封了正常用户怎么办？

**A:** 检查限流配置。

**配置说明：**
```yaml
gms:
  service:
    rate-limit:
      enabled: false      # 是否开启限流
      limit: 10           # 时间窗口内最大请求数
      duration: 1000     # 时间窗口（毫秒）
      auto-ban: false    # 是否自动封禁
```

**解决方案：**

1. 检查 `auto-ban` 配置
2. 降低请求频率
3. 联系管理员解除封禁

---

### 11.3 国际化相关

#### Q: 如何切换语言？

**A:** 有以下方式：

**客户端切换：**
```
@changel <语言代码>
```

**服务端配置：**
```yaml
gms:
  service:
    language: zh-CN  # 支持 zh-CN、en-US
```

**支持的语言：**
- `zh-CN`: 简体中文
- `en-US`: 英文

---

## 12. 提问技巧

### 12.1 提问前准备

在提问前，请确保已完成以下自助排查步骤：

1. **查看日志**：检查 `logs/` 目录下的日志文件
2. **查阅文档**：查看本文档和相关文档
3. **搜索错误信息**：使用错误关键词搜索解决方案
4. **最小化复现**：尝试最小化问题场景

### 12.2 提问格式

请按以下格式提问：

```
【问题类型】简短描述问题

【环境信息】
- 操作系统：
- JDK 版本：
- MySQL 版本：
- 服务器版本：

【问题描述】
详细描述问题...

【错误信息】
粘贴相关错误日志...

【已尝试的解决方案】
1. xxx
2. xxx
```

### 12.3 问题分类

| 分类 | 说明 |
|------|------|
| 环境配置 | JDK、Maven、MySQL 等安装配置问题 |
| 编译构建 | 项目编译、打包相关问题 |
| 运行启动 | 服务启动、端口占用问题 |
| 网络连接 | 客户端连接、网络配置问题 |
| 数据库 | 数据库连接、迁移、数据问题 |
| 游戏功能 | 游戏玩法、功能异常问题 |
| GM命令 | GM 命令使用、权限问题 |
| 脚本问题 | NPC、任务脚本编写执行问题 |
| 性能问题 | 服务器性能、内存、数据库慢查询 |
| 其他 | 不属于以上类别的问题 |

### 12.4 常用资源链接

| 资源 | 链接 |
|------|------|
| 项目文档 | `docs/` 目录 |
| Swagger API | http://localhost:8686/swagger-ui/index.html |
| GM 命令手册 | `docs/25-gm-commands.md` |
| 环境配置 | `docs/04-environment-setup.md` |
| 故障排查 | `docs/23-troubleshooting.md` |
| 配置管理 | `docs/26-configuration.md` |

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
