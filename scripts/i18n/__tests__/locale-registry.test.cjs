const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// The registry reads the environment when it is asked, so a test can switch a
// locale on and off without reloading the module.
const load = () => require('../../../config/i18n.js');
const {managedLocales} = require('../state.cjs');
const translationStatusPlugin = require('../status-plugin.cjs');
const root = path.resolve(__dirname, '../../..');

function withEnv(values, run) {
    const previous = {};
    for (const [key, value] of Object.entries(values)) {
        previous[key] = process.env[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    try { return run(); } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
}

test('the locale registry keeps introduced locales opt-in behind one config', () => {
    const {locales, localeRegistry, enabledLocales, enabledLocaleRecords} = load();
    assert.deepEqual(locales, ['en', 'zh-CN', 'ja', 'ko']);
    assert.deepEqual(localeRegistry.find(locale => locale.code === 'ko'),
        {code: 'ko', label: '한국어', htmlLang: 'ko', optional: true, ordinaryPages: false});
    assert.equal(localeRegistry.find(locale => locale.code === 'ja').label, '日本語');
    assert.equal(localeRegistry.find(locale => locale.code === 'ja').htmlLang, 'ja');
    withEnv({DORIS_ENABLE_KO: undefined, DORIS_ENABLE_JA: undefined, DORIS_ENABLE_LOCALES: undefined}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN']);
    });
    // A developer switches one locale on; CI enables the locales in scope.
    withEnv({DORIS_ENABLE_KO: undefined, DORIS_ENABLE_JA: 'true', DORIS_ENABLE_LOCALES: undefined}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN', 'ja']);
    });
    withEnv({DORIS_ENABLE_KO: undefined, DORIS_ENABLE_JA: undefined, DORIS_ENABLE_LOCALES: 'ja'}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN', 'ja']);
        assert.deepEqual(enabledLocaleRecords().map(locale => locale.htmlLang), ['en-US', 'zh-Hans-CN', 'ja']);
    });
    withEnv({DORIS_ENABLE_KO: 'true', DORIS_ENABLE_JA: undefined, DORIS_ENABLE_LOCALES: undefined}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN', 'ko']);
    });
    withEnv({DORIS_ENABLE_KO: undefined, DORIS_ENABLE_JA: undefined, DORIS_ENABLE_LOCALES: 'ja,ko'}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN', 'ja', 'ko']);
    });
});

test('a locale is managed only when it is both configured and enabled', () => {
    assert.deepEqual(managedLocales(root), ['ja', 'ko']);
    assert.deepEqual(managedLocales(root, ['en', 'zh-CN', 'ja']), ['ja']);
    assert.deepEqual(managedLocales(root, ['en', 'zh-CN']), []);
});

test('route groups span every managed locale while a manifest carries one', async t => {
    // The regression this guards: building English must still advertise the
    // localized alternate, which only the other locale's pages can supply.
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-status-plugin-'));
    t.after(() => fs.rmSync(siteDir, {recursive: true, force: true}));
    const page = (locale, docId, indexable = true) => ({pluginId: 'default', version: 'current', docId, locale,
        status: 'current', useTarget: true, indexable,
        permalink: `/${locale}/docs/current/${docId}/`, englishPermalink: `/docs/current/${docId}/`,
        alternates: {en: `/docs/current/${docId}/`, 'zh-CN': `/zh-CN/docs/current/${docId}/`, ...(indexable ? {[locale]: `/${locale}/docs/current/${docId}/`} : {})}});
    const allContent = {'docusaurus-plugin-content-docs': {
        default: {translationManifest: {pages: [page('ja', 'a'), page('ja', 'b', false)], reports: [
                {kind: 'unsupported_source_route', sourcePath: 'i18n/zh-CN/x.md'},
                {kind: 'source_deleted', locale: 'ja', docId: 'gone'}]}, loadedVersions: [{path: '/ja/docs/current'}]},
    }, 'docusaurus-plugin-content-pages': {default: [{permalink: '/ja/'}, {permalink: '/ja/download'}]}};
    for (const locale of ['en', 'ja']) {
        let globalData;
        const plugin = translationStatusPlugin({siteDir, i18n: {currentLocale: locale}});
        await plugin.allContentLoaded({allContent, actions: {setGlobalData: data => {globalData = data;}}});
        const manifest = JSON.parse(fs.readFileSync(path.join(siteDir, '.i18n-build/manifests', `${locale}.json`), 'utf8'));
        assert.equal(manifest.locale, locale);
        assert.deepEqual(globalData.pageRoutes, ['/ja/', '/ja/download/']);
        assert.deepEqual(manifest.pageRoutes, globalData.pageRoutes);
        // Both locales group the indexable page; the non-indexable one contributes none.
        assert.deepEqual(Object.keys(globalData.alternates).sort(),
            ['/docs/current/a/', '/ja/docs/current/a/', '/zh-CN/docs/current/a/']);
        assert.deepEqual(manifest.pages.map(item => item.docId), locale === 'ja' ? ['a', 'b'] : []);
        // Repository-wide reports stay, another locale's records do not.
        assert.deepEqual(manifest.reports.filter(report => report.kind === 'unsupported_source_route').length, 1);
        assert.equal(manifest.reports.filter(report => report.kind === 'source_deleted').length, locale === 'ja' ? 1 : 0);
    }
});

test('a blog counts as translated only when the locale holds a post file', t => {
    const {hasBlogTranslations} = load();
    const siteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-blog-translations-'));
    t.after(() => fs.rmSync(siteDir, {recursive: true, force: true}));
    const blogDir = path.join(siteDir, 'i18n', 'ja', 'docusaurus-plugin-content-blog');
    // No directory at all: the plugin serves the default locale's posts.
    assert.equal(hasBlogTranslations(siteDir, 'ja'), false);
    fs.mkdirSync(blogDir, {recursive: true});
    // An empty directory, and one holding only the tag registry, translate nothing.
    assert.equal(hasBlogTranslations(siteDir, 'ja'), false);
    fs.writeFileSync(path.join(blogDir, 'tags.yml'), 'release-notes:\n');
    assert.equal(hasBlogTranslations(siteDir, 'ja'), false);
    fs.writeFileSync(path.join(blogDir, 'some-post.md'), '# 記事\n');
    assert.equal(hasBlogTranslations(siteDir, 'ja'), true);
});

test('neither shipped locale translates the blog yet', () => {
    // Guards the intent behind the noindex on localized blog routes: the
    // Chinese translations were removed on purpose, and Japanese has not
    // started. Translating a post flips that locale over to indexing, so this
    // test fails on purpose and asks for the SEO decision to be revisited.
    const {hasBlogTranslations} = load();
    assert.equal(hasBlogTranslations(root, 'zh-CN'), false);
    assert.equal(hasBlogTranslations(root, 'ja'), false);
    assert.equal(hasBlogTranslations(root, 'ko'), false);
});

test('Korean pipeline requires an explicit locale and its own inventory before planning', () => {
    const {pipelineLocale, inventoryBaseline, loadConfig} = require('../state.cjs');
    assert.throws(() => pipelineLocale(root, ''), /Set I18N_LOCALE/);
    assert.equal(pipelineLocale(root, 'ja'), 'ja');
    assert.equal(pipelineLocale(root, 'ko'), 'ko');
    // A language declaration never substitutes for a native inventory baseline.
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-ko-inventory-'));
    try {assert.throws(() => inventoryBaseline(empty, 'ko'), /Expected one ko inventory snapshot, found 0/);}
    finally {fs.rmSync(empty, {recursive: true, force: true});}
    const settings = loadConfig(root).locales.ko;
    const script = new RegExp(settings.scriptPattern, 'u');
    for (const text of ['한국어 데이터베이스', 'ᄒ', 'ㄱ']) assert(script.test(text));
    for (const text of ['English SQL', '日本語 データベース']) assert(!script.test(text));
});
