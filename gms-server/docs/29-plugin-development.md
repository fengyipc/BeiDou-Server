# 插件开发

## 1. 插件系统概述

BeiDou-Server 采用基于 JavaScript 的脚本引擎（GraalJS）作为插件系统。与传统编译型插件不同，脚本插件无需重新编译服务器即可实现功能扩展。

### 1.1 技术架构

- **脚本引擎**: GraalJS (基于 GraalVM 的 JavaScript 引擎)
- **执行模式**: 多线程安全包装器 (`SynchronizedInvocable`)
- **热加载**: 脚本文件放置后自动生效（无需重启服务器）

### 1.2 脚本目录结构

```
scripts/
├── event/          # 事件/副本脚本
├── item/           # 物品脚本
├── map/            # 地图脚本
├── npc/            # NPC 对话脚本
├── portal/         # 传送门脚本
├── quest/          # 任务脚本
└── reactor/        # 反应堆脚本
```

## 2. 插件架构设计

### 2.1 核心组件

| 组件 | 类名 | 职责 |
|------|------|------|
| 脚本管理器基类 | `AbstractScriptManager` | 加载和执行 JavaScript 脚本 |
| 玩家交互基类 | `AbstractPlayerInteraction` | 提供脚本可调用的游戏 API |
| NPC 脚本管理器 | `NPCScriptManager` | 管理 NPC 对话脚本 |
| 事件管理器 | `EventManager` | 管理事件实例生命周期 |
| 物品脚本管理器 | `ItemScriptManager` | 管理物品使用脚本 |
| 任务脚本管理器 | `QuestScriptManager` | 管理任务脚本 |
| 反应堆管理器 | `ReactorScriptManager` | 管理反应堆脚本 |
| 传送门管理器 | `PortalScriptManager` | 管理传送门脚本 |

### 2.2 脚本执行流程

```
玩家触发 -> ScriptManager.start() -> 加载 .js 文件
         -> 创建 ScriptEngine -> 绑定上下文对象 (cm, eim 等)
         -> 调用 start 函数 -> 脚本逻辑执行
         -> 用户交互 -> action() 方法处理
         -> dispose() 清理
```

## 3. 插件生命周期

### 3.1 NPC 脚本生命周期

```javascript
var status = -1;  // 对话状态计数器

function start() {
    // 脚本入口点，玩家首次与 NPC 对话时调用
    cm.sendNext("你好！");
}

function action(mode, type, selection) {
    // 处理玩家响应
    // mode: 1=确认, 0=取消/返回, -1=关闭对话
    // type: 响应类型
    // selection: 玩家选择的选项索引
    status++;
    
    if (mode == 0) {
        cm.dispose();  // 结束对话
        return;
    }
    
    if (status == 1) {
        cm.sendYesNo("是否确认？");
    } else if (status == 2) {
        cm.warp(100000000);  // 传送
        cm.dispose();
    }
}
```

### 3.2 事件脚本生命周期

```javascript
function init() {
    // 初始化事件数据
}

function setup(eim, leaderid) {
    // 创建事件实例
    var eim = em.newInstance("事件名称");
    return eim;
}

function playerEntry(eim, player) {
    // 玩家进入事件
    player.warp(地图ID);
}

function monsterKilled(mob, eim) {
    // 怪物死亡处理
}

function allMonstersDead(eim) {
    // 所有怪物死亡，事件完成
    eim.clearPQ();
}

function timeOut(eim) {
    // 事件超时处理
    eim.dispose();
}

function dispose() {
    // 清理事件资源
}
```

## 4. 插件开发规范

### 4.1 文件命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| NPC 脚本 | `{NPCID}.js` 或自定义名称 | `10200.js`, `tutorial.js` |
| 事件脚本 | `{EventName}.js` | `HorntailPQ.js` |
| 物品脚本 | `{ItemID}.js` | `123456.js` |
| 任务脚本 | `{QuestID}.js` | `1000.js` |
| 传送门脚本 | `{PortalName}.js` | `out00.js` |

### 4.2 脚本文件编码

- **必须使用 UTF-8 编码**
- 文件后缀为 `.js`
- 放置于对应类型的子目录下

### 4.3 常用上下文对象

| 对象 | 类型 | 说明 |
|------|------|------|
| `cm` | `NPCConversationManager` | NPC 对话管理器 |
| `eim` | `EventInstanceManager` | 事件实例管理器 |
| `em` | `EventManager` | 事件管理器 |
| `qm` | `QuestActionManager` | 任务管理器 |
| `im` | `ItemScriptManager` | 物品脚本管理器 |
| `ri` | `ReactorActionManager` | 反应堆管理器 |

## 5. 常用扩展点

### 5.1 NPC 扩展

创建自定义 NPC 对话：

```javascript
var status = -1;

function start() {
    cm.sendSimple("#b#L0#购买物品#l\n#L1#出售物品#l");
}

function action(mode, type, selection) {
    status++;
    if (mode != 1) {
        cm.dispose();
        return;
    }
    
    if (selection == 0) {
        // 打开商店
        cm.openShop(1);
    }
    cm.dispose();
}
```

### 5.2 事件/副本扩展

创建组队副本：

```javascript
function setup(eim) {
    var prop = em.newInstance("MyPQ");
    prop.setProperty("points", 0);
    return prop;
}

function monsterValue(eim, mobid) {
    var points = parseInt(eim.getProperty("points"));
    eim.setProperty("points", points + 1);
    return 1;
}

function allMonstersDead(eim) {
    if (eim.getProperty("points") >= 100) {
        eim.clearPQ();
    }
}
```

### 5.3 物品脚本扩展

```javascript
function start() {
    if (im.getInventory(1).countById(4001507) < 1) {
        im.dispose();
        return;
    }
    im.removeById(1, 4001507);
    im.gainItem(4001508, 1);
    im.dispose();
}
```

### 5.4 任务扩展

```javascript
function start(mode, selection) {
    if (qm.getQuest(1000).getStatus() == 0) {
        if (mode == 1) {
            qm.forceComplete();
        }
    }
    qm.dispose();
}
```

## 6. 插件示例

### 6.1 简单 NPC 对话

```javascript
/*
 * 示例：简单欢迎 NPC
 */
var status = 0;

function start() {
    cm.sendNext("欢迎来到冒险世界！我是新手指导员。");
}

function action(mode, type, selection) {
    status++;
    if (mode != 1) {
        cm.dispose();
        return;
    }
    
    if (status == 1) {
        cm.sendNextPrev("在这里你可以创建角色、完成任务、结交朋友。");
    } else if (status == 2) {
        cm.sendAcceptDecline("是否需要我带你熟悉一下环境？");
    } else {
        cm.warp(100000000);  // 传送新手村
        cm.dispose();
    }
}
```

### 6.2 商店 NPC

```javascript
var status = 0;

function start() {
    cm.sendSimple("#b#e#h 0##n 您好！请选择服务：\n\n"
        + "#L1#购买药水#l\n"
        + "#L2#购买装备#l\n"
        + "#L3#出售物品#l\n"
        + "#L0#离开#l");
}

function action(mode, type, selection) {
    if (selection == 0) {
        cm.dispose();
        return;
    }
    
    if (selection == 1) {
        cm.openShop(100);  // 打开商店 ID 100
    } else if (selection == 2) {
        cm.openShop(101);
    } else if (selection == 3) {
        cm.sendOk("请将物品拖拽到交易窗口。");
    }
    cm.dispose();
}
```

### 6.3 组队副本事件

```javascript
var isPq = true;
var minPlayers = 3, maxPlayers = 6;
var minLevel = 50, maxLevel = 200;
var entryMap = 920010000;
var exitMap = 920010100;
var clearMap = 920010200;
var eventTime = 30;  // 分钟

function setup(eim) {
    var prop = em.newInstance("AriantPQ");
    prop.setProperty("stage", 0);
    return prop;
}

function playerEntry(eim, player) {
    player.warp(entryMap);
}

function monsterKilled(mob, eim) {
    var stage = parseInt(eim.getProperty("stage"));
    eim.setProperty("stage", stage + 1);
}

function allMonstersDead(eim) {
    var stage = parseInt(eim.getProperty("stage"));
    if (stage >= 10) {
        eim.clearPQ();
    } else {
        eim.warpAllPlayer(920010000 + stage);
    }
}

function clearPQ(eim) {
    var party = eim.getPlayers();
    for (var i = 0; i < party.size(); i++) {
        party.get(i).warp(clearMap);
    }
    eim.dispose();
}

function timeOut(eim) {
    eim.warpAllPlayer(exitMap);
    eim.dispose();
}
```

## 7. 插件配置

### 7.1 NPC 脚本挂载

在 WZ 文件中配置 NPC 脚本：

```
NPC ID -> Script 字段指定脚本名称
```

或在代码中通过 `NPCScriptManager.getInstance().start(client, npcId, "脚本名", player)` 调用。

### 7.2 事件注册

事件通过 `EventManager` 加载，放置于 `scripts/event/` 目录后自动注册。

### 7.3 物品脚本配置

物品脚本通过 WZ 文件中物品的 `script` 字段关联。

## 8. 相关代码示例

### 8.1 AbstractPlayerInteraction 常用方法

```java
// 玩家操作
player.getName()                    // 获取玩家名
player.getLevel()                   // 获取等级
player.getJob()                     // 获取职业
player.getMeso()                    // 获取金币
player.gainMeso(amount)             // 增加金币
player.gainExp(amount)              // 增加经验

// 地图操作
player.getMap().getId()             // 获取地图 ID
player.changeMap(mapId)             // 切换地图
player.getMap().warpEveryone(mapId) // 传送全队

// 物品操作
player.hasItem(itemId)              // 检查物品
player.gainItem(itemId, quantity)   // 获得物品
player.removeAll(itemId)            // 移除物品

// 任务操作
player.getQuest(questId).getStatus() // 获取任务状态
Quest.getInstance(id).forceStart(player, npcId)  // 开始任务
Quest.getInstance(id).forceComplete(player, npcId) // 完成任务
```

### 8.2 NPCConversationManager 常用方法

```java
// 对话方法
cm.sendNext(text)                   // 发送"下一步"对话框
cm.sendYesNo(text)                  // 发送是/否对话框
cm.sendSimple(text)                 // 发送选项对话框
cm.sendOk(text)                     // 发送确定对话框
cm.sendGetNumber(text, def, min, max) // 获取数字输入
cm.sendGetText(text)                // 获取文本输入

// 操作方法
cm.warp(mapId)                      // 传送玩家
cm.warpParty(mapId)                 // 传送队伍
cm.openShop(shopId)                 // 打开商店
cm.dispose()                        // 结束对话
```

### 8.3 EventInstanceManager 常用方法

```java
// 实例管理
eim.getPlayers()                    // 获取所有玩家
eim.newInstance(name)               // 创建新实例
eim.dispose()                       // 销毁实例

// 属性管理
eim.setProperty(key, value)         // 设置属性
eim.getProperty(key)                // 获取属性

// 玩家管理
eim.registerPlayer(player)          // 注册玩家
eim.removePlayer(player)            // 移除玩家
eim.warpAllPlayer(mapId)            // 传送所有玩家

// 事件控制
eim.startEvent()                    // 开始事件
eim.clearPQ()                       // 清除副本
eim.schedule("method", delay)       // 调度任务
```

## 9. 最佳实践

### 9.1 错误处理

```javascript
function action(mode, type, selection) {
    try {
        // 业务逻辑
        if (someError) {
            cm.sendOk("发生错误，请重试。");
            cm.dispose();
        }
    } catch (e) {
        cm.dispose();
    }
}
```

### 9.2 状态管理

```javascript
var status = 0;
var selections = new Array();

function start() {
    status = 0;
    cm.sendNext("请选择：");
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
        return;
    }
    
    if (mode == 0) {
        status--;
    } else {
        status++;
        selections.push(selection);
    }
    
    // 根据状态处理
}
```

### 9.3 性能注意事项

1. 避免在脚本中执行耗时操作
2. 及时调用 `dispose()` 释放资源
3. 使用 `eim.setProperty()` 而非全局变量存储状态

---

*文档版本: 1.0*
*最后更新: 2026-03-27*
