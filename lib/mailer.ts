interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoi d'e-mail à trois niveaux de repli, du plus simple au plus avancé :
 *  1. Aucune configuration -> l'e-mail est journalisé en console (mode développement).
 *  2. RESEND_API_KEY définie -> envoi via l'API Resend (https://resend.com).
 *  3. SMTP_HOST défini -> envoi via un serveur SMTP classique (nodemailer).
 *
 * Un échec d'envoi ne doit jamais faire planter le flux applicatif (inscription,
 * changement de statut...) : les erreurs sont capturées et journalisées.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; via: string }> {
  const from = process.env.SMTP_FROM || "Logistique & Transit <no-reply@example.com>";

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: input.to,
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });
      if (!res.ok) throw new Error(`Resend a répondu ${res.status}`);
      return { sent: true, via: "resend" };
    }

    if (process.env.SMTP_HOST) {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      });
      await transport.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      return { sent: true, via: "smtp" };
    }
  } catch (error) {
    console.error("[mailer] échec d'envoi, l'e-mail est journalisé à la place:", error);
  }

  // Repli dev : aucun fournisseur configuré (ou envoi en échec) — on journalise pour
  // que le flux (mot de passe oublié, notification...) reste testable localement.
  console.log(`[mailer] (mode journal) À: ${input.to} — Sujet: ${input.subject}\n${input.text ?? input.html}`);
  return { sent: false, via: "console" };
}
