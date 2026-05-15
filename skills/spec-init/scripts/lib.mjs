import fs from 'node:fs/promises';
import path from 'node:path';
import {renderBackendSpecFile, updateMarkdownUsingExistingHeadings} from './backend.mjs';

export const SPEC_TREE = {
  backend: [{file: 'index.md', title: 'Backend Development Guidelines Index'}, {file: 'directory-structure.md', title: 'Backend Directory Structure'}, {
    file: 'database-guidelines.md',
    title: 'Backend Data and Persistence Guidelines'
  }, {file: 'code-style-guidelines.md', title: 'Backend Code Style Guidelines'}, {file: 'engineering-guidelines.md', title: 'Backend Engineering Guidelines'}, {
    file: 'security-guidelines.md',
    title: 'Backend Security Guidelines'
  },],
  frontend: [{file: 'index.md', title: 'Frontend Development Guidelines Index'}, {file: 'directory-structure.md', title: 'Frontend Directory Structure'}, {
    file: 'type-safety.md',
    title: 'Frontend Type and Contract Guidelines'
  }, {file: 'hook-guidelines.md', title: 'Frontend Hook and Interaction Guidelines'}, {file: 'component-guidelines.md', title: 'Frontend Component Guidelines'}, {
    file: 'quality-guidelines.md',
    title: 'Frontend Quality Guidelines'
  }, {file: 'state-management.md', title: 'Frontend State Management Guidelines'},],
  guides: [{file: 'index.md', title: 'Thinking Guides for Superpowers'}, {file: 'cross-layer-thinking-guide.md', title: 'Cross-Layer Thinking Guide'}, {
    file: 'code-reuse-thinking-guide.md',
    title: 'Code Reuse Thinking Guide'
  },],
};
const ROOT_SIGNAL_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'README.md', 'docs/README.codex.md', 'hooks/session-start', 'hooks/run-hook.cmd', 'hooks/hooks.json', 'hooks/hooks-cursor.json', 'agents/code-reviewer.md', 'skills/using-superpowers/SKILL.md', 'skills/writing-skills/SKILL.md', 'skills/brainstorming/SKILL.md', 'skills/brainstorming/scripts/server.cjs', 'skills/brainstorming/scripts/helper.js', 'skills/brainstorming/scripts/frame-template.html', 'tests/skill-triggering/run-test.sh', 'tests/brainstorm-server/package.json', 'scripts/bump-version.sh',];
const FRONTEND_SIGNAL_FILES = ['skills/brainstorming/scripts/frame-template.html', 'skills/brainstorming/scripts/helper.js', 'skills/brainstorming/scripts/server.cjs', 'skills/brainstorming/visual-companion.md', 'tests/brainstorm-server/package.json',];
const BACKEND_SIGNAL_FILES = ['hooks/session-start', 'hooks/run-hook.cmd', 'hooks/hooks.json', 'hooks/hooks-cursor.json', 'agents/code-reviewer.md', 'scripts/bump-version.sh', 'skills/brainstorming/scripts/server.cjs',];
const GUIDE_SIGNAL_FILES = ['AGENTS.md', 'CLAUDE.md', 'README.md', 'skills/using-superpowers/SKILL.md', 'skills/writing-skills/SKILL.md', 'skills/executing-plans/SKILL.md', 'skills/requesting-code-review/SKILL.md',];
const SPEC_ROOT = path.join('docs', 'project-spec');

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
  const entries = await fs.readdir(targetPath, {withFileTypes: true});
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

async function listFiles(targetPath, relativeBase) {
  if (!(await pathExists(targetPath))) {
    return [];
  }
  const entries = await fs.readdir(targetPath, {withFileTypes: true});
  return entries.filter((entry) => entry.isFile()).map((entry) => path.posix.join(relativeBase, entry.name)).sort();
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

function joinOrFallback(items, fallback) {
  return items.length > 0 ? bulletList(items) : `- ${fallback}`;
}

function pushCoreRule(coreRules, rule, evidence) {
  if (!coreRules.some((entry) => entry.rule === rule)) {
    coreRules.push({rule, evidence});
  }
}

function collectAgentsRules(agentsContent) {
  const coreRules = [];
  if (!agentsContent) {
    return coreRules;
  }
  if (agentsContent.includes('代码保持精简易懂') || /keep code simple/i.test(agentsContent)) {
    pushCoreRule(coreRules, 'Keep code simple and readable.', 'AGENTS.md says code should stay simple and understandable.');
  }
  if (agentsContent.includes('reliable-text-reader') && agentsContent.includes('reliable-text-writer')) {
    pushCoreRule(coreRules, 'Use reliable-text-reader and reliable-text-writer for repository file I/O when AGENTS.md requires it.', 'AGENTS.md requires reliable text skills for file reads and writes.');
  }
  if (agentsContent.includes('.tmp/')) {
    pushCoreRule(coreRules, 'Put temporary task files under `.tmp/`.', 'AGENTS.md reserves `.tmp/` for temporary task files.');
  }
  if (agentsContent.includes('删除文件') && agentsContent.includes('询问用户同意')) {
    pushCoreRule(coreRules, 'Require explicit user consent before deleting files.', 'AGENTS.md blocks file deletion without user approval.');
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
    pushCoreRule(coreRules, 'Keep core changes zero-dependency and harness-focused.', 'CLAUDE.md rejects third-party dependencies in core.');
  }
  if (claudeContent.includes('Domain-specific skills')) {
    pushCoreRule(coreRules, 'Keep core skills general-purpose; domain-specific flows belong in standalone plugins.', 'CLAUDE.md calls out domain-specific skills as non-core.');
  }
  if (claudeContent.includes('Fabricated content')) {
    pushCoreRule(coreRules, 'Never invent problems, behavior, or evaluation evidence.', 'CLAUDE.md explicitly rejects fabricated content.');
  }
  if (readmeContent.includes('The agent checks for relevant skills before any task')) {
    pushCoreRule(coreRules, 'Assume skill-first workflows; implementations should support automatic discovery and disciplined use.', 'README.md states that skill checks are mandatory workflows.');
  }
  pushCoreRule(coreRules, 'Preserve the existing Superpowers voice and rationale tables unless you have evaluation evidence.', 'CLAUDE.md warns that behavior-shaping skill text is tuned and should not be casually rewritten.');
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
    repoRoot,
  };
}

function renderFrontendIndex(facts) {
  return `# Frontend Development Guidelines Index  ## Current Evidence Sources  ${joinOrFallback(facts.frontendSignals, 'No browser-facing assets detected yet.')}  ## Documentation Files  - \`directory-structure.md\` - \`type-safety.md\` - \`hook-guidelines.md\` - \`component-guidelines.md\` - \`quality-guidelines.md\` - \`state-management.md\` `;
}

function renderFrontendDirectoryStructure() {
  return `# Frontend Directory Structure  - Keep browser-facing assets next to the owning workflow. - Keep shared helper assets together under the owning skill directory. `;
}

function renderFrontendTypeSafety() {
  return `# Frontend Type and Contract Guidelines  - Keep JSON contracts explicit. - Keep DOM ids and helper payloads stable. `;
}

function renderFrontendHookGuidelines() {
  return `# Frontend Hook and Interaction Guidelines  - Keep interaction helpers small and local to the owning workflow. - Do not invent a framework layer the repository does not have. `;
}

function renderFrontendComponentGuidelines() {
  return `# Frontend Component Guidelines  - Prefer semantic HTML and simple CSS utilities. - Reuse the shared frame structure before adding new full documents. `;
}

function renderFrontendQualityGuidelines() {
  return `# Frontend Quality Guidelines  - Keep browser-facing behavior easy to verify. - Update UI docs when contracts or visible flows change. `;
}

function renderFrontendStateManagement() {
  return `# Frontend State Management Guidelines  - Keep browser state minimal and event-driven. - Let the server stay authoritative for file-backed workflow state. `;
}

function renderGuidesIndex(facts) {
  return `# Thinking Guides for Superpowers  ## Why Thinking Guides?  - Shared workflows break when context is skipped. - Cross-layer changes need explicit traceability.  ## Available Guides  - [cross-layer-thinking-guide.md](./cross-layer-thinking-guide.md) - [code-reuse-thinking-guide.md](./code-reuse-thinking-guide.md)  ## Pre-Modification Rule (CRITICAL)  Search Before Write  \`skills/using-superpowers/SKILL.md\` is the root reminder that workflows are mandatory and skills should be discovered before acting.  ## High-Signal Inputs  ${joinOrFallback(facts.guideSignals, 'Add repository rules once they exist.')} `;
}

function renderCrossLayerGuide() {
  return `# Cross-Layer Thinking Guide  1. Identify every harness entrypoint that consumes the behavior. 2. Identify every skill or prompt that teaches the behavior. 3. Update tests and docs together with shared workflow changes. `;
}

function renderCodeReuseGuide() {
  return `# Code Reuse Thinking Guide  1. Search for an existing skill, hook, prompt, or helper before adding new structure. 2. Reuse an existing owner when the responsibility is already present. 3. Add a new file only when the responsibility is clearly distinct. `;
}

export function renderSpecFile(relativePath, facts, options = {}) {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  if (normalizedPath.startsWith('backend/')) {
    return renderBackendSpecFile(normalizedPath, facts, options);
  }
  switch (normalizedPath) {
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

function allManagedSpecPaths() {
  return Object.entries(SPEC_TREE).flatMap(([section, files]) => files.map((entry) => `docs/project-spec/${section}/${entry.file}`));
}

async function listAllSpecFiles(repoRoot) {
  const specRoot = path.join(repoRoot, SPEC_ROOT);
  if (!(await pathExists(specRoot))) {
    return [];
  }
  const discovered = [];

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, {withFileTypes: true});
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else {
        discovered.push(path.relative(repoRoot, entryPath).replace(/\\/g, '/'));
      }
    }
  }

  await walk(specRoot);
  return discovered.sort();
}

async function listExistingManagedSpecPaths(repoRoot) {
  const existing = [];
  for (const relativePath of allManagedSpecPaths()) {
    if (await pathExists(path.join(repoRoot, relativePath))) {
      existing.push(relativePath);
    }
  }
  return existing;
}

async function writeManagedSpecFile(repoRoot, relativePath, facts, options) {
  const targetPath = path.join(repoRoot, relativePath);
  await fs.mkdir(path.dirname(targetPath), {recursive: true});
  const specRelativePath = relativePath.replace(/^\.agents\/spec\//, '');
  const renderedContent = `${renderSpecFile(specRelativePath, facts, options).trim()}\n`;
  await fs.writeFile(targetPath, renderedContent, 'utf8');
  return relativePath;
}

export async function ensureSpecTree(repoRoot, onlyPaths = null) {
  const created = [];
  const allowedPaths = onlyPaths ? new Set(onlyPaths) : null;
  for (const relativePath of allManagedSpecPaths()) {
    if (allowedPaths && !allowedPaths.has(relativePath)) {
      continue;
    }
    const targetPath = path.join(repoRoot, relativePath);
    await fs.mkdir(path.dirname(targetPath), {recursive: true});
    if (!(await pathExists(targetPath))) {
      await fs.writeFile(targetPath, '', 'utf8');
      created.push(relativePath);
    }
  }
  return created;
}

export async function writeSpecFiles(repoRoot, facts, onlyPaths = null, options = {}) {
  const targetPaths = onlyPaths ?? allManagedSpecPaths();
  const written = [];
  for (const relativePath of targetPaths) {
    written.push(await writeManagedSpecFile(repoRoot, relativePath, facts, options));
  }
  return written;
}

async function updateSpecFiles(repoRoot, facts, targetPaths, options = {}) {
  const written = [];
  for (const relativePath of targetPaths) {
    const targetPath = path.join(repoRoot, relativePath);
    if (!(await pathExists(targetPath))) {
      continue;
    }
    const currentContent = await fs.readFile(targetPath, 'utf8');
    const specRelativePath = relativePath.replace(/^\.agents\/spec\//, '');
    const candidateContent = `${renderSpecFile(specRelativePath, facts, options).trim()}\n`;
    const updatedContent = updateMarkdownUsingExistingHeadings(currentContent, candidateContent);
    if (updatedContent !== currentContent) {
      await fs.writeFile(targetPath, updatedContent, 'utf8');
      written.push(relativePath);
    }
  }
  return written;
}

export async function setupSpec(repoRoot, options = {}) {
  const existingManagedPaths = await listExistingManagedSpecPaths(repoRoot);
  const allSpecFiles = await listAllSpecFiles(repoRoot);
  const mode = options.mode ?? (allSpecFiles.length === 0 ? 'initialize' : 'update');
  const backendTemplate = options.backendTemplate ?? 'custom';
  const facts = await collectRepoFacts(repoRoot);
  if (mode === 'initialize') {
    const created = await ensureSpecTree(repoRoot);
    const written = await writeSpecFiles(repoRoot, facts, created, {backendTemplate});
    return {facts, created, written, mode, backendTemplate};
  }
  if (mode === 'overwrite') {
    const created = await ensureSpecTree(repoRoot);
    const written = await writeSpecFiles(repoRoot, facts, allManagedSpecPaths(), {backendTemplate});
    return {facts, created, written, mode, backendTemplate};
  }
  if (mode === 'update') {
    const written = await updateSpecFiles(repoRoot, facts, existingManagedPaths, {backendTemplate: 'custom'});
    return {facts, created: [], written, mode, backendTemplate: 'custom'};
  }
  throw new Error(`Unsupported setup mode: ${mode}`);
}
