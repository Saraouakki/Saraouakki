import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-session";
import LogoutButton from "@/components/LogoutButton";

const INTERNAL_NAV = [
  { href: "/", label: "Vue d'ensemble", icon: "📊" },
  { href: "/dossiers", label: "Dossiers", icon: "📦" },
  { href: "/flotte", label: "Flotte", icon: "🚚" },
  { href: "/entrepot", label: "Entrepôt", icon: "🏭" },
  { href: "/clients", label: "Clients", icon: "🤝" },
  { href: "/fournisseurs", label: "Fournisseurs", icon: "🏗️" },
];

const PORTAL_NAV = [{ href: "/mon-espace", label: "Mon espace", icon: "📦" }];

const ROLE_LABEL: Record<string, string> = {
  Interne: "Équipe interne",
  Client: "Client",
  Fournisseur: "Fournisseur",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const nav = session.role === "Interne" ? INTERNAL_NAV : PORTAL_NAV;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🚚</span>
          <span className="brand-text">Logistique&nbsp;&amp;&nbsp;Transit</span>
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
          <div className="user-card">
            <div className="user-name">{session.nom}</div>
            <div className="user-role">{ROLE_LABEL[session.role] ?? session.role}</div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
