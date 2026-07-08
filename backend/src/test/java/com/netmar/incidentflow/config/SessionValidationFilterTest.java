package com.netmar.incidentflow.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.Mockito.*;

public class SessionValidationFilterTest {

    private StringRedisTemplate redisTemplate;
    private SessionValidationFilter filter;
    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;

    @BeforeEach
    public void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        filter = new SessionValidationFilter(redisTemplate);
        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        filterChain = mock(FilterChain.class);
    }

    @Test
    public void testAuthPathBypassed() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/auth/login");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    public void testUserNotBlacklistedAllowsRequest() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/incidents");
        when(request.getHeader("X-Mock-User")).thenReturn("operator@netmar.com");
        when(redisTemplate.hasKey("blacklist:user:operator@netmar.com")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    public void testUserBlacklistedBlocksRequest() throws Exception {
        when(request.getRequestURI()).thenReturn("/api/incidents");
        when(request.getHeader("X-Mock-User")).thenReturn("banned@netmar.com");
        when(redisTemplate.hasKey("blacklist:user:banned@netmar.com")).thenReturn(true);

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        when(response.getWriter()).thenReturn(pw);

        filter.doFilterInternal(request, response, filterChain);

        verify(response, times(1)).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }
}
