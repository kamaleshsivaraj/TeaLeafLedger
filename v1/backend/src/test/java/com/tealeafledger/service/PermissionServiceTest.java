package com.tealeafledger.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tealeafledger.entity.RolePermission;
import com.tealeafledger.entity.User;
import com.tealeafledger.exception.ForbiddenException;
import com.tealeafledger.repository.RolePermissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private RolePermissionRepository repository;

    private ObjectMapper objectMapper;
    private PermissionService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new PermissionService(repository, objectMapper);
    }

    @Test
    void adminUser_hasEveryPermission() {
        User admin = new User();
        admin.setRole(User.Role.ADMIN);

        assertTrue(service.has(admin, "FARMERS", "DELETE"));
        assertTrue(service.has(admin, "USERS", "CREATE"));
        assertTrue(service.has(admin, "FINANCE", "PRINT"));
    }

    @Test
    void permissionsOf_nullUser_returnsEmpty() {
        assertEquals(Map.of(), service.permissionsOf(null));
    }

    @Test
    void operator_defaults_limitFinance() {
        User operator = new User();
        operator.setRole(User.Role.OPERATOR);

        assertTrue(service.has(operator, "FARMERS", "CREATE"));
        assertFalse(service.has(operator, "FARMERS", "UPDATE"));
        assertFalse(service.has(operator, "FINANCE", "VIEW"));
    }

    @Test
    void require_throwsForbidden_whenPermissionMissing() {
        User accountant = new User();
        accountant.setRole(User.Role.ACCOUNTANT);

        assertThrows(ForbiddenException.class, () -> service.require(accountant, "DELIVERIES", "CREATE"));
    }

    @Test
    void readMatrix_usesStoredJson_whenPresent() {
        RolePermission rp = new RolePermission();
        rp.setRole(User.Role.MANAGER);
        rp.setPermissionsJson("{\"FINANCE\":[\"VIEW\",\"DELETE\"],\"BOGUS\":[\"CREATE\"]}");
        when(repository.findByRole(User.Role.MANAGER)).thenReturn(Optional.of(rp));

        Map<String, Set<String>> matrix = service.getMatrix(User.Role.MANAGER);

        assertTrue(matrix.get("FINANCE").contains("DELETE"));
        assertFalse(matrix.get("FINANCE").contains("CREATE"));
        assertFalse(matrix.containsKey("BOGUS"));
    }

    @Test
    void saveMatrix_persistsCleanedJson() {
        Map<String, Set<String>> matrix = Map.of(
                "DELIVERIES", Set.of("VIEW", "CREATE", "HACK"),
                "FARMERS", Set.of("view")
        );

        service.saveMatrix(User.Role.MANAGER, matrix);

        verify(repository).save(any(RolePermission.class));
        verify(repository).findByRole(User.Role.MANAGER);
    }

    @Test
    void saveMatrix_rejectsAdminRole() {
        assertThrows(IllegalArgumentException.class,
                () -> service.saveMatrix(User.Role.ADMIN, Map.of()));
    }

    @Test
    void saveMatrix_rejectsNullRole() {
        assertThrows(IllegalArgumentException.class,
                () -> service.saveMatrix(null, Map.of()));
    }

    @Test
    void getMatrix_admin_isFullAccess() {
        Map<String, Set<String>> matrix = service.getMatrix(User.Role.ADMIN);

        assertEquals(5, matrix.get("FARMERS").size());
        assertTrue(matrix.get("USERS").containsAll(Set.of("VIEW", "CREATE", "UPDATE", "DELETE", "PRINT")));
    }
}