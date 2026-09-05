package com.tealeafledger.repository;

import com.tealeafledger.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    List<Delivery> findByDateBetween(String from, String to);
    List<Delivery> findByStatus(String status);
}
