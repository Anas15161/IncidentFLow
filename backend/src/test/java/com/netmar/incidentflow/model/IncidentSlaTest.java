package com.netmar.incidentflow.model;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

public class IncidentSlaTest {

    @Test
    public void testSlaCalculationForCriticalNetwork() {
        Incident incident = Incident.builder()
                .title("DHCP Down")
                .description("Server down")
                .category("Réseau")
                .priority("Critical")
                .build();

        incident.onCreate(); // Simulation du cycle de vie JPA PrePersist

        assertNotNull(incident.getCreatedAt(), "La date de création ne doit pas être nulle");
        assertNotNull(incident.getSlaDueAt(), "L'échéance SLA ne doit pas être nulle");
        
        // Critical Network SLA est de 2 heures
        long diffHours = java.time.Duration.between(incident.getCreatedAt(), incident.getSlaDueAt()).toHours();
        assertEquals(2, diffHours, "Le SLA critique réseau doit être de 2 heures");
    }

    @Test
    public void testSlaCalculationForCriticalMedical() {
        Incident incident = Incident.builder()
                .title("Urgence Médicale")
                .description("Accident labo")
                .category("Médical")
                .priority("Critical")
                .build();

        incident.onCreate();

        assertNotNull(incident.getSlaDueAt(), "L'échéance SLA ne doit pas être nulle");
        
        // Critical Medical SLA est de 1 heure
        long diffHours = java.time.Duration.between(incident.getCreatedAt(), incident.getSlaDueAt()).toHours();
        assertEquals(1, diffHours, "Le SLA critique médical doit être de 1 heure");
    }

    @Test
    public void testSlaCalculationForHighPriority() {
        Incident incident = Incident.builder()
                .title("Saturation Disque")
                .description("VM critique")
                .category("Système")
                .priority("High")
                .build();

        incident.onCreate();

        assertNotNull(incident.getSlaDueAt(), "L'échéance SLA ne doit pas être nulle");
        
        // High priority SLA est de 12 heures
        long diffHours = java.time.Duration.between(incident.getCreatedAt(), incident.getSlaDueAt()).toHours();
        assertEquals(12, diffHours, "Le SLA de priorité haute doit être de 12 heures");
    }
}
