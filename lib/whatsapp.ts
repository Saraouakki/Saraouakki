/**
 * Envoi de notifications WhatsApp — canal de communication dominant chez les
 * transitaires/transporteurs marocains, bien plus que l'e-mail. Utilise l'API Twilio
 * WhatsApp (https://www.twilio.com/whatsapp) via un simple appel REST, sans SDK.
 *
 * Sans TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM configurés, le message
 * est journalisé en console — le flux applicatif ne casse jamais faute de configuration.
 */
function toWhatsappAddress(phone: string): string {
  const trimmed = phone.trim();
  return trimmed.startsWith("whatsapp:") ? trimmed : `whatsapp:${trimmed}`;
}

export async function sendWhatsApp(to: string, message: string): Promise<{ sent: boolean }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from || !to) {
    console.log(`[whatsapp] (non configuré) À: ${to} — ${message}`);
    return { sent: false };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: toWhatsappAddress(from),
        To: toWhatsappAddress(to),
        Body: message,
      }),
    });
    if (!res.ok) throw new Error(`Twilio a répondu ${res.status}`);
    return { sent: true };
  } catch (error) {
    console.error("[whatsapp] échec d'envoi, message journalisé à la place:", error);
    console.log(`[whatsapp] (échec envoi) À: ${to} — ${message}`);
    return { sent: false };
  }
}
