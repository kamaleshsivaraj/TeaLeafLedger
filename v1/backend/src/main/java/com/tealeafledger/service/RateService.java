package com.tealeafledger.service;

import com.tealeafledger.entity.Rate;
import com.tealeafledger.exception.ResourceNotFoundException;
import com.tealeafledger.repository.RateRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RateService {

    private final RateRepository rateRepository;

    public RateService(RateRepository rateRepository) {
        this.rateRepository = rateRepository;
    }

    public List<Rate> getAllRates() {
        return rateRepository.findAll();
    }

    public Rate getRateById(Long id) {
        return rateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rate", id));
    }

    public Rate createRate(Rate rate) {
        return rateRepository.save(rate);
    }

    public Rate updateRate(Long id, Rate rateDetails) {
        Rate rate = getRateById(id);
        rate.setGrade(rateDetails.getGrade());
        rate.setAmount(rateDetails.getAmount());
        rate.setEffective(rateDetails.getEffective());
        rate.setActive(rateDetails.getActive());
        return rateRepository.save(rate);
    }

    public void deleteRate(Long id) {
        if (!rateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Rate", id);
        }
        rateRepository.deleteById(id);
    }

    public Double getActiveRateForGrade(String grade) {
        String today = LocalDate.now().toString();

        List<Rate> activeRates = rateRepository.findByGradeAndActiveTrue(grade);

        return activeRates.stream()
                .filter(rate -> rate.getEffective() != null && rate.getEffective().compareTo(today) <= 0)
                .max((a, b) -> b.getEffective().compareTo(a.getEffective()))
                .map(Rate::getAmount)
                .orElse(0.0);
    }
}
