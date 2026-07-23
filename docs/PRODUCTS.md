# Om Ritaj — Carte des pâtisseries

Tous les prix sont **au kilo (Dhs/kg)**, conformes à la liste de prix fournie. Ce catalogue est codé en dur dans `index.html` (constante `PRODUCTS`) — modifie-le directement là-bas si les prix ou les produits changent.

| Produit | Nom arabe | Prix (Dhs/kg) |
|---|---|---|
| Fqas Mraba3 | فقاص مربع | 90 |
| Memlihat | مملحات | 90 |
| Halwat Lboq | حلوة البوق | 90 |
| Fqas Karkaa | فقاص كركاع | 190 |
| Halwat Kenafa | حلوة الكنافة | 180 |
| Kaab Ghzal | كعب غزال | 280 |
| Msaban | مصبان | 280 |
| Bretzel | بريتزل | 140 |
| Halwat Tmar | حلوة التمر | 180 |
| Sablé | صابلي | 180 |
| Sablé Nutella | صابلي نوتيلا | 200 |

## Poids proposés au client

Le site propose des lots de **500 g / 1 kg / 1.5 kg / 2 kg / 3 kg**, avec le total calculé automatiquement (`prix au kg × poids`). Ajuste la liste `WEIGHT_OPTIONS` dans `index.html` si d'autres formats sont nécessaires (ex. 250 g).

## Panier multi-produits

Le client peut ajouter plusieurs pâtisseries (chacune avec son propre poids) dans un seul panier avant de passer commande — plus besoin de repasser commande pour chaque type de gâteau.

## Plateau personnalisé (تشكيلة)

Le client choisit un poids total (1 kg à 3 kg), puis répartit ce poids entre les pâtisseries de son choix par pas de 250 g. Le prix du plateau est calculé automatiquement au **prix moyen pondéré** des pâtisseries sélectionnées (`Σ(poids_i × prix_i) / poids total`) — aucun prix fixe à gérer manuellement.

## Frais de livraison

- **El Jadida** : livraison incluse dans le prix des pâtisseries (0 Dhs de frais supplémentaires).
- **Autre ville** : +35 Dhs de frais de livraison, ajoutés au total de la commande.

Cette règle est codée dans la constante `DELIVERY_FEE_OTHER_CITY` (`index.html`) — modifie-la si les tarifs changent, ou étends la liste de villes dans `#city-select` si tu veux des tarifs différents par ville.

## Note de commande

Un champ optionnel permet au client d'indiquer des allergies, un message à écrire sur un gâteau, ou des instructions de livraison — transmis avec la commande (`note`) et visible dans le journal Google Sheets.

## À compléter avant la mise en ligne

- **Photos réelles** : remplace les icônes symboliques de `product-media` par de vraies photos de chaque pâtisserie (idéalement reprises du compte Instagram [@omritaj28](https://www.instagram.com/omritaj28)).
- **Coordonnées de contact** : mets à jour le lien Instagram/WhatsApp si besoin, et ajoute une adresse e-mail de contact si tu en as une.
- **Zones de livraison** : le champ "Ville" est actuellement en texte libre — restreins-le à une liste si tu ne livres que dans certaines villes.
