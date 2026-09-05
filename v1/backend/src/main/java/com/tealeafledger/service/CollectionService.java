package com.tealeafledger.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tealeafledger.entity.Collection;
import com.tealeafledger.entity.Farmer;
import com.tealeafledger.exception.ResourceNotFoundException;
import com.tealeafledger.repository.AdvanceRepository;
import com.tealeafledger.repository.CollectionRepository;
import com.tealeafledger.repository.FarmerRepository;
import com.tealeafledger.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CollectionService {

    private static final double BAG_TARE_WEIGHT = 1.0;
    private static final double DEFAULT_ADVANCE_RECOVERY = 200.0;
    private static final double DEFAULT_BAG_WEIGHT = 1.0;

    private final CollectionRepository collectionRepository;
    private final FarmerRepository farmerRepository;
    private final RateService rateService;
    private final AdvanceRepository advanceRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public CollectionService(CollectionRepository collectionRepository,
                             FarmerRepository farmerRepository,
                             RateService rateService,
                             AdvanceRepository advanceRepository,
                             PaymentRepository paymentRepository,
                             NotificationService notificationService,
                             ObjectMapper objectMapper) {
        this.collectionRepository = collectionRepository;
        this.farmerRepository = farmerRepository;
        this.rateService = rateService;
        this.advanceRepository = advanceRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    public List<Collection> getAllCollections() {
        return collectionRepository.findAll();
    }

    public Collection getCollectionById(Long id) {
        return collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));
    }

    public Collection createCollection(Collection collection) {
        Farmer farmer = farmerRepository.findById(collection.getFarmerId())
                .orElseThrow(() -> new ResourceNotFoundException("Farmer", collection.getFarmerId()));

        Collection saved = computeAndSave(farmer, collection);

        notificationService.notifyAllUsers("Collection recorded",
                saved.getFarmer() + " — " + saved.getWeight() + " kg " + saved.getGrade()
                        + " for " + saved.getAmount(), "INFO");
        return saved;
    }

    public Collection updateCollection(Long id, Collection details) {
        Collection existing = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", id));

        Farmer farmer = farmerRepository.findById(details.getFarmerId())
                .orElseThrow(() -> new ResourceNotFoundException("Farmer", details.getFarmerId()));

        existing.setFarmerId(details.getFarmerId());
        existing.setGrade(details.getGrade());
        existing.setBagCount(details.getBagCount());
        existing.setBagWeights(details.getBagWeights());
        existing.setWaterTare(details.getWaterTare());
        existing.setOtherTare(details.getOtherTare());
        existing.setTax(details.getTax());
        if (details.getDate() != null && !details.getDate().isBlank()) {
            existing.setDate(details.getDate());
        }

        return computeAndSave(farmer, existing);
    }

    public void deleteCollection(Long id) {
        if (!collectionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Collection", id);
        }
        collectionRepository.deleteById(id);
    }

    private Collection computeAndSave(Farmer farmer, Collection collection) {

        collection.setFarmer(farmer.getName());
        collection.setCode(farmer.getCode());

        List<Double> bagWeights = parseBagWeights(collection);
        collection.setBagWeights(toJson(bagWeights));

        Double bagTotal = bagWeights.stream().mapToDouble(Double::doubleValue).sum();
        Integer bagCount = bagWeights.size();
        Double bagTare = bagCount * BAG_TARE_WEIGHT;
        Double waterTare = nullToZero(collection.getWaterTare());
        Double otherTare = nullToZero(collection.getOtherTare());
        Double totalTare = bagTare + waterTare + otherTare;
        Double grossWeight = Math.max(0, bagTotal - totalTare);
        Double netWeight = Math.floor(grossWeight);

        collection.setBagCount(bagCount);
        collection.setBagTotal(bagTotal);
        collection.setBagTare(bagTare);
        collection.setWaterTare(waterTare);
        collection.setOtherTare(otherTare);
        collection.setTotalTare(totalTare);
        collection.setGrossWeight(grossWeight);
        collection.setWeight(netWeight);

        Double rate = rateService.getActiveRateForGrade(collection.getGrade());
        collection.setRate(rate);

        Double grossAmount = netWeight * rate;
        collection.setGrossAmount(grossAmount);

        Double outstanding = getOutstandingAdvance(farmer.getId());
        Double recovery = outstanding > 0 ? Math.min(DEFAULT_ADVANCE_RECOVERY, grossAmount) : 0.0;
        collection.setAdvanceRecovery(recovery);

        Double baseAmount = Math.max(0, grossAmount - recovery);
        collection.setBaseAmount(baseAmount);

        TaxInfo taxInfo = parseTax(collection.getTax(), baseAmount);
        collection.setTax(taxInfo.getJson());
        collection.setAmount(baseAmount + taxInfo.getTotal());

        String today = LocalDate.now().toString();
        if (collection.getDate() == null || collection.getDate().isBlank()) {
            collection.setDate(today);
        }

        farmer.setLastCollection(LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
        farmerRepository.save(farmer);

        return collectionRepository.save(collection);
    }

    public List<Collection> getCollectionsByDateRange(String from, String to) {
        return collectionRepository.findByDateBetween(from, to);
    }

    public List<Collection> getCollectionsByFarmer(Long farmerId) {
        return collectionRepository.findByFarmerId(farmerId);
    }

    private List<Double> parseBagWeights(Collection collection) {
        if (collection.getBagWeights() == null || collection.getBagWeights().isBlank()) {
            List<Double> defaults = new ArrayList<>();
            int count = collection.getBagCount() != null ? collection.getBagCount() : 0;
            for (int i = 0; i < count; i++) {
                defaults.add(DEFAULT_BAG_WEIGHT);
            }
            return defaults;
        }
        try {
            List<Double> weights = objectMapper.readValue(collection.getBagWeights(), new TypeReference<List<Double>>() {});
            return weights != null ? weights : new ArrayList<>();
        } catch (Exception e) {
            List<Double> defaults = new ArrayList<>();
            for (String part : collection.getBagWeights().split(",")) {
                try {
                    defaults.add(Double.parseDouble(part.trim()));
                } catch (NumberFormatException ignored) {
                    defaults.add(DEFAULT_BAG_WEIGHT);
                }
            }
            return defaults;
        }
    }

    private Double getOutstandingAdvance(Long farmerId) {
        Double advances = advanceRepository.findByFarmerId(farmerId).stream()
                .mapToDouble(a -> a.getAmount())
                .sum();
        Double recovered = paymentRepository.findByFarmerIdAndAdvanceRecoveryTrue(farmerId).stream()
                .mapToDouble(p -> p.getRecoveryAmount() != null ? p.getRecoveryAmount() : p.getAmount())
                .sum();
        return Math.max(0, advances - recovered);
    }

    private TaxInfo parseTax(String taxJson, Double baseAmount) {
        String mode = "none";
        double cgst = 0;
        double sgst = 0;
        double igst = 0;
        if (taxJson != null && !taxJson.isBlank()) {
            try {
                Map<String, Object> tax = objectMapper.readValue(taxJson, new TypeReference<Map<String, Object>>() {});
                mode = String.valueOf(tax.getOrDefault("mode", "none"));
                cgst = num(tax.get("cgst"));
                sgst = num(tax.get("sgst"));
                igst = num(tax.get("igst"));
            } catch (Exception ignored) {
            }
        }
        double total = switch (mode) {
            case "inter" -> baseAmount * igst / 100.0;
            case "intra" -> baseAmount * (cgst + sgst) / 100.0;
            default -> 0.0;
        };
        String json = "{\"mode\":\"" + mode + "\",\"cgst\":" + cgst + ",\"sgst\":" + sgst +
                ",\"igst\":" + igst + ",\"total\":" + Math.round(total * 100.0) / 100.0 + "}";
        return new TaxInfo(total, json);
    }

    private Double num(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private Double nullToZero(Double value) {
        return value != null ? value : 0.0;
    }

    private String toJson(List<Double> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            return "[]";
        }
    }

    private static class TaxInfo {
        private final Double total;
        private final String json;

        TaxInfo(Double total, String json) {
            this.total = total;
            this.json = json;
        }

        Double getTotal() { return total; }
        String getJson() { return json; }
    }
}