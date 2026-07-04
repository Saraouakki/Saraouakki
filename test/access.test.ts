import { describe, it, expect } from "vitest";
import { canWrite, isAdmin, canAccessDossier } from "@/lib/access";
import type { SessionData } from "@/lib/types";

function session(overrides: Partial<SessionData>): SessionData {
  return {
    userId: "u1",
    nom: "Test",
    email: "test@example.com",
    role: "Interne",
    permissionInterne: null,
    clientId: null,
    fournisseurId: null,
    ...overrides,
  };
}

describe("canWrite", () => {
  it("refuse un utilisateur non authentifié", () => {
    expect(canWrite(null)).toBe(false);
  });

  it("refuse un client, même sans restriction de permission", () => {
    expect(canWrite(session({ role: "Client" }))).toBe(false);
  });

  it("autorise un interne sans permission explicite (rétrocompatibilité)", () => {
    expect(canWrite(session({ role: "Interne", permissionInterne: null }))).toBe(true);
  });

  it("autorise un interne Admin", () => {
    expect(canWrite(session({ role: "Interne", permissionInterne: "Admin" }))).toBe(true);
  });

  it("refuse un interne en Lecture seule", () => {
    expect(canWrite(session({ role: "Interne", permissionInterne: "Lecture seule" }))).toBe(false);
  });
});

describe("isAdmin", () => {
  it("exige le rôle Interne ET la permission Admin explicite", () => {
    expect(isAdmin(session({ role: "Interne", permissionInterne: "Admin" }))).toBe(true);
    expect(isAdmin(session({ role: "Interne", permissionInterne: null }))).toBe(false);
    expect(isAdmin(session({ role: "Client" }))).toBe(false);
  });
});

describe("canAccessDossier", () => {
  const dossier = { clientIds: ["client-1"], fournisseurIds: ["fournisseur-1"] };

  it("l'équipe interne voit tous les dossiers", () => {
    expect(canAccessDossier(session({ role: "Interne" }), dossier)).toBe(true);
  });

  it("un client ne voit que ses propres dossiers", () => {
    expect(canAccessDossier(session({ role: "Client", clientId: "client-1" }), dossier)).toBe(true);
    expect(canAccessDossier(session({ role: "Client", clientId: "client-2" }), dossier)).toBe(false);
    expect(canAccessDossier(session({ role: "Client", clientId: null }), dossier)).toBe(false);
  });

  it("un fournisseur ne voit que les dossiers où il est source", () => {
    expect(
      canAccessDossier(session({ role: "Fournisseur", fournisseurId: "fournisseur-1" }), dossier)
    ).toBe(true);
    expect(
      canAccessDossier(session({ role: "Fournisseur", fournisseurId: "autre" }), dossier)
    ).toBe(false);
  });

  it("refuse un utilisateur non authentifié", () => {
    expect(canAccessDossier(null, dossier)).toBe(false);
  });
});
