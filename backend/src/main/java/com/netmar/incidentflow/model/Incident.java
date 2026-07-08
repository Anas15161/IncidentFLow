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
        if (slaDueAt == null) {
            long hours = 36;
            if ("Critical".equalsIgnoreCase(priority)) {
                hours = "Médical".equalsIgnoreCase(category) ? 1 : 2;
            } else if ("High".equalsIgnoreCase(priority)) {
                hours = 12;
            } else if ("Medium".equalsIgnoreCase(priority)) {
                hours = 36;
            } else if ("Low".equalsIgnoreCase(priority)) {
                hours = 72;
            }
            slaDueAt = createdAt.plusHours(hours);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
