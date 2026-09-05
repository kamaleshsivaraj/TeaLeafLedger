package com.tealeafledger.repository;

import com.tealeafledger.entity.DayStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DayStatusRepository extends JpaRepository<DayStatus, Long> {
    List<DayStatus> findAllByOrderByUpdatedAtDesc();
}
