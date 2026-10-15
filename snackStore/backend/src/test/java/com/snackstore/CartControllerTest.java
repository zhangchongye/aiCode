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
        p.setCategoryId(1L); // category_id 为 NOT NULL 且无默认值，测试数据需显式指定
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

    private long addItem(int quantity) throws Exception {
        mockMvc.perform(post("/api/cart").header("Authorization", auth())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":" + productId + ",\"quantity\":" + quantity + "}"));
        String body = mockMvc.perform(get("/api/cart").header("Authorization", auth()))
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(body.replaceAll(".*\"id\":(\\d+).*", "$1"));
    }

    @Test
    void updateQuantity_success() throws Exception {
        long itemId = addItem(1);
        mockMvc.perform(put("/api/cart/" + itemId).header("Authorization", auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":5}"))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/cart").header("Authorization", auth()))
                .andExpect(jsonPath("$.data[0].quantity").value(5));
    }

    @Test
    void updateQuantity_zero_fails() throws Exception {
        long itemId = addItem(1);
        mockMvc.perform(put("/api/cart/" + itemId).header("Authorization", auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":0}"))
                .andExpect(jsonPath("$.code").value(1));
    }

    @Test
    void updateChecked_outOfRange_fails() throws Exception {
        long itemId = addItem(1);
        mockMvc.perform(put("/api/cart/" + itemId).header("Authorization", auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"checked\":2}"))
                .andExpect(jsonPath("$.code").value(1));
    }

    @Test
    void update_deletedProduct_fails() throws Exception {
        long itemId = addItem(1);
        productMapper.deleteById(productId);
        mockMvc.perform(put("/api/cart/" + itemId).header("Authorization", auth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":2}"))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("商品不存在或已下架"));
    }

    @Test
    void update_delete_otherUsersItem_fails() throws Exception {
        long itemId = addItem(1);
        String otherToken = "Bearer " + jwtUtil.generateToken(99L, "USER");
        mockMvc.perform(put("/api/cart/" + itemId).header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\":2}"))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("购物车项不存在"));
        mockMvc.perform(delete("/api/cart/" + itemId).header("Authorization", otherToken))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("购物车项不存在"));
    }
}
