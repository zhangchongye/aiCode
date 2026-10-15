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
        p.setCategoryId(1L); // category_id 为 NOT NULL 且无默认值，测试数据需显式指定
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
