# 自定义脚本

本文档介绍 MapleStory 模拟器中的自定义脚本系统，包括脚本开发概述、编写规范、API 参考和调试技巧。

## 目录

- [脚本开发概述](#脚本开发概述)
- [脚本编写规范](#脚本编写规范)
- [脚本API参考](#脚本api参考)
- [任务脚本示例](#任务脚本示例)
- [事件脚本示例](#事件脚本示例)
- [NPC脚本示例](#npc脚本示例)
- [物品脚本示例](#物品脚本示例)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)

---

## 脚本开发概述

### 脚本引擎

本服务器使用 **GraalJS**（基于 GraalVM 的 JavaScript 引擎）执行脚本。GraalJS 提供了与 Java 的无缝集成，允许脚本调用 Java 类和方法。

### 脚本类型

| 类型 | 文件位置 | 注入变量 | 说明 |
|------|----------|----------|------|
| NPC 脚本 | `scripts/npc/` 或 `scripts-zh-CN/npc/` | `cm` | 与 NPC 对话交互 |
| 任务脚本 | `scripts/quest/` 或 `scripts-zh-CN/quest/` | `qm` | 任务开始/完成逻辑 |
| 事件脚本 | `scripts/event/` 或 `scripts-zh-CN/event/` | `em` | 副本、PQ 等事件 |
| 物品脚本 | `scripts/item/` 或 `scripts-zh-CN/item/` | `im` | 使用物品时触发 |
| 反应器脚本 | `scripts/reactor/` 或 `scripts-zh-CN/reactor/` | `rm` | 地图反应器交互 |
| 传送点脚本 | `scripts/portal/` 或 `scripts-zh-CN/portal/` | `pm` | 传送点交互 |

### 脚本文件加载优先级

系统会优先从语言文件夹加载脚本（如 `scripts-zh-CN/`），如果文件不存在则回退到 `scripts/` 目录。

---

## 脚本编写规范

### 通用规范

1. **文件编码**：必须使用 UTF-8 编码
2. **变量声明**：使用 `var` 声明脚本内部变量
3. **函数命名**：遵循小驼峰命名法
4. **注释风格**：使用 `//` 或 `/* */` 进行注释

### 脚本基础结构

```javascript
// 状态变量用于跟踪对话进度
var status;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode === -1) {
        // 对话关闭（玩家按 ESC 或关闭对话框）
        dispose();
        return;
    }
    
    if (mode === 0) {
        // 取消/返回操作
        if (type > 0) {
            dispose();
            return;
        }
        status--;
    } else {
        status++;
    }
    
    // 根据状态执行对应逻辑
    if (status === 0) {
        // 第一步对话
    } else if (status === 1) {
        // 第二步对话
    }
}

function dispose() {
    // 清理脚本资源
}
```

### mode 和 type 参数说明

| mode 值 | 含义 |
|---------|------|
| -1 | 对话关闭（ESC 或关闭） |
| 0 | 取消/返回按钮 |
| 1 | 确认/下一步按钮 |

| type 值 | 含义（取决于对话框类型） |
|---------|------------------------|
| 0 | OK 按钮 |
| 1 | 是/否按钮 |
| 4 | 选项列表 |

---

## 脚本API参考

### NPC 脚本 API (cm)

`cm` 对象是 `NPCConversationManager` 的实例，提供与玩家和游戏世界交互的所有方法。

#### 对话方法

| 方法 | 说明 |
|------|------|
| `cm.sendNext(text)` | 显示带"下一步"按钮的对话框 |
| `cm.sendPrev(text)` | 显示带"上一步"按钮的对话框 |
| `cm.sendNextPrev(text)` | 显示带"上一步"和"下一步"按钮的对话框 |
| `cm.sendOk(text)` | 显示只带"确定"按钮的对话框 |
| `cm.sendYesNo(text)` | 显示是/否对话框 |
| `cm.sendSimple(text)` | 显示选项列表对话框 |
| `cm.sendAcceptDecline(text)` | 显示接受/拒绝对话框 |
| `cm.sendGetNumber(text, def, min, max)` | 显示数字输入对话框 |
| `cm.sendGetText(text)` | 显示文本输入对话框 |
| `cm.sendStyle(text, styles)` | 显示造型选项对话框 |
| `cm.dispose()` | 关闭对话并清理资源 |

#### nextLevel 系列方法（新式路由）

新版本提供了更灵活的对话路由机制，可以自动调用指定方法：

```javascript
// 多个选项，选择后自动路由到 level + selection 方法
cm.sendSelectLevel(text);  // 选择后调用 level0, level1, level2...

// 带前缀的选项路由
cm.sendSelectLevel("prefix", text);  // 选择后调用 levelprefix0, levelprefix1...

// 接受/拒绝路由
cm.sendAcceptDeclineLevel("declineMethod", "acceptMethod", text);

// 是/否路由
cm.sendYesNoLevel("noMethod", "yesMethod", text);

// 获取输入数字后路由
cm.getInputNumberLevel("nextMethod", text, def, min, max);

// 获取输入文本后路由
cm.getInputTextLevel("nextMethod", text);
```

#### 玩家信息获取

| 方法 | 说明 |
|------|------|
| `cm.getPlayer()` | 获取当前玩家对象 |
| `cm.getNpc()` | 获取当前 NPC ID |
| `cm.getPlayer().getLevel()` | 获取玩家等级 |
| `cm.getPlayer().getMeso()` | 获取金币数量 |
| `cm.getPlayer().getJob()` | 获取职业 |
| `cm.getName()` | 获取玩家名称 |
| `cm.getGender()` | 获取玩家性别 (0=男, 1=女) |
| `cm.getMeso()` | 获取金币（快捷方法） |

#### 物品和金币操作

| 方法 | 说明 |
|------|------|
| `cm.gainMeso(amount)` | 增减金币 |
| `cm.gainItem(itemId, quantity)` | 增减物品 |
| `cm.gainExp(amount)` | 增减经验值 |
| `cm.hasItem(itemId)` | 检查是否拥有物品 |
| `cm.canHold(itemId, quantity)` | 检查背包是否有足够空间 |
| `cm.getItemQuantity(itemId)` | 获取物品数量 |

#### 任务操作

| 方法 | 说明 |
|------|------|
| `cm.startQuest(questId)` | 开始任务 |
| `cm.completeQuest(questId)` | 完成任务 |
| `cm.forceStartQuest(questId)` | 强制开始任务 |
| `cm.forceCompleteQuest(questId)` | 强制完成任务 |

#### 地图和传送

| 方法 | 说明 |
|------|------|
| `cm.warp(mapId)` | 传送到指定地图 |
| `cm.warpParty(mapId)` | 传送队伍成员 |
| `cm.resetMap(mapId)` | 重置地图（包括反应器） |
| `cm.getMapId()` | 获取当前地图 ID |

#### 队伍操作

| 方法 | 说明 |
|------|------|
| `cm.getParty()` | 获取队伍对象 |
| `cm.partyMembersInMap()` | 获取同地图队伍成员数 |
| `cm.getPlayerCount(mapId)` | 获取指定地图玩家数量 |

#### 其他常用方法

| 方法 | 说明 |
|------|------|
| `cm.changeJob(jobId)` | 变更职业 |
| `cm.setHair(hairId)` | 设置发型 |
| `cm.setFace(faceId)` | 设置脸型 |
| `cm.setSkin(colorId)` | 设置肤色 |
| `cm.openShop(shopId)` | 打开商店 |
| `cm.displayGuildRanks()` | 显示公会排名 |
| `cm.showEffect(effect)` | 显示特效 |
| `cm.getText()` | 获取玩家输入的文本 |
| `cm.itemQuantity(itemId)` | 获取物品数量（快捷方法） |

---

### 任务脚本 API (qm)

`qm` 是 `QuestActionManager` 的实例，继承自 `NPCConversationManager`，专门用于任务脚本。

#### 任务特定方法

| 方法 | 说明 |
|------|------|
| `qm.sendNext(text)` | 显示下一句对话 |
| `qm.forceStartQuest()` | 强制开始任务 |
| `qm.forceCompleteQuest()` | 强制完成任务 |
| `qm.startQuest()` | 开始任务（兼容性别名） |
| `qm.completeQuest()` | 完成任务（兼容性别名） |
| `qm.getQuest()` | 获取任务 ID |
| `qm.isStart()` | 是否为任务开始脚本 |
| `qm.getMedalName()` | 获取任务勋章名称（勋章任务） |
| `qm.dispose()` | 结束任务脚本 |

#### 任务脚本结构

任务脚本需要定义两个主要函数：

```javascript
var status = -1;

function start(mode, type, selection) {
    // 任务开始时的逻辑
    // mode=1, type=0, selection=0 表示正常启动
}

function end(mode, type, selection) {
    // 任务结束时的逻辑
    // mode=1, type=0, selection=0 表示正常完成
}
```

---

### 事件脚本 API (em/eim)

#### EventManager (em) 方法

`em` 是 `EventManager` 的实例，提供事件级别的方法。

| 方法 | 说明 |
|------|------|
| `em.getChannelServer()` | 获取频道服务器 |
| `em.getWorldServer()` | 获取世界服务器 |
| `em.getMonster(monsterId)` | 创建怪物对象 |
| `em.newInstance(name)` | 创建新的事件实例 |
| `em.setProperty(key, value)` | 设置事件属性 |
| `em.getProperty(key)` | 获取事件属性 |
| `em.schedule(methodName, delay)` | 调度方法执行 |
| `em.scheduleAtTimestamp(methodName, timestamp)` | 在指定时间调度 |
| `em.startInstance(party, map)` | 启动队伍事件实例 |
| `em.clearPQ(eim)` | 清除副本 |
| `em.getEligibleParty(party)` | 获取符合条件的队伍 |

#### EventInstanceManager (eim) 方法

`eim` 是事件实例管理器，提供实例级别的控制。

| 方法 | 说明 |
|------|------|
| `eim.getPlayerCount()` | 获取玩家数量 |
| `eim.getPlayers()` | 获取所有玩家列表 |
| `eim.getMapInstance(mapId)` | 获取事件专属地图 |
| `eim.registerPlayer(player)` | 注册玩家到事件 |
| `eim.unregisterPlayer(player)` | 取消注册玩家 |
| `eim.warpPlayer(player, mapId)` | 传送玩家 |
| `eim.warpEventTeam(mapId)` | 传送所有玩家 |
| `eim.startEventTimer(duration)` | 启动事件计时器 |
| `eim.stopEventTimer()` | 停止事件计时器 |
| `eim.setEventCleared()` | 标记事件完成 |
| `eim.isEventCleared()` | 检查事件是否完成 |
| `eim.getIntProperty(key)` | 获取整数属性 |
| `eim.setIntProperty(key, value)` | 设置整数属性 |
| `eim.getProperty(key)` | 获取属性 |
| `eim.setProperty(key, value)` | 设置属性 |
| `eim.dispose()` | 销毁事件实例 |
| `eim.broadcastPlayerEffect(player, effect)` | 播放玩家特效 |
| `eim.showEffect(effect)` | 显示地图特效 |

---

### 物品脚本 API (im)

`im` 是 `ItemScriptManager` 的实例，用于物品使用脚本。

| 方法 | 说明 |
|------|------|
| `im.getMapId()` | 获取当前地图 ID |
| `im.getPlayer()` | 获取使用物品的玩家 |
| `im.gainItem(itemId, quantity)` | 给予或移除物品 |
| `im.removeAll(itemId)` | 移除所有指定物品 |
| `im.isQuestStarted(questId)` | 检查任务是否已开始 |
| `im.isQuestCompleted(questId)` | 检查任务是否已完成 |
| `im.startQuest(questId)` | 开始任务 |
| `im.completeQuest(questId)` | 完成任务 |
| `im.showInfo(effect)` | 显示信息特效 |
| `im.dropMessage(type, message)` | 发送消息给玩家 |
| `im.dispose()` | 结束物品脚本 |

---

## 任务脚本示例

### 基础任务脚本

```javascript
/*
    任务脚本示例 - 获取物品后完成任务
*/

var status = -1;

function start(mode, type, selection) {
    if (mode === -1) {
        qm.dispose();
        return;
    }
    
    if (mode === 0 && type > 0) {
        qm.dispose();
        return;
    }
    
    if (mode === 1) {
        status++;
    } else {
        status--;
    }
    
    if (status === 0) {
        qm.sendNext("你好冒险家！我需要你帮我收集 #b10个黑檀木#k。");
    } else if (status === 1) {
        if (qm.isStart()) {
            // 检查物品
            if (qm.hasItem(4001001, 10)) {
                qm.sendNext("太好了！你已经收集够了黑檀木！");
            } else {
                qm.sendNext("你还需要 #b" + (10 - qm.getItemQuantity(4001001)) + "个#k 黑檀木。");
                qm.dispose();
            }
        } else {
            // 检查是否完成
            if (qm.hasItem(4001001, 10)) {
                qm.sendAcceptDecline("你带回了黑檀木！要交给我吗？");
            } else {
                qm.sendOk("当你收集够 #b10个黑檀木#k 后再来找我吧。");
                qm.dispose();
            }
        }
    } else if (status === 2) {
        if (qm.hasItem(4001001, 10)) {
            // 给予奖励并完成
            qm.gainItem(4001001, -10);  // 移除物品
            qm.gainExp(1000);           // 给予经验
            qm.gainMeso(5000);          // 给予金币
            qm.completeQuest();         // 完成任务
            qm.sendOk("谢谢你！这是你的奖励！");
        }
        qm.dispose();
    }
}

function end(mode, type, selection) {
    if (mode === -1) {
        qm.dispose();
        return;
    }
    
    if (mode === 0 && type > 0) {
        qm.dispose();
        return;
    }
    
    if (mode === 1) {
        status++;
    } else {
        status--;
    }
    
    if (status === 0) {
        if (qm.hasItem(4001001, 10)) {
            qm.gainItem(4001001, -10);
            qm.gainExp(1000);
            qm.gainMeso(5000);
            qm.forceCompleteQuest();
            qm.sendOk("任务完成！感谢你的帮助！");
        } else {
            qm.sendOk("你还没有收集够物品。");
        }
        qm.dispose();
    }
}
```

---

## 事件脚本示例

### 事件脚本结构

```javascript
/*
    副本事件示例
*/

// 事件配置变量
var isPq = true;                    // 是否为组队副本
var minPlayers = 1;                 // 最小玩家数
var maxPlayers = 6;                 // 最大玩家数
var minLevel = 10;                  // 最低等级
var maxLevel = 255;                 // 最高等级
var entryMap = 100000000;           // 入口地图
var exitMap = 100000000;            // 退出地图
var recruitMap = 100000000;         // 招募地图
var clearMap = 100000000;           // 完成地图
var eventTime = 30;                 // 事件时间（分钟）
var minMapId = 100000000;            // 事件地图范围（最小）
var maxMapId = 100000300;            // 事件地图范围（最大）

const maxLobbies = 1;               // 最大并发大厅数

function init() {
    // 初始化时调用
    setEventRequirements();
}

function getMaxLobbies() {
    return maxLobbies;
}

function setEventRequirements() {
    // 设置招募信息
    var reqStr = "";
    reqStr += "\r\n   组队人数: " + minPlayers + " ~ " + maxPlayers;
    reqStr += "\r\n   等级要求: " + minLevel + " ~ " + maxLevel;
    reqStr += "\r\n   时间限制: " + eventTime + " 分钟";
    em.setProperty("party", reqStr);
}

function setEventExclusives(eim) {
    // 设置事件专用物品（事件结束后会从背包移除）
    var itemSet = [4001001, 4001002];
    eim.setExclusiveItems(itemSet);
}

function setEventRandomRewards(eim) {
    // 设置随机奖励
    var itemSet = [1002000, 1002001];
    var itemQty = [1, 1];
    eim.setEventRandomRewards(1, itemSet, itemQty);
}

function getEligibleParty(party) {
    // 选择符合条件的队伍成员
    var eligible = [];
    if (party.size() > 0) {
        var partyList = party.toArray();
        for (var i = 0; i < party.size(); i++) {
            var ch = partyList[i];
            if (ch.getMapId() == recruitMap && 
                ch.getLevel() >= minLevel && 
                ch.getLevel() <= maxLevel) {
                eligible.push(ch);
            }
        }
    }
    return Java.to(eligible, Java.type('org.gms.net.server.world.PartyCharacter[]'));
}

function setup(eim, leaderid) {
    // 创建事件实例
    var eim = em.newInstance("MyPQ" + leaderid);
    
    // 初始化地图
    eim.getInstanceMap(entryMap).resetPQ(1);
    
    // 设置属性
    eim.setProperty("status", 0);
    
    // 启动计时器
    eim.startEventTimer(eventTime * 60000);
    
    // 设置奖励
    setEventRandomRewards(eim);
    setEventExclusives(eim);
    
    return eim;
}

function playerEntry(eim, player) {
    // 玩家进入事件
    var map = eim.getMapInstance(entryMap);
    player.changeMap(map, map.getPortal(0));
}

function playerExit(eim, player) {
    // 玩家退出事件
    player.changeMap(exitMap, 0);
    eim.unregisterPlayer(player);
}

function playerDead(eim, player) {
    // 玩家死亡时调用
}

function allMonstersDead(eim) {
    // 所有怪物被击杀后调用
    var status = eim.getIntProperty("status");
    if (status === 0) {
        eim.setIntProperty("status", 1);
        // 继续后续逻辑
    }
}

function timeOut(eim) {
    // 事件超时时调用
    var iter = eim.getPlayers().iterator();
    while (iter.hasNext()) {
        var player = iter.next();
        playerExit(eim, player);
    }
    eim.dispose();
}

function end(eim) {
    // 事件结束时调用
    var party = eim.getPlayers();
    for (var i = 0; i < party.size(); i++) {
        playerExit(eim, party.get(i));
    }
    eim.dispose();
}

function clearPQ(eim) {
    // 通关时调用
    eim.stopEventTimer();
    eim.setEventCleared();
}
```

---

## NPC脚本示例

### 基础NPC对话脚本

```javascript
/*
    NPC 对话脚本示例
*/

var status;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode === -1) {
        cm.dispose();
        return;
    }
    
    if (mode === 0 && type > 0) {
        cm.dispose();
        return;
    }
    
    if (mode === 1) {
        status++;
    } else {
        status--;
    }
    
    if (status === 0) {
        cm.sendSimple("欢迎来到冒险世界！\r\n#b#L0#查看商店#l\r\n#L1#查看任务#l\r\n#L2#离开#l");
    } else if (status === 1) {
        if (selection === 0) {
            cm.sendNext("我们这里有各种商品，请慢慢挑选。");
            cm.dispose();
        } else if (selection === 1) {
            cm.sendNext("目前有以下任务可用：\r\n#b- 收集黑檀木 (Lv.10)#k\r\n- 击败BOSS (Lv.30)");
            cm.dispose();
        } else {
            cm.sendOk("再见，祝你冒险愉快！");
            cm.dispose();
        }
    }
}
```

### 使用 nextLevel 路由的NPC脚本

```javascript
/*
    使用 nextLevel 路由的 NPC 脚本示例
*/

function start() {
    cm.sendSelectLevel("mainMenu", "欢迎来到服务台！请选择服务类型：\r\n#b#L0#购买物品#l\r\n#L1#出售物品#l\r\n#L2#仓库服务#l");
}

function levelmainMenu(selection) {
    switch (selection) {
        case 0:
            cm.sendNextLevel("buyItem", "请选择要购买的物品分类：\r\n#b#L0#武器#l\r\n#L1#防具#l\r\n#L2#药水#l");
            break;
        case 1:
            cm.sendNextLevel("sellItem", "请选择要出售的物品：");
            break;
        case 2:
            cm.sendNextLevel("storage", "仓库服务请找旁边的仓库管理员。");
            break;
    }
}

function levelbuyItem(selection) {
    if (selection === 0) {
        cm.openShop(10000);
    } else if (selection === 1) {
        cm.openShop(10001);
    } else {
        cm.openShop(10002);
    }
    cm.dispose();
}

function levelsellItem(selection) {
    cm.dispose();
}

function levelstorage(selection) {
    cm.dispose();
}
```

---

## 物品脚本示例

```javascript
/*
    物品使用脚本示例
*/

function start() {
    if (im.getMapId() === 100000000) {
        var portal = im.getMap().getPortal("portalName");
        if (portal !== null && portal.getPosition().distance(im.getPlayer().getPosition()) < 100) {
            // 检查任务状态
            if (!im.isQuestStarted(1000)) {
                im.startQuest(1000);
            }
            // 移除物品
            im.removeAll(4001001);
            // 显示特效
            im.showEffect("Effect/Direction.img/mushroomcastle/chatBalloon2");
            // 发送消息
            im.dropMessage(6, "成功消除障碍！");
        } else {
            im.dropMessage(6, "请靠近传送门再试。");
        }
    } else {
        im.dropMessage(6, "这里没有可以使用的机关。");
    }
    im.dispose();
}
```

---

## 调试技巧

### 1. 使用日志输出

在脚本中可以使用以下方式进行调试：

```javascript
// 输出消息到服务器控制台
print("Debug: variable = " + variable);

// 在脚本开头添加调试信息
print("Script started, NPC: " + cm.getNpc());
```

### 2. 常见错误处理

```javascript
function action(mode, type, selection) {
    try {
        // 可能会出错的代码
        if (cm.getPlayer() === null) {
            print("Error: Player is null");
            cm.dispose();
            return;
        }
        // 正常逻辑
    } catch (e) {
        print("Error in action: " + e);
        cm.dispose();
    }
}
```

### 3. 检查脚本加载

如果 NPC 显示 "NPC xxx is uncoded"，检查：
- 脚本文件是否存在于正确目录
- 文件名是否与 NPC ID 匹配
- JavaScript 语法是否正确

### 4. 使用测试命令

服务器提供了 GM 命令来测试脚本：
- `@reloadevents` - 重新加载所有事件脚本
- `@reNPC <npcId>` - 重新加载指定 NPC 脚本

### 5. 逐步调试对话状态

```javascript
var status;

function start() {
    status = -1;
    print("Start: Initializing");
    action(1, 0, 0);
}

function action(mode, type, selection) {
    print("Action called: mode=" + mode + ", type=" + type + ", selection=" + selection + ", status=" + status);
    
    if (mode === -1) {
        print("Dialog closed");
        cm.dispose();
        return;
    }
    
    if (mode === 0) {
        print("Cancel/Back pressed");
        if (type > 0) {
            print("Closing dialog");
            cm.dispose();
            return;
        }
        status--;
    } else {
        print("Confirm/Next pressed");
        status++;
    }
    
    print("New status: " + status);
    
    // ... 后续逻辑
}
```

---

## 常见问题

### Q: 脚本不生效怎么办？

1. 确认脚本文件放置在正确目录
2. 检查文件名是否正确（NPC ID.js 或自定义名称.js）
3. 重启服务器或使用 `@reloadevents` 命令
4. 查看服务器日志中的错误信息

### Q: 如何创建自定义 NPC 脚本？

1. 在 `scripts/npc/` 或 `scripts-zh-CN/npc/` 目录创建 JS 文件
2. 文件名可以是 NPC ID 或自定义名称
3. 在 NPC 对话管理器中调用时指定脚本名称

### Q: 如何让任务脚本更复杂？

使用状态机模式管理对话流程：

```javascript
var status;
var questProgress = 0;  // 自定义进度变量

function start(mode, type, selection) {
    // 根据任务状态调整行为
    if (qm.isStart()) {
        questProgress = 1;
    }
    // ... 根据 progress 执行不同逻辑
}
```

### Q: 事件实例是什么？

事件实例（EventInstance）是一个独立于主游戏世界的副本空间。每个参与事件的玩家会被传送到专属的地图实例中，互不干扰。事件实例在所有玩家退出或事件结束后会被销毁。

### Q: 如何访问 Java 类？

在脚本中可以使用 `Java.type()` 访问 Java 类：

```javascript
// 导入 Java 类
var ArrayList = Java.type('java.util.ArrayList');
var HashMap = Java.type('java.util.HashMap');

// 使用 Java 类
var list = new ArrayList();
list.add("item");
```

### Q: 脚本中有中文字符显示乱码怎么办？

确保脚本文件使用 UTF-8 编码保存。如果在 Windows 环境下创建文件，可以使用专业的文本编辑器（如 VS Code、Notepad++）设置编码为 UTF-8。

---

## 参考资料

- NPC 脚本基础模板：`scripts/NPC Base.js`
- 任务脚本基础模板：`scripts/QUEST Base.js`
- 事件脚本示例：`scripts/event/0_EXAMPLE.js`
- 物品脚本示例：`scripts/item/` 目录下的文件

如需更多帮助，请参考项目中的示例脚本或联系开发团队。
