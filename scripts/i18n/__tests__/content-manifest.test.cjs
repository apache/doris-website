const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {createContentFixture} = require('./fixtures/content-manifest.cjs');
const {loadManual, decideManual} = require('../manual-state.cjs');
const {sourceSha, validateManifest, buildManifest, routeData, docsId} = require('../content-manifest.cjs');
const {buildScope} = require('../build-scope.cjs');
function directory(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-content-manifest-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    return root;
}
async function collect(root, locale, options) {
    const {loadContext} = require('@docusaurus/core/lib/server/site.js');
    const {loadPluginConfigs} = require('@docusaurus/core/lib/server/plugins/configs.js');
    const {initPluginsConfigs} = require('@docusaurus/core/lib/server/plugins/init.js');
    const context = await loadContext({siteDir: root, locale});
    const plugins = (await initPluginsConfigs(context, await loadPluginConfigs(context))).map(item => item.plugin);
    const allContent = {};
    for (const plugin of plugins) {
        if (!plugin.loadContent) continue;
        const content = await plugin.loadContent();
        if (!allContent[plugin.name]) allContent[plugin.name] = {};
        allContent[plugin.name][plugin.options.id] = content;
    }
    let globalData;
    await require('../status-plugin.cjs')(context, options).allContentLoaded({allContent,
        actions: {createData: async name => name, setGlobalData: value => {globalData = value;}}});
    return {manifest: JSON.parse(fs.readFileSync(path.join(root, '.i18n-build/content-manifests', locale + '.json'))), globalData};
}
test('real native plugin output binds stable identities, routes and all four coverage levels to one source', async t => {
    const {root} = await createContentFixture(directory(t));
    const old = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
    t.after(() => old === undefined ? delete process.env.NODE_ENV : process.env.NODE_ENV = old);
    for (const locale of ['en', 'zh-CN', 'ja', 'ko', 'ru']) {
        const {manifest, globalData} = await collect(root, locale);
        validateManifest(manifest);
        const validateShape = new (require('ajv'))().compile(require('../content-manifest.schema.json'));
        assert(validateShape(manifest), JSON.stringify(validateShape.errors));
        assert.equal(manifest.sourceSha, sourceSha(root));
        const page = manifest.pages.find(page => page.contentId === 'page:sample-0');
        assert.deepEqual(page.availableTranslations, ['en', 'ja', 'ko', 'ru']);
        assert.deepEqual(Object.keys(page.navigationRoutes), ['en', 'zh-CN', 'ja', 'ko', 'ru']);
        assert.equal(page.fallback, locale === 'zh-CN');
        const blog = manifest.pages.find(page => page.contentId === 'blog:2026-01-01-sample.md');
        assert.equal(blog.state, locale === 'en' ? 'source' : locale === 'zh-CN' ? 'missing' : 'needs-update');
        assert.equal(blog.route, `${locale === 'en' ? '' : '/' + locale}/blog/native-0/`);
        const full = manifest.pages.find(page => page.contentId === 'blog:2026-01-03-sample.md');
        assert.deepEqual(full.availableTranslations, ['en', 'ru']);
        assert(!manifest.pages.find(page => page.contentId === 'utility:slack').indexable);
        assert(manifest.reports.some(report => report.kind === 'orphan_target' && report.locale === 'ja'));
        const ids = manifest.pages.filter(page => page.docId === 'shared').map(page => page.contentId);
        assert.equal(new Set(ids).size, 3, 'docs identity includes plugin and version');
        const missing = manifest.pages.find(page => page.kind === 'docs' && page.docId === 'missing');
        assert.equal(missing.navigationRoutes['zh-CN'], '/zh-CN/docs/dev/english-missing/');
        assert(!JSON.stringify(globalData).includes('sourceHash'));
        assert(!JSON.stringify(routeData(page)).includes('sourceHash'));
        assert(Buffer.byteLength(JSON.stringify(routeData(page))) < 2048);
    }
    const buildOnly = await collect(root, 'en', {browserData: false});
    assert.equal(buildOnly.globalData, undefined);
    assert(buildOnly.manifest.pages.length > 0);
    const previous = process.env.FIXTURE_DISABLE_RU; process.env.FIXTURE_DISABLE_RU = 'true';
    try {
        const {manifest} = await collect(root, 'ja');
        assert(!manifest.enabledLocales.includes('ru'));
        assert(manifest.pages.every(page => !page.navigationRoutes.ru && !page.availableTranslations.includes('ru')));
        assert(!manifest.reports.some(report => report.locale === 'ru'));
    } finally {previous === undefined ? delete process.env.FIXTURE_DISABLE_RU : process.env.FIXTURE_DISABLE_RU = previous;}
});
test('manual targets reject corruption, retain source drift, and honor blocked publication', async t => {
    const {root} = await createContentFixture(directory(t));
    const record = loadManual(root, 'blog').find(record => record.locale === 'ja');
    const decide = entry => decideManual({root, record: entry, sourceFiles: entry.sourceFiles});
    assert.equal(decide(record).state, 'needs-update');
    assert.equal(decide(record).fallback, false);
    assert.equal(decide({...record, state: 'blocked'}).fallback, true);
    fs.appendFileSync(path.join(root, record.targetFiles[0]), 'Modified target.');
    assert.throws(() => decide(record), /target digest mismatch/);
});

test('native loading discovers new page dependencies and unregistered articles with English fallback', async t => {
    const {root, write} = await createContentFixture(directory(t));
    const document = 'src/pages/_content/guide.mdx';
    write(document, '# New guide\n');
    fs.appendFileSync(path.join(root, 'src/pages/sample-0.tsx'), "\nexport {default as Guide} from './_content/guide.mdx';\n");
    write('src/pages/new-page.tsx', 'export default function Page(){return null;}');
    write('blog/2026-01-20-new.md', '---\ntitle: New article\n---\n\nNew English article.\n');
    for (const base of ['docs', 'versioned_docs/version-4.x', 'community'])
        write(`${base}/new.md`, '---\ntitle: New document\n---\n\nNew English document.\n');
    const {manifest} = await collect(root, 'ja');
    const page = manifest.pages.find(row => row.contentId === 'page:sample-0');
    assert.equal(page.state, 'needs-update');
    assert.equal(page.fallback, false);
    const {digestFiles} = require('../manual-state.cjs');
    assert.equal(page.sourceHash, digestFiles(root, ['src/pages/sample-0.tsx', document]));
    assert(manifest.reports.some(row => row.kind === 'manual_source_changed' && row.contentId === page.contentId));
    // Blog aggregate routes have no source file. Select the new content by its
    // stable identity instead of assuming every manifest row has an English path.
    const addedIds = ['page:src/pages/new-page.tsx', 'blog:2026-01-20-new.md',
        ...[['default', 'current'], ['default', '4.x'], ['community', 'current']]
            .map(([pluginId, version]) => docsId({pluginId, version, docId: 'new'}))];
    for (const contentId of addedIds) {
        const row = manifest.pages.find(row => row.contentId === contentId);
        assert(row, `Missing new content: ${contentId}`);
        assert.equal(row.fallback, true, row.contentId);
        assert.equal(row.contentLocale, 'en', row.contentId);
    }
});

test('native report discovery and admission compute the same source drift without state edits', async t => {
    const {root, write} = await createContentFixture(directory(t));
    const {digestFiles} = require('../manual-state.cjs');
    const {manualReport} = require('../manual-report.cjs');
    const source = 'src/pages/community-report/index.tsx', coverage = 'translations/community-reports.json';
    const oldReport = 'src/pages/community-report/_reports/2026-10-12.mdx';
    const newReport = 'src/pages/community-report/_reports/2026-10-19.mdx';
    write(source, 'export default function Page(){return null;}');
    write(oldReport, 'export const label = "Week 42"; export const report = {"summary":{"lead":"Previous week"}};');
    write(coverage, JSON.stringify({schemaVersion: 1, translatedReports: {}}));
    const sourceFiles = [source, oldReport, coverage];
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'translations/pages/registry.json')));
    registry.pages.push({id: 'P14', kind: 'page', sourcePath: source, sourceFiles});
    write('translations/pages/registry.json', JSON.stringify(registry));
    const states = JSON.parse(fs.readFileSync(path.join(root, 'translations/pages/state.json')));
    states.pages.push({contentId: 'page:P14', locale: 'ja', state: 'ready', sourceFiles, targetFiles: ['i18n/ja/code.json'],
        sourceHash: digestFiles(root, sourceFiles), targetHash: digestFiles(root, ['i18n/ja/code.json']), reviewStatus: 'machine'});
    write('translations/pages/state.json', JSON.stringify(states));
    const decision = () => manualReport(root).pages.find(row => row.contentId === 'page:P14' && row.locale === 'ja');
    assert.equal(decision().state, 'ready');
    write(newReport, 'export const label = "Week 43"; export const report = {"summary":{"lead":"New week"}};');
    const {manifest} = await collect(root, 'ja');
    const page = manifest.pages.find(row => row.contentId === 'page:P14');
    assert.equal(page.state, 'needs-update');
    assert.equal(page.fallback, false);
    assert.equal(page.sourceHash, digestFiles(root, [...sourceFiles, newReport]));
    assert.equal(page.sourceHash, decision().sourceHash);
});
test('validator rejects mixed source and fallback indexing; missing English has an explicit report', () => {
    const entry = {contentId: 'page:one', kind: 'page', updatePolicy: 'manual', renderIntegrated: false, siteLocale: 'ja', contentLocale: 'en', state: 'missing',
        route: '/ja/one/', englishRoute: '/one/', fallback: true, indexable: false};
    const base = {sourceSha: 'a'.repeat(40), locale: 'ja', enabledLocales: ['en', 'ja']};
    const absent = buildManifest({...base, entries: [entry]});
    assert.equal(absent.pages.length, 0);
    assert.equal(absent.reports[0].kind, 'missing_english_identity');
    const manifest = buildManifest({...base, entries: [entry, {...entry, siteLocale: 'en', route: '/one/', fallback: false, indexable: true}]});
    const corrupt = structuredClone(manifest); corrupt.pages[0].sourceSha = 'b'.repeat(40);
    assert.throws(() => validateManifest(corrupt), /Mixed source/);
    manifest.pages[0].indexable = true;
    assert.throws(() => validateManifest(manifest), /fallback/);
});
test('CI recognizes the new contract and manual state as shared inputs', () => {
    for (const file of ['scripts/i18n/content-manifest.cjs', 'scripts/i18n/manual-state.cjs', 'scripts/i18n/manual-plugins.cjs',
        'scripts/i18n/native-context.cjs', 'translations/pages/state.json', 'translations/pages/registry.json', 'translations/blog/state.json']) {
        const scope = buildScope([file], ['4.x'], ['ja', 'ko', 'ru']);
        assert.deepEqual(scope.locales, ['en', 'zh-CN', 'ja', 'ko', 'ru'], file);
        assert.equal(scope.optimize_publish, true);
        assert.equal(scope.docs_versions, '');
    }
});

test('manual body dependencies include iframe resources and hash binary bytes without lossy decoding', t => {
    const root = directory(t);
    const {bodyDependencies} = require('../page-body.cjs');
    const {digestFiles} = require('../manual-state.cjs');
    fs.mkdirSync(path.join(root, 'src/pages'), {recursive: true});
    fs.mkdirSync(path.join(root, 'static/animations'), {recursive: true});
    fs.writeFileSync(path.join(root, 'src/pages/embed.tsx'), 'export default function Page(){return <iframe src="/animations/embed.html"/>;}');
    fs.writeFileSync(path.join(root, 'static/animations/embed.html'), '<script src="./embed.js"></script>');
    fs.writeFileSync(path.join(root, 'static/animations/embed.js'), 'const label = "English";');
    const {files} = bodyDependencies(root, 'src/pages/embed.tsx');
    assert.deepEqual(files, ['src/pages/embed.tsx', 'static/animations/embed.html', 'static/animations/embed.js']);
    const before = digestFiles(root, files);
    fs.writeFileSync(path.join(root, 'static/animations/embed.js'), 'const label = "Updated English";');
    assert.notEqual(digestFiles(root, files), before);
    fs.writeFileSync(path.join(root, 'image.png'), Buffer.from([0xff]));
    const binary = digestFiles(root, ['image.png']);
    fs.writeFileSync(path.join(root, 'image.png'), Buffer.from([0xfe]));
    assert.notEqual(digestFiles(root, ['image.png']), binary);
    fs.writeFileSync(path.join(root, 'text.md'), 'English\r\n');
    const text = digestFiles(root, ['text.md']);
    fs.writeFileSync(path.join(root, 'text.md'), 'English\n');
    assert.equal(digestFiles(root, ['text.md']), text);
});
