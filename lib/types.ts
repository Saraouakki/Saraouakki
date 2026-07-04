export interface Client {
  id: string;
  nom: string;
  societe: string;
  email: string;
  telephone: string;
  adresse: string;
  pays: string;
  type: string;
}

export interface Transporteur {
  id: string;
  nom: string;
  type: string;
  contact: string;
  telephone: string;
  email: string;
  pays: string;
  note: string;
}

export interface Fournisseur {
  id: string;
  nom: string;
  categorie: string;
  contact: string;
  telephone: string;
  email: string;
  adresse: string;
  pays: string;
  note: string;
}

export type Role = "Interne" | "Client" | "Fournisseur";
export type InternalPermission = "Admin" | "Lecture seule";

export interface UserAccount {
  id: string;
  nom: string;
  email: string;
  role: Role;
  permissionInterne: InternalPermission | null;
  clientId: string | null;
  fournisseurId: string | null;
  passwordHash: string;
  resetTokenHash: string;
  resetExpires: string | null;
  statut: string;
}

export interface SessionData {
  userId: string;
  nom: string;
  email: string;
  role: Role;
  permissionInterne: InternalPermission | null;
  clientId: string | null;
  fournisseurId: string | null;
}

export interface AuditLogEntry {
  id: string;
  titre: string;
  action: string;
  utilisateur: string;
  detail: string;
  date: string | null;
}

export interface Entrepot {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  capacite: number | null;
  responsable: string;
}

export interface Vehicule {
  id: string;
  immatriculation: string;
  type: string;
  capacite: number | null;
  transporteurNoms: string[];
  statut: string;
  derniereRevision: string | null;
}

export interface Chauffeur {
  id: string;
  nom: string;
  telephone: string;
  permis: string;
  vehiculeNoms: string[];
  statut: string;
}

export interface Article {
  id: string;
  nom: string;
  sku: string;
  categorie: string;
  quantite: number | null;
  seuil: number | null;
  entrepotNoms: string[];
  prixUnitaire: number | null;
  fournisseurIds: string[];
  fournisseurNoms: string[];
}

export interface Dossier {
  id: string;
  reference: string;
  clientIds: string[];
  clientNoms: string[];
  type: string;
  mode: string;
  statut: string;
  transporteurNoms: string[];
  vehiculeNoms: string[];
  chauffeurNoms: string[];
  entrepotNoms: string[];
  fournisseurIds: string[];
  fournisseurNoms: string[];
  origine: string;
  destination: string;
  dateDepart: string | null;
  eta: string | null;
  dateLivraison: string | null;
  poids: number | null;
  volume: number | null;
  valeur: number | null;
  numero: string;
  bureauDouane: string;
  regimeDouanier: string;
  numeroDUM: string;
  priorite: string;
}

export const BUREAU_DOUANE_OPTIONS = [
  "Casablanca Port",
  "Casablanca Aéroport Mohammed V",
  "Tanger Med",
  "Tanger Ville",
  "Nador",
  "Agadir Port",
  "Oujda",
  "Marrakech Aéroport",
  "Fès",
  "Autre",
] as const;

export const REGIME_DOUANIER_OPTIONS = [
  "Mise à la consommation",
  "Admission temporaire",
  "Transit (T1)",
  "Entrepôt sous douane",
  "Exportation définitive",
  "Réexportation",
] as const;

export interface DocumentItem {
  id: string;
  nom: string;
  type: string;
  dossierIds: string[];
  statut: string;
  dateReception: string | null;
  fichiers: string[];
}

export interface Mouvement {
  id: string;
  reference: string;
  articleNoms: string[];
  type: string;
  quantite: number | null;
  date: string | null;
  dossierIds: string[];
  fournisseurIds: string[];
  fournisseurNoms: string[];
  note: string;
}

export interface Etape {
  id: string;
  titre: string;
  dossierIds: string[];
  dateHeure: string | null;
  statut: string;
  localisation: string;
  commentaire: string;
}

export const DOCUMENT_TYPES = [
  "CMR",
  "Facture commerciale",
  "Déclaration T1",
  "Connaissement (B/L)",
  "Certificat origine",
  "Liste de colisage",
  "Autre",
] as const;

export const DOSSIER_STATUTS = [
  "Créé",
  "Enlèvement",
  "En transit",
  "Douane - contrôle",
  "Douane - dédouané",
  "Livraison en cours",
  "Livré",
  "Annulé",
] as const;

export const STATUT_COLORS: Record<string, string> = {
  "Créé": "gray",
  "Enlèvement": "blue",
  "En transit": "yellow",
  "Douane - contrôle": "orange",
  "Douane - dédouané": "purple",
  "Livraison en cours": "blue",
  "Livré": "green",
  "Annulé": "red",
  "Incident": "red",
  "Disponible": "green",
  "En mission": "yellow",
  "En route": "yellow",
  "Maintenance": "red",
  "Repos": "gray",
  "À fournir": "red",
  "Reçu": "yellow",
  "Validé": "green",
  "Actif": "green",
  "Inactif": "gray",
  "En attente": "orange",
  "Connexion": "green",
  "Échec connexion": "red",
  "Compte créé": "blue",
  "Compte activé": "green",
  "Compte refusé": "red",
  "Mot de passe réinitialisé": "purple",
  "Dossier créé": "blue",
  "Statut modifié": "orange",
  "Document ajouté": "blue",
};
