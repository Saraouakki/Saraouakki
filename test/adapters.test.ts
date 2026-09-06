import { describe, expect, it } from "vitest";
import { packageRoot } from "../src/core/paths.js";
import { defaultCatalogPaths, loadCatalog } from "../src/registry/catalog.js";
import { ADAPTERS, getAdapter } from "../src/adapters/index.js";
import type { AdapterInput } from "../src/adapters/types.js";
import { parseFrontmatter } from "../src/core/frontmatter.js";

const input: AdapterInput = {
  catalog: loadCatalog(defaultCatalogPaths(packageRoot())),
  instincts: [
    {
      id: "abc", kind: "command", rule: "Use `npm test` in this project.",
      evidence: ["s1"], sessions: ["s1", "s2"], support: 3, status: "active",
      createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  contextPack: "# ECC memory\n\n## decision\n\n- we use postgres\n",
  projectName: "demo",
};

describe("adapters", () => {
  it("every adapter renders non-empty files with relative paths", () => {
    for (const adapter of ADAPTERS) {
      const files = adapter.render(input);
      expect(files.length, adapter.id).toBeGreaterThan(0);
      for (const file of files) {
        expect(file.path.startsWith("/"), file.path).toBe(false);
        expect(file.path.includes(".."), file.path).toBe(false);
        expect(file.content.trim().length, file.path).toBeGreaterThan(0);
      }
    }
  });

  it("claude-code writes one SKILL.md per skill with valid frontmatter", () => {
    const files = getAdapter("claude-code").render(input);
    const skillFiles = files.filter((file) => file.path.endsWith("SKILL.md"));
    expect(skillFiles).toHaveLength(input.catalog.skills.length);
    const parsed = parseFrontmatter(skillFiles[0]!.content);
    expect(parsed.data.name).toBeDefined();
    expect(String(parsed.data.description).length).toBeGreaterThan(20);
  });

  it("carries memory and instincts into every target", () => {
    for (const adapter of ADAPTERS) {
      const merged = adapter.render(input).map((file) => file.content).join("\n");
      expect(merged, adapter.id).toContain("Learned instincts");
      expect(merged, adapter.id).toContain("we use postgres");
    }
  });

  it("codex collapses the catalog into a single AGENTS.md", () => {
    const files = getAdapter("codex").render(input);
    expect(files).toHaveLength(1);
    expect(files[0]!.path).toBe("AGENTS.md");
  });

  it("rejects an unknown target by name", () => {
    expect(() => getAdapter("emacs")).toThrow(/Unknown target/);
  });

  it("omits the instinct section when nothing is active", () => {
    const rendered = getAdapter("cursor")
      .render({ ...input, instincts: [] })
      .map((file) => file.content)
      .join("\n");
    expect(rendered).not.toContain("Learned instincts");
  });
});
