import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const repoRoot = process.cwd();
const moduleUrl = pathToFileURL(path.join(repoRoot, 'skills/setup/scripts/lib.mjs')).href;
const fillSpecLibUrl = pathToFileURL(path.join(repoRoot, 'skills/setup/scripts/fill-spec-lib.mjs')).href;
const mod = await import(moduleUrl);
const {runSetupFlow} = await import(fillSpecLibUrl);

assert.ok(mod.SPEC_TREE, 'SPEC_TREE export is required');
assert.deepEqual(Object.keys(mod.SPEC_TREE).sort(), ['backend', 'frontend', 'guides']);

const backendFiles = mod.SPEC_TREE.backend.map((entry) => entry.file);
const frontendFiles = mod.SPEC_TREE.frontend.map((entry) => entry.file);
const guideFiles = mod.SPEC_TREE.guides.map((entry) => entry.file);

assert.deepEqual(backendFiles, [
  'index.md',
  'directory-structure.md',
  'database-guidelines.md',
  'code-style-guidelines.md',
  'engineering-guidelines.md',
  'security-guidelines.md',
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

const backendIndex = mod.renderSpecFile('backend/index.md', facts, {backendTemplate: 'custom'});
const guidesIndex = mod.renderSpecFile('guides/index.md', facts);
assert.match(backendIndex, /code-style-guidelines\.md/);
assert.match(backendIndex, /engineering-guidelines\.md/);
assert.match(backendIndex, /security-guidelines\.md/);
assert.doesNotMatch(backendIndex, /logging-guidelines\.md/);
assert.match(guidesIndex, /# Thinking Guides for Superpowers/);
assert.match(guidesIndex, /Search Before Write/);
assert.match(guidesIndex, /skills\/using-superpowers\/SKILL\.md/);

async function createFixtureRoot(name) {
  const fixtureRoot = path.join(repoRoot, '.tmp', `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fs.mkdir(path.join(fixtureRoot, 'hooks'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'agents'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'skills', 'brainstorming', 'scripts'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'skills', 'using-superpowers'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'skills', 'writing-skills'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'skills', 'executing-plans'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'skills', 'requesting-code-review'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'tests', 'brainstorm-server'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'tests', 'skill-triggering'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'docs'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'src', 'main', 'java', 'com', 'example', 'app'), {recursive: true});
  await fs.mkdir(path.join(fixtureRoot, 'src', 'test', 'java', 'com', 'example', 'app'), {recursive: true});

  await fs.writeFile(path.join(fixtureRoot, 'package.json'), JSON.stringify({name: 'fixture-superpowers', type: 'module'}, null, 2));
  await fs.writeFile(
    path.join(fixtureRoot, 'AGENTS.md'),
    '## 工具使用\n- 在读写文件时强制使用 skill `reliable-text-reader` 和 `reliable-text-writer`\n\n## 软件工程\n- 代码保持精简易懂\n- 如果你在任务过程中需要创建临时文件，一律放在项目根目录的 .tmp/ 文件夹中\n',
  );
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
  await fs.mkdir(path.join(fixtureRoot, 'scripts'), {recursive: true});
  await fs.writeFile(path.join(fixtureRoot, 'scripts', 'bump-version.sh'), 'echo bump\n');

  return fixtureRoot;
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readUtf8(targetPath) {
  return fs.readFile(targetPath, 'utf8');
}

const initializeCustomRoot = await createFixtureRoot('setup-spec-custom');
const initializeCustom = await mod.setupSpec(initializeCustomRoot, {mode: 'initialize', backendTemplate: 'custom'});
assert.equal(initializeCustom.written.length, 16, 'initialize custom should populate every missing file');
assert.ok(initializeCustom.facts.coreRules.some((entry) => entry.rule === 'Keep code simple and readable.'));

const customBackendIndex = await readUtf8(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'index.md'));
const customCodeStyle = await readUtf8(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'code-style-guidelines.md'));
const customDatabase = await readUtf8(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'database-guidelines.md'));
const customEngineering = await readUtf8(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'engineering-guidelines.md'));
const customSecurity = await readUtf8(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'security-guidelines.md'));
const customDirectory = await readUtf8(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'directory-structure.md'));

assert.match(customBackendIndex, /code-style-guidelines\.md/);
assert.match(customBackendIndex, /工程实践规范/);
assert.equal(await fileExists(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'logging-guidelines.md')), false);
assert.equal(await fileExists(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'quality-guidelines.md')), false);
assert.equal(await fileExists(path.join(initializeCustomRoot, '.agents', 'spec', 'backend', 'error-handling.md')), false);
assert.match(customCodeStyle, /## 命名规范\s+> 对于类、接口、注解、枚举的命名规范定义。/);
assert.match(customDatabase, /## SQL 编写原则\s+> 对于查询字段、条件拼装、分页、排序、批量操作等 SQL 编写要求的定义。/);
assert.match(customEngineering, /## 分层职责\s+> 对于接口层、应用层、领域层、持久化层等职责边界的定义。/);
assert.match(customSecurity, /## 输入校验与边界检查\s+> 对于外部输入的类型、格式、长度、范围、白名单与非法输入处理要求的定义。/);
assert.match(customDirectory, /## 目录布局\s+> 列出项目后端目录结构示例，并说明各目录用途。/);
assert.match(customDirectory, /src\/main\/java/);
assert.match(customDirectory, /hooks/);

const initializeJavaRoot = await createFixtureRoot('setup-spec-java');
const initializeJava = await mod.setupSpec(initializeJavaRoot, {mode: 'initialize', backendTemplate: 'java'});
assert.equal(initializeJava.written.length, 16, 'initialize java should populate every missing file');

const generatedJavaCodeStyle = await readUtf8(path.join(initializeJavaRoot, '.agents', 'spec', 'backend', 'code-style-guidelines.md'));
const templateJavaCodeStyle = await readUtf8(path.join(repoRoot, 'template', 'backend', 'java', 'code-style-guidelines.md'));
const generatedJavaDirectory = await readUtf8(path.join(initializeJavaRoot, '.agents', 'spec', 'backend', 'directory-structure.md'));

assert.equal(generatedJavaCodeStyle.trimEnd(), templateJavaCodeStyle.trimEnd());
assert.match(generatedJavaDirectory, /src\/main\/java/);

const overwriteRoot = await createFixtureRoot('setup-spec-overwrite');
await mod.setupSpec(overwriteRoot, {mode: 'initialize', backendTemplate: 'custom'});
const overwriteBackendIndexPath = path.join(overwriteRoot, '.agents', 'spec', 'backend', 'index.md');
const overwriteFrontendPath = path.join(overwriteRoot, '.agents', 'spec', 'frontend', 'index.md');
await fs.writeFile(overwriteBackendIndexPath, 'custom backend index\n', 'utf8');
await fs.writeFile(overwriteFrontendPath, 'frontend override\n', 'utf8');

const overwriteResult = await mod.setupSpec(overwriteRoot, {mode: 'overwrite', backendTemplate: 'java'});
assert.ok(overwriteResult.written.includes('.agents/spec/backend/index.md'));
assert.ok(overwriteResult.written.includes('.agents/spec/frontend/index.md'));
assert.notEqual(await readUtf8(overwriteBackendIndexPath), 'custom backend index\n');
assert.notEqual(await readUtf8(overwriteFrontendPath), 'frontend override\n');

const updateRoot = await createFixtureRoot('setup-spec-update');
const updateCodeStylePath = path.join(updateRoot, '.agents', 'spec', 'backend', 'code-style-guidelines.md');
const updateMissingSecurityPath = path.join(updateRoot, '.agents', 'spec', 'backend', 'security-guidelines.md');
await fs.mkdir(path.join(updateRoot, '.agents', 'spec', 'backend'), {recursive: true});
await fs.writeFile(updateCodeStylePath, '# 代码风格规范\n\n## 概览\n历史概览保留。\n\n## 命名规范\n\n', 'utf8');

const updateResult = await mod.setupSpec(updateRoot, {mode: 'update'});
const updatedCodeStyle = await readUtf8(updateCodeStylePath);
assert.equal(await fileExists(updateMissingSecurityPath), false, 'update should not create missing files');
assert.ok(updateResult.written.includes('.agents/spec/backend/code-style-guidelines.md'));
assert.match(updatedCodeStyle, /历史概览保留。/);
assert.match(updatedCodeStyle, /## 命名规范\s+> 对于类、接口、注解、枚举的命名规范定义。/);
assert.doesNotMatch(updatedCodeStyle, /## 格式规范/);

const updateLegacyRoot = await createFixtureRoot('setup-spec-update-legacy');
const updateLegacyCodeStylePath = path.join(updateLegacyRoot, '.agents', 'spec', 'backend', 'code-style-guidelines.md');
await fs.mkdir(path.join(updateLegacyRoot, '.agents', 'spec', 'backend'), {recursive: true});
await fs.writeFile(
  updateLegacyCodeStylePath,
  '# 代码风格规范\n\n## 概览\n历史概览保留。\n\n## 命名规范\n- 名称直接描述职责和边界，避免 `util`、`helper`、`manager` 这类糊弄词。\n- 与现有模块、目录和领域术语保持一致，别在一个仓库里混三套命名体系。\n',
  'utf8',
);

await mod.setupSpec(updateLegacyRoot, {mode: 'update'});
const updatedLegacyCodeStyle = await readUtf8(updateLegacyCodeStylePath);
assert.match(updatedLegacyCodeStyle, /历史概览保留。/);
assert.match(updatedLegacyCodeStyle, /## 命名规范\s+> 对于类、接口、注解、枚举的命名规范定义。/);
assert.doesNotMatch(updatedLegacyCodeStyle, /名称直接描述职责和边界/);

const updateUserContentRoot = await createFixtureRoot('setup-spec-update-user-content');
const updateUserContentPath = path.join(updateUserContentRoot, '.agents', 'spec', 'backend', 'code-style-guidelines.md');
await fs.mkdir(path.join(updateUserContentRoot, '.agents', 'spec', 'backend'), {recursive: true});
await fs.writeFile(
  updateUserContentPath,
  '# 代码风格规范\n\n## 概览\n历史概览保留。\n\n## 命名规范\n- 类名统一采用业务名词加后缀。\n- 方法名统一采用动词开头。\n',
  'utf8',
);

await mod.setupSpec(updateUserContentRoot, {mode: 'update'});
const updatedUserContent = await readUtf8(updateUserContentPath);
assert.match(updatedUserContent, /类名统一采用业务名词加后缀。/);
assert.match(updatedUserContent, /方法名统一采用动词开头。/);
assert.doesNotMatch(updatedUserContent, /> 对于类、接口、注解、枚举的命名规范定义。/);

const cliRoot = await createFixtureRoot('setup-spec-cli');
const firstOutput = [];
await runSetupFlow(cliRoot, {
  ask: async () => '2',
  write: (text) => firstOutput.push(text),
});

const cliExistingPath = path.join(cliRoot, '.agents', 'spec', 'backend', 'index.md');
await fs.writeFile(cliExistingPath, 'should change\n', 'utf8');
const answers = ['1', '2'];
const secondOutput = [];
await runSetupFlow(cliRoot, {
  ask: async () => answers.shift() ?? '',
  write: (text) => secondOutput.push(text),
});

const cliOverwritten = await readUtf8(cliExistingPath);
assert.notEqual(cliOverwritten, 'should change\n');
assert.match(secondOutput.join(''), /Mode: overwrite/i);
assert.match(secondOutput.join(''), /Backend template: java/i);

console.log('setup-spec checks passed');