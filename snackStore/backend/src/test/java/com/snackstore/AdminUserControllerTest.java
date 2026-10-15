package com.snackstore;

import com.snackstore.common.JwtUtil;
import com.snackstore.entity.User;
import com.snackstore.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserMapper userMapper;

    private String adminAuth;

    @BeforeEach
    void setup() {
        adminAuth = "Bearer " + jwtUtil.generateToken(1L, "ADMIN");
    }

    @Test
    void listUsers_returnsRecords() throws Exception {
        mockMvc.perform(get("/api/admin/users").header("Authorization", adminAuth))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.records").isArray());
    }

    @Test
    void updateStatus_emptyBody_rejected() throws Exception {
        mockMvc.perform(put("/api/admin/users/1/status").header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("状态不能为空"));
    }

    @Test
    void updateStatus_invalidValue_rejected() throws Exception {
        mockMvc.perform(put("/api/admin/users/1/status").header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":5}"))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("状态值非法"));
    }

    @Test
    void disableUser_success() throws Exception {
        User u = new User();
        u.setUsername("TEST_USER_" + System.currentTimeMillis());
        u.setPassword("x");
        u.setNickname("测试用户");
        u.setRole("USER");
        u.setStatus(1);
        userMapper.insert(u);
        mockMvc.perform(put("/api/admin/users/" + u.getId() + "/status").header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":0}"))
                .andExpect(jsonPath("$.code").value(0));
        assertEquals(0, userMapper.selectById(u.getId()).getStatus());
    }
}
