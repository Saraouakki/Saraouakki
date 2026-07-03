import bcrypt from "bcryptjs";
import { getUserByEmail } from "./data";
import type { SessionData } from "./types";

export async function verifyCredentials(
  email: string,
  password: string
): Promise<SessionData | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (user.statut !== "Actif") return null;
  if (!user.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    userId: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role,
    clientId: user.clientId,
    fournisseurId: user.fournisseurId,
  };
}
