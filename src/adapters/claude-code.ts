import { stringifyDocument } from "../core/frontmatter.js";
import {
  type Adapter,
  type AdapterFile,
  catalogIndex,
  instinctSection,
  joinBlocks,
} from "./types.js";

/**
 * Claude Code is the reference target: skills and agents map one-to-one onto
 * the harness's own directory layout, so nothing is flattened away.
 */
export const claudeCodeAdapter: Adapter = {
  id: "claude-code",
  label: "Claude Code",
  render(input) {
    const files: AdapterFile[] = [];

    for (const skill of input.catalog.skills) {
      files.push({
        path: `.claude/skills/${skill.name}/SKILL.md`,
        content: stringifyDocument(
          {
            name: skill.name,
            description: skill.description,
            ...(skill.tools.length > 0 ? { "allowed-tools": skill.tools } : {}),
          },
          skill.body,
        ),
      });
    }

    for (const agent of input.catalog.agents) {
      files.push({
        path: `.claude/agents/${agent.name}.md`,
        content: stringifyDocument(
          {
            name: agent.name,
            description: agent.description,
            tools: agent.tools,
            model: agent.model,
          },
          agent.body,
        ),
      });
    }

    files.push({
      path: "CLAUDE.md",
      content: joinBlocks([
        `# ${input.projectName}`,
        "This project runs the ECC harness. Skills live in `.claude/skills`, agents in\n" +
          "`.claude/agents`, and durable context in `.ecc/memory.jsonl`.",
        instinctSection(input.instincts),
        input.contextPack,
        catalogIndex(input),
      ]),
    });

    return files;
  },
};
