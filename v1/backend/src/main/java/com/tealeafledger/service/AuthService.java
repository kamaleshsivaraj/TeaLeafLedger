package com.tealeafledger.service;

import com.tealeafledger.config.JwtUtil;
import com.tealeafledger.dto.AuthResponse;
import com.tealeafledger.dto.ChangePasswordRequest;
import com.tealeafledger.dto.LoginRequest;
import com.tealeafledger.dto.ResetPasswordRequest;
import com.tealeafledger.dto.SignupRequest;
import com.tealeafledger.dto.UpdateProfileRequest;
import com.tealeafledger.entity.User;
import com.tealeafledger.repository.UserRepository;
import com.tealeafledger.security.TOTPUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       NotificationService notificationService,
                       EmailService emailService,
                       SmsService smsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.smsService = smsService;
    }

    public AuthResponse signup(SignupRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        User user = new User(
                request.getName(),
                email,
                request.getPhone(),
                passwordEncoder.encode(request.getPassword())
        );
        user.setRole(User.Role.OPERATOR);
        user = userRepository.save(user);

        notificationService.createForUser(user.getId(), "Welcome to TeaLeafLedger 🍃",
                "Your account was created successfully. Complete email and phone verification in Account & Security.",
                "SUCCESS");

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            if (request.getCode() == null || request.getCode().isBlank()) {
                AuthResponse pending = new AuthResponse(null, user.getId(), user.getName(),
                        user.getEmail(), user.getRole().name());
                pending.setTwoFactorRequired(true);
                return pending;
            }
            if (!TOTPUtil.verify(user.getTwoFactorSecret(), request.getCode())) {
                throw new IllegalArgumentException("Invalid authentication code");
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public User getProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public AuthResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = getProfile(email);
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        String newEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("An account with this email already exists");
            }
            user.setEmail(newEmail);
            user.setEmailVerified(false);
            user.setEmailConfirmCode(null);
        }
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getId());
        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = getProfile(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        verifyCode(user.getResetPasswordCode(), request.getCode(), "OTP is missing. Request a code first.");
        if (!request.getCode().equals(user.getResetPasswordCode())) {
            throw new IllegalArgumentException("Invalid or expired OTP. Request a new code.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordCode(null);
        userRepository.save(user);
    }

    public Map<String, Object> sendChangePasswordCode(String email) {
        User user = getProfile(email);
        String code = generateCode();
        user.setResetPasswordCode(code);
        userRepository.save(user);
        Map<String, Object> result = new HashMap<>();
        result.put("sent", true);
        if (emailService.isConfigured()) {
            try {
                emailService.sendVerificationCode(user.getEmail(), code, "password change");
            } catch (RuntimeException ex) {
                log.error("Password-change OTP email failed to send to {}", user.getEmail(), ex);
                result.put("sent", false);
                result.put("message", "Email delivery failed. Update GMAIL_USER_PASSWORD in .env with a fresh App Password.");
                result.put("demoCode", code);
            }
        } else {
            result.put("demoCode", code);
        }
        return result;
    }

    public Map<String, Object> sendForgotPasswordEmail(String rawEmail) {
        String email = rawEmail != null ? rawEmail.trim().toLowerCase() : "";
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found for this email"));
        String code = generateCode();
        user.setResetPasswordCode(code);
        userRepository.save(user);
        String resetUrl = "http://localhost:5183/forgot-password";
        Map<String, Object> result = new HashMap<>();
        result.put("sent", true);
        if (emailService.isConfigured()) {
            try {
                emailService.sendPasswordReset(user.getEmail(), code, resetUrl);
            } catch (RuntimeException ex) {
                log.error("Password reset email failed to send to {}", email, ex);
                result.put("sent", false);
                result.put("message", "Email delivery failed. Update GMAIL_USER_PASSWORD in .env with a fresh App Password.");
                result.put("demoCode", code);
            }
        } else {
            result.put("demoCode", code);
        }
        return result;
    }

    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        User user = getProfile(email);
        verifyCode(user.getResetPasswordCode(), request.getCode(), "Invalid or expired reset code. Request a new one.");
        if (!request.getCode().equals(user.getResetPasswordCode())) {
            throw new IllegalArgumentException("Invalid or expired reset code. Request a new one.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordCode(null);
        userRepository.save(user);
        return Map.of("reset", true);
    }

    public Map<String, Object> sendEmailCode(String email) {
        User user = getProfile(email);
        return deliverEmailCode(user, "email address");
    }

    private Map<String, Object> deliverEmailCode(User user, String purpose) {
        String code = generateCode();
        user.setEmailConfirmCode(code);
        userRepository.save(user);
        Map<String, Object> result = new HashMap<>();
        result.put("sent", true);
        if (emailService.isConfigured()) {
            try {
                emailService.sendVerificationCode(user.getEmail(), code, purpose);
            } catch (RuntimeException ex) {
                log.error("Verification email failed to send to {}", user.getEmail(), ex);
                result.put("sent", false);
                result.put("message", "Email delivery failed. Update GMAIL_USER_PASSWORD in .env with a fresh App Password.");
                result.put("demoCode", code);
            }
        } else {
            result.put("demoCode", code);
        }
        return result;
    }

    public Map<String, Object> confirmEmail(String email, String code) {
        User user = getProfile(email);
        if (code == null || !code.equals(user.getEmailConfirmCode())) {
            throw new IllegalArgumentException("Invalid email confirmation code");
        }
        user.setEmailVerified(true);
        user.setEmailConfirmCode(null);
        userRepository.save(user);
        return Map.of("confirmed", true);
    }

    public Map<String, Object> sendPhoneCode(String email) {
        User user = getProfile(email);
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new IllegalArgumentException("Add a phone number to your profile first");
        }
        String code = generateCode();
        user.setPhoneConfirmCode(code);
        userRepository.save(user);
        Map<String, Object> result = new HashMap<>();
        result.put("sent", true);
        if (smsService.isConfigured()) {
            smsService.sendSms(user.getPhone(), code);
        } else {
            result.put("demoCode", code);
            result.put("mode", "manual");
        }
        result.put("provider", smsService.providerName());
        return result;
    }

    public Map<String, Object> confirmPhone(String email, String code) {
        User user = getProfile(email);
        if (code == null || !code.equals(user.getPhoneConfirmCode())) {
            throw new IllegalArgumentException("Invalid phone confirmation code");
        }
        user.setPhoneVerified(true);
        user.setPhoneConfirmCode(null);
        userRepository.save(user);
        return Map.of("confirmed", true);
    }

    public Map<String, Object> setupTwoFactor(String email) {
        User user = getProfile(email);
        String secret = TOTPUtil.generateSecret();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);
        Map<String, Object> result = new HashMap<>();
        result.put("secret", secret);
        result.put("otpauthUrl", TOTPUtil.otpauthUrl(secret, user.getEmail()));
        result.put("issuer", TOTPUtil.issuer());
        return result;
    }

    public Map<String, Object> enableTwoFactor(String email, String code) {
        User user = getProfile(email);
        if (user.getTwoFactorSecret() == null) {
            throw new IllegalArgumentException("Complete the 2FA setup first");
        }
        if (!TOTPUtil.verify(user.getTwoFactorSecret(), code)) {
            throw new IllegalArgumentException("Invalid authentication code");
        }
        user.setTwoFactorEnabled(true);
        userRepository.save(user);
        return Map.of("enabled", true);
    }

    public Map<String, Object> disableTwoFactor(String email, String code) {
        User user = getProfile(email);
        if (user.getTwoFactorSecret() == null || !TOTPUtil.verify(user.getTwoFactorSecret(), code)) {
            throw new IllegalArgumentException("Invalid authentication code");
        }
        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
        return Map.of("disabled", true);
    }

    private String generateCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    private void verifyCode(String stored, String provided, String missingMessage) {
        if (provided == null || provided.isBlank()) {
            throw new IllegalArgumentException(missingMessage);
        }
    }
}