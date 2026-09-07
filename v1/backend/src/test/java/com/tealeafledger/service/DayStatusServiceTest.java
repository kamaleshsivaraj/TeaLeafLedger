package com.tealeafledger.service;

import com.tealeafledger.entity.DayStatus;
import com.tealeafledger.repository.DayStatusRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DayStatusServiceTest {

    @Mock
    private DayStatusRepository repository;

    @InjectMocks
    private DayStatusService service;

    @Test
    void current_returnsNewestRow() {
        LocalDateTime now = LocalDateTime.now();
        DayStatus older = status(DayStatus.Status.OPEN, "manager", now.minusHours(2));
        DayStatus newest = status(DayStatus.Status.CLOSED, "manager", now);
        when(repository.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(newest, older));

        DayStatus current = service.current();

        assertEquals(DayStatus.Status.CLOSED, current.getStatus());
    }

    @Test
    void current_createsOpen_whenNoRowsExist() {
        when(repository.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of());
        when(repository.save(any(DayStatus.class))).thenAnswer(inv -> inv.getArgument(0));

        DayStatus current = service.current();

        assertEquals(DayStatus.Status.OPEN, current.getStatus());
        assertEquals("system", current.getUpdatedBy());
        verify(repository).save(any(DayStatus.class));
    }

    @Test
    void update_setsStatusAndUpdatedBy_onLatestRow() {
        DayStatus latest = status(DayStatus.Status.OPEN, "manager", LocalDateTime.now());
        when(repository.findAllByOrderByUpdatedAtDesc()).thenReturn(List.of(latest));
        when(repository.save(any(DayStatus.class))).thenAnswer(inv -> inv.getArgument(0));

        DayStatus updated = service.update(DayStatus.Status.HALFDAY, "tester");

        assertEquals(DayStatus.Status.HALFDAY, updated.getStatus());
        assertEquals("tester", updated.getUpdatedBy());
        verify(repository).save(latest);
    }

    @Test
    void history_respectsLimit() {
        List<DayStatus> rows = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            rows.add(status(DayStatus.Status.OPEN, "u" + i, LocalDateTime.now().minusMinutes(i)));
        }
        when(repository.findAllByOrderByUpdatedAtDesc()).thenReturn(rows);

        assertEquals(10, service.history(10).size());
        assertEquals(25, service.history(0).size());
        assertEquals(25, service.history(-1).size());
    }

    private DayStatus status(DayStatus.Status s, String by, LocalDateTime at) {
        DayStatus d = new DayStatus();
        d.setStatus(s);
        d.setUpdatedBy(by);
        d.setUpdatedAt(at);
        return d;
    }
}