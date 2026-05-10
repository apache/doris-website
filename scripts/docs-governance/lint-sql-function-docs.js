#!/usr/bin/env node

const path = require('path');
const { buildManifest } = require('./manifest');
const { ensureDirForFile, getChangedFiles, parseArgs } = require('./lib');
const {
  extractFencedCodeBlocks,
  filterFindings,
  findSection,
  hasMarkdownTableWithColumns,
  makeFinding,
  parseMarkdownSections,
  readMarkdownEntry,
  severityForEntry,
  textOutsideFencedCode,
} = require('./doc-quality-utils');

const fs = require('fs');

const REQUIRED_SECTIONS = [
  { label: 'Description', aliases: ['Description', '描述'] },
  { label: 'Syntax', aliases: ['Syntax', '语法'] },
  { label: 'Parameters', aliases: ['Parameters', 'Parameter', '参数'] },
  { label: 'Return Value', aliases: ['Return Value', 'Return Values', '返回值'] },
  { label: 'Example', aliases: ['Example', 'Examples', '示例'] },
];

const PARAMETER_TABLE_COLUMNS = [
  ['Parameter', '参数'],
  ['Description', '描述'],
];

const RETURN_TYPE_RE = /\b(?:type|boolean|bool|tinyint|smallint|int|integer|bigint|largeint|float|double|decimal|string|char|varchar|text|date|datetime|time|json|array|map|struct|bitmap|hll|quantile_state|variant|ip|ipv4|ipv6|number|numeric)\b|类型/i;
const NULL_CONDITION_RE = /\bnull\b|空值|空/i;

function isSqlFunctionEntry(entry) {
  return entry.doc_type === 'sql_function';
}

function validateRequiredSections(entry, sections, severity) {
  const findings = [];
  const found = REQUIRED_SECTIONS.map((section) => ({
    ...section,
    matched: findSection(sections, section.aliases),
  }));
  const missing = found.filter((section) => !section.matched);

  if (missing.length > 0) {
    findings.push(
      makeFinding(
        entry,
        severity,
        'sql-function-section-order',
        1,
        `SQL function docs must contain sections in this order: ${REQUIRED_SECTIONS.map((section) => section.label).join(', ')}. Missing: ${missing.map((section) => section.label).join(', ')}.`,
      ),
    );
    return findings;
  }

  for (let index = 1; index < found.length; index += 1) {
    if (found[index].matched.line <= found[index - 1].matched.line) {
      findings.push(
        makeFinding(
          entry,
          severity,
          'sql-function-section-order',
          found[index].matched.line,
          `SQL function sections are out of order. Expected: ${REQUIRED_SECTIONS.map((section) => section.label).join(', ')}.`,
        ),
      );
      break;
    }
  }

  return findings;
}

function validateSyntax(entry, section, severity) {
  if (!section) {
    return [];
  }
  const blocks = extractFencedCodeBlocks(section.content);
  const prose = textOutsideFencedCode(section.content).trim();
  const hasSingleSqlBlock = blocks.length === 1 && blocks[0].lang === 'sql' && prose.length === 0;
  if (hasSingleSqlBlock) {
    return [];
  }
  return [
    makeFinding(
      entry,
      severity,
      'sql-function-syntax-sql-code-block',
      section.line,
      'Syntax section must contain only one fenced sql code block.',
    ),
  ];
}

function validateParameters(entry, section, severity) {
  if (!section || hasMarkdownTableWithColumns(section.content, PARAMETER_TABLE_COLUMNS)) {
    return [];
  }
  return [
    makeFinding(
      entry,
      severity,
      'sql-function-parameters-table',
      section.line,
      'Parameters section must be a Markdown table with Parameter and Description columns.',
    ),
  ];
}

function validateReturnValue(entry, section, severity) {
  if (!section) {
    return [];
  }
  const findings = [];
  const text = textOutsideFencedCode(section.content).replace(/\s+/g, ' ').trim();

  if (!RETURN_TYPE_RE.test(text)) {
    findings.push(
      makeFinding(
        entry,
        severity,
        'sql-function-return-type',
        section.line,
        'Return Value section must state the returned type.',
      ),
    );
  }

  if (!NULL_CONDITION_RE.test(text)) {
    findings.push(
      makeFinding(
        entry,
        severity,
        'sql-function-return-null',
        section.line,
        'Return Value section must document NULL return conditions, including when the function never returns NULL.',
      ),
    );
  }

  return findings;
}

function validateExamples(entry, section, severity) {
  if (!section) {
    return [];
  }
  const blocks = extractFencedCodeBlocks(section.content);
  const findings = [];
  const sqlBlocks = blocks.filter((block) => block.lang === 'sql');

  if (sqlBlocks.length === 0) {
    findings.push(
      makeFinding(
        entry,
        severity,
        'sql-function-example-output',
        section.line,
        'Example section must include at least one fenced sql query followed by a fenced text output block.',
      ),
    );
    return findings;
  }

  for (let index = 0; index < blocks.length; index += 1) {
    if (blocks[index].lang !== 'sql') {
      continue;
    }
    const nextBlock = blocks[index + 1];
    if (!nextBlock || nextBlock.lang !== 'text') {
      findings.push(
        makeFinding(
          entry,
          severity,
          'sql-function-example-output',
          section.line + blocks[index].startLine,
          'Every fenced sql query in Example must be followed by a fenced text block with expected output.',
        ),
      );
    }
  }

  return findings;
}

function lintSqlFunctionDocs(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  const findings = [];

  for (const entry of manifest.entries.filter(isSqlFunctionEntry)) {
    const markdown = readMarkdownEntry(rootDir, entry);
    if (!markdown) {
      continue;
    }
    const severity = severityForEntry(entry);
    const sections = parseMarkdownSections(markdown.content);
    const syntaxSection = findSection(sections, REQUIRED_SECTIONS[1].aliases);
    const parametersSection = findSection(sections, REQUIRED_SECTIONS[2].aliases);
    const returnValueSection = findSection(sections, REQUIRED_SECTIONS[3].aliases);
    const exampleSection = findSection(sections, REQUIRED_SECTIONS[4].aliases);

    findings.push(
      ...validateRequiredSections(entry, sections, severity),
      ...validateSyntax(entry, syntaxSection, severity),
      ...validateParameters(entry, parametersSection, severity),
      ...validateReturnValue(entry, returnValueSection, severity),
      ...validateExamples(entry, exampleSection, severity),
    );
  }

  return findings;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const changedFiles = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const manifest = buildManifest({ rootDir });
  const findings = filterFindings(lintSqlFunctionDocs({ rootDir, manifest }), changedFiles);
  const output = JSON.stringify({ schema_version: 1, findings }, null, 2);

  if (args.output) {
    const outputPath = path.resolve(rootDir, args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, `${output}\n`, 'utf8');
  } else {
    process.stdout.write(`${output}\n`);
  }

  if (args['fail-on-findings'] && findings.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  REQUIRED_SECTIONS,
  lintSqlFunctionDocs,
};
