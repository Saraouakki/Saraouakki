import { getFournisseurs, getArticles, getDossiers } from "@/lib/data";
import FournisseursTable from "@/components/FournisseursTable";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function FournisseursPage() {
  try {
    const [fournisseurs, articles, dossiers] = await Promise.all([
      getFournisseurs(),
      getArticles(),
      getDossiers(),
    ]);

    const articleCounts: Record<string, number> = {};
    const dossierCounts: Record<string, number> = {};
    for (const f of fournisseurs) {
      articleCounts[f.id] = articles.filter((a) => a.fournisseurIds.includes(f.id)).length;
      dossierCounts[f.id] = dossiers.filter((d) => d.fournisseurIds.includes(f.id)).length;
    }

    return (
      <>
        <div className="page-header">
          <h1>Fournisseurs</h1>
          <p>{fournisseurs.length} fournisseur(s) enregistré(s).</p>
        </div>

        <FournisseursTable
          fournisseurs={fournisseurs}
          articleCounts={articleCounts}
          dossierCounts={dossierCounts}
        />
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
