package com.tealeafledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PermissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getModules_withoutAuth_returns403() throws Exception {
        mockMvc.perform(get("/api/permissions/modules"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getModules_withAuth_returnsAllModulesAndActions() throws Exception {
        String token = login("admin@tealeafledger.com", "Admin@123");

        mockMvc.perform(get("/api/permissions/modules")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modules").isArray())
                .andExpect(jsonPath("$.modules").isNotEmpty())
                .andExpect(jsonPath("$.modules[0]").value("DASHBOARD"))
                .andExpect(jsonPath("$.actions").isArray())
                .andExpect(jsonPath("$.actions[0]").value("VIEW"));
    }

    @Test
    void getMatrix_withoutAuth_returns403() throws Exception {
        mockMvc.perform(get("/api/permissions/MANAGER"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMatrix_withAuth_returnsRoleMatrix() throws Exception {
        String token = login("manager@tealeafledger.com", "Admin@123");

        mockMvc.perform(get("/api/permissions/MANAGER")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.DASHBOARD").isArray())
                .andExpect(jsonPath("$.DELIVERIES").isArray())
                .andExpect(jsonPath("$.FINANCE").isArray());
    }

    @Test
    void getMatrix_withUnknownRole_returns400() throws Exception {
        String token = login("admin@tealeafledger.com", "Admin@123");

        mockMvc.perform(get("/api/permissions/NONEXISTENT")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateMatrix_withoutAdminRole_returns403() throws Exception {
        String token = login("manager@tealeafledger.com", "Admin@123");

        mockMvc.perform(put("/api/permissions/OPERATOR")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"FARMERS\":[\"VIEW\"]}"))
                .andExpect(status().isForbidden());
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