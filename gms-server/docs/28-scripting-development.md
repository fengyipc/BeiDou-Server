# 脚本开发指南

本文档介绍 MapleStory 模拟器中的脚本开发指南，包括脚本类型、API 参考、编写规范、调试技巧和最佳实践。

## 目录

- [脚本类型概述](#1-脚本类型概述)
- [脚本编写规范](#2-脚本编写规范)
- [NPC 脚本 API](#3-npc-脚本-api)
- [NextLevel 无状态脚本框架](#4-nextlevel-无状态脚本框架)
- [任务脚本 API](#5-任务脚本-api)
- [事件脚本 API](#6-事件脚本-api)
- [物品脚本 API](#7-物品脚本-api)
- [脚本示例](#8-脚本示例)
- [调试技巧](#9-调试技巧)
- [最佳实践](#10-最佳实践)
- [常见问题](#11-常见问题)

---

## 1. 脚本类型概述

### 1.1 脚本引擎

本服务器使用 **GraalJS**（基于 GraalVM 的 JavaScript 引擎）执行脚本。GraalJS 提供了与 Java 的无缝集成，允许脚本调用 Java 类和方法。

### 1.2 如何查找 NPC ID

打开服务端 `resources` 的 `application.yml`，找到 `USE_DEBUG`，设定为 `true` 即可在点击 NPC 的时候在聊天框看到 NPC ID。

### 1.3 脚本类型

| 类型 | 文件位置 | 注入变量 | 说明 |
|------|----------|----------|------|
| NPC 脚本 | `scripts/npc/` 或 `scripts-zh-CN/npc/` | `cm` | 与 NPC 对话交互 |
| 任务脚本 | `scripts/quest/` 或 `scripts-zh-CN/quest/` | `qm` | 任务开始/完成逻辑 |
| 事件脚本 | `scripts/event/` 或 `scripts-zh-CN/event/` | `em`, `eim` | 副本、PQ 等事件 |
| 物品脚本 | `scripts/item/` 或 `scripts-zh-CN/item/` | `im` | 使用物品时触发 |
| 反应器脚本 | `scripts/reactor/` 或 `scripts-zh-CN/reactor/` | `rm` | 地图反应器交互 |
| 传送点脚本 | `scripts/portal/` 或 `scripts-zh-CN/portal/` | `pm` | 传送点交互 |

### 1.4 脚本文件加载优先级

系统会优先从语言文件夹加载脚本（如 `scripts-zh-CN/`），如果文件不存在则回退到 `scripts/` 目录。

---

## 2. 脚本编写规范

### 2.1 通用规范

1. **文件编码**：必须使用 UTF-8 编码
2. **ES6 语法**：GraalVM JS 支持 ES6 语法，**新增脚本请使用 `let`/`const`**，不再使用 `var`
3. **函数命名**：遵循小驼峰命名法
4. **注释风格**：使用 `//` 或 `/* */` 进行注释

### 2.2 脚本基础结构

```javascript
// 状态变量用于跟踪对话进度
let status;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (CheckStatus(mode)) {
        // 根据状态执行对应逻辑
        if (status === 0) {
            // 第一步对话
        } else if (status === 1) {
            // 第二步对话
        } else {
            // 最后一层对话完继续循环至此，退出结束
            cm.dispose();
        }
    }
}

// 状态检查函数（推荐使用）
function CheckStatus(mode) {
    if (mode == -1) {
        cm.dispose(); // 点击了取消，停止，结束
        return false;
    }

    if (mode == 1) {
        status++;
    } else {
        status--;
    }

    if (status == -1) {
        cm.dispose(); // 防止第一层对话带有上一项或者取消按钮而产生bug
        return false;
    }
    return true;
}
```

### 2.3 对话方法返回值

所有对话方法都有返回值，可用于判断玩家操作：

| 方法 | 返回值说明 |
|------|-----------|
| `sendYesNo(str)` | 是=1, 否=0, 结束=-1 |
| `sendNext(str)` | 下一项=1, 结束=-1 |
| `sendPrev(str)` | 上一项=0, 结束=-1 |
| `sendOk(str)` | 确定=1, 结束=-1 |
| `sendNextPrev(str)` | 上一项=0, 下一项=1, 停止=-1 |
| `sendAcceptDecline(str)` | 接受=1, 拒绝=0, 结束=-1 |
| `sendSimple(str)` | 选择=选择的索引, 结束=0 |
| `sendStyle(str, styles)` | 确定=1, 取消=0, 结束=-1 |
| `sendGetNumber(str, def, min, max)` | 确定=1, 结束=0 |
| `sendGetText(str)` | 确定=1, 结束=0 |

### 2.3 mode 和 type 参数说明

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

### 2.4 文件命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| NPC 脚本 | `{NPCID}.js` 或自定义名称 | `10200.js`, `tutorial.js` |
| 事件脚本 | `{EventName}.js` | `HorntailPQ.js` |
| 物品脚本 | `{ItemID}.js` | `123456.js` |
| 任务脚本 | `{QuestID}.js` | `1000.js` |
| 传送门脚本 | `{PortalName}.js` | `out00.js` |

---

## 3. NPC 脚本 API

`cm` 对象是 `NPCConversationManager` 的实例，提供与玩家和游戏世界交互的所有方法。

### 3.1 对话方法

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

### 3.2 nextLevel 系列方法（新式路由）

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

### 3.3 玩家信息获取

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

### 3.4 物品和金币操作

| 方法 | 说明 |
|------|------|
| `cm.gainMeso(amount)` | 增减金币 |
| `cm.gainItem(itemId, quantity)` | 增减物品 |
| `cm.gainExp(amount)` | 增减经验值 |
| `cm.hasItem(itemId)` | 检查是否拥有物品 |
| `cm.canHold(itemId, quantity)` | 检查背包是否有足够空间 |
| `cm.getItemQuantity(itemId)` | 获取物品数量 |

### 3.5 任务操作

| 方法 | 说明 |
|------|------|
| `cm.startQuest(questId)` | 开始任务 |
| `cm.completeQuest(questId)` | 完成任务 |
| `cm.forceStartQuest(questId)` | 强制开始任务 |
| `cm.forceCompleteQuest(questId)` | 强制完成任务 |

### 3.6 地图和传送

| 方法 | 说明 |
|------|------|
| `cm.warp(mapId)` | 传送到指定地图 |
| `cm.warpParty(mapId)` | 传送队伍成员 |
| `cm.resetMap(mapId)` | 重置地图（包括反应器） |
| `cm.getMapId()` | 获取当前地图 ID |

### 3.7 队伍操作

| 方法 | 说明 |
|------|------|
| `cm.getParty()` | 获取队伍对象 |
| `cm.partyMembersInMap()` | 获取同地图队伍成员数 |
| `cm.getPlayerCount(mapId)` | 获取指定地图玩家数量 |

### 3.8 其他常用方法

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

### 3.9 NPC 脚本标记符

在 NPC 对话文本中可以使用以下标记符来格式化显示：

| 标记 | 说明 | 示例 |
|------|------|------|
| `#b` | 蓝色文字 | `#b珠子#k` |
| `#r` | 红色文字 | `#r珠子#k` |
| `#d` | 紫色文字 | `#d珠子#k` |
| `#g` | 绿色文字 | `#g珠子#k` |
| `#k` | 黑色文字（默认） | `#g珠子#k` |
| `#e` | 加粗文字 | `#e珠子#n` |
| `#n` | 常规格式（取消加粗） | `#e珠子#n` |
| `#h #` | 玩家名称 | `您好，#h #` |
| `#L[数字]#` | 选项开始 | `#L0# 冰雷 #l` |
| `#l` | 选项结束 | `#L0# 冰雷 #l` |
| `#o[怪物id]#` | 怪物名称显示 | `#o[100100]#` |
| `#m[地图id]#` | 地图名称显示 | `#m[100000000]#` |
| `#p[npcid]#` | NPC名称显示 | `#p[1002000]#` |
| `#q[技能id]#` | 技能名称显示 | `#q[1001]#` |
| `#s[技能id]#` | 技能图片显示 | `#s[1001]#` |
| `#c[物品id]#` | 物品数量显示 | `#c[2430033]#` |
| `#t[物品id]#` | 物品名称显示 | `#t[2430033]#` |
| `#z[物品id]#` | 物品名称显示（与 #t 相同） | `#z[2430033]#` |
| `#i[物品id]#` | 物品图标显示 | `#i[2430033]#` |
| `#v[物品id]#` | 物品图标显示（与 #i 相同） | `#v[2430033]#` |
| `#B[百分比]#` | 进度条显示 | `#B[50%]#` |
| `#f[文件路径]#` | 引用图片文件 | `#fUI/UIWindow.img/QuestIcon/4/0#` |
| `#F[文件路径]#` | 引用图片文件 | `#FUI/UIWindow.img/QuestIcon/8/0#` |
| `\r\n` | 换行符 | `第一行\r\n第二行` |

### 3.10 物品检查方法

| 方法 | 说明 |
|------|------|
| `cm.itemExists(itemId)` | 检查物品是否存在 |
| `cm.hasItem(itemId, quantity)` | 检查是否拥有指定数量物品 |
| `cm.canHold(itemId, quantity)` | 检查背包是否有足够空间放置物品 |

---

## 4. NextLevel 无状态脚本框架

### 4.1 框架介绍

北斗 NextLevel 框架是北斗私服独有的无状态脚本解决方案。传统的**有状态脚本**需要定义 `status` 变量来跟踪对话进度，复杂脚本嵌套严重，让新手望而生畏。

NextLevel 框架**剔除了层级的概念**，让脚本更加线性化、直观。你只需要考虑：
- **上一步是什么**
- **下一步该做什么**

框架内部会自动处理上下文，让你专注于当前逻辑。

### 4.2 框架特点

- **无状态**：无需定义 `status` 变量
- **线性化**：脚本像流水线一样从上往下执行
- **自动路由**：通过方法名自动跳转到对应处理函数
- **互不影响**：与原有框架共存，可自由选择使用

### 4.3 开发思路对比

**有状态脚本**（传统方式）：
```
start() → action(status=0) → 判断status → 执行逻辑 → 等待用户操作
                             ↓
                         action(status=1) → 判断status → 执行逻辑
```

**NextLevel 框架**（无状态）：
```
level0() → 调用 sendNextLevel → 自动跳转到 levelXxx()
  ↓
levelXxx() → 调用 sendOkLevel → 自动跳转或结束
```

### 4.4 方法前缀约定

NextLevel 框架约定以 `level` 前缀的方法作为对话处理函数：

| 方法名模式 | 触发方式 |
|------------|----------|
| `level0()`, `level1()`... | `sendSelectLevel` 选择后自动调用 |
| `levelXxx(inputNum)` | `getInputNumberLevel` 输入数字后自动调用（参数为输入值） |
| `levelXxx(inputText)` | `getInputTextLevel` 输入文本后自动调用（参数为输入值） |

### 4.5 sendNextLevel - 只有下一步

点击"下一步"按钮后自动调用指定方法：

```javascript
function start() {
    cm.sendNextLevel("level1", "这是一个只有下一步的对话");
}

function level1() {
    cm.sendOk("欢迎来到下一步！");
}

function levelOk() {
    cm.dispose();
}
```

### 4.6 sendLastLevel - 只有上一步

点击"上一步"按钮后自动调用指定方法：

```javascript
function level1() {
    // 点击上一步会返回 level0
    cm.sendLastLevel("level0", "这是一个只有上一步的对话");
}

function level0() {
    cm.dispose();
}
```

### 4.7 sendLastNextLevel - 上一步和下一步

同时提供"上一步"和"下一步"按钮：

```javascript
function level1() {
    // 点击上一步→level0，点击下一步→level2
    cm.sendLastNextLevel("level0", "level2", "请选择上一步或下一步");
}

function level0() {
    cm.sendOk("你点了上一步");
    cm.dispose();
}

function level2() {
    cm.sendOk("你点了下一步");
    cm.dispose();
}
```

### 4.8 sendOkLevel - 确定按钮

只有"确定"按钮的对话框：

```javascript
function start() {
    cm.sendOkLevel("levelEnd", "这是一个只有确定按钮的对话框");
}

function levelEnd() {
    cm.dispose();
}
```

### 4.9 sendSelectLevel - 选项选择

多个选项，选择后自动路由到 `level + 数字` 对应的方法：

```javascript
function start() {
    // 选择0→level0，选择1→level1
    cm.sendSelectLevel("#L0#购买物品#l\r\n#L1#出售物品#l\r\n#L2#离开#l");
}

function level0() {
    cm.sendOk("你选择了购买物品");
    cm.dispose();
}

function level1() {
    cm.sendOk("你选择了出售物品");
    cm.dispose();
}

function level2() {
    cm.sendOk("欢迎下次光临");
    cm.dispose();
}
```

**带前缀的选项**（用于脚本中有多个选择场景）：

```javascript
function start() {
    cm.sendSelectLevel("Main", "#L0#购买#l\r\n#L1#出售#l");
}

function levelMain0() {
    cm.sendSelectLevel("Buy", "#L0#武器#l\r\n#L1#防具#l");
}

function levelMain1() {
    cm.dispose();
}

function levelBuy0() {
    cm.dispose();
}

function levelBuy1() {
    cm.dispose();
}
```

### 4.10 getInputNumberLevel - 数字输入

玩家输入数字后自动调用指定方法，并将输入值作为参数传入：

```javascript
function start() {
    cm.getInputNumberLevel("levelResult", "请输入一个数字", 0, 0, 99);
}

function levelResult(inputNum) {
    cm.sendOk("你输入的数字是：" + inputNum);
    cm.dispose();
}
```

### 4.11 getInputTextLevel - 文本输入

玩家输入文本后自动调用指定方法，并将输入值作为参数传入：

```javascript
function start() {
    cm.getInputTextLevel("levelResult", "请输入你的名字");
}

function levelResult(inputText) {
    cm.sendOk("你输入的名字是：" + inputText);
    cm.dispose();
}
```

### 4.12 sendAcceptDeclineLevel - 接受/拒绝

有"接受"和"拒绝"两个选项：

```javascript
function start() {
    cm.sendAcceptDeclineLevel("levelRefuse", "levelAccept", "是否接受任务？");
}

function levelRefuse() {
    cm.sendOk("你拒绝了任务");
    cm.dispose();
}

function levelAccept() {
    cm.sendOk("你接受了任务！");
    cm.dispose();
}
```

### 4.13 sendYesNoLevel - 是/否

有"是"和"否"两个选项：

```javascript
function start() {
    cm.sendYesNoLevel("levelNo", "levelYes", "是否确认？");
}

function levelNo() {
    cm.sendOk("你点了否");
    cm.dispose();
}

function levelYes() {
    cm.sendOk("你点了是");
    cm.dispose();
}
```

### 4.14 完整示例

**有状态脚本示例**：`scripts-zh-CN/BeiDouSpecial/Example1.js`
**NextLevel 脚本示例**：`scripts-zh-CN/BeiDouSpecial/Example2.js`

**对比示例**：
- 原版汉斯脚本：`scripts-zh-CN/npc/1032001.js`
- NextLevel 改造版：`scripts-zh-CN/npc/1032001_nextLevel.js`

---

## 5. 任务脚本 API

官方客户端任务对话数据在 WZ 的 `Say.img` 中；本服务端通过本节所述脚本实现对话与流程。WZ 四文件结构与任务 ID 关系见 [27-wz-data-parsing.md · §8 Quest.wz](27-wz-data-parsing.md#quest-wz-data)。

`qm` 是 `QuestActionManager` 的实例，继承自 `NPCConversationManager`，专门用于任务脚本。

### 4.1 任务特定方法

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

### 4.2 任务脚本结构

任务脚本需要定义两个主要函数：

```javascript
let status = -1;

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

## 6. 事件脚本 API

### 5.1 EventManager (em) 方法

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

### 5.2 EventInstanceManager (eim) 方法

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

### 5.3 事件脚本生命周期函数

| 函数 | 调用时机 |
|------|----------|
| `init()` | 初始化事件数据 |
| `setup(eim, leaderid)` | 创建事件实例 |
| `playerEntry(eim, player)` | 玩家进入事件 |
| `playerExit(eim, player)` | 玩家退出事件 |
| `playerDead(eim, player)` | 玩家死亡时 |
| `monsterKilled(mob, eim)` | 怪物死亡时 |
| `allMonstersDead(eim)` | 所有怪物死亡时 |
| `timeOut(eim)` | 事件超时时 |
| `end(eim)` | 事件结束时 |
| `clearPQ(eim)` | 通关时 |

---

## 7. 物品脚本 API

`im` 是 `ItemScriptManager` 的实例，用于物品使用脚本。

### 6.1 物品脚本配置

物品脚本需要在 WZ 文件中配置，物品属性说明：
- `tradeBlock = 1`：不可交换
- `slotMax = 99`：最大堆放数量
- `price`：出售价格
- `script`：要调用的脚本名称（需要与服务端 xml 相符）
- `npc`：呼唤哪个 NPC 进行脚本

### 6.2 物品脚本方法

| 方法 | 说明 |
|------|------|
| `im.getMapId()` | 获取当前地图 ID |
| `im.getPlayer()` | 获取使用物品的玩家 |
| `im.haveItem(itemId)` | 检查是否拥有物品（数量>0） |
| `im.haveItem(itemId, quantity)` | 检查是否拥有指定数量物品 |
| `im.gainItem(itemId, quantity)` | 给予或移除物品（正数给，负数扣） |
| `im.gainMeso(amount)` | 给予或扣除金币 |
| `im.removeAll(itemId)` | 移除所有指定物品 |
| `im.isQuestStarted(questId)` | 检查任务是否已开始 |
| `im.isQuestCompleted(questId)` | 检查任务是否已完成 |
| `im.startQuest(questId)` | 开始任务 |
| `im.completeQuest(questId)` | 完成任务 |
| `im.showInfo(effect)` | 显示信息特效 |
| `im.dropMessage(type, message)` | 发送消息给玩家 |
| `im.getMap()` | 获取当前地图对象 |
| `im.dispose()` | 结束物品脚本 |

### 6.3 物品脚本示例

```javascript
let status = -1;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (CheckStatus(mode)) {
        if (status == 0) {
            // 检查是否拥有7个北斗之星
            if (im.haveItem(2430033, 7)) {
                im.gainMeso(1000000);  // 给予100万金币
                im.gainItem(2430033, -7);  // 扣除7个北斗之星
                im.sendOk("这是赏你的，拿去吧.");
                im.dispose();
            } else {
                im.sendOk("请搜集7个以后再使用吧.");
                im.dispose();
            }
        } else {
            im.dispose();
        }
    }
}

function CheckStatus(mode) {
    if (mode == -1) {
        im.dispose();
        return false;
    }

    if (mode == 1) {
        status++;
    } else {
        status--;
    }

    if (status == -1) {
        im.dispose();
        return false;
    }
    return true;
}
```

---

## 8. 脚本示例

### 7.1 NPC 脚本 - 使用 nextLevel 路由

```javascript
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

### 7.2 任务脚本

```javascript
let status = -1;

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
        if (qm.hasItem(4001001, 10)) {
            qm.gainItem(4001001, -10);
            qm.gainExp(1000);
            qm.gainMeso(5000);
            qm.completeQuest();
            qm.sendOk("谢谢你！这是你的奖励！");
        } else {
            qm.sendOk("你还需要 #b" + (10 - qm.getItemQuantity(4001001)) + "个#k 黑檀木。");
        }
        qm.dispose();
    }
}

function end(mode, type, selection) {
    start(mode, type, selection);
}
```

### 7.3 组队副本事件

```javascript
const isPq = true;
const minPlayers = 3;
const maxPlayers = 6;
const minLevel = 50;
const maxLevel = 200;
const entryMap = 920010000;
const exitMap = 920010100;
const clearMap = 920010200;
const eventTime = 30;  // 分钟

function setup(eim) {
    const prop = em.newInstance("AriantPQ");
    prop.setProperty("stage", 0);
    return prop;
}

function playerEntry(eim, player) {
    player.warp(entryMap);
}

function monsterKilled(mob, eim) {
    const stage = parseInt(eim.getProperty("stage"));
    eim.setProperty("stage", stage + 1);
}

function allMonstersDead(eim) {
    const stage = parseInt(eim.getProperty("stage"));
    if (stage >= 10) {
        eim.clearPQ();
    } else {
        eim.warpAllPlayer(920010000 + stage);
    }
}

function clearPQ(eim) {
    const party = eim.getPlayers();
    for (let i = 0; i < party.size(); i++) {
        party.get(i).warp(clearMap);
    }
    eim.dispose();
}

function timeOut(eim) {
    eim.warpAllPlayer(exitMap);
    eim.dispose();
}
```

### 7.4 物品脚本

```javascript
function start() {
    if (im.getMapId() === 100000000) {
        const portal = im.getMap().getPortal("portalName");
        if (portal !== null && portal.getPosition().distance(im.getPlayer().getPosition()) < 100) {
            if (!im.isQuestStarted(1000)) {
                im.startQuest(1000);
            }
            im.removeAll(4001001);
            im.showEffect("Effect/Direction.img/mushroomcastle/chatBalloon2");
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

## 9. 调试技巧

### 8.1 使用日志输出

```javascript
// 输出消息到服务器控制台
print("Debug: variable = " + variable);

// 在脚本开头添加调试信息
print("Script started, NPC: " + cm.getNpc());
```

### 8.2 常见错误处理

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

### 8.3 检查脚本加载

如果 NPC 显示 "NPC xxx is uncoded"，检查：
- 脚本文件是否存在于正确目录
- 文件名是否与 NPC ID 匹配
- JavaScript 语法是否正确

### 8.4 使用测试命令

服务器提供了 GM 命令来测试脚本：
- `@reloadevents` - 重新加载所有事件脚本
- `@reNPC <npcId>` - 重新加载指定 NPC 脚本

### 8.5 逐步调试对话状态

```javascript
let status;

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

## 10. 最佳实践

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
let status = 0;
let selections = [];

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

### 9.4 ES6 语法建议

GraalVM JS 支持 ES6 语法，**新增或重构脚本时建议使用**：

| ES5 (已废弃) | ES6 (推荐) | 说明 |
|--------------|-----------|------|
| `var` | `let` / `const` | `const` 用于不变的值，`let` 用于可重新赋值的变量 |
| `var arr = []` | `const arr = []` | 数组字面量 |
| `var obj = {}` | `const obj = {}` | 对象字面量 |
| `function() {}` | `() => {}` | 箭头函数（注意 `this` 绑定） |
| `ArrayList` 手动导入 | 使用 `let` 替代 `var` | 保持一致性 |

**示例对比**：

```javascript
// ❌ 不推荐（使用 var）
var status = 0;
var items = [];
var player = cm.getPlayer();

// ✅ 推荐（使用 const/let）
const status = 0;
const items = [];
const player = cm.getPlayer();
```

**注意**：箭头函数中 `this` 的行为与普通函数不同，在需要访问外部作用域的 `this` 时请慎用。

---

## 11. 常见问题

### Q: 脚本不生效怎么办？

1. 确认脚本文件放置在正确目录
2. 检查文件名是否正确（NPC ID.js 或自定义名称.js）
3. 重启服务器或使用 `@reloadevents` 命令
4. 查看服务器日志中的错误信息

### Q: 如何创建自定义 NPC 脚本？

1. 在 `scripts/npc/` 或 `scripts-zh-CN/npc/` 目录创建 JS 文件
2. 文件名可以是 NPC ID 或自定义名称
3. 在 NPC 对话管理器中调用时指定脚本名称

### Q: 事件实例是什么？

事件实例（EventInstance）是一个独立于主游戏世界的副本空间。每个参与事件的玩家会被传送到专属的地图实例中，互不干扰。事件实例在所有玩家退出或事件结束后会被销毁。

### Q: 如何访问 Java 类？

在脚本中可以使用 `Java.type()` 访问 Java 类：

```javascript
// 导入 Java 类
const ArrayList = Java.type('java.util.ArrayList');
const HashMap = Java.type('java.util.HashMap');

// 使用 Java 类
const list = new ArrayList();
list.add("item");
```

### Q: 脚本中有中文字符显示乱码怎么办？

确保脚本文件使用 UTF-8 编码保存。如果在 Windows 环境下创建文件，可以使用专业的文本编辑器（如 VS Code、Notepad++）设置编码为 UTF-8。

### Q: 如何获取代码提示和自动补全？

将类型定义文件 `index.d.ts` 置于 `gms-server/scripts(-zh-CN)` 目录下，方便编辑器提供代码提示。

**WebStorm 类型断言示例**：

```javascript
/** @type {MapId} */
const mapConstants = Java.type('org.gms.constants.id.MapId');
// mapConstants. 可以推导出很多地图名
if (cm.getMapId() == mapConstants.FM_ENTRANCE) {
    cm.sendOk("当前地图是自由市场");
}
```

### Q: 脚本执行后卡住怎么办？

如果脚本执行后卡住，大多是因为没有正确结束循环。请检查：

1. 是否正确调用了 `dispose()` 方法
2. `CheckStatus` 函数是否正确处理了所有分支
3. 是否在所有代码路径上都调用了 `dispose()`

---

## 参考资料

- NPC 脚本基础模板：`scripts/NPC Base.js`
- 任务脚本基础模板：`scripts/QUEST Base.js`
- 事件脚本示例：`scripts/event/0_EXAMPLE.js`
- 物品脚本示例：`scripts/item/` 目录下的文件
- [北斗基础脚本教程](https://github.com/BeiDouMS/BeiDou-Server/wiki/%E5%8C%96%E6%96%97%E5%9F%BA%E7%A1%80%E8%84%9A%E6%9C%AC%E6%95%99%E7%A8%8B) - Wiki 基础教程

---

*文档版本: 3.1（全面支持 ES6 语法）*
*最后更新: 2026-03-27*
