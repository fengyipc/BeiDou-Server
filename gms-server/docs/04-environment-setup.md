# 环境配置

## 1. 系统要求

### 1.1 硬件要求

#### 最低配置
- **CPU**: 2 核 2.0GHz+
- **内存**: 4GB RAM
- **硬盘**: 20GB 可用空间
- **网络**: 100Mbps 带宽

#### 推荐配置
- **CPU**: 4 核 3.0GHz+
- **内存**: 8GB RAM+
- **硬盘**: 50GB SSD
- **网络**: 1Gbps 带宽

### 1.2 软件要求

| 软件 | 版本 | 说明 |
|------|------|------|
| 操作系统 | Windows 10+ / Linux (Ubuntu 20.04+) | 推荐使用 Linux 服务器 |
| JDK | 21 | 必须安装 JDK 21 或更高版本 |
| Maven | 3.8+ | 用于项目构建和依赖管理 |
| MySQL | 8.0+ | 数据库服务器 |
| IDE | IntelliJ IDEA 2023+ | 推荐 IDEA，也可以使用 Eclipse |

## 2. 开发环境搭建

### 2.1 安装 JDK 21

#### Windows 系统

1. 下载 JDK 21
   - 访问 [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) 或 [OpenJDK](https://adoptium.net/)
   - 下载 Windows x64 版本

2. 安装 JDK
   ```bash
   # 运行安装程序，按照提示完成安装
   # 记住安装路径，例如: C:\Program Files\Java\jdk-21
   ```

3. 配置环境变量
   ```bash
   # 设置 JAVA_HOME
   JAVA_HOME=C:\Program Files\Java\jdk-21

   # 添加到 PATH
   PATH=%JAVA_HOME%\bin;%PATH%
   ```

4. 验证安装
   ```bash
   java -version
   # 输出应包含: openjdk version "21.x.x"
   ```

#### Linux 系统

1. 下载并安装 JDK 21
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install openjdk-21-jdk

   # CentOS/RHEL
   sudo yum install java-21-openjdk-devel
   ```

2. 配置环境变量
   ```bash
   # 编辑 ~/.bashrc 或 ~/.profile
   export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
   export PATH=$JAVA_HOME/bin:$PATH

   # 使配置生效
   source ~/.bashrc
   ```

3. 验证安装
   ```bash
   java -version
   javac -version
   ```

### 2.2 安装 Maven

#### Windows 系统

1. 下载 Maven
   - 访问 [Maven 官网](https://maven.apache.org/download.cgi)
   - 下载 apache-maven-3.9.x-bin.zip

2. 解压并配置
   ```bash
   # 解压到目录，例如: C:\Program Files\Apache\Maven
   # 设置环境变量
   MAVEN_HOME=C:\Program Files\Apache\Maven
   PATH=%MAVEN_HOME%\bin;%PATH%
   ```

3. 验证安装
   ```bash
   mvn -version
   ```

#### Linux 系统

```bash
# Ubuntu/Debian
sudo apt install maven

# CentOS/RHEL
sudo yum install maven

# 验证
mvn -version
```

### 2.3 安装 MySQL 8.0

#### Windows 系统

1. 下载 MySQL Installer
   - 访问 [MySQL 官网](https://dev.mysql.com/downloads/installer/)
   - 下载 MySQL Installer for Windows

2. 安装 MySQL
   - 运行安装程序
   - 选择 "Server only" 或 "Developer Default"
   - 设置 root 密码（请记住此密码）
   - 完成安装

3. 配置 MySQL
   ```sql
   -- 登录 MySQL
   mysql -u root -p

   -- 创建数据库
   CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

   -- 创建用户（可选，也可以直接使用 root）
   CREATE USER 'beidou'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON beidou.* TO 'beidou'@'localhost';
   FLUSH PRIVILEGES;
   ```

#### Linux 系统

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 登录并创建数据库
sudo mysql -u root -p

CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER 'beidou'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON beidou.* TO 'beidou'@'localhost';
FLUSH PRIVILEGES;
```

### 2.4 配置 MySQL 用户权限

根据 README.md 的说明，如果数据库用户不是 root 用户，需要额外配置以下权限：

```sql
-- performance_schema 库 user_variables_by_thread 表的 select 权限
GRANT SELECT ON performance_schema.user_variables_by_thread TO 'beidou'@'localhost';

-- mysql 库的 show view 权限
GRANT SHOW VIEW ON mysql.* TO 'beidou'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 2.5 安装 IDE

#### IntelliJ IDEA (推荐)

1. 下载并安装 IntelliJ IDEA
   - 访问 [JetBrains 官网](https://www.jetbrains.com/idea/)
   - 下载 Community 版本（免费）或 Ultimate 版本（付费）

2. 安装必要插件
   - Lombok Plugin
   - MyBatis Plugin
   - Spring Boot Helper

3. 配置 Maven
   - File → Settings → Build, Execution, Deployment → Build Tools → Maven
   - 设置 Maven home directory
   - 配置 user settings

4. 导入项目
   - File → Open
   - 选择项目根目录（包含 pom.xml）
   - 等待依赖下载完成

## 3. 项目配置

### 3.1 配置 application.yml

编辑 `src/main/resources/application.yml` 文件：

```yaml
server:
  port: 8686

app:
  vue: http://localhost:8787

jwt:
  # 生产环境请自行生成 UUID
  secret: "50da066e-6080-40f5-a173-86bd27d4f674"
  # token 过期时间（毫秒）默认 30min
  duration: 1800000

mybatis-flex:
  datasource:
    mysql:
      type: com.alibaba.druid.pool.DruidDataSource
      driver-class-name: com.mysql.cj.jdbc.Driver
      # 修改为你的数据库配置
      url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      username: root  # 修改为你的用户名
      password: root  # 修改为你的密码
  global-config:
    print-banner: false

# swagger路径：http://localhost:8686/swagger-ui/index.html
springdoc:
  # 生产环境需要关闭这2个参数
  api-docs:
    enabled: true
  swagger-ui:
    enabled: true

spring:
  flyway:
    # 禁用版本验证
    validate-on-migrate: false
  servlet:
    multipart:
      max-file-size: 1MB
      max-request-size: 10MB
  jackson:
    time-zone: Asia/Shanghai
    date-format: yyyy-MM-dd HH:mm:ss

gms:
  service:
    # zh-CN en-US
    language: zh-CN
    rate-limit:
      # 是否开启限流
      enabled: false
      # 每ip多少时间内最大请求数
      limit: 10
      # 每ip最大请求数多少时间重置，单位ms
      duration: 1000
      # 是否自动封禁
      auto-ban: false
    # 公网ip
    wan-host: 127.0.0.1
    # 局域网ip
    lan-host: 127.0.0.1
    # 本地ip
    localhost: 127.0.0.1
    # 客户端登录端口
    login-port: 8484
```

### 3.2 配置 IDEA 工作目录

根据 README.md 的说明，如果是直接打开的 Cosmic 目录运行，需要在 server 的编译配置里设置 Working directory 为 gms-server。

1. 打开 Run/Debug Configurations
2. 选择 ServerApplication 配置
3. 设置 Working directory 为: `$PROJECT_DIR$/gms-server`

## 4. 数据库初始化

### 4.1 自动初始化

项目启动时会自动创建数据库（如果不存在），不需要手动创建。

### 4.2 执行数据库迁移

项目使用 Flyway 进行数据库版本管理，启动时会自动执行迁移脚本：

1. 迁移脚本位于: `src/main/resources/db/migration/`
2. 文件命名格式: `V{version}__{description}.sql`
3. 启动时自动执行未执行的迁移脚本

### 4.3 创建管理员账号

执行迁移脚本 V1.0.67__admin.sql 会自动创建管理员账号：

- 账号: admin
- 密码: admin123 (首次登录后请立即修改)

## 5. 编译项目

### 5.1 使用 Maven 编译

```bash
# 进入项目目录
cd d:/MapleStorySource/BeiDou-Server/gms-server

# 清理并编译
mvn clean compile

# 打包
mvn clean package

# 跳过测试打包
mvn clean package -DskipTests
```

### 5.2 使用 IDE 编译

1. 在 IntelliJ IDEA 中打开项目
2. 等待依赖下载完成
3. 点击 Build → Build Project
4. 或使用快捷键 Ctrl+F9 (Windows) / Cmd+F9 (Mac)

## 6. 测试环境

### 6.1 测试数据库连接

```bash
# 使用 MySQL 客户端测试
mysql -u beidou -p beidou

# 查看数据库表
SHOW TABLES;
```

### 6.2 测试 API 服务

启动服务后，访问 Swagger 文档：

```
http://localhost:8686/swagger-ui/index.html
```

测试登录接口：

```bash
curl -X POST "http://localhost:8686/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

## 7. 环境变量配置（可选）

### 7.1 使用环境变量

可以通过环境变量覆盖配置文件中的设置：

```bash
# Windows
set GMS_JWT_SECRET=your-secret-key
set GMS_DB_URL=jdbc:mysql://localhost:3306/beidou
set GMS_DB_USERNAME=beidou
set GMS_DB_PASSWORD=your-password

# Linux/Mac
export GMS_JWT_SECRET=your-secret-key
export GMS_DB_URL=jdbc:mysql://localhost:3306/beidou
export GMS_DB_USERNAME=beidou
export GMS_DB_PASSWORD=your-password
```

### 7.2 JVM 参数

可以通过 JVM 参数传递配置：

```bash
java -jar BeiDou.jar \
  --mybatis-flex.datasource.mysql.url=jdbc:mysql://localhost:3306/beidou \
  --mybatis-flex.datasource.mysql.username=beidou \
  --mybatis-flex.datasource.mysql.password=your-password
```

## 8. 常见问题

### 8.1 Maven 依赖下载失败

**问题**: Maven 无法下载依赖

**解决方案**:
1. 检查网络连接
2. 配置国内镜像源（已配置阿里云镜像）
3. 清除本地缓存: `mvn clean`
4. 强制更新: `mvn clean install -U`

### 8.2 数据库连接失败

**问题**: 无法连接到 MySQL 数据库

**解决方案**:
1. 检查 MySQL 服务是否启动
2. 验证用户名和密码是否正确
3. 检查防火墙设置
4. 确认数据库权限配置正确

### 8.3 JDK 版本不匹配

**问题**: 提示 JDK 版本不正确

**解决方案**:
1. 确认安装了 JDK 21
2. 检查 JAVA_HOME 环境变量
3. 在 IDEA 中配置 Project SDK

### 8.4 Flyway 迁移失败

**问题**: 数据库迁移执行失败

**解决方案**:
1. 检查数据库连接配置
2. 查看日志文件定位错误
3. 可以手动清理 flyway_history 表重新迁移
4. 使用 `validate-on-migrate: false` 跳过验证

## 9. 性能优化建议

### 9.1 JVM 参数优化

```bash
java -Xms2G -Xmx4G \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UseStringDeduplication \
  -jar BeiDou.jar
```

### 9.2 MySQL 优化

编辑 MySQL 配置文件 `my.cnf` (Linux) 或 `my.ini` (Windows):

```ini
[mysqld]
# 连接数配置
max_connections = 500
max_connect_errors = 100000

# 缓冲区配置
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M

# 查询缓存
query_cache_size = 128M
query_cache_type = 1

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
```

---

*文档版本: 1.0*
*最后更新: 2026-03-25*
