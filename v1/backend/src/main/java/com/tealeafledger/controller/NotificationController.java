package com.tealeafledger.controller;

import com.tealeafledger.entity.Notification;
import com.tealeafledger.entity.User;
import com.tealeafledger.service.CurrentUserService;
import com.tealeafledger.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService,
                                  CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMine() {
        User user = currentUserService.currentUser();
        return ResponseEntity.ok(notificationService.getForUser(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount() {
        User user = currentUserService.currentUser();
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(user.getId())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Long id) {
        User user = currentUserService.currentUser();
        return ResponseEntity.ok(notificationService.markRead(user.getId(), id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead() {
        User user = currentUserService.currentUser();
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(Map.of("readAll", true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.currentUser();
        notificationService.deleteForUser(user.getId(), id);
        return ResponseEntity.ok().build();
    }
}