import { describe, expect, it } from "vitest";
import { packageRoot } from "../src/core/paths.js";
import {
  defaultCatalogPaths,
  loadCatalog,
  searchCatalog,
  validateCatalog,
} from "../src/registry/catalog.js";

const catalog = loadCatalog(defaultCatalogPaths(packageRoot()));

describe("shipped catalog", () => {
  it("loads skills and agents", () => {
    expect(catalog.skills.length).toBeGreaterThan(20);
    expect(catalog.agents.length).toBeGreaterThan(10);
  });

  it("passes structural validation", () => {
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it("gives every skill a category and a body", () => {
    for (const skill of catalog.skills) {
      expect(skill.category, skill.file).not.toBe("");
      expect(skill.body.length, skill.file).toBeGreaterThan(200);
    }
  });

  it("gives every agent a phase we recognise", () => {
    for (const agent of catalog.agents) {
      expect(["plan", "build", "verify"], agent.file).toContain(agent.phase);
    }
  });
});

describe("searchCatalog", () => {
  it("ranks a name match above a description match", () => {
    const hits = searchCatalog(catalog.skills, "tdd");
    expect(hits[0]!.item.name).toBe("tdd-loop");
  });

  it("finds skills by tag", () => {
    const hits = searchCatalog(catalog.skills, "accessibility");
    expect(hits.map((hit) => hit.item.name)).toContain("accessible-component");
  });

  it("returns nothing for an unrelated query", () => {
    expect(searchCatalog(catalog.skills, "zzzqqq")).toEqual([]);
  });
});

describe("validateCatalog", () => {
  it("reports duplicates and thin definitions", () => {
    const issues = validateCatalog({
      skills: [
        {
          id: "a", name: "a", description: "too short", category: "x", tags: [],
          maturity: "stable", tools: [], body: "tiny", file: "a.md",
        },
      ],
      agents: [
        {
          id: "b", name: "b", description: "a description long enough to route", phase: "build",
          tools: [], model: "inherit", body: "x", file: "b.md",
        },
      ],
    });
    const messages = issues.map((issue) => issue.message);
    expect(messages).toContain("description is too short to trigger reliably");
    expect(messages).toContain("agent declares no tools");
  });
});
