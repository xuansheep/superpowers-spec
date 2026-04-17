import path from 'node:path';
import { stdout as output } from 'node:process';
import { runSpecUpdate } from './update-spec-lib.mjs';

const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
await runSpecUpdate(repoRoot, {
  write: (text) => output.write(text),
});
