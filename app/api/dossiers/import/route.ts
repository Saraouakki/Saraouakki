import { NextRequest, NextResponse } from "next/server";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getSession } from "@/lib/server-session";
import { canWrite } from "@/lib/access";
import { getClients, getTransporteurs, getFournisseurs } from "@/lib/data";
import { parseCsv } from "@/lib/csv";
import { DOSSIER_STATUTS, BUREAU_DOUANE_OPTIONS, REGIME_DOUANIER_OPTIONS } from "@/lib/types";
import { logAudit } from "@/lib/audit";
import { captureException } from "@/lib/monitoring";

const TYPES = ["Import", "Export", "Transit domestique", "Transbordement"];
const MODES = ["Route", "Maritime", "Aérien", "Ferroviaire", "Multimodal"];
const PRIORITES = ["Normale", "Urgente"];
const MAX_ROWS = 200;

// En-têtes attendus, dans le même ordre que l'export CSV — ainsi un transitaire peut
// exporter, éditer dans Excel, puis réimporter sans rien reformater.
const EXPECTED_HEADERS = [
  "référence",
  "client",
  "type",
  "mode",
  "statut",
  "transporteur",
  "fournisseur",
  "origine",
  "destination",
  "eta",
  "priorité",
  "bureau de douane",
  "régime douanier",
  "n° dum (badr)",
  "poids (kg)",
  "volume (m³)",
  "valeur marchandise",
];

function normalize(value: string | undefined): string {
  return (value ?? "").trim();
}

function matchOption(value: string, options: readonly string[]): string {
  const found = options.find((o) => o.toLowerCase() === value.toLowerCase());
  return found ?? "";
}

function toNumberOrNull(value: string): number | null {
  const n = Number(value.replace(",", "."));
  return value.trim() !== "" && !Number.isNaN(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Action réservée à l'équipe interne." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const csvText = typeof body?.csv === "string" ? body.csv : "";
  if (!csvText.trim()) {
    return NextResponse.json({ error: "Fichier CSV vide ou illisible." }, { status: 400 });
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return NextResponse.json(
      { error: "Le fichier doit contenir une ligne d'en-têtes et au moins une ligne de données." },
      { status: 400 }
    );
  }

  const headers = rows[0].map((h) => normalize(h).toLowerCase());
  const referenceIdx = headers.indexOf("référence");
  if (referenceIdx === -1) {
    return NextResponse.json(
      {
        error: `Colonne "Référence" introuvable. En-têtes attendues (ordre libre) : ${EXPECTED_HEADERS.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const dataRows = rows.slice(1).filter((r) => r.some((c) => normalize(c) !== ""));
  if (dataRows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne de données trouvée." }, { status: 400 });
  }
  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Trop de lignes (${dataRows.length}). Limite : ${MAX_ROWS} par import — scindez le fichier.` },
      { status: 400 }
    );
  }

  const idx = (name: string) => headers.indexOf(name);

  try {
    const [clients, transporteurs, fournisseurs] = await Promise.all([
      getClients(),
      getTransporteurs(),
      getFournisseurs(),
    ]);
    const clientByName = new Map(clients.map((c) => [c.nom.toLowerCase(), c.id]));
    const transporteurByName = new Map(transporteurs.map((t) => [t.nom.toLowerCase(), t.id]));
    const fournisseurByName = new Map(fournisseurs.map((f) => [f.nom.toLowerCase(), f.id]));

    let created = 0;
    const warnings: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const line = i + 2; // +1 pour l'en-tête, +1 pour l'index 1-based

      const reference = normalize(row[referenceIdx]);
      if (!reference) {
        warnings.push(`Ligne ${line} : référence manquante, ignorée.`);
        continue;
      }

      const clientName = idx("client") >= 0 ? normalize(row[idx("client")]) : "";
      const transporteurName = idx("transporteur") >= 0 ? normalize(row[idx("transporteur")]) : "";
      const fournisseurName = idx("fournisseur") >= 0 ? normalize(row[idx("fournisseur")]) : "";

      const clientId = clientName ? clientByName.get(clientName.toLowerCase()) : undefined;
      if (clientName && !clientId) warnings.push(`Ligne ${line} : client "${clientName}" introuvable, ignoré.`);

      const transporteurId = transporteurName
        ? transporteurByName.get(transporteurName.toLowerCase())
        : undefined;
      if (transporteurName && !transporteurId) {
        warnings.push(`Ligne ${line} : transporteur "${transporteurName}" introuvable, ignoré.`);
      }

      const fournisseurId = fournisseurName
        ? fournisseurByName.get(fournisseurName.toLowerCase())
        : undefined;
      if (fournisseurName && !fournisseurId) {
        warnings.push(`Ligne ${line} : fournisseur "${fournisseurName}" introuvable, ignoré.`);
      }

      const type = idx("type") >= 0 ? matchOption(normalize(row[idx("type")]), TYPES) : "";
      const mode = idx("mode") >= 0 ? matchOption(normalize(row[idx("mode")]), MODES) : "";
      const statut = idx("statut") >= 0 ? matchOption(normalize(row[idx("statut")]), DOSSIER_STATUTS) : "";
      const priorite = idx("priorité") >= 0 ? matchOption(normalize(row[idx("priorité")]), PRIORITES) : "";
      const bureauDouane =
        idx("bureau de douane") >= 0 ? matchOption(normalize(row[idx("bureau de douane")]), BUREAU_DOUANE_OPTIONS) : "";
      const regimeDouanier =
        idx("régime douanier") >= 0
          ? matchOption(normalize(row[idx("régime douanier")]), REGIME_DOUANIER_OPTIONS)
          : "";

      await notion.pages.create({
        parent: { data_source_id: DS.dossiers },
        properties: {
          Référence: { title: [{ text: { content: reference } }] },
          ...(type ? { Type: { select: { name: type } } } : {}),
          ...(mode ? { Mode: { select: { name: mode } } } : {}),
          Statut: { select: { name: statut || DOSSIER_STATUTS[0] } },
          ...(priorite ? { Priorité: { select: { name: priorite } } } : {}),
          ...(clientId ? { Client: { relation: [{ id: clientId }] } } : {}),
          ...(transporteurId ? { Transporteur: { relation: [{ id: transporteurId }] } } : {}),
          ...(fournisseurId ? { Fournisseur: { relation: [{ id: fournisseurId }] } } : {}),
          ...(idx("origine") >= 0
            ? { Origine: { rich_text: [{ text: { content: normalize(row[idx("origine")]) } }] } }
            : {}),
          ...(idx("destination") >= 0
            ? { Destination: { rich_text: [{ text: { content: normalize(row[idx("destination")]) } }] } }
            : {}),
          ...(bureauDouane ? { "Bureau de douane": { select: { name: bureauDouane } } } : {}),
          ...(regimeDouanier ? { "Régime douanier": { select: { name: regimeDouanier } } } : {}),
          ...(idx("n° dum (badr)") >= 0
            ? { "N° DUM (BADR)": { rich_text: [{ text: { content: normalize(row[idx("n° dum (badr)")]) } }] } }
            : {}),
          ...(idx("eta") >= 0 && normalize(row[idx("eta")])
            ? { ETA: { date: { start: normalize(row[idx("eta")]) } } }
            : {}),
          ...(idx("poids (kg)") >= 0
            ? { "Poids (kg)": { number: toNumberOrNull(row[idx("poids (kg)")]) } }
            : {}),
          ...(idx("volume (m³)") >= 0
            ? { "Volume (m³)": { number: toNumberOrNull(row[idx("volume (m³)")]) } }
            : {}),
          ...(idx("valeur marchandise") >= 0
            ? { "Valeur marchandise": { number: toNumberOrNull(row[idx("valeur marchandise")]) } }
            : {}),
        },
      });

      created += 1;
    }

    invalidateDataSource(DS.dossiers);
    logAudit({
      action: "Dossier créé",
      utilisateur: session!.email,
      detail: `Import CSV : ${created} dossier(s) créé(s), ${warnings.length} avertissement(s)`,
    });

    return NextResponse.json({ ok: true, created, warnings });
  } catch (error) {
    await captureException(error, { scope: "dossiers.import" });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
