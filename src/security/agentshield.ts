import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { RULES, type Rule, type ScanCategory, type Severity } from "./rules.js";

export interface Finding {
  ruleId: string;
  category: ScanCategory;
  severity: Severity;
  title: string;
  file: string;
  line: number;
  evidence: string;
  remediation: string;
}

export interface ScanTarget {
  file: string;
  content: string;
}

export interface ScanOptions {
  categories?: ScanCategory[];
  /** Findings at or above this severity make `ecc scan` exit non-zero. */
  failOn?: Severity;
}

const SEVERITY_ORDER: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

/** Which categories are meaningful for a given file. */
export function categoriesForFile(file: string): ScanCategory[] {
  const name = basename(file).toLowerCase();
  const categories: ScanCategory[] = ["secrets"];
  if (name.endsWith(".md")) categories.push("prompts");
  if (name.includes("mcp") && name.endsWith(".json")) categories.push("mcp");
  if (name.startsWith("settings") && name.endsWith(".json")) {
    categories.push("hooks", "permissions", "mcp");
  }
  if (name === "config.json" || name === "claude_desktop_config.json") {
    categories.push("hooks", "permissions", "mcp");
  }
  return categories;
}

function truncate(text: string, max = 160): string {
  const clean = text.trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** Mask anything that looks like a live credential before it is printed. */
export function redact(text: string): string {
  return text
    .replace(/\b(AKIA[0-9A-Z]{4})[0-9A-Z]{12}\b/g, "$1************")
    .replace(/\b(gh[pousr]_[A-Za-z0-9]{4})[A-Za-z0-9]{16,}\b/g, "$1****************")
    .replace(/\b(sk-ant-[A-Za-z0-9_-]{4})[A-Za-z0-9_-]{12,}/g, "$1************")
    .replace(/\b(xox[baprs]-[A-Za-z0-9-]{4})[A-Za-z0-9-]{6,}/g, "$1******")
    .replace(
      /(\b(?:api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*["'])[^"']{12,}(["'])/gi,
      "$1********$2",
    );
}

/** A line carrying this marker is skipped — for fixtures and known-safe samples. */
export const IGNORE_MARKER = "ecc-ignore";

export function scanContent(target: ScanTarget, options: ScanOptions = {}): Finding[] {
  const allowed = options.categories ?? categoriesForFile(target.file);
  const applicable = RULES.filter((rule) => allowed.includes(rule.category));
  const findings: Finding[] = [];
  const lines = target.content.split("\n");

  for (const rule of applicable) {
    // Multi-line JSON is common in settings files, so hook/mcp rules also get a
    // whole-file pass; line numbers stay best-effort in that case.
    const spansLines = rule.category === "hooks" || rule.category === "mcp";
    lines.forEach((line, index) => {
      if (line.includes(IGNORE_MARKER)) return;
      if (matches(rule, line)) {
        findings.push(toFinding(rule, target.file, index + 1, line));
      }
    });
    if (spansLines && !findings.some((f) => f.ruleId === rule.id && f.file === target.file)) {
      const flat = lines
        .filter((line) => !line.includes(IGNORE_MARKER))
        .join(" ")
        .replace(/\s+/g, " ");
      if (matches(rule, flat)) {
        findings.push(toFinding(rule, target.file, 1, firstMatchingLine(rule, lines) ?? flat));
      }
    }
  }

  return findings;
}

function matches(rule: Rule, text: string): boolean {
  if (!rule.pattern.test(text)) return false;
  if (rule.ignore && rule.ignore.test(text)) return false;
  return true;
}

function firstMatchingLine(rule: Rule, lines: string[]): string | undefined {
  const keyword = rule.category === "hooks" ? "command" : "url";
  return lines.find((line) => line.includes(keyword));
}

function toFinding(rule: Rule, file: string, line: number, evidence: string): Finding {
  return {
    ruleId: rule.id,
    category: rule.category,
    severity: rule.severity,
    title: rule.title,
    file,
    line,
    evidence: redact(truncate(evidence)),
    remediation: rule.remediation,
  };
}

const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "coverage", ".next", ".venv", "__pycache__",
]);

const SCANNABLE = /\.(md|mdc|json|jsonc|ya?ml|toml|sh|bash|zsh|ts|js|mjs|cjs|py)$/i;

/**
 * Read `.eccignore`: one path fragment per line, `#` for comments. A file whose
 * repo-relative path contains any fragment is not scanned.
 */
export function readIgnorePatterns(root: string): string[] {
  const file = join(root, ".eccignore");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
}

export function isIgnored(relativePath: string, patterns: string[]): boolean {
  const normalized = relativePath.split("\\").join("/");
  return patterns.some((pattern) => normalized.includes(pattern.replace(/^\.\//, "")));
}

export function collectTargets(root: string, maxBytes = 512_000): ScanTarget[] {
  const targets: ScanTarget[] = [];
  const ignore = readIgnorePatterns(root);
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries.sort()) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      let info;
      try {
        info = statSync(full);
      } catch {
        continue;
      }
      if (info.isDirectory()) {
        walk(full);
      } else if (SCANNABLE.test(name) && info.size <= maxBytes) {
        const relativePath = relative(root, full) || name;
        if (isIgnored(relativePath, ignore)) continue;
        targets.push({ file: relativePath, content: readFileSync(full, "utf8") });
      }
    }
  };
  if (existsSync(root)) walk(root);
  return targets;
}

export interface ScanReport {
  findings: Finding[];
  filesScanned: number;
  counts: Record<Severity, number>;
  passed: boolean;
}

export function scanTree(root: string, options: ScanOptions = {}): ScanReport {
  return scanTargets(collectTargets(root), options);
}

export function scanTargets(targets: ScanTarget[], options: ScanOptions = {}): ScanReport {
  const findings = targets.flatMap((target) => scanContent(target, options));
  findings.sort(
    (a, b) =>
      SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
      a.file.localeCompare(b.file) ||
      a.line - b.line,
  );

  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) counts[finding.severity] += 1;

  const threshold = SEVERITY_ORDER[options.failOn ?? "high"];
  const passed = !findings.some((finding) => SEVERITY_ORDER[finding.severity] >= threshold);
  return { findings, filesScanned: targets.length, counts, passed };
}

export function formatReport(report: ScanReport): string {
  const lines: string[] = [];
  lines.push(`AgentShield — ${report.filesScanned} file(s) scanned, ${report.findings.length} finding(s)`);
  lines.push(
    `  critical ${report.counts.critical}  high ${report.counts.high}  medium ${report.counts.medium}  low ${report.counts.low}`,
  );
  if (report.findings.length > 0) lines.push("");
  for (const finding of report.findings) {
    lines.push(`[${finding.severity.toUpperCase()}] ${finding.ruleId} ${finding.title}`);
    lines.push(`  ${finding.file}:${finding.line}`);
    lines.push(`  ${finding.evidence}`);
    lines.push(`  fix: ${finding.remediation}`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
