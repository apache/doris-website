const test = require('node:test');
const assert = require('node:assert/strict');
const {hash, identity, decide} = require('../state.cjs');
const {structure, alignHeadings} = require('../structure.cjs');

test('Japanese version messages match the custom banner interpolation contract', () => {
    const dictionary = require('../../../i18n/ja/code.json');
    const variables = key => [...dictionary[key].message.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    assert.deepEqual(variables('theme.docs.versions.unreleasedVersionLabel'), ['unreleased']);
    assert.deepEqual(variables('theme.docs.versions.latestVersionSuggestionLabel'), ['v21Link', 'v3xLink', 'v4xLink']);
});

const page = {pluginId: 'default', version: 'current', docId: 'intro', locale: 'ja', sourceLocale: 'en',
    sourcePath: 'docs/intro.md', targetPath: 'i18n/ja/docusaurus-plugin-content-docs/current/intro.md'};
const original = '## Usage\n\nUse Doris.\n\n```sql\nSELECT 1;\n```\n';
const target = '## 使用方法 {#usage}\n\nDoris を使用します。\n\n```sql\nSELECT 1;\n```\n';
async function setup() {
    const technicalHash = (await structure(original, '.md')).technicalHash;
    const record = {...page, sourceHash: hash(original), targetHash: hash(target), sourceTechnicalHash: technicalHash,
        sourceCommit: 'a'.repeat(40), reviewStatus: 'machine', ownership: 'machine',
        translatedAt: '2026-10-11T19:57:11Z', glossaryVersion: '0'};
    return {page, source: original, target, record, technicalHash};
}

test('missing and unrecorded files cannot claim to be current Japanese translations', async () => {
    const data = await setup();
    assert.equal(decide({...data, target: undefined}).status, 'untranslated');
    const state = decide({...data, record: undefined});
    assert.equal(state.status, 'unverified');
    assert.equal(state.contentLocale, 'en');
    assert.equal(state.indexable, false);
});

test('freshness does not change machine/human review identity or ownership', async () => {
    const data = await setup();
    assert.equal(decide(data).status, 'current');
    for (const reviewStatus of ['machine', 'human', 'unverified']) {
        const state = decide({...data, record: {...data.record, reviewStatus, ownership: 'human'}});
        assert.equal(state.status, 'current');
        assert.equal(state.reviewStatus, reviewStatus);
        assert.equal(state.useTarget, true);
        assert.equal(state.indexable, reviewStatus !== 'unverified');
    }
});

test('unclassified prose updates select the new English source', async () => {
    const data = await setup();
    const source = original.replace('Use Doris.', 'Try Doris.');
    const state = decide({...data, source, technicalHash: (await structure(source, '.md')).technicalHash});
    assert.equal(state.status, 'stale_unknown');
    assert.equal(state.useTarget, false);
});

test('a prose approval must bind both source revisions and the current target', async () => {
    const data = await setup();
    const source = original.replace('Use Doris.', 'Try Doris.');
    const safeSourceChange = {kind: 'prose', fromSourceHash: hash(original), toSourceHash: hash(source),
        targetHash: hash(target), reviewedBy: 'reviewer', reviewedAt: '2026-10-11T20:00:00Z'};
    const args = {...data, source, technicalHash: (await structure(source, '.md')).technicalHash,
        record: {...data.record, safeSourceChange}};
    const safe = decide(args);
    assert.equal(safe.status, 'stale_prose');
    assert.equal(safe.useTarget, true);
    assert.equal(safe.indexable, false);
    for (const [key, value] of Object.entries({fromSourceHash: 'old', toSourceHash: 'other', targetHash: 'changed', reviewedBy: '', reviewedAt: 'invalid'})) {
        assert.equal(decide({...args, record: {...args.record, safeSourceChange: {...safeSourceChange, [key]: value}}}).status, 'stale_unknown');
    }
});

test('SQL, parameter values, links, headings and MDX attributes invalidate prose exceptions', async () => {
    const data = await setup();
    for (const source of [original.replace('SELECT 1', 'SELECT 2'), original + '\nTimeout: 10\n',
        original + '\n[link](https://example.com)\n', original.replace('Usage', 'Installation')]) {
        const safeSourceChange = {kind: 'prose', fromSourceHash: hash(original), toSourceHash: hash(source),
            targetHash: hash(target), reviewedBy: 'reviewer', reviewedAt: '2026-10-11T20:00:00Z'};
        const state = decide({...data, source, technicalHash: (await structure(source, '.md')).technicalHash,
            record: {...data.record, safeSourceChange}});
        assert.equal(state.status, 'stale_technical');
        assert.equal(state.contentLocale, 'en');
    }
    const mdx = original + '\n<Widget timeout={10} />\n';
    assert.notEqual((await structure(mdx, '.mdx')).technicalHash,
        (await structure(mdx.replace('timeout={10}', 'timeout={20}'), '.mdx')).technicalHash);
});

test('manual target changes and record identity/path conflicts select English without overwriting the target', async () => {
    const data = await setup();
    assert.equal(decide({...data, target: target + '\n人による変更\n'}).status, 'target_modified');
    for (const record of [{...data.record, version: '4.x'}, {...data.record, pluginId: 'community'},
        {...data.record, sourcePath: '../outside.md'}, {...data.record, sourceLocale: 'zh-CN'},
        {...data.record, translatedAt: 'not a date'}, {...data.record, reviewStatus: 'approved'}]) {
        assert.equal(decide({...data, record}).status, 'state_conflict');
    }
    assert.notEqual(identity(page), identity({...page, version: '4.x'}));
    assert.notEqual(identity(page), identity({...page, pluginId: 'community'}));
});

test('source hashing includes SQL, parameters, MDX, metadata and whitespace, normalizing only CRLF', () => {
    assert.equal(hash(original), hash(original.replace(/\n/g, '\r\n')));
    assert.notEqual(hash(original), hash(original.replace('SELECT 1', 'SELECT 2')));
    assert.notEqual(hash(original), hash(original + '\n'));
});

test('heading alignment follows native duplicate IDs, explicit IDs, setext and fenced code', async () => {
    const source = '---\ntitle: Heading\n---\n## Usage\n## Usage\n## Fixed {#CaseID}\n\nSetext\n------\n\n```md\n## Not a heading\n```\n';
    const japanese = '---\ntitle: 見出し\n---\n## 使用方法\n## 使用方法\n## 固定\n\nセクション\n------\n\n```md\n## Not a heading\n```\n';
    const sourceStructure = await structure(source, '.md');
    assert.deepEqual(sourceStructure.headings.map(h => h.id), ['usage', 'usage-1', 'CaseID', 'setext']);
    const aligned = await alignHeadings(sourceStructure, japanese, '.md');
    assert.deepEqual((await structure(aligned, '.md')).headings.map(h => h.id), ['usage', 'usage-1', 'CaseID', 'setext']);
    assert(aligned.startsWith('---\ntitle: 見出し\n---\n'));
    assert(aligned.includes('## Not a heading\n```'));
    await assert.rejects(alignHeadings(sourceStructure, japanese.replace('## 固定\n', ''), '.md'), /heading structure/);
});

test('MDX imports, expressions and explicit IDs preserve heading order and raw offsets', async () => {
    const source = "import Card from '@site/Card';\n\n# Getting started\n\nWelcome.\n\n## Usage\n\n<Card timeout={10}/>\n\n## Usage\n";
    const japanese = "import Card from '@site/Card';\n\n# 入門 {#getting-started}\n\nようこそ。\n\n## 使用方法 {#usage}\n\n<Card timeout={10}/>\n\n## 使用方法 {#usage-1}\n";
    const parsed = await structure(source, '.mdx');
    assert.deepEqual(parsed.headings.map(h => h.id), ['getting-started', 'usage', 'usage-1']);
    const aligned = await alignHeadings(parsed, japanese, '.mdx');
    assert.deepEqual((await structure(aligned, '.mdx')).headings.map(h => h.id), ['getting-started', 'usage', 'usage-1']);
    assert.equal((aligned.match(/<Card timeout=\{10\}\/>/g) ?? []).length, 1);
    const prose = source.replace('Welcome.', 'Try Doris.');
    assert.equal((await structure(prose, '.mdx')).technicalHash, parsed.technicalHash);
    const override = '---\nmdx:\n  format: mdx\n---\n';
    assert.deepEqual((await structure(override + japanese, '.md')).headings.map(h => h.id), ['getting-started', 'usage', 'usage-1']);
    assert.deepEqual((await structure(override + source, '.md')).headings.map(h => h.id), ['getting-started', 'usage', 'usage-1']);
    const setext = await structure('English heading\n---------------\n', '.mdx');
    const setextTarget = await alignHeadings(setext, '日本語の見出し\n-------------\n', '.mdx');
    assert.deepEqual((await structure(setextTarget, '.mdx')).headings.map(h => h.id), ['english-heading']);
});
