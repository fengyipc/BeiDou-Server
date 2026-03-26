# 管理后台说明

## 1. 概述

BeiDou-Server 管理后台是游戏服务器的核心管理模块，为游戏管理员（GM）提供完整的服务器管理、玩家管理和运营工具支持。本模块基于命令行交互方式，通过游戏内命令（GM Commands）实现所有管理功能。

### 1.1 模块架构

```
┌─────────────────────────────────────────────────────────────┐
│                    管理后台模块架构                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │               AdminCommandHandler                    │   │
│  │               (管理命令处理器)                        │   │
│  │  - 角色管理    - 地图管理    - 物品管理              │   │
│  │  - 怪物管理    - 服务器配置  - 传送管理              │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               AdminChatHandler                       │   │
│  │               (全服广播处理器)                        │   │
│  │  - 全服公告    - 频道公告    - 地图公告              │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               AdminLogHandler                        │   │
│  │               (管理日志处理器)                        │   │
│  │  - 操作记录    - 聊天日志    - 异常追踪              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心处理器

| 处理器 | 文件路径 | 功能描述 |
|--------|----------|----------|
| `AdminCommandHandler` | `org.gms.net.server.channel.handlers.AdminCommandHandler` | 处理所有 GM 管理命令 |
| `AdminChatHandler` | `org.gms.net.server.channel.handlers.AdminChatHandler` | 处理全服广播和公告 |
| `AdminLogHandler` | `org.gms.net.server.channel.handlers.AdminLogHandler` | 记录管理员操作日志 |

### 1.3 GM 权限等级

| 等级 | 名称 | 描述 | 可用命令范围 |
|------|------|------|--------------|
| 0 | 普通玩家 | 可使用基础玩家命令 | `@` 前缀命令 |
| 1 | 初级 GM | 可使用初级管理命令 | 基础查询、传送 |
| 2 | GM | 可使用中级管理命令 | 角色管理、物品生成 |
| 3 | 高级 GM | 可使用高级管理命令 | 玩家管理、事件控制 |
| 4 | 管理员 | 可使用服务器配置命令 | 倍率调整、Boss 召唤 |
| 5 | 开发者 | 可使用调试命令 | 系统调试、数据包分析 |
| 6 | 系统管理员 | 可使用所有命令 | 服务器关机、数据管理 |

---

## 2. 功能模块介绍

### 2.1 模块总览

管理后台包含以下核心功能模块：

- **用户管理** - 账号封禁、权限设置、在线用户监控
- **角色管理** - 属性调整、状态管理、背包操作
- **服务器管理** - 开关服、倍率配置、频道管理
- **日志查看** - 操作日志、聊天日志、错误追踪
- **数据统计** - 在线人数、服务器负载、活动参与
- **运营工具** - 全服公告、活动管理、补偿发放

---

## 3. 用户管理

### 3.1 账号封禁

使用封禁命令管理违规玩家：

```bash
!ban <玩家名称> <原因>        # 永久封禁玩家
!unban <玩家名称>             # 解封玩家
!block <玩家名称> <天数> <类型> # 临时封禁
```

**封禁类型：**

| 类型代码 | 含义 |
|----------|------|
| HACK | 使用外挂 |
| BOT | 机器人脚本 |
| AD | 广告推广 |
| HARASS | 骚扰其他玩家 |
| CURSE | 恶意诅咒 |
| SCAM | 诈骗 |
| MISCONDUCT | 不当行为 |
| SELL | 非法交易 |
| ICASH | 点券违规 |
| TEMP | 临时封禁 |
| GM | 管理员处罚 |
| IPROGRAM | 非法程序 |

### 3.2 GM 权限管理

设置玩家 GM 等级：

```bash
!setgmlevel <玩家名称> <等级>  # 设置 GM 等级
```

### 3.3 在线用户监控

```bash
@online                      # 查看当前在线玩家列表
!online2                     # 查看详细在线玩家信息
!monitor <玩家名称>           # 监控指定玩家
!monitors                    # 查看当前被监控的玩家列表
!iplist                      # 显示玩家 IP 地址列表
```

---

## 4. 角色管理

### 4.1 基础属性管理

```bash
!level <等级>                # 设置角色等级
!levelpro <目标等级>          # 渐进提升角色等级
!str/dex/int/luk <点数>     # 分配单项属性点
!setstat <数值>              # 设置四项基础属性
!maxstat                     # 设置最大属性（255级属性）
!sp <点数>                   # 设置技能点数
!ap <点数>                   # 设置属性点数
!hpmp <HP> <MP>             # 设置 HP 和 MP
!maxhpmp                     # 设置最大 HP 和 MP
```

### 4.2 职业管理

```bash
!job <职业ID>                # 更改角色职业
!job <玩家名称> <职业ID>      # 更改其他玩家职业
!maxskill                    # 学习所有职业技能到满级
!resetskill                  # 重置所有技能点数
```

### 4.3 背包管理

```bash
!item <物品ID> [数量]        # 生成物品到背包
!drop <物品ID> [数量]         # 在地上掉落物品
!clearslot <类型>            # 清空指定背包栏位
!recharge                     # 为消耗品充能
!proitem <装备ID>            # 生成具有属性潜力的装备
```

**背包类型选项：** `all`, `equip`, `use`, `setup`, `etc`, `cash`

### 4.4 状态管理

```bash
!heal                        # 恢复自身 HP 和 MP
!healperson <玩家名称>        # 恢复指定玩家的 HP 和 MP
!healmap                     # 恢复当前地图所有玩家的 HP 和 MP
!buff <技能ID>               # 为自己施放指定技能
!buffmap                     # 为当前地图所有玩家施放增益
!buffme                      # 为自己施放常用 GM 增益
!debuff <玩家名称>            # 移除玩家所有增益效果
!hide                         # 开启隐身模式
!unhide                       # 关闭隐身模式
```

---

## 5. 服务器管理

### 5.1 倍率配置

```bash
!exprate <倍率值>            # 设置全服经验倍率
!mesorate <倍率值>            # 设置全服金币倍率
!droprate <倍率值>            # 设置全服掉落倍率
!bossdroprate <倍率值>        # 设置全服 Boss 掉落倍率
!questrate <倍率值>           # 设置全服任务奖励倍率
!travelrate <倍率值>          # 设置全服移动速率倍率
!fishrate <倍率值>            # 设置钓鱼经验倍率
```

### 5.2 服务器控制

```bash
!shutdown <分钟数>             # 关闭服务器
!shutdown now                 # 立即关闭服务器
!saveall                      # 保存所有玩家数据
!dcall                        # 断开所有玩家连接
```

### 5.3 频道管理

```bash
!addchannel <频道ID>          # 添加新的频道服务器
!removechannel <频道ID>       # 移除频道服务器
!addworld <世界ID>            # 添加新的世界服务器
!removeworld <世界ID>         # 移除世界服务器
```

### 5.4 服务器公告

```bash
!notice <消息>                 # 发送全服公告
!servermessage <消息>          # 设置服务器滚动公告
```

**广播范围：**

| 模式 | 命令 | 范围 |
|------|------|------|
| 全服广播 | `!alertall` / `!noticeall` | 所有在线玩家 |
| 频道广播 | `!alertch` / `!noticech` | 当前频道玩家 |
| 地图广播 | `!alertm` / `!noticem` | 当前地图玩家 |

---

## 6. 日志查看

### 6.1 聊天日志

系统自动记录所有聊天内容：

```java
// 位置: org.gms.server.ChatLogger
ChatLogger.log(c, "Alert All", message);  // 记录管理员公告
```

聊天类型包括：
- 私聊记录
- 频道聊天
- 地图聊天
- 全服公告

### 6.2 操作日志

关键管理操作自动记录：

| 操作类型 | 日志内容 |
|----------|----------|
| 玩家封禁 | 封禁者、被封禁者、原因、IP 地址 |
| 角色管理 | 操作者、目标角色、修改内容 |
| 服务器配置 | 操作者、修改项、旧值、新值 |
| 全服广播 | 发送者、广播内容、广播范围 |

### 6.3 调试日志

```bash
!debug [类型]                 # 打开调试模式菜单
```

**调试类型：**

| 类型 | 描述 |
|------|------|
| `monster` | 怪物调试信息 |
| `packet` | 封包调试信息 |
| `portal` | 传送门调试信息 |
| `spawnpoint` | 刷新点调试信息 |
| `pos` | 位置调试信息 |
| `map` | 地图调试信息 |
| `event` | 事件调试信息 |
| `buff` | Buff 状态调试 |

### 6.4 日志命令

```bash
!showpackets                 # 显示封包调试信息
!showmovelife                # 显示移动生命体信息
!showsessions                # 显示当前会话列表
!checkdmg                    # 查看玩家对怪物的伤害统计
```

---

## 7. 数据统计

### 7.1 在线统计

```bash
@online                      # 查看当前在线玩家列表
@uptime                      # 查看服务器运行时间
@ranks                       # 查看玩家等级排行榜
```

### 7.2 服务器状态

```bash
@rates                       # 显示角色个人倍率信息
@showrates                   # 显示当前经验值、金币、掉落率
!inmap                       # 查看当前地图所有玩家信息
!whereami                    # 显示当前地图信息及所有玩家/NPC/怪物
```

### 7.3 经济数据

```bash
@showrates                   # 查看服务器倍率设置
!exprate                     # 查看当前经验倍率
!mesorate                    # 查看当前金币倍率
!droprate                    # 查看当前掉落倍率
```

---

## 8. 运营工具

### 8.1 活动管理

```bash
!startevent <事件名称>        # 开始全服事件
!endevent                     # 结束全服事件
!startmapevent <事件名称>      # 开始当前地图事件
!stopmapevent                 # 停止当前地图事件
@joinevent                   # 加入当前活动
@leaveevent                  # 离开当前活动
!expeds                      # 查看远征队伍列表
```

### 8.2 物品与奖励

```bash
!givenx <玩家名称> <数量>      # 给予玩家 NX 点券
!givevp <玩家名称> <数量>      # 给予玩家投票点数
!givems <玩家名称> <数量>      # 给予玩家金币
!giverp <玩家名称> <数量>      # 给予玩家奖励点数
!supplyratecoupon             # 发放倍率优惠券
```

### 8.3 Boss 召唤

```bash
!zakum                       # 召唤扎昆 Boss
!horntail                    # 召唤暗黑龙王 Boss
!pinkbean                    # 召唤品克蹦 Boss
!pap                         # 召唤帕普拉图斯 Boss
!pianus                      # 召唤品纳斯 Boss
!cake                        # 召唤蛋糕 Boss
```

### 8.4 怪物管理

```bash
!spawn <怪物ID> [数量]        # 在当前位置生成怪物
!killall                     # 杀死当前地图所有怪物
!killmap                     # 杀死当前地图所有怪物
!mobhp                       # 显示当前地图所有怪物的血量
!bosshp                      # 显示当前地图所有 BOSS 的血量条
```

### 8.5 NPC 管理

```bash
!npc <NPC ID>                # 在当前位置生成 NPC
!playernpc <玩家ID>           # 创建玩家形象的 NPC
!playernpcremove <NPC对象ID>  # 删除玩家形象的 NPC
!pnpc <NPC ID>               # 创建固定 NPC
!pnpcremove <NPC对象ID>       # 删除固定 NPC
!pmob <怪物ID>                # 创建可见怪物 NPC
!spawnallpnpcs               # 生成所有 PNPC
!eraseallpnpcs               # 删除所有 PNPC
```

### 8.6 地图管理

```bash
!clearDrops                  # 清除当前地图所有掉落物品
!reloadMap                   # 重新加载地图配置
!reloadDrops                 # 重新加载掉落配置
!reloadPortals               # 重新加载传送门配置
!reloadShops                 # 重新加载商店配置
!reloadEvents                # 重新加载事件配置
!openportal <传送门ID>        # 开启指定传送门
!closeportal <传送门ID>       # 关闭指定传送门
```

### 8.7 传送管理

```bash
!warp <地图ID> [传送点]       # 传送到指定地图
!warphere <玩家名称>          # 召唤玩家到自己位置
!warpto <玩家名称>            # 传送到玩家位置
!warpmap <地图ID>             # 将当前地图所有玩家传送到指定地图
!goto <地点名称>              # 传送到指定城镇或区域
```

---

## 9. 界面截图位置

### 9.1 游戏内界面

由于 BeiDou-Server 采用命令行方式实现管理功能，以下为相关界面描述：

**GM 命令菜单：**
- 位置：游戏内聊天窗口
- 触发：输入 `!help` 或 `@help`
- 内容：显示当前权限等级可用的所有命令

**GM 隐身状态：**
- 状态：隐身时角色对普通玩家不可见
- 标识：GM 使用 `!pos` 可查看自己当前位置

### 9.2 截图占位符

| 界面 | 描述 | 建议截图位置 |
|------|------|--------------|
| GM 命令帮助界面 | 显示所有可用 GM 命令 | docs/screenshots/gm-help.png |
| 服务器状态面板 | 显示在线人数、服务器信息 | docs/screenshots/server-status.png |
| 玩家管理界面 | 玩家列表和操作选项 | docs/screenshots/player-management.png |
| 全服公告界面 | 公告发送和历史记录 | docs/screenshots/server-announcement.png |
| 日志查看界面 | 操作日志查询界面 | docs/screenshots/log-viewer.png |

---

## 10. 配置文件

### 10.1 相关配置项

管理后台相关配置位于 `config/server.properties`：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `gmlevel` | 默认 GM 等级 | 0 |
| `enable_pin` | 是否启用 PIN 码 | true |
| `max_login_attempts` | 最大登录尝试次数 | 5 |

---

## 11. 相关文档

- [GM 命令手册](./25-gm-commands.md) - 完整的 GM 命令参考
- [配置管理](./26-configuration.md) - 服务器配置详解
- [监控告警](./22-monitoring.md) - 系统监控指南
- [故障排查](./23-troubleshooting.md) - 常见问题处理

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
