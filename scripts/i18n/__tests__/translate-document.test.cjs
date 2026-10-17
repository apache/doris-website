const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {translateWholeDocument} = require('../translate-document.cjs');
const {acceptedFallback, checkLinks, checkSyntax, inspectDocument} = require('../document-checks.cjs');
const {checkTranslations} = require('../check-translations.cjs');
const {hash, identity} = require('../state.cjs');
const {structure} = require('../structure.cjs');
const {codexAdapter} = require('../codex-adapter.cjs');

const glossary = {schemaVersion: 1, version: '1', keep: ['Doris', 'BE'], terms: []};
const options = {source: '# Guide\n\nDoris guide.\n', extension: '.md', glossary,
    targetLocale: 'ja', targetScriptPattern: '[ぁ-んァ-ヶ一-龯]'};
const translated = '# ガイド\n\nDoris のガイド。\n';

test('a document over the former limit is sent in full in one request', async () => {
    const source = '# Guide\n\n' + 'A long paragraph. '.repeat(5000) + '\n';
    let calls = 0;
    const result = await translateWholeDocument({...options, source, adapter: {translateDocument: async input => {
        calls++;
        assert.equal(input.document, source);
        assert(!Object.hasOwn(input, 'units'));
        return {translation: '# ガイド\n\n' + '長い段落。'.repeat(5000) + '\n'};
    }}});
    assert(source.length > 60000);
    assert.equal(calls, 1);
    assert.equal(result.requests, 1);
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('each retry receives all prior failures and can repair the document', async () => {
    const seen = [];
    const result = await translateWholeDocument({...options, adapter: {translateDocument: async input => {
        seen.push(structuredClone(input));
        if (seen.length === 1) return {translation: '# ガイド\n\n製品のガイド。\n'};
        if (seen.length === 2) return {translation: translated + '\n```sql\nSELECT 1;\n```\n'};
        return {translation: translated};
    }}});
    assert.equal(result.requests, 3);
    assert.equal(seen[0].feedback.length, 0);
    assert.match(seen[1].feedback[0].issues[0].message, /Doris/);
    assert.equal(seen[2].feedback.length, 2);
    assert(seen[2].feedback[1].issues.some(item => item.check === 'protected-content'));
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('the third response is retained with warnings, without a fourth request', async () => {
    let calls = 0;
    const result = await translateWholeDocument({...options, adapter: {translateDocument: async () => ({
        translation: `# ガイド\n\n製品のガイド ${++calls}。\n`,
    })}});
    assert.equal(calls, 3);
    assert.match(result.target, /ガイド 3/);
    assert.equal(result.generation.acceptedWithWarnings, true);
    assert.equal(result.generation.history.length, 3);
    const record = {generation: result.generation, ownership: 'machine', reviewStatus: 'machine'};
    assert(acceptedFallback(record, options.source, result.target));
    assert(!acceptedFallback(record, options.source, result.target + 'later edit'));
    assert(!acceptedFallback(record, options.source + 'source edit', result.target));
    assert(!acceptedFallback({...record, ownership: 'human'}, options.source, result.target));
});

test('a retained third response still has to pass syntax admission before publication', async () => {
    const result = await translateWholeDocument({...options, extension: '.mdx',
        adapter: {translateDocument: async () => ({translation: '# ガイド\n\n<Widget label="unterminated\n'})}});
    assert.equal(result.requests, 3);
    assert.equal(result.generation.acceptedWithWarnings, true);
    await assert.rejects(checkSyntax(result.target, '.mdx'));
});

test('transport errors are fed back; three absent documents remain an operational failure', async () => {
    let calls = 0;
    await assert.rejects(translateWholeDocument({...options, adapter: {translateDocument: async ({feedback}) => {
        assert.equal(feedback.length, calls++);
        if (feedback.length) assert.match(feedback.at(-1).issues[0].message, /ETIMEDOUT/);
        throw new Error('ETIMEDOUT');
    }}}), /No usable document after three attempts/);
    assert.equal(calls, 3);
});

test('Latin word matching permits BEFORE and prose number localization; code stays checked', async () => {
    const source = '# Guide\n\nBEFORE operation, use 1,000 rows.\n\n```sql\nSELECT 1;\n```\n';
    const translation = '# ガイド\n\n操作前に1000行を使います。\n\n```sql\nSELECT 1;\n```\n';
    const valid = await inspectDocument({...options, source, translation});
    assert.deepEqual(valid.issues, []);
    const invalid = await inspectDocument({...options, source, translation: translation.replace('SELECT 1;', 'SELECT 2;')});
    assert(invalid.issues.some(item => item.check === 'protected-content'));
    const wrongNumber = await inspectDocument({...options, source, translation: translation.replace('1000行', '2000行')});
    assert(wrongNumber.issues.some(item => item.check === 'protected-content' && /numeric values/.test(item.message)));
});

test('whole-document MDX accepts existing explicit heading IDs', async () => {
    const source = '# Guide {#guide}\n\n<Widget label="Details" mode={1} />\n';
    const result = await translateWholeDocument({...options, source, extension: '.mdx',
        adapter: {translateDocument: async () => ({translation: '# ガイド {#guide}\n\n<Widget label="詳細" mode={1} />\n'})}});
    assert.equal(result.requests, 1);
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('MDX compilation follows Docusaurus and excludes JSON-style front matter', async () => {
    const source = '---\n{ "title": "Guide", "language": "en" }\n---\n\n# Guide\n\nDoris guide.\n';
    const translation = '---\n{ "title": "ガイド", "language": "ja" }\n---\n\n# ガイド\n\nDoris のガイド。\n';
    const result = await translateWholeDocument({...options, source, extension: '.mdx',
        adapter: {translateDocument: async () => ({translation})}});
    assert.equal(result.requests, 1);
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('candidate links use the eventual target directory before that file exists', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-link-preflight-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    fs.mkdirSync(path.join(root, 'static'));
    fs.mkdirSync(path.join(root, 'scripts'));
    fs.copyFileSync(path.resolve(__dirname, '../../check_md_links_single.py'), path.join(root, 'scripts/check_md_links_single.py'));
    const targetPath = 'i18n/ja/docusaurus-plugin-content-docs/current/guide.md';
    fs.mkdirSync(path.dirname(path.join(root, targetPath)), {recursive: true});
    fs.writeFileSync(path.join(root, path.dirname(targetPath), 'more.md'), '# More\n');
    checkLinks({root, targetPath, target: '[詳細](./more.md)\n'});
    assert.throws(() => checkLinks({root, targetPath, target: '[詳細](./absent.md)\n'}), /absent.md/);
    assert(!fs.existsSync(path.join(root, targetPath)));
});

test('the shared translation gate accepts only the exact third-attempt fallback bytes', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-fallback-gate-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
    fs.mkdirSync(path.join(root, 'docs'));
    fs.writeFileSync(path.join(root, 'docs/guide.md'), options.source);
    git('init', '-q'); git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'source');
    const generated = await translateWholeDocument({...options, adapter: {translateDocument: async () => ({
        translation: translated + '\n```sql\nSELECT 42;\n```\n',
    })}});
    const targetPath = 'i18n/ja/docusaurus-plugin-content-docs/current/guide.md';
    fs.mkdirSync(path.dirname(path.join(root, targetPath)), {recursive: true});
    fs.writeFileSync(path.join(root, targetPath), generated.target);
    const page = {pluginId: 'default', version: 'current', docId: 'guide', locale: 'ja', status: 'current',
        sourcePath: 'docs/guide.md', targetPath, sourceHash: hash(options.source), targetHash: hash(generated.target)};
    const record = {...page, sourceCommit: git('rev-parse', 'HEAD'), ownership: 'machine', reviewStatus: 'machine',
        sourceTechnicalHash: (await structure(options.source, '.md')).technicalHash, generation: generated.generation};
    const check = record => checkTranslations({root, locale: 'ja', pages: [page], files: [targetPath],
        records: new Map([[identity(page), record]])});
    const result = await check(record);
    assert.deepEqual(result.errors, []);
    assert.equal(result.warnings.length, 1);
    const staleReview = {...record, generation: {...record.generation, targetHash: hash('different')}};
    assert.equal((await check(staleReview)).errors.length, 1);
    assert.equal((await check({...record, generation: undefined})).errors.length, 1);
});

test('the Codex document schema and prompt carry the full text and validation feedback', async t => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-document-adapter-'));
    t.after(() => fs.rmSync(home, {recursive: true, force: true}));
    fs.writeFileSync(path.join(home, 'auth.json'), '{}');
    const feedback = [{attempt: 1, issues: [{check: 'glossary', message: 'Preserve Doris'}]}];
    const adapter = codexAdapter({language: 'Japanese', locale: 'ja', codexHome: home,
        spawnImpl: (_binary, args, invocation) => {
            const payload = JSON.parse(invocation.input.split('Translation input:\n')[1]);
            assert.equal(payload.document, options.source);
            assert.deepEqual(payload.feedback, feedback);
            const schema = JSON.parse(fs.readFileSync(args[args.indexOf('--output-schema') + 1], 'utf8'));
            assert.deepEqual(schema.required, ['translation']);
            fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], JSON.stringify({translation: translated}));
            return {status: 0, stdout: JSON.stringify({type: 'turn.completed', usage: {total_tokens: 100}})};
        }});
    assert.equal((await adapter.translateDocument({document: options.source, glossary, feedback})).translation, translated);
    assert.equal(adapter.usedTokens, 100);
});
