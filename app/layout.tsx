import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logistique & Transit",
  description: "Plateforme de gestion logistique — transit douanier, flotte, freight, entrepôt",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
