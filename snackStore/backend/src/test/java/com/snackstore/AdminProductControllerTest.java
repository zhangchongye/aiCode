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
        p.setCategoryId(1L); // category_id 为 NOT NULL 且无默认值，测试数据需显式指定
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
