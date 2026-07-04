"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { t, type Locale } from "@/lib/i18n";

function LoginFormInner({ locale }: { locale: Locale }) {
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
        <span>{t(locale, "login_title")}</span>
      </div>
      <p className="login-sub">{t(locale, "login_subtitle")}</p>

      <form onSubmit={handleSubmit} className="login-form">
        <label>
          {t(locale, "login_email")}
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
          {t(locale, "login_password")}
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
          {pending ? t(locale, "login_submit_pending") : t(locale, "login_submit")}
        </button>
      </form>

      <div className="login-links">
        <Link href="/forgot-password" className="link-primary">
          {t(locale, "login_forgot")}
        </Link>
        <Link href="/signup" className="link-primary">
          {t(locale, "login_signup")}
        </Link>
      </div>

      <div className="login-demo">
        <strong>Comptes de démo</strong>
        <div>Interne — srouakki@gmail.com</div>
        <div>Client — client@atlastextiles.ma</div>
        <div>Fournisseur — contact@textilesdusud.ma</div>
        <div>
          Mot de passe : <code>Logistique2026!</code>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner locale={locale} />
    </Suspense>
  );
}
