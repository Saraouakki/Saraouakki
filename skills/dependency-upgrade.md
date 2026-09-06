---
name: dependency-upgrade
description: Upgrade a dependency safely — read the changelog for breaking changes, upgrade in isolation, and verify with the suite before moving on.
category: engineering
tags: [dependencies, maintenance, risk]
maturity: stable
tools: [Bash, Read, Edit]
---

## Procedure

1. Upgrade **one** dependency per commit. A batch upgrade that breaks the build
   tells you nothing about which package did it.
2. Read the changelog between the installed version and the target, looking
   specifically for the word "breaking", removed exports, and default changes.
3. Update the lockfile with the project's own tooling; never hand-edit it.
4. Run the full suite plus a build. Type errors after an upgrade are the cheap
   signal — runtime behaviour changes are the expensive one, so also check any
   place the library's defaults are relied on.
5. Note the upgrade in the commit body with the version range and the reason.

## Risk flags

- A major version bump with no migration guide
- A package that changed maintainer or repository recently
- Postinstall scripts added between versions
- Transitive dependencies that jumped several majors at once
