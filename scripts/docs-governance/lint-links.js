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
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
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

function progressEnabled() {
  return process.env.DOCS_LINT_PROGRESS !== '0';
}

// Progress logger writes to stderr so JSON results on stdout / --output stay clean.
function createProgressLogger(enabled) {
  const start = Date.now();
  return (stage, info) => {
    if (!enabled) return;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const details = info && Object.keys(info).length
      ? ' ' + Object.entries(info).map(([key, value]) => `${key}=${value}`).join(' ')
      : '';
    process.stderr.write(`[docs-lint-links] +${elapsed}s ${stage}${details}\n`);
  };
}

function relativePathCandidates(pathname) {
  const candidates = [pathname];
  if (!path.extname(pathname)) {
    candidates.push(`${pathname}.md`, `${pathname}.mdx`, `${pathname}/index.md`, `${pathname}/index.mdx`);
  }
  return candidates;
}

// Read every governed Markdown file exactly once. Downstream stages share this
// cache so we never re-read or re-tokenize the same file across sub-lints.
function collectFileCache(rootDir, manifest) {
  const cache = [];
  for (const entry of manifest.entries) {
    const absPath = path.join(rootDir, entry.source_path);
    if (!fs.existsSync(absPath)) {
      continue;
    }
    const raw = fs.readFileSync(absPath, 'utf8');
    cache.push({ entry, raw, links: extractMarkdownLinks(raw) });
  }
  return cache;
}

function buildIndexes(rootDir, manifest, fileCache) {
  const bySource = new Map();
  const byRoute = new Map();
  const anchorsBySource = new Map();
  const rawBySource = new Map();

  if (fileCache) {
    for (const item of fileCache) {
      rawBySource.set(item.entry.source_path, item.raw);
    }
  }

  for (const entry of manifest.entries) {
    bySource.set(entry.source_path, entry);
    for (const route of [entry.route_path, entry.canonical_route_path, ...(entry.route_aliases || [])]) {
      if (route) {
        byRoute.set(route.replace(/\/+$/, ''), entry);
      }
    }
    let raw = rawBySource.get(entry.source_path);
    if (raw === undefined) {
      const absPath = path.join(rootDir, entry.source_path);
      if (fs.existsSync(absPath)) {
        raw = fs.readFileSync(absPath, 'utf8');
      }
    }
    if (raw !== undefined) {
      anchorsBySource.set(entry.source_path, extractHeadingAnchors(raw));
    }
  }

  return { bySource, byRoute, anchorsBySource };
}

function candidateFiles(rootDir, sourcePath, pathname) {
  const sourceDir = path.dirname(sourcePath);
  const normalized = normalizePath(path.normalize(path.join(sourceDir, pathname)));
  return relativePathCandidates(normalized).filter(
    (candidate) => !candidate.startsWith('../') && fs.existsSync(path.join(rootDir, candidate)),
  );
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

function lintCurrentLinks(rootDir, manifest, fileCache) {
  const findings = [];
  const indexes = buildIndexes(rootDir, manifest, fileCache);

  for (const { entry, links } of fileCache) {
    for (const link of links) {
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

// Walk every (file, link) pair once and bucket refs by every old-path candidate
// the link could resolve to. Lookups per deleted/renamed record then collapse
// from O(M) re-scans to O(1).
function buildInboundMarkdownIndex(fileCache) {
  const index = new Map();
  for (const { entry, links } of fileCache) {
    const sourceDir = path.dirname(entry.source_path);
    for (const link of links) {
      if (isExternal(link.target) || isSkippable(link.target)) {
        continue;
      }
      const { pathname } = splitTarget(link.target);
      if (!pathname || pathname.startsWith('/')) {
        continue;
      }
      const resolved = normalizePath(path.normalize(path.join(sourceDir, pathname)));
      const ref = { path: entry.source_path, line: link.line, owner: entry.owner };
      for (const candidate of relativePathCandidates(resolved)) {
        let bucket = index.get(candidate);
        if (!bucket) {
          bucket = [];
          index.set(candidate, bucket);
        }
        bucket.push(ref);
      }
    }
  }
  return index;
}

// Sidebar refs use version-agnostic doc IDs (Docusaurus resolves them per
// version via the sidebar file's own version). Key the index by version|docId
// so deleting `docs/foo.md` (current) does not flag versioned sidebars that
// legitimately reference their own `versioned_docs/version-X.x/foo.md` copy.
function buildInboundSidebarIndex(rootDir, manifest) {
  const sidebarVersion = new Map();
  for (const entry of manifest.entries) {
    if (entry.sidebar_source && !sidebarVersion.has(entry.sidebar_source)) {
      sidebarVersion.set(entry.sidebar_source, entry.version);
    }
  }
  const index = new Map();
  for (const [sidebarSource, version] of sidebarVersion) {
    const loaded = loadSidebarRefs(rootDir, sidebarSource);
    if (loaded.missing) {
      continue;
    }
    for (const docId of loaded.refs) {
      const key = `${version}|${docId}`;
      let bucket = index.get(key);
      if (!bucket) {
        bucket = [];
        index.set(key, bucket);
      }
      bucket.push({ path: sidebarSource, line: 1 });
    }
  }
  return index;
}

function oldPathToDocId(oldPath) {
  return stripMarkdownExtension(oldPath)
    .replace(/^docs\//, '')
    .replace(/^versioned_docs\/version-[^/]+\//, '')
    .replace(/^i18n\/zh-CN\/docusaurus-plugin-content-docs\/(?:current|version-[^/]+)\//, '')
    .replace(/^community\//, 'community:')
    .replace(/^i18n\/zh-CN\/docusaurus-plugin-content-docs-community\/current\//, 'community:');
}

function oldPathToVersion(oldPath) {
  const versioned = oldPath.match(
    /^(?:versioned_docs|i18n\/zh-CN\/docusaurus-plugin-content-docs)\/version-([^/]+)\//,
  );
  if (versioned) return versioned[1];
  return 'current';
}

function lintMovedOrDeletedLinks(rootDir, manifest, changedRecords, fileCache) {
  const records = recordOldPaths(changedRecords || []);
  if (records.length === 0) {
    return [];
  }

  const markdownIndex = buildInboundMarkdownIndex(fileCache);
  const sidebarIndex = buildInboundSidebarIndex(rootDir, manifest);
  const findings = [];

  for (const record of records) {
    const isDelete = record.status === 'D' || !record.path || record.path === record.oldPath;
    const rule = isDelete ? 'link-deleted-file-inbound-reference' : 'link-moved-file-inbound-reference';
    const markdownRefs = markdownIndex.get(record.oldPath) || [];
    const sidebarKey = `${oldPathToVersion(record.oldPath)}|${oldPathToDocId(record.oldPath)}`;
    const sidebarRefs = sidebarIndex.get(sidebarKey) || [];
    const inboundMessage = isDelete
      ? `Inbound reference points to deleted path ${record.oldPath}; remove this reference.`
      : `Inbound reference points to old path ${record.oldPath}; update to new path ${record.path}.`;
    const redirectMessage = isDelete
      ? `Markdown path ${record.oldPath} was deleted; review redirects and inbound references before merging.`
      : `Markdown path changed from ${record.oldPath} to ${record.path}; review redirects and inbound links before merging.`;
    const relatedPaths = [record.oldPath, record.path].filter(Boolean);

    for (const ref of markdownRefs) {
      findings.push(makeFinding('error', rule, ref.path, ref.line, inboundMessage, ref.owner, relatedPaths));
    }
    for (const ref of sidebarRefs) {
      findings.push(makeFinding('error', rule, ref.path, ref.line, inboundMessage, undefined, relatedPaths));
    }
    findings.push(
      makeFinding(
        'warning',
        'link-path-change-redirect-review',
        record.path || record.oldPath,
        1,
        redirectMessage,
        undefined,
        relatedPaths,
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
  const progress = options.progress || createProgressLogger(progressEnabled());

  progress('lintLinks start', {
    entries: manifest.entries.length,
    changedFiles: changedFiles.length,
    changedRecords: changedRecords.length,
  });

  const fileCache = collectFileCache(rootDir, manifest);
  progress('file cache built', { files: fileCache.length });

  const currentFindings = lintCurrentLinks(rootDir, manifest, fileCache);
  progress('lintCurrentLinks done', { findings: currentFindings.length });

  const movedFindings = lintMovedOrDeletedLinks(rootDir, manifest, changedRecords, fileCache);
  progress('lintMovedOrDeletedLinks done', { findings: movedFindings.length });

  const slugFindings = lintSlugChanges(rootDir, changedFiles);
  progress('lintSlugChanges done', { findings: slugFindings.length });

  const all = [...currentFindings, ...movedFindings, ...slugFindings];
  progress('lintLinks total', { findings: all.length });
  return all;
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
  const progress = createProgressLogger(progressEnabled());

  progress('CLI start', { mode: args.changed ? 'changed' : args.files ? 'files' : 'full' });
  const changedFiles = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const changedRecords = args.changed ? getChangedRecords(rootDir) : [];
  if (args.changed || args.files) {
    progress('changed inputs resolved', {
      changedFiles: (changedFiles || []).length,
      changedRecords: changedRecords.length,
    });
  }

  const manifest = buildManifest({ rootDir });
  progress('manifest built', { entries: manifest.entries.length });

  const rawFindings = lintLinks({ rootDir, manifest, changedFiles: changedFiles || [], changedRecords, progress });
  const findings = filterLinkFindings(rawFindings, changedFiles);
  if (changedFiles) {
    progress('filtered to changed scope', { kept: findings.length, dropped: rawFindings.length - findings.length });
  }

  const output = JSON.stringify({ schema_version: 1, findings }, null, 2);
  if (args.output) {
    const outputPath = path.resolve(rootDir, args.output);
    ensureDirForFile(outputPath);
    fs.writeFileSync(outputPath, `${output}\n`, 'utf8');
    progress('output written', { path: args.output, bytes: output.length });
  } else {
    process.stdout.write(`${output}\n`);
  }

  const hasErrors = hasLinkErrors(findings);
  progress('CLI done', { findings: findings.length, errors: hasErrors });
  if (args['fail-on-errors'] && hasErrors) {
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
