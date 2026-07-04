import { NextRequest, NextResponse } from "next/server";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getSession } from "@/lib/server-session";
import { getUserById } from "@/lib/data";
import { canWrite } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/mailer";
import { captureException } from "@/lib/monitoring";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!canWrite(session)) {
    return NextResponse.json({ error: "Action réservée à l'équipe interne." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action !== "activer" && action !== "refuser") {
    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  }

  try {
    const account = await getUserById(id);
    if (!account) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }

    const nextStatut = action === "activer" ? "Actif" : "Inactif";

    await notion.pages.update({
      page_id: id,
      properties: { Statut: { select: { name: nextStatut } } },
    });

    invalidateDataSource(DS.utilisateurs);

    logAudit({
      action: action === "activer" ? "Compte activé" : "Compte refusé",
      utilisateur: session!.email,
      detail: `${account.nom} (${account.email})`,
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    if (action === "activer") {
      await sendEmail({
        to: account.email,
        subject: "Votre compte est activé",
        html: `<p>Bonjour ${account.nom},</p><p>Votre compte Logistique &amp; Transit est maintenant actif. Vous pouvez vous connecter : <a href="${appUrl}/login">${appUrl}/login</a></p>`,
        text: `Votre compte est activé. Connectez-vous sur ${appUrl}/login`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureException(error, { scope: "comptes.patch", accountId: id });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
