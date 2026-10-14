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
    assert.deepEqual(locales, ['en', 'zh-CN', 'ja']);
    assert.equal(localeRegistry.find(locale => locale.code === 'ja').label, '日本語');
    assert.equal(localeRegistry.find(locale => locale.code === 'ja').htmlLang, 'ja');
    withEnv({DORIS_ENABLE_JA: undefined, DORIS_ENABLE_LOCALES: undefined}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN']);
    });
    // A developer switches one locale on; CI enables the locales in scope.
    withEnv({DORIS_ENABLE_JA: 'true', DORIS_ENABLE_LOCALES: undefined}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN', 'ja']);
    });
    withEnv({DORIS_ENABLE_JA: undefined, DORIS_ENABLE_LOCALES: 'ja'}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN', 'ja']);
        assert.deepEqual(enabledLocaleRecords().map(locale => locale.htmlLang), ['en-US', 'zh-Hans-CN', 'ja']);
    });
    withEnv({DORIS_ENABLE_JA: undefined, DORIS_ENABLE_LOCALES: 'ko'}, () => {
        assert.deepEqual(enabledLocales(), ['en', 'zh-CN']);
    });
});

test('a locale is managed only when it is both configured and enabled', () => {
    assert.deepEqual(managedLocales(root), ['ja']);
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
        alternates: {en: `/docs/current/${docId}/`, ...(indexable ? {[locale]: `/${locale}/docs/current/${docId}/`} : {})}});
    const allContent = {'docusaurus-plugin-content-docs': {
        default: {translationManifest: {pages: [page('ja', 'a'), page('ja', 'b', false)], reports: [
                {kind: 'unsupported_source_route', sourcePath: 'i18n/zh-CN/x.md'},
                {kind: 'source_deleted', locale: 'ja', docId: 'gone'}]}, loadedVersions: [{path: '/ja/docs/current'}]},
    }};
    for (const locale of ['en', 'ja']) {
        let globalData;
        const plugin = translationStatusPlugin({siteDir, i18n: {currentLocale: locale}});
        await plugin.allContentLoaded({allContent, actions: {setGlobalData: data => {globalData = data;}}});
        const manifest = JSON.parse(fs.readFileSync(path.join(siteDir, '.i18n-build/manifests', `${locale}.json`), 'utf8'));
        assert.equal(manifest.locale, locale);
        // Both locales group the indexable page; the non-indexable one contributes none.
        assert.deepEqual(Object.keys(globalData.alternates).sort(),
            ['/docs/current/a/', '/ja/docs/current/a/']);
        assert.deepEqual(manifest.pages.map(item => item.docId), locale === 'ja' ? ['a', 'b'] : []);
        // Repository-wide reports stay, another locale's records do not.
        assert.deepEqual(manifest.reports.filter(report => report.kind === 'unsupported_source_route').length, 1);
        assert.equal(manifest.reports.filter(report => report.kind === 'source_deleted').length, locale === 'ja' ? 1 : 0);
    }
});
