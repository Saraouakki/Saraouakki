import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SessionData } from "./types";

export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
