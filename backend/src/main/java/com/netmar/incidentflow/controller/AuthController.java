package com.netmar.incidentflow.controller;

import com.netmar.incidentflow.model.User;
import com.netmar.incidentflow.repository.UserRepository;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, StringRedisTemplate redisTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.redisTemplate = redisTemplate;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "L'adresse email est obligatoire."));
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le mot de passe est obligatoire."));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Identifiants invalides."));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Identifiants invalides."));
        }

        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Ce compte est désactivé."));
        }

        // Simuler un token JWT
        String mockToken = "mock-jwt-token-for-" + user.getEmail();

        return ResponseEntity.ok(Map.of(
            "token", mockToken,
            "user", user,
            "expiresIn", 3600
        ));
    }

    @PostMapping("/keycloak-event")
    public ResponseEntity<?> handleKeycloakEvent(@RequestBody Map<String, Object> event) {
        String type = (String) event.get("type");
        String email = (String) event.get("email");
        String userId = (String) event.get("userId");

        if (email == null && event.get("details") instanceof Map) {
            Map<?, ?> details = (Map<?, ?>) event.get("details");
            email = (String) details.get("email");
            if (email == null) {
                email = (String) details.get("username");
            }
        }

        if (email == null && userId != null) {
            try {
                Optional<User> u = userRepository.findById(Long.parseLong(userId));
                if (u.isPresent()) {
                    email = u.get().getEmail();
                }
            } catch (Exception ignored) {}
        }

        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email utilisateur introuvable dans l'événement."));
        }

        // Si l'utilisateur est déconnecté ou désactivé
        if ("LOGOUT".equalsIgnoreCase(type) || "DISABLE_USER".equalsIgnoreCase(type) || "DELETE_USER".equalsIgnoreCase(type)) {
            String redisKey = "blacklist:user:" + email;
            try {
                redisTemplate.opsForValue().set(redisKey, "true", 1, java.util.concurrent.TimeUnit.HOURS);
            } catch (Exception ignored) {}

            if ("DISABLE_USER".equalsIgnoreCase(type) || "DELETE_USER".equalsIgnoreCase(type)) {
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setActive(false);
                    userRepository.save(user);
                }
            }
        }

        return ResponseEntity.ok(Map.of("message", "Événement Keycloak traité avec succès."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Déconnexion réussie."));
    }

    @Getter
    @Setter
    public static class LoginRequest {
        private String email;
        private String password;
    }
}
