# 配置管理

## 1. 概述

BeiDou-Server 采用分层配置管理体系，支持静态配置（application.yml）和动态配置（数据库）两种方式。静态配置用于应用启动和基础服务参数，动态配置用于游戏运行时的参数调整，支持热加载。

### 1.1 配置文件位置

| 配置文件 | 路径 | 说明 |
|---------|------|------|
| 主配置文件 | `src/main/resources/application.yml` | 应用基础配置 |
| 动态配置 | 数据库 `game_config` 表 | 游戏运行参数 |

### 1.2 配置架构图

```
┌─────────────────────────────────────────────────────────┐
│                   application.yml                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 服务器配置   │ │ 数据库配置   │ │ 游戏服务配置  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   GameConfig (动态配置)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ World 配置   │ │ Server 配置  │ │ NPC 配置    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   数据库 (game_config 表)                  │
└─────────────────────────────────────────────────────────┘
```

## 2. application.yml 配置详解

### 2.1 服务器配置

```yaml
server:
  port: 8686
```

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `server.port` | int | 8686 | API 服务端口，Web 后台管理界面访问端口 |

### 2.2 前端配置

```yaml
app:
  vue: http://localhost:8787
```

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `app.vue` | string | http://localhost:8787 | 前端 Vue 应用地址，用于 CORS 跨域配置 |

### 2.3 JWT 配置

```yaml
jwt:
  # secret 生产环境请自行生成 UUID
  secret: "50da066e-6080-40f5-a173-86bd27d4f674"
  # token 过期时间（毫秒）默认 30min
  duration: 1800000
```

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `jwt.secret` | string | (示例 UUID) | JWT 签名密钥，生产环境必须替换为自定义 UUID |
| `jwt.duration` | long | 1800000 | Token 过期时间，单位毫秒，默认 30 分钟 |

**生成 JWT Secret 方法：**
```bash
# Windows PowerShell
powershell -Command "[guid]::NewGuid().ToString()"

# Linux/Mac
uuidgen
```

### 2.4 数据库配置

```yaml
mybatis-flex:
  datasource:
    mysql:
      type: com.alibaba.druid.pool.DruidDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      username: root
      password: root
  global-config:
    print-banner: false
```

#### 2.4.1 Druid 连接池配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `mybatis-flex.datasource.mysql.type` | string | DruidDataSource | 连接池类型，使用 Druid 连接池 |
| `mybatis-flex.datasource.mysql.driver-class-name` | string | com.mysql.cj.jdbc.Driver | MySQL 驱动类 |
| `mybatis-flex.datasource.mysql.url` | string | - | JDBC 连接 URL |
| `mybatis-flex.datasource.mysql.username` | string | root | 数据库用户名 |
| `mybatis-flex.datasource.mysql.password` | string | root | 数据库密码 |

#### 2.4.2 URL 参数说明

```
jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
```

| 参数 | 说明 |
|------|------|
| `useUnicode=true` | 使用 Unicode 字符集 |
| `characterEncoding=utf-8` | 字符编码为 UTF-8 |
| `useSSL=false` | 禁用 SSL 连接（开发环境） |
| `serverTimezone=Asia/Shanghai` | 服务器时区设置为上海 |

#### 2.4.3 Druid 连接池高级配置

```yaml
mybatis-flex:
  datasource:
    mysql:
      # 连接池大小配置（需添加）
      initial-size: 5              # 初始连接数
      max-active: 100              # 最大活跃连接数
      max-wait: 60000              # 最大等待时间（毫秒）
      min-idle: 10                 # 最小空闲连接数
      validation-query: SELECT 1   # 连接验证查询
      test-while-idle: true        # 空闲时测试连接
      test-on-borrow: true         # 借用时测试连接
      time-between-eviction-runs-millis: 60000  # 清理线程运行间隔
      min-evictable-idle-time-millis: 300000    # 空闲连接最小存活时间
```

### 2.5 Swagger/API 文档配置

```yaml
# swagger路径：http://localhost:8686/swagger-ui/index.html
springdoc:
  api-docs:
    # 是否开启OpenApi，如果为false，则SwaggerUI也会被禁用
    enabled: true
  swagger-ui:
    # 是否开启SwaggerUI，依赖OpenApi的开启
    enabled: true
```

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `springdoc.api-docs.enabled` | boolean | true | 是否启用 OpenAPI 文档 |
| `springdoc.swagger-ui.enabled` | boolean | true | 是否启用 Swagger UI 界面 |

**访问地址：** `http://localhost:8686/swagger-ui/index.html`

### 2.6 Spring 配置

```yaml
spring:
  flyway:
    # 禁用版本验证
    validate-on-migrate: false
  servlet:
    multipart:
      max-file-size: 1MB
      max-request-size: 10MB
  jackson:
    time-zone: Asia/Shanghai
    date-format: yyyy-MM-dd HH:mm:ss
```

#### 2.6.1 Flyway 数据库迁移配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `spring.flyway.validate-on-migrate` | boolean | false | 迁移前是否验证版本历史 |

#### 2.6.2 文件上传配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `spring.servlet.multipart.max-file-size` | string | 1MB | 单个文件最大大小 |
| `spring.servlet.multipart.max-request-size` | string | 10MB | 单次请求最大大小 |

#### 2.6.3 JSON 序列化配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `spring.jackson.time-zone` | string | Asia/Shanghai | 时区设置 |
| `spring.jackson.date-format` | string | yyyy-MM-dd HH:mm:ss | 日期格式 |

### 2.7 游戏服务配置 (gms)

```yaml
gms:
  service:
    # zh-CN en-US
    language: zh-CN
    rate-limit:
      # 是否开启限流
      enabled: false
      # 每ip多少时间内最大请求数
      limit: 10
      # 每ip最大请求数多少时间重置，单位ms
      duration: 1000
      # 是否自动封禁
      auto-ban: false
    # 公网ip
    wan-host: 127.0.0.1
    # 局域网ip
    lan-host: 127.0.0.1
    # 本地ip
    localhost: 127.0.0.1
    # 客户端登录端口
    login-port: 8484
```

#### 2.7.1 服务基础配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `gms.service.language` | string | zh-CN | 系统语言，支持 zh-CN、en-US |

#### 2.7.2 限流配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `gms.service.rate-limit.enabled` | boolean | false | 是否启用请求限流 |
| `gms.service.rate-limit.limit` | int | 10 | 每时间窗口内最大请求数 |
| `gms.service.rate-limit.duration` | long | 1000 | 时间窗口大小，单位毫秒 |
| `gms.service.rate-limit.auto-ban` | boolean | false | 超过限制是否自动封禁 IP |

#### 2.7.3 网络配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `gms.service.wan-host` | string | 127.0.0.1 | 公网 IP，用于外部客户端连接 |
| `gms.service.lan-host` | string | 127.0.0.1 | 局域网 IP，用于内网连接 |
| `gms.service.localhost` | string | 127.0.0.1 | 本地 IP，用于本地连接 |
| `gms.service.login-port` | int | 8484 | 客户端登录端口 |

## 3. 动态配置 (GameConfig)

GameConfig 是北斗动态参数计划的核心实现，支持游戏运行时参数的热加载。配置存储在数据库 `game_config` 表中。

### 3.1 配置数据结构

```json
{
  "world": {
    "0": {
      "exp_rate": {"clazz": "java.lang.Float", "value": "1.0"},
      "meso_rate": {"clazz": "java.lang.Float", "value": "1.0"},
      "drop_rate": {"clazz": "java.lang.Float", "value": "1.0"}
    }
  },
  "server": {
    "global": {
      "WORLDS": {"clazz": "java.lang.Integer", "value": "1"}
    }
  }
}
```

### 3.2 配置类型分类

| 类型 | 说明 | 作用域 |
|------|------|--------|
| `world` | 世界/区服配置 | 按世界 ID 隔离 |
| `server` | 服务器全局配置 | 全局共享 |

### 3.3 World 配置项

每个世界（World）都有独立的配置，通过世界 ID（0, 1, 2...）区分。

#### 3.3.1 倍率配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `exp_rate` | float | 1.0 | 经验倍率 |
| `meso_rate` | float | 1.0 | 金币倍率 |
| `drop_rate` | float | 1.0 | 物品掉落倍率 |
| `boss_drop_rate` | float | 1.0 | Boss 掉落倍率 |
| `quest_rate` | float | 1.0 | 任务奖励倍率 |
| `travel_rate` | float | 1.0 | 钓鱼奖励倍率 |
| `fishing_rate` | float | 1.0 | 钓鱼倍率 |

#### 3.3.2 服务器消息配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `server_message` | string | "" | 服务器欢迎消息 |
| `event_message` | string | "" | 活动消息 |
| `recommend_message` | string | "" | 推荐消息 |

#### 3.3.3 世界标志

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `flag` | byte | 0 | 世界标志位 |
| `channel_size` | int | 3 | 默认频道数量 |

### 3.4 Server 配置项

全局服务器配置，作用于所有世界。

#### 3.4.1 系统配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `WORLDS` | int | 1 | 世界数量 |
| `max_world_size` | int | 10 | 最大世界数 |
| `max_channel_size` | int | 20 | 最大频道数 |
| `timezone` | string | Asia/Shanghai | 服务器时区 |
| `update_interval` | long | 3000 | 更新间隔（毫秒） |
| `respawn_interval` | long | 10000 | 刷怪间隔（毫秒） |

#### 3.4.2 功能开关

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| `use_family_system` | boolean | false | 是否启用家族系统 |
| `use_whole_server_ranking` | boolean | false | 是否使用全服排名 |
| `use_ip_validation` | boolean | true | 是否启用 IP 验证 |
| `allow_steal_quest_item` | boolean | false | 是否允许偷窃任务物品 |

### 3.5 配置获取方法

```java
// 获取世界配置
float expRate = GameConfig.getWorldFloat(worldId, "exp_rate");
String serverMsg = GameConfig.getWorldString(worldId, "server_message");

// 获取服务器全局配置
int worldCount = GameConfig.getServerInt("WORLDS");
boolean useFamily = GameConfig.getServerBoolean("use_family_system");

// 通用的配置获取（不区分类型）
String value = GameConfig.getString("key");
int intValue = GameConfig.getIntValue("key");
```

## 4. 配置类详解

### 4.1 ServerConfig

`org.gms.config.ServerConfig` - 服务器配置类

```java
@Configuration
public class ServerConfig {
    // 注册 ServerFilter 过滤器
    // 配置 Swagger OpenAPI 文档
}
```

**功能：**
- 注册请求过滤器 `ServerFilter`
- 配置 Swagger API 文档信息
- 添加全局 AUTHORIZATION 请求头

### 4.2 CorsConfig

`org.gms.config.CorsConfig` - 跨域配置类

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Value("${app.vue}")
    private String vue;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(vue)
                .allowCredentials(true)
                .allowedMethods("*")
                .maxAge(3600);
    }
}
```

**功能：**
- 配置 CORS 跨域资源共享
- 允许前端 Vue 应用访问后端 API

### 4.3 I18nConfig

`org.gms.config.I18nConfig` - 国际化配置类

```java
@Configuration
public class I18nConfig {
    @Bean
    public MessageSource messageSource() {
        // i18n/message.properties
    }

    @Bean
    public MessageSource logSource() {
        // i18n/log.properties
    }

    @Bean
    public MessageSource exceptionSource() {
        // i18n/exception.properties
    }
}
```

**功能：**
- 配置多语言消息源
- 支持 message、log、exception 三类消息

### 4.4 SpringSecurityConfig

`org.gms.config.SpringSecurityConfig` - 安全配置类

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity()
public class SpringSecurityConfig {
    // 配置 JWT 认证过滤器
    // 配置密码加密器 (BCrypt)
    // 配置安全过滤链
}
```

**功能：**
- 禁用 CSRF 防护
- 配置 JWT Token 认证
- 公开 `/auth/**`、`/swagger-ui/**`、`/v3/api-docs/**` 路径
- 其他路径需要认证

### 4.5 ServiceProperty

`org.gms.property.ServiceProperty` - 服务属性配置

```java
@ConfigurationProperties(prefix = "gms.service")
@Component
@Data
public class ServiceProperty {
    private String language;
    private RateLimitProperty rateLimit;
    private String wanHost;
    private String lanHost;
    private String localhost;
    private int loginPort;
}
```

## 5. 配置热加载

### 5.1 热加载机制

GameConfig 支持运行时配置更新，修改数据库配置后自动生效。

**支持热加载的配置项：**

| 配置类型 | 配置项 | 热加载效果 |
|---------|--------|-----------|
| World | `exp_rate` | 立即生效，经验倍率更新 |
| World | `meso_rate` | 立即生效，金币倍率更新 |
| World | `drop_rate` | 立即生效，掉落倍率更新 |
| World | `boss_drop_rate` | 立即生效，Boss 掉落更新 |
| World | `quest_rate` | 立即生效，任务倍率更新 |
| World | `travel_rate` | 立即生效，旅行倍率更新 |
| World | `fishing_rate` | 立即生效，钓鱼倍率更新 |
| World | `server_message` | 立即生效，服务器消息更新 |
| World | `event_message` | 立即生效，活动消息更新 |
| World | `recommend_message` | 立即生效，推荐消息更新 |
| World | `flag` | 立即生效，世界标志更新 |
| Server | `allow_steal_quest_item` | 清除怪物掉落缓存 |

### 5.2 热加载实现

```java
// 配置更新时自动调用
GameConfig.update(gameConfigDO);

// 添加新配置
GameConfig.add(gameConfigDO);

// 删除配置
GameConfig.remove(gameConfigDO);
```

### 5.3 刷新机制

部分配置需要清除缓存才能生效：

```java
// 清除怪物掉落缓存
if ("allow_steal_quest_item".equals(configCode)) {
    MonsterInformationProvider.getInstance().clearDrops();
}
```

## 6. 多环境配置

### 6.1 环境profile

BeiDou-Server 支持 Spring Boot 的 profile 功能，可创建以下环境配置文件：

| 文件名 | 环境 | 说明 |
|--------|------|------|
| `application-dev.yml` | 开发环境 | 本地开发使用 |
| `application-test.yml` | 测试环境 | 测试服务器使用 |
| `application-prod.yml` | 生产环境 | 正式服务器使用 |

### 6.2 激活环境

```bash
# 命令行激活
java -jar BeiDou.jar --spring.profiles.active=prod

# 环境变量激活
export SPRING_PROFILES_ACTIVE=prod
```

### 6.3 开发环境配置示例 (application-dev.yml)

```yaml
server:
  port: 8686

mybatis-flex:
  datasource:
    mysql:
      url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      username: root
      password: root

springdoc:
  api-docs:
    enabled: true
  swagger-ui:
    enabled: true

gms:
  service:
    language: zh-CN
    rate-limit:
      enabled: false
    wan-host: 127.0.0.1
    lan-host: 127.0.0.1
    localhost: 127.0.0.1
    login-port: 8484
```

### 6.4 生产环境配置示例 (application-prod.yml)

```yaml
server:
  port: 8686

mybatis-flex:
  datasource:
    mysql:
      url: jdbc:mysql://db.example.com:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=true&serverTimezone=Asia/Shanghai
      username: beidou_prod
      password: ${DB_PASSWORD}

springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false

gms:
  service:
    language: zh-CN
    rate-limit:
      enabled: true
      limit: 10
      duration: 1000
      auto-ban: true
    wan-host: 1.2.3.4
    lan-host: 192.168.1.100
    localhost: 127.0.0.1
    login-port: 8484
```

## 7. 配置最佳实践

### 7.1 安全建议

1. **JWT Secret**
   - 生产环境必须使用自定义 UUID
   - 定期更换密钥

2. **数据库密码**
   - 使用环境变量存储敏感信息
   - 避免明文写在配置文件中

3. **API 文档**
   - 生产环境关闭 Swagger：`springdoc.api-docs.enabled: false`

### 7.2 性能优化

1. **数据库连接池**
   - 根据服务器配置调整连接数
   - 建议：`max-active: CPU核心数 * 2`

2. **文件上传**
   - 根据业务需求调整大小限制
   - 过大的限制可能影响服务器性能

### 7.3 配置检查清单

部署前检查以下配置：

- [ ] `jwt.secret` - 是否已更换为自定义值
- [ ] `mybatis-flex.datasource.mysql.password` - 是否为正确密码
- [ ] `springdoc.*.enabled` - 生产环境是否关闭
- [ ] `gms.service.wan-host` - 是否配置为公网 IP
- [ ] `gms.service.rate-limit.enabled` - 是否启用限流

## 8. 常见问题

### 8.1 配置不生效

**问题**：修改 application.yml 后配置未生效

**解决方案**：
1. 检查 YAML 格式是否正确（缩进、空格）
2. 确认配置文件在 `src/main/resources` 目录下
3. 重启应用

### 8.2 数据库连接失败

**问题**：无法连接到 MySQL 数据库

**解决方案**：
1. 检查 MySQL 服务是否启动
2. 验证用户名和密码
3. 检查防火墙设置
4. 确认数据库用户权限

### 8.3 动态配置不更新

**问题**：修改 game_config 表后配置未生效

**解决方案**：
1. 确认修改的是正确的世界 ID
2. 检查配置项类型是否匹配
3. 确认配置已通过 `GameConfig.update()` 方法更新

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
