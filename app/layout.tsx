import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logistique & Transit",
  description: "Plateforme de gestion logistique — transit douanier, flotte, freight, entrepôt",
};

const NAV = [
  { href: "/", label: "Vue d'ensemble", icon: "📊" },
  { href: "/dossiers", label: "Dossiers", icon: "📦" },
  { href: "/flotte", label: "Flotte", icon: "🚚" },
  { href: "/entrepot", label: "Entrepôt", icon: "🏭" },
  { href: "/clients", label: "Clients", icon: "🤝" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-icon">🚚</span>
              <span className="brand-text">Logistique&nbsp;&amp;&nbsp;Transit</span>
            </div>
            <nav>
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="nav-link">
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="sidebar-footer">Connecté à Notion</div>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
