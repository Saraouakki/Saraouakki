import type { Dossier, SessionData } from "./types";

/** Un compte interne peut écrire (changer un statut, créer un dossier, valider un
 * compte...) sauf s'il est explicitement en "Lecture seule". */
export function canWrite(session: SessionData | null): boolean {
  return !!session && session.role === "Interne" && session.permissionInterne !== "Lecture seule";
}

export function isAdmin(session: SessionData | null): boolean {
  return !!session && session.role === "Interne" && session.permissionInterne === "Admin";
}

/** Un client ou fournisseur ne peut voir que les dossiers auxquels il est lié dans
 * Notion ; l'équipe interne voit tout. */
export function canAccessDossier(
  session: SessionData | null,
  dossier: Pick<Dossier, "clientIds" | "fournisseurIds">
): boolean {
  if (!session) return false;
  if (session.role === "Interne") return true;
  if (session.role === "Client") {
    return !!session.clientId && dossier.clientIds.includes(session.clientId);
  }
  if (session.role === "Fournisseur") {
    return !!session.fournisseurId && dossier.fournisseurIds.includes(session.fournisseurId);
  }
  return false;
}
