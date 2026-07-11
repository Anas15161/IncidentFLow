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
import java.io.ByteArrayOutputStream;
import java.awt.Color;
import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.Map;

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
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + attachment.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new ResourceNotFoundException("Fichier introuvable sur le disque: " + attachment.getFilePath());
            }
        } catch (ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new RuntimeException("Erreur lors de la lecture du fichier", ex);
        }
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        incidentService.deleteAttachment(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/attachments/{id}/rename")
    public Attachment renameAttachment(@PathVariable Long id, @RequestBody Map<String, String> requestBody) {
        User currentUser = userService.getCurrentUser();
        String newName = requestBody.get("filename");
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom du fichier ne peut pas être vide.");
        }
        return incidentService.renameAttachment(id, newName.trim(), currentUser);
    }

    @PutMapping("/comments/{id}")
    public Comment updateComment(@PathVariable Long id, @RequestBody CommentRequest request) {
        User currentUser = userService.getCurrentUser();
        return incidentService.updateComment(id, request.getContent(), currentUser);
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        incidentService.deleteComment(id, currentUser);
        return ResponseEntity.noContent().build();
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
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) String search) {
        List<Incident> list = incidentService.getIncidents(category, priority, status, assignedToId, search);
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 30, 30, 40, 40);
            PdfWriter.getInstance(document, baos);
            document.open();
            
            // Define colors
            Color primaryColor = new Color(10, 38, 71); // #0A2647
            Color headerBgColor = new Color(15, 23, 42); // Slate 900
            Color zebraColor = new Color(248, 250, 252); // Slate 50
            Color borderColor = new Color(226, 232, 240); // Slate 200
            
            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.WHITE);
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(148, 163, 184)); // Slate 400
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(51, 65, 85)); // Slate 700
            Font codeFont = FontFactory.getFont(FontFactory.COURIER_BOLD, 8, primaryColor);
            
            // Main Header Banner Table
            PdfPTable headerBanner = new PdfPTable(1);
            headerBanner.setWidthPercentage(100);
            headerBanner.setSpacingAfter(20);
            
            PdfPCell bannerCell = new PdfPCell();
            bannerCell.setBackgroundColor(headerBgColor);
            bannerCell.setPadding(16);
            bannerCell.setBorder(PdfPCell.NO_BORDER);
            
            Paragraph title = new Paragraph("INCIDENTFLOW - RAPPORT D'INCIDENTS", titleFont);
            title.setSpacingAfter(4);
            bannerCell.addElement(title);
            
            Paragraph meta = new Paragraph("Rapport généré le " + 
                new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(new java.util.Date()) + 
                " | Total incidents: " + list.size(), metaFont);
            bannerCell.addElement(meta);
            
            headerBanner.addCell(bannerCell);
            document.add(headerBanner);
            
            // Grid Table
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.8f, 3.2f, 1.4f, 1.4f, 1.4f, 2.8f}); // Column ratios
            table.setSpacingAfter(20);
            
            // Table Header Row
            String[] headers = {"Code", "Titre", "Catégorie", "Priorité", "Statut", "Créateur"};
            for (String headerTitle : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(headerTitle, tableHeaderFont));
                cell.setBackgroundColor(primaryColor);
                cell.setBorderColor(borderColor);
                cell.setPadding(8);
                cell.setHorizontalAlignment(PdfPCell.ALIGN_LEFT);
                table.addCell(cell);
            }
            
            // Table Content Rows
            int index = 0;
            for (Incident inc : list) {
                Color rowBg = (index % 2 == 0) ? Color.WHITE : zebraColor;
                
                // Code Cell
                PdfPCell cCode = new PdfPCell(new Phrase(inc.getIncidentCode(), codeFont));
                cCode.setBackgroundColor(rowBg);
                cCode.setBorderColor(borderColor);
                cCode.setPadding(7);
                table.addCell(cCode);
                
                // Title Cell
                PdfPCell cTitle = new PdfPCell(new Phrase(inc.getTitle(), cellFont));
                cTitle.setBackgroundColor(rowBg);
                cTitle.setBorderColor(borderColor);
                cTitle.setPadding(7);
                table.addCell(cTitle);
                
                // Category Cell
                PdfPCell cCategory = new PdfPCell(new Phrase(inc.getCategory(), cellFont));
                cCategory.setBackgroundColor(rowBg);
                cCategory.setBorderColor(borderColor);
                cCategory.setPadding(7);
                table.addCell(cCategory);
                
                // Priority Cell
                PdfPCell cPriority = new PdfPCell(new Phrase(inc.getPriority(), cellFont));
                cPriority.setBackgroundColor(rowBg);
                cPriority.setBorderColor(borderColor);
                cPriority.setPadding(7);
                table.addCell(cPriority);
                
                // Status Cell
                PdfPCell cStatus = new PdfPCell(new Phrase(inc.getStatus(), cellFont));
                cStatus.setBackgroundColor(rowBg);
                cStatus.setBorderColor(borderColor);
                cStatus.setPadding(7);
                table.addCell(cStatus);
                
                // Creator Cell
                PdfPCell cAuthor = new PdfPCell(new Phrase(inc.getAuthor().getName(), cellFont));
                cAuthor.setBackgroundColor(rowBg);
                cAuthor.setBorderColor(borderColor);
                cAuthor.setPadding(7);
                table.addCell(cAuthor);
                
                index++;
            }
            
            document.add(table);
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rapport_incidents.pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
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
