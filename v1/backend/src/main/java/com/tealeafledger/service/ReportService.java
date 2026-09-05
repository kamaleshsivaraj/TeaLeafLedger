package com.tealeafledger.service;

import com.tealeafledger.entity.Advance;
import com.tealeafledger.entity.Collection;
import com.tealeafledger.entity.Delivery;
import com.tealeafledger.entity.Farmer;
import com.tealeafledger.entity.Payment;
import com.tealeafledger.repository.AdvanceRepository;
import com.tealeafledger.repository.CollectionRepository;
import com.tealeafledger.repository.DeliveryRepository;
import com.tealeafledger.repository.FarmerRepository;
import com.tealeafledger.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final CollectionRepository collectionRepository;
    private final DeliveryRepository deliveryRepository;
    private final AdvanceRepository advanceRepository;
    private final PaymentRepository paymentRepository;
    private final FarmerRepository farmerRepository;

    public ReportService(CollectionRepository collectionRepository,
                         DeliveryRepository deliveryRepository,
                         AdvanceRepository advanceRepository,
                         PaymentRepository paymentRepository,
                         FarmerRepository farmerRepository) {
        this.collectionRepository = collectionRepository;
        this.deliveryRepository = deliveryRepository;
        this.advanceRepository = advanceRepository;
        this.paymentRepository = paymentRepository;
        this.farmerRepository = farmerRepository;
    }

    public Map<String, Object> getDailyCollectionSummary(String from, String to) {
        List<Collection> collections = collectionRepository.findByDateBetween(from, to);

        Double totalKg = collections.stream().mapToDouble(c -> c.getWeight() != null ? c.getWeight() : 0).sum();
        Double totalAmount = collections.stream().mapToDouble(c -> c.getAmount() != null ? c.getAmount() : 0).sum();
        Set<Long> uniqueFarmers = collections.stream()
                .map(c -> c.getFarmerId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "Daily collection summary");
        result.put("period", from + " → " + to);
        result.put("totalCollections", collections.size());
        result.put("totalWeight", totalKg);
        result.put("totalAmount", totalAmount);
        result.put("uniqueSuppliers", uniqueFarmers.size());
        result.put("collections", collections.stream().map(c -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", c.getDate());
            row.put("farmer", c.getFarmer());
            row.put("grade", c.getGrade());
            row.put("weight", c.getWeight());
            row.put("amount", c.getAmount());
            return row;
        }).collect(Collectors.toList()));

        return result;
    }

    public Map<String, Object> getFactoryReconciliation(String from, String to) {
        List<Delivery> deliveries = deliveryRepository.findByDateBetween(from, to);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "Factory reconciliation");
        result.put("period", from + " → " + to);
        result.put("totalDeliveries", deliveries.size());
        result.put("deliveries", deliveries.stream().map(d -> {
            Double variance = (d.getFactoryWeight() != null ? d.getFactoryWeight() : 0) - (d.getSent() != null ? d.getSent() : 0);
            Double variancePct = d.getSent() != null && d.getSent() > 0 ? Math.abs(variance / d.getSent() * 100) : 0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("number", d.getNumber());
            row.put("factory", d.getFactory());
            row.put("sent", d.getSent());
            row.put("factoryWeight", d.getFactoryWeight());
            row.put("variance", variance);
            row.put("variancePct", variancePct);
            row.put("status", d.getStatus());
            return row;
        }).collect(Collectors.toList()));

        return result;
    }

    public Map<String, Object> getSupplierPassbook(Long farmerId) {
        Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
        if (farmer == null) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("error", "Farmer not found");
            return result;
        }

        List<Collection> collections = collectionRepository.findByFarmerId(farmerId);
        List<Advance> advances = advanceRepository.findByFarmerId(farmerId);
        List<Payment> payments = paymentRepository.findByFarmerId(farmerId);

        Double earned = collections.stream().mapToDouble(c -> c.getAmount() != null ? c.getAmount() : 0).sum();
        Double advTotal = advances.stream().mapToDouble(a -> a.getAmount()).sum();
        Double paid = payments.stream().mapToDouble(p -> p.getAmount()).sum();

        List<Map<String, Object>> transactions = new ArrayList<>();

        collections.forEach(c -> {
            Map<String, Object> tx = new LinkedHashMap<>();
            tx.put("date", c.getDate());
            tx.put("type", "Collection");
            tx.put("amount", c.getAmount());
            transactions.add(tx);
        });

        advances.forEach(a -> {
            Map<String, Object> tx = new LinkedHashMap<>();
            tx.put("date", a.getDate());
            tx.put("type", "Advance");
            tx.put("amount", a.getAmount());
            transactions.add(tx);
        });

        payments.forEach(p -> {
            Map<String, Object> tx = new LinkedHashMap<>();
            tx.put("date", p.getDate());
            tx.put("type", "Payment");
            tx.put("amount", p.getAmount());
            transactions.add(tx);
        });

        transactions.sort((a, b) -> String.valueOf(b.get("date")).compareTo(String.valueOf(a.get("date"))));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "Supplier passbook");
        result.put("farmer", farmer.getName());
        result.put("code", farmer.getCode());
        result.put("earned", earned);
        result.put("advances", advTotal);
        result.put("payments", paid);
        result.put("balance", earned - advTotal - paid);
        result.put("transactions", transactions);

        return result;
    }

    public Map<String, Object> getWeeklyPaymentSheet(String from, String to) {
        List<Collection> collections = collectionRepository.findByDateBetween(from, to);
        List<Payment> payments = paymentRepository.findByDateBetween(from, to);

        Map<String, Double> dueMap = new LinkedHashMap<>();

        collections.forEach(c -> {
            String key = String.valueOf(c.getFarmerId());
            dueMap.merge(key, c.getAmount() != null ? c.getAmount() : 0.0, Double::sum);
        });

        payments.forEach(p -> {
            String key = String.valueOf(p.getFarmerId());
            if (dueMap.containsKey(key)) {
                dueMap.merge(key, -p.getAmount(), Double::sum);
            }
        });

        List<Map<String, Object>> rows = dueMap.entrySet().stream()
                .filter(e -> e.getValue() > 0.009)
                .map(e -> {
                    Long farmerId = Long.parseLong(e.getKey());
                    Farmer farmer = farmerRepository.findById(farmerId).orElse(null);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("farmerId", farmerId);
                    row.put("farmer", farmer != null ? farmer.getName() : "Unknown");
                    row.put("code", farmer != null ? farmer.getCode() : "");
                    row.put("due", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());

        Double totalDue = rows.stream().mapToDouble(r -> (Double) r.get("due")).sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", "Weekly payment sheet");
        result.put("period", from + " → " + to);
        result.put("totalDue", totalDue);
        result.put("supplierCount", rows.size());
        result.put("rows", rows);

        return result;
    }
}
