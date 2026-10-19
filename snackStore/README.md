# 零食店商城（snack-store）

前后端分离的零食店网站：Vue 3 + Vite 前端，Spring Boot 3 + MyBatis-Plus 后端，MySQL 数据库。

## 项目结构

```
snackStore/
├── sql/init.sql      # 建库建表脚本（snack_store，7 张表）
├── backend/          # Spring Boot 后端（端口 8080）
└── frontend/         # Vue 3 + Vite 前端（端口 5173，/api、/uploads 代理到 8080）
```

## 环境要求

- JDK 17+
- Node.js 18+
- MySQL 5.7+（8.x 均可）

## 启动步骤

### 1. 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 2. 启动后端

先确认 `backend/src/main/resources/application.yml` 中数据库账号密码与本机一致（默认 root / 123456）。

```bash
cd backend
mvn spring-boot:run
```

后端启动于 http://localhost:8080

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动于 http://localhost:5173

## 打包部署（单端口）

开发期前后端分端口运行；生产构建后由 Spring Boot 托管前端静态文件，只占用 8080 一个端口：

```bash
# 1. 构建前端，产物拷入后端 static 目录（该目录已 gitignore，产物不入库）
cd frontend
npm run build
cp -r dist/* ../backend/src/main/resources/static/

# 2. 打包后端（含前端静态文件 + SPA 路由回退）
cd ../backend
mvn package -DskipTests

# 3. 运行
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

访问 http://localhost:8080 即为完整站点。注意：`backend/src/main/java/com/snackstore/controller/SpaForwardController.java` 显式列出了前端路由用于 history 模式回退，**新增前端路由时需同步添加**，否则生产环境刷新该路由会 404（开发期 Vite 自动处理，不受影响）。
