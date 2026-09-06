import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Adapter, AdapterFile, AdapterInput } from "./types.js";
import { claudeCodeAdapter } from "./claude-code.js";
import { codexAdapter } from "./codex.js";
import { cursorAdapter } from "./cursor.js";
import { opencodeAdapter } from "./opencode.js";

export const ADAPTERS: Adapter[] = [
  claudeCodeAdapter,
  codexAdapter,
  cursorAdapter,
  opencodeAdapter,
];

export function getAdapter(id: string): Adapter {
  const adapter = ADAPTERS.find((item) => item.id === id);
  if (!adapter) {
    throw new Error(`Unknown target "${id}". Known targets: ${ADAPTERS.map((a) => a.id).join(", ")}`);
  }
  return adapter;
}

export interface WriteResult {
  written: string[];
  dryRun: boolean;
}

export function writeFiles(root: string, files: AdapterFile[], dryRun = false): WriteResult {
  const written: string[] = [];
  for (const file of files) {
    const full = join(root, file.path);
    if (!dryRun) {
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, file.content, "utf8");
    }
    written.push(file.path);
  }
  return { written, dryRun };
}

export type { Adapter, AdapterFile, AdapterInput };
export { claudeCodeAdapter, codexAdapter, cursorAdapter, opencodeAdapter };
