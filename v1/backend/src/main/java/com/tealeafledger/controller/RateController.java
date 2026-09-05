package com.tealeafledger.controller;

import com.tealeafledger.entity.Rate;
import com.tealeafledger.service.RateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rates")
public class RateController {

    private final RateService rateService;

    public RateController(RateService rateService) {
        this.rateService = rateService;
    }

    @GetMapping
    public ResponseEntity<List<Rate>> getAllRates() {
        return ResponseEntity.ok(rateService.getAllRates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rate> getRateById(@PathVariable Long id) {
        return ResponseEntity.ok(rateService.getRateById(id));
    }

    @PostMapping
    public ResponseEntity<Rate> createRate(@RequestBody Rate rate) {
        return ResponseEntity.ok(rateService.createRate(rate));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rate> updateRate(@PathVariable Long id, @RequestBody Rate rate) {
        return ResponseEntity.ok(rateService.updateRate(id, rate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRate(@PathVariable Long id) {
        rateService.deleteRate(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/active/{grade}")
    public ResponseEntity<Double> getActiveRate(@PathVariable String grade) {
        return ResponseEntity.ok(rateService.getActiveRateForGrade(grade));
    }
}
