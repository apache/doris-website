const test = require('node:test');
const assert = require('node:assert/strict');
const {sourceChange, planIncremental} = require('../incremental-document.cjs');
const {translateManagedDocument} = require('../translate-document.cjs');
const {isDocumentGeneration} = require('../document-checks.cjs');

const prose = ['Alpha.', 'Bravo.', 'Charlie.', 'Delta.', 'Echo.', 'Foxtrot.', 'Golf.', 'Hotel.', 'India.'];
const japanese = ['アルファ。', 'ブラボー。', 'チャーリー。', 'デルタ。', 'エコー。', 'フォックストロット。', 'ゴルフ。', 'ホテル。', 'インディア。'];
const previousSource = '# Guide\n\n' + prose.join('\n\n') + '\n';
const previousTarget = '# ガイド {#guide}\n\n' + japanese.join('\n\n') + '\n';
const options = {previousSource, previousTarget, extension: '.md',
    glossary: {schemaVersion: 1, version: '1', keep: [], terms: []},
    targetLocale: 'ja', targetScriptPattern: '[ぁ-んァ-ヶ一-龯]'};
const noFullTranslation = async () => {throw new Error('Unexpected full translation');};
const unchanged = async () => {throw new Error('Unexpected model call');};

test('line ratio counts replacements once, additions, deletions, and the exact 30% boundary', () => {
    const atBoundary = previousSource.replace('Alpha.', 'Updated alpha.').replace('Bravo.', 'Updated bravo.')
        .replace('Charlie.', 'Updated charlie.');
    assert.deepEqual(sourceChange(previousSource, atBoundary), {changedLines: 3, totalLines: 10, ratio: 0.3});
    assert.equal(sourceChange(previousSource, atBoundary.replace('Delta.', 'Updated delta.')).ratio, 0.4);
    assert.deepEqual(sourceChange(previousSource, previousSource + '\nNew paragraph.\n'),
        {changedLines: 1, totalLines: 11, ratio: 1 / 11});
    assert.deepEqual(sourceChange(previousSource, previousSource.replace('Alpha.\n\n', '')),
        {changedLines: 1, totalLines: 10, ratio: 0.1});
    assert.equal(sourceChange(previousSource, previousSource.replace(/\n/g, '\n\n')).ratio, 0);
});

test('a small update sends only the changed paragraph and preserves other target bytes', async () => {
    const oldTarget = previousTarget.replace('ブラボー。', '**ブラボー**。  ').replace('ホテル。', 'ホテル。\n\n');
    const result = await translateManagedDocument({...options, previousTarget: oldTarget,
        source: previousSource.replace('Alpha.', 'Updated alpha.'),
        adapter: {translateDocument: noFullTranslation, translateChanges: async input => {
            assert.equal(input.document, previousSource.replace('Alpha.', 'Updated alpha.'));
            assert.equal(input.changes.length, 1);
            assert.equal(input.changes[0].text, 'Updated alpha.');
            assert.equal(input.changes[0].previousText, 'Alpha.');
            assert.equal(input.changes[0].previousTranslation, 'アルファ。');
            return {translations: [{id: input.changes[0].id, text: '更新したアルファ。'}]};
        }}});
    assert.equal(result.target, oldTarget.replace('アルファ。', '更新したアルファ。'));
    assert.equal(result.requests, 1);
    assert.equal(result.generation.mode, 'incremental');
    assert.equal(result.generation.sourceChange.ratio, 0.1);
    assert.equal(result.generation.acceptedWithWarnings, false);
    assert(isDocumentGeneration({ownership: 'machine', reviewStatus: 'machine', generation: result.generation},
        previousSource.replace('Alpha.', 'Updated alpha.'), result.target));
});

test('exactly 30% is incremental; an update above it uses full translation', async () => {
    const source = previousSource.replace('Alpha.', 'Updated alpha.').replace('Bravo.', 'Updated bravo.')
        .replace('Charlie.', 'Updated charlie.');
    const adapter = {translateDocument: noFullTranslation, translateChanges: async ({changes}) => {
        assert.equal(changes.length, 3);
        return {translations: changes.map(item => ({id: item.id, text: '更新。'}))};
    }};
    assert.equal((await translateManagedDocument({...options, source, adapter})).generation.mode, 'incremental');
    let fullCalls = 0;
    const result = await translateManagedDocument({...options, source: source.replace('Delta.', 'Updated delta.'),
        adapter: {translateChanges: unchanged, translateDocument: async () => {
            fullCalls++;
            return {translation: previousTarget};
        }}});
    assert.equal(fullCalls, 1);
    assert.equal(result.generation.mode, 'full');
    assert.equal(result.generation.reason, 'source-change-exceeds-30-percent');
});

test('legacy targets keep their headings unchanged while validation uses render-time English anchors', async () => {
    const target = previousTarget.replace(' {#guide}', '');
    const result = await translateManagedDocument({...options, previousTarget: target,
        source: previousSource.replace('Alpha.', 'Updated alpha.'),
        adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes}) => ({
            translations: [{id: changes[0].id, text: '更新したアルファ。'}],
        })}});
    assert.equal(result.target, target.replace('アルファ。', '更新したアルファ。'));
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('changed links, tables and lists update only their complete containing blocks', async () => {
    const cases = [
        {old: '[Details](./old.md)', next: '[Details](./new.md)', oldJa: '[詳細](./old.md)', nextJa: '[詳細](./new.md)'},
        {old: '- First\n- Second', next: '- First\n- Updated second', oldJa: '- 最初\n- 次', nextJa: '- 最初\n- 更新した次'},
        {old: '| Key | Value |\n| --- | --- |\n| A | Old |', next: '| Key | Value |\n| --- | --- |\n| A | New |',
            oldJa: '| キー | 値 |\n| --- | --- |\n| A | 以前 |', nextJa: '| キー | 値 |\n| --- | --- |\n| A | 更新 |'},
    ];
    for (const item of cases) {
        const old = previousSource + '\n' + item.old + '\n';
        const target = previousTarget + '\n' + item.oldJa + '\n';
        const result = await translateManagedDocument({...options, previousSource: old, previousTarget: target,
            source: old.replace(item.old, item.next),
            adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes}) => {
                assert.equal(changes.length, 1);
                assert.equal(changes[0].text, item.next);
                return {translations: [{id: changes[0].id, text: item.nextJa}]};
            }}});
        assert.equal(result.target, target.replace(item.oldJa, item.nextJa));
        assert.equal(result.generation.acceptedWithWarnings, false);
    }
});

test('insertions and deletions preserve matching paragraphs even when their indices shift', async () => {
    const source = previousSource.replace('Bravo.\n\n', '').replace('Hotel.', 'Added paragraph.\n\nHotel.');
    const result = await translateManagedDocument({...options, source,
        adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes}) => {
            assert.equal(changes.length, 1);
            assert.equal(changes[0].text, 'Added paragraph.');
            return {translations: [{id: changes[0].id, text: '追加した段落。'}]};
        }}});
    assert.equal(result.target, previousTarget.replace('ブラボー。\n\n', '').replace('ホテル。', '追加した段落。\n\nホテル。'));
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('deletion-only and code-only updates need no model call', async () => {
    const adapter = {translateDocument: noFullTranslation, translateChanges: unchanged};
    const deleted = await translateManagedDocument({...options, source: previousSource.replace('Bravo.\n\n', ''), adapter});
    assert.equal(deleted.requests, 0);
    assert.equal(deleted.target, previousTarget.replace('ブラボー。\n\n', ''));
    const source = previousSource + '\n```sql\nSELECT 1;\n```\n';
    const target = previousTarget + '\n```sql\nSELECT 1;\n```\n';
    const code = await translateManagedDocument({...options, previousSource: source, previousTarget: target,
        source: source.replace('SELECT 1;', 'SELECT 2;'), adapter});
    assert.equal(code.requests, 0);
    assert.equal(code.target, target.replace('SELECT 1;', 'SELECT 2;'));
    assert.equal(code.generation.acceptedWithWarnings, false);
});

test('repeated English paragraphs retain their own distinct existing translations', async () => {
    const old = previousSource.replace('Bravo.', 'Alpha.');
    const target = previousTarget.replace('ブラボー。', '別のアルファ。');
    const source = old.replace('Charlie.', 'Updated charlie.');
    const result = await translateManagedDocument({...options, source, previousSource: old, previousTarget: target,
        adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes}) => ({
            translations: [{id: changes[0].id, text: '更新したチャーリー。'}],
        })}});
    assert.equal(result.target, target.replace('チャーリー。', '更新したチャーリー。'));
});

test('front matter updates keep untranslated routing metadata and the existing body', async () => {
    const source = '---\ntitle: Guide\nlanguage: en\nslug: /guide\n---\n\n' + previousSource;
    const target = '---\ntitle: ガイド\nlanguage: ja\nslug: /guide\n---\n\n' + previousTarget;
    const result = await translateManagedDocument({...options, previousSource: source, previousTarget: target,
        source: source.replace('title: Guide', 'title: Updated guide'),
        adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes}) => {
            assert.equal(changes.length, 1);
            return {translations: [{id: changes[0].id,
                text: '---\ntitle: 更新したガイド\nlanguage: ja\nslug: /guide\n---'}]};
        }}});
    assert.equal(result.target, target.replace('title: ガイド', 'title: 更新したガイド'));
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('MDX label updates preserve the unchanged SQL, links and prose', async () => {
    const source = previousSource + '\n<Widget label="Details" mode={1} />\n';
    const target = previousTarget + '\n<Widget label="詳細" mode={1} />\n';
    const result = await translateManagedDocument({...options, extension: '.mdx', previousSource: source,
        previousTarget: target, source: source.replace('Details', 'More details'),
        adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes}) => ({
            translations: [{id: changes[0].id, text: '<Widget label="詳しい情報" mode={1} />'}],
        })}});
    assert.equal(result.target, target.replace('詳細', '詳しい情報'));
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('incremental retries repair changed blocks without rewriting the rest of the document', async () => {
    let calls = 0;
    const old = previousSource.replace('Alpha.', 'Use Doris.');
    const target = previousTarget.replace('アルファ。', 'Doris を使う。');
    const result = await translateManagedDocument({...options, glossary: {...options.glossary, keep: ['Doris']},
        source: old.replace('Use Doris.', 'Always use Doris.'), previousSource: old, previousTarget: target,
        adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes, feedback}) => {
            if (calls++) assert(feedback[0].issues.some(issue => /Doris/.test(issue.message)));
            return {translations: [{id: changes[0].id, text: calls === 1 ? '常に使う。' : '常に Doris を使う。'}]};
        }}});
    assert.equal(calls, 2);
    assert.equal(result.target, target.replace('Doris を使う。', '常に Doris を使う。'));
    assert.equal(result.generation.acceptedWithWarnings, false);
});

test('a model cannot return the whole document in place of a changed block', async () => {
    let calls = 0;
    await assert.rejects(translateManagedDocument({...options, source: previousSource.replace('Alpha.', 'Updated alpha.'),
        adapter: {translateDocument: noFullTranslation, translateChanges: async ({changes}) => {
            calls++;
            return {translations: [{id: changes[0].id, text: previousTarget}]};
        }}}), /preserve its Markdown\/MDX block structure/);
    assert.equal(calls, 3);
});

test('new pages, glossary changes and unaligned baselines record full-translation reasons', async () => {
    const adapter = {translateChanges: unchanged, translateDocument: async () => ({translation: previousTarget})};
    const fresh = await translateManagedDocument({...options, previousSource: null, source: previousSource, adapter});
    assert.equal(fresh.generation.reason, 'no-previous-translation');
    const glossary = await translateManagedDocument({...options, source: previousSource, adapter,
        baselineReason: 'glossary-version-changed'});
    assert.equal(glossary.generation.reason, 'glossary-version-changed');
    const splitTarget = previousTarget.replace('アルファ。', 'アルファ。\n\n追加の段落。');
    const plan = await planIncremental({...options, source: previousSource.replace('Bravo.', 'Updated bravo.'),
        previousTarget: splitTarget});
    assert.equal(plan.mode, 'full');
    assert.equal(plan.reason, 'baseline-blocks-do-not-align');
});
