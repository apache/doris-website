#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { buildManifest } = require('./manifest');
const { ensureDirForFile, getChangedFiles, parseArgs } = require('./lib');

function finding(entry, rule, message, extra = {}) {
  return {
    severity: extra.severity || 'warning',
    rule,
    path: entry.source_path,
    line: extra.line || 1,
    message,
    owner: entry.owner,
  };
}

function lintFrontmatter(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  const findings = [];

  for (const entry of manifest.entries) {
    const absPath = path.join(rootDir, entry.source_path);
    const raw = fs.readFileSync(absPath, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data || {};

    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      findings.push(finding(entry, 'frontmatter-title-required', 'Missing required front matter field: title.'));
    }

    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
      findings.push(
        finding(entry, 'frontmatter-description-required', 'Missing required front matter field: description.'),
      );
    }

    if (data.slug !== undefined && typeof data.slug !== 'string') {
      findings.push(finding(entry, 'frontmatter-slug-type', 'Front matter field slug must be a string.'));
    }

    if (
      data.keywords !== undefined &&
      !Array.isArray(data.keywords) &&
      typeof data.keywords !== 'string'
    ) {
      findings.push(finding(entry, 'frontmatter-keywords-type', 'Front matter field keywords must be a string or array.'));
    }

    if (data.tags !== undefined && !Array.isArray(data.tags)) {
      findings.push(finding(entry, 'frontmatter-tags-type', 'Front matter field tags must be an array.'));
    }

    if (data.sidebar_position !== undefined && typeof data.sidebar_position !== 'number') {
      findings.push(
        finding(entry, 'frontmatter-sidebar-position-type', 'Front matter field sidebar_position must be a number.'),
      );
    }
  }

  return findings;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const files = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const manifest = buildManifest({ rootDir, files });
  const findings = lintFrontmatter({ rootDir, manifest });
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
  lintFrontmatter,
};

