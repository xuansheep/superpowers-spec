import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = path.resolve(MODULE_DIR, '..', '..', '..', 'template', 'backend');
const REFRESHABLE_TITLES = new Set([
  '规范索引',
  '阅读建议',
  '当前项目线索',
  '当前 Evidence Sources',
  'Current Evidence Sources',
  'Documentation Files',
  'Quick Navigation',
  'Core Rules Summary',
  'High-Signal Inputs',
  'Current Project Conventions',
  'Examples',
  'Verification Checklist',
  'Review Checklist',
]);
const LEGACY_GENERATED_MARKERS = [
  '名称直接描述职责和边界，避免 `util`、`helper`、`manager` 这类糊弄词。',
  '数据层规则要解决可维护性、一致性和变更可控，不是给事故复盘时找借口。',
  '工程实践规范关心的是系统长期不烂掉，而不是本次提交看起来多勤奋。',
  '安全规则默认按生产环境来要求，不因为“内部系统”三个字就放水。',
  '当前目录结构应以仓库真实布局为准，优先复用已存在的模块边界，不要凭空发明新层级。',
  '目录名优先体现业务责任，其次才是技术手段。',
  '新代码和仓库现有命名、结构风格完全脱节。',
  '把过滤、排序和分页写得能被人复核，不要堆魔法常量。',
  '日志服务于排障和审计，不是情绪发泄区。',
  '任何删除文件操作都先征求用户同意，这是硬规则，不是建议。',
];

function normalizeContent(content) {
  return content.replace(/\r\n/g, '\n');
}

function bulletList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function joinOrFallback(items, fallback) {
  return items.length > 0 ? bulletList(items) : `- ${fallback}`;
}

function readTemplate(templateName, fileName) {
  return normalizeContent(fs.readFileSync(path.join(TEMPLATE_ROOT, templateName, fileName), 'utf8'));
}

function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

function collectRepoDirectories(repoRoot) {
  if (!pathExists(repoRoot)) {
    return [];
  }
  return fs.readdirSync(repoRoot, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

function existingPaths(repoRoot, candidates) {
  return candidates.filter((relativePath) => pathExists(path.join(repoRoot, relativePath)));
}

function parseMarkdownSections(markdown) {
  const normalized = normalizeContent(markdown).trimEnd() + '\n';
  const lines = normalized.split('\n');
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({index, level: match[1].length, title: match[2].trim(), headingLine: lines[index]});
    }
  }
  if (headings.length === 0) {
    return {preamble: normalized.trimEnd(), sections: []};
  }
  const preamble = lines.slice(0, headings[0].index).join('\n').replace(/\n+$/, '');
  const sections = headings.map((heading, index) => {
    const nextIndex = index + 1 < headings.length ? headings[index + 1].index : lines.length;
    const rawBody = lines.slice(heading.index + 1, nextIndex).join('\n').replace(/\n+$/, '');
    const separatorMatch = rawBody.match(/([\s\S]*?)(\n\n---\n?)$/);
    const body = separatorMatch ? separatorMatch[1].trim() : rawBody.trim();
    const suffix = separatorMatch ? '\n\n---' : '';
    return {...heading, body, suffix};
  });
  return {preamble, sections};
}

function buildMarkdown(parsed) {
  const chunks = [];
  if (parsed.preamble) {
    chunks.push(parsed.preamble.trimEnd());
  }
  for (const section of parsed.sections) {
    let chunk = section.headingLine;
    if (section.body) {
      chunk += `\n\n${section.body.trim()}`;
    }
    if (section.suffix) {
      chunk += section.suffix;
    }
    chunks.push(chunk.trimEnd());
  }
  return `${chunks.join('\n\n').trim()}\n`;
}

function appendSectionBodies(templateContent, additions) {
  const parsed = parseMarkdownSections(templateContent);
  parsed.sections = parsed.sections.map((section) => {
    if (!Object.prototype.hasOwnProperty.call(additions, section.title)) {
      return section;
    }
    const appendix = additions[section.title].trim();
    if (!appendix) {
      return section;
    }
    const body = [section.body.trim(), appendix].filter(Boolean).join('\n\n');
    return {...section, body};
  });
  return buildMarkdown(parsed);
}

function isBlankBody(body) {
  const normalized = body.replace(/---/g, '').trim();
  return normalized.length === 0;
}

function looksLikeLegacyGeneratedContent(body) {
  return LEGACY_GENERATED_MARKERS.some((marker) => body.includes(marker));
}

function shouldRefreshSection(title, body) {
  if (isBlankBody(body)) {
    return true;
  }
  if (REFRESHABLE_TITLES.has(title)) {
    return true;
  }
  if (/TODO|待补充|TBD/i.test(body)) {
    return true;
  }
  return looksLikeLegacyGeneratedContent(body);
}

export function updateMarkdownUsingExistingHeadings(currentContent, candidateContent) {
  const current = parseMarkdownSections(currentContent);
  const candidate = parseMarkdownSections(candidateContent);
  const candidateByTitle = new Map(candidate.sections.map((section) => [section.title, section]));
  current.sections = current.sections.map((section) => {
    const candidateSection = candidateByTitle.get(section.title);
    if (!candidateSection) {
      return section;
    }
    if (!shouldRefreshSection(section.title, section.body)) {
      return section;
    }
    return {...section, body: candidateSection.body};
  });
  return buildMarkdown(current);
}

function renderDirectoryExamples(facts) {
  const examples = [];
  for (const candidate of ['src/main/java', 'src/test/java', 'src/main/resources', 'src/test/resources']) {
    if (pathExists(path.join(facts.repoRoot, candidate))) {
      examples.push(candidate);
    }
  }
  for (const candidate of ['hooks', 'agents', 'skills', 'scripts', 'tests', 'docs']) {
    if (pathExists(path.join(facts.repoRoot, candidate))) {
      examples.push(candidate);
    }
  }
  return examples;
}

function renderCustomDirectoryStructure(facts) {
  const template = readTemplate('custom', 'directory-structure.md');
  const repoDirectories = collectRepoDirectories(facts.repoRoot);
  const structureSignals = renderDirectoryExamples(facts);
  return appendSectionBodies(template, {
    '概览': bulletList([
      `当前仓库根目录可见的主要目录：${repoDirectories.length > 0 ? repoDirectories.join('、') : '暂无明显后端目录'}`,
      '目录结构应以仓库真实布局为准，新增目录前先证明职责稳定和长期复用价值。',
    ]),
    '目录布局': joinOrFallback(
      structureSignals.map((item) => `\`${item}\``),
      '暂未检测到典型后端目录，请按真实项目结构补充。',
    ),
    '参考示例': joinOrFallback(
      structureSignals.map((item) => `\`${item}\``),
      '暂无可引用的结构示例。',
    ),
  });
}

function renderCustomBackend(relativePath, facts) {
  switch (relativePath) {
    case 'backend/index.md':
      return readTemplate('custom', 'index.md').replace(/\n$/, '');
    case 'backend/directory-structure.md':
      return renderCustomDirectoryStructure(facts).replace(/\n$/, '');
    case 'backend/database-guidelines.md':
      return readTemplate('custom', 'database-guidelines.md').replace(/\n$/, '');
    case 'backend/code-style-guidelines.md':
      return readTemplate('custom', 'code-style-guidelines.md').replace(/\n$/, '');
    case 'backend/engineering-guidelines.md':
      return readTemplate('custom', 'engineering-guidelines.md').replace(/\n$/, '');
    case 'backend/security-guidelines.md':
      return readTemplate('custom', 'security-guidelines.md').replace(/\n$/, '');
    default:
      throw new Error(`Unsupported backend spec file: ${relativePath}`);
  }
}

function renderJavaDirectoryStructure(facts) {
  const template = readTemplate('java', 'directory-structure.md');
  const javaLayout = existingPaths(facts.repoRoot, ['src/main/java', 'src/test/java', 'src/main/resources', 'src/test/resources']);
  return appendSectionBodies(template, {
    '概览': bulletList([
      'Java 模板只对目录结构文档做事实填充，其他专题文档保持模板原文。',
      '目录结构优先反映当前项目已存在的模块和源码布局。',
    ]),
    '目录布局': joinOrFallback(javaLayout.map((item) => `\`${item}\``), '暂未检测到标准 Java 源码目录。'),
    '参考示例': joinOrFallback(javaLayout.map((item) => `\`${item}\``), '暂无可引用的 Java 目录示例。'),
  });
}

function renderJavaBackend(relativePath, facts) {
  const fileName = relativePath.replace('backend/', '');
  if (fileName === 'directory-structure.md') {
    return renderJavaDirectoryStructure(facts).replace(/\n$/, '');
  }
  return readTemplate('java', fileName).replace(/\n$/, '');
}

export function renderBackendSpecFile(relativePath, facts, options = {}) {
  const backendTemplate = options.backendTemplate ?? 'custom';
  if (backendTemplate === 'java') {
    return renderJavaBackend(relativePath, facts);
  }
  return renderCustomBackend(relativePath, facts);
}