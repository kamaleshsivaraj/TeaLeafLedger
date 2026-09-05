package com.tealeafledger.service;

public interface SmsService {

    boolean isConfigured();

    String providerName();

    void sendSms(String phone, String message);
}