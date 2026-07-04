"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-icon">🚚</span>
          <span>Logistique &amp; Transit</span>
        </div>
        <p className="login-sub">
          Indiquez votre e-mail : si un compte actif existe, un lien de réinitialisation vous sera envoyé.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
            />
          </label>
          {error && <div className="login-error">{error}</div>}
          {message && <div className="login-success">{message}</div>}
          <button type="submit" disabled={pending}>
            {pending ? "Envoi..." : "Envoyer le lien"}
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
