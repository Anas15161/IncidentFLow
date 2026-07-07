package com.netmar.incidentflow.service;

import com.netmar.incidentflow.exception.ResourceNotFoundException;
import com.netmar.incidentflow.model.Role;
import com.netmar.incidentflow.model.User;
import com.netmar.incidentflow.repository.RoleRepository;
import com.netmar.incidentflow.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final HttpServletRequest request;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, HttpServletRequest request, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.request = request;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt) {
            org.springframework.security.oauth2.jwt.Jwt jwt = (org.springframework.security.oauth2.jwt.Jwt) auth.getPrincipal();
            String email = jwt.getClaimAsString("email");
            if (email == null) {
                email = jwt.getClaimAsString("preferred_username");
            }
            if (email != null) {
                final String finalEmail = email;
                return userRepository.findByEmail(finalEmail)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + finalEmail));
            }
        }

        // Mode dev-mock ou fallback
        String mockEmail = request.getHeader("X-Mock-User");
        if (mockEmail == null || mockEmail.trim().isEmpty()) {
            mockEmail = "anas@netmar.com"; // Fallback par defaut
        }
        final String finalMockEmail = mockEmail;
        return userRepository.findByEmail(finalMockEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Simulated user not found: " + finalMockEmail));
    }

    public User saveUser(User user) {
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode("password"));
        } else if (!user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getName() == null && user.getFirstName() != null) {
            user.setName(user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : ""));
        }
        return userRepository.save(user);
    }

    public User updateUser(Long id, User details) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        user.setFirstName(details.getFirstName());
        user.setLastName(details.getLastName());
        user.setName(details.getFirstName() + " " + (details.getLastName() != null ? details.getLastName() : ""));
        user.setEmail(details.getEmail());
        user.setTelephone(details.getTelephone());
        user.setDepartment(details.getDepartment());
        user.setPost(details.getPost());
        user.setActive(details.isActive());
        if (details.getRole() != null) {
            user.setRole(details.getRole());
        }
        if (details.getPassword() != null && !details.getPassword().isEmpty() && !details.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(details.getPassword()));
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        userRepository.delete(user);
    }
}
