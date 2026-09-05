package com.tealeafledger.controller;

import com.tealeafledger.entity.DayStatus;
import com.tealeafledger.entity.User;
import com.tealeafledger.service.CurrentUserService;
import com.tealeafledger.service.DayStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings/day-status")
public class DayStatusController {

    private final DayStatusService dayStatusService;
    private final CurrentUserService currentUserService;

    public DayStatusController(DayStatusService dayStatusService, CurrentUserService currentUserService) {
        this.dayStatusService = dayStatusService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<DayStatus> getCurrent() {
        return ResponseEntity.ok(dayStatusService.current());
    }

    @GetMapping("/history")
    public ResponseEntity<List<DayStatus>> getHistory(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(dayStatusService.history(limit));
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody Map<String, String> body) {
        User user = currentUserService.currentUser();
        if (user.getRole() != User.Role.ADMIN && user.getRole() != User.Role.MANAGER) {
            return ResponseEntity.status(403).body(Map.of("error", "Only ADMIN or MANAGER can change the collection day status"));
        }
        String raw = body.get("status");
        DayStatus.Status status;
        try {
            status = DayStatus.Status.valueOf(raw == null ? "" : raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Use OPEN, CLOSED, HALFDAY or WEEKOFF"));
        }
        return ResponseEntity.ok(dayStatusService.update(status, user.getName()));
    }
}