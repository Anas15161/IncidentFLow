# 📊 IncidentFlow - Documentation des Métriques Analytics ITIL & Performance

Bienvenue dans la documentation officielle du **Module d'Analytics ITIL et de Mesure de Performance** d'**IncidentFlow**. Ce document détaille le fonctionnement, les formules de calcul, l'architecture technique et les cas d'usage des indicateurs clés de performance (KPIs) intégrés à la plateforme.

---

## 🎯 1. Vue d'Ensemble des Indicateurs Clés (KPIs)

| Indicateur | Signification | Objectif Métier | Formule & Méthode de Calcul |
| :--- | :--- | :--- | :--- |
| **MTTR** | *Mean Time to Resolve* | Mesurer la rapidité de résolution globale des incidents. | $\text{MTTR} = \frac{\sum (\text{Date Résolution} - \text{Date Création})}{\text{Nombre d'incidents résolus}}$ |
| **MTTA** | *Mean Time to Acknowledge* | Évaluer la réactivité initiale lors de l'assignation. | $\text{MTTA} = \frac{\sum (\text{Date Prise en Charge} - \text{Date Création})}{\text{Nombre d'incidents pris en charge}}$ |
| **Taux SLA** | *SLA Compliance Rate (%)* | Garantir le respect des engagements de service. | $\text{Conformité SLA} = \left( \frac{\text{Incidents dans les temps}}{\text{Total des incidents}} \right) \times 100$ |
| **Goulot** | *Bottleneck Analysis* | Détecter les étapes de workflow saturées. | $\text{Taux d'Étranglement} = \max_{s \in \text{États}} \left( \frac{\text{Incidents dans l'état } s}{\text{Total des incidents}} \right) \times 100$ |

---

## ⏱️ 2. Détail des Métriques ITIL

### 1. MTTR (Temps Moyen de Résolution)
- **Définition** : Durée moyenne écoulée entre l'ouverture d'un incident et son passage à l'état `Résolu` ou `Clôturé`.
- **Unités** : Exprimé en heures et minutes (ex: `3h 30m`).
- **Impact** : Permet aux responsables d'évaluer l'efficacité technique globale de l'équipe support.

### 2. MTTA (Temps Moyen de Prise en Charge)
- **Définition** : Délai moyen nécessaire pour qu'un incident nouvellement déclaré soit assigné à un technicien ou passe en statut `En cours`.
- **Unités** : Exprimé en minutes (ex: `18 min`).
- **Impact** : Indique l'efficacité du triage et de la première ligne d'assistance (*Helpdesk*).

### 3. Jauge de Conformité SLA (%)
- **Définition** : Pourcentage des incidents dont le délai maximal de résolution (`slaDueAt`) n'a pas été dépassé.
- **Indicateur Visuel** :
  - 🟢 **Vert (≥ 90%)** : Service optimal.
  - 🟠 **Orange (75% - 89%)** : Vigilance requise.
  - 🔴 **Rouge (< 75%)** : Alerte critique sur le respect des engagements.

### 4. Analyse des Goulots d'Étranglement (*Bottlenecks*)
- **Principe** : Analyse la répartition des incidents dans chaque colonne du workflow (`Nouveau`, `En cours`, `Résolu`, `Clôturé`).
- **Alerte Intelligente** : Si une étape concentre un pourcentage anormalement élevé d'incidents (ex: > 40% dans *"En cours"*), le système affiche une alerte recommandée :
  > ⚠️ **45% des incidents** sont concentrés dans la colonne *"En cours"*. Recommandation : Affecter plus de ressources.

---

## 🔒 3. Intégration avec la Sécurité & Isolation Stricte (Option B)

Toutes les métriques du composant `AnalyticsKPIWidget` respectent scrupuleusement la politique d'accès **Option B** :

- **Pour les Administrateurs / Gestionnaires** : Les métriques MTTR, MTTA et SLA sont calculées sur la **vue globale** de l'ensemble de l'organisation.
- **Pour les Techniciens / Demandeurs** : Les calculs sont filtrés de manière étanche et portent uniquement sur les **incidents autorisés** (assignés à l'utilisateur ou créés par lui).

---

## 🛠️ 4. Architecture Technique React

- **Composant source** : [`frontend/src/AnalyticsKPIWidget.jsx`](file:///home/anas/Desktop/stage/App/frontend/src/AnalyticsKPIWidget.jsx)
- **Optimisation** : Tous les calculs statistiques complexes sont mémorisés via React `useMemo` pour offrir des performances temps réel sans aucun re-rendu superflu (0 churn JS).
- **Intégration** :
  - **Dashboard Principal** : Directement visible au sommet de la page Dashboard dans [`App.jsx`](file:///home/anas/Desktop/stage/App/frontend/src/App.jsx).
  - **Tableau Kanban** : Accessible à la demande via le bouton **`📊 Analytics ITIL`** dans [`KanbanView.jsx`](file:///home/anas/Desktop/stage/App/frontend/src/KanbanView.jsx).

---
*IncidentFlow - Document de Référence Analytics ITIL & Performance*
