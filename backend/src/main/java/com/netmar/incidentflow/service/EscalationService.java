package com.netmar.incidentflow.service;

import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.IncidentRepository;
import com.netmar.incidentflow.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EscalationService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;

    public EscalationService(IncidentRepository incidentRepository, UserRepository userRepository) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
    }

    // Exécution planifiée toutes les 15 secondes pour les besoins de la démonstration et du test
    @Scheduled(fixedRate = 15000)
    @Transactional
    public void runAutomaticEscalation() {
        System.out.println("[PLANIFICATEUR] Vérification des incidents pour escalade automatique...");

        // 1. Rechercher les incidents actifs (non Résolus ni Clôturés) avec SLA et non encore escaladés
        List<Incident> activeIncidents = incidentRepository.findAll().stream()
                .filter(inc -> inc.getStatus() != null 
                        && !inc.getStatus().equalsIgnoreCase("Résolu") 
                        && !inc.getStatus().equalsIgnoreCase("Clôturé")
                        && inc.getSlaDueAt() != null
                        && !inc.isEscalated())
                .collect(Collectors.toList());

        if (activeIncidents.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        // Trouver un utilisateur référent de niveau supérieur (Responsable ou Administrateur)
        User manager = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getName().equalsIgnoreCase("Responsable"))
                .findFirst()
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRole() != null && u.getRole().getName().equalsIgnoreCase("Administrateur"))
                        .findFirst()
                        .orElse(null));

        if (manager == null) {
            System.err.println("[PLANIFICATEUR - ALERTE] Aucun utilisateur de type Responsable ou Administrateur trouvé pour réassignation !");
            return;
        }

        for (Incident incident : activeIncidents) {
            // Vérifier si l'incident a dépassé son échéance SLA
            if (now.isAfter(incident.getSlaDueAt())) {
                escalateIncident(incident, manager, "Délai de résolution dépassé");
            } 
            // OU s'il menace de dépasser son délai (moins de 15 minutes restantes) et est inactif (status "Nouveau")
            else if (now.plusMinutes(15).isAfter(incident.getSlaDueAt()) && incident.getStatus().equalsIgnoreCase("Nouveau")) {
                escalateIncident(incident, manager, "Menace d'expiration (inactif, moins de 15 min restantes)");
            }
        }
    }

    private void escalateIncident(Incident incident, User manager, String reason) {
        System.out.println(String.format("[ESCALADE ACTIQUE] Incident %s (%s) escaladé pour la raison : %s", 
                incident.getIncidentCode(), incident.getTitle(), reason));

        // 1. Marquer comme escaladé
        incident.setEscalated(true);
        incident.setPriority("Critical"); // Monter la priorité au maximum si pas déjà fait

        // 2. Réassigner au niveau supérieur
        User oldAssignee = incident.getAssignedTo();
        incident.setAssignedTo(manager);

        // 3. Ajouter un commentaire d'alerte automatique rédigé par le Système
        Comment alertComment = Comment.builder()
                .content(String.format("[ALERTE ESCALADE AUTOMATIQUE] L'incident a été réassigné automatiquement à %s (Responsable) car le délai de traitement SLA est compromis (%s).", 
                        manager.getName(), reason))
                .author(manager) // attribué au manager réassigné ou système
                .incident(incident)
                .build();
        incident.getComments().add(alertComment);

        // 4. Ajouter l'action dans l'historique
        String historyMsg = String.format("Incident escaladé automatiquement : %s. Réassigné à %s.", reason, manager.getName());
        IncidentHistory history = IncidentHistory.builder()
                .action(historyMsg)
                .username("Système")
                .incident(incident)
                .build();
        incident.getHistory().add(history);

        // 5. Sauvegarder
        incidentRepository.save(incident);
        System.out.println(String.format("[PLANIFICATEUR - ALERTE SENT] E-mail d'alerte simulé envoyé à %s pour l'incident %s", 
                manager.getEmail(), incident.getIncidentCode()));
    }
}
