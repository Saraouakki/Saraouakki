import { getEntrepots, getArticles, getMouvements } from "@/lib/data";
import StatCard from "@/components/StatCard";
import ArticlesTable from "@/components/ArticlesTable";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function EntrepotPage() {
  try {
    const [entrepots, articles, mouvements] = await Promise.all([
      getEntrepots(),
      getArticles(),
      getMouvements(),
    ]);

    const sousSeuil = articles.filter(
      (a) => a.quantite != null && a.seuil != null && a.quantite <= a.seuil
    );
    const valeurStock = articles.reduce(
      (sum, a) => sum + (a.quantite ?? 0) * (a.prixUnitaire ?? 0),
      0
    );

    return (
      <>
        <div className="page-header">
          <h1>Entrepôt</h1>
          <p>Stocks, emplacements et mouvements.</p>
        </div>

        <div className="stat-grid">
          <StatCard label="Entrepôts" value={entrepots.length} />
          <StatCard label="Références en stock" value={articles.length} />
          <StatCard label="Alertes réappro" value={sousSeuil.length} />
          <StatCard
            label="Valeur totale du stock"
            value={
              new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(valeurStock) +
              " $"
            }
          />
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Entrepôts</h2>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Ville</th>
                  <th>Pays</th>
                  <th>Capacité</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {entrepots.map((e) => (
                  <tr key={e.id}>
                    <td>{e.nom}</td>
                    <td>{e.ville || "—"}</td>
                    <td>{e.pays || "—"}</td>
                    <td>{e.capacite != null ? `${e.capacite} m³` : "—"}</td>
                    <td>{e.responsable || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="page-header" style={{ marginBottom: 8 }}>
          <p style={{ fontWeight: 600, color: "var(--text)", fontSize: 15 }}>Articles en stock</p>
        </div>
        <ArticlesTable articles={articles} />

        <div className="panel">
          <div className="panel-header">
            <h2>Mouvements récents</h2>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Article</th>
                  <th>Type</th>
                  <th>Quantité</th>
                  <th>Fournisseur</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map((m) => (
                  <tr key={m.id}>
                    <td>{m.reference}</td>
                    <td>{m.articleNoms.join(", ") || "—"}</td>
                    <td>
                      <span className={`badge badge-${m.type === "Entrée" ? "green" : "red"}`}>
                        {m.type}
                      </span>
                    </td>
                    <td>{m.quantite ?? "—"}</td>
                    <td>{m.fournisseurNoms.join(", ") || "—"}</td>
                    <td>{m.date ?? "—"}</td>
                    <td>{m.note || "—"}</td>
                  </tr>
                ))}
                {mouvements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      Aucun mouvement enregistré.
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
          <h1>Entrepôt</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
