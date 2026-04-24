const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { buildManifest } = require('../manifest');
const { lintFrontmatter } = require('../lint-frontmatter');
const { lintMarkdownStructure } = require('../lint-markdown-structure');
const { lintSidebar } = require('../lint-sidebar');
const { filterLinkFindings, hasLinkErrors, lintLinks } = require('../lint-links');
const { printGithubAnnotations, runChecks } = require('../report');

const fixtureRoot = path.join(__dirname, '..', '__fixtures__', 'repo');

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
  const manifest = buildManifest({ rootDir: fixtureRoot });
  const findings = lintLinks({ rootDir: fixtureRoot, manifest });

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
  const manifest = buildManifest({ rootDir: fixtureRoot });
  const findings = lintLinks({
    rootDir: fixtureRoot,
    manifest,
    changedFiles: ['docs/gettingStarted/old-page.md', 'docs/gettingStarted/new-page.md'],
    changedRecords: [
      { status: 'R', oldPath: 'docs/gettingStarted/old-page.md', path: 'docs/gettingStarted/new-page.md' },
    ],
  });

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

test('runChecks returns a unified report with manifest summary and findings', () => {
  const report = runChecks({ rootDir: fixtureRoot });

  assert.equal(report.schema_version, 1);
  assert.equal(report.summary.entries, report.manifest.entries.length);
  assert.ok(report.summary.findings > 0);
  assert.ok(report.findings.every((finding) => finding.path && finding.rule && finding.message));
  assert.ok(report.findings.some((finding) => finding.rule.startsWith('link-')));
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
