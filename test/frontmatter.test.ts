import { describe, expect, it } from "vitest";
import { asList, parseFrontmatter, stringifyDocument } from "../src/core/frontmatter.js";

describe("parseFrontmatter", () => {
  it("reads scalars, inline lists and dash lists", () => {
    const source = [
      "---",
      "name: tdd-loop",
      "description: Drive a change test-first",
      "tags: [testing, tdd]",
      "maturity: stable",
      "count: 3",
      "enabled: true",
      "tools:",
      "  - Bash",
      "  - Read",
      "---",
      "",
      "# Body",
      "",
      "text",
    ].join("\n");

    const { data, body } = parseFrontmatter(source);
    expect(data.name).toBe("tdd-loop");
    expect(data.tags).toEqual(["testing", "tdd"]);
    expect(data.tools).toEqual(["Bash", "Read"]);
    expect(data.count).toBe(3);
    expect(data.enabled).toBe(true);
    expect(body.startsWith("# Body")).toBe(true);
  });

  it("treats a document without frontmatter as pure body", () => {
    const { data, body } = parseFrontmatter("just text\n");
    expect(data).toEqual({});
    expect(body).toBe("just text");
  });

  it("handles CRLF and an empty list value", () => {
    const { data } = parseFrontmatter("---\r\nname: x\r\ntags: []\r\n---\r\nbody\r\n");
    expect(data.name).toBe("x");
    expect(data.tags).toEqual([]);
  });

  it("round-trips through stringifyDocument", () => {
    const doc = stringifyDocument({ name: "a", tags: ["x", "y"] }, "body text");
    const parsed = parseFrontmatter(doc);
    expect(parsed.data.name).toBe("a");
    expect(parsed.data.tags).toEqual(["x", "y"]);
    expect(parsed.body).toBe("body text");
  });

  it("normalises comma strings into lists", () => {
    expect(asList("a, b ,c")).toEqual(["a", "b", "c"]);
    expect(asList(undefined)).toEqual([]);
  });
});
