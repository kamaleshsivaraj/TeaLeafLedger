package com.tealeafledger.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LogSmsService implements SmsService {

    private static final Logger log = LoggerFactory.getLogger(LogSmsService.class);

    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public String providerName() {
        return "in-app-demo";
    }

    @Override
    public void sendSms(String phone, String message) {
        log.info("[DEMO SMS] to {}: {}", phone, message);
    }
}