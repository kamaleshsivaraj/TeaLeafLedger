package com.tealeafledger.repository;

import com.tealeafledger.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    Optional<Farmer> findByCode(String code);
    Boolean existsByCode(String code);
    List<Farmer> findByDivision(String division);
    List<Farmer> findByStatus(Farmer.Status status);
}
