## **IncidentFLow** 

**Incident Management App** 

**Spécification et Conception du système** 

**Rédigé par :** Anas Haddou _Élève ingénieur en génie informatique_ 

**Informations Projet :** Version : 1.0 (Initiale) Statut : Draft pour validation Date : 3 juillet 2026 

_Ingénierie Logicielle, Modélisation & Architecture des Systèmes_ 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **Historique des versions** 

|Version|Date|Auteur|Description|
|---|---|---|---|
|1.0|29/06/2026|Anas Haddou|Première version du document de spéci-<br>fcation des exigences IncidentFLow Inci-<br>dent Management App.|



1 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **Table des matières** 

**==> picture [455 x 655] intentionally omitted <==**

**----- Start of picture text -----**<br>
|||||||||||||||||||||||||||||||||||||||||||||
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|Introduction|4|
|1.1|Contexte|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|4|
|1.2|Objectifs|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|4|
|1.3|Portée|du|projet|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|5|
|1.3.1|Fonctionnalités|incluses|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|5|
|1.3.2|Fonctionnalités|hors|périmètre|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|5|
|2|Références|5|
|3|Glossaire|6|
|4|Modules|fonctionnels|6|
|4.1|Gestion|des|utilisateurs .|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|6|
|4.2|Gestion|des|incidents|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|7|
|4.3|Gestion|du|workflow|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|7|
|5|Parties|prenantes|8|
|6|User|Stories|8|
|6.1|Gestion|des|utilisateurs .|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|8|
|6.1.1|Gestion|des|comptes|utilisateurs|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|9|
|6.1.2|Gestion|des|rôles|et|des|autorisations|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|10|
|6.2|Gestion|des|incidents|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|10|
|6.2.1|Déclaration|et|consultation|des|incidents|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|11|
|6.2.2|Traitement|des|incidents|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|12|
|6.2.3|Administration|des|incidents|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|14|
|6.2.4|Pilotage|des|incidents|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|14|
|6.3|Gestion|du|workflow|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|15|
|6.3.1|Configuration|des|workflows|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|15|
|6.3.2|Gestion|des|états|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|16|
|6.3.3|Gestion|des|transitions|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|17|
|7|Exigences|fonctionnelles|18|
|7.1|Gestion|des|utilisateurs .|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|19|
|7.2|Gestion|des|incidents|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|19|
|7.3|Gestion|du|workflow|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|19|
|8|Exigences|non|fonctionnelles|20|
|8.1|Performance|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|20|
|8.2|Sécurité|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|20|
|8.3|Disponibilité|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|21|
|8.4|Fiabilité|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|21|
|8.5|Ergonomie|et|utilisabilité|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|21|

**----- End of picture text -----**<br>


2 

IncidentFLow - Incident Management App 

Spécification des Exigences 

**==> picture [455 x 491] intentionally omitted <==**

**----- Start of picture text -----**<br>
||||||||||||||||||||||||||||||||||||||||||||
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8.6|Maintenabilité .|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|21|
|8.7|Évolutivité|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|22|
|8.8|Traçabilité|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|22|
|8.9|Compatibilité|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|22|
|9|Architecture|22|
|9.1|Architecture|globale|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|22|
|9.2|Diagramme|de|composants .|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|23|
|9.3|Diagramme|de|packages|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|24|
|9.4|Diagramme|de|déploiement|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|25|
|9.5|Infrastructure|de|déploiement|Docker|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|26|
|9.5.1|Architecture|des|conteneurs|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|26|
|9.5.2|Communication|inter-conteneurs|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|27|
|9.5.3|Volumes|et|persistance|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|27|
|9.5.4|Fichier|Docker|Compose|de|référence|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|27|
|9.5.5|Ordre|de|démarrage|et|dépendances|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|29|
|9.5.6|Environnements|de|déploiement|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|30|
|9.6|Diagramme|de|workflow|des|incidents .|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|30|
|10|Modèle|de|données|32|
|11|API|34|
|11.1|Diagramme|de|flux|API|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|34|
|11.2|Diagramme|de|séquence|—|Création|d’un|incident|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|34|
|11.3|Diagramme|d’activité|—|Ajout|d’un|incident|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|.|35|
|12|Wireframes|36|
|13|Matrice|de|traçabilité|36|
|14|Planning|36|
|15|Annexes|37|

**----- End of picture text -----**<br>


3 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **1 Introduction** 

## **1.1 Contexte** 

La gestion des incidents constitue un processus essentiel pour assurer la continuité des activités au sein d’une organisation. Qu’il s’agisse d’incidents techniques, opérationnels ou métiers, leur traitement nécessite une coordination efficace entre les différents intervenants, un suivi rigoureux ainsi qu’une traçabilité complète des actions réalisées. 

Dans de nombreuses organisations, la gestion des incidents repose encore sur des processus manuels ou sur des outils dont les workflows sont figés. Toute évolution des procédures internes, comme l’ajout d’un nouvel état, la modification d’une étape de traitement ou l’adaptation du cycle de vie d’un incident, nécessite souvent des développements supplémentaires. Cette rigidité réduit la capacité d’adaptation de l’organisation face à l’évolution de ses besoins métier. 

Le projet **IncidentFlow** a pour objectif de concevoir une plateforme web centralisée permettant de gérer efficacement l’ensemble du cycle de vie des incidents, depuis leur déclaration jusqu’à leur résolution et leur clôture. 

L’une des principales valeurs ajoutées du projet réside dans la mise en place d’un **workflow dynamique et entièrement personnalisable** . Contrairement aux systèmes classiques où les états des incidents sont prédéfinis et immuables, la solution proposée permet aux administrateurs de configurer librement le processus métier sans modifier le code de l’application. 

Le système offre notamment la possibilité de : 

- créer de nouveaux états d’un workflow ; 

- modifier les libellés des états existants ; 

- supprimer ou désactiver des états devenus inutiles ; 

- définir les transitions autorisées entre les différents états ; 

- adapter le workflow selon les besoins spécifiques de l’organisation. 

Cette approche permet d’améliorer considérablement la flexibilité du système, de faciliter son évolution et de répondre rapidement aux changements des procédures internes tout en garantissant une meilleure traçabilité des incidents et une gouvernance plus efficace. 

## **1.2 Objectifs** 

Le projet IncidentFlow poursuit plusieurs objectifs fonctionnels et organisationnels : 

- Centraliser la gestion des incidents au sein d’une plateforme unique. 

- Simplifier le processus de déclaration, de suivi, d’attribution et de résolution des incidents. 

- Améliorer la collaboration entre les différents intervenants impliqués dans le traitement des incidents. 

- Assurer une traçabilité complète des opérations réalisées sur chaque incident. 

4 

IncidentFLow - Incident Management App 

Spécification des Exigences 

- Permettre l’administration des utilisateurs et la gestion de leurs droits d’accès. 

- Offrir un workflow entièrement configurable afin de s’adapter aux différents processus métier sans nécessiter de modifications de l’application. 

- Fournir des indicateurs permettant de suivre l’évolution des incidents et d’améliorer la prise de décision. 

## **1.3 Portée du projet** 

## **1.3.1 Fonctionnalités incluses** 

Le présent document couvre les fonctionnalités suivantes : 

- Gestion des utilisateurs. 

- Gestion des rôles et des permissions. 

- Gestion complète des incidents. 

- Attribution et suivi des incidents. 

- Gestion des commentaires et des pièces jointes. 

- Historique des actions effectuées sur les incidents. 

- Configuration dynamique des workflows. 

- Personnalisation des états des incidents. 

- Définition des transitions entre les états. 

- Consultation des tableaux de bord et statistiques. 

## **1.3.2 Fonctionnalités hors périmètre** 

Les fonctionnalités suivantes ne sont pas prises en compte dans cette première version : 

- Gestion financière ou comptable. 

- Facturation. 

- Intelligence artificielle pour la prédiction des incidents. 

- Application mobile native. 

- Intégration avec des systèmes externes non liés à la gestion des incidents. 

## **2 Références** 

Les références utilisées pour l’élaboration de ce document incluent, sans s’y limiter : 

- IEEE 29148 — Systems and software engineering — Life cycle processes — Requirements engineering. 

- Documentation REST API (bonnes pratiques de conception d’API RESTful). 

- Documentation officielle Keycloak (authentification, IAM, RBAC). 

- Documentation officielle Spring Boot (API REST, sécurité, validation). 

- Documentation officielle React (composants, gestion d’état, routing). 

5 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **3 Glossaire** 

|Terme|Défnition|
|---|---|
|Incident|Événement opérationnel nécessitant une prise en charge, un<br>suivi et une résolution.|
|IAM|Identity and Access Management, gestion des identités et des<br>accès dans le système.|
|Workfow|Enchaînement structuré d’étapes défnissant le cycle de vie<br>d’un incident.|
|Keycloak|Plateforme d’authentifcation et de gestion des identités uti-<br>lisée pour IncidentFLow.|
|JWT|JSON Web Token, jeton signé permettant l’authentifcation<br>et l’autorisation.|
|OAuth2|Standard d’autorisation permettant à des applications d’ac-<br>céder à des ressources de manière sécurisée.|
|Docker|Plateforme de conteneurisation permettant d’isoler chaque<br>service dans un conteneur léger et portable.|
|Docker Compose|Outil d’orchestration permettant de défnir et gérer des ap-<br>plications multi-conteneurs via un fchier YAML.|
|Conteneur|Unité logicielle isolée contenant le code, les dépendances et<br>la confguration nécessaires à l’exécution d’un service.|



## **4 Modules fonctionnels** 

Le système est organisé autour de trois modules fonctionnels principaux. Chaque module regroupe un ensemble cohérent de fonctionnalités répondant à un besoin métier spécifique. Cette organisation favorise la lisibilité du système, facilite son évolution et améliore sa maintenabilité. 

## **4.1 Gestion des utilisateurs** 

Le module de gestion des utilisateurs permet d’administrer les comptes des utilisateurs de l’application. Il offre toutes les fonctionnalités nécessaires à leur création, leur modification, leur activation ou leur désactivation, ainsi qu’à la gestion des rôles et des permissions associées. 

Les principales fonctionnalités de ce module sont : 

- Création d’un utilisateur. 

- Modification des informations d’un utilisateur. 

- Désactivation ou réactivation d’un compte. 

- Consultation de la liste des utilisateurs. 

- Attribution et gestion des rôles. 

- Recherche et filtrage des utilisateurs. 

6 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **4.2 Gestion des incidents** 

Ce module constitue le cœur fonctionnel de l’application. Il permet de gérer l’ensemble du cycle de vie des incidents, depuis leur déclaration jusqu’à leur résolution et leur clôture. Il assure également le suivi des traitements réalisés ainsi que la conservation de l’historique des différentes actions. 

Les fonctionnalités principales sont : 

- Déclaration d’un incident. 

- Consultation des incidents. 

- Modification des informations d’un incident. 

- Attribution d’un incident à un utilisateur. 

- Changement d’état d’un incident. 

- Ajout de commentaires. 

- Gestion des pièces jointes. 

- Consultation de l’historique. 

- Recherche et filtrage des incidents. 

- Consultation des statistiques. 

## **4.3 Gestion du workflow** 

Ce module permet d’administrer dynamiquement le processus métier de traitement des incidents. Contrairement à un workflow figé, il offre la possibilité de personnaliser entièrement les différentes étapes du cycle de vie des incidents sans nécessiter de modification de l’application. 

Les principales fonctionnalités de ce module sont : 

- Création de nouveaux états. 

- Modification des libellés des états. 

- Suppression ou désactivation d’états. 

- Définition des transitions entre les états. 

- Configuration des règles de passage d’un état à un autre. 

- Association d’un workflow à une catégorie d’incident. 

- Activation ou désactivation d’un workflow. 

7 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 1 – Diagramme des modules fonctionnels du système IncidentFLow 

## **5 Parties prenantes** 

|Acteur|Description|
|---|---|
|Administrateur|Responsable de la gestion complète du système<br>(utilisateurs, rôles, configuration).|
|Opérateur|Utilisateur chargé de la création et du suivi des<br>incidents standards.|
|Opérateur médical|Utilisateur spécialisé pour le traitement des in-<br>cidents médicaux et leur clôture.|
|Responsable|Acteur métier ayant une vue de consultation et<br>de supervision des incidents.|



## **6 User Stories** 

Les besoins fonctionnels de l’application IncidentFlow sont exprimés sous forme de _User Stories_ . Elles permettent de décrire les attentes des différents acteurs du système selon leur rôle, leurs objectifs et les fonctionnalités qu’ils souhaitent réaliser. Les User Stories sont regroupées en trois grandes catégories correspondant aux principaux modules fonctionnels de l’application : la gestion des utilisateurs, la gestion des incidents et la gestion du workflow. 

## **6.1 Gestion des utilisateurs** 

Le module de gestion des utilisateurs permet d’administrer l’ensemble des acteurs intervenant dans le processus de gestion des incidents. Il couvre les opérations liées à la création, la consultation, la modification et la gestion des comptes utilisateurs ainsi qu’à l’attribution des rôles. Ces fonctionnalités garantissent une administration centralisée des accès tout en assurant une répartition cohérente des responsabilités au sein de la plateforme **IncidentFlow** . 

8 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **6.1.1 Gestion des comptes utilisateurs** 

**US-USER-001 : Création d’un utilisateur En tant qu’Administrateur, je souhaite créer un nouvel utilisateur afin de lui permettre d’accéder à la plateforme IncidentFlow selon les responsabilités qui lui sont attribuées.** 

La création d’un utilisateur constitue la première étape permettant l’utilisation de la plateforme. L’administrateur renseigne les informations nécessaires, notamment l’identité de l’utilisateur, son adresse électronique ainsi que le rôle qui lui sera attribué. Ces informations permettent d’identifier l’utilisateur et de déterminer les fonctionnalités auxquelles il pourra accéder. 

Une fois le compte créé, l’utilisateur peut se connecter à la plateforme et participer aux différentes activités de gestion des incidents. Le système garantit que chaque utilisateur dispose uniquement des droits correspondant à son rôle. 

Cette fonctionnalité facilite l’intégration des nouveaux collaborateurs, améliore l’organisation des équipes et assure une administration centralisée des utilisateurs. 

**US-USER-002 : Consultation des utilisateurs En tant qu’Administrateur, je souhaite consulter la liste des utilisateurs afin de disposer d’une vue globale des comptes enregistrés dans la plateforme.** 

L’administrateur doit pouvoir accéder à une vue centralisée regroupant l’ensemble des utilisateurs enregistrés dans IncidentFlow. Cette consultation lui permet d’obtenir rapidement les informations essentielles concernant chaque utilisateur, notamment son identité, son rôle ainsi que son statut. 

Afin de faciliter les opérations d’administration, le système met à disposition des fonctionnalités de recherche et de filtrage permettant de retrouver rapidement un utilisateur lorsque le nombre de comptes devient important. 

Cette fonctionnalité améliore la visibilité sur les utilisateurs de la plateforme et simplifie leur administration. 

**US-USER-003 : Modification d’un utilisateur En tant qu’Administrateur, je souhaite modifier les informations d’un utilisateur afin de maintenir les données de la plateforme à jour.** 

Les informations relatives à un utilisateur peuvent évoluer au fil du temps, notamment lors d’un changement de service, d’une évolution de fonction ou d’une modification des coordonnées. La plateforme doit permettre à l’administrateur de mettre à jour ces informations sans avoir à recréer le compte concerné. 

Les modifications sont immédiatement prises en compte afin que les données disponibles restent 

9 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## cohérentes avec l’organisation de l’entreprise. 

Cette fonctionnalité contribue à maintenir une base d’utilisateurs fiable et constamment actualisée. 

**US-USER-005 : Désactivation d’un utilisateur En tant qu’Administrateur, je souhaite désactiver un utilisateur afin de lui retirer l’accès à la plateforme tout en conservant son historique.** 

Lorsqu’un collaborateur quitte l’organisation ou n’est plus autorisé à utiliser la plateforme, son compte doit pouvoir être désactivé sans supprimer les informations qui lui sont associées. Cette approche garantit la conservation des incidents auxquels il a participé ainsi que de l’ensemble des opérations réalisées. 

Le compte pourra être réactivé ultérieurement si nécessaire tout en conservant son historique. 

Cette fonctionnalité améliore la sécurité de la plateforme et assure une parfaite traçabilité des activités des utilisateurs. 

## **6.1.2 Gestion des rôles et des autorisations** 

## **US-USER-004 : Gestion des rôles En tant qu’Administrateur, je souhaite attribuer ou modifier le rôle d’un utilisateur afin de contrôler les fonctionnalités auxquelles il peut accéder.** 

Chaque utilisateur possède un rôle qui détermine les actions qu’il est autorisé à réaliser dans la plateforme. L’administrateur peut attribuer un rôle lors de la création d’un compte ou le modifier ultérieurement afin de refléter l’évolution des responsabilités de l’utilisateur. 

La gestion des rôles permet de contrôler les autorisations d’accès aux différentes fonctionnalités de la plateforme et garantit que chaque utilisateur dispose uniquement des permissions nécessaires à l’exercice de ses missions. 

Cette fonctionnalité renforce la sécurité globale de la plateforme, facilite la gestion des accès et contribue à une meilleure gouvernance des utilisateurs. 

## **6.2 Gestion des incidents** 

Le module de gestion des incidents constitue le cœur fonctionnel de la plateforme **IncidentFlow** . Il permet d’assurer le suivi complet des incidents depuis leur déclaration jusqu’à leur résolution. Les fonctionnalités proposées couvrent l’ensemble des opérations nécessaires à leur création, leur traitement, leur suivi ainsi que leur pilotage. Cette organisation garantit une meilleure coordination entre les différents acteurs tout en assurant une traçabilité complète des actions réalisées. 

10 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **6.2.1 Déclaration et consultation des incidents** 

**US-INC-001 : Déclaration d’un incident En tant qu’Utilisateur, je souhaite déclarer un incident afin de signaler un problème nécessitant une prise en charge par les équipes concernées.** 

La déclaration d’un incident représente le point de départ du processus de gestion des incidents au sein de la plateforme **IncidentFlow** . Lorsqu’un utilisateur constate un dysfonctionnement, une anomalie ou tout événement susceptible d’impacter le fonctionnement normal de l’organisation, il doit pouvoir enregistrer cet incident à travers une interface simple et intuitive. 

Le système lui permet de renseigner l’ensemble des informations nécessaires au traitement de l’incident, notamment son titre, une description détaillée, sa catégorie, son niveau de priorité ainsi que toute information complémentaire facilitant sa compréhension. Selon les besoins, des pièces jointes peuvent également être associées à la déclaration afin d’apporter davantage de contexte aux équipes de traitement. 

Une fois validé, l’incident est enregistré dans la plateforme, reçoit un identifiant unique et est automatiquement associé au workflow correspondant à sa catégorie. Cette automatisation garantit que chaque incident suit immédiatement le processus métier approprié dès sa création. 

Cette fonctionnalité permet d’assurer une prise en charge rapide des incidents tout en centralisant l’ensemble des informations nécessaires à leur suivi. 

**US-INC-002 : Consultation des incidents En tant qu’Utilisateur, je souhaite consulter les incidents afin de suivre leur évolution et d’accéder aux informations relatives à leur traitement.** 

La plateforme doit permettre aux utilisateurs autorisés de consulter les incidents auxquels ils ont accès selon leurs droits. Cette consultation offre une vision globale de l’ensemble des incidents en cours ainsi que de ceux déjà clôturés. 

Pour chaque incident, le système présente les informations essentielles telles que son identifiant, son titre, sa catégorie, son niveau de priorité, son état actuel, sa date de création, le responsable en charge de son traitement ainsi que les dernières actions réalisées. 

Cette fonctionnalité permet aux différents intervenants de suivre facilement l’évolution des incidents, d’obtenir rapidement les informations nécessaires à leur traitement et d’améliorer la coordination entre les membres de l’équipe. 

**US-INC-003 : Recherche et filtrage des incidents En tant qu’Utilisateur, je souhaite rechercher et filtrer les incidents afin de retrouver rapidement les informations correspondant à mes besoins.** 

Au fil du temps, le nombre d’incidents enregistrés dans la plateforme peut devenir important. Afin de faciliter leur consultation, le système met à disposition plusieurs mécanismes de recherche 

11 

IncidentFLow - Incident Management App 

Spécification des Exigences 

et de filtrage permettant d’accéder rapidement aux incidents recherchés. 

Les utilisateurs peuvent effectuer leurs recherches selon différents critères tels que le titre de l’incident, son identifiant, sa catégorie, son niveau de priorité, son état actuel, le responsable qui lui est attribué ou encore sa date de création. Les différents filtres peuvent être combinés afin d’obtenir des résultats plus précis. 

Cette fonctionnalité améliore considérablement l’expérience utilisateur en réduisant le temps nécessaire pour retrouver une information et en facilitant le suivi quotidien des incidents. 

## **6.2.2 Traitement des incidents** 

## **US-INC-004 : Attribution d’un incident En tant que Responsable, je souhaite attribuer un incident à un utilisateur afin d’assurer sa prise en charge par la personne la plus compétente.** 

Après sa création, chaque incident doit être affecté à un utilisateur ou à une équipe responsable de son traitement. Cette attribution permet d’identifier clairement la personne en charge de l’incident et de garantir qu’aucune demande ne reste sans suivi. 

Le responsable peut sélectionner l’utilisateur le plus qualifié en fonction de ses compétences, de sa disponibilité ou de son domaine d’intervention. En cas de besoin, cette attribution peut être modifiée afin de réaffecter l’incident à un autre collaborateur. 

Cette fonctionnalité favorise une meilleure répartition des tâches, améliore la coordination des équipes et réduit les délais de traitement des incidents. 

**US-INC-005 : Modification d’un incident En tant qu’Utilisateur autorisé, je souhaite modifier les informations d’un incident afin de maintenir les données à jour durant son traitement.** 

Au cours du cycle de vie d’un incident, certaines informations peuvent évoluer ou nécessiter des précisions complémentaires. Les utilisateurs autorisés doivent pouvoir mettre à jour ces informations afin qu’elles reflètent fidèlement la situation réelle. 

Les modifications peuvent concerner la description de l’incident, sa catégorie, son niveau de priorité ou toute autre information utile au bon déroulement de son traitement. Toutes les modifications sont enregistrées afin d’assurer la cohérence des données et la traçabilité des opérations réalisées. 

Cette fonctionnalité garantit que les informations disponibles restent fiables tout au long du traitement de l’incident. 

**US-INC-006 : Suivi de l’évolution d’un incident En tant qu’Utilisateur autorisé, je souhaite faire évoluer l’état d’un incident afin de refléter son avancement dans le processus de traitement.** 

12 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Tout au long de son cycle de vie, un incident évolue selon les différentes étapes définies par le workflow auquel il est associé. Les utilisateurs autorisés doivent pouvoir effectuer les changements d’état correspondant à l’avancement réel du traitement. 

Chaque transition est contrôlée par le workflow configuré dans la plateforme afin de garantir que seules les évolutions autorisées puissent être réalisées. Les changements d’état sont enregistrés automatiquement dans l’historique de l’incident. 

Cette fonctionnalité permet à l’ensemble des intervenants de disposer d’une vision claire de la situation de chaque incident et facilite le suivi des activités en cours. 

**US-INC-007 : Ajout de commentaires et de pièces jointes En tant qu’Utilisateur, je souhaite ajouter des commentaires et des pièces jointes à un incident afin de partager des informations complémentaires avec les autres intervenants.** 

Le traitement d’un incident implique généralement plusieurs acteurs qui collaborent afin d’identifier l’origine du problème et de proposer une solution adaptée. Afin de faciliter cette collaboration, la plateforme IncidentFlow permet aux utilisateurs autorisés d’ajouter des commentaires directement sur la fiche de l’incident. 

Ces commentaires servent à documenter les différentes actions réalisées, à partager des observations ou encore à communiquer des recommandations entre les membres de l’équipe. En complément, les utilisateurs peuvent joindre différents types de documents tels que des captures d’écran, des rapports techniques, des fichiers journaux ou tout autre élément permettant de mieux comprendre l’incident. 

Toutes les informations ajoutées restent associées à l’incident pendant toute sa durée de vie, garantissant ainsi une documentation complète et facilement consultable par les différents intervenants. 

Cette fonctionnalité améliore la communication entre les équipes et favorise une résolution plus rapide des incidents. 

**US-INC-008 : Clôture et consultation de l’historique En tant qu’Utilisateur autorisé, je souhaite consulter l’historique d’un incident et le clôturer une fois celui-ci résolu afin de conserver une traçabilité complète de son traitement.** 

Tout au long de son cycle de vie, un incident fait l’objet de nombreuses opérations telles que sa création, son attribution, ses changements d’état, l’ajout de commentaires ou encore la modification de certaines informations. La plateforme conserve automatiquement l’ensemble de ces événements dans un historique détaillé. 

Cet historique permet aux utilisateurs autorisés de retracer l’ensemble des actions effectuées sur un incident, d’identifier les différents intervenants ainsi que les dates auxquelles les opérations ont été réalisées. Cette traçabilité constitue un élément essentiel pour les opérations d’audit, d’analyse et d’amélioration continue. 

13 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Une fois l’incident entièrement résolu et toutes les actions nécessaires réalisées, l’utilisateur autorisé peut procéder à sa clôture. L’incident n’est alors plus considéré comme actif mais demeure accessible pour consultation et exploitation des données historiques. 

## **6.2.3 Administration des incidents** 

**US-INC-009 : Gestion des catégories d’incidents En tant qu’Administrateur, je souhaite gérer les catégories d’incidents afin de classifier les incidents selon leur nature et d’améliorer leur organisation.** 

Les incidents traités au sein de l’organisation peuvent appartenir à différentes catégories correspondant à leur domaine d’application ou à leur nature. Afin de garantir une organisation cohérente des informations, la plateforme IncidentFlow permet à l’administrateur de gérer les catégories disponibles. 

L’administrateur peut créer de nouvelles catégories, modifier celles existantes ou désactiver celles qui ne sont plus utilisées. Lors de la déclaration d’un incident, l’utilisateur sélectionne la catégorie appropriée, ce qui permet d’orienter automatiquement son traitement et de faciliter les recherches ultérieures. 

Une classification pertinente améliore également la qualité des statistiques produites par la plateforme et facilite l’analyse des incidents rencontrés par l’organisation. 

**US-INC-010 : Gestion des niveaux de priorité En tant qu’Administrateur, je souhaite gérer les niveaux de priorité afin de définir le degré d’urgence des incidents et d’optimiser leur prise en charge.** 

Tous les incidents ne présentent pas le même niveau d’importance. Certains nécessitent une intervention immédiate alors que d’autres peuvent être traités dans un délai plus important. La plateforme doit permettre à l’administrateur de définir les différents niveaux de priorité utilisés lors de la déclaration des incidents. 

Ces niveaux de priorité permettent aux équipes de traitement d’organiser leur travail en fonction de l’urgence et de l’impact des incidents. Ils facilitent également la planification des interventions et l’allocation des ressources disponibles. 

La gestion des priorités contribue ainsi à améliorer la réactivité de l’organisation face aux incidents les plus critiques. 

## **6.2.4 Pilotage des incidents** 

**US-INC-011 : Consultation du tableau de bord En tant qu’Utilisateur, je souhaite consulter un tableau de bord afin d’obtenir une vue synthétique de l’activité de gestion des incidents.** 

La plateforme IncidentFlow met à disposition un tableau de bord permettant aux utilisateurs autorisés de visualiser rapidement les principaux indicateurs liés aux incidents. Cette vue syn- 

14 

IncidentFLow - Incident Management App 

Spécification des Exigences 

thétique présente notamment le nombre total d’incidents, les incidents ouverts, ceux en cours de traitement, les incidents résolus ainsi que leur répartition selon différents critères. 

Les informations affichées sont mises à jour automatiquement afin de refléter l’état actuel de la plateforme. Cette représentation facilite le suivi de l’activité, met en évidence les situations nécessitant une attention particulière et permet aux responsables de disposer d’une vision globale de la gestion des incidents. 

Grâce à cette fonctionnalité, les décideurs peuvent suivre plus efficacement les performances opérationnelles et prendre des décisions adaptées. 

## **US-INC-012 : Réception des notifications En tant qu’Utilisateur, je souhaite recevoir des notifications concernant les incidents auxquels je participe afin d’être informé des événements importants.** 

Au cours du traitement d’un incident, plusieurs événements peuvent survenir, tels qu’une nouvelle attribution, un changement d’état, l’ajout d’un commentaire ou la clôture de l’incident. Afin d’améliorer la réactivité des différents intervenants, la plateforme doit notifier automatiquement les utilisateurs concernés lorsqu’un événement significatif se produit. 

Ces notifications permettent aux utilisateurs de suivre l’évolution des incidents sans avoir à consulter continuellement la plateforme. Elles facilitent la communication entre les équipes, réduisent les délais de réaction et contribuent à une meilleure coordination des activités. 

Cette fonctionnalité améliore ainsi le suivi opérationnel des incidents tout en favorisant une gestion plus efficace des échanges entre les différents acteurs. 

## **6.3 Gestion du workflow** 

Le module de gestion du workflow constitue la principale innovation de la plateforme **IncidentFlow** . Il permet de personnaliser dynamiquement le cycle de vie des incidents afin de l’adapter aux processus métier de chaque organisation. Contrairement aux solutions reposant sur un workflow figé, IncidentFlow offre la possibilité de créer plusieurs workflows, de définir leurs états, de configurer les transitions autorisées entre ces états et de les associer à différentes catégories d’incidents. Cette flexibilité permet à l’application d’évoluer en fonction des besoins de l’organisation sans nécessiter de modification du code source. 

## **6.3.1 Configuration des workflows** 

**US-WF-001 : Création d’un workflow En tant qu’Administrateur, je souhaite créer un nouveau workflow afin de définir un processus de traitement correspondant aux besoins de mon organisation.** 

Chaque organisation applique ses propres procédures pour traiter les incidents. La plateforme IncidentFlow permet donc de créer plusieurs workflows représentant ces différents processus métier. Lors de la création, l’administrateur définit les informations générales du workflow, notamment son nom, sa description ainsi que son objectif. 

15 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Le workflow créé constitue une structure qui pourra ensuite être enrichie par l’ajout d’états et de transitions. Cette approche permet à l’organisation de disposer de plusieurs modèles de traitement adaptés à différents contextes ou catégories d’incidents. 

Grâce à cette fonctionnalité, la plateforme peut évoluer facilement en fonction des besoins de l’organisation sans nécessiter d’intervention technique. 

## **US-WF-002 : Modification d’un workflow En tant qu’Administrateur, je souhaite modifier un workflow existant afin de l’adapter à l’évolution des procédures métier.** 

Les processus internes d’une organisation évoluent régulièrement. Afin de maintenir la cohérence entre la plateforme et les pratiques métier, l’administrateur doit pouvoir modifier les caractéristiques d’un workflow existant. 

Les modifications peuvent concerner son nom, sa description ou sa configuration générale. Ces changements permettent de faire évoluer les processus tout en conservant les workflows déjà utilisés et les données associées aux incidents traités. 

Cette fonctionnalité garantit une adaptation continue de la plateforme aux nouvelles exigences organisationnelles. 

**US-WF-003 : Activation et désactivation d’un workflow En tant qu’Administrateur, je souhaite activer ou désactiver un workflow afin de contrôler les processus disponibles dans la plateforme.** 

IncidentFlow permet de gérer plusieurs workflows simultanément. Certains peuvent être utilisés quotidiennement tandis que d’autres correspondent à des processus temporaires ou obsolètes. 

L’administrateur peut activer un workflow lorsqu’il est prêt à être utilisé ou le désactiver lorsqu’il n’est plus nécessaire. Cette fonctionnalité permet de conserver différents modèles de workflow sans qu’ils soient tous disponibles en permanence. 

Elle facilite également les phases de transition lors de la mise en place de nouveaux processus métier. 

## **6.3.2 Gestion des états** 

## **US-WF-004 : Création d’un état En tant qu’Administrateur, je souhaite créer un nouvel état afin de personnaliser les différentes étapes du traitement des incidents.** 

Les états représentent les différentes étapes du cycle de vie d’un incident. Contrairement aux systèmes traditionnels qui imposent des états prédéfinis, IncidentFlow permet à l’administrateur de créer librement de nouveaux états correspondant aux besoins spécifiques de son organisation. 

Lors de la création, l’administrateur définit notamment le libellé de l’état ainsi que sa description. Ce nouvel état pourra ensuite être intégré dans un ou plusieurs workflows. 

Cette fonctionnalité constitue l’un des principaux éléments de personnalisation de la plateforme. 

16 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **US-WF-005 : Modification d’un état En tant qu’Administrateur, je souhaite modifier un état existant afin de faire évoluer le workflow sans modifier l’application.** 

Les procédures métier peuvent évoluer au fil du temps. Afin de conserver un workflow cohérent avec ces évolutions, la plateforme permet à l’administrateur de modifier les informations associées à un état existant. 

Les modifications peuvent concerner son libellé, sa description ou certaines propriétés utilisées dans le processus métier. Les changements sont pris en compte immédiatement pour les futures évolutions des incidents. 

Cette fonctionnalité permet d’adapter rapidement les workflows aux nouvelles exigences de l’organisation. 

**US-WF-006 : Suppression ou désactivation d’un état En tant qu’Administrateur, je souhaite supprimer ou désactiver un état devenu inutile afin de maintenir un workflow cohérent.** 

Lorsqu’une étape du processus métier n’est plus utilisée, l’administrateur doit pouvoir la retirer du workflow. Afin de préserver la cohérence des données historiques, la plateforme peut également proposer la désactivation d’un état plutôt que sa suppression définitive. 

Cette fonctionnalité permet de simplifier les workflows tout en garantissant la conservation des informations relatives aux incidents déjà traités. 

## **6.3.3 Gestion des transitions** 

**US-WF-007 : Configuration des transitions En tant qu’Administrateur, je souhaite définir les transitions autorisées entre les états afin de contrôler le parcours des incidents.** 

Les transitions représentent les passages possibles d’un état vers un autre au sein d’un workflow. L’administrateur configure ces transitions afin de garantir que les incidents suivent uniquement les parcours conformes aux procédures de l’organisation. 

Le système applique automatiquement ces règles lors des changements d’état et empêche toute transition non autorisée. Cette approche garantit la cohérence du processus de traitement et réduit les risques d’erreur. 

La configuration des transitions constitue un élément essentiel de la personnalisation dynamique des workflows. 

**US-WF-008 : Association d’un workflow à une catégorie d’incidents En tant qu’Administrateur, je souhaite associer un workflow à une catégorie d’incidents afin que chaque incident suive automatiquement le processus métier approprié.** 

Tous les incidents ne nécessitent pas le même processus de traitement. Certains peuvent suivre 

17 

IncidentFLow - Incident Management App 

Spécification des Exigences 

un circuit de validation simple tandis que d’autres exigent plusieurs étapes de contrôle ou d’approbation. 

La plateforme IncidentFlow permet d’associer un workflow spécifique à chaque catégorie d’incidents. Lorsqu’un nouvel incident est déclaré, le système sélectionne automatiquement le workflow correspondant et applique les états ainsi que les transitions qui lui sont associés. 

Cette fonctionnalité renforce la flexibilité de la plateforme, réduit les interventions manuelles et garantit que chaque incident est traité conformément aux procédures définies par l’organisation. 

**US-WF-009 : Définition de l’état initial et de l’état final En tant qu’Administrateur, je souhaite définir l’état initial et l’état final d’un workflow afin de structurer correctement le cycle de vie des incidents.** 

Chaque workflow doit posséder un point de départ ainsi qu’un point de terminaison représentant respectivement la création et la clôture d’un incident. La plateforme IncidentFlow permet à l’administrateur d’identifier ces états lors de la configuration du workflow. 

La définition de l’état initial garantit que chaque nouvel incident commence son traitement selon le processus prévu, tandis que l’état final indique que toutes les étapes du traitement ont été réalisées et que l’incident peut être considéré comme résolu. 

Cette fonctionnalité contribue à assurer la cohérence du processus de gestion des incidents et facilite son exécution automatique. 

**US-WF-010 : Gestion des actions autorisées pour chaque transition En tant qu’Administrateur, je souhaite définir les actions autorisées pour chaque transition afin de contrôler les opérations pouvant être réalisées durant le traitement des incidents.** 

Chaque transition entre deux états peut être soumise à des règles particulières. La plateforme permet à l’administrateur de définir les actions autorisées lors d’une transition, telles que l’ajout obligatoire d’un commentaire, l’affectation d’un responsable ou la validation d’une étape avant de poursuivre le processus. 

Ces règles permettent d’assurer que chaque transition respecte les procédures internes de l’organisation et que les informations nécessaires sont renseignées avant le passage à l’étape suivante. 

Cette fonctionnalité renforce le contrôle du processus métier et garantit une meilleure qualité dans le traitement des incidents. 

## **7 Exigences fonctionnelles** 

Les exigences fonctionnelles décrivent les services que la plateforme **IncidentFlow** doit fournir afin de répondre aux besoins des différents utilisateurs. Elles définissent les fonctionnalités attendues du système ainsi que les comportements qu’il doit adopter lors de son utilisation. Les exigences sont organisées selon les principaux modules fonctionnels de l’application. 

18 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **7.1 Gestion des utilisateurs** 

Le module de gestion des utilisateurs permet d’administrer les comptes utilisateurs ainsi que leurs droits d’accès à la plateforme. 

**FU-1.** Le système doit permettre la création d’un utilisateur. 

- **FU-2.** Le système doit permettre la consultation des utilisateurs. 

- **FU-3.** Le système doit permettre la recherche des utilisateurs. 

**FU-4.** Le système doit permettre la modification des informations d’un utilisateur. 

- **FU-5.** Le système doit permettre l’activation ou la désactivation d’un utilisateur. 

- **FU-6.** Le système doit permettre l’attribution des rôles aux utilisateurs. 

- **FU-7.** Le système doit permettre la consultation du profil utilisateur. 

## **7.2 Gestion des incidents** 

Le module de gestion des incidents permet de gérer l’ensemble du cycle de vie des incidents depuis leur déclaration jusqu’à leur clôture. 

## **FI-1.** Le système doit permettre la déclaration d’un incident. 

**FI-2.** Le système doit permettre la consultation des incidents. 

- **FI-3.** Le système doit permettre la recherche et le filtrage des incidents. 

- **FI-4.** Le système doit permettre la modification d’un incident. 

- **FI-5.** Le système doit permettre l’affectation d’un incident. 

- **FI-6.** Le système doit permettre le changement d’état d’un incident. 

- **FI-7.** Le système doit permettre l’ajout de commentaires. 

- **FI-8.** Le système doit permettre l’ajout de pièces jointes. 

- **FI-9.** Le système doit permettre la consultation de l’historique d’un incident. 

- **FI-10.** Le système doit permettre la clôture d’un incident. 

- **FI-11.** Le système doit permettre la gestion des catégories d’incidents. 

- **FI-12.** Le système doit permettre la gestion des niveaux de priorité. 

- **FI-13.** Le système doit permettre la consultation du tableau de bord. 

- **FI-14.** Le système doit permettre l’envoi de notifications aux utilisateurs concernés. 

## **7.3 Gestion du workflow** 

Le module de gestion du workflow permet de personnaliser dynamiquement le processus de traitement des incidents afin de répondre aux besoins spécifiques de chaque organisation. 

## **FW-1.** Le système doit permettre la création d’un workflow. 

- **FW-2.** Le système doit permettre la consultation des workflows. 

- **FW-3.** Le système doit permettre la modification d’un workflow. 

- **FW-4.** Le système doit permettre l’activation ou la désactivation d’un workflow. 

- **FW-5.** Le système doit permettre la création des états. 

19 

IncidentFLow - Incident Management App 

Spécification des Exigences 

- **FW-6.** Le système doit permettre la modification des états. 

- **FW-7.** Le système doit permettre la suppression ou la désactivation des états. 

- **FW-8.** Le système doit permettre la définition des états initiaux et finaux. 

- **FW-9.** Le système doit permettre la configuration des transitions. 

- **FW-10.** Le système doit permettre l’association d’un workflow à une catégorie d’incidents. 

- **FW-11.** Le système doit permettre l’application automatique d’un workflow lors de la création d’un incident. 

## **8 Exigences non fonctionnelles** 

Les exigences non fonctionnelles définissent les critères de qualité que la plateforme **IncidentFlow** doit respecter afin de garantir son bon fonctionnement, sa sécurité, sa fiabilité ainsi qu’une expérience utilisateur optimale. Contrairement aux exigences fonctionnelles, elles ne décrivent pas les fonctionnalités du système, mais les contraintes et les caractéristiques de qualité auxquelles celui-ci doit satisfaire. 

## **8.1 Performance** 

Le système doit offrir des performances suffisantes afin d’assurer une utilisation fluide de la plateforme, même en présence d’un nombre important d’utilisateurs et d’incidents. 

- **NFP-1.** Les principales opérations de la plateforme doivent être exécutées dans un délai compatible avec une utilisation fluide. 

- **NFP-2.** Le système doit permettre la gestion simultanée de plusieurs utilisateurs sans dégradation significative des performances. 

- **NFP-3.** Les recherches et les opérations de filtrage des incidents doivent fournir les résultats dans un délai raisonnable. 

- **NFP-4.** Les tableaux de bord doivent être générés rapidement afin de faciliter le suivi des indicateurs. 

- **NFP-5.** Le système doit conserver des performances stables lorsque le volume des incidents augmente. 

## **8.2 Sécurité** 

La sécurité constitue un élément essentiel de la plateforme afin de protéger les données ainsi que les opérations réalisées par les utilisateurs. 

- **NFS-1.** L’accès à la plateforme doit être réservé aux utilisateurs authentifiés. 

- **NFS-2.** Le système doit contrôler les autorisations selon les rôles attribués aux utilisateurs. 

- **NFS-3.** Les utilisateurs ne doivent accéder qu’aux fonctionnalités correspondant à leurs droits. 

- **NFS-4.** Les informations manipulées par la plateforme doivent être protégées contre tout accès non autorisé. 

- **NFS-5.** Les opérations sensibles réalisées sur la plateforme doivent être enregistrées afin d’assurer leur traçabilité. 

20 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **NFS-6.** Le système doit assurer la confidentialité des données des utilisateurs et des incidents. 

## **8.3 Disponibilité** 

La plateforme doit rester accessible afin d’assurer la continuité des activités de gestion des incidents. 

- **NFD-1.** Le système doit être disponible durant les périodes normales d’utilisation de l’organisation. 

- **NFD-2.** Les opérations de maintenance doivent limiter au maximum les interruptions de service. 

- **NFD-3.** Le système doit permettre la sauvegarde régulière des données. 

- **NFD-4.** Les données sauvegardées doivent pouvoir être restaurées en cas de défaillance. 

## **8.4 Fiabilité** 

La plateforme doit garantir la cohérence des données ainsi que le bon déroulement des processus de gestion des incidents. 

**NFF-1.** Les données enregistrées dans la plateforme doivent conserver leur intégrité. 

**NFF-2.** Les workflows doivent garantir la cohérence des changements d’état des incidents. 

- **NFF-3.** Les incidents doivent conserver leur historique tout au long de leur cycle de vie. 

- **NFF-4.** Les opérations réalisées par les utilisateurs doivent être exécutées de manière fiable. 

## **8.5 Ergonomie et utilisabilité** 

La plateforme doit offrir une interface simple, intuitive et adaptée aux différents profils d’utilisateurs. 

**NFE-1.** L’interface utilisateur doit être claire et intuitive. 

**NFE-2.** Les fonctionnalités doivent être facilement accessibles. 

- **NFE-3.** La navigation entre les différentes pages doit être cohérente. 

- **NFE-4.** Les messages affichés par le système doivent être explicites et compréhensibles. 

- **NFE-5.** Les formulaires doivent faciliter la saisie des informations tout en limitant les erreurs. 

## **8.6 Maintenabilité** 

La plateforme doit pouvoir évoluer facilement afin de répondre aux futurs besoins de l’organisation. 

**NFM-1.** Le système doit être suffisamment modulaire pour faciliter son évolution. 

**NFM-2.** Les nouveaux workflows doivent pouvoir être configurés sans remettre en cause les fonctionnalités existantes. 

- **NFM-3.** Les modifications des processus métier doivent pouvoir être réalisées avec un impact limité sur le reste du système. 

21 

IncidentFLow - Incident Management App 

Spécification des Exigences 

- **NFM-4.** L’organisation du système doit faciliter les opérations de maintenance corrective et évolutive. 

## **8.7 Évolutivité** 

La plateforme doit être capable de s’adapter aux évolutions futures des besoins de l’organisation. 

- **NFEV-1.** Le système doit permettre l’ajout de nouvelles catégories d’incidents. 

- **NFEV-2.** Le système doit permettre la création de nouveaux workflows. 

- **NFEV-3.** Le système doit permettre l’ajout de nouveaux états et de nouvelles transitions. 

- **NFEV-4.** Les évolutions fonctionnelles doivent pouvoir être intégrées sans remettre en cause les fonctionnalités existantes. 

## **8.8 Traçabilité** 

Toutes les opérations importantes doivent pouvoir être consultées afin de garantir le suivi des activités réalisées sur la plateforme. 

- **NFT-1.** Le système doit conserver l’historique complet des incidents. 

- **NFT-2.** Les changements d’état doivent être enregistrés. 

- **NFT-3.** Les modifications importantes réalisées sur les incidents doivent être historisées. 

- **NFT-4.** Les actions réalisées par les utilisateurs doivent pouvoir être consultées en cas de besoin. 

- **8.9 Compatibilité** 

- La plateforme doit pouvoir être utilisée dans différents environnements sans altérer son fonctionnement. 

- **NFC-1.** Le système doit être accessible depuis les principaux navigateurs web modernes. 

- **NFC-2.** L’interface doit s’adapter aux différentes résolutions d’écran utilisées par les utilisateurs. 

- **NFC-3.** Le système doit offrir un comportement cohérent quel que soit l’environnement d’exécution. 

## **9 Architecture** 

Cette section présente les différentes vues architecturales du système IncidentFLow. 

## **9.1 Architecture globale** 

Le diagramme ci-dessous illustre l’architecture globale du système IncidentFLow. Le **Client** accède à l’application via un navigateur web qui communique avec le **Frontend React** . Ce dernier interagit avec le **Backend Spring Boot** via une API REST. Le backend communique avec la base de données **PostgreSQL** via JPA/Hibernate pour la persistance des données, et avec **Keycloak** via OAuth2/JWT pour l’authentification et la gestion des identités. 

22 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 2 – Architecture globale du système IncidentFLow 

## **9.2 Diagramme de composants** 

Le diagramme de composants détaille l’organisation interne du système. Le **Frontend React** communique avec le **REST Controller** du backend, qui orchestre les appels vers les services métier : **Incident Service** pour la gestion des incidents et **User Service** pour la gestion des utilisateurs. Ces services accèdent à la couche **Repository** qui assure la persistance dans **PostgreSQL** . Le composant **Keycloak** est sollicité de manière transversale pour l’authentification. 

23 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 3 – Diagramme de composants du système IncidentFLow 

## **9.3 Diagramme de packages** 

Le diagramme de packages présente l’organisation logique du code source du backend. Le package **frontend** communique avec le package **controller** du backend. Ce dernier est structuré en plusieurs sous-packages : **dto** (objets de transfert de données), **model** (entités métier), **controller** (points d’entrée REST), **service** (logique métier), **security** (configuration de sécurité) et **repository** (accès aux données). Le package **security** interagit avec **Keycloak** pour la gestion de l’authentification. 

24 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 4 – Diagramme de packages du système IncidentFLow 

## **9.4 Diagramme de déploiement** 

Le diagramme de déploiement modélise la répartition physique des composants du système. Le **Client** (navigateur web) communique via HTTPS avec le **Serveur Frontend** hébergeant l’application React. Celui-ci échange avec le **Serveur Backend** (API Spring Boot) via une API REST. Le backend interagit avec **PostgreSQL** via JDBC/JPA pour la persistance et avec le **Serveur IAM Keycloak** via OAuth2/JWT pour l’authentification. 

25 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 5 – Diagramme de déploiement du système IncidentFLow 

## **9.5 Infrastructure de déploiement Docker** 

L’application IncidentFLow adopte une **architecture conteneurisée** basée sur **Docker** . Chaque composant du système est isolé dans un conteneur dédié, orchestré par **Docker Compose** . Cette approche garantit la portabilité, la reproductibilité et l’isolation des services. 

## **9.5.1 Architecture des conteneurs** 

Le système est décomposé en **quatre conteneurs** Docker, chacun encapsulant un service distinct : 

26 

IncidentFLow - Incident Management App 

Spécification des Exigences 

|**Conteneur**|**Image**|**Port**|**Rôle**|
|---|---|---|---|
|`IncidentFLow-frontend`|Node / Nginx|3000|Interface utilisateur React|
|`IncidentFLow-backend`|OpenJDK 17|8080|API REST Spring Boot|
|`IncidentFLow-keycloak`|quay.io/keycloak|8180|Serveur IAM (OAuth2/JWT)|
|`IncidentFLow-postgres`|PostgreSQL 15|5432|Base de données relationnelle|



## **9.5.2 Communication inter-conteneurs** 

Les quatre conteneurs communiquent au sein d’un **réseau Docker interne** ( `IncidentFLow-network` ) de type `bridge` . Ce réseau privé permet aux services de se référencer mutuellement par leur nom de conteneur, sans exposer les ports internes à l’extérieur : 

- **Frontend (React)** _→_ communique avec le backend via `http://IncidentFLow-backend: 8080` . 

- **Backend (Spring Boot)** _→_ accède à PostgreSQL via `jdbc:postgresql://IncidentFL ow-postgres:5432/IncidentFLow_db` . 

- **Backend (Spring Boot)** _→_ valide les tokens JWT auprès de Keycloak via `http://Inci dentFLow-keycloak:8180` . 

- **Keycloak** _→_ utilise sa propre base de données dans le même conteneur PostgreSQL (schéma séparé) ou un conteneur dédié selon la configuration. 

## **9.5.3 Volumes et persistance** 

Pour garantir la **persistance des données** au-delà du cycle de vie des conteneurs, des volumes Docker sont configurés : 

- `postgres-data` : volume nommé utilisé pour le répertoire de données PostgreSQL : `/var` 

   - `/lib/postgresql/data` . Il assure la persistance des données de la base. 

- `keycloak-data` : volume dédié à la configuration et aux données de Keycloak. Il permet de conserver les _realms_ , les clients et les utilisateurs configurés. 

## **9.5.4 Fichier Docker Compose de référence** 

Le fichier `docker-compose.yml` ci-dessous définit l’ensemble de l’infrastructure : 

```
version:’3.8’
```

```
services:
```

- `# --- CONTENEUR 1 : BASE DE DONNÉES ---` 

```
IncidentFLow-postgres:
```

```
image:postgres:15-alpine
```

```
container_name:IncidentFLow-postgres
```

```
environment:
```

```
POSTGRES_DB:IncidentFLow_db
```

```
POSTGRES_USER:IncidentFLow_user
```

27 

IncidentFLow - Incident Management App 

Spécification des Exigences 

```
POSTGRES_PASSWORD:${DB_PASSWORD}
```

```
ports:
```

```
-"5432:5432"
```

```
volumes:
-
postgres-data:/var/lib/postgresql/data
networks:
```

```
-IncidentFLow-network
```

```
restart:unless-stopped
```

```
#---CONTENEUR2:KEYCLOAK(IAM)---
```

```
IncidentFLow-keycloak:
```

```
image:quay.io/keycloak/keycloak:latest
container_name:IncidentFLow-keycloak
command:start-dev
environment:
```

```
KEYCLOAK_ADMIN:admin
KEYCLOAK_ADMIN_PASSWORD:${KC_PASSWORD}
KC_DB:postgres
KC_DB_URL:jdbc:postgresql://IncidentFLow-postgres:5432/IncidentFLow_db
KC_DB_USERNAME:IncidentFLow_user
```

```
KC_DB_PASSWORD:${DB_PASSWORD}
```

```
ports:
```

```
-"8180:8080"
```

```
depends_on:
-
IncidentFLow-postgres
networks:
```

```
-IncidentFLow-network
```

```
restart:unless-stopped
```

```
#---CONTENEUR3:BACKENDSPRINGBOOT---
```

```
IncidentFLow-backend:
```

```
build:./backend
container_name:IncidentFLow-backend
environment:
```

```
SPRING_DATASOURCE_URL:jdbc:postgresql://
IncidentFLow-postgres:5432/IncidentFLow_db
SPRING_DATASOURCE_USERNAME:IncidentFLow_user
SPRING_DATASOURCE_PASSWORD:${DB_PASSWORD}
KEYCLOAK_AUTH_SERVER_URL:http://
IncidentFLow-keycloak:8080
```

```
ports:
```

```
-"8080:8080"
```

```
depends_on:
```

28 

IncidentFLow - Incident Management App 

Spécification des Exigences 

```
-
IncidentFLow-postgres
```

```
-
IncidentFLow-keycloak
```

```
networks:
```

```
-IncidentFLow-network
```

```
restart:unless-stopped
```

```
#---CONTENEUR4:FRONTENDREACT---
```

```
IncidentFLow-frontend:
```

```
build:./frontend
container_name:IncidentFLow-frontend
environment:
```

```
REACT_APP_API_URL:http://IncidentFLow-backend:8080
```

```
REACT_APP_KEYCLOAK_URL:http://
IncidentFLow-keycloak:8080
```

```
ports:
```

```
-"3000:80"
```

```
depends_on:
-IncidentFLow-backend
```

```
networks:
```

```
-IncidentFLow-network
```

```
restart:unless-stopped
```

```
volumes:
```

```
postgres-data:
```

```
networks:
```

```
IncidentFLow-network:
```

```
driver:bridge
```

## **9.5.5 Ordre de démarrage et dépendances** 

L’orchestration Docker Compose respecte l’ **ordre de dépendance** suivant lors du démarrage : 

1. **PostgreSQL** démarre en premier — la base de données doit être disponible avant tout autre service. 

2. **Keycloak** démarre ensuite — il dépend de PostgreSQL pour stocker sa configuration (realms, clients, utilisateurs). 

3. **Backend Spring Boot** démarre après PostgreSQL et Keycloak — il nécessite la base de données pour la persistance et Keycloak pour la validation des tokens JWT. 

4. **Frontend React** démarre en dernier — il nécessite que le backend soit disponible pour les appels API. 

29 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **9.5.6 Environnements de déploiement** 

Grâce à Docker, le système IncidentFLow peut être déployé de manière identique dans trois environnements : 

- **Développement** : exécution locale avec `docker-compose up` pour les développeurs. Les variables d’environnement sont gérées via un fichier `.env` . 

- **Recette (Staging)** : déploiement sur un serveur de test avec les mêmes images Docker, permettant la validation fonctionnelle avant la mise en production. 

- **Production** : déploiement sur un serveur de production avec des configurations de sécurité renforcées (HTTPS, secrets chiffrés, monitoring). 

## **9.6 Diagramme de workflow des incidents** 

Le diagramme d’états ci-dessous modélise le cycle de vie complet d’un incident dans le système IncidentFLow. Un incident passe par les états suivants : 

1. **Nouveau** : état initial lors de la création de l’incident. 

2. **Assigné** : l’incident est attribué à un opérateur suite à une action d’attribution. 

3. **Investigation** : l’opérateur débute le traitement de l’incident. Une réaffectation reste possible à ce stade. 

4. **Résolu** : l’incident est considéré comme résolu. Une réouverture est possible si le problème persiste. 

5. **Clôturé** : état final après validation de la résolution. 

30 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 6 – Diagramme de workflow (états-transitions) d’un incident 

31 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **10 Modèle de données** 

Le diagramme entité-relation ci-dessous présente le modèle de données du système IncidentFLow. Les principales entités sont : 

- **Role** : définit les rôles disponibles dans le système (id, name). 

- **User** : représente un utilisateur du système (id, name, email, password), associé à un rôle. 

- **Incident** : entité centrale contenant les informations d’un incident (id, title, description, priority, status), rattachée à un utilisateur. 

- **Comment** : commentaire associé à un incident (id, content, date). 

- **Attachment** : pièce jointe rattachée à un incident (id, filename). 

Les relations sont les suivantes : un **Role** peut être attribué à plusieurs **Users** , un **User** peut être associé à plusieurs **Incidents** , et chaque **Incident** peut contenir plusieurs **Comments** et **Attachments** . 

32 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 7 – Diagramme entité-relation du modèle de données IncidentFLow 

33 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **11 API** 

Liste indicative des principales API : 

— POST /incidents 

- GET /incidents 

- PUT /incidents/{id} 

- DELETE /users/{id} 

- GET /dashboard 

## **11.1 Diagramme de flux API** 

Le diagramme ci-dessous illustre le flux d’un appel API typique dans le système IncidentFLow. Lorsqu’un **Client** soumet une requête (par exemple, `POST /incidents` ) via l’interface **React** , celle-ci est transmise au contrôleur **API** du backend, qui délègue le traitement au **Service** métier. Ce dernier persiste les données dans **PostgreSQL** et renvoie la réponse au client via la chaîne inverse. 

Figure 8 – Diagramme de flux API du système IncidentFLow 

## **— 11.2 Diagramme de séquence Création d’un incident** 

Le diagramme de séquence suivant détaille le processus complet de création d’un incident. L’ **Opérateur** remplit le formulaire dans l’interface **React** , qui envoie une requête `POST /incidents` au backend **Spring Boot** . Le backend vérifie d’abord le token JWT auprès de **Keycloak** . Une fois l’authentification validée, l’incident est sauvegardé dans **PostgreSQL** . Le backend retourne ensuite une réponse `201 Created` au frontend, qui confirme la création de l’incident à l’opérateur. 

34 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 9 – Diagramme de séquence — Création d’un incident 

## **— 11.3 Diagramme d’activité Ajout d’un incident** 

Le diagramme d’activité ci-dessous modélise le processus métier d’ajout d’un incident. Après la **connexion** de l’utilisateur, celui-ci accède au formulaire de **création d’incident** . Le système vérifie si les **informations sont valides** . En cas de succès, l’incident est **enregistré** dans le système et une **notification** est envoyée. En cas d’erreur de validation, les **messages d’erreur** sont affichés à l’utilisateur. 

Figure 10 – Diagramme d’activité — Ajout d’un incident 

35 

IncidentFLow - Incident Management App 

Spécification des Exigences 

## **12 Wireframes** 

Cette section est réservée à l’insertion de maquettes (wireframes) : 

- Écran de connexion (Login). 

- Écran de dashboard. 

- Liste des incidents. 

- Formulaire de création d’incident. 

- Écran de gestion des utilisateurs. 

- Écran d’administration. 

## **13 Matrice de traçabilité** 

La matrice de traçabilité ci-dessous illustre le chaînage entre les différents artefacts du projet : des **User Stories** aux **Use Cases** , puis aux **Requirements** et enfin aux **Tests** . Ce mécanisme de traçabilité garantit que chaque exigence est couverte par un test et découle d’un besoin utilisateur identifié. 

Figure 11 – Chaîne de traçabilité du projet IncidentFLow 

Le tableau suivant détaille la correspondance entre les artefacts : 

|User Story|Use Case|Requirement|Test|
|---|---|---|---|
|US-001|UC-001|REQ-INC-001|Test de création d’incident (E2E UI)|
|US-002|UC-004|REQ-INC-005|Test de filtrage et consultation des incidents|
|US-003|UC-008|REQ-USER-001|Test de création d’utilisateur|
|US-004|UC-009|REQ-USER-006|Test de gestion des rôles|
|US-005|UC-007|REQ-INC-002|Test de clôture d’incident médical|



## **14 Planning** 

Le cycle de vie du projet IncidentFLow suit une approche séquentielle structurée en cinq phases principales : **Requirements** , **Design** , **Development** , **Testing** et **Deployment** . 

Le diagramme de Gantt ci-dessous présente le planning prévisionnel du projet pour le mois de juillet 2026. Chaque phase est planifiée de manière à permettre un enchaînement fluide des activités, avec des chevauchements minimaux pour assurer la qualité des livrables. 

36 

IncidentFLow - Incident Management App 

Spécification des Exigences 

Figure 12 – Diagramme de Gantt — Planning du projet IncidentFLow 

## **15 Annexes** 

Les annexes peuvent inclure : 

- Diagrammes d’architecture détaillés. 

- Diagrammes de séquence. 

- Documents de glossaire étendu. 

- Références complémentaires. 

37 

