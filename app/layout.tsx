import type { Metadata } from "next";
import { getLocale } from "@/lib/server-i18n";
import { direction } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logistique & Transit",
  description: "Plateforme de gestion logistique — transit douanier, flotte, freight, entrepôt",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={direction(locale)}>
      <body>{children}</body>
    </html>
  );
}
