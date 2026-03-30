# 数据表说明文档

## 1. 概述

本文档详细介绍 BeiDou-Server 项目中所有数据库表的结构、字段、类型及用途。数据库采用 MySQL 8.4.0，使用 MyBatis-Flex 1.8.9 作为 ORM 框架，数据库迁移工具为 Flyway。

### 1.1 表分类总览

| 分类 | 表数量 | 说明 |
|------|--------|------|
| 账号系统 | 1 | 用户账号管理 |
| 角色系统 | 7 | 角色属性、快捷键、位置等 |
| 社交系统 | 7 | 好友、结婚、家族等 |
| 公会联盟 | 3 | 公会与联盟管理 |
| 背包物品 | 3 | 物品与装备存储 |
| 技能系统 | 2 | 技能与冷却 |
| 任务系统 | 4 | 任务状态与进度 |
| 商店系统 | 3 | 商店与仓库 |
| 拍卖行 | 2 | 拍卖行与购物车 |
| 现金商城 | 3 | 商城物品与礼物 |
| 宠物系统 | 2 | 宠物与宠物忽略 |
| 怪物图鉴 | 2 | 怪物卡牌收集 |
| 游戏事件 | 5 | BOSS日志、转蛋等 |
| 制造系统 | 4 | 合成与制作 |
| 安全封禁 | 6 | 封禁与举报 |
| 其他系统 | 14 | 论坛、快递、配置等 |

---

## 2. 账号系统

### 2.1 accounts - 账号表

存储用户账号信息，是整个游戏系统的核心账号表。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| name | VARCHAR(13) | 账号名 | NOT NULL, UNIQUE |
| password | VARCHAR(128) | 密码（加密存储） | NOT NULL |
| pin | VARCHAR(10) | 安全PIN码 | NOT NULL |
| pic | VARCHAR(26) | 图片密码 | NOT NULL |
| loggedin | TINYINT(4) | 登录状态 | DEFAULT 0 |
| lastlogin | TIMESTAMP | 最后登录时间 | NULL |
| createdat | TIMESTAMP | 账号创建时间 | NOT NULL |
| birthday | DATE | 生日 | NOT NULL |
| banned | TINYINT(1) | 是否被封禁 | DEFAULT 0 |
| banreason | TEXT | 封禁原因 | NULL |
| macs | TINYTEXT | MAC地址列表 | NULL |
| nxCredit | INT(11) | NX点卷 | NULL |
| maplePoint | INT(11) | 枫叶点 | NULL |
| nxPrepaid | INT(11) | NX预付款 | NULL |
| characterslots | TINYINT(2) | 角色栏位数量 | DEFAULT 3 |
| gender | TINYINT(2) | 性别 | DEFAULT 10 |
| tempban | TIMESTAMP | 临时封禁到期时间 | NOT NULL |
| greason | TINYINT(4) | 封禁原因代码 | DEFAULT 0 |
| tos | TINYINT(1) | 服务条款同意 | DEFAULT 0 |
| sitelogged | TEXT | 站点登录信息 | NULL |
| webadmin | INT(1) | Web管理员级别 | DEFAULT 0 |
| nick | VARCHAR(20) | 昵称 | NULL |
| mute | INT(1) | 禁言状态 | DEFAULT 0 |
| email | VARCHAR(45) | 邮箱 | NULL |
| ip | TEXT | IP地址 | NULL |
| rewardpoints | INT(11) | 奖励点数 | DEFAULT 0 |
| votepoints | INT(11) | 投票点数 | DEFAULT 0 |
| hwid | VARCHAR(12) | 硬件ID | NOT NULL |
| language | INT(1) | 语言设置 | DEFAULT 3 |

**索引:**
- PRIMARY KEY (`id`)
- UNIQUE KEY `name` (`name`)
- KEY `ranking1` (`id`, `banned`)
- INDEX (id, name)
- INDEX (id, nxCredit, maplePoint, nxPrepaid)

---

## 3. 角色系统

### 3.1 characters - 角色表

存储玩家角色的所有数据，是游戏中最核心的数据表之一。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 角色ID | PK, Auto Increment |
| accountid | INT(11) | 所属账号ID | NOT NULL |
| world | INT(11) | 所在世界/大区 | NOT NULL |
| name | VARCHAR(13) | 角色名 | NOT NULL |
| level | INT(11) | 等级 | DEFAULT 1 |
| exp | INT(11) | 当前经验值 | DEFAULT 0 |
| gachaexp | INT(11) | 抽卡经验值 | DEFAULT 0 |
| str | INT(11) | 力量 | DEFAULT 12 |
| dex | INT(11) | 敏捷 | DEFAULT 5 |
| luk | INT(11) | 运气 | DEFAULT 4 |
| int | INT(11) | 智力 | DEFAULT 4 |
| hp | INT(11) | 当前HP | DEFAULT 50 |
| mp | INT(11) | 当前MP | DEFAULT 5 |
| maxhp | INT(11) | 最大HP | DEFAULT 50 |
| maxmp | INT(11) | 最大MP | DEFAULT 5 |
| meso | INT(11) | 游戏币 | DEFAULT 0 |
| hpMpUsed | INT(11) UNSIGNED | HP/MP使用量 | DEFAULT 0 |
| job | INT(11) | 职业 | DEFAULT 0 |
| skincolor | INT(11) | 肤色 | DEFAULT 0 |
| gender | INT(11) | 性别 | DEFAULT 0 |
| fame | INT(11) | 人气值 | DEFAULT 0 |
| fquest | INT(11) | 好友任务 | DEFAULT 0 |
| hair | INT(11) | 发型 | DEFAULT 0 |
| face | INT(11) | 脸型 | DEFAULT 0 |
| ap | INT(11) | 可分配属性点 | DEFAULT 0 |
| sp | VARCHAR(128) | 技能点 | DEFAULT '0,0,0,0,0,0,0,0,0,0' |
| map | INT(11) | 所在地图ID | DEFAULT 0 |
| spawnpoint | INT(11) | 出生点 | DEFAULT 0 |
| gm | TINYINT(1) | GM级别 | DEFAULT 0 |
| party | INT(11) | 队伍ID | DEFAULT 0 |
| buddyCapacity | INT(11) | 好友容量 | DEFAULT 25 |
| createdate | TIMESTAMP | 创建时间 | NOT NULL |
| rank | INT(10) UNSIGNED | 世界等级排名 | DEFAULT 1 |
| rankMove | INT(11) | 排名变化 | DEFAULT 0 |
| jobRank | INT(10) UNSIGNED | 职业等级排名 | DEFAULT 1 |
| jobRankMove | INT(11) | 职业排名变化 | DEFAULT 0 |
| guildid | INT(10) UNSIGNED | 公会ID | DEFAULT 0 |
| guildrank | INT(10) UNSIGNED | 公会职位 | DEFAULT 5 |
| messengerid | INT(10) UNSIGNED | Messenger ID | DEFAULT 0 |
| messengerposition | INT(10) UNSIGNED | Messenger位置 | DEFAULT 4 |
| mountlevel | INT(9) | 坐骑等级 | DEFAULT 1 |
| mountexp | INT(9) | 坐骑经验 | DEFAULT 0 |
| mounttiredness | INT(9) | 坐骑疲劳度 | DEFAULT 0 |
| omokwins | INT(11) | 五子棋胜场 | DEFAULT 0 |
| omoklosses | INT(11) | 五子棋负场 | DEFAULT 0 |
| omokties | INT(11) | 五子棋平局 | DEFAULT 0 |
| matchcardwins | INT(11) | 记忆卡胜场 | DEFAULT 0 |
| matchcardlosses | INT(11) | 记忆卡负场 | DEFAULT 0 |
| matchcardties | INT(11) | 记忆卡平局 | DEFAULT 0 |
| merchantmesos | INT(11) | 商人游戏币 | DEFAULT 0 |
| hasmerchant | TINYINT(1) | 是否为商人 | DEFAULT 0 |
| equipslots | INT(11) | 装备栏格子数 | DEFAULT 24 |
| useslots | INT(11) | 消耗栏格子数 | DEFAULT 24 |
| setupslots | INT(11) | 设置栏格子数 | DEFAULT 24 |
| etcslots | INT(11) | 其他栏格子数 | DEFAULT 24 |
| familyId | INT(11) | 家族ID | DEFAULT -1 |
| monsterbookcover | INT(11) | 怪物图鉴封面 | DEFAULT 0 |
| allianceRank | INT(10) | 联盟职位 | DEFAULT 5 |
| vanquisherStage | INT(11) UNSIGNED | 征服者阶段 | DEFAULT 0 |
| ariantPoints | INT(11) UNSIGNED | Aariant点数 | DEFAULT 0 |
| dojoPoints | INT(11) UNSIGNED | 道场点数 | DEFAULT 0 |
| lastDojoStage | INT(10) UNSIGNED | 最后道场关卡 | DEFAULT 0 |
| finishedDojoTutorial | TINYINT(1) UNSIGNED | 是否完成道场教程 | DEFAULT 0 |
| vanquisherKills | INT(11) UNSIGNED | 征服者击杀数 | DEFAULT 0 |
| summonValue | INT(11) UNSIGNED | 召唤值 | DEFAULT 0 |
| partnerId | INT(11) | 配偶ID | DEFAULT 0 |
| marriageItemId | INT(11) | 结婚戒指ID | DEFAULT 0 |
| reborns | INT(5) | 转生次数 | DEFAULT 0 |
| pqpoints | INT(11) | 副本点数 | DEFAULT 0 |
| dataString | VARCHAR(64) | 扩展数据字符串 | DEFAULT '' |
| lastLogoutTime | TIMESTAMP | 最后登出时间 | NOT NULL |
| lastExpGainTime | TIMESTAMP | 最后获得经验时间 | NOT NULL |
| partySearch | TINYINT(1) | 是否搜索队伍 | DEFAULT 1 |
| jailexpire | BIGINT(20) | 监狱到期时间 | DEFAULT 0 |

**索引:**
- PRIMARY KEY (`id`)
- KEY `accountid` (`accountid`)
- KEY `party` (`party`)
- KEY `ranking1` (`level`, `exp`)
- KEY `ranking2` (`gm`, `job`)
- INDEX (id, accountid, world)
- INDEX (id, accountid, name)

**外键关系:**
- `accountid` → `accounts.id`

### 3.2 keymap - 快捷键映射表

存储角色的键盘快捷键配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| key | INT(11) | 键位 | NOT NULL |
| type | INT(11) | 类型 | NOT NULL |
| action | INT(11) | 对应动作 | NOT NULL |

### 3.3 skillmacros - 技能宏表

存储角色的技能宏配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| position | INT(11) | 宏位置 | NOT NULL |
| skill1 | INT(11) | 技能1 | NOT NULL |
| skill2 | INT(11) | 技能2 | NOT NULL |
| skill3 | INT(11) | 技能3 | NOT NULL |
| name | VARCHAR(32) | 宏名称 | NOT NULL |
| shout | INT(11) | 喊话设置 | NOT NULL |

### 3.4 savedlocations - 保存位置表

存储角色保存的传送点位置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| locationtype | VARCHAR(32) | 位置类型 | NOT NULL |
| map | INT(11) | 地图ID | NOT NULL |
| portal | INT(11) | 传送点ID | NOT NULL |

### 3.5 trocklocations - 自由市场穿梭频道位置表

存储角色在自由市场的穿梭频道位置信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| trockid | INT(11) | 自增主键 | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| mapid | INT(11) | 地图ID | NOT NULL |
| vip | INT(11) | VIP等级 | NOT NULL |

### 3.6 quickslotkeymapped - 快速栏位快捷键映射表

存储角色的快速栏位快捷键配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| accountid | INT(11) | 账号ID | PK |
| keymap | BIGINT(20) | 快捷键映射数据 | NOT NULL |

### 3.7 worldtransfers - 世界转移记录表

存储角色世界/大区转移的申请和执行记录。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| from | INT(11) | 原世界ID | NOT NULL |
| to | INT(11) | 目标世界ID | NOT NULL |
| requestTime | TIMESTAMP | 申请时间 | NOT NULL |
| completionTime | TIMESTAMP | 完成时间 | NOT NULL |

---

## 4. 社交系统

### 4.1 buddies - 好友列表表

存储角色的好友关系。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| buddyid | INT(11) | 好友角色ID | NOT NULL |
| pending | INT(11) | 待确认状态 | NOT NULL |
| group | VARCHAR(32) | 分组名称 | NOT NULL |

### 4.2 notes - 私信/纸条表

存储角色之间发送的私信/纸条。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| to | VARCHAR(13) | 收信人名称 | NOT NULL |
| from | VARCHAR(13) | 发信人名称 | NOT NULL |
| message | VARCHAR(600) | 消息内容 | NOT NULL |
| timestamp | BIGINT(20) | 时间戳 | NOT NULL |
| fame | INT(11) | 魅力值 | DEFAULT 0 |
| deleted | INT(11) | 删除标记 | DEFAULT 0 |

### 4.3 marriages - 结婚表

存储角色结婚信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| marriageid | BIGINT(20) | 婚姻ID | PK, Auto Increment |
| husbandid | BIGINT(20) | 丈夫角色ID | NOT NULL |
| wifeid | BIGINT(20) | 妻子角色ID | NOT NULL |

### 4.4 rings - 戒指表

存储结婚戒指信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 戒指ID | PK, Auto Increment |
| partnerRingId | INT(11) | 伴侣戒指ID | NOT NULL |
| partnerChrId | INT(11) | 伴侣角色ID | NOT NULL |
| itemid | INT(11) | 戒指物品ID | NOT NULL |
| partnername | VARCHAR(13) | 伴侣名称 | NOT NULL |

### 4.5 famelog - 声望日志表

存储角色声望（知名度）变更记录。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| famelogid | INT(11) | 日志ID | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| characteridTo | INT(11) | 被操作角色ID | NOT NULL |
| when | TIMESTAMP | 时间 | NOT NULL |

### 4.6 family_character - 家族角色表

存储角色在家族中的信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| cid | INT(11) | 角色ID | PK |
| familyid | INT(11) | 家族ID | NOT NULL |
| seniorid | INT(11) | 族长ID | NOT NULL |
| reputation | INT(11) | 声望 | DEFAULT 0 |
| todaysrep | INT(11) | 今日声望 | DEFAULT 0 |
| totalreputation | INT(11) | 总声望 | DEFAULT 0 |
| reptosenior | INT(11) | 贡献给族长的声望 | DEFAULT 0 |
| precepts | VARCHAR(200) | 家规 | NULL |
| lastresettime | BIGINT(20) | 最后重置时间 | DEFAULT 0 |

**索引:**
- PRIMARY KEY (`cid`)
- INDEX (cid, familyid)

### 4.7 family_entitlement - 家族权利表

存储家族权利/特权分配。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| charid | INT(11) | 角色ID | NOT NULL |
| entitlementid | INT(11) | 权利ID | NOT NULL |
| timestamp | BIGINT(20) | 授予时间 | DEFAULT 0 |

**索引:**
- PRIMARY KEY (`id`)
- INDEX (charid)

---

## 5. 公会与联盟

### 5.1 guilds - 公会表

存储公会的基本信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| guildid | INT(10) UNSIGNED | 公会ID | PK, Auto Increment |
| leader | INT(10) UNSIGNED | 会长角色ID | DEFAULT 0 |
| gp | INT(10) UNSIGNED | 公会积分 | DEFAULT 0 |
| logo | INT(10) UNSIGNED | 公会标志 | DEFAULT NULL |
| logoColor | SMALLINT(5) UNSIGNED | 标志颜色 | DEFAULT 0 |
| name | VARCHAR(45) | 公会名称 | NOT NULL |
| rank1title | VARCHAR(45) | 职位1称号 | DEFAULT 'Master' |
| rank2title | VARCHAR(45) | 职位2称号 | DEFAULT 'Jr. Master' |
| rank3title | VARCHAR(45) | 职位3称号 | DEFAULT 'Member' |
| rank4title | VARCHAR(45) | 职位4称号 | DEFAULT 'Member' |
| rank5title | VARCHAR(45) | 职位5称号 | DEFAULT 'Member' |
| capacity | INT(10) UNSIGNED | 成员容量 | DEFAULT 10 |
| logoBG | INT(10) UNSIGNED | 标志背景 | DEFAULT NULL |
| logoBGColor | SMALLINT(5) UNSIGNED | 背景颜色 | DEFAULT 0 |
| notice | VARCHAR(101) | 公会公告 | DEFAULT NULL |
| signature | INT(11) | 签名 | DEFAULT 0 |
| allianceId | INT(11) UNSIGNED | 联盟ID | DEFAULT 0 |

**索引:**
- PRIMARY KEY (`guildid`)
- INDEX (guildid, name)

### 5.2 alliance - 联盟表

存储联盟信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(10) UNSIGNED | 联盟ID | PK, Auto Increment |
| name | VARCHAR(13) | 联盟名称 | NOT NULL |
| capacity | INT(10) UNSIGNED | 联盟容量 | DEFAULT 2 |
| notice | VARCHAR(20) | 联盟公告 | DEFAULT '' |
| rank1 | VARCHAR(11) | 职位1称号 | DEFAULT 'Master' |
| rank2 | VARCHAR(11) | 职位2称号 | DEFAULT 'Jr. Master' |
| rank3 | VARCHAR(11) | 职位3称号 | DEFAULT 'Member' |
| rank4 | VARCHAR(11) | 职位4称号 | DEFAULT 'Member' |
| rank5 | VARCHAR(11) | 职位5称号 | DEFAULT 'Member' |

**索引:**
- PRIMARY KEY (`id`)
- INDEX (name)

### 5.3 allianceguilds - 联盟公会关系表

存储联盟与公会的关系。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(10) UNSIGNED | 自增主键 | PK, Auto Increment |
| allianceid | INT(10) | 联盟ID | DEFAULT -1 |
| guildid | INT(10) | 公会ID | DEFAULT -1 |

**索引:**
- PRIMARY KEY (`id`)

---

## 6. 背包与物品

### 6.1 inventoryitems - 背包物品表

存储角色背包中的物品。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| inventoryitemid | INT(10) UNSIGNED | 物品ID | PK, Auto Increment |
| type | TINYINT(3) UNSIGNED | 类型 | NOT NULL |
| characterid | INT(11) | 所属角色ID | NULL |
| accountid | INT(11) | 所属账号ID | NULL |
| itemid | INT(11) | 物品模板ID | DEFAULT 0 |
| inventorytype | INT(11) | 背包类型 | DEFAULT 0 |
| position | INT(11) | 位置 | DEFAULT 0 |
| quantity | INT(11) | 数量 | DEFAULT 0 |
| owner | TINYTEXT | 物品所有者名称 | NOT NULL |
| petid | INT(11) | 绑定宠物ID | DEFAULT -1 |
| flag | INT(11) | 标志 | NOT NULL |
| expiration | BIGINT(20) | 过期时间 | DEFAULT -1 |
| giftFrom | VARCHAR(26) | 赠送者名称 | NOT NULL |

**索引:**
- PRIMARY KEY (`inventoryitemid`)
- KEY `CHARID` (`characterid`)

### 6.2 inventoryequipment - 装备详情表

存储装备的详细属性信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| inventoryequipmentid | INT(10) UNSIGNED | 装备ID | PK, Auto Increment |
| inventoryitemid | INT(10) UNSIGNED | 对应物品ID | DEFAULT 0 |
| upgradeslots | INT(11) | 升级槽位数 | DEFAULT 0 |
| level | INT(11) | 强化等级 | DEFAULT 0 |
| str | INT(11) | 力量加成 | DEFAULT 0 |
| dex | INT(11) | 敏捷加成 | DEFAULT 0 |
| int | INT(11) | 智力加成 | DEFAULT 0 |
| luk | INT(11) | 运气加成 | DEFAULT 0 |
| hp | INT(11) | HP加成 | DEFAULT 0 |
| mp | INT(11) | MP加成 | DEFAULT 0 |
| watk | INT(11) | 物理攻击 | DEFAULT 0 |
| matk | INT(11) | 魔法攻击 | DEFAULT 0 |
| wdef | INT(11) | 物理防御 | DEFAULT 0 |
| mdef | INT(11) | 魔法防御 | DEFAULT 0 |
| acc | INT(11) | 命中 | DEFAULT 0 |
| avoid | INT(11) | 回避 | DEFAULT 0 |
| hands | INT(11) | 手技 | DEFAULT 0 |
| speed | INT(11) | 移动速度 | DEFAULT 0 |
| jump | INT(11) | 跳跃力 | DEFAULT 0 |
| locked | INT(11) | 锁定状态 | DEFAULT 0 |
| vicious | INT(11) UNSIGNED | 恶狠值 | DEFAULT 0 |
| itemlevel | INT(11) | 装备等级 | DEFAULT 1 |
| itemexp | INT(11) UNSIGNED | 装备经验 | DEFAULT 0 |
| ringid | INT(11) | 戒指ID | DEFAULT -1 |

**索引:**
- PRIMARY KEY (`inventoryequipmentid`)
- KEY `INVENTORYITEMID` (`inventoryitemid`)

### 6.3 inventorymerchant - 商人背包表

存储玩家作为商人时的背包物品。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| inventorymerchantid | INT(10) UNSIGNED | ID | PK, Auto Increment |
| inventoryitemid | INT(10) UNSIGNED | 物品ID | DEFAULT 0 |
| characterid | INT(11) | 商人角色ID | NULL |
| bundles | INT(10) | 堆叠数量 | DEFAULT 0 |

**索引:**
- PRIMARY KEY (`inventorymerchantid`)
- KEY `INVENTORYITEMID` (`inventoryitemid`)

---

## 7. 技能系统

### 7.1 skills - 技能表

存储角色学会的技能信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| skillid | INT(11) | 技能ID | NOT NULL |
| characterid | INT(11) | 角色ID | NOT NULL |
| skilllevel | INT(11) | 技能等级 | NOT NULL |
| masterlevel | INT(11) | 最高等级 | NOT NULL |
| expiration | BIGINT(20) | 过期时间 | DEFAULT -1 |

### 7.2 cooldowns - 冷却时间表

存储角色技能的冷却时间。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | 自增主键 | PK, Auto Increment |
| charid | INT(11) | 角色ID | NOT NULL |
| skillid | INT(11) | 技能ID | NOT NULL |
| length | BIGINT(20) | 冷却时长 | NOT NULL |
| starttime | BIGINT(20) | 开始时间 | NOT NULL |

---

## 8. 任务系统

### 8.1 queststatus - 任务状态表

存储角色的任务状态。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| queststatusid | BIGINT(20) | 任务状态ID | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| quest | INT(11) | 任务ID | NOT NULL |
| status | INT(11) | 状态 | NOT NULL |
| time | INT(11) | 时间 | NOT NULL |
| expires | BIGINT(20) | 过期时间 | DEFAULT 0 |
| forfeited | INT(11) | 放弃次数 | DEFAULT 0 |
| completed | INT(11) | 完成状态 | DEFAULT 0 |
| info | INT(11) | 任务信息 | DEFAULT 0 |

### 8.2 questprogress - 任务进度表

存储角色的任务进度信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | 自增主键 | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| queststatusid | BIGINT(20) | 任务状态ID | NOT NULL |
| progressid | INT(11) | 进度ID | NOT NULL |
| progress | VARCHAR(128) | 进度数据 | NOT NULL |

### 8.3 questactions - 任务动作表

存储任务的动作数据。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| questactionid | BIGINT(20) | ID | PK, Auto Increment |
| questid | INT(11) | 任务ID | NOT NULL |
| status | INT(11) | 状态 | NOT NULL |
| data | BLOB | 动作数据 | NULL |

### 8.4 questrequirements - 任务需求表

存储任务的需求数据。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| questrequirementid | BIGINT(20) | ID | PK, Auto Increment |
| questid | INT(11) | 任务ID | NOT NULL |
| status | INT(11) | 状态 | NOT NULL |
| data | BLOB | 需求数据 | NULL |

---

## 9. 商店系统

### 9.1 shops - 商店表

存储NPC商店信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| shopid | BIGINT(20) | 商店ID | PK, Auto Increment |
| npcid | INT(11) | NPC ID | NOT NULL |

### 9.2 shopitems - 商店物品表

存储商店出售的物品。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| shopitemid | BIGINT(20) | ID | PK, Auto Increment |
| shopid | BIGINT(20) | 商店ID | NOT NULL |
| itemid | INT(11) | 物品ID | NOT NULL |
| price | INT(11) | 价格 | NOT NULL |
| pitch | INT(11) | 议价 | NOT NULL |
| position | INT(11) | 排序位置 | NOT NULL |

### 9.3 storages - 仓库表

存储角色的仓库信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| storageid | BIGINT(20) | 仓库ID | PK, Auto Increment |
| accountid | INT(11) | 账号ID | NOT NULL |
| world | INT(11) | 世界ID | NOT NULL |
| slots | INT(11) | 格子数 | NOT NULL |
| meso | INT(11) | 仓库金币 | NOT NULL |

---

## 10. 拍卖行系统

### 10.1 mts_items - 拍卖行物品表

存储拍卖行的物品信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| tab | INT(11) | 标签页 | NOT NULL |
| type | INT(11) | 类型 | NOT NULL |
| itemid | BIGINT(20) | 物品ID | NOT NULL |
| quantity | INT(11) | 数量 | NOT NULL |
| seller | INT(11) | 卖家ID | NOT NULL |
| price | INT(11) | 价格 | NOT NULL |
| bidIncre | INT(11) | 最低加价 | NOT NULL |
| buyNow | INT(11) | 一口价 | NOT NULL |
| position | INT(11) | 位置 | NOT NULL |
| upgradeslots | INT(11) | 升级槽 | NOT NULL |
| level | INT(11) | 等级 | NOT NULL |
| itemlevel | INT(11) | 物品等级 | NOT NULL |
| itemexp | BIGINT(20) | 物品经验 | NOT NULL |
| ringid | INT(11) | 戒指ID | NOT NULL |
| str | INT(11) | 力量 | NOT NULL |
| dex | INT(11) | 敏捷 | NOT NULL |
| int | INT(11) | 智力 | NOT NULL |
| luk | INT(11) | 运气 | NOT NULL |
| hp | INT(11) | HP | NOT NULL |
| mp | INT(11) | MP | NOT NULL |
| watk | INT(11) | 物理攻击 | NOT NULL |
| matk | INT(11) | 魔法攻击 | NOT NULL |
| wdef | INT(11) | 物理防御 | NOT NULL |
| mdef | INT(11) | 魔法防御 | NOT NULL |
| acc | INT(11) | 命中 | NOT NULL |
| avoid | INT(11) | 回避 | NOT NULL |
| hands | INT(11) | 手技 | NOT NULL |
| speed | INT(11) | 速度 | NOT NULL |
| jump | INT(11) | 跳跃 | NOT NULL |
| locked | INT(11) | 锁定 | NOT NULL |
| isequip | INT(11) | 是否装备 | NOT NULL |
| owner | VARCHAR(32) | 所有者 | NOT NULL |
| sellername | VARCHAR(32) | 卖家名称 | NOT NULL |
| sellEnds | VARCHAR(32) | 截止时间 | NOT NULL |
| transfer | INT(11) | 转移次数 | NOT NULL |
| vicious | BIGINT(20) | 恶狠值 | NOT NULL |
| flag | BIGINT(20) | 标志 | NOT NULL |
| expiration | BIGINT(20) | 过期时间 | NOT NULL |
| giftFrom | VARCHAR(26) | 赠送者 | NOT NULL |

### 10.2 mts_cart - 购物车表

存储角色的拍卖行购物车内容。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| cid | INT(11) | 角色ID | NOT NULL |
| itemid | INT(11) | 物品ID | NOT NULL |

---

## 11. 现金商城

### 11.1 modified_cash_item - 商城物品修改表

存储商城物品的修改配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| sn | INT(11) | SN码 | PK |
| itemId | INT(11) | 物品ID | NOT NULL |
| count | SMALLINT(6) | 数量 | NOT NULL |
| price | INT(11) | 价格 | NOT NULL |
| bonus | INT(11) | 属性奖励 | NOT NULL |
| priority | INT(11) | 优先级 | NOT NULL |
| period | BIGINT(20) | 有效期 | NOT NULL |
| maplePoint | INT(11) | 抵用券 | NOT NULL |
| meso | INT(11) | 金币 | NOT NULL |
| forPremiumUser | INT(11) | 高级用户专属 | NOT NULL |
| commodityGender | INT(11) | 性别限制 | NOT NULL |
| onSale | INT(11) | 是否销售 | NOT NULL |
| class | INT(11) | 职业限制 | NOT NULL |
| limit | INT(11) | 购买限制 | NOT NULL |
| pbCash | INT(11) | PB现金 | NOT NULL |
| pbPoint | INT(11) | PB点数 | NOT NULL |
| pbGift | INT(11) | PB礼物 | NOT NULL |
| packageSn | INT(11) | 礼包SN | NOT NULL |

### 11.2 specialcashitems - 特殊现金物品表

存储特殊现金物品的修改信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK |
| sn | INT(11) | SN码 | NOT NULL |
| modifier | INT(11) | 修改类型 | NOT NULL |
| info | INT(11) | 信息 | NOT NULL |

### 11.3 gifts - 礼物表

存储角色收到的礼物信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| to | INT(11) | 接收者ID | NOT NULL |
| from | VARCHAR(26) | 赠送者名称 | NOT NULL |
| message | VARCHAR(80) | 祝福语 | NOT NULL |
| sn | BIGINT(20) | 物品SN | NOT NULL |
| ringid | INT(11) | 戒指ID | NOT NULL |

---

## 12. 宠物系统

### 12.1 pets - 宠物表

存储宠物的信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| petid | BIGINT(20) | 宠物ID | PK, Auto Increment |
| name | VARCHAR(32) | 宠物名称 | NOT NULL |
| level | BIGINT(20) | 等级 | NOT NULL |
| closeness | BIGINT(20) | 亲密度 | NOT NULL |
| fullness | BIGINT(20) | 饱食度 | NOT NULL |
| summoned | TINYINT(1) | 是否召唤 | NOT NULL |
| flag | BIGINT(20) | 标志 | NOT NULL |

### 12.2 petignores - 宠物忽略表

存储宠物忽略的列表。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| petid | INT(11) | 宠物ID | NOT NULL |
| itemid | INT(11) | 物品ID | NOT NULL |

---

## 13. 怪物图鉴

### 13.1 monsterbook - 怪物图鉴表

存储角色收集的怪物卡片信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| charid | INT(11) | 角色ID | PK |
| cardid | INT(11) | 卡片ID | PK |
| level | INT(11) | 卡片等级 | NOT NULL |

### 13.2 monstercarddata - 怪物卡牌数据表

存储怪物卡牌的元数据。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| cardid | INT(11) | 卡片ID | NOT NULL |
| mobid | INT(11) | 怪物ID | NOT NULL |

---

## 14. 游戏事件

### 14.1 bosslog_daily - 每日BOSS挑战日志表

存储角色每日挑战 BOSS 的记录，以及（可选）组队 PQ 副本参与记录：`bosstype` 为 `PQ_<EventName>` 前缀（与 `scripts/event` 下事件脚本名一致，如 `PQ_LudiPQ`），由 `PartyQuestDailyLog` 写入；与远征 BOSS 条目一同在每日重置任务中按时间清理。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| bosstype | VARCHAR(32) | BOSS 类型或 `PQ_*` | NOT NULL |
| attempttime | TIMESTAMP | 挑战时间 | NOT NULL |

### 14.2 bosslog_weekly - 每周BOSS挑战日志表

存储角色每周挑战BOSS的记录。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| bosstype | VARCHAR(32) | BOSS类型 | NOT NULL |
| attempttime | TIMESTAMP | 挑战时间 | NOT NULL |

### 14.3 eventstats - 事件状态表

存储游戏事件的状态信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| characterid | BIGINT(20) | 角色ID | PK |
| name | VARCHAR(32) | 事件名称 | NOT NULL |
| info | INT(11) | 状态信息 | NOT NULL |

### 14.4 gachapon_reward - 转蛋奖励表

存储转蛋系统的奖励配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| poolId | INT(11) | 奖池ID | NOT NULL |
| itemId | INT(11) | 物品ID | NOT NULL |
| itemName | VARCHAR(128) | 物品名称 | NULL |
| quantity | SMALLINT(6) | 数量 | NOT NULL |
| createTime | DATETIME | 创建时间 | NOT NULL |
| comment | VARCHAR(256) | 备注 | NOT NULL |

### 14.5 gachapon_reward_pool - 转蛋奖池表

存储转蛋奖池的配置信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| name | VARCHAR(64) | 奖池名称 | NOT NULL |
| gachaponId | INT(11) | 转蛋机ID | NOT NULL |
| gachaponName | VARCHAR(64) | 转蛋机名称 | NULL |
| weight | INT(11) | 权重 | NOT NULL |
| isPublic | TINYINT(1) | 是否公共奖池 | NOT NULL |
| prob | INT(11) | 概率 | NOT NULL |
| startTime | DATETIME | 开始时间 | NOT NULL |
| endTime | DATETIME | 结束时间 | NOT NULL |
| notification | TINYINT(1) | 是否喇叭通知 | NOT NULL |
| comment | VARCHAR(256) | 备注 | NOT NULL |

---

## 15. 制造系统

### 15.1 makercreatedata - 创造数据表

存储物品制造的基础数据。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK |
| itemid | INT(11) | 物品ID | PK |
| reqLevel | INT(11) | 需求等级 | NOT NULL |
| reqMakerLevel | INT(11) | 需求制造等级 | NOT NULL |
| reqMeso | INT(11) | 需求金币 | NOT NULL |
| reqItem | INT(11) | 需求物品 | NOT NULL |
| reqEquip | INT(11) | 需求装备 | NOT NULL |
| catalyst | INT(11) | 催化剂 | NOT NULL |
| quantity | INT(11) | 产出数量 | NOT NULL |
| tuc | INT(11) | 可升级次数 | NOT NULL |

### 15.2 makerreagentdata - 试剂数据表

存储制造用的试剂数据。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| itemid | INT(11) | 物品ID | PK |
| stat | VARCHAR(32) | 属性名称 | NOT NULL |
| value | INT(11) | 属性值 | NOT NULL |

### 15.3 makerrecipedata - 配方数据表

存储制造配方所需材料。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| itemid | INT(11) | 物品ID | PK |
| reqItem | INT(11) | 材料ID | PK |
| count | INT(11) | 数量 | NOT NULL |

### 15.4 makerrewarddata - 制造奖励数据表

存储制造奖励的配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| itemid | INT(11) | 物品ID | PK |
| rewardid | INT(11) | 奖励ID | PK |
| quantity | INT(11) | 数量 | NOT NULL |
| prob | INT(11) | 概率 | NOT NULL |

---

## 16. 安全与封禁

### 16.1 hwidaccounts - 硬件账号绑定表

存储硬件ID与账号的绑定关系。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| accountid | INT(11) | 账号ID | PK |
| hwid | VARCHAR(64) | 硬件ID | PK |
| relevance | INT(11) | 关联性 | NOT NULL |
| expiresat | TIMESTAMP | 过期时间 | NOT NULL |

### 16.2 hwidbans - 硬件封禁表

存储被封禁的硬件ID。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| hwidbanid | BIGINT(20) | ID | PK, Auto Increment |
| hwid | VARCHAR(64) | 硬件ID | NOT NULL |

### 16.3 ipbans - IP封禁表

存储被封禁的IP地址。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| ipbanid | BIGINT(20) | ID | PK, Auto Increment |
| ip | VARCHAR(64) | IP地址 | NOT NULL |
| aid | VARCHAR(32) | 关联账号ID | NOT NULL |

### 16.4 macbans - MAC封禁表

存储被封禁的MAC地址。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| macbanid | BIGINT(20) | ID | PK, Auto Increment |
| mac | VARCHAR(64) | MAC地址 | NOT NULL |
| aid | VARCHAR(32) | 关联账号ID | NOT NULL |

### 16.5 macfilters - MAC过滤器表

存储MAC地址过滤规则。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| macfilterid | BIGINT(20) | ID | PK, Auto Increment |
| filter | VARCHAR(64) | 过滤规则 | NOT NULL |

### 16.6 reports - 举报表

存储玩家的举报记录。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| reporttime | TIMESTAMP | 举报时间 | NOT NULL |
| reporterid | INT(11) | 举报者ID | NOT NULL |
| victimid | INT(11) | 被举报者ID | NOT NULL |
| reason | INT(11) | 原因 | NOT NULL |
| chatlog | VARCHAR(255) | 聊天记录 | NOT NULL |
| description | VARCHAR(255) | 描述 | NOT NULL |

### 16.7 responses - 响应表

存储聊天自动回复配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| chat | VARCHAR(255) | 触发词 | NOT NULL |
| response | VARCHAR(255) | 回复内容 | NOT NULL |
| id | BIGINT(20) | ID | PK, Auto Increment |

---

## 17. 其他系统

### 17.1 area_info - 区域信息表

存储角色的区域信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| charid | INT(11) | 角色ID | NOT NULL |
| area | INT(11) | 区域ID | NOT NULL |
| info | VARCHAR(255) | 信息 | NOT NULL |

### 17.2 bbs_threads - 论坛帖子表

存储论坛帖子。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| threadid | BIGINT(20) | 帖子ID | PK, Auto Increment |
| postercid | BIGINT(20) | 发帖角色ID | NOT NULL |
| name | VARCHAR(50) | 标题 | NOT NULL |
| timestamp | BIGINT(20) | 时间戳 | NOT NULL |
| icon | INT(11) | 图标 | NOT NULL |
| replycount | INT(11) | 回复数 | NOT NULL |
| startpost | TEXT | 帖子内容 | NOT NULL |
| guildid | BIGINT(20) | 关联公会ID | NOT NULL |
| localthreadid | BIGINT(20) | 本地帖子ID | NOT NULL |

### 17.3 bbs_replies - 论坛回复表

存储论坛回复。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| replyid | BIGINT(20) | 回复ID | PK, Auto Increment |
| threadid | BIGINT(20) | 所属帖子ID | NOT NULL |
| postercid | BIGINT(20) | 回复角色ID | NOT NULL |
| timestamp | BIGINT(20) | 时间戳 | NOT NULL |
| content | TEXT | 回复内容 | NOT NULL |

### 17.4 dueypackages - 杜伊快递包裹表

存储杜伊快递系统中的包裹。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| packageid | BIGINT(20) | 包裹ID | PK, Auto Increment |
| receiverid | BIGINT(20) | 接收者ID | NOT NULL |
| sendername | VARCHAR(32) | 发件人名称 | NOT NULL |
| mesos | BIGINT(20) | 金币 | NOT NULL |
| timestamp | TIMESTAMP | 时间 | NOT NULL |
| message | VARCHAR(220) | 消息 | NOT NULL |
| checked | INT(11) | 已查看 | NOT NULL |
| type | INT(11) | 类型 | NOT NULL |

### 17.5 dueyitems - 杜伊快递物品表

存储杜伊快递的物品。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| packageid | BIGINT(20) | 包裹ID | NOT NULL |
| inventoryitemid | BIGINT(20) | 物品ID | NOT NULL |

### 17.6 drop_data - 掉落数据表

存储怪物的物品掉落配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| dropperid | INT(11) | 掉落者ID | NOT NULL |
| itemid | INT(11) | 物品ID | NOT NULL |
| minimumQuantity | INT(11) | 最小数量 | NOT NULL |
| maximumQuantity | INT(11) | 最大数量 | NOT NULL |
| questid | INT(11) | 任务ID | NOT NULL |
| chance | INT(11) | 概率 | NOT NULL |

### 17.7 drop_data_global - 全局掉落数据表

存储全局物品掉落配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| continent | INT(11) | 大陆ID | NOT NULL |
| itemid | INT(11) | 物品ID | NOT NULL |
| minimumQuantity | INT(11) | 最小数量 | NOT NULL |
| maximumQuantity | INT(11) | 最大数量 | NOT NULL |
| questid | INT(11) | 任务ID | NOT NULL |
| chance | INT(11) | 概率 | NOT NULL |
| comments | VARCHAR(255) | 备注 | NOT NULL |

### 17.8 reactordrops - 反应堆掉落表

存储反应堆的物品掉落配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| reactordropid | BIGINT(20) | ID | PK, Auto Increment |
| reactorid | INT(11) | 反应堆ID | NOT NULL |
| itemid | INT(11) | 物品ID | NOT NULL |
| chance | INT(11) | 概率 | NOT NULL |
| questid | INT(11) | 任务ID | NOT NULL |

### 17.9 playernpcs - 玩家NPC表

存储玩家创建的NPC信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | NPC ID | PK, Auto Increment |
| name | VARCHAR(32) | NPC名称 | NOT NULL |
| hair | INT(11) | 发型 | NOT NULL |
| face | INT(11) | 脸型 | NOT NULL |
| skin | INT(11) | 肤色 | NOT NULL |
| gender | INT(11) | 性别 | NOT NULL |
| x | INT(11) | X坐标 | NOT NULL |
| cy | INT(11) | Y坐标 | NOT NULL |
| world | INT(11) | 世界ID | NOT NULL |
| map | INT(11) | 地图ID | NOT NULL |
| dir | INT(11) | 方向 | NOT NULL |
| scriptid | INT(11) | 脚本ID | NOT NULL |
| fh | INT(11) | 楼层高度 | NOT NULL |
| rx0 | INT(11) | X范围0 | NOT NULL |
| rx1 | INT(11) | X范围1 | NOT NULL |
| worldrank | INT(11) | 世界排名 | NOT NULL |
| overallrank | INT(11) | 总排名 | NOT NULL |
| worldjobrank | INT(11) | 世界职业排名 | NOT NULL |
| job | INT(11) | 职业 | NOT NULL |

### 17.10 playernpcs_equip - 玩家NPC装备表

存储玩家NPC的装备。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| npcid | INT(11) | NPC ID | NOT NULL |
| equipid | INT(11) | 装备ID | NOT NULL |
| type | INT(11) | 类型 | NOT NULL |
| equippos | SMALLINT(6) | 装备位置 | NOT NULL |

### 17.11 playernpcs_field - 玩家NPC字段表

存储玩家NPC的地图信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| world | INT(11) | 世界ID | NOT NULL |
| map | INT(11) | 地图ID | NOT NULL |
| step | INT(11) | 步骤 | NOT NULL |
| podium | INT(11) | 讲台 | NOT NULL |

### 17.12 medalmaps - 奖牌地图表

存储角色获得奖牌的地图信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| queststatusid | BIGINT(20) | 任务状态ID | NOT NULL |
| mapid | INT(11) | 地图ID | NOT NULL |

### 17.13 namechanges - 改名记录表

存储角色改名记录。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| characterid | INT(11) | 角色ID | NOT NULL |
| old | VARCHAR(32) | 原名称 | NOT NULL |
| new | VARCHAR(32) | 新名称 | NOT NULL |
| requestTime | TIMESTAMP | 申请时间 | NOT NULL |
| completionTime | TIMESTAMP | 完成时间 | NOT NULL |

### 17.14 newyear - 新年贺卡表

存储新年贺卡信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| senderid | INT(11) | 发件人ID | NOT NULL |
| sendername | VARCHAR(32) | 发件人名称 | NOT NULL |
| receiverid | INT(11) | 收件人ID | NOT NULL |
| receivername | VARCHAR(32) | 收件人名称 | NOT NULL |
| message | VARCHAR(200) | 祝福语 | NOT NULL |
| senderdiscard | TINYINT(1) | 发件人已丢弃 | NOT NULL |
| receiverdiscard | TINYINT(1) | 收件人已丢弃 | NOT NULL |
| received | TINYINT(1) | 已接收 | NOT NULL |
| timesent | BIGINT(20) | 发送时间 | NOT NULL |
| timereceived | BIGINT(20) | 接收时间 | NOT NULL |

### 17.15 nxcode - NX码表

存储NX兑换码。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| code | VARCHAR(32) | 兑换码 | NOT NULL |
| retriever | VARCHAR(32) | 领取者 | NOT NULL |
| expiration | BIGINT(20) | 过期时间 | NOT NULL |

### 17.16 nxcode_items - NX码物品表

存储NX码可兑换的物品。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| codeid | INT(11) | 兑换码ID | NOT NULL |
| type | INT(11) | 类型 | NOT NULL |
| item | INT(11) | 物品ID | NOT NULL |
| quantity | INT(11) | 数量 | NOT NULL |

### 17.17 nxcoupons - NX优惠券表

存储NX优惠券配置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| couponid | INT(11) | 优惠券ID | NOT NULL |
| rate | INT(11) | 折扣率 | NOT NULL |
| activeday | INT(11) | 激活天数 | NOT NULL |
| starthour | INT(11) | 开始小时 | NOT NULL |
| endhour | INT(11) | 结束小时 | NOT NULL |

### 17.18 server_queue - 服务器队列表

存储服务器队列信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| accountid | INT(11) | 账号ID | NOT NULL |
| characterid | INT(11) | 角色ID | NOT NULL |
| type | INT(11) | 类型 | NOT NULL |
| value | INT(11) | 值 | NOT NULL |
| message | VARCHAR(255) | 消息 | NOT NULL |
| createTime | TIMESTAMP | 创建时间 | NOT NULL |

### 17.19 playerdiseases - 玩家异常状态表

存储角色受到的状态异常。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| charid | INT(11) | 角色ID | NOT NULL |
| disease | INT(11) | 异常状态ID | NOT NULL |
| mobskillid | INT(11) |怪物技能ID | NOT NULL |
| mobskilllv | INT(11) | 怪物技能等级 | NOT NULL |
| length | BIGINT(20) | 持续时间 | NOT NULL |

### 17.20 game_config - 游戏配置表

存储游戏系统的各种配置参数。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| configType | VARCHAR(64) | 配置类型 | NOT NULL |
| configSubType | VARCHAR(64) | 配置子类型 | NOT NULL |
| configClazz | VARCHAR(128) | 配置值Java类型 | NOT NULL |
| configCode | VARCHAR(64) | 配置编码 | NOT NULL |
| configValue | VARCHAR(512) | 配置值 | NOT NULL |
| configDesc | VARCHAR(255) | 配置描述 | NOT NULL |
| updateTime | DATE | 更新时间 | NOT NULL |

### 17.21 lang_resources - 语言资源表

存储游戏的多语言资源。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| langType | VARCHAR(16) | 语言类型 | NOT NULL |
| langBase | VARCHAR(32) | 语言基础 | NOT NULL |
| langCode | VARCHAR(128) | 语言编码 | NOT NULL |
| langValue | VARCHAR(512) | 语言值 | NOT NULL |
| langExtend | VARCHAR(512) | 扩展字段 | NOT NULL |

### 17.22 command_info - 命令信息表

存储GM命令的配置信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| level | INT(11) | 命令等级 | NOT NULL |
| syntax | VARCHAR(255) | 命令语法 | NOT NULL |
| defaultLevel | INT(11) | 默认等级 | NOT NULL |
| clazz | VARCHAR(128) | 命令类 | NOT NULL |
| enabled | TINYINT(1) | 是否启用 | NOT NULL |

### 17.23 hp_mp_alert - HP/MP警报表

存储角色HP/MP警报设置。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| cId | INT(11) | 角色ID | NOT NULL |
| hp | TINYINT(3) | HP警报阈值 | NOT NULL |
| mp | TINYINT(3) | MP警报阈值 | NOT NULL |

### 17.24 flyway_schema_history - Flyway迁移历史表

存储Flyway数据库迁移的执行历史。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| installedRank | INT(11) | 排名 | PK |
| version | VARCHAR(50) | 版本号 | NULL |
| description | VARCHAR(200) | 描述 | NOT NULL |
| type | VARCHAR(20) | 类型 | NOT NULL |
| script | VARCHAR(1000) | 脚本名称 | NOT NULL |
| checksum | INT(11) | 校验和 | NULL |
| installedBy | VARCHAR(100) | 执行者 | NOT NULL |
| installedOn | TIMESTAMP | 执行时间 | NOT NULL |
| executionTime | INT(11) | 执行时长 | NOT NULL |
| success | TINYINT(1) | 是否成功 | NOT NULL |

### 17.25 extend_value - 扩展值表

存储各种扩展字段数据。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| extendId | VARCHAR(64) | 扩展ID | PK |
| extendType | VARCHAR(16) | 扩展类型 | PK |
| extendName | VARCHAR(64) | 扩展名称 | PK |
| extendValue | VARCHAR(512) | 扩展值 | NOT NULL |
| createTime | DATE | 创建时间 | NOT NULL |
| updateTime | DATE | 更新时间 | NOT NULL |

**extendType 类型说明:**
- 11: 账号
- 12: 账号日清
- 13: 账号周清
- 21: 角色
- 22: 角色日清
- 23: 角色周清

### 17.26 wishlists - 愿望清单表

存储角色的愿望清单。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INT(11) | ID | PK, Auto Increment |
| charid | INT(11) | 角色ID | NOT NULL |
| sn | INT(11) | 物品SN | NOT NULL |

### 17.27 fredstorage - 自由市场仓库表

存储角色在自由市场的仓库信息。

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | BIGINT(20) | ID | PK, Auto Increment |
| cid | BIGINT(20) | 角色ID | NOT NULL |
| daynotes | BIGINT(20) | 日记 | NOT NULL |
| timestamp | TIMESTAMP | 时间 | NOT NULL |

---

## 18. 表间关系概述

### 18.1 核心外键关系

```
accounts (1) ──────< characters (多)
    │
    └──< storages
    └──< hwidaccounts
    └──< quickslotkeymapped

characters (1) ──────< skills
    │                 └─────< cooldowns
    │
    ├──< buddies
    ├──< inventoryitems ────< inventoryequipment
    │                     └─────< inventorymerchant
    ├──< queststatus ────< questprogress
    │               ├──< questactions
    │               └─────< questrequirements
    ├──< skills
    ├──< keymap
    ├──< skillmacros
    ├──< savedlocations
    ├──< trocklocations
    ├──< pets ────< petignores
    ├──< monsterbook
    ├──< notes
    ├──< famelog
    ├──< worldtransfers
    ├──< reports
    ├──< dueypackages ────< dueyitems
    ├──< marriages ────< rings
    ├──< namechanges
    ├──< medalmaps
    ├──< server_queue
    ├──< playerdiseases
    ├──< hp_mp_alert
    ├──< area_info
    ├──< wishlists
    ├──< family_character ────< family_entitlement
    │
    └──> guilds ────> alliance
```

### 18.2 索引优化建议

| 表名 | 重要索引 | 用途 |
|------|----------|------|
| characters | accountid, level+exp, party | 账号角色查询, 等级排名, 队伍查询 |
| inventoryitems | characterid | 角色背包查询 |
| inventoryequipment | inventoryitemid | 装备详情查询 |
| skills | characterid | 角色技能查询 |
| queststatus | characterid | 角色任务查询 |
| drop_data | dropperid, questid | 掉落查询 |
| guilds | name | 公会名称查询 |
| accounts | name | 账号登录查询 |

---

## 19. 版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-03-26 | 初始版本，完整数据表文档 |

---

*文档生成时间: 2026-03-26*
*数据库版本: MySQL 8.4.0*
*ORM框架: MyBatis-Flex 1.8.9*
