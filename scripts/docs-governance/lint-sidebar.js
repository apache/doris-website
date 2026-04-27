#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./manifest');
const { ensureDirForFile, getChangedFiles, parseArgs } = require('./lib');

function parseJsonSidebar(value, refs = new Set()) {
  if (typeof value === 'string') {
    refs.add(value);
    return refs;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      parseJsonSidebar(item, refs);
    }
    return refs;
  }
  if (value && typeof value === 'object') {
    if (value.type === 'doc' && typeof value.id === 'string') {
      refs.add(value.id);
    }
    if (typeof value.id === 'string' && value.type !== 'category') {
      refs.add(value.id);
    }
    if (Array.isArray(value.items)) {
      parseJsonSidebar(value.items, refs);
    }
    for (const child of Object.values(value)) {
      if (Array.isArray(child)) {
        parseJsonSidebar(child, refs);
      }
    }
  }
  return refs;
}

function parseTsSidebar(raw) {
  const refs = new Set();
  const stringRe = /['"]([^'"]+)['"]/g;
  let match;
  while ((match = stringRe.exec(raw))) {
    const value = match[1];
    if (value.includes('/') && !value.startsWith('/') && !value.startsWith('http')) {
      refs.add(value);
    }
  }
  return refs;
}

function loadSidebarRefs(rootDir, sidebarSource) {
  const sidebarPath = path.join(rootDir, sidebarSource);
  if (!fs.existsSync(sidebarPath)) {
    return { refs: new Set(), missing: true };
  }
  const raw = fs.readFileSync(sidebarPath, 'utf8');
  if (sidebarSource.endsWith('.json')) {
    return { refs: parseJsonSidebar(JSON.parse(raw)), missing: false };
  }
  return { refs: parseTsSidebar(raw), missing: false };
}

function makeFinding(rule, pathName, line, message, owner = '@apache/doris-website-maintainers') {
  return {
    severity: 'warning',
    rule,
    path: pathName,
    line,
    message,
    owner,
  };
}

function lintSidebar(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  const findings = [];
  const entriesByDocId = new Map();
  const refsBySidebar = new Map();

  for (const entry of manifest.entries) {
    if (!entriesByDocId.has(entry.doc_id)) {
      entriesByDocId.set(entry.doc_id, []);
    }
    entriesByDocId.get(entry.doc_id).push(entry);
    if (entry.sidebar_source && !refsBySidebar.has(entry.sidebar_source)) {
      refsBySidebar.set(entry.sidebar_source, loadSidebarRefs(rootDir, entry.sidebar_source));
    }
  }

  for (const [sidebarSource, loaded] of refsBySidebar.entries()) {
    if (loaded.missing) {
      findings.push(
        makeFinding('sidebar-source-missing', sidebarSource, 1, `Sidebar source ${sidebarSource} does not exist.`),
      );
      continue;
    }
    for (const ref of loaded.refs) {
      if (!entriesByDocId.has(ref)) {
        findings.push(
          makeFinding(
            'sidebar-missing-doc',
            sidebarSource,
            1,
            `Sidebar references missing doc id: ${ref}.`,
          ),
        );
      }
    }
  }

  for (const entry of manifest.entries) {
    if (!entry.sidebar_source || entry.locale !== 'en' || entry.plugin === 'blog') {
      continue;
    }
    const loaded = refsBySidebar.get(entry.sidebar_source);
    if (!loaded || loaded.missing) {
      continue;
    }
    if (!loaded.refs.has(entry.doc_id)) {
      findings.push(
        makeFinding(
          'sidebar-orphan-doc',
          entry.source_path,
          1,
          `Document ${entry.doc_id} is not referenced by ${entry.sidebar_source}.`,
          entry.owner,
        ),
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
  const findings = lintSidebar({ rootDir, manifest });
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
  lintSidebar,
  loadSidebarRefs,
  parseJsonSidebar,
  parseTsSidebar,
};
