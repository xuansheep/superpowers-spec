---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch superpowers:code-reviewer subagent to catch issues before they cascade. Before dispatching, load the project's existing spec indexes so review checks project rules, not just the diff. The reviewer gets precisely crafted context for evaluation - never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development.
- After completing major feature.
- Before merge to main.

**Optional but valuable:**
- When stuck (fresh perspective).
- Before refactoring (baseline check).
- After fixing complex bug.

## How to Request

**1. Load project rules:**
- **REQUIRED SUB-SKILL:** Use superpowers:reading-spec.
- Carry forward `PROJECT_SPEC_INDEXES_FOUND` and `PROJECT_RULES_SUMMARY` into the reviewer request.

**2. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**3. Dispatch code-reviewer subagent:**

Use Task tool with superpowers:code-reviewer type, fill template at `skills/requesting-code-review/code-reviewer.md`.

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built.
- `{PLAN_OR_REQUIREMENTS}` - What it should do.
- `{PLAN_REFERENCE}` - The concrete plan text, task, or requirements excerpt under review.
- `{BASE_SHA}` - Starting commit.
- `{HEAD_SHA}` - Ending commit.
- `{DESCRIPTION}` - Brief summary.
- `{PROJECT_SPEC_INDEXES_FOUND}` - Output from `superpowers:reading-spec`.
- `{PROJECT_RULES_SUMMARY}` - Output from `superpowers:reading-spec`.

**4. Act on feedback:**
- Fix Critical issues immediately.
- Fix Important issues before proceeding.
- Note Minor issues for later.
- Push back if reviewer is wrong (with reasoning).

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

[Use superpowers:reading-spec]
  PROJECT_SPEC_INDEXES_FOUND:
    - .agents/spec/guides/index.md
    - .agents/spec/backend/index.md
  PROJECT_RULES_SUMMARY:
    - Search existing skills, hooks, prompts, and docs before adding structure
    - Keep core changes harness-focused and general-purpose
    - Preserve tuned prompting language unless there is evidence to change it

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Dispatch superpowers:code-reviewer subagent]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
  PLAN_REFERENCE: Task 2 from docs/superpowers/plans/deployment-plan.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types
  PROJECT_SPEC_INDEXES_FOUND:
    - .agents/spec/guides/index.md
    - .agents/spec/backend/index.md
  PROJECT_RULES_SUMMARY:
    - Search existing skills, hooks, prompts, and docs before adding structure
    - Keep core changes harness-focused and general-purpose
    - Preserve tuned prompting language unless there is evidence to change it

[Subagent returns]:
  Strengths: Clean architecture, real tests
  Issues:
    Important: Missing progress indicators
    Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task.
- Catch issues before they compound.
- Fix before moving to next task.

**Executing Plans:**
- Load project rules before execution.
- Review after each batch (3 tasks).
- Get feedback, apply, continue.

**Ad-Hoc Development:**
- Review before merge.
- Review when stuck.

## Red Flags

**Never:**
- Skip review because "it's simple".
- Skip loading project rules before dispatching review.
- Pretend project rules were reviewed when no index was checked.
- Ignore Critical issues.
- Proceed with unfixed Important issues.
- Argue with valid technical feedback.

**If reviewer wrong:**
- Push back with technical reasoning.
- Show code/tests that prove it works.
- Request clarification.

See template at: `skills/requesting-code-review/code-reviewer.md`
