# GM 命令手册

## 1. 概述

本文档详细说明了 BeiDou-Server 游戏服务器中的所有 GM 命令。GM 命令是游戏管理员用于管理服务器、玩家和游戏的特殊指令。

### 1.1 命令格式

GM 命令以 `@` 或 `!` 开头：
- `@命令` - 普通玩家命令
- `!命令` - GM 命令（需要相应权限等级）

### 1.2 权限等级

| 等级 | 名称 | 描述 |
|------|------|------|
| 0 | 普通玩家 | 可使用基础玩家命令 |
| 1 | 初级 GM | 可使用初级管理命令 |
| 2 | GM | 可使用中级管理命令 |
| 3 | 高级 GM | 可使用高级管理命令 |
| 4 | 管理员 | 可使用服务器配置命令 |
| 5 | 开发者 | 可使用调试命令 |
| 6 | 系统管理员 | 可使用所有命令 |

---

## 2. 等级 0 命令（普通玩家命令）

等级 0 命令是所有玩家都可以使用的基础命令。

| 命令 | 描述 | 用法 |
|------|------|------|
| `help` / `commands` | 打开命令帮助界面 | `@help` |
| `droplimit` | 查看当前地图掉落物品数量限制 | `@droplimit` |
| `time` | 显示当前服务器时间 | `@time` |
| `credits` | 查看开发团队信息 | `@credits` |
| `uptime` | 查看服务器运行时间 | `@uptime` |
| `gacha` | 查看转蛋奖励列表 | `@gacha <转蛋名称>` |
| `dispose` | 关闭当前 NPC/任务脚本对话 | `@dispose` |
| `changel` | 切换语言设置 | `@changel <语言代码>` |
| `equiplv` | 显示所有装备属性 | `@equiplv` |
| `showrates` | 显示当前经验值、 Meso、掉落率 | `@showrates` |
| `rates` | 显示角色个人倍率信息 | `@rates` |
| `online` | 查看当前在线玩家列表 | `@online` |
| `gm` | 向 GM 发送悄悄话消息 | `@gm <消息>` |
| `reportbug` | 报告游戏 Bug 给 GM | `@reportbug <Bug描述>` |
| `points` | 查看积分/投票点 | `@points [rp/vp]` |
| `joinevent` | 加入当前活动 | `@joinevent` |
| `leaveevent` | 离开当前活动 | `@leaveevent` |
| `ranks` | 查看玩家等级排行榜 | `@ranks` |
| `str` | 分配力量点数 | `@str [点数]` |
| `dex` | 分配敏捷点数 | `@dex [点数]` |
| `int` | 分配智力点数 | `@int [点数]` |
| `luk` | 分配运气点数 | `@luk [点数]` |
| `enableauth` | 启用账号认证 | `@enableauth` |
| `toggleexp` | 切换经验值获取开关 | `@toggleexp` |
| `mylawn` | 申请当前地图所有权 | `@mylawn` |

---

## 3. 等级 1 命令（初级 GM 命令）

等级 1 命令需要 GM 等级 1 或以上。

| 命令 | 描述 | 用法 |
|------|------|------|
| `bosshp` | 显示当前地图所有BOSS的血量条 | `!bosshp` |
| `mobhp` | 显示当前地图所有怪物的血量 | `!mobhp` |
| `whatdropsfrom` | 查询怪物掉落列表 | `!whatdropsfrom <怪物名称>` |
| `whodrops` | 查询物品掉落自哪些怪物 | `!whodrops <物品名称>` |
| `buffme` | 为自己添加常用 GM 增益buff | `!buffme` |
| `goto` | 传送到指定城镇或区域 | `!goto <地点名称>` |

### 3.1 goto 命令可用地点

**城镇列表：**
- 射手村、魔法森林、勇士部落、诺特勒斯港、埃德尔斯坦、琳杜半岛、天空之城、维英塔、新加坡、纳尔维尼尔、长江七号、圣地、樱之城市

**区域列表（仅 GM）：**
- 各副本入口、boss 房间等

---

## 4. 等级 2 命令（GM 命令）

等级 2 命令需要 GM 等级 2 或以上。

### 4.1 传送类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `warp` | 传送到指定地图 | `!warp <地图ID> [传送点]` |
| `warphere` / `summon` | 召唤玩家到自己位置 | `!warphere <玩家名称>` |
| `warpto` / `reach` / `follow` | 传送到玩家位置 | `!warpto <玩家名称>` |
| `warpmap` | 将当前地图所有玩家传送到指定地图 | `!warpmap <地图ID>` |
| `warparea` | 将当前地图指定范围内玩家传送到目标地图 | `!warparea <地图ID>` |
| `whereami` | 显示当前地图信息及所有玩家/NPC/怪物 | `!whereami` |

### 4.2 角色管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `level` | 设置角色等级 | `!level <等级>` |
| `levelpro` | 渐进提升角色等级 | `!levelpro <目标等级>` |
| `job` | 更改角色职业 | `!job <职业ID>` 或 `!job <玩家名称> <职业ID>` |
| `sp` | 设置技能点数 | `!sp <点数>` 或 `!sp <玩家名称> <点数>` |
| `ap` | 设置属性点数（可分配点数） | `!ap <点数>` 或 `!sp <玩家名称> <点数>` |
| `str` / `dex` / `int` / `luk` | 分配单项属性点 | `!str <点数>` |
| `setstat` | 设置力量、敏捷、智力、运气 | `!setstat <数值>` |
| `maxstat` | 将角色属性设置为最大值（255级属性） | `!maxstat` |
| `maxskill` | 学习所有职业技能到满级 | `!maxskill` |
| `resetskill` | 重置所有技能点数 | `!resetskill` |
| `setSlot` | 设置背包格子数量 | `!setSlot <数量>` |
| `fame` | 设置角色知名度 | `!fame <数值>` |

### 4.3 物品类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `item` | 生成物品到背包 | `!item <物品ID> [数量]` |
| `drop` | 在地上掉落物品 | `!drop <物品ID> [数量]` |
| `recharge` | 为消耗品（飞镖、弓箭、子弹等）充能 | `!recharge` |
| `loot` | 拾取当前地图属于自己的物品 | `!loot` |
| `clearslot` | 清空指定背包栏位 | `!clearslot <类型>` (all/equip/use/setup/etc/cash) |
| `clearsavelocs` | 清除保存的传送位置 | `!clearsavelocs [玩家名称]` |

### 4.4 地图类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `clearDrops` | 清除当前地图所有掉落物品 | `!clearDrops` |
| `heal` | 恢复自身 HP 和 MP | `!heal` |
| `hide` | 开启隐身模式 | `!hide` |
| `unhide` | 关闭隐身模式 | `!unhide` |
| `bomb` | 在目标位置放置炸弹（ARPQ） | `!bomb [玩家名称]` |
| `mobskill` | 对当前地图所有怪物施放怪物技能 | `!mobskill <技能ID> <技能等级>` |
| `jail` | 将玩家送入监狱 | `!jail <玩家名称> [分钟数]` |
| `unjail` | 将玩家从监狱释放 | `!unjail <玩家名称>` |
| `unbug` | 修复玩家的卡顿状态 | `!unbug` |

### 4.5 增益类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `buff` | 为自己施放指定技能 | `!buff <技能ID>` |
| `buffmap` | 为当前地图所有玩家施放增益技能 | `!buffmap` |
| `buffme` | 为自己施放常用 GM 增益（攻击力、防御力等） | `!buffme` |
| `powerme` / `empowerme` | 为自己施放全套增益技能 | `!empowerme` |

### 4.6 查询类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `search` | 搜索物品、NPC、怪物、技能、地图、任务 | `!search <类型> <关键词>` |
| `id` | 在手册中搜索 ID | `!id <类型> <名称>` (map/npc/mob/skill/equip/use/weapon) |
| `gachalist` | 打开转蛋抽奖列表界面 | `!gachalist` |
| `gmshop` | 打开 GM 商店 | `!gmshop` |

### 4.7 其他命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `dc` | 断开指定玩家的连接 | `!dc <玩家名称>` |

---

## 5. 等级 3 命令（高级 GM 命令）

等级 3 命令需要 GM 等级 3 或以上。

### 5.1 玩家管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `ban` | 封禁玩家账号 | `!ban <玩家名称> <原因>` |
| `unban` | 解封玩家账号 | `!unban <玩家名称>` |
| `kill` | 杀死指定玩家 | `!kill <玩家名称>` |
| `killall` | 杀死当前地图所有怪物 | `!killall` |
| `killmap` | 杀死当前地图所有怪物 | `!killmap` |
| `hurt` | 对玩家造成伤害 | `!hurt <玩家名称> <伤害值>` |
| `healperson` | 恢复指定玩家的 HP 和 MP | `!healperson <玩家名称>` |
| `healmap` | 恢复当前地图所有玩家的 HP 和 MP | `!healmap` |

### 5.2 怪物刷新类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `spawn` | 在当前位置生成怪物 | `!spawn <怪物ID> [数量]` |
| `npc` | 在当前位置生成 NPC | `!npc <NPC ID>` |

### 5.3 地图管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `mutemap` | 禁言当前地图所有玩家 | `!mutemap` |
| `inmap` | 查看当前地图所有玩家信息 | `!inmap` |
| `pos` | 显示当前位置坐标 | `!pos` |
| `night` | 设置当前地图为夜晚 | `!night` |

### 5.4 事件管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `startevent` | 开始全服事件 | `!startevent <事件名称>` |
| `endevent` | 结束全服事件 | `!endevent` |
| `startmapevent` | 开始当前地图事件 | `!startmapevent <事件名称>` |
| `stopmapevent` | 停止当前地图事件 | `!stopmapevent` |
| `expeds` | 查看远征队伍列表 | `!expeds` |

### 5.5 服务器配置类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `notice` | 发送全服公告 | `!notice <消息>` |
| `reloadEvents` | 重新加载事件配置 | `!reloadEvents` |
| `reloadDrops` | 重新加载掉落配置 | `!reloadDrops` |
| `reloadPortals` | 重新加载传送门配置 | `!reloadPortals` |
| `reloadMap` | 重新加载地图配置 | `!reloadMap` |
| `reloadShops` | 重新加载商店配置 | `!reloadShops` |

### 5.6 状态效果类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `debuff` | 移除玩家所有增益效果 | `!debuff <玩家名称>` |
| `fly` | 开启飞行模式 | `!fly` |
| `openportal` | 开启指定传送门 | `!openportal <传送门ID>` |
| `closeportal` | 关闭指定传送门 | `!closeportal <传送门ID>` |

### 5.7 监控类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `monitor` | 监控指定玩家 | `!monitor <玩家名称>` |
| `monitors` | 查看当前被监控的玩家列表 | `!monitors` |
| `checkdmg` | 查看玩家对怪物的伤害统计 | `!checkdmg` |
| `music` | 更换当前地图背景音乐 | `!music <音乐ID>` |

### 5.8 聊天管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `ignore` | 忽略指定玩家消息 | `!ignore <玩家名称>` |
| `ignored` | 查看已忽略的玩家列表 | `!ignored` |
| `chat` / `togglewhitechat` | 切换白色聊天模式 | `!chat` |

### 5.9 奖励类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `givenx` | 给予玩家 NX 点券 | `!givenx <玩家名称> <数量>` |
| `givevp` | 给予玩家投票点数 | `!givevp <玩家名称> <数量>` |
| `givems` | 给予玩家金币 | `!givems <玩家名称> <数量>` |
| `giverp` | 给予玩家奖励点数 | `!giverp <玩家名称> <数量>` |

### 5.10 任务类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `startquest` | 开始指定任务 | `!startquest <任务ID>` |
| `completequest` | 完成指定任务 | `!completequest <任务ID>` |
| `resetquest` | 重置指定任务 | `!resetquest <任务ID>` |

### 5.11 外观类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `face` | 更换角色表情 | `!face <表情ID>` |
| `hair` | 更换角色发型 | `!hair <发型ID>` |

### 5.12 属性类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `hpmp` | 设置 HP 和 MP | `!hpmp <HP> <MP>` |
| `maxhpmp` | 设置最大 HP 和 MP | `!maxhpmp` |
| `maxenergy` | 设置能量条为最大值（海盗用） | `!maxenergy` |
| `seed` | 设置能量种子 | `!seed` |

### 5.13 定时器类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `timer` | 在玩家身上开始计时器 | `!timer <秒数>` |
| `timermap` | 在当前地图开始计时器 | `!timermap <秒数>` |
| `timerall` | 在所有地图开始计时器 | `!timerall <秒数>` |

### 5.14 其他命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `rip` | 杀死当前角色 | `!rip` |
| `pe` | 打开周期活动界面 | `!pe` |
| `online2` | 查看详细在线玩家信息 | `!online2` |
| `togglecoupon` | 切换优惠券状态 | `!togglecoupon` |

---

## 6. 等级 4 命令（管理员命令）

等级 4 命令需要 GM 等级 4 或以上。

### 6.1 服务器倍率类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `exprate` | 设置全服经验倍率 | `!exprate <倍率值>` |
| `mesorate` | 设置全服金币倍率 | `!mesorate <倍率值>` |
| `droprate` | 设置全服掉落倍率 | `!droprate <倍率值>` |
| `bossdroprate` | 设置全服 Boss 掉落倍率 | `!bossdroprate <倍率值>` |
| `questrate` | 设置全服任务奖励倍率 | `!questrate <倍率值>` |
| `travelrate` | 设置全服移动速率倍率 | `!travelrate <倍率值>` |
| `fishrate` | 设置钓鱼经验倍率 | `!fishrate <倍率值>` |

### 6.2 公告类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `servermessage` | 设置服务器滚动公告 | `!servermessage <消息>` |

### 6.3 物品类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `proitem` | 生成具有属性潜力的装备 | `!proitem <装备ID>` |
| `seteqstat` | 设置装备的附加属性 | `!seteqstat <属性>` |
| `itemvac` | 吸取地图上所有物品 | `!itemvac` |
| `forcevac` | 强制吸取地图上所有物品 | `!forcevac` |

### 6.4 Boss 召唤类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `zakum` | 召唤扎昆 Boss | `!zakum` |
| `horntail` | 召唤暗黑龙王 Boss | `!horntail` |
| `pinkbean` | 召唤品克蹦 Boss | `!pinkbean` |
| `pap` | 召唤帕普拉图斯 Boss | `!pap` |
| `pianus` | 召唤品纳斯 Boss | `!pianus` |
| `cake` | 召唤蛋糕 Boss | `!cake` |

### 6.5 NPC 管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `playernpc` | 创建玩家形象的 NPC | `!playernpc <玩家ID>` |
| `playernpcremove` | 删除玩家形象的 NPC | `!playernpcremove <NPC对象ID>` |
| `pnpc` | 创建固定 NPC | `!pnpc <NPC ID>` |
| `pnpcremove` | 删除固定 NPC | `!pnpcremove <NPC对象ID>` |
| `pmob` | 创建可见怪物 NPC | `!pmob <怪物ID>` |
| `pmobremove` | 删除可见怪物 NPC | `!pmobremove <NPC对象ID>` |

### 6.6 传送类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `warptolife` | 传送到生活技能 NPC | `!warptolife` |

---

## 7. 等级 5 命令（开发者命令）

等级 5 命令需要 GM 等级 5 或以上。

| 命令 | 描述 | 用法 |
|------|------|------|
| `debug` | 打开调试模式菜单 | `!debug [类型]` |
| `set` | 设置游戏配置变量 | `!set <变量名> <值>` |
| `showpackets` | 显示封包调试信息 | `!showpackets` |
| `showmovelife` | 显示移动生命体信息 | `!showmovelife` |
| `showsessions` | 显示当前会话列表 | `!showsessions` |
| `iplist` | 显示玩家 IP 地址列表 | `!iplist` |

### 7.1 debug 命令子类型

- `monster` - 怪物调试信息
- `packet` - 封包调试信息
- `portal` - 传送门调试信息
- `spawnpoint` - 刷新点调试信息
- `pos` - 位置调试信息
- `map` - 地图调试信息
- `mobsp` - 怪物刷新点报告
- `event` - 事件调试信息
- `areas` - 区域调试信息
- `reactors` - 反应堆调试信息
- `servercoupons` - 服务器优惠券列表
- `playercoupons` - 玩家优惠券列表
- `timer` - 定时器调试信息
- `marriage` - 婚姻状态调试
- `buff` - Buff 状态调试

---

## 8. 等级 6 命令（系统管理员命令）

等级 6 命令需要 GM 等级 6（最高权限）。

### 8.1 玩家管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `setgmlevel` | 设置玩家 GM 等级 | `!setgmlevel <玩家名称> <等级>` |
| `getacc` | 获取玩家账号信息 | `!getacc <玩家名称>` |
| `mapplayers` | 显示指定地图的玩家列表 | `!mapplayers <地图ID>` |

### 8.2 服务器管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `shutdown` | 关闭服务器 | `!shutdown <分钟数>` 或 `!shutdown now` |
| `saveall` | 保存所有玩家数据 | `!saveall` |
| `dcall` | 断开所有玩家连接 | `!dcall` |
| `warpworld` | 将所有玩家传送到指定地图 | `!warpworld <地图ID>` |

### 8.3 世界/频道管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `addchannel` | 添加新的频道服务器 | `!addchannel <频道ID>` |
| `removechannel` | 移除频道服务器 | `!removechannel <频道ID>` |
| `addworld` | 添加新的世界服务器 | `!addworld <世界ID>` |
| `removeworld` | 移除世界服务器 | `!removeworld <世界ID>` |

### 8.4 任务/缓存类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `clearquest` | 清除玩家任务数据 | `!clearquest <玩家名称> <任务ID>` |
| `clearquestcache` | 清除任务缓存 | `!clearquestcache` |

### 8.5 优惠券类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `supplyratecoupon` | 发放倍率优惠券 | `!supplyratecoupon` |

### 8.6 PNPC 管理类命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `spawnallpnpcs` | 生成所有 PNPC | `!spawnallpnpcs` |
| `eraseallpnpcs` | 删除所有 PNPC | `!eraseallpnpcs` |

### 8.7 其他命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `devtest` | 开发者测试命令 | `!devtest` |

---

## 9. 命令分类索引

### 9.1 传送类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `goto` | 1 | 传送到城镇/区域 |
| `warp` | 2 | 传送到指定地图 |
| `warphere` / `summon` | 2 | 召唤玩家到当前位置 |
| `warpto` / `reach` / `follow` | 2 | 传送到玩家位置 |
| `warpmap` | 2 | 传送地图所有玩家 |
| `warparea` | 2 | 传送范围内玩家 |
| `warpworld` | 6 | 传送所有世界玩家 |
| `warptolife` | 4 | 传送到生活技能 NPC |

### 9.2 封禁类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `ban` | 3 | 封禁玩家 |
| `unban` | 3 | 解封玩家 |
| `mutemap` | 3 | 禁言地图玩家 |

### 9.3 物品类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `item` | 2 | 生成物品到背包 |
| `drop` | 2 | 地上掉落物品 |
| `recharge` | 2 | 充能消耗品 |
| `clearslot` | 2 | 清空背包栏位 |
| `proitem` | 4 | 生成潜能装备 |
| `itemvac` | 4 | 吸取物品 |
| `forcevac` | 4 | 强制吸取物品 |

### 9.4 角色属性类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `level` | 2 | 设置等级 |
| `levelpro` | 2 | 渐进升级 |
| `job` | 2 | 更改职业 |
| `sp` | 2 | 设置技能点 |
| `ap` | 2 | 设置属性点 |
| `str/dex/int/luk` | 0/2 | 分配属性点 |
| `setstat` | 2 | 设置属性值 |
| `maxstat` | 2 | 最大属性 |
| `maxskill` | 2 | 满级技能 |
| `resetskill` | 2 | 重置技能 |
| `hpmp` | 3 | 设置 HP/MP |
| `maxhpmp` | 3 | 最大 HP/MP |
| `fame` | 3 | 设置知名度 |

### 9.5 怪物/战斗类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `spawn` | 3 | 生成怪物 |
| `kill` | 3 | 杀死玩家 |
| `killall` | 3 | 杀死所有怪物 |
| `killmap` | 3 | 杀死地图怪物 |
| `mobskill` | 2 | 施放怪物技能 |
| `bosshp` | 1 | 显示 Boss 血量 |
| `mobhp` | 1 | 显示怪物血量 |
| `checkdmg` | 3 | 检查伤害 |
| `zakum` | 4 | 召唤扎昆 |
| `horntail` | 4 | 召唤暗黑龙王 |
| `pinkbean` | 4 | 召唤品克蹦 |
| `pap` | 4 | 召唤帕普拉图斯 |
| `pianus` | 4 | 召唤品纳斯 |
| `cake` | 4 | 召唤蛋糕 |

### 9.6 服务器管理类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `exprate` | 4 | 设置经验倍率 |
| `mesorate` | 4 | 设置金币倍率 |
| `droprate` | 4 | 设置掉落倍率 |
| `bossdroprate` | 4 | 设置 Boss 掉落倍率 |
| `questrate` | 4 | 设置任务倍率 |
| `notice` | 3 | 发送公告 |
| `servermessage` | 4 | 设置滚动公告 |
| `shutdown` | 6 | 关闭服务器 |
| `saveall` | 6 | 保存所有数据 |

### 9.7 地图管理类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `clearDrops` | 2 | 清除掉落物品 |
| `heal` | 2 | 治愈自己 |
| `healmap` | 3 | 治愈地图玩家 |
| `healperson` | 3 | 治愈指定玩家 |
| `hide` | 2 | 隐身 |
| `unhide` | 2 | 取消隐身 |
| `night` | 3 | 夜晚模式 |
| `music` | 3 | 更换地图音乐 |
| `reloadMap` | 3 | 重载地图 |
| `reloadShops` | 3 | 重载商店 |
| `reloadDrops` | 3 | 重载掉落 |
| `reloadPortals` | 3 | 重载传送门 |
| `reloadEvents` | 3 | 重载事件 |

### 9.8 事件类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `startevent` | 3 | 开始全服事件 |
| `endevent` | 3 | 结束全服事件 |
| `startmapevent` | 3 | 开始地图事件 |
| `stopmapevent` | 3 | 停止地图事件 |
| `joinevent` | 0 | 加入活动 |
| `leaveevent` | 0 | 离开活动 |
| `expeds` | 3 | 查看远征队 |

### 9.9 监控/调试类命令

| 命令 | 等级 | 描述 |
|------|------|------|
| `monitor` | 3 | 监控玩家 |
| `monitors` | 3 | 查看监控列表 |
| `debug` | 5 | 调试模式 |
| `showpackets` | 5 | 显示封包 |
| `showmovelife` | 5 | 显示移动物体 |
| `showsessions` | 5 | 显示会话 |
| `iplist` | 5 | IP 列表 |
| `whereami` | 2 | 当前位置信息 |
| `pos` | 3 | 坐标信息 |
| `inmap` | 3 | 地图玩家信息 |

---

## 10. 使用示例

### 10.1 传送命令示例

```
!warp 100000000              # 传送到射手村
!warp 200000000 0            # 传送到魔法森林，传送点 0
!goto libail                # 传送到琳杜半岛
!warphere MapleGM           # 召唤 MapleGM 到当前位置
!warpto HappyPlayer         # 传送到 HappyPlayer 所在位置
!warpmap 100000000           # 将当前地图所有人传送到射手村
```

### 10.2 物品生成示例

```
!item 1002140               # 生成一把短剑
!item 1002140 100            # 生成100把短剑
!drop 5220000               # 在地上掉落一个金币
!proitem 1072495            # 生成一个潛能護甲
```

### 10.3 角色管理示例

```
!level 200                  # 设置等级为 200
!job 412                   # 转职为暗帝
!maxstat                   # 设置最大属性
!maxskill                  # 学习所有满级技能
!sp 9999                   # 设置技能点为 9999
```

### 10.4 玩家管理示例

```
!ban Hacker "使用外挂"       # 封禁玩家 Hacker
!unjail InnocentPlayer     # 解封玩家
!jail BadPlayer 60         # 将玩家关进监狱 60 分钟
!kill Griefer              # 杀死玩家
!dc AnnoyingPlayer         # 断开玩家连接
```

### 10.5 服务器管理示例

```
!exprate 2                 # 设置 2 倍经验
!droprate 3                # 设置 3 倍掉落
!notice 服务器将在5分钟后维护！ # 发送全服公告
!servermessage 欢迎来到BeiDou！ # 设置滚动公告
!shutdown 10               # 10 分钟后关机
```

---

## 附录 A: 职业 ID 一览表

| 职业 | ID |
|------|-----|
| 初心者 | 0 |
| 战士 | 100 |
| 法师 | 200 |
| 弓手 | 300 |
| 飞侠 | 400 |
| 海盗 | 500 |
| 骑士 | 110 |
| 祭司 | 210 |
| 猎人 | 310 |
| 刺客 | 410 |
| 枪手 | 510 |
| 烈焰巫師 | 220 |
| 暴风巫師 | 230 |
| 夜行者 | 420 |
| 神射手 | 320 |
| 英雄 | 112 |
| 圣骑士 | 121 |
| 黑骑士 | 131 |
| 大魔导士 | 222 |
| 枢密主教 | 232 |
| 箭神 | 312 |
| 游侠 | 322 |
| 暗影神偷 | 422 |
| 雾之毒皇 | 432 |
| 冲锋队长 | 512 |
| 毁灭狂鲨 | 522 |
| ... | ... |

---

## 附录 B: 常用地图 ID

| 地图名称 | ID |
|---------|-----|
| 射手村 | 100000000 |
| 魔法森林 | 200000000 |
| 勇士部落 | 100000100 |
| 诺特勒斯港 | 104000000 |
| 琳杜半岛 | 500000000 |
| 天空之城 | 200000100 |
| 圣地 | 200000000 |
| 扎昆 - 身体 | 280000000 |
| 扎昆 - 入口 | 280000100 |
| 暗黑龙王 | 240000000 |
| 品克蹦 | 689000000 |
| 监狱 | 492000000 |
| 活动地图 | 心动之林 |

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
*命令总数: 175 个*
