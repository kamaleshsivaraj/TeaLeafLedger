package com.tealeafledger.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "role_permissions", uniqueConstraints = @UniqueConstraint(columnNames = "role"))
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private User.Role role;

    @Column(nullable = false, columnDefinition = "text")
    private String permissionsJson;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public RolePermission() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User.Role getRole() { return role; }
    public void setRole(User.Role role) { this.role = role; }
    public String getPermissionsJson() { return permissionsJson; }
    public void setPermissionsJson(String permissionsJson) { this.permissionsJson = permissionsJson; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
