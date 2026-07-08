package com.netmar.incidentflow.service;

import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.IncidentRepository;
import com.netmar.incidentflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class WorkflowVersioningTest {

    private WorkflowRepository workflowRepository;
    private IncidentRepository incidentRepository;
    private WorkflowService workflowService;

    @BeforeEach
    public void setUp() {
        workflowRepository = mock(WorkflowRepository.class);
        incidentRepository = mock(IncidentRepository.class);
        workflowService = new WorkflowService(workflowRepository, incidentRepository);
    }

    @Test
    public void testSaveWorkflowWithoutIncidentsModifiesInPlace() {
        // Given a workflow without any incidents referencing it
        Workflow workflow = new Workflow();
        workflow.setId(100L);
        workflow.setName("Standard Network");
        workflow.setCategory("Réseau");
        workflow.setVersion(1);
        workflow.setActive(true);

        List<WorkflowState> states = new ArrayList<>();
        states.add(WorkflowState.builder().name("Nouveau").build());
        states.add(WorkflowState.builder().name("Clôturé").build());
        workflow.setStates(states);

        List<WorkflowTransition> transitions = new ArrayList<>();
        transitions.add(WorkflowTransition.builder().fromState("Nouveau").toState("Clôturé").build());
        workflow.setTransitions(transitions);

        when(incidentRepository.existsByWorkflowId(100L)).thenReturn(false);
        when(workflowRepository.save(any(Workflow.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When we save the workflow
        Workflow saved = workflowService.saveWorkflow(workflow);

        // Then it should modify in-place
        assertEquals(100L, saved.getId(), "L'ID ne doit pas changer en l'absence d'incidents associés");
        assertEquals(1, saved.getVersion(), "La version ne doit pas changer");
        assertTrue(saved.isActive(), "Le workflow doit rester actif");
    }

    @Test
    public void testSaveWorkflowWithIncidentsBranchesNewVersion() {
        // Given a workflow with active incidents referencing it
        Workflow workflow = new Workflow();
        workflow.setId(100L);
        workflow.setName("Standard Network");
        workflow.setCategory("Réseau");
        workflow.setVersion(1);
        workflow.setActive(true);

        List<WorkflowState> states = new ArrayList<>();
        states.add(WorkflowState.builder().name("Nouveau").build());
        states.add(WorkflowState.builder().name("Clôturé").build());
        workflow.setStates(states);

        List<WorkflowTransition> transitions = new ArrayList<>();
        transitions.add(WorkflowTransition.builder().fromState("Nouveau").toState("Clôturé").build());
        workflow.setTransitions(transitions);

        when(incidentRepository.existsByWorkflowId(100L)).thenReturn(true);
        when(workflowRepository.findById(100L)).thenReturn(Optional.of(workflow));
        when(workflowRepository.save(any(Workflow.class))).thenAnswer(invocation -> {
            Workflow w = invocation.getArgument(0);
            if (w.getId() == null) {
                w.setId(101L); // Simuler la génération de l'ID en base pour la nouvelle version
            }
            return w;
        });

        // When we save the modified workflow
        Workflow saved = workflowService.saveWorkflow(workflow);

        // Then a new version should be branched
        assertEquals(101L, saved.getId(), "Une nouvelle version avec un nouvel ID doit être insérée");
        assertEquals(2, saved.getVersion(), "Le numéro de version doit être incrémenté de 1");
        assertTrue(saved.isActive(), "La nouvelle version doit être marquée active");

        // The original workflow version should be marked inactive
        assertFalse(workflow.isActive(), "La version originale 1 du workflow doit être désactivée");
        verify(workflowRepository, atLeastOnce()).save(workflow); // verify original was saved as inactive
    }
}
