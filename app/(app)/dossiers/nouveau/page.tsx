import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-session";
import { canWrite } from "@/lib/access";
import {
  getClients,
  getTransporteurs,
  getVehicules,
  getChauffeurs,
  getEntrepots,
  getFournisseurs,
} from "@/lib/data";
import NouveauDossierForm from "@/components/NouveauDossierForm";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function NouveauDossierPage() {
  const session = await getSession();
  if (!session || session.role !== "Interne") redirect("/");
  if (!canWrite(session)) redirect("/dossiers");

  try {
    const [clients, transporteurs, vehicules, chauffeurs, entrepots, fournisseurs] = await Promise.all([
      getClients(),
      getTransporteurs(),
      getVehicules(),
      getChauffeurs(),
      getEntrepots(),
      getFournisseurs(),
    ]);

    return (
      <>
        <div className="page-header">
          <h1>Nouveau dossier</h1>
          <p>Créer un dossier de transit, freight ou transport.</p>
        </div>
        <NouveauDossierForm
          clients={clients.map((c) => ({ id: c.id, label: c.nom }))}
          transporteurs={transporteurs.map((t) => ({ id: t.id, label: t.nom }))}
          vehicules={vehicules.map((v) => ({ id: v.id, label: v.immatriculation }))}
          chauffeurs={chauffeurs.map((c) => ({ id: c.id, label: c.nom }))}
          entrepots={entrepots.map((e) => ({ id: e.id, label: e.nom }))}
          fournisseurs={fournisseurs.map((f) => ({ id: f.id, label: f.nom }))}
        />
      </>
    );
  } catch (error) {
    return (
      <>
        <div className="page-header">
          <h1>Nouveau dossier</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
