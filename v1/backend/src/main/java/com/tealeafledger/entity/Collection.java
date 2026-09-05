package com.tealeafledger.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "collections")
public class Collection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long farmerId;

    private String farmer;

    private String code;

    @Column(nullable = false)
    private String grade;

    @Column(nullable = false)
    private Double weight;

    private Integer bagCount = 0;

    @Column(columnDefinition = "TEXT")
    private String bagWeights;

    private Double bagTotal = 0.0;

    private Double bagTare = 0.0;

    private Double waterTare = 0.0;

    private Double otherTare = 0.0;

    private Double totalTare = 0.0;

    private Double grossWeight = 0.0;

    private Double rate = 0.0;

    private Double grossAmount = 0.0;

    private Double advanceRecovery = 0.0;

    private Double baseAmount = 0.0;

    @Column(columnDefinition = "TEXT")
    private String tax;

    private Double amount = 0.0;

    @Column(nullable = false)
    private String date;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Collection() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
    public String getFarmer() { return farmer; }
    public void setFarmer(String farmer) { this.farmer = farmer; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    public Integer getBagCount() { return bagCount; }
    public void setBagCount(Integer bagCount) { this.bagCount = bagCount; }
    public String getBagWeights() { return bagWeights; }
    public void setBagWeights(String bagWeights) { this.bagWeights = bagWeights; }
    public Double getBagTotal() { return bagTotal; }
    public void setBagTotal(Double bagTotal) { this.bagTotal = bagTotal; }
    public Double getBagTare() { return bagTare; }
    public void setBagTare(Double bagTare) { this.bagTare = bagTare; }
    public Double getWaterTare() { return waterTare; }
    public void setWaterTare(Double waterTare) { this.waterTare = waterTare; }
    public Double getOtherTare() { return otherTare; }
    public void setOtherTare(Double otherTare) { this.otherTare = otherTare; }
    public Double getTotalTare() { return totalTare; }
    public void setTotalTare(Double totalTare) { this.totalTare = totalTare; }
    public Double getGrossWeight() { return grossWeight; }
    public void setGrossWeight(Double grossWeight) { this.grossWeight = grossWeight; }
    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }
    public Double getGrossAmount() { return grossAmount; }
    public void setGrossAmount(Double grossAmount) { this.grossAmount = grossAmount; }
    public Double getAdvanceRecovery() { return advanceRecovery; }
    public void setAdvanceRecovery(Double advanceRecovery) { this.advanceRecovery = advanceRecovery; }
    public Double getBaseAmount() { return baseAmount; }
    public void setBaseAmount(Double baseAmount) { this.baseAmount = baseAmount; }
    public String getTax() { return tax; }
    public void setTax(String tax) { this.tax = tax; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
