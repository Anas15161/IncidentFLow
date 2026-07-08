package com.netmar.incidentflow.service;

import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.IncidentRepository;
import com.netmar.incidentflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class EscalationServiceTest {

    private IncidentRepository incidentRepository;
    private UserRepository userRepository;
    private EscalationService escalationService;

    @BeforeEach
    public void setUp() {
        incidentRepository = mock(IncidentRepository.class);
        userRepository = mock(UserRepository.class);
        escalationService = new EscalationService(incidentRepository, userRepository);
    }

    @Test
    public void testEscalationTriggeredForOverdueIncident() {
        // Given a manager user
        Role managerRole = Role.builder().name("Responsable").build();
        User manager = User.builder().name("Sophie Manager").email("sophie@netmar.com").role(managerRole).build();
        
        // Given an overdue incident
        Incident incident = Incident.builder()
                .incidentCode("INC-2026-999")
                .title("DHCP down")
                .status("Nouveau")
                .priority("High")
                .slaDueAt(LocalDateTime.now().minusMinutes(10)) // Overdue by 10 minutes
                .escalated(false)
                .history(new ArrayList<>())
                .comments(new ArrayList<>())
                .build();

        when(userRepository.findAll()).thenReturn(List.of(manager));
        when(incidentRepository.findAll()).thenReturn(List.of(incident));

        // When we run the escalation check
        escalationService.runAutomaticEscalation();

        // Then the incident should be escalated
        assertTrue(incident.isEscalated(), "L'incident doit être marqué comme escaladé");
        assertEquals("Critical", incident.getPriority(), "La priorité doit être rehaussée à Critical");
        assertEquals(manager, incident.getAssignedTo(), "L'incident doit être réassigné au manager");
        
        // A comment and history entry should have been created
        assertFalse(incident.getComments().isEmpty(), "Un commentaire d'alerte automatique doit être créé");
        assertFalse(incident.getHistory().isEmpty(), "Une entrée d'historique d'escalade doit être créée");

        // Verify save was called
        verify(incidentRepository, times(1)).save(incident);
    }

    @Test
    public void testNoEscalationIfAlreadyResolved() {
        Role managerRole = Role.builder().name("Responsable").build();
        User manager = User.builder().name("Sophie Manager").role(managerRole).build();

        // Given a resolved incident (even if overdue, it shouldn't escalate since it is solved)
        Incident incident = Incident.builder()
                .incidentCode("INC-2026-888")
                .status("Résolu")
                .priority("High")
                .slaDueAt(LocalDateTime.now().minusMinutes(10))
                .escalated(false)
                .build();

        when(userRepository.findAll()).thenReturn(List.of(manager));
        when(incidentRepository.findAll()).thenReturn(List.of(incident));

        escalationService.runAutomaticEscalation();

        assertFalse(incident.isEscalated(), "Un incident résolu ne doit pas être escaladé");
        verify(incidentRepository, never()).save(any(Incident.class));
    }
}
