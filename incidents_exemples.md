Ran command: `^[[200~cd backend~`
Ran command: `cd backend`
Ran command: `mvn clean package -DskipTests`
Ran command: `cd ..`
Ran command: `cd frontend`

I will look at the workspace to see what kinds of incidents, fields, or categories are defined in the project. This will help me give you relevant, real examples that you can use.

Listed directory App

I'll examine the project [README.md](file:///home/anas/Desktop/stage/App/README.md) to understand the context of the IncidentFlow project and see what types of incidents it handles.

Viewed README.md:1-131

I will search the backend source code using `grep_search` to identify key fields, status values, categories, or severity levels related to incidents. This will allow me to give you exact examples matching the fields in your application.

Searched for "class Incident"

I'll view [Incident.java](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/model/Incident.java) to check all attributes of an Incident.

Viewed Incident.java:1-101

I will search the backend source code for categories used in initialization or tests to find pre-configured categories.

Searched for "category("

I will view [DataInitializer.java](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/DataInitializer.java) to see exactly how these default categories and incidents are configured in the code. This will allow me to provide you with realistic templates.

Viewed DataInitializer.java:1-338

Voici des exemples concrets d'incidents que vous pouvez créer sur votre site **IncidentFlow**, classés selon les **catégories** et les **niveaux de priorité** configurés dans votre application (backend).

Les règles de délai d'action (SLA) définies dans votre entité [Incident.java](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/model/Incident.java) s'appliqueront automatiquement à ces exemples :
* **Priorité Critical** : 1 heure de délai de résolution pour la catégorie *Médical*, 2 heures pour les autres.
* **Priorité High** : 12 heures.
* **Priorité Medium** : 36 heures.
* **Priorité Low** : 72 heures.

---

### 🌐 1. Catégorie : **Réseau**

* **Exemple A (Priorité : `Critical` — SLA : 2h)**
  * **Titre :** Panne du serveur DHCP principal de la zone A
  * **Description :** Le serveur DHCP principal ne répond plus, empêchant tous les nouveaux équipements et postes de travail de se connecter au réseau local de l'entreprise.
* **Exemple B (Priorité : `High` — SLA : 12h)**
  * **Titre :** Perte de redondance sur la liaison fibre optique
  * **Description :** Le lien de communication principal est tombé. Le trafic réseau a basculé automatiquement sur le lien de secours (4G/Satellite), mais la bande passante globale est fortement dégradée.

---

### 🛡️ 2. Catégorie : **Sécurité**

* **Exemple A (Priorité : `Critical` — SLA : 2h)**
  * **Titre :** Attaque par force brute détectée sur le pare-feu SSH
  * **Description :** Plus de 5 000 tentatives de connexion SSH échouées en moins de 10 minutes depuis plusieurs adresses IP externes suspectes. Une analyse de logs est requise.
* **Exemple B (Priorité : `High` — SLA : 12h)**
  * **Titre :** Alerte DLP - Suspicion d'exfiltration de données confidentielles
  * **Description :** Le système de prévention des fuites de données a détecté un volume inhabituellement élevé de transferts de fichiers sensibles vers un cloud personnel depuis le poste de l'utilisateur X.

---

### 💻 3. Catégorie : **Système**

* **Exemple A (Priorité : `High` — SLA : 12h)**
  * **Titre :** Saturation critique de l'espace disque sur la base de données
  * **Description :** Le volume de stockage principal de la base de données de production est saturé à 96 %, menaçant d'interrompre l'écriture des transactions.
* **Exemple B (Priorité : `Medium` — SLA : 36h)**
  * **Titre :** Échec de la sauvegarde nocturne du serveur d'application
  * **Description :** Le script de sauvegarde planifié n'a pas pu s'exécuter à cause d'une déconnexion temporaire du serveur NAS de stockage.

---

### 🏥 4. Catégorie : **Médical**

* **Exemple A (Priorité : `Critical` — SLA : 1h)**
  * **Titre :** Inhalation de produit chimique toxique au Laboratoire L2
  * **Description :** Une fuite suspectée s'est produite lors de manipulations. Deux techniciens présentent des symptômes de vertiges et de détresse respiratoire. Évacuation de la zone en cours.
* **Exemple B (Priorité : `Critical` — SLA : 1h)**
  * **Titre :** Malaise avec perte de connaissance au 2ème étage
  * **Description :** Un collaborateur a fait un malaise cardiaque dans le couloir de l'aile Est. Les premiers secours et les urgences ont été alertés.

---

### 💡 Astuce de test
Pour tester les différents workflows associés, vous pouvez utiliser les comptes factices de test créés par défaut (configurés dans [DataInitializer.java](file:///home/anas/Desktop/stage/App/backend/src/main/java/com/netmar/incidentflow/config/DataInitializer.java)) :
* **Marie Laurent** (`marie.l@netmar.com` / `password`) pour déclarer les incidents réseau.
* **Sophie Martin** (`sophie.m@netmar.com` / `password`) pour les incidents de sécurité.
* **Dr. Jean Robert** (`jean.r@netmar.com` / `password`) pour attribuer et résoudre les incidents médicaux.