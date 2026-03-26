# 开发指南

## 1. 开发规范

### 1.1 代码规范

#### 命名规范

**类命名**
- 使用大驼峰（PascalCase）
- 名词或名词短语
```java
public class CharacterService {}
public class InventoryManager {}
```

**方法命名**
- 使用小驼峰（camelCase）
- 动词或动词短语开头
```java
public void gainExp(int exp) {}
public Character loadCharacter(int id) {}
```

**常量命名**
- 全大写下划线分隔
```java
public static final int MAX_LEVEL = 200;
public static final String WORLD_NAME = "冒险岛";
```

**变量命名**
- 使用小驼峰（camelCase）
- 有意义的名称
```java
private int accountId;
private String characterName;
private boolean isLoggedIn;
```

#### 包命名

- 全小写
- 使用点号分隔
- 按功能模块组织
```
org.gms.service
org.gms.dao.mapper
org.gms.client.inventory
```

### 1.2 注释规范

#### 类注释
```java
/**
 * 角色服务类
 * 提供角色的创建、加载、保存等功能
 *
 * @author BeiDou Team
 * @since 1.0
 */
public class CharacterService {
    // ...
}
```

#### 方法注释
```java
/**
 * 为角色添加经验值
 *
 * @param exp 要添加的经验值
 * @return 实际获得的经验值
 * @throws IllegalArgumentException 如果经验值小于0
 */
public int gainExp(int exp) {
    // ...
}
```

#### 字段注释
```java
/** 角色唯一标识 */
private int id;

/** 角色名称 */
private String name;

/** 角色等级 */
private int level;
```

### 1.3 异常处理规范

```java
// 捕获并记录异常
try {
    // 业务逻辑
} catch (SQLException e) {
    log.error("数据库操作失败", e);
    throw new BusinessException("操作失败", e);
}

// 抛出自定义异常
public void loadCharacter(int id) {
    if (id <= 0) {
        throw new IllegalArgumentException("角色ID必须大于0");
    }
    // ...
}
```

## 2. 开发流程

### 2.1 新功能开发流程

```
需求分析 → 设计方案 → 编码实现 → 单元测试 → 代码审查 → 提交代码 → 集成测试
```

#### 步骤说明

1. **需求分析**
   - 理解功能需求
   - 分析技术可行性
   - 确定影响范围

2. **设计方案**
   - 设计数据结构
   - 设计接口定义
   - 设计实现方案

3. **编码实现**
   - 遵循代码规范
   - 添加必要注释
   - 实现业务逻辑

4. **单元测试**
   - 编写测试用例
   - 运行测试验证
   - 修复发现的问题

5. **代码审查**
   - 自我审查代码
   - 提交代码审查
   - 修改审查意见

6. **提交代码**
   - 编写提交信息
   - 推送到代码仓库

7. **集成测试**
   - 运行集成测试
   - 验证功能正确性

### 2.2 Bug 修复流程

```
问题定位 → 复现问题 → 分析原因 → 编写修复 → 测试验证 → 提交代码 → 更新文档
```

## 3. 调试技巧

### 3.1 日志调试

```java
// 使用不同级别的日志
log.debug("调试信息: {}", data);
log.info("普通信息: {}", data);
log.warn("警告信息: {}", data);
log.error("错误信息", exception);

// 使用占位符而不是字符串拼接
log.info("角色 {} 获得了 {} 经验", characterName, exp);
// 不要这样
log.info("角色 " + characterName + " 获得了 " + exp + " 经验");
```

### 3.2 断点调试

在 IDEA 中：
1. 在代码行号左侧点击设置断点
2. 以 Debug 模式运行应用
3. 程序会在断点处暂停
4. 可以查看变量值、单步执行等

### 3.3 封包调试

```java
// 在 application.yml 中开启封包调试
gms:
  service:
    debug-packet: true

// 代码中记录收到的封包
if (GameConfig.getServerBoolean("use_debug_show_rcvd_packet")) {
    log.info("收到封包: {}", packet);
}
```

### 3.4 数据库调试

```java
// 查看执行的SQL
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai&logger=Slf4J
```

## 4. 测试指南

### 4.1 单元测试

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CharacterServiceTest {

    @Test
    public void testGainExp() {
        Character character = new Character();
        character.setLevel(1);
        character.setExp(0);

        int expToGain = 100;
        int actualExp = character.gainExp(expToGain);

        assertEquals(expToGain, actualExp);
    }

    @Test
    public void testLevelUp() {
        Character character = new Character();
        character.setLevel(1);
        character.setExp(1000);

        character.gainExp(1000);

        assertTrue(character.getLevel() > 1);
    }
}
```

### 4.2 集成测试

```java
@SpringBootTest
@AutoConfigureMockMvc
public class CharacterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGetCharacterList() throws Exception {
        mockMvc.perform(get("/api/character/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
```

### 4.3 运行测试

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=CharacterServiceTest

# 跳过测试
mvn clean package -DskipTests
```

## 5. 常用开发工具

### 5.1 IDEA 快捷键

| 功能 | Windows | Mac |
|------|---------|-----|
| 查找类 | Ctrl+N | Cmd+O |
| 查找文件 | Ctrl+Shift+N | Cmd+Shift+O |
| 查找方法 | Ctrl+Shift+Alt+N | Cmd+Shift+Alt+O |
| 重命名 | Shift+F6 | Shift+F6 |
| 格式化代码 | Ctrl+Alt+L | Cmd+Option+L |
| 运行 | Shift+F10 | Ctrl+R |
| 调试 | Shift+F9 | Ctrl+D |

### 5.2 Git 常用命令

```bash
# 查看状态
git status

# 添加文件
git add .
git add <filename>

# 提交
git commit -m "提交信息"

# 推送
git push origin master

# 拉取
git pull origin master

# 查看日志
git log

# 创建分支
git branch <branch-name>
git checkout -b <branch-name>

# 合并分支
git merge <branch-name>
```

## 6. 代码审查

### 6.1 审查检查清单

- [ ] 代码符合编码规范
- [ ] 方法命名清晰易懂
- [ ] 添加了必要的注释
- [ ] 异常处理正确
- [ ] 没有安全隐患
- [ ] 性能考虑合理
- [ ] 测试覆盖充分
- [ ] 没有调试代码
- [ ] 没有注释掉的代码
- [ ] 提交信息清晰

### 6.2 审查意见模板

```
问题类型：
- [ ] 严重问题
- [ ] 一般问题
- [ ] 建议改进

问题描述：

建议修改：

原因说明：
```

## 7. 性能优化

### 7.1 数据库优化

```java
// 使用索引
@Index("accountid")
private int accountId;

// 批量操作
List<Character> characters = // ...
characters.forEach(character -> saveCharacter(character));

// 避免N+1查询
// 使用JOIN或批量查询
```

### 7.2 缓存优化

```java
// 使用本地缓存
private static final Map<Integer, Guild> GUILD_CACHE = new ConcurrentHashMap<>();

// 缓存失效
public void updateGuild(Guild guild) {
    saveGuild(guild);
    GUILD_CACHE.put(guild.getId(), guild);
}
```

### 7.3 并发优化

```java
// 使用读写锁
private final ReadWriteLock lock = new ReentrantReadWriteLock();

public void readData() {
    lock.readLock().lock();
    try {
        // 读取操作
    } finally {
        lock.readLock().unlock();
    }
}

public void writeData() {
    lock.writeLock().lock();
    try {
        // 写入操作
    } finally {
        lock.writeLock().unlock();
    }
}
```

## 8. 安全开发

### 8.1 输入验证

```java
public void updateName(String name) {
    // 验证输入
    if (name == null || name.isEmpty()) {
        throw new IllegalArgumentException("角色名称不能为空");
    }
    if (name.length() > 12) {
        throw new IllegalArgumentException("角色名称不能超过12个字符");
    }
    if (!name.matches("[a-zA-Z0-9]+")) {
        throw new IllegalArgumentException("角色名称只能包含字母和数字");
    }
    // ...
}
```

### 8.2 SQL 注入防护

```java
// 使用参数化查询
try (PreparedStatement ps = connection.prepareStatement(
    "SELECT * FROM characters WHERE id = ?")) {
    ps.setInt(1, characterId);
    // 不要这样: "SELECT * FROM characters WHERE id = " + characterId
}
```

### 8.3 权限检查

```java
public void banPlayer(int adminId, int targetId) {
    Character admin = loadCharacter(adminId);
    Character target = loadCharacter(targetId);

    // 检查管理员权限
    if (admin.getGmLevel() < 2) {
        throw new PermissionDeniedException("没有封禁权限");
    }
    // ...
}
```

## 9. 文档编写

### 9.1 API 文档

使用 SpringDoc 自动生成 API 文档：

```java
@Tag(name = "角色管理", description = "角色相关API")
@RestController
@RequestMapping("/api/character")
public class CharacterController {

    @Operation(summary = "获取角色列表", description = "获取指定账号的所有角色")
    @Parameter(name = "accountId", description = "账号ID", required = true)
    @ApiResponse(responseCode = "200", description = "成功")
    @GetMapping("/list")
    public Result<List<CharacterDTO>> getCharacterList(
            @RequestParam int accountId) {
        // ...
    }
}
```

访问文档: http://localhost:8686/swagger-ui/index.html

### 9.2 更新日志

记录重要的变更：

```markdown
## [1.0.1] - 2026-03-25

### Added
- 添加了新职业：影武者
- 添加了新地图：神秘岛屿

### Changed
- 优化了登录流程
- 改进了封包处理性能

### Fixed
- 修复了背包扩容bug
- 修复了任务完成奖励不发放的问题
```

## 10. 常见开发问题

### 10.1 数据库连接池耗尽

**问题**: 数据库连接池达到最大连接数

**解决**:
1. 增加连接池大小
2. 检查连接是否正确释放
3. 优化慢查询

### 10.2 内存泄漏

**问题**: 玩家下线后内存未释放

**解决**:
1. 检查缓存是否正确清除
2. 移除监听器和回调
3. 使用 WeakReference

### 10.3 并发问题

**问题**: 多线程修改数据导致不一致

**解决**:
1. 使用适当的锁机制
2. 使用线程安全集合
3. 避免共享可变状态

---

*文档版本: 1.0*
*最后更新: 2026-03-25*
