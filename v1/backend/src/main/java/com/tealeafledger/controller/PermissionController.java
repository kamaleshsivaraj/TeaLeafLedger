package com.tealeafledger.controller;

import com.tealeafledger.entity.User;
import com.tealeafledger.service.CurrentUserService;
import com.tealeafledger.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionService permissionService;
    private final CurrentUserService currentUserService;

    public PermissionController(PermissionService permissionService, CurrentUserService currentUserService) {
        this.permissionService = permissionService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/modules")
    public ResponseEntity<Map<String, Object>> modules() {
        return ResponseEntity.ok(Map.of(
                "modules", PermissionService.MODULES,
                "actions", PermissionService.ACTIONS
        ));
    }

    @GetMapping("/{role}")
    public ResponseEntity<Map<String, Set<String>>> matrix(@PathVariable String role) {
        User.Role parsed;
        try {
            parsed = User.Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(permissionService.getMatrix(parsed));
    }

    @PutMapping("/{role}")
    public ResponseEntity<?> update(@PathVariable String role, @RequestBody Map<String, Set<String>> matrix) {
        User user = currentUserService.currentUser();
        if (!permissionService.isAdmin(user)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only ADMIN can modify role permissions"));
        }
        User.Role parsed;
        try {
            parsed = User.Role.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }
        if (parsed == User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "The ADMIN role always has full access and cannot be modified"));
        }
        permissionService.saveMatrix(parsed, matrix);
        return ResponseEntity.ok(permissionService.getMatrix(parsed));
    }
}