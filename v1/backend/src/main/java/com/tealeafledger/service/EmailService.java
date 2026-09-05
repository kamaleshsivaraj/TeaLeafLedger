package com.tealeafledger.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.support-email:}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean isConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }

    public void sendVerificationCode(String to, String code, String purpose) {
        String subject = "Your " + purpose + " verification code — TeaLeafLedger";
        String body = """
                Hello,

                Your TeaLeafLedger %s verification code is:

                    %s

                Enter this code to complete the action. It expires after 10 minutes.
                If you did not request this, you can safely ignore this email.

                — TeaLeafLedger Collection Centre
                """.formatted(purpose, code);
        send(to, subject, body);
    }

    public void sendPasswordReset(String to, String code, String resetUrl) {
        String subject = "Reset your password — TeaLeafLedger";
        String body = """
                Hello,

                We received a request to reset your TeaLeafLedger password.

                Your reset code is:

                    %s

                Enter this code along with your new password at:
                %s

                If you did not request this, you can safely ignore this email.

                — TeaLeafLedger Collection Centre
                """.formatted(code, resetUrl);
        send(to, subject, body);
    }

    private void send(String to, String subject, String body) {
        if (!isConfigured()) {
            throw new IllegalStateException("Email is not configured. Set GMAIL_USER_MAIL / GMAIL_USER_PASSWORD in .env");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail != null && !fromEmail.isBlank() ? fromEmail : mailUsername);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}