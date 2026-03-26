# WZ 数据解析

## 1. WZ文件概述

WZ文件是MapleStory（冒险岛）游戏中用于存储游戏数据的一种专有格式。WZ文件包含了游戏客户端所需的各类资源数据，如地图信息、怪物数据、NPC数据、道具数据、技能数据等。

本项目采用**XML格式**存储WZ数据，存放在`wz/`目录下，每个WZ文件对应一个子目录（如`Map.wz/`、`Mob.wz/`等），内部包含多个`.xml`文件。

### WZ文件目录结构

```
wz/
├── Base.wz/          # 基础数据
├── Character.wz/     # 角色相关数据
├── Effect.wz/        # 效果数据
├── Etc.wz/           # 杂项数据
├── Item.wz/          # 道具数据
├── Map.wz/           # 地图数据
├── Mob.wz/           # 怪物数据
├── Morph.wz/         # 变身数据
├── Npc.wz/           # NPC数据
├── Quest.wz/          # 任务数据
├── Reactor.wz/        # 反应堆数据
├── Skill.wz/          # 技能数据
├── Sound.wz/         # 声音数据
├── String.wz/        # 字符串数据
├── TamingMob.wz/     # 驯服怪物数据
└── UI.wz/            # UI数据
```

## 2. WZ文件结构

### 2.1 XML格式结构

每个WZ数据文件（如`.img.xml`）采用XML格式存储，主要包含以下节点类型：

| 节点名称 | 类型 | 说明 |
|---------|------|------|
| `imgdir` | PROPERTY | 目录节点，包含子节点 |
| `canvas` | CANVAS | 图片/画布数据 |
| `vector` | VECTOR | 二维坐标点（x, y） |
| `int` | INT | 整数类型 |
| `short` | SHORT | 短整数类型 |
| `double` | DOUBLE | 双精度浮点数 |
| `float` | FLOAT | 单精度浮点数 |
| `string` | STRING | 字符串类型 |
| `sound` | SOUND | 音频数据 |
| `uol` | UOL | 指向其他节点的引用 |
| `convex` | CONVEX | 凸多边形数据 |
| `null` | IMG_0x00 | 空值 |

### 2.2 节点属性

每个XML节点都包含以下标准属性：

- `name`: 节点名称标识
- `value`: 节点的值（部分类型具备）

示例XML结构：
```xml
<imgdir name="info">
    <int name="id" value="100000"/>
    <string name="name" value="橡果".
    <vector name="pos" x="0" y="0"/>
</imgdir>
```

## 3. WZ解析器架构

### 3.1 核心类图

```mermaid
classDiagram
    class DataProvider {
        <<interface>>
        +getData(path) Data
        +getRoot() DataDirectoryEntry
    }

    class XMLWZFile {
        -Path root
        -WZDirectoryEntry rootForNavigation
        +getData(path) Data
        +getRoot() DataDirectoryEntry
        -fillMapleDataEntitys()
    }

    class XMLDomMapleData {
        -Node node
        -Path imageDataDir
        +getChildByPath(path) Data
        +getChildren() List~Data~
        +getData() Object
        +getType() DataType
        +getName() String
        +getAttributeValue(name) String
    }

    class Data {
        <<interface>>
        +getName() String
        +getType() DataType
        +getChildren() List~Data~
        +getChildByPath(path) Data
        +getData() Object
        +getAttributeValue(name) String
    }

    class WZEntry {
        -String name
        -int size
        -int checksum
        -int offset
        -DataEntity parent
    }

    class WZDirectoryEntry {
        -List~DataDirectoryEntry~ subdirs
        -List~DataFileEntry~ files
        -Map~String, DataEntry~ entries
        +addDirectory()
        +addFile()
        +getEntry(name)
    }

    class WZFileEntry {
        -int offset
        +setOffset()
    }

    class WZFiles {
        <<enumeration>>
        QUEST, ETC, ITEM, CHARACTER, STRING, LIST
        MOB, MAP, NPC, REACTOR, SKILL, SOUND, UI
        +getFile() Path
        +getFilePath() String
    }

    class DataProviderFactory {
        +getDataProvider(WZFiles) DataProvider
    }

    class DataTool {
        +getString()
        +getInt()
        +getDouble()
        +getFloat()
        +getPoint()
        +getLong()
        +getShort()
        +getAttributeValue*()
    }

    DataProvider <|-- XMLWZFile
    XMLWZFile --> WZDirectoryEntry
    XMLWZFile --> WZFileEntry
    WZEntry <|-- WZDirectoryEntry
    WZEntry <|-- WZFileEntry
    XMLWZFile --> DataProviderFactory
    DataProviderFactory --> WZFiles
    DataProviderFactory --> XMLDomMapleData
    XMLDomMapleData ..|> Data
```

### 3.2 解析流程

```mermaid
flowchart TD
    A[请求 WZ 数据] --> B[DataProviderFactory.getDataProvider]
    B --> C[创建 XMLWZFile 实例]
    C --> D[XMLWZFile.getData path]
    D --> E{查找 XML 文件}
    E -->|存在| F[创建 XMLDomMapleData]
    E -->|不存在| G[返回 null]
    F --> H[解析 XML DOM]
    H --> I[返回 Data 对象]
    I --> J[使用 DataTool 提取数据]
```

### 3.3 核心接口说明

#### DataProvider 接口

```java
public interface DataProvider {
    Data getData(String path);           // 根据路径获取数据
    DataDirectoryEntry getRoot();         // 获取根目录条目
}
```

#### Data 接口

```java
public interface Data extends DataEntity, Iterable<Data> {
    String getName();                    // 获取节点名称
    DataType getType();                  // 获取数据类型
    List<Data> getChildren();             // 获取所有子节点
    Data getChildByPath(String path);     // 按路径获取子节点
    Object getData();                     // 获取节点数据值
    String getAttributeValue(String name); // 获取属性值
}
```

## 4. 常见WZ类型

### 4.1 WZFiles 枚举

`WZFiles`定义了所有支持的WZ文件类型：

```java
public enum WZFiles {
    QUEST("Quest"),      // 任务数据
    ETC("Etc"),          // 杂项数据
    ITEM("Item"),        // 道具数据
    CHARACTER("Character"), // 角色数据
    STRING("String"),    // 字符串数据
    LIST("List"),        // 列表数据
    MOB("Mob"),          // 怪物数据
    MAP("Map"),          // 地图数据
    NPC("Npc"),          // NPC数据
    REACTOR("Reactor"),  // 反应堆数据
    SKILL("Skill"),      // 技能数据
    SOUND("Sound"),      // 声音数据
    UI("UI");            // UI数据

    public Path getFile();     // 获取文件路径
    public String getFilePath(); // 获取文件路径字符串
}
```

### 4.2 DataType 枚举

```java
public enum DataType {
    NONE,               // 无类型
    IMG_0x00,           // NULL/空值
    SHORT,              // 短整数
    INT,                // 整数
    FLOAT,              // 单精度浮点
    DOUBLE,             // 双精度浮点
    STRING,             // 字符串
    EXTENDED,           // 扩展类型
    PROPERTY,           // 属性/目录
    CANVAS,             // 画布/图片
    VECTOR,             // 坐标向量
    CONVEX,             // 凸多边形
    SOUND,              // 音频
    UOL,                // 引用
    UNKNOWN_TYPE,       // 未知类型
    UNKNOWN_EXTENDED_TYPE // 未知扩展类型
}
```

## 5. 数据提取方法

### 5.1 使用 DataTool 工具类

`DataTool`提供了便捷的静态方法用于提取各种类型的数据：

```java
// 字符串提取
String name = DataTool.getString(data);
String name = DataTool.getString("info/name", data);
String name = DataTool.getString("info/name", data, "默认名称");

// 整数提取
int id = DataTool.getInt(data);
int id = DataTool.getInt("info/id", data);
int id = DataTool.getInt("info/id", data, 0);
int id = DataTool.getIntConvert("info/id", data);  // 支持字符串转整数

// 浮点数提取
double d = DataTool.getDouble(data);
float f = DataTool.getFloat(data);

// 坐标提取
Point pos = DataTool.getPoint(data);
Point pos = DataTool.getPoint("info/pos", data);
Point pos = DataTool.getPoint("info/pos", data, new Point(0, 0));

// 长整数提取
long l = DataTool.getLong("info/value", data);
long l = DataTool.getLong("info/value", data, 0L);

// 属性提取
String value = DataTool.getAttributeValue(data, "name");
int value = DataTool.getAttributeValueInt(data, "id", 0);
```

### 5.2 路径访问模式

使用`getChildByPath`方法可以通过路径访问深层数据：

```java
// 获取嵌套数据
Data info = data.getChildByPath("info");
Data id = data.getChildByPath("info/id");
Data pos = data.getChildByPath("info/position/coord");

// 支持相对路径
Data parent = data.getChildByPath("..");
```

### 5.3 遍历子节点

```java
// 遍历所有子节点
for (Data child : data.getChildren()) {
    String name = child.getName();
    DataType type = child.getType();
    Object value = child.getData();
}

// 使用迭代器
Iterator<Data> iter = data.iterator();
while (iter.hasNext()) {
    Data child = iter.next();
    // 处理子节点
}
```

## 6. 相关代码示例

### 6.1 获取WZ数据提供器

```java
import org.gms.provider.DataProvider;
import org.gms.provider.DataProviderFactory;
import org.gms.provider.wz.WZFiles;
import org.gms.provider.Data;

// 获取道具数据提供器
DataProvider itemProvider = DataProviderFactory.getDataProvider(WZFiles.ITEM);

// 获取地图数据
DataProvider mapProvider = DataProviderFactory.getDataProvider(WZFiles.MAP);
Data mapData = mapProvider.getData("Map/Map1/100000000");
```

### 6.2 读取道具信息

```java
import org.gms.provider.Data;
import org.gms.provider.DataTool;
import org.gms.provider.DataProvider;
import org.gms.provider.DataProviderFactory;
import org.gms.provider.wz.WZFiles;

public void loadItemData() {
    DataProvider itemProvider = DataProviderFactory.getDataProvider(WZFiles.ITEM);
    Data itemData = itemProvider.getData("Item/Weapon/00000001.img.xml");

    if (itemData != null) {
        Data info = itemData.getChildByPath("info");

        // 提取各项属性
        int itemId = DataTool.getInt("itemId", info);
        String name = DataTool.getString("name", info);
        int price = DataTool.getInt("price", info, 0);
        int slotMax = DataTool.getInt("slotMax", info, 100);
    }
}
```

### 6.3 读取怪物数据

```java
public void loadMobData() {
    DataProvider mobProvider = DataProviderFactory.getDataProvider(WZFiles.MOB);
    Data mobData = mobProvider.getData("Mob/01001000.img.xml");

    if (mobData != null) {
        Data info = mobData.getChildByPath("info");

        int mobId = DataTool.getInt("id", info);
        String mobName = DataTool.getString("name", info);
        int level = DataTool.getInt("level", info, 1);
        int hp = DataTool.getInt("maxHP", info, 0);
        int mp = DataTool.getInt("maxMP", info, 0);
        int exp = DataTool.getInt("exp", info, 0);

        // 获取坐标信息
        Data speedData = info.getChildByPath("speed");
        if (speedData != null) {
            Point speed = DataTool.getPoint(speedData);
        }
    }
}
```

### 6.4 读取地图数据

```java
public void loadMapData() {
    DataProvider mapProvider = DataProviderFactory.getDataProvider(WZFiles.MAP);
    Data mapData = mapProvider.getData("Map/Map1/100000000.img.xml");

    if (mapData != null) {
        // 获取地图信息节点
        Data info = mapData.getChildByPath("info");

        // 提取地图属性
        int bgm = DataTool.getInt("bgm", info);
        int mapId = DataTool.getInt("mapId", info);
        int returnMap = DataTool.getInt("returnMap", info);

        // 获取链接信息
        Data linkData = info.getChildByPath("link");
        if (linkData != null) {
            String linkName = DataTool.getString(linkData);
        }

        // 遍历所有子节点
        for (Data child : mapData.getChildren()) {
            System.out.println("节点: " + child.getName() + ", 类型: " + child.getType());
        }
    }
}
```

### 6.5 字符串数据读取

```java
public void loadStringData() {
    DataProvider stringProvider = DataProviderFactory.getDataProvider(WZFiles.STRING);

    // 读取物品名称
    Data itemStringData = stringProvider.getData("String/Item.img.xml");
    if (itemStringData != null) {
        Data item3000 = itemStringData.getChildByPath("3000");
        if (item3000 != null) {
            String name = DataTool.getString("name", item3000);
            String desc = DataTool.getString("desc", item3000);
        }
    }

    // 读取NPC名称
    Data npcStringData = stringProvider.getData("String/Npc.img.xml");
    if (npcStringData != null) {
        Data npc9000018 = npcStringData.getChildByPath("9000018");
        if (npc9000018 != null) {
            String name = DataTool.getString("name", npc9000018);
        }
    }
}
```

### 6.6 多语言支持

项目支持多语言WZ数据，通过`wz-{locale}/`目录下的文件覆盖默认语言：

```java
// WZFiles.getFile() 自动处理语言优先级
// 优先取语言文件夹（如 wz-zh-CN/），没有则取 wz/
Path wzPath = WZFiles.ITEM.getFile();
// 返回 wz-zh-CN/Item.wz 或 wz/Item.wz
```

## 7. Mermaid架构图

### 7.1 完整数据加载流程

```mermaid
sequenceDiagram
    participant Client as 客户端
    participant Factory as DataProviderFactory
    participant Provider as XMLWZFile
    participant Parser as XMLDomMapleData
    participant Tool as DataTool

    Client->>Factory: getDataProvider(WZFiles.ITEM)
    Factory->>Provider: new XMLWZFile(path)
    Factory-->>Client: DataProvider

    Client->>Provider: getData("Item/Weapon/00000001")
    Provider->>Provider: 查找 .xml 文件
    Provider->>Parser: new XMLDomMapleData(fis)
    Parser->>Parser: 解析 XML DOM
    Parser-->>Provider: Data
    Provider-->>Client: Data

    Client->>Tool: getInt("info/id", data)
    Client->>Tool: getString("info/name", data)
    Client->>Tool: getPoint("info/pos", data)
```

### 7.2 WZ文件组织结构

```mermaid
graph TD
    A[wz 目录] --> B[Base.wz]
    A --> C[Character.wz]
    A --> D[Item.wz]
    A --> E[Map.wz]
    A --> F[Mob.wz]
    A --> G[Npc.wz]
    A --> H[Quest.wz]
    A --> I[Skill.wz]
    A --> J[String.wz]
    A --> K[UI.wz]

    C --> C1[Hair.xml]
    C --> C2[Face.xml]
    C --> C3[Cap.xml]

    D --> D1[Weapon.xml]
    D --> D2[Armor.xml]
    D --> D3[Pet.xml]

    E --> E1[Map1]
    E --> E2[Map2]
    E1 --> E3[100000000.img.xml]
    E3 --> E4[info]
    E3 --> E5[foothold]
    E3 --> E6[portal]

    F --> F1[01001000.img.xml]
    F --> F2[01011000.img.xml]
```

### 7.3 数据类型层次

```mermaid
classDiagram
    class DataType {
        <<enumeration>>
        NONE
        IMG_0x00
        SHORT
        INT
        FLOAT
        DOUBLE
        STRING
        EXTENDED
        PROPERTY
        CANVAS
        VECTOR
        CONVEX
        SOUND
        UOL
    }

    class "基本类型" {
        SHORT, INT, FLOAT, DOUBLE, STRING
    }

    class "复杂类型" {
        PROPERTY, CANVAS, VECTOR, CONVEX, SOUND, UOL
    }

    class "特殊类型" {
        NONE, IMG_0x00, EXTENDED
    }

    DataType <|-- 基本类型
    DataType <|-- 复杂类型
    DataType <|-- 特殊类型
