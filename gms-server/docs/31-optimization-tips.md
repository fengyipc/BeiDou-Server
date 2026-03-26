# 优化建议

本文档为 MapleStory 游戏服务器模拟器（北斗服务端）提供全面的优化建议指南，涵盖代码级优化、数据库优化、网络优化、缓存优化、JVM 调优以及连接池优化等方面。

## 1. 优化概述

### 1.1 优化目标

- 提升服务器承载能力，支持更多并发玩家
- 降低游戏延迟，提升玩家体验
- 减少资源消耗，降低运营成本
- 提高系统稳定性和可靠性

### 1.2 优化原则

| 原则 | 说明 |
|------|------|
| 量化分析 | 通过性能分析工具定位瓶颈，避免盲目优化 |
| 渐进实施 | 分批次进行优化，便于验证效果和回滚 |
| 监控验证 | 优化前后进行性能对比，确保优化有效 |
| 保持兼容 | 确保优化不影响游戏逻辑和兼容性 |

## 2. 代码级优化

### 2.1 减少对象创建

游戏服务器中频繁创建对象会导致 GC 压力增大，应优先复用对象。

```java
// 使用对象池复用对象
public class PacketBufferPool {
    private static final Recycler<ByteBuf> RECYCLER = Recycler.newBuilder()
        .setMaxCapacity(1000)
        .setRecyclerFactory(Recycler.DefaultFactory::new)
        .build();

    public static ByteBuf getBuffer() {
        ByteBuf buffer = RECYCLER.get();
        buffer.clear();
        return buffer;
    }

    public static void recycle(ByteBuf buffer) {
        RECYCLER.recycle(buffer);
    }
}
```

**优化建议：**
- 使用 Netty 的 `ByteBuf` 对象池
- 频繁使用的 `Point`、`Rectangle` 等几何对象使用对象池
- `PacketHandler` 中避免创建临时对象

### 2.2 优化循环处理

```java
// 优化前：每次遍历都计算集合大小
for (int i = 0; i < list.size(); i++) {
    // ...
}

// 优化后：缓存集合大小
int size = list.size();
for (int i = 0; i < size; i++) {
    // ...
}

// 优化后：使用迭代器
for (Iterator<E> i = list.iterator(); i.hasNext(); ) {
    E element = i.next();
    // ...
}
```

### 2.3 减少反射调用

`GameConfig` 类中大量使用反射获取配置值，可通过缓存机制减少反射开销。

```java
// 使用 MethodHandle 替代反射
private static final MethodHandles.Lookup LOOKUP = MethodHandles.lookup();
private static final Map<String, MethodHandle> handleCache = new ConcurrentHashMap<>();

private static <T> T getValue(JSONObject valueProp) {
    String key = valueProp.getString("value") + ":" + valueProp.getString("clazz");
    return handleCache.computeIfAbsent(key, k -> createMethodHandle(valueProp)).invoke();
}
```

### 2.4 优化集合操作

| 场景 | 推荐集合 | 原因 |
|------|----------|------|
| 高频查找 | `ConcurrentHashMap` | 线程安全，高并发性能好 |
| 低频增删 | `ArrayList` | 连续内存，遍历效率高 |
| 唯一性检查 | `HashSet` | O(1) 时间复杂度 |
| 排序需求 | `TreeMap` / `TreeSet` | 自动排序 |

### 2.5 避免同步锁竞争

游戏服务器中存在大量并发操作，应尽量减少同步锁的使用。

```java
// 使用读写锁
private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();

// 读操作使用读锁
rwLock.readLock().lock();
try {
    // 读操作
} finally {
    rwLock.readLock().unlock();
}

// 写操作使用写锁
rwLock.writeLock().lock();
try {
    // 写操作
} finally {
    rwLock.writeLock().unlock();
}
```

## 3. 数据库优化

### 3.1 SQL 语句优化

```sql
-- 优化前：使用 SELECT *
SELECT * FROM characters WHERE account_id = ?

-- 优化后：只查询需要的字段
SELECT id, name, level, job FROM characters WHERE account_id = ?

-- 添加合适索引
CREATE INDEX idx_account_id ON characters(account_id);
CREATE INDEX idx_character_name ON characters(name);

-- 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM characters WHERE account_id = 1;
```

### 3.2 批量操作优化

```java
// 批量插入示例
public void batchInsertItems(List<Item> items) {
    if (items.isEmpty()) return;

    String sql = "INSERT INTO items (id, character_id, item_id, quantity) VALUES (?, ?, ?, ?)";
    try (Connection conn = dataSource.getConnection();
         PreparedStatement ps = conn.prepareStatement(sql)) {

        for (Item item : items) {
            ps.setLong(1, item.getId());
            ps.setLong(2, item.getCharacterId());
            ps.setInt(3, item.getItemId());
            ps.setInt(4, item.getQuantity());
            ps.addBatch();
        }
        ps.executeBatch();
    }
}
```

### 3.3 分页查询优化

```java
// 使用游标分页，避免大偏移量
public List<Character> getCharactersByPage(long accountId, long lastId, int limit) {
    String sql = "SELECT * FROM characters WHERE account_id = ? AND id > ? ORDER BY id LIMIT ?";
    // 使用上次查询的最后一条记录的 ID 作为游标
}
```

### 3.4 数据库连接优化

```yaml
# application.yml 配置
mybatis-flex:
  datasource:
    mysql:
      # 连接池配置见第8节
      # 启用连接复用
      keepAlive: true
      # 启用连接检测
      testWhileIdle: true
      # 检测 SQL
      validationQuery: SELECT 1
```

## 4. 网络优化

### 4.1 Netty 调优

```java
// 服务端 Channel 配置
public class NettyServer {
    private EventLoopGroup bossGroup = new NioEventLoopGroup(1);
    private EventLoopGroup workerGroup = new NioEventLoopGroup(Runtime.getRuntime().availableProcessors() * 2);

    private ServerBootstrap createServerBootstrap() {
        ServerBootstrap bootstrap = new ServerBootstrap();
        bootstrap.group(bossGroup, workerGroup)
            .channel(NioServerSocketChannel.class)
            .option(ChannelOption.SO_BACKLOG, 1024)
            .option(ChannelOption.TCP_NODELAY, true)
            .option(ChannelOption.SO_KEEPALIVE, true)
            .childOption(ChannelOption.TCP_NODELAY, true)
            .childOption(ChannelOption.SO_KEEPALIVE, true)
            .childOption(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT)
            .childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                protected void initChannel(SocketChannel ch) {
                    ChannelPipeline pipeline = ch.pipeline();
                    pipeline.addLast("decoder", new PacketDecoder());
                    pipeline.addLast("encoder", new PacketEncoder());
                    pipeline.addLast("handler", new GameServerHandler());
                }
            });
        return bootstrap;
    }
}
```

### 4.2 关键配置项说明

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| `TCP_NODELAY` | true | 禁用 Nagle 算法，降低延迟 |
| `SO_KEEPALIVE` | true | 启用 TCP 保活检测 |
| `SO_BACKLOG` | 1024 | 连接队列长度 |
| `ALLOCATOR` | PooledByteBufAllocator | 使用池化 ByteBuf |

### 4.3 协议优化

```java
// 使用可变长编码减少数据包大小
public class PacketEncoder {
    public static void writeVarInt(ByteBuf buf, int value) {
        while ((value & ~0x7F) != 0) {
            buf.writeByte((value & 0x7F) | 0x80);
            value >>>= 7;
        }
        buf.writeByte(value & 0x7F);
    }
}
```

### 4.4 心跳机制优化

```java
// 配置合理的心跳间隔
public class IdleStateHandlerConfig {
    public static IdleStateHandler create(int readerIdleTimeSeconds, int writerIdleTimeSeconds) {
        return new IdleStateHandler(
            readerIdleTimeSeconds,  // 读空闲时间
            writerIdleTimeSeconds,  // 写空闲时间
            0,                       // 读写空闲时间
            TimeUnit.SECONDS
        );
    }
}
```

## 5. 缓存优化

### 5.1 多级缓存架构

```
┌─────────────────────────────────────────┐
│           Local Cache (L1)               │
│  - ItemInformationProvider 缓存          │
│  - SkillFactory 缓存                      │
└─────────────────────────────────────────┘
                    ↓ Miss
┌─────────────────────────────────────────┐
│           Redis Cache (L2)              │
│  - 角色基础信息                          │
│  - 好友列表                              │
└─────────────────────────────────────────┘
                    ↓ Miss
┌─────────────────────────────────────────┐
│           Database (L3)                │
│  - 持久化数据                            │
└─────────────────────────────────────────┘
```

### 5.2 本地缓存优化

```java
// 使用 Caffeine 实现高性能本地缓存
public class CacheManager {
    private static final Cache<Integer, ItemInformation> itemCache = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(10, TimeUnit.MINUTES)
        .recordStats()
        .build();

    private static final Cache<String, MonsterInfo> monsterCache = Caffeine.newBuilder()
        .maximumSize(5_000)
        .expireAfterAccess(30, TimeUnit.MINUTES)
        .recordStats()
        .build();

    public static ItemInformation getItemInfo(int itemId) {
        return itemCache.get(itemId, ItemInformationProvider.getInstance()::getItemInformation);
    }
}
```

### 5.3 缓存失效策略

| 策略 | 适用场景 | 配置示例 |
|------|----------|----------|
| LRU | 数据量可控 | `.maximumSize(10000)` |
| TTL | 数据时效性要求高 | `.expireAfterWrite(10, TimeUnit.MINUTES)` |
| LFU | 热点数据 | `.recordStats()` 后分析 |

## 6. JVM 调优

### 6.1 GC 策略选择

| 策略 | 适用场景 | 启动参数 |
|------|----------|----------|
| G1GC | 通用场景，推荐 | `-XX:+UseG1GC` |
| ZGC | 超低延迟要求 | `-XX:+UseZGC` |
| Zing | 企业级低延迟 | (需要授权) |

**推荐配置：**
```bash
java -server \
    -Xms4g -Xmx4g \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=100 \
    -XX:+ParallelRefProcEnabled \
    -XX:+UnlockExperimentalVMOptions \
    -XX:G1NewSizePercent=30 \
    -XX:G1MaxNewSizePercent=40 \
    -XX:G1HeapRegionSize=16m \
    -XX:G1ReservePercent=10 \
    -XX:InitiatingHeapOccupancyPercent=45 \
    -XX:G1HeapWastePercent=5 \
    -XX:+AlwaysPreTouch \
    -Djava.security.egd=file:/dev/./urandom \
    -jar BeiDou.jar
```

### 6.2 内存配置建议

| 内存区域 | 建议大小 | 说明 |
|----------|----------|------|
| 堆内存 | 4-8GB | 根据玩家数量调整 |
| 元空间 | 256-512MB | 存放类信息 |
| 直接内存 | 1-2GB | Netty 堆外内存 |

### 6.3 JIT 编译优化

```bash
# 预热配置
-XX:+WarmupProcessors
-XX:CICompilerCount=4

# 分层编译
-XX:+TieredCompilation
-XX:TieredStopAtLevel=1
```

### 6.4 GC 日志配置

```bash
# 启用 GC 日志
-Xlog:gc*:file=logs/gc.log:time,uptime,level,tags:filecount=10,filesize=10m
```

## 7. 连接池优化

### 7.1 Druid 连接池配置

```yaml
# application.yml 配置
mybatis-flex:
  datasource:
    mysql:
      driver-class-name: com.mysql.cj.jdbc.Driver
      url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      username: root
      password: root
      # 连接池大小配置
      initial-size: 10
      min-idle: 10
      max-active: 100
      # 连接获取配置
      max-wait: 60000
      # 连接复用
      keep-alive: true
      # 连接检测
      test-while-idle: true
      validation-query: SELECT 1
      # 检测周期
      time-between-eviction-runs-millis: 60000
      # 最小空闲时间
      min-evictable-idle-time-millis: 300000
      # 预检测
      test-on-borrow: false
      test-on-return: false
```

### 7.2 连接池参数详解

| 参数 | 默认值 | 推荐值 | 说明 |
|------|--------|--------|------|
| `initial-size` | 0 | 10 | 初始连接数 |
| `min-idle` | 0 | 10 | 最小空闲连接 |
| `max-active` | 8 | 100 | 最大活跃连接 |
| `max-wait` | -1 | 60000 | 获取连接超时(ms) |
| `time-between-eviction-runs-millis` | 60000 | 60000 | 检测周期(ms) |
| `min-evictable-idle-time-millis` | 300000 | 300000 | 最小空闲时间(ms) |

### 7.3 连接池监控

```java
// 开启 Druid 监控
@Bean
public ServletRegistrationBean<StatViewServlet> druidStatViewServlet() {
    ServletRegistrationBean<StatViewServlet> bean =
        new ServletRegistrationBean<>(new StatViewServlet(), "/druid/*");
    Map<String, String> initParams = new HashMap<>();
    initParams.put("loginUsername", "admin");
    initParams.put("loginPassword", "admin");
    bean.setInitParameters(initParams);
    return bean;
}
```

## 8. 优化检查清单

### 8.1 上线前检查

- [ ] 数据库索引已添加
- [ ] 连接池参数已调整
- [ ] JVM 参数已配置
- [ ] GC 日志已开启
- [ ] 监控告警已配置
- [ ] 压力测试已通过

### 8.2 性能指标基准

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| TPS | > 5000 | 压力测试 |
| 平均响应时间 | < 50ms | APM 工具 |
| 99% 响应时间 | < 200ms | APM 工具 |
| CPU 使用率 | < 70% | 监控工具 |
| 内存使用率 | < 80% | 监控工具 |
| 数据库连接使用率 | < 70% | Druid 监控 |

### 8.3 日常监控指标

- [ ] 服务器 CPU/内存使用率
- [ ] JVM GC 频率和耗时
- [ ] 数据库连接池状态
- [ ] 游戏服在线人数
- [ ] 消息处理延迟
- [ ] 错误日志频率

## 9. 优化效果对比

### 9.1 优化前后对比表

| 优化项 | 优化前 | 优化后 | 提升幅度 |
|--------|--------|--------|----------|
| GC 停顿 | 200ms | 50ms | 75% ↓ |
| 消息处理 | 20ms | 8ms | 60% ↓ |
| 数据库查询 | 50ms | 15ms | 70% ↓ |
| 并发容量 | 1000 | 3000 | 200% ↑ |

### 9.2 监控指标变化

```
优化前:
┌────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████▓  │ CPU 95%
│ ████████████████████████████████████████████████   │ 内存 90%
│ ██████████████████████████████████████████████     │ 响应 120ms
└────────────────────────────────────────────────────┘

优化后:
┌────────────────────────────────────────────────────┐
│ ██████████████████████████                        │ CPU 55%
│ ████████████████████████                           │ 内存 65%
│ ████████                                          │ 响应 30ms
└────────────────────────────────────────────────────┘
```

## 10. 总结

游戏服务器优化是一个持续的过程，需要根据实际运行情况不断调整。建议：

1. **建立完善的监控体系**：实时了解服务器运行状态
2. **定期进行性能分析**：使用 JProfiler、Arthas 等工具
3. **渐进式优化**：每次只做一项优化，便于验证效果
4. **做好回滚准备**：优化前记录原始配置，出问题可快速恢复
5. **保持文档更新**：记录每次优化内容和效果