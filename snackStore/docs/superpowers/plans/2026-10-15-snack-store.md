# 零食店网站 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 subagent-driven-development（推荐）或 executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建零食店电商网站：前台商城 + 管理后台，注册登录、购物车、下单、模拟支付、订单管理、后台商品/分类/订单/用户管理与统计。

**架构：** Spring Boot 3 单体后端 + MySQL 8 + Vue 3 前后端分离。JWT 无状态认证，MyBatis-Plus ORM，商品图片存本地磁盘，库存用事务 + 条件更新防超卖。开发期 Vite 代理 /api 到 8080，生产构建后 Spring Boot 托管前端静态文件。

**技术栈：** Java 17 / Spring Boot 3.5.x / MyBatis-Plus 3.5.9 / jjwt 0.12.6 / MySQL 8 / Vue 3 / Vite / Element Plus / Pinia / Vue Router / Axios / ECharts

**规格：** [docs/superpowers/specs/2026-10-15-snack-store-design.md](../specs/2026-10-15-snack-store-design.md) —— 计划的论证依据来自规格，执行前先读规格。

## 全局约束

- Java 17；Spring Boot 3.5.x（pom 用 3.5.4）；MySQL 8；Node 18+
- 统一返回结构 `{ code, message, data }`：`code=0` 成功；业务失败 HTTP 200 + `code=1`；未登录/无权限 HTTP 401/403 + 对应 code
- 密码 BCrypt 加密；JWT 请求头 `Authorization: Bearer <token>`，claim 含 `userId` 和 `role`
- 端口：后端 8080，前端 dev 5173；数据库 `snack_store`，连接配置在 `backend/src/main/resources/application.yml`（默认 root/123456，按本机环境修改）
- 图片存 `backend/uploads/`（gitignore），URL 映射 `/uploads/**`；上传大小上限 5MB
- 订单状态：0 待付款 / 1 已付款待发货 / 2 已发货 / 3 已完成 / 4 已取消
- 测试：JUnit 5 + MockMvc + `@SpringBootTest`，测试方法 `@Transactional` 自动回滚，连本机 MySQL；测试文件放 `backend/src/test/java/com/snackstore/`
- 前端不引入自动化测试框架，以 `npm run build` 成功 + 手动/curl 验证为准
- **Git：不自动 commit。每个任务完成时向用户展示变更摘要，用户确认后提交。**
- 包名 `com.snackstore`；后端目录 `backend/`，前端目录 `frontend/`

---

## 文件清单

**后端 `backend/`（com.snackstore）：**

| 文件 | 职责 |
|---|---|
| `entity/User.java` `Category.java` `Product.java` `CartItem.java` `Address.java` `Order.java` `OrderItem.java` | 7 张表的 MyBatis-Plus 实体 |
| `mapper/` 同名 7 个 Mapper | `BaseMapper<T>` 接口，单表 CRUD |
| `common/Result.java` | 统一返回体，`ok(data)` / `error(msg)` 静态工厂 |
| `common/BusinessException.java` | 业务异常（携带 message），全局处理器转 `code=1` |
| `common/GlobalExceptionHandler.java` | `@RestControllerAdvice`：BusinessException、参数校验异常、兜底 500 |
| `common/JwtUtil.java` | `generateToken(userId, role)` / `parseToken(token)` → Claims |
| `common/UserContext.java` | ThreadLocal 保存当前请求 userId/role（拦截器写入，afterCompletion 清理） |
| `interceptor/JwtInterceptor.java` | 解析 token 写 UserContext；`/api/admin/**` 校验 role=ADMIN；放行 `/api/auth/**` 和 `GET /api/products/**`、`GET /api/categories` |
| `config/MybatisPlusConfig.java` | 分页插件 PaginationInnerInterceptor |
| `config/WebConfig.java` | 注册拦截器、CORS、`/uploads/**` 静态资源映射 |
| `config/DataInitializer.java` | CommandLineRunner：空库时创建 admin 账号、演示用户、6 分类、12 商品 |
| `dto/` RegisterDTO、LoginDTO、CartAddDTO、CartUpdateDTO、AddressDTO、OrderCreateDTO、ProductDTO、CategoryDTO、UserProfileDTO、PasswordUpdateDTO | 请求体，javax 校验注解 |
| `vo/` LoginVO、UserVO、ProductVO、CategoryVO、CartItemVO、OrderVO、OrderItemVO、StatsVO | 响应体（不含敏感字段） |
| `service/` + `service/impl/` AuthService、ProductService、CartService、AddressService、OrderService、UserService、AdminService | 业务逻辑；下单事务在 OrderServiceImpl |
| `controller/` AuthController、CategoryController、ProductController、CartController、AddressController、OrderController、UserController、AdminProductController、AdminCategoryController、AdminOrderController、AdminUserController、AdminUploadController、AdminStatsController | 路由层，见规格第 5 节 |
| `SnackStoreApplication.java` | 启动类 |
| `resources/application.yml` | 数据源、JWT secret、上传目录、MyBatis-Plus 日志 |
| `test/` 对应各任务的测试类 | TDD 测试 |

**前端 `frontend/src/`：**

| 文件 | 职责 |
|---|---|
| `api/request.js` | Axios 实例：baseURL `/api`、携带 JWT、统一解包 Result、401 跳登录 |
| `api/auth.js` `product.js` `cart.js` `address.js` `order.js` `user.js` `admin.js` | 各模块 API 函数 |
| `stores/user.js` | Pinia：token、userInfo、role、login/logout action |
| `stores/cart.js` | 购物车数量角标（加载/变更后刷新） |
| `router/index.js` | 路由表 + 守卫（登录校验、admin 角色校验） |
| `layouts/ShopLayout.vue` `AdminLayout.vue` | 前台顶栏布局 / 后台侧边栏布局 |
| `views/shop/` Home、ProductDetail、Cart、Checkout、OrderList、OrderDetail、Login、Register、Profile、AddressList | 前台 10 页面 |
| `views/admin/` AdminLogin、Dashboard、ProductManage、CategoryManage、OrderManage、UserManage | 后台 6 页面 |
| `components/ProductCard.vue` | 首页商品卡片（含占位图处理） |
| `vite.config.js` | `/api`、`/uploads` 代理到 8080 |
| `main.js` | 挂载 Element Plus、Pinia、Router |

**其他：**

| 文件 | 职责 |
|---|---|
| `sql/init.sql` | 建库 snack_store + 7 张表 DDL（种子数据由 DataInitializer 负责） |
| `backend/uploads/.gitkeep` | 图片目录占位 |
| 根 `.gitignore` | 忽略 target/、node_modules/、dist/、uploads/ 内容 |
| `README.md` | 启动说明 |

---

### 任务 1：项目骨架 + 数据库初始化

**文件：**
- 创建：`sql/init.sql`、`.gitignore`、`README.md`
- 创建：`backend/pom.xml`、`backend/src/main/java/com/snackstore/SnackStoreApplication.java`、`backend/src/main/resources/application.yml`、`backend/uploads/.gitkeep`
- 创建：`frontend/`（`npm create vue` 脚手架）
- 修改：`frontend/vite.config.js`

- [ ] **步骤 1：检查环境**

```bash
java -version   # 期望 17+
node -v         # 期望 18+
mysql --version # 期望 8.x，并确认 root 账号可连接
```

- [ ] **步骤 2：编写 sql/init.sql（建库 + 7 张表）**

```sql
CREATE DATABASE IF NOT EXISTS snack_store DEFAULT CHARACTER SET utf8mb4;
USE snack_store;

CREATE TABLE user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE category (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sales INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE cart_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  checked TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_product (user_id, product_id)
);

CREATE TABLE address (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  receiver VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(50),
  city VARCHAR(50),
  district VARCHAR(50),
  detail VARCHAR(200),
  is_default TINYINT NOT NULL DEFAULT 0
);

CREATE TABLE `order` (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(32) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  receiver VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(300) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TINYINT NOT NULL DEFAULT 0,
  payment_time DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  product_image VARCHAR(255) DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);
```

- [ ] **步骤 3：执行建表**

```bash
mysql -u root -p < sql/init.sql
```

- [ ] **步骤 4：编写 backend/pom.xml（父 POM spring-boot-starter-parent 3.5.4，依赖 web / validation / mysql-connector-j / mybatis-plus-spring-boot3-starter 3.5.9 / jjwt 0.12.6 / lombok / spring-boot-starter-test）**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.4</version>
    <relativePath/>
  </parent>
  <groupId>com.snackstore</groupId>
  <artifactId>backend</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <properties><java.version>17</java.version></properties>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>
    <dependency><groupId>com.mysql</groupId><artifactId>mysql-connector-j</artifactId><scope>runtime</scope></dependency>
    <dependency><groupId>com.baomidou</groupId><artifactId>mybatis-plus-spring-boot3-starter</artifactId><version>3.5.9</version></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.6</version></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
    <dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
    <dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
  </dependencies>
  <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>
```

- [ ] **步骤 5：编写启动类 + application.yml**

`SnackStoreApplication.java`：

```java
package com.snackstore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SnackStoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(SnackStoreApplication.class, args);
    }
}
```

`application.yml`（注意：password 按本机 MySQL 环境修改）：

```yaml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/snack_store?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: "123456"
    driver-class-name: com.mysql.cj.jdbc.Driver
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 10MB
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
snackstore:
  jwt:
    secret: snack-store-secret-key-please-change-in-production-2026
    expire-hours: 72
  upload-dir: uploads
```

- [ ] **步骤 6：验证后端骨架启动**

```bash
cd backend && mvn spring-boot:run
```

预期：控制台无报错，8080 端口启动成功。Ctrl+C 停止。

- [ ] **步骤 7：创建前端脚手架**

```bash
cd frontend && npm create vue@latest . -- --default
npm install
npm install element-plus @element-plus/icons-vue pinia vue-router axios echarts
```

- [ ] **步骤 8：修改 vite.config.js 加代理**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
    },
  },
})
```

- [ ] **步骤 9：编写 .gitignore 和 README.md（启动说明：建库 → 起后端 → 起前端）**

`.gitignore`：

```
backend/target/
backend/uploads/*
!backend/uploads/.gitkeep
frontend/node_modules/
frontend/dist/
.idea/
*.iml
```

- [ ] **步骤 10：验证前端骨架**

```bash
cd frontend && npm run dev
```

预期：`curl http://localhost:5173` 返回 HTML。

- [ ] **步骤 11：向用户展示变更摘要，确认后 commit**

```bash
git add sql/init.sql .gitignore README.md backend/ frontend/
git commit -m "feat: scaffold backend, frontend and database schema"
```

---

### 任务 2：后端基础设施（统一返回 / 异常 / JWT / 拦截器 / 初始化数据）

**文件：**
- 创建：`backend/src/main/java/com/snackstore/common/Result.java`、`BusinessException.java`、`GlobalExceptionHandler.java`、`JwtUtil.java`、`UserContext.java`
- 创建：`backend/src/main/java/com/snackstore/interceptor/JwtInterceptor.java`
- 创建：`backend/src/main/java/com/snackstore/config/MybatisPlusConfig.java`、`WebConfig.java`、`DataInitializer.java`
- 创建：`backend/src/main/java/com/snackstore/entity/User.java`、`Category.java`、`Product.java`
- 创建：`backend/src/main/java/com/snackstore/mapper/UserMapper.java`、`CategoryMapper.java`、`ProductMapper.java`
- 测试：`backend/src/test/java/com/snackstore/JwtUtilTest.java`

- [ ] **步骤 1：编写失败测试 JwtUtilTest**

```java
package com.snackstore;

import com.snackstore.common.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JwtUtilTest {

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void generateAndParseToken_roundTrip() {
        String token = jwtUtil.generateToken(1L, "ADMIN");
        assertNotNull(token);
        assertEquals(1L, jwtUtil.parseToken(token).get("userId", Long.class));
        assertEquals("ADMIN", jwtUtil.parseToken(token).get("role", String.class));
    }

    @Test
    void parseInvalidToken_throws() {
        assertThrows(Exception.class, () -> jwtUtil.parseToken("invalid.token.here"));
    }
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=JwtUtilTest`
预期：编译失败，JwtUtil 不存在。

- [ ] **步骤 3：编写实现代码**

`JwtUtil.java`（jjwt 0.12 API：`Jwts.builder().subject(...).claim(...).signWith(key).compact()`；解析用 `Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload()`）：

```java
package com.snackstore.common;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expireMillis;

    public JwtUtil(@Value("${snackstore.jwt.secret}") String secret,
                   @Value("${snackstore.jwt.expire-hours}") long expireHours) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expireMillis = expireHours * 3600_000L;
    }

    public String generateToken(Long userId, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expireMillis))
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }
}
```

`Result.java`：

```java
package com.snackstore.common;

import lombok.Data;

@Data
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.code = 0;
        r.message = "success";
        r.data = data;
        return r;
    }

    public static <T> Result<T> error(String message) {
        Result<T> r = new Result<>();
        r.code = 1;
        r.message = message;
        return r;
    }
}
```

`BusinessException.java`：

```java
package com.snackstore.common;

public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
```

`GlobalExceptionHandler.java`：

```java
package com.snackstore.common;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        return Result.error(e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .findFirst().map(f -> f.getDefaultMessage()).orElse("参数错误");
        return Result.error(msg);
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleOther(Exception e) {
        return Result.error("系统繁忙，请稍后再试");
    }
}
```

`UserContext.java`：

```java
package com.snackstore.common;

public class UserContext {
    private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> ROLE = new ThreadLocal<>();

    public static void set(Long userId, String role) {
        USER_ID.set(userId);
        ROLE.set(role);
    }

    public static Long getUserId() {
        return USER_ID.get();
    }

    public static String getRole() {
        return ROLE.get();
    }

    public static void clear() {
        USER_ID.remove();
        ROLE.remove();
    }
}
```

`JwtInterceptor.java`（未登录 401、无权限 403，直接写 JSON 响应）：

```java
package com.snackstore.interceptor;

import com.snackstore.common.JwtUtil;
import com.snackstore.common.UserContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;

    public JwtInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        // 公开接口：认证 + 前台商品/分类浏览
        if (path.startsWith("/api/auth/")
                || (path.startsWith("/api/products") && "GET".equals(request.getMethod()))
                || (path.equals("/api/categories") && "GET".equals(request.getMethod()))) {
            return true;
        }
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"请先登录\"}");
            return false;
        }
        try {
            Claims claims = jwtUtil.parseToken(header.substring(7));
            UserContext.set(claims.get("userId", Long.class), claims.get("role", String.class));
        } catch (Exception e) {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"登录已过期，请重新登录\"}");
            return false;
        }
        if (path.startsWith("/api/admin/") && !"ADMIN".equals(UserContext.getRole())) {
            response.setStatus(403);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":403,\"message\":\"无权限\"}");
            return false;
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
```

`WebConfig.java`：

```java
package com.snackstore.config;

import com.snackstore.interceptor.JwtInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;

    @Value("${snackstore.upload-dir}")
    private String uploadDir;

    public WebConfig(JwtInterceptor jwtInterceptor) {
        this.jwtInterceptor = jwtInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor).addPathPatterns("/api/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String abs = Paths.get(uploadDir).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/**").addResourceLocations(abs);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

`MybatisPlusConfig.java`：

```java
package com.snackstore.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

实体示例 `Product.java`（其余 6 个实体同模式：`@TableName` + `@TableId(type = IdType.AUTO)` + 驼峰字段 + `@TableField(fill = ...)` 不需要，时间字段用数据库默认值；`order` 表实体类名 `Order`，`@TableName("`order`")`）：

```java
package com.snackstore.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("product")
public class Product {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long categoryId;
    private String name;
    private String description;
    private String image;
    private BigDecimal price;
    private Integer stock;
    private Integer sales;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

Mapper 示例（其余同模式）：

```java
package com.snackstore.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.snackstore.entity.Product;

public interface ProductMapper extends BaseMapper<Product> {
}
```

`DataInitializer.java`（空库初始化 admin/admin123、demo/demo123、6 分类、12 商品）：

```java
package com.snackstore.config;

import com.snackstore.entity.Category;
import com.snackstore.entity.Product;
import com.snackstore.entity.User;
import com.snackstore.mapper.CategoryMapper;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.mapper.UserMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final CategoryMapper categoryMapper;
    private final ProductMapper productMapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public DataInitializer(UserMapper userMapper, CategoryMapper categoryMapper, ProductMapper productMapper) {
        this.userMapper = userMapper;
        this.categoryMapper = categoryMapper;
        this.productMapper = productMapper;
    }

    @Override
    public void run(String... args) {
        if (userMapper.selectCount(null) > 0) return;
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(encoder.encode("admin123"));
        admin.setNickname("管理员");
        admin.setRole("ADMIN");
        userMapper.insert(admin);
        User demo = new User();
        demo.setUsername("demo");
        demo.setPassword(encoder.encode("demo123"));
        demo.setNickname("演示用户");
        demo.setRole("USER");
        userMapper.insert(demo);

        String[] names = {"膨化食品", "糖果巧克力", "饼干糕点", "坚果炒货", "肉干肉脯", "饮品冲调"};
        for (int i = 0; i < names.length; i++) {
            Category c = new Category();
            c.setName(names[i]);
            c.setSort(i + 1);
            categoryMapper.insert(c);
        }
        List<Category> categories = categoryMapper.selectList(null);
        String[][] items = {
            {"薯片原味", "1", "9.9", "100"}, {"薯片烧烤味", "1", "9.9", "80"},
            {"巧克力豆", "2", "15.8", "60"}, {"水果软糖", "2", "8.5", "120"},
            {"曲奇饼干", "3", "19.9", "50"}, {"蛋黄酥", "3", "25.0", "40"},
            {"每日坚果", "4", "29.9", "70"}, {"开心果", "4", "35.0", "30"},
            {"牛肉干", "5", "39.9", "45"}, {"猪肉脯", "5", "32.0", "55"},
            {"柠檬茶", "6", "6.5", "200"}, {"速溶咖啡", "6", "28.0", "90"},
        };
        for (String[] it : items) {
            Product p = new Product();
            p.setCategoryId(categories.get(Integer.parseInt(it[1]) - 1).getId());
            p.setName(it[0]);
            p.setDescription(it[0] + "，精选好料，好吃不贵。");
            p.setImage("");
            p.setPrice(new BigDecimal(it[2]));
            p.setStock(Integer.parseInt(it[3]));
            p.setSales(0);
            p.setStatus(1);
            productMapper.insert(p);
        }
    }
}
```

注意：BCryptPasswordEncoder 来自 spring-security-crypto，需要在 pom 加依赖（只引 crypto 包，不引入整个 Spring Security）：

```xml
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-crypto</artifactId>
</dependency>
```

实体 `User.java`、`Category.java` 同 Product 模式；`User` 表与 MySQL 关键字无冲突（`user` 在 MySQL 8 非保留字，可用；若遇问题加 `@TableName("`user`")`）。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=JwtUtilTest`
预期：2 个测试 PASS。

- [ ] **步骤 5：启动验证初始化数据**

运行：`cd backend && mvn spring-boot:run`，然后：

```bash
mysql -u root -p123456 -e "SELECT id, username, role FROM snack_store.user; SELECT COUNT(*) FROM snack_store.product;"
```

预期：admin/demo 两个用户，12 个商品。Ctrl+C 停止。

- [ ] **步骤 6：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add common result, jwt auth interceptor and seed data"
```

---

### 任务 3：认证模块（注册 / 登录）

**文件：**
- 创建：`backend/src/main/java/com/snackstore/dto/RegisterDTO.java`、`LoginDTO.java`
- 创建：`backend/src/main/java/com/snackstore/vo/LoginVO.java`、`UserVO.java`
- 创建：`backend/src/main/java/com/snackstore/service/AuthService.java`、`service/impl/AuthServiceImpl.java`
- 创建：`backend/src/main/java/com/snackstore/controller/AuthController.java`
- 测试：`backend/src/test/java/com/snackstore/AuthControllerTest.java`

- [ ] **步骤 1：编写失败测试 AuthControllerTest**

```java
package com.snackstore;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void register_success() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"tester1\",\"password\":\"123456\",\"nickname\":\"测试用户\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0));
    }

    @Test
    void register_duplicateUsername_fails() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"tester1\",\"password\":\"123456\"}"));
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"tester1\",\"password\":\"123456\"}"))
                .andExpect(jsonPath("$.code").value(1));
    }

    @Test
    void login_success_returnsToken() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"tester2\",\"password\":\"123456\"}"));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"tester2\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    void login_wrongPassword_fails() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(jsonPath("$.code").value(1));
    }
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=AuthControllerTest`
预期：编译失败（AuthController 不存在）。

- [ ] **步骤 3：编写实现代码**

`RegisterDTO.java`（校验注解 + 中文提示，前端直接展示 message）：

```java
package com.snackstore.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDTO {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度 3-20 位")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度 6-32 位")
    private String password;

    private String nickname;
}
```

`LoginDTO.java`：username / password 两个 `@NotBlank` 字段。

`LoginVO.java`：`token`、`user`（UserVO）两字段。`UserVO.java`：id、username、nickname、phone、role、createdAt。

`AuthServiceImpl.java` 核心逻辑：

```java
package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snackstore.common.BusinessException;
import com.snackstore.common.JwtUtil;
import com.snackstore.dto.LoginDTO;
import com.snackstore.dto.RegisterDTO;
import com.snackstore.entity.User;
import com.snackstore.mapper.UserMapper;
import com.snackstore.service.AuthService;
import com.snackstore.vo.LoginVO;
import com.snackstore.vo.UserVO;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthServiceImpl(UserMapper userMapper, JwtUtil jwtUtil) {
        this.userMapper = userMapper;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void register(RegisterDTO dto) {
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (count > 0) {
            throw new BusinessException("用户名已存在");
        }
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(encoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname() == null || dto.getNickname().isBlank()
                ? dto.getUsername() : dto.getNickname());
        user.setRole("USER");
        user.setStatus(1);
        userMapper.insert(user);
    }

    @Override
    public LoginVO login(LoginDTO dto) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (user == null || !encoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new BusinessException("账号已被禁用");
        }
        LoginVO vo = new LoginVO();
        vo.setToken(jwtUtil.generateToken(user.getId(), user.getRole()));
        vo.setUser(toVO(user));
        return vo;
    }

    private UserVO toVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setPhone(user.getPhone());
        vo.setRole(user.getRole());
        return vo;
    }
}
```

`AuthController.java`：

```java
package com.snackstore.controller;

import com.snackstore.common.Result;
import com.snackstore.dto.LoginDTO;
import com.snackstore.dto.RegisterDTO;
import com.snackstore.service.AuthService;
import com.snackstore.vo.LoginVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterDTO dto) {
        authService.register(dto);
        return Result.ok(null);
    }

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        return Result.ok(authService.login(dto));
    }
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=AuthControllerTest`
预期：4 个测试 PASS。

- [ ] **步骤 5：curl 冒烟验证**

```bash
cd backend && mvn spring-boot:run &
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

预期：返回 code=0 和 token。

- [ ] **步骤 6：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add register and login with jwt"
```

---

### 任务 4：商品与分类浏览接口

**文件：**
- 创建：`backend/src/main/java/com/snackstore/vo/ProductVO.java`、`CategoryVO.java`
- 创建：`backend/src/main/java/com/snackstore/service/ProductService.java`、`service/impl/ProductServiceImpl.java`
- 创建：`backend/src/main/java/com/snackstore/controller/CategoryController.java`、`ProductController.java`
- 测试：`backend/src/test/java/com/snackstore/ProductControllerTest.java`

- [ ] **步骤 1：编写失败测试 ProductControllerTest（接口公开无需 token）**

```java
package com.snackstore;

import com.snackstore.entity.Category;
import com.snackstore.entity.Product;
import com.snackstore.mapper.CategoryMapper;
import com.snackstore.mapper.ProductMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private CategoryMapper categoryMapper;

    @Test
    void listProducts_returnsPage() throws Exception {
        Product p = new Product();
        p.setName("测试薯片");
        p.setPrice(new BigDecimal("9.9"));
        p.setStock(10);
        p.setSales(0);
        p.setStatus(1);
        productMapper.insert(p);
        mockMvc.perform(get("/api/products?page=1&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    void listCategories_returnsList() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray());
    }
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=ProductControllerTest`
预期：编译失败。

- [ ] **步骤 3：编写实现代码**

`ProductServiceImpl.java` 核心（关键词 like 查询 + 分类筛选 + 排序，排序白名单：`sales_desc` 销量降序 / `price_asc` / `price_desc`，默认按 id 倒序；只查上架商品）：

```java
package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.entity.Product;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.service.ProductService;
import com.snackstore.vo.ProductVO;
import org.springframework.stereotype.Service;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductMapper productMapper;

    public ProductServiceImpl(ProductMapper productMapper) {
        this.productMapper = productMapper;
    }

    @Override
    public Page<ProductVO> list(int page, int size, Long categoryId, String keyword, String sort) {
        LambdaQueryWrapper<Product> qw = new LambdaQueryWrapper<>();
        qw.eq(Product::getStatus, 1);
        if (categoryId != null) {
            qw.eq(Product::getCategoryId, categoryId);
        }
        if (keyword != null && !keyword.isBlank()) {
            qw.like(Product::getName, keyword);
        }
        switch (sort == null ? "" : sort) {
            case "sales_desc" -> qw.orderByDesc(Product::getSales);
            case "price_asc" -> qw.orderByAsc(Product::getPrice);
            case "price_desc" -> qw.orderByDesc(Product::getPrice);
            default -> qw.orderByDesc(Product::getId);
        }
        Page<Product> result = productMapper.selectPage(new Page<>(page, size), qw);
        return (Page<ProductVO>) result.convert(this::toVO);
    }

    @Override
    public ProductVO detail(Long id) {
        Product p = productMapper.selectById(id);
        if (p == null || p.getStatus() == 0) {
            throw new com.snackstore.common.BusinessException("商品不存在或已下架");
        }
        return toVO(p);
    }

    private ProductVO toVO(Product p) {
        ProductVO vo = new ProductVO();
        vo.setId(p.getId());
        vo.setCategoryId(p.getCategoryId());
        vo.setName(p.getName());
        vo.setDescription(p.getDescription());
        vo.setImage(p.getImage());
        vo.setPrice(p.getPrice());
        vo.setStock(p.getStock());
        vo.setSales(p.getSales());
        return vo;
    }
}
```

`ProductController.java`：

```java
package com.snackstore.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.Result;
import com.snackstore.service.ProductService;
import com.snackstore.vo.ProductVO;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public Result<Page<ProductVO>> list(@RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "12") int size,
                                        @RequestParam(required = false) Long categoryId,
                                        @RequestParam(required = false) String keyword,
                                        @RequestParam(required = false) String sort) {
        return Result.ok(productService.list(page, size, categoryId, keyword, sort));
    }

    @GetMapping("/{id}")
    public Result<ProductVO> detail(@PathVariable Long id) {
        return Result.ok(productService.detail(id));
    }
}
```

`CategoryController.java`（返回启用分类，按 sort 排序）+ `CategoryServiceImpl`：

```java
package com.snackstore.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snackstore.common.Result;
import com.snackstore.entity.Category;
import com.snackstore.mapper.CategoryMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryMapper categoryMapper;

    public CategoryController(CategoryMapper categoryMapper) {
        this.categoryMapper = categoryMapper;
    }

    @GetMapping
    public Result<List<Category>> list() {
        return Result.ok(categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getStatus, 1)
                        .orderByAsc(Category::getSort)));
    }
}
```

（Category 查询足够简单，直接在 controller 用 mapper；CategoryVO 可以复用 entity Category，不再建 VO。）

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=ProductControllerTest`
预期：2 个测试 PASS。

- [ ] **步骤 5：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add product and category browse apis"
```

---

### 任务 5：购物车接口

**文件：**
- 创建：`backend/src/main/java/com/snackstore/entity/CartItem.java`
- 创建：`backend/src/main/java/com/snackstore/mapper/CartItemMapper.java`
- 创建：`backend/src/main/java/com/snackstore/dto/CartAddDTO.java`、`CartUpdateDTO.java`
- 创建：`backend/src/main/java/com/snackstore/vo/CartItemVO.java`
- 创建：`backend/src/main/java/com/snackstore/service/CartService.java`、`service/impl/CartServiceImpl.java`
- 创建：`backend/src/main/java/com/snackstore/controller/CartController.java`
- 测试：`backend/src/test/java/com/snackstore/CartControllerTest.java`

- [ ] **步骤 1：编写失败测试 CartControllerTest**

```java
package com.snackstore;

import com.snackstore.common.JwtUtil;
import com.snackstore.entity.Product;
import com.snackstore.mapper.ProductMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private ProductMapper productMapper;

    private String token;
    private Long productId;

    @BeforeEach
    void setup() {
        token = jwtUtil.generateToken(2L, "USER"); // demo 用户，由 DataInitializer 创建
        Product p = new Product();
        p.setName("购物车测试商品");
        p.setPrice(new BigDecimal("5.0"));
        p.setStock(50);
        p.setStatus(1);
        productMapper.insert(p);
        productId = p.getId();
    }

    private String auth() {
        return "Bearer " + token;
    }

    @Test
    void addToCart_success() throws Exception {
        mockMvc.perform(post("/api/cart").header("Authorization", auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":" + productId + ",\"quantity\":2}"))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/cart").header("Authorization", auth()))
                .andExpect(jsonPath("$.data[0].quantity").value(2));
    }

    @Test
    void addSameProductTwice_accumulates() throws Exception {
        mockMvc.perform(post("/api/cart").header("Authorization", auth())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":1}"));
        mockMvc.perform(post("/api/cart").header("Authorization", auth())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":3}"));
        mockMvc.perform(get("/api/cart").header("Authorization", auth()))
                .andExpect(jsonPath("$.data[0].quantity").value(4));
    }

    @Test
    void deleteCartItem_success() throws Exception {
        mockMvc.perform(post("/api/cart").header("Authorization", auth())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":1}"));
        String body = mockMvc.perform(get("/api/cart").header("Authorization", auth()))
                .andReturn().getResponse().getContentAsString();
        long itemId = Long.parseLong(body.replaceAll(".*\"id\":(\\d+).*", "$1"));
        mockMvc.perform(delete("/api/cart/" + itemId).header("Authorization", auth()))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/cart").header("Authorization", auth()))
                .andExpect(jsonPath("$.data.length()").value(0));
    }
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=CartControllerTest`
预期：编译失败。

- [ ] **步骤 3：编写实现代码**

`CartServiceImpl.java` 核心（加购时校验商品存在且上架、库存充足；已存在则数量累加并校验累加后不超库存；CartItemVO 带商品名/图/价/库存上限，联查 product 表组装）：

```java
package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.CartAddDTO;
import com.snackstore.dto.CartUpdateDTO;
import com.snackstore.entity.CartItem;
import com.snackstore.entity.Product;
import com.snackstore.mapper.CartItemMapper;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.service.CartService;
import com.snackstore.vo.CartItemVO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartItemMapper cartItemMapper;
    private final ProductMapper productMapper;

    public CartServiceImpl(CartItemMapper cartItemMapper, ProductMapper productMapper) {
        this.cartItemMapper = cartItemMapper;
        this.productMapper = productMapper;
    }

    @Override
    public void add(Long userId, CartAddDTO dto) {
        Product product = productMapper.selectById(dto.getProductId());
        if (product == null || product.getStatus() == 0) {
            throw new BusinessException("商品不存在或已下架");
        }
        CartItem existing = cartItemMapper.selectOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId)
                .eq(CartItem::getProductId, dto.getProductId()));
        int newQuantity = dto.getQuantity() + (existing == null ? 0 : existing.getQuantity());
        if (newQuantity > product.getStock()) {
            throw new BusinessException("库存不足，当前库存 " + product.getStock());
        }
        if (existing == null) {
            CartItem item = new CartItem();
            item.setUserId(userId);
            item.setProductId(dto.getProductId());
            item.setQuantity(dto.getQuantity());
            item.setChecked(1);
            cartItemMapper.insert(item);
        } else {
            existing.setQuantity(newQuantity);
            cartItemMapper.updateById(existing);
        }
    }

    @Override
    public List<CartItemVO> list(Long userId) {
        List<CartItem> items = cartItemMapper.selectList(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId).orderByDesc(CartItem::getId));
        if (items.isEmpty()) return new ArrayList<>();
        List<Long> productIds = items.stream().map(CartItem::getProductId).toList();
        Map<Long, Product> products = productMapper.selectBatchIds(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        List<CartItemVO> vos = new ArrayList<>();
        for (CartItem item : items) {
            Product p = products.get(item.getProductId());
            if (p == null) continue;
            CartItemVO vo = new CartItemVO();
            vo.setId(item.getId());
            vo.setProductId(p.getId());
            vo.setProductName(p.getName());
            vo.setProductImage(p.getImage());
            vo.setPrice(p.getPrice());
            vo.setStock(p.getStock());
            vo.setQuantity(item.getQuantity());
            vo.setChecked(item.getChecked());
            vos.add(vo);
        }
        return vos;
    }

    @Override
    public void update(Long userId, Long id, CartUpdateDTO dto) {
        CartItem item = getOwned(userId, id);
        if (dto.getQuantity() != null) {
            Product p = productMapper.selectById(item.getProductId());
            if (dto.getQuantity() > p.getStock()) {
                throw new BusinessException("库存不足，当前库存 " + p.getStock());
            }
            item.setQuantity(dto.getQuantity());
        }
        if (dto.getChecked() != null) {
            item.setChecked(dto.getChecked());
        }
        cartItemMapper.updateById(item);
    }

    @Override
    public void delete(Long userId, Long id) {
        getOwned(userId, id);
        cartItemMapper.deleteById(id);
    }

    private CartItem getOwned(Long userId, Long id) {
        CartItem item = cartItemMapper.selectOne(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getId, id).eq(CartItem::getUserId, userId));
        if (item == null) {
            throw new BusinessException("购物车项不存在");
        }
        return item;
    }
}
```

`CartController.java`：四个端点（GET /api/cart、POST /api/cart、PUT /api/cart/{id}、DELETE /api/cart/{id}），userId 取自 `UserContext.getUserId()`。DTO：CartAddDTO（productId `@NotNull`、quantity `@NotNull @Min(1)`）、CartUpdateDTO（quantity/checked 可空）。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=CartControllerTest`
预期：3 个测试 PASS。

- [ ] **步骤 5：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add shopping cart apis"
```

---

### 任务 6：收货地址接口

**文件：**
- 创建：`backend/src/main/java/com/snackstore/entity/Address.java`
- 创建：`backend/src/main/java/com/snackstore/mapper/AddressMapper.java`
- 创建：`backend/src/main/java/com/snackstore/dto/AddressDTO.java`
- 创建：`backend/src/main/java/com/snackstore/service/AddressService.java`、`service/impl/AddressServiceImpl.java`
- 创建：`backend/src/main/java/com/snackstore/controller/AddressController.java`
- 测试：`backend/src/test/java/com/snackstore/AddressControllerTest.java`

- [ ] **步骤 1：编写失败测试 AddressControllerTest（CRUD + 设默认，验证设默认时其它地址的 is_default 归零）**

```java
package com.snackstore;

import com.snackstore.common.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AddressControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtUtil jwtUtil;

    private String auth;

    @BeforeEach
    void setup() {
        auth = "Bearer " + jwtUtil.generateToken(2L, "USER");
    }

    private String addrJson(String receiver, int def) {
        return "{\"receiver\":\"" + receiver + "\",\"phone\":\"13800000000\","
                + "\"province\":\"广东省\",\"city\":\"深圳市\",\"district\":\"南山区\","
                + "\"detail\":\"科技园 1 号\",\"isDefault\":" + def + "}";
    }

    @Test
    void createAndList_success() throws Exception {
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON).content(addrJson("张三", 1)))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/addresses").header("Authorization", auth))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].receiver").value("张三"));
    }

    @Test
    void setDefault_clearsOthers() throws Exception {
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("张三", 1)));
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("李四", 1)));
        mockMvc.perform(get("/api/addresses").header("Authorization", auth))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[?(@.receiver=='张三')].isDefault").value(0))
                .andExpect(jsonPath("$.data[?(@.receiver=='李四')].isDefault").value(1));
    }
}
```

注意：第 2 个测试的 jsonPath 过滤表达式用逗号分隔形式 `.data[?(@.receiver=='张三')].isDefault` 在 MockMvc 中返回数组，断言 value(0) 需确认 JSONPath 提供者行为；若运行失败，改为在 service 层测试或用 `jsonPath("$.data[1].isDefault")` 依插入顺序断言。执行者按实际运行结果调整断言，不得跳过测试。

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=AddressControllerTest`
预期：编译失败。

- [ ] **步骤 3：编写实现代码**

`AddressServiceImpl.java` 核心：

```java
package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.AddressDTO;
import com.snackstore.entity.Address;
import com.snackstore.mapper.AddressMapper;
import com.snackstore.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressServiceImpl implements AddressService {

    private final AddressMapper addressMapper;

    public AddressServiceImpl(AddressMapper addressMapper) {
        this.addressMapper = addressMapper;
    }

    @Override
    public List<Address> list(Long userId) {
        return addressMapper.selectList(new LambdaQueryWrapper<Address>()
                .eq(Address::getUserId, userId)
                .orderByDesc(Address::getIsDefault).orderByDesc(Address::getId));
    }

    @Override
    @Transactional
    public void create(Long userId, AddressDTO dto) {
        // 第一个地址自动设为默认
        Long count = addressMapper.selectCount(
                new LambdaQueryWrapper<Address>().eq(Address::getUserId, userId));
        Address addr = new Address();
        copy(addr, dto);
        addr.setUserId(userId);
        addr.setIsDefault(count == 0 ? 1 : (dto.getIsDefault() != null && dto.getIsDefault() == 1 ? 1 : 0));
        if (addr.getIsDefault() == 1) clearDefault(userId);
        addressMapper.insert(addr);
    }

    @Override
    @Transactional
    public void update(Long userId, Long id, AddressDTO dto) {
        Address addr = getOwned(userId, id);
        copy(addr, dto);
        if (dto.getIsDefault() != null && dto.getIsDefault() == 1 && addr.getIsDefault() != 1) {
            clearDefault(userId);
            addr.setIsDefault(1);
        }
        addressMapper.updateById(addr);
    }

    @Override
    public void delete(Long userId, Long id) {
        getOwned(userId, id);
        addressMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void setDefault(Long userId, Long id) {
        Address addr = getOwned(userId, id);
        clearDefault(userId);
        addr.setIsDefault(1);
        addressMapper.updateById(addr);
    }

    private void clearDefault(Long userId) {
        Address update = new Address();
        update.setIsDefault(0);
        addressMapper.update(update, new LambdaQueryWrapper<Address>()
                .eq(Address::getUserId, userId).eq(Address::getIsDefault, 1));
    }

    private Address getOwned(Long userId, Long id) {
        Address addr = addressMapper.selectOne(new LambdaQueryWrapper<Address>()
                .eq(Address::getId, id).eq(Address::getUserId, userId));
        if (addr == null) {
            throw new BusinessException("地址不存在");
        }
        return addr;
    }

    private void copy(Address addr, AddressDTO dto) {
        addr.setReceiver(dto.getReceiver());
        addr.setPhone(dto.getPhone());
        addr.setProvince(dto.getProvince());
        addr.setCity(dto.getCity());
        addr.setDistrict(dto.getDistrict());
        addr.setDetail(dto.getDetail());
    }
}
```

`AddressController.java`：GET/POST `/api/addresses`、PUT/DELETE `/api/addresses/{id}`、PUT `/api/addresses/{id}/default`。`AddressDTO`：receiver/phone `@NotBlank`，其余可空，isDefault 可空 Integer。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=AddressControllerTest`
预期：2 个测试 PASS。

- [ ] **步骤 5：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add address management apis"
```

---

### 任务 7：订单核心（下单事务 / 模拟支付 / 取消）

这是全项目最复杂的任务。下单事务顺序：查勾选购物车项 → 逐项条件更新扣库存（失败抛异常回滚）→ 生成 order_no → 插入 order + order_item（快照）→ 删除已购购物车项 → 累加商品 sales。

**文件：**
- 创建：`backend/src/main/java/com/snackstore/entity/Order.java`、`OrderItem.java`
- 创建：`backend/src/main/java/com/snackstore/mapper/OrderMapper.java`、`OrderItemMapper.java`
- 创建：`backend/src/main/java/com/snackstore/dto/OrderCreateDTO.java`
- 创建：`backend/src/main/java/com/snackstore/vo/OrderVO.java`、`OrderItemVO.java`
- 创建：`backend/src/main/java/com/snackstore/service/OrderService.java`、`service/impl/OrderServiceImpl.java`
- 创建：`backend/src/main/java/com/snackstore/controller/OrderController.java`
- 测试：`backend/src/test/java/com/snackstore/OrderControllerTest.java`

- [ ] **步骤 1：编写失败测试 OrderControllerTest**

```java
package com.snackstore;

import com.snackstore.common.JwtUtil;
import com.snackstore.entity.Address;
import com.snackstore.entity.Product;
import com.snackstore.mapper.AddressMapper;
import com.snackstore.mapper.CartItemMapper;
import com.snackstore.mapper.ProductMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private ProductMapper productMapper;
    @Autowired
    private AddressMapper addressMapper;
    @Autowired
    private CartItemMapper cartItemMapper;

    private String auth;

    @BeforeEach
    void setup() {
        auth = "Bearer " + jwtUtil.generateToken(2L, "USER");
    }

    private Product makeProduct(int stock) {
        Product p = new Product();
        p.setName("下单测试商品");
        p.setPrice(new BigDecimal("10.0"));
        p.setStock(stock);
        p.setSales(0);
        p.setStatus(1);
        productMapper.insert(p);
        return p;
    }

    private Address makeAddress() {
        Address a = new Address();
        a.setUserId(2L);
        a.setReceiver("收货人");
        a.setPhone("13800000000");
        a.setProvince("广东省");
        a.setCity("深圳市");
        a.setDistrict("南山区");
        a.setDetail("科技园 1 号");
        a.setIsDefault(1);
        addressMapper.insert(a);
        return a;
    }

    private void addCart(Long productId, int qty) throws Exception {
        mockMvc.perform(post("/api/cart").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":" + qty + "}"));
    }

    @Test
    void createOrder_success_deductsStock() throws Exception {
        Product p = makeProduct(10);
        Address a = makeAddress();
        addCart(p.getId(), 2);
        mockMvc.perform(post("/api/orders").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addressId\":" + a.getId() + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.totalAmount").value(20.0));
        assertEquals(8, productMapper.selectById(p.getId()).getStock());
        assertEquals(2, productMapper.selectById(p.getId()).getSales());
        // 购物车已清空
        mockMvc.perform(get("/api/cart").header("Authorization", auth))
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void createOrder_insufficientStock_fails() throws Exception {
        Product p = makeProduct(1);
        Address a = makeAddress();
        addCart(p.getId(), 2);
        mockMvc.perform(post("/api/orders").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addressId\":" + a.getId() + "}"))
                .andExpect(jsonPath("$.code").value(1));
        assertEquals(1, productMapper.selectById(p.getId()).getStock());
        // 购物车保留
        mockMvc.perform(get("/api/cart").header("Authorization", auth))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void payOrder_thenCancel_restoresStock() throws Exception {
        Product p = makeProduct(10);
        Address a = makeAddress();
        addCart(p.getId(), 3);
        String orderId = mockMvc.perform(post("/api/orders").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addressId\":" + a.getId() + "}"))
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"id\":(\\d+).*", "$1");
        mockMvc.perform(post("/api/orders/" + orderId + "/pay").header("Authorization", auth))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(post("/api/orders/" + orderId + "/cancel").header("Authorization", auth))
                .andExpect(jsonPath("$.code").value(0));
        assertEquals(10, productMapper.selectById(p.getId()).getStock());
    }
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=OrderControllerTest`
预期：编译失败。

- [ ] **步骤 3：编写实现代码**

`OrderServiceImpl.java` 核心：

```java
package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.OrderCreateDTO;
import com.snackstore.entity.*;
import com.snackstore.mapper.*;
import com.snackstore.service.OrderService;
import com.snackstore.vo.OrderItemVO;
import com.snackstore.vo.OrderVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final CartItemMapper cartItemMapper;
    private final ProductMapper productMapper;
    private final AddressMapper addressMapper;

    public OrderServiceImpl(OrderMapper orderMapper, OrderItemMapper orderItemMapper,
                            CartItemMapper cartItemMapper, ProductMapper productMapper,
                            AddressMapper addressMapper) {
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.cartItemMapper = cartItemMapper;
        this.productMapper = productMapper;
        this.addressMapper = addressMapper;
    }

    @Override
    @Transactional
    public OrderVO create(Long userId, OrderCreateDTO dto) {
        List<CartItem> items = cartItemMapper.selectList(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId).eq(CartItem::getChecked, 1));
        if (items.isEmpty()) {
            throw new BusinessException("请先选择要结算的商品");
        }
        Address address = addressMapper.selectOne(new LambdaQueryWrapper<Address>()
                .eq(Address::getId, dto.getAddressId()).eq(Address::getUserId, userId));
        if (address == null) {
            throw new BusinessException("收货地址不存在");
        }
        // 逐项扣库存：条件更新，不足即失败
        for (CartItem item : items) {
            int updated = productMapper.update(null, new LambdaUpdateWrapper<Product>()
                    .setSql("sales = sales + " + item.getQuantity())
                    .setSql("stock = stock - " + item.getQuantity())
                    .eq(Product::getId, item.getProductId())
                    .ge(Product::getStock, item.getQuantity()));
            if (updated == 0) {
                throw new BusinessException("商品库存不足，请调整数量后重试");
            }
        }
        // 订单快照
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setReceiver(address.getReceiver());
        order.setPhone(address.getPhone());
        order.setAddress(String.join(" ",
                address.getProvince(), address.getCity(), address.getDistrict(), address.getDetail()));
        order.setStatus(0);
        orderMapper.insert(order);

        List<Long> productIds = items.stream().map(CartItem::getProductId).toList();
        Map<Long, Product> products = productMapper.selectBatchIds(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : items) {
            Product p = products.get(item.getProductId());
            OrderItem oi = new OrderItem();
            oi.setOrderId(order.getId());
            oi.setProductId(p.getId());
            oi.setProductName(p.getName());
            oi.setProductImage(p.getImage());
            oi.setPrice(p.getPrice());
            oi.setQuantity(item.getQuantity());
            oi.setSubtotal(p.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            total = total.add(oi.getSubtotal());
            orderItemMapper.insert(oi);
        }
        order.setTotalAmount(total);
        orderMapper.updateById(order);
        // 删除已结算购物车项
        cartItemMapper.delete(new LambdaQueryWrapper<CartItem>()
                .eq(CartItem::getUserId, userId).eq(CartItem::getChecked, 1));
        return detail(userId, order.getId());
    }

    @Override
    public void pay(Long userId, Long id) {
        Order order = getOwned(userId, id);
        if (order.getStatus() != 0) {
            throw new BusinessException("订单状态不允许支付");
        }
        order.setStatus(1);
        order.setPaymentTime(LocalDateTime.now());
        orderMapper.updateById(order);
    }

    @Override
    @Transactional
    public void cancel(Long userId, Long id) {
        Order order = getOwned(userId, id);
        if (order.getStatus() != 0) {
            throw new BusinessException("只有待付款订单可以取消");
        }
        order.setStatus(4);
        orderMapper.updateById(order);
        // 回滚库存和销量
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getOrderId, id));
        for (OrderItem oi : items) {
            productMapper.update(null, new LambdaUpdateWrapper<Product>()
                    .setSql("stock = stock + " + oi.getQuantity())
                    .setSql("sales = sales - " + oi.getQuantity())
                    .eq(Product::getId, oi.getProductId()));
        }
    }

    @Override
    public List<OrderVO> list(Long userId, Integer status) {
        LambdaQueryWrapper<Order> qw = new LambdaQueryWrapper<Order>()
                .eq(Order::getUserId, userId).orderByDesc(Order::getId);
        if (status != null) qw.eq(Order::getStatus, status);
        List<Order> orders = orderMapper.selectList(qw);
        return orders.stream().map(o -> toVO(o, null)).toList();
    }

    @Override
    public OrderVO detail(Long userId, Long id) {
        Order order = getOwned(userId, id);
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getOrderId, id));
        return toVO(order, items);
    }

    private Order getOwned(Long userId, Long id) {
        Order order = orderMapper.selectOne(new LambdaQueryWrapper<Order>()
                .eq(Order::getId, id).eq(Order::getUserId, userId));
        if (order == null) throw new BusinessException("订单不存在");
        return order;
    }

    private OrderVO toVO(Order order, List<OrderItem> items) {
        OrderVO vo = new OrderVO();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setReceiver(order.getReceiver());
        vo.setPhone(order.getPhone());
        vo.setAddress(order.getAddress());
        vo.setTotalAmount(order.getTotalAmount());
        vo.setStatus(order.getStatus());
        vo.setPaymentTime(order.getPaymentTime());
        vo.setCreatedAt(order.getCreatedAt());
        if (items != null) {
            vo.setItems(items.stream().map(oi -> {
                OrderItemVO iv = new OrderItemVO();
                iv.setProductId(oi.getProductId());
                iv.setProductName(oi.getProductName());
                iv.setProductImage(oi.getProductImage());
                iv.setPrice(oi.getPrice());
                iv.setQuantity(oi.getQuantity());
                iv.setSubtotal(oi.getSubtotal());
                return iv;
            }).toList());
        }
        return vo;
    }

    private String generateOrderNo() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
```

`OrderController.java`：

```java
package com.snackstore.controller;

import com.snackstore.common.Result;
import com.snackstore.common.UserContext;
import com.snackstore.dto.OrderCreateDTO;
import com.snackstore.service.OrderService;
import com.snackstore.vo.OrderVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Result<OrderVO> create(@Valid @RequestBody OrderCreateDTO dto) {
        return Result.ok(orderService.create(UserContext.getUserId(), dto));
    }

    @GetMapping
    public Result<List<OrderVO>> list(@RequestParam(required = false) Integer status) {
        return Result.ok(orderService.list(UserContext.getUserId(), status));
    }

    @GetMapping("/{id}")
    public Result<OrderVO> detail(@PathVariable Long id) {
        return Result.ok(orderService.detail(UserContext.getUserId(), id));
    }

    @PostMapping("/{id}/pay")
    public Result<Void> pay(@PathVariable Long id) {
        orderService.pay(UserContext.getUserId(), id);
        return Result.ok(null);
    }

    @PostMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id) {
        orderService.cancel(UserContext.getUserId(), id);
        return Result.ok(null);
    }
}
```

`OrderCreateDTO.java`：`addressId` 字段，`@NotNull(message = "请选择收货地址")`。
`Order` 实体：`@TableName("`order`")`，字段含 orderNo、userId、receiver、phone、address、totalAmount、status、paymentTime、createdAt。`OrderItem` 实体：orderId、productId、productName、productImage、price、quantity、subtotal。
`OrderVO`：id、orderNo、receiver、phone、address、totalAmount、status、paymentTime、createdAt、items（List<OrderItemVO>）。

注意：测试断言 `totalAmount == 20.0`，JSON 中 DECIMAL 序列化为 `20.00`，jsonPath `value(20.0)` 数值比较不受字符串格式影响；若运行失败，改断言 `$.data.totalAmount` 值为 20.00 或使用 `value(closeTo(20.0, 0.01))`。执行者按实际输出调整，不得跳过。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=OrderControllerTest`
预期：3 个测试 PASS。

- [ ] **步骤 5：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add order create, pay and cancel with stock transaction"
```

---

### 任务 8：管理端 — 商品 / 分类 / 图片上传

**文件：**
- 创建：`backend/src/main/java/com/snackstore/dto/ProductDTO.java`、`CategoryDTO.java`
- 创建：`backend/src/main/java/com/snackstore/service/AdminService.java`、`service/impl/AdminServiceImpl.java`
- 创建：`backend/src/main/java/com/snackstore/controller/AdminProductController.java`、`AdminCategoryController.java`、`AdminUploadController.java`
- 测试：`backend/src/test/java/com/snackstore/AdminProductControllerTest.java`

- [ ] **步骤 1：编写失败测试 AdminProductControllerTest（用 admin token 管理商品；用 demo token 验证 403）**

```java
package com.snackstore;

import com.snackstore.common.JwtUtil;
import com.snackstore.entity.Product;
import com.snackstore.mapper.ProductMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminProductControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private ProductMapper productMapper;

    private String adminAuth;
    private String userAuth;

    @BeforeEach
    void setup() {
        adminAuth = "Bearer " + jwtUtil.generateToken(1L, "ADMIN");
        userAuth = "Bearer " + jwtUtil.generateToken(2L, "USER");
    }

    @Test
    void nonAdmin_accessDenied() throws Exception {
        mockMvc.perform(get("/api/admin/products").header("Authorization", userAuth))
                .andExpect(status().isForbidden());
    }

    @Test
    void createAndUpdateProduct_success() throws Exception {
        String body = "{\"categoryId\":1,\"name\":\"后台测试商品\",\"price\":12.5,\"stock\":30,\"status\":1}";
        String id = mockMvc.perform(post("/api/admin/products").header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(jsonPath("$.code").value(0))
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"id\":(\\d+).*", "$1");
        mockMvc.perform(put("/api/admin/products/" + id).header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":1,\"name\":\"改名商品\",\"price\":15.0,\"stock\":20,\"status\":1}"))
                .andExpect(jsonPath("$.code").value(0));
        assertEquals("改名商品", productMapper.selectById(Long.parseLong(id)).getName());
    }

    @Test
    void toggleStatus_success() throws Exception {
        Product p = new Product();
        p.setName("上下架测试");
        p.setPrice(new BigDecimal("1.0"));
        p.setStock(1);
        p.setStatus(1);
        productMapper.insert(p);
        mockMvc.perform(put("/api/admin/products/" + p.getId() + "/status").header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":0}"))
                .andExpect(jsonPath("$.code").value(0));
        assertEquals(0, productMapper.selectById(p.getId()).getStatus());
    }

    @Test
    void uploadImage_success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.png",
                "image/png", "fake-image-bytes".getBytes());
        mockMvc.perform(multipart("/api/admin/upload").file(file).header("Authorization", adminAuth))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").value(org.hamcrest.Matchers.startsWith("/uploads/")));
    }
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=AdminProductControllerTest`
预期：编译失败。

- [ ] **步骤 3：编写实现代码**

`AdminServiceImpl.java` 核心（商品 CRUD：创建/更新/上下架/删除；删除商品前校验无进行中订单？学习项目简化——直接物理删除并提示；分类 CRUD：删除分类前检查分类下是否有商品）：

```java
package com.snackstore.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.BusinessException;
import com.snackstore.dto.CategoryDTO;
import com.snackstore.dto.ProductDTO;
import com.snackstore.entity.Category;
import com.snackstore.entity.Product;
import com.snackstore.mapper.CategoryMapper;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.service.AdminService;
import org.springframework.stereotype.Service;

@Service
public class AdminServiceImpl implements AdminService {

    private final ProductMapper productMapper;
    private final CategoryMapper categoryMapper;

    public AdminServiceImpl(ProductMapper productMapper, CategoryMapper categoryMapper) {
        this.productMapper = productMapper;
        this.categoryMapper = categoryMapper;
    }

    @Override
    public Page<Product> listProducts(int page, int size, String keyword, Integer status) {
        LambdaQueryWrapper<Product> qw = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isBlank()) qw.like(Product::getName, keyword);
        if (status != null) qw.eq(Product::getStatus, status);
        qw.orderByDesc(Product::getId);
        return productMapper.selectPage(new Page<>(page, size), qw);
    }

    @Override
    public Product createProduct(ProductDTO dto) {
        Product p = new Product();
        copy(p, dto);
        p.setSales(0);
        if (p.getStatus() == null) p.setStatus(1);
        productMapper.insert(p);
        return p;
    }

    @Override
    public void updateProduct(Long id, ProductDTO dto) {
        Product p = productMapper.selectById(id);
        if (p == null) throw new BusinessException("商品不存在");
        copy(p, dto);
        productMapper.updateById(p);
    }

    @Override
    public void updateProductStatus(Long id, Integer status) {
        Product p = productMapper.selectById(id);
        if (p == null) throw new BusinessException("商品不存在");
        p.setStatus(status);
        productMapper.updateById(p);
    }

    @Override
    public void deleteProduct(Long id) {
        productMapper.deleteById(id);
    }

    @Override
    public void createCategory(CategoryDTO dto) {
        Category c = new Category();
        c.setName(dto.getName());
        c.setSort(dto.getSort() == null ? 0 : dto.getSort());
        c.setStatus(1);
        categoryMapper.insert(c);
    }

    @Override
    public void updateCategory(Long id, CategoryDTO dto) {
        Category c = categoryMapper.selectById(id);
        if (c == null) throw new BusinessException("分类不存在");
        c.setName(dto.getName());
        if (dto.getSort() != null) c.setSort(dto.getSort());
        if (dto.getStatus() != null) c.setStatus(dto.getStatus());
        categoryMapper.updateById(c);
    }

    @Override
    public void deleteCategory(Long id) {
        Long count = productMapper.selectCount(
                new LambdaQueryWrapper<Product>().eq(Product::getCategoryId, id));
        if (count > 0) {
            throw new BusinessException("该分类下还有商品，不能删除");
        }
        categoryMapper.deleteById(id);
    }

    private void copy(Product p, ProductDTO dto) {
        p.setCategoryId(dto.getCategoryId());
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setImage(dto.getImage());
        p.setPrice(dto.getPrice());
        p.setStock(dto.getStock());
        if (dto.getStatus() != null) p.setStatus(dto.getStatus());
    }
}
```

`AdminUploadController.java`：

```java
package com.snackstore.controller;

import com.snackstore.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminUploadController {

    @Value("${snackstore.upload-dir}")
    private String uploadDir;

    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String ext = original != null && original.contains(".")
                ? original.substring(original.lastIndexOf('.')) : ".png";
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        file.transferTo(dir.resolve(filename));
        return Result.ok("/uploads/" + filename);
    }
}
```

Controller 层：`AdminProductController`（GET 列表 / POST 创建 / PUT {id} / PUT {id}/status / DELETE {id}）、`AdminCategoryController`（GET 列表含禁用分类 / POST / PUT {id} / DELETE {id}）。`ProductDTO`：categoryId、name `@NotBlank`、description、image、price `@NotNull @DecimalMin("0.01")`、stock `@NotNull @Min(0)`、status；`CategoryDTO`：name `@NotBlank`、sort、status。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=AdminProductControllerTest`
预期：4 个测试 PASS。

- [ ] **步骤 5：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add admin product, category and upload apis"
```

---

### 任务 9：管理端 — 订单发货 / 用户管理 / 统计

**文件：**
- 创建：`backend/src/main/java/com/snackstore/vo/StatsVO.java`
- 创建：`backend/src/main/java/com/snackstore/controller/AdminOrderController.java`、`AdminUserController.java`、`AdminStatsController.java`
- 修改：`backend/src/main/java/com/snackstore/service/AdminService.java` + `AdminServiceImpl.java`（加订单/用户/统计方法）
- 创建：`backend/src/main/java/com/snackstore/mapper/OrderMapper.java` 中的统计 SQL（用 `@Select` 注解，避免 XML 文件）
- 测试：`backend/src/test/java/com/snackstore/AdminOrderControllerTest.java`

- [ ] **步骤 1：编写失败测试 AdminOrderControllerTest**

```java
package com.snackstore;

import com.snackstore.common.JwtUtil;
import com.snackstore.entity.Order;
import com.snackstore.mapper.OrderMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private OrderMapper orderMapper;

    private String adminAuth;

    @BeforeEach
    void setup() {
        adminAuth = "Bearer " + jwtUtil.generateToken(1L, "ADMIN");
    }

    @Test
    void shipOrder_success() throws Exception {
        Order o = new Order();
        o.setOrderNo("TEST" + System.currentTimeMillis());
        o.setUserId(2L);
        o.setReceiver("张三");
        o.setPhone("13800000000");
        o.setAddress("广东省 深圳市 南山区 科技园");
        o.setTotalAmount(new BigDecimal("10.0"));
        o.setStatus(1);
        orderMapper.insert(o);
        mockMvc.perform(post("/api/admin/orders/" + o.getId() + "/ship").header("Authorization", adminAuth))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/admin/orders").header("Authorization", adminAuth))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    void shipUnpaidOrder_fails() throws Exception {
        Order o = new Order();
        o.setOrderNo("TEST" + System.currentTimeMillis());
        o.setUserId(2L);
        o.setReceiver("张三");
        o.setPhone("13800000000");
        o.setAddress("测试地址");
        o.setTotalAmount(new BigDecimal("10.0"));
        o.setStatus(0);
        orderMapper.insert(o);
        mockMvc.perform(post("/api/admin/orders/" + o.getId() + "/ship").header("Authorization", adminAuth))
                .andExpect(jsonPath("$.code").value(1));
    }

    @Test
    void stats_returnsNumbers() throws Exception {
        mockMvc.perform(get("/api/admin/stats").header("Authorization", adminAuth))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.todayOrderCount").isNumber())
                .andExpect(jsonPath("$.data.todaySales").isNumber())
                .andExpect(jsonPath("$.data.lowStockProducts").isArray());
    }
}
```

- [ ] **步骤 2：运行测试验证失败**

运行：`cd backend && mvn test -Dtest=AdminOrderControllerTest`
预期：编译失败。

- [ ] **步骤 3：编写实现代码**

AdminService 新增方法（`AdminServiceImpl` 对应实现）：

```java
// 订单分页（含状态筛选），items 不加载（列表不需要明细，前端发货操作只依赖 id 和 status）
@Override
public Page<OrderVO> listOrders(int page, int size, Integer status) {
    LambdaQueryWrapper<Order> qw = new LambdaQueryWrapper<Order>().orderByDesc(Order::getId);
    if (status != null) qw.eq(Order::getStatus, status);
    Page<Order> result = orderMapper.selectPage(new Page<>(page, size), qw);
    Page<OrderVO> voPage = new Page<>(page, size, result.getTotal());
    voPage.setRecords(result.getRecords().stream()
            .map(o -> {
                OrderVO vo = new OrderVO();
                vo.setId(o.getId());
                vo.setOrderNo(o.getOrderNo());
                vo.setReceiver(o.getReceiver());
                vo.setPhone(o.getPhone());
                vo.setAddress(o.getAddress());
                vo.setTotalAmount(o.getTotalAmount());
                vo.setStatus(o.getStatus());
                vo.setPaymentTime(o.getPaymentTime());
                vo.setCreatedAt(o.getCreatedAt());
                return vo;
            }).toList());
    return voPage;
}

// 发货：status 1 -> 2
@Override
public void shipOrder(Long id) {
    Order order = orderMapper.selectById(id);
    if (order == null) throw new BusinessException("订单不存在");
    if (order.getStatus() != 1) throw new BusinessException("只有待发货订单可以发货");
    order.setStatus(2);
    orderMapper.updateById(order);
}

// 用户分页（username 关键词）
@Override
public Page<UserVO> listUsers(int page, int size, String keyword) {
    LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<User>().orderByDesc(User::getId);
    if (keyword != null && !keyword.isBlank()) qw.like(User::getUsername, keyword);
    Page<User> result = userMapper.selectPage(new Page<>(page, size), qw);
    Page<UserVO> voPage = new Page<>(page, size, result.getTotal());
    voPage.setRecords(result.getRecords().stream().map(u -> {
        UserVO vo = new UserVO();
        vo.setId(u.getId());
        vo.setUsername(u.getUsername());
        vo.setNickname(u.getNickname());
        vo.setPhone(u.getPhone());
        vo.setRole(u.getRole());
        vo.setStatus(u.getStatus());
        vo.setCreatedAt(u.getCreatedAt());
        return vo;
    }).toList());
    return voPage;
}

// 禁用/启用用户
@Override
public void updateUserStatus(Long id, Integer status) {
    User user = userMapper.selectById(id);
    if (user == null) throw new BusinessException("用户不存在");
    user.setStatus(status);
    userMapper.updateById(user);
}

// 统计（见下方完整实现）
StatsVO stats();
```

注意：`AdminServiceImpl` 构造函数需增加 `userMapper`、`orderMapper` 注入；`UserVO` 需补充 `status`、`createdAt` 字段（任务 3 的 UserVO 基础上扩展）。

`AdminOrderController.java`：

```java
package com.snackstore.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.snackstore.common.Result;
import com.snackstore.service.AdminService;
import com.snackstore.vo.OrderVO;
import com.snackstore.vo.StatsVO;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminOrderController {

    private final AdminService adminService;

    public AdminOrderController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/orders")
    public Result<Page<OrderVO>> list(@RequestParam(defaultValue = "1") int page,
                                      @RequestParam(defaultValue = "10") int size,
                                      @RequestParam(required = false) Integer status) {
        return Result.ok(adminService.listOrders(page, size, status));
    }

    @PostMapping("/orders/{id}/ship")
    public Result<Void> ship(@PathVariable Long id) {
        adminService.shipOrder(id);
        return Result.ok(null);
    }

    @GetMapping("/stats")
    public Result<StatsVO> stats() {
        return Result.ok(adminService.stats());
    }
}
```

`StatsVO.java`：todayOrderCount(Long)、todaySales(BigDecimal)、totalUsers(Long)、totalProducts(Long)、pendingShipCount(Long)、lowStockProducts(List<Map<String, Object>>，含 name/stock 字段)。

统计实现（Java 日期范围过滤 + 库存告警阈值 10，避免 SQL 方言问题）：

```java
@Override
public StatsVO stats() {
    StatsVO vo = new StatsVO();
    LocalDateTime start = LocalDate.now().atStartOfDay();
    LocalDateTime end = start.plusDays(1);
    vo.setTodayOrderCount(orderMapper.selectCount(new LambdaQueryWrapper<Order>()
            .ge(Order::getCreatedAt, start).lt(Order::getCreatedAt, end)));
    // 今日销售额 = 今日已支付订单金额合计（status 1/2/3）
    List<Order> paidToday = orderMapper.selectList(new LambdaQueryWrapper<Order>()
            .ge(Order::getPaymentTime, start).lt(Order::getPaymentTime, end)
            .in(Order::getStatus, 1, 2, 3));
    vo.setTodaySales(paidToday.stream().map(Order::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add));
    vo.setTotalUsers(userMapper.selectCount(null));
    vo.setTotalProducts(productMapper.selectCount(null));
    vo.setPendingShipCount(orderMapper.selectCount(
            new LambdaQueryWrapper<Order>().eq(Order::getStatus, 1)));
    vo.setLowStockProducts(productMapper.selectList(
            new LambdaQueryWrapper<Product>().lt(Product::getStock, 10)
                    .orderByAsc(Product::getStock)).stream().limit(10)
            .map(p -> Map.<String, Object>of("name", p.getName(), "stock", p.getStock()))
            .collect(Collectors.toList()));
    return vo;
}
```

（`LambdaQueryWrapper` 的 `in` 方法签名 `in(column, Object... values)` 可直接传 `1, 2, 3`。若编译器对 varargs 报歧义，改用 `in(Order::getStatus, List.of(1, 2, 3))`。）

`AdminUserController.java`：GET `/api/admin/users`（分页 + username 关键词）、PUT `/api/admin/users/{id}/status`（body `{"status": 0}`）。

- [ ] **步骤 4：运行测试验证通过**

运行：`cd backend && mvn test -Dtest=AdminOrderControllerTest`
预期：3 个测试 PASS。之后再跑一次全量 `mvn test`，确认前面所有测试一起通过。

- [ ] **步骤 5：向用户展示变更摘要，确认后 commit**

```bash
git add backend/
git commit -m "feat: add admin order, user and stats apis"
```

---

### 任务 10：前端骨架（axios / Pinia / 路由 / 布局 / 登录注册页）

**文件：**
- 创建：`frontend/src/api/request.js`、`api/auth.js`
- 创建：`frontend/src/stores/user.js`、`stores/cart.js`
- 创建：`frontend/src/router/index.js`
- 创建：`frontend/src/layouts/ShopLayout.vue`
- 创建：`frontend/src/views/shop/Login.vue`、`Register.vue`
- 修改：`frontend/src/main.js`、`frontend/src/App.vue`
- 修改：`frontend/vite.config.js`（任务 1 已加代理，此任务确认）

- [ ] **步骤 1：编写 request.js（Axios 封装）**

```js
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({ baseURL: '/api', timeout: 10000 })

request.interceptors.request.use((config) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 0) return res.data
    ElMessage.error(res.message || '操作失败')
    return Promise.reject(new Error(res.message))
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    ElMessage.error(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  },
)

export default request
```

注意：`stores/user.js` 在 `main.js` 中先安装 Pinia 再调用即可，拦截器内 `useUserStore()` 需保证调用时机在 Pinia 激活后（axios 请求发生在应用运行期，天然满足）。

- [ ] **步骤 2：编写 stores/user.js**

```js
import { defineStore } from 'pinia'
import { loginApi, registerApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.userInfo?.role === 'ADMIN',
  },
  actions: {
    async login(form) {
      const data = await loginApi(form)
      this.token = data.token
      this.userInfo = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('userInfo', JSON.stringify(data.user))
    },
    async register(form) {
      await registerApi(form)
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
  },
})
```

`api/auth.js`：

```js
import request from './request'

export const registerApi = (data) => request.post('/auth/register', data)
export const loginApi = (data) => request.post('/auth/login', data)
```

- [ ] **步骤 3：编写 router/index.js + 布局 + 登录/注册页**

```js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/login', component: () => import('@/views/shop/Login.vue') },
  { path: '/register', component: () => import('@/views/shop/Register.vue') },
  {
    path: '/',
    component: () => import('@/layouts/ShopLayout.vue'),
    children: [
      { path: '', component: () => import('@/views/shop/Home.vue') },
      { path: 'product/:id', component: () => import('@/views/shop/ProductDetail.vue') },
      { path: 'cart', component: () => import('@/views/shop/Cart.vue') },
      { path: 'checkout', component: () => import('@/views/shop/Checkout.vue') },
      { path: 'orders', component: () => import('@/views/shop/OrderList.vue') },
      { path: 'orders/:id', component: () => import('@/views/shop/OrderDetail.vue') },
      { path: 'profile', component: () => import('@/views/shop/Profile.vue') },
      { path: 'addresses', component: () => import('@/views/shop/AddressList.vue') },
    ],
  },
  { path: '/admin/login', component: () => import('@/views/admin/AdminLogin.vue') },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'products', component: () => import('@/views/admin/ProductManage.vue') },
      { path: 'categories', component: () => import('@/views/admin/CategoryManage.vue') },
      { path: 'orders', component: () => import('@/views/admin/OrderManage.vue') },
      { path: 'users', component: () => import('@/views/admin/UserManage.vue') },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return '/admin/login'
  }
  if (to.path === '/login' || to.path === '/register') {
    if (userStore.isLoggedIn) return to.path === '/login' ? '/' : '/'
  }
  return true
})

export default router
```

注意：此任务中 Home.vue 等页面组件尚未创建，为避免 dev server 编译失败，本任务先创建全部页面的**占位组件**（`<template><div>占位</div></template>`），后续任务逐个替换实现。占位组件清单：Home、ProductDetail、Cart、Checkout、OrderList、OrderDetail、Profile、AddressList、AdminLogin、Dashboard、ProductManage、CategoryManage、OrderManage、UserManage。

`layouts/ShopLayout.vue`（顶栏：logo「零食铺子」、分类入口、购物车入口带角标、登录/用户菜单）：

```vue
<template>
  <div>
    <header class="shop-header">
      <div class="container header-inner">
        <router-link to="/" class="logo">零食铺子</router-link>
        <div class="header-actions">
          <router-link to="/cart" class="cart-link">
            <el-badge :value="cartCount" :hidden="cartCount === 0">
              <el-icon :size="22"><ShoppingCart /></el-icon>
            </el-badge>
          </router-link>
          <template v-if="userStore.isLoggedIn">
            <el-dropdown>
              <span class="nickname">{{ userStore.userInfo?.nickname }}</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/orders')">我的订单</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/addresses')">收货地址</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" @click="router.push('/admin')">管理后台</el-dropdown-item>
                  <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <router-link v-else to="/login">登录 / 注册</router-link>
        </div>
      </div>
    </header>
    <main class="container">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const cartCount = computed(() => cartStore.count)

onMounted(() => {
  if (userStore.isLoggedIn) cartStore.refresh()
})

function logout() {
  userStore.logout()
  cartStore.reset()
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>
```

`stores/cart.js`：

```js
import { defineStore } from 'pinia'
import { getCartApi } from '@/api/cart'

export const useCartStore = defineStore('cart', {
  state: () => ({ count: 0, items: [] }),
  actions: {
    async refresh() {
      const items = await getCartApi()
      this.items = items
      this.count = items.reduce((sum, i) => sum + i.quantity, 0)
    },
    reset() {
      this.count = 0
      this.items = []
    },
  },
})
```

（`api/cart.js` 此任务先建，含 getCartApi 等函数，任务 12 用到其它函数。）

`Login.vue` 核心（el-form + 校验规则，成功后跳转；admin 账号登录后跳 /admin）：

```vue
<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <h2>登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-button type="primary" class="submit" :loading="loading" @click="submit">登 录</el-button>
        <div class="switch">
          还没有账号？<router-link to="/register">去注册</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push(userStore.isAdmin ? '/admin' : (route.query.redirect || '/'))
  } finally {
    loading.value = false
  }
}
</script>
```

`Register.vue` 同模式（username/password/confirmPassword/nickname，confirmPassword 自定义校验两次一致，成功后提示并跳 /login）。

- [ ] **步骤 4：修改 main.js**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
```

`App.vue` 改为只有 `<router-view />`。

- [ ] **步骤 5：运行验证**

```bash
cd frontend && npm run dev
curl -s http://localhost:5173/login
```

预期：返回 HTML；浏览器打开 http://localhost:5173/login 能看到登录页（后端需在运行中才能实际登录）。`npm run build` 也应成功。

- [ ] **步骤 6：向用户展示变更摘要，确认后 commit**

```bash
git add frontend/
git commit -m "feat: add frontend skeleton with login and register pages"
```

---

### 任务 11：前台商品浏览（首页 / 详情 / 搜索筛选）

**文件：**
- 创建：`frontend/src/api/product.js`
- 创建：`frontend/src/components/ProductCard.vue`
- 修改：`frontend/src/views/shop/Home.vue`、`ProductDetail.vue`（替换占位）

- [ ] **步骤 1：编写 api/product.js**

```js
import request from './request'

export const getCategoriesApi = () => request.get('/categories')
export const getProductsApi = (params) => request.get('/products', { params })
export const getProductApi = (id) => request.get(`/products/${id}`)
```

- [ ] **步骤 2：编写 ProductCard.vue（图片为空或加载失败显示占位图）**

```vue
<template>
  <router-link :to="`/product/${product.id}`" class="product-card">
    <el-image :src="product.image" fit="cover" class="product-img">
      <template #error>
        <div class="img-placeholder">🍿</div>
      </template>
    </el-image>
    <div class="product-info">
      <div class="product-name">{{ product.name }}</div>
      <div class="product-bottom">
        <span class="product-price">¥{{ product.price }}</span>
        <span class="product-sales">已售 {{ product.sales }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
defineProps({ product: { type: Object, required: true } })
</script>

<style scoped>
.product-card { display: block; border: 1px solid #eee; border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; transition: box-shadow 0.2s; }
.product-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.product-img { width: 100%; height: 180px; }
.img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; background: #f5f5f5; }
.product-info { padding: 10px; }
.product-name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-bottom { display: flex; justify-content: space-between; margin-top: 8px; }
.product-price { color: #f56c6c; font-weight: bold; }
.product-sales { color: #999; font-size: 12px; }
</style>
```

- [ ] **步骤 3：编写 Home.vue（分类 tab + 关键词搜索 + 排序 + 分页商品网格）**

核心 script：

```js
import { onMounted, reactive, ref } from 'vue'
import { getCategoriesApi, getProductsApi } from '@/api/product'

const categories = ref([])
const products = ref([])
const total = ref(0)
const query = reactive({ page: 1, size: 12, categoryId: null, keyword: '', sort: 'default' })

async function load() {
  const data = await getProductsApi({
    page: query.page, size: query.size,
    categoryId: query.categoryId || undefined,
    keyword: query.keyword || undefined,
    sort: query.sort === 'default' ? undefined : query.sort,
  })
  products.value = data.records
  total.value = data.total
}

function onSearch() { query.page = 1; load() }
function onCategory(catId) { query.categoryId = catId; query.page = 1; load() }

onMounted(async () => {
  categories.value = await getCategoriesApi()
  load()
})
```

模板：顶部 `el-input`（搜索按钮）→ `el-radio-group` 分类（含「全部」）→ `el-select` 排序（综合/销量优先/价格从低到高/价格从高到低，值 default/sales_desc/price_asc/price_desc）→ `el-row` 网格渲染 `ProductCard`（`el-col :span="6"`）→ `el-pagination`（total、page-size=12、`@current-change` 翻页加载）→ 空态 `el-empty`。

- [ ] **步骤 4：编写 ProductDetail.vue（大图 + 信息 + 数量选择 + 加购）**

```js
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductApi } from '@/api/product'
import { addToCartApi } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const product = ref(null)
const quantity = ref(1)

onMounted(async () => {
  product.value = await getProductApi(route.params.id)
})

async function addToCart() {
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  await addToCartApi({ productId: product.value.id, quantity: quantity.value })
  ElMessage.success('已加入购物车')
  cartStore.refresh()
}
```

模板：左侧 `el-image`（error 占位），右侧名称/价格/销量/库存/描述、`el-input-number`（min 1、max 库存）、加购按钮（库存为 0 时禁用显示「已售罄」）。

- [ ] **步骤 5：运行验证**

```bash
cd frontend && npm run dev
npm run build
```

预期：build 成功；浏览器首页显示 12 个种子商品、分类筛选和搜索可用；详情页加购需登录（跳登录页）。

- [ ] **步骤 6：向用户展示变更摘要，确认后 commit**

```bash
git add frontend/
git commit -m "feat: add home and product detail pages"
```

---

### 任务 12：购物车 / 下单 / 订单页面

**文件：**
- 创建：`frontend/src/api/address.js`、`api/order.js`
- 修改：`frontend/src/api/cart.js`（补全）
- 修改：`frontend/src/views/shop/Cart.vue`、`Checkout.vue`、`OrderList.vue`、`OrderDetail.vue`（替换占位）

- [ ] **步骤 1：编写 api 函数**

`api/cart.js`：

```js
import request from './request'

export const getCartApi = () => request.get('/cart')
export const addToCartApi = (data) => request.post('/cart', data)
export const updateCartApi = (id, data) => request.put(`/cart/${id}`, data)
export const deleteCartApi = (id) => request.delete(`/cart/${id}`)
```

`api/order.js`：

```js
import request from './request'

export const createOrderApi = (data) => request.post('/orders', data)
export const getOrdersApi = (params) => request.get('/orders', { params })
export const getOrderApi = (id) => request.get(`/orders/${id}`)
export const payOrderApi = (id) => request.post(`/orders/${id}/pay`)
export const cancelOrderApi = (id) => request.post(`/orders/${id}/cancel`)
```

`api/address.js`：getAddressesApi / createAddressApi / updateAddressApi / deleteAddressApi / setDefaultAddressApi。

- [ ] **步骤 2：编写 Cart.vue（el-table：勾选 el-checkbox、名称、单价、数量 el-input-number、小计、删除；合计勾选金额；去结算）**

核心逻辑：

```js
const items = ref([])
const cartStore = useCartStore()
const router = useRouter()

async function load() {
  items.value = await getCartApi()
}

const checkedItems = computed(() => items.value.filter((i) => i.checked === 1))
const totalPrice = computed(() =>
  checkedItems.value.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0).toFixed(2),
)

async function onQuantityChange(item) {
  await updateCartApi(item.id, { quantity: item.quantity })
  cartStore.refresh()
}
async function onCheckChange(item) {
  await updateCartApi(item.id, { checked: item.checked ? 1 : 0 })
  cartStore.refresh()
}
async function removeItem(item) {
  await deleteCartApi(item.id)
  ElMessage.success('已删除')
  load(); cartStore.refresh()
}
function checkout() {
  if (checkedItems.value.length === 0) return ElMessage.warning('请先选择商品')
  // 勾选项 id 通过 query 传给结算页
  router.push('/checkout')
}
```

注意：`el-table` 的 `el-checkbox` 用 `v-model="item.checked"` 时值为 boolean，与后端 Integer 转换在 update 请求时处理（`checked: item.checked ? 1 : 0`），列表加载后 `item.checked = item.checked === 1` 归一化。结算页通过 store 读取勾选项：加一个 `cartStore.pendingCheckout` 或在 Checkout 里直接调 getCartApi 过滤 checked——采用后者（简单、无状态同步问题）。

- [ ] **步骤 3：编写 Checkout.vue（地址单选列表 + 商品清单 + 提交订单）**

核心逻辑：

```js
const addresses = ref([])
const items = ref([])
const addressId = ref(null)

onMounted(async () => {
  const [addrList, cartItems] = await Promise.all([getAddressesApi(), getCartApi()])
  addresses.value = addrList
  items.value = cartItems.filter((i) => i.checked === 1)
  addressId.value = addrList.find((a) => a.isDefault === 1)?.id || addrList[0]?.id || null
})

async function submit() {
  if (!addressId.value) return ElMessage.warning('请先添加收货地址')
  await createOrderApi({ addressId: addressId.value })
  ElMessage.success('下单成功')
  cartStore.refresh()
  router.push('/orders')
}
```

模板：地址列表 `el-radio-group`（每条显示 receiver + phone + 完整地址，附「管理地址」链接到 /addresses）→ 商品清单（品名 × 数量 小计）→ 合计金额 → 提交按钮。

- [ ] **步骤 4：编写 OrderList.vue（状态 tab + 订单卡片：订单号、时间、状态标签、商品缩略、总额、支付/取消/查看详情按钮）**

```js
const statusMap = {
  0: { text: '待付款', type: 'warning' },
  1: { text: '待发货', type: 'primary' },
  2: { text: '已发货', type: 'info' },
  3: { text: '已完成', type: 'success' },
  4: { text: '已取消', type: 'info' },
}
const activeStatus = ref(null) // null = 全部

async function load() {
  const data = await getOrdersApi({ status: activeStatus.value ?? undefined })
  orders.value = data
}

async function pay(order) {
  await payOrderApi(order.id)
  ElMessage.success('支付成功')
  load()
}
async function cancel(order) {
  await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' })
  await cancelOrderApi(order.id)
  ElMessage.success('已取消')
  load()
}
```

- [ ] **步骤 5：编写 OrderDetail.vue（订单信息 el-descriptions + 商品清单 el-table + 状态进度条）**

`el-steps`（active 按 status：0→0 待付款、1→1 待发货、2→2 已发货、3→3 已完成）展示流程：提交订单 → 付款 → 发货 → 完成。数据来自 `getOrderApi(route.params.id)`，商品行渲染 order.items。

- [ ] **步骤 6：运行验证**

```bash
cd frontend && npm run dev
```

预期：手动走通 登录(demo/demo123) → 首页加购 → 购物车改数量勾选 → 结算选地址 → 提交 → 订单列表出现待付款订单 → 支付 → 状态变待发货。若地址为空，先在 /addresses 添加（任务 13 完成前用占位页，临时可直接在数据库插一条或等任务 13 联调）。

- [ ] **步骤 7：向用户展示变更摘要，确认后 commit**

```bash
git add frontend/
git commit -m "feat: add cart, checkout and order pages"
```

---

### 任务 13：个人中心 / 地址管理页

**文件：**
- 创建：`frontend/src/api/user.js`
- 修改：`frontend/src/views/shop/Profile.vue`、`AddressList.vue`（替换占位）

- [ ] **步骤 1：编写 api/user.js**

```js
import request from './request'

export const getProfileApi = () => request.get('/user/me')
export const updateProfileApi = (data) => request.put('/user/me', data)
export const updatePasswordApi = (data) => request.put('/user/password', data)
```

注意：规格 5.2 中「当前用户信息 / 修改资料 / 改密码」接口（GET/PUT /api/user/me、PUT /api/user/password）在任务 3 未实现——**本任务需先补后端 UserController + UserService**（TDD 同模式，测试类 `UserControllerTest`：getMe 返回当前用户、updatePassword 后旧密码登录失败新密码成功）。后端实现要点：改密码需校验旧密码正确，用 BCrypt 匹配后更新。

- [ ] **步骤 2：补后端 UserController 测试（TDD）**

```java
package com.snackstore;

import com.snackstore.common.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtUtil jwtUtil;

    private String auth;

    @BeforeEach
    void setup() {
        auth = "Bearer " + jwtUtil.generateToken(2L, "USER");
    }

    @Test
    void getMe_returnsUserInfo() throws Exception {
        mockMvc.perform(get("/api/user/me").header("Authorization", auth))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.username").value("demo"));
    }

    @Test
    void updatePassword_oldPasswordInvalid_fails() throws Exception {
        mockMvc.perform(put("/api/user/password").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"oldPassword\":\"wrong\",\"newPassword\":\"newpass123\"}"))
                .andExpect(jsonPath("$.code").value(1));
    }
}
```

- [ ] **步骤 3：实现后端 UserController / UserService**

`UserServiceImpl.java`：

```java
package com.snackstore.service.impl;

import com.snackstore.common.BusinessException;
import com.snackstore.common.UserContext;
import com.snackstore.dto.PasswordUpdateDTO;
import com.snackstore.dto.UserProfileDTO;
import com.snackstore.entity.User;
import com.snackstore.mapper.UserMapper;
import com.snackstore.service.UserService;
import com.snackstore.vo.UserVO;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public UserVO getMe() {
        return toVO(userMapper.selectById(UserContext.getUserId()));
    }

    @Override
    public void updateProfile(UserProfileDTO dto) {
        User user = userMapper.selectById(UserContext.getUserId());
        if (dto.getNickname() != null && !dto.getNickname().isBlank()) {
            user.setNickname(dto.getNickname());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        userMapper.updateById(user);
    }

    @Override
    public void updatePassword(PasswordUpdateDTO dto) {
        User user = userMapper.selectById(UserContext.getUserId());
        if (!encoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException("原密码错误");
        }
        user.setPassword(encoder.encode(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    private UserVO toVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setPhone(user.getPhone());
        vo.setRole(user.getRole());
        return vo;
    }
}
```

`UserController.java`：

```java
package com.snackstore.controller;

import com.snackstore.common.Result;
import com.snackstore.dto.PasswordUpdateDTO;
import com.snackstore.dto.UserProfileDTO;
import com.snackstore.service.UserService;
import com.snackstore.vo.UserVO;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public Result<UserVO> me() {
        return Result.ok(userService.getMe());
    }

    @PutMapping("/me")
    public Result<Void> updateProfile(@Valid @RequestBody UserProfileDTO dto) {
        userService.updateProfile(dto);
        return Result.ok(null);
    }

    @PutMapping("/password")
    public Result<Void> updatePassword(@Valid @RequestBody PasswordUpdateDTO dto) {
        userService.updatePassword(dto);
        return Result.ok(null);
    }
}
```

`PasswordUpdateDTO`：oldPassword、newPassword 均 `@NotBlank @Size(min=6,max=32)`。`UserProfileDTO`：nickname、phone 可空。

- [ ] **步骤 4：运行后端测试验证通过**

运行：`cd backend && mvn test -Dtest=UserControllerTest`
预期：2 个测试 PASS。

- [ ] **步骤 5：编写 Profile.vue（资料表单 + 密码修改表单）**

资料表单：nickname、phone 两个字段 + 保存按钮（updateProfileApi）；密码表单：oldPassword、newPassword、confirmPassword（校验一致）+ 修改按钮，成功后提示并 `userStore.logout()` 跳登录页。

- [ ] **步骤 6：编写 AddressList.vue（地址卡片列表 + 新增/编辑 el-dialog + 删除确认 + 设默认）**

核心逻辑：

```js
const addresses = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({ receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: 0 })
const formRef = ref()

async function load() {
  addresses.value = await getAddressesApi()
}
function openCreate() {
  editingId.value = null
  Object.assign(form, { receiver: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: 0 })
  dialogVisible.value = true
}
function openEdit(addr) {
  editingId.value = addr.id
  Object.assign(form, addr)
  dialogVisible.value = true
}
async function save() {
  await formRef.value.validate()
  if (editingId.value) await updateAddressApi(editingId.value, form)
  else await createAddressApi(form)
  ElMessage.success('已保存')
  dialogVisible.value = false
  load()
}
async function remove(addr) {
  await ElMessageBox.confirm('确认删除该地址？', '提示', { type: 'warning' })
  await deleteAddressApi(addr.id)
  load()
}
async function setDefault(addr) {
  await setDefaultAddressApi(addr.id)
  load()
}
```

表单校验：receiver、phone（`/^1\d{10}$/`）、detail 必填。

- [ ] **步骤 7：运行验证**

```bash
cd frontend && npm run dev
```

预期：个人中心可改昵称、改密码后需重新登录；地址管理可增删改查设默认。

- [ ] **步骤 8：向用户展示变更摘要，确认后 commit**

```bash
git add backend/ frontend/
git commit -m "feat: add profile and address pages with user apis"
```

---

### 任务 14：管理后台前端（登录 / 布局 / 仪表盘 / 四个管理页）

**文件：**
- 创建：`frontend/src/api/admin.js`
- 创建：`frontend/src/layouts/AdminLayout.vue`
- 修改：`frontend/src/views/admin/AdminLogin.vue`、`Dashboard.vue`、`ProductManage.vue`、`CategoryManage.vue`、`OrderManage.vue`、`UserManage.vue`（替换占位）

- [ ] **步骤 1：编写 api/admin.js**

```js
import request from './request'

export const adminGetProductsApi = (params) => request.get('/admin/products', { params })
export const adminCreateProductApi = (data) => request.post('/admin/products', data)
export const adminUpdateProductApi = (id, data) => request.put(`/admin/products/${id}`, data)
export const adminUpdateProductStatusApi = (id, data) => request.put(`/admin/products/${id}/status`, data)
export const adminDeleteProductApi = (id) => request.delete(`/admin/products/${id}`)
export const uploadImageApi = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const adminGetCategoriesApi = () => request.get('/admin/categories')
export const adminCreateCategoryApi = (data) => request.post('/admin/categories', data)
export const adminUpdateCategoryApi = (id, data) => request.put(`/admin/categories/${id}`, data)
export const adminDeleteCategoryApi = (id) => request.delete(`/admin/categories/${id}`)
export const adminGetOrdersApi = (params) => request.get('/admin/orders', { params })
export const shipOrderApi = (id) => request.post(`/admin/orders/${id}/ship`)
export const adminGetUsersApi = (params) => request.get('/admin/users', { params })
export const adminUpdateUserStatusApi = (id, data) => request.put(`/admin/users/${id}/status`, data)
export const getStatsApi = () => request.get('/admin/stats')
```

注意：任务 8 已实现 `AdminCategoryController` 的 GET 接口（返回全部分类含禁用），本任务直接使用。若任务 8 测试未覆盖该 GET 接口，在 AdminProductControllerTest 补一条断言：`mockMvc.perform(get("/api/admin/categories").header("Authorization", adminAuth)).andExpect(jsonPath("$.data").isArray())`。

- [ ] **步骤 2：编写 AdminLogin.vue（复用 userStore.login，登录后校验 isAdmin，非管理员提示并登出）**

```js
async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    if (!userStore.isAdmin) {
      userStore.logout()
      ElMessage.error('该账号不是管理员')
      return
    }
    ElMessage.success('登录成功')
    router.push('/admin')
  } finally {
    loading.value = false
  }
}
```

- [ ] **步骤 3：编写 AdminLayout.vue（el-container + el-aside 菜单 + el-header + el-main router-view）**

菜单项：仪表盘 /admin/dashboard、商品管理 /admin/products、分类管理 /admin/categories、订单管理 /admin/orders、用户管理 /admin/users（`el-menu :default-active="$route.path" router`）。顶栏右侧显示昵称 + 「返回商城」链接 + 退出登录。

- [ ] **步骤 4：编写 Dashboard.vue（4 个统计卡片 + ECharts 柱状图）**

```js
import * as echarts from 'echarts'
import { onMounted, ref } from 'vue'
import { getStatsApi } from '@/api/admin'

const stats = ref({})
const chartRef = ref()

onMounted(async () => {
  stats.value = await getStatsApi()
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    title: { text: '库存告警 TOP10', left: 'center' },
    xAxis: { type: 'category', data: stats.value.lowStockProducts.map((p) => p.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: stats.value.lowStockProducts.map((p) => p.stock), itemStyle: { color: '#f56c6c' } }],
  })
})
```

统计卡片（el-card 网格）：今日订单数 todayOrderCount、今日销售额 todaySales、待发货订单 pendingShipCount、商品总数 totalProducts。空数据时图表区显示 el-empty。

- [ ] **步骤 5：编写 ProductManage.vue（el-table 商品列表：图片缩略、名称、分类、价格、库存、销量、状态 el-switch、操作编辑/删除；新增/编辑 el-dialog：名称、分类 el-select（用管理端分类接口）、价格 el-input-number、库存 el-input-number、描述、图片 el-upload 手动上传）**

el-upload 配置要点：

```vue
<el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="onFileChange">
  <img v-if="form.image" :src="form.image" class="upload-preview" />
  <el-icon v-else class="upload-icon"><Plus /></el-icon>
</el-upload>
```

```js
async function onFileChange(file) {
  const url = await uploadImageApi(file.raw)
  form.image = url
  ElMessage.success('图片上传成功')
}
```

列表加载用 adminGetProductsApi（分页 + keyword 搜索 + status 筛选），操作后刷新。

- [ ] **步骤 6：编写 CategoryManage.vue（el-table：名称、排序、状态 el-switch、编辑/删除；新增/编辑 el-dialog 简单两字段）**

删除失败时后端返回「该分类下还有商品，不能删除」——拦截器已统一 ElMessage 展示，页面无需额外处理。

- [ ] **步骤 7：编写 OrderManage.vue（el-tabs 按状态 + el-table：订单号、收货人、电话、金额、状态、时间、发货按钮（status=1 时显示）+ 展开行显示明细）**

发货后提示「已发货」并刷新列表。状态文案复用任务 12 的 statusMap（复制到本页，不跨页面共享——保持页面独立）。

- [ ] **步骤 8：编写 UserManage.vue（el-table：用户名、昵称、手机、角色、状态 el-switch（禁用/启用）、注册时间；keyword 搜索）**

切换状态调 adminUpdateUserStatusApi(id, { status: 0/1 })。

- [ ] **步骤 9：运行验证**

```bash
cd backend && mvn test    # 全部后端测试通过
cd frontend && npm run build
```

预期：build 成功。手动验证：admin/admin123 登录后台 → 仪表盘有数据 → 新增商品（上传图片）→ 前台首页可见 → 下架商品前台消失 → 分类管理 CRUD → 订单列表可发货。

- [ ] **步骤 10：向用户展示变更摘要，确认后 commit**

```bash
git add backend/ frontend/
git commit -m "feat: add admin frontend pages"
```

---

### 任务 15：全链路验收 + 打包部署验证

**文件：**
- 修改：`backend/src/main/java/com/snackstore/config/WebConfig.java`（预留前端静态文件托管说明，无需改代码——Spring Boot 自动从 classpath:/static/ 提供静态文件）
- 修改：`README.md`（补充打包部署步骤）
- 无需新测试类

- [ ] **步骤 1：启动全套环境（MySQL + 后端 + 前端 dev）**

```bash
cd backend && mvn spring-boot:run   # 终端 1
cd frontend && npm run dev           # 终端 2
```

- [ ] **步骤 2：curl 全链路脚本验证（一条命令走完整流程）**

```bash
# 1. 注册新用户
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"e2euser","password":"e2e123456","nickname":"验收用户"}'
# 2. 登录拿 token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"e2euser","password":"e2e123456"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
echo "TOKEN=$TOKEN"
# 3. 浏览商品
curl -s http://localhost:8080/api/products?page=1&size=5
# 4. 加购（productId 用第 3 步返回的某个商品 id）
curl -s -X POST http://localhost:8080/api/cart -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"productId":1,"quantity":2}'
# 5. 添加地址
curl -s -X POST http://localhost:8080/api/addresses -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiver":"验收人","phone":"13900000000","province":"广东省","city":"深圳市","district":"南山区","detail":"验收路 1 号"}'
# 6. 下单（addressId 用第 5 步返回的 id）
curl -s -X POST http://localhost:8080/api/orders -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"addressId":1}'
# 7. 支付（orderId 用第 6 步返回的 id）
curl -s -X POST http://localhost:8080/api/orders/1/pay -H "Authorization: Bearer $TOKEN"
# 8. 管理员登录
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
# 9. 管理员发货
curl -s -X POST http://localhost:8080/api/admin/orders/1/ship -H "Authorization: Bearer $ADMIN_TOKEN"
# 10. 统计
curl -s http://localhost:8080/api/admin/stats -H "Authorization: Bearer $ADMIN_TOKEN"
```

预期：每步 code=0，第 3 步返回商品数组，第 6 步返回订单（totalAmount=19.8 视商品价格），第 10 步 stats 各字段有值。

- [ ] **步骤 3：生产构建 + 单端口部署验证**

```bash
cd frontend && npm run build
cp -r frontend/dist/* backend/src/main/resources/static/
cd backend && mvn package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

预期：`curl http://localhost:8080/` 返回前端 HTML（单端口，无 5173），登录购物全流程可用。验证后删除 `backend/src/main/resources/static/` 下的拷贝（产物不入库，static 目录加入 .gitignore，README 说明打包步骤）。

- [ ] **步骤 4：浏览器手动验收清单（请用户操作确认）**

- [ ] 前台：注册 → 登录 → 浏览分类/搜索/排序 → 详情加购 → 购物车改数量/勾选/删除 → 结算 → 订单列表支付 → 查看订单详情
- [ ] 个人中心：改昵称、改密码、重新登录
- [ ] 地址管理：增删改查、设默认
- [ ] 后台：admin 登录 → 仪表盘 → 新增商品（传图）→ 前台可见 → 下架后前台消失 → 订单发货 → 用户禁用后登录被拒

- [ ] **步骤 5：向用户展示变更摘要，确认后 commit**

```bash
git add README.md .gitignore
git commit -m "docs: add deployment guide and e2e acceptance"
```

---

## 完成定义

- 后端 9 个测试类全部 `mvn test` PASS：JwtUtilTest、AuthControllerTest、ProductControllerTest、CartControllerTest、AddressControllerTest、OrderControllerTest、AdminProductControllerTest、AdminOrderControllerTest、UserControllerTest
- 前端 `npm run build` 成功
- 任务 15 步骤 2 的 curl 全链路每步 code=0
- 任务 15 步骤 4 的浏览器手动清单用户确认通过
