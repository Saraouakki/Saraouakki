import { NextRequest, NextResponse } from "next/server";
import { notion } from "@/lib/notion";
import { DOSSIER_STATUTS } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const statut = body?.statut;

  if (typeof statut !== "string" || !DOSSIER_STATUTS.includes(statut as (typeof DOSSIER_STATUTS)[number])) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        Statut: { select: { name: statut } },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
