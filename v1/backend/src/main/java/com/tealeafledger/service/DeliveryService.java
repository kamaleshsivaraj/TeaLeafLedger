package com.tealeafledger.service;

import com.tealeafledger.entity.Delivery;
import com.tealeafledger.exception.ResourceNotFoundException;
import com.tealeafledger.repository.DeliveryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    public DeliveryService(DeliveryRepository deliveryRepository) {
        this.deliveryRepository = deliveryRepository;
    }

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    public Delivery getDeliveryById(Long id) {
        return deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery", id));
    }

    public Delivery createDelivery(Delivery delivery) {
        return deliveryRepository.save(delivery);
    }

    public Delivery updateDelivery(Long id, Delivery deliveryDetails) {
        Delivery delivery = getDeliveryById(id);
        delivery.setNumber(deliveryDetails.getNumber());
        delivery.setFactory(deliveryDetails.getFactory());
        delivery.setDate(deliveryDetails.getDate());
        delivery.setSent(deliveryDetails.getSent());
        delivery.setFactoryWeight(deliveryDetails.getFactoryWeight());
        delivery.setStatus(deliveryDetails.getStatus());
        return deliveryRepository.save(delivery);
    }

    public void deleteDelivery(Long id) {
        if (!deliveryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Delivery", id);
        }
        deliveryRepository.deleteById(id);
    }

    public List<Delivery> searchDeliveries(String query, String status) {
        List<Delivery> deliveries = deliveryRepository.findAll();

        return deliveries.stream()
                .filter(d -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.toLowerCase();
                        return d.getNumber().toLowerCase().contains(q)
                                || d.getFactory().toLowerCase().contains(q)
                                || d.getDate().toLowerCase().contains(q);
                    }
                    return true;
                })
                .filter(d -> status == null || status.isBlank() || d.getStatus().equals(status))
                .toList();
    }
}
