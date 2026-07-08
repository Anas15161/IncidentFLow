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
        validateWorkflowGraph(workflow);
        // Associer bidirectionnellement les states et transitions s'ils ne le sont pas
        if (workflow.getStates() != null) {
            workflow.getStates().forEach(state -> state.setWorkflow(workflow));
        }
        if (workflow.getTransitions() != null) {
            workflow.getTransitions().forEach(transition -> transition.setWorkflow(workflow));
        }
        return workflowRepository.save(workflow);
    }

    public void validateWorkflowGraph(Workflow workflow) {
        if (workflow.getStates() == null || workflow.getStates().isEmpty()) {
            throw new IllegalArgumentException("Le workflow doit contenir au moins un état.");
        }

        // 1. Vérifier la présence de "Nouveau" et "Clôturé"
        boolean hasNouveau = workflow.getStates().stream().anyMatch(s -> s.getName().equalsIgnoreCase("Nouveau"));
        boolean hasCloture = workflow.getStates().stream().anyMatch(s -> s.getName().equalsIgnoreCase("Clôturé"));

        if (!hasNouveau) {
            throw new IllegalArgumentException("L'état initial 'Nouveau' est obligatoire.");
        }
        if (!hasCloture) {
            throw new IllegalArgumentException("L'état final 'Clôturé' est obligatoire.");
        }

        java.util.List<String> stateNames = workflow.getStates().stream()
                .map(s -> s.getName().trim().toLowerCase())
                .collect(java.util.stream.Collectors.toList());

        // 2. Construire les listes d'adjacence
        java.util.Map<String, java.util.List<String>> adj = new java.util.HashMap<>();
        java.util.Map<String, java.util.List<String>> revAdj = new java.util.HashMap<>();

        for (String state : stateNames) {
            adj.put(state, new java.util.ArrayList<>());
            revAdj.put(state, new java.util.ArrayList<>());
        }

        if (workflow.getTransitions() != null) {
            for (com.netmar.incidentflow.model.WorkflowTransition t : workflow.getTransitions()) {
                String from = t.getFromState().trim().toLowerCase();
                String to = t.getToState().trim().toLowerCase();

                // Ignorer les transitions vers/depuis des états inexistants
                if (adj.containsKey(from) && adj.containsKey(to)) {
                    adj.get(from).add(to);
                    revAdj.get(to).add(from);
                }
            }
        }

        // 3. Détecter les états orphelins (inaccessibles depuis "Nouveau")
        java.util.Set<String> visitedFromStart = new java.util.HashSet<>();
        dfs("nouveau", adj, visitedFromStart);

        java.util.List<String> orphans = workflow.getStates().stream()
                .map(s -> s.getName().trim())
                .filter(name -> !visitedFromStart.contains(name.toLowerCase()))
                .collect(java.util.stream.Collectors.toList());

        if (!orphans.isEmpty()) {
            throw new IllegalArgumentException("Détection d'état(s) orphelin(s) (inaccessible(s) depuis 'Nouveau') : " + String.join(", ", orphans));
        }

        // 4. Détecter les blocages (impossible d'atteindre "Clôturé")
        java.util.Set<String> visitedFromEnd = new java.util.HashSet<>();
        dfs("clôturé", revAdj, visitedFromEnd);

        if (visitedFromEnd.isEmpty()) {
            String finalStateRealName = workflow.getStates().stream()
                    .map(s -> s.getName().trim())
                    .filter(name -> name.equalsIgnoreCase("Clôturé") || name.equalsIgnoreCase("Cloture"))
                    .findFirst().orElse("clôturé").toLowerCase();
            dfs(finalStateRealName, revAdj, visitedFromEnd);
        }

        java.util.List<String> deadlocks = workflow.getStates().stream()
                .map(s -> s.getName().trim())
                .filter(name -> !visitedFromEnd.contains(name.toLowerCase()))
                .collect(java.util.stream.Collectors.toList());

        if (!deadlocks.isEmpty()) {
            throw new IllegalArgumentException("Détection d'impasse(s) (aucun chemin menant à l'état final 'Clôturé') : " + String.join(", ", deadlocks));
        }
    }

    private void dfs(String node, java.util.Map<String, java.util.List<String>> graph, java.util.Set<String> visited) {
        visited.add(node);
        java.util.List<String> neighbors = graph.get(node);
        if (neighbors != null) {
            for (String neighbor : neighbors) {
                if (!visited.contains(neighbor)) {
                    dfs(neighbor, graph, visited);
                }
            }
        }
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
