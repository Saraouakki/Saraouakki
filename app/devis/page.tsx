import { getTarifs } from "@/lib/data";
import QuoteCalculator from "@/components/QuoteCalculator";

export const dynamic = "force-dynamic";

export default async function DevisPage() {
  let tarifs: Awaited<ReturnType<typeof getTarifs>> = [];
  try {
    tarifs = (await getTarifs()).filter((t) => t.actif);
  } catch {
    // Simulateur en mode dégradé : toujours "sur devis" si Notion est indisponible.
    tarifs = [];
  }

  return (
    <div className="devis-shell">
      <div className="devis-header">
        <span className="brand-icon">🚚</span>
        <span className="devis-title">Logistique &amp; Transit — Devis instantané</span>
      </div>
      <p className="devis-subtitle">
        Obtenez une estimation immédiate pour votre transport, sans créer de compte. Une équipe vous
        recontacte pour confirmer le devis ferme.
      </p>
      <QuoteCalculator tarifs={tarifs} />
    </div>
  );
}
