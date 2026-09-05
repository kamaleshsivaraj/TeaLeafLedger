package com.tealeafledger.repository;

import com.tealeafledger.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByFarmerId(Long farmerId);
    List<Collection> findByDateBetween(String from, String to);
    List<Collection> findByFarmerIdAndDateBetween(Long farmerId, String from, String to);
}
