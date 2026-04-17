import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { runSetupFlow } from './fill-spec-lib.mjs';

async function readPipedInput() {
  return new Promise((resolve, reject) => {
    let data = '';
    input.setEncoding('utf8');
    input.on('data', (chunk) => {
      data += chunk;
    });
    input.on('end', () => resolve(data));
    input.on('error', reject);
  });
}

async function createAnswerReader() {
  if (input.isTTY) {
    const rl = readline.createInterface({ input, output });
    return {
      async ask(promptText) {
        return await rl.question(promptText);
      },
      close() {
        rl.close();
      },
    };
  }

  const answers = (await readPipedInput()).split(/\r?\n/);
  return {
    async ask(promptText) {
      output.write(promptText);
      return answers.shift() ?? '';
    },
    close() {},
  };
}

const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
const reader = await createAnswerReader();

try {
  await runSetupFlow(repoRoot, {
    ask: (promptText) => reader.ask(promptText),
    write: (text) => output.write(text),
  });
} finally {
  reader.close();
}