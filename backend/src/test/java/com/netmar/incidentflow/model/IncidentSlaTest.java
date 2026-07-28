package com.netmar.incidentflow.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

public class IncidentSlaTest {

    @Test
    public void testSlaCalculationForCritique() {
        Incident incident = Incident.builder()
                .title("DHCP Down")
                .description("Server down")
                .category("Réseau")
                .priority("High")
                .severity("Critique")
                .build();

        incident.onCreate(); // Simulation du cycle de vie JPA PrePersist

        assertNotNull(incident.getCreatedAt(), "La date de création ne doit pas être nulle");
        assertNotNull(incident.getSlaDueAt(), "L'échéance SLA ne doit pas être nulle");
        assertEquals("Critique", incident.getSeverity(), "La sévérité doit être enregistrée");
        
        // Sévérité Critique SLA est de < 4 heures (indépendant de la priorité High)
        long diffHours = java.time.Duration.between(incident.getCreatedAt(), incident.getSlaDueAt()).toHours();
        assertEquals(4, diffHours, "Le SLA sévérité critique doit être de 4 heures");
    }

    @Test
    public void testSlaCalculationForImportant() {
        Incident incident = Incident.builder()
                .title("Saturation Disque")
                .description("VM critique")
                .category("Système")
                .priority("Critical")
                .severity("Important")
                .build();

        incident.onCreate();

        assertNotNull(incident.getSlaDueAt(), "L'échéance SLA ne doit pas être nulle");
        
        // Sévérité Important SLA est de < 24 heures
        long diffHours = java.time.Duration.between(incident.getCreatedAt(), incident.getSlaDueAt()).toHours();
        assertEquals(24, diffHours, "Le SLA sévérité important doit être de 24 heures");
    }

    @Test
    public void testSlaCalculationForMineur() {
        Incident incident = Incident.builder()
                .title("Demande d'accès")
                .description("Accès imprimante")
                .category("Support")
                .priority("Low")
                .severity("Mineur")
                .build();

        incident.onCreate();

        assertNotNull(incident.getSlaDueAt(), "L'échéance SLA ne doit pas être nulle");
        
        // Sévérité Mineur SLA est de < 3 jours (72 heures)
        long diffHours = java.time.Duration.between(incident.getCreatedAt(), incident.getSlaDueAt()).toHours();
        assertEquals(72, diffHours, "Le SLA sévérité mineur doit être de 72 heures (3 jours)");
    }
}
