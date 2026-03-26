# 测试指南

## 1. 测试概述

### 1.1 测试目标

本项目作为 MapleStory 游戏服务器模拟器，测试的主要目标是：

- **功能正确性**：确保游戏逻辑、协议处理、数据持久化等功能正确实现
- **回归防护**：防止代码变更引入新的 bug
- **性能保障**：验证服务器在高并发场景下的稳定性
- **代码质量**：通过测试驱动开发提升代码设计质量

### 1.2 测试框架

项目采用以下测试框架：

| 框架 | 版本 | 用途 |
|------|------|------|
| JUnit 5 | 5.10.2 | 单元测试框架 |
| Mockito | 5.11.0 | Mock 对象框架 |
| MyBatis-Flex Codegen | 1.8.9 | 数据库代码生成测试 |

### 1.3 测试目录结构

```
src/test/java/
├── CodeGen.java        # 代码生成器测试
├── XmlDiff.java        # XML 差异对比测试
├── XmlNode.java        # XML 节点测试
└── XmlSort.java        # XML 排序测试
```

## 2. 单元测试规范

### 2.1 测试类命名规范

- 测试类应使用 `Test` 后缀或 `*Test` 命名模式
- 测试类应与被测试类位于相同的包结构下

```java
// 正确示例
org.gms.service.CharacterServiceTest
org.gms.dao.mapper.UserMapperTest

// 错误示例
TestCharacterService
CharacterServiceTests
```

### 2.2 测试方法命名规范

测试方法应使用描述性命名，明确表达测试意图：

```java
@Test
void shouldReturnCharacterById() {}

@Test
void shouldThrowExceptionWhenCharacterNotFound() {}

@Test
void shouldAddExperienceToCharacter() {}

@Test
void shouldValidateInventoryCapacity() {}
```

### 2.3 单元测试结构

遵循 Arrange-Act-Assert (AAA) 模式：

```java
@Test
void shouldAddItemToInventory() {
    // Arrange - 准备测试数据
    Inventory inventory = new Inventory(100);
    Item item = new Item(1000, 1);
    
    // Act - 执行被测试方法
    boolean result = inventory.addItem(item);
    
    // Assert - 验证结果
    assertTrue(result);
    assertEquals(1, inventory.getItemCount());
}
```

### 2.4 测试隔离原则

- 每个测试方法应独立运行，不依赖其他测试的状态
- 使用 `@BeforeEach` 和 `@AfterEach` 管理测试资源
- 避免在测试之间共享可变状态

```java
class CharacterServiceTest {
    private CharacterService characterService;
    private Character testCharacter;
    
    @BeforeEach
    void setUp() {
        characterService = new CharacterService();
        testCharacter = new Character();
        testCharacter.setId(1);
        testCharacter.setName("TestChar");
    }
    
    @AfterEach
    void tearDown() {
        // 清理资源
    }
    
    @Test
    void shouldLoadCharacterById() {
        // 测试逻辑
    }
}
```

## 3. 集成测试

### 3.1 数据库集成测试

使用 MyBatis-Flex 的代码生成器进行数据库相关测试：

```java
@Test
void genMapperAndEntity() {
    DruidDataSource dataSource = new DruidDataSource();
    Properties properties = new Properties();
    properties.setProperty("druid.url", "jdbc:mysql://localhost:3306/beidou");
    properties.setProperty("druid.username", "root");
    properties.setProperty("druid.password", "root");
    dataSource.configFromPropeties(properties);

    GlobalConfig globalConfig = new GlobalConfig();
    globalConfig.setBasePackage("org.gms.dao");
    globalConfig.setGenerateTable("lang_resources");
    globalConfig.setEntityGenerateEnable(true);
    globalConfig.setEntityWithLombok(true);
    globalConfig.setMapperGenerateEnable(true);

    Generator generator = new Generator(dataSource, globalConfig);
    generator.generate();
}
```

### 3.2 XML 数据解析测试

项目中包含 XML 解析相关的测试用例：

```java
@Test
void stringDiff() throws Exception {
    final String comparerPath1 = "wz/String.wz/ToolTipHelp.img.xml";
    final String comparerPath2 = "wz-zh-CN/String.wz/ToolTipHelp.img.xml";

    DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
    Document parsed1 = builder.parse(new File(comparerPath1));
    Map<String, Object> result1 = new HashMap<>();
    resolveElement(result1, parsed1);

    Document parsed2 = builder.parse(new File(comparerPath2));
    Map<String, Object> result2 = new HashMap<>();
    resolveElement(result2, parsed2);

    // 验证中英文XML结构一致性
    compare(new StringBuilder(), result1, result2);
}
```

### 3.3 Spring Boot 集成测试

使用 `@SpringBootTest` 进行完整的 Spring 上下文测试：

```java
@SpringBootTest
class ServerApplicationTest {
    
    @Test
    void contextLoads() {
        // 验证 Spring 上下文能够正常加载
    }
}
```

## 4. 测试覆盖率

### 4.1 覆盖率目标

| 模块类型 | 覆盖率目标 |
|----------|------------|
| 核心业务逻辑 (Service) | ≥ 80% |
| 数据访问层 (DAO) | ≥ 70% |
| 工具类 (Util) | ≥ 90% |
| 控制器 (Controller) | ≥ 60% |
| 网络处理 (Net) | ≥ 50% |

### 4.2 覆盖率工具

使用 Maven Surefire Plugin 结合 JaCoCo 进行覆盖率分析：

```bash
# 运行测试并生成覆盖率报告
mvn clean test
mvn jacoco:report
```

### 4.3 关键覆盖指标

- **分支覆盖率**：确保所有条件分支都被测试
- **方法覆盖率**：确保所有公共方法都有对应的测试
- **行覆盖率**：确保关键业务逻辑行都被执行

## 5. Mock 使用

### 5.1 Mockito 基本用法

```java
import org.mockito.Mockito;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;

class MockExampleTest {
    
    @Test
    void shouldMockRepository() {
        // 创建 Mock 对象
        CharacterRepository mockRepo = mock(CharacterRepository.class);
        
        // 配置 Mock 行为
        when(mockRepo.findById(1)).thenReturn(createTestCharacter());
        
        // 使用 Mock 进行测试
        CharacterService service = new CharacterService(mockRepo);
        Character result = service.getCharacterById(1);
        
        // 验证交互
        verify(mockRepo).findById(1);
        assertNotNull(result);
    }
}
```

### 5.2 常用 Mockito 注解

```java
class CharacterServiceTest {
    
    @Mock
    private CharacterRepository characterRepository;
    
    @Mock
    private InventoryMapper inventoryMapper;
    
    @InjectMocks
    private CharacterService characterService;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
}
```

### 5.3 Mock 远程服务

对于网络通信模块，使用 Mock 避免真实网络调用：

```java
@Test
void shouldHandleNetworkTimeout() {
    // 模拟网络超时场景
    NettyClient mockClient = mock(NettyClient.class);
    when(mockClient.send(any()))
        .thenThrow(new TimeoutException("Connection timeout"));
    
    ClientHandler handler = new ClientHandler(mockClient);
    
    assertThrows(NetworkException.class, () -> handler.sendPacket(packet));
}
```

### 5.4 Spy 的使用

使用 Spy 测试真实对象的部分行为：

```java
@Test
void shouldTrackMethodCalls() {
    CharacterService spyService = spy(new CharacterService());
    
    doReturn(true).when(spyService).validateCharacter(any());
    
    spyService.processCharacter(new Character());
    
    verify(spyService).validateCharacter(any());
}
```

## 6. 常见测试场景

### 6.1 角色相关测试

```java
@Test
void shouldCreateNewCharacter() {
    CharacterCreator creator = new CharacterCreator();
    
    Character character = creator.createCharacter(
        "TestPlayer",
        1,  // jobId
        0   // subJobId
    );
    
    assertEquals("TestPlayer", character.getName());
    assertEquals(1, character.getJobId());
    assertEquals(0, character.getSubJobId());
    assertEquals(1, character.getLevel());
}

@Test
void shouldAddExperienceWithLevelUp() {
    Character character = new Character();
    character.setLevel(1);
    character.setExp(0);
    character.setMaxExp(100);
    
    character.gainExp(150);
    
    assertEquals(2, character.getLevel());
    assertEquals(50, character.getExp());
}

@Test
void shouldPreventInvalidLevelUp() {
    Character character = new Character();
    character.setLevel(200);  // max level
    
    assertThrows(IllegalStateException.class, () -> character.levelUp());
}
```

### 6.2 背包系统测试

```java
@Test
void shouldAddItemToInventory() {
    Inventory inventory = new Inventory(24);  // 24格背包
    
    Item item = new Item(1000, 1);  // 物品ID 1000, 数量1
    boolean result = inventory.addItem(item);
    
    assertTrue(result);
    assertEquals(1, inventory.getItemCount());
}

@Test
void shouldRejectItemWhenInventoryFull() {
    Inventory inventory = new Inventory(4);
    
    // 填满背包
    for (int i = 0; i < 4; i++) {
        inventory.addItem(new Item(1000 + i, 1));
    }
    
    // 尝试添加第5个物品
    Item overflowItem = new Item(2000, 1);
    boolean result = inventory.addItem(overflowItem);
    
    assertFalse(result);
}

@Test
void shouldStackSameTypeItems() {
    Inventory inventory = new Inventory(24);
    
    Item item1 = new Item(1000, 50);
    Item item2 = new Item(1000, 30);
    
    inventory.addItem(item1);
    boolean result = inventory.addItem(item2);
    
    assertTrue(result);
    assertEquals(80, inventory.getItemById(1000).getQuantity());
}
```

### 6.3 地图移动测试

```java
@Test
void shouldWarpCharacterToMap() {
    MapManager mapManager = new MapManager();
    Character character = createTestCharacter();
    int targetMapId = 100000000;
    
    mapManager.warpCharacter(character, targetMapId);
    
    assertEquals(targetMapId, character.getMapId());
    assertTrue(mapManager.getCharactersOnMap(targetMapId).contains(character));
}

@Test
void shouldTransferBetweenChannels() {
    Character character = createTestCharacter();
    character.setChannel(1);
    character.setMapId(100000000);
    
    character.changeChannel(5);
    
    assertEquals(5, character.getChannel());
}
```

### 6.4 命令系统测试

```java
@Test
void shouldExecuteGMCommand() {
    CommandsExecutor executor = new CommandsExecutor();
    Character admin = createAdminCharacter();
    String[] args = {"playerName", "100"};
    
    executor.execute("warp", admin, args);
    
    assertEquals(100, player.getMapId());
}

@Test
void shouldValidateCommandPermission() {
    CommandsExecutor executor = new CommandsExecutor();
    Character normalPlayer = createNormalPlayer();
    
    assertThrows(SecurityException.class, () -> 
        executor.execute("ban", normalPlayer, new String[]{"cheater"})
    );
}
```

## 7. 测试工具使用

### 7.1 Maven 测试命令

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=CharacterServiceTest

# 运行特定测试方法
mvn test -Dtest=CharacterServiceTest#shouldAddExperienceWithLevelUp

# 跳过测试
mvn clean package -DskipTests

# 生成测试覆盖率报告
mvn test jacoco:report
```

### 7.2 IDE 测试支持

**IntelliJ IDEA**
- 使用内置 JUnit 5 支持
- 右键点击测试类或方法选择 "Run"
- 使用 Ctrl+Shift+F10 运行上次测试

**VS Code**
- 安装 "Java Test Runner" 扩展
- 使用 CodeLens 运行测试

### 7.3 数据库测试辅助

```java
@Test
void shouldGenerateCommandSql() throws Exception {
    Path path = Path.of("src/main/java/org/gms/client/command/CommandsExecutor.java");
    
    // 读取命令注册代码并生成 SQL
    String sql = generateCommandSql(path);
    
    assertTrue(sql.contains("INSERT INTO command_info"));
    assertTrue(sql.contains("warp"));
}
```

## 8. CI/CD 中的测试

### 8.1 Maven 集成

在 `pom.xml` 中配置测试插件：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
        </includes>
        <excludes>
            <exclude>**/CodeGen.java</exclude>
        </excludes>
    </configuration>
</plugin>
```

### 8.2 GitHub Actions 配置

```yaml
name: Java CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'
    
    - name: Run tests
      run: mvn test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### 8.3 测试报告

测试完成后，查看以下报告：

- **Surefire 报告**：`target/surefire-reports/*.txt`
- **覆盖率报告**：`target/site/jacoco/index.html`

## 9. 相关代码示例

### 9.1 完整的 Service 测试示例

```java
package org.gms.service;

import org.junit.jupiter.api.*;
import org.mockito.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class CharacterServiceTest {
    
    @Mock
    private CharacterRepository characterRepository;
    
    @Mock
    private InventoryService inventoryService;
    
    @InjectMocks
    private CharacterService characterService;
    
    private Character testCharacter;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        testCharacter = new Character();
        testCharacter.setId(1);
        testCharacter.setName("TestChar");
        testCharacter.setLevel(1);
        testCharacter.setExp(0);
    }
    
    @Test
    @DisplayName("应该根据ID加载角色")
    void shouldLoadCharacterById() {
        when(characterRepository.findById(1)).thenReturn(testCharacter);
        
        Character result = characterService.getCharacterById(1);
        
        assertNotNull(result);
        assertEquals("TestChar", result.getName());
        verify(characterRepository).findById(1);
    }
    
    @Test
    @DisplayName("角色升级时应增加属性")
    void shouldIncreaseStatsOnLevelUp() {
        when(characterRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        
        Character leveled = characterService.levelUp(testCharacter);
        
        assertEquals(2, leveled.getLevel());
        assertTrue(leveled.getMaxHp() > testCharacter.getMaxHp());
    }
    
    @Test
    @DisplayName("不存在的角色应抛出异常")
    void shouldThrowWhenCharacterNotFound() {
        when(characterRepository.findById(any())).thenReturn(null);
        
        assertThrows(CharacterNotFoundException.class, 
            () -> characterService.getCharacterById(999));
    }
}
```

### 9.2 网络包处理测试示例

```java
class PacketHandlerTest {
    
    @Test
    void shouldHandleLoginRequest() {
        PacketHandler handler = new PacketHandler();
        LoginRequestPacket packet = new LoginRequestPacket();
        packet.setAccountId(100);
        packet.setAuthToken("test-token");
        
        handler.handle(packet);
        
        assertNotNull(handler.getSession());
        assertEquals(100, handler.getSession().getAccountId());
    }
}
```

### 9.3 脚本系统测试示例

```java
class ScriptEngineTest {
    
    @Test
    void shouldExecuteQuestScript() {
        ScriptEngine engine = new ScriptEngine();
        String script = """
            var quest = FindQuest(1000);
            if (quest != null) {
                quest.complete();
                return true;
            }
            return false;
            """;
        
        boolean result = engine.execute(script);
        
        assertTrue(result);
    }
}
```

## 附录：常见问题

### Q1: 测试运行缓慢怎么办？

- 使用 `@Tag` 注解分类测试，快速测试和慢速测试分离
- 使用 `@Disabled` 临时禁用不稳定的测试
- 使用 `@Timeout 控制测试超时时间

### Q2: 如何测试私有方法？

优先重构为 package-private 或 protected 方法，然后通过调用公共方法间接测试。如必须测试私有方法，可使用反射：

```java
@Test
void shouldTestPrivateMethod() throws Exception {
    Method method = MyClass.class.getDeclaredMethod("privateMethod", int.class);
    method.setAccessible(true);
    
    Object result = method.invoke(instance, 42);
    
    assertEquals("expected", result);
}
```

### Q3: 数据库测试需要真实数据库吗？

可以使用 H2 内存数据库进行测试，避免依赖外部 MySQL：

```java
@Test
void testWithH2() {
    DruidDataSource dataSource = new DruidDataSource();
    dataSource.setUrl("jdbc:h2:mem:testdb");
    dataSource.setUsername("sa");
    dataSource.setPassword("");
    // ...
}
```

### Q4: 如何模拟时间相关测试？

使用 Clock 或 ClockUtility 封装时间调用，便于测试中固定时间：

```java
@Test
void shouldExpireAfter24Hours() {
    Clock fixedClock = Clock.fixed(
        Instant.parse("2024-01-01T12:00:00Z"),
        ZoneId.of("UTC")
    );
    
    Quest quest = new Quest(1, fixedClock);
    quest.start();
    
    // 模拟时间流逝
    Clock shiftedClock = Clock.fixed(
        Instant.parse("2024-01-02T12:00:01Z"),
        ZoneId.of("UTC")
    );
    
    assertTrue(quest.isExpired(shiftedClock));
}
```
