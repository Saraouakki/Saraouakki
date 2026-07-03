import Link from "next/link";
import { getDossiers } from "@/lib/data";
import Badge from "@/components/Badge";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function DossiersPage() {
  try {
    const dossiers = await getDossiers();

    return (
      <>
        <div className="page-header">
          <h1>Dossiers</h1>
          <p>Transit douanier, freight et transport — {dossiers.length} dossier(s).</p>
        </div>

        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Statut</th>
                  <th>Transporteur</th>
                  <th>Trajet</th>
                  <th>ETA</th>
                  <th>Priorité</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/dossiers/${d.id}`} className="link-primary">
                        {d.reference}
                      </Link>
                    </td>
                    <td>{d.clientNoms.join(", ") || "—"}</td>
                    <td>{d.type}</td>
                    <td>{d.mode}</td>
                    <td>
                      <Badge label={d.statut} />
                    </td>
                    <td>{d.transporteurNoms.join(", ") || "—"}</td>
                    <td>
                      {d.origine || "—"} → {d.destination || "—"}
                    </td>
                    <td>{d.eta ?? "—"}</td>
                    <td>{d.priorite === "Urgente" ? <Badge label="Urgente" /> : "Normale"}</td>
                  </tr>
                ))}
                {dossiers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      Aucun dossier pour le moment.
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
          <h1>Dossiers</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
