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
                        .content("{\"oldPassword\":\"wrong123\",\"newPassword\":\"newpass123\"}"))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("原密码错误"));
    }

    @Test
    void updatePassword_success_thenLoginWithNewPassword() throws Exception {
        mockMvc.perform(put("/api/user/password").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"oldPassword\":\"demo123\",\"newPassword\":\"newpass123\"}"))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"demo\",\"password\":\"newpass123\"}"))
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }
}
