package com.tealeafledger.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tealeafledger.entity.RolePermission;
import com.tealeafledger.entity.User;
import com.tealeafledger.exception.ForbiddenException;
import com.tealeafledger.repository.RolePermissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PermissionService {

    private static final Logger log = LoggerFactory.getLogger(PermissionService.class);

    public static final List<String> MODULES = List.of(
            "DASHBOARD", "COLLECTION", "FARMERS", "DELIVERIES", "RATES", "FINANCE", "REPORTS", "USERS"
    );

    public static final List<String> ACTIONS = List.of("VIEW", "CREATE", "UPDATE", "DELETE", "PRINT");

    private final RolePermissionRepository repository;
    private final ObjectMapper objectMapper;

    public PermissionService(RolePermissionRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public boolean isAdmin(User user) {
        return user != null && user.getRole() == User.Role.ADMIN;
    }

    public boolean has(User user, String module, String action) {
        if (isAdmin(user)) return true;
        if (module == null || action == null) return false;
        return permissionsOf(user).getOrDefault(module.toUpperCase(), Set.of()).contains(action.toUpperCase());
    }

    public void require(User user, String module, String action) {
        if (!has(user, module, action)) {
            throw new ForbiddenException("You do not have permission to " + action.toLowerCase() + " on " + module.toLowerCase());
        }
    }

    public Map<String, Set<String>> permissionsOf(User user) {
        if (user == null) return Map.of();
        if (isAdmin(user)) return allPermissions();
        return readMatrix(user.getRole());
    }

    public Map<String, Set<String>> allPermissions() {
        Map<String, Set<String>> all = new LinkedHashMap<>();
        for (String m : MODULES) all.put(m, new LinkedHashSet<>(ACTIONS));
        return all;
    }

    private Map<String, Set<String>> readMatrix(User.Role role) {
        return repository.findByRole(role)
                .map(rp -> parse(rp.getPermissionsJson()))
                .orElseGet(() -> defaultMatrix(role));
    }

    public Map<String, Set<String>> getMatrix(User.Role role) {
        if (role == null) return Map.of();
        if (role == User.Role.ADMIN) return allPermissions();
        return readMatrix(role);
    }

    public void saveMatrix(User.Role role, Map<String, Set<String>> matrix) {
        if (role == null) throw new IllegalArgumentException("Role is required");
        if (role == User.Role.ADMIN) throw new IllegalArgumentException("The ADMIN role always has full access and cannot be modified");
        Map<String, Set<String>> clean = cleanMatrix(matrix);
        String json = toJson(clean);
        RolePermission rp = repository.findByRole(role).orElseGet(() -> {
            RolePermission n = new RolePermission();
            n.setRole(role);
            return n;
        });
        rp.setPermissionsJson(json);
        repository.save(rp);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Set<String>> cleanMatrix(Map<String, Set<String>> matrix) {
        Map<String, Set<String>> result = new LinkedHashMap<>();
        for (String module : MODULES) {
            Set<String> moduleActions = new LinkedHashSet<>();
            Object raw = matrix.get(module);
            if (raw instanceof Set) {
                for (Object a : (Set<Object>) raw) {
                    String action = String.valueOf(a).toUpperCase();
                    if (ACTIONS.contains(action)) moduleActions.add(action);
                }
            }
            result.put(module, moduleActions);
        }
        return result;
    }

    private String toJson(Map<String, Set<String>> matrix) {
        try {
            return objectMapper.writeValueAsString(matrix);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize permissions", e);
        }
    }

    private Map<String, Set<String>> parse(String json) {
        if (json == null || json.isBlank()) return defaultMatrix(null);
        try {
            Map<String, Set<String>> parsed = objectMapper.readValue(json, new TypeReference<Map<String, Set<String>>>() {});
            return cleanMatrix(parsed);
        } catch (Exception e) {
            log.warn("Could not parse role permissions JSON, falling back to defaults", e);
            return defaultMatrix(null);
        }
    }

    private Map<String, Set<String>> defaultMatrix(User.Role role) {
        Map<String, Set<String>> defaults = new LinkedHashMap<>();
        for (String m : MODULES) {
            defaults.put(m, new LinkedHashSet<>());
        }
        if (role == null) return defaults;

        switch (role) {
            case MANAGER -> {
                add(defaults, "DASHBOARD", "VIEW");
                add(defaults, "COLLECTION", "VIEW", "CREATE", "UPDATE", "DELETE", "PRINT");
                add(defaults, "FARMERS", "VIEW", "CREATE", "UPDATE");
                add(defaults, "DELIVERIES", "VIEW", "CREATE", "UPDATE", "DELETE");
                add(defaults, "RATES", "VIEW", "CREATE", "UPDATE", "DELETE");
                add(defaults, "FINANCE", "VIEW", "CREATE", "UPDATE");
                add(defaults, "REPORTS", "VIEW");
            }
            case ACCOUNTANT -> {
                add(defaults, "DASHBOARD", "VIEW");
                add(defaults, "COLLECTION", "VIEW", "PRINT");
                add(defaults, "FARMERS", "VIEW");
                add(defaults, "FINANCE", "VIEW", "CREATE", "UPDATE", "DELETE");
                add(defaults, "REPORTS", "VIEW", "PRINT");
            }
            case OPERATOR -> {
                add(defaults, "DASHBOARD", "VIEW");
                add(defaults, "COLLECTION", "VIEW", "CREATE", "PRINT");
                add(defaults, "FARMERS", "VIEW", "CREATE");
            }
        }
        return defaults;
    }

    private void add(Map<String, Set<String>> matrix, String module, String... actions) {
        matrix.computeIfAbsent(module, k -> new LinkedHashSet<>());
        for (String a : actions) matrix.get(module).add(a);
    }
}
