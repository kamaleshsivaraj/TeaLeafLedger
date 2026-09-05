package com.tealeafledger.controller;

import com.tealeafledger.dto.AuthResponse;
import com.tealeafledger.dto.ChangePasswordRequest;
import com.tealeafledger.dto.ForgotPasswordRequest;
import com.tealeafledger.dto.LoginRequest;
import com.tealeafledger.dto.ResetPasswordRequest;
import com.tealeafledger.dto.SignupRequest;
import com.tealeafledger.dto.UpdateProfileRequest;
import com.tealeafledger.dto.VerifyCodeRequest;
import com.tealeafledger.entity.User;
import com.tealeafledger.service.AuthService;
import com.tealeafledger.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;

    public AuthController(AuthService authService, CurrentUserService currentUserService) {
        this.authService = authService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.sendForgotPasswordEmail(request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    // ---------- Account & Security ----------

    @GetMapping("/me")
    public ResponseEntity<User> me() {
        return ResponseEntity.ok(currentUserService.currentUser());
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        AuthResponse response = authService.updateProfile(currentUserService.currentUser().getEmail(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUserService.currentUser().getEmail(), request);
        return ResponseEntity.ok(Map.of("changed", true));
    }

    @PostMapping("/me/password/otp")
    public ResponseEntity<Map<String, Object>> sendChangePasswordOtp() {
        return ResponseEntity.ok(authService.sendChangePasswordCode(currentUserService.currentUser().getEmail()));
    }

    @PostMapping("/me/email/send")
    public ResponseEntity<Map<String, Object>> sendEmailCode() {
        return ResponseEntity.ok(authService.sendEmailCode(currentUserService.currentUser().getEmail()));
    }

    @PostMapping("/me/email/confirm")
    public ResponseEntity<Map<String, Object>> confirmEmail(@Valid @RequestBody VerifyCodeRequest request) {
        return ResponseEntity.ok(authService.confirmEmail(currentUserService.currentUser().getEmail(), request.getCode()));
    }

    @PostMapping("/me/phone/send")
    public ResponseEntity<Map<String, Object>> sendPhoneCode() {
        return ResponseEntity.ok(authService.sendPhoneCode(currentUserService.currentUser().getEmail()));
    }

    @PostMapping("/me/phone/confirm")
    public ResponseEntity<Map<String, Object>> confirmPhone(@Valid @RequestBody VerifyCodeRequest request) {
        return ResponseEntity.ok(authService.confirmPhone(currentUserService.currentUser().getEmail(), request.getCode()));
    }

    @GetMapping("/2fa/setup")
    public ResponseEntity<Map<String, Object>> setupTwoFactor() {
        return ResponseEntity.ok(authService.setupTwoFactor(currentUserService.currentUser().getEmail()));
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<Map<String, Object>> enableTwoFactor(@Valid @RequestBody VerifyCodeRequest request) {
        return ResponseEntity.ok(authService.enableTwoFactor(currentUserService.currentUser().getEmail(), request.getCode()));
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<Map<String, Object>> disableTwoFactor(@Valid @RequestBody VerifyCodeRequest request) {
        return ResponseEntity.ok(authService.disableTwoFactor(currentUserService.currentUser().getEmail(), request.getCode()));
    }
}