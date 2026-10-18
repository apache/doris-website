const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const yaml = require('js-yaml');
const {pipelineLocale, managedLocales, identity} = require('../state.cjs');
const {collect, buildGroup} = require('../inventory.cjs');
const statusPlugin = require('../status-plugin.cjs');
const {createFixture} = require('./fixtures/multi-locale.cjs');
const repoRoot = path.resolve(__dirname, '../../..');

function directory(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-multi-locale-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    return root;
}
async function withEnv(values, run) {
    const old = {...process.env};
    Object.entries(values).forEach(([key, value]) => value === undefined ? delete process.env[key] : process.env[key] = value);
    try {return await run();}
    finally {
        for (const key of Object.keys(process.env)) if (!(key in old)) delete process.env[key];
        Object.assign(process.env, old);
    }
}

test('two managed locales require a configured selector even when the site disables them', async t => {
    const {root} = await createFixture(directory(t));
    assert.throws(() => pipelineLocale(root, ''), /Set I18N_LOCALE/);
    assert.throws(() => pipelineLocale(root, 'fr'), /Unconfigured translation locale/);
    for (const locale of ['ja', 'ko']) assert.equal(pipelineLocale(root, locale), locale);
    assert.deepEqual(managedLocales(root), ['ja', 'ko']);
    const cli = all => execFileSync(process.execPath, [path.join(repoRoot, 'scripts/i18n/managed-locales.cjs'), ...all],
        {cwd: root, encoding: 'utf8', env: {...process.env, DORIS_ENABLE_JA: '', DORIS_ENABLE_LOCALES: ''}});
    assert.equal(cli([]), '');
    assert.equal(cli(['--all']), 'ja ko');
});

test('native inventory isolates locales across repeated doc IDs, plugins, versions and reports', async t => {
    const {root} = await createFixture(directory(t));
    for (const locale of ['ja', 'ko']) await withEnv({I18N_LOCALE: locale}, async () => {
        const native = await collect(root);
        assert.equal(native.pages.length, 8);
        assert(native.pages.every(page => page.locale === locale));
        assert.equal(new Set(native.pages.map(identity)).size, 8);
        assert.equal(native.pages.filter(page => page.docId === 'shared').length, 3);
        assert.deepEqual(native.versions.map(({pluginId, version}) => [pluginId, version]),
            [['default', 'current'], ['default', '4.x'], ['community', 'current']]);
        assert(native.reports.every(report => !report.locale || report.locale === locale));
        assert.equal(native.reports.filter(report => report.kind === 'unsupported_source_route').length, 1);
        assert.equal(native.reports.filter(report => report.kind === 'orphan_target').length, 1);
        const group = {id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs'};
        const result = buildGroup({group, pages: [...native.pages, {...native.pages[0], locale: 'fr'}],
            files: native.pages.filter(page => page.pluginId === 'default' && page.version === 'current').map(page => page.englishPath),
            scope: {locale, groups: [group], retainEnglish: [], maxBatchPages: 10}, order: new Map(),
            committedHash: () => null, committedRecords: new Map()});
        assert.equal(result.counts.registered, 6);
        assert.equal(result.counts.required, 5);
        assert.equal(result.counts.drafts, 1);
        const shared = native.pages.find(page => page.docId === 'shared' && page.version === 'current' && page.pluginId === 'default');
        assert.deepEqual(shared.alternates, {en: '/docs/dev/english-shared/', 'zh-CN': '/zh-CN/docs/dev/chinese-shared/',
            ja: '/ja/docs/dev/english-shared/', ko: '/ko/docs/dev/english-shared/'});
        for (const [id, expected] of [['ja-only', ['en', 'zh-CN', 'ja']], ['ko-only', ['en', 'zh-CN', 'ko']],
            ['missing', ['en', 'zh-CN']], ['hidden', ['en', 'zh-CN']], ['draft', ['en']]]) {
            assert.deepEqual(Object.keys(native.pages.find(page => page.docId === id).alternates), expected, id);
        }
    });
});

test('native doc metadata, browser groups and per-locale manifests agree, including disabled ko', async t => {
    const {loadContext} = require('@docusaurus/core/lib/server/site.js');
    const {loadPluginConfigs} = require('@docusaurus/core/lib/server/plugins/configs.js');
    const {initPluginsConfigs} = require('@docusaurus/core/lib/server/plugins/init.js');
    for (const disabled of [false, true]) {
        const {root} = await createFixture(directory(t));
        await withEnv({NODE_ENV: 'production', FIXTURE_DISABLE_KO: disabled ? 'true' : undefined}, async () => {
            const locales = ['en', 'zh-CN', 'ja', ...(disabled ? [] : ['ko'])];
            for (const locale of locales) {
                const context = await loadContext({siteDir: root, locale});
                const configs = (await loadPluginConfigs(context)).filter(config => config.plugin.isTranslationDocsPlugin);
                const plugins = (await initPluginsConfigs(context, configs)).map(result => result.plugin);
                const allContent = {'docusaurus-plugin-content-docs': {}};
                for (const plugin of plugins) allContent['docusaurus-plugin-content-docs'][plugin.options.id] = await plugin.loadContent();
                let data;
                await statusPlugin(context).allContentLoaded({allContent, actions: {setGlobalData: value => {data = value;}}});
                const pages = Object.values(allContent['docusaurus-plugin-content-docs']).flatMap(content => content.translationManifest.pages);
                const shared = pages.find(page => page.docId === 'shared' && page.version === 'current' && page.pluginId === 'default');
                assert.deepEqual(Object.keys(shared.alternates), locales);
                for (const permalink of Object.values(shared.alternates)) assert.deepEqual(data.alternates[permalink], shared.alternates);
                for (const page of pages) assert.deepEqual(data.alternates[page.permalink], page.alternates);
                const output = JSON.parse(fs.readFileSync(path.join(root, '.i18n-build/manifests', `${locale}.json`)));
                assert(output.pages.every(page => page.locale === locale));
                assert(output.reports.every(report => !report.locale || report.locale === locale));
                if (['ja', 'ko'].includes(locale)) {
                    const metadata = allContent['docusaurus-plugin-content-docs'].default.loadedVersions
                        .find(version => version.versionName === 'current').docs.find(doc => doc.id === 'shared').translation;
                    assert.deepEqual(metadata.alternates, shared.alternates);
                    assert.deepEqual(output.pages.find(page => page.docId === 'shared' && page.version === 'current' && page.pluginId === 'default').alternates,
                        shared.alternates);
                }
                if (disabled) assert(!JSON.stringify(data.alternates).includes('/ko/'));
            }
        });
    }
});

test('scheduled Japanese jobs select ja and PR admission checks every configured locale with fail-fast behavior', async t => {
    const workflow = file => yaml.load(fs.readFileSync(path.join(repoRoot, '.github/workflows', file), 'utf8'));
    const translation = workflow('japanese-translation.yml');
    assert.equal(translation.on.workflow_dispatch.inputs.locale.default, 'ja');
    for (const job of ['discover', 'generate']) assert.equal(translation.jobs[job].env.I18N_LOCALE, "${{ inputs.locale || 'ja' }}");
    assert.equal(workflow('japanese-coverage-audit.yml').jobs.audit.env.I18N_LOCALE, 'ja');
    const gate = workflow('build-check.yml').jobs['build-and-deploy'].steps.find(step => step.name === 'Translation gate for every managed locale');
    const {root, write} = await createFixture(directory(t));
    for (const file of ['scripts/i18n/managed-locales.cjs', 'scripts/i18n/state.cjs', 'config/i18n.js']) write(file, fs.readFileSync(path.join(repoRoot, file), 'utf8'));
    write('scripts/i18n/pr-preflight.cjs', "require('node:fs').appendFileSync('calls', process.env.I18N_LOCALE + '\\n'); process.exit(process.env.I18N_LOCALE === process.env.FAIL_LOCALE ? 1 : 0);\n");
    execFileSync('git', ['init', '-q'], {cwd: root});
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-qm', 'base'], {cwd: root});
    execFileSync('git', ['update-ref', 'refs/remotes/origin/master', 'HEAD'], {cwd: root});
    for (const fail of ['', 'ko', 'ja']) {
        write('calls', '');
        const result = spawnSync('bash', ['-e', '-c', gate.run.replace('${{ github.base_ref }}', 'master')],
            {cwd: root, encoding: 'utf8', env: {...process.env, FAIL_LOCALE: fail, DORIS_ENABLE_JA: '', DORIS_ENABLE_LOCALES: ''}});
        assert.equal(result.status, fail ? 1 : 0, result.stderr);
        assert.equal(fs.readFileSync(path.join(root, 'calls'), 'utf8'), fail === 'ja' ? 'ja\n' : 'ja\nko\n');
    }
});

test('the publisher-selected locale is forwarded to the admission subprocess', async t => {
    const {preflight} = require('../pr-preflight.cjs');
    const {root, write} = await createFixture(directory(t));
    write('scripts/i18n/check-translations.cjs', "require('node:fs').writeFileSync('selected-locale', process.env.I18N_LOCALE);\n");
    execFileSync('git', ['init', '-q'], {cwd: root});
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--allow-empty', '-qm', 'base'], {cwd: root});
    for (const locale of ['ja', 'ko']) {
        await withEnv({I18N_LOCALE: 'unconfigured'}, () => preflight({root, base: 'HEAD', locale}));
        assert.equal(fs.readFileSync(path.join(root, 'selected-locale'), 'utf8'), locale);
    }
});

test('inventory CLI snapshots committed page records for the selected locale', async t => {
    const root = directory(t);
    const {write} = await createFixture(root);
    write('.gitignore', 'node_modules\n.i18n-build/\n.docusaurus/\n');
    write('sidebars.ts', 'module.exports = {};\n');
    write('sidebarsCommunity.json', '{}\n');
    write('translations/scope/ko.json', JSON.stringify({schemaVersion: 1, locale: 'ko', maxBatchPages: 20,
        groups: [
            {id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs'},
            {id: '4X', pluginId: 'default', version: '4.x', sourceRoot: 'versioned_docs/version-4.x'},
            {id: 'COMMUNITY', pluginId: 'community', version: 'current', sourceRoot: 'community'},
        ], retainEnglish: []}));
    // Exercise the real CLI boundary without adding a production root override.
    for (const file of ['inventory.cjs', 'state.cjs'])
        write(`scripts/i18n/${file}`, fs.readFileSync(path.join(repoRoot, 'scripts/i18n', file), 'utf8'));
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=Inventory fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'native fixture');
    const commit = git('rev-parse', 'HEAD').trim();
    const output = path.join(root, 'snapshot');
    const env = {...process.env, I18N_LOCALE: 'ko'};
    for (const key of ['DOCS_VERSIONS', 'LANDING_ONLY', 'SKIP_DOCS', 'SKIP_COMMUNITY', 'SKIP_COURSE', 'SKIP_RELEASES']) delete env[key];
    execFileSync(process.execPath, [path.join(root, 'scripts/i18n/inventory.cjs'), '--source-ref', commit, '--output', output],
        {cwd: root, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
    const summary = JSON.parse(fs.readFileSync(path.join(output, 'summary.json'), 'utf8'));
    assert.equal(summary.locale, 'ko');
    assert.equal(summary.sourceCommit, commit);
    assert.equal(summary.nativeVersions.length, 3);
    for (const group of ['dev', '4x', 'community']) {
        const metadata = JSON.parse(fs.readFileSync(path.join(output, `${group}.json`), 'utf8'));
        const entries = metadata.entryFiles.flatMap(file => JSON.parse(fs.readFileSync(path.join(output, file), 'utf8')).entries);
        assert(entries.every(entry => entry.locale === 'ko'));
        assert.equal(entries.find(entry => entry.docId === 'shared').mergedCurrent, true);
    }
});
