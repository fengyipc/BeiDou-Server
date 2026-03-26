# 编码规范

本文档为 BeiDou-Server（MapleStory 游戏服务器模拟器）项目制定统一的编码规范，确保代码质量、可维护性和一致性。

## 1. 代码规范概述

### 1.1 规范目的

- 提高代码可读性和可维护性
- 统一团队开发风格，减少代码审查摩擦
- 降低引入 bug 的概率
- 便于新人快速上手项目

### 1.2 技术栈

| 类别 | 技术 |
|------|------|
| 语言 | Java 21 |
| 框架 | Spring Boot 3.2.3 |
| 构建工具 | Maven |
| 数据库 | MySQL + MyBatis-Flex |
| 网络 | Netty |
| API文档 | OpenAPI (SpringDoc) |
| 日志 | Slf4j + Log4j2 |
| 工具库 | Lombok |

### 1.3 项目结构

```
org.gms/
├── aop/          # AOP 切面（安全认证、过滤器）
├── client/       # 客户端相关（角色、背包、技能）
├── config/       # Spring 配置类
├── constants/    # 常量定义（技能ID、物品ID等）
├── controller/   # REST API 控制器
├── dao/          # 数据库层（Mapper、Entity）
├── exception/    # 自定义异常和全局异常处理
├── manager/      # 管理器类
├── model/        # 数据模型（DTO、POJO）
├── net/          # 网络层（Packet、Server）
├── provider/     # 数据提供者
├── scripting/    # 脚本系统
├── server/       # 服务器核心逻辑
├── service/      # 业务服务层
└── util/         # 工具类
```

## 2. Java 编码规范

### 2.1 命名规范

#### 2.1.1 类名命名

- **PascalCase** 格式，每个单词首字母大写
- Controller 以 `Controller` 结尾
- Service 以 `Service` 结尾
- Mapper/DAO 以 `Mapper` 或 `DAO` 结尾
- Entity/DO 以 `DO` 结尾（数据对象）
- DTO 以 `DTO` 结尾（数据传输对象）
- 枚举类型以 `Enum` 结尾或使用全大写

```java
// ✅ 正确示例
public class CharacterController { }
public class AccountService { }
public class CharactersMapper { }
public class AccountsDO { }
public class ChrOnlineListRtnDTO { }
public enum ClientState { LOGIN_NOTLOGGEDIN, LOGIN_LOGGEDIN }

// ❌ 错误示例
public class characterController { }
public class account_service { }
```

#### 2.1.2 方法命名

- **camelCase** 格式，首单词小写，后续单词首字母大写
- 查询方法：`findByXxx`、`getByXxx`、`selectByXxx`
- 列表查询：`listXxx`、`getXxxList`
- 分页查询：`paginateXxx`
- 新增方法：`addXxx`、`insertXxx`、`createXxx`
- 更新方法：`updateXxx`、`modifyXxx`
- 删除方法：`deleteXxx`、`removeXxx`

```java
// ✅ 正确示例
public AccountsDO findByName(String name) { }
public Page<AccountsDO> getAccountList(Integer page, Integer size) { }
public void addAccount(AddAccountDTO submitData) { }
public void updateRate(ExtendValueDO data) { }

// ❌ 错误示例
public AccountsDO get_By_Name(String name) { }
public List<AccountsDO> GetAccountList() { }
```

#### 2.1.3 变量命名

- **camelCase** 格式
- 布尔变量使用 `is`、`has`、`can`、`should` 前缀
- 集合变量使用复数名词或 `List`、`Map`、`Set` 后缀
- 常量使用全大写 + 下划线分隔

```java
// ✅ 正确示例
private int world;
private int accountId;
private boolean isLoggedIn;
private boolean hasPermission;
private List<Character> characters;
private Map<Integer, Item> itemMap;
private static final Logger log = LoggerFactory.getLogger(Character.class);

// ❌ 错误示例
private int World;
private int ID;
private boolean logged_in;
private List<Character> characterList;
```

#### 2.1.4 包名命名

- 全小写，使用 `.` 分隔
- 单一职责，一个包不超过 50 个类

```java
package org.gms.controller;
package org.gms.dao.mapper;
package org.gms.constants.skills;
```

### 2.2 代码格式

#### 2.2.1 缩进与空格

- 使用 **4 空格** 缩进（禁止 Tab）
- 方法参数、运算符两侧添加空格
- `if`、`for`、`while` 与括号之间添加空格

```java
// ✅ 正确示例
public void updateRate(ExtendValueDO data) {
    if (data == null) {
        throw new BizException(BizExceptionEnum.PARAM_IS_NULL);
    }
    characterService.updateRate(data.getExtendName(), data.getValue());
}

// ❌ 错误示例
public void updateRate(ExtendValueDO data){
    if(data==null){
        throw new BizException(BizExceptionEnum.PARAM_IS_NULL);
    }
}
```

#### 2.2.2 行长度

- 单行不超过 **120 个字符**
- 超长时换行，缩进 8 空格

```java
// ✅ 正确示例
public ResultBody<Page<ChrOnlineListRtnDTO>> onlineList(
        @RequestBody SubmitBody<ChrOnlineListReqDTO> submitBody) {
    return ResultBody.success(characterService.getChrOnlineList(submitBody.getData()));
}
```

#### 2.2.3 大括号

- 左大括号不换行
- 右大括号单独一行

```java
// ✅ 正确示例
public class CharacterController {
    public void updateRate() {
        if (condition) {
            doSomething();
        }
    }
}

// ❌ 错误示例
public class CharacterController
{
    public void updateRate()
    {
        if (condition)
        {
            doSomething();
        }
    }
}
```

#### 2.2.4 import 规范

- 导入顺序：java.* → javax.* → org.gms.* → 其他
- 同包导入可省略
- 不使用通配符 `import java.util.*`

```java
// ✅ 正确示例
import java.util.List;
import java.util.NoSuchElementException;
import org.gms.service.CharacterService;
import org.springframework.web.bind.annotation.*;

// ❌ 错误示例
import java.util.*;
import org.gms.service.*;
```

### 2.3 Lombok 使用规范

#### 2.3.1 推荐注解

| 注解 | 适用场景 | 注意事项 |
|------|----------|----------|
| `@Getter` | 所有 Entity、DTO、DO 类 | 配合 `@Setter` 使用 |
| `@Setter` | DTO、DO 等可写对象 | Entity 慎用，部分字段不应暴露 setter |
| `@AllArgsConstructor` | Controller、Service、配置类 | 需要无参构造时加 `@NoArgsConstructor` |
| `@Data` | DTO（数据传递） | 不建议用于 Entity，会有全字段 setter |
| `@Builder` | 创建复杂对象 | 配合 `@AllArgsConstructor` 使用 |
| `@Slf4j` | 需要日志的类 | 自动生成 `log` 字段 |

```java
// ✅ 正确示例
@Getter
@Setter
@AllArgsConstructor
public class AccountsDO {
    private Integer id;
    private String name;
    private String password;
}

// ✅ Service 示例
@Service
@AllArgsConstructor
public class AccountService {
    private final AccountsMapper accountsMapper;
    private final CharactersMapper charactersMapper;
}

// ✅ 日志示例
@Slf4j
public class CharacterManager {
    public void save() {
        log.info("Saving character data");
    }
}

// ❌ 错误示例 - Entity 使用 @Data 导致全字段可写
@Data
public class CharacterDO {  // 不推荐，暴露了所有 setter
    private int id;
    private int accountId;
}
```

### 2.4 异常处理规范

#### 2.4.1 业务异常

使用项目自定义的 `BizException`，通过 `BizExceptionEnum` 定义异常类型。

```java
// ✅ 正确示例
if (data == null) {
    throw new BizException(BizExceptionEnum.PARAM_IS_NULL);
}
RequireUtil.requireNotNull(submitData.getLanguage(), I18nUtil.getExceptionMessage("LANGUAGE_NOT_SUPPORT"));
RequireUtil.requireNull(findByName(submitData.getName()), I18nUtil.getExceptionMessage("AccountService.addAccount.exception1"));
```

#### 2.4.2 异常枚举定义

```java
@Getter
@AllArgsConstructor
public enum BizExceptionEnum {
    PARAM_IS_NULL("参数不能为空"),
    ACCOUNT_NOT_FOUND("账户不存在"),
    // ...
    ;
    private final String message;
}
```

#### 2.4.3 全局异常捕获

在 `GlobalExceptionHandler` 中统一处理，返回统一格式的响应。

## 3. 代码结构规范

### 3.1 分层架构

```
Controller (API入口)
    ↓
Service (业务逻辑)
    ↓
Mapper/DAO (数据访问)
    ↓
Database
```

### 3.2 Controller 规范

```java
@RestController
@AllArgsConstructor
@RequestMapping("/character")
@Tag(name = "/character/" + ApiConstant.LATEST)
public class CharacterController {
    private final CharacterService characterService;

    @Operation(summary = "查询在线玩家列表")
    @PostMapping("/" + ApiConstant.LATEST + "/online/list")
    public ResultBody<Page<ChrOnlineListRtnDTO>> onlineList(
            @RequestBody SubmitBody<ChrOnlineListReqDTO> submitBody) {
        return ResultBody.success(characterService.getChrOnlineList(submitBody.getData()));
    }
}
```

### 3.3 Service 规范

```java
@Service
@AllArgsConstructor
public class AccountService {
    private final AccountsMapper accountsMapper;
    private final CharactersMapper charactersMapper;

    public AccountsDO findByName(String name) {
        return accountsMapper.selectOneByName(name);
    }

    public void addAccount(AddAccountDTO submitData) throws NoSuchAlgorithmException {
        RequireUtil.requireNotNull(submitData.getLanguage(), I18nUtil.getExceptionMessage("LANGUAGE_NOT_SUPPORT"));
        RequireUtil.requireNull(findByName(submitData.getName()), I18nUtil.getExceptionMessage("AccountService.addAccount.exception1"));
        // 业务逻辑...
    }
}
```

### 3.4 数据对象规范

```java
// Entity/DO 类
@Getter
@Setter
@TableName("accounts")
public class AccountsDO {
    private Integer id;
    private String name;
    private String password;
    private Timestamp lastlogin;
    private Timestamp createdat;
}

// DTO 类
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AddAccountDTO {
    private String name;
    private String password;
    private String birthday;
    private String language;
}
```

## 4. 注释规范

### 4.1 文件头注释

每个 Java 文件应包含版权和许可证信息：

```java
/*
 * This file is part of the OdinMS Maple Story Server
 * Copyright (C) 2008 Patrick Huy <patrick.huy@frz.cc>
 * Matthias Butz <matze@odinms.de>
 * Jan Christian Meyer <vimes@odinms.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation version 3 as published by
 * the Free Software Foundation. You may not use, modify or distribute
 * this program under any other version of the GNU Affero General Public
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
```

### 4.2 类注释

```java
/**
 * 角色类，存储玩家的角色信息
 *
 * @author Matze
 * @author Frz
 * @author Ronan
 */
public class Character extends AbstractCharacterObject {
}
```

### 4.3 方法注释

使用 Javadoc 格式：

```java
/**
 * 根据角色名查找角色
 *
 * @param name 角色名
 * @return 角色对象，未找到返回 null
 */
public Character findByName(String name) {
    // ...
}
```

### 4.4 行内注释

```java
// ✅ 正确示例
// 防止swagger调用，后续的语言路由都受影响
RequireUtil.requireNotNull(submitData.getLanguage(), I18nUtil.getExceptionMessage("LANGUAGE_NOT_SUPPORT"));

// ❌ 错误示例 - 注释与代码重复
// 设置名称
account.setName(name);  // 设置名称
```

### 4.5 TODO 注释

```java
// TODO(作者名): 后续优化为异步处理
// FIXME: 修复此处可能的空指针问题
```

## 5. Git 提交规范

### 5.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 5.2 type 类型

| type | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档变更 |
| style | 代码格式（不影响运行） |
| refactor | 重构（不是新功能或修复） |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具变更 |

### 5.3 示例

```bash
# ✅ 正确示例
git commit -m "feat(character): 添加角色经验倍率功能"
git commit -m "fix(service): 修复账户查询空指针异常"
git commit -m "docs: 更新 API 文档"

# ❌ 错误示例
git commit -m "更新代码"
git commit -m "fix bug"
git commit -m "1.0.0"
```

### 5.4 提交频率

- 每个功能点完成后及时提交
- 不要一次性提交大量不相关的修改
- 保持提交的原子性（一个提交一个功能点）

## 6. PR 创建规范

### 6.1 PR 标题

```
[feat/fix/docs/refactor]: 简短描述
```

示例：
- `feat: 添加角色交易系统`
- `fix: 修复登录会话过期问题`
- `docs: 更新 API 接口文档`

### 6.2 PR 描述

```markdown
## 描述
简要说明本次 PR 的目的和主要内容。

## 改动类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)

## 改动内容
- 详细列出改动点

## 影响范围
- 影响的模块或功能

## 测试情况
- [ ] 本地测试通过
- [ ] 单元测试通过
- [ ] 手动测试通过

## 截图/日志（如有）
如有 UI 变更或重要逻辑变更，请附上截图或日志。
```

### 6.3 注意事项

- PR 越小越好，优先拆分大型 PR
- 保持分支最新，必要时 rebase 而非 merge
- 提交前先跑一遍单元测试

## 7. 代码审查要点

### 7.1 审查清单

#### 7.1.1 功能性

- [ ] 代码实现了需求规格中描述的功能
- [ ] 所有分支路径都被正确处理
- [ ] 错误处理逻辑完善
- [ ] 没有引入安全问题（SQL 注入、XSS 等）

#### 7.1.2 可读性

- [ ] 命名清晰，能表达意图
- [ ] 方法长度适中（建议不超过 100 行）
- [ ] 注释清晰，解释「为什么」而不是「是什么」
- [ ] 代码结构清晰，分层合理

#### 7.1.3 可维护性

- [ ] 没有重复代码（DRY 原则）
- [ ] 遵循 SOLID 原则
- [ ] 依赖关系清晰
- [ ] 易于扩展和修改

#### 7.1.4 性能

- [ ] 没有明显的性能问题
- [ ] 数据库查询已优化
- [ ] 资源使用后正确释放

### 7.2 常见审查意见

```
[must-fix] 请处理空指针情况
[must-fix] 请添加参数校验
[suggest] 建议提取为私有方法
[suggest] 可以使用 Lombok 简化代码
[nit] 格式：逗号后缺少空格
[question] 这里的设计意图是？
```

### 7.3 审查标记说明

| 标记 | 含义 |
|------|------|
| `[must-fix]` | 必须修改，否则无法合并 |
| `[suggest]` | 建议修改，提升代码质量 |
| `[nit]` | 小问题（格式、拼写等） |
| `[question]` | 需要作者澄清 |

## 8. 常见错误示例

### 8.1 空指针异常

```java
// ❌ 错误 - 可能 NPE
public void update(AccountsDO account) {
    accountsMapper.update(account);
    log.info("Updated account: " + account.getName().toLowerCase());
}

// ✅ 正确
public void update(AccountsDO account) {
    RequireUtil.requireNotNull(account, "账户信息不能为空");
    accountsMapper.update(account);
    log.info("Updated account: {}", account.getName());
}
```

### 8.2 资源泄漏

```java
// ❌ 错误 - 流未关闭
public String readFile(String path) {
    FileInputStream fis = new FileInputStream(path);
    return new String(fis.readAllBytes());
}

// ✅ 正确 - 使用 try-with-resources
public String readFile(String path) {
    try (FileInputStream fis = new FileInputStream(path)) {
        return new String(fis.readAllBytes());
    }
}
```

### 8.3 硬编码

```java
// ❌ 错误 - 魔法数字
if (level > 100) {
    player.setExp(0);
}

// ✅ 正确 - 使用常量
if (level > GameConstants.MAX_LEVEL) {
    player.setExp(0);
}
```

### 8.4 日志不当

```java
// ❌ 错误 - 字符串拼接
log.info("User " + userId + " logged in at " + System.currentTimeMillis());

// ✅ 正确 - 使用占位符
log.info("User {} logged in at {}", userId, System.currentTimeMillis());
```

### 8.5 SQL 注入风险

```java
// ❌ 错误 - 字符串拼接 SQL
String sql = "SELECT * FROM accounts WHERE name = '" + name + "'";

// ✅ 正确 - 使用参数化查询
public AccountsDO findByName(String name) {
    return accountsMapper.selectOneByName(name);  // MyBatis-Flex 会自动处理参数化
}
```

### 8.6 线程安全问题

```java
// ❌ 错误 - 多线程不安全
public class CharacterManager {
    private Map<String, Character> characters = new HashMap<>();  // 非线程安全
}

// ✅ 正确 - 使用线程安全集合
public class CharacterManager {
    private Map<String, Character> characters = new ConcurrentHashMap<>();
}
```

## 9. 最佳实践建议

### 9.1 设计原则

#### 单一职责原则（SRP）

每个类和方法只负责一件事。

```java
// ✅ 正确 - 职责分离
public class CharacterService {
    public void updateLevel(Character character, int newLevel) { }
    public void updateExp(Character character, long exp) { }
    public void updateSkills(Character character, List<Skill> skills) { }
}

// ❌ 错误 - 职责过多
public class CharacterService {
    public void updateLevelExpSkillsItemsQuestsMissions(...) { }  // 职责过重
}
```

#### 开闭原则（OCP）

对扩展开放，对修改关闭。

```java
// ✅ 正确 - 使用接口/抽象类
public interface ItemEffect {
    void apply(Character character);
    void remove(Character character);
}

public class HealthPotionEffect implements ItemEffect { }
public class ManaPotionEffect implements ItemEffect { }
```

#### 依赖注入（DI）

使用构造函数注入依赖，便于测试和替换实现。

```java
// ✅ 正确 - 构造函数注入
@Service
@AllArgsConstructor
public class AccountService {
    private final AccountsMapper accountsMapper;
    private final CharactersMapper charactersMapper;
}

// ❌ 错误 - 使用 @Autowired 字段注入
@Autowired
private AccountsMapper accountsMapper;
```

### 9.2 数据库实践

#### 9.2.1 事务管理

```java
// ✅ 正确 - 使用 @Transactional
@Service
@AllArgsConstructor
public class TradeService {
    private final ItemMapper itemMapper;
    private final CharacterMapper characterMapper;

    @Transactional
    public void executeTrade(Character from, Character to, Item item) {
        itemMapper.updateOwner(item.getId(), to.getId());
        characterMapper.updateMesos(from.getId(), from.getMesos() - item.getPrice());
        characterMapper.updateMesos(to.getId(), to.getMesos() + item.getPrice());
    }
}
```

#### 9.2.2 查询优化

```java
// ✅ 正确 - 分页查询
public Page<AccountsDO> getAccountList(Integer page, Integer size) {
    if (page == null) page = 1;
    if (size == null) size = Integer.MAX_VALUE;
    return accountsMapper.paginateWithRelations(page, size, queryWrapper);
}

// ❌ 错误 - 查询全部再内存分页
public List<AccountsDO> getAccountList() {
    return accountsMapper.selectAll();  // 数据量大时性能问题
}
```

### 9.3 并发实践

```java
// ✅ 正确 - 使用 ConcurrentHashMap
private final Map<Integer, Character> characters = new ConcurrentHashMap<>();

// ✅ 正确 - 使用 AtomicInteger
private final AtomicInteger onlineCount = new AtomicInteger(0);

// ✅ 正确 - 使用锁
private final Lock playerLock = new ReentrantLock();
public void performAction(int playerId) {
    playerLock.lock();
    try {
        // 操作
    } finally {
        playerLock.unlock();
    }
}
```

### 9.4 日志实践

```java
// ✅ 正确 - 使用合适的日志级别
log.trace("Entering method: {}", methodName);
log.debug("Processing character: {}", characterId);
log.info("User {} logged in from IP {}", username, ipAddress);
log.warn("Rate limit exceeded for user: {}", userId);
log.error("Failed to process packet: {}", e.getMessage(), e);

// ❌ 错误 - 敏感信息日志
log.info("User password: {}", password);
```

### 9.5 API 设计实践

```java
// ✅ 正确 - 统一响应格式
public class ResultBody<T> {
    private int code;
    private String message;
    private T data;

    public static <T> ResultBody<T> success(T data) {
        return new ResultBody<>(0, "success", data);
    }
}

// ✅ 正确 - 使用 @Valid 进行参数校验
@PostMapping
public ResultBody<Void> createCharacter(@Valid @RequestBody CreateCharacterDTO dto) {
    characterService.createCharacter(dto);
    return ResultBody.success();
}

// ✅ 正确 - Swagger 注解
@Operation(summary = "创建新角色", description = "创建一个新的游戏角色")
@ApiResponse(responseCode = "200", description = "创建成功")
```

## 10. 附录

### 10.1 工具配置

#### Maven

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <java.version>21</java.version>
</properties>
```

#### IDEA 格式化配置

- 缩进：4 空格
- 行长度：120
- 格式化文件：`google-java-format` 或 `spotless`

### 10.2 参考资料

- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Alibaba Java Coding Guidelines](https://github.com/alibaba/p3c)
- [Spring Boot Best Practices](https://spring.io/projects/spring-boot)

### 10.3 规范更新

本文档由 team-lead 维护，如有变更请通过 PR 提交讨论。
