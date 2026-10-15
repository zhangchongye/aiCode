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
