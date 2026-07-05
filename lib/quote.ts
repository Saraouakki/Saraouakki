import type { Tarif } from "./types";

export interface QuoteInput {
  mode: string;
  origine: string;
  destination: string;
  poids: number | null;
  volume: number | null;
}

export interface QuoteResult {
  tarif: Tarif | null;
  montant: number | null;
  devise: string | null;
  delaiJours: number | null;
  poidsFacturable: number | null;
}

/**
 * Score de correspondance entre une grille tarifaire et une demande. -1 = disqualifiée
 * (le mode ou la destination ne correspondent pas du tout). Plus le score est élevé,
 * plus la grille est spécifique à la demande (un match exact bat un "International"
 * générique, qui bat lui-même l'absence de correspondance).
 */
function matchScore(tarif: Tarif, input: QuoteInput): number {
  let score = 0;

  const dest = input.destination.trim().toLowerCase();
  const tDest = tarif.destination.trim().toLowerCase();
  if (dest && tDest) {
    if (dest === tDest) score += 10;
    else if (dest.includes(tDest) || tDest.includes(dest)) score += 5;
    else if (tDest === "international") score += 1;
    else return -1;
  }

  const orig = input.origine.trim().toLowerCase();
  const tOrig = tarif.origine.trim().toLowerCase();
  if (orig && tOrig) {
    if (orig === tOrig) score += 10;
    else if (orig.includes(tOrig) || tOrig.includes(orig)) score += 5;
    else return -1;
  }

  return score;
}

export function findBestTarif(tarifs: Tarif[], input: QuoteInput): Tarif | null {
  const candidates = tarifs.filter((t) => t.actif && t.mode === input.mode);
  let best: Tarif | null = null;
  let bestScore = -1;
  for (const tarif of candidates) {
    const score = matchScore(tarif, input);
    if (score > bestScore) {
      bestScore = score;
      best = tarif;
    }
  }
  return bestScore >= 0 ? best : null;
}

/**
 * Calcule une estimation à partir de la meilleure grille tarifaire correspondante.
 * Le poids facturable respecte le poids minimum de la grille (pratique standard du
 * fret : en dessous d'un certain poids, on facture quand même le minimum). Le montant
 * final est le plus élevé entre le calcul au poids, au volume, et le devis minimum —
 * jamais une moyenne, pour ne jamais sous-facturer une grille.
 */
export function computeQuote(tarifs: Tarif[], input: QuoteInput): QuoteResult {
  const tarif = findBestTarif(tarifs, input);
  if (!tarif) {
    return { tarif: null, montant: null, devise: null, delaiJours: null, poidsFacturable: null };
  }

  const poidsFacturable = Math.max(input.poids ?? 0, tarif.poidsMinFacturable ?? 0);
  const montantParPoids = poidsFacturable * (tarif.prixParKg ?? 0);
  const montantParVolume = (input.volume ?? 0) * (tarif.prixParCbm ?? 0);
  const montant = Math.max(montantParPoids, montantParVolume, tarif.devisMinimum ?? 0);

  return {
    tarif,
    montant: Math.round(montant * 100) / 100,
    devise: tarif.devise,
    delaiJours: tarif.delaiJours,
    poidsFacturable,
  };
}
