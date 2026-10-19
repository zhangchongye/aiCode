package com.snackstore.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA history 路由回退：显式列出前端路由，转发到 index.html 由前端路由接管，
 * 解决生产单端口部署下刷新 /login 等深层链接 404 的问题。
 * 新增前端路由时需在此同步添加。
 */
@Controller
public class SpaForwardController {

    @GetMapping({
            "/", "/login", "/register",
            "/cart", "/checkout", "/orders", "/orders/{id}",
            "/profile", "/addresses", "/product/{id}",
            "/admin/login", "/admin", "/admin/dashboard",
            "/admin/products", "/admin/categories", "/admin/orders", "/admin/users",
    })
    public String forward() {
        return "forward:/index.html";
    }
}
