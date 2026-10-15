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
        // CORS 预检请求直接放行
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }
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
            UserContext.clear();
            return false;
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
