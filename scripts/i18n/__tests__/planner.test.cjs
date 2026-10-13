const test = require('node:test');
const assert = require('node:assert/strict');
const {hash} = require('../state.cjs');
const {plan, formattingOnly, validateActive, validateResolved} = require('../plan-translations.cjs');

const sha = 'a'.repeat(40);
const baselineSha = 'b'.repeat(40);
const scope = {schemaVersion: 1, locale: 'ja', maxBatchPages: 20, groups: [
    {id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs'},
    {id: '4X', pluginId: 'default', version: '4.x', sourceRoot: 'versioned_docs/version-4.x'},
    {id: 'COMMUNITY', pluginId: 'community', version: 'current', sourceRoot: 'community'},
]};
const source = '# Example\n\nHello.\n';
function page(docId, options = {}) {
    const version = options.version ?? 'current';
    const pluginId = options.pluginId ?? 'default';
    const root = pluginId === 'community' ? 'community' : version === '4.x' ? 'versioned_docs/version-4.x' : 'docs';
    const sourcePath = options.sourcePath ?? `${root}/${docId}.md`;
    return {pluginId, version, docId, sourcePath, targetPath: `i18n/ja/${version}/${docId}.md`,
        permalink: `/ja/${version}/${docId}/`, sourceHash: hash(options.content ?? source),
        targetHash: options.targetHash ?? null, state: options.state ?? 'untranslated',
        reviewStatus: 'unverified', change: options.change ?? 'new'};
}
async function run(pages, {old = [], records = [], removed = [], active, files = {}, historical = {}, reports = [],
    chineseChangedPaths = [], limit = 20, tokenBudget = 50000} = {}) {
    const all = Object.fromEntries(pages.map(item => [item.sourcePath, source]));
    const report = {schemaVersion: 1, sourceCommit: sha, baselineCommit: baselineSha,
        groups: scope.groups.map(group => ({...group, entries: pages.filter(item => item.pluginId === group.pluginId && item.version === group.version),
            unregistered: []})), removed, reports};
    return plan({report, scope, records: new Map(records.map(item => [JSON.stringify([item.pluginId, item.version, item.docId, 'ja']), item])),
        baseline: old, active, chineseChangedPaths, readCurrent: name => files[name] ?? all[name] ?? null,
        readAt: (ref, name) => historical[`${ref}:${name}`] ?? null, limit, tokenBudget});
}

test('stable full scan includes new pages after baseline, isolates versions, and never requeues current pages', async () => {
    const pages = [page('new'), page('new', {version: '4.x'}), page('done', {state: 'current'})];
    const first = await run(pages);
    const second = await run(pages);
    assert.deepEqual(first, second);
    assert.equal(first.counts.required, 3);
    assert.equal(first.counts.mergedCurrent, 1);
    assert.equal(first.tasks.length, 2);
    assert.notEqual(first.tasks[0].id, first.tasks[1].id);
    assert(first.tasks.every(task => task.kind === 'translate_new'));
});

test('modified completed source is an update and valid active PR suppresses selection without adding coverage', async () => {
    const previous = {...page('edited'), locale: 'ja', sourceHash: hash('# Old\n'), sourceCommit: baselineSha,
        targetHash: hash('訳文'), disposition: 'translate'};
    const changed = page('edited', {state: 'stale_technical', change: 'source_changed', targetHash: hash('訳文')});
    const active = {schemaVersion: 1, candidates: [{pluginId: 'default', version: 'current', docId: 'edited',
        locale: 'ja', sourcePath: changed.sourcePath, sourceHash: changed.sourceHash, pr: '#123'}]};
    const result = await run([changed], {old: [previous], active});
    assert.equal(result.tasks[0].kind, 'update');
    assert.equal(result.tasks[0].activePr, '#123');
    assert.equal(result.counts.mergedCurrent, 0);
    assert.deepEqual(result.selected, []);
});

test('stale active PR is reported and a later source revision reenters selection', async () => {
    const changed = page('edited', {state: 'stale_unknown'});
    const active = {schemaVersion: 1, candidates: [{pluginId: 'default', version: 'current', docId: 'edited',
        locale: 'ja', sourcePath: changed.sourcePath, sourceHash: hash('older'), pr: '#123'}]};
    const result = await run([changed], {old: [{...changed, sourceHash: hash('older'), sourceCommit: baselineSha}], active});
    assert.equal(result.exceptions.some(item => item.kind === 'stale_active_candidate'), true);
    assert.equal(result.selected.length, 1);
});

test('an active PR for an old path cannot suppress a moved page with the same source hash', async () => {
    const changed = page('new', {sourcePath: 'docs/new.md'});
    const active = {schemaVersion: 1, candidates: [{pluginId: 'default', version: 'current', docId: 'new',
        locale: 'ja', sourcePath: 'docs/old.md', sourceHash: changed.sourceHash, pr: '#123'}]};
    const result = await run([changed], {active});
    assert.equal(result.tasks[0].activePr, null);
    assert.equal(result.selected.length, 1);
});

test('same identity path move includes cleanup and only reuses a verified target', async () => {
    const old = {...page('old'), locale: 'ja', docId: 'moved', sourceHash: hash(source),
        targetHash: hash('訳文'), disposition: 'translate'};
    const newer = page('moved', {sourcePath: 'docs/new/moved.md', state: 'state_conflict',
        targetHash: hash('訳文'), change: 'moved'});
    const result = await run([newer], {old: [old], files: {[old.targetPath]: '訳文'}});
    assert.equal(result.tasks[0].kind, 'move');
    assert.equal(result.tasks[0].reuseTarget, true);
    assert.equal(result.tasks[0].referenceChecks.oldSourcePath, old.sourcePath);
});

test('unique same-content rename pairs a removed doc and has a reference plan', async () => {
    const before = {...page('old'), locale: 'ja', disposition: 'translate', targetHash: hash('訳文')};
    const after = page('new', {state: 'untranslated'});
    const result = await run([after], {old: [before], files: {[before.targetPath]: '訳文'}});
    assert.equal(result.tasks.length, 1);
    assert.equal(result.tasks[0].kind, 'move');
    assert.equal(result.tasks[0].reuseTarget, true);
    assert.equal(result.tasks[0].referenceChecks.oldSourcePath, before.sourcePath);
});

test('ambiguous same-content rename remains new plus deletions, and deleted records are planned', async () => {
    const before = {...page('old'), locale: 'ja', disposition: 'translate'};
    const result = await run([page('new'), page('new2')], {old: [before]});
    assert.equal(result.tasks.filter(item => item.kind === 'move').length, 0);
    assert.equal(result.tasks.filter(item => item.kind === 'delete').length, 1);
});

test('target edits, source mismatch and unsupported routes require human review', async () => {
    const result = await run([page('edited', {state: 'target_modified'}), page('missing', {state: 'source_missing'}),
        page('route', {state: 'source_route_conflict'})]);
    assert(result.tasks.every(item => item.requiresHumanReview));
    assert.deepEqual(result.selected, []);
});

test('format-only changes are review tasks; SQL, MDX attributes, and front matter changes remain updates', async () => {
    const first = '# Example\n\nHello world.\n';
    assert.equal(await formattingOnly(first, '# Example\n\n\nHello world.\n', 'test.md'), true);
    assert.equal(await formattingOnly('```sql\nSELECT 1;\n```\n', '```sql\nSELECT 2;\n```\n', 'test.md'), false);
    assert.equal(await formattingOnly('<Box size={1}>Hi</Box>\n', '<Box size={2}>Hi</Box>\n', 'test.mdx'), false);
    assert.equal(await formattingOnly('---\ntitle: A\n---\nHi\n', '---\ntitle: B\n---\nHi\n', 'test.md'), false);
});

test('historical formatting only and prose edits receive different work kinds', async () => {
    const current = page('formatted', {state: 'stale_unknown', change: 'source_changed'});
    const before = {...current, sourceHash: hash('# Example\n\n\nHello.\n'), sourceCommit: baselineSha};
    const formatting = await run([current], {old: [before], historical: {[`${baselineSha}:${before.sourcePath}`]: '# Example\n\n\nHello.\n'}});
    assert.equal(formatting.tasks[0].kind, 'formatting_review');
    assert.deepEqual(formatting.selected, []);
    const prose = await run([current], {old: [{...before, sourceHash: hash('# Example\n\nGoodbye.\n')}],
        historical: {[`${baselineSha}:${before.sourcePath}`]: '# Example\n\nGoodbye.\n'}});
    assert.equal(prose.tasks[0].kind, 'update');
});

test('Chinese-only routes are exceptions and never become translation tasks', async () => {
    const result = await run([], {reports: [{kind: 'unsupported_source_route', pluginId: 'default',
        version: 'current', sourceLocale: 'zh-CN', sourcePath: 'i18n/zh-CN/only.md'}]});
    assert.equal(result.tasks.length, 0);
    assert.equal(result.exceptions.length, 1);
});

test('Chinese-only counterpart edits are reported without creating Japanese work', async () => {
    const current = page('shared', {state: 'current'});
    const before = {...current, disposition: 'translate'};
    const chinese = 'i18n/zh-CN/docusaurus-plugin-content-docs/current/shared.md';
    const result = await run([current], {old: [before], chineseChangedPaths: [chinese]});
    assert.equal(result.tasks.length, 0);
    assert.equal(result.exceptions.find(item => item.kind === 'zh_only_change').chinesePath, chinese);
    const changedEnglish = await run([current], {old: [{...before, sourceHash: hash('older')}], chineseChangedPaths: [chinese]});
    assert.equal(changedEnglish.exceptions.some(item => item.kind === 'zh_only_change'), false);
    const translatedAfterEnglishEdit = await run([current], {old: [{...before, sourceHash: hash('older')}],
        records: [{...before, sourceHash: current.sourceHash}], chineseChangedPaths: [chinese]});
    assert.equal(translatedAfterEnglishEdit.exceptions.some(item => item.kind === 'zh_only_change'), false);
});

test('limit, token budget and path filter apply after full counts without renumbering', async () => {
    const a = page('a'), b = page('b');
    const result = await run([a, b], {tokenBudget: 5});
    assert.equal(result.counts.pending, 2);
    assert.equal(result.selected.length, 1);
    const report = {schemaVersion: 1, sourceCommit: sha, baselineCommit: baselineSha,
        groups: scope.groups.map(group => ({...group, entries: [a, b].filter(item => item.pluginId === group.pluginId && item.version === group.version),
            unregistered: []})), reports: []};
    const filtered = await plan({report, scope, records: new Map(), readCurrent: () => source, readAt: () => null,
        filters: {path: 'docs/b'}, limit: 1});
    assert.equal(filtered.tasks.length, 1);
    assert.equal(filtered.counts.pending, 2);
    assert.equal(filtered.tasks[0].id, result.tasks.find(item => item.docId === 'b').id);
});

test('active input rejects duplicate, out-of-scope and malformed candidates', () => {
    const candidate = {pluginId: 'default', version: 'current', docId: 'a', locale: 'ja', sourcePath: 'docs/a.md',
        sourceHash: hash(source), pr: '#1'};
    assert.throws(() => validateActive({schemaVersion: 1, candidates: [candidate, candidate]}, scope), /Duplicate/);
    assert.throws(() => validateActive({schemaVersion: 1, candidates: [{...candidate, version: '3.x'}]}, scope), /outside/);
    assert.throws(() => validateActive({schemaVersion: 1, candidates: [{...candidate, sourceHash: 'bad'}]}, scope), /Invalid/);
});

test('resolved deletion requires review evidence and does not recur', async () => {
    const before = {...page('old'), locale: 'ja', disposition: 'translate'};
    const first = await run([], {old: [before]});
    const deletion = first.tasks[0];
    const resolved = {schemaVersion: 1, deletions: [{id: deletion.id, sourceHash: deletion.sourceHash,
        sourcePath: deletion.sourcePath, reviewedBy: 'reviewer', resolvedAt: '2026-10-13T00:00:00Z', evidence: 'PR #1'}]};
    assert.equal(validateResolved(resolved).length, 1);
    const report = {schemaVersion: 1, sourceCommit: sha, baselineCommit: baselineSha,
        groups: scope.groups.map(group => ({...group, entries: [], unregistered: []})), reports: []};
    const second = await plan({report, scope, records: new Map(), baseline: [before], resolved,
        readCurrent: () => null, readAt: () => null});
    assert.equal(second.tasks.length, 0);
    assert.throws(() => validateResolved({schemaVersion: 1, deletions: [{...resolved.deletions[0], evidence: ''}]}), /Invalid/);
});
