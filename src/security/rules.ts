export type Severity = "critical" | "high" | "medium" | "low";

export type ScanCategory = "secrets" | "prompts" | "hooks" | "permissions" | "mcp";

export interface Rule {
  id: string;
  category: ScanCategory;
  severity: Severity;
  title: string;
  pattern: RegExp;
  remediation: string;
  /** Lines matching this are ignored (placeholders, docs, examples). */
  ignore?: RegExp;
}

const PLACEHOLDER =
  /(process\.env|\$\{?[A-Z_]+\}?|<[^>]+>|xxxx|example|placeholder|redacted|changeme|your[-_]?key|\.\.\.)/i;

export const RULES: Rule[] = [
  // ---- secrets -------------------------------------------------------------
  {
    id: "SEC001",
    category: "secrets",
    severity: "critical",
    title: "AWS access key id committed",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
    remediation: "Revoke the key, move it to the environment, and purge it from git history.",
  },
  {
    id: "SEC002",
    category: "secrets",
    severity: "critical",
    title: "GitHub token committed",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    remediation: "Revoke the token in GitHub settings and read it from the environment instead.",
  },
  {
    id: "SEC003",
    category: "secrets",
    severity: "critical",
    title: "Anthropic API key committed",
    pattern: /\bsk-ant-[A-Za-z0-9_-]{16,}/,
    remediation: "Revoke the key in the Anthropic console and load it from ANTHROPIC_API_KEY.",
  },
  {
    id: "SEC004",
    category: "secrets",
    severity: "critical",
    title: "Private key material committed",
    pattern: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
    remediation: "Rotate the key pair and keep private keys outside the repository.",
  },
  {
    id: "SEC005",
    category: "secrets",
    severity: "high",
    title: "Slack token committed",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
    remediation: "Revoke the Slack token and store it in the environment.",
  },
  {
    id: "SEC006",
    category: "secrets",
    severity: "high",
    title: "Hardcoded credential assignment",
    pattern: /\b(api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*["'][^"'\s]{12,}["']/i,
    remediation: "Replace the literal with an environment lookup and rotate the value.",
    ignore: PLACEHOLDER,
  },

  // ---- prompt / instruction files -----------------------------------------
  {
    id: "PI001",
    category: "prompts",
    severity: "critical",
    title: "Instruction override injected into a prompt file",
    pattern: /ignore\s+(all\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions|rules|prompts)/i,
    remediation: "Remove the override. Skill and agent files must not restate the harness rules.",
  },
  {
    id: "PI002",
    category: "prompts",
    severity: "critical",
    title: "Credential exfiltration pattern",
    pattern: /\b(cat|cp|curl|scp|tar)\s[^\n]*(~\/\.ssh|~\/\.aws|\.env\b|id_rsa|credentials)/i,
    remediation: "Delete the instruction; no skill should read or ship local credential files.",
  },
  {
    id: "PI003",
    category: "prompts",
    severity: "high",
    title: "Remote script piped into a shell",
    pattern: /\b(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|)sh\b/i,
    remediation: "Download, pin by checksum, review, then execute — never pipe straight to a shell.",
  },
  {
    id: "PI004",
    category: "prompts",
    severity: "high",
    title: "Prompt disables human confirmation",
    pattern: /\b(without (asking|confirmation|permission)|do not ask (for )?(permission|the user)|bypass(ing)? (the )?(permission|approval))/i,
    remediation: "Let the harness decide what needs approval; a skill must not opt out of it.",
  },
  {
    id: "PI005",
    category: "prompts",
    severity: "medium",
    title: "Obfuscated payload decoded and executed",
    pattern: /base64\s+(-d|--decode)[^\n]*\|\s*(ba|z|)sh\b/i,
    remediation: "Inline the real command so a reviewer can read what will run.",
  },

  // ---- hooks ---------------------------------------------------------------
  {
    id: "HOOK001",
    category: "hooks",
    severity: "critical",
    title: "Hook fetches and runs remote code",
    pattern: /"command"\s*:\s*"[^"]*(curl|wget)[^"]*\|[^"]*sh/i,
    remediation: "Vendor the script into the repo and run it from a fixed path.",
  },
  {
    id: "HOOK002",
    category: "hooks",
    severity: "high",
    title: "Destructive command in a hook",
    pattern: /"command"\s*:\s*"[^"]*(rm\s+-rf\s+[^"]*|git\s+push\s+--force|chmod\s+777)/i,
    remediation: "Hooks run unattended on every matching event — keep them non-destructive.",
  },
  {
    id: "HOOK003",
    category: "hooks",
    severity: "medium",
    title: "Hook evaluates a dynamic string",
    pattern: /"command"\s*:\s*"[^"]*eval\s/i,
    remediation: "Replace `eval` with the concrete command you intend to run.",
  },
  {
    id: "HOOK004",
    category: "hooks",
    severity: "medium",
    title: "Hook prints the environment",
    pattern: /"command"\s*:\s*"[^"]*\b(env|printenv|set)\b[^"]*(>|\||curl)/i,
    remediation: "Do not pipe the environment anywhere; it carries every secret in the session.",
  },

  // ---- permissions ---------------------------------------------------------
  {
    id: "PERM001",
    category: "permissions",
    severity: "critical",
    title: "Permission prompts disabled by default",
    pattern: /"(defaultMode|permissionMode)"\s*:\s*"(bypassPermissions|dontAsk)"/,
    remediation: "Use `acceptEdits` or `default` and allowlist the specific commands you trust.",
  },
  {
    id: "PERM002",
    category: "permissions",
    severity: "high",
    title: "Unrestricted shell access allowlisted",
    pattern: /"Bash\((\*|:\*)\)"/,
    remediation: "Allowlist concrete prefixes such as `Bash(npm test:*)` instead of every command.",
  },
  {
    id: "PERM003",
    category: "permissions",
    severity: "medium",
    title: "Network fetch allowlisted for every domain",
    pattern: /"WebFetch\(domain:\*\)"/,
    remediation: "List the domains the agent actually needs.",
  },
  {
    id: "PERM004",
    category: "permissions",
    severity: "medium",
    title: "Write access allowlisted outside the project",
    pattern: /"(Write|Edit)\((\/|~)[^)]*\)"/,
    remediation: "Keep write permissions scoped to paths inside the repository.",
  },

  // ---- mcp -----------------------------------------------------------------
  {
    id: "MCP001",
    category: "mcp",
    severity: "high",
    title: "MCP server reached over plaintext HTTP",
    pattern: /"(url|endpoint)"\s*:\s*"http:\/\/(?!localhost|127\.0\.0\.1)/i,
    remediation: "Use https:// so tool traffic and credentials are not readable in transit.",
  },
  {
    id: "MCP002",
    category: "mcp",
    severity: "medium",
    title: "MCP server launched from an unpinned package",
    pattern: /"(command|args)"[^\n]*npx[^\n]*-y/i,
    remediation: "Pin an exact version (`pkg@1.2.3`) so a compromised release cannot roll in silently.",
  },
  {
    id: "MCP003",
    category: "mcp",
    severity: "critical",
    title: "MCP server config carries a literal credential",
    pattern: /"env"\s*:\s*\{[^}]*"[A-Z_]*(KEY|TOKEN|SECRET)"\s*:\s*"[^"$<{][^"]{11,}"/,
    remediation: "Reference the variable (`${MY_TOKEN}`) rather than inlining its value.",
  },
];

export function rulesFor(categories: ScanCategory[]): Rule[] {
  return RULES.filter((rule) => categories.includes(rule.category));
}
