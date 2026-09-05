package com.tealeafledger.controller;

import com.tealeafledger.entity.Advance;
import com.tealeafledger.entity.Payment;
import com.tealeafledger.service.CurrentUserService;
import com.tealeafledger.service.FinanceService;
import com.tealeafledger.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService financeService;
    private final PermissionService permissionService;
    private final CurrentUserService currentUserService;

    public FinanceController(FinanceService financeService,
                             PermissionService permissionService,
                             CurrentUserService currentUserService) {
        this.financeService = financeService;
        this.permissionService = permissionService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "VIEW");
        return ResponseEntity.ok(financeService.getFinanceSummary());
    }

    @GetMapping("/ledger")
    public ResponseEntity<List<Map<String, Object>>> getLedger(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "VIEW");
        return ResponseEntity.ok(financeService.getLedger(type, search));
    }

    @GetMapping("/outstanding/{farmerId}")
    public ResponseEntity<Map<String, Object>> getOutstandingAdvance(@PathVariable Long farmerId) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "VIEW");
        Double outstanding = financeService.getOutstandingAdvance(farmerId);
        return ResponseEntity.ok(Map.of("outstanding", outstanding));
    }

    @GetMapping("/advances")
    public ResponseEntity<List<Advance>> getAllAdvances() {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "VIEW");
        return ResponseEntity.ok(financeService.getAllAdvances());
    }

    @PostMapping("/advances")
    public ResponseEntity<Advance> createAdvance(@RequestBody Advance advance) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "CREATE");
        return ResponseEntity.ok(financeService.createAdvance(advance));
    }

    @PutMapping("/advances/{id}")
    public ResponseEntity<Advance> updateAdvance(@PathVariable Long id, @RequestBody Advance advance) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "UPDATE");
        return ResponseEntity.ok(financeService.updateAdvance(id, advance));
    }

    @DeleteMapping("/advances/{id}")
    public ResponseEntity<Void> deleteAdvance(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "DELETE");
        financeService.deleteAdvance(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getAllPayments() {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "VIEW");
        return ResponseEntity.ok(financeService.getAllPayments());
    }

    @PostMapping("/payments")
    public ResponseEntity<Payment> createPayment(@RequestBody Payment payment) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "CREATE");
        return ResponseEntity.ok(financeService.createPayment(payment));
    }

    @PutMapping("/payments/{id}")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody Payment payment) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "UPDATE");
        return ResponseEntity.ok(financeService.updatePayment(id, payment));
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "FINANCE", "DELETE");
        financeService.deletePayment(id);
        return ResponseEntity.ok().build();
    }
}
