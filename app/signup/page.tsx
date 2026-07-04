"use client";

import Link from "next/link";
import { useState } from "react";

const CLIENT_TYPES = ["Importateur", "Exportateur", "Les deux"];
const FOURNISSEUR_CATEGORIES = [
  "Matières premières",
  "Pièces détachées",
  "Équipement",
  "Emballage",
  "Services",
];

export default function SignupPage() {
  const [role, setRole] = useState<"Client" | "Fournisseur">("Client");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [societe, setSociete] = useState("");
  const [telephone, setTelephone] = useState("");
  const [pays, setPays] = useState("");
  const [categorie, setCategorie] = useState(CLIENT_TYPES[0]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleRoleChange(next: "Client" | "Fournisseur") {
    setRole(next);
    setCategorie(next === "Client" ? CLIENT_TYPES[0] : FOURNISSEUR_CATEGORIES[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, password, role, societe, telephone, pays, categorie }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setMessage(data.message);
      }
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setPending(false);
    }
  }

  if (message) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="login-brand">
            <span className="brand-icon">🚚</span>
            <span>Logistique &amp; Transit</span>
          </div>
          <div className="login-success">{message}</div>
          <div className="login-demo">
            <Link href="/login" className="link-primary">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <div className="login-brand">
          <span className="brand-icon">🚚</span>
          <span>Logistique &amp; Transit</span>
        </div>
        <p className="login-sub">
          Demandez un accès client ou fournisseur. Votre compte sera activé par notre équipe après
          vérification.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Je suis
            <select value={role} onChange={(e) => handleRoleChange(e.target.value as "Client" | "Fournisseur")}>
              <option value="Client">Client (je fais transporter des marchandises)</option>
              <option value="Fournisseur">Fournisseur (je fournis des marchandises/services)</option>
            </select>
          </label>
          <label>
            Nom du contact
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </label>
          <label>
            Société
            <input value={societe} onChange={(e) => setSociete(e.target.value)} required />
          </label>
          <label>
            {role === "Client" ? "Type de client" : "Catégorie de fournisseur"}
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
              {(role === "Client" ? CLIENT_TYPES : FOURNISSEUR_CATEGORIES).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Email professionnel
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Téléphone
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </label>
          <label>
            Pays
            <input value={pays} onChange={(e) => setPays(e.target.value)} />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={pending}>
            {pending ? "Envoi..." : "Demander un accès"}
          </button>
        </form>

        <div className="login-demo">
          <Link href="/login" className="link-primary">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
