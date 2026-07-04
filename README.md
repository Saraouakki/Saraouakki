# Logistique & Transit — Plateforme

Application de gestion logistique combinant :

- **Transit douanier** — dossiers, statuts de dédouanement, documents (CMR, T1, connaissement, etc.)
- **Freight / suivi d'expéditions** — timeline d'événements par dossier (enlèvement, transit, douane, livraison)
- **Gestion de flotte** — véhicules, conteneurs, chauffeurs
- **Gestion d'entrepôt** — articles en stock, seuils de réapprovisionnement, mouvements d'entrée/sortie,
  fournisseurs
- **Comptes multi-rôles** — équipe interne, **clients** et **fournisseurs** ont chacun leur espace connecté,
  avec auto-inscription et validation par l'équipe

**Notion sert de base de données** : toutes les données (clients, fournisseurs, transporteurs, dossiers,
stock, documents, comptes utilisateurs, journal d'audit...) vivent dans des bases Notion, et l'application
Next.js les lit/écrit via l'API officielle Notion.

## Stack

- Next.js 15 (App Router) + TypeScript, rendu serveur (aucune base de données à héberger)
- `@notionhq/client` pour interroger les *data sources* Notion, avec cache en mémoire (TTL) et requêtes
  filtrées côté API pour les portails client/fournisseur
- Authentification par session : `bcryptjs` (mots de passe hashés dans Notion) + `jose` (JWT signé en cookie
  httpOnly) + middleware de contrôle d'accès par rôle
- Rate-limiting sur les routes sensibles (connexion, inscription, réinitialisation), en mémoire par défaut,
  ou distribué via Upstash Redis si configuré
- Envoi d'e-mails pluggable (console en dev, SMTP ou Resend en prod) et notification Slack
- Génération de PDF (`pdf-lib`), upload de fichiers vers Notion (File Upload API)
- Tests unitaires (`vitest`) sur la logique d'authentification et de contrôle d'accès
- CSS natif responsive (pas de dépendance UI), thème clair/sombre automatique, i18n FR/EN

## Modèle de données Notion

Une page Notion parente **« 🚚 Logistique & Transit — Plateforme »** contient 13 bases, toutes reliées entre
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
| `Documents` | Pièces justificatives par dossier (CMR, facture, T1, B/L, certificat d'origine...), fichier attaché |
| `Mouvements de stock` | Entrées/sorties de stock, liées à un article, un dossier et un fournisseur |
| `Étapes de suivi` | Timeline d'événements par dossier (freight tracking) |
| `Utilisateurs` | Comptes de connexion — rôle (Interne/Client/Fournisseur), permission interne (Admin/Lecture seule), lien vers un `Client` ou `Fournisseur`, mot de passe hashé, jeton de réinitialisation |
| `Journal d'audit` | Connexions, échecs de connexion, créations de compte/dossier, changements de statut, ajouts de documents |

Toutes les relations sont bidirectionnelles (DUAL) côté Fournisseurs : depuis la fiche d'un fournisseur dans
Notion, on voit directement les articles qu'il fournit, les dossiers et les mouvements de stock associés.

Le statut d'un dossier suit ce workflow :
`Créé → Enlèvement → En transit → Douane - contrôle → Douane - dédouané → Livraison en cours → Livré` (ou `Annulé`).

### Créer le schéma automatiquement (nouveau workspace)

Pour démarrer un **nouveau** déploiement (nouveau client, nouvelle entreprise) sans tout recréer à la main :

```bash
NOTION_TOKEN=secret_xxx npx tsx scripts/seed-notion.ts
```

Ce script crée la page parente et les 13 bases avec leurs relations dans le workspace Notion associé au
jeton fourni, puis imprime le bloc `NOTION_DS_*` à coller dans `.env.local`. Il ne crée aucune donnée de
démonstration — la base est vide, prête pour un client réel. Partagez ensuite la page créée avec votre
intégration Notion (`···` → `Connexions`).

## Comptes et rôles

Trois rôles, chacun avec son propre espace :

| Rôle | Accès |
|---|---|
| **Interne** (équipe logistique) | Accès complet : Vue d'ensemble, tous les Dossiers, Flotte, Entrepôt, Clients, Fournisseurs, Comptes en attente, Journal d'audit. Une **permission** (`Admin` / `Lecture seule`) distingue qui peut écrire (changer un statut, créer un dossier, valider un compte) de qui consulte seulement. |
| **Client** | « Mon espace » : uniquement ses propres dossiers (filtrés côté API Notion via la relation `Client`), avec suivi, documents et export PDF. |
| **Fournisseur** | « Mon espace » : les dossiers où il est la source d'approvisionnement, les articles qu'il fournit, et les mouvements de stock associés. |

L'accès est contrôlé à plusieurs niveaux : un middleware (`middleware.ts`) qui bloque les zones réservées à
l'équipe interne, une vérification de propriété sur la page de détail d'un dossier (`lib/access.ts`, testée
unitairement), et une vérification de permission sur chaque route d'écriture.

### Auto-inscription

Un client ou un fournisseur peut demander un accès depuis `/signup` (nom, société, email, mot de passe). Le
compte est créé avec le statut **« En attente »** et n'est pas utilisable tant qu'un membre de l'équipe
interne ne l'a pas validé depuis la page **Comptes** (`/comptes`). Un e-mail de notification est envoyé à
`ADMIN_NOTIFICATION_EMAIL` si configuré.

### Mot de passe oublié

`/forgot-password` envoie un lien de réinitialisation à usage unique (valable 1h, jeton haché en base) ;
`/reset-password` permet de choisir un nouveau mot de passe. Sans configuration d'envoi d'e-mail (voir plus
bas), le lien est simplement journalisé dans la console du serveur — pratique en développement, à corriger
avant un vrai lancement.

### Comptes de démonstration

Créés dans la base `Utilisateurs`, mot de passe identique pour les trois : `Logistique2026!`

| Email | Rôle |
|---|---|
| `srouakki@gmail.com` | Interne (Admin) |
| `client@atlastextiles.ma` | Client (Atlas Textiles SARL) |
| `contact@textilesdusud.ma` | Fournisseur (Textiles du Sud) |

## Configuration

### 1. Créer une intégration Notion

1. Allez sur https://www.notion.so/my-integrations et créez une **intégration interne**.
2. Copiez le jeton (`secret_...`).
3. Ouvrez la page Notion **« 🚚 Logistique & Transit — Plateforme »**, cliquez sur `···` → `Connexions` →
   ajoutez votre intégration.

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Champs obligatoires : `NOTION_TOKEN`, `AUTH_SECRET` (valeur aléatoire, ex. `openssl rand -base64 32`), et les
13 `NOTION_DS_*` (déjà pré-remplis avec les bases créées pour ce projet, ou générés par `scripts/seed-notion.ts`
pour un nouveau workspace).

Champs optionnels (l'app fonctionne sans, en mode dégradé documenté dans `.env.example`) :

| Variable | Effet si absente |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate-limiting en mémoire locale au lieu de distribué (voir « Limites » ci-dessous) |
| `SMTP_HOST` / `RESEND_API_KEY` | Les e-mails (reset password, notifications, activation de compte) sont journalisés en console au lieu d'être envoyés |
| `SLACK_WEBHOOK_URL` | Les notifications Slack sont journalisées en console |
| `SENTRY_DSN` | Pas de remontée d'erreurs externe, seulement `console.error` |
| `ADMIN_NOTIFICATION_EMAIL` | Personne n'est notifié par e-mail des nouvelles inscriptions (à valider manuellement sur `/comptes`) |

### 3. Installer et lancer

```bash
npm install
npm run dev    # démarre l'app sur http://localhost:3000
npm test       # exécute les tests unitaires (auth, session, contrôle d'accès)
npm run build  # build de production
```

Ouvrez http://localhost:3000 — vous serez redirigé vers `/login`.

## Fonctionnalités de l'application

- **Connexion par email/mot de passe**, rate-limitée, session signée en cookie httpOnly, déconnexion en un
  clic, sélecteur de langue FR/EN.
- **Auto-inscription** client/fournisseur avec file d'attente de validation par l'équipe interne.
- **Mot de passe oublié / réinitialisation** par lien à usage unique.
- **Vue d'ensemble** (interne) — KPIs (dossiers actifs, en dédouanement, valeur en transit, véhicules
  disponibles, alertes de stock, nombre de clients/fournisseurs) + dossiers récents + alertes de
  réapprovisionnement.
- **Dossiers** (interne) — recherche/filtre par statut/tri, création de dossier depuis un formulaire, page de
  détail avec informations générales, documents (**upload de fichiers**, ex. CMR/factures), timeline de
  suivi, **export PDF** du dossier, et **changement de statut en direct** (déclenche un e-mail au client et
  une notification Slack).
- **Flotte** (interne) — véhicules/conteneurs et chauffeurs, avec statuts.
- **Entrepôt** (interne) — entrepôts, stock par article (recherche + filtre alertes) avec fournisseur
  associé, mouvements d'entrée/sortie.
- **Clients** / **Fournisseurs** (interne) — répertoires avec recherche, compteurs d'articles et de dossiers
  liés pour les fournisseurs.
- **Comptes** (interne) — validation ou refus des demandes d'inscription en attente.
- **Journal d'audit** (interne) — connexions, échecs de connexion, créations, changements de statut.
- **Mon espace** (client ou fournisseur) — vue filtrée automatiquement, avec export PDF des dossiers.
- **Responsive** — menu latéral en tiroir sur mobile, grilles et tableaux adaptatifs.

Toute donnée manquante ou mal configurée (jeton invalide, page non partagée) affiche un message d'erreur
explicite dans l'interface plutôt qu'un plantage, et remonte vers Sentry si configuré.

## Est-ce prêt pour un lancement commercial international ?

Tout ce qui précède est réellement implémenté et testé (build, tests unitaires, parcours par rôle vérifiés
avec des sessions simulées). Honnêtement, quelques points restent à traiter avant une mise en production à
grande échelle, et ne peuvent pas être validés dans cet environnement faute d'un vrai jeton Notion / de vrais
identifiants de service :

- **Scalabilité Notion** : l'API Notion est limitée à ~3 requêtes/seconde. Le cache en mémoire et les
  requêtes filtrées réduisent la charge, mais au-delà de quelques milliers de dossiers, une vraie base de
  données (Postgres, etc.) synchronisée depuis Notion serait plus indiquée.
- **Rate-limiting distribué** : sans Upstash configuré, le rate-limiting est en mémoire locale — efficace sur
  une seule instance, pas partagé entre plusieurs instances serverless.
- **E-mails/Slack** : les intégrations sont câblées et basculent automatiquement en mode "journal console" si
  aucun fournisseur n'est configuré — à brancher sur un vrai SMTP/Resend/Slack avant le lancement.
- **i18n** : l'infrastructure FR/EN couvre la navigation, la connexion et la vue d'ensemble ; étendre à
  d'autres pages ou langues se fait en ajoutant des clés dans `lib/i18n.ts`.
- **Sentry** : câblé en mode « no-op sans DSN » ; fournir un `SENTRY_DSN` réel pour l'activer.
- **`scripts/seed-notion.ts`** : vérifié par typage strict contre le SDK Notion officiel, mais non exécuté
  contre un vrai compte dans cet environnement (aucun jeton Notion brut disponible ici) — à tester une fois
  sur un workspace de test avant de le proposer à des clients.

## Étendre le projet

- Génération automatique de documents douaniers plus riches (actuellement un résumé PDF du dossier).
- Recherche plein texte inter-bases, pagination pour de très gros volumes.
- Rôles internes plus fins (ex. par entrepôt ou par zone géographique).
- Portail de facturation/devis.
