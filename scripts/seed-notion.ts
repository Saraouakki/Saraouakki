/**
 * Bootstrap complet d'un nouveau workspace Notion pour la plateforme Logistique & Transit.
 *
 * Usage :
 *   NOTION_TOKEN=secret_xxx npx tsx scripts/seed-notion.ts
 *
 * Ce script crée, dans l'ordre (les relations dépendent des bases déjà créées) :
 * une page parente, puis les 12 bases (Clients, Fournisseurs, Transporteurs, Entrepôts,
 * Véhicules, Articles, Chauffeurs, Dossiers, Documents, Mouvements de stock,
 * Étapes de suivi, Utilisateurs, Journal d'audit) avec leurs relations bidirectionnelles.
 *
 * À la fin, il imprime un bloc `.env.local` prêt à copier-coller avec les IDs générés.
 * Il ne crée AUCUN compte utilisateur ni donnée de démonstration — c'est un schéma vide,
 * prêt à être rempli par le client final.
 */
import { Client } from "@notionhq/client";
import type { PropertyConfigurationRequest } from "@notionhq/client/build/src/api-endpoints";

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error("NOTION_TOKEN est requis. Exemple : NOTION_TOKEN=secret_xxx npx tsx scripts/seed-notion.ts");
  process.exit(1);
}

const notion = new Client({ auth: token });

type Props = Record<string, PropertyConfigurationRequest>;

function title(): PropertyConfigurationRequest {
  return { title: {} };
}
function text(): PropertyConfigurationRequest {
  return { rich_text: {} };
}
function email(): PropertyConfigurationRequest {
  return { email: {} };
}
function phone(): PropertyConfigurationRequest {
  return { phone_number: {} };
}
function date(): PropertyConfigurationRequest {
  return { date: {} };
}
function files(): PropertyConfigurationRequest {
  return { files: {} };
}
function number(format?: "dollar"): PropertyConfigurationRequest {
  return { number: format ? { format } : {} };
}
function select(options: Array<{ name: string; color?: string }>): PropertyConfigurationRequest {
  return { select: { options: options as never } };
}
function relation(dataSourceId: string): PropertyConfigurationRequest {
  return { relation: { data_source_id: dataSourceId, single_property: {} } };
}
function relationDual(dataSourceId: string, syncedName: string): PropertyConfigurationRequest {
  return {
    relation: { data_source_id: dataSourceId, dual_property: { synced_property_name: syncedName } },
  } as PropertyConfigurationRequest;
}

async function createDb(parentPageId: string, name: string, properties: Props): Promise<string> {
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: name } }],
    initial_data_source: { properties },
  });
  if (!("data_sources" in db)) {
    throw new Error(`Réponse partielle pour ${name} : impossible de lire la data source.`);
  }
  const dataSourceId = db.data_sources[0]?.id;
  if (!dataSourceId) throw new Error(`Aucune data source retournée pour ${name}`);
  console.log(`✔ ${name} → data source ${dataSourceId}`);
  return dataSourceId;
}

async function main() {
  console.log("Création de la page parente...");
  const parent = await notion.pages.create({
    parent: { type: "workspace", workspace: true },
    properties: {
      title: { title: [{ type: "text", text: { content: "🚚 Logistique & Transit — Plateforme" } }] },
    },
    icon: { type: "emoji", emoji: "🚚" },
  });
  const parentId = parent.id;
  console.log(`✔ Page parente créée : ${("url" in parent && parent.url) || parentId}`);

  const clients = await createDb(parentId, "Clients", {
    Nom: title(),
    Société: text(),
    Email: email(),
    Téléphone: phone(),
    Adresse: text(),
    Pays: text(),
    Type: select([
      { name: "Importateur", color: "blue" },
      { name: "Exportateur", color: "green" },
      { name: "Les deux", color: "purple" },
    ]),
    Notes: text(),
  });

  const transporteurs = await createDb(parentId, "Transporteurs", {
    Nom: title(),
    Type: select([
      { name: "Routier", color: "blue" },
      { name: "Maritime", color: "green" },
      { name: "Aérien", color: "purple" },
      { name: "Ferroviaire", color: "orange" },
    ]),
    Contact: text(),
    Téléphone: phone(),
    Email: email(),
    Pays: text(),
    Note: select([
      { name: "5", color: "green" },
      { name: "4", color: "green" },
      { name: "3", color: "yellow" },
      { name: "2", color: "orange" },
      { name: "1", color: "red" },
    ]),
  });

  const entrepots = await createDb(parentId, "Entrepôts", {
    Nom: title(),
    Adresse: text(),
    Ville: text(),
    Pays: text(),
    "Capacité (m³)": number(),
    Responsable: text(),
  });

  const fournisseurs = await createDb(parentId, "Fournisseurs", {
    Nom: title(),
    Catégorie: select([
      { name: "Matières premières", color: "blue" },
      { name: "Pièces détachées", color: "orange" },
      { name: "Équipement", color: "purple" },
      { name: "Emballage", color: "green" },
      { name: "Services", color: "gray" },
    ]),
    Contact: text(),
    Téléphone: phone(),
    Email: email(),
    Adresse: text(),
    Pays: text(),
    Note: select([
      { name: "5", color: "green" },
      { name: "4", color: "green" },
      { name: "3", color: "yellow" },
      { name: "2", color: "orange" },
      { name: "1", color: "red" },
    ]),
  });

  const vehicules = await createDb(parentId, "Véhicules", {
    Immatriculation: title(),
    Type: select([
      { name: "Camion", color: "blue" },
      { name: "Semi-remorque", color: "purple" },
      { name: "Fourgon", color: "orange" },
      { name: "Conteneur", color: "green" },
    ]),
    "Capacité (kg)": number(),
    Transporteur: relationDual(transporteurs, "Véhicules"),
    Statut: select([
      { name: "Disponible", color: "green" },
      { name: "En mission", color: "yellow" },
      { name: "Maintenance", color: "red" },
    ]),
    "Dernière révision": date(),
  });

  const articles = await createDb(parentId, "Articles (Stock)", {
    Nom: title(),
    SKU: text(),
    Catégorie: select([
      { name: "Électronique", color: "blue" },
      { name: "Textile", color: "purple" },
      { name: "Alimentaire", color: "green" },
      { name: "Pièces détachées", color: "orange" },
      { name: "Autre", color: "gray" },
    ]),
    Quantité: number(),
    "Seuil de réappro": number(),
    Entrepôt: relationDual(entrepots, "Articles"),
    "Prix unitaire": number("dollar"),
    Fournisseur: relationDual(fournisseurs, "Articles fournis"),
  });

  const chauffeurs = await createDb(parentId, "Chauffeurs", {
    Nom: title(),
    Téléphone: phone(),
    Permis: text(),
    Véhicule: relationDual(vehicules, "Chauffeurs"),
    Statut: select([
      { name: "Disponible", color: "green" },
      { name: "En route", color: "yellow" },
      { name: "Repos", color: "gray" },
    ]),
  });

  const dossierStatuts = [
    { name: "Créé", color: "gray" },
    { name: "Enlèvement", color: "blue" },
    { name: "En transit", color: "yellow" },
    { name: "Douane - contrôle", color: "orange" },
    { name: "Douane - dédouané", color: "purple" },
    { name: "Livraison en cours", color: "blue" },
    { name: "Livré", color: "green" },
    { name: "Annulé", color: "red" },
  ];

  const dossiers = await createDb(parentId, "Dossiers", {
    Référence: title(),
    Client: relationDual(clients, "Dossiers"),
    Type: select([
      { name: "Import", color: "blue" },
      { name: "Export", color: "green" },
      { name: "Transit domestique", color: "purple" },
      { name: "Transbordement", color: "orange" },
    ]),
    Mode: select([
      { name: "Route", color: "blue" },
      { name: "Maritime", color: "green" },
      { name: "Aérien", color: "purple" },
      { name: "Ferroviaire", color: "orange" },
      { name: "Multimodal", color: "gray" },
    ]),
    Statut: select(dossierStatuts),
    Transporteur: relationDual(transporteurs, "Dossiers"),
    Véhicule: relationDual(vehicules, "Dossiers"),
    Chauffeur: relationDual(chauffeurs, "Dossiers"),
    Entrepôt: relationDual(entrepots, "Dossiers"),
    Fournisseur: relationDual(fournisseurs, "Dossiers"),
    Origine: text(),
    Destination: text(),
    "Date de départ": date(),
    ETA: date(),
    "Date de livraison": date(),
    "Poids (kg)": number(),
    "Volume (m³)": number(),
    "Valeur marchandise": number("dollar"),
    "N° conteneur/plaque": text(),
    "Bureau de douane": text(),
    Priorité: select([
      { name: "Normale", color: "gray" },
      { name: "Urgente", color: "red" },
    ]),
  });

  const documents = await createDb(parentId, "Documents", {
    Nom: title(),
    Type: select([
      { name: "CMR", color: "blue" },
      { name: "Facture commerciale", color: "green" },
      { name: "Déclaration T1", color: "purple" },
      { name: "Connaissement (B/L)", color: "orange" },
      { name: "Certificat origine", color: "pink" },
      { name: "Liste de colisage", color: "gray" },
      { name: "Autre", color: "default" },
    ]),
    Dossier: relationDual(dossiers, "Documents"),
    Statut: select([
      { name: "À fournir", color: "red" },
      { name: "Reçu", color: "yellow" },
      { name: "Validé", color: "green" },
    ]),
    Fichier: files(),
    "Date de réception": date(),
  });

  const mouvements = await createDb(parentId, "Mouvements de stock", {
    Référence: title(),
    Article: relationDual(articles, "Mouvements"),
    Type: select([
      { name: "Entrée", color: "green" },
      { name: "Sortie", color: "red" },
    ]),
    Quantité: number(),
    Date: date(),
    "Dossier lié": relationDual(dossiers, "Mouvements de stock"),
    Fournisseur: relationDual(fournisseurs, "Mouvements"),
    Note: text(),
  });

  const etapes = await createDb(parentId, "Étapes de suivi", {
    Titre: title(),
    Dossier: relationDual(dossiers, "Étapes de suivi"),
    "Date/Heure": date(),
    Statut: select([...dossierStatuts, { name: "Incident", color: "red" }]),
    Localisation: text(),
    Commentaire: text(),
  });

  const utilisateurs = await createDb(parentId, "Utilisateurs", {
    Nom: title(),
    Email: email(),
    Rôle: select([
      { name: "Interne", color: "purple" },
      { name: "Client", color: "blue" },
      { name: "Fournisseur", color: "orange" },
    ]),
    Client: relationDual(clients, "Comptes utilisateurs"),
    Fournisseur: relationDual(fournisseurs, "Comptes utilisateurs"),
    "Mot de passe (hash)": text(),
    "Jeton reset (hash)": text(),
    "Expiration reset": date(),
    "Permission interne": select([
      { name: "Admin", color: "purple" },
      { name: "Lecture seule", color: "gray" },
    ]),
    Statut: select([
      { name: "Actif", color: "green" },
      { name: "Inactif", color: "gray" },
      { name: "En attente", color: "orange" },
    ]),
    "Dernière connexion": date(),
  });

  const audit = await createDb(parentId, "Journal d'audit", {
    Titre: title(),
    Action: select([
      { name: "Connexion", color: "green" },
      { name: "Échec connexion", color: "red" },
      { name: "Compte créé", color: "blue" },
      { name: "Compte activé", color: "green" },
      { name: "Compte refusé", color: "red" },
      { name: "Mot de passe réinitialisé", color: "purple" },
      { name: "Dossier créé", color: "blue" },
      { name: "Statut modifié", color: "orange" },
      { name: "Document ajouté", color: "blue" },
    ]),
    Utilisateur: text(),
    Détail: text(),
    Date: date(),
  });

  console.log("\nToutes les bases ont été créées. Ajoutez ceci à votre .env.local :\n");
  console.log(`NOTION_DS_CLIENTS=${clients}`);
  console.log(`NOTION_DS_TRANSPORTEURS=${transporteurs}`);
  console.log(`NOTION_DS_ENTREPOTS=${entrepots}`);
  console.log(`NOTION_DS_FOURNISSEURS=${fournisseurs}`);
  console.log(`NOTION_DS_VEHICULES=${vehicules}`);
  console.log(`NOTION_DS_ARTICLES=${articles}`);
  console.log(`NOTION_DS_CHAUFFEURS=${chauffeurs}`);
  console.log(`NOTION_DS_DOSSIERS=${dossiers}`);
  console.log(`NOTION_DS_DOCUMENTS=${documents}`);
  console.log(`NOTION_DS_MOUVEMENTS=${mouvements}`);
  console.log(`NOTION_DS_ETAPES=${etapes}`);
  console.log(`NOTION_DS_UTILISATEURS=${utilisateurs}`);
  console.log(`NOTION_DS_AUDIT=${audit}`);
  console.log(
    "N'oubliez pas de partager la page « 🚚 Logistique & Transit — Plateforme » avec votre intégration " +
      "Notion (··· → Connexions), sans quoi l'API renverra des erreurs 404."
  );
}

main().catch((error) => {
  console.error("Échec du seed :", error);
  process.exit(1);
});
