import type { Catalog } from "../registry/catalog.js";
import type { Instinct } from "../learning/instincts.js";

export interface AdapterInput {
  catalog: Catalog;
  /** Active instincts, injected as always-on guidance. */
  instincts: Instinct[];
  /** Markdown memory pack for session bootstrap; may be empty. */
  contextPack: string;
  projectName: string;
}

export interface AdapterFile {
  path: string;
  content: string;
}

export interface Adapter {
  id: string;
  label: string;
  render(input: AdapterInput): AdapterFile[];
}

/** Join document blocks with exactly one blank line between them. */
export function joinBlocks(blocks: string[]): string {
  return `${blocks.map((block) => block.trim()).filter((block) => block !== "").join("\n\n")}\n`;
}

export function instinctSection(instincts: Instinct[]): string {
  const active = instincts.filter((item) => item.status === "active" || item.status === "promoted");
  if (active.length === 0) return "";
  const lines = ["## Learned instincts", ""];
  for (const instinct of active.slice(0, 25)) {
    lines.push(`- ${instinct.rule} _(seen ${instinct.support}×)_`);
  }
  lines.push("");
  return lines.join("\n");
}

export function catalogIndex(input: AdapterInput): string {
  const lines = ["## Available skills", ""];
  const byCategory = new Map<string, string[]>();
  for (const skill of input.catalog.skills) {
    const bucket = byCategory.get(skill.category) ?? [];
    bucket.push(`- **${skill.name}** — ${skill.description}`);
    byCategory.set(skill.category, bucket);
  }
  for (const [category, entries] of [...byCategory].sort()) {
    lines.push(`### ${category}`, "", ...entries, "");
  }
  lines.push("## Available agents", "");
  for (const agent of input.catalog.agents) {
    lines.push(`- **${agent.name}** (${agent.phase}) — ${agent.description}`);
  }
  lines.push("");
  return lines.join("\n");
}
