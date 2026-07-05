import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-session";
import { getTarifs, getDemandesDevis } from "@/lib/data";
import { canWrite } from "@/lib/access";
import TarifForm from "@/components/TarifForm";
import Badge from "@/components/Badge";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function TarifsPage() {
  const session = await getSession();
  if (!session || session.role !== "Interne") redirect("/");

  try {
    const [tarifs, demandes] = await Promise.all([getTarifs(), getDemandesDevis()]);

    return (
      <>
        <div className="page-header">
          <h1>Grilles tarifaires</h1>
          <p>
            Base de calcul du simulateur de devis public (<code>/devis</code>). Seules les grilles «&nbsp;Actif&nbsp;»
            sont utilisées pour les estimations.
          </p>
        </div>

        {canWrite(session) && (
          <div style={{ marginBottom: 20 }}>
            <TarifForm />
          </div>
        )}

        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Mode</th>
                  <th>Origine</th>
                  <th>Destination</th>
                  <th>Prix/kg</th>
                  <th>Prix/CBM</th>
                  <th>Poids min</th>
                  <th>Devis min</th>
                  <th>Devise</th>
                  <th>Délai</th>
                  <th>Actif</th>
                </tr>
              </thead>
              <tbody>
                {tarifs.map((t) => (
                  <tr key={t.id}>
                    <td>{t.nom}</td>
                    <td>{t.mode}</td>
                    <td>{t.origine}</td>
                    <td>{t.destination}</td>
                    <td>{t.prixParKg ?? "—"}</td>
                    <td>{t.prixParCbm ?? "—"}</td>
                    <td>{t.poidsMinFacturable ?? "—"} kg</td>
                    <td>{t.devisMinimum ?? "—"}</td>
                    <td>{t.devise}</td>
                    <td>{t.delaiJours ?? "—"} j</td>
                    <td>{t.actif ? "✅" : "—"}</td>
                  </tr>
                ))}
                {tarifs.length === 0 && (
                  <tr>
                    <td colSpan={11} className="empty-state">
                      Aucune grille tarifaire. Créez-en une pour activer le simulateur de devis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Demandes de devis reçues ({demandes.length})</h2>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Société</th>
                  <th>Trajet</th>
                  <th>Estimation</th>
                  <th>Statut</th>
                  <th>Reçu le</th>
                </tr>
              </thead>
              <tbody>
                {demandes.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {d.nom}
                      {d.email ? ` · ${d.email}` : ""}
                      {d.telephone ? ` · ${d.telephone}` : ""}
                    </td>
                    <td>{d.societe || "—"}</td>
                    <td>
                      {d.mode} : {d.origine || "—"} → {d.destination || "—"}
                    </td>
                    <td>{d.estimation != null ? `${d.estimation} MAD` : "Sur devis"}</td>
                    <td>
                      <Badge label={d.statut} />
                    </td>
                    <td>{d.date ? new Date(d.date).toLocaleDateString("fr-FR") : "—"}</td>
                  </tr>
                ))}
                {demandes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Aucune demande reçue pour le moment. Partagez le lien <code>/devis</code> à vos
                      prospects.
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
          <h1>Grilles tarifaires</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
