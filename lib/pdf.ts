import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Dossier, DocumentItem, Etape } from "./types";

function fmtMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " $";
}

export async function generateDossierPdf(
  dossier: Dossier,
  documents: DocumentItem[],
  etapes: Etape[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4 en points
  const pageHeight = 841.89;
  const margin = 50;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const accent = rgb(0.12, 0.31, 0.85);
  const muted = rgb(0.4, 0.44, 0.5);
  const dark = rgb(0.06, 0.09, 0.16);

  function ensureSpace(lines = 1, lineHeight = 16) {
    if (y - lines * lineHeight < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  function title(text: string, size = 20) {
    ensureSpace(2, size + 6);
    page.drawText(text, { x: margin, y, size, font: bold, color: dark });
    y -= size + 10;
  }

  function subtitle(text: string) {
    ensureSpace(1, 16);
    page.drawText(text, { x: margin, y, size: 11, font, color: muted });
    y -= 22;
  }

  function sectionHeader(text: string) {
    ensureSpace(2, 20);
    y -= 6;
    page.drawText(text.toUpperCase(), { x: margin, y, size: 11, font: bold, color: accent });
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.75,
      color: rgb(0.85, 0.87, 0.9),
    });
    y -= 16;
  }

  function row(label: string, value: string) {
    ensureSpace(1, 16);
    page.drawText(label, { x: margin, y, size: 10, font, color: muted });
    page.drawText(value || "—", { x: margin + 170, y, size: 10.5, font: bold, color: dark });
    y -= 17;
  }

  function paragraph(text: string) {
    ensureSpace(1, 14);
    page.drawText(text, { x: margin, y, size: 9.5, font, color: dark });
    y -= 15;
  }

  title(`Dossier ${dossier.reference}`);
  subtitle(`Généré le ${new Date().toLocaleDateString("fr-FR")} — Logistique & Transit`);

  sectionHeader("Informations générales");
  row("Type", dossier.type);
  row("Mode de transport", dossier.mode);
  row("Statut", dossier.statut);
  row("Priorité", dossier.priorite);
  row("Client", dossier.clientNoms.join(", "));
  row("Fournisseur", dossier.fournisseurNoms.join(", "));
  row("Transporteur", dossier.transporteurNoms.join(", "));
  row("Véhicule / conteneur", dossier.vehiculeNoms.join(", ") || dossier.numero);
  row("Chauffeur", dossier.chauffeurNoms.join(", "));
  row("Entrepôt", dossier.entrepotNoms.join(", "));

  sectionHeader("Transport");
  row("Origine", dossier.origine);
  row("Destination", dossier.destination);
  row("Date de départ", dossier.dateDepart ?? "—");
  row("ETA", dossier.eta ?? "—");
  row("Date de livraison", dossier.dateLivraison ?? "—");
  row("Bureau de douane", dossier.bureauDouane);

  sectionHeader("Marchandise");
  row("Poids", dossier.poids != null ? `${dossier.poids} kg` : "—");
  row("Volume", dossier.volume != null ? `${dossier.volume} m³` : "—");
  row("Valeur déclarée", fmtMoney(dossier.valeur));

  sectionHeader(`Documents (${documents.length})`);
  if (documents.length === 0) {
    paragraph("Aucun document enregistré.");
  } else {
    for (const doc of documents) {
      paragraph(`• ${doc.type} — ${doc.nom} [${doc.statut}]${doc.dateReception ? ` — reçu le ${doc.dateReception}` : ""}`);
    }
  }

  sectionHeader(`Historique de suivi (${etapes.length})`);
  if (etapes.length === 0) {
    paragraph("Aucune étape enregistrée.");
  } else {
    for (const e of etapes) {
      const when = e.dateHeure ? new Date(e.dateHeure).toLocaleString("fr-FR") : "—";
      paragraph(`• ${when} — ${e.titre}${e.localisation ? ` (${e.localisation})` : ""}`);
    }
  }

  return pdf.save();
}
