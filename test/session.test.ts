import { describe, it, expect } from "vitest";
import { signSession, verifySessionToken } from "@/lib/session";
import type { SessionData } from "@/lib/types";

const sample: SessionData = {
  userId: "u1",
  nom: "Sara Ouakki",
  email: "srouakki@gmail.com",
  role: "Interne",
  permissionInterne: "Admin",
  clientId: null,
  fournisseurId: null,
};

describe("session JWT", () => {
  it("signe puis vérifie un aller-retour fidèle", async () => {
    const token = await signSession(sample);
    const decoded = await verifySessionToken(token);
    expect(decoded).toEqual(sample);
  });

  it("rejette un jeton invalide", async () => {
    const decoded = await verifySessionToken("ceci-n-est-pas-un-jwt");
    expect(decoded).toBeNull();
  });

  it("rejette un jeton altéré (signature invalide)", async () => {
    const token = await signSession(sample);
    const tampered = token.slice(0, -4) + "abcd";
    const decoded = await verifySessionToken(tampered);
    expect(decoded).toBeNull();
  });
});
