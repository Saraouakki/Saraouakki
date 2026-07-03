"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de la connexion");
        setPending(false);
        return;
      }
      const next = searchParams.get("next");
      router.push(next || (data.role === "Interne" ? "/" : "/mon-espace"));
      router.refresh();
    } catch {
      setError("Erreur réseau, réessayez.");
      setPending(false);
    }
  }

  return (
    <div className="login-card">
      <div className="login-brand">
        <span className="brand-icon">🚚</span>
        <span>Logistique &amp; Transit</span>
      </div>
      <p className="login-sub">Connectez-vous à votre espace (interne, client ou fournisseur).</p>

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
        <label>
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" disabled={pending}>
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <div className="login-demo">
        <strong>Comptes de démo</strong>
        <div>Interne — srouakki@gmail.com</div>
        <div>Client — client@atlastextiles.ma</div>
        <div>Fournisseur — contact@textilesdusud.ma</div>
        <div>Mot de passe : <code>Logistique2026!</code></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-shell">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
