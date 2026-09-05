package com.tealeafledger.repository;

import com.tealeafledger.entity.Advance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AdvanceRepository extends JpaRepository<Advance, Long> {
    List<Advance> findByFarmerId(Long farmerId);
    List<Advance> findByDateBetween(String from, String to);
}
