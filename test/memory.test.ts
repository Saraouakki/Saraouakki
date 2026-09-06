import { appendFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { workspace } from "../src/core/paths.js";
import { MemoryStore } from "../src/memory/store.js";
import { buildContextPack } from "../src/memory/context-pack.js";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ecc-memory-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function store(): MemoryStore {
  return new MemoryStore(workspace(root));
}

describe("MemoryStore", () => {
  it("persists entries across instances", () => {
    store().remember({ kind: "decision", text: "money is stored in minor units" });
    expect(store().all()).toHaveLength(1);
  });

  it("reinforces a repeated fact instead of duplicating it", () => {
    store().remember({ kind: "convention", text: "tests live next to the source file" });
    const again = store().remember({ kind: "convention", text: "Tests live next to the source FILE" });
    expect(again.hits).toBe(2);
    expect(store().all()).toHaveLength(1);
  });

  it("ranks matching entries above unrelated ones", () => {
    const s = store();
    s.remember({ kind: "gotcha", text: "the seed script must run before the api tests", tags: ["tests"] });
    s.remember({ kind: "fact", text: "the marketing site is deployed separately" });
    const hits = s.search("api tests seed");
    expect(hits).toHaveLength(1);
    expect(hits[0]!.text).toContain("seed script");
  });

  it("returns nothing for a query with no overlap", () => {
    store().remember({ kind: "fact", text: "the build uses esbuild" });
    expect(store().search("kubernetes ingress")).toEqual([]);
  });

  it("forgets by substring", () => {
    const s = store();
    s.remember({ kind: "todo", text: "drop the legacy importer" });
    s.remember({ kind: "todo", text: "add pagination to the audit log" });
    expect(s.forget("legacy importer")).toBe(1);
    expect(s.all()).toHaveLength(1);
  });

  it("survives a truncated line in the log", () => {
    const s = store();
    s.remember({ kind: "fact", text: "a durable fact worth keeping" });
    appendFileSync(workspace(root).memoryFile, '{"id":"broken"\n', "utf8");
    expect(new MemoryStore(workspace(root)).all()).toHaveLength(1);
  });

  it("compacts away stale single-hit entries but keeps reinforced ones", () => {
    const s = store();
    s.remember({ kind: "fact", text: "one off observation" });
    s.remember({ kind: "convention", text: "always run the formatter" });
    s.remember({ kind: "convention", text: "always run the formatter" });
    const future = new Date(Date.now() + 400 * 86_400_000);
    expect(s.compact(future, 180)).toBe(1);
    expect(s.all().map((entry) => entry.kind)).toEqual(["convention"]);
  });
});

describe("buildContextPack", () => {
  it("groups by kind and respects the budget", () => {
    const s = store();
    s.remember({ kind: "decision", text: "we use postgres for everything" });
    s.remember({ kind: "gotcha", text: "the docker build needs BuildKit enabled" });
    const pack = buildContextPack(s.all(), { budget: 4000 });
    expect(pack).toContain("## decision");
    expect(pack).toContain("## gotcha");

    const tiny = buildContextPack(s.all(), { budget: 60 });
    expect(tiny.length).toBeLessThan(200);
  });

  it("demotes headings when embedded in a larger document", () => {
    const s = store();
    s.remember({ kind: "decision", text: "we use postgres for everything" });
    const pack = buildContextPack(s.all(), { headingLevel: 2, title: "Project memory" });
    expect(pack.startsWith("## Project memory")).toBe(true);
    expect(pack).toContain("### decision");
  });

  it("says so when there is nothing to recall", () => {
    expect(buildContextPack([])).toContain("No memories recorded yet");
  });
});
