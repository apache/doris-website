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
                gz: 'https://download.velodb.io/apache-doris-${version}-bin-${arch}.tar.gz',
                asc: 'https://download.velodb.io/apache-doris-${version}-bin-${arch}.tar.gz.asc',
                sha512: 'https://download.velodb.io/apache-doris-${version}-bin-${arch}.tar.gz.sha512',
                source: 'https://dist.apache.org/repos/dist/release/doris/4.1/${version}/',
                version: '${sourceVersion}',
            }`,
        )
        .join(',\n');
}

function versionEntry(version, sourceVersion) {
    return `{
        label: '${version}',
        value: '${version}',
        majorVersion: '4.1',
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
    omit412FromAll = false,
    omit412FromDoris = false,
    zhIssueRef = '#10001',
} = {}) {
    const root = mkdtempSync(path.join(tmpdir(), 'add-release-validator-'));
    const dorisVersions = [
        versionEntry('4.1.3', '4.1.3-rc02'),
        ...(omit412FromDoris ? [] : [versionEntry('4.1.2', '4.1.2')]),
    ].join(',\n');
    const allVersions = [
        versionEntry('4.1.3', '4.1.3-rc02'),
        ...(omit412FromAll ? [] : [versionEntry('4.1.2', '4.1.2')]),
    ].join(',\n');

    write(
        root,
        'src/constant/download.data.ts',
        `export const ORIGIN = 'https://download.velodb.io/';
export enum VersionEnum {
    Latest = '4.1.3',
    Prev = '4.0.7',
    Earlier = '3.1.4',
}
export const DORIS_VERSIONS = [
${dorisVersions}
];
export const ALL_VERSIONS = [
{
    label: '4.1',
    value: '4.1',
    children: [
${allVersions}
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

test('validator catches versions missing from ALL_VERSIONS', async () => {
    const root = createFixture({ omit412FromAll: true });

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
            /4\.1\.2.*missing from ALL_VERSIONS/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('validator warns, but does not fail, when DORIS_VERSIONS omits an archived version', async () => {
    // DORIS_VERSIONS is a curated shortlist, so a version present only in
    // ALL_VERSIONS is normal and must not block an otherwise correct release.
    const root = createFixture({ omit412FromDoris: true });

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

        assert.ok(
            result.warnings.some(warning => /4\.1\.2.*not DORIS_VERSIONS/.test(warning)),
            'expected a warning about 4.1.2 being absent from DORIS_VERSIONS',
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('validator resolves the binary origin from download.data.ts', async () => {
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

        assert.ok(
            result.checks.some(check =>
                /Binary ORIGIN read from .*https:\/\/download\.velodb\.io\//.test(check),
            ),
            'expected the binary origin to be read from download.data.ts',
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('validator treats an explicit --binary-origin as an assertion', async () => {
    const root = createFixture();

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
                binaryOrigin: 'https://downloads.example.invalid/',
                checkLinks: false,
                checkGitRouting: false,
            }),
            /Binary ORIGIN must match https:\/\/downloads\.example\.invalid\//,
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
