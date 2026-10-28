const test = require('node:test'),
    assert = require('node:assert/strict'),
    fs = require('node:fs'),
    path = require('node:path'),
    os = require('node:os');
const { execFileSync } = require('node:child_process');
const { hash, identity, loadRecords, loadRecordsAt, decide } = require('../state.cjs');
const policy = require('../source-revisions.cjs'),
    { structure } = require('../structure.cjs');
const { plan } = require('../plan-translations.cjs'),
    { checkTranslations } = require('../check-translations.cjs');
const { prepare, applyCandidates, readState } = require('../translate-docs.cjs');
const { pairFor } = require('../workflow-generate.cjs');
const locales = ['ja', 'ko', 'ru'],
    words = { ja: '手動の修正', ko: '직접 수정', ru: 'Ручная правка' };
const source = '---\ntitle: Guide\nslug: /guide\n---\n\nOriginal source.\n\n```sql\nSELECT 1;\n```\n';
const glossary = { schemaVersion: 1, version: 'fixture', keep: [], terms: [] };
test('source-revision runtime and its standalone fixture retain real CI coverage', () => {
    const { policy } = require('../ci-plan.cjs');
    assert(policy(['scripts/i18n/source-revisions.cjs']).runContentFixture);
    assert(policy(['scripts/i18n/verify-source-revisions-fixture.cjs']).runContentFixture);
});
async function fixture(t, { owner = 'machine' } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'source-revisions-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const write = (file, text) => {
        const full = path.join(root, file);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, typeof text === 'string' ? text : JSON.stringify(text));
    };
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' }).trim();
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
        maintenancePolicy: 'source-revisions-v1',
        locales: Object.fromEntries(
            locales.map(locale => [
                locale,
                {
                    sourceLocale: 'en',
                    sourceOverrides: [],
                    languageName: { ja: 'Japanese', ko: 'Korean', ru: 'Russian' }[locale],
                    scriptPattern: '.',
                },
            ]),
        ),
    });
    const group = { id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs' };
    const scope = locale => ({
        schemaVersion: 1,
        locale,
        maxBatchPages: 20,
        automaticGroups: ['DEV'],
        groups: [group],
        retainEnglish: [],
        retainSidebarLabels: [],
    });
    write('docs/guide.md', source);
    write(
        'i18n/zh-CN/docusaurus-plugin-content-docs/current/guide.md',
        source.replace('Original source.', '中文原文。'),
    );
    for (const locale of locales) write(`translations/scope/${locale}.json`, scope(locale));
    const anchor = commit();
    const page = locale => ({
        pluginId: 'default',
        version: 'current',
        docId: 'guide',
        locale,
        sourceLocale: 'en',
        englishPath: 'docs/guide.md',
        sourcePath: 'docs/guide.md',
        targetPath: `i18n/${locale}/docusaurus-plugin-content-docs/current/guide.md`,
    });
    for (const locale of locales) {
        const p = page(locale),
            target = source.replace('Original source.', words[locale] + ' initial.');
        write(p.targetPath, target);
        write(`translations/state/${locale}/docs.json`, {
            schemaVersion: 1,
            pages: [
                {
                    ...p,
                    sourceCommit: anchor,
                    sourceHash: hash(source),
                    targetHash: hash(target),
                    sourceTechnicalHash: (await structure(source, '.md')).technicalHash,
                    ownership: owner,
                    reviewStatus: 'machine',
                    translatedAt: '2026-10-28T00:00:00Z',
                    glossaryVersion: 'fixture',
                },
            ],
        });
    }
    const initial = commit();
    const read = file => {
        try {
            return fs.readFileSync(path.join(root, file), 'utf8');
        } catch (e) {
            if (e.code === 'ENOENT') return null;
            throw e;
        }
    };
    async function current(locale) {
        const p = page(locale),
            record = loadRecords(root, locale).get(identity(p));
        return decide({
            page: p,
            source: read(p.sourcePath),
            target: read(p.targetPath),
            record,
            technicalHash: (await structure(read(p.sourcePath), '.md')).technicalHash,
        });
    }
    async function planned(locale) {
        const p = await current(locale),
            report = {
                schemaVersion: 1,
                maintenancePolicy: 'source-revisions-v1',
                sourceCommit: git('rev-parse', 'HEAD'),
                baselineCommit: anchor,
                removed: [],
                sidebar: [],
                reports: [],
                groups: [
                    { ...group, unregistered: [], entries: [{ ...p, state: p.status, change: 'source_changed' }] },
                ],
            };
        return plan({
            report,
            scope: scope(locale),
            records: loadRecords(root, locale),
            readCurrent: read,
            readAt: (ref, file) => execFileSync('git', ['show', `${ref}:${file}`], { cwd: root, encoding: 'utf8' }),
        });
    }
    return { root, write, git, commit, page, scope, read, current, planned, initial };
}
test('JA/KO/RU body-only PRs publish immediately without any ledger change or model task', async t => {
    const f = await fixture(t),
        before = Object.fromEntries(locales.map(l => [l, f.read(`translations/state/${l}/docs.json`)]));
    for (const l of locales)
        f.write(f.page(l).targetPath, f.read(f.page(l).targetPath).replace('initial.', 'corrected.'));
    const manual = f.commit();
    assert(
        f
            .git('show', '--format=', '--name-only', manual)
            .split('\n')
            .every(p => p.startsWith('i18n/')),
    );
    for (const locale of locales) {
        const p = await f.current(locale);
        assert.equal(p.status, 'current');
        assert(p.useTarget && p.indexable);
        assert.equal(p.reviewStatus, 'manual');
        assert.equal(f.read(`translations/state/${locale}/docs.json`), before[locale]);
        const records = loadRecords(f.root, locale),
            r = records.get(identity(f.page(locale)));
        assert.equal(r.sourceCommit, manual);
        const admission = await checkTranslations({
            root: f.root,
            locale,
            pages: [p],
            files: [p.targetPath],
            records,
            previousRecords: loadRecordsAt(f.root, locale, f.initial),
        });
        assert.deepEqual(admission.errors, []);
        const plan = await f.planned(locale);
        assert.equal(plan.selected.length, 0);
        const committed = loadRecordsAt(f.root, locale, manual).get(identity(f.page(locale)));
        assert.equal(committed.targetHash, hash(f.read(p.targetPath)));
        let calls = 0;
        await assert.rejects(
            prepare({
                root: f.root,
                scope: f.scope(locale),
                state: readState(f.root, locale),
                plan: {
                    schemaVersion: 1,
                    locale,
                    sourceCommit: manual,
                    selected: ['forced'],
                    tasks: [
                        { ...f.page(locale), id: 'forced', kind: 'update', sourceHash: hash(f.read('docs/guide.md')) },
                    ],
                },
                taskId: 'forced',
                target: { locale, language: locale, scriptPattern: '.' },
                glossary,
                adapter: {
                    model: 'fixture',
                    async translate() {
                        calls++;
                    },
                },
            }),
            /sources are unchanged/,
        );
        assert.equal(calls, 0);
    }
    f.write('docs/unrelated.md', 'Unrelated source.');
    f.write('i18n/zh-CN/docusaurus-plugin-content-docs/current/unrelated.md', '其他内容。');
    f.commit();
    for (const l of locales) assert.equal((await f.planned(l)).selected.length, 0);
});
test('English and Chinese changes each permit regeneration, including formerly human-owned targets', async t => {
    const f = await fixture(t, { owner: 'human' }),
        locale = 'ja';
    f.write(f.page(locale).targetPath, f.read(f.page(locale).targetPath).replace('initial.', 'corrected.'));
    f.commit();
    const target = { locale, language: 'Japanese', scriptPattern: '.' };
    let calls = 0,
        references = [];
    const adapter = {
        model: 'fixture',
        async translate(input) {
            calls++;
            references.push(input.referenceSources);
            return { translations: input.units.map(u => ({ id: u.id, text: '翻訳 ' + u.text })) };
        },
    };
    for (const side of ['en', 'zh-CN']) {
        if (side === 'en') f.write('docs/guide.md', source.replace('Original source.', 'Updated source.'));
        else
            f.write(
                'i18n/zh-CN/docusaurus-plugin-content-docs/current/guide.md',
                source.replace('Original source.', '更新后的中文原文。'),
            );
        f.commit();
        const p = await f.planned(locale);
        assert.equal(p.selected.length, 1);
        const task = p.tasks.find(x => x.id === p.selected[0]);
        assert.equal(task.kind, 'update');
        assert.equal(task.requiresHumanReview, false);
        const state = readState(f.root, locale),
            oldCalls = calls,
            candidate = await prepare({
                root: f.root,
                plan: p,
                taskId: task.id,
                scope: f.scope(locale),
                state,
                adapter,
                glossary,
                target,
            });
        assert(calls > oldCalls);
        assert(references.at(-1).some(r => r.locale === 'zh-CN'));
        if (side === 'zh-CN') assert(references.at(-1)[0].content.includes('更新后的中文原文'));
        applyCandidates(state, [candidate]);
        f.commit();
        assert.equal((await f.current(locale)).status, 'current');
        assert.equal((await f.planned(locale)).selected.length, 0);
    }
});
test('a manual correction acknowledges the source revision present in its own commit', async t => {
    const f = await fixture(t),
        locale = 'ko';
    f.write('docs/guide.md', source.replace('SELECT 1;', 'SELECT 2;'));
    f.commit();
    f.write(
        f.page(locale).targetPath,
        f.read(f.page(locale).targetPath).replace('SELECT 1;', 'SELECT 2;').replace('initial.', 'corrected.'),
    );
    const manual = f.commit();
    const p = await f.current(locale);
    assert.equal(p.status, 'current');
    const records = loadRecords(f.root, locale);
    assert.equal(records.get(identity(f.page(locale))).sourceCommit, manual);
    assert.deepEqual(
        (await checkTranslations({ root: f.root, locale, pages: [p], files: [p.targetPath], records })).errors,
        [],
    );
    assert.equal((await f.planned(locale)).selected.length, 0);
    f.write('docs/guide.md', f.read('docs/guide.md').replace('SELECT 2;', 'SELECT 3;'));
    f.commit();
    assert.equal((await f.planned(locale)).selected.length, 1);
});
test('source or target edits during a model call cannot be overwritten', async t => {
    for (const edited of ['source', 'target']) {
        const f = await fixture(t),
            locale = 'ru';
        f.write('docs/guide.md', source.replace('Original source.', 'Updated source.'));
        f.commit();
        const p = await f.planned(locale),
            task = p.tasks.find(x => x.id === p.selected[0]),
            state = readState(f.root, locale),
            before = f.read(`translations/state/${locale}/docs.json`);
        const candidate = await prepare({
            root: f.root,
            plan: p,
            taskId: task.id,
            scope: f.scope(locale),
            state,
            glossary,
            target: { locale, language: 'Russian', scriptPattern: '.' },
            adapter: {
                model: 'fixture',
                async translate({ units }) {
                    const file =
                        edited === 'source'
                            ? 'i18n/zh-CN/docusaurus-plugin-content-docs/current/guide.md'
                            : task.targetPath;
                    f.write(file, f.read(file) + '\nConcurrent edit.\n');
                    return { translations: units.map(u => ({ id: u.id, text: 'Перевод ' + u.text })) };
                },
            },
        });
        assert.throws(() => applyCandidates(state, [candidate]), /changed during generation/);
        assert.equal(f.read(`translations/state/${locale}/docs.json`), before);
    }
});
test('Dev/4.x reuse requires identical Chinese reference content as well as English', () => {
    const a = {
        id: 'a',
        pluginId: 'default',
        version: 'current',
        docId: 'guide',
        sourcePath: 'docs/guide.md',
        sourceHash: 'a'.repeat(64),
        kind: 'translate_new',
        chineseSourceBlob: 'b'.repeat(40),
    };
    const b = {
        ...a,
        id: 'b',
        version: '4.x',
        sourcePath: 'versioned_docs/version-4.x/guide.md',
        chineseSourceBlob: 'c'.repeat(40),
    };
    const scope = {
        groups: [
            { pluginId: 'default', version: 'current', sourceRoot: 'docs' },
            { pluginId: 'default', version: '4.x', sourceRoot: 'versioned_docs/version-4.x' },
        ],
    };
    assert.equal(pairFor(a, [a, b], scope), null);
    assert.equal(pairFor(a, [a, { ...b, chineseSourceBlob: a.chineseSourceBlob }], scope).id, 'b');
});

test('a registered manual translation needs no pre-existing state; source changes later remain automatic', async t => {
    const f = await fixture(t),
        locale = 'ja';
    f.write(`translations/state/${locale}/docs.json`, { schemaVersion: 1, pages: [] });
    f.write(
        f.page(locale).targetPath,
        f.read(f.page(locale).targetPath).replace('initial.', 'created without a ledger.'),
    );
    f.commit();
    const record = policy.resolveRecord(
        f.root,
        f.page(locale),
        undefined,
        (await structure(source, '.md')).technicalHash,
    );
    const p = decide({
        page: f.page(locale),
        source: f.read('docs/guide.md'),
        target: f.read(f.page(locale).targetPath),
        record,
    });
    assert.equal(p.status, 'current');
    assert(p.indexable);
    assert.deepEqual(
        (await checkTranslations({ root: f.root, locale, pages: [p], files: [p.targetPath], records: new Map() }))
            .errors,
        [],
    );
    f.write('docs/guide.md', source.replace('Original source.', 'Changed source.'));
    const head = f.commit();
    const task = { ...f.page(locale), id: 'manual', kind: 'update', sourceHash: hash(f.read('docs/guide.md')) };
    const state = readState(f.root, locale);
    const candidate = await prepare({
        root: f.root,
        scope: f.scope(locale),
        state,
        plan: { schemaVersion: 1, locale, sourceCommit: head, selected: ['manual'], tasks: [task] },
        taskId: 'manual',
        glossary,
        target: { locale, language: 'Japanese', scriptPattern: '.' },
        adapter: {
            model: 'fixture',
            async translate({ units }) {
                return { translations: units.map(u => ({ id: u.id, text: '翻訳 ' + u.text })) };
            },
        },
    });
    applyCandidates(state, [candidate]);
    assert.equal(loadRecords(f.root, locale).size, 1);
});

test('body-only admission still rejects changed SQL or numerical facts', async t => {
    const f = await fixture(t),
        locale = 'ru';
    f.write(f.page(locale).targetPath, f.read(f.page(locale).targetPath).replace('SELECT 1;', 'SELECT 9;'));
    f.commit();
    const p = await f.current(locale),
        result = await checkTranslations({
            root: f.root,
            locale,
            pages: [p],
            files: [p.targetPath],
            records: loadRecords(f.root, locale),
        });
    assert(result.errors.some(e => e.message.includes('Protected')));
});

test('implicit target adoption rejects symbolic links, including a linked parent directory', async t => {
    for (const parent of [false, true]) {
        const f = await fixture(t),
            locale = 'ja',
            p = f.page(locale),
            full = path.join(f.root, p.targetPath);
        if (parent) {
            const original = path.dirname(full),
                moved = path.join(f.root, 'linked-bodies');
            fs.renameSync(original, moved);
            fs.symlinkSync(moved, original, 'dir');
        } else {
            const outside = path.join(f.root, 'private-body.md');
            f.write('private-body.md', 'Private text.');
            fs.unlinkSync(full);
            fs.symlinkSync(outside, full);
        }
        f.commit();
        const state = await f.current(locale);
        assert.equal(state.status, 'state_conflict');
        assert.equal(state.useTarget, false);
    }
});

test('unchanged CRLF Git inputs and LF-to-CRLF checkout conversions do not cause regeneration', async t => {
    for (const committed of [false, true]) {
        const f = await fixture(t),
            locale = 'ja';
        for (const file of ['docs/guide.md', 'i18n/zh-CN/docusaurus-plugin-content-docs/current/guide.md'])
            f.write(file, f.read(file).replace(/\n/g, '\r\n'));
        if (committed) {
            const anchor = f.commit();
            for (const l of locales) {
                const file = `translations/state/${l}/docs.json`,
                    state = JSON.parse(f.read(file));
                state.pages[0].sourceCommit = anchor;
                f.write(file, state);
            }
            f.commit();
        }
        assert.equal((await f.current(locale)).status, 'current');
        assert.equal((await f.planned(locale)).selected.length, 0);
    }
});

test('a source refresh with identical translated bytes can publish its updated automation snapshot', async t => {
    const f = await fixture(t),
        locale = 'ja',
        p = f.page(locale),
        target = f.read(p.targetPath);
    f.write(
        'i18n/zh-CN/docusaurus-plugin-content-docs/current/guide.md',
        source.replace('Original source.', '中文措辞变化。'),
    );
    f.commit();
    const planned = await f.planned(locale),
        task = planned.tasks.find(x => x.id === planned.selected[0]),
        state = readState(f.root, locale);
    const candidate = await prepare({
        root: f.root,
        plan: planned,
        taskId: task.id,
        scope: f.scope(locale),
        state,
        glossary,
        target: { locale, language: 'Japanese', scriptPattern: '.' },
        adapter: {
            model: 'fixture',
            async translateDocument() {
                return { translation: target };
            },
        },
    });
    assert.equal(candidate.target, target);
    applyCandidates(state, [candidate]);
    const manifest = {
        schemaVersion: 1,
        provider: 'codex',
        candidates: [
            { ...task, targetHash: candidate.record.targetHash, statePath: `translations/state/${locale}/docs.json` },
        ],
    };
    const changed = require('../workflow-publish.cjs').checkStaged(manifest, f.scope(locale), { rootDir: f.root });
    assert.deepEqual(changed, [`translations/state/${locale}/docs.json`]);
});
