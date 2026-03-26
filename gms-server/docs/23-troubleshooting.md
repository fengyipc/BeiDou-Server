# 故障排查

## 1. 概述

本文档提供 BeiDou-Server 常见问题的诊断和解决方案。通过系统化的排查方法，帮助开发者快速定位和解决各类问题。

## 2. 启动问题

### 2.1 端口被占用

**症状**: 启动时报错 `Address already in use` 或类似端口占用错误。

**排查步骤**:

```bash
# Windows: 查找占用端口的进程
netstat -ano | findstr "8686"   # API 端口
netstat -ano | findstr "8484"   # 登录端口

# Linux: 查找占用端口的进程
lsof -i :8686
lsof -i :8484
```

**解决方案**:

1. 确认是否已有其他进程占用该端口
2. 结束占用端口的进程:
   ```bash
   # Windows
   taskkill /PID <进程ID> /F

   # Linux
   kill -9 <PID>
   ```
3. 或修改 `application.yml` 中的端口配置:
   ```yaml
   server:
     port: 8687  # 改为其他可用端口
   gms:
     service:
       login-port: 8485  # 改为其他可用端口
   ```

### 2.2 JDK 版本不兼容

**症状**: 启动时报错 `UnsupportedClassVersionError` 或提示需要更高版本的 Java。

**排查步骤**:

```bash
java -version
```

**解决方案**:

1. 确认安装的是 JDK 21 或更高版本
2. 检查 `JAVA_HOME` 环境变量配置是否正确:
   ```bash
   # Windows
   echo %JAVA_HOME%

   # Linux
   echo $JAVA_HOME
   ```
3. 如需更换 JDK，访问 [OpenJDK](https://adoptium.net/) 下载 JDK 21

### 2.3 Maven 依赖下载失败

**症状**: 编译时提示无法下载依赖，或 `pom.xml` 中某些依赖显示为红色。

**解决方案**:

```bash
# 清理本地仓库缓存
mvn clean

# 强制更新依赖
mvn clean install -U

# 使用阿里云镜像（项目已配置）
# 查看 pom.xml 中的 mirror 配置
```

### 2.4 数据库连接失败

**症状**: 启动时日志显示 `Connection refused` 或 `Access denied`。

**排查步骤**:

1. 检查 MySQL 服务是否启动:
   ```bash
   # Windows
   net start | findstr MySQL

   # Linux
   systemctl status mysql
   ```

2. 验证数据库配置:
   ```yaml
   # application.yml
   mybatis-flex:
     datasource:
       mysql:
         url: jdbc:mysql://localhost:3306/beidou
         username: root
         password: root
   ```

3. 测试数据库连接:
   ```bash
   mysql -u root -p
   ```

**解决方案**:

1. 启动 MySQL 服务:
   ```bash
   # Windows
   net start mysql

   # Linux
   sudo systemctl start mysql
   ```

2. 确认数据库用户权限:
   ```sql
   GRANT SELECT ON performance_schema.user_variables_by_thread TO 'beidou'@'localhost';
   GRANT SHOW VIEW ON mysql.* TO 'beidou'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. 检查 MySQL 8.0+ 的密码认证插件:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
   ```

## 3. 数据库问题

### 3.1 Flyway 迁移失败

**症状**: 启动时日志显示 Flyway 迁移错误，或数据库表未正确创建。

**排查步骤**:

1. 查看详细错误日志
2. 检查 `src/main/resources/db/migration/` 目录下的 SQL 文件

**解决方案**:

1. 清理 Flyway 历史（谨慎操作）:
   ```sql
   DELETE FROM beidou.flyway_history;
   ```

2. 手动执行迁移脚本或禁用 Flyway 验证:
   ```yaml
   spring:
     flyway:
       validate-on-migrate: false
   ```

3. 检查数据库字符集:
   ```sql
   CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```

### 3.2 数据查询缓慢

**症状**: API 响应时间过长，或日志中出现慢查询警告。

**解决方案**:

1. 检查数据库索引是否完整
2. 优化 MySQL 配置:
   ```ini
   [mysqld]
   innodb_buffer_pool_size = 2G
   innodb_log_file_size = 256M
   slow_query_log = 1
   long_query_time = 2
   ```

3. 使用 `EXPLAIN` 分析查询:
   ```sql
   EXPLAIN SELECT * FROM your_table WHERE condition;
   ```

### 3.3 连接池耗尽

**症状**: 日志显示 `Connection is not available` 或 `Pool exhausted`。

**解决方案**:

1. 增加连接池配置:
   ```yaml
   mybatis-flex:
     datasource:
       mysql:
         # Druid 连接池配置
         initial-size: 5
         min-idle: 5
         max-active: 20
   ```

2. 检查是否存在数据库连接泄漏（未关闭连接）

## 4. 网络连接问题

### 4.1 客户端无法连接登录端口

**症状**: 游戏客户端无法连接服务器，提示连接失败。

**排查步骤**:

1. 检查防火墙设置:
   ```bash
   # Windows
   netsh advfirewall firewall show rule name=all | findstr 8484

   # Linux
   sudo iptables -L -n | grep 8484
   ```

2. 确认服务器监听地址:
   ```yaml
   gms:
     service:
       wan-host: 127.0.0.1  # 确认公网 IP 配置正确
       lan-host: 127.0.0.1
       login-port: 8484
   ```

3. 测试端口连通性:
   ```bash
   # Windows
   telnet 服务器IP 8484

   # Linux
   nc -zv 服务器IP 8484
   ```

**解决方案**:

1. 开放防火墙端口:
   ```bash
   # Linux
   sudo firewall-cmd --add-port=8484/tcp --permanent
   sudo firewall-cmd --reload
   ```

2. 使用内网 IP 时确保客户端和服务器在同一网络

### 4.2 Netty 通道异常断开

**症状**: 客户端频繁掉线，日志显示 `channelInactive` 或 `exceptionCaught`。

**排查步骤**:

查看 `Client.java` 中的异常处理:

```java
@Override
public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
    if (cause instanceof InvalidPacketHeaderException) {
        SessionCoordinator.getInstance().closeSession(this, true);
    } else if (cause instanceof IOException) {
        closeMapleSession();
    }
}
```

**解决方案**:

1. 检查网络稳定性
2. 确认客户端版本与服务器兼容
3. 查看具体异常类型:
   - `InvalidPacketHeaderException`: 数据包格式错误，可能存在外挂
   - `IOException`: 网络中断或超时

### 4.3 心跳超时

**症状**: 玩家被踢出，日志显示 `IdleStateEvent` 或心跳相关警告。

**解决方案**:

1. 检查服务器负载
2. 调整心跳检测配置:
   ```yaml
   gms:
     service:
       # 增加超时时间（如果支持）
   ```

## 5. 游戏逻辑问题

### 5.1 玩家卡地图

**症状**: 玩家角色卡在某个地图无法移动。

**排查步骤**:

服务器会自动尝试解救卡地图的玩家，查看日志:

```java
// Client.java
if (player != null && !player.isLoggedInWorld()) {
    log.warn("玩家卡地图，正在尝试解救...", player, MapName);
    sysRescue.setMapChange(player);
}
```

**解决方案**:

1. 等待服务器自动解救
2. 管理员使用 GM 命令将玩家移出地图
3. 检查 `sysRescue` 相关日志

### 5.2 角色数据异常

**症状**: 玩家数据丢失、属性异常或物品消失。

**排查步骤**:

1. 检查数据库连接是否稳定
2. 查看事务处理日志
3. 确认是否存在并发问题

**解决方案**:

1. 从数据库备份恢复数据
2. 管理员使用命令修复玩家数据
3. 检查数据同步机制

### 5.3 事件实例冲突

**症状**: 日志显示 `EventInstanceInProgressException`。

**异常定义**:

```java
public class EventInstanceInProgressException extends BizException {
    public EventInstanceInProgressException() {
        super(BizExceptionEnum.ILLEGAL_PARAMETERS);
    }
}
```

**解决方案**:

1. 等待当前事件实例结束
2. 重启事件管理器
3. 检查事件脚本配置

## 6. 错误日志分析

### 6.1 业务异常（BizException）

**错误码说明**:

| 错误码 | 含义 | 解决方案 |
|--------|------|----------|
| 20000 | 成功 | - |
| 40000 | 请求体格式错误 | 检查 API 请求参数 |
| 40001 | 请求方法不支持 | 确认使用 GET/POST 等正确方法 |
| 40002 | 参数非法 | 检查传入参数是否符合要求 |
| 40004 | 资源未找到 | 检查请求的资源是否存在 |
| 50000 | 服务器内部错误 | 查看详细日志，联系开发人员 |
| 50003 | 服务器繁忙 | 稍后重试或检查服务器负载 |

**日志特征**:

```
发生业务异常！原因是：{具体错误信息}
```

### 6.2 运行时异常（RuntimeException）

**日志特征**:

```
发生运行时异常！原因是:
java.lang.NullPointerException
    at org.gms.xxx.XxxService.method(File.java:line)
```

**常见类型**:

1. `NullPointerException`: 空指针异常，通常是数据未加载
2. `IllegalArgumentException`: 参数不合法
3. `IndexOutOfBoundsException`: 索引越界

**排查方法**:

1. 定位异常发生的文件和行号
2. 检查相关对象是否为空
3. 确认参数传递是否正确

### 6.3 数据库异常

**日志特征**:

```
发生运行时异常！原因是:
com.mysql.jdbc.exceptions.jdbc4.MySQLSyntaxErrorException
```

**常见错误**:

1. `Access denied`: 用户权限不足
2. `Unknown database`: 数据库不存在
3. `Table doesn't exist`: 表不存在
4. `Duplicate entry`: 唯一索引冲突

### 6.4 Netty 网络异常

**日志特征**:

```
[WARN ] 玩家卡地图，正在尝试解救... Player{accountId=xxx} 地图名称
```

**常见异常处理**:

| 异常类型 | 原因 | 处理方式 |
|----------|------|----------|
| `InvalidPacketHeaderException` | 非法数据包 | 关闭会话 |
| `IOException` | 网络中断 | 清理会话资源 |

## 7. 性能问题排查

### 7.1 CPU 使用率过高

**排查步骤**:

1. 使用 JMX 或工具监控:
   ```bash
   jstat -gcutil <pid> 1000
   ```

2. 生成线程 dump:
   ```bash
   jstack <pid> > thread_dump.txt
   ```

3. 生成堆 dump:
   ```bash
   jmap -dump:format=b,file=heap.hprof <pid>
   ```

**解决方案**:

1. 添加或调整 JVM GC 参数:
   ```bash
   java -XX:+UseG1GC -XX:MaxGCPauseMillis=200
   ```

2. 增加堆内存:
   ```bash
   java -Xms2G -Xmx4G
   ```

3. 分析热点代码进行优化

### 7.2 内存泄漏

**症状**: 服务器运行时间越长，内存占用越高，最终 OOM。

**排查方法**:

1. 使用 VisualVM 或 JProfiler 监控内存
2. 定期生成 heap dump 对比
3. 检查是否有未关闭的资源:
   - 数据库连接
   - 文件流
   - Netty Channel

**常见原因**:

1. 静态集合存储过多对象
2. 未正确关闭数据库连接
3. 监听器未注销

### 7.3 响应延迟

**排查步骤**:

1. 启用慢查询日志:
   ```sql
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 2;
   ```

2. 使用 APM 工具（如 SkyWalking）追踪

3. 检查线程池配置:
   ```yaml
   server:
     tomcat:
       threads:
         max: 200
         min-spare: 10
   ```

**解决方案**:

1. 优化数据库查询
2. 添加缓存层
3. 启用连接池
4. 异步处理非核心逻辑

## 8. 安全相关问题

### 8.1 JWT Token 问题

**症状**: API 返回 401 Unauthorized 或 token 过期。

**排查步骤**:

1. 检查 token 是否正确传递:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:8686/api/xxx
   ```

2. 查看 JWT 配置:
   ```yaml
   jwt:
     secret: "50da066e-6080-40f5-a173-86bd27d4f674"
     duration: 1800000  # 30分钟
   ```

**解决方案**:

1. 重新登录获取新 token
2. 生产环境务必更换 secret:
   ```bash
   # 生成新的 UUID
   java -jar -XX:+PrintCommandLineFlags -
   ```

### 8.2 限流触发

**症状**: 请求被拒绝，日志显示限流相关信息。

**配置说明**:

```yaml
gms:
  service:
    rate-limit:
      enabled: false      # 是否开启限流
      limit: 10           # 时间窗口内最大请求数
      duration: 1000     # 时间窗口（毫秒）
      auto-ban: false    # 是否自动封禁
```

**解决方案**:

1. 如果误封，检查 `auto-ban` 配置
2. 降低请求频率
3. 联系管理员解除封禁

### 8.3 SQL 注入防护

**说明**: 项目使用 MyBatis-Flex，参数通过 `#{}` 绑定，自动防止 SQL 注入。

**注意**: 避免使用 `${}` 直接拼接 SQL。

## 9. 日志配置与查看

### 9.1 日志级别配置

编辑 `logback-spring.xml` 或在 `application.yml` 中配置:

```yaml
logging:
  level:
    root: INFO
    org.gms: DEBUG
    org.gms.exception: DEBUG  # 异常日志
```

### 9.2 日志文件位置

默认日志输出到控制台，可配置输出到文件:

```xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/beidou.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/beidou.%d{yyyy-MM-dd}.log</fileNamePattern>
    </rollingPolicy>
</appender>
```

### 9.3 关键日志关键词

| 关键词 | 含义 | 建议操作 |
|--------|------|----------|
| `BizException` | 业务异常 | 查看具体错误码 |
| `RuntimeException` | 运行时异常 | 检查代码逻辑 |
| `channelInactive` | 连接断开 | 检查网络 |
| `卡地图` | 玩家卡地图 | 等待自动解救 |
| `disconnect` | 玩家断开连接 | 正常行为 |

## 10. 常见问题速查表

| 问题 | 可能原因 | 快速解决方案 |
|------|----------|--------------|
| 启动无响应 | 端口被占用 | 更换端口或结束占用进程 |
| API 全部返回 500 | 数据库连接失败 | 检查 MySQL 服务和配置 |
| 登录失败 | 账号密码错误或 token 过期 | 重新登录 |
| 客户端连接失败 | 防火墙或 IP 配置错误 | 检查防火墙和 `wan-host` |
| 数据查询慢 | 缺少索引或查询效率低 | 添加索引或优化查询 |
| 内存持续增长 | 内存泄漏 | 生成 heap dump 分析 |
| 频繁掉线 | 网络问题或心跳超时 | 检查网络稳定性 |
| GM 命令不生效 | 权限不足 | 使用高权限账号 |

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
