import { stringifyDocument } from "../core/frontmatter.js";
import type { Instinct } from "./instincts.js";

export interface PromotionPolicy {
  /** Minimum number of distinct observations. */
  minSupport: number;
  /** Minimum number of distinct sessions — guards against one-off loops. */
  minSessions: number;
}

export const DEFAULT_POLICY: PromotionPolicy = { minSupport: 3, minSessions: 2 };

export function isPromotable(instinct: Instinct, policy: PromotionPolicy = DEFAULT_POLICY): boolean {
  if (instinct.status === "promoted" || instinct.status === "rejected") return false;
  // A correction is an explicit human signal: one is enough to act on, but it
  // still has to have been seen in a real session.
  if (instinct.kind === "correction") return instinct.sessions.length >= 1;
  return instinct.support >= policy.minSupport && instinct.sessions.length >= policy.minSessions;
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return slug === "" ? "instinct" : slug;
}

export interface SkillDraft {
  name: string;
  path: string;
  content: string;
}

/** Render a promoted instinct as a draft skill file for human review. */
export function draftSkill(instinct: Instinct): SkillDraft {
  const name = `learned-${slugify(instinct.rule)}`;
  const body = [
    "## When this applies",
    "",
    `Learned from ${instinct.support} observation(s) across ${instinct.sessions.length} session(s).`,
    "",
    "## Instruction",
    "",
    instinct.rule,
    "",
    "## Evidence",
    "",
    ...instinct.evidence.slice(0, 8).map((line) => `- ${line}`),
    "",
    "## Review checklist",
    "",
    "- [ ] The instruction generalises beyond the sessions that produced it",
    "- [ ] It does not duplicate an existing skill",
    "- [ ] Set `maturity: stable` once confirmed",
  ].join("\n");

  const content = stringifyDocument(
    {
      name,
      description: `Learned behaviour: ${instinct.rule}`,
      category: "learned",
      tags: [instinct.kind, "learned"],
      maturity: "draft",
    },
    body,
  );

  return { name, path: `${name}.md`, content };
}
