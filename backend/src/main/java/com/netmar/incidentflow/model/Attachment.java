package com.netmar.incidentflow.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_size")
    private String fileSize;

    @Column(name = "content_type")
    private String contentType;

    @ManyToOne(optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    @JsonIgnore
    private Incident incident;
}
