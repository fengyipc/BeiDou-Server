# 术语表

## 1. 概述

本术语表旨在为 BeiDou-Server（北斗服务端）项目的开发者、维护者和玩家提供统一的专业术语参考。文档涵盖 MapleStory 游戏术语、技术架构术语、缩略语解释以及常见名词定义，帮助相关人员快速理解项目中的各类概念。

### 1.1 术语表结构

- **游戏术语**：与 MapleStory 游戏内容相关的专业术语
- **技术术语**：系统架构、网络通信、数据库等技术领域的术语
- **缩略语解释**：项目中使用的英文缩写及其完整含义
- **常见名词定义**：项目中反复出现的核心概念解释

---

## 2. 游戏术语

### 2.1 角色系统

| 术语 | 英文 | 说明 |
|------|------|------|
| 角色 | Character | 玩家在游戏中创建的游戏化身，包含属性、技能、背包等数据 |
| 职业 | Job | 角色的职业类型，如战士、法师、弓手、飞侠等 |
| 转职 | Job Advancement | 角色达到一定等级后进行的职业进阶 |
| 新手 | Beginner | 初始职业，所有玩家创建角色时的起点 |
| 属性点 | AP (Ability Point) | 可自由分配的点数，用于提升 STR/DEX/INT/LUK |
| 技能点 | SP (Skill Point) | 用于学习职业技能的点数 |
| 基础属性 | Base Stats | 角色的基础四围属性 |
| STR | Strength | 力量，影响物理攻击力和某些装备需求 |
| DEX | Dexterity | 敏捷，影响物理命中率、闪避率和某些装备需求 |
| INT | Intelligence | 智力，影响魔法攻击力和某些装备需求 |
| LUK | Luck | 幸运，影响暴击率、命中率和某些装备需求 |
| HP | Hit Point | 生命值，生命归零时角色死亡 |
| MP | Mana Point | 魔法值，使用技能时消耗 |

### 2.2 技能系统

| 术语 | 英文 | 说明 |
|------|------|------|
| 技能 | Skill | 角色学会的特殊能力，分为主动技能和被动技能 |
| BUFF | Bufferable Uninterrupted Function | 增益状态效果，如攻击力提升、防御增强等 |
| DEBUFF | Debuff | 减益状态效果，如中毒、眩晕等 |
| 冷却时间 | Cooldown | 技能使用后到再次可用的时间间隔 |
| 施放 | Cast | 使用技能的动作过程 |
| 效果 | Effect | 技能产生的具体影响，如伤害、治疗、状态变化 |
| 元素属性 | Element | 技能附带的元素类型，如火、冰、雷等 |
| 攻击速度 | Attack Speed | 角色普通攻击的频率 |

### 2.3 物品系统

| 术语 | 英文 | 说明 |
|------|------|------|
| 装备 | Equip | 可穿戴的物品，提供属性加成 |
| 武器 | Weapon | 攻击用装备，影响角色的攻击力 |
| 防具 | Armor | 防御用装备，如头盔、衣服、手套等 |
| 饰品 | Accessory | 装饰性装备，如戒指、项链、耳环等 |
| 消耗品 | Consumable | 使用后消失的物品，如药水、食物 |
| 堆叠物品 | Stackable Item | 可以叠加存放的物品，有数量限制 |
| 背包 | Inventory | 存放物品的容器，分多种类型 |
| 现金物品 | Cash Item | 用现金购买的特殊物品 |
| 交易 | Trade | 玩家之间交换物品的行为 |
| 商店 | Shop | 买卖物品的NPC或系统 |

### 2.4 地图与场景

| 术语 | 英文 | 说明 |
|------|------|------|
| 地图 | Map | 游戏中的场景区域，玩家在其中移动和战斗 |
| 地图ID | Map ID | 地图的唯一标识符 |
| 传送门 | Portal | 连接不同地图的入口/出口 |
| 复活点 | Spawn Point | 角色死亡后复活的地点 |
| 城镇 | Town | 安全的休息区域，不可进行PVP |
| 地下城 | Dungeon | 多人副本区域，有挑战难度 |
| 承载点 | Foothold | 地图上可站立的地形点 |
| 视野范围 | View Range | 玩家可见的地图区域范围 |

### 2.5 怪物与战斗

| 术语 | 英文 | 说明 |
|------|------|------|
| 怪物 | Monster | 游戏中的敌对生物，击杀可获得经验值和物品 |
| 怪物ID | Mob/Monster ID | 怪物的唯一标识符 |
| 刷新点 | Spawn Point | 怪物出生的位置 |
| 刷新时间 | Spawn Time | 怪物复活出现的间隔时间 |
| 仇恨 | Threat/Aggro | 怪物对玩家的关注程度，影响攻击目标 |
| 掉落 | Drop | 怪物死亡后掉落的物品 |
| 掉落率 | Drop Rate | 物品掉落的概率 |
| 经验值 | EXP (Experience) | 击杀怪物或完成任务获得的经验 |
| 经验倍率 | EXP Rate | 经验值的倍率配置 |

### 2.6 社交系统

| 术语 | 英文 | 说明 |
|------|------|------|
| 好友列表 | Buddy List | 玩家添加的好友名单 |
| 队伍/组队 | Party | 多人协作的战斗小组 |
| 公会 | Guild | 玩家组织的社会团体 |
| 家族 | Family | 师徒关系的组织系统 |
| 联盟 | Alliance | 多个公会组成的联合组织 |
| 结婚 | Marriage | 玩家之间的婚姻系统 |

### 2.7 任务系统

| 术语 | 英文 | 说明 |
|------|------|------|
| 任务 | Quest | 玩家完成的特定目标以获得奖励 |
| 主线任务 | Main Quest | 推进游戏剧情的核心任务 |
| 支线任务 | Side Quest | 可选完成的任务线 |
| 任务进度 | Quest Progress | 任务完成的当前状态 |
| 任务奖励 | Quest Reward | 完成任务的回报 |

---

## 3. 技术术语

### 3.1 架构与框架

| 术语 | 英文 | 说明 |
|------|------|------|
| 分层架构 | Layered Architecture | 按职责将系统分为多层的设计模式 |
| MVC | Model-View-Controller | 模型-视图-控制器设计模式 |
| Spring Boot | Spring Boot | 基于Spring框架的快速应用开发框架 |
| Netty | Netty | 高性能异步事件驱动的网络框架 |
| ORM | Object-Relational Mapping | 对象关系映射技术 |
| MyBatis-Flex | MyBatis-Flex | 灵活的Java ORM框架 |
| 数据访问层 | DAO (Data Access Object) | 专门处理数据库操作的层次 |
| 服务层 | Service Layer | 包含业务逻辑的层次 |
| 控制层 | Controller Layer | 处理请求和响应的层次 |

### 3.2 网络通信

| 术语 | 英文 | 说明 |
|------|------|------|
| 封包 | Packet | 网络传输的数据单元 |
| Opcode | Operation Code | 标识封包类型的操作码 |
| 头部 | Header | 封包的开头部分，包含元数据 |
| 数据体 | Payload | 封包中包含的实际数据 |
| 加密 | Encryption | 对传输数据进行加密处理 |
| 解密 | Decryption | 对接收数据进行解密处理 |
| 编码器 | Encoder | 将数据转换为网络格式的组件 |
| 解码器 | Decoder | 将网络格式转换为数据的组件 |
| 处理器 | Handler | 处理特定类型封包逻辑的组件 |
| 会话 | Session | 客户端与服务端的持续连接状态 |
| 心跳 | Heartbeat | 维持连接活跃的定期信号 |

### 3.3 数据库

| 术语 | 英文 | 说明 |
|------|------|------|
| 数据库 | Database | 持久化存储数据的系统 |
| 数据表 | Table | 数据库中具有相同结构的数据集合 |
| 主键 | Primary Key | 唯一标识表中每行数据的字段 |
| 外键 | Foreign Key | 关联其他表主键的字段 |
| 索引 | Index | 加速数据查询的数据结构 |
| 事务 | Transaction | 一组原子性的数据库操作 |
| 连接池 | Connection Pool | 复用数据库连接的组件 |
| 迁移 | Migration | 数据库结构变更的管理 |

### 3.4 并发与线程

| 术语 | 英文 | 说明 |
|------|------|------|
| 虚拟线程 | Virtual Thread | Java 21轻量级线程 |
| 线程池 | Thread Pool | 复用线程执行任务的组件 |
| 定时器 | Timer | 延迟或周期性执行任务的机制 |
| 锁 | Lock | 保护共享资源访问的同步机制 |
| 读写锁 | ReadWriteLock | 读操作不阻塞、写操作独占的锁 |
| 信号量 | Semaphore | 控制并发访问数量的机制 |
| 阻塞队列 | BlockingQueue | 支持阻塞操作的队列 |

### 3.5 数据存储与缓存

| 术语 | 英文 | 说明 |
|------|------|------|
| 缓存 | Cache | 临时存储频繁访问的数据 |
| 持久化 | Persistence | 将数据永久保存到存储设备 |
| 序列化 | Serialization | 将对象转换为可存储格式 |
| 反序列化 | Deserialization | 将存储格式转换为对象 |
| 配置管理 | Configuration Management | 管理系统和游戏配置 |

### 3.6 脚本系统

| 术语 | 英文 | 说明 |
|------|------|------|
| 脚本 | Script | 用脚本语言编写的可执行逻辑 |
| GraalVM JS | GraalVM JavaScript | 高性能JavaScript引擎 |
| NPC脚本 | NPC Script | NPC对话和交互的脚本 |
| 地图脚本 | Map Script | 地图事件触发的脚本 |
| 任务脚本 | Quest Script | 任务逻辑的脚本实现 |
| 事件脚本 | Event Script | 特殊事件触发的脚本 |

### 3.7 WZ数据格式

| 术语 | 英文 | 说明 |
|------|------|------|
| WZ文件 | WZ File | MapleStory游戏资源文件格式 |
| 数据提供者 | Data Provider | 加载和提供WZ数据的组件 |
| 数据实体 | Data Entity | WZ文件中的数据结构 |
| 数据目录 | Data Directory | WZ文件中的目录节点 |

---

## 4. 缩略语解释

### 4.1 游戏相关

| 缩写 | 完整含义 | 中文解释 |
|------|----------|----------|
| AP | Ability Point | 属性点 |
| SP | Skill Point | 技能点 |
| HP | Hit Point | 生命值 |
| MP | Mana Point | 魔法值 |
| STR | Strength | 力量属性 |
| DEX | Dexterity | 敏捷属性 |
| INT | Intelligence | 智力属性 |
| LUK | Luck | 幸运属性 |
| EXP | Experience | 经验值 |
| MVP | Most Valuable Player | 最有价值玩家 |
| PVP | Player vs Player | 玩家对战 |
| PVE | Player vs Environment | 玩家对环境/怪物 |
| NPC | Non-Player Character | 非玩家角色 |
| GM | Game Master | 游戏管理员 |

### 4.2 技术相关

| 缩写 | 完整含义 | 中文解释 |
|------|----------|----------|
| API | Application Programming Interface | 应用程序编程接口 |
| ORM | Object-Relational Mapping | 对象关系映射 |
| DAO | Data Access Object | 数据访问对象 |
| TCP | Transmission Control Protocol | 传输控制协议 |
| UDP | User Datagram Protocol | 用户数据报协议 |
| HTTP | Hypertext Transfer Protocol | 超文本传输协议 |
| HTTPS | HTTP Secure | 安全超文本传输协议 |
| JSON | JavaScript Object Notation | JavaScript对象表示法 |
| XML | eXtensible Markup Language | 可扩展标记语言 |
| YAML | YAML Ain't Markup Language | YAML不是标记语言 |
| SQL | Structured Query Language | 结构化查询语言 |
| JVM | Java Virtual Machine | Java虚拟机 |
| IDE | Integrated Development Environment | 集成开发环境 |
| SDK | Software Development Kit | 软件开发工具包 |
| CI/CD | Continuous Integration/Continuous Deployment | 持续集成/持续部署 |
| UUID | Universal Unique Identifier | 通用唯一标识符 |
| AES | Advanced Encryption Standard | 高级加密标准 |
| BCrypt | Bcrypt Password Hashing | BCrypt密码哈希算法 |
| HWID | Hardware Identification | 硬件标识符 |
| MAC | Media Access Control Address | 媒体访问控制地址 |

### 4.3 项目相关

| 缩写 | 完整含义 | 中文解释 |
|------|----------|----------|
| BeiDou | 北斗 | 项目名称 |
|.gms |.gms | org.gms包的简写 |
| WZ | WZ | MapleStory资源文件格式 |
| BuffStat | Bufferable Status | BUFF状态标识 |
| StatEffect | Status Effect | 状态效果 |
| MapleMap | MapleMap | 地图核心类 |
| Foothold | Foothold | 地形承载点 |

---

## 5. 常见名词定义

### 5.1 核心游戏概念

**世界 (World)**
游戏服务器中的独立游戏区域，包含多个频道。世界之间相互隔离，拥有独立的经济系统和玩家数据。玩家创建角色时需要选择所属世界，每个世界可配置不同的经验倍率、金币倍率和掉落倍率。

**频道 (Channel)**
世界内的游戏服务器实例，用于分散玩家负载。每个频道可容纳一定数量的玩家，频道之间相互独立但共享世界数据（如公会信息）。

**角色ID (Character ID)**
角色的唯一数字标识符，用于在游戏数据库中定位和识别角色。每个角色拥有全球唯一的ID。

**账号ID (Account ID)**
玩家账号的唯一标识符，用于关联该账号下的所有角色和账号配置信息。

### 5.2 网络通信概念

**Opcode (操作码)**
封包中的指令标识符，用于告知接收方当前封包代表什么操作。客户端和服务端通过预定义的Opcode来协调通信。

**封包加密 (Packet Encryption)**
为防止网络嗅探和封包篡改，对传输的封包内容进行AES加密处理。服务端和客户端使用共享密钥进行加解密。

**会话保持 (Session Maintenance)**
通过心跳机制维持客户端与服务端的连接状态，确保长时间无操作时连接不被中断。

### 5.3 数据管理概念

**数据持久化 (Data Persistence)**
将游戏数据（如角色属性、背包物品、任务进度）保存到数据库，确保服务器重启后数据不丢失。

**自动保存 (Auto-Save)**
服务端定期将玩家数据写入数据库的机制，通常每5分钟执行一次，防止意外断线导致数据丢失。

**缓存策略 (Cache Strategy)**
将频繁访问的数据保留在内存中以提高读取性能，同时在数据更新时保持缓存与数据库的一致性。

### 5.4 脚本引擎概念

**脚本上下文 (Script Context)**
脚本执行时的环境，包含可调用的Java对象和方法。脚本通过上下文与游戏服务端进行交互。

**脚本缓存 (Script Cache)**
将编译后的脚本保留在内存中，避免重复加载和编译，提高脚本执行效率。

**脚本可调用对象 (Invocable)**
可被脚本代码调用的Java对象，通过实现特定接口暴露功能给脚本。

### 5.5 游戏平衡概念

**倍率 (Rate)**
用于调整游戏难度的乘数，包括经验倍率（EXPRate）、金币倍率（MesoRate）、掉落倍率（DropRate）等。

**属性成长 (Stat Growth)**
角色升级时属性值的增加方式，不同职业有不同的成长曲线。

**装备等级 (Equip Level)**
装备通过累积经验值可以提升的等级系统，等级越高提供的属性加成越多。

---

## 6. 附录

### 6.1 职业ID对照表（部分）

| 职业名 | Job ID | 所属分支 |
|--------|--------|----------|
| Beginner | 0 | 冒险家 |
| Warrior | 100 | 战士 |
| Fighter | 110 | 战士二转 |
| Crusader | 111 | 战士三转 |
| Hero | 112 | 战士四转 |
| Magician | 200 | 法师 |
| FP Wizard | 210 | 火/冰法师 |
| IL Wizard | 220 | 雷/毒法师 |
| Cleric | 230 | 牧师 |
| Bowman | 300 | 弓手 |
| Hunter | 310 | 弓手二转 |
| Ranger | 311 | 弓手三转 |
| Bowmaster | 312 | 弓手四转 |
| Thief | 400 | 飞侠 |
| Assassin | 410 | 飞侠二转 |
| Hermit | 411 | 飞侠三转 |
| Nightlord | 412 | 飞侠四转 |
| Pirate | 500 | 海贼 |
| GM | 900 | 游戏管理员 |
| Super GM | 910 | 超级管理员 |

### 6.2 背包类型对照

| 类型名 | InventoryType | ID | 槽位上限 |
|--------|---------------|-----|----------|
| Equip | EQUIP | 1 | 24/96 |
| Use | USE | 2 | 24/96 |
| Setup | SETUP | 3 | 24/96 |
| Et cetera | ETC | 4 | 24/96 |
| Cash | CASH | 5 | 96 |
| Equipped | EQUIPPED | -1 | 角色装备栏 |

### 6.3 地图ID结构说明

地图ID为9位数字，结构如下：

```
[大区域(1位)][子区域(2位)][地图编号(3位)][地图子号(3位)]

例如：100000000
  - 大区域: 1 (楓之谷/维多利亚港)
  - 子区域: 00 (综合区域)
  - 地图编号: 000 (第1张地图)
  - 地图子号: 000 (无子编号)
```

---

*文档版本: 1.0*
*最后更新: 2026-03-27*
