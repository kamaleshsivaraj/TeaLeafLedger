package com.tealeafledger.service;

import com.tealeafledger.entity.Advance;
import com.tealeafledger.entity.Farmer;
import com.tealeafledger.entity.Payment;
import com.tealeafledger.exception.ResourceNotFoundException;
import com.tealeafledger.repository.AdvanceRepository;
import com.tealeafledger.repository.FarmerRepository;
import com.tealeafledger.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class FinanceService {

    private final AdvanceRepository advanceRepository;
    private final PaymentRepository paymentRepository;
    private final FarmerRepository farmerRepository;
    private final NotificationService notificationService;

    public FinanceService(AdvanceRepository advanceRepository,
                          PaymentRepository paymentRepository,
                          FarmerRepository farmerRepository,
                          NotificationService notificationService) {
        this.advanceRepository = advanceRepository;
        this.paymentRepository = paymentRepository;
        this.farmerRepository = farmerRepository;
        this.notificationService = notificationService;
    }

    public List<Advance> getAllAdvances() {
        return advanceRepository.findAll();
    }

    public Advance createAdvance(Advance advance) {
        Farmer farmer = farmerRepository.findById(advance.getFarmerId())
                .orElseThrow(() -> new ResourceNotFoundException("Farmer", advance.getFarmerId()));
        advance.setFarmer(farmer.getName());
        advance.setCode(farmer.getCode());
        if (advance.getDate() == null || advance.getDate().isBlank()) {
            advance.setDate(LocalDate.now().toString());
        }
        Advance saved = advanceRepository.save(advance);
        notificationService.notifyAllUsers("Advance issued",
                farmer.getName() + " received an advance of " + saved.getAmount(), "WARNING");
        return saved;
    }

    public Advance updateAdvance(Long id, Advance details) {
        Advance advance = advanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Advance", id));
        advance.setFarmerId(details.getFarmerId());
        advance.setFarmer(details.getFarmer());
        advance.setCode(details.getCode());
        advance.setDate(details.getDate());
        advance.setAmount(details.getAmount());
        advance.setNotes(details.getNotes());
        return advanceRepository.save(advance);
    }

    public void deleteAdvance(Long id) {
        advanceRepository.deleteById(id);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment createPayment(Payment payment) {
        Farmer farmer = farmerRepository.findById(payment.getFarmerId())
                .orElseThrow(() -> new ResourceNotFoundException("Farmer", payment.getFarmerId()));
        payment.setFarmer(farmer.getName());
        payment.setCode(farmer.getCode());
        if (payment.getDate() == null || payment.getDate().isBlank()) {
            payment.setDate(LocalDate.now().toString());
        }
        Payment saved = paymentRepository.save(payment);
        if (Boolean.TRUE.equals(saved.getAdvanceRecovery())) {
            notificationService.notifyAllUsers("Advance recovered",
                    farmer.getName() + " — " + saved.getRecoveryAmount() + " recovered from leaf settlement",
                    "SUCCESS");
        } else {
            notificationService.notifyAllUsers("Payment made",
                    farmer.getName() + " — " + saved.getAmount() + " paid", "SUCCESS");
        }
        return saved;
    }

    public Payment updatePayment(Long id, Payment details) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", id));
        payment.setFarmerId(details.getFarmerId());
        payment.setFarmer(details.getFarmer());
        payment.setCode(details.getCode());
        payment.setDate(details.getDate());
        payment.setAmount(details.getAmount());
        payment.setNotes(details.getNotes());
        payment.setAdvanceRecovery(details.getAdvanceRecovery());
        payment.setRecoveryAmount(details.getRecoveryAmount());
        return paymentRepository.save(payment);
    }

    public void deletePayment(Long id) {
        paymentRepository.deleteById(id);
    }

    public Double getOutstandingAdvance(Long farmerId) {
        Double advances = advanceRepository.findByFarmerId(farmerId).stream()
                .mapToDouble(a -> a.getAmount())
                .sum();
        Double recovered = paymentRepository.findByFarmerIdAndAdvanceRecoveryTrue(farmerId).stream()
                .mapToDouble(p -> p.getRecoveryAmount() != null ? p.getRecoveryAmount() : p.getAmount())
                .sum();
        return Math.max(0, advances - recovered);
    }

    public Map<String, Object> getFinanceSummary() {
        List<Advance> advances = advanceRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        Double totalAdvances = advances.stream().mapToDouble(a -> a.getAmount()).sum();
        Double totalPayments = payments.stream().mapToDouble(p -> p.getAmount()).sum();

        Double recovered = payments.stream()
                .filter(p -> Boolean.TRUE.equals(p.getAdvanceRecovery()))
                .mapToDouble(p -> p.getRecoveryAmount() != null ? p.getRecoveryAmount() : p.getAmount())
                .sum();

        Double outstanding = Math.max(0, totalAdvances - recovered);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAdvances", totalAdvances);
        summary.put("totalPayments", totalPayments);
        summary.put("recovered", recovered);
        summary.put("outstanding", outstanding);

        return summary;
    }

    public List<Map<String, Object>> getLedger(String type, String query) {
        List<Map<String, Object>> rows = new ArrayList<>();

        if (type == null || type.isBlank() || type.equals("advance")) {
            for (Advance a : advanceRepository.findAll()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", a.getId());
                row.put("type", "advance");
                row.put("label", "Advance");
                row.put("farmer", a.getFarmer());
                row.put("code", a.getCode());
                row.put("date", a.getDate());
                row.put("amount", a.getAmount());
                row.put("balance", a.getAmount());
                rows.add(row);
            }
        }

        if (type == null || type.isBlank() || type.equals("payment")) {
            for (Payment p : paymentRepository.findAll()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", p.getId());
                row.put("type", "payment");
                row.put("label", "Payment");
                row.put("farmer", p.getFarmer());
                row.put("code", p.getCode());
                row.put("date", p.getDate());
                row.put("amount", p.getAmount());
                row.put("balance", 0.0);
                rows.add(row);
            }
        }

        rows.sort((a, b) -> String.valueOf(b.get("date")).compareTo(String.valueOf(a.get("date"))));

        if (query != null && !query.isBlank()) {
            String q = query.toLowerCase();
            rows = rows.stream()
                    .filter(r -> {
                        String haystack = String.join(" ",
                                String.valueOf(r.getOrDefault("farmer", "")),
                                String.valueOf(r.getOrDefault("code", "")),
                                String.valueOf(r.getOrDefault("type", "")));
                        return haystack.toLowerCase().contains(q);
                    })
                    .toList();
        }

        return rows;
    }
}
