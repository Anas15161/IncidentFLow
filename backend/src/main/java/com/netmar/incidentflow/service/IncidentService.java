package com.netmar.incidentflow.service;

import com.netmar.incidentflow.exception.ResourceNotFoundException;
import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.IncidentRepository;
import com.netmar.incidentflow.repository.UserRepository;
import com.netmar.incidentflow.repository.AttachmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final WorkflowService workflowService;
    private final AttachmentRepository attachmentRepository;

    public IncidentService(IncidentRepository incidentRepository,
                           UserRepository userRepository,
                           WorkflowService workflowService,
                           AttachmentRepository attachmentRepository) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.workflowService = workflowService;
        this.attachmentRepository = attachmentRepository;
    }

    public List<Incident> getIncidents(String category, String priority, String status, Long assignedToId, String search) {
        return incidentRepository.findAll((root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (category != null && !category.isEmpty()) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (priority != null && !priority.isEmpty()) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (assignedToId != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }
            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("incidentCode")), pattern)
                ));
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });
    }

    public Incident getIncidentByCode(String code) {
        return incidentRepository.findByIncidentCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Incident non trouvé avec le code: " + code));
    }

    @Transactional
    public Incident createIncident(Incident incident, User author) {
        incident.setAuthor(author);
        incident.setStatus("Nouveau");

        // Associer le workflow actif actuel pour la catégorie (Versionning)
        try {
            Workflow activeWorkflow = workflowService.getWorkflowByCategoryAndActive(incident.getCategory());
            incident.setWorkflow(activeWorkflow);
        } catch (Exception ignored) {}

        // Generer le code incident unique (ex: INC-2026-005)
        int year = LocalDateTime.now().getYear();
        String prefix = "INC-" + year + "-";
        String maxCode = incidentRepository.findMaxIncidentCodeByPrefix(prefix);
        int seq = 1;
        if (maxCode != null && maxCode.startsWith(prefix)) {
            try {
                String seqStr = maxCode.substring(prefix.length());
                seq = Integer.parseInt(seqStr) + 1;
            } catch (NumberFormatException ignored) {}
        }
        incident.setIncidentCode(String.format("%s%03d", prefix, seq));

        // Regle d'affectation automatique pour le medical
        if ("Médical".equalsIgnoreCase(incident.getCategory())) {
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && "Opérateur médical".equalsIgnoreCase(u.getRole().getName()))
                    .findFirst()
                    .ifPresent(incident::setAssignedTo);
        } else if (incident.getAssignedTo() != null && incident.getAssignedTo().getId() != null) {
            User assigned = userRepository.findById(incident.getAssignedTo().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found with ID: " + incident.getAssignedTo().getId()));
            incident.setAssignedTo(assigned);
        }

        // Creer le premier log d'historique
        List<IncidentHistory> historyList = new ArrayList<>();
        historyList.add(IncidentHistory.builder()
                .action("Incident déclaré")
                .username(author.getName())
                .incident(incident)
                .build());

        if (incident.getAssignedTo() != null) {
            String systemMsg = "Médical".equalsIgnoreCase(incident.getCategory())
                    ? "Assigné automatiquement à " + incident.getAssignedTo().getName() + " (Règle d'incident médical)"
                    : "Assigné à " + incident.getAssignedTo().getName();
            historyList.add(IncidentHistory.builder()
                    .action(systemMsg)
                    .username("Système")
                    .incident(incident)
                    .build());
        }

        incident.setHistory(historyList);
        return incidentRepository.save(incident);
    }

    @Transactional
    public Incident updateIncident(String code, Incident details, User user) {
        Incident incident = getIncidentByCode(code);

        incident.setTitle(details.getTitle());
        incident.setDescription(details.getDescription());
        incident.setCategory(details.getCategory());
        incident.setPriority(details.getPriority());

        // Verifier le changement d'assignataire
        User oldAssignee = incident.getAssignedTo();
        User newAssignee = details.getAssignedTo();

        if (newAssignee != null && (oldAssignee == null || !oldAssignee.getId().equals(newAssignee.getId()))) {
            // Recharger l'assignataire de la base
            User dbAssignee = userRepository.findById(newAssignee.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            incident.setAssignedTo(dbAssignee);

            // Log dans l'historique
            IncidentHistory history = IncidentHistory.builder()
                    .action("Assigné à " + dbAssignee.getName())
                    .username(user.getName())
                    .incident(incident)
                    .build();
            incident.getHistory().add(history);
        } else if (newAssignee == null && oldAssignee != null) {
            incident.setAssignedTo(null);
            IncidentHistory history = IncidentHistory.builder()
                    .action("Désassigné")
                    .username(user.getName())
                    .incident(incident)
                    .build();
            incident.getHistory().add(history);
        }

        return incidentRepository.save(incident);
    }

    @Transactional
    public Incident performTransition(String code, String toState, String commentText, User user) {
        Incident incident = getIncidentByCode(code);
        String oldState = incident.getStatus();

        // 1. Valider la transition via le moteur de workflow versionné
        workflowService.validateTransitionForIncident(incident, oldState, toState, user, commentText);

        // 2. Mettre a jour le statut
        incident.setStatus(toState);

        // 3. Ajouter le commentaire si present
        if (commentText != null && !commentText.trim().isEmpty()) {
            Comment comment = Comment.builder()
                    .content(commentText)
                    .author(user)
                    .incident(incident)
                    .build();
            incident.getComments().add(comment);
        }

        // 4. Ajouter l'historique
        IncidentHistory history = IncidentHistory.builder()
                .action(String.format("Statut modifié à %s", toState))
                .username(user.getName())
                .incident(incident)
                .build();
        incident.getHistory().add(history);

        return incidentRepository.save(incident);
    }

    @Transactional
    public Comment addComment(String code, String content, User user) {
        Incident incident = getIncidentByCode(code);

        Comment comment = Comment.builder()
                .content(content)
                .author(user)
                .incident(incident)
                .build();

        incident.getComments().add(comment);

        IncidentHistory history = IncidentHistory.builder()
                .action("Commentaire ajouté")
                .username(user.getName())
                .incident(incident)
                .build();
        incident.getHistory().add(history);

        incidentRepository.save(incident);
        return comment;
    }

    @Transactional
    public Attachment addAttachment(String code, String filename, String filePath, String fileSize, String contentType) {
        Incident incident = getIncidentByCode(code);

        Attachment attachment = Attachment.builder()
                .filename(filename)
                .filePath(filePath)
                .fileSize(fileSize)
                .contentType(contentType)
                .incident(incident)
                .build();

        incident.getAttachments().add(attachment);

        IncidentHistory history = IncidentHistory.builder()
                .action("Pièce jointe ajoutée : " + filename)
                .username("Système")
                .incident(incident)
                .build();
        incident.getHistory().add(history);

        incidentRepository.save(incident);
        return attachment;
    }

    @Transactional
    public void deleteAttachment(Long id, User user) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Piece jointe introuvable avec l'ID: " + id));

        Incident incident = attachment.getIncident();
        incident.getAttachments().remove(attachment);

        IncidentHistory history = IncidentHistory.builder()
                .action("Pièce jointe supprimée : " + attachment.getFilename())
                .username(user != null ? user.getName() : "Système")
                .incident(incident)
                .build();
        incident.getHistory().add(history);

        incidentRepository.save(incident);

        // Supprimer le fichier sur le disque
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (java.io.IOException e) {
            System.err.println("Impossible de supprimer le fichier physique: " + attachment.getFilePath() + " - " + e.getMessage());
        }
    }

    @Transactional
    public Attachment renameAttachment(Long id, String newName, User user) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Piece jointe introuvable avec l'ID: " + id));

        String oldName = attachment.getFilename();
        attachment.setFilename(newName);
        
        Incident incident = attachment.getIncident();
        
        IncidentHistory history = IncidentHistory.builder()
                .action("Pièce jointe renommée de '" + oldName + "' vers '" + newName + "'")
                .username(user != null ? user.getName() : "Système")
                .incident(incident)
                .build();
        incident.getHistory().add(history);

        incidentRepository.save(incident);
        return attachmentRepository.save(attachment);
    }
}
