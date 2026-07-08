package com.netmar.incidentflow.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SessionValidationFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redisTemplate;

    public SessionValidationFilter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Exclure les appels à l'API d'authentification elle-même pour éviter les blocages
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = null;

        // 1. Extraire l'email si authentifié par JWT (prod)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) auth.getPrincipal();
            email = jwt.getClaimAsString("email");
            if (email == null) {
                email = jwt.getClaimAsString("preferred_username");
            }
        }

        // 2. Extraire l'email si authentifié en mode mock (dev)
        if (email == null) {
            String mockEmail = request.getHeader("X-Mock-User");
            if (mockEmail != null && !mockEmail.trim().isEmpty()) {
                email = mockEmail.trim();
            }
        }

        // 3. Vérifier s'il est banni dans Redis
        if (email != null) {
            String redisKey = "blacklist:user:" + email;
            Boolean isBlacklisted = false;
            try {
                isBlacklisted = redisTemplate.hasKey(redisKey);
            } catch (Exception ignored) {
                // Si Redis est indisponible, on laisse passer
            }

            if (Boolean.TRUE.equals(isBlacklisted)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"message\": \"Accès refusé. Votre session a été révoquée par l'administrateur Keycloak.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
