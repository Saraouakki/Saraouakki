"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "./Badge";
import type { Dossier } from "@/lib/types";

type SortKey = "reference" | "eta" | "statut" | "priorite";

export default function DossiersTable({
  dossiers,
  canCreate,
}: {
  dossiers: Dossier[];
  canCreate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState("Tous");
  const [sortKey, setSortKey] = useState<SortKey>("reference");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const statuts = useMemo(
    () => ["Tous", ...Array.from(new Set(dossiers.map((d) => d.statut))).filter(Boolean)],
    [dossiers]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = dossiers;
    if (statutFilter !== "Tous") {
      list = list.filter((d) => d.statut === statutFilter);
    }
    if (q) {
      list = list.filter((d) =>
        [
          d.reference,
          ...d.clientNoms,
          ...d.transporteurNoms,
          ...d.fournisseurNoms,
          d.origine,
          d.destination,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return av.localeCompare(bv) * sortDir;
    });
    return sorted;
  }, [dossiers, query, statutFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  function sortIndicator(key: SortKey) {
    if (key !== sortKey) return "";
    return sortDir === 1 ? " ▲" : " ▼";
  }

  return (
    <>
      <div className="list-toolbar">
        <input
          className="list-search"
          placeholder="Rechercher (référence, client, transporteur, trajet...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
          {statuts.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="list-count">
          {filtered.length} / {dossiers.length}
        </span>
        {canCreate && (
          <Link href="/dossiers/nouveau" className="uploader-form-btn-sm" style={{ marginLeft: "auto" }}>
            + Nouveau dossier
          </Link>
        )}
      </div>

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleSort("reference")}>
                  Référence{sortIndicator("reference")}
                </th>
                <th>Client</th>
                <th>Type</th>
                <th>Mode</th>
                <th className="sortable" onClick={() => toggleSort("statut")}>
                  Statut{sortIndicator("statut")}
                </th>
                <th>Transporteur</th>
                <th>Fournisseur</th>
                <th>Trajet</th>
                <th className="sortable" onClick={() => toggleSort("eta")}>
                  ETA{sortIndicator("eta")}
                </th>
                <th className="sortable" onClick={() => toggleSort("priorite")}>
                  Priorité{sortIndicator("priorite")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`/dossiers/${d.id}`} className="link-primary">
                      {d.reference}
                    </Link>
                  </td>
                  <td>{d.clientNoms.join(", ") || "—"}</td>
                  <td>{d.type}</td>
                  <td>{d.mode}</td>
                  <td>
                    <Badge label={d.statut} />
                  </td>
                  <td>{d.transporteurNoms.join(", ") || "—"}</td>
                  <td>{d.fournisseurNoms.join(", ") || "—"}</td>
                  <td>
                    {d.origine || "—"} → {d.destination || "—"}
                  </td>
                  <td>{d.eta ?? "—"}</td>
                  <td>{d.priorite === "Urgente" ? <Badge label="Urgente" /> : "Normale"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty-state">
                    Aucun dossier ne correspond à la recherche.
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
