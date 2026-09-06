# ECC — Everything Claude Code

**An agent harness performance system.** ECC is not a prompt pack. It gives a
coding agent the parts a harness usually lacks: durable **memory** across
sessions, a curated catalog of **skills** and **subagents**, a **learning loop**
that turns what happened in your sessions into reusable guidance, and
**AgentShield**, a scanner for the agent's own attack surface — prompts, hooks,
MCP servers, permissions and secrets.

It is not tied to one tool. The same catalog is projected into Claude Code,
Codex, Cursor and OpenCode from a single source of truth.

---

## نظرة عامة بالعربية

**ECC ليس مجرد مجموعة Prompts أو إعدادات.** هو نظام يضيف للـCoding Agent بنية كاملة
تخلّيه يشتغل بشكل منظّم ويستفيد من الشغل اللي عمله قبل كده:

- 🧠 **ذاكرة** — يحفظ القرارات والأعراف والمطبّات المهمة، ويرجّعها في الجلسات الجاية.
- 🛠️ **Skills** — كتالوج مهارات جاهزة (TDD، تشخيص الأعطال، مراجعة الكود، الأمان،
  الواجهات، الداتا، الـCI…).
- 🤖 **Agents** — وكلاء متخصصون للتخطيط، التنفيذ، المراجعة، إصلاح البناء، والأمان.
- ⚡ **تعلّم مستمر** — يستخرج أنماط من جلساتك ويحوّلها لـinstincts، واللي يثبت منها
  يترقّى لمهارة كاملة بعد مراجعة بشرية.
- 🔒 **AgentShield** — فحص أمني للـPrompts والـHooks والـMCP والصلاحيات والأسرار.
- 🔄 **مش مربوط بأداة واحدة** — نفس الكتالوج بيتولّد لـClaude Code وCodex وCursor وOpenCode.

الترخيص MIT. الأوامر كلها تحت `ecc` (شوف **CLI** تحت).

---

## What ships today

| Piece | Count | Where |
|---|---|---|
| Skills | 31 across 8 categories | `skills/*.md` |
| Agents | 15 across plan / build / verify | `agents/*.md` |
| AgentShield rules | 22 across 5 categories | `src/security/rules.ts` |
| Tool adapters | 4 (Claude Code, Codex, Cursor, OpenCode) | `src/adapters/` |

The catalog is meant to grow — by hand and through the learning loop, which
writes new skill drafts into `.ecc/drafts/` for review. Counts above are what is
actually in this repository, not a roadmap.

## Install

```sh
npm install
npm run build
npm link          # optional: puts `ecc` on your PATH
```

Requires Node 20+. There are no runtime dependencies.

## Quickstart

```sh
ecc init                      # create .ecc/ for this project
ecc install claude-code       # write .claude/skills, .claude/agents, CLAUDE.md
ecc scan --fail-on high       # audit the agent configuration
```

Record what the next session should not have to rediscover:

```sh
ecc memory add "money is stored in minor units end to end" --kind convention --scope lib/money
ecc memory add "the seed script must run before the api tests" --kind gotcha --tags tests
ecc memory pack                # the markdown block a session gets primed with
```

Then learn from the sessions you have already run:

```sh
ecc learn                      # mine .ecc/sessions/*.jsonl into instincts
ecc learn list                 # review them
ecc learn accept <id>          # promote to always-on guidance
ecc learn --promote            # write skill drafts for what met the policy
ecc install claude-code        # regenerate, now carrying memory + instincts
```

## Concepts

### 🧠 Memory

An append-only JSONL log in `.ecc/memory.jsonl`. Each entry has a kind
(`decision`, `convention`, `gotcha`, `fact`, `preference`, `todo`), a scope, tags
and a confidence.

Recording the same fact twice does not create a second copy — it **reinforces**
the first one (`hits`, confidence). Recall ranks by term overlap × confidence ×
reinforcement × recency, and `ecc memory pack` renders the top entries as a
markdown block that fits a stated character budget.

What belongs in memory: decisions and why, conventions found in the codebase,
gotchas that cost time. What does not: session narration, unverified guesses,
secrets. The `context-handoff` skill states the rule in full.

### 🛠️ Skills

Markdown files with frontmatter (`name`, `description`, `category`, `tags`,
`maturity`, `tools`) and a body of instructions. Categories shipped: engineering,
verification, research, security, frontend, data, ops, process.

```sh
ecc skills list
ecc skills search "flaky test"
ecc skills show tdd-loop
```

`ecc doctor` validates every file: a description too short to trigger on, a body
with no instructions, or a duplicate name is reported as an error.

### 🤖 Agents

Subagent definitions with a `phase` (plan / build / verify), a tool list and a
model. They are deliberately narrow — `planner` cannot edit files, `code-reviewer`
does not fix what it finds, `build-fixer` may not skip a test to get green.

```sh
ecc agents list
ecc agents show code-reviewer
```

### ⚡ Continuous learning

Any harness that can append JSONL events feeds the loop. One event per line in
`.ecc/sessions/*.jsonl`:

```json
{"session":"s1","type":"tool","command":"npm test -- auth.test.ts","exitCode":0}
{"session":"s1","type":"error","text":"TypeError: cannot read properties of undefined"}
{"session":"s1","type":"edit","file":"src/auth/session.ts"}
{"session":"s1","type":"correction","text":"Do not edit generated files under src/gen"}
```

`ecc learn` mines four signals: repeated **commands** (normalised so arguments
that vary do not split the count), error → **recovery** pairs, file **hotspots**,
and explicit human **corrections**.

The result is an *instinct*: a one-sentence rule with its evidence and the
sessions it came from. Instincts are proposed, not trusted. Promotion needs
support ≥ 3 across ≥ 2 sessions (a human correction counts immediately), and a
promoted instinct becomes a **draft skill** in `.ecc/drafts/` that stays
`maturity: draft` until someone confirms it. The `learning-curator` agent exists
for exactly that review.

```
session events → instincts (proposed) → accepted → skill draft → reviewed skill
```

### 🔒 AgentShield

The agent's configuration is executable text, and it is a real attack surface.
`ecc scan` walks five categories:

| Category | Examples of what it catches |
|---|---|
| `secrets` | AWS / GitHub / Anthropic / Slack keys, private keys, hardcoded credential literals |
| `prompts` | instruction-override text in a skill file, credential exfiltration, remote scripts piped to a shell, prompts that opt out of human confirmation |
| `hooks` | hooks that fetch and run remote code, destructive commands, `eval`, piping the environment somewhere |
| `permissions` | permission prompts disabled by default, `Bash(*)`, fetch allowlisted for every domain, writes outside the project |
| `mcp` | plaintext HTTP servers, unpinned `npx -y` packages, credentials inlined in `env` |

```sh
ecc scan                       # whole project, exits 1 on high or critical
ecc scan .claude --fail-on medium
ecc scan --json                # for CI
```

Findings are redacted before printing — a leaked key is never echoed in full.
False positives are suppressed two ways: a `# ecc-ignore` marker on the line, or
path fragments listed in a `.eccignore` file at the scan root.

### 🔄 Multi-tool support

One catalog, four projections:

| Target | Writes |
|---|---|
| `claude-code` | `.claude/skills/<name>/SKILL.md`, `.claude/agents/<name>.md`, `CLAUDE.md` |
| `codex` | a single composed `AGENTS.md` |
| `cursor` | `.cursor/rules/*.mdc`, plus an always-applied memory rule |
| `opencode` | `.opencode/agent/*.md`, `.opencode/AGENTS.md` |

Every projection carries the current memory pack and the active instincts, so
"what the project knows" is the same on every tool. Adding a target is one file
implementing `Adapter`.

## CLI

```
ecc init                          Create .ecc/ state for this project
ecc install <target> [--dry-run]  Project the catalog into an agent tool
ecc skills list|search|show       Browse the skill catalog
ecc agents list|show              Browse the agent catalog
ecc memory add <text>             Record a fact (--kind, --scope, --tags)
ecc memory search <query>         Recall matching memories
ecc memory pack [--query]         Print a context pack (--budget)
ecc memory forget <needle>        Drop matching memories
ecc memory compact                Collapse duplicates, drop stale entries
ecc learn [--promote]             Mine session events into instincts (--events)
ecc learn list                    Show the current instincts
ecc learn accept|reject <id>      Curate an instinct before it reaches sessions
ecc scan [path] [--fail-on]       Run AgentShield (--json)
ecc doctor                        Validate the catalog and the installation
ecc stats                         Summarise memory, instincts and catalog size
```

Global flags: `--root <dir>` (default: cwd), `--json`, `--dry-run`.

## Layout

```
src/core/        frontmatter parsing, workspace paths
src/memory/      the memory store and the context pack builder
src/registry/    skill + agent loading, validation, search
src/learning/    instinct extraction, storage, promotion policy
src/security/    AgentShield rules and scanner
src/adapters/    per-tool projections
skills/          the shipped skill catalog
agents/          the shipped agent catalog
test/            vitest suites for every module
```

## Development

```sh
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsc
npm run ecc -- doctor
```

The test suite includes a self-scan: AgentShield must find nothing at or above
`high` severity in this repository. Adding a skill that tells an agent to bypass
its guardrails will fail CI, which is the intended behaviour.

## Contributing a skill

1. Add `skills/<name>.md` with the frontmatter fields above.
2. Write a description precise enough that an agent knows *when* to reach for it —
   this is what routing keys on.
3. Keep the body imperative and specific. Include what not to do; that is usually
   where the value is.
4. Run `npm test` — the catalog validation and the self-scan both gate it.

## License

MIT. See [LICENSE](LICENSE).
