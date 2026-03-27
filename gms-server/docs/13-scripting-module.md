# 脚本系统模块

## 1. 概述

脚本系统是 MapleStory 模拟器的核心模块之一，负责在服务器运行时动态执行游戏逻辑脚本。通过脚本系统，开发者可以在不修改核心代码的情况下，灵活地定义 NPC 对话、任务流程、地图事件、传送门行为和反应器（Reactor）交互等游戏内容。

本游戏服务器使用 **GraalVM JavaScript** 作为脚本引擎，通过 **javax.script** API 与 Java 代码进行交互，实现脚本与服务器端的无缝集成。

## 2. GraalVM JS 集成

### 2.1 依赖配置

项目在 `pom.xml` 中引入了 GraalVM JS 相关依赖：

```xml
<!-- Scripting -->
<dependency>
    <groupId>org.graalvm.js</groupId>
    <artifactId>js</artifactId>
    <version>${graalvm-js.version}</version>
</dependency>
<dependency>
    <groupId>org.graalvm.js</groupId>
    <artifactId>js-scriptengine</artifactId>
    <version>${graalvm-js-scriptengine.version}</version>
</dependency>
```

版本信息：
- `graalvm-js.version`: 23.0.4
- `graalvm-js-scriptengine.version`: 24.0.1

### 2.2 引擎初始化

脚本引擎通过 `ScriptEngineManager` 获取 GraalJS 引擎实例：

```java
// AbstractScriptManager.java
sef = new ScriptEngineManager().getEngineByName("graal.js").getFactory();
```

### 2.3 主机访问权限

为允许脚本调用 Java 类和方法，需要启用 Polyglot 主机访问权限：

```java
private void enableScriptHostAccess(GraalJSScriptEngine engine) {
    Bindings bindings = engine.getBindings(ScriptContext.ENGINE_SCOPE);
    bindings.put("polyglot.js.allowHostAccess", true);
    bindings.put("polyglot.js.allowHostClassLookup", true);
}
```

## 3. 脚本引擎架构

### 3.1 核心类图

```mermaid
graph TB
    A[AbstractScriptManager] --> B[NPCScriptManager]
    A --> C[QuestScriptManager]
    A --> D[EventScriptManager]
    A --> E[PortalScriptManager]
    A --> F[ReactorScriptManager]
    A --> G[MapScriptManager]

    H[SynchronizedInvocable] --> I[Invocable]
    J[GraalJSScriptEngine] --> K[ScriptEngine]

    L[NPCConversationManager] --> M[AbstractPlayerInteraction]
    N[QuestActionManager] --> M
    O[ReactorActionManager] --> M
    P[EventManager] --> M
```

### 3.2 类说明

| 类名 | 职责 |
|------|------|
| `AbstractScriptManager` | 所有脚本管理器的基类，负责脚本引擎的加载和初始化 |
| `SynchronizedInvocable` | 线程安全的 Invocable 包装器，用于 GraalVM 的并发访问控制 |
| `NPCScriptManager` | 管理 NPC 对话脚本的执行 |
| `QuestScriptManager` | 管理任务脚本的开始、结束和RaiseOpen |
| `EventScriptManager` | 管理频道事件的脚本执行和生命周期 |
| `PortalScriptManager` | 管理传送门脚本的执行 |
| `ReactorScriptManager` | 管理反应器的 hit、act、touch、untouch 事件 |
| `MapScriptManager` | 管理地图进入脚本 |

## 4. 脚本管理机制

### 4.1 脚本文件组织

```
scripts/
├── npc/           # NPC 对话脚本
├── quest/         # 任务脚本
├── event/         # 事件脚本
├── portal/        # 传送门脚本
├── reactor/       # 反应器脚本
├── map/           # 地图脚本
├── item/          # 物品脚本
└── BeiDouSpecial/ # 特殊北斗脚本
```

### 4.2 多语言支持

系统支持按语言加载不同的脚本文件夹，优先级顺序为：
1. `scripts-{language}/` (如 `scripts-zh-CN/`)
2. `scripts/`

```java
String scriptName = "scripts";
String scriptLangName = scriptName + "-" + serviceProperty.getLanguage();

Path scriptPath = Path.of(scriptName, path);
Path scriptLangPath = Path.of(scriptLangName, path);

Path actualPath;
if (Files.exists(scriptLangPath)) {
    actualPath = scriptLangPath;
} else if (Files.exists(scriptPath)) {
    actualPath = scriptPath;
}
```

### 4.3 脚本引擎缓存

每个客户端可以缓存自己的脚本引擎实例，避免重复加载：

```java
public ScriptEngine getInvocableScriptEngine(String path, Client c) {
    ScriptEngine engine = c.getScriptEngine("scripts/" + path);
    if (engine == null) {
        engine = getInvocableScriptEngine(path);
        c.setScriptEngine(path, engine);
    }
    return engine;
}
```

## 5. 脚本加载和编译

### 5.1 加载流程

```mermaid
sequenceDiagram
    participant Client
    participant ScriptManager
    participant ScriptEngine
    participant JSFile

    Client->>ScriptManager: start(npcId, fileName)
    ScriptManager->>ScriptEngine: getInvocableScriptEngine(path)
    ScriptEngine->>JSFile: load script file
    ScriptEngine->>ScriptEngine: eval(script)
    ScriptEngine->>ScriptManager: return engine
    ScriptManager->>ScriptEngine: put("cm", conversationManager)
    ScriptManager->>Invocable: invokeFunction("start")
    Invocable-->>Client: execute script
```

### 5.2 脚本初始化代码

```java
protected ScriptEngine getInvocableScriptEngine(String path) {
    Path actualPath = resolveScriptPath(path);
    if (actualPath == null) {
        return null;
    }

    ScriptEngine engine = sef.getScriptEngine();
    GraalJSScriptEngine graalScriptEngine = (GraalJSScriptEngine) engine;
    enableScriptHostAccess(graalScriptEngine);

    try (BufferedReader br = Files.newBufferedReader(actualPath, StandardCharsets.UTF_8)) {
        engine.eval(br);
    } catch (final ScriptException | IOException t) {
        log.warn("Error loading script: {}", path, t);
        return null;
    }

    return graalScriptEngine;
}
```

### 5.3 线程安全

对于事件脚本，使用 `SynchronizedInvocable` 保证线程安全：

```java
Invocable iv = SynchronizedInvocable.of((Invocable) engine);
```

## 6. Mermaid 架构图

### 6.1 整体架构

```mermaid
graph TB
    subgraph 脚本引擎层
        JSE[GraalJSScriptEngine]
        SYNC[SynchronizedInvocable]
    end

    subgraph 管理器层
        ASM[AbstractScriptManager]
        NPC[NPCScriptManager]
        QSM[QuestScriptManager]
        ESM[EventScriptManager]
        PSM[PortalScriptManager]
        RSM[ReactorScriptManager]
        MSM[MapScriptManager]
    end

    subgraph 上下文层
        NPC-CM[NPCConversationManager]
        QA[QuestActionManager]
        RA[ReactorActionManager]
        EM[EventManager]
        PM[PortalPlayerInteraction]
        MM[MapScriptMethods]
    end

    subgraph 玩家交互层
        PLAYER[Character/Player]
        CLIENT[Client]
    end

    ASM --> NPC
    ASM --> QSM
    ASM --> ESM
    ASM --> PSM
    ASM --> RSM
    ASM --> MSM

    JSE --> SYNC

    NPC --> NPC-CM
    QSM --> QA
    RSM --> RA
    ESM --> EM
    PSM --> PM
    MSM --> MM

    NPC-CM --> PLAYER
    QA --> PLAYER
    RA --> PLAYER
    EM --> PLAYER
    PM --> PLAYER
    MM --> PLAYER
```

### 6.2 NPC 脚本执行流程

```mermaid
sequenceDiagram
    participant 用户 as 玩家
    participant NPC as NPCScriptManager
    participant CM as NPCConversationManager
    participant Script as JS脚本
    participant Engine as GraalJS引擎

    用户->>NPC: 点击NPC
    NPC->>Engine: getInvocableScriptEngine
    Engine-->>NPC: ScriptEngine
    NPC->>CM: 创建NPCConversationManager
    NPC->>Engine: engine.put("cm", cm)
    NPC->>Engine: invokeFunction("start")
    Engine->>Script: 执行start函数
    Script->>CM: 调用对话方法
    CM-->>用户: 发送数据包
    用户->>NPC: 选择选项
    NPC->>Engine: action(mode, type, selection)
    Engine->>Script: 执行action函数
```

## 7. 相关源文件

| 文件路径 | 说明 |
|----------|------|
| `src/main/java/org/gms/scripting/AbstractScriptManager.java` | 脚本管理器基类 |
| `src/main/java/org/gms/scripting/SynchronizedInvocable.java` | 线程安全调用包装器 |
| `src/main/java/org/gms/scripting/npc/NPCScriptManager.java` | NPC 脚本管理器 |
| `src/main/java/org/gms/scripting/npc/NPCConversationManager.java` | NPC 对话上下文 |
| `src/main/java/org/gms/scripting/quest/QuestScriptManager.java` | 任务脚本管理器 |
| `src/main/java/org/gms/scripting/event/EventScriptManager.java` | 事件脚本管理器 |
| `src/main/java/org/gms/scripting/portal/PortalScriptManager.java` | 传送门脚本管理器 |
| `src/main/java/org/gms/scripting/reactor/ReactorScriptManager.java` | 反应器脚本管理器 |
| `src/main/java/org/gms/scripting/map/MapScriptManager.java` | 地图脚本管理器 |
| `src/main/java/org/gms/scripting/item/ItemScriptManager.java` | 物品脚本管理器 |

## 8. 脚本目录结构

```
项目根目录/
├── scripts/                    # 默认脚本目录
│   ├── npc/                   # NPC 脚本 (722 个)
│   ├── quest/                 # 任务脚本 (267 个)
│   ├── event/                 # 事件脚本 (110 个)
│   ├── portal/                # 传送门脚本 (463 个)
│   ├── reactor/               # 反应器脚本 (292 个)
│   ├── map/                   # 地图脚本 (91 个)
│   └── item/                  # 物品脚本
├── scripts-zh-CN/             # 中文脚本目录
│   ├── npc/                   # 中文 NPC 脚本
│   ├── quest/                 # 中文任务脚本
│   └── ...
└── scripts-en-US/             # 英文脚本目录 (可选)
```

## 9. 注意事项

1. **线程安全**: EventScriptManager 使用 `SynchronizedInvocable` 保证线程安全
2. **脚本缓存**: 客户端脚本引擎会被缓存，避免重复加载
3. **错误处理**: 脚本执行异常会被捕获并记录，脚本上下文会被正确清理
4. **多语言**: 优先加载对应语言的脚本文件夹，找不到时回退到默认 `scripts/` 目录

---

*文档版本: 2.0（架构文档）*
*最后更新: 2026-03-27*
