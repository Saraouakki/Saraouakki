import { sendEmail } from "./mailer";

export async function notifySlack(message: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.log(`[slack] (non configuré) ${message}`);
    return;
  }
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch (error) {
    console.error("[slack] échec d'envoi du webhook:", error);
  }
}

interface DossierStatusChangeInput {
  reference: string;
  statut: string;
  clientEmails: string[];
  appUrl: string;
  dossierPath: string;
}

export async function notifyDossierStatusChange(input: DossierStatusChangeInput): Promise<void> {
  const link = `${input.appUrl}${input.dossierPath}`;
  const subject = `Dossier ${input.reference} — nouveau statut : ${input.statut}`;
  const html = `
    <p>Bonjour,</p>
    <p>Le statut de votre dossier <strong>${input.reference}</strong> vient de passer à :
    <strong>${input.statut}</strong>.</p>
    <p><a href="${link}">Voir le détail du dossier</a></p>
    <p>— Logistique &amp; Transit</p>
  `;

  await Promise.all(
    input.clientEmails.map((to) =>
      sendEmail({ to, subject, html, text: `${subject}\n${link}` })
    )
  );

  await notifySlack(`📦 Dossier *${input.reference}* → *${input.statut}* (${link})`);
}
