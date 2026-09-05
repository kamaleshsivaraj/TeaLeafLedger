package com.tealeafledger.repository;

import com.tealeafledger.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByFarmerId(Long farmerId);
    List<Payment> findByDateBetween(String from, String to);
    List<Payment> findByAdvanceRecoveryTrue();
    List<Payment> findByFarmerIdAndAdvanceRecoveryTrue(Long farmerId);
}
