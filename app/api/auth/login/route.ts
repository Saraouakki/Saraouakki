import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const ip = clientIp(request);

  // Deux garde-fous : un plafond large par IP (anti-balayage d'e-mails), un plafond
  // serré par IP+e-mail (anti brute-force sur un compte précis).
  const ipLimit = await rateLimit(`login:ip:${ip}`, { limit: 30, windowMs: 10 * 60_000 });
  const accountLimit = await rateLimit(`login:acct:${ip}:${email.toLowerCase()}`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });

  if (!ipLimit.success || !accountLimit.success) {
    logAudit({
      action: "Échec connexion",
      utilisateur: email,
      detail: "Trop de tentatives, requête bloquée par le rate-limiter.",
    });
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const session = await verifyCredentials(email, password);
  if (!session) {
    logAudit({ action: "Échec connexion", utilisateur: email, detail: `Depuis ${ip}` });
    return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
  }

  const token = await signSession(session);
  const response = NextResponse.json({ ok: true, role: session.role });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  notion.pages
    .update({
      page_id: session.userId,
      properties: {
        "Dernière connexion": {
          date: { start: new Date().toISOString() },
        },
      },
    })
    .then(() => invalidateDataSource(DS.utilisateurs))
    .catch(() => {});

  logAudit({ action: "Connexion", utilisateur: session.email, detail: `Rôle ${session.role} depuis ${ip}` });

  return response;
}
