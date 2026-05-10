#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { buildManifest } = require('./manifest');
const { ensureDirForFile, getChangedFiles, parseArgs } = require('./lib');

function makeFinding(entry, rule, line, message) {
  return {
    severity: 'warning',
    rule,
    path: entry.source_path,
    line,
    message,
    owner: entry.owner,
  };
}

function lintContent(entry, content) {
  const findings = [];
  const lines = content.split(/\r?\n/);
  let h1Count = 0;
  let previousHeadingLevel = 0;
  let inCodeBlock = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const fence = line.match(/^\s*```(\S*)\s*$/);
    if (fence) {
      if (!inCodeBlock && !fence[1]) {
        findings.push(
          makeFinding(entry, 'markdown-code-fence-language', lineNumber, 'Code fence should declare a language.'),
        );
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const heading = line.match(/^(#{1,6})(\s*)(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[3].trim();
      if (!text) {
        findings.push(makeFinding(entry, 'markdown-empty-heading', lineNumber, 'Markdown heading text is empty.'));
      }
      if (level === 1) {
        h1Count += 1;
        if (h1Count > 1) {
          findings.push(makeFinding(entry, 'markdown-single-h1', lineNumber, 'Document should not contain multiple H1 headings.'));
        }
      }
      if (previousHeadingLevel && level > previousHeadingLevel + 1) {
        findings.push(
          makeFinding(
            entry,
            'markdown-heading-increment',
            lineNumber,
            `Heading level jumps from H${previousHeadingLevel} to H${level}.`,
          ),
        );
      }
      previousHeadingLevel = level;
      continue;
    }

    if (/[\u4e00-\u9fff][A-Za-z0-9]|[A-Za-z0-9][\u4e00-\u9fff]/.test(line)) {
      findings.push(
        makeFinding(
          entry,
          'markdown-cjk-spacing',
          lineNumber,
          'Chinese text should contain spaces around adjacent English words or numbers.',
        ),
      );
    }
  }

  return findings;
}

function lintMarkdownStructure(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  const findings = [];

  for (const entry of manifest.entries) {
    const absPath = path.join(rootDir, entry.source_path);
    const parsed = matter(fs.readFileSync(absPath, 'utf8'));
    findings.push(...lintContent(entry, parsed.content || ''));
  }

  return findings;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const files = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const manifest = buildManifest({ rootDir, files });
  const findings = lintMarkdownStructure({ rootDir, manifest });
  const output = JSON.stringify({ schema_version: 1, findings }, null, 2);
  if (args.output) {
    const outputPath = path.resolve(rootDir, args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, `${output}\n`, 'utf8');
  } else {
    process.stdout.write(`${output}\n`);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  lintMarkdownStructure,
  lintContent,
};

