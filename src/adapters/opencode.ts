import {
  type Adapter,
  type AdapterFile,
  catalogIndex,
  instinctSection,
  joinBlocks,
} from "./types.js";

/**
 * OpenCode reads agent definitions from `.opencode/agent/*.md` and a project
 * instruction file; the ECC catalog is projected onto both.
 */
export const opencodeAdapter: Adapter = {
  id: "opencode",
  label: "OpenCode",
  render(input) {
    const files: AdapterFile[] = input.catalog.agents.map((agent) => ({
      path: `.opencode/agent/${agent.name}.md`,
      content: [
        "---",
        `description: ${agent.description}`,
        "mode: subagent",
        `model: ${agent.model === "inherit" ? "" : agent.model}`,
        "---",
        "",
        agent.body,
        "",
      ].join("\n"),
    }));

    files.push({
      path: ".opencode/AGENTS.md",
      content: joinBlocks([
        `# ${input.projectName}`,
        instinctSection(input.instincts),
        input.contextPack,
        catalogIndex(input),
      ]),
    });

    return files;
  },
};
