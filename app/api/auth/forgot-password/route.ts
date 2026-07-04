import { NextRequest, NextResponse } from "next/server";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getUserByEmail } from "@/lib/data";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/reset-token";
import { sendEmail } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { captureException } from "@/lib/monitoring";

const GENERIC_MESSAGE =
  "Si un compte actif existe avec cet e-mail, un lien de réinitialisation vient d'être envoyé.";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email requis." }, { status: 400 });
  }

  const ip = clientIp(request);
  const limit = await rateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  try {
    // Toujours répondre pareil, que le compte existe ou non, pour ne pas permettre de
    // deviner quels e-mails sont enregistrés (énumération de comptes).
    const user = await getUserByEmail(email);
    if (user && user.statut === "Actif") {
      const { token, hash } = generateResetToken();
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

      await notion.pages.update({
        page_id: user.id,
        properties: {
          "Jeton reset (hash)": { rich_text: [{ text: { content: hash } }] },
          "Expiration reset": { date: { start: expires } },
        },
      });

      invalidateDataSource(DS.utilisateurs);

      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const link = `${appUrl}/reset-password?uid=${user.id}&token=${token}`;
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html: `<p>Bonjour ${user.nom},</p><p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valable 1 heure) :</p><p><a href="${link}">${link}</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
        text: `Réinitialisez votre mot de passe : ${link} (valable 1 heure)`,
      });
    }
  } catch (error) {
    // On journalise mais on renvoie quand même le message générique : ne jamais
    // révéler par la réponse si l'e-mail existe ou si une erreur interne a eu lieu.
    await captureException(error, { scope: "auth.forgotPassword", email });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
