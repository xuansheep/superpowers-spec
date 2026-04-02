import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const moduleUrl = pathToFileURL(path.join(repoRoot, 'scripts/setup-spec/lib.mjs')).href;

const mod = await import(moduleUrl);
assert.ok(mod.SPEC_TREE, 'SPEC_TREE export is required');
assert.deepEqual(Object.keys(mod.SPEC_TREE).sort(), ['backend', 'frontend', 'guides']);

const backendFiles = mod.SPEC_TREE.backend.map((entry) => entry.file);
const frontendFiles = mod.SPEC_TREE.frontend.map((entry) => entry.file);
const guideFiles = mod.SPEC_TREE.guides.map((entry) => entry.file);

assert.deepEqual(backendFiles, [
  'index.md',
  'directory-structure.md',
  'database-guidelines.md',
  'logging-guidelines.md',
  'quality-guidelines.md',
  'error-handling.md',
]);
assert.deepEqual(frontendFiles, [
  'index.md',
  'directory-structure.md',
  'type-safety.md',
  'hook-guidelines.md',
  'component-guidelines.md',
  'quality-guidelines.md',
  'state-management.md',
]);
assert.deepEqual(guideFiles, [
  'index.md',
  'cross-layer-thinking-guide.md',
  'code-reuse-thinking-guide.md',
]);

const facts = await mod.collectRepoFacts(repoRoot);
assert.equal(facts.projectName, 'superpowers');
assert.ok(facts.rootFiles.includes('AGENTS.md'));
assert.ok(facts.rootFiles.includes('CLAUDE.md'));
assert.ok(facts.rootFiles.includes('README.md'));
assert.ok(facts.skillDirectories.includes('brainstorming'));
assert.ok(facts.skillDirectories.includes('writing-skills'));
assert.ok(facts.hookFiles.includes('hooks/session-start'));
assert.ok(facts.frontendSignals.includes('skills/brainstorming/scripts/frame-template.html'));

const backendIndex = mod.renderSpecFile('backend/index.md', facts);
const guidesIndex = mod.renderSpecFile('guides/index.md', facts);
assert.match(backendIndex, /# Backend Development Guidelines Index/);
assert.match(backendIndex, /hooks\/session-start/);
assert.match(backendIndex, /skills\/brainstorming\/scripts\/server\.cjs/);
assert.match(guidesIndex, /# Thinking Guides for Superpowers/);
assert.match(guidesIndex, /Search Before Write/);
assert.match(guidesIndex, /skills\/using-superpowers\/SKILL\.md/);

const fixtureRoot = path.join(repoRoot, '.tmp', `setup-spec-fixture-${Date.now()}`);
await fs.mkdir(path.join(fixtureRoot, 'hooks'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'agents'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'skills', 'brainstorming', 'scripts'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'skills', 'using-superpowers'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'skills', 'writing-skills'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'skills', 'executing-plans'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'skills', 'requesting-code-review'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'tests', 'brainstorm-server'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'tests', 'skill-triggering'), { recursive: true });
await fs.mkdir(path.join(fixtureRoot, 'docs'), { recursive: true });

await fs.writeFile(path.join(fixtureRoot, 'package.json'), JSON.stringify({ name: 'fixture-superpowers', type: 'module' }, null, 2));
await fs.writeFile(path.join(fixtureRoot, 'AGENTS.md'), `## 工具使用
- 在读写文件时强制使用 skill \`reliable-text-reader\` 和 \`reliable-text-writer\`

## 软件工程
- 代码保持精简易懂
- 如果你在任务过程中需要创建临时文件，一律放在项目根目录的 \`.tmp/\` 文件夹中
`);
await fs.writeFile(path.join(fixtureRoot, 'CLAUDE.md'), 'zero-dependency plugin\nDomain-specific skills\nFabricated content\n');
await fs.writeFile(path.join(fixtureRoot, 'README.md'), 'The agent checks for relevant skills before any task\n');
await fs.writeFile(path.join(fixtureRoot, 'hooks', 'session-start'), '#!/usr/bin/env bash\n');
await fs.writeFile(path.join(fixtureRoot, 'hooks', 'run-hook.cmd'), 'echo hook\n');
await fs.writeFile(path.join(fixtureRoot, 'hooks', 'hooks.json'), '{}\n');
await fs.writeFile(path.join(fixtureRoot, 'hooks', 'hooks-cursor.json'), '{}\n');
await fs.writeFile(path.join(fixtureRoot, 'agents', 'code-reviewer.md'), 'reviewer\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'brainstorming', 'SKILL.md'), 'brainstorm\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'brainstorming', 'visual-companion.md'), 'visual\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'brainstorming', 'scripts', 'server.cjs'), 'console.log("server")\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'brainstorming', 'scripts', 'helper.js'), 'console.log("helper")\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'brainstorming', 'scripts', 'frame-template.html'), '<div></div>\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'using-superpowers', 'SKILL.md'), 'using\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'writing-skills', 'SKILL.md'), 'writing\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'executing-plans', 'SKILL.md'), 'executing\n');
await fs.writeFile(path.join(fixtureRoot, 'skills', 'requesting-code-review', 'SKILL.md'), 'review\n');
await fs.writeFile(path.join(fixtureRoot, 'tests', 'brainstorm-server', 'package.json'), '{}\n');
await fs.writeFile(path.join(fixtureRoot, 'tests', 'skill-triggering', 'run-test.sh'), 'echo test\n');
await fs.writeFile(path.join(fixtureRoot, 'scripts', 'bump-version.sh'), 'echo bump\n').catch(async () => {
  await fs.mkdir(path.join(fixtureRoot, 'scripts'), { recursive: true });
  await fs.writeFile(path.join(fixtureRoot, 'scripts', 'bump-version.sh'), 'echo bump\n');
});

const firstRun = await mod.setupSpec(fixtureRoot);
assert.equal(firstRun.written.length, 16, 'first run should populate every missing file');
assert.ok(firstRun.facts.coreRules.some((entry) => entry.rule === 'Keep code simple and readable.'));
assert.ok(firstRun.facts.coreRules.some((entry) => entry.rule === 'Use reliable-text-reader and reliable-text-writer for repository file I/O when AGENTS.md requires it.'));
assert.ok(firstRun.facts.coreRules.some((entry) => entry.rule === 'Put temporary task files under `.tmp/`.'));
const generatedBackendIndex = await fs.readFile(path.join(fixtureRoot, '.agents', 'spec', 'backend', 'index.md'), 'utf8');
assert.match(generatedBackendIndex, /Keep code simple and readable\./);
assert.match(generatedBackendIndex, /Put temporary task files under `\.tmp\/`\./);

const preservedPath = path.join(fixtureRoot, '.agents', 'spec', 'backend', 'index.md');
await fs.writeFile(preservedPath, 'custom backend index\n', 'utf8');

const secondRun = await mod.setupSpec(fixtureRoot);
assert.equal(secondRun.created.length, 0, 'second run should create no files');
assert.equal(secondRun.written.length, 0, 'second run should skip existing files');
assert.equal(await fs.readFile(preservedPath, 'utf8'), 'custom backend index\n');

console.log('setup-spec checks passed');
