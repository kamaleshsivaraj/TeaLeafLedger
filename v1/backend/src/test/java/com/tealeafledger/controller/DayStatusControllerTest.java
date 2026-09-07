package com.tealeafledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class DayStatusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getDayStatus_withoutAuth_returns403() throws Exception {
        mockMvc.perform(get("/api/settings/day-status"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getDayStatus_withManagerToken_returnsValidStatus() throws Exception {
        String token = login("manager@tealeafledger.com", "Admin@123");

        mockMvc.perform(get("/api/settings/day-status")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.status").isString());
    }

    @Test
    void updateDayStatus_withManagerToken_persistsThenRestoresOpen() throws Exception {
        String token = login("manager@tealeafledger.com", "Admin@123");

        try {
            mockMvc.perform(put("/api/settings/day-status")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("status", "HALFDAY"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("HALFDAY"));
        } finally {
            mockMvc.perform(put("/api/settings/day-status")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("status", "OPEN"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("OPEN"));
        }
    }

    @Test
    void updateDayStatus_withManagerToken_rejectsUnknownStatus() throws Exception {
        String token = login("manager@tealeafledger.com", "Admin@123");

        mockMvc.perform(put("/api/settings/day-status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"NUKE\"}"))
                .andExpect(status().isBadRequest());
    }

    private String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }
}