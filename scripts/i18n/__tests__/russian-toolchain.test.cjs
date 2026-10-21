const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, identity, loadConfig, loadRecords, stateFileFor} = require('../state.cjs');
const {plan: makePlan, validateActive, validateSourcePaths} = require('../plan-translations.cjs');
const {prepare, applyCandidates, readState, targetFor} = require('../translate-docs.cjs');
const {pairFor, generate} = require('../workflow-generate.cjs');
const {codexAdapter} = require('../codex-adapter.cjs');
const {inspectDocument} = require('../document-checks.cjs');
const {structure} = require('../structure.cjs');
const {reconcileOpenPrs} = require('../workflow-prs.cjs');
const {checkMaster, pageFiles} = require('../master-drift.cjs');
const scope = require('../../../translations/scope/ru.json');
const glossary = require('../../../translations/glossary/ru.json');
const repo = path.resolve(__dirname, '../../..');
const settings = loadConfig(repo).locales.ru;
const source = '---\ntitle: Guide\ndescription: Doris guide\nlanguage: en\nkeywords: [Doris, guide]\nslug: /guide\n---\n'
    + 'import Card from "@site/src/Card";\n\n# Guide\n\n'
    + 'Doris stores tables in a database. A query reads a materialized view during data loading. FE and BE handle SQL and NULL.\n\n'
    + 'Everything is ready. [Next](./next.md)\n\n<Card title="Details" mode={1} />\n\n```sql\nSELECT 1, NULL;\n```\n';
const translation = source.replace('title: Guide', 'title: Руководство').replace('description: Doris guide', 'description: Руководство Doris')
    .replace('language: en', 'language: ru').replace('keywords: [Doris, guide]', 'keywords: [Doris, руководство]')
    .replace('# Guide', '# Руководство').replace('Doris stores tables in a database. A query reads a materialized view during data loading. FE and BE handle SQL and NULL.',
        'Doris хранит таблицы в базе данных. Запрос читает материализованное представление при загрузке данных. FE и BE обрабатывают SQL и NULL.')
    .replace('Everything is ready. [Next]', 'Всё готово. [Далее]').replace('title="Details"', 'title="Подробности"');

function taskFor(docId, {version = 'current', pluginId = 'default', content = source, state = 'untranslated', sourcePath} = {}) {
    const group = scope.groups.find(group => group.pluginId === pluginId && group.version === version);
    sourcePath ??= `${group.sourceRoot}/${docId}.mdx`;
    const suffix = pluginId === 'default' ? '' : `-${pluginId}`;
    return {pluginId, version, docId, locale: 'ru', sourcePath, sourceHash: hash(content), state,
        reviewStatus: 'unverified', targetHash: null,
        targetPath: `i18n/ru/docusaurus-plugin-content-docs${suffix}/${version === 'current' ? 'current' : `version-${version}`}/${sourcePath.slice(group.sourceRoot.length + 1)}`};
}

async function planFor(pages, {baseline = [], active, files = {}, historical = {}, ...options} = {}) {
    return makePlan({scope, report: {schemaVersion: 1, sourceCommit: 'a'.repeat(40), baselineCommit: 'b'.repeat(40), reports: [],
        groups: scope.groups.map(group => ({...group, unregistered: [],
            entries: pages.filter(page => page.pluginId === group.pluginId && page.version === group.version)}))},
    baseline, records: new Map(), active, readCurrent: file => files[file] ?? (pages.some(page => page.sourcePath === file) ? source : null),
    readAt: (ref, file) => historical[`${ref}:${file}`] ?? null, ...options});
}

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ru-toolchain-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const write = (file, text) => {const full = path.join(root, file); fs.mkdirSync(path.dirname(full), {recursive: true}); fs.writeFileSync(full, text);};
    write('.gitignore', '.codex/\noutput/\n');
    write('translations/config.json', fs.readFileSync(path.join(repo, 'translations/config.json')));
    write('translations/scope/ru.json', JSON.stringify(scope));
    write('translations/state/ru/docs.json', '{"schemaVersion":1,"pages":[]}\n');
    write('translations/state/ru/shards.schema.json', '{"schemaVersion":1,"format":"page-record-v1"}\n');
    for (const locale of ['ja', 'ko']) write(`translations/state/${locale}/docs.json`, '{"schemaVersion":1,"pages":[],"sentinel":"unchanged"}\n');
    write('scripts/check_md_links_single.py', fs.readFileSync(path.join(repo, 'scripts/check_md_links_single.py')));
    fs.mkdirSync(path.join(root, 'static'));
    for (const prefix of ['docs', 'versioned_docs/version-4.x']) {
        write(`${prefix}/guide.mdx`, source); write(`${prefix}/next.md`, '# Next\n');
    }
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
    git('init', '-q', '-b', 'master'); git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'source');
    const primary = {...taskFor('guide'), id: 'T06-DEV-000000000000001', kind: 'translate_new'};
    const partner = {...taskFor('guide', {version: '4.x'}), id: 'T06-4X-000000000000002', kind: 'translate_new'};
    const plan = {schemaVersion: 1, locale: 'ru', sourceCommit: git('rev-parse', 'HEAD'), tasks: [primary, partner], selected: [primary.id, partner.id]};
    write('.codex/auth.json', '{}'); // Injected process only; no model or credential access.
    return {root, write, git, plan, primary, partner};
}

function model(data, answer = translation) {
    let calls = 0; const prompts = [];
    const adapter = codexAdapter({language: settings.languageName, locale: 'ru', codexHome: path.join(data.root, '.codex'),
        spawnImpl: (_bin, args, options) => {
            assert(args.includes('read-only') && args.includes('--ignore-user-config'));
            assert(!Object.hasOwn(options.env, 'OPENAI_API_KEY'));
            calls++; prompts.push(options.input);
            fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], JSON.stringify({translation: typeof answer === 'function' ? answer(calls) : answer}));
            return {status: 0, stdout: JSON.stringify({type: 'turn.completed', usage: {input_tokens: 10, output_tokens: 10}}) + '\n'};
        }});
    return {adapter, prompts, get calls() {return calls;}};
}
const prepareOne = (data, state, adapter) => prepare({root: data.root, plan: data.plan, taskId: data.primary.id, scope, state,
    adapter, glossary, target: targetFor(data.root, 'ru')});
const run = (data, adapter, options = {}) => generate({rootDir: data.root, plan: data.plan, target: targetFor(data.root, 'ru'), adapter, glossary,
    reconciliation: {blockedTargets: [], active: {candidates: []}}, ensureFresh: () => {}, output: path.join(data.root, 'output'), ...options});

test('Russian plans keep full counts, deterministic identities, reservations, moves, deletion and formatting review', async () => {
    const pages = [taskFor('new'), taskFor('same'), taskFor('same', {version: '4.x'}), taskFor('same', {pluginId: 'community'}),
        taskFor('done', {state: 'current'}), taskFor('edited', {state: 'stale_technical'}),
        taskFor('moved', {sourcePath: 'docs/new/moved.mdx', state: 'state_conflict'}), taskFor('human', {state: 'target_modified'})];
    const baseline = [{...pages[5], sourceHash: hash('old')}, {...pages[6], sourcePath: 'docs/old/moved.mdx'}, taskFor('gone')];
    const active = {schemaVersion: 1, candidates: [{...pages[0], sourceHash: hash('old candidate'), pr: '#fixture'}]};
    const result = await planFor(pages, {baseline, active});
    assert.deepEqual(result, await planFor(pages, {baseline, active}));
    assert.deepEqual([result.counts.required, result.counts.mergedCurrent, result.counts.pending], [8, 1, 7]);
    for (const [docId, kind] of [['edited', 'update'], ['moved', 'move'], ['gone', 'delete'], ['human', 'target_modified']])
        assert.equal(result.tasks.find(task => task.docId === docId).kind, kind);
    assert(!result.selected.includes(result.tasks.find(task => task.docId === 'new').id));
    assert(result.exceptions.some(item => item.kind === 'stale_active_candidate'));
    assert.equal(new Set(result.tasks.filter(task => task.docId === 'same').map(task => task.id)).size, 3);
    assert(result.tasks.every(task => task.locale === 'ru'));
    const selected = await planFor(pages, {filters: {paths: ['docs/same.mdx']}, limit: 1});
    assert.equal(selected.counts.required, 8); assert.equal(selected.selectedCount, 1);
    assert.equal((await planFor(pages, {tokenBudget: 1})).selectedCount, 0);
    await assert.rejects(planFor(pages, {filters: {path: 'docs/', paths: ['docs/same.mdx']}}), /mutually exclusive/);
    await assert.rejects(planFor(pages, {filters: {paths: ['docs/missing.md']}}), /registered translatable/);
    for (const paths of [[], ['docs/a.md', 'docs/a.md'], ['docs/../a.md'], ['i18n/ru/a.md']])
        assert.throws(() => validateSourcePaths(paths, scope));
    for (const locale of ['ja', 'ko']) assert.throws(() => validateActive({schemaVersion: 1, candidates: [{...pages[0], locale, pr: '#other'}]}, scope), /outside/);
    const formatted = taskFor('formatted', {content: source + '\n', state: 'stale_unknown'});
    const old = {...formatted, sourceHash: hash(source), sourceCommit: 'b'.repeat(40)};
    const formatting = await planFor([formatted], {baseline: [old], files: {[formatted.sourcePath]: source + '\n'},
        historical: {[`${old.sourceCommit}:${old.sourcePath}`]: source}});
    assert.equal(formatting.tasks[0].kind, 'formatting_review'); assert.deepEqual(formatting.selected, []);
    assert.equal(old.sourceHash, hash(source));
});

test('Russian MDX accepts inflected glossary terms and Unicode while protecting metadata and technical bytes', async () => {
    const inspect = target => inspectDocument({source, translation: target, extension: '.mdx', glossary,
        targetLocale: 'ru', targetScriptPattern: settings.scriptPattern});
    assert.deepEqual((await inspect(translation)).issues, []);
    for (const target of [translation.replace('language: ru', 'language: ko'), translation.replace('SELECT 1', 'SELECT 2'),
        translation.replace('mode={1}', 'mode={2}'), translation.replace('FE и BE', 'FE и сервер')])
        assert((await inspect(target)).issues.length > 0);
});

test('Russian Codex feedback retries whole documents and counts copied Dev/4.x targets independently', async t => {
    const data = fixture(t), mock = model(data, attempt => attempt === 1 ? translation.replace('language: ru', 'language: ja')
        : attempt === 2 ? translation.replace('SELECT 1', 'SELECT 2') : translation);
    const manifest = await run(data, mock.adapter, {maxPages: 2});
    assert.equal(mock.calls, 3); assert.equal(mock.adapter.usedTokens, 60);
    assert(mock.prompts.every(prompt => prompt.includes('natural Russian')));
    assert.equal(manifest.candidates.length, 2); assert.equal(manifest.candidates[1].reusedFrom, data.primary.id);
    assert.equal(manifest.candidates[0].generation.history.length, 3);
    assert.equal(manifest.candidates[0].generation.acceptedWithWarnings, false);
    const records = loadRecords(data.root, 'ru'); assert.equal(records.size, 2);
    for (const record of records.values()) {
        assert.equal(record.sourceHash, hash(source)); assert.equal(record.targetHash, hash(fs.readFileSync(path.join(data.root, record.targetPath), 'utf8')));
        assert.equal(record.sourceTechnicalHash, (await structure(source, '.mdx')).technicalHash);
        assert.equal(record.glossaryVersion, glossary.version); assert.equal(record.sourceCommit, data.plan.sourceCommit);
        assert.equal(record.ownership, 'machine'); assert.equal(record.reviewStatus, 'machine');
        assert(fs.existsSync(path.join(data.root, stateFileFor(record))));
    }
    for (const locale of ['ja', 'ko']) assert.equal(fs.readFileSync(path.join(data.root, `translations/state/${locale}/docs.json`), 'utf8'), '{"schemaVersion":1,"pages":[],"sentinel":"unchanged"}\n');
    assert.equal(fs.readFileSync(path.join(data.root, 'translations/state/ru/docs.json'), 'utf8'), '{"schemaVersion":1,"pages":[]}\n');
    for (const change of [{sourceHash: hash('different')}, {docId: 'different'}, {sourcePath: 'versioned_docs/version-4.x/other/guide.mdx'}])
        assert.equal(pairFor(data.primary, [{...data.partner, ...change}], scope), null);
});

test('Russian generation preserves the target limit and retains warnings after exhausted feedback', async t => {
    const data = fixture(t), mock = model(data, translation.replace('SELECT 1', 'SELECT 2'));
    const manifest = await run(data, mock.adapter, {maxPages: 1});
    assert.equal(manifest.candidates.length, 1); assert.equal(mock.calls, 3);
    assert.equal(manifest.candidates[0].generation.acceptedWithWarnings, true);
    assert(manifest.candidates[0].generation.warnings.some(issue => issue.check === 'protected-content'));
    assert(!fs.existsSync(path.join(data.root, data.partner.targetPath)));
});

test('a regular Russian MD/MDX batch stops at ten target pages including cross-version copies', async t => {
    const data = fixture(t), tasks = [];
    const mdSource = source.replace('import Card from "@site/src/Card";\n\n', '').replace('<Card title="Details" mode={1} />\n\n', '');
    const mdTranslation = translation.replace('import Card from "@site/src/Card";\n\n', '').replace('<Card title="Подробности" mode={1} />\n\n', '');
    for (let index = 0; index < 6; index++) for (const version of ['current', '4.x']) {
        const extension = index % 2 ? '.md' : '.mdx';
        const content = index % 2 ? mdSource : source;
        const prefix = version === 'current' ? 'docs' : 'versioned_docs/version-4.x';
        const task = {...taskFor(`batch-${index}`, {version, sourcePath: `${prefix}/batch-${index}${extension}`, content}),
            id: `T06-${version === 'current' ? 'DEV' : '4X'}-${String(index).padStart(15, '0')}`, kind: 'translate_new'};
        data.write(task.sourcePath, content); tasks.push(task);
    }
    data.git('add', '.'); data.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'batch');
    data.plan = {...data.plan, sourceCommit: data.git('rev-parse', 'HEAD'), tasks, selected: tasks.map(task => task.id)};
    const mock = model(data, call => call % 2 ? translation : mdTranslation);
    const manifest = await run(data, mock.adapter);
    assert.equal(mock.calls, 5); assert.equal(manifest.candidates.length, 10); assert.deepEqual(manifest.failures, []);
    assert.equal(manifest.candidates.filter(candidate => candidate.reusedFrom).length, 5);
    assert(manifest.candidates.every(candidate => !candidate.generation.acceptedWithWarnings));
    assert.equal(loadRecords(data.root, 'ru').size, 10);
    for (const task of tasks.slice(10)) assert(!fs.existsSync(path.join(data.root, task.targetPath)));
});

test('Russian preparation and application refuse source races, human targets, target edits and shard races', async t => {
    const data = fixture(t), mock = model(data);
    data.write(data.primary.sourcePath, source + '\nChanged\n');
    await assert.rejects(prepareOne(data, readState(data.root, 'ru'), mock.adapter), /Source changed/);
    data.write(data.primary.sourcePath, source);
    const human = readState(data.root, 'ru'); human.data.pages.push({...data.primary, ownership: 'human'});
    await assert.rejects(prepareOne(data, human, mock.adapter), /Human maintained/);
    assert.equal(mock.calls, 0);
    const state = readState(data.root, 'ru'), candidate = await prepareOne(data, state, mock.adapter);
    data.write(data.primary.targetPath, 'Изменено человеком');
    assert.throws(() => applyCandidates(state, [candidate]), /Target changed/);
    fs.rmSync(path.join(data.root, data.primary.targetPath));
    data.write(stateFileFor(candidate.record), JSON.stringify({schemaVersion: 1, page: {...candidate.record, ownership: 'human'}}));
    assert.throws(() => applyCandidates(state, [candidate]), /State changed/);
    assert(!fs.existsSync(path.join(data.root, data.primary.targetPath)));
});

test('Russian open-PR reconciliation ignores same docIds from other locales and reserves valid Russian bytes', async t => {
    const data = fixture(t), candidate = await prepareOne(data, readState(data.root, 'ru'), model(data).adapter);
    const record = candidate.record, shard = stateFileFor(record);
    const pulls = ['ja', 'ko', 'ru'].map((locale, index) => ({number: index + 1, base: {ref: 'master'}, head: {sha: 'a'.repeat(40)}, locale}));
    const result = await reconcileOpenPrs({scope, language: 'Russian', repository: 'apache/doris-website', pulls,
        filesFor: async pull => [{filename: record.targetPath.replace('/ru/', `/${pull.locale}/`)},
            {filename: shard.replace('/ru/', `/${pull.locale}/`)}],
        readHead: async (_pull, file) => file === shard ? JSON.stringify({schemaVersion: 1, page: record})
            : file === record.targetPath ? candidate.target : '{"schemaVersion":1,"pages":[]}',
        readBase: async (_pull, file) => file === shard ? null : '{"schemaVersion":1,"pages":[]}'});
    assert.deepEqual(result.relevantPrs, [3]); assert.equal(result.active.candidates.length, 1);
    assert.equal(identity(result.active.candidates[0]), identity(record));
    assert.deepEqual(result.blockedTargets, []);
});

test('Russian relevance checks allow unrelated merges, isolate paired changes and reject configuration drift', t => {
    const data = fixture(t);
    const remote = path.join(data.root, 'remote.git');
    execFileSync('git', ['clone', '--bare', '-q', data.root, remote]);
    const pages = new Map([data.primary, data.partner].map(task => [task.id, pageFiles(task, 'ru')]));
    const options = {root: data.root, sourceCommit: data.plan.sourceCommit, locale: 'ru', pages, remote};
    const advance = (file, content) => {
        data.write(file, content); data.git('add', file);
        data.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'advance');
        data.git('push', '-q', remote, 'master');
    };
    advance('blog/unrelated.md', 'Unrelated\n');
    assert.deepEqual(checkMaster(options).affected, []);
    advance(data.partner.sourcePath, source + '\nChanged\n');
    assert.deepEqual(checkMaster(options).affected, [data.partner.id]);
    advance('translations/glossary/ru.json', JSON.stringify({...glossary, version: '2'}));
    assert.throws(() => checkMaster(options), /discard this batch/);
});

test('Russian generation checks relevance before calls, per page and at completion', async t => {
    const data = fixture(t), mock = model(data); let checks = 0;
    const manifest = await run(data, mock.adapter, {ensureFresh: () => (++checks >= 3
        ? {head: 'a'.repeat(40), moved: true, files: [data.partner.sourcePath], affected: [data.partner.id]} : undefined)});
    assert.equal(checks, 3); assert.equal(manifest.candidates.length, 1);
    assert.equal(manifest.candidates[0].id, data.primary.id); assert.equal(manifest.failures[0].id, data.partner.id);
    assert(!fs.existsSync(path.join(data.root, data.partner.targetPath)));
});
