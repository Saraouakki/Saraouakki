import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { notion } from "@/lib/notion";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const session = await verifyCredentials(email, password);
  if (!session) {
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
    .catch(() => {});

  return response;
}
