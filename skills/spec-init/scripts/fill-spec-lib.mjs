import fs from 'node:fs/promises';
import path from 'node:path';
import { SPEC_TREE, setupSpec } from './lib.mjs';

export async function askChoice(ask, write, title, options) {
  while (true) {
    const promptText = `${title}\n${options.map((option) => `${option.key}. ${option.label}`).join('\n')}\n> `;
    const answer = (await ask(promptText)).trim();
    const matched = options.find((option) => option.key === answer);
    if (matched) {
      return matched.value;
    }
    write('Invalid choice. Try again.\n');
  }
}

export async function runSetupFlow(repoRoot, { ask, write = () => {} }) {
  const specRoot = path.join(repoRoot, '.agents', 'spec');
  const hasExistingSpec = await fs.access(specRoot).then(() => true).catch(() => false);

  let mode = 'initialize';
  if (hasExistingSpec) {
    mode = await askChoice(ask, write, 'Overwrite or update existing spec files?', [
      { key: '1', label: 'Overwrite', value: 'overwrite' },
      { key: '2', label: 'Update', value: 'update' },
    ]);
  }

  let backendTemplate = 'custom';
  if (mode !== 'update') {
    backendTemplate = await askChoice(ask, write, 'Choose backend template', [
      { key: '1', label: 'custom', value: 'custom' },
      { key: '2', label: 'java', value: 'java' },
    ]);
  }

  const result = await setupSpec(repoRoot, { mode, backendTemplate });
  const skippedCount = Object.values(SPEC_TREE).flat().length - result.written.length;

  write(`Initialized .agents/spec for ${result.facts.projectName} at ${repoRoot}\n`);
  write(`Mode: ${mode}\n`);
  if (mode !== 'update') {
    write(`Backend template: ${backendTemplate}\n`);
  }
  if (result.written.length === 0) {
    write('No spec files were changed.\n');
  } else {
    write('Changed files:\n');
    for (const file of result.written) {
      write(`- ${file}\n`);
    }
  }
  if (result.created.length > 0) {
    write(`Created files: ${result.created.length}\n`);
  }
  if (skippedCount > 0) {
    write(`Skipped files: ${skippedCount}\n`);
  }

  return { ...result, mode, backendTemplate, skippedCount };
}