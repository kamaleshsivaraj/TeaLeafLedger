package com.tealeafledger.controller;

import com.tealeafledger.entity.Rate;
import com.tealeafledger.service.CurrentUserService;
import com.tealeafledger.service.PermissionService;
import com.tealeafledger.service.RateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rates")
public class RateController {

    private final RateService rateService;
    private final PermissionService permissionService;
    private final CurrentUserService currentUserService;

    public RateController(RateService rateService,
                          PermissionService permissionService,
                          CurrentUserService currentUserService) {
        this.rateService = rateService;
        this.permissionService = permissionService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<Rate>> getAllRates() {
        permissionService.require(currentUserService.currentUser(), "RATES", "VIEW");
        return ResponseEntity.ok(rateService.getAllRates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rate> getRateById(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "RATES", "VIEW");
        return ResponseEntity.ok(rateService.getRateById(id));
    }

    @PostMapping
    public ResponseEntity<Rate> createRate(@RequestBody Rate rate) {
        permissionService.require(currentUserService.currentUser(), "RATES", "CREATE");
        return ResponseEntity.ok(rateService.createRate(rate));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rate> updateRate(@PathVariable Long id, @RequestBody Rate rate) {
        permissionService.require(currentUserService.currentUser(), "RATES", "UPDATE");
        return ResponseEntity.ok(rateService.updateRate(id, rate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRate(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "RATES", "DELETE");
        rateService.deleteRate(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/active/{grade}")
    public ResponseEntity<Double> getActiveRate(@PathVariable String grade) {
        permissionService.require(currentUserService.currentUser(), "RATES", "VIEW");
        return ResponseEntity.ok(rateService.getActiveRateForGrade(grade));
    }
}
