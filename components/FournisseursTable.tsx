"use client";

import { useMemo, useState } from "react";
import Badge from "./Badge";
import type { Fournisseur } from "@/lib/types";
import { arrayToCsv, downloadCsv } from "@/lib/csv";

interface Props {
  fournisseurs: Fournisseur[];
  articleCounts: Record<string, number>;
  dossierCounts: Record<string, number>;
}

export default function FournisseursTable({ fournisseurs, articleCounts, dossierCounts }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fournisseurs;
    return fournisseurs.filter((f) =>
      [f.nom, f.categorie, f.contact, f.email, f.pays].join(" ").toLowerCase().includes(q)
    );
  }, [fournisseurs, query]);

  function handleExport() {
    const csv = arrayToCsv(
      ["Nom", "Catégorie", "Contact", "Email", "Téléphone", "Pays", "Articles fournis", "Dossiers liés"],
      filtered.map((f) => [
        f.nom,
        f.categorie,
        f.contact,
        f.email,
        f.telephone,
        f.pays,
        articleCounts[f.id] ?? 0,
        dossierCounts[f.id] ?? 0,
      ])
    );
    downloadCsv(`fournisseurs-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <>
      <div className="list-toolbar">
        <input
          className="list-search"
          placeholder="Rechercher un fournisseur (nom, catégorie, contact...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="list-count">
          {filtered.length} / {fournisseurs.length}
        </span>
        <button type="button" className="uploader-form-btn-sm" onClick={handleExport}>
          Exporter CSV
        </button>
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
              {filtered.map((f) => (
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
                  <td>{articleCounts[f.id] ?? 0}</td>
                  <td>{dossierCounts[f.id] ?? 0}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Aucun fournisseur ne correspond à la recherche.
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
