# 零食店网站 — 设计规格

日期：2026-10-15
状态：已通过用户逐节审查

## 1. 需求背景

学习/演示项目，本地跑通即可。构建一个完整的零食店电商网站：前台商城 + 后台管理，模拟支付，账号密码注册登录，商品为单一规格。

已确认的需求决策：

| 决策点 | 结论 |
|---|---|
| 网站定位 | 前台商城 + 后台管理（完整电商） |
| 支付方式 | 模拟支付（点按钮状态流转） |
| 用户体系 | 账号密码注册登录，下单需登录 |
| 项目性质 | 学习/演示，架构务实，不引入 Redis/消息队列 |
| 商品规格 | 单一规格（一商品一价格一库存） |

## 2. 技术选型

- 后端：Java 17 + Spring Boot 3.x + MyBatis-Plus + JWT (jjwt)
- 数据库：MySQL 8
- 前端：Vue 3 + Vite + Element Plus + Pinia + Vue Router + Axios
- 图表：ECharts（后台仪表盘）
- 图片存储：本地磁盘 `backend/uploads/`，不引入 OSS
- 认证：JWT 无状态认证，管理端接口校验 ADMIN 角色
- 密码：BCrypt 加密

## 3. 总体架构

```
浏览器 ── Vue 3 前端 (dev: 5173, 打包后由 Spring Boot 托管)
              │ axios + JWT header
              ▼
        Spring Boot 3 (8080) ── MyBatis-Plus ── MySQL 8
              │
              └─ 商品图片存本地磁盘 uploads/ 目录
```

- 单体应用，前后端分离开发，生产构建后单端口部署
- 开发期 Vite 代理 `/api` 到 8080
- 库存扣减用 MySQL 事务 + 条件更新防超卖，不引入 Redis

## 4. 数据库设计（7 张表）

| 表 | 说明 | 关键字段 |
|---|---|---|
| `user` | 用户 + 管理员共用，`role` 区分 | username, password(BCrypt), nickname, phone, role(USER/ADMIN), status, created_at |
| `category` | 商品分类 | name, sort, status, created_at |
| `product` | 商品（单一规格） | category_id, name, description, image, price, stock, sales, status(1上架/0下架), created_at, updated_at |
| `cart_item` | 购物车 | user_id, product_id, quantity, checked, created_at；唯一约束 (user_id, product_id) |
| `address` | 收货地址 | user_id, receiver, phone, province, city, district, detail, is_default |
| `order` | 订单 | order_no, user_id, receiver/phone/address 快照, total_amount, status, payment_time, created_at |
| `order_item` | 订单明细 | order_id, product_id, product_name/product_image/price 快照, quantity, subtotal |

关键设计决策：

- 订单存**地址快照和商品快照**（非外键联查）——商品改价、地址修改不影响历史订单
- 订单状态机：`待付款(0) → 已付款/待发货(1) → 已发货(2) → 已完成(3)`；待付款可取消(4)，取消回滚库存
- 下单事务内条件更新 `UPDATE product SET stock = stock - ? WHERE id = ? AND stock >= ?` 防超卖

## 5. 后端接口设计

统一返回 `{ code, message, data }`，全局异常处理。分层 controller → service → mapper，DTO/VO 隔离（敏感字段不进 VO）。

### 5.1 认证（无需登录）

```
POST /api/auth/register   注册（用户名/密码/昵称）
POST /api/auth/login      登录 → 返回 JWT
```

### 5.2 前台（登录用户）

```
GET  /api/categories              分类列表
GET  /api/products                商品列表（分页/分类/关键词/销量排序）
GET  /api/products/{id}           商品详情
GET  /api/cart                    购物车列表
POST /api/cart                    加入购物车（已存在则数量累加）
PUT  /api/cart/{id}               修改数量/勾选
DELETE /api/cart/{id}             删除购物车项
GET  /api/addresses               地址列表
POST /api/addresses               新增地址
PUT  /api/addresses/{id}          修改地址
DELETE /api/addresses/{id}        删除地址
PUT  /api/addresses/{id}/default  设为默认
POST /api/orders                  下单（勾选购物车项 → 校验库存 → 事务扣库存 → 清购物车）
GET  /api/orders                  我的订单（分页/状态筛选）
GET  /api/orders/{id}             订单详情
POST /api/orders/{id}/pay         模拟支付（待付款 → 已付款）
POST /api/orders/{id}/cancel      取消订单（回滚库存）
GET  /api/user/me                 当前用户信息
PUT  /api/user/me                 修改昵称/手机号
PUT  /api/user/password           修改密码
```

### 5.3 管理后台（ADMIN 角色）

```
GET  /api/admin/products          商品列表（分页/筛选）
POST /api/admin/products          新增商品
PUT  /api/admin/products/{id}     修改商品
PUT  /api/admin/products/{id}/status  上架/下架
DELETE /api/admin/products/{id}   删除商品
POST /api/admin/upload            图片上传（存本地 uploads/）
GET/POST/PUT/DELETE /api/admin/categories  分类 CRUD
GET  /api/admin/orders            订单列表（分页/状态筛选）
POST /api/admin/orders/{id}/ship  发货（已付款 → 已发货）
GET  /api/admin/users             用户列表
PUT  /api/admin/users/{id}/status 禁用/启用
GET  /api/admin/stats             仪表盘统计：今日订单数/销售额、销量 TOP5、库存告警列表
```

JWT 拦截器：放行 `/api/auth/**` 和商品/分类浏览接口；`/api/admin/**` 额外校验 ADMIN 角色。

## 6. 前端页面设计

### 6.1 前台商城（9 个页面）

| 页面 | 内容 |
|---|---|
| 首页 | 分类导航、商品卡片列表（分页/搜索/按销量价格排序）、购物车角标 |
| 商品详情 | 大图、价格、库存、数量选择、加入购物车 |
| 购物车 | 勾选、改数量、删除、合计、去结算 |
| 确认订单 | 选择/新增收货地址、商品清单、提交订单 |
| 订单列表 | 状态 tab（待付款/待发货/已发货/已完成）、支付、取消 |
| 订单详情 | 商品快照、地址、订单状态 |
| 登录/注册 | 表单 + 校验 |
| 个人中心 | 修改昵称/手机号/密码 |
| 地址管理 | 地址 CRUD、设默认 |

### 6.2 管理后台（6 个页面）

| 页面 | 内容 |
|---|---|
| 登录 | 管理员登录（复用登录接口，按角色跳转） |
| 仪表盘 | 统计卡片（今日订单/销售额）+ ECharts 销量 TOP5 柱状图 + 库存告警 |
| 商品管理 | 表格 + 新增/编辑弹窗 + 图片上传 + 上下架 + 库存修改 |
| 分类管理 | 表格 CRUD |
| 订单管理 | 状态筛选列表 + 发货 |
| 用户管理 | 列表 + 禁用/启用 |

技术要点：

- Axios 拦截器统一携带 JWT、统一处理返回结构和 401 跳登录
- Pinia 存用户信息和购物车数量；路由守卫做登录/角色校验
- 后台独立布局（侧边栏 + 顶栏），与前台分开路由表

## 7. 项目结构

```
snackStore/
├── backend/                 Spring Boot 3
│   └── src/main/java/com/snackstore/
│       ├── controller/      auth / product / cart / address / order / admin 分组
│       ├── service/ + impl/
│       ├── mapper/          MyBatis-Plus Mapper
│       ├── entity/  dto/  vo/
│       ├── config/          MyBatis-Plus、JWT 拦截器、静态资源映射、CORS
│       ├── common/          Result 统一返回、全局异常、JWT 工具
│       └── interceptor/
├── frontend/                Vue 3
│   └── src/  api/ router/ stores/ views/(shop|admin) components/
├── sql/init.sql             建库建表 + 种子数据（管理员、6 分类、12 示例商品）
└── docs/
```

## 8. 开发顺序

1. 骨架 + SQL：两个项目初始化、建表、种子数据（管理员账号 admin、6 个分类、12 个示例商品）
2. 后端：统一返回/异常/JWT → 认证 → 商品分类查询 → 购物车 → 地址 → 订单（下单/支付/取消）→ 管理端 CRUD → 统计
3. 前端：axios/路由/Pinia 骨架 → 登录注册 → 首页/详情 → 购物车 → 下单 → 订单 → 个人中心 → 后台管理
4. 联调全链路 + 打包验证

## 9. 验收标准

注册 → 浏览 → 加购 → 下单 → 模拟支付 → 管理员后台发货 → 完成订单，全链路走通；后台商品/分类/订单/用户可管理，仪表盘有数据。
