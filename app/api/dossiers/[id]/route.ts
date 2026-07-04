import { NextRequest, NextResponse } from "next/server";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { DOSSIER_STATUTS } from "@/lib/types";
import { getSession } from "@/lib/server-session";
import { getDossier, getUserEmailsForClient } from "@/lib/data";
import { notifyDossierStatusChange } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { canWrite } from "@/lib/access";
import { captureException } from "@/lib/monitoring";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!canWrite(session)) {
    return NextResponse.json(
      { error: "Action réservée à l'équipe interne (compte non lecture-seule)." },
      { status: 403 }
    );
  }

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

    invalidateDataSource(DS.dossiers);

    logAudit({
      action: "Statut modifié",
      utilisateur: session!.email,
      detail: `Dossier ${id} → ${statut}`,
    });

    // Notification best-effort : ne doit jamais faire échouer la réponse de l'API.
    (async () => {
      try {
        const dossier = await getDossier(id);
        if (!dossier || dossier.clientIds.length === 0) return;
        const emails = (
          await Promise.all(dossier.clientIds.map((cid) => getUserEmailsForClient(cid)))
        ).flat();
        if (emails.length === 0) return;
        await notifyDossierStatusChange({
          reference: dossier.reference,
          statut,
          clientEmails: emails,
          appUrl: process.env.APP_URL || "http://localhost:3000",
          dossierPath: `/dossiers/${id}`,
        });
      } catch (notifyError) {
        captureException(notifyError, { scope: "dossiers.notifyStatusChange", dossierId: id });
      }
    })();

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureException(error, { scope: "dossiers.patchStatus", dossierId: id });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
