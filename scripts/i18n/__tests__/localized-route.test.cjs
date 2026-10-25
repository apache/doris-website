const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(name) {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../src/utils', name + '.ts'), 'utf8');
    const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
    const mod = {exports: {}};
    new Function('module', 'exports', code)(mod, mod.exports);
    return mod.exports;
}
const {resolveLocalizedRoute, rootBaseUrl, appendRouteSuffix, isSystemNoindexPath} = load('localizedRoute');
const {saveLocalePreference, readLocalePreference, LOCALE_PREFERENCE_KEY} = load('localePreference');
const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
const options = {url: 'https://doris.apache.org', baseUrl: '/', defaultLocale: 'en', locales, trailingSlash: true};
const group = {contentId: 'docs:default:4.x:topic', navigationRoutes: Object.fromEntries(locales.map(locale => [locale,
    `${locale === 'en' ? '' : '/' + locale}/docs/4.x/${locale === 'zh-CN' ? 'chinese' : 'english'}-topic/`]))};
test('system noindex applies to localized root search/404 pages without affecting document suffixes', () => {
    for (const baseUrl of ['/', '/preview/']) for (const locale of locales) {
        const prefix = baseUrl + (locale === 'en' ? '' : locale + '/');
        const opts = {...options, baseUrl};
        for (const page of ['search', 'search/', '404.html'])
            assert.equal(isSystemNoindexPath(prefix + page, opts), true, prefix + page);
        for (const page of ['docs/dev/observability/dogstack/search/', 'docs/4.x/404.html', 'blog/search/', 'research/'])
            assert.equal(isSystemNoindexPath(prefix + page, opts), false, prefix + page);
    }
});
function resolve(href, extra = {}) {return resolveLocalizedRoute({href, locale: 'ja', currentUrl: '/ja/docs/4.x/english-topic/?a=1#usage', options, routes: [group], ...extra});}
test('switches all languages using native identities and retains version, query and stable anchor', () => {
    for (const locale of locales) assert.equal(resolve('/ja/docs/4.x/english-topic/?a=1#usage', {locale, switchLocale: true}).href,
        group.navigationRoutes[locale] + '?a=1#usage');
    assert.equal(resolve('https://doris.apache.org/docs/4.x/english-topic/?a=1#usage', {locale: 'zh-CN'}).href,
        '/zh-CN/docs/4.x/chinese-topic/?a=1#usage');
});
test('respects explicit language, English opt-out, external and resource targets', () => {
    for (const href of ['/ko/download/?q=1', 'pathname:///download/', 'mailto:a@example.com', 'tel:123', 'https://other.example/a', '//other.example/a', '/images/logo.svg', '/api/profile', '/files/a.zip', '#usage', '?page=2'])
        assert.equal(resolve(href).href, href);
    assert.equal(resolve('/download/', {preserveLocale: true}).href, '/download/');
    assert.equal(resolve('/ja/ko/topic/').reason, 'explicit-locale');
    assert.equal(resolve('/ja/ko/topic/', {switchLocale: true}).reason, 'duplicate-locale');
});
test('unknown pages keep their path for a real 404 and absent native counterparts are not invented', () => {
    assert.equal(resolve('/does-not-exist?q=1#x').href, '/ja/does-not-exist/?q=1#x');
    const routes = [{contentId: 'one', navigationRoutes: {en: '/only-en/'}}];
    assert.equal(resolve('/only-en/', {routes, switchLocale: true}).href, '/only-en/');
    assert.equal(resolve('/download/', {locale: 'disabled'}).href, '/download/');
});
test('non-root base URL, trailing slash modes, relative paths and prefix boundaries', () => {
    const opts = {...options, baseUrl: '/preview/'};
    for (const locale of locales) assert.equal(resolve('/preview/', {locale, options: opts}).href,
        '/preview/' + (locale === 'en' ? '' : locale + '/'));
    assert.equal(resolve('/preview/download', {options: {...opts, trailingSlash: false}}).href, '/preview/ja/download');
    assert.equal(resolve('/preview/download/', {options: {...opts, trailingSlash: undefined}}).href, '/preview/ja/download/');
    assert.equal(resolve('/download/', {options: opts}).href, '/preview/ja/download/');
    assert.equal(resolve('/ko/download/', {options: opts}).href, '/preview/ko/download/');
    assert.equal(resolve('https://doris.apache.org/elsewhere', {options: opts}).href, 'https://doris.apache.org/elsewhere');
    assert.equal(resolve('../next?x=1#start').href, '/ja/docs/4.x/next/?x=1#start');
    assert.equal(rootBaseUrl('/preview/ru/', 'ru', 'en'), '/preview/');
    assert.equal(rootBaseUrl('/', 'en', 'en'), '/');
});
test('query and hash occur once when switching and adding menu parameters', () => {
    assert.equal(appendRouteSuffix('/ja/?old=1#old', '?q=hello%20world&lang=ja', '#usage', '?lang=ko&more=1'),
        '/ja/?q=hello+world&lang=ko&more=1#usage');
});
test('manual preference includes en, expires and tolerates unavailable storage and SSR', () => {
    const entries = new Map(); const storage = {getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key)};
    assert(saveLocalePreference('en', locales, 1000, storage));
    assert.equal(readLocalePreference(locales, 2000, storage), 'en');
    saveLocalePreference('ja', locales, 1000, storage);
    assert.equal(readLocalePreference(['en', 'ko'], 2000, storage), undefined);
    saveLocalePreference('ja', locales, 1000, storage);
    assert.equal(readLocalePreference(locales, 1000 + 180 * 86400000, storage), undefined);
    for (const value of ['broken', '{}', '{"version":2,"locale":"ja","updatedAt":1000}']) {
        entries.set(LOCALE_PREFERENCE_KEY, value); assert.equal(readLocalePreference(locales, 2000, storage), undefined);
    }
    assert.equal(readLocalePreference(locales), undefined);
    assert.equal(saveLocalePreference('ja', locales), false);
    const denied = {getItem() {throw Error('denied');}, setItem() {throw Error('denied');}};
    assert.equal(readLocalePreference(locales, 1000, denied), undefined);
    assert.equal(saveLocalePreference('ja', locales, 1000, denied), false);
});
