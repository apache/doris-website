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
const {relevantPush} = require('../workflow-scan.cjs');
const {pairFor, machineOwned, generate, allowGeneration} = require('../workflow-generate.cjs');
const {expectedFiles, authorFor} = require('../workflow-publish.cjs');

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

test('one-page validation can bootstrap without enabling ongoing automation', () => {
    const request = {I18N_VALIDATION_RUN: 'true', GITHUB_EVENT_NAME: 'workflow_dispatch',
        I18N_PATH: 'docs/guide.md', I18N_MAX_PAGES: '1'};
    assert.equal(allowGeneration(request), true);
    assert.equal(allowGeneration({...request, I18N_MAX_PAGES: '4'}), false);
    assert.equal(allowGeneration({...request, GITHUB_EVENT_NAME: 'push'}), false);
    assert.equal(allowGeneration({...request, I18N_PATH: ''}), false);
    assert.equal(allowGeneration({I18N_AUTO_TRANSLATE_ENABLED: 'true'}), false);
    assert.equal(allowGeneration({I18N_AUTO_TRANSLATE_ENABLED: 'true', I18N_LIVE_VERIFIED: 'true'}), true);
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

test('one model result creates separate Dev and 4.x targets and state records', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ja-workflow-'));
    const git = (...args) => execFileSync('git', args, {cwd: dir, encoding: 'utf8'}).trim();
    try {
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
        const manifest = await generate({rootDir: dir, target, output: path.join(dir, 'output'),
            ensureFresh: commit => assert.equal(commit, sourceCommit),
            plan: {schemaVersion: 1, locale: 'ja', sourceCommit, selected: [dev.id], tasks: [dev, x4], exceptions: []},
            reconciliation: {botPrs: [], botDetails: [], blockedTargets: []},
            maxPages: 2, adapter, glossary: require('../../../translations/glossary/ja.json')});
        assert.equal(calls, 1);
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
    } finally {fs.rmSync(dir, {recursive: true, force: true});}
});

async function updateFixture(t, {sharded = true, human = false} = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-state-update-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
    const put = (file, text) => {
        fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
        fs.writeFileSync(path.join(root, file), text);
    };
    const previousSource = '# Hello\n\nOld.\n';
    const source = '# Hello\n\nNew.\n';
    const previousTarget = '# こんにちは {#hello}\n\n古い。\n';
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

test('normal generation skips open PRs and blocked targets, then generates ten other pages', async t => {
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
    const manifest = await generate({rootDir: root, target, output: path.join(root, 'output'),
        plan: {schemaVersion: 1, locale: 'ja', sourceCommit, selected: tasks.map(task => task.id), tasks, exceptions: []},
        reconciliation: {botPrs: [21, 22], botDetails: [{number: 21, untouched: false}, {number: 22, untouched: true}],
            active: {candidates: [{...tasks[1], sourceHash: hash('older source'), pr: '#22'}]},
            blockedTargets: [tasks[2].targetPath]}, ensureFresh: () => {},
        adapter, glossary: require('../../../translations/glossary/ja.json')});
    assert.equal(manifest.candidates.length, 10);
    assert.equal(manifest.failures.length, 0);
    assert.equal(calls, 10);
    assert.equal(loadRecords(root, 'ja').size, 10);
    assert.deepEqual(manifest.candidates.map(item => item.id), tasks.slice(3, 13).map(item => item.id));
    for (const task of [tasks[0], tasks[1], tasks[2], tasks[13]]) {
        assert(!fs.existsSync(path.join(root, task.targetPath)));
        assert(!fs.existsSync(path.join(root, stateFileFor(task))));
    }
    assert.equal(manifest.replacesPr, undefined);
});
