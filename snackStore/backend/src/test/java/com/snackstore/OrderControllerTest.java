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
        p.setCategoryId(1L); // category_id 为 NOT NULL 且无默认值，测试数据需显式指定
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
        Product p = makeProduct(2);
        Address a = makeAddress();
        addCart(p.getId(), 2);
        // 购物车接口已有库存校验（加购时库存充足），这里模拟下单前库存被抢光
        Product snapshot = productMapper.selectById(p.getId());
        snapshot.setStock(1);
        productMapper.updateById(snapshot);
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
        // 业务规则：只有待付款订单可以取消，已付款订单取消失败
        mockMvc.perform(post("/api/orders/" + orderId + "/cancel").header("Authorization", auth))
                .andExpect(jsonPath("$.code").value(1));
        // 另下一单，待付款时取消，验证库存与销量回滚
        addCart(p.getId(), 2);
        String orderId2 = mockMvc.perform(post("/api/orders").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addressId\":" + a.getId() + "}"))
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"id\":(\\d+).*", "$1");
        mockMvc.perform(post("/api/orders/" + orderId2 + "/cancel").header("Authorization", auth))
                .andExpect(jsonPath("$.code").value(0));
        assertEquals(7, productMapper.selectById(p.getId()).getStock());
        assertEquals(3, productMapper.selectById(p.getId()).getSales());
    }
}
