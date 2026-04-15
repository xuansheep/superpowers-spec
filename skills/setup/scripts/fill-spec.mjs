import path from 'node:path';
import { setupSpec } from './lib.mjs';

const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
const { facts, created, written } = await setupSpec(repoRoot);
const skippedCount = Object.values((await import('./lib.mjs')).SPEC_TREE)
  .flat().length - written.length;

console.log(`Initialized .agents/spec for ${facts.projectName} at ${repoRoot}`);
if (created.length === 0) {
  console.log('No new spec files were created. Existing files were left untouched.');
} else {
  console.log('Created and populated files:');
  for (const file of written) {
    console.log(`- ${file}`);
  }
}
if (skippedCount > 0) {
  console.log(`Skipped existing files: ${skippedCount}`);
}
