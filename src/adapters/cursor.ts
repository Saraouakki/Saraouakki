import { type Adapter, type AdapterFile, instinctSection, joinBlocks } from "./types.js";

/** Cursor consumes `.cursor/rules/*.mdc` with a small frontmatter header. */
export const cursorAdapter: Adapter = {
  id: "cursor",
  label: "Cursor",
  render(input) {
    const files: AdapterFile[] = input.catalog.skills.map((skill) => ({
      path: `.cursor/rules/${skill.name}.mdc`,
      content: [
        "---",
        `description: ${skill.description}`,
        "globs:",
        "alwaysApply: false",
        "---",
        "",
        skill.body,
        "",
      ].join("\n"),
    }));

    files.push({
      path: ".cursor/rules/ecc-memory.mdc",
      content: joinBlocks([
        "---\ndescription: Project memory and learned instincts maintained by ECC\nalwaysApply: true\n---",
        instinctSection(input.instincts),
        input.contextPack,
      ]),
    });

    return files;
  },
};
