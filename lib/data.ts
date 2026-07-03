import {
  DS,
  Page,
  queryAll,
  getTitle,
  getText,
  getSelect,
  getNumber,
  getDate,
  getEmail,
  getPhone,
  getRelationIds,
  getFileUrls,
  nameMap,
  resolveNames,
} from "./notion";
import type {
  Client,
  Transporteur,
  Entrepot,
  Vehicule,
  Chauffeur,
  Article,
  Dossier,
  DocumentItem,
  Mouvement,
  Etape,
} from "./types";

function toClient(p: Page): Client {
  return {
    id: p.id,
    nom: getTitle(p, "Nom"),
    societe: getText(p, "Société"),
    email: getEmail(p, "Email"),
    telephone: getPhone(p, "Téléphone"),
    adresse: getText(p, "Adresse"),
    pays: getText(p, "Pays"),
    type: getSelect(p, "Type"),
  };
}

function toTransporteur(p: Page): Transporteur {
  return {
    id: p.id,
    nom: getTitle(p, "Nom"),
    type: getSelect(p, "Type"),
    contact: getText(p, "Contact"),
    telephone: getPhone(p, "Téléphone"),
    email: getEmail(p, "Email"),
    pays: getText(p, "Pays"),
    note: getSelect(p, "Note"),
  };
}

function toEntrepot(p: Page): Entrepot {
  return {
    id: p.id,
    nom: getTitle(p, "Nom"),
    adresse: getText(p, "Adresse"),
    ville: getText(p, "Ville"),
    pays: getText(p, "Pays"),
    capacite: getNumber(p, "Capacité (m³)"),
    responsable: getText(p, "Responsable"),
  };
}

export async function getClients(): Promise<Client[]> {
  return (await queryAll(DS.clients)).map(toClient);
}

export async function getTransporteurs(): Promise<Transporteur[]> {
  return (await queryAll(DS.transporteurs)).map(toTransporteur);
}

export async function getEntrepots(): Promise<Entrepot[]> {
  return (await queryAll(DS.entrepots)).map(toEntrepot);
}

export async function getVehicules(): Promise<Vehicule[]> {
  const [pages, transporteurs] = await Promise.all([
    queryAll(DS.vehicules),
    queryAll(DS.transporteurs),
  ]);
  const tMap = nameMap(transporteurs, "Nom");
  return pages.map((p) => ({
    id: p.id,
    immatriculation: getTitle(p, "Immatriculation"),
    type: getSelect(p, "Type"),
    capacite: getNumber(p, "Capacité (kg)"),
    transporteurNoms: resolveNames(getRelationIds(p, "Transporteur"), tMap),
    statut: getSelect(p, "Statut"),
    derniereRevision: getDate(p, "Dernière révision"),
  }));
}

export async function getChauffeurs(): Promise<Chauffeur[]> {
  const [pages, vehicules] = await Promise.all([
    queryAll(DS.chauffeurs),
    queryAll(DS.vehicules),
  ]);
  const vMap = nameMap(vehicules, "Immatriculation");
  return pages.map((p) => ({
    id: p.id,
    nom: getTitle(p, "Nom"),
    telephone: getPhone(p, "Téléphone"),
    permis: getText(p, "Permis"),
    vehiculeNoms: resolveNames(getRelationIds(p, "Véhicule"), vMap),
    statut: getSelect(p, "Statut"),
  }));
}

export async function getArticles(): Promise<Article[]> {
  const [pages, entrepots] = await Promise.all([
    queryAll(DS.articles),
    queryAll(DS.entrepots),
  ]);
  const eMap = nameMap(entrepots, "Nom");
  return pages.map((p) => ({
    id: p.id,
    nom: getTitle(p, "Nom"),
    sku: getText(p, "SKU"),
    categorie: getSelect(p, "Catégorie"),
    quantite: getNumber(p, "Quantité"),
    seuil: getNumber(p, "Seuil de réappro"),
    entrepotNoms: resolveNames(getRelationIds(p, "Entrepôt"), eMap),
    prixUnitaire: getNumber(p, "Prix unitaire"),
  }));
}

export async function getDossiers(): Promise<Dossier[]> {
  const [pages, clients, transporteurs, vehicules, chauffeurs, entrepots] =
    await Promise.all([
      queryAll(DS.dossiers),
      queryAll(DS.clients),
      queryAll(DS.transporteurs),
      queryAll(DS.vehicules),
      queryAll(DS.chauffeurs),
      queryAll(DS.entrepots),
    ]);
  const cMap = nameMap(clients, "Nom");
  const tMap = nameMap(transporteurs, "Nom");
  const vMap = nameMap(vehicules, "Immatriculation");
  const chMap = nameMap(chauffeurs, "Nom");
  const eMap = nameMap(entrepots, "Nom");

  return pages
    .map((p) => ({
      id: p.id,
      reference: getTitle(p, "Référence"),
      clientNoms: resolveNames(getRelationIds(p, "Client"), cMap),
      type: getSelect(p, "Type"),
      mode: getSelect(p, "Mode"),
      statut: getSelect(p, "Statut"),
      transporteurNoms: resolveNames(getRelationIds(p, "Transporteur"), tMap),
      vehiculeNoms: resolveNames(getRelationIds(p, "Véhicule"), vMap),
      chauffeurNoms: resolveNames(getRelationIds(p, "Chauffeur"), chMap),
      entrepotNoms: resolveNames(getRelationIds(p, "Entrepôt"), eMap),
      origine: getText(p, "Origine"),
      destination: getText(p, "Destination"),
      dateDepart: getDate(p, "Date de départ"),
      eta: getDate(p, "ETA"),
      dateLivraison: getDate(p, "Date de livraison"),
      poids: getNumber(p, "Poids (kg)"),
      volume: getNumber(p, "Volume (m³)"),
      valeur: getNumber(p, "Valeur marchandise"),
      numero: getText(p, "N° conteneur/plaque"),
      bureauDouane: getText(p, "Bureau de douane"),
      priorite: getSelect(p, "Priorité"),
    }))
    .sort((a, b) => b.reference.localeCompare(a.reference));
}

export async function getDossier(id: string): Promise<Dossier | undefined> {
  const dossiers = await getDossiers();
  return dossiers.find((d) => d.id === id);
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const pages = await queryAll(DS.documents);
  return pages.map((p) => ({
    id: p.id,
    nom: getTitle(p, "Nom"),
    type: getSelect(p, "Type"),
    dossierIds: getRelationIds(p, "Dossier"),
    statut: getSelect(p, "Statut"),
    dateReception: getDate(p, "Date de réception"),
    fichiers: getFileUrls(p, "Fichier"),
  }));
}

export async function getMouvements(): Promise<Mouvement[]> {
  const [pages, articles] = await Promise.all([
    queryAll(DS.mouvements),
    queryAll(DS.articles),
  ]);
  const aMap = nameMap(articles, "Nom");
  return pages
    .map((p) => ({
      id: p.id,
      reference: getTitle(p, "Référence"),
      articleNoms: resolveNames(getRelationIds(p, "Article"), aMap),
      type: getSelect(p, "Type"),
      quantite: getNumber(p, "Quantité"),
      date: getDate(p, "Date"),
      dossierIds: getRelationIds(p, "Dossier lié"),
      note: getText(p, "Note"),
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function getEtapes(): Promise<Etape[]> {
  const pages = await queryAll(DS.etapes);
  return pages
    .map((p) => ({
      id: p.id,
      titre: getTitle(p, "Titre"),
      dossierIds: getRelationIds(p, "Dossier"),
      dateHeure: getDate(p, "Date/Heure"),
      statut: getSelect(p, "Statut"),
      localisation: getText(p, "Localisation"),
      commentaire: getText(p, "Commentaire"),
    }))
    .sort((a, b) => (a.dateHeure ?? "").localeCompare(b.dateHeure ?? ""));
}
