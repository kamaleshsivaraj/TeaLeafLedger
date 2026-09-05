package com.tealeafledger.dto;

public class UpdateUserRequest {

    private String name;
    private String phone;
    private String role;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private String password;

    public UpdateUserRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
    public Boolean getPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}