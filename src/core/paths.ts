import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Root of the ECC installation itself (where the shipped catalog lives). */
export function packageRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/core -> src -> repo root, and dist/core -> dist -> package root.
  return resolve(here, "..", "..");
}

export interface Workspace {
  /** The project ECC is attached to. */
  root: string;
  /** Per-project ECC state (memory, instincts, run metadata). */
  home: string;
  memoryFile: string;
  instinctsFile: string;
  sessionsDir: string;
}

export function workspace(root: string = process.cwd()): Workspace {
  const home = join(root, ".ecc");
  return {
    root,
    home,
    memoryFile: join(home, "memory.jsonl"),
    instinctsFile: join(home, "instincts.json"),
    sessionsDir: join(home, "sessions"),
  };
}

export function ensureDir(path: string): string {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
  return path;
}

export function ensureParent(filePath: string): string {
  ensureDir(dirname(filePath));
  return filePath;
}
