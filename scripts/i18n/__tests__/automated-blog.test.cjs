const test = require('node:test'),
    assert = require('node:assert/strict'),
    fs = require('node:fs'),
    path = require('node:path'),
    os = require('node:os');
const { execFileSync } = require('node:child_process');
const { hash, identity, loadRecords, stateFileFor } = require('../state.cjs');
const { structure } = require('../structure.cjs');
const { releasePolicy } = require('../release-policy.cjs');
const { group, decision } = require('../automated-blog.cjs');
const { managedPath, translateDocument, checkedTask } = require('../translation-engine.cjs');
const { prepare, applyCandidates, readState } = require('../translate-docs.cjs');
const { plan } = require('../plan-translations.cjs');
const { managedTarget, reconcileOpenPrs } = require('../workflow-prs.cjs');
test('blog automation fixtures select real content validation when changed on their own', () => {
    const { policy } = require('../ci-plan.cjs');
    for (const file of [
        'scripts/i18n/verify-blog-automation-fixture.cjs',
        'scripts/i18n/create-blog-baseline.cjs',
        'scripts/i18n/__tests__/fixtures/blog.cjs',
    ])
        assert(policy([file]).runContentFixture, file);
});
function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'new-blog-policy-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const write = (f, s) => {
        fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
        fs.writeFileSync(path.join(root, f), typeof s === 'string' ? s : JSON.stringify(s));
    };
    const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
    const commit = () => {
        git('add', '.');
        git('commit', '-qm', 'Fixture');
        return git('rev-parse', 'HEAD');
    };
    git('init', '-q');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    write('translations/config.json', {
        schemaVersion: 1,
        locales: { ja: { sourceLocale: 'en', sourceOverrides: [], languageName: 'Japanese', scriptPattern: '[日]' } },
    });
    write('blog/old-6×.md', '---\ntitle: Old source\n---\n\nOld body.\n');
    const cutoff = commit();
    write('translations/blog-baseline.json', {
        schemaVersion: 1,
        sourceCommit: cutoff,
        pluginId: 'blog',
        version: 'current',
        sourceRoot: 'blog',
        locales: ['ja'],
        historicalFallbackLocales: ['zh-CN', 'ja'],
        documents: [
            {
                docId: 'old-6×.md',
                sourcePath: 'blog/old-6×.md',
                sourceHash: hash(fs.readFileSync(path.join(root, 'blog/old-6×.md'), 'utf8')),
            },
        ],
        sourceFiles: ['blog/old-6×.md'],
        historicalPaths: ['blog/old-6×.md'],
    });
    const scope = {
        schemaVersion: 1,
        locale: 'ja',
        maxBatchPages: 20,
        automaticGroups: ['BLOG'],
        groups: [group],
        retainEnglish: [],
    };
    write('translations/scope/ja.json', scope);
    commit();
    const page = file => ({
        pluginId: 'blog',
        version: 'current',
        docId: file,
        locale: 'ja',
        sourceLocale: 'en',
        sourcePath: 'blog/' + file,
        targetPath: 'i18n/ja/docusaurus-plugin-content-blog/' + file,
        sourceHash: hash(fs.readFileSync(path.join(root, 'blog', file), 'utf8')),
    });
    const selected = task => ({
        schemaVersion: 1,
        locale: 'ja',
        sourceCommit: git('rev-parse', 'HEAD'),
        selected: ['future'],
        tasks: [{ ...task, id: 'future', kind: 'translate_new' }],
    });
    return { root, write, git, commit, scope, page, selected };
}
const glossary = { schemaVersion: 1, version: 'fixture', keep: [], terms: [] };
const adapter = {
    model: 'fixture',
    async translate({ units }) {
        return { translations: units.map(u => ({ id: u.id, text: '日本語 ' + u.text })) };
    },
};
test('history stays excluded across edits, Unicode renames, copies and re-adds; new posts and updates stay eligible', t => {
    const f = fixture(t);
    assert.equal(releasePolicy(f.root, group).classify(f.page('old-6×.md')).kind, 'historical_excluded');
    f.git('mv', 'blog/old-6×.md', 'blog/renamed.md');
    f.commit();
    f.write('blog/renamed.md', 'A changed historical source.\n');
    f.commit();
    assert.equal(releasePolicy(f.root, group).classify(f.page('renamed.md')).kind, 'historical_excluded');
    f.write('blog/old-6×.md', 'Restored historical path.\n');
    f.commit();
    assert.equal(releasePolicy(f.root, group).classify(f.page('old-6×.md')).kind, 'historical_excluded');
    f.write('blog/copy.md', fs.readFileSync(path.join(f.root, 'blog/renamed.md'), 'utf8'));
    f.commit();
    assert.equal(releasePolicy(f.root, group).classify(f.page('copy.md')).kind, 'historical_excluded');
    f.write('blog/new.md', '---\ntitle: New source\nsummary: A new summary\n---\n\nNew content.\n');
    f.commit();
    assert.equal(releasePolicy(f.root, group).classify(f.page('new.md')).kind, 'eligible');
    f.write('blog/new.md', 'Updated new content.\n');
    f.commit();
    assert.equal(releasePolicy(f.root, group).classify(f.page('new.md')).kind, 'eligible');
    const old = f.page('old-6×.md');
    assert.throws(() => checkedTask(f.selected(old), 'future', f.scope, f.root), /excluded by source policy/);
});
test('human-owned source updates require review; a human review label alone does not transfer ownership', async t => {
    const f = fixture(t),
        source = '---\ntitle: New post\n---\n\nOriginal prose.\n';
    f.write('blog/new.md', source);
    f.commit();
    const task = f.page('new.md'),
        target = { locale: 'ja', language: 'Japanese', scriptPattern: '[日]' },
        state = readState(f.root, 'ja');
    const candidate = await prepare({
        root: f.root,
        plan: f.selected(task),
        taskId: 'future',
        scope: f.scope,
        state,
        adapter,
        glossary,
        target,
    });
    applyCandidates(state, [candidate]);
    candidate.record.reviewStatus = 'human';
    candidate.record.ownership = 'human';
    f.write(stateFileFor(task), { schemaVersion: 1, page: candidate.record });
    f.commit();
    f.write('blog/new.md', source.replace('Original prose.', 'Updated prose.'));
    const ref = f.commit(),
        current = await decision(f.root, 'ja', 'new.md');
    assert(!current.useTarget);
    const report = {
        schemaVersion: 1,
        sourceCommit: ref,
        baselineCommit: candidate.record.sourceCommit,
        removed: [],
        sidebar: [],
        reports: [],
        groups: [
            { ...group, unregistered: [], entries: [{ ...current, state: current.status, change: 'source_changed' }] },
        ],
    };
    const options = {
        report,
        scope: f.scope,
        records: loadRecords(f.root, 'ja'),
        readCurrent: name => fs.readFileSync(path.join(f.root, name), 'utf8'),
        readAt: (rev, name) => f.git('show', `${rev}:${name}`),
    };
    const human = await plan(options);
    assert.equal(human.selected.length, 0);
    assert(human.tasks.find(t => t.kind === 'update').requiresHumanReview);
    candidate.record.ownership = 'machine';
    f.write(stateFileFor(task), { schemaVersion: 1, page: candidate.record });
    const reviewed = await plan({ ...options, records: loadRecords(f.root, 'ja') });
    assert.equal(reviewed.selected.length, 1);
});
test('a blog human PR reserves its page shard, and an unrecorded target edit blocks replacement', async t => {
    const f = fixture(t);
    f.write('blog/new.md', 'New post.\n');
    f.commit();
    const record = { ...f.page('new.md'), targetHash: hash('日本語\n') },
        shard = stateFileFor(record);
    const options = {
        scope: f.scope,
        language: 'Japanese',
        repository: 'apache/doris-website',
        pulls: [
            {
                number: 9,
                base: { ref: 'master' },
                head: { ref: 'human-correction', repo: { full_name: 'apache/doris-website' } },
            },
        ],
        filesFor: async () => [{ filename: record.targetPath }, { filename: shard }],
        readBase: async (_, name) => (name === shard ? null : JSON.stringify({ schemaVersion: 1, pages: [] })),
    };
    const read = text => async (_, name) =>
        name === shard
            ? JSON.stringify({ schemaVersion: 1, page: record })
            : name.endsWith('docs.json')
              ? JSON.stringify({ schemaVersion: 1, pages: [] })
              : text;
    const reserved = await reconcileOpenPrs({ ...options, readHead: read('日本語\n') });
    assert.equal(reserved.active.candidates.length, 1);
    assert.deepEqual(reserved.blockedTargets, []);
    const edited = await reconcileOpenPrs({ ...options, readHead: read('Human correction\n') });
    assert.equal(edited.active.candidates.length, 0);
    assert.deepEqual(edited.blockedTargets, [record.targetPath]);
});
test('blog summary translation preserves numeric facts and does not weaken document metadata checks', async () => {
    const { protectionSignature } = require('../protection.cjs');
    const a = await structure('---\nsummary: 6 nodes\nslug: /stable\n---\n\nBody.\n', '.md');
    const b = await structure('---\nsummary: 日本語 6 nodes\nslug: /stable\n---\n\nBody.\n', '.md');
    const c = await structure('---\nsummary: 日本語 60 nodes\nslug: /stable\n---\n\nBody.\n', '.md');
    assert.equal(protectionSignature(a, { blog: true }), protectionSignature(b, { blog: true }));
    assert.notEqual(protectionSignature(a, { blog: true }), protectionSignature(c, { blog: true }));
    assert.notEqual(protectionSignature(a), protectionSignature(b));
});
test('a previously generated MDX blog can be updated again with native heading IDs and unchanged imports', async t => {
    const f = fixture(t),
        name = 'new.mdx',
        source =
            '---\ntitle: New post\nsummary: Summary with 6 nodes\n---\n\nimport Card from \'./_parts/Card\';\n\n## Usage\n\nOriginal prose with 6 nodes.\n\n<Card title="Visible label" timeout={10}/>\n';
    f.write('blog/' + name, source);
    f.commit();
    const target = { locale: 'ja', language: 'Japanese', scriptPattern: '[日]' };
    let state = readState(f.root, 'ja'),
        candidate = await prepare({
            root: f.root,
            plan: f.selected(f.page(name)),
            taskId: 'future',
            scope: f.scope,
            state,
            adapter,
            glossary,
            target,
        });
    applyCandidates(state, [candidate]);
    f.commit();
    const first = candidate.target;
    assert(first.includes('{#usage}'));
    f.write('blog/' + name, source.replace('Original prose with 6 nodes.', 'Updated prose with 7 nodes.'));
    f.commit();
    state = readState(f.root, 'ja');
    candidate = await prepare({
        root: f.root,
        plan: f.selected(f.page(name)),
        taskId: 'future',
        scope: f.scope,
        state,
        adapter,
        glossary,
        target,
    });
    assert(candidate.target.includes('Updated prose with 7 nodes.'));
    assert(!candidate.target.includes('Original prose'));
    assert(candidate.target.includes("import Card from './_parts/Card';"));
    assert(candidate.target.includes('timeout={10}'));
    assert(candidate.target.includes('{#usage}'));
    assert.equal(require('gray-matter')(candidate.target).data.title, require('gray-matter')(first).data.title);
    applyCandidates(state, [candidate]);
    assert((await decision(f.root, 'ja', name)).useTarget);
});
test('blog generation uses its real native target and independent state shard, translating summary while retaining facts', async t => {
    const f = fixture(t),
        source =
            '---\ntitle: New article\nsummary: Summary about 6 nodes\nslug: /new-post\nauthors: [fixture]\ntags: [Tech]\n---\n\n## Usage\n\nRead the source.\n\n```sql\nSELECT 1;\n```\n';
    f.write('blog/new.md', source);
    f.commit();
    const task = f.page('new.md');
    assert.equal(managedPath(f.scope, task), task.targetPath);
    assert(managedTarget(f.scope, task.targetPath));
    const state = readState(f.root, 'ja'),
        candidate = await prepare({
            root: f.root,
            plan: f.selected(task),
            taskId: 'future',
            scope: f.scope,
            state,
            adapter,
            glossary,
            target: { locale: 'ja', language: 'Japanese', scriptPattern: '[日]' },
        });
    assert.match(candidate.target, /summary: 日本語 Summary about 6 nodes/);
    assert.match(candidate.target, /SELECT 1;/);
    applyCandidates(state, [candidate]);
    assert(fs.existsSync(path.join(f.root, 'translations/state/ja/pages/blog/current/new.md.json')));
    const current = await decision(f.root, 'ja', 'new.md');
    assert(current.useTarget && current.indexable);
});
test('manual bytes and human ownership prevent both generation and a stale candidate write', async t => {
    const f = fixture(t),
        source = '---\ntitle: New post\n---\n\nContent to translate.\n';
    f.write('blog/new.md', source);
    f.commit();
    const task = f.page('new.md'),
        target = { locale: 'ja', language: 'Japanese', scriptPattern: '[日]' };
    let state = readState(f.root, 'ja');
    let candidate = await prepare({
        root: f.root,
        plan: f.selected(task),
        taskId: 'future',
        scope: f.scope,
        state,
        adapter,
        glossary,
        target,
    });
    applyCandidates(state, [candidate]);
    f.commit();
    fs.appendFileSync(path.join(f.root, task.targetPath), '\nHuman correction.\n');
    assert.equal((await decision(f.root, 'ja', 'new.md')).status, 'target_modified');
    await assert.rejects(
        prepare({
            root: f.root,
            plan: f.selected(task),
            taskId: 'future',
            scope: f.scope,
            state: readState(f.root, 'ja'),
            adapter,
            glossary,
            target,
        }),
        /Existing target or identity changed/,
    );
    const name = 'translations/state/ja/pages/blog/current/new.md.json',
        record = JSON.parse(fs.readFileSync(path.join(f.root, name)));
    record.page.targetHash = hash(fs.readFileSync(path.join(f.root, task.targetPath), 'utf8'));
    record.page.ownership = 'human';
    record.page.reviewStatus = 'human';
    f.write(name, record);
    f.commit();
    assert((await decision(f.root, 'ja', 'new.md')).useTarget);
    await assert.rejects(
        prepare({
            root: f.root,
            plan: f.selected(f.page('new.md')),
            taskId: 'future',
            scope: f.scope,
            state: readState(f.root, 'ja'),
            adapter,
            glossary,
            target,
        }),
        /Human maintained/,
    );
    // A model response prepared earlier must not overwrite a correction applied before write-back.
    record.page.ownership = 'machine';
    f.write(name, record);
    f.commit();
    state = readState(f.root, 'ja');
    candidate = await prepare({
        root: f.root,
        plan: f.selected(f.page('new.md')),
        taskId: 'future',
        scope: f.scope,
        state,
        adapter,
        glossary,
        target,
    });
    fs.appendFileSync(path.join(f.root, task.targetPath), '\nAnother edit.\n');
    assert.throws(() => applyCandidates(state, [candidate]), /Target changed during generation/);
});
