"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (!uid || !token) {
      setError("Lien invalide. Redemandez une réinitialisation.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        setPending(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Erreur réseau, réessayez.");
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="login-success" style={{ marginTop: 8 }}>
        Mot de passe mis à jour. Redirection vers la connexion...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label>
        Nouveau mot de passe
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8 caractères minimum"
          autoComplete="new-password"
        />
      </label>
      <label>
        Confirmer le mot de passe
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      {error && <div className="login-error">{error}</div>}
      <button type="submit" disabled={pending}>
        {pending ? "Mise à jour..." : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-icon">🚚</span>
          <span>Logistique &amp; Transit</span>
        </div>
        <p className="login-sub">Choisissez un nouveau mot de passe.</p>

        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>

        <div className="login-demo">
          <Link href="/login" className="link-primary">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
