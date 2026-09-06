import type { MemoryEntry } from "./store.js";

export interface ContextPackOptions {
  /** Rough budget in characters; ~4 chars per token is a fine approximation. */
  budget?: number;
  title?: string;
  query?: string;
  /** 1 for a standalone document, 2 when embedded under another heading. */
  headingLevel?: 1 | 2;
}

const KIND_ORDER = ["decision", "convention", "gotcha", "preference", "fact", "todo"];

/**
 * Render memories as a markdown block an agent can be primed with at the start
 * of a session. Ordering is by kind then score, and the budget is enforced by
 * dropping the weakest entries — never by truncating one mid-sentence.
 */
export function buildContextPack(entries: MemoryEntry[], options: ContextPackOptions = {}): string {
  const budget = options.budget ?? 4000;
  const title = options.title ?? "ECC memory";
  const h1 = "#".repeat(options.headingLevel ?? 1);
  const h2 = `${h1}#`;

  const grouped = new Map<string, MemoryEntry[]>();
  for (const entry of entries) {
    const bucket = grouped.get(entry.kind) ?? [];
    bucket.push(entry);
    grouped.set(entry.kind, bucket);
  }

  const header = options.query
    ? `${h1} ${title} — recall for "${options.query}"`
    : `${h1} ${title}`;
  const lines: string[] = [header, ""];
  let used = header.length + 1;

  for (const kind of KIND_ORDER) {
    const bucket = grouped.get(kind);
    if (!bucket || bucket.length === 0) continue;
    const heading = `${h2} ${kind}`;
    const pending: string[] = [heading, ""];
    let pendingSize = heading.length + 2;
    for (const entry of bucket) {
      const scope = entry.scope === "global" ? "" : ` _(${entry.scope})_`;
      const line = `- ${entry.text}${scope}`;
      if (used + pendingSize + line.length > budget) break;
      pending.push(line);
      pendingSize += line.length + 1;
    }
    if (pending.length <= 2) continue;
    pending.push("");
    lines.push(...pending);
    used += pendingSize + 1;
  }

  if (lines.length === 2) return `${header}\n\n_No memories recorded yet._\n`;
  return `${lines.join("\n").trimEnd()}\n`;
}
