import path from 'node:path';
import { ensureSpecTree } from './lib.mjs';

const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
const created = await ensureSpecTree(repoRoot);

console.log(`Initialized .agents/spec in ${repoRoot}`);
if (created.length === 0) {
  console.log('No new files were needed.');
} else {
  console.log('Created files:');
  for (const file of created) {
    console.log(`- ${file}`);
  }
}