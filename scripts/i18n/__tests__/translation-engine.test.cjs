const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, loadConfig} = require('../state.cjs');
const {structure} = require('../structure.cjs');
const {managedPath, safeFile, extractUnits, protectText, responseText, openAIAdapter, translateDocument} =
    require('../translation-engine.cjs');
const {applyCandidates, applyStaged} = require('../translate-docs.cjs');
const glossary = require('../../../translations/glossary/ja.json');
// The target facts come from the real configuration, so these tests exercise
// the same language, script check and front-matter rewrite the pipeline uses.
const jaSettings = loadConfig(path.resolve(__dirname, '../../..')).locales.ja;
const target = {targetLocale: 'ja', targetScriptPattern: jaSettings.scriptPattern};

const scope = {locale: 'ja', groups: [{pluginId: 'default', version: 'current', sourceRoot: 'docs'}]};
const task = {locale: 'ja', pluginId: 'default', version: 'current', sourcePath: 'docs/a.mdx',
    targetPath: 'i18n/ja/docusaurus-plugin-content-docs/current/a.mdx'};
function adapter(transform) {
    return {translate: async ({units}) => ({translations: units.map(unit => ({id: unit.id, text: transform(unit.text)}))})};
}

test('translation changes only selected prose, visible MDX fields and image alt', async () => {
    const source = '---\ntitle: Example\nslug: /example\n---\nimport Note from "@theme/Note";\n\n# Hello\n\n'
        + 'Read `SELECT 12` and [docs](./more.md).\n\n![Diagram](./diagram.png)\n\n'
        + '<Note label="Details" mode={1}>Some text</Note>\n';
    const units = await extractUnits(source, '.mdx');
    assert(units.some(unit => unit.kind === 'image-alt' && unit.text === 'Diagram'));
    assert(units.some(unit => unit.kind === 'mdx:label' && unit.text === 'Details'));
    const translated = await translateDocument({...target, source, extension: '.mdx', glossary,
        adapter: adapter(text => ({Example: '例', Hello: 'こんにちは', Read: '読む', docs: '文書',
            Diagram: '図', Details: '詳細', 'Some text': '本文'})[text] ?? text)});
    assert.match(translated.target, /title: 例/);
    assert.match(translated.target, /# こんにちは \{#hello\}/);
    assert.match(translated.target, /`SELECT 12`/);
    assert.match(translated.target, /\[文書\]\(\.\/more\.md\)/);
    assert.match(translated.target, /!\[図\]\(\.\/diagram\.png\)/);
    assert.match(translated.target, /<Note label="詳細" mode=\{1\}>本文<\/Note>/);
    assert.equal(translated.requests, 1);
});

test('object front matter and keyword lists translate without changing route fields', async () => {
    const source = '---\n{\n  "title": "Example",\n  "language": "en",\n  "slug": "/example",\n'
        + '  "keywords": ["fast query", "analytics"]\n}\n---\n\n# Intro\n';
    const result = await translateDocument({...target, source, extension: '.md', glossary,
        adapter: adapter(text => ({Example: '例', 'fast query': '高速クエリ', analytics: '分析', Intro: '概要'})[text] ?? text)});
    assert.match(result.target, /"title": "例"/);
    assert.match(result.target, /"language": "ja"/);
    assert.match(result.target, /"slug": "\/example"/);
    assert.match(result.target, /"keywords": \["高速クエリ", "分析"\]/);
    assert.match(result.target, /# 概要 \{#intro\}/);
});

test('generated files drop inherited blank lines at EOF before publication', async () => {
    const source = '# Hello\n\nA guide.\n\n';
    const result = await translateDocument({...target, source, extension: '.md', glossary,
        adapter: adapter(text => text === 'Hello' ? 'こんにちは' : 'ガイドです。')});
    assert.match(result.target, /ガイドです。\n$/);
    assert(!result.target.endsWith('\n\n'));
});

test('missing units, modified placeholders and changed product names fail before writes', async () => {
    const source = '# Apache Doris 4.0\n\nUse value 12.\n';
    await assert.rejects(translateDocument({...target, source, extension: '.md', glossary,
        adapter: {translate: async () => ({translations: []})}}), /missing or extra/);
    await assert.rejects(translateDocument({...target, source, extension: '.md', glossary,
        adapter: adapter(text => text.replace(/⟦DORIS_KEEP_\d+⟧/, '5'))}), /placeholder changed/);
    await assert.rejects(translateDocument({...target, source, extension: '.md', glossary,
        adapter: adapter(text => text.replace('Apache Doris', 'Other DB'))}), /Glossary product term changed/);
});

test('signed numbers and version tokens are protected as whole values', () => {
    const original = 'Use -1, +2, v4.1.0 and 4.x.';
    const protectedValue = protectText(original);
    assert.equal(protectedValue.masked, 'Use ⟦DORIS_KEEP_0⟧, ⟦DORIS_KEEP_1⟧, ⟦DORIS_KEEP_2⟧ and ⟦DORIS_KEEP_3⟧.');
    assert.equal(protectedValue.restore(protectedValue.masked), original);
});

test('required terminology drift fails validation', async () => {
    await assert.rejects(translateDocument({...target, source: '# Materialized view\n\nA materialized view.\n', extension: '.md',
        glossary, adapter: adapter(() => '別の訳語')}), /Required glossary term missing/);
});

test('long page is sectioned, keeps full-document context and reuses unchanged text', async () => {
    const previousSource = '# First\n\nStable.\n\n# Second\n\nOld.\n';
    const previousTarget = '# 最初 {#first}\n\n安定。\n\n# 第二 {#second}\n\n古い。\n';
    const source = '# First\n\nStable.\n\n# Second\n\nNew.\n';
    const seen = [];
    const result = await translateDocument({...target, source, extension: '.md', glossary, previousSource, previousTarget,
        adapter: {translate: async ({document, units}) => {
            seen.push({document, units});
            return {translations: units.map(unit => ({id: unit.id, text: unit.text === 'New.' ? '新しい。' : unit.text}))};
        }}});
    assert.equal(result.reusedUnits, 3);
    assert.equal(result.requests, 1);
    assert.equal(seen[0].document, source);
    assert.match(result.target, /安定。/);
    assert.match(result.target, /新しい。/);
});

test('service response rejects incomplete/refusal and malformed JSON', async () => {
    assert.throws(() => responseText({status: 'incomplete', output: []}), /incomplete/);
    assert.throws(() => responseText({status: 'completed', output: [{type: 'message', content: [{type: 'refusal'}]}]}), /refused/);
    assert.throws(() => openAIAdapter({language: jaSettings.languageName, apiKey: '', model: 'fixture'}), /required/);
    const service = openAIAdapter({language: jaSettings.languageName, apiKey: 'test', model: 'fixture', tokenBudget: 2000, maxOutputTokens: 100,
        fetchImpl: async () => ({ok: true, json: async () => ({status: 'completed',
            output: [{type: 'message', content: [{type: 'output_text', text: 'not JSON'}]}],
            usage: {total_tokens: 10}})})});
    await assert.rejects(service.translate({document: '# Heading', units: [{id: 'u1', text: 'Heading'}], glossary}), SyntaxError);
});

test('managed paths reject traversal, plugin drift and symlink targets', () => {
    assert.equal(managedPath(scope, task), task.targetPath);
    assert.throws(() => managedPath(scope, {...task, sourcePath: 'docs/../secret.mdx'}), /Invalid managed/);
    assert.throws(() => managedPath(scope, {...task, pluginId: 'community'}), /outside/);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ja-engine-'));
    try {
        fs.symlinkSync(os.tmpdir(), path.join(root, 'link'));
        assert.throws(() => safeFile(root, 'link/doc.md'), /Symlink/);
        assert.throws(() => safeFile(root, '../doc.md'), /Unsafe/);
    } finally {fs.rmSync(root, {recursive: true, force: true});}
});

test('apply refuses an edited target and preserves state and source', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ja-apply-'));
    try {
        const file = path.join(root, 'docs.json');
        const target = path.join(root, 'target.md');
        const original = '{"schemaVersion":1,"pages":[]}\n';
        fs.writeFileSync(file, original);
        fs.writeFileSync(target, 'human edit');
        const state = {file, raw: original, data: JSON.parse(original)};
        assert.throws(() => applyCandidates(state, [{task: {targetPath: 'target.md'}, targetFile: target,
            previousTarget: null, target: '機械', record: {pluginId: 'default', version: 'current', docId: 'a', locale: 'ja',
                targetHash: hash('機械')}}]), /Target changed/);
        assert.equal(fs.readFileSync(target, 'utf8'), 'human edit');
        assert.equal(fs.readFileSync(file, 'utf8'), original);
    } finally {fs.rmSync(root, {recursive: true, force: true});}
});

test('staged live candidate applies the exact reviewed bytes and state once', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ja-staged-'));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
    try {
        fs.mkdirSync(path.join(root, 'docs'), {recursive: true});
        fs.mkdirSync(path.join(root, 'translations/scope'), {recursive: true});
        fs.mkdirSync(path.join(root, 'translations/state/ja'), {recursive: true});
        fs.writeFileSync(path.join(root, 'translations/config.json'), JSON.stringify({schemaVersion: 1,
            locales: {ja: {sourceLocale: 'en', sourceOverrides: [], languageName: jaSettings.languageName,
                scriptPattern: jaSettings.scriptPattern}}}));
        const source = '# Hello\n\nA useful page.\n';
        fs.writeFileSync(path.join(root, 'docs/a.md'), source);
        fs.writeFileSync(path.join(root, 'translations/scope/ja.json'), JSON.stringify({...scope, schemaVersion: 1, maxBatchPages: 20}));
        fs.writeFileSync(path.join(root, 'translations/state/ja/docs.json'), '{"schemaVersion":1,"pages":[]}\n');
        git('init', '-q'); git('add', '.');
        execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'fixture'], {cwd: root});
        const sourceCommit = git('rev-parse', 'HEAD');
        const id = 'T06-DEV-000000000000001';
        const planned = {...task, id, sourcePath: 'docs/a.md',
            targetPath: 'i18n/ja/docusaurus-plugin-content-docs/current/a.md',
            docId: 'a', kind: 'translate_new', sourceHash: hash(source)};
        const plan = {schemaVersion: 1, locale: 'ja', sourceCommit, selected: [id], tasks: [planned]};
        const planFile = path.join(root, 'plan.json');
        fs.writeFileSync(planFile, JSON.stringify(plan));
        const generated = await translateDocument({...target, source, extension: '.md', glossary,
            adapter: adapter(text => ({Hello: 'こんにちは', 'A useful page.': '役立つページ。'})[text] ?? text)});
        const stage = path.join(root, '.i18n-build/staged');
        fs.mkdirSync(path.join(stage, id), {recursive: true});
        fs.writeFileSync(path.join(stage, id, 'candidate.md'), generated.target);
        const record = {pluginId: 'default', version: 'current', docId: 'a', locale: 'ja',
            sourceLocale: 'en', sourcePath: planned.sourcePath, targetPath: planned.targetPath,
            sourceCommit, sourceHash: hash(source), sourceTechnicalHash: (await structure(source, '.md')).technicalHash,
            targetHash: hash(generated.target), reviewStatus: 'machine', ownership: 'machine',
            translatedAt: '2026-10-13T00:00:00.000Z', glossaryVersion: glossary.version};
        fs.writeFileSync(path.join(stage, 'manifest.json'), JSON.stringify({schemaVersion: 2, provider: 'openai',
            liveCall: true, liveVerified: false, applied: false, sourceCommit, glossaryVersion: glossary.version,
            candidates: [{id, sourceHash: hash(source), sourcePath: planned.sourcePath,
                targetPath: planned.targetPath, targetHash: hash(generated.target), targetChanged: true,
                baseline: {targetHash: null, statePath: 'translations/state/ja/docs.json',
                    stateHash: hash('{"schemaVersion":1,"pages":[]}\n'), schemaHash: null}, record}]}));
        fs.writeFileSync(path.join(root, 'docs/a.md'), '# Changed\n');
        await assert.rejects(applyStaged(root, planFile, '.i18n-build/staged'), /Source changed since planning/);
        assert.equal(fs.existsSync(path.join(root, planned.targetPath)), false);
        fs.writeFileSync(path.join(root, 'docs/a.md'), source);
        const applied = await applyStaged(root, planFile, '.i18n-build/staged');
        assert.equal(applied.applied, true);
        assert.equal(fs.readFileSync(path.join(root, planned.targetPath), 'utf8'), generated.target);
        assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'translations/state/ja/docs.json'), 'utf8')).pages[0].targetHash,
            record.targetHash);
        assert.equal(fs.readFileSync(path.join(root, 'docs/a.md'), 'utf8'), source);
        await assert.rejects(applyStaged(root, planFile, '.i18n-build/staged'), /Invalid staged live candidates/);
    } finally {fs.rmSync(root, {recursive: true, force: true});}
});
