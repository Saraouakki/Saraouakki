"use client";

import { useMemo, useState } from "react";
import type { Client } from "@/lib/types";

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.nom, c.societe, c.email, c.pays, c.type].join(" ").toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <>
      <div className="list-toolbar">
        <input
          className="list-search"
          placeholder="Rechercher un client (nom, société, e-mail, pays...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="list-count">
          {filtered.length} / {clients.length}
        </span>
      </div>

      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Société</th>
                <th>Type</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Pays</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.nom}</td>
                  <td>{c.societe || "—"}</td>
                  <td>{c.type || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.telephone || "—"}</td>
                  <td>{c.pays || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Aucun client ne correspond à la recherche.
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
