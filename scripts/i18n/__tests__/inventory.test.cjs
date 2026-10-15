const test = require('node:test');
const assert = require('node:assert/strict');
const {validateScope, sidebarOrder, buildGroup} = require('../inventory.cjs');
const group = {id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs'};
const scope = {schemaVersion: 1, locale: 'ja', maxBatchPages: 20, groups: [group], retainEnglish: []};
function page(id, overrides = {}) {
    return {pluginId: 'default', version: 'current', docId: id, locale: 'ja',
        sourceLocale: 'en', sourcePath: `docs/${id}.md`, englishPath: `docs/${id}.md`,
        targetPath: `i18n/ja/docusaurus-plugin-content-docs/current/${id}.md`,
        permalink: `/ja/docs/dev/${id}/`, englishPermalink: `/docs/dev/${id}/`,
        sourceHash: 'a'.repeat(64), targetHash: null, status: 'untranslated', reviewStatus: 'unverified',
        draft: false, unlisted: false, useTarget: false, ...overrides};
}
function build(pages, options = {}) {
    return buildGroup({group, pages, files: pages.filter(p => p.pluginId === 'default' && p.version === 'current').map(p => p.englishPath),
        order: new Map(), scope, committedHash: () => null, committedRecords: new Map(), ...options});
}
test('complete census covers non-sidebar pages, drafts and native exclusions individually', () => {
    const result = build([page('one'), page('hidden', {unlisted: true}), page('draft', {draft: true})],
        {files: ['docs/one.md', 'docs/hidden.md', 'docs/draft.md', 'docs/_ignored.md']});
    assert.equal(result.counts.required, 2);
    assert.equal(result.counts.drafts, 1);
    assert.equal(result.counts.unregistered, 1);
    assert.deepEqual(result.exceptions.map(e => e.kind), ['draft', 'unregistered_file']);
    assert(result.entries.find(p => p.docId === 'hidden').batchId);
});
test('same ID in another version or plugin is excluded from this group', () => {
    const result = build([page('one'), page('one', {version: '4.x'}), page('one', {pluginId: 'community'})]);
    assert.equal(result.entries.length, 1);
});
test('fallbacks, candidates, stale pages and unverified records never count as merged coverage', () => {
    const pages = [page('missing'), page('candidate', {status: 'current', useTarget: true, reviewStatus: 'machine', targetHash: 'b'.repeat(64)}),
        page('stale', {status: 'stale_prose', useTarget: true}), page('unverified', {status: 'current', useTarget: true})];
    const result = build(pages);
    assert.equal(result.counts.mergedCurrent, 0);
    assert.equal(result.counts.pending, 4);
    assert.equal(result.counts.needsUpdate, 3);
});
test('only a current target and matching state present at the merged commit count', () => {
    const p = page('one', {status: 'current', useTarget: true, reviewStatus: 'machine', targetHash: 'b'.repeat(64)});
    const committedRecords = new Map([[JSON.stringify(['default', 'current', 'one', 'ja']), p]]);
    const result = build([p], {committedHash: () => p.targetHash, committedRecords});
    assert.equal(result.counts.mergedCurrent, 1);
    assert.equal(result.batches.length, 0);
    committedRecords.set(JSON.stringify(['default', 'current', 'one', 'ja']), {...p, sourceHash: 'c'.repeat(64)});
    assert.equal(build([p], {committedHash: () => p.targetHash, committedRecords}).counts.mergedCurrent, 0);
});
test('native sidebar priority precedes path ordering, with at most 20 pages per batch', () => {
    const order = sidebarOrder({docs: [{type: 'category', link: {type: 'doc', id: 'p40'},
        items: [{type: 'doc', id: 'p39'}, {type: 'link', docId: 'p38'}]}]});
    const result = build(Array.from({length: 41}, (_, i) => page(`p${String(i).padStart(2, '0')}`)), {order});
    assert.deepEqual(result.batches.map(b => b.pages), [20, 20, 1]);
    assert.deepEqual(result.batches.map(b => b.remainingAfterBatch), [21, 1, 0]);
    assert.deepEqual(result.batches[0].docIds.slice(0, 3), ['p40', 'p39', 'p38']);
    assert.equal(new Set(result.entries.map(p => p.batchId)).size, 3);
});
test('deleted or moved native sources cannot silently pass the filesystem census', () => {
    assert.throws(() => build([page('moved')], {files: ['docs/old.md']}), /absent from census/);
    assert.throws(() => build([], {}), /Missing native plugin/);
});
test('duplicate identities, colliding routes and incorrect source roots fail closed', () => {
    assert.throws(() => build([page('one'), page('one')]), /Duplicate native identity/);
    assert.throws(() => build([page('one'), page('two', {permalink: '/ja/docs/dev/one/'})]), /Duplicate native route/);
    assert.throws(() => build([page('one', {englishPath: 'community/one.md'})]), /Source root mismatch/);
});
test('English exceptions require explicit reasons, valid identities and a native node', () => {
    validateScope(scope, 'ja');
    assert.throws(() => validateScope({...scope, maxBatchPages: 21}, 'ja'), /Batch limit/);
    assert.throws(() => validateScope({...scope, retainEnglish: [{...group, docId: 'one'}]}, 'ja'), /reason/);
    const retain = {...scope, retainEnglish: [{...group, docId: 'one', reason: 'license text'}]};
    const result = build([page('one')], {scope: retain});
    assert.equal(result.counts.retainEnglish, 1);
    assert.equal(result.counts.pending, 0);
    assert.throws(() => build([page('two')], {scope: retain}), /Unused English exception/);
});
