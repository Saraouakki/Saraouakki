import { NextRequest, NextResponse } from "next/server";
import { getTarifs, createDemandeDevis } from "@/lib/data";
import { computeQuote } from "@/lib/quote";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/mailer";
import { sendWhatsApp } from "@/lib/whatsapp";
import { captureException } from "@/lib/monitoring";

const MODES = ["Route", "Maritime", "Aérien", "Ferroviaire"];

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = await rateLimit(`devis:${ip}`, { limit: 10, windowMs: 60 * 60_000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const telephone = typeof body?.telephone === "string" ? body.telephone.trim() : "";
  const societe = typeof body?.societe === "string" ? body.societe.trim() : "";
  const mode = typeof body?.mode === "string" ? body.mode : "";
  const origine = typeof body?.origine === "string" ? body.origine.trim() : "";
  const destination = typeof body?.destination === "string" ? body.destination.trim() : "";
  const poids = typeof body?.poids === "number" ? body.poids : null;
  const volume = typeof body?.volume === "number" ? body.volume : null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!nom || (!email && !telephone)) {
    return NextResponse.json(
      { error: "Indiquez votre nom et au moins un e-mail ou un téléphone." },
      { status: 400 }
    );
  }
  if (!MODES.includes(mode) || !origine || !destination) {
    return NextResponse.json({ error: "Trajet incomplet (mode, origine, destination)." }, { status: 400 });
  }

  try {
    const tarifs = await getTarifs();
    const quote = computeQuote(tarifs, { mode, origine, destination, poids, volume });

    const id = await createDemandeDevis({
      nom,
      email,
      telephone,
      societe,
      mode,
      origine,
      destination,
      poids,
      volume,
      estimation: quote.montant,
      message,
    });

    logAudit({
      action: "Demande de devis reçue",
      utilisateur: email || telephone || nom,
      detail: `${mode} ${origine} → ${destination}${quote.montant != null ? ` — estimation ${quote.montant} ${quote.devise}` : " — sur devis"}`,
    });

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const adminWhatsapp = process.env.ADMIN_WHATSAPP_NUMBER;
    const summary = `Nouvelle demande de devis : ${nom}${societe ? ` (${societe})` : ""} — ${mode} ${origine} → ${destination}${quote.montant != null ? `, estimation ${quote.montant} ${quote.devise}` : ", sur devis"}. Contact : ${email || "—"} ${telephone || ""}`;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Nouvelle demande de devis — ${nom}`,
        html: `<p>${summary}</p>${message ? `<p>Message : ${message}</p>` : ""}`,
        text: summary,
      });
    }
    if (adminWhatsapp) {
      await sendWhatsApp(adminWhatsapp, summary);
    }

    return NextResponse.json({ ok: true, id, estimation: quote.montant, devise: quote.devise });
  } catch (error) {
    await captureException(error, { scope: "devis.create" });
    const message2 = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message2 }, { status: 500 });
  }
}
