import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-session";
import { getAuditLog } from "@/lib/data";
import Badge from "@/components/Badge";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getSession();
  if (!session || session.role !== "Interne") redirect("/");

  try {
    const entries = await getAuditLog();

    return (
      <>
        <div className="page-header">
          <h1>Journal d'audit</h1>
          <p>Connexions, changements de statut, créations de comptes et de dossiers.</p>
        </div>

        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Utilisateur</th>
                  <th>Détail</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Badge label={e.action} />
                    </td>
                    <td>{e.utilisateur || "—"}</td>
                    <td>{e.detail || "—"}</td>
                    <td>{e.date ? new Date(e.date).toLocaleString("fr-FR") : "—"}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      Aucun événement enregistré pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  } catch (error) {
    return (
      <>
        <div className="page-header">
          <h1>Journal d'audit</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
