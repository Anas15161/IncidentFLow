# Rôle de Redis dans IncidentFlow

Dans l'application **IncidentFlow**, **Redis** est utilisé comme un **cache en mémoire ultra-rapide** principalement dédié à la **gestion de la blacklist de sessions et à la révocation instantanée des utilisateurs**.

---

## 1. Révocation / Blacklistage des utilisateurs

**Fichier concerné :** [`AuthController.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/controller/AuthController.java)

Lorsque Keycloak émet un événement webhook de gestion des utilisateurs ou lors d'une action explicite de déconnexion :
- **Événements déclencheurs** : `LOGOUT`, `DISABLE_USER`, `DELETE_USER` ou `/api/auth/logout`.
- **Clé enregistrée dans Redis** : `blacklist:user:<email>`
- **TTL (Time-To-Live)** : 1 heure (`1 hour`), garantissant l'expiration automatique de l'entrée sans intervention manuelle.

---

## 2. Validation des sessions en temps réel (Filtre de Sécurité)

**Fichier concerné :** [`SessionValidationFilter.java`](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/SessionValidationFilter.java)

À chaque requête HTTP transmise au backend Spring Boot (hors endpoints d'authentification `/api/auth/*`) :
1. Le filtre extrait l'adresse email depuis le jeton JWT (ou depuis le header `X-Mock-User` en mode développement).
2. Il interroge Redis pour vérifier l'existence de la clé `blacklist:user:<email>`.
3. Si la clé est présente dans Redis, la requête est immédiatement rejetée avec le statut **HTTP 403 Forbidden** :
   ```json
   {
     "message": "Accès refusé. Votre session a été révoquée par l'administrateur Keycloak."
   }
   ```

---

## 3. Pourquoi utiliser Redis plutôt qu'une BDD classique (PostgreSQL) ?

- **Vitesse et Performance (< 1 ms)** : Comme cette vérification a lieu à **chaque requête API**, interroger Redis en RAM évite de surcharger PostgreSQL.
- **Gestion automatique de la durée de vie (TTL)** : Les jetons et sessions obsolètes sont nettoyés automatiquement par Redis à la fin du délai d'une heure.
- **Résilience (Fail-safe)** : En cas d'indisponibilité temporaire de Redis, le filtre intercepte l'exception et laisse passer les requêtes pour ne pas bloquer le système.

---

## 4. Configuration Docker

**Fichier concerné :** [`docker-compose.yml`](file:///home/anas/Desktop/stage/App/docker-compose.yml)

```yaml
  incidentflow-redis:
    image: redis:7-alpine
    container_name: incidentflow-redis
    ports:
      - "6380:6379"
```
- **Port interne** : `6379`
- **Port externe (Host)** : `6380`
