# IncidentFlow - Application de Gestion d'Incidents

IncidentFlow est une application moderne de gestion, déclaration et suivi d'incidents. Elle est dotée d'un concepteur de workflows interactifs (basé sur ReactFlow) et d'une intégration optionnelle avec Keycloak pour la gestion d'identité.

---

## 🚀 Architecture du projet

L'application repose sur les technologies suivantes :
- **Frontend** : React 19, Vite, ReactFlow, Lucide Icons, Vanilla CSS (styles personnalisés).
- **Backend** : Spring Boot 3, Java 17, Spring Security.
- **Bases de données & Services (Docker)** :
  - **PostgreSQL** (Port externe: `5433` / interne: `5432`) : Stockage persistant.
  - **Redis** (Port externe: `6380` / interne: `6379`) : Cache et sessions.
  - **Keycloak** (Port externe: `8180` / interne: `8080`) : Gestion d'identité OIDC.

---

## 🛠️ Prérequis

Assurez-vous de disposer des outils suivants installés sur votre machine :
- **Java 17** (JDK)
- **Maven 3.x**
- **Node.js** (v18 ou supérieure) et `npm`
- **Docker** et **Docker Compose**

---

## ⚙️ Configuration Initiale

Un fichier `.env` se situe à la racine du projet pour configurer les mots de passe de PostgreSQL et de Keycloak :
```env
DB_PASSWORD=incidentflow_secure_db_pass
KC_PASSWORD=admin_secure_keycloak_pass
```

---

## 🏃 Comment lancer l'application

Vous pouvez lancer le projet de deux manières différentes.

### Option 1 : Lancement Hybride (Recommandé pour le Développement)

Cette méthode fait tourner les bases de données (PostgreSQL, Redis) dans Docker, tandis que le Backend et le Frontend tournent sur votre machine locale pour faciliter le rechargement à chaud (*Hot Reload*).

#### 1. Démarrer PostgreSQL et Redis
Depuis la racine du projet, lancez uniquement les conteneurs d'infrastructure nécessaires :
```bash
docker compose up -d incidentflow-postgres incidentflow-redis
```

#### 2. Démarrer le Backend Spring Boot
Dans un nouveau terminal :
```bash
cd backend
mvn spring-boot:run
```
> [!NOTE]
> Par défaut, le profil Spring `dev-mock` est actif. Dans ce mode, l'authentification avec Keycloak est simulée en interne, ce qui permet de tester l'application facilement en local sans avoir besoin de configurer entièrement Keycloak.

#### 3. Démarrer le Frontend React + Vite
Dans un nouveau terminal :
```bash
cd frontend
npm install
npm run dev
```
Le serveur de développement démarrera sur le port **`3000`** (configuré dans [vite.config.js](file:///home/anas/Desktop/stage/App/frontend/vite.config.js)).
Accédez à l'application via : **[http://localhost:3000](http://localhost:3000)**.

---

### Option 2 : Lancement Complet avec Docker Compose

Cette méthode fait tourner le Backend et l'infrastructure dans Docker.

#### 1. Compiler le backend
Puisque le `Dockerfile` du backend copie le fichier `.jar` généré, vous devez d'abord packager l'application :
```bash
cd backend
mvn clean package -DskipTests
cd ..
```

#### 2. Lancer Docker Compose
Démarrez tous les services :
```bash
docker compose up --build
```
Les ports exposés seront :
- **PostgreSQL** : `localhost:5433`
- **Redis** : `localhost:6380`
- **Keycloak** : `http://localhost:8180`
- **Backend API** : `http://localhost:8080`

#### 3. Démarrer le Frontend localement
Le frontend n'étant pas conteneurisé par défaut dans le Docker Compose (déclaré mais commenté), lancez-le manuellement :
```bash
cd frontend
npm install
npm run dev
```
Accédez au frontend sur : **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Comptes de Test (Mode simulation)

En mode de développement hors-ligne (`dev-mock`), l'application initialise automatiquement la base de données avec des comptes fictifs préconfigurés. Utilisez-les pour vous connecter :

| Rôle | Adresse Email | Mot de passe | Description / Département |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `anas@netmar.com` | `password` | Anas Haddou (Informatique) |
| **Responsable** | `sophie.m@netmar.com` | `password` | Sophie Martin (Sécurité SSI) |
| **Opérateur** | `marie.l@netmar.com` | `password` | Marie Laurent (Support client) |
| **Opérateur Médical** | `jean.r@netmar.com` | `password` | Dr. Jean Robert (Urgences médicales) |

---

## 📂 Structure du projet

```text
├── backend/            # Code source Spring Boot (Java)
├── frontend/           # Code source React (Vite)
├── keycloak/           # Fichiers de configuration Keycloak
├── docker-compose.yml  # Fichiers d'orchestration Docker
├── .env                # Variables d'environnement locales
└── README.md           # Ce guide de démarrage
```
