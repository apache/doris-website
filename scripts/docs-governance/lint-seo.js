#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./manifest');
const { ensureDirForFile, getChangedFiles, normalizePath, parseArgs } = require('./lib');

const SITE_URL = 'https://doris.apache.org';
const BRAND = 'Apache Doris';
const DESCRIPTION_MIN = 80;
const DESCRIPTION_MAX = 160;

const REQUIRED_LLMS_SECTIONS = [
  'Overview',
  'Getting Started',
  'SQL Manual',
  'Load',
  'Lakehouse',
  'AI',
  'Admin',
  'Release Notes',
  'Community',
];

const GENERIC_DESCRIPTION_PATTERNS = [
  /^apache doris documentation\.?$/i,
  /^documentation\.?$/i,
  /^docs\.?$/i,
  /^learn more about apache doris\.?$/i,
  /^apache doris docs\.?$/i,
  /^fixture page for/i,
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

function isIndexableEntry(entry) {
  return !entry.is_archived && entry.blocking_level !== 'report_only';
}

function renderedTitle(entry) {
  const title = typeof entry.title === 'string' ? entry.title.trim() : '';
  if (!title) {
    return '';
  }
  return title.includes(BRAND) ? title : `${title} - ${BRAND}`;
}

function isGenericDescription(description) {
  const normalized = description.trim().replace(/\s+/g, ' ');
  return GENERIC_DESCRIPTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

function lintEntryMetadata(manifest) {
  const findings = [];
  const indexable = manifest.entries.filter(isIndexableEntry);
  const titles = new Map();

  for (const entry of indexable) {
    const title = renderedTitle(entry);
    if (!title.includes(BRAND)) {
      findings.push(
        makeFinding(
          'warning',
          'seo-title-brand',
          entry.source_path,
          1,
          `Rendered page title should retain the ${BRAND} brand.`,
          entry.owner,
        ),
      );
    }
    if (title) {
      if (!titles.has(title)) {
        titles.set(title, []);
      }
      titles.get(title).push(entry);
    }

    const description = typeof entry.description === 'string' ? entry.description.trim() : '';
    if (!description) {
      findings.push(
        makeFinding('warning', 'seo-description-required', entry.source_path, 1, 'SEO description is required.', entry.owner),
      );
    } else {
      if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) {
        findings.push(
          makeFinding(
            'warning',
            'seo-description-length',
            entry.source_path,
            1,
            `SEO description should be ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} characters; current length is ${description.length}.`,
            entry.owner,
          ),
        );
      }
      if (isGenericDescription(description)) {
        findings.push(
          makeFinding(
            'warning',
            'seo-description-generic',
            entry.source_path,
            1,
            'SEO description is too generic; describe the specific page content.',
            entry.owner,
          ),
        );
      }
    }

    if (!entry.canonical_route_path || !entry.canonical_route_path.startsWith('/')) {
      findings.push(
        makeFinding(
          'warning',
          'seo-canonical-missing',
          entry.source_path,
          1,
          'Manifest entry must expose a canonical route path for canonical URL generation.',
          entry.owner,
        ),
      );
    }

    if (entry.locale !== 'en' && !entry.source_counterpart) {
      findings.push(
        makeFinding(
          'warning',
          'seo-hreflang-source-counterpart',
          entry.source_path,
          1,
          'Localized page has no English source counterpart for hreflang alternate generation.',
          entry.owner,
        ),
      );
    }
  }

  for (const [title, entries] of titles) {
    if (entries.length <= 1) {
      continue;
    }
    const relatedPaths = entries.map((entry) => entry.source_path);
    for (const entry of entries) {
      findings.push(
        makeFinding(
          'warning',
          'seo-title-duplicate',
          entry.source_path,
          1,
          `Rendered SEO title is duplicated across indexable pages: "${title}". Add a version, locale, or page-specific qualifier.`,
          entry.owner,
          relatedPaths.filter((sourcePath) => sourcePath !== entry.source_path),
        ),
      );
    }
  }

  return findings;
}

function readIfExists(rootDir, relativePath) {
  const absPath = path.join(rootDir, relativePath);
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
}

function lintRobots(rootDir) {
  const sourcePath = 'static/robots.txt';
  const raw = readIfExists(rootDir, sourcePath);
  if (raw === null) {
    return [
      makeFinding(
        'warning',
        'seo-robots-missing',
        sourcePath,
        1,
        'Add a static robots.txt draft for search engines and AI crawler policy review.',
      ),
    ];
  }

  const findings = [];
  if (!/User-agent:\s*(Googlebot|\*)/i.test(raw) || !/User-agent:\s*(Bingbot|\*)/i.test(raw) || !/Allow:\s*\//i.test(raw)) {
    findings.push(
      makeFinding(
        'warning',
        'seo-robots-search-engine-policy',
        sourcePath,
        1,
        'robots.txt should explicitly allow Google and Bing search indexing.',
      ),
    );
  }

  if (!/User-agent:\s*(OAI-SearchBot|GPTBot|PerplexityBot|Claudebot|Claude-SearchBot|CCBot)/i.test(raw)) {
    findings.push(
      makeFinding(
        'warning',
        'seo-robots-ai-search-policy',
        sourcePath,
        1,
        'robots.txt should include a draft policy for search-style AI crawlers.',
      ),
    );
  }

  if (!/User-agent:\s*(GPTBot|CCBot|Google-Extended)/i.test(raw) || !/training/i.test(raw) || !/Allow:\s*\//i.test(raw)) {
    findings.push(
      makeFinding(
        'warning',
        'seo-robots-training-policy',
        sourcePath,
        1,
        'robots.txt should include the approved allow policy for training-style AI crawlers.',
      ),
    );
  }

  if (!/Sitemap:\s*https:\/\/doris\.apache\.org\/sitemap\.xml/i.test(raw)) {
    findings.push(
      makeFinding('warning', 'seo-robots-sitemap', sourcePath, 1, 'robots.txt should point to the canonical sitemap URL.'),
    );
  }

  return findings;
}

function lintLlms(rootDir) {
  const sourcePath = 'static/llms.txt';
  const raw = readIfExists(rootDir, sourcePath);
  if (raw === null) {
    return [
      makeFinding(
        'warning',
        'seo-llms-missing',
        sourcePath,
        1,
        'Add static/llms.txt with curated documentation entry points for LLM-based discovery.',
      ),
    ];
  }

  return REQUIRED_LLMS_SECTIONS
    .filter((section) => !new RegExp(`(^|\\n)\\s*-\\s*${section}\\s*:`, 'i').test(raw))
    .map((section) =>
      makeFinding(
        'warning',
        'seo-llms-required-entry',
        sourcePath,
        1,
        `llms.txt should include a ${section} entry.`,
      ),
    );
}

function sitemapCandidate(rootDir) {
  for (const relativePath of ['build/sitemap.xml', 'static/sitemap.xml']) {
    if (fs.existsSync(path.join(rootDir, relativePath))) {
      return relativePath;
    }
  }
  return null;
}

function extractSitemapUrls(raw) {
  return [...raw.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

function lintSitemap(rootDir, manifest) {
  const sourcePath = 'docusaurus.config.js';
  const raw = readIfExists(rootDir, sourcePath);
  const findings = [];
  if (raw === null) {
    return findings;
  }

  if (!/filename:\s*['"]sitemap\.xml['"]/i.test(raw)) {
    findings.push(
      makeFinding('warning', 'seo-sitemap-filename', sourcePath, 1, 'Docusaurus sitemap should emit sitemap.xml.'),
    );
  }
  if (!/\/search/.test(raw) || !/\/zh-CN\/search/.test(raw) || !/\/ja\/search/.test(raw)) {
    findings.push(
      makeFinding(
        'warning',
        'seo-sitemap-search-exclusion',
        sourcePath,
        1,
        'Sitemap policy should exclude search pages for all configured locales.',
      ),
    );
  }

  const indexable = manifest.entries.filter(isIndexableEntry);
  const coverage = {
    docs: indexable.some((entry) => entry.plugin === 'main_docs' && entry.locale === 'en'),
    blog: indexable.some((entry) => entry.plugin === 'blog'),
    community: indexable.some((entry) => entry.plugin === 'community'),
    releases: indexable.some((entry) => entry.plugin === 'releases'),
    localized: indexable.some((entry) => entry.locale !== 'en'),
  };
  for (const [area, covered] of Object.entries(coverage)) {
    if (!covered) {
      findings.push(
        makeFinding(
          'info',
          'seo-sitemap-coverage',
          sourcePath,
          1,
          `Manifest has no indexable ${area} entries to verify sitemap coverage.`,
        ),
      );
    }
  }

  const sitemapPath = sitemapCandidate(rootDir);
  if (sitemapPath) {
    const sitemapUrls = extractSitemapUrls(readIfExists(rootDir, sitemapPath) || '');
    const normalizedUrls = new Set(sitemapUrls.map((url) => url.replace(/\/+$/, '')));
    if (sitemapUrls.some((url) => /\/(?:zh-CN\/|ja\/)?search\/?$/i.test(new URL(url).pathname))) {
      findings.push(
        makeFinding('warning', 'seo-sitemap-search-url', sitemapPath, 1, 'Built sitemap includes a search page URL.'),
      );
    }

    const representativeEntries = [];
    for (const plugin of ['main_docs', 'blog', 'community', 'releases']) {
      const entry = indexable.find((candidate) => candidate.plugin === plugin && candidate.locale === 'en');
      if (entry) {
        representativeEntries.push(entry);
      }
    }
    const localizedEntry = indexable.find((entry) => entry.locale !== 'en');
    if (localizedEntry) {
      representativeEntries.push(localizedEntry);
    }

    for (const entry of representativeEntries) {
      const expectedUrl = `${SITE_URL}${entry.canonical_route_path}`.replace(/\/+$/, '');
      if (!normalizedUrls.has(expectedUrl)) {
        findings.push(
          makeFinding(
            'warning',
            'seo-sitemap-missing-route',
            sitemapPath,
            1,
            `Built sitemap is missing representative indexable route ${expectedUrl}.`,
            entry.owner,
            [entry.source_path],
          ),
        );
      }
    }
  }

  return findings;
}

function lintSeo(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const manifest = options.manifest || buildManifest({ rootDir });
  return [
    ...lintEntryMetadata(manifest),
    ...lintRobots(rootDir),
    ...lintLlms(rootDir),
    ...lintSitemap(rootDir, manifest),
  ];
}

function filterSeoFindings(findings, changedFiles) {
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

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = args.root ? path.resolve(args.root) : process.cwd();
  const changedFiles = args.changed ? getChangedFiles(rootDir) : args.files ? args.files.split(',') : null;
  const manifest = buildManifest({ rootDir });
  const findings = filterSeoFindings(lintSeo({ rootDir, manifest }), changedFiles);
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
  REQUIRED_LLMS_SECTIONS,
  filterSeoFindings,
  isIndexableEntry,
  lintSeo,
  renderedTitle,
};
