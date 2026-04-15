import fs from 'node:fs/promises';
import path from 'node:path';

export const SPEC_TREE = {
  backend: [
    { file: 'index.md', title: 'Backend Development Guidelines Index' },
    { file: 'directory-structure.md', title: 'Backend Directory Structure' },
    { file: 'database-guidelines.md', title: 'Backend Data and Persistence Guidelines' },
    { file: 'logging-guidelines.md', title: 'Backend Logging Guidelines' },
    { file: 'quality-guidelines.md', title: 'Backend Quality Guidelines' },
    { file: 'error-handling.md', title: 'Backend Error Handling Guidelines' },
  ],
  frontend: [
    { file: 'index.md', title: 'Frontend Development Guidelines Index' },
    { file: 'directory-structure.md', title: 'Frontend Directory Structure' },
    { file: 'type-safety.md', title: 'Frontend Type and Contract Guidelines' },
    { file: 'hook-guidelines.md', title: 'Frontend Hook and Interaction Guidelines' },
    { file: 'component-guidelines.md', title: 'Frontend Component Guidelines' },
    { file: 'quality-guidelines.md', title: 'Frontend Quality Guidelines' },
    { file: 'state-management.md', title: 'Frontend State Management Guidelines' },
  ],
  guides: [
    { file: 'index.md', title: 'Thinking Guides for Superpowers' },
    { file: 'cross-layer-thinking-guide.md', title: 'Cross-Layer Thinking Guide' },
    { file: 'code-reuse-thinking-guide.md', title: 'Code Reuse Thinking Guide' },
  ],
};

const ROOT_SIGNAL_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'README.md',
  'docs/README.codex.md',
  'hooks/session-start',
  'hooks/run-hook.cmd',
  'hooks/hooks.json',
  'hooks/hooks-cursor.json',
  'agents/code-reviewer.md',
  'skills/using-superpowers/SKILL.md',
  'skills/writing-skills/SKILL.md',
  'skills/brainstorming/SKILL.md',
  'skills/brainstorming/scripts/server.cjs',
  'skills/brainstorming/scripts/helper.js',
  'skills/brainstorming/scripts/frame-template.html',
  'tests/skill-triggering/run-test.sh',
  'tests/brainstorm-server/package.json',
  'scripts/bump-version.sh',
];

const FRONTEND_SIGNAL_FILES = [
  'skills/brainstorming/scripts/frame-template.html',
  'skills/brainstorming/scripts/helper.js',
  'skills/brainstorming/scripts/server.cjs',
  'skills/brainstorming/visual-companion.md',
  'tests/brainstorm-server/package.json',
];

const BACKEND_SIGNAL_FILES = [
  'hooks/session-start',
  'hooks/run-hook.cmd',
  'hooks/hooks.json',
  'hooks/hooks-cursor.json',
  'agents/code-reviewer.md',
  'scripts/bump-version.sh',
  'skills/brainstorming/scripts/server.cjs',
];

const GUIDE_SIGNAL_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'skills/using-superpowers/SKILL.md',
  'skills/writing-skills/SKILL.md',
  'skills/executing-plans/SKILL.md',
  'skills/requesting-code-review/SKILL.md',
];

const SPEC_ROOT = path.join('.agents', 'spec');

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(targetPath) {
  if (!(await pathExists(targetPath))) {
    return '';
  }
  return fs.readFile(targetPath, 'utf8');
}

async function listDirectories(targetPath) {
  if (!(await pathExists(targetPath))) {
    return [];
  }
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

async function listFiles(targetPath, relativeBase) {
  if (!(await pathExists(targetPath))) {
    return [];
  }
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.posix.join(relativeBase, entry.name))
    .sort();
}

async function existingPaths(repoRoot, candidates) {
  const existing = [];
  for (const relativePath of candidates) {
    if (await pathExists(path.join(repoRoot, relativePath))) {
      existing.push(relativePath.replace(/\\/g, '/'));
    }
  }
  return existing;
}

function bulletList(items) {
  return items.map((item) => `- \`${item}\``).join('\n');
}

function numberedList(items) {
  return items.map((item, index) => `${index + 1}. \`${item}\``).join('\n');
}

function joinOrFallback(items, fallback) {
  return items.length > 0 ? bulletList(items) : `- ${fallback}`;
}

function pushCoreRule(coreRules, rule, evidence) {
  if (coreRules.some((entry) => entry.rule === rule)) {
    return;
  }

  coreRules.push({ rule, evidence });
}

function collectAgentsRules(agentsContent) {
  const coreRules = [];
  if (!agentsContent) {
    return coreRules;
  }

  if (agentsContent.includes('代码保持精简易懂') || /keep code simple/i.test(agentsContent)) {
    pushCoreRule(
      coreRules,
      'Keep code simple and readable.',
      'AGENTS.md says code should stay simple and understandable.',
    );
  }

  if (agentsContent.includes('reliable-text-reader') && agentsContent.includes('reliable-text-writer')) {
    pushCoreRule(
      coreRules,
      'Use reliable-text-reader and reliable-text-writer for repository file I/O when AGENTS.md requires it.',
      'AGENTS.md requires reliable text skills for file reads and writes.',
    );
  }

  if (agentsContent.includes('.tmp/')) {
    pushCoreRule(
      coreRules,
      'Put temporary task files under `.tmp/`.',
      'AGENTS.md reserves `.tmp/` for temporary task files.',
    );
  }

  if (agentsContent.includes('删除文件') && (agentsContent.includes('询问用户同意') || /user consent/i.test(agentsContent))) {
    pushCoreRule(
      coreRules,
      'Require explicit user consent before deleting files.',
      'AGENTS.md blocks file deletion without user approval.',
    );
  }

  return coreRules;
}

export async function collectRepoFacts(repoRoot) {
  const packageJsonText = await readTextIfExists(path.join(repoRoot, 'package.json'));
  const packageJson = packageJsonText ? JSON.parse(packageJsonText) : {};
  const agentsContent = await readTextIfExists(path.join(repoRoot, 'AGENTS.md'));
  const claudeContent = await readTextIfExists(path.join(repoRoot, 'CLAUDE.md'));
  const readmeContent = await readTextIfExists(path.join(repoRoot, 'README.md'));

  const rootFiles = await existingPaths(repoRoot, ROOT_SIGNAL_FILES);
  const hookFiles = await listFiles(path.join(repoRoot, 'hooks'), 'hooks');
  const agentFiles = await listFiles(path.join(repoRoot, 'agents'), 'agents');
  const skillDirectories = await listDirectories(path.join(repoRoot, 'skills'));
  const frontendSignals = await existingPaths(repoRoot, FRONTEND_SIGNAL_FILES);
  const backendSignals = await existingPaths(repoRoot, BACKEND_SIGNAL_FILES);
  const guideSignals = await existingPaths(repoRoot, GUIDE_SIGNAL_FILES);

  const coreRules = collectAgentsRules(agentsContent);
  if (claudeContent.includes('zero-dependency plugin')) {
    pushCoreRule(
      coreRules,
      'Keep core changes zero-dependency and harness-focused.',
      'CLAUDE.md rejects third-party dependencies in core.',
    );
  }
  if (claudeContent.includes('Domain-specific skills')) {
    pushCoreRule(
      coreRules,
      'Keep core skills general-purpose; domain-specific flows belong in standalone plugins.',
      'CLAUDE.md calls out domain-specific skills as non-core.',
    );
  }
  if (claudeContent.includes('Fabricated content')) {
    pushCoreRule(
      coreRules,
      'Never invent problems, behavior, or evaluation evidence.',
      'CLAUDE.md explicitly rejects fabricated content.',
    );
  }
  if (readmeContent.includes('The agent checks for relevant skills before any task')) {
    pushCoreRule(
      coreRules,
      'Assume skill-first workflows; implementations should support automatic discovery and disciplined use.',
      'README.md states that skill checks are mandatory workflows.',
    );
  }
  pushCoreRule(
    coreRules,
    'Preserve the existing Superpowers voice and rationale tables unless you have evaluation evidence.',
    'CLAUDE.md warns that behavior-shaping skill text is tuned and should not be casually rewritten.',
  );

  return {
    projectName: packageJson.name ?? path.basename(repoRoot),
    packageType: packageJson.type ?? 'unknown',
    rootFiles,
    hookFiles,
    agentFiles,
    skillDirectories,
    frontendSignals,
    backendSignals,
    guideSignals,
    coreRules,
  };
}

function renderBackendIndex(facts) {
  return `# Backend Development Guidelines Index

> **Repository Focus**: session hooks, agent prompts, repository automation, and browser-supporting runtime scripts for Superpowers.

## Current Evidence Sources

${joinOrFallback(facts.backendSignals, 'No backend-specific automation files detected yet.')}

## Documentation Files

| File | Description | When to Read |
| --- | --- | --- |
| [directory-structure.md](./directory-structure.md) | Where hooks, prompts, scripts, and support files belong | Before adding new runtime files |
| [database-guidelines.md](./database-guidelines.md) | File-backed persistence and state expectations in core | Before adding stored state or schema-like data |
| [logging-guidelines.md](./logging-guidelines.md) | Structured output and event reporting for scripts and hooks | Before adding logs or machine-readable output |
| [quality-guidelines.md](./quality-guidelines.md) | Contributor-quality gates and repository fit checks | Before proposing a core change |
| [error-handling.md](./error-handling.md) | Failure handling, guard rails, and fallback behavior | Before changing hook or script control flow |

## Quick Navigation

| Task | Reference |
| --- | --- |
| Session bootstrap behavior | \`hooks/session-start\` |
| Windows hook adapter behavior | \`hooks/run-hook.cmd\` |
| JSON hook wiring | \`hooks/hooks.json\`, \`hooks/hooks-cursor.json\` |
| Named agent prompts | \`agents/code-reviewer.md\` |
| Long-running companion service | \`skills/brainstorming/scripts/server.cjs\` |
| Repository maintenance utilities | \`scripts/bump-version.sh\` |

## Core Rules Summary

| Rule | Evidence |
| --- | --- |
${facts.coreRules.map((entry) => `| ${entry.rule} | ${entry.evidence} |`).join('\n')}

## Pre-Development Checklist

1. Review the relevant automation files listed above.
2. Search for an existing skill, hook, or script before adding a new one.
3. Confirm the change solves a real user-facing workflow problem, not a hypothetical itch.
4. Keep output compatible across harnesses and shell environments.
`;
}

function renderBackendDirectoryStructure(facts) {
  return `# Backend Directory Structure

## Current Project Conventions

- Keep harness entrypoints and bootstrap logic in \`hooks/\`.
- Keep reusable agent prompts in \`agents/\`.
- Keep reusable workflows in \`skills/<skill-name>/\` with \`SKILL.md\` as the entrypoint.
- Keep repository-wide utilities in \`scripts/\`.
- Keep verification assets under \`tests/\` and align them to the behavior they protect.

## Examples

${joinOrFallback([
  'hooks/session-start',
  'agents/code-reviewer.md',
  'skills/requesting-code-review/SKILL.md',
  'skills/brainstorming/scripts/server.cjs',
  'tests/skill-triggering/run-test.sh',
].filter((item) => facts.rootFiles.includes(item) || facts.hookFiles.includes(item) || facts.agentFiles.includes(item) || facts.backendSignals.includes(item)), 'Add examples once matching files exist.')}

## Anti-patterns

- Mixing harness-specific bootstrap code directly into unrelated skills.
- Dropping reusable scripts in the repository root instead of \`scripts/\`.
- Creating new agent prompt files when an existing prompt or skill can be extended safely.
`;
}

function renderBackendDatabaseGuidelines(facts) {
  return `# Backend Data and Persistence Guidelines

## Current Project Conventions

Superpowers core does **not** ship an application database layer. The current repository favors:

- versioned text assets (Markdown, JSON, shell scripts)
- small file-backed state for harness/runtime coordination
- zero-dependency core behavior over new persistence stacks

## Use These Patterns Instead of Adding a Database

- Prefer checked-in Markdown or JSON for repository configuration and templates.
- Prefer small, explicit state files for runtime helpers.
- If a feature requires durable structured storage, validate whether it belongs in a standalone plugin instead of core.

## Examples

${joinOrFallback([
  'package.json',
  '.version-bump.json',
  'hooks/hooks.json',
  'hooks/hooks-cursor.json',
].filter((item) => facts.rootFiles.includes(item) || facts.hookFiles.includes(item)), 'No file-backed persistence examples detected.')}

## Anti-patterns

- Introducing a database dependency into core without a harness-level justification.
- Hiding durable state in opaque binary files.
- Using generated state where a readable checked-in source of truth would do.
`;
}

function renderBackendLoggingGuidelines(facts) {
  return `# Backend Logging Guidelines

## Current Project Conventions

- Hooks and scripts should emit output that is readable by both humans and harnesses.
- Use structured JSON lines when the consumer is another process or browser helper.
- Keep informational output concise; avoid noisy trace spam in shared tooling.
- Write error messages that explain the failing guard, not just the exception type.

## Examples

${joinOrFallback([
  'hooks/session-start',
  'skills/brainstorming/scripts/server.cjs',
].filter((item) => facts.backendSignals.includes(item) || facts.frontendSignals.includes(item)), 'Add examples once logging surfaces are introduced.')}

## Anti-patterns

- Sprinkling unstructured \`console.log\` noise into shared workflows.
- Returning success language without fresh verification evidence.
- Printing machine-facing payloads in a format that changes between harnesses.
`;
}

function renderBackendQualityGuidelines(facts) {
  return `# Backend Quality Guidelines

## Current Project Conventions

- Solve one real problem per change.
- Reject speculative, duplicate, or domain-specific core changes.
- Treat skill text as behavior-shaping code, not disposable prose.
- Add or update verification assets when behavior changes.

## High-Signal Inputs

${joinOrFallback(facts.guideSignals, 'No contributor rules detected yet.')}

## Review Checklist

1. Does the change belong in core, or should it live in a standalone plugin?
2. Is there evidence of a real failing workflow or user problem?
3. Did the change preserve the existing tone and decision logic of adjacent skills?
4. Is there verification for scripts, hooks, or skill behavior?

## Anti-patterns

- Bulk “while we are here” edits.
- Rewriting tuned rationalization tables without evaluation evidence.
- Adding optional dependencies for convenience.
`;
}

function renderBackendErrorHandling() {
  return `# Backend Error Handling Guidelines

## Current Project Conventions

- Fail fast when bootstrap prerequisites are missing.
- Use explicit fallback behavior only when compatibility demands it.
- Keep fallback paths narrow and documented.
- Preserve actionable messages for the human operator.

## Preferred Patterns

- Validate files and environment variables before doing expensive work.
- Convert low-level platform differences into a small number of stable outputs.
- Distinguish between “expected compatibility fallback” and “real failure”.

## Anti-patterns

- Silently swallowing failures and pretending bootstrap succeeded.
- Returning ambiguous states such as “probably ok”.
- Letting platform-specific branches drift into separate behavior contracts.
`;
}

function renderFrontendIndex(facts) {
  return `# Frontend Development Guidelines Index

> **Repository Focus**: lightweight browser-facing assets used by the brainstorming companion, not a general SPA framework.

## Current Evidence Sources

${joinOrFallback(facts.frontendSignals, 'No browser-facing assets detected yet.')}

## Documentation Files

| File | Description | When to Read |
| --- | --- | --- |
| [directory-structure.md](./directory-structure.md) | Where browser assets and UI-facing docs belong | Before adding new browser-delivered files |
| [type-safety.md](./type-safety.md) | Contract discipline for JSON events, DOM ids, and helper interfaces | Before changing browser/server payloads |
| [hook-guidelines.md](./hook-guidelines.md) | Interaction patterns for browser helpers and future hook-like abstractions | Before adding client interaction state |
| [component-guidelines.md](./component-guidelines.md) | Frame template structure, CSS variable usage, and reusable UI blocks | Before editing the brainstorming companion UI |
| [quality-guidelines.md](./quality-guidelines.md) | Verification expectations for UI helpers and browser-facing content | Before shipping UI changes |
| [state-management.md](./state-management.md) | How browser state stays minimal and event-driven | Before adding persistent client state |

## Quick Navigation

| Task | Reference |
| --- | --- |
| Browser frame template | \`skills/brainstorming/scripts/frame-template.html\` |
| Browser helper behavior | \`skills/brainstorming/scripts/helper.js\` |
| Companion server contract | \`skills/brainstorming/scripts/server.cjs\` |
| Usage guide for visual flows | \`skills/brainstorming/visual-companion.md\` |
| Browser helper tests | \`tests/brainstorm-server/package.json\` |

## Core Rules Summary

- Keep browser assets dependency-light and easy to inspect.
- Prefer semantic HTML, CSS variables, and small helper scripts over framework-heavy abstractions.
- Treat browser/server JSON events as public contracts.
- If evidence is weak, say so explicitly instead of pretending the repository has a full frontend stack.
`;
}

function renderFrontendDirectoryStructure() {
  return `# Frontend Directory Structure

## Current Project Conventions

- Keep browser-facing assets next to the skill or workflow that owns them.
- Keep visual companion runtime files together under \`skills/brainstorming/scripts/\`.
- Keep browser-facing usage guidance close to the owning skill documentation.
- Keep isolated browser helper tests under \`tests/\`.

## Examples

- \`skills/brainstorming/scripts/frame-template.html\`
- \`skills/brainstorming/scripts/helper.js\`
- \`skills/brainstorming/scripts/server.cjs\`
- \`skills/brainstorming/visual-companion.md\`
- \`tests/brainstorm-server/package.json\`

## Anti-patterns

- Creating a detached \`frontend/\` source tree with no owning workflow.
- Splitting a single visual flow across unrelated top-level directories.
- Hiding UI contract details only inside tests.
`;
}

function renderFrontendTypeSafety() {
  return `# Frontend Type and Contract Guidelines

## Current Project Conventions

This repository has limited typed frontend code in core. Contract safety currently comes from:

- explicit JSON message shapes between browser helpers and the server
- stable DOM ids and placeholder markers in template HTML
- narrow helper responsibilities instead of broad client-side frameworks

## Preferred Patterns

- Keep message payload keys explicit and stable.
- Keep template placeholders obvious (for example, content injection anchors).
- Update both browser helper and server contract docs when payload shape changes.

## Examples

- \`skills/brainstorming/scripts/server.cjs\`
- \`skills/brainstorming/scripts/frame-template.html\`
- \`skills/brainstorming/scripts/helper.js\`

## Anti-patterns

- Ad-hoc event payload changes without updating consumers.
- Hidden magic selectors with no stable identifier.
- Assuming a framework type system where none exists.
`;
}

function renderFrontendHookGuidelines() {
  return `# Frontend Hook and Interaction Guidelines

## Current Project Conventions

Superpowers core does not currently ship a React hook layer. Interaction logic is handled through small browser helpers and DOM/event wiring.

If a future harness adds hook-like abstractions:

- keep them local to the harness or workflow that owns the UI
- keep their contracts narrow and documented
- avoid forcing framework-specific concepts into general-purpose core skills

## Examples

- \`skills/brainstorming/scripts/helper.js\`
- \`skills/brainstorming/scripts/server.cjs\`

## Anti-patterns

- Introducing framework-specific hooks into core without a real cross-harness need.
- Combining DOM reads, WebSocket handling, and rendering decisions into one opaque helper.
- Treating browser helpers as a dumping ground for unrelated workflow logic.
`;
}

function renderFrontendComponentGuidelines() {
  return `# Frontend Component Guidelines

## Current Project Conventions

- Build UI surfaces from semantic HTML and CSS custom properties.
- Keep shared frame chrome (header, status, indicator) in one template.
- Prefer reusable CSS utility blocks and stable container ids over duplicated markup.
- Default to content fragments unless full-document control is required.

## Examples

- \`skills/brainstorming/scripts/frame-template.html\`
- \`skills/brainstorming/visual-companion.md\`

## Anti-patterns

- Inline styles duplicated across multiple generated screens.
- New full documents when a content fragment would inherit the shared frame safely.
- UI copy that hides user action requirements or connection state.
`;
}

function renderFrontendQualityGuidelines() {
  return `# Frontend Quality Guidelines

## Current Project Conventions

- Validate browser-facing helpers with focused tests or fixture-based checks.
- Keep UI behavior understandable from the owning skill documentation.
- Prefer deterministic DOM and event behavior over clever animation or hidden state.

## Verification Checklist

1. Does the browser helper still match the documented flow in \`visual-companion.md\`?
2. Are shared frame ids, classes, and placeholders still intact?
3. Does the server/browser contract remain backward compatible for the intended harnesses?
4. Is the UI change dependency-free and easy to inspect?

## Anti-patterns

- Browser-only changes with no verification path.
- Adding UI dependencies to solve a one-off styling problem.
- Requiring users to guess which terminal action matches the browser state.
`;
}

function renderFrontendStateManagement() {
  return `# Frontend State Management Guidelines

## Current Project Conventions

- Keep browser state minimal and ephemeral.
- Let the companion server stay authoritative for file-backed activity and reload triggers.
- Prefer event-driven updates over heavyweight client-side state containers.

## Examples

- \`skills/brainstorming/scripts/server.cjs\` tracks screen changes and broadcasts reload events.
- \`skills/brainstorming/scripts/helper.js\` handles browser interaction glue.

## Anti-patterns

- Long-lived client-side caches with no clear invalidation rule.
- Duplicating the same state in both file-backed runtime storage and browser-only globals.
- Smuggling durable workflow state into the browser when it belongs in the server or repo.
`;
}

function renderGuidesIndex(facts) {
  return `# Thinking Guides for Superpowers

> **Purpose**: expand judgment before editing behavior-shaping skills, hooks, or automation.

## Why Thinking Guides?

Most mistakes in this repository come from skipping context, not lacking syntax knowledge.

- Change a hook format in one harness and forget the others.
- Add a “helpful” skill tweak that breaks tuned prompting language.
- Introduce a project-specific convention into core because it looked reusable for five minutes.

## Available Guides

| Guide | Purpose | When to Use |
| --- | --- | --- |
| [cross-layer-thinking-guide.md](./cross-layer-thinking-guide.md) | Trace how one change propagates across skills, hooks, agents, docs, and tests | Before changing shared workflows |
| [code-reuse-thinking-guide.md](./code-reuse-thinking-guide.md) | Force a search for existing patterns before adding new ones | Before creating new helpers, files, or skills |

## Quick Reference: Thinking Triggers

- A change touches both a skill and a hook.
- A new behavior must work in Claude, Cursor, Codex, or Copilot paths.
- A proposed file or helper feels suspiciously similar to something already in \`skills/\` or \`hooks/\`.
- A repository rule appears only in memory and not in a checked-in source.

## Pre-Modification Rule (CRITICAL)

> **Search Before Write** — check existing skills, hooks, prompts, and docs before adding new structure.

\`skills/using-superpowers/SKILL.md\` is the root reminder that workflows are mandatory and skills should be discovered before acting.

## High-Signal Inputs

${joinOrFallback(facts.guideSignals, 'Add repository rules once they exist.')}
`;
}

function renderCrossLayerGuide() {
  return `# Cross-Layer Thinking Guide

## Use This Guide When

- one change affects a skill and a hook
- a browser helper depends on a server-side message format
- a new rule needs to be reflected in docs, prompts, and tests

## Questions to Answer Before Editing

1. Which harness entrypoints consume this behavior?
2. Which skill or prompt text teaches the behavior?
3. Which tests or fixture scripts verify the behavior today?
4. Which documentation page tells a human what to expect?

## Current Cross-Layer Paths in This Repository

- Session bootstrap: \`hooks/session-start\` -> \`skills/using-superpowers/SKILL.md\`
- Code review workflow: \`skills/requesting-code-review/SKILL.md\` -> \`agents/code-reviewer.md\`
- Brainstorm companion: \`skills/brainstorming/visual-companion.md\` -> \`skills/brainstorming/scripts/server.cjs\` -> browser assets

## Failure Patterns to Catch Early

- Updating a prompt but not the supporting agent template.
- Changing machine-readable JSON output in one harness and not the others.
- Adding a new workflow stage without updating the docs that teach users the sequence.
`;
}

function renderCodeReuseGuide() {
  return `# Code Reuse Thinking Guide

## Search Before Adding

Before creating a new helper, script, or skill section, search for:

- an existing skill that already teaches the workflow
- an existing hook that already normalizes the platform difference
- an existing agent prompt or test fixture that captures the same behavior

## Reuse Priorities

1. Extend an existing skill if the new behavior is the same workflow family.
2. Reuse an existing helper or template before copying markup or shell logic.
3. Add a new file only when the responsibility is clearly distinct and reusable.

## Repository-Specific Reminders

- Core is for general-purpose workflows, not one-off project customs.
- Behavior-shaping tables and rationalization defenses are part of the implementation, not ornamental prose.
- A new file must earn its keep by reducing duplication or clarifying ownership.

## Anti-patterns

- Creating a second “bootstrap” skill when \`using-superpowers\` already owns skill discovery.
- Copy-pasting a helper into multiple skill directories instead of giving it one owner.
- Adding abstract wrappers around shell or JSON behavior that only one file uses.
`;
}

export function renderSpecFile(relativePath, facts) {
  switch (relativePath.replace(/\\/g, '/')) {
    case 'backend/index.md':
      return renderBackendIndex(facts);
    case 'backend/directory-structure.md':
      return renderBackendDirectoryStructure(facts);
    case 'backend/database-guidelines.md':
      return renderBackendDatabaseGuidelines(facts);
    case 'backend/logging-guidelines.md':
      return renderBackendLoggingGuidelines(facts);
    case 'backend/quality-guidelines.md':
      return renderBackendQualityGuidelines(facts);
    case 'backend/error-handling.md':
      return renderBackendErrorHandling(facts);
    case 'frontend/index.md':
      return renderFrontendIndex(facts);
    case 'frontend/directory-structure.md':
      return renderFrontendDirectoryStructure(facts);
    case 'frontend/type-safety.md':
      return renderFrontendTypeSafety(facts);
    case 'frontend/hook-guidelines.md':
      return renderFrontendHookGuidelines(facts);
    case 'frontend/component-guidelines.md':
      return renderFrontendComponentGuidelines(facts);
    case 'frontend/quality-guidelines.md':
      return renderFrontendQualityGuidelines(facts);
    case 'frontend/state-management.md':
      return renderFrontendStateManagement(facts);
    case 'guides/index.md':
      return renderGuidesIndex(facts);
    case 'guides/cross-layer-thinking-guide.md':
      return renderCrossLayerGuide(facts);
    case 'guides/code-reuse-thinking-guide.md':
      return renderCodeReuseGuide(facts);
    default:
      throw new Error(`Unsupported spec file: ${relativePath}`);
  }
}

export async function ensureSpecTree(repoRoot) {
  const created = [];
  for (const [section, files] of Object.entries(SPEC_TREE)) {
    const sectionDir = path.join(repoRoot, SPEC_ROOT, section);
    await fs.mkdir(sectionDir, { recursive: true });
    for (const entry of files) {
      const targetPath = path.join(sectionDir, entry.file);
      if (!(await pathExists(targetPath))) {
        await fs.writeFile(targetPath, '', 'utf8');
        created.push(path.relative(repoRoot, targetPath).replace(/\\/g, '/'));
      }
    }
  }
  return created;
}

export async function writeSpecFiles(repoRoot, facts, onlyPaths = null) {
  const written = [];
  const allowedPaths = onlyPaths ? new Set(onlyPaths.map((item) => item.replace(/\\/g, '/'))) : null;
  for (const [section, files] of Object.entries(SPEC_TREE)) {
    for (const entry of files) {
      const relativePath = `${section}/${entry.file}`;
      const targetPath = path.join(repoRoot, SPEC_ROOT, section, entry.file);
      const normalizedPath = path.relative(repoRoot, targetPath).replace(/\\/g, '/');
      if (allowedPaths && !allowedPaths.has(normalizedPath)) {
        continue;
      }
      const content = `${renderSpecFile(relativePath, facts).trim()}\n`;
      await fs.writeFile(targetPath, content, 'utf8');
      written.push(normalizedPath);
    }
  }
  return written;
}

export async function setupSpec(repoRoot) {
  const created = await ensureSpecTree(repoRoot);
  const facts = await collectRepoFacts(repoRoot);
  const written = await writeSpecFiles(repoRoot, facts, created);
  return { facts, created, written };
}
