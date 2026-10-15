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
