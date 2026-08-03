package com.netmar.incidentflow.config;

import com.netmar.incidentflow.model.*;
import com.netmar.incidentflow.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import com.netmar.incidentflow.model.Permission;
import com.netmar.incidentflow.repository.PermissionRepository;
import java.util.Set;
import java.util.HashSet;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final WorkflowRepository workflowRepository;
    private final IncidentRepository incidentRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           WorkflowRepository workflowRepository,
                           IncidentRepository incidentRepository,
                           PermissionRepository permissionRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.workflowRepository = workflowRepository;
        this.incidentRepository = incidentRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Ensure uploads directory exists and has the pre-seeded file
        java.io.File uploadsDir = new java.io.File("uploads");
        if (!uploadsDir.exists()) {
            uploadsDir.mkdirs();
        }
        java.io.File preseededFile = new java.io.File(uploadsDir, "logs_firewall_ssh.txt");
        if (!preseededFile.exists()) {
            try (java.io.FileWriter writer = new java.io.FileWriter(preseededFile)) {
                writer.write("Jun 15 08:23:11 firewall-core sshd[12455]: Invalid user admin from 192.168.1.150 port 55432\n");
                writer.write("Jun 15 08:23:14 firewall-core sshd[12455]: Connection closed by authenticating user admin 192.168.1.150 port 55432 [preauth]\n");
                writer.write("Jun 15 08:24:02 firewall-core sshd[12460]: Invalid user admin from 192.168.1.150 port 55438\n");
                writer.write("Jun 15 08:24:05 firewall-core sshd[12460]: Connection closed by authenticating user admin 192.168.1.150 port 55438 [preauth]\n");
                writer.write("Jun 15 08:25:00 firewall-core sshd[12472]: Invalid user test from 192.168.1.150 port 55442\n");
                writer.write("Jun 15 08:25:01 firewall-core sshd[12472]: Connection closed by authenticating user test 192.168.1.150 port 55442 [preauth]\n");
                writer.write("Jun 15 08:26:30 firewall-core sshd[12480]: Connection closed by authenticating user admin 192.168.1.150 port 55450 [preauth]\n");
            }
        }

        // 0. Initialiser les permissions granulaires RBAC
        Permission pDash = savePermissionIfAbsent("PAGE_DASHBOARD", "Accès Tableau de Bord", "NAVIGATION", "Visualiser le tableau de bord et les KPI");
        Permission pInc = savePermissionIfAbsent("PAGE_INCIDENTS", "Accès Incidents", "NAVIGATION", "Accéder à la liste et aux filtres d'incidents");
        Permission pWf = savePermissionIfAbsent("PAGE_WORKFLOWS", "Accès Workflows", "NAVIGATION", "Accéder au concepteur et gestionnaire de workflows");
        Permission pUsers = savePermissionIfAbsent("PAGE_USERS", "Accès Utilisateurs & RBAC", "NAVIGATION", "Accéder à la gestion des comptes et la matrice RBAC");
        Permission pSla = savePermissionIfAbsent("PAGE_SLA", "Accès Module SLA", "NAVIGATION", "Accéder au suivi et règles SLA");

        Permission pIncCreate = savePermissionIfAbsent("INCIDENT_CREATE", "Déclarer Incident", "INCIDENTS", "Créer et soumettre un nouvel incident");
        Permission pIncEdit = savePermissionIfAbsent("INCIDENT_EDIT", "Modifier Incident", "INCIDENTS", "Modifier les détails d'un incident existant");
        Permission pIncDelete = savePermissionIfAbsent("INCIDENT_DELETE", "Supprimer Incident", "INCIDENTS", "Supprimer définitivement un incident");
        Permission pIncPdf = savePermissionIfAbsent("INCIDENT_EXPORT_PDF", "Exporter PDF", "INCIDENTS", "Générer et télécharger le rapport PDF");
        Permission pIncMed = savePermissionIfAbsent("INCIDENT_VIEW_MEDICAL", "Voir Incidents Médicaux", "INCIDENTS", "Accéder et traiter la catégorie médicale confidentielle");

        Permission pRbacEdit = savePermissionIfAbsent("RBAC_MATRIX_EDIT", "Modifier Matrice RBAC", "ADMINISTRATION", "Cocher/Décocher les permissions des rôles dans la matrice RBAC");
        Permission pWfEdit = savePermissionIfAbsent("WORKFLOW_EDIT", "Concevoir & Publier Workflows", "ADMINISTRATION", "Créer et modifier des modèles de workflows dynamiques");

        // 1. Initialiser les roles
        if (roleRepository.count() == 0) {
            Role admin = Role.builder().name("Administrateur").description("Accès total au système, gestion des utilisateurs, des rôles et configuration globale.")
                    .permissions(new HashSet<>(Set.of(pDash, pInc, pWf, pUsers, pSla, pIncCreate, pIncEdit, pIncDelete, pIncPdf, pIncMed, pRbacEdit, pWfEdit)))
                    .build();
            Role resp = Role.builder().name("Responsable").description("Supervision des équipes, validation des workflows et suivi des métriques.")
                    .permissions(new HashSet<>(Set.of(pDash, pInc, pWf, pSla, pIncCreate, pIncEdit, pIncPdf, pIncMed, pWfEdit)))
                    .build();
            Role ope = Role.builder().name("Opérateur").description("Traitement des incidents réseau/système, mise à jour des statuts et escalade.")
                    .permissions(new HashSet<>(Set.of(pDash, pInc, pSla, pIncCreate, pIncEdit, pIncPdf)))
                    .build();
            Role med = Role.builder().name("Opérateur médical").description("Prise en charge spécialisée des incidents et urgences médicales.")
                    .permissions(new HashSet<>(Set.of(pDash, pInc, pSla, pIncCreate, pIncEdit, pIncPdf, pIncMed)))
                    .build();

            roleRepository.save(admin);
            roleRepository.save(resp);
            roleRepository.save(ope);
            roleRepository.save(med);
        } else {
            // S'assurer que les rôles existants ont bien leurs permissions attribuées
            roleRepository.findByName("Administrateur").ifPresent(r -> {
                if (r.getPermissions() == null || r.getPermissions().isEmpty()) {
                    r.setPermissions(new HashSet<>(Set.of(pDash, pInc, pWf, pUsers, pSla, pIncCreate, pIncEdit, pIncDelete, pIncPdf, pIncMed, pRbacEdit, pWfEdit)));
                    roleRepository.save(r);
                }
            });
            roleRepository.findByName("Responsable").ifPresent(r -> {
                if (r.getPermissions() == null || r.getPermissions().isEmpty()) {
                    r.setPermissions(new HashSet<>(Set.of(pDash, pInc, pWf, pSla, pIncCreate, pIncEdit, pIncPdf, pIncMed, pWfEdit)));
                    roleRepository.save(r);
                }
            });
            roleRepository.findByName("Opérateur").ifPresent(r -> {
                if (r.getPermissions() == null || r.getPermissions().isEmpty()) {
                    r.setPermissions(new HashSet<>(Set.of(pDash, pInc, pSla, pIncCreate, pIncEdit, pIncPdf)));
                    roleRepository.save(r);
                }
            });
            roleRepository.findByName("Opérateur médical").ifPresent(r -> {
                if (r.getPermissions() == null || r.getPermissions().isEmpty()) {
                    r.setPermissions(new HashSet<>(Set.of(pDash, pInc, pSla, pIncCreate, pIncEdit, pIncPdf, pIncMed)));
                    roleRepository.save(r);
                }
            });
        }

        Role adminRole = roleRepository.findByName("Administrateur").orElseThrow();
        Role respRole = roleRepository.findByName("Responsable").orElseThrow();
        Role opeRole = roleRepository.findByName("Opérateur").orElseThrow();
        Role medRole = roleRepository.findByName("Opérateur médical").orElseThrow();

        // 2. Initialiser les utilisateurs
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .name("Anas Haddou")
                    .firstName("Anas")
                    .lastName("Haddou")
                    .department("Informatique")
                    .post("Administrateur Système")
                    .email("anas@netmar.com")
                    .password(passwordEncoder.encode("password"))
                    .role(adminRole)
                    .active(true)
                    .telephone("+33 6 12 34 56 78")
                    .avatarColor("bg-blue-600")
                    .build());

            userRepository.save(User.builder()
                    .name("Sophie Martin")
                    .firstName("Sophie")
                    .lastName("Martin")
                    .department("Sécurité")
                    .post("Responsable SSI")
                    .email("sophie.m@netmar.com")
                    .password(passwordEncoder.encode("password"))
                    .role(respRole)
                    .active(true)
                    .telephone("+33 6 98 76 54 32")
                    .avatarColor("bg-purple-600")
                    .build());

            userRepository.save(User.builder()
                    .name("Marie Laurent")
                    .firstName("Marie")
                    .lastName("Laurent")
                    .department("Support client")
                    .post("Opératrice Réseau")
                    .email("marie.l@netmar.com")
                    .password(passwordEncoder.encode("password"))
                    .role(opeRole)
                    .active(true)
                    .telephone("+33 6 45 89 23 11")
                    .avatarColor("bg-emerald-600")
                    .build());

            userRepository.save(User.builder()
                    .name("Dr. Jean Robert")
                    .firstName("Jean")
                    .lastName("Robert")
                    .department("Urgences médicales")
                    .post("Médecin Coordinateur")
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
            // Workflow Unique Standard
            Workflow wfStandard = Workflow.builder()
                    .name("Workflow Standard")
                    .category("Général")
                    .active(true)
                    .build();
            
            wfStandard.setStates(List.of(
                    WorkflowState.builder().name("Nouveau").label("Nouveau").colorClass("bg-red-50 text-red-600 border-red-200").workflow(wfStandard).build(),
                    WorkflowState.builder().name("Assigné").label("Assigné").colorClass("bg-amber-50 text-amber-500 border-amber-200").workflow(wfStandard).build(),
                    WorkflowState.builder().name("En cours").label("En cours").colorClass("bg-blue-50 text-blue-600 border-blue-200").workflow(wfStandard).build(),
                    WorkflowState.builder().name("Résolu").label("Résolu").colorClass("bg-emerald-50 text-emerald-600 border-emerald-200").workflow(wfStandard).build(),
                    WorkflowState.builder().name("Clôturé").label("Clôturé").colorClass("bg-slate-50 text-slate-600 border-slate-200").workflow(wfStandard).build()
            ));

            wfStandard.setTransitions(List.of(
                    WorkflowTransition.builder().fromState("Nouveau").toState("Assigné").workflow(wfStandard).build(),
                    WorkflowTransition.builder().fromState("Assigné").toState("En cours").workflow(wfStandard).build(),
                    WorkflowTransition.builder().fromState("En cours").toState("Résolu").workflow(wfStandard).build(),
                    WorkflowTransition.builder().fromState("Résolu").toState("Clôturé").roleRequired("Administrateur").workflow(wfStandard).build(),
                    WorkflowTransition.builder().fromState("Nouveau").toState("En cours").workflow(wfStandard).build(),
                    WorkflowTransition.builder().fromState("Assigné").toState("Nouveau").workflow(wfStandard).build(),
                    WorkflowTransition.builder().fromState("En cours").toState("Assigné").workflow(wfStandard).build(),
                    WorkflowTransition.builder().fromState("Résolu").toState("En cours").workflow(wfStandard).build()
            ));
            
            wfStandard = workflowRepository.save(wfStandard);
        }

        Workflow wfStandard = workflowRepository.findAll().isEmpty() ? null : workflowRepository.findAll().get(0);

        // 4. Initialiser quelques incidents factices issus de la maquette
        if (incidentRepository.count() == 0) {
            // Incident 1: Warning state (15 minutes left)
            Incident inc1 = Incident.builder()
                    .incidentCode("INC-2026-001")
                    .title("Panne du serveur DHCP principal")
                    .description("Le serveur DHCP principal de la zone A ne répond plus, empêchant les nouveaux équipements de se connecter au réseau local.")
                    .category("Réseau")
                    .priority("Critical")
                    .severity("Critique")
                    .status("Nouveau")
                    .author(marie)
                    .workflow(wfStandard)
                    .slaDueAt(LocalDateTime.now().plusMinutes(15))
                    .build();

            inc1.setHistory(List.of(
                    IncidentHistory.builder().action("Incident déclaré").username(marie.getName()).incident(inc1).build()
            ));
            incidentRepository.save(inc1);

            // Incident 2: Normal state (1h30 left)
            Incident inc2 = Incident.builder()
                    .incidentCode("INC-2026-002")
                    .title("Tentative d'intrusion brute force - Pare-feu externe")
                    .description("Plus de 5000 tentatives d'authentification échouées sur le port SSH détectées en moins de 10 minutes depuis plusieurs adresses IP externes suspectes.")
                    .category("Sécurité")
                    .priority("Critical")
                    .severity("Critique")
                    .status("En cours")
                    .author(sophie)
                    .assignedTo(anas)
                    .workflow(wfStandard)
                    .slaDueAt(LocalDateTime.now().plusHours(1).plusMinutes(30))
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
                    Attachment.builder()
                        .filename("logs_firewall_ssh.txt")
                        .filePath(new java.io.File("uploads/logs_firewall_ssh.txt").getAbsolutePath())
                        .fileSize("42 KB")
                        .contentType("text/plain")
                        .incident(inc2)
                        .build()
            ));
            incidentRepository.save(inc2);

            // Incident 3: Breached state (45 minutes overdue)
            Incident inc3 = Incident.builder()
                    .incidentCode("INC-2026-003")
                    .title("Urgences Médicales - Incident d'inhalation toxique")
                    .description("Fuite chimique suspectée dans le laboratoire de test de niveau 2. Deux opérateurs présentent des symptômes de toux et vertiges.")
                    .category("Médical")
                    .priority("Critical")
                    .severity("Critique")
                    .status("En cours")
                    .author(marie)
                    .assignedTo(drJean)
                    .workflow(wfStandard)
                    .slaDueAt(LocalDateTime.now().minusMinutes(45))
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
                    .severity("Important")
                    .status("Résolu")
                    .author(anas)
                    .assignedTo(anas)
                    .workflow(wfStandard)
                    .slaDueAt(LocalDateTime.now().plusHours(12))
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

    private Permission savePermissionIfAbsent(String code, String label, String module, String description) {
        return permissionRepository.findByCode(code)
                .orElseGet(() -> permissionRepository.save(Permission.builder()
                        .code(code)
                        .label(label)
                        .module(module)
                        .description(description)
                        .build()));
    }
}
