package com.netmar.incidentflow.service;

import com.netmar.incidentflow.exception.InvalidTransitionException;
import com.netmar.incidentflow.exception.ResourceNotFoundException;
import com.netmar.incidentflow.model.User;
import com.netmar.incidentflow.model.Workflow;
import com.netmar.incidentflow.model.WorkflowTransition;
import com.netmar.incidentflow.repository.WorkflowRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepository;

    public WorkflowService(WorkflowRepository workflowRepository) {
        this.workflowRepository = workflowRepository;
    }

    public List<Workflow> getAllWorkflows() {
        return workflowRepository.findAll();
    }

    public Workflow getWorkflowById(Long id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found with ID: " + id));
    }

    public Workflow getWorkflowByCategory(String category) {
        return workflowRepository.findByCategory(category)
                .orElseThrow(() -> new ResourceNotFoundException("No workflow found for category: " + category));
    }

    @Transactional
    public Workflow saveWorkflow(Workflow workflow) {
        // Associer bidirectionnellement les states et transitions s'ils ne le sont pas
        if (workflow.getStates() != null) {
            workflow.getStates().forEach(state -> state.setWorkflow(workflow));
        }
        if (workflow.getTransitions() != null) {
            workflow.getTransitions().forEach(transition -> transition.setWorkflow(workflow));
        }
        return workflowRepository.save(workflow);
    }

    @Transactional
    public void deleteWorkflow(Long id) {
        Workflow workflow = getWorkflowById(id);
        workflowRepository.delete(workflow);
    }

    public WorkflowTransition validateTransition(String category, String fromState, String toState, User user, String comment) {
        Workflow workflow = workflowRepository.findByCategory(category)
                .orElseThrow(() -> new InvalidTransitionException("Aucun workflow configuré pour la catégorie : " + category));

        if (!workflow.isActive()) {
            throw new InvalidTransitionException("Le workflow pour la catégorie " + category + " est désactivé.");
        }

        // Trouver la transition autorisée
        WorkflowTransition match = workflow.getTransitions().stream()
                .filter(t -> t.getFromState().equalsIgnoreCase(fromState) && t.getToState().equalsIgnoreCase(toState))
                .findFirst()
                .orElseThrow(() -> new InvalidTransitionException(
                        String.format("Transition de '%s' vers '%s' non autorisée pour la catégorie '%s'.", fromState, toState, category)
                ));

        // Vérifier le rôle requis
        if (match.getRoleRequired() != null && !match.getRoleRequired().trim().isEmpty()) {
            if (user == null || user.getRole() == null || !user.getRole().getName().equalsIgnoreCase(match.getRoleRequired().trim())) {
                throw new InvalidTransitionException(
                        String.format("Rôle '%s' requis pour effectuer cette transition. Votre rôle : %s.",
                                match.getRoleRequired(), user != null && user.getRole() != null ? user.getRole().getName() : "Aucun")
                );
            }
        }

        // Vérifier si un commentaire est requis
        if (match.isRequiresComment()) {
            if (comment == null || comment.trim().isEmpty()) {
                throw new InvalidTransitionException(
                        String.format("Un commentaire est obligatoire pour passer de '%s' vers '%s'.", fromState, toState)
                );
            }
        }

        return match;
    }
}
