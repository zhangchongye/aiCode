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

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    // 按列表顺序返回地址 id（列表按 is_default DESC, id DESC 排序）
    private List<String> idsFromList() throws Exception {
        String body = mockMvc.perform(get("/api/addresses").header("Authorization", auth))
                .andReturn().getResponse().getContentAsString();
        List<String> ids = new ArrayList<>();
        Matcher m = Pattern.compile("\"id\":(\\d+)").matcher(body);
        while (m.find()) {
            ids.add(m.group(1));
        }
        return ids;
    }

    @Test
    void update_toDefault_clearsOthers() throws Exception {
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("张三", 1))); // A 默认
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("李四", 0))); // B 非默认
        List<String> ids = idsFromList(); // [A, B]
        mockMvc.perform(put("/api/addresses/" + ids.get(1)).header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON).content(addrJson("李四", 1)))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/addresses").header("Authorization", auth))
                .andExpect(jsonPath("$.data[0].receiver").value("李四"))
                .andExpect(jsonPath("$.data[0].isDefault").value(1))
                .andExpect(jsonPath("$.data[1].receiver").value("张三"))
                .andExpect(jsonPath("$.data[1].isDefault").value(0));
    }

    @Test
    void setDefaultEndpoint_success() throws Exception {
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("张三", 1))); // A 默认
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("李四", 0))); // B 非默认
        List<String> ids = idsFromList(); // [A, B]
        mockMvc.perform(put("/api/addresses/" + ids.get(1) + "/default").header("Authorization", auth))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/addresses").header("Authorization", auth))
                .andExpect(jsonPath("$.data[0].receiver").value("李四"))
                .andExpect(jsonPath("$.data[0].isDefault").value(1))
                .andExpect(jsonPath("$.data[1].receiver").value("张三"))
                .andExpect(jsonPath("$.data[1].isDefault").value(0));
    }

    @Test
    void operate_otherUsersAddress_fails() throws Exception {
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("张三", 1)));
        List<String> ids = idsFromList();
        String otherToken = "Bearer " + jwtUtil.generateToken(99L, "USER");
        mockMvc.perform(put("/api/addresses/" + ids.get(0)).header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON).content(addrJson("王五", 1)))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("地址不存在"));
        mockMvc.perform(delete("/api/addresses/" + ids.get(0)).header("Authorization", otherToken))
                .andExpect(jsonPath("$.code").value(1))
                .andExpect(jsonPath("$.message").value("地址不存在"));
    }

    @Test
    void deleteAddress_success() throws Exception {
        mockMvc.perform(post("/api/addresses").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content(addrJson("张三", 1)));
        List<String> ids = idsFromList();
        mockMvc.perform(delete("/api/addresses/" + ids.get(0)).header("Authorization", auth))
                .andExpect(jsonPath("$.code").value(0));
        mockMvc.perform(get("/api/addresses").header("Authorization", auth))
                .andExpect(jsonPath("$.data.length()").value(0));
    }
}
