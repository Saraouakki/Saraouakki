import { describe, it, expect } from "vitest";
import { computeQuote, findBestTarif } from "@/lib/quote";
import type { Tarif } from "@/lib/types";

function tarif(overrides: Partial<Tarif>): Tarif {
  return {
    id: "t1",
    nom: "Test",
    mode: "Route",
    origine: "Maroc",
    destination: "France",
    prixParKg: 10,
    prixParCbm: 500,
    poidsMinFacturable: 50,
    devisMinimum: 300,
    devise: "MAD",
    delaiJours: 5,
    actif: true,
    ...overrides,
  };
}

const input = {
  mode: "Route",
  origine: "Maroc",
  destination: "France",
  poids: 100,
  volume: 1,
};

describe("findBestTarif", () => {
  it("ignore les grilles d'un autre mode", () => {
    const tarifs = [tarif({ mode: "Maritime" })];
    expect(findBestTarif(tarifs, input)).toBeNull();
  });

  it("ignore les grilles inactives", () => {
    const tarifs = [tarif({ actif: false })];
    expect(findBestTarif(tarifs, input)).toBeNull();
  });

  it("ignore une destination qui ne correspond pas du tout", () => {
    const tarifs = [tarif({ destination: "Espagne" })];
    expect(findBestTarif(tarifs, input)).toBeNull();
  });

  it("préfère une correspondance exacte à une correspondance générique 'International'", () => {
    const generic = tarif({ id: "generic", destination: "International" });
    const exact = tarif({ id: "exact", destination: "France" });
    const result = findBestTarif([generic, exact], input);
    expect(result?.id).toBe("exact");
  });

  it("accepte 'International' comme repli quand rien de plus précis n'existe", () => {
    const generic = tarif({ id: "generic", destination: "International" });
    const result = findBestTarif([generic], input);
    expect(result?.id).toBe("generic");
  });
});

describe("computeQuote", () => {
  it("retourne null si aucune grille ne correspond (sur devis)", () => {
    const result = computeQuote([tarif({ mode: "Maritime" })], input);
    expect(result.tarif).toBeNull();
    expect(result.montant).toBeNull();
  });

  it("calcule au poids quand c'est le plus élevé", () => {
    // 100 kg * 10 MAD/kg = 1000, vs 1 CBM * 500 = 500, vs devis min 300 -> 1000
    const result = computeQuote([tarif({})], input);
    expect(result.montant).toBe(1000);
    expect(result.devise).toBe("MAD");
    expect(result.delaiJours).toBe(5);
  });

  it("calcule au volume quand c'est le plus élevé", () => {
    const result = computeQuote([tarif({ prixParCbm: 5000 })], { ...input, volume: 1 });
    expect(result.montant).toBe(5000);
  });

  it("applique le devis minimum pour une très petite expédition", () => {
    const result = computeQuote([tarif({})], { ...input, poids: 1, volume: 0 });
    // poids facturable = max(1, 50) = 50 -> 50*10 = 500, vs devis min 300 -> 500
    expect(result.montant).toBe(500);
  });

  it("respecte le poids minimum facturable", () => {
    const result = computeQuote([tarif({ poidsMinFacturable: 200, devisMinimum: 0 })], {
      ...input,
      poids: 10,
      volume: 0,
    });
    // poids facturable = max(10, 200) = 200 -> 200*10 = 2000
    expect(result.montant).toBe(2000);
  });
});
