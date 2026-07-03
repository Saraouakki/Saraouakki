import Link from "next/link";
import { notFound } from "next/navigation";
import { getDossier, getEtapes, getDocuments } from "@/lib/data";
import Badge from "@/components/Badge";
import StatusUpdater from "@/components/StatusUpdater";
import NotionErrorPanel from "@/components/NotionErrorPanel";

export const dynamic = "force-dynamic";

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " $";
}

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const [dossier, etapes, documents] = await Promise.all([
      getDossier(id),
      getEtapes(),
      getDocuments(),
    ]);

    if (!dossier) notFound();

    const etapesDossier = etapes.filter((e) => e.dossierIds.includes(id));
    const documentsDossier = documents.filter((doc) => doc.dossierIds.includes(id));

    return (
      <>
        <div className="page-header">
          <p>
            <Link href="/dossiers" className="link-primary">
              ← Dossiers
            </Link>
          </p>
          <h1>{dossier.reference}</h1>
          <p>
            {dossier.type} · {dossier.mode} · {dossier.clientNoms.join(", ") || "Client non renseigné"}
          </p>
        </div>

        <div className="grid-2">
          <div>
            <div className="panel">
              <div className="panel-header">
                <h2>Informations générales</h2>
                <Badge label={dossier.statut} />
              </div>
              <div className="kv-list">
                <div>
                  <div className="k">Origine</div>
                  <div className="v">{dossier.origine || "—"}</div>
                </div>
                <div>
                  <div className="k">Destination</div>
                  <div className="v">{dossier.destination || "—"}</div>
                </div>
                <div>
                  <div className="k">Date de départ</div>
                  <div className="v">{dossier.dateDepart ?? "—"}</div>
                </div>
                <div>
                  <div className="k">ETA</div>
                  <div className="v">{dossier.eta ?? "—"}</div>
                </div>
                <div>
                  <div className="k">Date de livraison</div>
                  <div className="v">{dossier.dateLivraison ?? "—"}</div>
                </div>
                <div>
                  <div className="k">Priorité</div>
                  <div className="v">{dossier.priorite || "—"}</div>
                </div>
                <div>
                  <div className="k">Transporteur</div>
                  <div className="v">{dossier.transporteurNoms.join(", ") || "—"}</div>
                </div>
                <div>
                  <div className="k">Véhicule / conteneur</div>
                  <div className="v">{dossier.vehiculeNoms.join(", ") || dossier.numero || "—"}</div>
                </div>
                <div>
                  <div className="k">Chauffeur</div>
                  <div className="v">{dossier.chauffeurNoms.join(", ") || "—"}</div>
                </div>
                <div>
                  <div className="k">Entrepôt</div>
                  <div className="v">{dossier.entrepotNoms.join(", ") || "—"}</div>
                </div>
                <div>
                  <div className="k">Bureau de douane</div>
                  <div className="v">{dossier.bureauDouane || "—"}</div>
                </div>
                <div>
                  <div className="k">Poids / Volume</div>
                  <div className="v">
                    {dossier.poids ?? "—"} kg · {dossier.volume ?? "—"} m³
                  </div>
                </div>
                <div>
                  <div className="k">Valeur marchandise</div>
                  <div className="v">{formatMoney(dossier.valeur)}</div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Documents</h2>
              </div>
              {documentsDossier.length === 0 ? (
                <div className="empty-state">Aucun document associé.</div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Reçu le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentsDossier.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.nom}</td>
                          <td>{doc.type}</td>
                          <td>
                            <Badge label={doc.statut} />
                          </td>
                          <td>{doc.dateReception ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-header">
                <h2>Changer le statut</h2>
              </div>
              <div style={{ padding: 20 }}>
                <StatusUpdater id={dossier.id} current={dossier.statut} />
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Suivi</h2>
              </div>
              {etapesDossier.length === 0 ? (
                <div className="empty-state">Aucune étape enregistrée.</div>
              ) : (
                <div className="timeline">
                  {etapesDossier.map((e) => (
                    <div className="timeline-item" key={e.id}>
                      <div className="timeline-dot" />
                      <div className="timeline-body">
                        <div className="title">{e.titre}</div>
                        <div className="meta">
                          {e.dateHeure ? new Date(e.dateHeure).toLocaleString("fr-FR") : "—"}
                          {e.localisation ? ` · ${e.localisation}` : ""}
                        </div>
                        {e.commentaire && <div className="meta">{e.commentaire}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    return (
      <>
        <div className="page-header">
          <h1>Dossier</h1>
        </div>
        <NotionErrorPanel error={error} />
      </>
    );
  }
}
