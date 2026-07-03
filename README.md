# Logistique & Transit — Plateforme

Application de gestion logistique combinant :

- **Transit douanier** — dossiers, statuts de dédouanement, documents (CMR, T1, connaissement, etc.)
- **Freight / suivi d'expéditions** — timeline d'événements par dossier (enlèvement, transit, douane, livraison)
- **Gestion de flotte** — véhicules, conteneurs, chauffeurs
- **Gestion d'entrepôt** — articles en stock, seuils de réapprovisionnement, mouvements d'entrée/sortie,
  fournisseurs
- **Comptes multi-rôles** — équipe interne, **clients** et **fournisseurs** ont chacun leur espace connecté

**Notion sert de base de données** : toutes les données (clients, fournisseurs, transporteurs, dossiers,
stock, documents, comptes utilisateurs...) vivent dans des bases Notion, et l'application Next.js les
lit/écrit via l'API officielle Notion.

## Stack

- Next.js 15 (App Router) + TypeScript, rendu serveur (aucune base de données à héberger)
- `@notionhq/client` pour interroger les *data sources* Notion
- Authentification par session : `bcryptjs` (mots de passe hashés dans Notion) + `jose` (JWT signé en cookie
  httpOnly) + middleware de contrôle d'accès par rôle
- CSS natif (pas de dépendance UI), thème clair/sombre automatique

## Modèle de données Notion

Une page Notion parente **« 🚚 Logistique & Transit — Plateforme »** contient 12 bases, toutes reliées entre
elles :

| Base | Rôle |
|---|---|
| `Clients` | Donneurs d'ordre (importateurs/exportateurs) |
| `Fournisseurs` | Fournisseurs de matières premières, pièces, emballage, services |
| `Transporteurs` | Sociétés de transport (routier, maritime, aérien, ferroviaire) |
| `Véhicules` | Camions, semi-remorques, conteneurs — liés à un transporteur |
| `Chauffeurs` | Conducteurs — liés à un véhicule |
| `Entrepôts` | Sites d'entreposage |
| `Articles (Stock)` | Références en stock — liées à un entrepôt **et** à un fournisseur |
| `Dossiers` | **Table centrale** : un dossier = une expédition/transit, lié à client, fournisseur, transporteur, véhicule, chauffeur, entrepôt, avec statut de workflow, dates, poids/volume/valeur |
| `Documents` | Pièces justificatives par dossier (CMR, facture, T1, B/L, certificat d'origine...) |
| `Mouvements de stock` | Entrées/sorties de stock, liées à un article, un dossier et un fournisseur |
| `Étapes de suivi` | Timeline d'événements par dossier (freight tracking) |
| `Utilisateurs` | Comptes de connexion à l'application — rôle (Interne / Client / Fournisseur), lien vers un `Client` ou un `Fournisseur`, mot de passe hashé |

Toutes les relations sont bidirectionnelles (DUAL) côté Fournisseurs : depuis la fiche d'un fournisseur dans
Notion, on voit directement les articles qu'il fournit, les dossiers et les mouvements de stock associés.

Le statut d'un dossier suit ce workflow :
`Créé → Enlèvement → En transit → Douane - contrôle → Douane - dédouané → Livraison en cours → Livré` (ou `Annulé`).

## Comptes et rôles

Trois rôles, chacun avec son propre espace :

| Rôle | Accès |
|---|---|
| **Interne** (équipe logistique) | Accès complet : Vue d'ensemble, tous les Dossiers, Flotte, Entrepôt, Clients, Fournisseurs. Seul ce rôle peut changer le statut d'un dossier. |
| **Client** | « Mon espace » : uniquement ses propres dossiers (filtrés via la relation `Client`), avec suivi et documents. |
| **Fournisseur** | « Mon espace » : les dossiers où il est la source d'approvisionnement, les articles qu'il fournit, et les mouvements de stock associés. |

L'accès est contrôlé à deux niveaux : un middleware (`middleware.ts`) qui bloque les zones réservées à
l'équipe interne, et une vérification de propriété sur la page de détail d'un dossier (un client ou
fournisseur ne peut ouvrir que les dossiers qui lui sont liés dans Notion).

### Comptes de démonstration

Créés dans la base `Utilisateurs`, mot de passe identique pour les trois : `Logistique2026!`

| Email | Rôle |
|---|---|
| `srouakki@gmail.com` | Interne |
| `client@atlastextiles.ma` | Client (Atlas Textiles SARL) |
| `contact@textilesdusud.ma` | Fournisseur (Textiles du Sud) |

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

Renseignez `NOTION_TOKEN` avec votre jeton, et `AUTH_SECRET` avec une valeur aléatoire (ex: `openssl rand
-base64 32`) utilisée pour signer les sessions de connexion. Les IDs des 12 bases (`NOTION_DS_*`) sont déjà
pré-remplis avec celles créées pour ce projet — ne les modifiez que si vous dupliquez le workspace ou créez
vos propres bases (dans ce cas, reproduisez le schéma décrit ci-dessus).

### 3. Installer et lancer

```bash
npm install
npm run dev
```

Ouvrez http://localhost:3000 — vous serez redirigé vers `/login`. Connectez-vous avec l'un des comptes de
démonstration ci-dessus.

## Fonctionnalités de l'application

- **Connexion par email/mot de passe**, session signée en cookie httpOnly, déconnexion en un clic.
- **Vue d'ensemble** (interne) — KPIs (dossiers actifs, en dédouanement, valeur en transit, véhicules
  disponibles, alertes de stock, nombre de clients/fournisseurs) + dossiers récents + alertes de
  réapprovisionnement.
- **Dossiers** (interne) — liste complète avec colonne fournisseur, page de détail avec informations
  générales, documents, timeline de suivi, et **changement de statut en direct** (écrit dans Notion via
  l'API, réservé au rôle Interne).
- **Flotte** (interne) — véhicules/conteneurs et chauffeurs, avec statuts (disponible / en mission /
  maintenance).
- **Entrepôt** (interne) — entrepôts, stock par article (avec fournisseur associé) et alertes de seuil,
  mouvements d'entrée/sortie avec fournisseur.
- **Clients** / **Fournisseurs** (interne) — répertoires, avec compteurs d'articles et de dossiers liés
  pour les fournisseurs.
- **Mon espace** (client ou fournisseur) — vue filtrée automatiquement sur les données qui les concernent.

Toute donnée manquante ou mal configurée (jeton invalide, page non partagée) affiche un message d'erreur
explicite dans l'interface plutôt qu'un plantage.

## Étendre le projet

- Ajouter la création de dossiers/documents depuis l'UI (actuellement en lecture + changement de statut).
- Ajouter des notifications (email/Slack) sur changement de statut via l'API Notion + webhook.
- Générer automatiquement des documents douaniers à partir des données du dossier.
- Auto-inscription des fournisseurs/clients avec validation par l'équipe interne avant activation du compte.
