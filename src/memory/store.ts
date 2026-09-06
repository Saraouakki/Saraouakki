import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ensureParent, workspace, type Workspace } from "../core/paths.js";

export type MemoryKind =
  | "decision"
  | "convention"
  | "gotcha"
  | "fact"
  | "preference"
  | "todo";

export const MEMORY_KINDS: MemoryKind[] = [
  "decision",
  "convention",
  "gotcha",
  "fact",
  "preference",
  "todo",
];

export interface MemoryEntry {
  id: string;
  ts: string;
  kind: MemoryKind;
  /** Free-form scope: a path, a package name, or "global". */
  scope: string;
  text: string;
  tags: string[];
  session?: string;
  /** 0..1 — decays with age unless the entry is reinforced. */
  confidence: number;
  /** How many times the same fact was observed again. */
  hits: number;
}

export interface MemoryInput {
  kind: MemoryKind;
  text: string;
  scope?: string;
  tags?: string[];
  session?: string;
  confidence?: number;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is",
  "are", "was", "were", "be", "it", "this", "that", "we", "you", "our",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_.@/-]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function fingerprint(kind: string, scope: string, text: string): string {
  const normalized = tokenize(text).sort().join(" ");
  return createHash("sha1").update(`${kind}|${scope}|${normalized}`).digest("hex").slice(0, 12);
}

export class MemoryStore {
  private readonly ws: Workspace;
  private entries: MemoryEntry[] | null = null;

  constructor(ws: Workspace = workspace()) {
    this.ws = ws;
  }

  /** Every entry, oldest first, with duplicates collapsed onto their first id. */
  all(): MemoryEntry[] {
    if (this.entries) return this.entries;
    const merged = new Map<string, MemoryEntry>();
    if (existsSync(this.ws.memoryFile)) {
      const raw = readFileSync(this.ws.memoryFile, "utf8");
      for (const line of raw.split("\n")) {
        if (line.trim() === "") continue;
        let entry: MemoryEntry;
        try {
          entry = JSON.parse(line) as MemoryEntry;
        } catch {
          continue; // a truncated write must not take the whole store down
        }
        const existing = merged.get(entry.id);
        if (existing) {
          existing.hits += entry.hits;
          existing.ts = entry.ts;
          existing.confidence = Math.min(1, Math.max(existing.confidence, entry.confidence));
          existing.tags = [...new Set([...existing.tags, ...entry.tags])];
        } else {
          merged.set(entry.id, { ...entry });
        }
      }
    }
    this.entries = [...merged.values()];
    return this.entries;
  }

  /**
   * Record a fact. Re-recording the same fact reinforces it (hits + confidence)
   * instead of growing the store — that is what makes recall stay sharp.
   */
  remember(input: MemoryInput): MemoryEntry {
    const scope = input.scope?.trim() || "global";
    const entry: MemoryEntry = {
      id: fingerprint(input.kind, scope, input.text),
      ts: new Date().toISOString(),
      kind: input.kind,
      scope,
      text: input.text.trim(),
      tags: [...new Set((input.tags ?? []).map((t) => t.toLowerCase()))],
      session: input.session,
      confidence: clamp(input.confidence ?? 0.6),
      hits: 1,
    };
    const known = this.all().find((item) => item.id === entry.id);
    if (known) {
      entry.hits = known.hits + 1;
      entry.confidence = clamp(Math.max(known.confidence, entry.confidence) + 0.1);
      entry.tags = [...new Set([...known.tags, ...entry.tags])];
    }
    appendFileSync(ensureParent(this.ws.memoryFile), `${JSON.stringify(entry)}\n`, "utf8");
    this.entries = null;
    return entry;
  }

  /** Drop entries whose id or text matches; returns how many were removed. */
  forget(needle: string): number {
    const remaining = this.all().filter(
      (entry) => entry.id !== needle && !entry.text.toLowerCase().includes(needle.toLowerCase()),
    );
    const removed = this.all().length - remaining.length;
    this.write(remaining);
    return removed;
  }

  /** Rewrite the log with duplicates collapsed and stale entries dropped. */
  compact(now: Date = new Date(), maxAgeDays = 180): number {
    const cutoff = now.getTime() - maxAgeDays * 86_400_000;
    const kept = this.all().filter((entry) => {
      if (entry.hits > 1) return true;
      return Date.parse(entry.ts) >= cutoff;
    });
    const removed = this.all().length - kept.length;
    this.write(kept);
    return removed;
  }

  private write(entries: MemoryEntry[]): void {
    const body = entries.map((entry) => JSON.stringify(entry)).join("\n");
    writeFileSync(ensureParent(this.ws.memoryFile), body === "" ? "" : `${body}\n`, "utf8");
    this.entries = null;
  }

  /** Keyword search ranked by term overlap, reinforcement and recency. */
  search(query: string, limit = 10, now: Date = new Date()): MemoryEntry[] {
    const terms = tokenize(query);
    const scored = this.all().map((entry) => ({ entry, score: score(entry, terms, now) }));
    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.entry);
  }

  /** The highest-value entries regardless of query, for session bootstrap. */
  top(limit = 20, now: Date = new Date()): MemoryEntry[] {
    return [...this.all()]
      .sort((a, b) => score(b, [], now) - score(a, [], now))
      .slice(0, limit);
  }
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function score(entry: MemoryEntry, terms: string[], now: Date): number {
  const ageDays = Math.max(0, (now.getTime() - Date.parse(entry.ts)) / 86_400_000);
  const recency = 1 / (1 + ageDays / 30);
  const reinforcement = Math.log2(entry.hits + 1);
  const base = entry.confidence * (0.5 + 0.5 * recency) + 0.25 * reinforcement;
  if (terms.length === 0) return base;

  const haystack = new Set([...tokenize(entry.text), ...entry.tags, ...tokenize(entry.scope)]);
  let overlap = 0;
  for (const term of terms) {
    if (haystack.has(term)) overlap += 1;
    else if ([...haystack].some((token) => token.includes(term))) overlap += 0.5;
  }
  if (overlap === 0) return 0;
  return base * (1 + overlap / terms.length);
}
