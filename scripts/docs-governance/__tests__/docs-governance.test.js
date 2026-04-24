const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { buildManifest } = require('../manifest');
const { lintFrontmatter } = require('../lint-frontmatter');
const { lintMarkdownStructure } = require('../lint-markdown-structure');
const { lintSidebar } = require('../lint-sidebar');
const { filterLinkFindings, hasLinkErrors, lintLinks } = require('../lint-links');
const { filterSeoFindings, lintSeo } = require('../lint-seo');
const { printGithubAnnotations, runChecks } = require('../report');

const fixtureRoot = path.join(__dirname, '..', '__fixtures__', 'repo');

function withTempFixture(mutator, callback) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-governance-fixture-'));
  fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
  try {
    mutator(tempRoot);
    return callback(tempRoot);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

test('buildManifest maps docs across roots to stable identities', () => {
  const manifest = buildManifest({ rootDir: fixtureRoot });
  const byPath = new Map(manifest.entries.map((entry) => [entry.source_path, entry]));

  assert.equal(
    byPath.get('docs/gettingStarted/what-is-apache-doris.md').doc_id,
    'gettingStarted/what-is-apache-doris',
  );
  assert.equal(
    byPath.get('docs/gettingStarted/what-is-apache-doris.md').route_path,
    '/docs/dev/gettingStarted/what-is-apache-doris',
  );
  assert.equal(
    byPath.get('versioned_docs/version-4.x/gettingStarted/what-is-apache-doris.md').sync_group_id,
    'main_docs:gettingStarted/what-is-apache-doris',
  );
  assert.equal(
    byPath.get('i18n/zh-CN/docusaurus-plugin-content-docs/current/gettingStarted/what-is-apache-doris.md').locale,
    'zh-CN',
  );
  assert.equal(
    byPath.get('docs/sql-manual/sql-functions/concat.md').doc_type,
    'sql_function',
  );
});

test('lintFrontmatter reports missing required metadata without mutating files', () => {
  const manifest = buildManifest({ rootDir: fixtureRoot });
  const findings = lintFrontmatter({ rootDir: fixtureRoot, manifest });
  const missingDescription = findings.find(
    (finding) =>
      finding.rule === 'frontmatter-description-required' &&
      finding.path === 'docs/gettingStarted/missing-description.md',
  );

  assert.ok(missingDescription);
  assert.equal(missingDescription.severity, 'warning');
});

test('lintMarkdownStructure reports heading and code fence issues', () => {
  const manifest = buildManifest({ rootDir: fixtureRoot });
  const findings = lintMarkdownStructure({ rootDir: fixtureRoot, manifest });

  assert.ok(findings.some((finding) => finding.rule === 'markdown-single-h1'));
  assert.ok(findings.some((finding) => finding.rule === 'markdown-heading-increment'));
  assert.ok(findings.some((finding) => finding.rule === 'markdown-code-fence-language'));
});

test('lintSidebar reports missing sidebar targets and orphan docs', () => {
  const manifest = buildManifest({ rootDir: fixtureRoot });
  const findings = lintSidebar({ rootDir: fixtureRoot, manifest });

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'sidebar-missing-doc' &&
        finding.message.includes('gettingStarted/does-not-exist'),
    ),
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'sidebar-orphan-doc' &&
        finding.path === 'docs/gettingStarted/missing-description.md',
    ),
  );
  assert.ok(
    !findings.some(
      (finding) =>
        finding.rule === 'sidebar-orphan-doc' &&
        finding.path === 'versioned_docs/version-4.x/gettingStarted/what-is-apache-doris.md',
    ),
  );
});

test('lintLinks validates markdown links, images, routes, anchors, and code exclusions', () => {
  const findings = withTempFixture(
    (rootDir) => {
      fs.appendFileSync(
        path.join(rootDir, 'docs/gettingStarted/with-links.mdx'),
        [
          '',
          'Missing relative page: [Missing](./missing-page.md)',
          '',
          'Missing anchor: [Missing anchor](./what-is-apache-doris.md#missing-anchor)',
          '',
          'External link: [Apache](https://apache.org/)',
          '',
        ].join('\n'),
        'utf8',
      );
    },
    (rootDir) => {
      const manifest = buildManifest({ rootDir });
      return lintLinks({ rootDir, manifest });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'link-missing-target' &&
        finding.path === 'docs/gettingStarted/with-links.mdx' &&
        finding.message.includes('./missing-page.md'),
    ),
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'link-missing-anchor' &&
        finding.path === 'docs/gettingStarted/with-links.mdx' &&
        finding.message.includes('#missing-anchor'),
    ),
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'link-external-report-only' &&
        finding.path === 'docs/gettingStarted/with-links.mdx',
    ),
  );
  assert.ok(
    !findings.some(
      (finding) =>
        finding.path === 'docs/gettingStarted/with-links.mdx' &&
        finding.message.includes('ignored-code-link.md'),
    ),
  );
  assert.ok(
    !findings.some(
      (finding) =>
        finding.path === 'docs/gettingStarted/with-links.mdx' &&
        finding.message.includes('missing-image.png'),
    ),
  );
  assert.ok(
    !findings.some(
      (finding) =>
        finding.path === 'docs/gettingStarted/with-links.mdx' &&
        finding.message.includes('/docs/dev/gettingStarted/what-is-apache-doris#overview'),
    ),
  );
});

test('lintLinks reports inbound links and redirect review for deleted or renamed docs', () => {
  const findings = withTempFixture(
    (rootDir) => {
      fs.appendFileSync(
        path.join(rootDir, 'docs/gettingStarted/with-links.mdx'),
        ['', 'Old page reference: [Old page](./old-page.md)', ''].join('\n'),
        'utf8',
      );
    },
    (rootDir) => {
      const manifest = buildManifest({ rootDir });
      return lintLinks({
        rootDir,
        manifest,
        changedFiles: ['docs/gettingStarted/old-page.md', 'docs/gettingStarted/new-page.md'],
        changedRecords: [
          { status: 'R', oldPath: 'docs/gettingStarted/old-page.md', path: 'docs/gettingStarted/new-page.md' },
        ],
      });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'link-moved-file-inbound-reference' &&
        finding.path === 'docs/gettingStarted/with-links.mdx' &&
        finding.message.includes('docs/gettingStarted/old-page.md'),
    ),
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'link-path-change-redirect-review' &&
        finding.path === 'docs/gettingStarted/new-page.md' &&
        finding.message.includes('redirects'),
    ),
  );
});

test('lintLinks ignores moved or deleted markdown outside governed content roots', () => {
  const manifest = buildManifest({ rootDir: fixtureRoot });
  const findings = lintLinks({
    rootDir: fixtureRoot,
    manifest,
    changedFiles: [
      'website-quality-governance/weekly-todo.md',
      'website-quality-governance/baseline-audit.md',
    ],
    changedRecords: [
      { status: 'D', path: 'website-quality-governance/weekly-todo.md' },
      {
        status: 'R',
        oldPath: 'website-quality-governance/baseline-audit.md',
        path: 'website-quality-governance/quality-baseline.md',
      },
    ],
  });

  assert.ok(!findings.some((finding) => finding.rule === 'link-path-change-redirect-review'));
});

test('filterLinkFindings keeps changed paths and related moved-file findings only', () => {
  const findings = [
    {
      rule: 'link-missing-target',
      path: 'docs/gettingStarted/with-links.mdx',
      message: 'Changed file finding.',
    },
    {
      rule: 'link-missing-target',
      path: 'docs/gettingStarted/unrelated.md',
      message: 'Unrelated full-site finding.',
    },
    {
      rule: 'link-moved-file-inbound-reference',
      path: 'docs/gettingStarted/with-links.mdx',
      message: 'Inbound reference to old path.',
      related_paths: ['docs/gettingStarted/old-page.md', 'docs/gettingStarted/new-page.md'],
    },
    {
      rule: 'link-deleted-file-inbound-reference',
      path: 'docs/gettingStarted/other-inbound.md',
      message: 'Inbound reference to unrelated old path.',
      related_paths: ['docs/gettingStarted/unrelated-old.md'],
    },
  ];

  const filtered = filterLinkFindings(findings, [
    'docs/gettingStarted/with-links.mdx',
    'docs/gettingStarted/old-page.md',
  ]);

  assert.deepEqual(
    filtered.map((finding) => finding.rule),
    ['link-missing-target', 'link-moved-file-inbound-reference'],
  );
});

test('hasLinkErrors treats only error severity as blocking', () => {
  assert.equal(
    hasLinkErrors([
      { severity: 'info', rule: 'external-link', path: 'docs/info.md' },
      { severity: 'warning', rule: 'redirect-review', path: 'docs/warning.md' },
    ]),
    false,
  );
  assert.equal(
    hasLinkErrors([
      { severity: 'info', rule: 'external-link', path: 'docs/info.md' },
      { severity: 'error', rule: 'missing-target', path: 'docs/error.md' },
    ]),
    true,
  );
});

test('lintSeo reports duplicate titles and non-specific descriptions for indexable pages', () => {
  const findings = withTempFixture(
    (rootDir) => {
      fs.writeFileSync(
        path.join(rootDir, 'docs/gettingStarted/duplicate-title.md'),
        [
          '---',
          'title: What Is Apache Doris',
          'description: Apache Doris documentation.',
          '---',
          '',
          '# Duplicate title',
          '',
        ].join('\n'),
        'utf8',
      );
    },
    (rootDir) => {
      const manifest = buildManifest({ rootDir });
      return lintSeo({ rootDir, manifest });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'seo-title-duplicate' &&
        finding.path === 'docs/gettingStarted/duplicate-title.md',
    ),
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'seo-description-generic' &&
        finding.path === 'docs/gettingStarted/duplicate-title.md',
    ),
  );
});

test('lintSeo checks static robots, llms, and sitemap policy drafts', () => {
  const findings = withTempFixture(
    (rootDir) => {
      fs.mkdirSync(path.join(rootDir, 'static'), { recursive: true });
      fs.writeFileSync(
        path.join(rootDir, 'static/robots.txt'),
        [
          'User-agent: Googlebot',
          'Allow: /',
          '',
          'User-agent: Bingbot',
          'Allow: /',
          '',
          'User-agent: GPTBot',
          'Allow: /',
          '',
          'User-agent: PerplexityBot',
          'Allow: /',
          '',
          '# Training-style AI crawlers may access public documentation.',
          'User-agent: CCBot',
          'Allow: /',
          'Sitemap: https://doris.apache.org/sitemap.xml',
          '',
        ].join('\n'),
        'utf8',
      );
      fs.writeFileSync(
        path.join(rootDir, 'static/llms.txt'),
        [
          '# Apache Doris documentation for LLMs',
          '',
          '- Overview: https://doris.apache.org/docs/4.x/gettingStarted/what-is-apache-doris',
          '- Getting Started: https://doris.apache.org/docs/4.x/gettingStarted/quick-start',
          '- SQL Manual: https://doris.apache.org/docs/4.x/sql-manual/',
          '- Load: https://doris.apache.org/docs/4.x/data-operate/import/',
          '- Lakehouse: https://doris.apache.org/docs/4.x/lakehouse/',
          '- AI: https://doris.apache.org/docs/4.x/ai/',
          '- Admin: https://doris.apache.org/docs/4.x/admin-manual/',
          '- Release Notes: https://doris.apache.org/releases/all-release',
          '- Community: https://doris.apache.org/community/join-community',
          '',
        ].join('\n'),
        'utf8',
      );
      fs.writeFileSync(
        path.join(rootDir, 'docusaurus.config.js'),
        [
          'module.exports = {',
          "  presets: [[ 'classic', { sitemap: { filename: 'sitemap.xml', createSitemapItems: async () => {",
          "    return items.filter(item => !['/search', '/ja/search', '/zh-CN/search'].includes(new URL(item.url).pathname.replace(/\\/+$/, '')));",
          '  } } } ]],',
          '};',
          '',
        ].join('\n'),
        'utf8',
      );
    },
    (rootDir) => {
      const manifest = buildManifest({ rootDir });
      return lintSeo({ rootDir, manifest });
    },
  );

  assert.ok(!findings.some((finding) => finding.rule === 'seo-robots-missing'));
  assert.ok(!findings.some((finding) => finding.rule === 'seo-robots-search-engine-policy'));
  assert.ok(!findings.some((finding) => finding.rule === 'seo-llms-missing'));
  assert.ok(!findings.some((finding) => finding.rule === 'seo-llms-required-entry'));
  assert.ok(!findings.some((finding) => finding.rule === 'seo-sitemap-search-exclusion'));
});

test('filterSeoFindings keeps changed page findings without full-site SEO noise', () => {
  const findings = [
    { rule: 'seo-description-length', path: 'docs/changed.md', message: 'Changed page.' },
    { rule: 'seo-description-length', path: 'docs/unrelated.md', message: 'Unrelated page.' },
    { rule: 'seo-robots-missing', path: 'static/robots.txt', message: 'Site policy.' },
  ];

  assert.deepEqual(
    filterSeoFindings(findings, ['docs/changed.md']).map((finding) => finding.path),
    ['docs/changed.md'],
  );
});

test('runChecks returns a unified report with manifest summary and findings', () => {
  const report = withTempFixture(
    (rootDir) => {
      fs.appendFileSync(
        path.join(rootDir, 'docs/gettingStarted/with-links.mdx'),
        ['', 'External link: [Apache](https://apache.org/)', ''].join('\n'),
        'utf8',
      );
    },
    (rootDir) => runChecks({ rootDir }),
  );

  assert.equal(report.schema_version, 1);
  assert.equal(report.summary.entries, report.manifest.entries.length);
  assert.ok(report.summary.findings > 0);
  assert.ok(report.findings.every((finding) => finding.path && finding.rule && finding.message));
  assert.ok(report.findings.some((finding) => finding.rule.startsWith('link-')));
  assert.ok(report.findings.some((finding) => finding.rule.startsWith('seo-')));
});

test('printGithubAnnotations maps info, warning, and error severities to GitHub levels', () => {
  let output = '';
  const originalWrite = process.stdout.write;
  process.stdout.write = (chunk) => {
    output += chunk;
    return true;
  };

  try {
    printGithubAnnotations([
      {
        severity: 'info',
        rule: 'external-report-only',
        path: 'docs/info.md',
        line: 1,
        message: 'External link is report-only.',
      },
      {
        severity: 'warning',
        rule: 'redirect-review',
        path: 'docs/warning.md',
        line: 2,
        message: 'Review redirect.',
      },
      {
        severity: 'error',
        rule: 'missing-link',
        path: 'docs/error.md',
        line: 3,
        message: 'Missing link.',
      },
    ]);
  } finally {
    process.stdout.write = originalWrite;
  }

  assert.match(output, /::notice file=docs\/info\.md,line=1,title=external-report-only::/);
  assert.match(output, /::warning file=docs\/warning\.md,line=2,title=redirect-review::/);
  assert.match(output, /::error file=docs\/error\.md,line=3,title=missing-link::/);
});
