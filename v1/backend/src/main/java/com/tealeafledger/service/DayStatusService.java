package com.tealeafledger.service;

import com.tealeafledger.entity.DayStatus;
import com.tealeafledger.repository.DayStatusRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DayStatusService {

    private final DayStatusRepository repository;

    public DayStatusService(DayStatusRepository repository) {
        this.repository = repository;
    }

    public DayStatus current() {
        return repository.findAllByOrderByUpdatedAtDesc().stream().findFirst().orElseGet(() -> {
            DayStatus initial = new DayStatus();
            initial.setStatus(DayStatus.Status.OPEN);
            initial.setUpdatedBy("system");
            return repository.save(initial);
        });
    }

    public List<DayStatus> history(int limit) {
        List<DayStatus> all = repository.findAllByOrderByUpdatedAtDesc();
        return limit > 0 && all.size() > limit ? all.subList(0, limit) : all;
    }

    public DayStatus update(DayStatus.Status status, String updatedBy) {
        DayStatus current = current();
        current.setStatus(status);
        current.setUpdatedBy(updatedBy);
        return repository.save(current);
    }
}