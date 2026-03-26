# 项目结构

## 1. 目录结构详解

### 1.1 项目根目录

```
gms-server/
├── src/                          # 源代码目录
├── scripts-zh-CN/               # 中文脚本（970个文件）
├── scripts/                     # 英文脚本（929个文件）
├── wz-zh-CN/                    # 中文 WZ 数据（50个XML文件）
├── wz/                          # 英文 WZ 数据（23046个XML文件）
├── handbook/                    # 游戏手册（25个txt文件）
├── docs/                        # 项目文档
├── logs/                        # 日志文件
├── target/                      # 编译输出目录
├── pom.xml                      # Maven 项目配置文件
├── launch.bat                   # Windows 启动脚本
├── launch.sh                    # Linux 启动脚本
└── README.md                    # 项目说明文档
```

### 1.2 源代码结构

```
src/
├── main/
│   ├── java/
│   │   └── org/gms/
│   │       ├── ServerApplication.java  # 主启动类
│   │       ├── aop/                    # 切面编程
│   │       ├── client/                 # 客户端相关（241个文件）
│   │       ├── config/                 # 配置类
│   │       ├── constants/             # 常量定义（74个文件）
│   │       ├── controller/             # Web 控制器（14个文件）
│   │       ├── dao/                    # 数据访问层（166个文件）
│   │       ├── exception/              # 异常处理
│   │       ├── manager/                # 管理器
│   │       ├── model/                  # 数据模型（44个文件）
│   │       ├── net/                    # 网络通信（296个文件）
│   │       ├── provider/               # 提供者（15个文件）
│   │       ├── property/               # 属性配置
│   │       ├── scripting/              # 脚本系统（21个文件）
│   │       ├── server/                 # 服务器核心（168个文件）
│   │       ├── service/                # 业务服务（30个文件）
│   │       └── util/                   # 工具类（23个文件）
│   └── resources/
│       ├── application.yml             # 主配置文件
│       ├── i18n/                       # 国际化资源（6个properties文件）
│       └── db/migration/               # 数据库迁移脚本（93个sql文件）
└── test/                               # 测试代码
```

## 2. 核心模块详解

### 2.1 client 包（客户端相关）

#### 目录结构
```
client/
├── autoban/                    # 自动封禁系统
├── command/                    # GM 命令（177个命令）
│   ├── BanCommand.java
│   ├── UnbanCommand.java
│   ├── WarpCommand.java
│   └── ...
├── creator/                    # 角色创建器（12个文件）
├── inventory/                  # 背包系统（13个文件）
│   ├── Equip.java
│   ├── Item.java
│   ├── Inventory.java
│   └── ...
├── keybind/                    # 快捷键绑定
├── processor/                  # 处理器
├── status/                     # 状态效果
├── AbstractCharacterListener.java    # 角色监听器抽象类
├── AbstractCharacterObject.java      # 角色对象抽象类
├── BuddyList.java               # 好友列表
├── BuddylistEntry.java
├── Character.java               # 角色类（核心）
├── CharacterListener.java
├── CharacterNameAndId.java
├── Client.java                 # 客户端会话（核心）
├── DefaultDates.java
├── Disease.java                # 异常状态
├── DiseaseValueHolder.java
├── Family.java                 # 家族系统
├── FamilyEntry.java
├── FamilyEntitlement.java
├── Job.java                    # 职业系统
├── MonsterBook.java            # 怪物图鉴
├── Mount.java                  # 坐骑
├── QuestStatus.java            # 任务状态
├── Ring.java                   # 结婚戒指
├── Skill.java                  # 技能
├── SkillFactory.java           # 技能工厂
├── SkillMacro.java             # 技能宏
├── SkinColor.java              # 皮肤颜色
└── Stat.java                   # 属性系统
```

#### 核心类说明

| 类名 | 功能 | 说明 |
|------|------|------|
| Client | 客户端会话管理 | 处理玩家连接、登录、封包收发 |
| Character | 角色数据 | 玩家角色的所有数据和状态 |
| SkillFactory | 技能工厂 | 加载和管理游戏技能 |
| Inventory | 背包系统 | 管理玩家背包和物品 |
| BuddyList | 好友列表 | 管理好友关系 |
| Family | 家族系统 | 家族成员和功能 |

### 2.2 server 包（服务器核心）

#### 目录结构
```
server/
├── events/                    # 事件系统（9个文件）
├── expeditions/                # 远征系统
├── gachapon/                   # 转蛋系统（15个文件）
├── life/                       # 生物系统（25个文件）
├── loot/                       # 掉落系统
├── maps/                       # 地图系统（38个文件）
│   ├── MapleMap.java          # 地图类
│   ├── MapFactory.java        # 地图工厂
│   └── ...
├── minigame/                   # 小游戏
├── movement/                   # 移动系统（9个文件）
├── partyquest/                 # 组队任务
├── quest/                      # 任务系统（37个文件）
│   ├── Quest.java             # 任务类
│   ├── QuestFactory.java      # 任务工厂
│   └── ...
├── CashShop.java               # 现金商城
├── ChatLogger.java             # 聊天日志
├── CommonInformation.java     # 公共信息
├── DueyPackage.java            # 杜伊快递
├── ExpLogger.java              # 经验日志
├── ItemInformationProvider.java # 物品信息提供者
├── MakerItemFactory.java       # 制造系统
├── MapleLeafLogger.java        # 枫叶日志
├── Marriage.java               # 结婚系统
├── MTSItemInfo.java            # 拍卖行物品
├── Shop.java                   # 商店
├── ShopFactory.java            # 商店工厂
├── ShopItem.java               # 商店物品
├── SkillbookInformationProvider.java # 技能书提供者
├── StatEffect.java             # 状态效果
├── Storage.java                # 仓库
├── StorageInventory.java       # 仓库背包
├── SystemRescue.java           # 系统救援
├── ThreadManager.java          # 线程管理器
├── TimerManager.java           # 定时管理器
├── TimerManagerMBean.java
└── Trade.java                  # 交易系统
```

#### 核心类说明

| 类名 | 功能 | 说明 |
|------|------|------|
| MapleMap | 地图类 | 地图的所有属性和逻辑 |
| Quest | 任务类 | 任务的所有逻辑 |
| Shop | 商店类 | 商店和购买逻辑 |
| Storage | 仓库 | 玩家仓库系统 |
| CashShop | 现金商城 | 现金商品购买 |
| TimerManager | 定时器 | 游戏定时任务管理 |
| ThreadManager | 线程管理 | 异步任务管理 |

### 2.3 net 包（网络通信）

#### 目录结构
```
net/
├── encryption/                 # 加密解密（11个文件）
├── netty/                      # Netty 实现
├── opcodes/                    # 操作码定义
├── packet/                     # 封包处理（12个文件）
├── server/                     # 服务器端（259个文件）
│   ├── channel/               # 频道服务器（151个文件）
│   │   ├── Channel.java      # 频道类
│   │   └── handlers/         # 频道处理器
│   ├── coordinator/           # 协调器（25个文件）
│   │   ├── login/            # 登录协调器
│   │   └── session/          # 会话协调器
│   ├── guild/                 # 公会相关
│   ├── handlers/              # 通用处理器（23个文件）
│   ├── services/              # 网络服务（15个文件）
│   ├── task/                  # 网络任务（27个文件）
│   ├── world/                 # 世界相关
│   ├── PlayerBuffStorage.java # 玩家状态存储
│   ├── PlayerStorage.java     # 玩家存储
│   └── Server.java            # 服务器类（核心）
├── AbstractPacketHandler.java
├── ChannelDependencies.java   # 频道依赖
├── PacketHandler.java         # 封包处理器
└── PacketProcessor.java       # 封包处理器（核心）
```

#### 核心类说明

| 类名 | 功能 | 说明 |
|------|------|------|
| Server | 服务器类 | 游戏服务器核心，管理所有世界、频道 |
| Channel | 频道类 | 单个游戏频道实例 |
| PacketProcessor | 封包处理器 | 分发封包到对应的 Handler |
| PlayerStorage | 玩家存储 | 管理频道内的所有玩家 |

### 2.4 dao 包（数据访问）

#### 目录结构
```
dao/
├── entity/                     # 数据库实体（83个文件）
│   ├── AccountsDO.java       # 账号实体
│   ├── CharactersDO.java     # 角色实体
│   ├── InventoryDO.java      # 背包实体
│   └── ...
└── mapper/                     # MyBatis Mapper（83个文件）
    ├── AccountsMapper.java   # 账号Mapper
    ├── CharactersMapper.java # 角色Mapper
    └── ...
```

#### 数据库实体说明

| 实体类 | 对应表 | 说明 |
|--------|--------|------|
| AccountsDO | accounts | 账号表 |
| CharactersDO | characters | 角色表 |
| InventoryDO | inventory | 背包表 |
| BuddylistDO | buddylist | 好友列表 |
| PartyDO | parties | 组队表 |
| GuildsDO | guilds | 公会表 |

### 2.5 service 包（业务服务）

```
service/
├── AccountService.java        # 账号服务
├── AuthService.java            # 认证服务
├── CashShopService.java        # 现金商城服务
├── CharacterService.java       # 角色服务
├── CommandService.java         # 命令服务
├── CommonService.java          # 公共服务
├── ConfigService.java          # 配置服务
├── DropService.java            # 掉落服务
├── FamilyService.java          # 家族服务
├── FileTreeService.java        # 文件树服务
├── GachaponService.java        # 转蛋服务
├── GiveService.java            # 给予服务
├── HpMpAlertService.java       # HP/MP 告警服务
├── InventoryService.java       # 背包服务
├── ItemService.java            # 物品服务
├── LangResourceService.java    # 语言资源服务
├── MonsterBookService.java     # 怪物图鉴服务
├── MtsService.java             # 拍卖行服务
├── NameChangeService.java      # 改名服务
├── NewYearCardService.java     # 贺年卡服务
├── NoteService.java            # 信件服务
├── NxCodeService.java          # NX码服务
├── NxCouponService.java        # NX优惠券服务
├── QuestService.java           # 任务服务
├── ServerService.java          # 服务器服务
├── ShopService.java            # 商店服务
├── UserDetailsImpl.java
├── UserDetailsServiceImpl.java
├── WorldTransferService.java   # 世界转移服务
└── package-info.java
```

### 2.6 controller 包（Web 控制器）

```
controller/
├── AccountController.java      # 账号控制器
├── AuthController.java         # 认证控制器
├── CashShopController.java     # 现金商城控制器
├── CharacterController.java    # 角色控制器
├── CommandController.java      # 命令控制器
├── CommonController.java       # 公共控制器
├── ConfigController.java       # 配置控制器
├── DropController.java         # 掉落控制器
├── FileController.java         # 文件控制器
├── GachaponController.java     # 转蛋控制器
├── GiveController.java         # 给予控制器
├── InventoryController.java    # 背包控制器
├── ServerController.java      # 服务器控制器
└── ShopController.java        # 商店控制器
```

### 2.7 scripting 包（脚本系统）

```
scripting/
├── event/                      # 事件脚本
├── item/                       # 物品脚本
├── map/                        # 地图脚本
├── npc/                        # NPC脚本
├── portal/                     # 传送门脚本
├── quest/                      # 任务脚本
├── reactor/                    # 反应堆脚本
├── AbstractPlayerInteraction.java   # 玩家交互抽象类
├── AbstractScriptManager.java       # 脚本管理器抽象类
└── SynchronizedInvocable.java       # 同步调用接口
```

### 2.8 constants 包（常量定义）

```
constants/
├── game/                       # 游戏常量
│   ├── GameConstants.java    # 游戏通用常量
│   └── ...
├── inventory/                  # 物品常量
├── net/                        # 网络常量
└── ...
```

## 3. 资源文件结构

### 3.1 配置文件

```
resources/
├── application.yml             # 主配置文件
├── i18n/                       # 国际化资源
│   ├── exception_en_US.properties  # 英文异常消息
│   ├── exception_zh_CN.properties  # 中文异常消息
│   ├── log_en_US.properties        # 英文日志消息
│   ├── log_zh_CN.properties        # 中文日志消息
│   ├── message_en_US.properties   # 英文游戏消息
│   └── message_zh_CN.properties   # 中文游戏消息
└── db/migration/               # 数据库迁移脚本
    ├── V1.0.0__create_accounts.sql
    ├── V1.0.1__create_alliance.sql
    ├── V1.0.6__create_characters.sql
    └── ... (93个迁移脚本)
```

### 3.2 脚本文件

#### scripts 目录结构
```
scripts/
├── event/                      # 事件脚本
│   ├── PQ_Jail.js
│   └── ...
├── item/                       # 物品脚本
├── map/                        # 地图脚本
│   ├── 0.js
│   ├── 10000.js
│   └── ...
├── npc/                        # NPC脚本
│   ├── 0.js
│   ├── 100.js
│   └── ...
├── portal/                     # 传送门脚本
├── quest/                      # 任务脚本
└── reactor/                    # 反应堆脚本
```

### 3.3 WZ 数据文件

```
wz/
├── Base.wz                     # 基础数据
├── Character.wz                # 角色数据
├── Etc.wz                      # 杂项数据
├── Item.wz                     # 物品数据
├── Map.wz                      # 地图数据
├── Mob.wz                      # 怪物数据
├── Morph.wz                    # 变身数据
├── Npc.wz                      # NPC数据
├── Quest.wz                    # 任务数据
├── Skill.wz                    # 技能数据
├── Sound.wz                    # 音效数据
├── String.wz                   # 字符串数据
└── UI.wz                       # UI数据
```

## 4. 配置文件说明

### 4.1 pom.xml（Maven 配置）

主要配置：
- 项目信息
- 依赖管理
- 编译配置
- 插件配置

### 4.2 application.yml（应用配置）

主要配置：
- 服务器端口
- 数据库连接
- JWT 配置
- Flyway 配置
- 游戏服务配置
- 国际化配置

## 5. 构建输出结构

```
target/
├── classes/                    # 编译后的 class 文件
├── generated-sources/          # 生成的源代码
├── generated-test-sources/     # 生成的测试源代码
├── test-classes/               # 编译后的测试 class
├── maven-archiver/             # Maven 打包文件
├── maven-status/               # Maven 状态
└── BeiDou.jar                  # 最终打包的 jar 文件
```

## 6. 代码组织原则

### 6.1 分层原则

```
Controller → Service → Mapper → Database
```

- Controller: 处理 HTTP 请求，参数验证
- Service: 业务逻辑处理
- Mapper: 数据库访问
- Database: 数据持久化

### 6.2 模块化原则

- 按功能模块划分包
- 每个模块职责单一
- 模块间低耦合

### 6.3 命名规范

- 类名: 大驼峰（PascalCase）
- 方法名: 小驼峰（camelCase）
- 常量: 全大写下划线分隔（UPPER_SNAKE_CASE）
- 包名: 全小写点分隔

## 7. 重要文件说明

### 7.1 启动相关

| 文件 | 说明 |
|------|------|
| ServerApplication.java | Spring Boot 主启动类 |
| launch.bat | Windows 启动脚本 |
| launch.sh | Linux 启动脚本 |

### 7.2 配置相关

| 文件 | 说明 |
|------|------|
| pom.xml | Maven 项目配置 |
| application.yml | 应用主配置 |
| GameConfig.java | 游戏配置类 |

### 7.3 核心类

| 类名 | 说明 |
|------|------|
| Server.java | 游戏服务器核心 |
| Client.java | 客户端会话 |
| Character.java | 角色类 |
| MapleMap.java | 地图类 |

---

*文档版本: 1.0*
*最后更新: 2026-03-25*
