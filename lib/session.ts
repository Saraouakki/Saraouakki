import { SignJWT, jwtVerify } from "jose";
import type { SessionData } from "./types";

export const SESSION_COOKIE = "ltp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Variable d'environnement manquante: AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(data: SessionData): Promise<string> {
  return new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      userId: payload.userId as string,
      nom: payload.nom as string,
      email: payload.email as string,
      role: payload.role as SessionData["role"],
      clientId: (payload.clientId as string | null) ?? null,
      fournisseurId: (payload.fournisseurId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
