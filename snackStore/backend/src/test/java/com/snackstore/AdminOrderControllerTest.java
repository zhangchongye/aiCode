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
