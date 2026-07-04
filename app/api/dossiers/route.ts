import { NextRequest, NextResponse } from "next/server";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getSession } from "@/lib/server-session";
import { canWrite } from "@/lib/access";
import { DOSSIER_STATUTS } from "@/lib/types";
import { logAudit } from "@/lib/audit";
import { captureException } from "@/lib/monitoring";

const TYPES = ["Import", "Export", "Transit domestique", "Transbordement"];
const MODES = ["Route", "Maritime", "Aérien", "Ferroviaire", "Multimodal"];
const PRIORITES = ["Normale", "Urgente"];

function optionalRelation(id: unknown) {
  return typeof id === "string" && id ? { relation: [{ id }] } : { relation: [] };
}

function optionalDate(value: unknown) {
  return typeof value === "string" && value ? { date: { start: value } } : { date: null };
}

function optionalNumber(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : null;
  return { number: n != null && !Number.isNaN(n) ? n : null };
}

function text(value: unknown) {
  const s = typeof value === "string" ? value : "";
  return { rich_text: s ? [{ text: { content: s } }] : [] };
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Action réservée à l'équipe interne." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  const type = typeof body?.type === "string" ? body.type : "";
  const mode = typeof body?.mode === "string" ? body.mode : "";
  const priorite = typeof body?.priorite === "string" ? body.priorite : "Normale";

  if (!reference) {
    return NextResponse.json({ error: "La référence est obligatoire." }, { status: 400 });
  }
  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Type de dossier invalide." }, { status: 400 });
  }
  if (!MODES.includes(mode)) {
    return NextResponse.json({ error: "Mode de transport invalide." }, { status: 400 });
  }
  if (!PRIORITES.includes(priorite)) {
    return NextResponse.json({ error: "Priorité invalide." }, { status: 400 });
  }

  try {
    const page = await notion.pages.create({
      parent: { data_source_id: DS.dossiers },
      properties: {
        Référence: { title: [{ text: { content: reference } }] },
        Type: { select: { name: type } },
        Mode: { select: { name: mode } },
        Statut: { select: { name: DOSSIER_STATUTS[0] } },
        Priorité: { select: { name: priorite } },
        Client: optionalRelation(body?.clientId),
        Transporteur: optionalRelation(body?.transporteurId),
        Véhicule: optionalRelation(body?.vehiculeId),
        Chauffeur: optionalRelation(body?.chauffeurId),
        Entrepôt: optionalRelation(body?.entrepotId),
        Fournisseur: optionalRelation(body?.fournisseurId),
        Origine: text(body?.origine),
        Destination: text(body?.destination),
        "Bureau de douane": text(body?.bureauDouane),
        "N° conteneur/plaque": text(body?.numero),
        "Date de départ": optionalDate(body?.dateDepart),
        ETA: optionalDate(body?.eta),
        "Poids (kg)": optionalNumber(body?.poids),
        "Volume (m³)": optionalNumber(body?.volume),
        "Valeur marchandise": optionalNumber(body?.valeur),
      },
    });

    invalidateDataSource(DS.dossiers);

    logAudit({
      action: "Dossier créé",
      utilisateur: session!.email,
      detail: `${reference} (${type} / ${mode})`,
    });

    return NextResponse.json({ ok: true, id: page.id });
  } catch (error) {
    await captureException(error, { scope: "dossiers.create" });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
