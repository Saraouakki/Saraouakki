"use client";

import { useMemo, useState } from "react";
import Badge from "./Badge";
import type { Article } from "@/lib/types";
import { arrayToCsv, downloadCsv } from "@/lib/csv";

export default function ArticlesTable({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");
  const [onlyAlerts, setOnlyAlerts] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const alerte = a.quantite != null && a.seuil != null && a.quantite <= a.seuil;
      if (onlyAlerts && !alerte) return false;
      if (!q) return true;
      return [a.nom, a.sku, a.categorie, ...a.entrepotNoms, ...a.fournisseurNoms]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [articles, query, onlyAlerts]);

  function handleExport() {
    const csv = arrayToCsv(
      ["Article", "SKU", "Catégorie", "Quantité", "Seuil", "Entrepôt", "Fournisseur", "Prix unitaire"],
      filtered.map((a) => [
        a.nom,
        a.sku,
        a.categorie,
        a.quantite,
        a.seuil,
        a.entrepotNoms.join("; "),
        a.fournisseurNoms.join("; "),
        a.prixUnitaire,
      ])
    );
    downloadCsv(`articles-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <>
      <div className="list-toolbar">
        <input
          className="list-search"
          placeholder="Rechercher un article (nom, SKU, entrepôt, fournisseur...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={onlyAlerts} onChange={(e) => setOnlyAlerts(e.target.checked)} />
          Alertes de réappro uniquement
        </label>
        <span className="list-count">
          {filtered.length} / {articles.length}
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
                <th>Article</th>
                <th>SKU</th>
                <th>Catégorie</th>
                <th>Quantité</th>
                <th>Seuil</th>
                <th>Entrepôt</th>
                <th>Fournisseur</th>
                <th>Prix unitaire</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const alerte = a.quantite != null && a.seuil != null && a.quantite <= a.seuil;
                return (
                  <tr key={a.id}>
                    <td>{a.nom}</td>
                    <td>{a.sku || "—"}</td>
                    <td>{a.categorie || "—"}</td>
                    <td>{alerte ? <Badge label="À fournir" /> : a.quantite ?? "—"}</td>
                    <td>{a.seuil ?? "—"}</td>
                    <td>{a.entrepotNoms.join(", ") || "—"}</td>
                    <td>{a.fournisseurNoms.join(", ") || "—"}</td>
                    <td>{a.prixUnitaire != null ? `${a.prixUnitaire} $` : "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    Aucun article ne correspond à la recherche.
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
