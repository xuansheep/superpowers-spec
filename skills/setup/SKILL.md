---
name: setup
description: Use when initializing or conservatively refreshing project-specific spec documents under .agents/spec from the current repository''s real conventions, structure, and code examples.
---

# Setup Project Specs

Initialize, overwrite, or conservatively update files under `.agents/spec` from checked-in evidence.

## Core Rule

Do not invent conventions. Read the repo, extract repeatable patterns, and write only what the current project can actually support.

## Behavior Contract

- `setup` supports three modes: `initialize`, `overwrite`, and `update`.
- If `.agents/spec` has no files yet, initialize directly.
- If `.agents/spec` already has files, ask whether to `overwrite` or `update`.
- In `update` mode, do not create new files. Only补充或修正当前文件里已经存在的标题内容，并以事实代码为依据。
- Frontend and guides keep their current generation logic.

## Backend Template Choice

When `backend/` will be initialized or overwritten, ask which backend template to use:

1. `custom`
   - use `template/backend/custom`
   - keep the template outline
   - fill content conservatively from repository facts and existing project conventions
2. `java`
   - use `template/backend/java`
   - copy the template content directly for backend files
   - only `directory-structure.md` should be filled from project facts

## When to Use

- Starting a repository that does not yet have `.agents/spec/`
- Backfilling missing spec files after a partial or interrupted setup
- Refreshing existing spec files when repo reality has moved
- Conservatively updating historical spec files without wiping human-authored conventions

## Workflow

1. Read the highest-signal sources first: `AGENTS.md`, `CLAUDE.md`, `README.md`, existing hook files, skill files, and relevant tests.
2. Create the full spec tree skeleton when files are missing:
   - `node ~/.agents/skills/superpowers/setup/scripts/create-spec-tree.mjs`
3. Run the interactive fill flow:
   - `node ~/.agents/skills/superpowers/setup/scripts/fill-spec.mjs`
4. If spec files already exist, choose one:
   - `overwrite`: rewrite the managed spec files end-to-end
   - `update`: preserve existing files and update only the content under headings that already exist
5. Review the generated summaries in:
   - `.agents/spec/backend/index.md`
   - `.agents/spec/frontend/index.md`
   - `.agents/spec/guides/index.md`
6. If evidence is missing for a layer, say so explicitly in the spec instead of fabricating policy.

## Output Expectations

- `backend/` should use one of the supported backend templates and reflect actual repository evidence.
- `frontend/` should describe browser-facing assets only when the repository actually has them.
- `guides/` should capture decision rules that help future implementation and review work stay consistent.

## Red Flags

- Overwriting a human-edited spec file without the user explicitly choosing `overwrite`
- Letting `update` create new files or new section structure
- Writing “best practices” that the current repository does not follow
- Pretending the repo has a framework or persistence layer that is not present
- Skipping examples and source references
- Replacing project-specific voice with generic process fluff
