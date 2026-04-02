---
name: setup
description: Use when initializing project-specific spec documents under .agents/spec from the current repository''s real conventions, structure, and code examples; repeated calls must stay non-destructive and skip files that already exist.
---

# Setup Project Specs

Initialize missing files under `.agents/spec` from checked-in evidence.

## Core Rule

Do not invent conventions. Read the repo, extract repeatable patterns, and write only what the current project can actually support.

## Behavior Contract

- `setup` is an initialization workflow, not a refresh/overwrite workflow.
- If a target spec file already exists, leave it untouched.
- If only some files are missing, create and populate only the missing files.

## When to Use

- Starting a repository that does not yet have `.agents/spec/`
- Backfilling missing spec files after a partial or interrupted setup
- Preparing project-specific specs before other review or planning workflows depend on them

## Workflow

1. Read the highest-signal sources first: `AGENTS.md`, `CLAUDE.md`, `README.md`, existing hook files, skill files, and relevant tests.
2. Create the full spec tree skeleton:
   - `node ./scripts/setup-spec/create-spec-tree.mjs`
3. Populate only missing spec files from repository evidence:
   - `node ./scripts/setup-spec/fill-spec.mjs`
4. Review the generated summaries in:
   - `.agents/spec/backend/index.md`
   - `.agents/spec/frontend/index.md`
   - `.agents/spec/guides/index.md`
5. If evidence is missing for a layer, say so explicitly in the spec instead of fabricating policy.

## Output Expectations

- `backend/` should describe hooks, scripts, prompts, and other automation/runtime behavior.
- `frontend/` should describe browser-facing assets only when the repository actually has them.
- `guides/` should capture decision rules that help future implementation and review work stay consistent.

## Red Flags

- Overwriting a human-edited spec file during a repeat run
- Writing “best practices” that the current repository does not follow
- Pretending the repo has a framework or persistence layer that is not present
- Skipping examples and source references
- Replacing project-specific voice with generic process fluff
