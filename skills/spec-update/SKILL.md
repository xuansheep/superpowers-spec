---
name: spec-update
description: Use when a repository already has docs/project-spec files and those existing spec files need a conservative update plan from repository evidence and committed git changes before any approved spec update is applied.
---

# Plan Existing Project Spec Updates

Inspect existing files under `docs/project-spec`, gather evidence, and produce a conservative update plan for user review before any spec file is changed.

## Core Rule

No approved plan, no update. `spec-update` must check whether `docs/project-spec` exists first, read the existing spec files, gather qualifying committed git changes, and stop after emitting an update plan. It must not modify spec files during the planning command.

## Behavior Contract

- The first step is checking whether `docs/project-spec` exists.
- If `docs/project-spec` does not exist, `spec-update` must stop and report that no update plan can be generated from this workflow.
- `spec-update` reads the existing spec files under `docs/project-spec/*` before proposing changes.
- `spec-update` validates whether a conservative update is actually warranted from repository evidence; it does not assume that every existing file needs refresh.
- `spec-update` uses the earliest update time among existing spec files as the git evidence lower bound.
- `spec-update` queries committed git changes that fall within that time window and treats them as an update information source.
- `spec-update` continues the normal repository evidence scan after collecting git evidence.
- `spec-update` must output an update plan for user review before any update is applied.
- The `spec-update` CLI is plan-only. Applying the update is a separate approved step.

## When to Use

- `docs/project-spec` already exists and you want to determine whether existing spec files need refresh
- You want committed git changes since the relevant spec update window to be part of the review context
- You want a dedicated reviewable update plan before any spec file is changed
- You need the conservative update workflow without entering `spec-init` interactive mode

## When Not to Use

- The repository does not have `docs/project-spec` yet
- You need to initialize the spec tree
- You need to overwrite the managed spec set end-to-end

Use `spec-init` for initialization or overwrite workflows.

## Workflow

1. Check whether `docs/project-spec` exists.
2. If `docs/project-spec` exists, recursively read the existing spec files under `docs/project-spec/*`.
3. Inspect those existing spec files and current repository evidence to determine whether conservative updates are warranted.
4. Find the earliest update time among the existing spec files.
5. Query committed git changes from that time forward and collect the qualifying change content as update evidence.
6. Continue the normal repository scan: `AGENTS.md`, `CLAUDE.md`, `README.md`, hook files, relevant skills, tests, code, and configuration.
7. Produce a reviewable update plan that includes:
   - whether `docs/project-spec` exists
   - which existing spec files were considered
   - the spec time window used for git evidence
   - the committed git changes collected for review
   - which spec files and headings appear update-worthy
   - which files have insufficient evidence and should remain untouched
8. Stop after writing the update plan. Do not apply changes from this command.
9. Only after the user reviews and approves the plan may the internal apply step execute the conservative update.

## Output Expectations

- The planning command should report `Mode: update-plan`.
- The planning summary should explicitly say whether `docs/project-spec` was found.
- The planning summary should list the number of committed git changes gathered when git evidence is available.
- The planning summary should report when git evidence is unavailable instead of pretending it exists.
- The planning summary should list proposed file and heading updates when any are detected.
- The planning summary should clearly state that approval is required before applying updates.
- The planning command must not prompt for backend template selection.
- The planning command must not modify `docs/project-spec`.
- The planning command must not create missing spec files or section structure.

## Commands

- Plan only:
  - `node ~/.agents/skills/superpowers/spec-update/scripts/update-spec.mjs`

## Red Flags

- Skipping the `docs/project-spec` existence check
- Treating `spec-update` like a direct write command
- Ignoring existing spec file timestamps when collecting git evidence
- Reading git evidence but failing to include it in the review plan
- Updating files before the user has reviewed the plan
- Creating `docs/project-spec` from `spec-update`
- Creating missing spec files or headings from `spec-update`
- Replacing user-authored content without the conservative update rules allowing it
- Writing generic best practices that are not supported by repository evidence
