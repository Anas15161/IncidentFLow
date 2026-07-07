package com.netmar.incidentflow.controller;

import com.netmar.incidentflow.exception.ResourceNotFoundException;
import com.netmar.incidentflow.model.Attachment;
import com.netmar.incidentflow.model.Comment;
import com.netmar.incidentflow.model.Incident;
import com.netmar.incidentflow.model.User;
import com.netmar.incidentflow.repository.AttachmentRepository;
import com.netmar.incidentflow.service.IncidentService;
import com.netmar.incidentflow.service.UserService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;
    private final UserService userService;
    private final AttachmentRepository attachmentRepository;
    private final Path fileStorageLocation;

    public IncidentController(IncidentService incidentService,
                              UserService userService,
                              AttachmentRepository attachmentRepository) {
        this.incidentService = incidentService;
        this.userService = userService;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de creer le dossier de stockage pour les pieces jointes.", e);
        }
    }

    @GetMapping
    public List<Incident> getIncidents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) String search) {
        return incidentService.getIncidents(category, priority, status, assignedToId, search);
    }

    @GetMapping("/{code}")
    public Incident getIncidentByCode(@PathVariable String code) {
        return incidentService.getIncidentByCode(code);
    }

    @PostMapping
    public Incident createIncident(@RequestBody Incident incident) {
        User currentUser = userService.getCurrentUser();
        return incidentService.createIncident(incident, currentUser);
    }

    @PutMapping("/{code}")
    public Incident updateIncident(@PathVariable String code, @RequestBody Incident details) {
        User currentUser = userService.getCurrentUser();
        return incidentService.updateIncident(code, details, currentUser);
    }

    @PostMapping("/{code}/transition")
    public Incident performTransition(@PathVariable String code, @RequestBody TransitionRequest request) {
        User currentUser = userService.getCurrentUser();
        return incidentService.performTransition(code, request.getToState(), request.getComment(), currentUser);
    }

    @PostMapping("/{code}/comments")
    public Comment addComment(@PathVariable String code, @RequestBody CommentRequest request) {
        User currentUser = userService.getCurrentUser();
        return incidentService.addComment(code, request.getContent(), currentUser);
    }

    @PostMapping("/{code}/attachments")
    public Attachment uploadAttachment(@PathVariable String code, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide.");
        }

        try {
            // S'assurer que le dossier uploads existe
            Files.createDirectories(this.fileStorageLocation);

            // Generer un nom de fichier unique pour eviter les collisions
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);

            // Copier le fichier
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Calculer la taille de fichier formatee
            long bytes = file.getSize();
            String sizeStr;
            if (bytes >= 1024 * 1024) {
                sizeStr = String.format("%.1f MB", bytes / (1024.0 * 1024.0));
            } else if (bytes >= 1024) {
                sizeStr = String.format("%.0f KB", bytes / 1024.0);
            } else {
                sizeStr = bytes + " B";
            }

            String contentType = file.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            // Enregistrer dans la base de donnees
            return incidentService.addAttachment(code, originalFileName, targetLocation.toString(), sizeStr, contentType);

        } catch (IOException ex) {
            throw new RuntimeException("Impossible de sauvegarder le fichier. Veuillez reessayer !", ex);
        }
    }

    @GetMapping("/attachments/{id}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Piece jointe introuvable avec l'ID: " + id));

        try {
            Path filePath = Paths.get(attachment.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = attachment.getContentType();
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new ResourceNotFoundException("Fichier introuvable sur le disque: " + attachment.getFilePath());
            }
        } catch (Exception ex) {
            throw new RuntimeException("Erreur lors de la lecture du fichier", ex);
        }
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) String search) {
        List<Incident> list = incidentService.getIncidents(category, priority, status, assignedToId, search);
        StringBuilder sb = new StringBuilder();
        sb.append("Code;Titre;Categorie;Priorite;Statut;Auteur;Assigne A;Date Creation\n");
        for (Incident inc : list) {
            sb.append(inc.getIncidentCode()).append(";")
              .append(inc.getTitle().replace(";", ",")).append(";")
              .append(inc.getCategory()).append(";")
              .append(inc.getPriority()).append(";")
              .append(inc.getStatus()).append(";")
              .append(inc.getAuthor().getName()).append(";")
              .append(inc.getAssignedTo() != null ? inc.getAssignedTo().getName() : "Non assigne").append(";")
              .append(inc.getCreatedAt()).append("\n");
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"incidents.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(sb.toString());
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<String> exportPdf(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) String search) {
        List<Incident> list = incidentService.getIncidents(category, priority, status, assignedToId, search);
        StringBuilder sb = new StringBuilder();
        sb.append("RAPPORT D'INCIDENTS - INCIDENTFLOW\n");
        sb.append("========================================================================\n\n");
        for (Incident inc : list) {
            sb.append("[").append(inc.getIncidentCode()).append("] ").append(inc.getTitle()).append("\n")
              .append("  Categorie: ").append(inc.getCategory()).append(" | Priorite: ").append(inc.getPriority()).append("\n")
              .append("  Statut: ").append(inc.getStatus()).append("\n")
              .append("  Auteur: ").append(inc.getAuthor().getName()).append(" | Assigne a: ").append(inc.getAssignedTo() != null ? inc.getAssignedTo().getName() : "Non assigne").append("\n")
              .append("  Description: ").append(inc.getDescription()).append("\n")
              .append("------------------------------------------------------------------------\n");
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rapport_incidents.txt\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }

    @Getter
    @Setter
    public static class TransitionRequest {
        private String toState;
        private String comment;
    }

    @Getter
    @Setter
    public static class CommentRequest {
        private String content;
    }
}
