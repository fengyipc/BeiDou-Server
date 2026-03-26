# API 接口文档

## 1. 概述

本文档详细说明 BeiDou-Server 项目的所有 Web API 接口。服务器采用 Spring Boot 3.2.3 框架构建，基于 SpringDoc 2.5.0 提供 OpenAPI 3.0 规范的接口文档。

### 1.1 基础信息

| 项目 | 说明 |
|------|------|
| 服务器端口 | 8686 |
| API 版本前缀 | `/v1` |
| 接口文档地址 | `/swagger-ui.html` |
| OpenAPI 规范 | `/v3/api-docs` |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |

### 1.2 认证说明

除登录接口外，所有接口需要在请求头中携带 Token 进行身份认证：

```
Authorization: Bearer <token>
```

登录成功后返回的 Token 用于访问其他受保护的接口。Token 过期可通过刷新接口续期。

### 1.3 通用请求格式

```json
{
    "data": { ... }
}
```

### 1.4 通用响应格式

```json
{
    "code": 200,
    "msg": "success",
    "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码，200 表示成功 |
| msg | string | 响应消息 |
| data | object | 响应数据 |

---

## 2. 认证接口 (AuthController)

**基础路径**: `/auth/v1`

### 2.1 登录

用户登录系统，获取访问令牌。

**请求地址**: `POST /auth/v1/login`

**请求参数**:
```json
{
    "data": {
        "username": "string",
        "password": "string"
    }
}
```

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
    }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

### 2.2 登出

注销当前登录状态。

**请求地址**: `DELETE /auth/v1/logout`

**请求头**: `Authorization: Bearer <token>`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": null
}
```

### 2.3 刷新Token

刷新访问令牌的有效期。

**请求地址**: `GET /auth/v1/refreshToken`

**请求头**: `Authorization: Bearer <token>`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
    }
}
```

---

## 3. 账号接口 (AccountController)

**基础路径**: `/account/v1`

### 3.1 获取我的信息

获取当前登录账号的信息。

**请求地址**: `GET /account/v1/info`

**请求头**: `Authorization: Bearer <token>`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": {
        "id": 1,
        "name": "admin",
        "loggedIn": false,
        "lastLogin": "2026-03-25T10:30:00",
        "createdAt": "2026-01-01T00:00:00"
    }
}
```

### 3.2 获取账号列表

分页查询账号列表，支持多条件筛选。

**请求地址**: `GET /account/v1`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认第1页 |
| size | int | 否 | 每页条数，默认10 |
| id | int | 否 | 账号ID |
| name | string | 否 | 账号名称 |
| lastLoginStart | string | 否 | 最近登录时间范围起始 (yyyy-MM-dd) |
| lastLoginEnd | string | 否 | 最近登录时间范围结束 (yyyy-MM-dd) |
| createdAtStart | string | 否 | 创建时间范围起始 (yyyy-MM-dd) |
| createdAtEnd | string | 否 | 创建时间范围结束 (yyyy-MM-dd) |

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": {
        "totalRow": 100,
        "pageNumber": 1,
        "pageSize": 10,
        "totalPage": 10,
        "records": [...]
    }
}
```

### 3.3 注册账号

创建新的游戏账号。

**请求地址**: `POST /account/v1`

**请求体**:
```json
{
    "data": {
        "name": "string",
        "password": "string"
    }
}
```

**响应**: 返回成功状态

### 3.4 更新账号资料[用户]

用户自行更新账号资料，需校验旧密码，新密码留空则不修改。

**请求地址**: `PUT /account/v1`

**请求体**:
```json
{
    "data": {
        "oldPassword": "string",
        "password": "string",
        "pic": "string",
        "pin": "string"
    }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| password | string | 否 | 新密码（留空则不修改） |
| pic | string | 否 | PIC码 |
| pin | string | 否 | PIN码 |

### 3.5 更新账号资料[GM]

管理员更新指定账号的资料。

**请求地址**: `PUT /account/v1/{id}`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 账号ID |

**请求体**:
```json
{
    "data": {
        "password": "string",
        "loggedIn": false,
        "gm": 0
    }
}
```

### 3.6 删除账号

删除指定账号。

**请求地址**: `DELETE /account/v1/{id}`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 账号ID |

**响应**: 返回成功状态

### 3.7 重置在线状态

重置账号的所有在线状态。

**请求地址**: `PUT /account/v1/{id}/reset/logged`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 账号ID |

**响应**: 返回成功状态

### 3.8 封停账号

对指定账号实施封禁。

**请求地址**: `PUT /account/v1/{id}/ban`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 账号ID |

**请求体**:
```json
{
    "data": {
        "reason": "string"
    }
}
```

### 3.9 解封账号

解除指定账号的封禁状态。

**请求地址**: `PUT /account/v1/{id}/unban`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | int | 账号ID |

**响应**: 返回成功状态

---

## 4. 角色接口 (CharacterController)

**基础路径**: `/character/v1`

### 4.1 调整玩家个人倍率

调整指定玩家的经验、金币、掉落倍率。

**请求地址**: `POST /character/v1/updateRate`

**请求体**:
```json
{
    "data": {
        "characterId": 123,
        "extendName": "expRate",
        "extendValue": 2.0
    }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| characterId | long | 是 | 角色ID |
| extendName | string | 是 | 倍率类型: `expRate` / `mesoRate` / `dropRate` |
| extendValue | double | 是 | 倍率值 |

### 4.2 重置玩家个人倍率

重置指定玩家的单项倍率。

**请求地址**: `POST /character/v1/resetRate`

**请求体**:
```json
{
    "data": {
        "characterId": 123,
        "extendName": "expRate"
    }
}
```

### 4.3 重置玩家个人所有倍率

重置指定玩家的所有个人倍率。

**请求地址**: `GET /character/v1/resetRates`

**请求体**:
```json
{
    "data": {
        "characterId": 123
    }
}
```

### 4.4 查询在线玩家列表

分页查询当前在线的玩家列表。

**请求地址**: `POST /character/v1/online/list`

**请求体**:
```json
{
    "data": {
        "worldId": 0,
        "channelId": 0,
        "pageNumber": 1,
        "pageSize": 10
    }
}
```

---

## 5. 命令接口 (CommandController)

**基础路径**: `/command/v1`

### 5.1 查询命令库

查询数据库中所有GM命令及其状态。

**请求地址**: `POST /command/v1/getCommandListFromDB`

**请求体**:
```json
{
    "data": {
        "pageNumber": 1,
        "pageSize": 10,
        "commandName": "string",
        "status": 0
    }
}
```

### 5.2 更新命令库

更新指定GM命令的状态。

**请求地址**: `POST /command/v1/updateCommand`

**请求体**:
```json
{
    "data": {
        "id": 1,
        "commandName": "string",
        "status": 0
    }
}
```

### 5.3 重载事件

通过GM命令重载所有事件脚本。

**请求地址**: `GET /command/v1/reloadEventsByGMCommand`

**响应**: 返回成功状态

### 5.4 重装传送点

通过GM命令重装所有传送点。

**请求地址**: `GET /command/v1/reloadPortalsByGMCommand`

**响应**: 返回成功状态

### 5.5 重装地图

通过GM命令重装所有地图数据。

**请求地址**: `GET /command/v1/reloadMapsByGMCommand`

**响应**: 返回成功状态

---

## 6. 公共接口 (CommonController)

**基础路径**: `/common/v1`

### 6.1 查询装备基础属性信息

根据物品ID查询装备的基础属性信息。

**请求地址**: `POST /common/v1/getEquipmentInfoByItemId`

**请求体**:
```json
{
    "data": {
        "itemId": 1002000
    }
}
```

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": {
        "itemId": 1002000,
        "itemName": "青铜剑",
        "stats": {
            "STR": 10,
            "DEX": 5
        }
    }
}
```

### 6.2 查询所有世界在线玩家数量

查询指定世界列表中当前在线的玩家总数。

**请求地址**: `POST /common/v1/getAllWorldsOnlinePlayersCount`

**请求体**:
```json
{
    "data": {
        "worldIdList": [0, 1, 2]
    }
}
```

### 6.3 资料查询

根据角色ID或名称查询对应的信息。

**请求地址**: `POST /common/v1/informationSearch`

**请求体**:
```json
{
    "data": {
        "id": 123,
        "name": "string"
    }
}
```

---

## 7. 配置接口 (ConfigController)

**基础路径**: `/config/v1`

### 7.1 获取参数大类和参数类型

获取所有游戏配置参数的分类信息。

**请求地址**: `GET /config/v1/getConfigTypeList`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": {
        "categories": [...],
        "types": [...]
    }
}
```

### 7.2 分页获取参数列表

分页查询游戏配置参数列表。

**请求地址**: `POST /config/v1/getConfigList`

**请求体**:
```json
{
    "data": {
        "pageNumber": 1,
        "pageSize": 10,
        "category": "string",
        "type": "string",
        "keyWord": "string"
    }
}
```

### 7.3 新增参数

添加新的游戏配置参数。

**请求地址**: `POST /config/v1/addConfig`

**请求体**:
```json
{
    "data": {
        "category": "string",
        "type": "string",
        "key": "string",
        "value": "string",
        "description": "string"
    }
}
```

### 7.4 修改参数

更新现有游戏配置参数。

**请求地址**: `POST /config/v1/updateConfig`

**请求体**:
```json
{
    "data": {
        "id": 1,
        "category": "string",
        "type": "string",
        "key": "string",
        "value": "string",
        "description": "string"
    }
}
```

### 7.5 删除参数

删除指定ID的配置参数。

**请求地址**: `DELETE /config/v1/deleteConfig/{id}`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 配置参数ID |

**响应**: 返回成功状态

### 7.6 批量删除参数

批量删除多个配置参数。

**请求地址**: `POST /config/v1/deleteConfigList`

**请求体**:
```json
{
    "data": [1, 2, 3]
}
```

### 7.7 从YML导入参数

从YAML格式文件导入配置参数。

**请求地址**: `POST /config/v1/importYml`

**Content-Type**: `multipart/form-data`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | YAML格式的配置文件 |

### 7.8 导出YML

导出所有配置参数为YAML格式文件。

**请求地址**: `GET /config/v1/exportYml`

**响应**: 返回YAML文件下载

---

## 8. 掉落接口 (DropController)

**基础路径**: `/drop/v1`

### 8.1 分页获取掉落列表

分页查询怪物掉落列表。

**请求地址**: `POST /drop/v1/getDropList`

**请求体**:
```json
{
    "data": {
        "pageNumber": 1,
        "pageSize": 10,
        "monsterId": 100,
        "itemId": 1002000
    }
}
```

### 8.2 分页获取全局掉落列表

分页查询全局掉落配置列表。

**请求地址**: `POST /drop/v1/getGlobalDropList`

**请求体**: 同 8.1

### 8.3 新增掉落

添加怪物掉落配置，返回新增记录的ID。

**请求地址**: `PUT /drop/v1/addDropData`

**请求体**:
```json
{
    "data": {
        "monsterId": 100,
        "itemId": 1002000,
        "quantity": 1,
        "prob": 0.5
    }
}
```

### 8.4 新增全局掉落

添加全局掉落配置，返回新增记录的ID。

**请求地址**: `PUT /drop/v1/addGlobalDropData`

**请求体**:
```json
{
    "data": {
        "itemId": 1002000,
        "quantity": 1,
        "prob": 0.5
    }
}
```

### 8.5 更新掉落信息

更新指定ID的掉落配置。

**请求地址**: `POST /drop/v1/updateDropData`

**请求体**:
```json
{
    "data": {
        "id": 1,
        "monsterId": 100,
        "itemId": 1002000,
        "quantity": 1,
        "prob": 0.5
    }
}
```

### 8.6 更新全局掉落信息

更新指定ID的全局掉落配置。

**请求地址**: `POST /drop/v1/updateGlobalDropData`

### 8.7 删除掉落信息

删除指定ID的掉落配置。

**请求地址**: `DELETE /drop/v1/deleteDropData/{id}`

### 8.8 删除全局掉落信息

删除指定ID的全局掉落配置。

**请求地址**: `DELETE /drop/v1/deleteGlobalDropData/{id}`

---

## 9. 文件接口 (FileController)

**基础路径**: `/file/v1`

### 9.1 读取文件

读取指定路径的文件内容。

**请求地址**: `POST /file/v1/tree/read`

**请求体**:
```json
{
    "data": {
        "currentKey": "/scripts/npc/100.js",
        "title": "npc"
    }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| currentKey | string | 是 | 文件路径 |
| title | string | 是 | 文件类型标识 |

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": "// NPC script content..."
}
```

### 9.2 写入文件

将内容写入指定路径的文件。

**请求地址**: `POST /file/v1/tree/write`

**请求体**:
```json
{
    "data": {
        "currentKey": "/scripts/npc/100.js",
        "title": "npc",
        "content": "// NPC script content..."
    }
}
```

### 9.3 读取文件树

获取指定目录下的文件树结构。

**请求地址**: `POST /file/v1/tree`

**请求体**:
```json
{
    "data": {
        "currentKey": "/scripts"
    }
}
```

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": [
        {
            "key": "/scripts/npc",
            "title": "npc",
            "isLeaf": false
        },
        {
            "key": "/scripts/npc/100.js",
            "title": "100.js",
            "isLeaf": true
        }
    ]
}
```

---

## 10. 转蛋接口 (GachaponController)

**基础路径**: `/gachapon/v1`

### 10.1 获取奖池列表

分页查询转蛋奖池列表。

**请求地址**: `POST /gachapon/v1/getPools`

**请求体**:
```json
{
    "data": {
        "pageNumber": 1,
        "pageSize": 10,
        "name": "string"
    }
}
```

### 10.2 创建或更新奖池

创建新的奖池或更新现有奖池。

**请求地址**: `POST /gachapon/v1/updatePool`

**请求体**:
```json
{
    "data": {
        "id": 1,
        "name": "string",
        "description": "string",
        "open": true
    }
}
```

### 10.3 删除奖池

删除指定ID的转蛋奖池。

**请求地址**: `POST /gachapon/v1/deletePool`

**请求体**:
```json
{
    "data": {
        "id": 1
    }
}
```

### 10.4 获取奖品列表

获取指定奖池中的所有奖品。

**请求地址**: `POST /gachapon/v1/getRewards`

**请求体**:
```json
{
    "data": {
        "id": 1
    }
}
```

### 10.5 创建或更新奖品

创建新的奖品或更新现有奖品。

**请求地址**: `POST /gachapon/v1/updateReward`

**请求体**:
```json
{
    "data": {
        "id": 1,
        "poolId": 1,
        "itemId": 1002000,
        "quantity": 1,
        "prob": 0.01,
        "rank": "A"
    }
}
```

### 10.6 删除奖品

删除指定ID的转蛋奖品。

**请求地址**: `POST /gachapon/v1/deleteReward`

**请求体**:
```json
{
    "data": {
        "id": 1
    }
}
```

---

## 11. 分发接口 (GiveController)

**基础路径**: `/give/v1`

### 11.1 给玩家分发资源

向指定玩家分发游戏资源（道具、货币等）。

**请求地址**: `POST /give/v1/resource`

**请求体**:
```json
{
    "data": {
        "characterName": "string",
        "meso": 1000000,
        "itemId": 1002000,
        "quantity": 1
    }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| characterName | string | 是 | 角色名称 |
| meso | long | 否 | 金币数量 |
| itemId | long | 否 | 物品ID |
| quantity | int | 否 | 物品数量 |

---

## 12. 背包接口 (InventoryController)

**基础路径**: `/inventory/v1`

### 12.1 获取所有背包分类

获取游戏中所有背包类型的列表。

**请求地址**: `GET /inventory/v1/getInventoryTypeList`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": [
        {"type": 1, "name": "装备"},
        {"type": 2, "name": "消耗"},
        {"type": 3, "name": "设置"},
        {"type": 4, "name": "其他"},
        {"type": 5, "name": "现金"}
    ]
}
```

### 12.2 根据条件获取背包玩家列表

查询拥有特定物品的玩家列表。

**请求地址**: `POST /inventory/v1/getCharacterList`

**请求体**:
```json
{
    "data": {
        "pageNumber": 1,
        "pageSize": 10,
        "characterName": "string",
        "itemId": 1002000
    }
}
```

### 12.3 获取指定玩家背包分类下的所有物品

查询指定玩家特定背包分类中的所有物品。

**请求地址**: `POST /inventory/v1/getInventoryList`

**请求体**:
```json
{
    "data": {
        "characterId": 123,
        "inventoryType": 1
    }
}
```

### 12.4 根据条件修改玩家背包

修改玩家的背包数据（数量、位置等）。

**请求地址**: `POST /inventory/v1/updateInventory`

**请求体**:
```json
{
    "data": {
        "characterId": 123,
        "itemId": 1002000,
        "inventoryType": 1,
        "quantity": 100
    }
}
```

### 12.5 根据条件删除玩家背包

删除玩家背包中的物品。

**请求地址**: `POST /inventory/v1/deleteInventory`

**请求体**:
```json
{
    "data": {
        "characterId": 123,
        "itemId": 1002000,
        "inventoryType": 1
    }
}
```

---

## 13. 服务器接口 (ServerController)

**基础路径**: `/server/v1`

### 13.1 停止所有

完全停止服务器进程。

**请求地址**: `GET /server/v1/shutdown`

**注意**: 此操作会直接终止服务器进程。

### 13.2 停止服务

优雅停止游戏服务器。

**请求地址**: `GET /server/v1/stopServer`

### 13.3 自定义停止服务

发送自定义消息并停止服务器。

**请求地址**: `POST /server/v1/stopServerWithMsgAndInternal`

**请求体**:
```json
{
    "data": {
        "message": "服务器维护中",
        "countdown": 5
    }
}
```

| 参数 | 类型 | 说明 |
|------|------|------|
| message | string | 停服消息 |
| countdown | int | 停服倒计时（分钟） |

### 13.4 启动服务

启动游戏服务器。

**请求地址**: `GET /server/v1/startServer`

### 13.5 重启服务

重启游戏服务器。

**请求地址**: `GET /server/v1/restartServer`

### 13.6 查询服务状态

查询游戏服务器是否在线。

**请求地址**: `GET /server/v1/online`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": true
}
```

### 13.7 大区列表

获取所有游戏大区列表。

**请求地址**: `GET /server/v1/world/list`

### 13.8 频道列表

获取指定大区下的所有频道列表。

**请求地址**: `GET /server/v1/channel/list`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| worldId | int | 是 | 大区ID |

### 13.9 查询版本号

获取游戏服务器版本号。

**请求地址**: `GET /server/v1/version`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": "1.0.0"
}
```

---

## 14. 商店接口 (ShopController)

**基础路径**: `/shop/v1`

### 14.1 分页获取商店列表

分页查询游戏商店列表。

**请求地址**: `POST /shop/v1/getShopList`

**请求体**:
```json
{
    "data": {
        "pageNumber": 1,
        "pageSize": 10,
        "shopName": "string"
    }
}
```

### 14.2 分页获取商品列表

根据商店ID分页查询商店内的商品列表。

**请求地址**: `POST /shop/v1/getShopItemList`

**请求体**:
```json
{
    "data": {
        "pageNumber": 1,
        "pageSize": 10,
        "shopId": 1
    }
}
```

### 14.3 查询商品信息

根据商品ID查询详细信息。

**请求地址**: `GET /shop/v1/getShopItem/{id}`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | long | 商品ID |

### 14.4 新增商品

添加新的商店商品，返回新增商品的ID。

**请求地址**: `PUT /shop/v1/addShopItem`

**请求体**:
```json
{
    "data": {
        "shopId": 1,
        "itemId": 1002000,
        "price": 1000,
        "stock": 100
    }
}
```

### 14.5 更新商品信息

更新指定商品的信息。

**请求地址**: `POST /shop/v1/updateShopItem`

**请求体**:
```json
{
    "data": {
        "id": 1,
        "shopId": 1,
        "itemId": 1002000,
        "price": 1000,
        "stock": 100
    }
}
```

### 14.6 删除商品信息

删除指定ID的商品。

**请求地址**: `DELETE /shop/v1/deleteShopItem/{id}`

---

## 15. 现金商城接口 (CashShopController)

**基础路径**: `/cashShop/v1`

### 15.1 获取商城全部分类

获取现金商城的全部商品分类。

**请求地址**: `GET /cashShop/v1/getAllCategoryList`

**响应示例**:
```json
{
    "code": 200,
    "msg": "success",
    "data": [
        {"id": 1, "name": "热门商品"},
        {"id": 2, "name": "新品上架"},
        {"id": 3, "name": "限时特价"}
    ]
}
```

### 15.2 分类查询商品列表

分页查询指定分类下的商品列表。

**请求地址**: `POST /cashShop/v1/getCommodityByCategory`

**请求体**:
```json
{
    "data": {
        "categoryId": 1,
        "pageNumber": 1,
        "pageSize": 10
    }
}
```

### 15.3 根据SN查询商品明细

根据商品序列号查询商品详细信息。

**请求地址**: `GET /cashShop/v1/getCommodityBySn/{sn}`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| sn | int | 商品序列号 |

### 15.4 上架商品

将商品上架到现金商城。

**请求地址**: `POST /cashShop/v1/onSale`

**请求体**:
```json
{
    "data": {
        "sn": 1,
        "itemId": 1002000,
        "price": 100
    }
}
```

### 15.5 下架商品

将商品从现金商城下架。

**请求地址**: `POST /cashShop/v1/offSale`

**请求体**:
```json
{
    "data": {
        "sn": 1
    }
}
```

### 15.6 批量上架商品

批量将多个商品上架到现金商城。

**请求地址**: `POST /cashShop/v1/batchOnSale`

**请求体**:
```json
{
    "data": {
        "snList": [1, 2, 3]
    }
}
```

---

## 16. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或Token过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 17. 接口统计

| 模块 | 接口数量 |
|------|----------|
| 认证 (Auth) | 3 |
| 账号 (Account) | 9 |
| 角色 (Character) | 4 |
| 命令 (Command) | 5 |
| 公共 (Common) | 3 |
| 配置 (Config) | 8 |
| 掉落 (Drop) | 8 |
| 文件 (File) | 3 |
| 转蛋 (Gachapon) | 6 |
| 分发 (Give) | 1 |
| 背包 (Inventory) | 5 |
| 服务器 (Server) | 9 |
| 商店 (Shop) | 6 |
| 现金商城 (CashShop) | 6 |
| **总计** | **76** |

---

*文档版本: 1.0*
*最后更新: 2026-03-26*
