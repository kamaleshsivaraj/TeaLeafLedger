package com.tealeafledger.repository;

import com.tealeafledger.entity.RolePermission;
import com.tealeafledger.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    Optional<RolePermission> findByRole(User.Role role);
    boolean existsByRole(User.Role role);
}
