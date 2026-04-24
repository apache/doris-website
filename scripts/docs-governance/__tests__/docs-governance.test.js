const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { buildManifest } = require('../manifest');
const { lintFrontmatter } = require('../lint-frontmatter');
const { lintMarkdownStructure } = require('../lint-markdown-structure');
const { lintSidebar } = require('../lint-sidebar');
const { runChecks } = require('../report');

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

test('runChecks returns a unified report with manifest summary and findings', () => {
  const report = runChecks({ rootDir: fixtureRoot });

  assert.equal(report.schema_version, 1);
  assert.equal(report.summary.entries, report.manifest.entries.length);
  assert.ok(report.summary.findings > 0);
  assert.ok(report.findings.every((finding) => finding.path && finding.rule && finding.message));
});
