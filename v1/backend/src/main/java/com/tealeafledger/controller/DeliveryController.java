package com.tealeafledger.controller;

import com.tealeafledger.entity.Delivery;
import com.tealeafledger.service.CurrentUserService;
import com.tealeafledger.service.DeliveryService;
import com.tealeafledger.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final PermissionService permissionService;
    private final CurrentUserService currentUserService;

    public DeliveryController(DeliveryService deliveryService,
                              PermissionService permissionService,
                              CurrentUserService currentUserService) {
        this.deliveryService = deliveryService;
        this.permissionService = permissionService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<Delivery>> getAllDeliveries(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        permissionService.require(currentUserService.currentUser(), "DELIVERIES", "VIEW");
        if (search != null || status != null) {
            return ResponseEntity.ok(deliveryService.searchDeliveries(search, status));
        }
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Delivery> getDeliveryById(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "DELIVERIES", "VIEW");
        return ResponseEntity.ok(deliveryService.getDeliveryById(id));
    }

    @PostMapping
    public ResponseEntity<Delivery> createDelivery(@RequestBody Delivery delivery) {
        permissionService.require(currentUserService.currentUser(), "DELIVERIES", "CREATE");
        return ResponseEntity.ok(deliveryService.createDelivery(delivery));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Delivery> updateDelivery(@PathVariable Long id, @RequestBody Delivery delivery) {
        permissionService.require(currentUserService.currentUser(), "DELIVERIES", "UPDATE");
        return ResponseEntity.ok(deliveryService.updateDelivery(id, delivery));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable Long id) {
        permissionService.require(currentUserService.currentUser(), "DELIVERIES", "DELETE");
        deliveryService.deleteDelivery(id);
        return ResponseEntity.ok().build();
    }
}
