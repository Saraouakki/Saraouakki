import { existsSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { ensureDir, packageRoot, workspace } from "./core/paths.js";
import { MEMORY_KINDS, MemoryStore, type MemoryKind } from "./memory/store.js";
import { buildContextPack } from "./memory/context-pack.js";
import { defaultCatalogPaths, loadCatalog, searchCatalog, validateCatalog } from "./registry/catalog.js";
import { InstinctStore } from "./learning/instincts.js";
import { extractInstincts, readSessionEvents } from "./learning/extract.js";
import { DEFAULT_POLICY, draftSkill, isPromotable } from "./learning/promote.js";
import { formatReport, scanTree } from "./security/agentshield.js";
import type { Severity } from "./security/rules.js";
import { ADAPTERS, getAdapter, writeFiles } from "./adapters/index.js";

interface Args {
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]!;
    if (token.startsWith("--")) {
      const [key, inline] = token.slice(2).split("=", 2);
      if (inline !== undefined) {
        flags[key!] = inline;
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("--")) {
          flags[key!] = next;
          i += 1;
        } else {
          flags[key!] = true;
        }
      }
    } else {
      positional.push(token);
    }
  }
  return { positional, flags };
}

const USAGE = `ecc — Everything Claude Code

Usage: ecc <command> [options]

  init                          Create .ecc/ state for this project
  install <target>              Project the catalog into an agent tool
                                targets: ${ADAPTERS.map((a) => a.id).join(", ")}
  skills [list|search|show]     Browse the skill catalog
  agents [list|show]            Browse the agent catalog
  memory add <text>             Record a durable fact (--kind, --scope, --tags)
  memory search <query>         Recall matching memories
  memory pack                   Print a context pack (--query, --budget)
  memory forget <needle>        Drop matching memories
  memory compact                Collapse duplicates and drop stale entries
  learn [--promote]             Mine session events into instincts (--events)
  learn list                    Show the current instincts
  learn accept|reject <id>      Curate an instinct before it reaches sessions
  scan [path]                   Run AgentShield (--fail-on, --json)
  doctor                        Validate the catalog and the installation
  stats                         Summarise memory, instincts and catalog size

Options:
  --root <dir>    Project root (default: cwd)
  --json          Machine-readable output where supported
  --dry-run       Show what install would write without writing it
`;

function projectRoot(flags: Args["flags"]): string {
  return resolve(typeof flags.root === "string" ? flags.root : process.cwd());
}

function catalogFor(flags: Args["flags"]) {
  const from = typeof flags.catalog === "string" ? resolve(flags.catalog) : packageRoot();
  return loadCatalog(defaultCatalogPaths(from));
}

export async function main(argv: string[]): Promise<void> {
  const { positional, flags } = parseArgs(argv);
  const command = positional[0];

  if (!command || flags.help || command === "help") {
    process.stdout.write(USAGE);
    return;
  }

  switch (command) {
    case "init":
      return cmdInit(flags);
    case "install":
      return cmdInstall(positional.slice(1), flags);
    case "skills":
      return cmdSkills(positional.slice(1), flags);
    case "agents":
      return cmdAgents(positional.slice(1), flags);
    case "memory":
      return cmdMemory(positional.slice(1), flags);
    case "learn":
      return cmdLearn(positional.slice(1), flags);
    case "scan":
      return cmdScan(positional.slice(1), flags);
    case "doctor":
      return cmdDoctor(flags);
    case "stats":
      return cmdStats(flags);
    default:
      throw new Error(`Unknown command "${command}". Run \`ecc help\`.`);
  }
}

function cmdInit(flags: Args["flags"]): void {
  const ws = workspace(projectRoot(flags));
  ensureDir(ws.home);
  ensureDir(ws.sessionsDir);
  if (!existsSync(ws.memoryFile)) writeFileSync(ws.memoryFile, "", "utf8");
  if (!existsSync(ws.instinctsFile)) writeFileSync(ws.instinctsFile, "[]\n", "utf8");
  process.stdout.write(
    `Initialised ECC in ${ws.home}\nNext: ecc install claude-code\n`,
  );
}

function cmdInstall(args: string[], flags: Args["flags"]): void {
  const target = args[0];
  if (!target) throw new Error(`install needs a target: ${ADAPTERS.map((a) => a.id).join(", ")}`);
  const root = projectRoot(flags);
  const ws = workspace(root);
  const adapter = getAdapter(target);
  const catalog = catalogFor(flags);
  const instincts = new InstinctStore(ws).all();
  const memories = new MemoryStore(ws).top(25);
  const contextPack =
    memories.length > 0
      ? buildContextPack(memories, { budget: 2500, headingLevel: 2, title: "Project memory" })
      : "";

  const files = adapter.render({
    catalog,
    instincts,
    contextPack,
    projectName: basename(root),
  });
  const result = writeFiles(root, files, flags["dry-run"] === true);
  const verb = result.dryRun ? "Would write" : "Wrote";
  process.stdout.write(
    `${verb} ${result.written.length} file(s) for ${adapter.label}:\n` +
      result.written.map((path) => `  ${path}\n`).join(""),
  );
}

function cmdSkills(args: string[], flags: Args["flags"]): void {
  const catalog = catalogFor(flags);
  const sub = args[0] ?? "list";
  if (sub === "show") {
    const name = args[1];
    const skill = catalog.skills.find((item) => item.name === name);
    if (!skill) throw new Error(`No skill named "${name}".`);
    process.stdout.write(`# ${skill.name}\n${skill.description}\n\n${skill.body}\n`);
    return;
  }
  const items =
    sub === "search"
      ? searchCatalog(catalog.skills, args.slice(1).join(" "), 20).map((hit) => hit.item)
      : catalog.skills;
  if (flags.json) {
    process.stdout.write(`${JSON.stringify(items, null, 2)}\n`);
    return;
  }
  for (const skill of items) {
    process.stdout.write(`${skill.name.padEnd(32)} ${skill.category.padEnd(12)} ${skill.description}\n`);
  }
  process.stdout.write(`\n${items.length} skill(s)\n`);
}

function cmdAgents(args: string[], flags: Args["flags"]): void {
  const catalog = catalogFor(flags);
  if (args[0] === "show") {
    const agent = catalog.agents.find((item) => item.name === args[1]);
    if (!agent) throw new Error(`No agent named "${args[1]}".`);
    process.stdout.write(`# ${agent.name}\n${agent.description}\n\n${agent.body}\n`);
    return;
  }
  if (flags.json) {
    process.stdout.write(`${JSON.stringify(catalog.agents, null, 2)}\n`);
    return;
  }
  for (const agent of catalog.agents) {
    process.stdout.write(`${agent.name.padEnd(28)} ${agent.phase.padEnd(10)} ${agent.description}\n`);
  }
  process.stdout.write(`\n${catalog.agents.length} agent(s)\n`);
}

function cmdMemory(args: string[], flags: Args["flags"]): void {
  const store = new MemoryStore(workspace(projectRoot(flags)));
  const sub = args[0] ?? "pack";

  switch (sub) {
    case "add": {
      const text = args.slice(1).join(" ").trim();
      if (text === "") throw new Error("memory add needs some text.");
      const kind = String(flags.kind ?? "fact") as MemoryKind;
      if (!MEMORY_KINDS.includes(kind)) {
        throw new Error(`--kind must be one of: ${MEMORY_KINDS.join(", ")}`);
      }
      const entry = store.remember({
        kind,
        text,
        scope: typeof flags.scope === "string" ? flags.scope : undefined,
        tags: typeof flags.tags === "string" ? flags.tags.split(",") : [],
      });
      process.stdout.write(`Remembered ${entry.id} (${entry.kind}, hits=${entry.hits})\n`);
      return;
    }
    case "search": {
      const hits = store.search(args.slice(1).join(" "), Number(flags.limit ?? 10));
      if (flags.json) {
        process.stdout.write(`${JSON.stringify(hits, null, 2)}\n`);
        return;
      }
      for (const hit of hits) {
        process.stdout.write(`[${hit.kind}] ${hit.text} (${hit.scope}, hits=${hit.hits})\n`);
      }
      if (hits.length === 0) process.stdout.write("No matching memories.\n");
      return;
    }
    case "forget": {
      const removed = store.forget(args.slice(1).join(" "));
      process.stdout.write(`Removed ${removed} entr${removed === 1 ? "y" : "ies"}.\n`);
      return;
    }
    case "compact": {
      const removed = store.compact();
      process.stdout.write(`Compacted; dropped ${removed} stale entr${removed === 1 ? "y" : "ies"}.\n`);
      return;
    }
    case "pack": {
      const query = typeof flags.query === "string" ? flags.query : "";
      const entries = query === "" ? store.top(30) : store.search(query, 30);
      process.stdout.write(
        buildContextPack(entries, {
          budget: Number(flags.budget ?? 4000),
          query: query || undefined,
        }),
      );
      return;
    }
    default:
      throw new Error(`Unknown memory subcommand "${sub}".`);
  }
}

function cmdLearn(args: string[], flags: Args["flags"]): void {
  const ws = workspace(projectRoot(flags));
  const store = new InstinctStore(ws);

  if (args[0] === "accept" || args[0] === "reject") {
    const id = args[1];
    if (!id) throw new Error(`learn ${args[0]} needs an instinct id (see \`ecc learn list\`).`);
    const instincts = store.all();
    const target = instincts.find((item) => item.id === id);
    if (!target) throw new Error(`No instinct with id "${id}".`);
    target.status = args[0] === "accept" ? "active" : "rejected";
    target.updatedAt = new Date().toISOString();
    store.save(instincts);
    process.stdout.write(`${target.id} is now ${target.status}: ${target.rule}\n`);
    return;
  }

  if (args[0] === "list") {
    const instincts = store.all();
    if (flags.json) {
      process.stdout.write(`${JSON.stringify(instincts, null, 2)}\n`);
      return;
    }
    for (const instinct of instincts) {
      process.stdout.write(
        `${instinct.id}  ${instinct.status.padEnd(9)} ${String(instinct.support).padStart(3)}×  ${instinct.rule}\n`,
      );
    }
    process.stdout.write(`\n${instincts.length} instinct(s)\n`);
    return;
  }

  const eventsPath = typeof flags.events === "string" ? resolve(flags.events) : ws.sessionsDir;
  const events = readSessionEvents(eventsPath);
  if (events.length === 0) {
    process.stdout.write(`No session events found in ${eventsPath}.\n`);
    return;
  }
  const merged = store.merge(extractInstincts(events));
  process.stdout.write(`Learned from ${events.length} event(s); ${merged.length} instinct(s) tracked.\n`);

  if (flags.promote) {
    const outDir = ensureDir(
      typeof flags.out === "string" ? resolve(flags.out) : join(ws.home, "drafts"),
    );
    let promoted = 0;
    for (const instinct of merged) {
      if (!isPromotable(instinct, DEFAULT_POLICY)) continue;
      const draft = draftSkill(instinct);
      writeFileSync(join(outDir, draft.path), draft.content, "utf8");
      instinct.status = "promoted";
      promoted += 1;
    }
    store.save(merged);
    process.stdout.write(`Promoted ${promoted} instinct(s) to skill drafts in ${outDir}.\n`);
  }
}

function cmdScan(args: string[], flags: Args["flags"]): void {
  const root = resolve(args[0] ?? projectRoot(flags));
  const failOn = (typeof flags["fail-on"] === "string" ? flags["fail-on"] : "high") as Severity;
  const report = scanTree(root, { failOn });
  if (flags.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatReport(report)}\n`);
  }
  if (!report.passed) process.exitCode = 1;
}

function cmdDoctor(flags: Args["flags"]): void {
  const root = projectRoot(flags);
  const ws = workspace(root);
  const catalog = catalogFor(flags);
  const issues = validateCatalog(catalog);
  const lines: string[] = [];

  lines.push(`catalog        ${catalog.skills.length} skills, ${catalog.agents.length} agents`);
  lines.push(`state          ${existsSync(ws.home) ? ws.home : "not initialised (run `ecc init`)"}`);
  lines.push(`memory         ${new MemoryStore(ws).all().length} entries`);
  lines.push(`instincts      ${new InstinctStore(ws).all().length} tracked`);

  const scan = scanTree(root, { failOn: "high" });
  lines.push(
    `agentshield    ${scan.findings.length} finding(s) (critical ${scan.counts.critical}, high ${scan.counts.high})`,
  );

  if (issues.length === 0) {
    lines.push("validation     ok");
  } else {
    lines.push(`validation     ${issues.length} issue(s)`);
    for (const issue of issues) lines.push(`  ${issue.file}: ${issue.message}`);
  }

  process.stdout.write(`${lines.join("\n")}\n`);
  if (issues.length > 0 || !scan.passed) process.exitCode = 1;
}

function cmdStats(flags: Args["flags"]): void {
  const ws = workspace(projectRoot(flags));
  const catalog = catalogFor(flags);
  const memories = new MemoryStore(ws).all();
  const instincts = new InstinctStore(ws).all();
  const byKind = new Map<string, number>();
  for (const entry of memories) byKind.set(entry.kind, (byKind.get(entry.kind) ?? 0) + 1);

  const payload = {
    skills: catalog.skills.length,
    agents: catalog.agents.length,
    memories: memories.length,
    memoriesByKind: Object.fromEntries([...byKind].sort()),
    instincts: instincts.length,
    promotable: instincts.filter((item) => isPromotable(item)).length,
  };

  if (flags.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  process.stdout.write(
    [
      `skills       ${payload.skills}`,
      `agents       ${payload.agents}`,
      `memories     ${payload.memories}`,
      `instincts    ${payload.instincts} (${payload.promotable} ready to promote)`,
      "",
    ].join("\n"),
  );
}
