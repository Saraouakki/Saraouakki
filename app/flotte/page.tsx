import { getVehicules, getChauffeurs } from "@/lib/data";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

export default async function FlottePage() {
  try {
    const [vehicules, chauffeurs] = await Promise.all([getVehicules(), getChauffeurs()]);
    const dispo = vehicules.filter((v) => v.statut === "Disponible").length;
    const enMission = vehicules.filter((v) => v.statut === "En mission").length;
    const maintenance = vehicules.filter((v) => v.statut === "Maintenance").length;

    return (
      <>
        <div className="page-header">
          <h1>Flotte</h1>
          <p>Véhicules, conteneurs et chauffeurs.</p>
        </div>

        <div className="stat-grid">
          <StatCard label="Véhicules" value={vehicules.length} />
          <StatCard label="Disponibles" value={dispo} />
          <StatCard label="En mission" value={enMission} />
          <StatCard label="En maintenance" value={maintenance} />
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Véhicules & conteneurs</h2>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Immatriculation / N°</th>
                  <th>Type</th>
                  <th>Capacité</th>
                  <th>Transporteur</th>
                  <th>Statut</th>
                  <th>Dernière révision</th>
                </tr>
              </thead>
              <tbody>
                {vehicules.map((v) => (
                  <tr key={v.id}>
                    <td>{v.immatriculation}</td>
                    <td>{v.type}</td>
                    <td>{v.capacite != null ? `${v.capacite} kg` : "—"}</td>
                    <td>{v.transporteurNoms.join(", ") || "—"}</td>
                    <td>
                      <Badge label={v.statut} />
                    </td>
                    <td>{v.derniereRevision ?? "—"}</td>
                  </tr>
                ))}
                {vehicules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Aucun véhicule enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Chauffeurs</h2>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Permis</th>
                  <th>Véhicule assigné</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {chauffeurs.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{c.telephone || "—"}</td>
                    <td>{c.permis || "—"}</td>
                    <td>{c.vehiculeNoms.join(", ") || "—"}</td>
                    <td>
                      <Badge label={c.statut} />
                    </td>
                  </tr>
                ))}
                {chauffeurs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      Aucun chauffeur enregistré.
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
          <h1>Flotte</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
