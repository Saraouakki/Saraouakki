import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { type Instinct, type InstinctKind, instinctId } from "./instincts.js";

/**
 * A single observable moment in an agent session. ECC does not require a
 * specific agent runtime: any harness that can append JSONL of this shape
 * feeds the learning loop.
 */
export interface SessionEvent {
  session: string;
  ts?: string;
  type: "tool" | "error" | "correction" | "edit" | "note";
  /** For tool/error events: the command or tool invocation. */
  command?: string;
  tool?: string;
  exitCode?: number;
  file?: string;
  text?: string;
}

export function readSessionEvents(path: string): SessionEvent[] {
  if (!existsSync(path)) return [];
  const files = statSync(path).isDirectory()
    ? readdirSync(path)
        .filter((name) => extname(name) === ".jsonl")
        .sort()
        .map((name) => join(path, name))
    : [path];

  const events: SessionEvent[] = [];
  for (const file of files) {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      try {
        const parsed = JSON.parse(line) as SessionEvent;
        if (parsed && typeof parsed.type === "string") events.push(parsed);
      } catch {
        continue;
      }
    }
  }
  return events;
}

/**
 * Strip volatile arguments so `npm test -- foo.ts` and `npm test -- bar.ts`
 * count as the same habit. Flags are kept: they carry intent.
 */
export function normalizeCommand(command: string): string {
  return command
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(["'])(?:(?!\1).)*\1/g, "…")
    .split(" ")
    .map((token) => (isVolatileToken(token) ? "…" : token))
    .join(" ")
    .replace(/(?:… )+…/g, "…")
    .slice(0, 120);
}

function isVolatileToken(token: string): boolean {
  if (token === "…") return true;
  if (token.startsWith("-")) return false;
  if (/^\d+$/.test(token)) return true;
  if (/^[0-9a-f]{7,40}$/i.test(token)) return true;
  if (/[/\\]/.test(token)) return true;
  return /\.[A-Za-z0-9]{1,6}$/.test(token);
}

interface Draft {
  kind: InstinctKind;
  rule: string;
  evidence: string;
  session: string;
}

/**
 * Turn raw session events into instinct candidates.
 *
 * Four signals are mined, in ascending order of how much they are trusted:
 * repeated commands, repeated file hotspots, error→recovery pairs, and
 * explicit user corrections.
 */
export function extractInstincts(events: SessionEvent[], now: Date = new Date()): Instinct[] {
  const drafts: Draft[] = [];
  const bySession = new Map<string, SessionEvent[]>();
  for (const event of events) {
    const bucket = bySession.get(event.session) ?? [];
    bucket.push(event);
    bySession.set(event.session, bucket);
  }

  for (const [session, sessionEvents] of bySession) {
    let lastError: SessionEvent | null = null;
    for (const event of sessionEvents) {
      switch (event.type) {
        case "tool": {
          if (!event.command) break;
          const command = normalizeCommand(event.command);
          if (event.exitCode === undefined || event.exitCode === 0) {
            drafts.push({
              kind: "command",
              rule: `Use \`${command}\` in this project.`,
              evidence: `${session}: ${command}`,
              session,
            });
            if (lastError) {
              const symptom = summarize(lastError.text ?? lastError.command ?? "a failure");
              drafts.push({
                kind: "recovery",
                rule: `When you hit "${symptom}", run \`${command}\`.`,
                evidence: `${session}: ${symptom} -> ${command}`,
                session,
              });
              lastError = null;
            }
          } else {
            lastError = event;
          }
          break;
        }
        case "error": {
          lastError = event;
          break;
        }
        case "edit": {
          if (!event.file) break;
          drafts.push({
            kind: "hotspot",
            rule: `Changes in this area usually touch \`${event.file}\`.`,
            evidence: `${session}: edited ${event.file}`,
            session,
          });
          break;
        }
        case "correction": {
          if (!event.text) break;
          drafts.push({
            kind: "correction",
            rule: summarize(event.text, 160),
            evidence: `${session}: ${summarize(event.text, 160)}`,
            session,
          });
          break;
        }
        default:
          break;
      }
    }
  }

  const grouped = new Map<string, Instinct>();
  const timestamp = now.toISOString();
  for (const draft of drafts) {
    const id = instinctId(draft.kind, draft.rule);
    const existing = grouped.get(id);
    if (existing) {
      if (!existing.evidence.includes(draft.evidence)) existing.evidence.push(draft.evidence);
      if (!existing.sessions.includes(draft.session)) existing.sessions.push(draft.session);
      existing.support = existing.evidence.length;
      continue;
    }
    grouped.set(id, {
      id,
      kind: draft.kind,
      rule: draft.rule,
      evidence: [draft.evidence],
      sessions: [draft.session],
      support: 1,
      status: "proposed",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  return [...grouped.values()].sort((a, b) => b.support - a.support);
}

function summarize(text: string, max = 80): string {
  const firstLine = text.trim().split("\n")[0] ?? "";
  const clean = firstLine.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}
