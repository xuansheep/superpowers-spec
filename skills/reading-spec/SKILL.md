---
name: reading-spec
description: Use when a workflow needs repository-specific rules from docs/project-spec before planning, implementation, or review.
---

# Reading Spec

Load checked-in spec indexes before acting on project work.

## Core Rule

Read only what exists, summarize only what you actually saw, and never invent repository rules.

## Candidate Files

Check these paths in order:
- `docs/project-spec/guides/index.md`
- `docs/project-spec/backend/index.md`
- `docs/project-spec/frontend/index.md`

## Workflow

1. Check whether each candidate file exists.
2. Read only the index files that actually exist.
3. Start with `docs/project-spec/guides/index.md` when it exists.
4. If task scope is unclear, read every existing index under `docs/project-spec/`.
5. Produce these outputs:
   - `PROJECT_SPEC_INDEXES_FOUND`
   - `PROJECT_RULES_SUMMARY`
6. If no index exists, set:
   - `PROJECT_SPEC_INDEXES_FOUND: none`
   - `PROJECT_RULES_SUMMARY: No project spec index files were present under docs/project-spec/.`
7. If an index clearly points to a deeper rule file that is obviously relevant to the current task, read that file before continuing.

## Output Contract

**`PROJECT_SPEC_INDEXES_FOUND`**
- List only files that were actually read.
- Use `none` when no index file exists.

**`PROJECT_RULES_SUMMARY`**
- Keep it short and task-relevant.
- Derive every bullet from the files you actually read.
- If spec coverage is partial, say so explicitly.

## Red Flags

- Assuming all three index files exist.
- Skipping the existence check.
- Claiming repository rules were reviewed when no index was read.
- Inventing conventions that are not present in checked-in files.
- Ignoring a clearly relevant deeper rule file linked from an index.

## Integration

**Common callers:**
- `superpowers:executing-plans`
- `superpowers:requesting-code-review`
