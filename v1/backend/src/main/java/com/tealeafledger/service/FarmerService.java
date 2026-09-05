package com.tealeafledger.service;

import com.tealeafledger.entity.Farmer;
import com.tealeafledger.exception.ResourceNotFoundException;
import com.tealeafledger.repository.FarmerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FarmerService {

    private final FarmerRepository farmerRepository;

    public FarmerService(FarmerRepository farmerRepository) {
        this.farmerRepository = farmerRepository;
    }

    public List<Farmer> getAllFarmers() {
        return farmerRepository.findAll();
    }

    public Farmer getFarmerById(Long id) {
        return farmerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer", id));
    }

    public Farmer createFarmer(Farmer farmer) {
        if (farmerRepository.existsByCode(farmer.getCode())) {
            throw new IllegalArgumentException("A farmer with code " + farmer.getCode() + " already exists");
        }
        return farmerRepository.save(farmer);
    }

    public Farmer updateFarmer(Long id, Farmer farmerDetails) {
        Farmer farmer = getFarmerById(id);
        farmer.setName(farmerDetails.getName());
        farmer.setCode(farmerDetails.getCode());
        farmer.setPhone(farmerDetails.getPhone());
        farmer.setDivision(farmerDetails.getDivision());
        farmer.setStatus(farmerDetails.getStatus());
        farmer.setMonthlyLeaf(farmerDetails.getMonthlyLeaf());
        farmer.setAdvanceBalance(farmerDetails.getAdvanceBalance());
        farmer.setLastCollection(farmerDetails.getLastCollection());
        return farmerRepository.save(farmer);
    }

    public void deleteFarmer(Long id) {
        if (!farmerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Farmer", id);
        }
        farmerRepository.deleteById(id);
    }

    public List<Farmer> searchFarmers(String query, String division, String status) {
        List<Farmer> farmers = farmerRepository.findAll();

        return farmers.stream()
                .filter(f -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase();
                        return f.getName().toLowerCase().contains(q)
                                || f.getCode().toLowerCase().contains(q)
                                || (f.getPhone() != null && f.getPhone().toLowerCase().contains(q))
                                || (f.getDivision() != null && f.getDivision().toLowerCase().contains(q));
                    }
                    return true;
                })
                .filter(f -> division == null || division.isBlank() || f.getDivision().equals(division))
                .filter(f -> status == null || status.isBlank() || f.getStatus().name().equalsIgnoreCase(status))
                .collect(Collectors.toList());
    }
}
