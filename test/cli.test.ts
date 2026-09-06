import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  it("separates positionals from flags", () => {
    const { positional, flags } = parseArgs(["memory", "add", "a fact", "--kind", "decision"]);
    expect(positional).toEqual(["memory", "add", "a fact"]);
    expect(flags.kind).toBe("decision");
  });

  it("supports --key=value and bare booleans", () => {
    const { flags } = parseArgs(["scan", "--fail-on=medium", "--json"]);
    expect(flags["fail-on"]).toBe("medium");
    expect(flags.json).toBe(true);
  });

  it("does not swallow the next flag as a value", () => {
    const { flags } = parseArgs(["install", "--dry-run", "--root", "/tmp/x"]);
    expect(flags["dry-run"]).toBe(true);
    expect(flags.root).toBe("/tmp/x");
  });
});
