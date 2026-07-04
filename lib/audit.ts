import { notion, DS } from "./notion";

export type AuditAction =
  | "Connexion"
  | "Échec connexion"
  | "Compte créé"
  | "Compte activé"
  | "Compte refusé"
  | "Mot de passe réinitialisé"
  | "Dossier créé"
  | "Statut modifié"
  | "Document ajouté";

interface AuditEntry {
  action: AuditAction;
  utilisateur: string;
  detail?: string;
}

/**
 * Écrit un événement dans le Journal d'audit Notion. Volontairement fire-and-forget :
 * un échec d'écriture du journal ne doit jamais faire échouer l'action métier qui l'a
 * déclenché (connexion, changement de statut...).
 */
export function logAudit(entry: AuditEntry): void {
  const titre = `${entry.action} — ${entry.utilisateur}`;
  notion.pages
    .create({
      parent: { data_source_id: DS.audit },
      properties: {
        Titre: { title: [{ text: { content: titre.slice(0, 200) } }] },
        Action: { select: { name: entry.action } },
        Utilisateur: { rich_text: [{ text: { content: entry.utilisateur } }] },
        Détail: { rich_text: [{ text: { content: entry.detail ?? "" } }] },
        Date: { date: { start: new Date().toISOString() } },
      },
    })
    .catch((error) => {
      console.error("[audit] échec d'écriture dans le Journal d'audit Notion:", error);
    });
}
