package com.netmar.incidentflow.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incidents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_code", nullable = false, unique = true)
    private String incidentCode;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String priority; // Critical, High, Medium, Low

    @Column(name = "severity")
    private String severity; // Critique (<4h), Important (<24h), Mineur (<3j)

    @Column(nullable = false)
    private String status; // Nouveau, Assigné, En cours, Résolu, Clôturé

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "sla_due_at")
    private LocalDateTime slaDueAt;

    @Column(name = "escalated", nullable = false)
    @Builder.Default
    private boolean escalated = false;

    @ManyToOne(optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "incident", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<IncidentHistory> history = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();

        // Si la sévérité n'est pas renseignée, la déterminer à partir de la priorité par défaut
        if (severity == null || severity.trim().isEmpty()) {
            if ("Critical".equalsIgnoreCase(priority) || "Critique".equalsIgnoreCase(priority)) {
                severity = "Critique";
            } else if ("High".equalsIgnoreCase(priority) || "Important".equalsIgnoreCase(priority)) {
                severity = "Important";
            } else {
                severity = "Mineur";
            }
        }

        if (slaDueAt == null) {
            long hours = 72; // Mineur par défaut (< 3 jours)
            if ("Critique".equalsIgnoreCase(severity) || "Critical".equalsIgnoreCase(severity)) {
                hours = 4; // Critique (< 4 heures)
            } else if ("Important".equalsIgnoreCase(severity) || "High".equalsIgnoreCase(severity)) {
                hours = 24; // Important (< 24 heures)
            } else if ("Mineur".equalsIgnoreCase(severity) || "Medium".equalsIgnoreCase(severity) || "Low".equalsIgnoreCase(severity)) {
                hours = 72; // Mineur (< 3 jours = 72 heures)
            }
            slaDueAt = createdAt.plusHours(hours);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
