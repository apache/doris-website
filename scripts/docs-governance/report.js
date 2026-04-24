#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./manifest');
const { lintFrontmatter } = require('./lint-frontmatter');
const { lintMarkdownStructure } = require('./lint-markdown-structure');
const { lintSidebar } = require('./lint-sidebar');
const { lintLinks } = require('./lint-links');
const { lintSeo } = require('./lint-seo');
const { ensureDirForFile, getChangedFiles, getChangedRecords, parseArgs } = require('./lib');

function filterFindings(findings, changedFiles) {
  if (!changedFiles || changedFiles.length === 0) {
    return findings;
  }
  const changed = new Set(changedFiles);
  return findings.filter((finding) => {
    const related = finding.related_paths || [];
    return (
      changed.has(finding.path) ||
      changed.has(finding.path.replace(/^\.\//, '')) ||
      related.some((relatedPath) => changed.has(relatedPath))
    );
  });
}

function runChecks(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const changedFiles = options.changedFiles || null;
  const changedRecords = options.changedRecords || [];
  const manifest = buildManifest({ rootDir });
  const findings = filterFindings(
    [
      ...lintFrontmatter({ rootDir, manifest }),
      ...lintMarkdownStructure({ rootDir, manifest }),
      ...lintSidebar({ rootDir, manifest }),
      ...lintLinks({ rootDir, manifest, changedFiles: changedFiles || [], changedRecords }),
      ...lintSeo({ rootDir, manifest }),
    ],
    changedFiles,
  );

  const bySeverity = findings.reduce((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    summary: {
      entries: manifest.entries.length,
      findings: findings.length,
      by_severity: bySeverity,
      changed_only: Boolean(changedFiles),
    },
    manifest,
    findings,
  };
}

function escapeAnnotation(value) {
  return String(value)
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}

function printGithubAnnotations(findings) {
  for (const finding of findings) {
    const level = finding.severity === 'error'
      ? 'error'
      : finding.severity === 'info'
        ? 'notice'
        : 'warning';
    const file = escapeAnnotation(finding.path);
    const line = finding.line || 1;
    const title = escapeAnnotation(finding.rule);
    const message = escapeAnnotation(`${finding.message} Owner: ${finding.owner || 'unknown'}`);
    process.stdout.write(`::${level} file=${file},line=${line},title=${title}::${message}\n`);
  }
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const changedFiles = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const changedRecords = args.changed ? getChangedRecords(rootDir) : [];
  const report = runChecks({ rootDir, changedFiles, changedRecords });
  const format = args.format || 'github';

  if (format === 'github') {
    printGithubAnnotations(report.findings);
    process.stdout.write(
      `Docs governance report: ${report.summary.findings} findings across ${report.summary.entries} manifest entries.\n`,
    );
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }

  if (args.output) {
    const outputPath = path.resolve(rootDir, args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  if (args['fail-on-findings'] && report.findings.length > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  escapeAnnotation,
  printGithubAnnotations,
  runChecks,
};
