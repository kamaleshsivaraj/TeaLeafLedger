package com.tealeafledger.config;

import com.tealeafledger.entity.User;
import com.tealeafledger.repository.RolePermissionRepository;
import com.tealeafledger.service.PermissionService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PermissionSeeder implements CommandLineRunner {

    private final PermissionService permissionService;
    private final RolePermissionRepository rolePermissionRepository;

    public PermissionSeeder(PermissionService permissionService, RolePermissionRepository rolePermissionRepository) {
        this.permissionService = permissionService;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    public void run(String... args) {
        for (User.Role role : new User.Role[]{User.Role.MANAGER, User.Role.ACCOUNTANT, User.Role.OPERATOR}) {
            if (!rolePermissionRepository.existsByRole(role)) {
                permissionService.saveMatrix(role, permissionService.getMatrix(role));
            }
        }
    }
}