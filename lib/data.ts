import {
  DS,
  Page,
  queryAll,
  queryFiltered,
  getTitle,
  getText,
  getSelect,
  getNumber,
  getDate,
  getEmail,
  getPhone,
  getRelationIds,
  getFileUrls,
  getCheckbox,
  nameMap,
  resolveNames,
  notion,
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
  Fournisseur,
  UserAccount,
  Tarif,
  DemandeDevis,
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

function toFournisseur(p: Page): Fournisseur {
  return {
    id: p.id,
    nom: getTitle(p, "Nom"),
    categorie: getSelect(p, "Catégorie"),
    contact: getText(p, "Contact"),
    telephone: getPhone(p, "Téléphone"),
    email: getEmail(p, "Email"),
    adresse: getText(p, "Adresse"),
    pays: getText(p, "Pays"),
    note: getSelect(p, "Note"),
  };
}

export async function getClients(): Promise<Client[]> {
  return (await queryAll(DS.clients)).map(toClient);
}

export async function getFournisseurs(): Promise<Fournisseur[]> {
  return (await queryAll(DS.fournisseurs)).map(toFournisseur);
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
  const [pages, entrepots, fournisseurs] = await Promise.all([
    queryAll(DS.articles),
    queryAll(DS.entrepots),
    queryAll(DS.fournisseurs),
  ]);
  const eMap = nameMap(entrepots, "Nom");
  const fMap = nameMap(fournisseurs, "Nom");
  return pages.map((p) => ({
    id: p.id,
    nom: getTitle(p, "Nom"),
    sku: getText(p, "SKU"),
    categorie: getSelect(p, "Catégorie"),
    quantite: getNumber(p, "Quantité"),
    seuil: getNumber(p, "Seuil de réappro"),
    entrepotNoms: resolveNames(getRelationIds(p, "Entrepôt"), eMap),
    prixUnitaire: getNumber(p, "Prix unitaire"),
    fournisseurIds: getRelationIds(p, "Fournisseur"),
    fournisseurNoms: resolveNames(getRelationIds(p, "Fournisseur"), fMap),
  }));
}

interface DossierMaps {
  cMap: Map<string, string>;
  tMap: Map<string, string>;
  vMap: Map<string, string>;
  chMap: Map<string, string>;
  eMap: Map<string, string>;
  fMap: Map<string, string>;
}

async function buildDossierMaps(): Promise<DossierMaps> {
  const [clients, transporteurs, vehicules, chauffeurs, entrepots, fournisseurs] = await Promise.all([
    queryAll(DS.clients),
    queryAll(DS.transporteurs),
    queryAll(DS.vehicules),
    queryAll(DS.chauffeurs),
    queryAll(DS.entrepots),
    queryAll(DS.fournisseurs),
  ]);
  return {
    cMap: nameMap(clients, "Nom"),
    tMap: nameMap(transporteurs, "Nom"),
    vMap: nameMap(vehicules, "Immatriculation"),
    chMap: nameMap(chauffeurs, "Nom"),
    eMap: nameMap(entrepots, "Nom"),
    fMap: nameMap(fournisseurs, "Nom"),
  };
}

function hydrateDossier(p: Page, maps: DossierMaps): Dossier {
  return {
    id: p.id,
    reference: getTitle(p, "Référence"),
    clientIds: getRelationIds(p, "Client"),
    clientNoms: resolveNames(getRelationIds(p, "Client"), maps.cMap),
    type: getSelect(p, "Type"),
    mode: getSelect(p, "Mode"),
    statut: getSelect(p, "Statut"),
    transporteurNoms: resolveNames(getRelationIds(p, "Transporteur"), maps.tMap),
    vehiculeNoms: resolveNames(getRelationIds(p, "Véhicule"), maps.vMap),
    chauffeurNoms: resolveNames(getRelationIds(p, "Chauffeur"), maps.chMap),
    entrepotNoms: resolveNames(getRelationIds(p, "Entrepôt"), maps.eMap),
    fournisseurIds: getRelationIds(p, "Fournisseur"),
    fournisseurNoms: resolveNames(getRelationIds(p, "Fournisseur"), maps.fMap),
    origine: getText(p, "Origine"),
    destination: getText(p, "Destination"),
    dateDepart: getDate(p, "Date de départ"),
    eta: getDate(p, "ETA"),
    dateLivraison: getDate(p, "Date de livraison"),
    poids: getNumber(p, "Poids (kg)"),
    volume: getNumber(p, "Volume (m³)"),
    valeur: getNumber(p, "Valeur marchandise"),
    numero: getText(p, "N° conteneur/plaque"),
    bureauDouane: getSelect(p, "Bureau de douane"),
    regimeDouanier: getSelect(p, "Régime douanier"),
    numeroDUM: getText(p, "N° DUM (BADR)"),
    priorite: getSelect(p, "Priorité"),
  };
}

function sortByReferenceDesc(dossiers: Dossier[]): Dossier[] {
  return [...dossiers].sort((a, b) => b.reference.localeCompare(a.reference));
}

export async function getDossiers(): Promise<Dossier[]> {
  const [pages, maps] = await Promise.all([queryAll(DS.dossiers), buildDossierMaps()]);
  return sortByReferenceDesc(pages.map((p) => hydrateDossier(p, maps)));
}

export async function getDossier(id: string): Promise<Dossier | undefined> {
  const dossiers = await getDossiers();
  return dossiers.find((d) => d.id === id);
}

/**
 * Variantes filtrées côté Notion, pour les portails client/fournisseur : au lieu de
 * rapatrier tous les dossiers puis filtrer en mémoire, on ne demande à l'API Notion
 * que les dossiers liés à ce client/fournisseur. Utile quand la base Dossiers grossit.
 */
export async function getDossiersForClient(clientId: string): Promise<Dossier[]> {
  const [pages, maps] = await Promise.all([
    queryFiltered(DS.dossiers, { property: "Client", relation: { contains: clientId } }),
    buildDossierMaps(),
  ]);
  return sortByReferenceDesc(pages.map((p) => hydrateDossier(p, maps)));
}

export async function getDossiersForFournisseur(fournisseurId: string): Promise<Dossier[]> {
  const [pages, maps] = await Promise.all([
    queryFiltered(DS.dossiers, { property: "Fournisseur", relation: { contains: fournisseurId } }),
    buildDossierMaps(),
  ]);
  return sortByReferenceDesc(pages.map((p) => hydrateDossier(p, maps)));
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
  const [pages, articles, fournisseurs] = await Promise.all([
    queryAll(DS.mouvements),
    queryAll(DS.articles),
    queryAll(DS.fournisseurs),
  ]);
  const aMap = nameMap(articles, "Nom");
  const fMap = nameMap(fournisseurs, "Nom");
  return pages
    .map((p) => ({
      id: p.id,
      reference: getTitle(p, "Référence"),
      articleNoms: resolveNames(getRelationIds(p, "Article"), aMap),
      type: getSelect(p, "Type"),
      quantite: getNumber(p, "Quantité"),
      date: getDate(p, "Date"),
      dossierIds: getRelationIds(p, "Dossier lié"),
      fournisseurIds: getRelationIds(p, "Fournisseur"),
      fournisseurNoms: resolveNames(getRelationIds(p, "Fournisseur"), fMap),
      note: getText(p, "Note"),
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

function toUserAccount(p: Page): UserAccount {
  const clientIds = getRelationIds(p, "Client");
  const fournisseurIds = getRelationIds(p, "Fournisseur");
  const permission = getSelect(p, "Permission interne");
  return {
    id: p.id,
    nom: getTitle(p, "Nom"),
    email: getEmail(p, "Email"),
    role: (getSelect(p, "Rôle") || "Client") as UserAccount["role"],
    permissionInterne: (permission || null) as UserAccount["permissionInterne"],
    clientId: clientIds[0] ?? null,
    fournisseurId: fournisseurIds[0] ?? null,
    passwordHash: getText(p, "Mot de passe (hash)"),
    resetTokenHash: getText(p, "Jeton reset (hash)"),
    resetExpires: getDate(p, "Expiration reset"),
    statut: getSelect(p, "Statut"),
  };
}

export async function getUserByEmail(email: string): Promise<UserAccount | undefined> {
  const pages = await queryAll(DS.utilisateurs);
  const normalized = email.trim().toLowerCase();
  return pages
    .map(toUserAccount)
    .find((u) => u.email.trim().toLowerCase() === normalized);
}

export async function getUserById(id: string): Promise<UserAccount | undefined> {
  const pages = await queryAll(DS.utilisateurs);
  return pages.map(toUserAccount).find((u) => u.id === id);
}

export async function getPendingAccounts(): Promise<UserAccount[]> {
  const pages = await queryAll(DS.utilisateurs);
  return pages.map(toUserAccount).filter((u) => u.statut === "En attente");
}

export async function getUserEmailsForClient(clientId: string): Promise<string[]> {
  const pages = await queryAll(DS.utilisateurs);
  return pages
    .map(toUserAccount)
    .filter((u) => u.statut === "Actif" && u.clientId === clientId && u.email)
    .map((u) => u.email);
}

export async function getClientPhoneNumbers(clientId: string): Promise<string[]> {
  const clients = await getClients();
  const client = clients.find((c) => c.id === clientId);
  return client?.telephone ? [client.telephone] : [];
}

export async function getAuditLog(limit = 200): Promise<import("./types").AuditLogEntry[]> {
  const pages = await queryAll(DS.audit);
  return pages
    .map((p) => ({
      id: p.id,
      titre: getTitle(p, "Titre"),
      action: getSelect(p, "Action"),
      utilisateur: getText(p, "Utilisateur"),
      detail: getText(p, "Détail"),
      date: getDate(p, "Date"),
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, limit);
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

function toTarif(p: Page): Tarif {
  return {
    id: p.id,
    nom: getTitle(p, "Nom"),
    mode: getSelect(p, "Mode"),
    origine: getText(p, "Origine"),
    destination: getText(p, "Destination"),
    prixParKg: getNumber(p, "Prix par kg"),
    prixParCbm: getNumber(p, "Prix par CBM"),
    poidsMinFacturable: getNumber(p, "Poids min facturable (kg)"),
    devisMinimum: getNumber(p, "Devis minimum"),
    devise: getSelect(p, "Devise"),
    delaiJours: getNumber(p, "Délai indicatif (jours)"),
    actif: getCheckbox(p, "Actif"),
  };
}

export async function getTarifs(): Promise<Tarif[]> {
  return (await queryAll(DS.tarifs)).map(toTarif);
}

function toDemandeDevis(p: Page): DemandeDevis {
  return {
    id: p.id,
    nom: getTitle(p, "Nom"),
    email: getEmail(p, "Email"),
    telephone: getPhone(p, "Téléphone"),
    societe: getText(p, "Société"),
    mode: getSelect(p, "Mode"),
    origine: getText(p, "Origine"),
    destination: getText(p, "Destination"),
    poids: getNumber(p, "Poids (kg)"),
    volume: getNumber(p, "Volume (CBM)"),
    estimation: getNumber(p, "Estimation"),
    message: getText(p, "Message"),
    statut: getSelect(p, "Statut"),
    date: getDate(p, "Date"),
  };
}

export async function getDemandesDevis(): Promise<DemandeDevis[]> {
  const pages = await queryAll(DS.demandesDevis);
  return pages.map(toDemandeDevis).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

interface CreateDemandeDevisInput {
  nom: string;
  email: string;
  telephone: string;
  societe: string;
  mode: string;
  origine: string;
  destination: string;
  poids: number | null;
  volume: number | null;
  estimation: number | null;
  message: string;
}

export async function createDemandeDevis(input: CreateDemandeDevisInput): Promise<string> {
  const page = await notion.pages.create({
    parent: { data_source_id: DS.demandesDevis },
    properties: {
      Nom: { title: [{ text: { content: input.nom || `Devis ${input.origine} → ${input.destination}` } }] },
      Email: { email: input.email || null },
      Téléphone: { phone_number: input.telephone || null },
      Société: { rich_text: input.societe ? [{ text: { content: input.societe } }] : [] },
      Mode: { select: input.mode ? { name: input.mode } : null },
      Origine: { rich_text: input.origine ? [{ text: { content: input.origine } }] : [] },
      Destination: { rich_text: input.destination ? [{ text: { content: input.destination } }] : [] },
      "Poids (kg)": { number: input.poids },
      "Volume (CBM)": { number: input.volume },
      Estimation: { number: input.estimation },
      Message: { rich_text: input.message ? [{ text: { content: input.message } }] : [] },
      Statut: { select: { name: "Nouveau" } },
      Date: { date: { start: new Date().toISOString() } },
    },
  });
  return page.id;
}
