package com.netmar.incidentflow.repository;

import com.netmar.incidentflow.model.Role;
import com.netmar.incidentflow.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByRole(Role role);
    long countByRoleId(Long roleId);
}
