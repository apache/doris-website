#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildManifest } = require('./manifest');
const {
  ensureDirForFile,
  getChangedFiles,
  normalizePath,
  parseArgs,
} = require('./lib');

const PROMPT_DIR = 'website-quality-governance/ai-review/prompts';
const OUTPUT_SCHEMA_PATH = 'website-quality-governance/ai-review/output-schema.json';
const AGENTS_PATH = 'AGENTS.md';
const MAX_DIFF_CHARS = 60000;
const MAX_CONTEXT_CHARS = 12000;
const MAX_RELATED_DOCS = 20;

const REVIEW_AGENTS = [
  {
    id: 'seo-geo',
    name: 'SEO/GEO reviewer',
    prompt_path: `${PROMPT_DIR}/seo-geo.md`,
    focus: ['front matter', 'search snippets', 'AI answerability', 'canonical routing'],
  },
  {
    id: 'docs-clarity',
    name: 'Documentation clarity reviewer',
    prompt_path: `${PROMPT_DIR}/docs-clarity.md`,
    focus: ['reader task flow', 'examples', 'ambiguity', 'missing caveats'],
  },
  {
    id: 'i18n-version-sync',
    name: 'i18n and version sync reviewer',
    prompt_path: `${PROMPT_DIR}/i18n-version-sync.md`,
    focus: ['current docs', 'active versioned docs', 'localized counterparts'],
  },
  {
    id: 'links-navigation',
    name: 'Links and navigation reviewer',
    prompt_path: `${PROMPT_DIR}/links-navigation.md`,
    focus: ['relative links', 'anchors', 'sidebars', 'redirect risk'],
  },
  {
    id: 'frontend-accessibility',
    name: 'Frontend and accessibility reviewer',
    prompt_path: `${PROMPT_DIR}/frontend-accessibility.md`,
    focus: ['Docusaurus config', 'React', 'responsive behavior', 'accessibility basics'],
  },
];

const HIGH_RISK_RULES = [
  'docs/sql-manual/',
  'versioned_docs/',
  'i18n/',
  'docusaurus.config.js',
  'sidebars.ts',
  'sidebarsCommunity.json',
  'versioned_sidebars/',
];

function splitFilesArg(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(/[,\n\r\t ]+/)
    .map((item) => normalizePath(item.trim()))
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readTruncated(rootDir, relativePath, maxChars = MAX_CONTEXT_CHARS) {
  const absPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absPath)) {
    return {
      path: relativePath,
      included: false,
      reason: 'file not found',
      truncated: false,
      content_preview: '',
    };
  }

  const content = fs.readFileSync(absPath, 'utf8');
  return {
    path: relativePath,
    included: true,
    truncated: content.length > maxChars,
    content_preview: content.length > maxChars ? content.slice(0, maxChars) : content,
  };
}

function summarizeEntry(entry) {
  return {
    source_path: entry.source_path,
    doc_id: entry.doc_id,
    sync_group_id: entry.sync_group_id,
    plugin: entry.plugin,
    locale: entry.locale,
    version: entry.version,
    route_path: entry.route_path,
    canonical_route_path: entry.canonical_route_path,
    sidebar_source: entry.sidebar_source,
    title: entry.title,
    description: entry.description,
    doc_type: entry.doc_type,
    source_counterpart: entry.source_counterpart,
    localized_counterparts: entry.localized_counterparts || [],
    version_counterparts: entry.version_counterparts || [],
  };
}

function detectHighRisk(changedFiles) {
  const matchedPaths = [];
  for (const filePath of changedFiles) {
    for (const rule of HIGH_RISK_RULES) {
      if (rule.endsWith('/')) {
        if (filePath.startsWith(rule)) {
          matchedPaths.push({ path: filePath, rule });
        }
        continue;
      }
      if (filePath === rule) {
        matchedPaths.push({ path: filePath, rule });
      }
    }
  }

  return {
    required: matchedPaths.length > 0,
    matched_paths: matchedPaths,
    rules: HIGH_RISK_RULES,
  };
}

function truncateDiff(diffText) {
  const text = diffText || '';
  if (text.length <= MAX_DIFF_CHARS) {
    return {
      text,
      truncated: false,
      original_chars: text.length,
      max_chars: MAX_DIFF_CHARS,
    };
  }

  return {
    text: `${text.slice(0, MAX_DIFF_CHARS)}\n\n[diff truncated by docs governance AI review packet builder]\n`,
    truncated: true,
    original_chars: text.length,
    max_chars: MAX_DIFF_CHARS,
  };
}

function getDiff({ rootDir, base, changedFiles }) {
  if (!changedFiles.length) {
    return '';
  }

  const args = ['diff', '--no-ext-diff', '--unified=80'];
  if (base) {
    args.push(base, 'HEAD');
  } else {
    args.push('HEAD');
  }
  args.push('--', ...changedFiles);

  try {
    return execFileSync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    return '';
  }
}

function getSameDirectoryNeighbors(entries, changedEntry, limit = 2) {
  const dir = path.posix.dirname(changedEntry.source_path);
  const siblings = entries
    .filter((entry) => path.posix.dirname(entry.source_path) === dir)
    .sort((left, right) => left.source_path.localeCompare(right.source_path));
  const index = siblings.findIndex((entry) => entry.source_path === changedEntry.source_path);
  if (index === -1) {
    return [];
  }
  const start = Math.max(0, index - limit);
  const end = Math.min(siblings.length, index + limit + 1);
  return siblings
    .slice(start, end)
    .filter((entry) => entry.source_path !== changedEntry.source_path);
}

function buildSyncGroups({ manifest, changedFiles }) {
  const byPath = new Map(manifest.entries.map((entry) => [entry.source_path, entry]));
  const byGroup = new Map();
  for (const entry of manifest.entries) {
    if (!byGroup.has(entry.sync_group_id)) {
      byGroup.set(entry.sync_group_id, []);
    }
    byGroup.get(entry.sync_group_id).push(entry);
  }

  const groups = [];
  const relatedEntries = new Map();
  const neighboringDocs = new Map();

  for (const changedPath of changedFiles) {
    const changedEntry = byPath.get(changedPath);
    if (!changedEntry) {
      continue;
    }

    const groupEntries = (byGroup.get(changedEntry.sync_group_id) || [])
      .sort((left, right) => {
        const versionSort = String(left.version || '').localeCompare(String(right.version || ''));
        if (versionSort !== 0) {
          return versionSort;
        }
        const localeSort = String(left.locale || '').localeCompare(String(right.locale || ''));
        if (localeSort !== 0) {
          return localeSort;
        }
        return left.source_path.localeCompare(right.source_path);
      });

    for (const entry of groupEntries) {
      relatedEntries.set(entry.source_path, entry);
    }

    const neighbors = getSameDirectoryNeighbors(manifest.entries, changedEntry);
    for (const neighbor of neighbors) {
      neighboringDocs.set(neighbor.source_path, neighbor);
      relatedEntries.set(neighbor.source_path, neighbor);
    }

    groups.push({
      sync_group_id: changedEntry.sync_group_id,
      changed_paths: changedFiles.filter((filePath) => byPath.get(filePath)?.sync_group_id === changedEntry.sync_group_id),
      entries: groupEntries.map(summarizeEntry),
      source_counterparts: unique(groupEntries.map((entry) => entry.source_counterpart || (entry.locale === 'en' ? entry.source_path : null))),
      localized_counterparts: unique(groupEntries.flatMap((entry) => entry.localized_counterparts || [])),
      version_counterparts: unique(groupEntries.flatMap((entry) => entry.version_counterparts || [])),
      neighboring_docs: neighbors.map(summarizeEntry),
    });
  }

  const uniqueGroups = [];
  const seenGroups = new Set();
  for (const group of groups) {
    if (seenGroups.has(group.sync_group_id)) {
      continue;
    }
    seenGroups.add(group.sync_group_id);
    uniqueGroups.push(group);
  }

  return {
    sync_groups: uniqueGroups,
    related_manifest_entries: [...relatedEntries.values()]
      .sort((left, right) => left.source_path.localeCompare(right.source_path))
      .map(summarizeEntry),
    neighboring_docs: [...neighboringDocs.values()]
      .sort((left, right) => left.source_path.localeCompare(right.source_path))
      .map(summarizeEntry),
  };
}

function readOutputSchema(rootDir) {
  const absPath = path.join(rootDir, OUTPUT_SCHEMA_PATH);
  if (!fs.existsSync(absPath)) {
    return {
      path: OUTPUT_SCHEMA_PATH,
      included: false,
      required_fields: [
        'severity',
        'path',
        'line',
        'issue',
        'evidence',
        'suggested_fix',
        'blocking_recommendation',
        'needs_human_verification',
      ],
    };
  }

  try {
    const schema = JSON.parse(fs.readFileSync(absPath, 'utf8'));
    const findingSchema = schema.definitions?.finding || schema.$defs?.finding || {};
    return {
      path: OUTPUT_SCHEMA_PATH,
      included: true,
      required_fields: findingSchema.required || [],
      schema,
    };
  } catch (err) {
    return {
      path: OUTPUT_SCHEMA_PATH,
      included: false,
      error: err.message,
    };
  }
}

function buildDocumentContext({ rootDir, changedFiles, relatedManifestEntries }) {
  const changedSet = new Set(changedFiles);
  const relatedPaths = relatedManifestEntries
    .map((entry) => entry.source_path)
    .filter((filePath) => !changedSet.has(filePath))
    .slice(0, MAX_RELATED_DOCS);

  return {
    changed_files: changedFiles.map((filePath) => readTruncated(rootDir, filePath)),
    related_docs: relatedPaths.map((filePath) => readTruncated(rootDir, filePath)),
    related_docs_truncated: relatedManifestEntries.length > relatedPaths.length,
    max_related_docs: MAX_RELATED_DOCS,
    max_context_chars_per_file: MAX_CONTEXT_CHARS,
  };
}

function buildAiReviewPacket(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const changedFiles = unique(
    (options.changedFiles || getChangedFiles(rootDir))
      .map((filePath) => normalizePath(filePath))
      .filter(Boolean),
  );
  const manifest = options.manifest || buildManifest({ rootDir });
  const related = buildSyncGroups({ manifest, changedFiles });
  const diffText = Object.prototype.hasOwnProperty.call(options, 'diffText')
    ? options.diffText
    : getDiff({ rootDir, base: options.base, changedFiles });

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    changed_files: changedFiles,
    high_risk: detectHighRisk(changedFiles),
    review_agents: REVIEW_AGENTS,
    sync_groups: related.sync_groups,
    related_manifest_entries: related.related_manifest_entries,
    related_context: {
      neighboring_docs: related.neighboring_docs,
    },
    document_context: buildDocumentContext({
      rootDir,
      changedFiles,
      relatedManifestEntries: related.related_manifest_entries,
    }),
    diff: truncateDiff(diffText),
    agent_instructions: {
      repository_guide: readTruncated(rootDir, AGENTS_PATH),
      prompt_directory: PROMPT_DIR,
      prompts: REVIEW_AGENTS.map((agent) => ({
        id: agent.id,
        path: agent.prompt_path,
      })),
      output_schema_path: OUTPUT_SCHEMA_PATH,
      facts_policy: 'Do not assert unverified Apache Doris behavior. If packet and related docs do not prove a behavior fact, set needs_human_verification to true.',
      blocking_policy: 'AI blocking_recommendation is advisory only. Deterministic CI decides whether a PR is blocked.',
    },
    output_schema: readOutputSchema(rootDir),
  };
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const changedFiles = args.changed
    ? getChangedFiles(rootDir)
    : args.files
      ? splitFilesArg(args.files)
      : getChangedFiles(rootDir);
  const packet = buildAiReviewPacket({
    rootDir,
    changedFiles,
    base: args.base,
  });
  const output = JSON.stringify(packet, null, 2);

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
  HIGH_RISK_RULES,
  REVIEW_AGENTS,
  buildAiReviewPacket,
  detectHighRisk,
  splitFilesArg,
};
