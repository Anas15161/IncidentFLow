package com.netmar.incidentflow.repository;

import com.netmar.incidentflow.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long>, JpaSpecificationExecutor<Incident> {
    Optional<Incident> findByIncidentCode(String incidentCode);

    @Query("SELECT MAX(i.incidentCode) FROM Incident i WHERE i.incidentCode LIKE :prefix%")
    String findMaxIncidentCodeByPrefix(@Param("prefix") String prefix);
}
