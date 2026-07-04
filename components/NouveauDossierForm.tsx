"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUREAU_DOUANE_OPTIONS, REGIME_DOUANIER_OPTIONS } from "@/lib/types";

interface Option {
  id: string;
  label: string;
}

interface Props {
  clients: Option[];
  transporteurs: Option[];
  vehicules: Option[];
  chauffeurs: Option[];
  entrepots: Option[];
  fournisseurs: Option[];
}

const TYPES = ["Import", "Export", "Transit domestique", "Transbordement"];
const MODES = ["Route", "Maritime", "Aérien", "Ferroviaire", "Multimodal"];
const PRIORITES = ["Normale", "Urgente"];

export default function NouveauDossierForm(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    reference: "",
    type: TYPES[0],
    mode: MODES[0],
    priorite: PRIORITES[0],
    clientId: "",
    transporteurId: "",
    vehiculeId: "",
    chauffeurId: "",
    entrepotId: "",
    fournisseurId: "",
    origine: "",
    destination: "",
    bureauDouane: "",
    regimeDouanier: "",
    numeroDUM: "",
    numero: "",
    dateDepart: "",
    eta: "",
    poids: "",
    volume: "",
    valeur: "",
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
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          poids: form.poids ? Number(form.poids) : null,
          volume: form.volume ? Number(form.volume) : null,
          valeur: form.valeur ? Number(form.valeur) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la création.");
        setPending(false);
        return;
      }
      router.push(`/dossiers/${data.id}`);
      router.refresh();
    } catch {
      setError("Erreur réseau, réessayez.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel dossier-form">
      <div className="dossier-form-grid">
        <label>
          Référence
          <input
            required
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
            placeholder="DOS-2026-005"
          />
        </label>
        <label>
          Type
          <select value={form.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
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
          Priorité
          <select value={form.priorite} onChange={(e) => set("priorite", e.target.value)}>
            {PRIORITES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>

        <label>
          Client
          <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)}>
            <option value="">—</option>
            {props.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fournisseur
          <select value={form.fournisseurId} onChange={(e) => set("fournisseurId", e.target.value)}>
            <option value="">—</option>
            {props.fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Transporteur
          <select value={form.transporteurId} onChange={(e) => set("transporteurId", e.target.value)}>
            <option value="">—</option>
            {props.transporteurs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Véhicule / conteneur
          <select value={form.vehiculeId} onChange={(e) => set("vehiculeId", e.target.value)}>
            <option value="">—</option>
            {props.vehicules.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Chauffeur
          <select value={form.chauffeurId} onChange={(e) => set("chauffeurId", e.target.value)}>
            <option value="">—</option>
            {props.chauffeurs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Entrepôt
          <select value={form.entrepotId} onChange={(e) => set("entrepotId", e.target.value)}>
            <option value="">—</option>
            {props.entrepots.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Origine
          <input value={form.origine} onChange={(e) => set("origine", e.target.value)} />
        </label>
        <label>
          Destination
          <input value={form.destination} onChange={(e) => set("destination", e.target.value)} />
        </label>
        <label>
          Bureau de douane
          <select value={form.bureauDouane} onChange={(e) => set("bureauDouane", e.target.value)}>
            <option value="">—</option>
            {BUREAU_DOUANE_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label>
          Régime douanier
          <select value={form.regimeDouanier} onChange={(e) => set("regimeDouanier", e.target.value)}>
            <option value="">—</option>
            {REGIME_DOUANIER_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          N° DUM (BADR)
          <input
            value={form.numeroDUM}
            onChange={(e) => set("numeroDUM", e.target.value)}
            placeholder="DUM/2026/000123456"
          />
        </label>
        <label>
          N° conteneur/plaque
          <input value={form.numero} onChange={(e) => set("numero", e.target.value)} />
        </label>

        <label>
          Date de départ
          <input type="date" value={form.dateDepart} onChange={(e) => set("dateDepart", e.target.value)} />
        </label>
        <label>
          ETA
          <input type="date" value={form.eta} onChange={(e) => set("eta", e.target.value)} />
        </label>
        <label>
          Poids (kg)
          <input type="number" value={form.poids} onChange={(e) => set("poids", e.target.value)} />
        </label>
        <label>
          Volume (m³)
          <input type="number" value={form.volume} onChange={(e) => set("volume", e.target.value)} />
        </label>
        <label>
          Valeur marchandise ($)
          <input type="number" value={form.valeur} onChange={(e) => set("valeur", e.target.value)} />
        </label>
      </div>

      {error && <div className="login-error" style={{ margin: "16px 20px 0" }}>{error}</div>}

      <div style={{ padding: 20 }}>
        <button type="submit" className="uploader-form-btn-sm" disabled={pending}>
          {pending ? "Création..." : "Créer le dossier"}
        </button>
      </div>
    </form>
  );
}
