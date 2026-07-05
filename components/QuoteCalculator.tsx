"use client";

import { useMemo, useState } from "react";
import { computeQuote } from "@/lib/quote";
import type { Tarif } from "@/lib/types";

const MODES = ["Route", "Maritime", "Aérien", "Ferroviaire"];

export default function QuoteCalculator({ tarifs }: { tarifs: Tarif[] }) {
  const [mode, setMode] = useState(MODES[0]);
  const [origine, setOrigine] = useState("Maroc");
  const [destination, setDestination] = useState("");
  const [poids, setPoids] = useState("");
  const [volume, setVolume] = useState("");

  const [showLeadForm, setShowLeadForm] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [societe, setSociete] = useState("");
  const [message, setMessage] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadPending, setLeadPending] = useState(false);
  const [leadSent, setLeadSent] = useState(false);

  const quote = useMemo(() => {
    if (!destination.trim()) return null;
    return computeQuote(tarifs, {
      mode,
      origine,
      destination,
      poids: poids ? Number(poids) : null,
      volume: volume ? Number(volume) : null,
    });
  }, [tarifs, mode, origine, destination, poids, volume]);

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);
    setLeadPending(true);
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          email,
          telephone,
          societe,
          mode,
          origine,
          destination,
          poids: poids ? Number(poids) : null,
          volume: volume ? Number(volume) : null,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeadError(data.error ?? "Échec de l'envoi.");
        return;
      }
      setLeadSent(true);
    } catch {
      setLeadError("Erreur réseau, réessayez.");
    } finally {
      setLeadPending(false);
    }
  }

  return (
    <div className="quote-grid">
      <div className="panel">
        <div className="panel-header">
          <h2>Votre trajet</h2>
        </div>
        <div className="dossier-form-grid">
          <label>
            Mode de transport
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Origine
            <input value={origine} onChange={(e) => setOrigine(e.target.value)} placeholder="Maroc" />
          </label>
          <label>
            Destination
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="France, Espagne, Casablanca..."
            />
          </label>
          <label>
            Poids (kg)
            <input type="number" value={poids} onChange={(e) => setPoids(e.target.value)} />
          </label>
          <label>
            Volume (CBM)
            <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Estimation</h2>
        </div>
        <div style={{ padding: 20 }}>
          {!destination.trim() ? (
            <div className="empty-state">Renseignez une destination pour voir une estimation.</div>
          ) : quote?.montant != null ? (
            <>
              <div className="quote-amount">
                {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(quote.montant)}{" "}
                {quote.devise}
              </div>
              <p className="quote-sub">
                Délai indicatif : {quote.delaiJours ?? "—"} jour(s) · {quote.tarif?.nom}
              </p>
              <p className="quote-disclaimer">
                Estimation indicative basée sur nos grilles tarifaires standard. Le devis ferme peut varier
                selon la nature exacte de la marchandise et les conditions douanières.
              </p>
            </>
          ) : (
            <div className="empty-state">
              Pas de grille tarifaire standard pour ce trajet — demandez un devis personnalisé ci-dessous.
            </div>
          )}

          {!showLeadForm && !leadSent && (
            <button type="button" className="uploader-form-btn-sm" onClick={() => setShowLeadForm(true)}>
              Demander ce devis
            </button>
          )}

          {leadSent && (
            <div className="login-success">
              Demande envoyée. Notre équipe vous recontacte rapidement.
            </div>
          )}

          {showLeadForm && !leadSent && (
            <form onSubmit={handleLeadSubmit} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                Nom
                <input required value={nom} onChange={(e) => setNom(e.target.value)} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                Société
                <input value={societe} onChange={(e) => setSociete(e.target.value)} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                Téléphone (WhatsApp de préférence)
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+212..." />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                Message (optionnel)
                <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>
              {leadError && <div className="login-error">{leadError}</div>}
              <button type="submit" className="uploader-form-btn-sm" disabled={leadPending}>
                {leadPending ? "Envoi..." : "Envoyer ma demande"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
