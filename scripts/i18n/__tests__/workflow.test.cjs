const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash} = require('../state.cjs');
const {reconcileOpenPrs} = require('../workflow-prs.cjs');
const {relevantPush, replaceableBotPr} = require('../workflow-scan.cjs');
const {pairFor, machineOwned, generate, allowGeneration} = require('../workflow-generate.cjs');
const {expectedFiles} = require('../workflow-publish.cjs');

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
    const result = await reconcileOpenPrs({scope, repository: 'apache/doris-website', pulls: [pull(10), pull(11)],
        filesFor: async item => item.number === 10 ? [{filename: 'docs/other.md'}]
            : [{filename: record.targetPath}],
        readHead: async (item, file) => file.endsWith('docs.json')
            ? JSON.stringify({schemaVersion: 1, pages: [record]}) : japanese});
    assert.deepEqual(result.relevantPrs, [11]);
    assert.equal(result.active.candidates[0].pr, '#11');
    assert.equal(result.blockedTargets.length, 0);
});

test('edited or unparseable PR candidate blocks its target without claiming coverage', async () => {
    const result = await reconcileOpenPrs({scope, repository: 'apache/doris-website', pulls: [pull(12)],
        filesFor: async () => [{filename: record.targetPath}],
        readHead: async (_item, file) => file.endsWith('docs.json')
            ? JSON.stringify({schemaVersion: 1, pages: [record]}) : '# 人間が変更\n'});
    assert.deepEqual(result.active.candidates, []);
    assert.deepEqual(result.blockedTargets, [record.targetPath]);
    assert.equal(result.exceptions[0].kind, 'unresolved_open_pr_candidate');
});

test('two open PRs for one source are flagged and robot branch is identified', async () => {
    const result = await reconcileOpenPrs({scope, repository: 'apache/doris-website',
        pulls: [pull(20), pull(21, 'i18n/ja-automated-123')],
        filesFor: async () => [{filename: record.targetPath}],
        readHead: async (_item, file) => file.endsWith('docs.json')
            ? JSON.stringify({schemaVersion: 1, pages: [record]}) : japanese});
    assert.deepEqual(result.active.candidates, []);
    assert.deepEqual(result.blockedTargets, [record.targetPath]);
    assert.deepEqual(result.botPrs, [21]);
    assert.equal(result.exceptions[0].kind, 'duplicate_open_pr_candidate');
});

test('an untouched stale robot PR may be replaced, but a human edit blocks replacement', () => {
    const sha = 'a'.repeat(40);
    const plan = {exceptions: [{kind: 'stale_active_candidate', pr: '#21'}]};
    const bot = {number: 21, headSha: sha, expectedHead: sha, untouched: true};
    assert.equal(replaceableBotPr(plan, {botDetails: [bot]}), bot);
    assert.equal(replaceableBotPr(plan, {botDetails: [{...bot, untouched: false}]}), null);
    assert.equal(replaceableBotPr({exceptions: []}, {botDetails: [bot]}), null);
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
        I18N_PATH: 'docs/guide.md', I18N_MAX_PAGES: '1', I18N_TOKEN_BUDGET: '30000'};
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
        const manifest = await generate({rootDir: dir, output: path.join(dir, 'output'),
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
