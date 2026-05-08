import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {updateMarkdownUsingExistingHeadings} from '../../spec-init/scripts/backend.mjs';
import {SPEC_TREE, collectRepoFacts, renderSpecFile, setupSpec} from '../../spec-init/scripts/lib.mjs';

const execFileAsync = promisify(execFile);
const SPEC_ROOT = path.join('.agents', 'spec');
const GIT_CANDIDATES = [
  process.env.GIT,
  'git.exe',
  'git',
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
].filter(Boolean);

let cachedGitExecutable;

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listSpecFiles(repoRoot) {
  const specRoot = path.join(repoRoot, SPEC_ROOT);
  if (!(await pathExists(specRoot))) {
    return [];
  }

  const discovered = [];

  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, {withFileTypes: true});
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile()) {
        discovered.push(path.relative(repoRoot, entryPath).replace(/\\/g, '/'));
      }
    }
  }

  await walk(specRoot);
  return discovered.sort();
}

async function readExistingSpecFiles(repoRoot, existingSpecFiles) {
  const contents = {};
  for (const relativePath of existingSpecFiles) {
    contents[relativePath] = await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
  }
  return contents;
}

function managedSpecPathSet() {
  return new Set(
    Object.entries(SPEC_TREE).flatMap(([section, files]) => files.map((entry) => `docs/project-spec/${section}/${entry.file}`)),
  );
}

function parseMarkdownSections(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n').trimEnd() + '\n';
  const lines = normalized.split('\n');
  const headings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({index, level: match[1].length, title: match[2].trim()});
    }
  }

  return headings.map((heading, index) => {
    const nextIndex = index + 1 < headings.length ? headings[index + 1].index : lines.length;
    const body = lines.slice(heading.index + 1, nextIndex).join('\n').trim();
    return {title: heading.title, level: heading.level, body};
  });
}

function collectChangedSections(currentContent, updatedContent) {
  const currentSections = parseMarkdownSections(currentContent);
  const updatedSections = parseMarkdownSections(updatedContent);
  const updatedByTitle = new Map(updatedSections.map((section) => [section.title, section]));
  const changed = [];

  for (const section of currentSections) {
    const updatedSection = updatedByTitle.get(section.title);
    if (!updatedSection) {
      continue;
    }
    if (section.body !== updatedSection.body) {
      changed.push(section.title);
    }
  }

  return changed;
}

async function resolveGitExecutable() {
  if (cachedGitExecutable !== undefined) {
    return cachedGitExecutable;
  }

  for (const candidate of GIT_CANDIDATES) {
    try {
      await execFileAsync(candidate, ['--version'], {windowsHide: true, maxBuffer: 1024 * 1024});
      cachedGitExecutable = candidate;
      return cachedGitExecutable;
    } catch {
      // try next
    }
  }

  try {
    const {stdout} = await execFileAsync('where.exe', ['git'], {windowsHide: true, maxBuffer: 1024 * 1024});
    const candidates = stdout.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
    for (const candidate of candidates) {
      try {
        await execFileAsync(candidate, ['--version'], {windowsHide: true, maxBuffer: 1024 * 1024});
        cachedGitExecutable = candidate;
        return cachedGitExecutable;
      } catch {
        // keep trying
      }
    }
  } catch {
    // ignore
  }

  cachedGitExecutable = null;
  return cachedGitExecutable;
}

async function defaultGitReader({repoRoot, sinceIso}) {
  const gitExecutable = await resolveGitExecutable();
  if (!gitExecutable) {
    return {
      available: false,
      source: 'git',
      sinceIso,
      commits: [],
      error: 'git executable was not found.',
    };
  }

  try {
    const {stdout} = await execFileAsync(
      gitExecutable,
      [
        '-C',
        repoRoot,
        'log',
        `--since=${sinceIso}`,
        '--date=iso-strict',
        '--pretty=format:__COMMIT__%n%H%x1f%ad%x1f%s',
        '--patch',
        '--no-ext-diff',
        '--binary',
      ],
      {windowsHide: true, maxBuffer: 20 * 1024 * 1024},
    );

    const commits = stdout
      .split('__COMMIT__\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [metadataLine, ...patchLines] = entry.split('\n');
        const [hash = '', date = '', subject = ''] = metadataLine.split('\u001f');
        return {
          hash,
          date,
          subject,
          patch: patchLines.join('\n').trim(),
        };
      });

    return {
      available: true,
      source: 'git',
      gitExecutable,
      sinceIso,
      commits,
    };
  } catch (error) {
    return {
      available: false,
      source: 'git',
      gitExecutable,
      sinceIso,
      commits: [],
      error: error.stderr?.trim() || error.message,
    };
  }
}

async function collectSpecFileMeta(repoRoot, existingSpecFiles) {
  const metadata = [];
  for (const relativePath of existingSpecFiles) {
    const stat = await fs.stat(path.join(repoRoot, relativePath));
    metadata.push({
      path: relativePath,
      mtimeMs: stat.mtimeMs,
      mtimeIso: stat.mtime.toISOString(),
    });
  }
  return metadata.sort((left, right) => left.mtimeMs - right.mtimeMs);
}

async function evaluateManagedSpecUpdates(repoRoot, facts, existingSpecContents, managedExistingSpecFiles) {
  const proposedFiles = [];
  const proposedSectionsByFile = {};

  for (const relativePath of managedExistingSpecFiles) {
    const currentContent = existingSpecContents[relativePath] ?? await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
    const specRelativePath = relativePath.replace(/^\.agents\/spec\//, '');
    const candidateContent = `${renderSpecFile(specRelativePath, facts, {backendTemplate: 'custom'}).trim()}\n`;
    const updatedContent = updateMarkdownUsingExistingHeadings(currentContent, candidateContent);
    if (updatedContent === currentContent) {
      continue;
    }
    proposedFiles.push(relativePath);
    proposedSectionsByFile[relativePath] = collectChangedSections(currentContent, updatedContent);
  }

  return {proposedFiles, proposedSectionsByFile};
}

function summarizePatch(patch) {
  return patch
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? '';
}

export async function planSpecUpdate(repoRoot, {gitReader = defaultGitReader, factCollector = collectRepoFacts} = {}) {
  const specRootPath = path.join(repoRoot, SPEC_ROOT);
  const specRootExists = await pathExists(specRootPath);

  if (!specRootExists) {
    return {
      repoRoot,
      facts: null,
      mode: 'update-plan',
      specRootExists: false,
      specRootPath: SPEC_ROOT.replace(/\\/g, '/'),
      existingSpecFiles: [],
      existingManagedSpecFiles: [],
      unmanagedExistingSpecFiles: [],
      untouchedManagedSpecFiles: [],
      specFileMeta: [],
      earliestSpecMtime: null,
      gitEvidence: {
        available: false,
        source: 'git',
        commits: [],
        error: 'docs/project-spec was not found.',
      },
      proposedFiles: [],
      proposedSectionsByFile: {},
      approvalRequired: false,
    };
  }

  const existingSpecFiles = await listSpecFiles(repoRoot);
  const existingSpecContents = await readExistingSpecFiles(repoRoot, existingSpecFiles);
  const specFileMeta = await collectSpecFileMeta(repoRoot, existingSpecFiles);
  const earliestSpecMtime = specFileMeta[0]?.mtimeIso ?? null;
  const managedPaths = managedSpecPathSet();
  const existingManagedSpecFiles = existingSpecFiles.filter((entry) => managedPaths.has(entry));
  const unmanagedExistingSpecFiles = existingSpecFiles.filter((entry) => !managedPaths.has(entry));

  let gitEvidence;
  if (!earliestSpecMtime) {
    gitEvidence = {
      available: false,
      source: 'git',
      commits: [],
      error: 'No existing spec files were found under docs/project-spec.',
    };
  } else {
    try {
      gitEvidence = await gitReader({repoRoot, sinceIso: earliestSpecMtime});
    } catch (error) {
      gitEvidence = {
        available: false,
        source: 'git',
        sinceIso: earliestSpecMtime,
        commits: [],
        error: error.message,
      };
    }
  }

  const facts = await factCollector(repoRoot);
  const {proposedFiles, proposedSectionsByFile} = await evaluateManagedSpecUpdates(
    repoRoot,
    facts,
    existingSpecContents,
    existingManagedSpecFiles,
  );
  const proposedFileSet = new Set(proposedFiles);
  const untouchedManagedSpecFiles = existingManagedSpecFiles.filter((entry) => !proposedFileSet.has(entry));

  return {
    repoRoot,
    facts,
    mode: 'update-plan',
    specRootExists: true,
    specRootPath: SPEC_ROOT.replace(/\\/g, '/'),
    existingSpecFiles,
    existingManagedSpecFiles,
    unmanagedExistingSpecFiles,
    untouchedManagedSpecFiles,
    specFileMeta,
    earliestSpecMtime,
    gitEvidence,
    proposedFiles,
    proposedSectionsByFile,
    approvalRequired: proposedFiles.length > 0,
  };
}

function writeList(title, items, write) {
  write(`${title}\n`);
  if (items.length === 0) {
    write('- none\n');
    return;
  }

  for (const item of items) {
    write(`- ${item}\n`);
  }
}

function writeGitEvidence(plan, write) {
  if (plan.earliestSpecMtime) {
    write(`Git evidence window starts: ${plan.earliestSpecMtime}\n`);
  }

  if (!plan.gitEvidence.available) {
    write(`Git evidence unavailable: ${plan.gitEvidence.error}\n`);
    return;
  }

  write(`Git evidence commits: ${plan.gitEvidence.commits.length}\n`);
  write('Git commits collected for review:\n');
  if (plan.gitEvidence.commits.length === 0) {
    write('- none\n');
    return;
  }

  for (const commit of plan.gitEvidence.commits) {
    write(`- ${commit.hash} ${commit.date} ${commit.subject}\n`);
    const patchSummary = summarizePatch(commit.patch);
    if (patchSummary) {
      write(`  Patch: ${patchSummary}\n`);
    }
  }
}

function writePlanSummary(plan, write) {
  const projectName = plan.facts?.projectName ?? path.basename(plan.repoRoot);
  write(`Planned docs/project-spec update for ${projectName} at ${plan.repoRoot}\n`);
  write('Mode: update-plan\n');

  if (!plan.specRootExists) {
    write('docs/project-spec was not found.\n');
    write('No update plan generated.\n');
    return;
  }

  write(`Spec root found: ${plan.specRootPath}\n`);
  write(`Existing spec files: ${plan.existingSpecFiles.length}\n`);
  write(`Managed spec files considered: ${plan.existingManagedSpecFiles.length}\n`);
  if (plan.unmanagedExistingSpecFiles.length > 0) {
    write(`Unmanaged existing spec files: ${plan.unmanagedExistingSpecFiles.length}\n`);
  }
  writeList('Existing spec files considered:', plan.existingSpecFiles, write);
  writeGitEvidence(plan, write);

  if (plan.proposedFiles.length === 0) {
    write('No spec updates were proposed.\n');
    writeList('Managed spec files left untouched:', plan.untouchedManagedSpecFiles, write);
    return;
  }

  write('Proposed updates:\n');
  for (const relativePath of plan.proposedFiles) {
    const sections = plan.proposedSectionsByFile[relativePath] ?? [];
    const suffix = sections.length > 0 ? ` [${sections.join(', ')}]` : '';
    write(`- ${relativePath}${suffix}\n`);
  }
  writeList('Managed spec files left untouched:', plan.untouchedManagedSpecFiles, write);
  write('Approval required before applying updates.\n');
}

export async function runSpecUpdate(repoRoot, {write = () => {}, gitReader, factCollector} = {}) {
  const plan = await planSpecUpdate(repoRoot, {gitReader, factCollector});
  writePlanSummary(plan, write);
  return plan;
}

export async function applySpecUpdatePlan(repoRoot, plan, {approved = false} = {}) {
  if (!approved) {
    throw new Error('spec-update apply requires approved: true');
  }
  if (!plan || plan.mode !== 'update-plan') {
    throw new Error('spec-update apply requires a plan returned by planSpecUpdate or runSpecUpdate');
  }
  if (path.resolve(repoRoot) !== path.resolve(plan.repoRoot)) {
    throw new Error('spec-update apply requires the same repoRoot that was used to generate the plan');
  }
  if (!plan.specRootExists || plan.proposedFiles.length === 0) {
    return {facts: plan.facts, created: [], written: [], mode: 'update', backendTemplate: 'custom'};
  }
  return setupSpec(repoRoot, {mode: 'update'});
}
