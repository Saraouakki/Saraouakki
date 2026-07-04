import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-session";
import { getLocale } from "@/lib/server-i18n";
import { t } from "@/lib/i18n";
import LogoutButton from "@/components/LogoutButton";
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();

  const internalNav = [
    { href: "/", label: t(locale, "nav_overview"), icon: "📊" },
    { href: "/dossiers", label: t(locale, "nav_dossiers"), icon: "📦" },
    { href: "/flotte", label: t(locale, "nav_flotte"), icon: "🚚" },
    { href: "/entrepot", label: t(locale, "nav_entrepot"), icon: "🏭" },
    { href: "/clients", label: t(locale, "nav_clients"), icon: "🤝" },
    { href: "/fournisseurs", label: t(locale, "nav_fournisseurs"), icon: "🏗️" },
    { href: "/comptes", label: t(locale, "nav_comptes"), icon: "👤" },
    { href: "/audit", label: t(locale, "nav_audit"), icon: "🕓" },
  ];
  const portalNav = [{ href: "/mon-espace", label: t(locale, "nav_mon_espace"), icon: "📦" }];
  const roleLabel: Record<string, string> = {
    Interne: t(locale, "role_interne"),
    Client: t(locale, "role_client"),
    Fournisseur: t(locale, "role_fournisseur"),
  };

  const nav = session.role === "Interne" ? internalNav : portalNav;

  return (
    <div className="shell">
      <input type="checkbox" id="nav-toggle" className="nav-toggle-checkbox" />
      <div className="mobile-topbar">
        <label htmlFor="nav-toggle" className="nav-toggle-label" aria-label="Ouvrir le menu">
          ☰
        </label>
        <span className="mobile-topbar-brand">🚚 Logistique &amp; Transit</span>
      </div>
      <label htmlFor="nav-toggle" className="nav-backdrop" aria-hidden="true" />
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🚚</span>
          <span className="brand-text">Logistique&nbsp;&amp;&nbsp;Transit</span>
          <label htmlFor="nav-toggle" className="nav-close" aria-label="Fermer le menu">
            ✕
          </label>
        </div>
        <nav>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <LocaleSwitcher locale={locale} />
          <div className="user-card">
            <div className="user-name">{session.nom}</div>
            <div className="user-role">{roleLabel[session.role] ?? session.role}</div>
          </div>
          <LogoutButton label={t(locale, "logout")} />
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
