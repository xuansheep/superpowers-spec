---
name: setup
description: Use when an older prompt, test, or workflow still refers to setup while initializing or conservatively refreshing project-specific spec documents under .agents/spec.
---

# Setup (Legacy Alias)

`setup` is the legacy compatibility alias for [`spec-init`](../spec-init/SKILL.md).

## Use This Alias Only When Needed

- Existing prompts, tests, or automation still say `setup`
- You need backward compatibility while migrating to `spec-init`

## Default Rule

- Prefer `spec-init` in all new prompts, docs, and examples.
- The behavior and scripts are the same as `spec-init`; this alias only preserves older entrypoints.

## Commands

- `node ~/.agents/skills/superpowers/spec-init/scripts/create-spec-tree.mjs`
- `node ~/.agents/skills/superpowers/spec-init/scripts/fill-spec.mjs`

## Compatibility Contract

- Old imports under `skills/setup/scripts/` re-export the `skills/spec-init/scripts/` implementation.
- If you touch behavior, update `spec-init` first and keep this alias in sync.
