package com.tealeafledger.repository;

import com.tealeafledger.entity.Rate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RateRepository extends JpaRepository<Rate, Long> {
    List<Rate> findByGradeAndActiveTrue(String grade);
    List<Rate> findByActiveTrue();
}
