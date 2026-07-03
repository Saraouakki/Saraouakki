import Link from "next/link";
import { getSession } from "@/lib/server-session";
import { getDossiers, getArticles, getMouvements } from "@/lib/data";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " $";
}

export default async function MonEspacePage() {
  const session = await getSession();
  if (!session) return null; // le middleware protège déjà cette route

  try {
    if (session.role === "Client") {
      const dossiers = (await getDossiers()).filter(
        (d) => session.clientId != null && d.clientIds.includes(session.clientId)
      );
      const actifs = dossiers.filter((d) => d.statut !== "Livré" && d.statut !== "Annulé");
      const valeurActive = actifs.reduce((sum, d) => sum + (d.valeur ?? 0), 0);

      return (
        <>
          <div className="page-header">
            <h1>Mon espace — {session.nom}</h1>
            <p>Suivi de vos dossiers de transport et de transit.</p>
          </div>

          <div className="stat-grid">
            <StatCard label="Dossiers actifs" value={actifs.length} sub={`${dossiers.length} au total`} />
            <StatCard label="Valeur en transit" value={formatMoney(valeurActive)} />
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Mes dossiers</h2>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Type</th>
                    <th>Mode</th>
                    <th>Statut</th>
                    <th>Trajet</th>
                    <th>ETA</th>
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
                      <td>{d.type}</td>
                      <td>{d.mode}</td>
                      <td>
                        <Badge label={d.statut} />
                      </td>
                      <td>
                        {d.origine || "—"} → {d.destination || "—"}
                      </td>
                      <td>{d.eta ?? "—"}</td>
                    </tr>
                  ))}
                  {dossiers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        Aucun dossier associé à votre compte pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      );
    }

    if (session.role === "Fournisseur") {
      const [dossiers, articles, mouvements] = await Promise.all([
        getDossiers(),
        getArticles(),
        getMouvements(),
      ]);
      const mesDossiers = dossiers.filter(
        (d) => session.fournisseurId != null && d.fournisseurIds.includes(session.fournisseurId)
      );
      const mesArticles = articles.filter(
        (a) => session.fournisseurId != null && a.fournisseurIds.includes(session.fournisseurId)
      );
      const mesMouvements = mouvements.filter(
        (m) => session.fournisseurId != null && m.fournisseurIds.includes(session.fournisseurId)
      );

      return (
        <>
          <div className="page-header">
            <h1>Mon espace — {session.nom}</h1>
            <p>Dossiers d'approvisionnement, articles fournis et mouvements de stock.</p>
          </div>

          <div className="stat-grid">
            <StatCard label="Dossiers liés" value={mesDossiers.length} />
            <StatCard label="Articles fournis" value={mesArticles.length} />
            <StatCard label="Mouvements enregistrés" value={mesMouvements.length} />
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Dossiers liés à mes livraisons</h2>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Statut</th>
                    <th>Destination</th>
                    <th>ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {mesDossiers.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link href={`/dossiers/${d.id}`} className="link-primary">
                          {d.reference}
                        </Link>
                      </td>
                      <td>{d.clientNoms.join(", ") || "—"}</td>
                      <td>
                        <Badge label={d.statut} />
                      </td>
                      <td>{d.destination || "—"}</td>
                      <td>{d.eta ?? "—"}</td>
                    </tr>
                  ))}
                  {mesDossiers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        Aucun dossier associé pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Articles que je fournis</h2>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>SKU</th>
                    <th>Stock actuel</th>
                    <th>Entrepôt</th>
                  </tr>
                </thead>
                <tbody>
                  {mesArticles.map((a) => (
                    <tr key={a.id}>
                      <td>{a.nom}</td>
                      <td>{a.sku || "—"}</td>
                      <td>{a.quantite ?? "—"}</td>
                      <td>{a.entrepotNoms.join(", ") || "—"}</td>
                    </tr>
                  ))}
                  {mesArticles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        Aucun article associé pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Mouvements de stock</h2>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Article</th>
                    <th>Type</th>
                    <th>Quantité</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {mesMouvements.map((m) => (
                    <tr key={m.id}>
                      <td>{m.reference}</td>
                      <td>{m.articleNoms.join(", ") || "—"}</td>
                      <td>
                        <span className={`badge badge-${m.type === "Entrée" ? "green" : "red"}`}>
                          {m.type}
                        </span>
                      </td>
                      <td>{m.quantite ?? "—"}</td>
                      <td>{m.date ?? "—"}</td>
                    </tr>
                  ))}
                  {mesMouvements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        Aucun mouvement associé pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      );
    }

    // Rôle Interne : redirigé vers "/" par le middleware, mais on garde un repli.
    return (
      <div className="page-header">
        <h1>Mon espace</h1>
        <p>
          <Link href="/" className="link-primary">
            Retour à la vue d'ensemble
          </Link>
        </p>
      </div>
    );
  } catch (error) {
    return (
      <>
        <div className="page-header">
          <h1>Mon espace</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}

