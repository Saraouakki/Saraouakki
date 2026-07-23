# Om Ritaj

Pâtisserie marocaine artisanale, faite maison — vendue au kilo avec paiement à la livraison. Plateforme e-commerce créée pour la page Instagram [@omritaj28](https://www.instagram.com/omritaj28).

- Theme: Crème (`#FFF8F0`) + Brun chocolat (`#4A2C1D`) + Or caramel (`#C9974A`).

## Contenu du repo

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'accueil, carte des pâtisseries, plateau personnalisé (تشكيلة), panier multi-produits, galerie, commande (poids au kg, frais de livraison, note, OTP, emballage cadeau) |
| `tracking.html` | Page de suivi de commande pour les clients |
| `styles.css` | Thème Om Ritaj (couleurs, typographie, composants) |
| `server.js` | Backend Express : OTP, prise de commande, sync Google Sheets, webhook livraison, suivi de commande |
| `package.json` | Dépendances backend |
| `.env.example` | Modèle de variables d'environnement (Twilio, Google Sheets, livraison) |
| `docs/PRODUCTS.md` | Carte des pâtisseries et prix au kilo |
| `docs/DEPLOYMENT_GUIDE.md` | Guide de déploiement Hostinger pas à pas |

## Démarrage rapide (local)

```bash
npm install
cp .env.example .env   # renseigner Twilio / Google Sheets / livreur, ou laisser vide pour le mode mock
npm start
```

Puis ouvrir `http://localhost:3000`.

## Déploiement

Voir [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) pour le guide complet Hostinger.

## Catalogue

Voir [`docs/PRODUCTS.md`](docs/PRODUCTS.md) pour la liste des pâtisseries et leurs prix au kilo.

## À faire avant la mise en ligne

- Remplacer les icônes symboliques des produits par de vraies photos.
- Vérifier/compléter les coordonnées de contact (WhatsApp, e-mail).
- Configurer Twilio, Google Sheets et le webhook du livreur si l'automatisation complète est souhaitée (sinon le site fonctionne en mode mock, sans SMS réel ni sync automatique).
