#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./manifest');
const { ensureDirForFile, getChangedFiles, parseArgs } = require('./lib');
const {
  filterFindings,
  findSection,
  makeFinding,
  parseMarkdownSections,
  readMarkdownEntry,
  severityForEntry,
} = require('./doc-quality-utils');

const REQUIRED_FEATURE_SECTIONS = [
  {
    label: 'Overview',
    aliases: ['Overview', 'Overview paragraph', '概览', '概述', '简介'],
  },
  {
    label: 'Quick Start',
    aliases: ['Quick Start', 'Quick start', 'Basic usage', 'Quick Start / Basic usage', 'Quick Start/Basic usage', '快速开始', '基本使用', '基本用法'],
  },
  {
    label: 'Parameters/Options',
    aliases: ['Parameters', 'Options', 'Parameters / Options', 'Parameters/Options', 'Parameter reference', 'Options reference', '参数', '选项', '参数配置'],
  },
  {
    label: 'Examples',
    aliases: ['Examples', 'Example', '示例'],
  },
  {
    label: 'Error handling',
    aliases: ['Error handling', 'Caveats', 'Error handling and caveats', 'Error handling/Caveats', 'Known issues', 'Limitations', '错误处理', '注意事项', '限制'],
  },
  {
    label: 'Best practices',
    aliases: ['Best practices', 'Best Practices', '最佳实践'],
  },
];

function frontMatterDocType(data) {
  const raw = String(data?.doc_type || data?.docType || '').trim().toLowerCase();
  return raw.replace(/-/g, '_');
}

function isFeatureEntry(entry, markdown) {
  const explicitType = frontMatterDocType(markdown.data);
  return explicitType === 'feature' || entry.doc_type === 'feature';
}

function lintFeatureDocEntry(entry, markdown) {
  const severity = severityForEntry(entry);
  const sections = parseMarkdownSections(markdown.content);
  const findings = [];

  for (const requiredSection of REQUIRED_FEATURE_SECTIONS) {
    if (findSection(sections, requiredSection.aliases)) {
      continue;
    }
    findings.push(
      makeFinding(
        entry,
        severity,
        'feature-doc-section-required',
        1,
        `Feature docs should include a ${requiredSection.label} section.`,
      ),
    );
  }

  return findings;
}

function lintFeatureDocs(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  const findings = [];

  for (const entry of manifest.entries) {
    const markdown = readMarkdownEntry(rootDir, entry);
    if (!markdown || !isFeatureEntry(entry, markdown)) {
      continue;
    }
    findings.push(...lintFeatureDocEntry(entry, markdown));
  }

  return findings;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const changedFiles = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const manifest = buildManifest({ rootDir });
  const findings = filterFindings(lintFeatureDocs({ rootDir, manifest }), changedFiles);
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
  REQUIRED_FEATURE_SECTIONS,
  lintFeatureDocs,
};
