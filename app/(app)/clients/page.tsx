import { getClients } from "@/lib/data";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  try {
    const clients = await getClients();

    return (
      <>
        <div className="page-header">
          <h1>Clients</h1>
          <p>{clients.length} client(s) enregistré(s).</p>
        </div>

        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Société</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Pays</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{c.societe || "—"}</td>
                    <td>{c.type || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>{c.telephone || "—"}</td>
                    <td>{c.pays || "—"}</td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Aucun client enregistré.
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
          <h1>Clients</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
