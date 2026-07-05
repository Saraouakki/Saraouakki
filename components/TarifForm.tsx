"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MODES = ["Route", "Maritime", "Aérien", "Ferroviaire"];
const DEVISES = ["MAD", "EUR", "USD"];

export default function TarifForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    mode: MODES[0],
    origine: "",
    destination: "",
    prixParKg: "",
    prixParCbm: "",
    poidsMinFacturable: "",
    devisMinimum: "",
    devise: DEVISES[0],
    delaiJours: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/tarifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prixParKg: form.prixParKg ? Number(form.prixParKg) : null,
          prixParCbm: form.prixParCbm ? Number(form.prixParCbm) : null,
          poidsMinFacturable: form.poidsMinFacturable ? Number(form.poidsMinFacturable) : null,
          devisMinimum: form.devisMinimum ? Number(form.devisMinimum) : null,
          delaiJours: form.delaiJours ? Number(form.delaiJours) : null,
          actif: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la création.");
        return;
      }
      setForm({
        nom: "",
        mode: MODES[0],
        origine: "",
        destination: "",
        prixParKg: "",
        prixParCbm: "",
        poidsMinFacturable: "",
        devisMinimum: "",
        devise: DEVISES[0],
        delaiJours: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="uploader-form-btn-sm" onClick={() => setOpen(true)}>
        + Nouvelle grille tarifaire
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="panel dossier-form">
      <div className="dossier-form-grid">
        <label>
          Nom
          <input
            required
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            placeholder="Route — Maroc vers Espagne"
          />
        </label>
        <label>
          Mode
          <select value={form.mode} onChange={(e) => set("mode", e.target.value)}>
            {MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Origine
          <input required value={form.origine} onChange={(e) => set("origine", e.target.value)} placeholder="Maroc" />
        </label>
        <label>
          Destination
          <input
            required
            value={form.destination}
            onChange={(e) => set("destination", e.target.value)}
            placeholder="Espagne (ou International)"
          />
        </label>
        <label>
          Prix par kg
          <input type="number" step="0.01" value={form.prixParKg} onChange={(e) => set("prixParKg", e.target.value)} />
        </label>
        <label>
          Prix par CBM
          <input type="number" step="0.01" value={form.prixParCbm} onChange={(e) => set("prixParCbm", e.target.value)} />
        </label>
        <label>
          Poids min facturable (kg)
          <input
            type="number"
            value={form.poidsMinFacturable}
            onChange={(e) => set("poidsMinFacturable", e.target.value)}
          />
        </label>
        <label>
          Devis minimum
          <input type="number" value={form.devisMinimum} onChange={(e) => set("devisMinimum", e.target.value)} />
        </label>
        <label>
          Devise
          <select value={form.devise} onChange={(e) => set("devise", e.target.value)}>
            {DEVISES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Délai indicatif (jours)
          <input type="number" value={form.delaiJours} onChange={(e) => set("delaiJours", e.target.value)} />
        </label>
      </div>

      {error && <div className="login-error" style={{ margin: "0 20px 16px" }}>{error}</div>}

      <div style={{ padding: "0 20px 20px", display: "flex", gap: 8 }}>
        <button type="submit" className="uploader-form-btn-sm" disabled={pending}>
          {pending ? "Création..." : "Créer la grille"}
        </button>
        <button
          type="button"
          className="uploader-form-btn-sm danger"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
