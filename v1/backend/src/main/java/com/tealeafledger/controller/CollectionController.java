package com.tealeafledger.controller;

import com.tealeafledger.entity.Collection;
import com.tealeafledger.service.CollectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @GetMapping
    public ResponseEntity<List<Collection>> getAllCollections() {
        return ResponseEntity.ok(collectionService.getAllCollections());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Collection> getCollectionById(@PathVariable Long id) {
        return ResponseEntity.ok(collectionService.getCollectionById(id));
    }

    @PostMapping
    public ResponseEntity<Collection> createCollection(@RequestBody Collection collection) {
        return ResponseEntity.ok(collectionService.createCollection(collection));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Collection> updateCollection(@PathVariable Long id, @RequestBody Collection collection) {
        return ResponseEntity.ok(collectionService.updateCollection(id, collection));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/range")
    public ResponseEntity<List<Collection>> getCollectionsByDateRange(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(collectionService.getCollectionsByDateRange(from, to));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<Collection>> getCollectionsByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(collectionService.getCollectionsByFarmer(farmerId));
    }
}
