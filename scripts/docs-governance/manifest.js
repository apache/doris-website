#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const {
  ensureDirForFile,
  getChangedFiles,
  isMarkdownFile,
  loadExceptions,
  loadOwners,
  loadRules,
  matchesGlob,
  normalizePath,
  parseArgs,
  stripMarkdownExtension,
  toPosixPath,
  walkMarkdownFiles,
} = require('./lib');

const CONTENT_ROOTS = [
  'docs',
  'versioned_docs',
  'i18n/zh-CN/docusaurus-plugin-content-docs',
  'community',
  'i18n/zh-CN/docusaurus-plugin-content-docs-community/current',
  'releasenotes',
  'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current',
  'blog',
  'ja-source/docusaurus-plugin-content-docs',
];

function parseFrontMatter(absPath) {
  const raw = fs.readFileSync(absPath, 'utf8');
  const parsed = matter(raw);
  const frontMatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  let frontMatterFormat = 'none';
  if (frontMatterMatch) {
    frontMatterFormat = frontMatterMatch[1].trim().startsWith('{') ? 'json' : 'yaml';
  }
  return {
    data: parsed.data || {},
    content: parsed.content || '',
    frontMatterFormat,
  };
}

function getContentInfo(relativePath, rules) {
  const currentRoute = rules.currentRouteVersion;

  let match = relativePath.match(/^versioned_docs\/version-([^/]+)\/(.+)$/);
  if (match) {
    const version = match[1];
    return {
      contentRoot: 'versioned_docs',
      plugin: 'main_docs',
      locale: 'en',
      version,
      docRelative: match[2],
      routeBase: `/docs/${version}`,
      sidebarSource: `versioned_sidebars/version-${version}-sidebars.json`,
    };
  }

  match = relativePath.match(/^i18n\/zh-CN\/docusaurus-plugin-content-docs\/version-([^/]+)\/(.+)$/);
  if (match) {
    const version = match[1];
    return {
      contentRoot: 'zh_versioned_docs',
      plugin: 'main_docs',
      locale: 'zh-CN',
      version,
      docRelative: match[2],
      routeBase: `/zh-CN/docs/${version}`,
      sidebarSource: `versioned_sidebars/version-${version}-sidebars.json`,
    };
  }

  if (relativePath.startsWith('community/')) {
    const docRelative = relativePath.slice('community/'.length);
    return {
      contentRoot: 'community',
      plugin: 'community',
      locale: 'en',
      version: 'current',
      docRelative,
      routeBase: '/community',
      sidebarSource: 'sidebarsCommunity.json',
    };
  }

  if (relativePath.startsWith('i18n/zh-CN/docusaurus-plugin-content-docs-community/current/')) {
    const docRelative = relativePath.slice('i18n/zh-CN/docusaurus-plugin-content-docs-community/current/'.length);
    return {
      contentRoot: 'zh_community',
      plugin: 'community',
      locale: 'zh-CN',
      version: 'current',
      docRelative,
      routeBase: '/zh-CN/community',
      sidebarSource: 'sidebarsCommunity.json',
    };
  }

  if (relativePath.startsWith('releasenotes/')) {
    const docRelative = relativePath.slice('releasenotes/'.length);
    return {
      contentRoot: 'releases',
      plugin: 'releases',
      locale: 'en',
      version: 'current',
      docRelative,
      routeBase: '/releases',
      sidebarSource: 'sidebarsReleases.json',
    };
  }

  if (relativePath.startsWith('i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/')) {
    const docRelative = relativePath.slice('i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/'.length);
    return {
      contentRoot: 'zh_releases',
      plugin: 'releases',
      locale: 'zh-CN',
      version: 'current',
      docRelative,
      routeBase: '/zh-CN/releases',
      sidebarSource: 'sidebarsReleases.json',
    };
  }

  if (relativePath.startsWith('blog/')) {
    const docRelative = relativePath.slice('blog/'.length);
    return {
      contentRoot: 'blog',
      plugin: 'blog',
      locale: 'en',
      version: null,
      docRelative,
      routeBase: '/blog',
      sidebarSource: null,
    };
  }

  if (relativePath.startsWith('ja-source/docusaurus-plugin-content-docs/')) {
    const docRelative = relativePath.slice('ja-source/docusaurus-plugin-content-docs/'.length);
    return {
      contentRoot: 'ja_source',
      plugin: 'main_docs',
      locale: 'ja',
      version: 'current',
      docRelative,
      routeBase: '/ja/docs',
      sidebarSource: null,
      reportOnly: true,
    };
  }

  return null;
}

function makeDocId(plugin, docRelative) {
  const stripped = stripMarkdownExtension(docRelative);
  if (plugin === 'main_docs') {
    return stripped;
  }
  return `${plugin}:${stripped}`;
}

function routePartFromEntry(docId, plugin) {
  if (plugin === 'main_docs') {
    return docId;
  }
  return docId.replace(`${plugin}:`, '');
}

function resolveRoute(routeBase, docId, plugin, frontMatter) {
  const slug = typeof frontMatter.slug === 'string' ? frontMatter.slug.trim() : '';
  if (slug) {
    const normalizedSlug = slug.replace(/^\/+|\/+$/g, '');
    return `${routeBase}/${normalizedSlug}`;
  }
  return `${routeBase}/${routePartFromEntry(docId, plugin)}`;
}

function resolveCanonicalRoute(entry, rules) {
  if (entry.plugin !== 'main_docs') {
    return entry.route_path;
  }
  const docPart = routePartFromEntry(entry.doc_id, entry.plugin);
  const localePrefix = entry.locale === 'zh-CN' ? '/zh-CN' : entry.locale === 'ja' ? '/ja' : '';
  if (entry.version === 'current') {
    return `${localePrefix}/docs/${rules.defaultVersion}/${docPart}`;
  }
  return entry.route_path;
}

function detectDocType(relativePath, docTypeRules) {
  for (const rule of docTypeRules) {
    for (const pattern of rule.path_patterns || []) {
      if (new RegExp(pattern).test(relativePath)) {
        return rule.doc_type;
      }
    }
  }
  if (/sql-manual\/sql-functions\//.test(relativePath)) {
    return 'sql_function';
  }
  if (/sql-manual\/sql-statements\//.test(relativePath)) {
    return 'sql_statement';
  }
  if (relativePath.startsWith('blog/')) {
    return 'blog';
  }
  if (relativePath.startsWith('community/') || relativePath.includes('docusaurus-plugin-content-docs-community')) {
    return 'community';
  }
  if (relativePath.startsWith('releasenotes/') || relativePath.includes('docusaurus-plugin-content-docs-releases')) {
    return 'release_notes';
  }
  return 'concept_doc';
}

function resolveOwner(relativePath, docType, ownersConfig) {
  let best = null;
  for (const ownerRule of ownersConfig.owners) {
    const paths = ownerRule.paths || [];
    const docTypes = ownerRule.doc_types || [];
    for (const pattern of paths) {
      if (!matchesGlob(relativePath, pattern)) {
        continue;
      }
      const score = pattern.length + (docTypes.includes(docType) ? 1000 : 0);
      if (!best || score > best.score) {
        best = { owner: ownerRule.owner, score };
      }
    }
  }
  return best?.owner || ownersConfig.defaultOwner;
}

function resolveBlockingLevel(info, rules) {
  if (info.reportOnly || info.locale === 'ja') {
    return 'report_only';
  }
  if (info.version && info.version !== 'current' && !rules.activeVersions.includes(info.version)) {
    return 'report_only';
  }
  return 'warning';
}

function matchExceptions(entry, exceptions) {
  return exceptions
    .filter((exception) => {
      const scope = exception.scope || {};
      if (scope.doc_id && scope.doc_id !== entry.doc_id) return false;
      if (scope.locale && scope.locale !== entry.locale) return false;
      if (scope.version && scope.version !== entry.version) return false;
      if (scope.path && scope.path !== entry.source_path) return false;
      return true;
    })
    .map((exception) => exception.id);
}

function addCounterparts(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.sync_group_id)) {
      groups.set(entry.sync_group_id, []);
    }
    groups.get(entry.sync_group_id).push(entry);
  }

  for (const entry of entries) {
    const groupEntries = groups.get(entry.sync_group_id) || [];
    entry.localized_counterparts = groupEntries
      .filter((candidate) => candidate.locale !== entry.locale && candidate.version === entry.version)
      .map((candidate) => candidate.source_path);
    entry.version_counterparts = groupEntries
      .filter((candidate) => candidate.locale === entry.locale && candidate.version !== entry.version)
      .map((candidate) => candidate.source_path);
    const sourceCounterpart = groupEntries.find(
      (candidate) => candidate.locale === 'en' && candidate.version === entry.version,
    ) || groupEntries.find((candidate) => candidate.locale === 'en' && candidate.version === 'current');
    entry.source_counterpart = entry.locale === 'en' ? null : sourceCounterpart?.source_path || null;
  }
}

function buildManifest(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const rules = loadRules(rootDir);
  const ownersConfig = loadOwners(rootDir);
  const exceptions = loadExceptions(rootDir);
  const includeFiles = options.files
    ? new Set(options.files.map((filePath) => normalizePath(filePath)).filter(isMarkdownFile))
    : null;

  const files = walkMarkdownFiles(rootDir, CONTENT_ROOTS)
    .map((absPath) => ({
      absPath,
      relativePath: toPosixPath(path.relative(rootDir, absPath)),
    }))
    .filter(({ relativePath }) => !includeFiles || includeFiles.has(relativePath))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

  const entries = [];
  for (const file of files) {
    const info = getContentInfo(file.relativePath, rules);
    if (!info) {
      continue;
    }
    const parsed = parseFrontMatter(file.absPath);
    const docId = makeDocId(info.plugin, info.docRelative);
    const docType = detectDocType(file.relativePath, rules.docTypeRules);
    const routePath = resolveRoute(info.routeBase, docId, info.plugin, parsed.data);
    const entry = {
      doc_id: docId,
      source_path: file.relativePath,
      content_root: info.contentRoot,
      plugin: info.plugin,
      locale: info.locale,
      version: info.version,
      route_path: routePath,
      canonical_route_path: routePath,
      sidebar_source: info.sidebarSource,
      title: parsed.data.title || null,
      description: parsed.data.description || null,
      slug: parsed.data.slug || null,
      keywords: parsed.data.keywords || [],
      tags: parsed.data.tags || [],
      sidebar_label: parsed.data.sidebar_label || null,
      sidebar_position: parsed.data.sidebar_position || null,
      doc_type: docType,
      owner: resolveOwner(file.relativePath, docType, ownersConfig),
      is_archived: Boolean(info.version && info.version !== 'current' && !rules.activeVersions.includes(info.version)),
      sync_group_id: `${info.plugin}:${docId.replace(`${info.plugin}:`, '')}`,
      blocking_level: resolveBlockingLevel(info, rules),
      front_matter_format: parsed.frontMatterFormat,
      source_counterpart: null,
      localized_counterparts: [],
      version_counterparts: [],
      route_aliases: [],
      heading_anchors: [],
      inbound_links: [],
      outbound_links: [],
      exceptions: [],
    };
    entry.canonical_route_path = resolveCanonicalRoute(entry, rules);
    entry.exceptions = matchExceptions(entry, exceptions);
    entries.push(entry);
  }

  addCounterparts(entries);

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    source_commit: process.env.GITHUB_SHA || null,
    rules_file: '.docs-governance/rules.yml',
    entries,
  };
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const files = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const manifest = buildManifest({ rootDir, files });
  const output = JSON.stringify(manifest, null, 2);

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
  buildManifest,
  detectDocType,
  getContentInfo,
  makeDocId,
  resolveOwner,
};

