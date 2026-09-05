package com.tealeafledger.controller;

import com.tealeafledger.entity.Advance;
import com.tealeafledger.entity.Payment;
import com.tealeafledger.service.FinanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(financeService.getFinanceSummary());
    }

    @GetMapping("/ledger")
    public ResponseEntity<List<Map<String, Object>>> getLedger(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(financeService.getLedger(type, search));
    }

    @GetMapping("/outstanding/{farmerId}")
    public ResponseEntity<Map<String, Object>> getOutstandingAdvance(@PathVariable Long farmerId) {
        Double outstanding = financeService.getOutstandingAdvance(farmerId);
        return ResponseEntity.ok(Map.of("outstanding", outstanding));
    }

    @GetMapping("/advances")
    public ResponseEntity<List<Advance>> getAllAdvances() {
        return ResponseEntity.ok(financeService.getAllAdvances());
    }

    @PostMapping("/advances")
    public ResponseEntity<Advance> createAdvance(@RequestBody Advance advance) {
        return ResponseEntity.ok(financeService.createAdvance(advance));
    }

    @PutMapping("/advances/{id}")
    public ResponseEntity<Advance> updateAdvance(@PathVariable Long id, @RequestBody Advance advance) {
        return ResponseEntity.ok(financeService.updateAdvance(id, advance));
    }

    @DeleteMapping("/advances/{id}")
    public ResponseEntity<Void> deleteAdvance(@PathVariable Long id) {
        financeService.deleteAdvance(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(financeService.getAllPayments());
    }

    @PostMapping("/payments")
    public ResponseEntity<Payment> createPayment(@RequestBody Payment payment) {
        return ResponseEntity.ok(financeService.createPayment(payment));
    }

    @PutMapping("/payments/{id}")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody Payment payment) {
        return ResponseEntity.ok(financeService.updatePayment(id, payment));
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        financeService.deletePayment(id);
        return ResponseEntity.ok().build();
    }
}
