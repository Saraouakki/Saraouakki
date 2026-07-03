# Logistique & Transit — Plateforme

Application de gestion logistique combinant :

- **Transit douanier** — dossiers, statuts de dédouanement, documents (CMR, T1, connaissement, etc.)
- **Freight / suivi d'expéditions** — timeline d'événements par dossier (enlèvement, transit, douane, livraison)
- **Gestion de flotte** — véhicules, conteneurs, chauffeurs
- **Gestion d'entrepôt** — articles en stock, seuils de réapprovisionnement, mouvements d'entrée/sortie

**Notion sert de base de données** : toutes les données (clients, transporteurs, dossiers, stock, documents...)
vivent dans des bases Notion, et l'application Next.js les lit/écrit via l'API officielle Notion.

## Stack

- Next.js 15 (App Router) + TypeScript, rendu serveur (aucune base de données à héberger)
- `@notionhq/client` pour interroger les *data sources* Notion
- CSS natif (pas de dépendance UI), thème clair/sombre automatique

## Modèle de données Notion

Une page Notion parente **« 🚚 Logistique & Transit — Plateforme »** contient 10 bases :

| Base | Rôle |
|---|---|
| `Clients` | Donneurs d'ordre (importateurs/exportateurs) |
| `Transporteurs` | Sociétés de transport (routier, maritime, aérien, ferroviaire) |
| `Véhicules` | Camions, semi-remorques, conteneurs — liés à un transporteur |
| `Chauffeurs` | Conducteurs — liés à un véhicule |
| `Entrepôts` | Sites d'entreposage |
| `Articles (Stock)` | Références en stock — liées à un entrepôt |
| `Dossiers` | **Table centrale** : un dossier = une expédition/transit, lié à client, transporteur, véhicule, chauffeur, entrepôt, avec statut de workflow, dates, poids/volume/valeur |
| `Documents` | Pièces justificatives par dossier (CMR, facture, T1, B/L, certificat d'origine...) |
| `Mouvements de stock` | Entrées/sorties de stock, éventuellement liées à un dossier |
| `Étapes de suivi` | Timeline d'événements par dossier (freight tracking) |

Le statut d'un dossier suit ce workflow :
`Créé → Enlèvement → En transit → Douane - contrôle → Douane - dédouané → Livraison en cours → Livré` (ou `Annulé`).

## Configuration

### 1. Créer une intégration Notion

1. Allez sur https://www.notion.so/my-integrations et créez une **intégration interne**.
2. Copiez le jeton (`secret_...`).
3. Ouvrez la page Notion **« 🚚 Logistique & Transit — Plateforme »** créée pour ce projet, cliquez sur
   `···` → `Connexions` → ajoutez votre intégration, pour qu'elle ait accès à toutes les bases qu'elle contient.

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Renseignez `NOTION_TOKEN` avec votre jeton. Les IDs des 10 bases (`NOTION_DS_*`) sont déjà pré-remplis avec
celles créées pour ce projet — ne les modifiez que si vous dupliquez le workspace ou créez vos propres bases
(dans ce cas, reproduisez le schéma décrit ci-dessus).

### 3. Installer et lancer

```bash
npm install
npm run dev
```

Ouvrez http://localhost:3000.

## Fonctionnalités de l'application

- **Vue d'ensemble** — KPIs (dossiers actifs, en dédouanement, valeur en transit, véhicules disponibles,
  alertes de stock) + dossiers récents + alertes de réapprovisionnement.
- **Dossiers** — liste complète, page de détail par dossier avec informations générales, documents,
  timeline de suivi, et **changement de statut en direct** (écrit dans Notion via l'API).
- **Flotte** — véhicules/conteneurs et chauffeurs, avec statuts (disponible / en mission / maintenance).
- **Entrepôt** — entrepôts, stock par article avec alertes de seuil, mouvements d'entrée/sortie.
- **Clients** — répertoire des donneurs d'ordre.

Toute donnée manquante ou mal configurée (jeton invalide, page non partagée) affiche un message d'erreur
explicite dans l'interface plutôt qu'un plantage.

## Étendre le projet

- Ajouter la création de dossiers/documents depuis l'UI (actuellement en lecture + changement de statut).
- Ajouter des notifications (email/Slack) sur changement de statut via l'API Notion + webhook.
- Générer automatiquement des documents douaniers à partir des données du dossier.
