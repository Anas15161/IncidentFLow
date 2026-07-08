package com.netmar.incidentflow.service;

import com.netmar.incidentflow.model.Workflow;
import com.netmar.incidentflow.model.WorkflowState;
import com.netmar.incidentflow.model.WorkflowTransition;
import com.netmar.incidentflow.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

public class WorkflowValidationTest {

    private WorkflowService workflowService;

    @BeforeEach
    public void setUp() {
        WorkflowRepository workflowRepository = mock(WorkflowRepository.class);
        workflowService = new WorkflowService(workflowRepository);
    }

    @Test
    public void testValidWorkflowValidation() {
        Workflow workflow = new Workflow();
        
        List<WorkflowState> states = new ArrayList<>();
        states.add(WorkflowState.builder().name("Nouveau").build());
        states.add(WorkflowState.builder().name("Assigné").build());
        states.add(WorkflowState.builder().name("Clôturé").build());
        workflow.setStates(states);

        List<WorkflowTransition> transitions = new ArrayList<>();
        transitions.add(WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").build());
        transitions.add(WorkflowTransition.builder().fromState("Assigné").toState("Clôturé").build());
        workflow.setTransitions(transitions);

        // Should not throw any exception
        assertDoesNotThrow(() -> workflowService.validateWorkflowGraph(workflow));
    }

    @Test
    public void testOrphanStateThrowsException() {
        Workflow workflow = new Workflow();
        
        List<WorkflowState> states = new ArrayList<>();
        states.add(WorkflowState.builder().name("Nouveau").build());
        states.add(WorkflowState.builder().name("Assigné").build());
        states.add(WorkflowState.builder().name("Orphelin").build()); // No transition leading here
        states.add(WorkflowState.builder().name("Clôturé").build());
        workflow.setStates(states);

        List<WorkflowTransition> transitions = new ArrayList<>();
        transitions.add(WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").build());
        transitions.add(WorkflowTransition.builder().fromState("Assigné").toState("Clôturé").build());
        workflow.setTransitions(transitions);

        Exception exception = assertThrows(IllegalArgumentException.class, () -> 
            workflowService.validateWorkflowGraph(workflow)
        );

        assertTrue(exception.getMessage().contains("Orphelin"), "L'erreur doit mentionner l'état orphelin");
    }

    @Test
    public void testDeadlockStateThrowsException() {
        Workflow workflow = new Workflow();
        
        List<WorkflowState> states = new ArrayList<>();
        states.add(WorkflowState.builder().name("Nouveau").build());
        states.add(WorkflowState.builder().name("Assigné").build());
        states.add(WorkflowState.builder().name("Impasse").build()); // Has transition from Assigné but has no transitions leaving it
        states.add(WorkflowState.builder().name("Clôturé").build());
        workflow.setStates(states);

        List<WorkflowTransition> transitions = new ArrayList<>();
        transitions.add(WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").build());
        transitions.add(WorkflowTransition.builder().fromState("Assigné").toState("Impasse").build());
        // No path from Impasse to Clôturé
        transitions.add(WorkflowTransition.builder().fromState("Assigné").toState("Clôturé").build());
        workflow.setTransitions(transitions);

        Exception exception = assertThrows(IllegalArgumentException.class, () -> 
            workflowService.validateWorkflowGraph(workflow)
        );

        assertTrue(exception.getMessage().contains("Impasse"), "L'erreur doit mentionner l'état en impasse");
    }

    @Test
    public void testMissingMandatoryStatesThrowsException() {
        Workflow workflow = new Workflow();
        
        List<WorkflowState> states = new ArrayList<>();
        states.add(WorkflowState.builder().name("Nouveau").build());
        states.add(WorkflowState.builder().name("Assigné").build());
        // Missing Clôturé
        workflow.setStates(states);

        Exception exception = assertThrows(IllegalArgumentException.class, () -> 
            workflowService.validateWorkflowGraph(workflow)
        );

        assertTrue(exception.getMessage().contains("Clôturé"), "L'erreur doit mentionner l'absence de l'état Clôturé");
    }
}
