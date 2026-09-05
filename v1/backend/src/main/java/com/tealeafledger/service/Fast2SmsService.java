package com.tealeafledger.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "fast2sms")
public class Fast2SmsService implements SmsService {

    private final String apiKey;
    private final String senderId;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public Fast2SmsService(@Value("${app.sms.api-key:}") String apiKey,
                           @Value("${app.sms.sender-id:TeaLeaf}") String senderId) {
        this.apiKey = apiKey;
        this.senderId = senderId;
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String providerName() {
        return "fast2sms";
    }

    @Override
    public void sendSms(String phone, String message) {
        if (!isConfigured()) {
            throw new IllegalStateException("Fast2SMS is not configured. Set SMS_API_KEY in .env");
        }
        String json = "{\"route\":\"otp\",\"sender_id\":\"" + senderId
                + "\",\"message\":\"Your TeaLeafLedger verification code is {}. Do not share this with anyone.\","
                + "\"variables_values\":\"" + message
                + "\",\"numbers\":\"" + phone + "\"}";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.fast2sms.com/dev/bulkV2"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("Authorization", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("Fast2SMS returned HTTP " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            throw new IllegalStateException("SMS delivery failed: " + e.getMessage(), e);
        }
    }
}