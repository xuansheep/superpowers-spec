# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable).

**Only dispatch after spec compliance review passes.**

```
Task tool (superpowers:code-reviewer):
  Use template at skills/requesting-code-review/code-reviewer.md

  WHAT_WAS_IMPLEMENTED: [from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  PLAN_REFERENCE: [full task text or focused task excerpt]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
  DESCRIPTION: [task summary]
  PROJECT_SPEC_INDEXES_FOUND: [output from superpowers:reading-spec]
  PROJECT_RULES_SUMMARY: [output from superpowers:reading-spec]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes - focus on what this change contributed.)
- Does the implementation respect the applicable project rules summary in addition to the task requirements?

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
