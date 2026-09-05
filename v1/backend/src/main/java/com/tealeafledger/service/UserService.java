package com.tealeafledger.service;

import com.tealeafledger.dto.CreateUserRequest;
import com.tealeafledger.dto.UpdateUserRequest;
import com.tealeafledger.entity.User;
import com.tealeafledger.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> list(String q, String role, String verification) {
        String query = q != null ? q.trim().toLowerCase() : "";
        String queryRole = role != null && !role.isBlank() ? role.trim().toUpperCase(Locale.ROOT) : null;
        String verificationMode = verification != null ? verification.trim().toLowerCase(Locale.ROOT) : "all";

        return userRepository.findAll().stream()
                .filter(u -> query.isBlank()
                        || u.getName().toLowerCase().contains(query)
                        || u.getEmail().toLowerCase().contains(query)
                        || (u.getPhone() != null && u.getPhone().toLowerCase().contains(query)))
                .filter(u -> queryRole == null || u.getRole().name().equals(queryRole))
                .filter(u -> matchesVerification(u, verificationMode))
                .toList();
    }

    private boolean matchesVerification(User u, String mode) {
        return switch (mode) {
            case "email" -> Boolean.TRUE.equals(u.getEmailVerified());
            case "phone" -> Boolean.TRUE.equals(u.getPhoneVerified());
            case "none" -> !Boolean.TRUE.equals(u.getEmailVerified()) && !Boolean.TRUE.equals(u.getPhoneVerified());
            case "any" -> Boolean.TRUE.equals(u.getEmailVerified()) || Boolean.TRUE.equals(u.getPhoneVerified());
            case "both" -> Boolean.TRUE.equals(u.getEmailVerified()) && Boolean.TRUE.equals(u.getPhoneVerified());
            default -> true;
        };
    }

    public User create(CreateUserRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        User user = new User(request.getName(), email, request.getPhone(),
                passwordEncoder.encode(request.getPassword()));
        user.setRole(resolveRole(request.getRole()));
        return userRepository.save(user);
    }

    public User update(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getName() != null && !request.getName().isBlank()) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getRole() != null && !request.getRole().isBlank()) {
            User.Role newRole = resolveRole(request.getRole());
            if (user.getRole() == User.Role.ADMIN && newRole != User.Role.ADMIN && countAdmins() <= 1) {
                throw new IllegalArgumentException("Cannot demote the last administrator");
            }
            user.setRole(newRole);
        }
        if (request.getEmailVerified() != null) user.setEmailVerified(request.getEmailVerified());
        if (request.getPhoneVerified() != null) user.setPhoneVerified(request.getPhoneVerified());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        return userRepository.save(user);
    }

    public void delete(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getRole() == User.Role.ADMIN && countAdmins() <= 1) {
            throw new IllegalArgumentException("Cannot delete the last administrator");
        }
        userRepository.delete(user);
    }

    private long countAdmins() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .count();
    }

    private User.Role resolveRole(String role) {
        if (role == null || role.isBlank()) return User.Role.OPERATOR;
        try {
            return User.Role.valueOf(role.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role. Use ADMIN, MANAGER, OPERATOR or ACCOUNTANT");
        }
    }
}