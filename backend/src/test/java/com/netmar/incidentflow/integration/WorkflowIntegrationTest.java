package com.netmar.incidentflow.integration;

import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.WorkflowRepository;
import com.netmar.incidentflow.service.WorkflowService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class WorkflowIntegrationTest {

    public static PostgreSQLContainer<?> postgres;

    @BeforeAll
    public static void setUpDockerCheck() {
        try {
            postgres = new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("IncidentFlow_db_test")
                    .withUsername("IncidentFlow_user")
                    .withPassword("password");
            postgres.start();
        } catch (Exception e) {
            Assumptions.assumeTrue(false, "Docker n'est pas disponible ou Testcontainers ne peut pas s'y connecter. Test ignoré.");
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgres != null && postgres.isRunning()) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl);
            registry.add("spring.datasource.username", postgres::getUsername);
            registry.add("spring.datasource.password", postgres::getPassword);
        }
    }

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Test
    public void testCreateAndSaveWorkflowInRealDatabase() {
        // Given
        Workflow workflow = new Workflow();
        workflow.setName("Integration Network Process");
        workflow.setCategory("Réseau");
        workflow.setVersion(1);
        workflow.setActive(true);

        List<WorkflowState> states = new ArrayList<>();
        states.add(WorkflowState.builder().name("Nouveau").label("Nouveau").active(true).workflow(workflow).build());
        states.add(WorkflowState.builder().name("En Cours").label("En Cours").active(true).workflow(workflow).build());
        states.add(WorkflowState.builder().name("Clôturé").label("Clôturé").active(true).workflow(workflow).build());
        workflow.setStates(states);

        List<WorkflowTransition> transitions = new ArrayList<>();
        transitions.add(WorkflowTransition.builder().fromState("Nouveau").toState("En Cours").workflow(workflow).build());
        transitions.add(WorkflowTransition.builder().fromState("En Cours").toState("Clôturé").workflow(workflow).build());
        workflow.setTransitions(transitions);

        // When
        Workflow saved = workflowService.saveWorkflow(workflow);

        // Then
        assertNotNull(saved.getId(), "Le workflow doit être persisté avec un ID");
        assertEquals("Réseau", saved.getCategory());
        assertEquals(3, saved.getStates().size());
        assertEquals(2, saved.getTransitions().size());
        assertTrue(saved.isActive());
    }
}
