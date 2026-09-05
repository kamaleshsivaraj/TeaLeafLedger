package com.tealeafledger.controller;

import com.tealeafledger.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/collection")
    public ResponseEntity<Map<String, Object>> getDailyCollectionSummary(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(reportService.getDailyCollectionSummary(from, to));
    }

    @GetMapping("/factory")
    public ResponseEntity<Map<String, Object>> getFactoryReconciliation(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(reportService.getFactoryReconciliation(from, to));
    }

    @GetMapping("/passbook/{farmerId}")
    public ResponseEntity<Map<String, Object>> getSupplierPassbook(@PathVariable Long farmerId) {
        return ResponseEntity.ok(reportService.getSupplierPassbook(farmerId));
    }

    @GetMapping("/payments")
    public ResponseEntity<Map<String, Object>> getWeeklyPaymentSheet(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(reportService.getWeeklyPaymentSheet(from, to));
    }
}
