import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-session";
import { canWrite } from "@/lib/access";
import DossierImportForm from "@/components/DossierImportForm";

export const dynamic = "force-dynamic";

export default async function ImportDossiersPage() {
  const session = await getSession();
  if (!session || session.role !== "Interne") redirect("/");
  if (!canWrite(session)) redirect("/dossiers");

  return (
    <>
      <div className="page-header">
        <h1>Importer des dossiers depuis Excel</h1>
        <p>
          Migrez vos dossiers existants sans tout ressaisir : exportez votre fichier Excel en CSV et
          importez-le ici. Aucune donnée n'est perdue si une ligne pose problème — elle est simplement
          signalée.
        </p>
      </div>
      <DossierImportForm />
    </>
  );
}
