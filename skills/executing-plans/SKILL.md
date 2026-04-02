---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Before reviewing a plan, load the project's existing spec indexes so implementation follows repository rules instead of vibes.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## The Process

### Step 1: Load Project Rules
1. **REQUIRED SUB-SKILL:** Use superpowers:reading-spec.
2. Carry forward `PROJECT_SPEC_INDEXES_FOUND` and `PROJECT_RULES_SUMMARY` into plan review and execution.
3. If project spec indexes conflict with the plan and priority is unclear, stop and ask before implementing.

### Step 2: Load and Review Plan
1. Read plan file.
2. Review critically against both the plan itself and the `PROJECT_RULES_SUMMARY`.
3. Identify any questions, conflicts, or missing steps before starting.
4. If concerns: Raise them with your human partner before starting.
5. If no concerns: Create TodoWrite and proceed.

### Step 3: Execute Tasks

For each task:
1. Mark as in_progress.
2. Follow each step exactly (plan has bite-sized steps).
3. Keep the `PROJECT_RULES_SUMMARY` in scope while implementing and verifying.
4. Run verifications as specified.
5. Mark as completed.

### Step 4: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice.

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear).
- Plan has critical gaps preventing starting.
- Project spec indexes conflict with the plan and the priority is unclear.
- You don't understand an instruction.
- Verification fails repeatedly.

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Steps 1-2) when:**
- Partner updates the plan based on your feedback.
- Fundamental approach needs rethinking.
- New files or task scope reveal a different spec index is relevant.

**Don't force through blockers** - stop and ask.

## Remember
- Load project rules before reviewing the plan.
- Treat indexes as rule entry points, not decoration.
- Review plan critically first.
- Follow plan steps exactly.
- Don't skip verifications.
- Reference skills when plan says to.
- Stop when blocked, don't guess.
- Never start implementation on main/master branch without explicit user consent.

## Integration

**Required workflow skills:**
- **superpowers:reading-spec** - Load repository-specific rules before plan review.
- **superpowers:using-git-worktrees** - REQUIRED: Set up isolated workspace before starting.
- **superpowers:writing-plans** - Creates the plan this skill executes.
- **superpowers:finishing-a-development-branch** - Complete development after all tasks.
