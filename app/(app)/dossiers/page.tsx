import { getDossiers } from "@/lib/data";
import { getSession } from "@/lib/server-session";
import { canWrite } from "@/lib/access";
import DossiersTable from "@/components/DossiersTable";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function DossiersPage() {
  try {
    const [dossiers, session] = await Promise.all([getDossiers(), getSession()]);

    return (
      <>
        <div className="page-header">
          <h1>Dossiers</h1>
          <p>Transit douanier, freight et transport — {dossiers.length} dossier(s).</p>
        </div>

        <DossiersTable dossiers={dossiers} canCreate={canWrite(session)} />
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
