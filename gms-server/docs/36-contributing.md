# 贡献指南

本文档为 BeiDou-Server（MapleStory 游戏服务器模拟器）项目提供贡献指南，帮助开发者了解如何参与项目开发。

## 1. 贡献概述

### 1.1 项目简介

BeiDou-Server 是一个 MapleStory（冒险岛）游戏服务器模拟器，采用 Java 21 + Spring Boot 3.2.3 技术栈构建，支持完整的游戏逻辑、网络通信、数据库存储等功能。

### 1.2 技术栈

| 类别 | 技术 |
|------|------|
| 语言 | Java 21 |
| 框架 | Spring Boot 3.2.3 |
| 构建工具 | Maven |
| 数据库 | MySQL + MyBatis-Flex |
| 网络 | Netty |
| 日志 | Slf4j + Log4j2 |

### 1.3 贡献类型

欢迎各种形式的贡献：

- **代码贡献**：新功能开发、Bug 修复、性能优化
- **文档贡献**：完善现有文档、修复错误、添加示例
- **测试贡献**：编写单元测试、集成测试
- **问题反馈**：报告 Bug、提出功能建议

## 2. 环境准备

### 2.1 开发环境要求

- **JDK**：21 或更高版本
- **Maven**：3.8+ 
- **MySQL**：8.0+ 
- **IDE**：IntelliJ IDEA（推荐）

### 2.2 环境搭建步骤

1. **克隆代码仓库**

```bash
git clone <repository-url>
cd gms-server
```

2. **配置数据库**

创建 MySQL 数据库并导入初始化脚本：

```sql
CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4;
```

3. **配置项目**

复制 `application.yml.example` 为 `application.yml`（如不存在），配置数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/beidou
    username: root
    password: your_password
```

4. **启动项目**

```bash
# 使用 Maven 启动
mvn spring-boot:run

# 或运行主类
```

详细环境配置请参考 [环境搭建指南](./04-environment-setup.md)。

## 3. 开发流程

### 3.1 新功能开发

```
需求分析 → 设计方案 → 编码实现 → 单元测试 → 代码审查 → 提交代码 → 集成测试
```

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

### 3.2 Bug 修复流程

```
问题定位 → 复现问题 → 分析原因 → 编写修复 → 测试验证 → 提交代码 → 更新文档
```

## 4. 代码规范

### 4.1 命名规范

#### 类命名

- 使用 PascalCase 格式
- Controller 以 `Controller` 结尾
- Service 以 `Service` 结尾
- Mapper 以 `Mapper` 结尾
- Entity/DO 以 `DO` 结尾

```java
public class CharacterController { }
public class AccountService { }
public class CharactersMapper { }
public class AccountsDO { }
```

#### 方法命名

- 使用 camelCase 格式
- 查询方法：`findByXxx`、`getByXxx`
- 新增方法：`addXxx`、`createXxx`
- 更新方法：`updateXxx`
- 删除方法：`deleteXxx`

```java
public AccountsDO findByName(String name) { }
public void addAccount(AddAccountDTO submitData) { }
```

#### 常量命名

- 全大写 + 下划线分隔

```java
public static final int MAX_LEVEL = 200;
public static final String WORLD_NAME = "冒险岛";
```

### 4.2 代码格式

- 使用 **4 空格** 缩进（禁止 Tab）
- 单行不超过 **120 个字符**
- 左大括号不换行

```java
public void updateRate(ExtendValueDO data) {
    if (data == null) {
        throw new BizException(BizExceptionEnum.PARAM_IS_NULL);
    }
}
```

### 4.3 注释规范

- 类注释：使用 Javadoc 格式，说明类的职责
- 方法注释：说明方法功能、参数、返回值
- 重要逻辑：添加行内注释解释「为什么」

```java
/**
 * 角色服务类
 * 提供角色的创建、加载、保存等功能
 *
 * @author BeiDou Team
 */
public class CharacterService {
    /**
     * 为角色添加经验值
     *
     * @param exp 要添加的经验值
     * @return 实际获得的经验值
     */
    public int gainExp(int exp) {
        // 防止溢出
        if (exp > Integer.MAX_VALUE - this.exp) {
            exp = Integer.MAX_VALUE;
        }
    }
}
```

详细代码规范请参考 [编码规范](./18-coding-standards.md)。

## 5. Git 工作流

### 5.1 分支管理

```
main (稳定版本)
    ↑
    │
develop (开发分支)
    ↑
    │
feature/xxx (功能分支)
fix/xxx (修复分支)
docs/xxx (文档分支)
```

- `main`：稳定版本，只接受合并请求
- `develop`：开发主分支
- `feature/`：新功能开发分支
- `fix/`：Bug 修复分支
- `docs/`：文档更新分支

### 5.2 分支操作

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 切换回主分支
git checkout develop

# 删除已合并的分支
git branch -d feature/new-feature
```

### 5.3 保持分支同步

```bash
# 拉取最新代码
git fetch origin

# 变基到最新develop
git rebase origin/develop

# 如果有冲突，解决冲突后
git add .
git rebase --continue
```

## 6. 提交规范

### 6.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 6.2 Type 类型

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

### 6.3 示例

```bash
# 正确示例
git commit -m "feat(character): 添加角色经验倍率功能"
git commit -m "fix(service): 修复账户查询空指针异常"
git commit -m "docs: 更新 API 文档"

# 错误示例
git commit -m "更新代码"
git commit -m "fix bug"
```

### 6.4 提交频率

- 每个功能点完成后及时提交
- 不要一次性提交大量不相关的修改
- 保持提交的原子性（一个提交一个功能点）

## 7. PR 创建指南

### 7.1 PR 标题

```
[feat/fix/docs/refactor]: 简短描述
```

示例：
- `feat: 添加角色交易系统`
- `fix: 修复登录会话过期问题`
- `docs: 更新 API 接口文档`

### 7.2 PR 描述模板

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

### 7.3 注意事项

- PR 越小越好，优先拆分大型 PR
- 保持分支最新，必要时 rebase 而非 merge
- 提交前先跑一遍单元测试
- 确保代码符合项目规范

## 8. 代码审查

### 8.1 审查清单

#### 功能性
- [ ] 代码实现了需求规格中描述的功能
- [ ] 所有分支路径都被正确处理
- [ ] 错误处理逻辑完善
- [ ] 没有引入安全问题（SQL 注入、XSS 等）

#### 可读性
- [ ] 命名清晰，能表达意图
- [ ] 方法长度适中（建议不超过 100 行）
- [ ] 注释清晰，解释「为什么」而不是「是什么」
- [ ] 代码结构清晰，分层合理

#### 可维护性
- [ ] 没有重复代码（DRY 原则）
- [ ] 遵循 SOLID 原则
- [ ] 依赖关系清晰
- [ ] 易于扩展和修改

#### 性能
- [ ] 没有明显的性能问题
- [ ] 数据库查询已优化
- [ ] 资源使用后正确释放

### 8.2 审查标记说明

| 标记 | 含义 |
|------|------|
| `[must-fix]` | 必须修改，否则无法合并 |
| `[suggest]` | 建议修改，提升代码质量 |
| `[nit]` | 小问题（格式、拼写等） |
| `[question]` | 需要作者澄清 |

### 8.3 审查意见示例

```
[must-fix] 请处理空指针情况
[must-fix] 请添加参数校验
[suggest] 建议提取为私有方法
[nit] 格式：逗号后缺少空格
[question] 这里的设计意图是？
```

详细代码审查要点请参考 [编码规范 - 第7节](./18-coding-standards.md#_7-代码审查要点)。

## 9. 社区规范

### 9.1 行为准则

- 尊重所有社区成员
- 使用友好、包容的语言
- 对不同的观点保持开放态度
- 建设性地处理分歧

### 9.2 提问指南

在寻求帮助时，请：

1. 先阅读项目文档
2. 搜索是否已有类似问题
3. 使用清晰、具体的问题标题
4. 提供详细的环境信息
5. 附上相关代码和错误日志

### 9.3 反馈建议

- 通过 GitHub Issues 提交功能建议
- 描述清楚使用场景和预期效果
- 欢迎提交设计改进方案

### 9.4 许可证

本项目采用 AGPL-3.0 开源许可证，贡献代码即表示同意在该许可证下发布。

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
