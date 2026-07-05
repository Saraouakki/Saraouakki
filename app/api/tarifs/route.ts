import { NextRequest, NextResponse } from "next/server";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getSession } from "@/lib/server-session";
import { canWrite } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import { captureException } from "@/lib/monitoring";

const MODES = ["Route", "Maritime", "Aérien", "Ferroviaire"];
const DEVISES = ["MAD", "EUR", "USD"];

function numberOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : null;
  return n != null && !Number.isNaN(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Action réservée à l'équipe interne." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  const mode = typeof body?.mode === "string" ? body.mode : "";
  const origine = typeof body?.origine === "string" ? body.origine.trim() : "";
  const destination = typeof body?.destination === "string" ? body.destination.trim() : "";
  const devise = typeof body?.devise === "string" ? body.devise : "MAD";

  if (!nom || !MODES.includes(mode) || !origine || !destination) {
    return NextResponse.json(
      { error: "Nom, mode, origine et destination sont obligatoires." },
      { status: 400 }
    );
  }
  if (!DEVISES.includes(devise)) {
    return NextResponse.json({ error: "Devise invalide." }, { status: 400 });
  }

  try {
    const page = await notion.pages.create({
      parent: { data_source_id: DS.tarifs },
      properties: {
        Nom: { title: [{ text: { content: nom } }] },
        Mode: { select: { name: mode } },
        Origine: { rich_text: [{ text: { content: origine } }] },
        Destination: { rich_text: [{ text: { content: destination } }] },
        "Prix par kg": { number: numberOrNull(body?.prixParKg) },
        "Prix par CBM": { number: numberOrNull(body?.prixParCbm) },
        "Poids min facturable (kg)": { number: numberOrNull(body?.poidsMinFacturable) },
        "Devis minimum": { number: numberOrNull(body?.devisMinimum) },
        Devise: { select: { name: devise } },
        "Délai indicatif (jours)": { number: numberOrNull(body?.delaiJours) },
        Actif: { checkbox: body?.actif !== false },
      },
    });

    invalidateDataSource(DS.tarifs);
    logAudit({ action: "Grille tarifaire créée", utilisateur: session!.email, detail: nom });

    return NextResponse.json({ ok: true, id: page.id });
  } catch (error) {
    await captureException(error, { scope: "tarifs.create" });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
