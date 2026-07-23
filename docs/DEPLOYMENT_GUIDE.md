# Om Ritaj — Guide de déploiement Hostinger

Ce guide met en ligne l'ensemble du site (`index.html`, `tracking.html`, `styles.css`, `server.js`) sur Hostinger. Comme `server.js` doit s'exécuter (ce n'est pas un site statique), tu utiliseras le panneau **"Setup Node.js App"** de Hostinger — même flux d'upload par File Manager que d'habitude, avec une étape en plus pour indiquer à Hostinger que `server.js` est le fichier de démarrage. Pas besoin de Git, ni de CLI, ni de SSH.

> Si ton offre Hostinger n'affiche pas "Setup Node.js App" (disponible sur les offres Premium/Business/Cloud et plus), passe directement à l'**Option B** plus bas (site statique uniquement).

---

## Option A — Application Node.js via hPanel (recommandé, stack complète)

### Étape 1 — Connexion et ouverture du gestionnaire Node.js
1. Connecte-toi à Hostinger → **hPanel**.
2. Va dans **Avancé → Node.js** (parfois listé comme "Setup Node.js App").
3. Clique sur **Créer une application**.
4. Configure :
   - **Version Node.js :** 18.x ou plus récent
   - **Racine de l'application :** ex. `om-ritaj` (devient un dossier sous ton compte)
   - **URL de l'application :** ton domaine ou sous-domaine (ex. `omritaj.ma`)
   - **Fichier de démarrage de l'application :** `server.js`
5. Clique sur **Créer**. Hostinger provisionne l'application et affiche le **chemin racine** (ex. `/home/USERNAME/om-ritaj`) — note-le.

### Étape 2 — Upload des fichiers via File Manager
1. Va dans **Fichiers → Gestionnaire de fichiers**.
2. Navigue vers le chemin racine de l'étape 1.
3. Upload ces fichiers/dossiers directement dans cette racine (glisser-déposer ou bouton Upload) :
   - `index.html`
   - `tracking.html`
   - `styles.css`
   - `server.js`
   - `package.json`
   - `.env.example` (optionnel — référence uniquement, ne pas s'y fier en production)
4. **Ne pas** uploader `node_modules` — les dépendances seront installées depuis le panneau Node.js à l'étape 3.

### Étape 3 — Installer les dépendances
1. Retourne dans **Avancé → Node.js**, ouvre ton application.
2. Clique sur **Run NPM Install** (lit `package.json` et installe `express`, `cors`, `dotenv`, `googleapis`, `twilio`).
3. Attends la fin (quelques secondes à une minute).

### Étape 4 — Configurer les variables d'environnement
1. Sur le même écran de l'application Node.js, trouve **Environment Variables**.
2. Ajoute chaque variable de `.env.example`, remplie avec les vraies valeurs :
   - `PORT` → laisse la valeur assignée par Hostinger (généralement automatique)
   - `NODE_ENV` → `production`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` (voir configuration Twilio ci-dessous)
   - `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (voir configuration Google Sheets ci-dessous)
   - `THREEPL_WEBHOOK_URL`, `THREEPL_API_KEY` (fournis par ton partenaire de livraison, ex. Amana, Speedaf, CTM)
3. Clique sur **Enregistrer**.

### Étape 5 — Démarrer l'application
1. Clique sur **Redémarrer** (ou **Démarrer**) sur l'application Node.js.
2. Visite ton domaine — la page Om Ritaj devrait se charger, servie directement par `server.js` (via `express.static`).

**Temps total : moins de 5 minutes** une fois les fichiers prêts.

---

## Option B — Site statique uniquement (pas de panneau Node.js disponible)

Si ton offre Hostinger est statique uniquement :
1. Upload `index.html`, `tracking.html` et `styles.css` dans `public_html/` via File Manager. La page d'accueil et l'**interface** de commande fonctionneront immédiatement.
2. Héberge `server.js` séparément sur une plateforme compatible Node (Render, Railway, Fly.io — toutes ont un plan gratuit) et redirige les appels `fetch()` du frontend (`index.html`/`tracking.html`) vers l'URL de ce backend plutôt que vers des chemins relatifs `/api/...`.
3. Le reste de ce guide (Twilio, Google Sheets, 3PL) s'applique de la même façon à ce backend hébergé séparément.

---

## Configurer les intégrations d'automatisation

### Twilio (vérification OTP par SMS/WhatsApp)
1. Crée un compte Twilio gratuit sur twilio.com.
2. Dans **Verify → Services**, crée un nouveau Verify Service — copie son **Service SID** dans `TWILIO_VERIFY_SERVICE_SID`.
3. Copie ton **Account SID** et ton **Auth Token** depuis le dashboard Twilio dans `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
4. (Optionnel, pour WhatsApp plutôt que SMS) Rejoins le Twilio WhatsApp Sandbox ou demande un numéro WhatsApp Business, puis renseigne `TWILIO_WHATSAPP_FROM`.
5. Sans configuration, `/api/otp/send` fonctionne en **mode mock** : il affiche le code à 6 chiffres dans la console serveur et le renvoie dans la réponse API (uniquement si `NODE_ENV` n'est pas `production`) pour tester le flux complet avant de configurer Twilio.

### Google Sheets (journal des commandes)
1. Dans Google Cloud Console, crée un projet → active l'**API Google Sheets**.
2. Crée un **compte de service**, puis génère une clé JSON.
3. Depuis le JSON : copie `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`, et `private_key` → `GOOGLE_PRIVATE_KEY` (garde les `\n` tels quels, le code les convertit au démarrage).
4. Crée ta feuille Google Sheets principale, nomme un onglet **Orders**, et ajoute cette ligne d'en-tête en `A1:L1` :
   `Order ID | Date | Nom client | Téléphone vérifié | Ville | Articles | Sous-total | Frais de livraison | Extra | Total | Note | Statut`
5. Partage la feuille avec l'e-mail du compte de service (étape 3) en accès **Éditeur**.
6. Copie l'ID de la feuille depuis son URL (`https://docs.google.com/spreadsheets/d/<CETTE_PARTIE>/edit`) dans `GOOGLE_SHEETS_ID`.

### Webhook 3PL / Livraison
1. Récupère l'URL du webhook et la clé API auprès de ton partenaire de livraison (ex. Amana, Speedaf, CTM).
2. Renseigne `THREEPL_WEBHOOK_URL` et `THREEPL_API_KEY`.
3. `server.js` envoie un payload JSON (client, adresse, produit, poids, montant à encaisser) à cette URL dès qu'une commande est confirmée — voir la fonction `forwardToFulfillment()` si ton partenaire attend un format différent.
4. Si ton partenaire renvoie des mises à jour de statut, pointe son webhook sortant vers `POST /api/orders/:orderId/status` avec `{ "status": "Remise au livreur" }` pour garder la page de suivi à jour.

---

## Checklist avant la mise en ligne
- [ ] Le domaine charge — la page d'accueil s'affiche avec le thème crème + brun.
- [ ] Sélectionner une pâtisserie → la section commande se remplit automatiquement (nom, prix/kg).
- [ ] Choisir un poids → le total se met à jour correctement.
- [ ] Cocher l'emballage cadeau → le total se met à jour.
- [ ] Entrer un vrai numéro de téléphone → cliquer sur **Vérifier** → recevoir le code (ou le lire dans les logs serveur en mode mock) → l'entrer → le statut passe à "Vérifié".
- [ ] Valider la commande → l'écran de confirmation affiche un numéro de commande (`OMR-...`).
- [ ] Ouvrir `tracking.html?order=<ce numéro>` → voir l'étape "Commande confirmée" en surbrillance.
- [ ] Vérifier la Google Sheet — une nouvelle ligne apparaît (une fois les identifiants configurés).
- [ ] Vérifier le tableau de bord/logs du partenaire de livraison — la commande a bien été reçue (une fois le webhook configuré).
