package com.netmar.incidentflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class IncidentFlowBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(IncidentFlowBackendApplication.class, args);
    }
}
