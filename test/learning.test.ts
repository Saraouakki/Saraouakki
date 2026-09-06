import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { workspace } from "../src/core/paths.js";
import { InstinctStore } from "../src/learning/instincts.js";
import { extractInstincts, normalizeCommand, type SessionEvent } from "../src/learning/extract.js";
import { DEFAULT_POLICY, draftSkill, isPromotable, slugify } from "../src/learning/promote.js";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ecc-learn-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const events: SessionEvent[] = [
  { session: "s1", type: "tool", command: "npm test -- auth.test.ts", exitCode: 0 },
  { session: "s1", type: "edit", file: "src/auth/session.ts" },
  { session: "s2", type: "tool", command: "npm test -- 'billing.test.ts'", exitCode: 0 },
  { session: "s2", type: "error", text: "TypeError: cannot read properties of undefined" },
  { session: "s2", type: "tool", command: "npm run build", exitCode: 0 },
  { session: "s3", type: "tool", command: "npm test -- 42", exitCode: 0 },
  { session: "s3", type: "correction", text: "Do not edit generated files under src/gen" },
];

describe("normalizeCommand", () => {
  it("collapses volatile arguments so repeats can be counted", () => {
    expect(normalizeCommand("npm test -- foo.test.ts")).toBe(normalizeCommand("npm  test -- foo.test.ts"));
    expect(normalizeCommand("git show a1b2c3d4e5f")).toBe("git show …");
    expect(normalizeCommand("npm test -- 42")).toBe("npm test -- …");
    expect(normalizeCommand("npm test -- a.test.ts")).toBe(normalizeCommand("npm test -- b.test.ts"));
  });
});

describe("extractInstincts", () => {
  it("counts a repeated command across sessions", () => {
    const instincts = extractInstincts(events);
    const command = instincts.find((item) => item.kind === "command" && item.rule.includes("npm test"));
    expect(command).toBeDefined();
    expect(command!.sessions.sort()).toEqual(["s1", "s2", "s3"]);
    expect(command!.support).toBe(3);
  });

  it("pairs an error with the command that followed it", () => {
    const recovery = extractInstincts(events).find((item) => item.kind === "recovery");
    expect(recovery?.rule).toContain("npm run build");
    expect(recovery?.rule).toContain("TypeError");
  });

  it("keeps explicit corrections verbatim", () => {
    const correction = extractInstincts(events).find((item) => item.kind === "correction");
    expect(correction?.rule).toBe("Do not edit generated files under src/gen");
  });

  it("returns nothing for an empty session log", () => {
    expect(extractInstincts([])).toEqual([]);
  });
});

describe("promotion policy", () => {
  it("requires support across more than one session", () => {
    const [weak] = extractInstincts([
      { session: "s1", type: "edit", file: "src/only.ts" },
      { session: "s1", type: "edit", file: "src/only.ts" },
    ]);
    expect(isPromotable(weak!, DEFAULT_POLICY)).toBe(false);
  });

  it("promotes a command seen in three sessions", () => {
    const command = extractInstincts(events).find((item) => item.rule.includes("npm test"))!;
    expect(isPromotable(command, DEFAULT_POLICY)).toBe(true);
  });

  it("promotes a single explicit correction", () => {
    const correction = extractInstincts(events).find((item) => item.kind === "correction")!;
    expect(isPromotable(correction)).toBe(true);
  });

  it("never re-promotes or resurrects a rejected instinct", () => {
    const instinct = extractInstincts(events).find((item) => item.kind === "correction")!;
    expect(isPromotable({ ...instinct, status: "promoted" })).toBe(false);
    expect(isPromotable({ ...instinct, status: "rejected" })).toBe(false);
  });

  it("drafts a reviewable skill file", () => {
    const instinct = extractInstincts(events).find((item) => item.kind === "correction")!;
    const draft = draftSkill(instinct);
    expect(draft.name.startsWith("learned-")).toBe(true);
    expect(draft.content).toContain("maturity: draft");
    expect(draft.content).toContain(instinct.rule);
  });

  it("slugifies safely", () => {
    expect(slugify("Use `npm test` in this project.")).toBe("use-npm-test-in-this-project");
    expect(slugify("***")).toBe("instinct");
  });
});

describe("InstinctStore", () => {
  it("accumulates evidence across runs without duplicating", () => {
    const store = new InstinctStore(workspace(root));
    store.merge(extractInstincts(events));
    const merged = store.merge(extractInstincts(events));
    const command = merged.find((item) => item.rule.includes("npm test"))!;
    expect(command.sessions).toHaveLength(3);
    expect(merged.filter((item) => item.rule.includes("npm test"))).toHaveLength(1);
  });

  it("keeps a promoted status through a later merge", () => {
    const store = new InstinctStore(workspace(root));
    const first = store.merge(extractInstincts(events));
    first[0]!.status = "promoted";
    store.save(first);
    const second = store.merge(extractInstincts(events));
    expect(second.find((item) => item.id === first[0]!.id)!.status).toBe("promoted");
  });

  it("returns an empty list when no store exists yet", () => {
    expect(new InstinctStore(workspace(root)).all()).toEqual([]);
  });
});
