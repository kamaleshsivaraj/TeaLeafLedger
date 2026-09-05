package com.tealeafledger.config;

import com.tealeafledger.entity.Farmer;
import com.tealeafledger.entity.Rate;
import com.tealeafledger.repository.FarmerRepository;
import com.tealeafledger.repository.RateRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class MongoSeeder implements CommandLineRunner {

    private final MongoTemplate mongoTemplate;
    private final RateRepository rateRepository;
    private final FarmerRepository farmerRepository;

    public MongoSeeder(MongoTemplate mongoTemplate,
                       RateRepository rateRepository,
                       FarmerRepository farmerRepository) {
        this.mongoTemplate = mongoTemplate;
        this.rateRepository = rateRepository;
        this.farmerRepository = farmerRepository;
    }

    @Override
    public void run(String... args) {
        seedRatesFromMongo();
        seedFarmersFromMongo();
    }

    private void seedRatesFromMongo() {
        if (rateRepository.count() > 0) return;

        try {
            List<Map> seedRates = mongoTemplate.findAll(Map.class, "seed_rates");
            for (Map seed : seedRates) {
                Rate rate = new Rate();
                rate.setGrade((String) seed.get("grade"));
                rate.setAmount(seed.get("amount") != null ? ((Number) seed.get("amount")).doubleValue() : 0.0);
                rate.setEffective((String) seed.get("effective"));
                rate.setActive(seed.get("active") != null ? (Boolean) seed.get("active") : true);
                rateRepository.save(rate);
            }
            if (!seedRates.isEmpty()) {
                System.out.println("Seeded " + seedRates.size() + " rates from MongoDB");
            }
        } catch (Exception e) {
            System.out.println("MongoDB seed_rates not available, using defaults: " + e.getMessage());
            seedDefaultRates();
        }
    }

    private void seedDefaultRates() {
        rateRepository.save(new Rate("Standard green leaf", 119.0, "2026-08-20", true));
        rateRepository.save(new Rate("Premium green leaf", 125.0, "2026-08-20", true));
        rateRepository.save(new Rate("Rejected leaf", 0.0, "2026-08-20", true));
    }

    private void seedFarmersFromMongo() {
        if (farmerRepository.count() > 0) return;

        try {
            List<Map> seedFarmers = mongoTemplate.findAll(Map.class, "seed_farmers");
            for (Map seed : seedFarmers) {
                Farmer farmer = new Farmer();
                farmer.setName((String) seed.get("name"));
                farmer.setCode((String) seed.get("code"));
                farmer.setPhone((String) seed.get("phone"));
                farmer.setDivision((String) seed.get("division"));
                farmer.setStatus(Farmer.Status.ACTIVE);
                farmer.setMonthlyLeaf(seed.get("monthlyLeaf") != null ? ((Number) seed.get("monthlyLeaf")).doubleValue() : 0.0);
                farmer.setAdvanceBalance(seed.get("advanceBalance") != null ? ((Number) seed.get("advanceBalance")).doubleValue() : 0.0);
                farmer.setLastCollection((String) seed.getOrDefault("lastCollection", "No collection yet"));
                farmerRepository.save(farmer);
            }
            if (!seedFarmers.isEmpty()) {
                System.out.println("Seeded " + seedFarmers.size() + " farmers from MongoDB");
            }
        } catch (Exception e) {
            System.out.println("MongoDB seed_farmers not available: " + e.getMessage());
        }
    }
}
