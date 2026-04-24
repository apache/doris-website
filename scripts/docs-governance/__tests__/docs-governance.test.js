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
const { lintFeatureDocs } = require('../lint-feature-docs');
const { lintSqlFunctionDocs } = require('../lint-sql-function-docs');
const { printGithubAnnotations, runChecks } = require('../report');

function loadI18nSyncLinter() {
  return require('../lint-i18n-sync');
}

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

function writeFixtureFile(rootDir, relativePath, content) {
  const absPath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, `${content.trim()}\n`, 'utf8');
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

test('runChecks reports SQL function documentation structure issues', () => {
  const badPath = 'docs/sql-manual/sql-functions/bad-function.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        badPath,
        `
---
title: BAD_FUNCTION
description: Fixture SQL function with intentionally invalid structure.
---

# BAD_FUNCTION

## Syntax

Use this function form:

\`\`\`text
BAD_FUNCTION(<value>)
\`\`\`

## Description

Returns a transformed value.

## Parameters

The value to transform.

## Return Value

Result value.

## Example

\`\`\`sql
SELECT BAD_FUNCTION(1);
\`\`\`
`,
      );
    },
    (rootDir) => runChecks({
      rootDir,
      changedFiles: [badPath, 'docs/sql-manual/sql-functions/concat.md'],
    }),
  );

  const sqlFindings = report.findings.filter((finding) => finding.rule.startsWith('sql-function-'));
  assert.ok(sqlFindings.some((finding) => finding.path === badPath && finding.rule === 'sql-function-section-order'));
  assert.ok(sqlFindings.some((finding) => finding.path === badPath && finding.rule === 'sql-function-syntax-sql-code-block'));
  assert.ok(sqlFindings.some((finding) => finding.path === badPath && finding.rule === 'sql-function-parameters-table'));
  assert.ok(sqlFindings.some((finding) => finding.path === badPath && finding.rule === 'sql-function-return-type'));
  assert.ok(sqlFindings.some((finding) => finding.path === badPath && finding.rule === 'sql-function-return-null'));
  assert.ok(sqlFindings.some((finding) => finding.path === badPath && finding.rule === 'sql-function-example-output'));
  assert.ok(!sqlFindings.some((finding) => finding.path === 'docs/sql-manual/sql-functions/concat.md'));
});

test('runChecks accepts Chinese SQL function section names and table headers', () => {
  const zhPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/current/sql-manual/sql-functions/good-zh.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        zhPath,
        `
---
title: GOOD_ZH
description: 中文 SQL 函数治理测试页面，包含完整结构。
---

# GOOD_ZH

## 描述

GOOD_ZH 函数返回输入字符串；如果输入为 NULL，则返回 NULL。

## 语法

\`\`\`sql
GOOD_ZH(<value>)
\`\`\`

## 参数

| 参数 | 描述 |
| --- | --- |
| \`<value>\` | VARCHAR 类型的输入值。 |

## 返回值

返回 VARCHAR 类型。如果输入为 NULL，则返回 NULL。

## 示例

\`\`\`sql
SELECT GOOD_ZH(NULL);
\`\`\`

\`\`\`text
+---------------+
| good_zh(NULL) |
+---------------+
| NULL          |
+---------------+
\`\`\`
`,
      );
    },
    (rootDir) => runChecks({ rootDir, changedFiles: [zhPath] }),
  );

  assert.ok(!report.findings.some((finding) => finding.path === zhPath && finding.rule.startsWith('sql-function-')));
});

test('runChecks accepts SQL function examples organized under nested headings', () => {
  const nestedExamplePath = 'docs/sql-manual/sql-functions/nested-example.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        nestedExamplePath,
        `
---
title: NESTED_EXAMPLE
description: SQL function fixture with examples grouped by subheading.
---

# NESTED_EXAMPLE

## Description

Returns the input value. Returns NULL when the input is NULL.

## Syntax

\`\`\`sql
NESTED_EXAMPLE(<value>)
\`\`\`

## Parameters

| Parameter | Description |
| --- | --- |
| \`<value>\` | VARCHAR input value. |

## Return Value

Returns VARCHAR. Returns NULL when \`<value>\` is NULL.

## Example

### NULL input

\`\`\`sql
SELECT NESTED_EXAMPLE(NULL);
\`\`\`

\`\`\`text
+----------------------+
| nested_example(NULL) |
+----------------------+
| NULL                 |
+----------------------+
\`\`\`
`,
      );
    },
    (rootDir) => runChecks({ rootDir, changedFiles: [nestedExamplePath] }),
  );

  assert.ok(
    !report.findings.some(
      (finding) => finding.path === nestedExamplePath && finding.rule.startsWith('sql-function-'),
    ),
  );
});

test('runChecks requires SQL Return Value to state the returned type', () => {
  const missingTypePath = 'docs/sql-manual/sql-functions/missing-return-type.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        missingTypePath,
        `
---
title: MISSING_RETURN_TYPE
description: SQL function fixture that documents NULL behavior but omits the return type.
---

# MISSING_RETURN_TYPE

## Description

Returns a value for testing.

## Syntax

\`\`\`sql
MISSING_RETURN_TYPE(<value>)
\`\`\`

## Parameters

| Parameter | Description |
| --- | --- |
| \`<value>\` | Input value. |

## Return Value

Returns NULL when \`<value>\` is NULL.

## Example

\`\`\`sql
SELECT MISSING_RETURN_TYPE(NULL);
\`\`\`

\`\`\`text
+---------------------------+
| missing_return_type(NULL) |
+---------------------------+
| NULL                      |
+---------------------------+
\`\`\`
`,
      );
    },
    (rootDir) => runChecks({ rootDir, changedFiles: [missingTypePath] }),
  );

  assert.ok(
    report.findings.some(
      (finding) => finding.path === missingTypePath && finding.rule === 'sql-function-return-type',
    ),
  );
  assert.ok(
    !report.findings.some(
      (finding) => finding.path === missingTypePath && finding.rule === 'sql-function-return-null',
    ),
  );
});

test('runChecks reports SQL function structure issues as info for 2.1 and earlier versions', () => {
  const legacyPath = 'versioned_docs/version-2.1/sql-manual/sql-functions/legacy-bad.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        legacyPath,
        `
---
title: LEGACY_BAD
description: Legacy fixture that should be report-only for Week 5.
---

# LEGACY_BAD

Legacy content without the required SQL function sections.
`,
      );
    },
    (rootDir) => runChecks({ rootDir, changedFiles: [legacyPath] }),
  );

  const legacyFindings = report.findings.filter(
    (finding) => finding.path === legacyPath && finding.rule.startsWith('sql-function-'),
  );
  assert.ok(legacyFindings.length > 0);
  assert.ok(legacyFindings.every((finding) => finding.severity === 'info'));
});

test('lintSqlFunctionDocs checks existing manifest SQL function entries only', () => {
  const sqlPath = 'docs/sql-manual/sql-functions/index.md';
  const conceptPath = 'docs/sql-manual/sql-functions/concept-only.md';
  const findings = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        sqlPath,
        `
---
title: SQL Function Index
description: Existing manifest entry that should be governed by doc_type.
---

# SQL Function Index

This page intentionally lacks SQL function sections.
`,
      );
      writeFixtureFile(
        rootDir,
        conceptPath,
        `
---
title: Concept Only
description: Existing file that is not a SQL function in the supplied manifest.
---

# Concept Only

This page should not be checked because its manifest doc_type is concept_doc.
`,
      );
    },
    (rootDir) =>
      lintSqlFunctionDocs({
        rootDir,
        manifest: {
          entries: [
            {
              source_path: sqlPath,
              doc_type: 'sql_function',
              version: 'current',
              owner: '@owner',
            },
            {
              source_path: conceptPath,
              doc_type: 'concept_doc',
              version: 'current',
              owner: '@owner',
            },
            {
              source_path: 'docs/sql-manual/sql-functions/missing-file.md',
              doc_type: 'sql_function',
              version: 'current',
              owner: '@owner',
            },
          ],
        },
      }),
  );

  assert.ok(findings.some((finding) => finding.path === sqlPath && finding.rule === 'sql-function-section-order'));
  assert.ok(!findings.some((finding) => finding.path === conceptPath));
  assert.ok(!findings.some((finding) => finding.path.includes('missing-file.md')));
});

test('runChecks reports feature documentation section gaps only for feature docs', () => {
  const badPath = 'docs/data-operate/bad-feature.md';
  const ordinaryPath = 'docs/data-operate/ordinary-concept.md';
  const goodPath = 'docs/data-operate/good-feature.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        badPath,
        `
---
title: Bad Feature
description: Feature fixture missing most required sections.
doc_type: feature
---

# Bad Feature

## Overview

This feature fixture intentionally omits most required sections.
`,
      );
      writeFixtureFile(
        rootDir,
        ordinaryPath,
        `
---
title: Ordinary Concept
description: Ordinary concept fixture without feature governance metadata.
---

# Ordinary Concept

Short conceptual page.
`,
      );
      writeFixtureFile(
        rootDir,
        goodPath,
        `
---
title: Good Feature
description: Feature fixture with every required quality section.
doc_type: feature
---

# Good Feature

## Overview

This feature is used when users need a governed feature documentation example.

## Quick Start

Run the minimal setup before using the feature.

## Options

| Option | Required | Description |
| --- | --- | --- |
| \`enabled\` | Yes | Enables the feature. |

## Examples

\`\`\`sql
SELECT 1;
\`\`\`

\`\`\`text
+---+
| 1 |
+---+
| 1 |
+---+
\`\`\`

## Error handling and caveats

Invalid options return a validation error.

## Best practices

Use the smallest configuration that satisfies the workload.
`,
      );
    },
    (rootDir) => runChecks({ rootDir, changedFiles: [badPath, ordinaryPath, goodPath] }),
  );

  const featureFindings = report.findings.filter((finding) => finding.rule.startsWith('feature-doc-'));
  assert.ok(featureFindings.some((finding) => finding.path === badPath && finding.message.includes('Quick Start')));
  assert.ok(featureFindings.some((finding) => finding.path === badPath && finding.message.includes('Parameters/Options')));
  assert.ok(featureFindings.some((finding) => finding.path === badPath && finding.message.includes('Examples')));
  assert.ok(featureFindings.some((finding) => finding.path === badPath && finding.message.includes('Error handling')));
  assert.ok(featureFindings.some((finding) => finding.path === badPath && finding.message.includes('Best practices')));
  assert.ok(!featureFindings.some((finding) => finding.path === ordinaryPath));
  assert.ok(!featureFindings.some((finding) => finding.path === goodPath));
});

test('lintFeatureDocs recognizes manifest doc_type feature without front matter marker', () => {
  const featurePath = 'docs/data-operate/manifest-feature.md';
  const findings = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        featurePath,
        `
---
title: Manifest Feature
description: Feature classification supplied by the governance manifest.
---

# Manifest Feature

## Overview

Manifest-classified feature page that lacks the rest of the required sections.
`,
      );
    },
    (rootDir) =>
      lintFeatureDocs({
        rootDir,
        manifest: {
          entries: [
            {
              source_path: featurePath,
              doc_type: 'feature',
              version: 'current',
              owner: '@owner',
            },
          ],
        },
      }),
  );

  assert.ok(findings.some((finding) => finding.path === featurePath && finding.message.includes('Quick Start')));
  assert.ok(findings.some((finding) => finding.path === featurePath && finding.message.includes('Parameters/Options')));
});

test('runChecks accepts Chinese feature documentation section names', () => {
  const featurePath = 'docs/data-operate/good-zh-feature.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        featurePath,
        `
---
title: 中文 Feature
description: 使用中文章节名的 Feature 文档治理测试页面。
doc_type: feature
---

# 中文 Feature

## 概览

说明功能是什么、什么时候使用，以及用户开始前需要知道的限制。

## 基本使用

提供可以立即运行的最小端到端示例。

## 参数

| 参数 | 描述 |
| --- | --- |
| \`enabled\` | 是否启用该功能。 |

## 示例

\`\`\`sql
SELECT 1;
\`\`\`

\`\`\`text
+---+
| 1 |
+---+
| 1 |
+---+
\`\`\`

## 注意事项

无效参数会返回校验错误。

## 最佳实践

优先使用满足需求的最小配置。
`,
      );
    },
    (rootDir) => runChecks({ rootDir, changedFiles: [featurePath] }),
  );

  assert.ok(!report.findings.some((finding) => finding.path === featurePath && finding.rule.startsWith('feature-doc-')));
});

test('lintI18nSync reports current English changes that need Chinese current sync', () => {
  const sourcePath = 'docs/gettingStarted/what-is-apache-doris.md';
  const zhPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/current/gettingStarted/what-is-apache-doris.md';
  const findings = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        zhPath,
        `
---
title: 什么是 Apache Doris
description: Apache Doris 中文同步测试页面。
---

# 什么是 Apache Doris
`,
      );
    },
    (rootDir) => {
      const { lintI18nSync } = loadI18nSyncLinter();
      const manifest = buildManifest({ rootDir });
      return lintI18nSync({ rootDir, manifest, changedFiles: [sourcePath] });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'i18n-sync-locale-counterpart' &&
        finding.severity === 'warning' &&
        finding.path === sourcePath &&
        finding.related_paths.includes(zhPath),
    ),
  );
});

test('lintI18nSync reports 4.x changes that need current and zh 4.x sync', () => {
  const versionPath = 'versioned_docs/version-4.x/gettingStarted/what-is-apache-doris.md';
  const currentPath = 'docs/gettingStarted/what-is-apache-doris.md';
  const zh4xPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/gettingStarted/what-is-apache-doris.md';
  const findings = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        zh4xPath,
        `
---
title: 什么是 Apache Doris
description: Apache Doris 4.x 中文同步测试页面。
---

# 什么是 Apache Doris
`,
      );
    },
    (rootDir) => {
      const { lintI18nSync } = loadI18nSyncLinter();
      const manifest = buildManifest({ rootDir });
      return lintI18nSync({ rootDir, manifest, changedFiles: [versionPath] });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'i18n-sync-version-counterpart' &&
        finding.severity === 'warning' &&
        finding.path === versionPath &&
        finding.related_paths.includes(currentPath),
    ),
  );
  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'i18n-sync-locale-counterpart' &&
        finding.severity === 'warning' &&
        finding.path === versionPath &&
        finding.related_paths.includes(zh4xPath),
    ),
  );
});

test('lintI18nSync reports missing current or 4.x counterpart for strongly synchronized docs', () => {
  const sourcePath = 'docs/gettingStarted/current-only.md';
  const findings = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        sourcePath,
        `
---
title: Current Only
description: Current-only fixture used to verify missing 4.x sync detection.
---

# Current Only
`,
      );
    },
    (rootDir) => {
      const { lintI18nSync } = loadI18nSyncLinter();
      const manifest = buildManifest({ rootDir });
      return lintI18nSync({ rootDir, manifest, changedFiles: [sourcePath] });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'i18n-sync-version-missing' &&
        finding.severity === 'warning' &&
        finding.path === sourcePath &&
        finding.related_paths.includes('versioned_docs/version-4.x/gettingStarted/current-only.md'),
    ),
  );
});

test('lintI18nSync reports Chinese-only changes that need English source confirmation', () => {
  const sourcePath = 'docs/gettingStarted/what-is-apache-doris.md';
  const zhPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/current/gettingStarted/what-is-apache-doris.md';
  const findings = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        zhPath,
        `
---
title: 什么是 Apache Doris
description: Apache Doris 中文同步测试页面。
---

# 什么是 Apache Doris
`,
      );
    },
    (rootDir) => {
      const { lintI18nSync } = loadI18nSyncLinter();
      const manifest = buildManifest({ rootDir });
      return lintI18nSync({ rootDir, manifest, changedFiles: [zhPath] });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'i18n-sync-source-counterpart' &&
        finding.severity === 'warning' &&
        finding.path === zhPath &&
        finding.related_paths.includes(sourcePath),
    ),
  );
});

test('lintI18nSync treats 3.x as non-blocking candidate and ignores 2.1 or older versions', () => {
  const sourcePath = 'docs/gettingStarted/what-is-apache-doris.md';
  const threeXPath = 'versioned_docs/version-3.x/gettingStarted/what-is-apache-doris.md';
  const zhThreeXPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/version-3.x/gettingStarted/what-is-apache-doris.md';
  const legacyPath = 'versioned_docs/version-2.1/gettingStarted/legacy-only.md';
  const result = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        threeXPath,
        `
---
title: What Is Apache Doris
description: Apache Doris 3.x sync candidate fixture.
---

# What Is Apache Doris
`,
      );
      writeFixtureFile(
        rootDir,
        zhThreeXPath,
        `
---
title: 什么是 Apache Doris
description: Apache Doris 3.x 中文同步候选测试页面。
---

# 什么是 Apache Doris
`,
      );
      writeFixtureFile(
        rootDir,
        legacyPath,
        `
---
title: Legacy Only
description: Legacy fixture that should be ignored by i18n sync.
---

# Legacy Only
`,
      );
    },
    (rootDir) => {
      const { lintI18nSync } = loadI18nSyncLinter();
      const manifest = buildManifest({ rootDir });
      return {
        currentFindings: lintI18nSync({ rootDir, manifest, changedFiles: [sourcePath, legacyPath] }),
        threeXFindings: lintI18nSync({ rootDir, manifest, changedFiles: [threeXPath, legacyPath] }),
      };
    },
  );

  assert.ok(
    result.currentFindings.some(
      (finding) =>
        finding.rule === 'i18n-sync-version-candidate' &&
        finding.severity === 'info' &&
        finding.path === sourcePath &&
        finding.related_paths.includes(threeXPath),
    ),
  );
  assert.ok(
    result.threeXFindings.some(
      (finding) =>
        finding.rule === 'i18n-sync-locale-counterpart' &&
        finding.severity === 'info' &&
        finding.path === threeXPath &&
        finding.related_paths.includes(zhThreeXPath),
    ),
  );
  assert.ok(!result.currentFindings.some((finding) => finding.path === legacyPath));
  assert.ok(!result.threeXFindings.some((finding) => finding.path === legacyPath));
  assert.ok(
    ![...result.currentFindings, ...result.threeXFindings].some(
      (finding) =>
        finding.severity === 'warning' &&
        finding.related_paths.some((relatedPath) => relatedPath.includes('version-2.1/')),
    ),
  );
});

test('lintI18nSync reports Japanese candidate translations as info only', () => {
  const sourcePath = 'docs/gettingStarted/what-is-apache-doris.md';
  const findings = withTempFixture(
    () => {},
    (rootDir) => {
      const { lintI18nSync } = loadI18nSyncLinter();
      const manifest = buildManifest({ rootDir });
      return lintI18nSync({ rootDir, manifest, changedFiles: [sourcePath] });
    },
  );

  assert.ok(
    findings.some(
      (finding) =>
        finding.rule === 'i18n-sync-locale-candidate' &&
        finding.severity === 'info' &&
        finding.path === sourcePath &&
        finding.message.includes('Japanese'),
    ),
  );
});

test('runChecks includes i18n sync findings for changed docs', () => {
  const sourcePath = 'docs/gettingStarted/what-is-apache-doris.md';
  const zhPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/current/gettingStarted/what-is-apache-doris.md';
  const report = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        zhPath,
        `
---
title: 什么是 Apache Doris
description: Apache Doris 中文同步测试页面。
---

# 什么是 Apache Doris
`,
      );
    },
    (rootDir) => runChecks({ rootDir, changedFiles: [sourcePath] }),
  );

  assert.ok(report.findings.some((finding) => finding.rule === 'i18n-sync-locale-counterpart'));
});

test('buildAiReviewPacket includes PR context, AGENTS guidance, prompts, sync groups, and related docs', () => {
  const sourcePath = 'docs/gettingStarted/what-is-apache-doris.md';
  const versionPath = 'versioned_docs/version-4.x/gettingStarted/what-is-apache-doris.md';
  const zhCurrentPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/current/gettingStarted/what-is-apache-doris.md';
  const zh4XPath = 'i18n/zh-CN/docusaurus-plugin-content-docs/version-4.x/gettingStarted/what-is-apache-doris.md';
  const packet = withTempFixture(
    (rootDir) => {
      writeFixtureFile(
        rootDir,
        'AGENTS.md',
        `
# Fixture AGENTS

Follow the repository review guide.
`,
      );
      writeFixtureFile(
        rootDir,
        zh4XPath,
        `
---
title: 什么是 Apache Doris
description: Apache Doris 4.x 中文同步测试页面。
---

# 什么是 Apache Doris
`,
      );
    },
    (rootDir) => {
      const { buildAiReviewPacket } = require('../prepare-ai-review');
      return buildAiReviewPacket({
        rootDir,
        changedFiles: [sourcePath],
        diffText: `diff --git a/${sourcePath} b/${sourcePath}\n+Added PR context\n`,
      });
    },
  );

  assert.equal(packet.schema_version, 1);
  assert.deepEqual(packet.changed_files, [sourcePath]);
  assert.match(packet.diff.text, /Added PR context/);
  assert.equal(packet.agent_instructions.repository_guide.path, 'AGENTS.md');
  assert.equal(packet.agent_instructions.repository_guide.included, true);
  assert.ok(packet.agent_instructions.repository_guide.content_preview.includes('Fixture AGENTS'));
  assert.deepEqual(
    packet.review_agents.map((agent) => agent.id),
    ['seo-geo', 'docs-clarity', 'i18n-version-sync', 'links-navigation', 'frontend-accessibility'],
  );

  const syncGroup = packet.sync_groups.find((group) => group.sync_group_id === 'main_docs:gettingStarted/what-is-apache-doris');
  assert.ok(syncGroup);
  assert.ok(syncGroup.entries.some((entry) => entry.source_path === sourcePath));
  assert.ok(syncGroup.entries.some((entry) => entry.source_path === versionPath));
  assert.ok(syncGroup.entries.some((entry) => entry.source_path === zhCurrentPath));
  assert.ok(syncGroup.entries.some((entry) => entry.source_path === zh4XPath));
  assert.ok(syncGroup.source_counterparts.includes(sourcePath));
  assert.ok(syncGroup.localized_counterparts.includes(zhCurrentPath));
  assert.ok(syncGroup.version_counterparts.includes(versionPath));
  assert.ok(packet.related_manifest_entries.some((entry) => entry.source_path === sourcePath));
  assert.ok(packet.related_context.neighboring_docs.some((entry) => entry.source_path === 'docs/gettingStarted/with-links.mdx'));
  assert.ok(
    packet.document_context.changed_files.some(
      (entry) => entry.path === sourcePath && entry.included && entry.content_preview.includes('Apache Doris'),
    ),
  );
  assert.ok(
    packet.document_context.related_docs.some(
      (entry) => entry.path === 'docs/gettingStarted/with-links.mdx' && entry.included,
    ),
  );
  assert.equal(packet.output_schema.path, 'website-quality-governance/ai-review/output-schema.json');
});

test('buildAiReviewPacket identifies high-risk docs and navigation paths', () => {
  const packet = withTempFixture(
    (rootDir) => {
      writeFixtureFile(rootDir, 'AGENTS.md', '# Fixture AGENTS');
    },
    (rootDir) => {
      const { buildAiReviewPacket } = require('../prepare-ai-review');
      return buildAiReviewPacket({
        rootDir,
        changedFiles: ['docs/sql-manual/sql-functions/concat.md', 'sidebars.ts'],
        diffText: 'diff --git a/sidebars.ts b/sidebars.ts\n+sidebar change\n',
      });
    },
  );

  assert.equal(packet.high_risk.required, true);
  assert.ok(
    packet.high_risk.matched_paths.some(
      (match) => match.path === 'docs/sql-manual/sql-functions/concat.md' && match.rule === 'docs/sql-manual/',
    ),
  );
  assert.ok(
    packet.high_risk.matched_paths.some(
      (match) => match.path === 'sidebars.ts' && match.rule === 'sidebars.ts',
    ),
  );
});

test('validateAiReviewOutput enforces required finding schema and human verification for unverified facts', () => {
  const { validateAiReviewOutput } = require('../validate-ai-review-output');
  const validFinding = {
    severity: 'warning',
    path: 'docs/gettingStarted/what-is-apache-doris.md',
    line: 12,
    issue: 'The heading is unclear for first-time readers.',
    evidence: 'The packet includes the changed heading and neighboring introduction.',
    suggested_fix: 'Use a concrete task-oriented heading.',
    blocking_recommendation: false,
    needs_human_verification: false,
  };

  assert.doesNotThrow(() => validateAiReviewOutput([validFinding]));
  assert.doesNotThrow(() => validateAiReviewOutput({ findings: [validFinding] }));
  assert.throws(
    () => validateAiReviewOutput([{ ...validFinding, severity: 'critical' }]),
    /severity/,
  );
  assert.throws(
    () => {
      const { suggested_fix: _suggestedFix, ...missingSuggestedFix } = validFinding;
      validateAiReviewOutput([missingSuggestedFix]);
    },
    /suggested_fix/,
  );
  assert.throws(
    () =>
      validateAiReviewOutput([
        {
          ...validFinding,
          issue: 'Doris SQL function FOO returns a VARCHAR for all numeric inputs.',
          evidence: '',
          needs_human_verification: false,
        },
      ]),
    /needs_human_verification/,
  );
});

test('dedupeAiReviewFindings returns stable unique findings', () => {
  const { dedupeAiReviewFindings } = require('../dedupe-ai-review-comments');
  const duplicate = {
    severity: 'warning',
    path: 'docs/a.md',
    line: 7,
    issue: 'Repeated issue',
    evidence: 'Same evidence.',
    suggested_fix: 'Same fix.',
    blocking_recommendation: false,
    needs_human_verification: false,
  };
  const uniqueFindings = dedupeAiReviewFindings([
    duplicate,
    { ...duplicate, evidence: 'Duplicate with different wording.' },
    { ...duplicate, line: 8 },
    { ...duplicate, key: 'explicit-key', issue: 'Explicit key issue' },
    { ...duplicate, key: 'explicit-key', issue: 'Explicit key duplicate' },
  ]);
  const repeat = dedupeAiReviewFindings([
    duplicate,
    { ...duplicate, evidence: 'Duplicate with different wording.' },
    { ...duplicate, line: 8 },
    { ...duplicate, key: 'explicit-key', issue: 'Explicit key issue' },
    { ...duplicate, key: 'explicit-key', issue: 'Explicit key duplicate' },
  ]);

  assert.equal(uniqueFindings.length, 3);
  assert.equal(uniqueFindings[0].issue, 'Repeated issue');
  assert.equal(uniqueFindings[1].line, 8);
  assert.equal(uniqueFindings[2].key, 'explicit-key');
  assert.deepEqual(
    uniqueFindings.map((finding) => finding.dedupe_key),
    repeat.map((finding) => finding.dedupe_key),
  );
});

test('Week 7 AI review scripts and workflow are exposed without replacing the generic review workflow', () => {
  const rootDir = path.join(__dirname, '..', '..', '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const docsAiReviewWorkflow = fs.readFileSync(
    path.join(rootDir, '.github/workflows/docs-ai-review.yml'),
    'utf8',
  );
  const openCodeWorkflow = fs.readFileSync(
    path.join(rootDir, '.github/workflows/opencode-review.yml'),
    'utf8',
  );

  assert.equal(packageJson.scripts['docs:ai-review:prepare'], 'node scripts/docs-governance/prepare-ai-review.js');
  assert.equal(packageJson.scripts['docs:ai-review:validate'], 'node scripts/docs-governance/validate-ai-review-output.js');
  assert.equal(packageJson.scripts['docs:ai-review:dedupe'], 'node scripts/docs-governance/dedupe-ai-review-comments.js');
  assert.match(docsAiReviewWorkflow, /\/review-docs/);
  assert.match(docsAiReviewWorkflow, /ai-review-docs/);
  assert.match(docsAiReviewWorkflow, /pull-requests: read/);
  assert.match(docsAiReviewWorkflow, /contents: read/);
  assert.match(docsAiReviewWorkflow, /issues: write/);
  assert.ok(docsAiReviewWorkflow.indexOf('Checkout PR head') < docsAiReviewWorkflow.indexOf('issues: write'));
  assert.match(openCodeWorkflow, /\/review/);
});

test('Week 5 and Week 6 governance scripts and author templates are exposed', () => {
  const rootDir = path.join(__dirname, '..', '..', '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

  assert.equal(packageJson.scripts['docs:sql-functions'], 'node scripts/docs-governance/lint-sql-function-docs.js');
  assert.equal(packageJson.scripts['docs:sql-functions:changed'], 'node scripts/docs-governance/lint-sql-function-docs.js --changed');
  assert.equal(packageJson.scripts['docs:features'], 'node scripts/docs-governance/lint-feature-docs.js');
  assert.equal(packageJson.scripts['docs:features:changed'], 'node scripts/docs-governance/lint-feature-docs.js --changed');
  assert.equal(packageJson.scripts['docs:i18n-sync'], 'node scripts/docs-governance/lint-i18n-sync.js');
  assert.equal(packageJson.scripts['docs:i18n-sync:changed'], 'node scripts/docs-governance/lint-i18n-sync.js --changed');

  const sqlTemplate = fs.readFileSync(
    path.join(rootDir, 'website-quality-governance/templates/sql-function-doc.md'),
    'utf8',
  );
  const featureTemplate = fs.readFileSync(
    path.join(rootDir, 'website-quality-governance/templates/feature-doc.md'),
    'utf8',
  );

  for (const heading of ['## Description', '## Syntax', '## Parameters', '## Return Value', '## Example']) {
    assert.ok(sqlTemplate.includes(heading));
  }
  assert.ok(sqlTemplate.includes('```sql'));
  assert.ok(sqlTemplate.includes('```text'));

  for (const heading of ['## Overview', '## Quick Start', '## Parameters / Options', '## Examples', '## Error handling and caveats', '## Best practices']) {
    assert.ok(featureTemplate.includes(heading));
  }
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
