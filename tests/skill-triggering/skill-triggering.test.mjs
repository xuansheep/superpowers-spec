import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const skillTriggeringDir = path.join(repoRoot, 'tests', 'skill-triggering');
const promptsDir = path.join(skillTriggeringDir, 'prompts');
const runAllPath = path.join(skillTriggeringDir, 'run-all.sh');
const runAllContent = await fs.readFile(runAllPath, 'utf8');

for (const skill of ['reading-spec', 'spec-init', 'spec-update']) {
  assert.match(runAllContent, new RegExp(`"${skill}"`), `${skill} should be listed in run-all.sh`);

  const promptPath = path.join(promptsDir, `${skill}.txt`);
  await fs.access(promptPath);

  const promptContent = await fs.readFile(promptPath, 'utf8');
  assert.match(promptContent, new RegExp(skill), `${skill} prompt should mention the skill by name`);
}

const negativePromptPath = path.join(promptsDir, 'brainstorming-implicit.txt');
await fs.access(negativePromptPath);
assert.match(runAllContent, /run-negative-test\.sh/, 'run-all.sh should execute the negative runner');
assert.match(runAllContent, /brainstorming-not-explicit/, 'run-all.sh should report the brainstorming negative case');

const negativePromptContent = await fs.readFile(negativePromptPath, 'utf8');
assert.doesNotMatch(
  negativePromptContent,
  /brainstorming/i,
  'negative brainstorming prompt should not mention the skill by name'
);

console.log('skill-triggering checks passed');
