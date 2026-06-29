import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const skillsDir = path.join(repoRoot, 'skills');
const skillTriggeringDir = path.join(repoRoot, 'tests', 'skill-triggering');
const promptsDir = path.join(skillTriggeringDir, 'prompts');
const runAllPath = path.join(skillTriggeringDir, 'run-all.sh');
const runAllContent = await fs.readFile(runAllPath, 'utf8');
const explicitRunAllPath = path.join(repoRoot, 'tests', 'explicit-skill-requests', 'run-all.sh');
const explicitRunAllContent = await fs.readFile(explicitRunAllPath, 'utf8');

const skillDirs = (await fs.readdir(skillsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

async function readSkill(skill) {
  const content = await fs.readFile(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, `${skill} should have YAML frontmatter`);
  const description = match[1].match(/^description:\s*(.*)$/m)?.[1] ?? '';
  return { content, description: description.replace(/^['"]|['"]$/g, '') };
}

function assertRequiredSkillBefore(content, firstSkill, secondSkill, label) {
  assert.match(
    content,
    new RegExp(`REQUIRED SUB-SKILL[^\\n]*${firstSkill.replaceAll('-', '\\-')}`),
    `${label} should require ${firstSkill}`
  );

  const firstIndex = content.indexOf(firstSkill);
  const secondIndex = content.indexOf(secondSkill);
  assert.notEqual(firstIndex, -1, `${label} should mention ${firstSkill}`);
  assert.notEqual(secondIndex, -1, `${label} should mention ${secondSkill}`);
  assert.ok(firstIndex < secondIndex, `${label} should load ${firstSkill} before ${secondSkill}`);
}

const brainstorming = await readSkill('brainstorming');
assert.match(
  brainstorming.description,
  /Use when the user explicitly requests (the )?brainstorming skill/i,
  'brainstorming description should be explicit-request only'
);
assert.doesNotMatch(
  brainstorming.description,
  /creative work|creating features|modifying behavior/i,
  'brainstorming description should not auto-trigger from implementation intent'
);

const usingSuperpowers = await readSkill('using-superpowers');
assert.match(usingSuperpowers.content, /## Skill Gate/, 'using-superpowers should define a skill gate');
assert.match(usingSuperpowers.content, /Gate closed/i, 'using-superpowers should document closed-gate behavior');
assert.match(usingSuperpowers.content, /approved brainstorming workflow/i, 'using-superpowers should name the approved brainstorming workflow state');

for (const skill of skillDirs) {
  if (skill === 'brainstorming' || skill === 'using-superpowers') continue;
  const { description } = await readSkill(skill);
  assert.match(
    description,
    /approved brainstorming workflow/i,
    `${skill} description should only trigger after an approved brainstorming workflow`
  );
}

assert.doesNotMatch(
  runAllContent,
  /if "\$SCRIPT_DIR\/run-test\.sh" "(systematic-debugging|test-driven-development|writing-plans|dispatching-parallel-agents|executing-plans|requesting-code-review|reading-spec|spec-init|spec-update)"/,
  'non-brainstorming skills should not have naive positive triggering tests'
);
assert.match(runAllContent, /GATED_SKILLS=\(/, 'run-all.sh should define gated negative tests');
assert.match(runAllContent, /"test-driven-development"/, 'TDD naive prompt should be included in gated negative tests');
assert.match(runAllContent, /run-negative-test\.sh" "\$skill"/, 'gated skills should run through the negative runner');
assert.match(runAllContent, /run-test\.sh" "brainstorming"/, 'explicit brainstorming request should remain a positive test');
assert.doesNotMatch(
  explicitRunAllContent,
  /run-test\.sh" "(systematic-debugging|subagent-driven-development|test-driven-development|writing-plans|executing-plans|requesting-code-review)/,
  'explicit non-brainstorming requests should not be positive tests while the gate is closed'
);
assert.match(explicitRunAllContent, /run_negative "use-systematic-debugging"/, 'explicit non-brainstorming requests should be negative gate tests');

const negativePromptPath = path.join(promptsDir, 'brainstorming-implicit.txt');
await fs.access(negativePromptPath);
const negativePromptContent = await fs.readFile(negativePromptPath, 'utf8');
assert.doesNotMatch(
  negativePromptContent,
  /brainstorming/i,
  'negative brainstorming prompt should not mention the skill by name'
);

const subagentDriven = await readSkill('subagent-driven-development');
const executingPlans = await readSkill('executing-plans');
assertRequiredSkillBefore(
  subagentDriven.content,
  'superpowers:test-driven-development',
  'superpowers:reading-spec',
  'subagent-driven-development'
);
assertRequiredSkillBefore(
  executingPlans.content,
  'superpowers:test-driven-development',
  'superpowers:reading-spec',
  'executing-plans'
);

const implementerPrompt = await fs.readFile(
  path.join(skillsDir, 'subagent-driven-development', 'implementer-prompt.md'),
  'utf8'
);
assert.doesNotMatch(
  implementerPrompt,
  /TDD if task says to|TDD if required|if required/i,
  'implementer prompt should require TDD unconditionally'
);
assert.match(
  implementerPrompt,
  /RED|failing test/i,
  'implementer prompt should require RED evidence'
);
assert.match(
  implementerPrompt,
  /GREEN|passing test/i,
  'implementer prompt should require GREEN evidence'
);

console.log('skill-triggering gate checks passed');
