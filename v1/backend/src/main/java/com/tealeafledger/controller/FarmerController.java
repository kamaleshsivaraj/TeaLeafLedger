package com.tealeafledger.controller;

import com.tealeafledger.entity.Farmer;
import com.tealeafledger.service.CurrentUserService;
import com.tealeafledger.service.FarmerService;
import com.tealeafledger.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmers")
public class FarmerController {

    private final FarmerService farmerService;
    private final PermissionService permissionService;
    private final CurrentUserService currentUserService;

    public FarmerController(FarmerService farmerService,
                            PermissionService permissionService,
                            CurrentUserService currentUserService) {
        this.farmerService = farmerService;
        this.permissionService = permissionService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<Farmer>> getAllFarmers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String division,
            @RequestParam(required = false) String status) {
        permissionService.require(currentUserService.currentUser(), "FARMERS", "VIEW");
        if (search != null || division != null || status != null) {
            return ResponseEntity.ok(farmerService.searchFarmers(search, division, status));
        }
        return ResponseEntity.ok(farmerService.getAllFarmers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Farmer> getFarmerById(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "FARMERS", "VIEW");
        return ResponseEntity.ok(farmerService.getFarmerById(id));
    }

    @PostMapping
    public ResponseEntity<Farmer> createFarmer(@RequestBody Farmer farmer) {
        permissionService.require(currentUserService.currentUser(), "FARMERS", "CREATE");
        return ResponseEntity.ok(farmerService.createFarmer(farmer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Farmer> updateFarmer(@PathVariable Long id, @RequestBody Farmer farmer) {
        permissionService.require(currentUserService.currentUser(), "FARMERS", "UPDATE");
        return ResponseEntity.ok(farmerService.updateFarmer(id, farmer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFarmer(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "FARMERS", "DELETE");
        farmerService.deleteFarmer(id);
        return ResponseEntity.ok().build();
    }
}
