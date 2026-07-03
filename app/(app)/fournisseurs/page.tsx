import { getFournisseurs, getArticles, getDossiers } from "@/lib/data";
import NotionErrorPanel from "@/components/NotionErrorPanel";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function FournisseursPage() {
  try {
    const [fournisseurs, articles, dossiers] = await Promise.all([
      getFournisseurs(),
      getArticles(),
      getDossiers(),
    ]);

    return (
      <>
        <div className="page-header">
          <h1>Fournisseurs</h1>
          <p>{fournisseurs.length} fournisseur(s) enregistré(s).</p>
        </div>

        <div className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Catégorie</th>
                  <th>Contact</th>
                  <th>Pays</th>
                  <th>Articles fournis</th>
                  <th>Dossiers liés</th>
                </tr>
              </thead>
              <tbody>
                {fournisseurs.map((f) => {
                  const nbArticles = articles.filter((a) =>
                    a.fournisseurIds.includes(f.id)
                  ).length;
                  const nbDossiers = dossiers.filter((d) =>
                    d.fournisseurIds.includes(f.id)
                  ).length;
                  return (
                    <tr key={f.id}>
                      <td>{f.nom}</td>
                      <td>
                        <Badge label={f.categorie} />
                      </td>
                      <td>
                        {f.contact || "—"}
                        {f.email ? ` · ${f.email}` : ""}
                      </td>
                      <td>{f.pays || "—"}</td>
                      <td>{nbArticles}</td>
                      <td>{nbDossiers}</td>
                    </tr>
                  );
                })}
                {fournisseurs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Aucun fournisseur enregistré.
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
          <h1>Fournisseurs</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
