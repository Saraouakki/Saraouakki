import { NextRequest, NextResponse } from "next/server";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getSession } from "@/lib/server-session";
import { getDossier } from "@/lib/data";
import { canAccessDossier } from "@/lib/access";
import { DOCUMENT_TYPES } from "@/lib/types";
import { logAudit } from "@/lib/audit";
import { captureException } from "@/lib/monitoring";

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo, limite raisonnable pour un upload à part unique

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const dossierId = form.get("dossierId");
  const type = form.get("type");
  const file = form.get("file");

  if (typeof dossierId !== "string" || !dossierId) {
    return NextResponse.json({ error: "Dossier manquant." }, { status: 400 });
  }
  if (typeof type !== "string" || !DOCUMENT_TYPES.includes(type as (typeof DOCUMENT_TYPES)[number])) {
    return NextResponse.json({ error: "Type de document invalide." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (20 Mo maximum)." }, { status: 400 });
  }

  try {
    const dossier = await getDossier(dossierId);
    if (!dossier || !canAccessDossier(session, dossier)) {
      return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
    }

    const upload = await notion.fileUploads.create({
      mode: "single_part",
      filename: file.name,
      content_type: file.type || "application/octet-stream",
    });

    await notion.fileUploads.send({
      file_upload_id: upload.id,
      file: { data: file, filename: file.name },
    });

    const page = await notion.pages.create({
      parent: { data_source_id: DS.documents },
      properties: {
        Nom: { title: [{ text: { content: file.name } }] },
        Type: { select: { name: type } },
        Dossier: { relation: [{ id: dossierId }] },
        Statut: { select: { name: "Reçu" } },
        "Date de réception": { date: { start: new Date().toISOString() } },
        Fichier: { files: [{ file_upload: { id: upload.id }, name: file.name }] },
      },
    });

    invalidateDataSource(DS.documents);

    logAudit({
      action: "Document ajouté",
      utilisateur: session.email,
      detail: `${file.name} sur le dossier ${dossier.reference}`,
    });

    return NextResponse.json({ ok: true, id: page.id });
  } catch (error) {
    await captureException(error, { scope: "documents.upload", dossierId });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
