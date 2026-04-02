import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const skillTriggeringDir = path.join(repoRoot, 'tests', 'skill-triggering');
const promptsDir = path.join(skillTriggeringDir, 'prompts');
const runAllPath = path.join(skillTriggeringDir, 'run-all.sh');
const runAllContent = await fs.readFile(runAllPath, 'utf8');

for (const skill of ['reading-spec', 'setup']) {
  assert.match(runAllContent, new RegExp(`"${skill}"`), `${skill} should be listed in run-all.sh`);

  const promptPath = path.join(promptsDir, `${skill}.txt`);
  await fs.access(promptPath);

  const promptContent = await fs.readFile(promptPath, 'utf8');
  assert.match(promptContent, new RegExp(skill), `${skill} prompt should mention the skill by name`);
}

console.log('skill-triggering checks passed');
