# 安装指南

## 1. 前置准备

### 1.1 检查系统要求

在开始安装前，请确保您的系统满足以下要求：

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Windows 10+ / Ubuntu 20.04+ | Windows 11 / Ubuntu 22.04+ |
| CPU | 2 核 2.0GHz+ | 4 核 3.0GHz+ |
| 内存 | 4GB RAM | 8GB RAM+ |
| 硬盘 | 20GB 可用空间 | 50GB SSD |
| 网络 | 100Mbps | 1Gbps |
| JDK | Java 21 | Java 21 |
| MySQL | 8.0+ | 8.0+ |

### 1.2 检查已安装软件

```bash
# 检查 Java 版本
java -version
# 应输出: java version "21.x.x"

# 检查 Maven
mvn -version
# 应输出 Maven 版本信息

# 检查 MySQL
mysql --version
# 应输出 MySQL 版本信息
```

## 2. 快速安装（推荐新手）

### 2.1 Windows 系统安装

#### 步骤 1: 下载项目

```bash
# 如果使用 Git
git clone https://github.com/your-repo/beidou-server.git
cd beidou-server/gms-server

# 或者直接下载 ZIP 压缩包并解压
```

#### 步骤 2: 配置数据库

1. 启动 MySQL 服务
2. 打开命令行，登录 MySQL:
```bash
mysql -u root -p
```

3. 创建数据库和用户:
```sql
-- 创建数据库
CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 创建用户（可选）
CREATE USER 'beidou'@'localhost' IDENTIFIED BY 'your_password';

-- 授予权限
GRANT ALL PRIVILEGES ON beidou.* TO 'beidou'@'localhost';
FLUSH PRIVILEGES;

-- 授予额外权限（必需）
GRANT SELECT ON performance_schema.user_variables_by_thread TO 'beidou'@'localhost';
GRANT SHOW VIEW ON mysql.* TO 'beidou'@'localhost';
FLUSH PRIVILEGES;
```

#### 步骤 3: 配置应用

编辑 `src/main/resources/application.yml`:

```yaml
mybatis-flex:
  datasource:
    mysql:
      url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      username: root  # 或 'beidou'
      password: root  # 改为你的密码
```

#### 步骤 4: 编译项目

```bash
# 使用 Maven 编译
mvn clean package -DskipTests
```

#### 步骤 5: 启动服务

**方式 1: 使用启动脚本**
```bash
# 双击运行
launch.bat
```

**方式 2: 使用命令行**
```bash
java -jar target/BeiDou.jar
```

#### 步骤 6: 验证安装

访问以下地址验证服务是否正常启动：

- Web API: http://localhost:8686
- Swagger 文档: http://localhost:8686/swagger-ui/index.html
- 管理后台: http://localhost:8686 (如有前端)

### 2.2 Linux 系统安装

#### 步骤 1: 安装依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y openjdk-21-jdk maven mysql-server

# CentOS/RHEL
sudo yum install -y java-21-openjdk-devel maven mysql-server
```

#### 步骤 2: 配置 MySQL

```bash
# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 登录并创建数据库
sudo mysql -u root -p
```

```sql
CREATE DATABASE beidou DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER 'beidou'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON beidou.* TO 'beidou'@'localhost';
FLUSH PRIVILEGES;
```

#### 步骤 3: 下载并配置项目

```bash
# 克隆项目
git clone https://github.com/your-repo/beidou-server.git
cd beidou-server/gms-server

# 配置应用
vim src/main/resources/application.yml
```

修改数据库配置:
```yaml
mybatis-flex:
  datasource:
    mysql:
      url: jdbc:mysql://localhost:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      username: beidou
      password: your_password
```

#### 步骤 4: 编译和启动

```bash
# 编译
mvn clean package -DskipTests

# 启动
chmod +x launch.sh
./launch.sh
```

或使用 nohup 后台运行:
```bash
nohup java -jar target/BeiDou.jar > logs/beidou.log 2>&1 &
```

## 3. 开发环境安装

### 3.1 IDEA 配置

1. 打开 IntelliJ IDEA
2. File → Open
3. 选择项目根目录（包含 pom.xml）
4. 等待 Maven 依赖下载完成
5. 配置 Working Directory:
   - Run → Edit Configurations
   - 选择 ServerApplication
   - 设置 Working directory 为 `$PROJECT_DIR$/gms-server`

### 3.2 数据库初始化

项目首次启动时会自动执行数据库迁移脚本，包括：
- 创建所有数据表
- 插入初始数据
- 创建管理员账号

默认管理员账号：
- 用户名: admin
- 密码: admin123

⚠️ **重要**: 首次登录后请立即修改密码！

## 4. Docker 安装（可选）

### 4.1 Docker Compose 配置

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: beidou-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: beidou
      MYSQL_USER: beidou
      MYSQL_PASSWORD: beidou
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  app:
    build: .
    container_name: beidou-server
    ports:
      - "8686:8686"
      - "8484:8484"
      - "8600-8620:8600-8620"
    depends_on:
      - mysql
    environment:
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/beidou?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
      - SPRING_DATASOURCE_USERNAME=beidou
      - SPRING_DATASOURCE_PASSWORD=beidou
    volumes:
      - ./logs:/app/logs

volumes:
  mysql-data:
```

### 4.2 Dockerfile

创建 `Dockerfile`:

```dockerfile
FROM openjdk:21-slim

WORKDIR /app

COPY target/BeiDou.jar app.jar

EXPOSE 8686 8484 8600-8620

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 4.3 启动 Docker 服务

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

## 5. 生产环境部署

### 5.1 系统配置优化

#### JVM 参数优化

编辑启动脚本，添加以下 JVM 参数：

```bash
java -Xms2G \
     -Xmx4G \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:+UseStringDeduplication \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=./logs/ \
     -jar BeiDou.jar
```

#### MySQL 配置优化

编辑 MySQL 配置文件 `my.cnf` 或 `my.ini`:

```ini
[mysqld]
# 连接数
max_connections = 500
max_connect_errors = 100000

# 缓冲区
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2

# 查询缓存
query_cache_size = 128M
query_cache_type = 1

# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
```

### 5.2 反向代理配置

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Web API
    location /api/ {
        proxy_pass http://localhost:8686/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Swagger
    location /swagger-ui/ {
        proxy_pass http://localhost:8686/swagger-ui/;
    }

    # 游戏端口（TCP 透传）
    location /game/ {
        proxy_pass http://localhost:8484/;
        proxy_bind $remote_addr transparent;
    }
}
```

### 5.3 使用 Systemd 管理（Linux）

创建 `/etc/systemd/system/beidou.service`:

```ini
[Unit]
Description=BeiDou Game Server
After=network.target mysql.service

[Service]
Type=simple
User=beidou
WorkingDirectory=/opt/beidou-server
ExecStart=/usr/bin/java -Xms2G -Xmx4G -XX:+UseG1GC -jar /opt/beidou-server/BeiDou.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重载配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start beidou

# 开机自启
sudo systemctl enable beidou

# 查看状态
sudo systemctl status beidou

# 查看日志
sudo journalctl -u beidou -f
```

## 6. 验证安装

### 6.1 检查服务状态

```bash
# 检查 Java 进程
jps -l

# 检查端口占用
# Windows
netstat -ano | findstr "8686"

# Linux
netstat -tlnp | grep "8686"
```

### 6.2 测试 API

```bash
# 测试健康检查
curl http://localhost:8686/actuator/health

# 测试登录
curl -X POST http://localhost:8686/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 6.3 查看日志

```bash
# 查看应用日志
tail -f logs/beidou.log

# 或在 IDEA 中查看控制台输出
```

## 7. 常见安装问题

### 7.1 端口被占用

**问题**: 端口 8686 或 8484 已被占用

**解决**:
```bash
# Windows: 查找并结束占用端口的进程
netstat -ano | findstr "8686"
taskkill /PID <pid> /F

# Linux: 查找并结束占用端口的进程
lsof -i :8686
kill -9 <pid>
```

### 7.2 数据库连接失败

**问题**: 无法连接到 MySQL

**解决**:
1. 检查 MySQL 服务是否启动
2. 验证用户名和密码
3. 检查防火墙设置
4. 确认数据库权限配置

### 7.3 Maven 依赖下载失败

**问题**: 无法下载 Maven 依赖

**解决**:
```bash
# 清理本地缓存
rm -rf ~/.m2/repository

# 强制更新依赖
mvn clean install -U
```

### 7.4 内存不足

**问题**: 启动时提示内存不足

**解决**:
1. 增加 JVM 堆内存: `-Xmx4G`
2. 关闭其他占用内存的程序
3. 增加系统物理内存

## 8. 卸载

### 8.1 停止服务

```bash
# 停止 Java 进程
jps -l
kill <pid>

# 或使用启动脚本停止
./launch.sh stop
```

### 8.2 清理数据

```bash
# 删除数据库
mysql -u root -p
DROP DATABASE beidou;

# 删除项目文件
rm -rf beidou-server
```

---

*文档版本: 1.0*
*最后更新: 2026-03-25*
