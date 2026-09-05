package com.tealeafledger.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "farmers")
public class Farmer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    private String phone;

    private String division;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    private Double monthlyLeaf = 0.0;

    private Double advanceBalance = 0.0;

    private String lastCollection;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum Status {
        ACTIVE, INACTIVE
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Farmer() {}

    public Farmer(String name, String code, String phone, String division) {
        this.name = name;
        this.code = code;
        this.phone = phone;
        this.division = division;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Double getMonthlyLeaf() { return monthlyLeaf; }
    public void setMonthlyLeaf(Double monthlyLeaf) { this.monthlyLeaf = monthlyLeaf; }
    public Double getAdvanceBalance() { return advanceBalance; }
    public void setAdvanceBalance(Double advanceBalance) { this.advanceBalance = advanceBalance; }
    public String getLastCollection() { return lastCollection; }
    public void setLastCollection(String lastCollection) { this.lastCollection = lastCollection; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
