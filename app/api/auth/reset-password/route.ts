import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getUserById } from "@/lib/data";
import { hashResetToken, safeCompareHash } from "@/lib/reset-token";
import { logAudit } from "@/lib/audit";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { captureException } from "@/lib/monitoring";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const uid = typeof body?.uid === "string" ? body.uid : "";
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!uid || !token || !password) {
    return NextResponse.json({ error: "Requête incomplète." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 }
    );
  }

  const ip = clientIp(request);
  const limit = await rateLimit(`reset-password:${ip}`, { limit: 10, windowMs: 15 * 60_000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  try {
    const user = await getUserById(uid);
    if (!user || !user.resetTokenHash || !user.resetExpires) {
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
    }

    if (new Date(user.resetExpires).getTime() < Date.now()) {
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
    }

    const providedHash = hashResetToken(token);
    if (!safeCompareHash(providedHash, user.resetTokenHash)) {
      return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await notion.pages.update({
      page_id: user.id,
      properties: {
        "Mot de passe (hash)": { rich_text: [{ text: { content: passwordHash } }] },
        "Jeton reset (hash)": { rich_text: [] },
        "Expiration reset": { date: null },
      },
    });

    invalidateDataSource(DS.utilisateurs);

    logAudit({ action: "Mot de passe réinitialisé", utilisateur: user.email });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureException(error, { scope: "auth.resetPassword", uid });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
