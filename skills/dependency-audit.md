---
name: dependency-audit
description: Assess third-party packages for supply-chain and licence risk before adding them and when advisories land.
category: security
tags: [security, dependencies, supply-chain]
maturity: stable
tools: [Bash, Read]
---

## Before adding a package

- Is it needed at all, or is it twelve lines you could own?
- Maintenance: last release, open critical issues, single maintainer?
- Install footprint: how many transitive dependencies come with it?
- Does it run a postinstall script? That script executes on every developer machine.
- Licence compatible with this project's?

## On an advisory

1. Confirm the vulnerable code path is actually reachable from this project.
2. Upgrade to the patched version; if none exists, look for the maintainer's
   workaround before forking.
3. If you must suppress, record the advisory id, the reason, and an expiry date.

## Pin everything

Unpinned versions in agent configuration are the sharp edge: an MCP server started
with `npx -y pkg` fetches whatever was published last. Pin an exact version.
