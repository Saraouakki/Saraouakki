import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ensureParent, workspace, type Workspace } from "../core/paths.js";

export type InstinctKind =
  | "command"
  | "recovery"
  | "hotspot"
  | "correction"
  | "sequence";

export type InstinctStatus = "proposed" | "active" | "promoted" | "rejected";

export interface Instinct {
  id: string;
  kind: InstinctKind;
  /** One imperative sentence — this is what gets injected into a session. */
  rule: string;
  evidence: string[];
  sessions: string[];
  support: number;
  status: InstinctStatus;
  createdAt: string;
  updatedAt: string;
}

export function instinctId(kind: InstinctKind, rule: string): string {
  return createHash("sha1").update(`${kind}|${rule.toLowerCase()}`).digest("hex").slice(0, 10);
}

export class InstinctStore {
  private readonly ws: Workspace;

  constructor(ws: Workspace = workspace()) {
    this.ws = ws;
  }

  all(): Instinct[] {
    if (!existsSync(this.ws.instinctsFile)) return [];
    try {
      const parsed = JSON.parse(readFileSync(this.ws.instinctsFile, "utf8")) as unknown;
      return Array.isArray(parsed) ? (parsed as Instinct[]) : [];
    } catch {
      return [];
    }
  }

  save(instincts: Instinct[]): void {
    writeFileSync(
      ensureParent(this.ws.instinctsFile),
      `${JSON.stringify(instincts, null, 2)}\n`,
      "utf8",
    );
  }

  /** Merge freshly observed instincts into the store, accumulating evidence. */
  merge(observed: Instinct[]): Instinct[] {
    const byId = new Map(this.all().map((item) => [item.id, item]));
    for (const candidate of observed) {
      const existing = byId.get(candidate.id);
      if (!existing) {
        byId.set(candidate.id, candidate);
        continue;
      }
      existing.evidence = [...new Set([...existing.evidence, ...candidate.evidence])].slice(0, 20);
      existing.sessions = [...new Set([...existing.sessions, ...candidate.sessions])];
      existing.support = existing.evidence.length;
      existing.updatedAt = candidate.updatedAt;
      if (existing.status === "rejected") continue;
      existing.status = existing.status === "promoted" ? "promoted" : existing.status;
    }
    const merged = [...byId.values()].sort((a, b) => b.support - a.support);
    this.save(merged);
    return merged;
  }
}
