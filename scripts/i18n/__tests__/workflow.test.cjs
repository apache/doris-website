const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, loadConfig, stateFileFor, loadRecords, identity} = require('../state.cjs');
const {structure} = require('../structure.cjs');
const {readState, applyCandidates} = require('../translate-docs.cjs');
const {reconcileOpenPrs} = require('../workflow-prs.cjs');
const {relevantPush, planInputs} = require('../workflow-scan.cjs');
const {pairFor, machineOwned, generate, allowGeneration} = require('../workflow-generate.cjs');
const {expectedFiles, authorFor} = require('../workflow-publish.cjs');
const {masterDrift, checkMaster, batchWide, pageFiles} = require('../master-drift.cjs');

// The language facts come from the real configuration, so the tests describe
// the same automation names the pipeline publishes under.
const repoRoot = path.resolve(__dirname, '../../..');
const jaSettings = loadConfig(repoRoot).locales.ja;
const language = jaSettings.languageName;
const target = {locale: 'ja', language, scriptPattern: jaSettings.scriptPattern};

const scope = {schemaVersion: 1, locale: 'ja', maxBatchPages: 20, groups: [
    {id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs'},
    {id: '4X', pluginId: 'default', version: '4.x', sourceRoot: 'versioned_docs/version-4.x'},
]};
const japanese = '# 日本語\n';
const sourceHash = hash('# Source\n');
const record = {pluginId: 'default', version: 'current', docId: 'guide', locale: 'ja',
    sourcePath: 'docs/guide.md', sourceHash,
    targetPath: 'i18n/ja/docusaurus-plugin-content-docs/current/guide.md', targetHash: hash(japanese)};
const pull = (number, head = `topic-${number}`) => ({number, base: {ref: 'master'},
    head: {ref: head, repo: {full_name: 'apache/doris-website'}}});

test('all open PRs are inspected by files, including unnamed human PRs', async () => {
    const result = await reconcileOpenPrs({scope, language, repository: 'apache/doris-website', pulls: [pull(10), pull(11)],
        filesFor: async item => item.number === 10 ? [{filename: 'docs/other.md'}]
            : [{filename: record.targetPath}],
        readHead: async (item, file) => file.endsWith('docs.json')
            ? JSON.stringify({schemaVersion: 1, pages: [record]}) : japanese});
    assert.deepEqual(result.relevantPrs, [11]);
    assert.equal(result.active.candidates[0].pr, '#11');
    assert.equal(result.blockedTargets.length, 0);
});

test('an open PR can register its target with a page shard instead of docs.json', async () => {
    const shardPath = stateFileFor(record);
    const result = await reconcileOpenPrs({scope, language, repository: 'apache/doris-website', pulls: [pull(13)],
        filesFor: async () => [{filename: record.targetPath}, {filename: shardPath}],
        readHead: async (_item, file) => file === shardPath
            ? JSON.stringify({schemaVersion: 1, page: record})
            : file.endsWith('docs.json') ? JSON.stringify({schemaVersion: 1, pages: []}) : japanese,
        readBase: async (_item, file) => file === shardPath ? null
            : JSON.stringify({schemaVersion: 1, pages: []})});
    assert.deepEqual(result.relevantPrs, [13]);
    assert.equal(result.active.candidates[0].pr, '#13');
    assert.deepEqual(result.blockedTargets, []);
});

test('state changes are compared with the PR merge base, not current master', async () => {
    const previous = {...record, docId: 'previous', sourcePath: 'docs/previous.md',
        targetPath: 'i18n/ja/docusaurus-plugin-content-docs/current/previous.md'};
    let baseReads = 0;
    const result = await reconcileOpenPrs({scope, language, repository: 'apache/doris-website',
        pulls: [pull(13)],
        filesFor: async () => [{filename: record.targetPath}, {filename: 'translations/state/ja/docs.json'}],
        readHead: async (_item, file) => file.includes('/pages/') ? null
            : file.endsWith('docs.json') ? JSON.stringify({schemaVersion: 1, pages: [previous, record]}) : japanese,
        readBase: async (_item, file) => {
            if (file.includes('/pages/')) return null;
            baseReads++;
            return JSON.stringify({schemaVersion: 1, pages: [previous]});
        }});
    assert.equal(baseReads, 1);
    assert.deepEqual(result.relevantPrs, [13]);
    assert.deepEqual(result.active.candidates.map(candidate => candidate.docId), ['guide']);
    assert.deepEqual(result.blockedTargets, []);
    assert.deepEqual(result.exceptions, []);
});

test('removing a legacy record already covered by a shard creates no candidate', async () => {
    const shardPath = stateFileFor(record);
    const shard = JSON.stringify({schemaVersion: 1, page: record});
    const result = await reconcileOpenPrs({scope, language, repository: 'apache/doris-website', pulls: [pull(14)],
        filesFor: async () => [{filename: 'translations/state/ja/docs.json'}],
        readHead: async (_item, file) => file === shardPath ? shard
            : JSON.stringify({schemaVersion: 1, pages: []}),
        readBase: async (_item, file) => file === shardPath ? shard
            : JSON.stringify({schemaVersion: 1, pages: [record]})});
    assert.deepEqual(result.active.candidates, []);
    assert.deepEqual(result.blockedTargets, []);
    assert.deepEqual(result.exceptions, []);
});

test('edited or unparseable PR candidate blocks its target without claiming coverage', async () => {
    const result = await reconcileOpenPrs({scope, language, repository: 'apache/doris-website', pulls: [pull(12)],
        filesFor: async () => [{filename: record.targetPath}],
        readHead: async (_item, file) => file.endsWith('docs.json')
            ? JSON.stringify({schemaVersion: 1, pages: [record]}) : '# 人間が変更\n'});
    assert.deepEqual(result.active.candidates, []);
    assert.deepEqual(result.blockedTargets, [record.targetPath]);
    assert.equal(result.exceptions[0].kind, 'unresolved_open_pr_candidate');
});

test('two open PRs for one source are flagged and robot branch is identified', async () => {
    const result = await reconcileOpenPrs({scope, language, repository: 'apache/doris-website',
        pulls: [pull(20), pull(21, 'i18n/ja-automated-123')],
        filesFor: async () => [{filename: record.targetPath}],
        readHead: async (_item, file) => file.endsWith('docs.json')
            ? JSON.stringify({schemaVersion: 1, pages: [record]}) : japanese});
    assert.deepEqual(result.active.candidates, []);
    assert.deepEqual(result.blockedTargets, [record.targetPath]);
    assert.deepEqual(result.botPrs, [21]);
    assert.equal(result.exceptions[0].kind, 'duplicate_open_pr_candidate');
});

test('only exact current Dev/4.x identity, path and source hash are paired', () => {
    const dev = {pluginId: 'default', version: 'current', docId: 'guide', kind: 'translate_backlog',
        sourcePath: 'docs/guide.md', sourceHash};
    const x4 = {...dev, version: '4.x', sourcePath: 'versioned_docs/version-4.x/guide.md'};
    assert.equal(pairFor(dev, [dev, x4], scope), x4);
    assert.equal(pairFor(dev, [dev, {...x4, sourceHash: hash('different')}], scope), null);
    assert.equal(pairFor(dev, [dev, {...x4, sourcePath: 'versioned_docs/version-4.x/other.md'}], scope), null);
    assert.equal(pairFor(dev, [dev, {...x4, activePr: '#1'}], scope), null);
    assert.equal(pairFor(dev, [dev, {...x4, requiresHumanReview: true}], scope), null);
});

test('human maintained pages are excluded from automatic generation', () => {
    const task = {pluginId: 'default', version: 'current', docId: 'guide', locale: 'ja'};
    assert.equal(machineOwned(task, {data: {pages: []}}), true);
    assert.equal(machineOwned(task, {data: {pages: [{...task, ownership: 'human'}]}}), false);
});

test('one-page validation requires a manual run, exact source path and one-page limit', () => {
    const request = {I18N_MODE: 'validate', GITHUB_EVENT_NAME: 'workflow_dispatch',
        I18N_PATH: 'docs/guide.md', I18N_MAX_PAGES: '1'};
    assert.equal(allowGeneration(request), true);
    assert.equal(allowGeneration({...request, I18N_MAX_PAGES: '4'}), false);
    assert.equal(allowGeneration({...request, GITHUB_EVENT_NAME: 'push'}), false);
    assert.equal(allowGeneration({...request, I18N_PATH: ''}), false);
});

test('generate mode runs manually and on schedule without enablement variables', () => {
    for (const event of ['workflow_dispatch', 'schedule']) {
        assert.equal(allowGeneration({I18N_MODE: 'generate', GITHUB_EVENT_NAME: event}), true);
    }
});

test('dry-run, unknown and missing modes cannot call the generator', () => {
    for (const mode of ['dry-run', 'unknown', undefined]) {
        assert.equal(allowGeneration({I18N_MODE: mode}), false);
    }
});

test('push eligibility follows current native identities and relevant rules', () => {
    const audit = {groups: [{id: 'DEV', pluginId: 'default', version: 'current',
        entries: [{sourcePath: 'docs/guide.md'}]}], removed: []};
    assert.equal(relevantPush(['docs/guide.md'], audit, scope), true);
    assert.equal(relevantPush(['docs/unregistered.md'], audit, scope), false);
    assert.equal(relevantPush(['i18n/zh-CN/docusaurus-plugin-content-docs/current/guide.md'], audit, scope), true);
    assert.equal(relevantPush(['translations/glossary/ja.json'], audit, scope), true);
    assert.equal(relevantPush(['i18n/ja/docusaurus-plugin-content-docs/current/guide.md'], audit, scope), false);
});

test('publication allows only matching managed ja targets and state', () => {
    const candidate = {...record, id: 'T06-DEV-123', kind: 'translate_backlog'};
    assert.deepEqual(expectedFiles({schemaVersion: 1, provider: 'codex', candidates: [candidate]}, scope),
        [record.targetPath, 'translations/state/ja/docs.json']);
    assert.throws(() => expectedFiles({schemaVersion: 1, provider: 'codex',
        candidates: [{...candidate, targetPath: 'docs/guide.md'}]}, scope), /target/);
});

test('personal token writes commits under its authenticated owner', () => {
    assert.deepEqual(authorFor('pat', {login: 'morningman', id: 24620808}, language),
        {name: 'morningman', email: '24620808+morningman@users.noreply.github.com'});
    assert.equal(authorFor('app', {}, language).name, 'doris-japanese-translation[bot]');
    assert.throws(() => authorFor('pat', {login: 'other name', id: 1}, language), /Invalid personal/);
});

// One pending Dev page whose 4.x copy shares its English source.
function pairFixture(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ja-workflow-'));
    t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
    const git = (...args) => execFileSync('git', args, {cwd: dir, encoding: 'utf8'}).trim();
    const source = '# Hello\n\nA simple guide.\n';
    const relative = 'guide.md';
    const devSource = `docs/${relative}`;
    const x4Source = `versioned_docs/version-4.x/${relative}`;
    for (const file of [devSource, x4Source]) {
        fs.mkdirSync(path.dirname(path.join(dir, file)), {recursive: true});
        fs.writeFileSync(path.join(dir, file), source);
    }
    fs.mkdirSync(path.join(dir, 'translations/scope'), {recursive: true});
    fs.mkdirSync(path.join(dir, 'translations/state/ja'), {recursive: true});
    fs.writeFileSync(path.join(dir, 'translations/scope/ja.json'), JSON.stringify(scope));
    fs.writeFileSync(path.join(dir, 'translations/state/ja/docs.json'), '{"schemaVersion":1,"pages":[]}\n');
    git('init', '-q');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.com');
    git('add', '.');
    git('commit', '-qm', 'source');
    const sourceCommit = git('rev-parse', 'HEAD');
    const task = (id, version, sourcePath, targetPath) => ({id, groupId: version === 'current' ? 'DEV' : '4X',
        pluginId: 'default', version, docId: 'guide', locale: 'ja', kind: 'translate_backlog',
        sourcePath, targetPath, sourceHash: hash(source), sourceCommit,
        requiresHumanReview: false, activePr: null});
    const dev = task('T06-DEV-000000000000001', 'current', devSource,
        'i18n/ja/docusaurus-plugin-content-docs/current/guide.md');
    const x4 = task('T06-4X-000000000000002', '4.x', x4Source,
        'i18n/ja/docusaurus-plugin-content-docs/version-4.x/guide.md');
    let calls = 0;
    const adapter = {model: 'fixture', usedTokens: 0, translate: async ({units}) => {
        calls++;
        return {translations: units.map(unit => ({id: unit.id,
            text: unit.text === 'Hello' ? 'こんにちは' : '簡単なガイドです。'}))};
    }};
    const run = ensureFresh => generate({rootDir: dir, target, output: path.join(dir, 'output'), ensureFresh,
        plan: {schemaVersion: 1, locale: 'ja', sourceCommit, selected: [dev.id], tasks: [dev, x4], exceptions: []},
        reconciliation: {botPrs: [], botDetails: [], blockedTargets: []},
        maxPages: 2, adapter, glossary: require('../../../translations/glossary/ja.json')});
    return {dir, source, sourceCommit, dev, x4, run, calls: () => calls};
}

test('one model result creates separate Dev and 4.x targets and state records', async t => {
    const {dir, source, sourceCommit, dev, x4, run, calls} = pairFixture(t);
    const manifest = await run(commit => assert.equal(commit, sourceCommit));
    assert.equal(calls(), 1);
    assert.equal(manifest.candidates.length, 2);
    assert.equal(manifest.provider, 'codex');
    assert.equal(manifest.candidates[1].reusedFrom, dev.id);
    assert.equal(fs.readFileSync(path.join(dir, dev.targetPath), 'utf8'),
        fs.readFileSync(path.join(dir, x4.targetPath), 'utf8'));
    assert.equal(fs.readFileSync(path.join(dir, 'output/candidates', dev.targetPath), 'utf8'),
        fs.readFileSync(path.join(dir, dev.targetPath), 'utf8'));
    const state = JSON.parse(fs.readFileSync(path.join(dir, 'translations/state/ja/docs.json'), 'utf8'));
    assert.deepEqual(state.pages.map(page => page.version), ['4.x', 'current']);
    assert(state.pages.every(page => page.reviewStatus === 'machine' && page.sourceHash === hash(source)));
});

test('a paused language rejects a forced old plan before calling the provider or changing targets', async t => {
    const fixture = pairFixture(t);
    const scopeFile = path.join(fixture.dir, 'translations/scope/ja.json');
    fs.writeFileSync(scopeFile, JSON.stringify({...scope, automaticGroups: []}));
    const stateFile = path.join(fixture.dir, 'translations/state/ja/docs.json');
    const before = fs.readFileSync(stateFile, 'utf8');
    const manifest = await fixture.run(() => {});
    assert.equal(fixture.calls(), 0);
    assert.equal(manifest.candidates.length, 0);
    assert.match(manifest.failures[0].error, /Automatic generation is not enabled/);
    assert.equal(fs.existsSync(path.join(fixture.dir, fixture.dev.targetPath)), false);
    assert.equal(fs.readFileSync(stateFile, 'utf8'), before);
});

test('a page changed on master after its model call is dropped together with its Dev/4.x copy', async t => {
    const {dir, dev, x4, run, calls} = pairFixture(t);
    const seen = [];
    // Before the batch, before the page, then after it: only the last check sees the change.
    const manifest = await run((commit, pages) => {
        seen.push(pages);
        if (seen.length === 3) return {head: 'b'.repeat(40), moved: true, files: [dev.sourcePath],
            batchWide: [], affected: [dev.id]};
    });
    assert.equal(calls(), 1);
    assert.deepEqual([...seen[0].keys()].sort(), [dev.id, x4.id].sort());
    assert.deepEqual(seen[0].get(x4.id), [x4.sourcePath, x4.targetPath,
        x4.targetPath.replace('i18n/ja/','i18n/zh-CN/'),stateFileFor(x4)]);
    assert.deepEqual(manifest.candidates, []);
    assert.deepEqual(manifest.failures.map(item => item.id), [dev.id, x4.id]);
    assert.match(manifest.failures[0].error, /master changed this page/);
    assert.deepEqual(manifest.master, {head: 'b'.repeat(40), moved: true, changedFiles: 1});
    for (const task of [dev, x4]) assert(!fs.existsSync(path.join(dir, task.targetPath)));
    assert(!fs.existsSync(path.join(dir, 'output/pr-body.md')));
});

async function updateFixture(t, {sharded = true, human = false,
    previousSource = '# Hello\n\nOld.\n', source = '# Hello\n\nNew.\n',
    previousTarget = '# こんにちは {#hello}\n\n古い。\n'} = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-state-update-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
    const put = (file, text) => {
        fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
        fs.writeFileSync(path.join(root, file), text);
    };
    put('scripts/check_md_links_single.py', fs.readFileSync(path.resolve(__dirname, '../../check_md_links_single.py'), 'utf8'));
    put('docs/guide.md', previousSource);
    put('translations/scope/ja.json', JSON.stringify(scope));
    git('init', '-q'); git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'old source');
    const previousCommit = git('rev-parse', 'HEAD');
    const oldRecord = {...record, sourceLocale: 'en', sourceCommit: previousCommit,
        sourceHash: hash(previousSource), sourceTechnicalHash: (await structure(previousSource, '.md')).technicalHash,
        targetHash: hash(previousTarget), ownership: human ? 'human' : 'machine', reviewStatus: 'machine',
        translatedAt: '2026-10-15T00:00:00.000Z', glossaryVersion: '1'};
    put(record.targetPath, previousTarget);
    // A stale legacy copy must not take precedence over the page shard.
    const legacy = sharded ? {...oldRecord, ownership: 'human', targetHash: hash('obsolete legacy target')} : oldRecord;
    const legacyPath = 'translations/state/ja/docs.json';
    put(legacyPath, JSON.stringify({schemaVersion: 1, pages: [legacy]}, null, 2) + '\n');
    const shardPath = stateFileFor(oldRecord);
    if (sharded) {
        put('translations/state/ja/shards.schema.json', JSON.stringify({schemaVersion: 1, format: 'page-record-v1'}));
        put(shardPath, JSON.stringify({schemaVersion: 1, page: oldRecord}, null, 2) + '\n');
    }
    put('docs/guide.md', source);
    git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'updated source');
    const sourceCommit = git('rev-parse', 'HEAD');
    const task = {...record, id: 'T06-DEV-000000000000001', locale: 'ja', groupId: 'DEV',
        kind: 'update', sourceCommit, sourceHash: hash(source), targetHash: hash(previousTarget),
        requiresHumanReview: false, activePr: null};
    const plan = {schemaVersion: 1, locale: 'ja', sourceCommit, selected: [task.id], tasks: [task], exceptions: []};
    let calls = 0;
    const adapter = {model: 'fixture', usedTokens: 0, translate: async ({units}) => {
        calls++;
        return {translations: units.map(unit => ({id: unit.id,
            text: ({Hello: 'こんにちは', 'New.': '新しい。'})[unit.text] ?? unit.text}))};
    }};
    const run = extra => generate({rootDir: root, target, output: path.join(root, 'output'),
        ensureFresh: sha => assert.equal(sha, sourceCommit), plan,
        reconciliation: {botPrs: [], botDetails: [], blockedTargets: []}, maxPages: 1,
        adapter, glossary: require('../../../translations/glossary/ja.json'), ...extra});
    return {root, git, put, oldRecord, previousTarget, legacyPath, shardPath, plan, task, adapter, run,
        calls: () => calls};
}

test('workflow updates compare against the recorded translated source across multiple English commits', async t => {
    const previousSource = '# Hello\n\n' + Array.from('ABCDEFGHI', letter => `Paragraph ${letter}.`).join('\n\n') + '\n';
    const previousTarget = '# こんにちは {#hello}\n\n' + Array.from('ABCDEFGHI', letter => `段落 ${letter}。`).join('\n\n') + '\n';
    const firstUpdate = previousSource.replace('Paragraph A.', 'Updated A.');
    const fixture = await updateFixture(t, {previousSource, previousTarget, source: firstUpdate});
    const source = firstUpdate.replace('Paragraph I.', 'Updated I.');
    fixture.put(fixture.task.sourcePath, source);
    fixture.git('add', '.');
    fixture.git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'second English update');
    const sourceCommit = fixture.git('rev-parse', 'HEAD');
    const task = {...fixture.task, sourceCommit, sourceHash: hash(source)};
    let calls = 0;
    const adapter = {model: 'fixture', usedTokens: 100, translateDocument: async () => {
        throw new Error('Unexpected full translation');
    }, translateChanges: async input => {
        calls++;
        assert.equal(input.document, source);
        assert.deepEqual(input.changes.map(item => item.previousText), ['Paragraph A.', 'Paragraph I.']);
        assert.deepEqual(input.changes.map(item => item.text), ['Updated A.', 'Updated I.']);
        return {translations: input.changes.map(item => ({id: item.id, text: item.text.replace('Updated', '更新した')}))};
    }};
    const manifest = await fixture.run({adapter, ensureFresh: () => {},
        plan: {...fixture.plan, sourceCommit, tasks: [task]}});
    assert.deepEqual(manifest.failures, []);
    assert.equal(calls, 1);
    assert.equal(manifest.candidates[0].generation.mode, 'incremental');
    assert.equal(manifest.candidates[0].generation.sourceChange.ratio, 0.2);
    assert.equal(manifest.candidates[0].generation.acceptedWithWarnings, false);
    const target = fs.readFileSync(path.join(fixture.root, task.targetPath), 'utf8');
    assert.equal(target, previousTarget.replace('段落 A。', '更新した A.').replace('段落 I。', '更新した I.'));
    const updated = loadRecords(fixture.root, 'ja').get(identity(task));
    assert.equal(updated.sourceCommit, sourceCommit);
    assert.equal(updated.sourceHash, hash(source));
    assert.equal(updated.targetHash, hash(target));
});

test('existing Dev and 4.x translations are updated independently instead of copying over their wording', async t => {
    const previousSource = '# Hello\n\n' + Array.from('ABCDEFGHI', letter => `Paragraph ${letter}.`).join('\n\n') + '\n';
    const previousTarget = '# こんにちは {#hello}\n\n' + Array.from('ABCDEFGHI', letter => `段落 ${letter}。`).join('\n\n') + '\n';
    const source = previousSource.replace('Paragraph A.', 'Updated A.');
    const fixture = await updateFixture(t, {sharded: false, previousSource, previousTarget, source});
    const sourcePath = 'versioned_docs/version-4.x/guide.md';
    const targetPath = 'i18n/ja/docusaurus-plugin-content-docs/version-4.x/guide.md';
    const otherTarget = previousTarget.replace('段落 B。', '別の訳文 B。');
    fixture.put(sourcePath, previousSource);
    fixture.git('add', '.');
    fixture.git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'old 4.x source');
    const x4Record = {...fixture.oldRecord, version: '4.x', sourcePath, targetPath,
        sourceCommit: fixture.git('rev-parse', 'HEAD'), targetHash: hash(otherTarget)};
    fixture.put(targetPath, otherTarget);
    fixture.put(fixture.legacyPath, JSON.stringify({schemaVersion: 1, pages: [fixture.oldRecord, x4Record]}));
    fixture.put(sourcePath, source);
    fixture.git('add', '.');
    fixture.git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'update 4.x source');
    const sourceCommit = fixture.git('rev-parse', 'HEAD');
    const primary = {...fixture.task, sourceCommit};
    const partner = {...primary, version: '4.x', groupId: '4X', id: 'T06-4X-000000000000002', sourcePath, targetPath};
    let calls = 0;
    const adapter = {model: 'fixture', usedTokens: 100, translateDocument: async () => {
        throw new Error('Unexpected full translation');
    }, translateChanges: async ({changes}) => {
        calls++;
        return {translations: changes.map(item => ({id: item.id, text: '更新した A。'}))};
    }};
    const manifest = await fixture.run({adapter, maxPages: 2, ensureFresh: () => {},
        plan: {...fixture.plan, sourceCommit, selected: [primary.id, partner.id], tasks: [primary, partner]}});
    assert.deepEqual(manifest.failures, []);
    assert.equal(manifest.candidates.length, 2);
    assert.equal(calls, 2);
    assert(manifest.candidates.every(item => !item.reusedFrom && item.generation.mode === 'incremental'));
    assert.equal(fs.readFileSync(path.join(fixture.root, primary.targetPath), 'utf8'),
        previousTarget.replace('段落 A。', '更新した A。'));
    assert.equal(fs.readFileSync(path.join(fixture.root, partner.targetPath), 'utf8'),
        otherTarget.replace('段落 A。', '更新した A。'));
});

test('a paired target reserved by an open PR is not copied even when the supplied plan omits that reservation', async t => {
    const fixture = await updateFixture(t);
    const sourcePath = 'versioned_docs/version-4.x/guide.md';
    fixture.put(sourcePath, fs.readFileSync(path.join(fixture.root, fixture.task.sourcePath), 'utf8'));
    fixture.git('add', '.');
    fixture.git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'paired source');
    const sourceCommit = fixture.git('rev-parse', 'HEAD');
    const primary = {...fixture.task, sourceCommit};
    const partner = {...primary, version: '4.x', groupId: '4X', id: 'T06-4X-000000000000002',
        kind: 'translate_new', sourcePath, targetHash: null,
        targetPath: 'i18n/ja/docusaurus-plugin-content-docs/version-4.x/guide.md'};
    const manifest = await fixture.run({maxPages: 2, ensureFresh: () => {},
        plan: {...fixture.plan, sourceCommit, tasks: [primary, partner]},
        reconciliation: {botPrs: [22], blockedTargets: [],
            active: {candidates: [{...partner, sourceHash: hash('older source'), pr: '#22'}]}}});
    assert.equal(manifest.candidates.length, 1);
    assert.equal(manifest.candidates[0].version, 'current');
    assert.equal(fixture.calls(), 1);
    assert(!fs.existsSync(path.join(fixture.root, partner.targetPath)));
    assert(!fs.existsSync(path.join(fixture.root, stateFileFor(partner))));
});

test('an existing page shard is updated without rewriting or trusting its obsolete legacy copy', async t => {
    const fixture = await updateFixture(t);
    const {root, legacyPath, shardPath, task} = fixture;
    const before = fs.readFileSync(path.join(root, legacyPath), 'utf8');
    const manifest = await fixture.run();
    assert.equal(manifest.candidates.length, 1);
    assert.equal(manifest.failures.length, 0);
    assert.equal(manifest.candidates[0].statePath, shardPath);
    const effective = loadRecords(root, 'ja').get(identity(task));
    assert.equal(effective.sourceHash, task.sourceHash);
    assert.equal(effective.targetHash, hash(fs.readFileSync(path.join(root, task.targetPath), 'utf8')));
    assert.match(fs.readFileSync(path.join(root, task.targetPath), 'utf8'), /新しい。/);
    assert.equal(fs.readFileSync(path.join(root, legacyPath), 'utf8'), before);
    assert.deepEqual(expectedFiles(manifest, scope), [task.targetPath, shardPath].sort());
});

test('a repository without shard support keeps updating its legacy ledger', async t => {
    const fixture = await updateFixture(t, {sharded: false});
    const manifest = await fixture.run();
    assert.equal(manifest.candidates.length, 1);
    assert.equal(manifest.candidates[0].statePath, fixture.legacyPath);
    assert.equal(loadRecords(fixture.root, 'ja').get(identity(fixture.task)).sourceHash, fixture.task.sourceHash);
    assert(!fs.existsSync(path.join(fixture.root, fixture.shardPath)));
});

test('enabling shards migrates only the updated legacy page into its own state file', async t => {
    const fixture = await updateFixture(t, {sharded: false});
    fixture.put('translations/state/ja/shards.schema.json', JSON.stringify({schemaVersion: 1, format: 'page-record-v1'}));
    const before = fs.readFileSync(path.join(fixture.root, fixture.legacyPath), 'utf8');
    const manifest = await fixture.run();
    assert.equal(manifest.candidates.length, 1);
    assert.equal(manifest.candidates[0].statePath, fixture.shardPath);
    assert.equal(loadRecords(fixture.root, 'ja').get(identity(fixture.task)).sourceHash, fixture.task.sourceHash);
    assert.equal(fs.readFileSync(path.join(fixture.root, fixture.legacyPath), 'utf8'), before);
});

test('a human-owned shard is protected even when the legacy ledger says machine-owned', async t => {
    const fixture = await updateFixture(t, {human: true});
    fixture.put(fixture.legacyPath, JSON.stringify({schemaVersion: 1,
        pages: [{...fixture.oldRecord, ownership: 'machine'}]}));
    const manifest = await fixture.run();
    assert.equal(manifest.candidates.length, 0);
    assert.equal(manifest.failures[0].error, 'Human maintained target requires manual review');
    assert.equal(fixture.calls(), 0);
    assert.equal(fs.readFileSync(path.join(fixture.root, record.targetPath), 'utf8'), fixture.previousTarget);
});

test('a shard edited during generation is preserved and the target is not applied', async t => {
    const fixture = await updateFixture(t);
    const translate = fixture.adapter.translate;
    fixture.adapter.translate = async input => {
        fixture.put(fixture.shardPath, JSON.stringify({schemaVersion: 1,
            page: {...fixture.oldRecord, ownership: 'human'}}));
        return translate(input);
    };
    await assert.rejects(fixture.run(), /State changed during generation/);
    assert.equal(loadRecords(fixture.root, 'ja').get(identity(fixture.task)).ownership, 'human');
    assert.equal(fs.readFileSync(path.join(fixture.root, record.targetPath), 'utf8'), fixture.previousTarget);
});

test('a human shard created during a legacy-page update is not overwritten', async t => {
    const fixture = await updateFixture(t, {sharded: false});
    fixture.put('translations/state/ja/shards.schema.json', JSON.stringify({schemaVersion: 1, format: 'page-record-v1'}));
    const translate = fixture.adapter.translate;
    fixture.adapter.translate = async input => {
        fixture.put(fixture.shardPath, JSON.stringify({schemaVersion: 1,
            page: {...fixture.oldRecord, ownership: 'human'}}));
        return translate(input);
    };
    await assert.rejects(fixture.run(), /State changed during generation/);
    assert.equal(loadRecords(fixture.root, 'ja').get(identity(fixture.task)).ownership, 'human');
    assert.equal(fs.readFileSync(path.join(fixture.root, record.targetPath), 'utf8'), fixture.previousTarget);
});

test('a failed shard write rolls back the translated target', async t => {
    const fixture = await updateFixture(t);
    const before = fs.readFileSync(path.join(fixture.root, fixture.shardPath), 'utf8');
    const rename = fs.renameSync;
    fs.renameSync = (from, to) => {
        if (to === path.join(fixture.root, fixture.shardPath)) throw new Error('fixture state write failure');
        return rename(from, to);
    };
    try {await assert.rejects(fixture.run(), /fixture state write failure/);}
    finally {fs.renameSync = rename;}
    assert.equal(fs.readFileSync(path.join(fixture.root, record.targetPath), 'utf8'), fixture.previousTarget);
    assert.equal(fs.readFileSync(path.join(fixture.root, fixture.shardPath), 'utf8'), before);
});

test('a later state write failure restores every earlier target and page shard in the batch', async t => {
    const fixture = await updateFixture(t);
    const other = {...fixture.oldRecord, docId: 'other', sourcePath: 'docs/other.md',
        targetPath: 'i18n/ja/docusaurus-plugin-content-docs/current/other.md'};
    fixture.put(other.targetPath, fixture.previousTarget);
    fixture.put(stateFileFor(other), JSON.stringify({schemaVersion: 1, page: other}));
    const records = [fixture.oldRecord, other];
    const state = readState(fixture.root, 'ja');
    const before = records.map(item => fs.readFileSync(path.join(fixture.root, stateFileFor(item)), 'utf8'));
    const candidates = records.map(item => ({task: item, record: {...item, targetHash: hash('# 新しい。\n')},
        targetFile: path.join(fixture.root, item.targetPath), previousTarget: fixture.previousTarget, target: '# 新しい。\n'}));
    const rename = fs.renameSync;
    fs.renameSync = (from, to) => {
        if (to === path.join(fixture.root, stateFileFor(other))) throw new Error('fixture second state write failure');
        return rename(from, to);
    };
    try {assert.throws(() => applyCandidates(state, candidates), /fixture second state write failure/);}
    finally {fs.renameSync = rename;}
    records.forEach((item, index) => {
        assert.equal(fs.readFileSync(path.join(fixture.root, item.targetPath), 'utf8'), fixture.previousTarget);
        assert.equal(fs.readFileSync(path.join(fixture.root, stateFileFor(item)), 'utf8'), before[index]);
    });
});

test('applying a staged candidate cannot replace a human-owned effective record', async t => {
    const fixture = await updateFixture(t, {human: true});
    assert.throws(() => applyCandidates(readState(fixture.root, 'ja'), [{task: fixture.task,
        targetFile: path.join(fixture.root, record.targetPath), previousTarget: fixture.previousTarget,
        target: '# 新しい。\n', record: {...fixture.oldRecord, ownership: 'machine'}}]), /Human maintained/);
    assert.equal(loadRecords(fixture.root, 'ja').get(identity(fixture.task)).ownership, 'human');
});

test('publication deduplicates shared state and rejects an unrelated page shard', () => {
    const first = {...record, statePath: stateFileFor({...record, locale: 'ja'})};
    assert.deepEqual(expectedFiles({schemaVersion: 1, provider: 'codex', candidates: [first]}, scope),
        [first.targetPath, first.statePath].sort());
    assert.throws(() => expectedFiles({schemaVersion: 1, provider: 'codex',
        candidates: [{...first, statePath: 'translations/state/ja/pages/default/current/other.json'}]}, scope), /state path/);
    const second = {...record, docId: 'other', sourcePath: 'docs/other.md',
        targetPath: 'i18n/ja/docusaurus-plugin-content-docs/current/other.md'};
    assert.deepEqual(expectedFiles({schemaVersion: 1, provider: 'codex', candidates: [record, second]}, scope),
        [record.targetPath, second.targetPath, 'translations/state/ja/docs.json'].sort());
});

// Fourteen pending pages; the first is in an open PR, the second is reserved
// by another PR's candidate and the third is blocked.
function pendingPagesFixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-ten-page-batch-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const put = (file, text) => {
        fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
        fs.writeFileSync(path.join(root, file), text);
    };
    put('translations/scope/ja.json', JSON.stringify(scope));
    put('translations/state/ja/docs.json', JSON.stringify({schemaVersion: 1, pages: []}));
    put('translations/state/ja/shards.schema.json', JSON.stringify({schemaVersion: 1, format: 'page-record-v1'}));
    const tasks = Array.from({length: 14}, (_, index) => {
        const source = `# Guide ${index}\n\nA guide.\n`;
        const sourcePath = `docs/page-${index}.md`;
        put(sourcePath, source);
        return {pluginId: 'default', version: 'current', locale: 'ja', groupId: 'DEV',
            id: `T06-DEV-${String(index + 1).padStart(15, '0')}`, docId: `page-${index}`,
            sourcePath, sourceHash: hash(source), kind: 'translate_new',
            targetPath: `i18n/ja/docusaurus-plugin-content-docs/current/page-${index}.md`,
            requiresHumanReview: false, activePr: null};
    });
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
    git('init', '-q'); git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'eleven pending pages');
    const sourceCommit = git('rev-parse', 'HEAD');
    tasks[0].activePr = '#21';
    let calls = 0;
    const adapter = {model: 'fixture', usedTokens: 0, translate: async ({units}) => {
        calls++;
        return {translations: units.map(unit => ({id: unit.id, text: '訳' + unit.text}))};
    }};
    const run = ensureFresh => generate({rootDir: root, target, output: path.join(root, 'output'),
        plan: {schemaVersion: 1, locale: 'ja', sourceCommit, selected: tasks.map(task => task.id), tasks, exceptions: []},
        reconciliation: {botPrs: [21, 22], botDetails: [{number: 21, untouched: false}, {number: 22, untouched: true}],
            active: {candidates: [{...tasks[1], sourceHash: hash('older source'), pr: '#22'}]},
            blockedTargets: [tasks[2].targetPath]}, ensureFresh,
        adapter, glossary: require('../../../translations/glossary/ja.json')});
    return {root, tasks, run, calls: () => calls};
}

test('normal generation skips open PRs and blocked targets, then generates ten other pages', async t => {
    const {root, tasks, run, calls} = pendingPagesFixture(t);
    const manifest = await run(() => {});
    assert.equal(manifest.candidates.length, 10);
    assert.equal(manifest.failures.length, 0);
    assert.equal(calls(), 10);
    assert.equal(loadRecords(root, 'ja').size, 10);
    assert.deepEqual(manifest.candidates.map(item => item.id), tasks.slice(3, 13).map(item => item.id));
    for (const task of [tasks[0], tasks[1], tasks[2], tasks[13]]) {
        assert(!fs.existsSync(path.join(root, task.targetPath)));
        assert(!fs.existsSync(path.join(root, stateFileFor(task))));
    }
    assert.equal(manifest.replacesPr, undefined);
    assert.equal(manifest.master, undefined);
});

test('a page master changed before its turn is skipped without a model call and the batch continues', async t => {
    const {root, tasks, run, calls} = pendingPagesFixture(t);
    let checks = 0;
    const drift = {head: 'a'.repeat(40), moved: true, files: [tasks[4].sourcePath, 'blog/post.md'],
        batchWide: [], affected: [tasks[4].id]};
    // One check before the batch, one before each page that reaches the model and
    // one after the last; the check before page 4 is the first to see the change.
    const manifest = await run(() => ++checks >= 3 ? drift : undefined);
    assert.equal(calls(), 10);
    assert.equal(checks, 13);
    assert.deepEqual(manifest.candidates.map(item => item.id), [tasks[3], ...tasks.slice(5, 14)].map(item => item.id));
    assert.deepEqual(manifest.failures.map(item => item.id), [tasks[4].id]);
    assert(!fs.existsSync(path.join(root, tasks[4].targetPath)));
    assert.deepEqual(manifest.master, {head: drift.head, moved: true, changedFiles: 2});
    assert.match(fs.readFileSync(path.join(root, 'output/pr-body.md'), 'utf8'),
        new RegExp(`Master moved to \`${drift.head}\` during generation; none of its 2 changed files affect this batch\\.`));
});

test('a batch-wide master change stops generation before any model call', async t => {
    // Seen before the batch, or before the page: not a page failure either way.
    for (const failingCheck of [1, 2]) {
        const fixture = await updateFixture(t);
        let checks = 0;
        await assert.rejects(fixture.run({ensureFresh: () => {
            if (++checks === failingCheck) throw new Error('master changed translations/glossary/ja.json after the source commit');
        }}), /translations\/glossary\/ja\.json/);
        assert.equal(checks, failingCheck);
        assert.equal(fixture.calls(), 0);
        assert(!fs.existsSync(path.join(fixture.root, 'output/generation.json')));
        assert.equal(fs.readFileSync(path.join(fixture.root, record.targetPath), 'utf8'), fixture.previousTarget);
    }
});

test('a batch-wide master change after the last page discards the batch and keeps its manifest', async t => {
    const fixture = await updateFixture(t);
    let checks = 0;
    await assert.rejects(fixture.run({ensureFresh: () => {
        if (++checks === 3) throw new Error('master changed scripts/i18n/translate-docs.cjs after the source commit');
    }}), /scripts\/i18n\/translate-docs\.cjs/);
    assert.equal(fixture.calls(), 1);
    const manifest = JSON.parse(fs.readFileSync(path.join(fixture.root, 'output/generation.json'), 'utf8'));
    assert.match(manifest.discarded, /scripts\/i18n\/translate-docs\.cjs/);
    assert.equal(fs.readFileSync(path.join(fixture.root, record.targetPath), 'utf8'), fixture.previousTarget);
    assert(!fs.existsSync(path.join(fixture.root, 'output/pr-body.md')));
});

// A source commit on a bare "origin" plus a second clone that advances master.
function driftFixture(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-master-drift-'));
    t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
    const remote = path.join(dir, 'remote.git'), root = path.join(dir, 'root'), other = path.join(dir, 'other');
    const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com',
        '-c', 'init.defaultBranch=master', ...args], {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
    const write = (cwd, file, text) => {
        fs.mkdirSync(path.dirname(path.join(cwd, file)), {recursive: true});
        fs.writeFileSync(path.join(cwd, file), text);
    };
    git(dir, 'init', '-q', '--bare', remote);
    git(dir, 'init', '-q', root);
    for (const [file, text] of [['docs/guide.md', '# Source\n'], [record.targetPath, japanese],
        [stateFileFor(record), '{}\n'], ['translations/glossary/ja.json', '{}\n'], ['blog/post.md', '# Post\n']])
        write(root, file, text);
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'source');
    git(root, 'push', '-q', remote, 'HEAD:refs/heads/master');
    const sourceCommit = git(root, 'rev-parse', 'HEAD');
    git(dir, 'clone', '-q', remote, other);
    const advance = (file, text) => {
        if (text === null) git(other, 'rm', '-q', file);
        else write(other, file, text);
        git(other, 'add', '-A');
        git(other, 'commit', '-qm', `change ${file}`);
        git(other, 'push', '-q', 'origin', 'HEAD:master');
    };
    const pages = new Map([['T1', pageFiles(record, 'ja')]]);
    const options = {root, sourceCommit, locale: 'ja', pages, remote};
    return {git, other, remote, advance, options};
}

test('master drift allows unrelated merges and reports a changed or moved batch page', t => {
    const {git, other, advance, options} = driftFixture(t);
    assert.deepEqual(masterDrift(options), {head: options.sourceCommit, moved: false, files: [], batchWide: [], affected: []});
    advance('blog/post.md', '# Post 2\n');
    let drift = checkMaster(options);
    assert.equal(drift.moved, true);
    assert.deepEqual([drift.files, drift.batchWide, drift.affected], [['blog/post.md'], [], []]);
    git(other, 'mv', 'docs/guide.md', 'docs/moved.md');
    advance('docs/moved.md', '# Source\n');
    drift = masterDrift(options);
    // A move reports its old path, so the page that lost its source is affected.
    assert.deepEqual(drift.files, ['blog/post.md', 'docs/guide.md', 'docs/moved.md']);
    assert.deepEqual(drift.affected, ['T1']);
});

test('master drift discards the batch for translation configuration or tooling changes', t => {
    const {advance, options} = driftFixture(t);
    advance('translations/glossary/ja.json', '{"version": "2"}\n');
    assert.deepEqual(masterDrift(options).batchWide, ['translations/glossary/ja.json']);
    assert.throws(() => checkMaster(options), /master changed translations\/glossary\/ja\.json after the source commit/);
    const wide = batchWide('ja');
    for (const file of ['translations/config.json', 'config/i18n.js', 'docusaurus.config.js', 'versions.json',
        'src/constant/version.ts', 'config/versions-plugin.js',
        'sidebars.ts', 'sidebarsCommunity.json', 'sidebarsCourse.ts', 'sidebarsReleases.json',
        'versioned_sidebars/version-5.x-sidebars.json',
        'translations/scope/ja.json', 'translations/protection-exceptions/ja.json', 'translations/state/ja/docs.json',
        'translations/state/ja/shards.schema.json', 'translations/inventory/ja/2026-10-12/summary.json',
        'scripts/i18n/workflow-generate.cjs']) assert(wide(file), file);
    for (const file of [stateFileFor(record), 'translations/glossary/ko.json', 'translations/state/ko/docs.json',
        'i18n/ja/code.json', 'blog/post.md', 'scripts/check_move.js']) assert(!wide(file), file);
});

test('a sidebar registration change invalidates an in-flight translation batch', t => {
    const {advance, options} = driftFixture(t);
    advance('sidebarsCommunity.json', '{"community":[]}\n');
    assert.throws(() => checkMaster(options), /master changed sidebarsCommunity\.json/);
});

test('master drift stops when master no longer contains the source commit', t => {
    const {git, other, options} = driftFixture(t);
    git(other, 'checkout', '-q', '--orphan', 'rewritten');
    git(other, 'commit', '-qm', 'rewritten history');
    git(other, 'push', '-q', '--force', 'origin', 'HEAD:master');
    assert.throws(() => masterDrift(options), /master no longer contains the source commit/);
});

test('a plan is reused only for the same checkout, reservations and filters', () => {
    const head = 'a'.repeat(40), active = '{"schemaVersion":1,"candidates":[],"blockedTargets":[]}\n';
    const base = planInputs(head, active, {});
    assert.equal(base, planInputs(head, active, {I18N_LIMIT: '20', I18N_MODE: 'generate'}));
    for (const changed of [planInputs('b'.repeat(40), active, {}),
        planInputs(head, active.replace('[]}', '["i18n/ja/x.md"]}'), {}),
        planInputs(head, active, {I18N_PATHS: '["docs/guide.md"]'}), planInputs(head, active, {I18N_PLUGIN: 'community'}),
        planInputs(head, active, {I18N_LIMIT: '5'})]) assert.notEqual(changed, base);
});

test('the generation replan reuses an unchanged discovery plan without recounting', t => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-plan-reuse-'));
    t.after(() => fs.rmSync(output, {recursive: true, force: true}));
    const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: repoRoot, encoding: 'utf8'}).trim();
    const active = '{"schemaVersion":1,"candidates":[],"blockedTargets":[]}\n';
    fs.writeFileSync(path.join(output, 'active-candidates.json'), active);
    fs.writeFileSync(path.join(output, 'open-pr-reconciliation.json'), JSON.stringify({schemaVersion: 1,
        blockedTargets: [], botPrs: [], openPrCount: 3, relevantPrs: [], exceptions: []}));
    fs.writeFileSync(path.join(output, 'coverage.json'), '{}\n');
    const env = {...process.env, I18N_LOCALE: 'ko', I18N_MODE: 'generate', GITHUB_EVENT_NAME: 'schedule',
        GITHUB_OUTPUT: path.join(output, 'github-output'), GITHUB_STEP_SUMMARY: path.join(output, 'summary.md')};
    for (const key of ['I18N_PLUGIN', 'I18N_VERSION', 'I18N_PATH', 'I18N_PATHS', 'I18N_LIMIT']) delete env[key];
    // A plan the planner could not have produced proves that nothing recounted it.
    fs.writeFileSync(path.join(output, 'plan.json'), JSON.stringify({schemaVersion: 1, locale: 'ko', sourceCommit: head,
        counts: {required: 1, mergedCurrent: 0, pending: 1, activeCandidates: 0}, selected: ['T-REUSED'],
        tasks: [{id: 'T-REUSED'}], exceptions: [], planInputs: planInputs(head, active, env)}));
    const started = Date.now();
    execFileSync(process.execPath, [path.join(repoRoot, 'scripts/i18n/workflow-scan.cjs'), output], {env});
    assert(Date.now() - started < 30000);
    assert.equal(fs.readFileSync(env.GITHUB_OUTPUT, 'utf8'), `can_generate=true\nsource_commit=${head}\n`);
    assert.match(fs.readFileSync(env.GITHUB_STEP_SUMMARY, 'utf8'), /Plan: reused from discovery/);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'plan.json'), 'utf8')).selected, ['T-REUSED']);
});
