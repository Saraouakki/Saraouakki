import Link from "next/link";
import { getDossiers, getVehicules, getArticles, getFournisseurs, getClients } from "@/lib/data";
import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " $";
}

export default async function OverviewPage() {
  try {
    const [dossiers, vehicules, articles, fournisseurs, clients] = await Promise.all([
      getDossiers(),
      getVehicules(),
      getArticles(),
      getFournisseurs(),
      getClients(),
    ]);

    const actifs = dossiers.filter((d) => d.statut !== "Livré" && d.statut !== "Annulé");
    const enDouane = dossiers.filter((d) => d.statut.startsWith("Douane"));
    const urgents = dossiers.filter((d) => d.priorite === "Urgente" && d.statut !== "Livré");
    const valeurActive = actifs.reduce((sum, d) => sum + (d.valeur ?? 0), 0);
    const vehiculesDispos = vehicules.filter((v) => v.statut === "Disponible").length;
    const articlesSousSeuil = articles.filter(
      (a) => a.quantite != null && a.seuil != null && a.quantite <= a.seuil
    );

    const recents = dossiers.slice(0, 6);

    return (
      <>
        <div className="page-header">
          <h1>Vue d'ensemble</h1>
          <p>Suivi en temps réel des opérations de transit, transport et entreposage.</p>
        </div>

        <div className="stat-grid">
          <StatCard label="Dossiers actifs" value={actifs.length} sub={`${dossiers.length} au total`} />
          <StatCard label="En dédouanement" value={enDouane.length} />
          <StatCard label="Priorité urgente" value={urgents.length} />
          <StatCard label="Valeur en transit" value={formatMoney(valeurActive)} />
          <StatCard
            label="Véhicules disponibles"
            value={`${vehiculesDispos}/${vehicules.length}`}
          />
          <StatCard label="Alertes stock" value={articlesSousSeuil.length} sub="sous seuil de réappro" />
          <StatCard label="Clients" value={clients.length} />
          <StatCard label="Fournisseurs" value={fournisseurs.length} />
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-header">
              <h2>Dossiers récents</h2>
              <Link href="/dossiers" className="link-primary">
                Tous les dossiers →
              </Link>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Mode</th>
                    <th>Statut</th>
                    <th>ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {recents.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link href={`/dossiers/${d.id}`} className="link-primary">
                          {d.reference}
                        </Link>
                      </td>
                      <td>{d.clientNoms.join(", ") || "—"}</td>
                      <td>{d.mode}</td>
                      <td>
                        <Badge label={d.statut} />
                      </td>
                      <td>{d.eta ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Alertes stock</h2>
              <Link href="/entrepot" className="link-primary">
                Entrepôt →
              </Link>
            </div>
            {articlesSousSeuil.length === 0 ? (
              <div className="empty-state">Aucune alerte, tous les stocks sont au-dessus du seuil.</div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Stock</th>
                      <th>Seuil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articlesSousSeuil.map((a) => (
                      <tr key={a.id}>
                        <td>{a.nom}</td>
                        <td>{a.quantite}</td>
                        <td>{a.seuil}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </>
    );
  } catch (error) {
    return (
      <>
        <div className="page-header">
          <h1>Vue d'ensemble</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
