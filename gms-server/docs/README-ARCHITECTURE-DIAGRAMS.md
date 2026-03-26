# 项目架构图和流程图

## 1. 系统整体架构图

```mermaid
graph TB
    subgraph "客户端层"
        C1[游戏客户端]
        C2[Web 管理后台]
        C3[API 调用方]
    end

    subgraph "网络层"
        N1[LoginServer<br/>8484端口]
        N2[ChannelServer<br/>8600+端口]
        N3[Web API<br/>8686端口]
        N4[Netty框架]
    end

    subgraph "业务层"
        B1[角色服务]
        B2[地图服务]
        B3[物品服务]
        B4[任务服务]
        B5[公会服务]
        B6[商城服务]
    end

    subgraph "数据访问层"
        D1[MyBatis-Flex]
        D2[Druid连接池]
    end

    subgraph "数据层"
        DB[(MySQL 8.0)]
    end

    C1 --> N1
    C1 --> N2
    C2 --> N3
    C3 --> N3

    N1 --> B1
    N2 --> B1
    N2 --> B2
    N2 --> B3
    N2 --> B4
    N2 --> B5
    N3 --> B1
    N3 --> B6

    B1 --> D1
    B2 --> D1
    B3 --> D1
    B4 --> D1
    B5 --> D1
    B6 --> D1

    D1 --> D2
    D2 --> DB

    N4 -.支撑.- N1
    N4 -.支撑.- N2
```

## 2. 服务器架构图

```mermaid
graph TB
    subgraph "BeiDou Server"
        subgraph "登录服务器 (LoginServer)"
            L1[账号认证]
            L2[角色列表]
            L3[服务器选择]
        end

        subgraph "世界服务器 (World)"
            W1[世界0]
            W2[世界1]
            W3[世界N]

            subgraph "频道服务器 (Channel)"
                C1[频道1]
                C2[频道2]
                C3[频道N]
            end

            W1 --> C1
            W1 --> C2
            W2 --> C3
        end

        subgraph "数据库服务器"
            DB[(MySQL)]
        end

        L1 --> DB
        L2 --> DB
        L3 --> DB
        C1 --> DB
        C2 --> DB
        C3 --> DB
    end
```

## 3. 玩家登录流程图

```mermaid
sequenceDiagram
    participant Client as 游戏客户端
    participant Login as LoginServer
    participant DB as 数据库
    participant Channel as ChannelServer

    Client->>Login: 1. 发送登录请求
    Login->>DB: 2. 查询账号信息
    DB-->>Login: 3. 返回账号数据
    Login->>Login: 4. 验证密码和状态
    Login-->>Client: 5. 返回登录结果

    Client->>Login: 6. 请求角色列表
    Login->>DB: 7. 查询角色数据
    DB-->>Login: 8. 返回角色列表
    Login-->>Client: 9. 返回角色列表

    Client->>Login: 10. 选择角色登录
    Login->>Login: 11. 获取频道服务器地址
    Login-->>Client: 12. 返回频道服务器IP和端口

    Client->>Channel: 13. 连接频道服务器
    Channel->>DB: 14. 加载角色完整数据
    DB-->>Channel: 15. 返回角色数据
    Channel->>Channel: 16. 初始化角色状态
    Channel-->>Client: 17. 发送登录成功和初始数据
```

## 4. 封包处理流程图

```mermaid
graph TB
    Start[客户端发送封包] --> Decode[Netty Decoder<br/>解密和解码]
    Decode --> CheckHeader{检查封包头}
    CheckHeader -->|有效| Process[PacketProcessor<br/>封包处理器]
    CheckHeader -->|无效| Error[记录错误并断开]

    Process --> GetOpcode[获取 Opcode]
    GetOpcode --> FindHandler{查找 Handler}
    FindHandler -->|找到| Validate[验证状态]
    FindHandler -->|未找到| Error

    Validate -->|状态有效| Execute[Handler.handlePacket<br/>执行处理逻辑]
    Validate -->|状态无效| Skip[跳过处理]

    Execute --> Business[调用业务服务]
    Business --> Database[数据库操作]
    Database --> Response[创建响应封包]

    Response --> Encode[Netty Encoder<br/>加密和编码]
    Encode --> Send[发送给客户端]

    Skip --> Send
```

## 5. 角色系统架构图

```mermaid
classDiagram
    class Client {
        +sessionId
        +hwid
        +remoteAddress
        +login()
        +disconnect()
    }

    class Character {
        +id
        +name
        +level
        +exp
        +job
        +meso
        +saveCharToDB()
        +gainExp()
    }

    class Inventory {
        +type
        +items
        +addItem()
        +removeItem()
        +getItem()
    }

    class Skill {
        +id
        +level
        +masterLevel
        +getSkillInfo()
    }

    class BuddyList {
        +buddies
        +addBuddy()
        +removeBuddy()
    }

    class Family {
        +id
        +members
        +level
    }

    Client "1" --> "1" Character
    Character "1" --> "*" Inventory
    Character "1" --> "*" Skill
    Character "1" --> "1" BuddyList
    Character "1" --> "0..1" Family
```

## 6. 地图系统架构图

```mermaid
graph TB
    subgraph "MapFactory"
        MF[地图工厂]
    end

    subgraph "地图实例"
        M1[地图1]
        M2[地图2]
        M3[地图N]
    end

    subgraph "地图元素"
        MT1[怪物]
        MT2[NPC]
        MT3[传送门]
        MT4[掉落物]
    end

    MF --> M1
    MF --> M2
    MF --> M3

    M1 --> MT1
    M1 --> MT2
    M1 --> MT3
    M1 --> MT4

    M2 --> MT1
    M2 --> MT2
```

## 7. 公会系统架构图

```mermaid
graph TB
    subgraph "公会联盟"
        A[Alliance 联盟]
    end

    subgraph "公会成员"
        G1[Guild 公会1]
        G2[Guild 公会2]
        G3[Guild 公会N]
    end

    subgraph "公会成员"
        GM1[GuildMember 成员1]
        GM2[GuildMember 成员2]
        GM3[GuildMember 成员N]
    end

    A --> G1
    A --> G2
    A --> G3

    G1 --> GM1
    G1 --> GM2
    G2 --> GM3
```

## 8. 脚本执行流程图

```mermaid
sequenceDiagram
    participant Client as 游戏客户端
    participant Server as 服务器
    participant ScriptMgr as ScriptManager
    participant Script as JS脚本
    participant DB as 数据库

    Client->>Server: 触发事件（如点击NPC）
    Server->>ScriptMgr: 获取脚本实例
    ScriptMgr->>ScriptMgr: 检查缓存
    alt 脚本已缓存
        ScriptMgr-->>ScriptMgr: 返回缓存脚本
    else 脚本未缓存
        ScriptMgr->>ScriptMgr: 加载JS文件
        ScriptMgr->>ScriptMgr: 编译脚本
        ScriptMgr->>ScriptMgr: 缓存脚本
    end
    ScriptMgr->>Script: 执行脚本函数
    Script->>DB: 读写游戏数据
    DB-->>Script: 返回数据
    Script->>Script: 处理业务逻辑
    Script-->>Server: 返回处理结果
    Server-->>Client: 发送响应封包
```

## 9. 任务系统流程图

```mermaid
graph TB
    Start[玩家接受任务] --> CheckPre{检查前置条件}
    CheckPre -->|满足| StartQuest[开始任务]
    CheckPre -->|不满足| Fail[任务失败]

    StartQuest --> SetState[设置任务状态为进行中]
    SetState --> QuestProgress[执行任务步骤]

    QuestProgress --> CheckStep{检查步骤完成}
    CheckStep -->|未完成| QuestProgress
    CheckStep -->|已完成| CheckFinish{检查完成条件}

    CheckFinish -->|未完成| QuestProgress
    CheckFinish -->|已完成| CompleteQuest[完成任务]

    CompleteQuest --> GiveReward[发放奖励]
    GiveReward --> SaveData[保存任务状态]
    SaveData --> End[任务结束]

    Fail --> End
```

## 10. 数据库访问流程图

```mermaid
sequenceDiagram
    participant Service as Service层
    participant Mapper as Mapper层
    participant MyBatis as MyBatis-Flex
    participant Druid as Druid连接池
    participant DB as MySQL数据库

    Service->>Mapper: 调用Mapper方法
    Mapper->>MyBatis: 构建SQL语句
    MyBatis->>Druid: 获取数据库连接
    Druid-->>MyBatis: 返回连接

    MyBatis->>DB: 执行SQL
    DB-->>MyBatis: 返回结果集

    MyBatis->>MyBatis: 映射结果到对象
    MyBatis->>Druid: 释放连接
    MyBatis-->>Mapper: 返回数据对象
    Mapper-->>Service: 返回结果
```

## 11. 并发控制架构图

```mermaid
graph TB
    subgraph "线程管理"
        TM[ThreadManager<br/>线程管理器]
        TMR[TimerManager<br/>定时器管理器]
        NE[Netty EventLoop<br/>网络事件线程]
    end

    subgraph "锁机制"
        RL[ReadWriteLock<br/>读写锁]
        ML[ReentrantLock<br/>可重入锁]
        SM[Semaphore<br/>信号量]
    end

    subgraph "并发集合"
        CHM[ConcurrentHashMap]
        CUAL[CopyOnWriteArrayList]
        BQ[BlockingQueue]
    end

    TM -.创建.- TMR
    NE -.处理网络事件.- SM

    RL -.保护共享数据.- CHM
    ML -.同步客户端操作.- BQ
    SM -.限制并发数.- CUAL
```

## 12. 系统启动流程图

```mermaid
graph TB
    Start[启动应用] --> InitDB[初始化数据库]
    InitDB --> LoadConfig[加载配置文件]
    LoadConfig --> LoadWZ[加载WZ数据]
    LoadWZ --> LoadSkills[加载技能数据]
    LoadWZ --> LoadQuests[加载任务数据]
    LoadWZ --> LoadItems[加载物品数据]

    LoadSkills --> InitWorlds[初始化世界]
    LoadQuests --> InitWorlds
    LoadItems --> InitWorlds

    InitWorlds --> CreateChannels[创建频道]
    CreateChannels --> StartLoginServer[启动登录服务器]
    StartLoginServer --> LoadCommands[加载GM命令]
    LoadCommands --> StartTimers[启动定时任务]
    StartTimers --> Ready[服务器就绪]

    Ready --> PlayerLogin[等待玩家登录]
```

## 13. 玩家切换频道流程图

```mermaid
sequenceDiagram
    participant Player as 玩家
    participant OldChannel as 原频道
    participant NewChannel as 新频道
    participant DB as 数据库

    Player->>OldChannel: 请求切换频道
    OldChannel->>OldChannel: 检查状态
    OldChannel->>OldChannel: 保存玩家数据

    OldChannel->>OldChannel: 移除玩家状态
    OldChannel->>OldChannel: 移除地图
    OldChannel->>DB: 持久化数据

    DB-->>OldChannel: 保存完成
    OldChannel-->>Player: 返回新频道地址

    Player->>NewChannel: 连接新频道
    NewChannel->>DB: 加载玩家数据
    DB-->>NewChannel: 返回数据
    NewChannel->>NewChannel: 恢复玩家状态
    NewChannel-->>Player: 发送登录成功
```

## 14. 物品交易流程图

```mermaid
graph TB
    Start[发起交易] --> FindTarget{查找目标}
    FindTarget -->|未找到| Fail1[交易失败]
    FindTarget -->|找到| SendRequest[发送交易请求]
    SendRequest --> WaitResponse{等待响应}

    WaitResponse -->|拒绝| Fail2[交易取消]
    WaitResponse -->|接受| OpenTrade[打开交易窗口]

    OpenTrade --> AddItem1[玩家1放置物品]
    AddItem1 --> AddItem2[玩家2放置物品]
    AddItem2 --> CheckValid{验证物品}

    CheckValid -->|无效| Fail3[交易失败]
    CheckValid -->|有效| Confirm1[玩家1确认]
    Confirm1 --> Confirm2[玩家2确认]

    Confirm2 --> Exchange[交换物品]
    Exchange --> SaveData[保存数据]
    SaveData --> Notify[通知双方]
    Notify --> End[交易完成]

    Fail1 --> End
    Fail2 --> End
    Fail3 --> End
```

## 15. 怪物AI行为流程图

```mermaid
graph TB
    Start[怪物刷新] --> Idle[空闲状态]
    Idle --> CheckPlayer{检测玩家}

    CheckPlayer -->|无玩家| Idle
    CheckPlayer -->|有玩家| Chase[追逐状态]

    Chase --> CheckRange{检查攻击范围}
    CheckRange -->|超出范围| Chase
    CheckRange -->|范围内| Attack[攻击状态]

    Attack --> CheckDeath{检查死亡}
    CheckDeath -->|未死亡| CheckRange
    CheckDeath -->|死亡| Death[死亡处理]

    Death --> Drop[掉落物品]
    Drop --> Respawn{检查重生}
    Respawn -->|可重生| WaitRespawn[等待重生时间]
    WaitRespawn --> Start
    Respawn -->|不可重生| End[怪物消失]

    Idle -.定时刷新.- Start
```

---

*文档版本: 1.0*
*最后更新: 2026-03-25*
*注意: 以上图表使用 Mermaid 语法，支持在支持的 Markdown 查看器中渲染*
