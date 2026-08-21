import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, '..');

function write(root, relativePath, content) {
    const target = path.join(root, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
}

function packageRows(version, sourceVersion) {
    return ['x64', 'x64-noavx2', 'arm64']
        .map(
            arch => `{
                gz: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-${version}-bin-${arch}.tar.gz',
                asc: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-${version}-bin-${arch}.tar.gz.asc',
                sha512: 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-${version}-bin-${arch}.tar.gz.sha512',
                source: 'https://dist.apache.org/repos/dist/release/doris/${version
                    .split('.')
                    .slice(0, 2)
                    .join('.')}/${version}/',
                version: '${sourceVersion}',
            }`,
        )
        .join(',\n');
}

function versionEntry(version, sourceVersion) {
    const series = version.split('.').slice(0, 2).join('.');
    return `{
        label: '${version}',
        value: '${version}',
        majorVersion: '${series}',
        packages: [
            ${packageRows(version, sourceVersion)}
        ],
    }`;
}

function releaseNote(language, issueRef) {
    const title = language === 'en' ? 'Release 4.1.3' : 'Release 4.1.3';
    const description = language === 'en' ? 'Apache Doris 4.1.3 release notes' : 'Apache Doris 4.1.3 版本发布说明';
    const heading = language === 'en' ? 'New Features' : '新功能';
    const section = language === 'en' ? 'Query & Execution' : '查询与执行';
    const item = language === 'en' ? 'Support a feature' : '支持某项功能';

    return `---
{
    "title": "${title}",
    "language": "${language}",
    "description": "${description}"
}
---

# ${heading}

## ${section}
- ${item} (${issueRef})
`;
}

function createFixture({
    activeBranches = ['4.1', '4.0'],
    stalePatchOrder = false,
    zhIssueRef = '#10001',
} = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'add-release-validator-'));
    const entries = [versionEntry('4.1.3', '4.1.3-rc02'), versionEntry('4.1.2', '4.1.2')];
    const allVersions = (stalePatchOrder ? entries.slice().reverse() : entries).join(',\n');
    const branchList = activeBranches.map(branch => `'${branch}'`).join(', ');

    write(
        root,
        'src/constant/download.data.ts',
        `export const ORIGIN = 'https://apache-doris-releases.oss-accelerate.aliyuncs.com/';

// A doc comment that names ALL_VERSIONS must not confuse the array extractor.
export const ACTIVE_CORE_BRANCHES: string[] = [${branchList}];

export const ALL_VERSIONS = [
{
    label: '4.1',
    value: '4.1',
    children: [
${allVersions}
    ],
},
{
    label: '4.0',
    value: '4.0',
    children: [
${versionEntry('4.0.8', '4.0.8')}
    ],
}
];
`,
    );

    write(root, 'releasenotes/v4.1/release-4.1.3.md', releaseNote('en', '#10001'));
    write(
        root,
        'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/v4.1/release-4.1.3.md',
        releaseNote('zh-CN', zhIssueRef),
    );
    write(
        root,
        'releasenotes/core.md',
        ':::tip Latest Release\nVersion 4.1.3\n:::\n- [2026-07-13, Apache Doris 4.1.3 is released](./v4.1/release-4.1.3.md)\n',
    );
    write(
        root,
        'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/core.md',
        ':::tip 最新发布\n4.1.3 版本\n:::\n- [2026-07-13, Apache Doris 4.1.3 版本发布](./v4.1/release-4.1.3.md)\n',
    );
    write(
        root,
        'releasenotes/all-release.md',
        '## Project Release Notes\n| Doris Core | [Doris Core Release Notes](./core.md) |\n',
    );
    write(
        root,
        'i18n/zh-CN/docusaurus-plugin-content-docs-releases/current/all-release.md',
        '## 项目 Release Notes\n| Doris Core | [Doris Core 版本发布说明](./core.md) |\n',
    );
    write(
        root,
        'sidebarsReleases.json',
        JSON.stringify(
            {
                releases: [
                    'all-release',
                    {
                        type: 'category',
                        label: 'Doris Core',
                        link: { type: 'doc', id: 'core' },
                        items: [
                            {
                                type: 'category',
                                label: 'v4.1',
                                items: ['v4.1/release-4.1.3', 'v4.1/release-4.1.2'],
                            },
                        ],
                    },
                ],
            },
            null,
            2,
        ),
    );

    return root;
}

test('skill routes Doris Core history to core.md and uses the bundled validator', () => {
    const skill = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');

    assert.match(skill, /releasenotes\/core\.md/);
    assert.match(
        skill,
        /i18n\/zh-CN\/docusaurus-plugin-content-docs-releases\/current\/core\.md/,
    );
    assert.doesNotMatch(skill, /Update both all-release indexes/);
    assert.match(skill, /scripts\/validate-release\.mjs/);
    // The download page is driven by ACTIVE_CORE_BRANCHES now, not by a
    // hand-maintained VersionEnum and a duplicate DORIS_VERSIONS array.
    assert.match(skill, /ACTIVE_CORE_BRANCHES/);
    assert.match(skill, /ACTIVE_TOOL_LINES/);
    assert.doesNotMatch(skill, /DORIS_VERSIONS/);
    assert.doesNotMatch(skill, /VersionEnum/);
});

test('validator accepts a complete bilingual Doris Core release', async () => {
    const root = createFixture();

    try {
        const { validateCoreRelease } = await import('./validate-release.mjs');
        const result = await validateCoreRelease({
            repoRoot: root,
            version: '4.1.3',
            series: '4.1',
            sourceVersion: '4.1.3-rc02',
            releaseDate: '2026-07-13',
            position: 'latest',
            checkLinks: false,
            checkGitRouting: false,
        });

        assert.ok(result.checks.length > 0);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('validator rejects a headline release that is not the newest patch of its series', async () => {
    const root = createFixture({ stalePatchOrder: true });

    try {
        const { validateCoreRelease } = await import('./validate-release.mjs');
        await assert.rejects(
            validateCoreRelease({
                repoRoot: root,
                version: '4.1.3',
                series: '4.1',
                sourceVersion: '4.1.3-rc02',
                releaseDate: '2026-07-13',
                position: 'latest',
                checkLinks: false,
                checkGitRouting: false,
            }),
            /must be the first 4\.1 entry in ALL_VERSIONS/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('validator rejects a release on a branch that ACTIVE_CORE_BRANCHES does not list', async () => {
    const root = createFixture({ activeBranches: ['4.0'] });

    try {
        const { validateCoreRelease } = await import('./validate-release.mjs');
        await assert.rejects(
            validateCoreRelease({
                repoRoot: root,
                version: '4.1.3',
                series: '4.1',
                sourceVersion: '4.1.3-rc02',
                releaseDate: '2026-07-13',
                position: 'latest',
                checkLinks: false,
                checkGitRouting: false,
            }),
            /ACTIVE_CORE_BRANCHES must list 4\.1/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('validator rejects a maintained branch that has no ALL_VERSIONS data', async () => {
    const root = createFixture({ activeBranches: ['4.1', '4.0', '3.9'] });

    try {
        const { validateCoreRelease } = await import('./validate-release.mjs');
        await assert.rejects(
            validateCoreRelease({
                repoRoot: root,
                version: '4.1.3',
                series: '4.1',
                sourceVersion: '4.1.3-rc02',
                releaseDate: '2026-07-13',
                position: 'latest',
                checkLinks: false,
                checkGitRouting: false,
            }),
            /ACTIVE_CORE_BRANCHES lists 3\.9 but ALL_VERSIONS has no such branch/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('validator catches mismatched bilingual issue references', async () => {
    const root = createFixture({ zhIssueRef: '#10002' });

    try {
        const { validateCoreRelease } = await import('./validate-release.mjs');
        await assert.rejects(
            validateCoreRelease({
                repoRoot: root,
                version: '4.1.3',
                series: '4.1',
                sourceVersion: '4.1.3-rc02',
                releaseDate: '2026-07-13',
                position: 'latest',
                checkLinks: false,
                checkGitRouting: false,
            }),
            /Issue reference sequence differs/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
