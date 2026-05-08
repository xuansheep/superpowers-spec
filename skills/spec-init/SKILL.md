---
name: spec-init
description: Use when initializing or conservatively refreshing project-specific spec documents under docs/project-spec from the current repository''s real conventions, structure, and code examples.
---

# Initialize Project Specs

Initialize, overwrite, or conservatively refresh files under `docs/project-spec` from checked-in evidence.

## Core Rule

Do not invent conventions. Read the repo, extract repeatable patterns, and write only what the current project can actually support.

## Behavior Contract

- `spec-init` supports three modes: `initialize`, `overwrite`, and `update`.
- `setup` remains available as a legacy alias, but new prompts and docs should use `spec-init`.
- If `docs/project-spec` has no files yet, initialize directly.
- If `docs/project-spec` already has files, ask whether to `overwrite` or `update`.
- In `update` mode, do not create new files. Refresh only content under headings that already exist, and keep the result grounded in repository facts.
- The complete `update` workflow now lives in `spec-update`: it checks `docs/project-spec` first, gathers committed git changes from the relevant spec time window, emits an update plan for review, and only applies changes after explicit approval.
- In `initialize` and `overwrite` mode, backend generation must follow the selected backend template flow instead of mixing custom extraction and direct template copy.
- Frontend and guides keep their current generation logic.

## Backend Template Choice

When `backend/` will be initialized or overwritten, ask which backend template to use:

1. `custom`
   - use `template/backend/custom`
   - keep the template outline for each backend spec file
   - follow the workflow sequence strictly: extract the writing guidance from each custom template file, scan the repository against every guidance item, capture evidence, and then write repository-backed normative statements into the matching spec file
2. `java`
   - use `template/backend/java`
   - copy the selected template content directly into the corresponding backend spec files
   - only files that the template explicitly allows to be filled from project facts, such as `directory-structure.md`, should receive fact-based additions

## When to Use

- Starting a repository that does not yet have `docs/project-spec/`
- Backfilling missing spec files after a partial or interrupted spec bootstrap
- Refreshing existing spec files when repo reality has moved and you want the general entrypoint
- Conservatively updating historical spec files without wiping human-authored conventions
- Migrating older `setup` prompts to the formal `spec-init` name

Use `spec-update` when the task is specifically to review and update existing spec files through the approval-first workflow.

## Workflow

1. Read the highest-signal sources first: `AGENTS.md`, `CLAUDE.md`, `README.md`, existing hook files, skill files, and relevant tests.
2. Create the full spec tree skeleton when files are missing:
   - `node ~/.agents/skills/superpowers/spec-init/scripts/create-spec-tree.mjs`
3. Run the interactive fill flow:
   - `node ~/.agents/skills/superpowers/spec-init/scripts/fill-spec.mjs`
4. If spec files already exist, choose one:
   - `overwrite`: rewrite the managed spec files end-to-end
   - `update`: preserve existing files and update only the content under headings that already exist
5. Review the generated summaries in:
   - `docs/project-spec/backend/index.md`
   - `docs/project-spec/frontend/index.md`
   - `docs/project-spec/guides/index.md`
6. If evidence is missing for a layer, say so explicitly in the spec instead of fabricating policy.
7. When `initialize` or `overwrite` runs on `backend/`, follow the selected backend template sequence exactly. Do not skip, merge, or reorder steps.
8. When the task is specifically `update`, prefer the dedicated skill and planning command:
   - `spec-update`
   - `node ~/.agents/skills/superpowers/spec-update/scripts/update-spec.mjs`
9. For `spec-update`, the command stops after emitting an update plan. Actual update execution happens only after the user reviews and approves that plan.

   If the selected template is `custom`:
   1. List every file under `template/backend/custom` that maps to a backend spec file.
   2. For each `custom` template file, read the template body carefully and extract every writing guidance item, heading requirement, and placeholder statement(Content of the label `>`) that defines what evidence must be collected.
   3. Turn those extracted guidance items into a scan checklist for the matching target file under `docs/project-spec/backend` so each required rule can be verified separately.
   4. Scan the repository in detail against that checklist. Check real code, directories, configuration, tests, documentation, and project instructions to find concrete evidence for each guidance item.
   5. Record the evidence before writing any rule. Each rule must be traceable to a real repository signal such as a code pattern, path, naming convention, configuration rule, test pattern, or documented project constraint.
   6. Convert only verified evidence into normative statements for the target spec file. Write rules that describe what the project actually does or clearly expects, not generic best practices.
   7. If a guidance item has no reliable evidence, say that the repository does not provide enough evidence yet. Do not guess, generalize, or silently fill the gap.
   8. Repeat the same extract -> checklist -> scan -> evidence -> normative statement flow for every `custom` backend spec file until all target files are completed.
   9. After all backend files are generated, do a final review to confirm every generated rule can be traced back either to template-defined copy behavior or to repository evidence collected through the required sequence above.

   If the selected template is not `custom`, copy the corresponding template files into `docs/project-spec/backend` first, then apply fact-based additions only to the template-defined exception files.

## Output Expectations

- `backend/` should reflect the selected backend template flow: `custom` keeps the template outline, executes the required extraction-and-scan sequence, and fills the spec with repository-backed normative statements; other templates copy their template content except for explicit fact-filled exceptions.
- `frontend/` should describe browser-facing assets only when the repository actually has them.
- `guides/` should capture decision rules that help future implementation and review work stay consistent.
- `update` should stay conservative and approval-first; use `spec-update` when you need the dedicated update contract.

## Red Flags

- Overwriting a human-edited spec file without the user explicitly choosing `overwrite`
- Letting `update` create new files or new section structure
- Treating `spec-update` like an unreviewed direct write
- Mixing `custom` extraction rules with non-`custom` template copy behavior
- Skipping template guidance extraction, repository evidence capture, or the final traceability review in step 7
- Writing “best practices” that the current repository does not follow
- Pretending the repo has a framework or persistence layer that is not present
- Skipping examples and source references
- Replacing project-specific voice with generic process fluff
