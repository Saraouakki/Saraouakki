/**
 * Minimal YAML-subset frontmatter parser.
 *
 * ECC deliberately avoids a YAML dependency: skill and agent files are
 * authored by humans and agents alike, so the accepted grammar is kept small
 * and predictable — scalars, inline lists (`[a, b]`) and dash lists.
 */

export type FrontmatterValue = string | string[] | number | boolean;
export type Frontmatter = Record<string, FrontmatterValue>;

export interface ParsedDocument {
  data: Frontmatter;
  body: string;
}

function coerce(raw: string): FrontmatterValue {
  const value = raw.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (inner === "") return [];
    return inner.split(",").map((item) => unquote(item.trim()));
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && /^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return unquote(value);
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/** Split a document into its frontmatter block and its markdown body. */
export function parseFrontmatter(source: string): ParsedDocument {
  const normalized = source.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { data: {}, body: normalized.trim() };
  }
  const end = normalized.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, body: normalized.trim() };
  }
  const block = normalized.slice(4, end);
  const body = normalized.slice(end + 4).trim();

  const data: Frontmatter = {};
  let listKey: string | null = null;
  for (const line of block.split("\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const dashMatch = /^\s*-\s+(.*)$/.exec(line);
    if (dashMatch && listKey) {
      const current = data[listKey];
      const item = unquote(dashMatch[1]!.trim());
      if (Array.isArray(current)) current.push(item);
      else data[listKey] = [item];
      continue;
    }
    const kvMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kvMatch) continue;
    const key = kvMatch[1]!;
    const rest = kvMatch[2]!;
    if (rest.trim() === "") {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = coerce(rest);
      listKey = null;
    }
  }
  return { data, body };
}

/** Render frontmatter + body back to a document (used by generators). */
export function stringifyDocument(data: Frontmatter, body: string): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(", ")}]`);
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  lines.push("---", "", body.trim(), "");
  return lines.join("\n");
}

export function asString(value: FrontmatterValue | undefined, fallback = ""): string {
  if (value === undefined) return fallback;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function asList(value: FrontmatterValue | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.filter((item) => item !== "");
  const text = String(value).trim();
  if (text === "") return [];
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}
