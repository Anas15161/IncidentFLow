# Fonctionnement de Keycloak dans IncidentFlow

Dans l'application **IncidentFlow**, **Keycloak** est utilisé comme serveur de gestion des identités et des accès (**IAM** - *Identity & Access Management*) s'appuyant sur les standards **OAuth2 / OpenID Connect (OIDC)**.

---

## 1. Architecture & Rôle de Keycloak

Keycloak assure la sécurité globale du système :
- **Gestion centralisée des identités (SSO)** : Inscription, connexion et gestion des comptes utilisateurs.
- **Émission de tokens JWT** : Après authentification, Keycloak émet un jeton d'accès au format **JWT** (*JSON Web Token*) contenant l'identité et les rôles de l'utilisateur.
- **Vérification par le Backend (Profil `prod`)** :
  Dans [`SecurityConfig.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/SecurityConfig.java#L49-L60), le backend Spring Boot agit en tant que *OAuth2 Resource Server*. Il valide la signature de chaque jeton JWT via les clés publiques de Keycloak (`/realms/IncidentFlow/protocol/openid-connect/certs`).

---

## 2. Intégration Webhook & Révocation Instantanée

Pour gérer les déconnexions et blocages d'utilisateurs en temps réel :

1. **Événements Keycloak** : Lors d'une déconnexion (`LOGOUT`), d'un blocage (`DISABLE_USER`) ou d'une suppression (`DELETE_USER`), Keycloak envoie un webhook à l'endpoint `POST /api/auth/keycloak-event`.
2. **Traitement par AuthController** :
   Dans [`AuthController.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/controller/AuthController.java#L63-L107) :
   - L'email de l'utilisateur est enregistré dans Redis avec la clé `blacklist:user:<email>` pour une durée de **1 heure**.
   - Si le compte est désactivé ou supprimé, son statut est mis à jour (`active = false`) dans la base de données PostgreSQL locale.
3. **Blocage immédiat par le Filtre de Session** :
   Dans [`SessionValidationFilter.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/SessionValidationFilter.java#L56-L70), chaque requête vers l'API est vérifiée contre Redis. Si l'email est blacklisté, l'accès est rejeté immédiatement avec un code **HTTP 403 Forbidden**.

---

## 3. Fonctionnement hors-ligne : Le mode `dev-mock` (sans Keycloak)

Tant que l'application n'est pas exécutée en profil `prod`, elle utilise le profil actif par défaut **`dev-mock`** ([`application.properties`](file:///home/anas/Desktop/stage/App/backend/src/main/resources/application.properties#L12)). Ce mode permet de développer et tester l'application sans lancer Keycloak :

### 1. Autorisation globale des requêtes
Dans [`SecurityConfig.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/SecurityConfig.java#L36-L46), la configuration `mockSecurityFilterChain` laisse passer toutes les requêtes HTTP sans exiger de token JWT Keycloak (`auth.anyRequest().permitAll()`).

### 2. Simulation de l'utilisateur via `X-Mock-User`
Au lieu de lire un jeton JWT, l'application extrait l'email de l'utilisateur connecté via l'en-tête HTTP personnalisé `X-Mock-User` (ex: `X-Mock-User: operator@netmar.com`). Cet email est utilisé par [`SessionValidationFilter.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/SessionValidationFilter.java#L48-L54) pour vérifier le statut de la session dans Redis.

### 3. Données de démonstration pré-chargées
La classe [`DataInitializer.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/DataInitializer.java) pré-alimente la base PostgreSQL avec des utilisateurs de test (Administrateur, Responsable, Opérateur, etc.) pour permettre une utilisation immédiate de l'application.

---

## 4. Tableau comparatif des profils

| Profil Spring | Usage | Authentification & Sécurité |
| :--- | :--- | :--- |
| **`dev-mock`** *(Actif par défaut)* | Développement local hors-ligne | Désactivation de la validation JWT strict. Utilisation de `X-Mock-User` et données de test pré-remplies. |
| **`prod`** | Production / Recette | Validation stricte des **jetons JWT Keycloak** (`Authorization: Bearer <token>`). |

---

## 5. Passer du mode `dev-mock` au mode `prod`

1. Démarrer le conteneur Keycloak :
   ```bash
   docker compose up -d incidentflow-keycloak
   ```
2. Lancer le backend Spring Boot avec le profil `prod` :
   ```bash
   SPRING_PROFILES_ACTIVE=prod
   ```

---

## 6. Configuration Infrastructure Docker

**Fichier concerné :** [`docker-compose.yml`](file:///home/anas/Desktop/stage/App/docker-compose.yml)

Keycloak est exécuté dans un conteneur dédié :
- **Image Docker** : `quay.io/keycloak/keycloak:latest`
- **Port externe** : `8180` (Interface d'administration et endpoints OIDC sur `http://localhost:8180`)
- **Port interne** : `8080`
- **Realm d'application** : `IncidentFlow`
