package com.tealeafledger.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyCodeRequest {

    @NotBlank
    private String code;

    public VerifyCodeRequest() {}

    public VerifyCodeRequest(String code) {
        this.code = code;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}