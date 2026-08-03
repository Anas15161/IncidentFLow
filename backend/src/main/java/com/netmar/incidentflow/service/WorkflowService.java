package com.netmar.incidentflow.service;

import com.netmar.incidentflow.exception.InvalidTransitionException;
import com.netmar.incidentflow.exception.ResourceNotFoundException;
import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.WorkflowRepository;
import com.netmar.incidentflow.repository.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import java.util.List;

/**
 * Service de gestion du cycle de vie des workflows dynamiques d'incidents.
 * Gère la persistance Hibernate/JPA, le versionnage des workflows,
 * la validation de graphe (états orphelins, impasses) et le contrôle des transitions.
 */
@Service
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final IncidentRepository incidentRepository;

    public WorkflowService(WorkflowRepository workflowRepository, IncidentRepository incidentRepository) {
        this.workflowRepository = workflowRepository;
        this.incidentRepository = incidentRepository;
    }

    /**
     * Récupère la liste de tous les workflows configurés.
     * Utilise le cache Spring ("workflows").
     */
    @Cacheable(value = "workflows", key = "'all'")
    public List<Workflow> getAllWorkflows() {
        List<Workflow> all = workflowRepository.findAll();
        if (all.size() > 1) {
            return List.of(all.get(0));
        }
        return all;
    }

    /**
     * Recherche un workflow par son identifiant unique.
     */
    @Cacheable(value = "workflows", key = "#id")
    public Workflow getWorkflowById(Long id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow non trouvé avec l'ID: " + id));
    }

    /**
     * Récupère un workflow par sa catégorie (ex: Réseau, Sécurité, Médical).
     */
    @Cacheable(value = "workflows-category", key = "#category")
    public Workflow getWorkflowByCategory(String category) {
        List<Workflow> all = workflowRepository.findAll();
        if (!all.isEmpty()) {
            return all.get(0);
        }
        return workflowRepository.findByCategory(category)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun workflow trouvé pour la catégorie : " + category));
    }

    /**
     * Enregistre ou met à jour un workflow avec validation du graphe et gestion des entités Hibernate.
     * 
     * @param workflow Le workflow à sauvegarder (objet détaché/detached provenant du contrôleur REST)
     * @return Le workflow persistant géré par Hibernate
     */
    @Transactional
    @CacheEvict(value = {"workflows", "workflows-category"}, allEntries = true)
    public Workflow saveWorkflow(Workflow workflow) {
        // 1. Validation de l'intégrité du graphe (états obligatoires 'Nouveau'/'Clôturé', ni orphelin ni impasse)
        validateWorkflowGraph(workflow);

        // 2. Modification en place si le workflow existe déjà (id != null)
        if (workflow.getId() != null) {
            Workflow existing = workflowRepository.findById(workflow.getId())
                    .orElseGet(() -> workflow);

            if (existing != workflow) {
                // Mise à jour des métadonnées
                existing.setName(workflow.getName());
                existing.setCategory(workflow.getCategory());
                existing.setActive(workflow.isActive());

                // Remplacement des états (Orphan Removal)
                existing.getStates().clear();
                if (workflow.getStates() != null) {
                    for (WorkflowState state : workflow.getStates()) {
                        WorkflowState newState = WorkflowState.builder()
                                .name(state.getName())
                                .label(state.getLabel())
                                .colorClass(state.getColorClass())
                                .active(state.isActive())
                                .workflow(existing)
                                .build();
                        existing.getStates().add(newState);
                    }
                }

                // Remplacement des transitions (Orphan Removal)
                existing.getTransitions().clear();
                if (workflow.getTransitions() != null) {
                    for (WorkflowTransition transition : workflow.getTransitions()) {
                        WorkflowTransition newTransition = WorkflowTransition.builder()
                                .fromState(transition.getFromState())
                                .toState(transition.getToState())
                                .roleRequired(transition.getRoleRequired())
                                .requiresComment(transition.isRequiresComment())
                                .workflow(existing)
                                .build();
                        existing.getTransitions().add(newTransition);
                    }
                }
            } else {
                if (workflow.getStates() != null) {
                    workflow.getStates().forEach(state -> state.setWorkflow(workflow));
                }
                if (workflow.getTransitions() != null) {
                    workflow.getTransitions().forEach(transition -> transition.setWorkflow(workflow));
                }
            }
            return workflowRepository.save(existing);
        }

        // 3. Création d'un nouveau workflow (id == null)
        if (workflow.getStates() != null) {
            workflow.getStates().forEach(state -> {
                state.setId(null);
                state.setWorkflow(workflow);
            });
        }
        if (workflow.getTransitions() != null) {
            workflow.getTransitions().forEach(transition -> {
                transition.setId(null);
                transition.setWorkflow(workflow);
            });
        }
        return workflowRepository.save(workflow);
    }

    /**
     * Recherche le workflow actif d'une catégorie donnée.
     */
    @Cacheable(value = "workflows-category", key = "#category + '-active'")
    public Workflow getWorkflowByCategoryAndActive(String category) {
        return workflowRepository.findByCategoryAndActiveTrue(category)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun workflow actif trouvé pour la catégorie : " + category));
    }

    /**
     * Valide si la transition demandée pour un incident spécifique est autorisée selon les règles du workflow rattaché.
     */
    public WorkflowTransition validateTransitionForIncident(Incident incident, String fromState, String toState, User user, String comment) {
        Workflow workflow = incident.getWorkflow();
        if (workflow == null) {
            workflow = workflowRepository.findByCategoryAndActiveTrue(incident.getCategory())
                    .orElseGet(() -> workflowRepository.findByCategory(incident.getCategory())
                            .orElseThrow(() -> new InvalidTransitionException("Aucun workflow configuré pour la catégorie : " + incident.getCategory())));
        }

        Workflow workflowFinal = workflow;
        WorkflowTransition match = workflow.getTransitions().stream()
                .filter(t -> t.getFromState().equalsIgnoreCase(fromState) && t.getToState().equalsIgnoreCase(toState))
                .findFirst()
                .orElseThrow(() -> new InvalidTransitionException(
                        String.format("Transition de '%s' vers '%s' non autorisée pour la version %d du workflow '%s'.", 
                                fromState, toState, workflowFinal.getVersion(), workflowFinal.getName())
                ));

        // Vérification des droits d'accès selon le rôle requis
        if (match.getRoleRequired() != null && !match.getRoleRequired().trim().isEmpty()) {
            if (user == null || user.getRole() == null || !user.getRole().getName().equalsIgnoreCase(match.getRoleRequired().trim())) {
                throw new InvalidTransitionException(
                        String.format("Rôle '%s' requis pour effectuer cette transition. Votre rôle : %s.",
                                match.getRoleRequired(), user != null && user.getRole() != null ? user.getRole().getName() : "Aucun")
                );
            }
        }

        // Vérification du commentaire obligatoire si requis par la transition
        if (match.isRequiresComment()) {
            if (comment == null || comment.trim().isEmpty()) {
                throw new InvalidTransitionException(
                        String.format("Un commentaire est obligatoire pour passer de '%s' vers '%s'.", fromState, toState)
                );
            }
        }

        return match;
    }

    /**
     * Valide qu'un graphe de workflow est mathématiquement et fonctionnellement valide :
     * 1. Présence obligatoire de l'état initial 'Nouveau' et de l'état final 'Clôturé'.
     * 2. Aucun état orphelin (inaccessible depuis 'Nouveau').
     * 3. Aucune impasse (aucun chemin permettant d'atteindre l'état 'Clôturé').
     */
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

        List<String> stateNames = workflow.getStates().stream()
                .map(s -> s.getName().trim().toLowerCase())
                .collect(java.util.stream.Collectors.toList());

        // 2. Construire les listes d'adjacence orientées (graphe direct et graphe inversé)
        java.util.Map<String, List<String>> adj = new java.util.HashMap<>();
        java.util.Map<String, List<String>> revAdj = new java.util.HashMap<>();

        for (String state : stateNames) {
            adj.put(state, new java.util.ArrayList<>());
            revAdj.put(state, new java.util.ArrayList<>());
        }

        if (workflow.getTransitions() != null) {
            for (WorkflowTransition t : workflow.getTransitions()) {
                String from = t.getFromState().trim().toLowerCase();
                String to = t.getToState().trim().toLowerCase();

                // Ignorer les transitions vers/depuis des états inexistants
                if (adj.containsKey(from) && adj.containsKey(to)) {
                    adj.get(from).add(to);
                    revAdj.get(to).add(from);
                }
            }
        }

        // 3. Détecter les états orphelins (parcours DFS depuis "Nouveau")
        java.util.Set<String> visitedFromStart = new java.util.HashSet<>();
        dfs("nouveau", adj, visitedFromStart);

        List<String> orphans = workflow.getStates().stream()
                .map(s -> s.getName().trim())
                .filter(name -> !visitedFromStart.contains(name.toLowerCase()))
                .collect(java.util.stream.Collectors.toList());

        if (!orphans.isEmpty()) {
            throw new IllegalArgumentException("Détection d'état(s) orphelin(s) (inaccessible(s) depuis 'Nouveau') : " + String.join(", ", orphans));
        }

        // 4. Détecter les impasses (parcours DFS inversé depuis "Clôturé")
        java.util.Set<String> visitedFromEnd = new java.util.HashSet<>();
        dfs("clôturé", revAdj, visitedFromEnd);

        if (visitedFromEnd.isEmpty()) {
            String finalStateRealName = workflow.getStates().stream()
                    .map(s -> s.getName().trim())
                    .filter(name -> name.equalsIgnoreCase("Clôturé") || name.equalsIgnoreCase("Cloture"))
                    .findFirst().orElse("clôturé").toLowerCase();
            dfs(finalStateRealName, revAdj, visitedFromEnd);
        }

        List<String> deadlocks = workflow.getStates().stream()
                .map(s -> s.getName().trim())
                .filter(name -> !visitedFromEnd.contains(name.toLowerCase()))
                .collect(java.util.stream.Collectors.toList());

        if (!deadlocks.isEmpty()) {
            throw new IllegalArgumentException("Détection d'impasse(s) (aucun chemin menant à l'état final 'Clôturé') : " + String.join(", ", deadlocks));
        }
    }

    /**
     * Algorithme de parcours en profondeur (DFS) pour l'analyse d'accessibilité du graphe.
     */
    private void dfs(String node, java.util.Map<String, List<String>> graph, java.util.Set<String> visited) {
        visited.add(node);
        List<String> neighbors = graph.get(node);
        if (neighbors != null) {
            for (String neighbor : neighbors) {
                if (!visited.contains(neighbor)) {
                    dfs(neighbor, graph, visited);
                }
            }
        }
    }

    /**
     * Supprime un workflow et vide le cache associé.
     */
    @Transactional
    @CacheEvict(value = {"workflows", "workflows-category"}, allEntries = true)
    public void deleteWorkflow(Long id) {
        Workflow workflow = getWorkflowById(id);
        workflowRepository.delete(workflow);
    }

    /**
     * Valide une transition générale basée uniquement sur la catégorie.
     */
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

