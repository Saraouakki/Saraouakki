import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-session";
import { getPendingAccounts } from "@/lib/data";
import { canWrite } from "@/lib/access";
import AccountActionButtons from "@/components/AccountActionButtons";
import Badge from "@/components/Badge";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function ComptesPage() {
  const session = await getSession();
  if (!session || session.role !== "Interne") redirect("/");

  try {
    const pending = await getPendingAccounts();

    return (
      <>
        <div className="page-header">
          <h1>Comptes en attente</h1>
          <p>Demandes d'inscription client/fournisseur à valider ({pending.length}).</p>
        </div>

        <div className="panel">
          {pending.length === 0 ? (
            <div className="empty-state">Aucune demande en attente.</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle demandé</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((account) => (
                    <tr key={account.id}>
                      <td>{account.nom}</td>
                      <td>{account.email}</td>
                      <td>
                        <Badge label={account.role} />
                      </td>
                      <td>
                        {canWrite(session) ? (
                          <AccountActionButtons id={account.id} />
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12.5 }}>
                            Lecture seule
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  } catch (error) {
    return (
      <>
        <div className="page-header">
          <h1>Comptes en attente</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
