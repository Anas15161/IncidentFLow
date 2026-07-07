package com.netmar.incidentflow.config;

import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final WorkflowRepository workflowRepository;
    private final IncidentRepository incidentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           WorkflowRepository workflowRepository,
                           IncidentRepository incidentRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.workflowRepository = workflowRepository;
        this.incidentRepository = incidentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Initialiser les roles
        if (roleRepository.count() == 0) {
            roleRepository.save(Role.builder().name("Administrateur").build());
            roleRepository.save(Role.builder().name("Responsable").build());
            roleRepository.save(Role.builder().name("Opérateur").build());
            roleRepository.save(Role.builder().name("Opérateur médical").build());
        }

        Role adminRole = roleRepository.findByName("Administrateur").orElseThrow();
        Role respRole = roleRepository.findByName("Responsable").orElseThrow();
        Role opeRole = roleRepository.findByName("Opérateur").orElseThrow();
        Role medRole = roleRepository.findByName("Opérateur médical").orElseThrow();

        // 2. Initialiser les utilisateurs
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .name("Anas Haddou")
                    .email("anas@netmar.com")
                    .password(passwordEncoder.encode("password"))
                    .role(adminRole)
                    .active(true)
                    .telephone("+33 6 12 34 56 78")
                    .avatarColor("bg-blue-600")
                    .build());

            userRepository.save(User.builder()
                    .name("Sophie Martin")
                    .email("sophie.m@netmar.com")
                    .password(passwordEncoder.encode("password"))
                    .role(respRole)
                    .active(true)
                    .telephone("+33 6 98 76 54 32")
                    .avatarColor("bg-purple-600")
                    .build());

            userRepository.save(User.builder()
                    .name("Marie Laurent")
                    .email("marie.l@netmar.com")
                    .password(passwordEncoder.encode("password"))
                    .role(opeRole)
                    .active(true)
                    .telephone("+33 6 45 89 23 11")
                    .avatarColor("bg-emerald-600")
                    .build());

            userRepository.save(User.builder()
                    .name("Dr. Jean Robert")
                    .email("jean.r@netmar.com")
                    .password(passwordEncoder.encode("password"))
                    .role(medRole)
                    .active(true)
                    .telephone("+33 6 77 11 22 33")
                    .avatarColor("bg-red-600")
                    .build());
        }

        User anas = userRepository.findByEmail("anas@netmar.com").orElseThrow();
        User marie = userRepository.findByEmail("marie.l@netmar.com").orElseThrow();
        User sophie = userRepository.findByEmail("sophie.m@netmar.com").orElseThrow();
        User drJean = userRepository.findByEmail("jean.r@netmar.com").orElseThrow();

        // 3. Initialiser les Workflows
        if (workflowRepository.count() == 0) {
            // Workflow Réseau
            Workflow wfReseau = Workflow.builder()
                    .name("Workflow standard Réseau")
                    .category("Réseau")
                    .active(true)
                    .build();
            
            wfReseau.setStates(List.of(
                    WorkflowState.builder().name("Nouveau").label("Nouveau").colorClass("bg-red-50 text-red-600 border-red-200").workflow(wfReseau).build(),
                    WorkflowState.builder().name("Assigné").label("Assigné").colorClass("bg-amber-50 text-amber-500 border-amber-200").workflow(wfReseau).build(),
                    WorkflowState.builder().name("En cours").label("En cours").colorClass("bg-blue-50 text-blue-600 border-blue-200").workflow(wfReseau).build(),
                    WorkflowState.builder().name("Résolu").label("Résolu").colorClass("bg-emerald-50 text-emerald-600 border-emerald-200").workflow(wfReseau).build(),
                    WorkflowState.builder().name("Clôturé").label("Clôturé").colorClass("bg-slate-50 text-slate-600 border-slate-200").workflow(wfReseau).build()
            ));

            wfReseau.setTransitions(List.of(
                    WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").workflow(wfReseau).build(),
                    WorkflowTransition.builder().fromState("Assigné").toState("En cours").workflow(wfReseau).build(),
                    WorkflowTransition.builder().fromState("En cours").toState("Résolu").workflow(wfReseau).build(),
                    WorkflowTransition.builder().fromState("Résolu").toState("Clôturé").roleRequired("Administrateur").workflow(wfReseau).build(),
                    WorkflowTransition.builder().fromState("Nouveau").toState("En cours").workflow(wfReseau).build(),
                    WorkflowTransition.builder().fromState("Assigné").toState("Nouveau").workflow(wfReseau).build(),
                    WorkflowTransition.builder().fromState("En cours").toState("Assigné").workflow(wfReseau).build(),
                    WorkflowTransition.builder().fromState("Résolu").toState("En cours").workflow(wfReseau).build()
            ));
            
            workflowRepository.save(wfReseau);

            // Workflow Sécurité
            Workflow wfSecurite = Workflow.builder()
                    .name("Workflow standard Sécurité")
                    .category("Sécurité")
                    .active(true)
                    .build();

            wfSecurite.setStates(List.of(
                    WorkflowState.builder().name("Nouveau").label("Nouveau").colorClass("bg-red-50 text-red-600 border-red-200").workflow(wfSecurite).build(),
                    WorkflowState.builder().name("Assigné").label("Assigné").colorClass("bg-amber-50 text-amber-500 border-amber-200").workflow(wfSecurite).build(),
                    WorkflowState.builder().name("En cours").label("En cours").colorClass("bg-blue-50 text-blue-600 border-blue-200").workflow(wfSecurite).build(),
                    WorkflowState.builder().name("Résolu").label("Résolu").colorClass("bg-emerald-50 text-emerald-600 border-emerald-200").workflow(wfSecurite).build(),
                    WorkflowState.builder().name("Clôturé").label("Clôturé").colorClass("bg-slate-50 text-slate-600 border-slate-200").workflow(wfSecurite).build()
            ));

            wfSecurite.setTransitions(List.of(
                    WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").workflow(wfSecurite).build(),
                    WorkflowTransition.builder().fromState("Assigné").toState("En cours").requiresComment(true).workflow(wfSecurite).build(),
                    WorkflowTransition.builder().fromState("En cours").toState("Résolu").requiresComment(true).workflow(wfSecurite).build(),
                    WorkflowTransition.builder().fromState("Résolu").toState("Clôturé").roleRequired("Administrateur").workflow(wfSecurite).build()
            ));

            workflowRepository.save(wfSecurite);

            // Workflow Système
            Workflow wfSysteme = Workflow.builder()
                    .name("Workflow standard Système")
                    .category("Système")
                    .active(true)
                    .build();

            wfSysteme.setStates(List.of(
                    WorkflowState.builder().name("Nouveau").label("Nouveau").colorClass("bg-red-50 text-red-600 border-red-200").workflow(wfSysteme).build(),
                    WorkflowState.builder().name("Assigné").label("Assigné").colorClass("bg-amber-50 text-amber-500 border-amber-200").workflow(wfSysteme).build(),
                    WorkflowState.builder().name("En cours").label("En cours").colorClass("bg-blue-50 text-blue-600 border-blue-200").workflow(wfSysteme).build(),
                    WorkflowState.builder().name("Résolu").label("Résolu").colorClass("bg-emerald-50 text-emerald-600 border-emerald-200").workflow(wfSysteme).build(),
                    WorkflowState.builder().name("Clôturé").label("Clôturé").colorClass("bg-slate-50 text-slate-600 border-slate-200").workflow(wfSysteme).build()
            ));

            wfSysteme.setTransitions(List.of(
                    WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").workflow(wfSysteme).build(),
                    WorkflowTransition.builder().fromState("Assigné").toState("En cours").workflow(wfSysteme).build(),
                    WorkflowTransition.builder().fromState("En cours").toState("Résolu").workflow(wfSysteme).build(),
                    WorkflowTransition.builder().fromState("Résolu").toState("Clôturé").roleRequired("Administrateur").workflow(wfSysteme).build()
            ));

            workflowRepository.save(wfSysteme);

            // Workflow Médical
            Workflow wfMedical = Workflow.builder()
                    .name("Workflow standard Médical")
                    .category("Médical")
                    .active(true)
                    .build();

            wfMedical.setStates(List.of(
                    WorkflowState.builder().name("Nouveau").label("Nouveau").colorClass("bg-red-50 text-red-600 border-red-200").workflow(wfMedical).build(),
                    WorkflowState.builder().name("Assigné").label("Assigné").colorClass("bg-amber-50 text-amber-500 border-amber-200").workflow(wfMedical).build(),
                    WorkflowState.builder().name("En cours").label("En cours").colorClass("bg-blue-50 text-blue-600 border-blue-200").workflow(wfMedical).build(),
                    WorkflowState.builder().name("Résolu").label("Résolu").colorClass("bg-emerald-50 text-emerald-600 border-emerald-200").workflow(wfMedical).build(),
                    WorkflowState.builder().name("Clôturé").label("Clôturé").colorClass("bg-slate-50 text-slate-600 border-slate-200").workflow(wfMedical).build()
            ));

            wfMedical.setTransitions(List.of(
                    WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").workflow(wfMedical).build(),
                    WorkflowTransition.builder().fromState("Assigné").toState("En cours").workflow(wfMedical).build(),
                    WorkflowTransition.builder().fromState("En cours").toState("Résolu").roleRequired("Opérateur médical").requiresComment(true).workflow(wfMedical).build(),
                    WorkflowTransition.builder().fromState("Résolu").toState("Clôturé").roleRequired("Opérateur médical").workflow(wfMedical).build()
            ));

            workflowRepository.save(wfMedical);
        }

        // 4. Initialiser quelques incidents factices issus de la maquette
        if (incidentRepository.count() == 0) {
            // Incident 1
            Incident inc1 = Incident.builder()
                    .incidentCode("INC-2026-001")
                    .title("Panne du serveur DHCP principal")
                    .description("Le serveur DHCP principal de la zone A ne répond plus, empêchant les nouveaux équipements de se connecter au réseau local.")
                    .category("Réseau")
                    .priority("Critical")
                    .status("Nouveau")
                    .author(marie)
                    .build();

            inc1.setHistory(List.of(
                    IncidentHistory.builder().action("Incident déclaré").username(marie.getName()).incident(inc1).build()
            ));
            incidentRepository.save(inc1);

            // Incident 2
            Incident inc2 = Incident.builder()
                    .incidentCode("INC-2026-002")
                    .title("Tentative d'intrusion brute force - Pare-feu externe")
                    .description("Plus de 5000 tentatives d'authentification échouées sur le port SSH détectées en moins de 10 minutes depuis plusieurs adresses IP externes suspectes.")
                    .category("Sécurité")
                    .priority("Critical")
                    .status("En cours")
                    .author(sophie)
                    .assignedTo(anas)
                    .build();

            inc2.setHistory(List.of(
                    IncidentHistory.builder().action("Incident déclaré").username(sophie.getName()).incident(inc2).build(),
                    IncidentHistory.builder().action("Assigné à Anas Haddou").username(sophie.getName()).incident(inc2).build(),
                    IncidentHistory.builder().action("Statut modifié à En cours").username(anas.getName()).incident(inc2).build()
            ));
            
            inc2.setComments(List.of(
                    Comment.builder().content("Blocage temporaire des adresses IPs suspectes mis en place au niveau du pare-feu principal.").author(anas).incident(inc2).build()
            ));

            inc2.setAttachments(List.of(
                    Attachment.builder().filename("logs_firewall_ssh.txt").filePath("/uploads/logs_firewall_ssh.txt").fileSize("42 KB").contentType("text/plain").incident(inc2).build()
            ));
            incidentRepository.save(inc2);

            // Incident 3 (Cas Médical avec affectation automatique)
            Incident inc3 = Incident.builder()
                    .incidentCode("INC-2026-003")
                    .title("Urgences Médicales - Incident d'inhalation toxique")
                    .description("Fuite chimique suspectée dans le laboratoire de test de niveau 2. Deux opérateurs présentent des symptômes de toux et vertiges.")
                    .category("Médical")
                    .priority("Critical")
                    .status("En cours")
                    .author(marie)
                    .assignedTo(drJean)
                    .build();

            inc3.setHistory(List.of(
                    IncidentHistory.builder().action("Incident déclaré").username(marie.getName()).incident(inc3).build(),
                    IncidentHistory.builder().action("Assigné automatiquement à Dr. Jean Robert (Règle d'incident médical)").username("Système").incident(inc3).build(),
                    IncidentHistory.builder().action("Statut modifié à En cours").username(drJean.getName()).incident(inc3).build()
            ));

            inc3.setComments(List.of(
                    Comment.builder().content("Évacuation de la zone ordonnée. Les deux victimes sont en cours de transfert vers l'unité de soins d'urgence.").author(drJean).incident(inc3).build()
            ));
            incidentRepository.save(inc3);

            // Incident 4 (Résolu)
            Incident inc4 = Incident.builder()
                    .incidentCode("INC-2026-004")
                    .title("Saturation espace disque - VM de Base de Données")
                    .description("Espace disque utilisé à 96% sur le volume principal contenant les données de test.")
                    .category("Système")
                    .priority("High")
                    .status("Résolu")
                    .author(anas)
                    .assignedTo(anas)
                    .build();

            inc4.setHistory(List.of(
                    IncidentHistory.builder().action("Incident déclaré").username(anas.getName()).incident(inc4).build(),
                    IncidentHistory.builder().action("Statut modifié à En cours").username(anas.getName()).incident(inc4).build(),
                    IncidentHistory.builder().action("Statut modifié à Résolu").username(anas.getName()).incident(inc4).build()
            ));

            inc4.setComments(List.of(
                    Comment.builder().content("Nettoyage des anciens fichiers de logs et des packages temporaires effectués. Espace disque disponible repassé à 42%.").author(anas).incident(inc4).build()
            ));
            incidentRepository.save(inc4);
        }
    }
}
