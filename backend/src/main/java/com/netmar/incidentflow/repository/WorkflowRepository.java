package com.netmar.incidentflow.repository;

import com.netmar.incidentflow.model.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, Long> {
    Optional<Workflow> findByCategory(String category);
    Optional<Workflow> findByCategoryAndActiveTrue(String category);
    java.util.List<Workflow> findByCategoryOrderByVersionDesc(String category);
}
