import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { asList, asString, parseFrontmatter } from "../core/frontmatter.js";
import { packageRoot } from "../core/paths.js";
import { tokenize } from "../memory/store.js";

export type Maturity = "instinct" | "draft" | "stable";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  maturity: Maturity;
  /** Tools the skill expects to be available; used by the doctor command. */
  tools: string[];
  body: string;
  file: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  /** Where the agent belongs in the plan → build → verify loop. */
  phase: string;
  tools: string[];
  model: string;
  body: string;
  file: string;
}

export interface CatalogPaths {
  skillsDir: string;
  agentsDir: string;
}

export function defaultCatalogPaths(root: string = packageRoot()): CatalogPaths {
  return { skillsDir: join(root, "skills"), agentsDir: join(root, "agents") };
}

function markdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...markdownFiles(full));
    } else if (extname(name) === ".md") {
      out.push(full);
    }
  }
  return out;
}

function idFor(file: string): string {
  const name = basename(file, ".md");
  return name === "SKILL" ? basename(join(file, "..")) : name;
}

function maturityOf(value: string): Maturity {
  return value === "instinct" || value === "draft" ? value : "stable";
}

export function loadSkills(dir: string): SkillDefinition[] {
  return markdownFiles(dir).map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
    const id = asString(data.name, idFor(file));
    return {
      id,
      name: id,
      description: asString(data.description),
      category: asString(data.category, "general"),
      tags: asList(data.tags),
      maturity: maturityOf(asString(data.maturity, "stable")),
      tools: asList(data.tools),
      body,
      file,
    };
  });
}

export function loadAgents(dir: string): AgentDefinition[] {
  return markdownFiles(dir).map((file) => {
    const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
    const id = asString(data.name, idFor(file));
    return {
      id,
      name: id,
      description: asString(data.description),
      phase: asString(data.phase, "build"),
      tools: asList(data.tools),
      model: asString(data.model, "inherit"),
      body,
      file,
    };
  });
}

export interface Catalog {
  skills: SkillDefinition[];
  agents: AgentDefinition[];
}

export function loadCatalog(paths: CatalogPaths = defaultCatalogPaths()): Catalog {
  return { skills: loadSkills(paths.skillsDir), agents: loadAgents(paths.agentsDir) };
}

export interface ValidationIssue {
  file: string;
  message: string;
}

/** Structural checks the CI and `ecc doctor` both run over the catalog. */
export function validateCatalog(catalog: Catalog): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, string>();

  for (const skill of catalog.skills) {
    if (skill.id === "") issues.push({ file: skill.file, message: "skill has no name" });
    if (skill.description.length < 20) {
      issues.push({ file: skill.file, message: "description is too short to trigger reliably" });
    }
    if (skill.body.length < 80) {
      issues.push({ file: skill.file, message: "body has no usable instructions" });
    }
    const previous = seen.get(`skill:${skill.id}`);
    if (previous) issues.push({ file: skill.file, message: `duplicate skill name, also in ${previous}` });
    seen.set(`skill:${skill.id}`, skill.file);
  }

  for (const agent of catalog.agents) {
    if (agent.id === "") issues.push({ file: agent.file, message: "agent has no name" });
    if (agent.description.length < 20) {
      issues.push({ file: agent.file, message: "description is too short to route to" });
    }
    if (agent.tools.length === 0) {
      issues.push({ file: agent.file, message: "agent declares no tools" });
    }
    const previous = seen.get(`agent:${agent.id}`);
    if (previous) issues.push({ file: agent.file, message: `duplicate agent name, also in ${previous}` });
    seen.set(`agent:${agent.id}`, agent.file);
  }

  return issues;
}

export interface SearchHit<T> {
  item: T;
  score: number;
}

/** Rank catalog entries against a free-text query (same tokenizer as memory). */
export function searchCatalog<T extends { name: string; description: string; tags?: string[] }>(
  items: T[],
  query: string,
  limit = 10,
): SearchHit<T>[] {
  const terms = tokenize(query);
  if (terms.length === 0) return items.slice(0, limit).map((item) => ({ item, score: 0 }));

  return items
    .map((item) => {
      const name = tokenize(item.name);
      const description = tokenize(item.description);
      const tags = (item.tags ?? []).map((tag) => tag.toLowerCase());
      let score = 0;
      for (const term of terms) {
        if (name.includes(term)) score += 3;
        else if (tags.includes(term)) score += 2;
        else if (description.includes(term)) score += 1;
        else if (name.some((token) => token.startsWith(term))) score += 1.5;
      }
      return { item, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
