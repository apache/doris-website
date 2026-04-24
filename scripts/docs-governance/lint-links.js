#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');
const { buildManifest } = require('./manifest');
const {
  ensureDirForFile,
  getChangedFiles,
  getChangedRecords,
  isMarkdownFile,
  normalizePath,
  parseArgs,
  stripMarkdownExtension,
} = require('./lib');
const { loadSidebarRefs } = require('./lint-sidebar');

const GOVERNED_MARKDOWN_PREFIXES = [
  'blog/',
  'community/',
  'docs/',
  'i18n/',
  'ja-source/',
  'releasenotes/',
  'versioned_docs/',
];

function makeFinding(severity, rule, pathName, line, message, owner, relatedPaths = []) {
  return {
    severity,
    rule,
    path: pathName,
    line,
    message,
    owner: owner || '@apache/doris-website-maintainers',
    related_paths: relatedPaths,
  };
}

function lineForOffset(raw, offset) {
  return raw.slice(0, offset).split(/\r?\n/).length;
}

function maskCode(raw) {
  let masked = raw.replace(/```[\s\S]*?```/g, (match) => ' '.repeat(match.length));
  masked = masked.replace(/~~~[\s\S]*?~~~/g, (match) => ' '.repeat(match.length));
  masked = masked.replace(/`[^`\n]*`/g, (match) => ' '.repeat(match.length));
  return masked;
}

function extractMarkdownLinks(raw) {
  const masked = maskCode(raw);
  const links = [];
  const imageRe = /!\[[^\]]*]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  const linkRe = /(?<!!)\[[^\]]+]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match;

  while ((match = imageRe.exec(masked))) {
    links.push({ target: match[1], line: lineForOffset(raw, match.index), type: 'image' });
  }
  while ((match = linkRe.exec(masked))) {
    links.push({ target: match[1], line: lineForOffset(raw, match.index), type: 'link' });
  }

  return links;
}

function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function extractHeadingAnchors(raw) {
  const parsed = matter(raw);
  const anchors = new Set();
  const content = maskCode(parsed.content || raw);
  const headingRe = /^(#{1,6})\s+(.+?)\s*$/gm;
  let match;
  while ((match = headingRe.exec(content))) {
    const explicit = match[2].match(/\{#([^}]+)}/);
    anchors.add(explicit ? explicit[1] : slugifyHeading(match[2].replace(/\s*\{#[^}]+}\s*$/, '')));
  }
  return anchors;
}

function splitTarget(target) {
  const withoutQuery = target.split('?')[0];
  const hashIndex = withoutQuery.indexOf('#');
  if (hashIndex === -1) {
    return { pathname: decodeURIComponent(withoutQuery), hash: '' };
  }
  return {
    pathname: decodeURIComponent(withoutQuery.slice(0, hashIndex)),
    hash: decodeURIComponent(withoutQuery.slice(hashIndex + 1)),
  };
}

function isExternal(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');
}

function isSkippable(target) {
  return !target || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('javascript:');
}

function isGovernedMarkdownPath(filePath) {
  const normalized = normalizePath(filePath || '');
  return isMarkdownFile(normalized) && GOVERNED_MARKDOWN_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function buildIndexes(rootDir, manifest) {
  const bySource = new Map();
  const byRoute = new Map();
  const anchorsBySource = new Map();

  for (const entry of manifest.entries) {
    bySource.set(entry.source_path, entry);
    for (const route of [entry.route_path, entry.canonical_route_path, ...(entry.route_aliases || [])]) {
      if (route) {
        byRoute.set(route.replace(/\/+$/, ''), entry);
      }
    }
    const absPath = path.join(rootDir, entry.source_path);
    if (fs.existsSync(absPath)) {
      anchorsBySource.set(entry.source_path, extractHeadingAnchors(fs.readFileSync(absPath, 'utf8')));
    }
  }

  return { bySource, byRoute, anchorsBySource };
}

function candidateFiles(rootDir, sourcePath, pathname) {
  const sourceDir = path.dirname(sourcePath);
  const normalized = normalizePath(path.normalize(path.join(sourceDir, pathname)));
  const candidates = [normalized];
  if (!path.extname(normalized)) {
    candidates.push(`${normalized}.md`, `${normalized}.mdx`, `${normalized}/index.md`, `${normalized}/index.mdx`);
  }
  return candidates.filter((candidate) => !candidate.startsWith('../') && fs.existsSync(path.join(rootDir, candidate)));
}

function resolveInternalTarget(rootDir, sourcePath, rawTarget, indexes) {
  const target = rawTarget.trim().replace(/^<|>$/g, '');
  if (isSkippable(target)) {
    return { kind: 'skip' };
  }
  if (isExternal(target)) {
    return { kind: 'external' };
  }

  const { pathname, hash } = splitTarget(target);
  if (!pathname && hash) {
    return { kind: 'file', sourcePath, hash };
  }

  if (pathname.startsWith('/')) {
    const staticCandidate = normalizePath(path.join('static', pathname));
    if (fs.existsSync(path.join(rootDir, staticCandidate))) {
      return { kind: 'asset', sourcePath: staticCandidate, hash };
    }
    const entry = indexes.byRoute.get(pathname.replace(/\/+$/, ''));
    return entry ? { kind: 'route', sourcePath: entry.source_path, hash } : { kind: 'missing-route', pathname, hash };
  }

  const files = candidateFiles(rootDir, sourcePath, pathname);
  if (files.length > 0) {
    return { kind: 'file', sourcePath: files[0], hash };
  }

  return { kind: 'missing-file', pathname, hash };
}

function scanMarkdownFiles(rootDir, manifest) {
  return manifest.entries
    .filter((entry) => fs.existsSync(path.join(rootDir, entry.source_path)))
    .map((entry) => ({
      entry,
      raw: fs.readFileSync(path.join(rootDir, entry.source_path), 'utf8'),
    }));
}

function lintCurrentLinks(rootDir, manifest) {
  const findings = [];
  const indexes = buildIndexes(rootDir, manifest);

  for (const { entry, raw } of scanMarkdownFiles(rootDir, manifest)) {
    for (const link of extractMarkdownLinks(raw)) {
      const resolved = resolveInternalTarget(rootDir, entry.source_path, link.target, indexes);
      if (resolved.kind === 'skip') {
        continue;
      }
      if (resolved.kind === 'external') {
        findings.push(
          makeFinding(
            'info',
            'link-external-report-only',
            entry.source_path,
            link.line,
            `External link is report-only and was not fetched: ${link.target}.`,
            entry.owner,
          ),
        );
        continue;
      }
      if (resolved.kind === 'missing-file' || resolved.kind === 'missing-route') {
        findings.push(
          makeFinding(
            'error',
            'link-missing-target',
            entry.source_path,
            link.line,
            `Internal ${link.type} target does not exist: ${link.target}.`,
            entry.owner,
          ),
        );
        continue;
      }
      if (resolved.hash) {
        const anchors = indexes.anchorsBySource.get(resolved.sourcePath) || new Set();
        if (!anchors.has(resolved.hash)) {
          findings.push(
            makeFinding(
              'error',
              'link-missing-anchor',
              entry.source_path,
              link.line,
              `Anchor #${resolved.hash} does not exist in ${resolved.sourcePath}.`,
              entry.owner,
              [resolved.sourcePath],
            ),
          );
        }
      }
    }
  }

  return findings;
}

function recordOldPaths(records) {
  return records
    .filter((record) => record.oldPath || record.status === 'D')
    .map((record) => ({
      status: record.status,
      oldPath: record.oldPath || record.path,
      path: record.path,
    }))
    .filter((record) => isGovernedMarkdownPath(record.oldPath));
}

function targetMatchesOldPath(sourcePath, target, oldPath) {
  if (isExternal(target) || isSkippable(target)) {
    return false;
  }
  const { pathname } = splitTarget(target);
  if (!pathname || pathname.startsWith('/')) {
    return false;
  }
  const sourceDir = path.dirname(sourcePath);
  const resolved = normalizePath(path.normalize(path.join(sourceDir, pathname)));
  const candidates = [resolved];
  if (!path.extname(resolved)) {
    candidates.push(`${resolved}.md`, `${resolved}.mdx`, `${resolved}/index.md`, `${resolved}/index.mdx`);
  }
  return candidates.includes(oldPath);
}

function findInboundMarkdownReferences(rootDir, manifest, oldPath) {
  const refs = [];
  for (const { entry, raw } of scanMarkdownFiles(rootDir, manifest)) {
    for (const link of extractMarkdownLinks(raw)) {
      if (targetMatchesOldPath(entry.source_path, link.target, oldPath)) {
        refs.push({ path: entry.source_path, line: link.line, owner: entry.owner });
      }
    }
  }
  return refs;
}

function findInboundSidebarReferences(rootDir, manifest, oldPath) {
  const oldDocId = stripMarkdownExtension(oldPath)
    .replace(/^docs\//, '')
    .replace(/^versioned_docs\/version-[^/]+\//, '')
    .replace(/^i18n\/zh-CN\/docusaurus-plugin-content-docs\/(?:current|version-[^/]+)\//, '')
    .replace(/^community\//, 'community:')
    .replace(/^i18n\/zh-CN\/docusaurus-plugin-content-docs-community\/current\//, 'community:');
  const sidebars = new Set(manifest.entries.map((entry) => entry.sidebar_source).filter(Boolean));
  const refs = [];
  for (const sidebarSource of sidebars) {
    const loaded = loadSidebarRefs(rootDir, sidebarSource);
    if (!loaded.missing && loaded.refs.has(oldDocId)) {
      refs.push({ path: sidebarSource, line: 1 });
    }
  }
  return refs;
}

function lintMovedOrDeletedLinks(rootDir, manifest, changedRecords) {
  const findings = [];
  for (const record of recordOldPaths(changedRecords || [])) {
    const rule = record.status === 'R' ? 'link-moved-file-inbound-reference' : 'link-deleted-file-inbound-reference';
    const refs = [
      ...findInboundMarkdownReferences(rootDir, manifest, record.oldPath),
      ...findInboundSidebarReferences(rootDir, manifest, record.oldPath),
    ];
    for (const ref of refs) {
      findings.push(
        makeFinding(
          'error',
          rule,
          ref.path,
          ref.line,
          `Inbound link still points to changed path ${record.oldPath}; review and update target ${record.path || ''}.`.trim(),
          ref.owner,
          [record.oldPath, record.path].filter(Boolean),
        ),
      );
    }
    findings.push(
      makeFinding(
        'warning',
        'link-path-change-redirect-review',
        record.path || record.oldPath,
        1,
        `Markdown path changed from ${record.oldPath}; review redirects and inbound links before merging.`,
        undefined,
        [record.oldPath, record.path].filter(Boolean),
      ),
    );
  }
  return findings;
}

function gitShowFile(rootDir, filePath) {
  try {
    return execSync(`git show HEAD:${filePath}`, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    return null;
  }
}

function frontMatterSlug(raw) {
  try {
    const parsed = matter(raw);
    return typeof parsed.data.slug === 'string' ? parsed.data.slug.trim() : '';
  } catch (err) {
    return '';
  }
}

function lintSlugChanges(rootDir, changedFiles) {
  const findings = [];
  for (const changedFile of changedFiles || []) {
    if (!isGovernedMarkdownPath(changedFile)) {
      continue;
    }
    const absPath = path.join(rootDir, changedFile);
    if (!fs.existsSync(absPath)) {
      continue;
    }
    const previous = gitShowFile(rootDir, changedFile);
    if (previous === null) {
      continue;
    }
    const oldSlug = frontMatterSlug(previous);
    const newSlug = frontMatterSlug(fs.readFileSync(absPath, 'utf8'));
    if (oldSlug !== newSlug) {
      findings.push(
        makeFinding(
          'warning',
          'link-slug-change-redirect-review',
          changedFile,
          1,
          `Front matter slug changed from "${oldSlug || '(derived path)'}" to "${newSlug || '(derived path)'}"; review redirects and inbound links.`,
          undefined,
          [changedFile],
        ),
      );
    }
  }
  return findings;
}

function lintLinks(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  const changedFiles = options.changedFiles || [];
  const changedRecords = options.changedRecords || [];
  return [
    ...lintCurrentLinks(rootDir, manifest),
    ...lintMovedOrDeletedLinks(rootDir, manifest, changedRecords),
    ...lintSlugChanges(rootDir, changedFiles),
  ];
}

function filterLinkFindings(findings, changedFiles) {
  if (!changedFiles || changedFiles.length === 0) {
    return findings;
  }
  const changed = new Set(changedFiles.map((filePath) => normalizePath(filePath)));
  return findings.filter((finding) => {
    const findingPath = normalizePath(finding.path || '');
    const related = finding.related_paths || [];
    return (
      changed.has(findingPath) ||
      changed.has(findingPath.replace(/^\.\//, '')) ||
      related.some((relatedPath) => changed.has(normalizePath(relatedPath)))
    );
  });
}

function hasLinkErrors(findings) {
  return findings.some((finding) => finding.severity === 'error');
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const changedFiles = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const changedRecords = args.changed ? getChangedRecords(rootDir) : [];
  const manifest = buildManifest({ rootDir });
  const findings = filterLinkFindings(
    lintLinks({ rootDir, manifest, changedFiles: changedFiles || [], changedRecords }),
    changedFiles,
  );
  const output = JSON.stringify({ schema_version: 1, findings }, null, 2);
  if (args.output) {
    const outputPath = path.resolve(rootDir, args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, `${output}\n`, 'utf8');
  } else {
    process.stdout.write(`${output}\n`);
  }
  if (args['fail-on-errors'] && hasLinkErrors(findings)) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  extractHeadingAnchors,
  extractMarkdownLinks,
  filterLinkFindings,
  hasLinkErrors,
  lintLinks,
  resolveInternalTarget,
};
