const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const ts = require('typescript');
const {bootstrap, settings, entryOptions} = require('../locale-entry.cjs');
const {scripts} = require('../../publish/bootstrap.cjs');
const root = path.resolve(__dirname, '../../..');
const policy = require('../../../config/locale-entry.json');
const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
const now = Date.parse('2026-10-27T00:00:00Z');

function run(options = {}) {
    const stored = options.stored ?? new Map();
    const session = options.session ?? new Map();
    const redirects = [], historyChanges = [];
    let timeZoneReads = 0;
    const location = {href: options.url ?? 'https://doris.apache.org/',
        replace(href) {redirects.push(href); this.href = new URL(href, this.href).href;}};
    const storage = (map, blocked) => ({
        getItem(key) {if (blocked) throw new Error('storage unavailable'); return map.get(key) ?? null;},
        setItem(key, value) {if (blocked) throw new Error('storage unavailable'); map.set(key, value);},
        removeItem(key) {if (blocked) throw new Error('storage unavailable'); map.delete(key);},
    });
    const document = {documentElement: {lang: options.htmlLang ?? 'en-US', style: {}}, body: {textContent: 'English SSR body'}};
    const navigator = {languages: options.languages ?? ['fr-FR'], language: options.language ?? 'fr-FR'};
    if (options.languagesThrow) Object.defineProperty(navigator, 'languages', {get() {throw new Error('languages unavailable');}});
    const context = {URL, location, document, navigator, Date: {now: () => now},
        localStorage: storage(stored, options.storageBlocked), sessionStorage: storage(session, options.storageBlocked),
        history: {state: {keep: true}, replaceState(state, title, href) {
            assert.deepEqual(state, {keep: true}); historyChanges.push(href); location.href = new URL(href, location.href).href;
        }},
        Intl: {DateTimeFormat() {timeZoneReads++; if (options.timeZoneThrows) throw new Error('Intl unavailable');
            return {resolvedOptions: () => ({timeZone: options.zone ?? 'UTC'})};}},
        fetch() {throw new Error('Root entry must not make a country/network request');},
    };
    const old = process.env.DORIS_LOCALE_AUTO_DETECT;
    let code;
    try {
        if (options.disabled) process.env.DORIS_LOCALE_AUTO_DETECT = 'false'; else delete process.env.DORIS_LOCALE_AUTO_DETECT;
        code = bootstrap(root, {locales: options.locales ?? locales, baseUrl: options.baseUrl ?? '/'});
    } finally {
        if (old === undefined) delete process.env.DORIS_LOCALE_AUTO_DETECT; else process.env.DORIS_LOCALE_AUTO_DETECT = old;
    }
    new vm.Script(code).runInNewContext(context);
    assert.equal(document.body.textContent, 'English SSR body');
    assert.deepEqual(document.documentElement.style, {});
    return {redirects, historyChanges, location, stored, session, timeZoneReads};
}

function preference(locale, updatedAt = now - 1000) {
    return new Map([[policy.preference.key, JSON.stringify({version: 1, locale, updatedAt})]]);
}

test('manual English outranks browser language and region, while every explicit/deep URL remains authoritative', () => {
    assert.equal(run({stored: preference('en'), languages: ['ja'], zone: 'Asia/Tokyo'}).redirects.length, 0);
    for (const url of ['/ru/', '/ko/docs/4.x/topic/', '/docs/dev/topic/', '/blog/post/?lang=ru']) {
        const result = run({url: 'https://doris.apache.org' + url, stored: preference('en'), languages: ['ja'], zone: 'Asia/Tokyo'});
        assert.equal(result.redirects.length, 0, url);
        assert.equal(result.timeZoneReads, 0, url);
    }
    assert.equal(run({htmlLang: 'ja', languages: ['ru']}).redirects.length, 0, 'single-locale non-English dev root');
});

test('browser language preference order wins before the region table and skips unsupported languages', () => {
    for (const [languages, zone, expected] of [
        [['en-US', 'ru'], 'Europe/Moscow', '/'],
        [['fr-FR', 'ru-RU', 'ja'], 'Asia/Tokyo', '/ru/'],
        [['ja-JP', 'ko'], 'Asia/Seoul', '/ja/'],
        [['zh-Hant-TW', 'en'], 'Europe/Paris', '/zh-CN/'],
        [['KO-kp', 'ja'], 'Europe/Moscow', '/ko/'],
        [['not a language', 'de-DE', 'ru'], 'UTC', '/ru/'],
    ]) {
        const result = run({languages, zone});
        assert.equal(new URL(result.location.href).pathname, expected);
        assert.equal(result.timeZoneReads, 0);
    }
    assert.equal(new URL(run({languagesThrow: true, language: 'ru-RU'}).location.href).pathname, '/ru/');
});

for (const [country, region] of Object.entries(policy.countries)) test(`unmatched browser languages use the approved ${country} region (${region.timeZones.length} zones)`, () => {
    for (const zone of region.timeZones) {
        const result = run({languages: ['fr-FR', 'de-DE'], zone});
        assert.equal(new URL(result.location.href).pathname, `/${region.locale}/`, zone);
        assert.equal(result.timeZoneReads, 1);
        assert.equal(result.redirects.length, 1);
    }
});

test('region aliases are exact; other countries, UTC, missing detection and disabled locales use English', () => {
    for (const [zone, target] of Object.entries(policy.aliases)) {
        const expected = settings(root, {locales}).timeZones[target];
        assert.equal(new URL(run({zone}).location.href).pathname, `/${expected}/`, zone);
    }
    for (const zone of ['UTC', 'Europe/Paris', 'Asia/Taipei', 'Asia/Hong_Kong', 'Asia/Macau', 'Asia/Singapore', 'Europe/Kyiv', 'Asia/Baku', 'Etc/GMT-9'])
        assert.equal(run({zone}).redirects.length, 0, zone);
    assert.equal(run({timeZoneThrows: true}).redirects.length, 0);
    assert.equal(run({zone: 'Europe/Moscow', languages: ['ru'], locales: ['en', 'zh-CN', 'ja', 'ko']}).redirects.length, 0);
});

test('explicit root lang selection survives blocked storage, strips only controls, and never becomes an open redirect', () => {
    const english = run({url: 'https://doris.apache.org/?lang=en&q=one#usage', languages: ['ja'], zone: 'Asia/Tokyo', storageBlocked: true});
    assert.equal(english.redirects.length, 0);
    assert.equal(english.location.href, 'https://doris.apache.org/?q=one#usage');
    const japanese = run({url: 'https://doris.apache.org/?lang=ja&q=one#usage', languages: ['en'], storageBlocked: true});
    assert.equal(new URL(japanese.location.href).pathname, '/ja/');
    assert.equal(new URL(japanese.location.href).searchParams.get('q'), 'one');
    assert.equal(new URL(japanese.location.href).searchParams.has('lang'), false);
    assert.equal(new URL(japanese.location.href).hash, '#usage');
    const landed = run({url: japanese.location.href, htmlLang: 'ja', storageBlocked: true});
    assert.equal(landed.redirects.length, 0);
    assert.equal(landed.location.href, 'https://doris.apache.org/ja/?q=one#usage');
    for (const control of ['https://evil.example/', '//evil.example/', 'disabled', 'ja&lang=ru'])
        assert.equal(run({url: 'https://doris.apache.org/?lang=' + control, languages: ['ru']}).redirects.length, 0, control);
});

test('expired and future preferences do not pin a language; the existing 180-day storage contract stays intact', () => {
    for (const updatedAt of [now + 1, now - 180 * 86400000]) {
        const stored = preference('ja', updatedAt);
        assert.equal(new URL(run({stored, languages: ['ko']}).location.href).pathname, '/ko/');
        assert.equal(stored.has(policy.preference.key), false);
    }
    const saved = run({url: 'https://doris.apache.org/?lang=en'});
    assert.deepEqual(JSON.parse(saved.stored.get(policy.preference.key)), {version: 1, locale: 'en', updatedAt: now});
});

test('session and URL loop guards survive a bad host redirect with storage disabled', () => {
    const first = run({languages: ['ru']});
    assert.equal(run({languages: ['ru'], session: first.session}).redirects.length, 0);
    const explicit = run({languages: ['ru'], session: first.session, stored: preference('ja')});
    assert.equal(new URL(explicit.location.href).pathname, '/ja/', 'manual preference outranks an earlier automatic attempt');
    const bounced = run({url: 'https://doris.apache.org/?__doris_locale_entry=1&q=one#usage', languages: ['ru'], storageBlocked: true});
    assert.equal(bounced.redirects.length, 0);
    assert.equal(bounced.location.href, 'https://doris.apache.org/?q=one#usage');
});

test('detection can be disabled independently of manual preference, and nested base paths stay on site', () => {
    assert.equal(run({languages: ['ru'], disabled: true}).redirects.length, 0);
    assert.equal(new URL(run({stored: preference('ko'), disabled: true}).location.href).pathname, '/ko/');
    const result = run({url: 'https://doris.apache.org/preview/?q=one#usage', baseUrl: '/preview/', languages: ['ru']});
    assert.equal(new URL(result.location.href).pathname, '/preview/ru/');
    assert.equal(new URL(result.location.href).hash, '#usage');
    assert.deepEqual(entryOptions({baseUrl: '/preview/ja/', siteConfig: {baseUrl: '/'},
        i18n: {currentLocale: 'ja', defaultLocale: 'en', locales}}), {baseUrl: '/preview/', defaultLocale: 'en', locales});
});

test('locale bootstraps are content-addressed, identical across locale compilers, and bounded in size', () => {
    const all = scripts(root, {baseUrl: '/', defaultLocale: 'en', locales});
    const entry = all[0];
    assert.match(entry.file, /^assets\/js\/bootstrap-v2\/locale-entry-bootstrap\.[a-f0-9]{16}\.js$/);
    assert.equal(scripts(root, entryOptions({baseUrl: '/ja/', siteConfig: {baseUrl: '/'},
        i18n: {currentLocale: 'ja', defaultLocale: 'en', locales}}))[0].file, entry.file);
    assert.notEqual(scripts(root, {locales: ['en', 'zh-CN']})[0].file, entry.file);
    assert(Buffer.byteLength(entry.content) < 16384);
    assert(zlib.gzipSync(entry.content).length < 6144);
});

test('English-root menu links carry this manual choice even before hydration and without storage', () => {
    const compile = name => ts.transpileModule(fs.readFileSync(path.join(root, `src/utils/${name}.ts`), 'utf8'),
        {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true}}).outputText;
    const routeModule = {exports: {}};
    new Function('module', 'exports', compile('localizedRoute'))(routeModule, routeModule.exports);
    let hydrated = false;
    const saved = [];
    const imports = {
        '@docusaurus/useDocusaurusContext': () => ({i18n: {locales, defaultLocale: 'en', currentLocale: 'ja',
            localeConfigs: Object.fromEntries(locales.map(locale => [locale, {label: locale, htmlLang: locale}]))}, siteConfig: {baseUrl: '/ja/'}}),
        '@docusaurus/router': {useLocation: () => ({pathname: '/ja/', search: '?from=menu', hash: '#usage'})},
        '@docusaurus/useIsBrowser': () => hydrated,
        './contentRoute': {useContentRouteData: () => null},
        './useLocalizedRoute': {useLocalizedRoute: () => (_path, {locale}) => ({href: locale === 'en' ? '/' : `/${locale}/`})},
        './localePreference': {saveLocalePreference: locale => saved.push(locale)},
        './localizedRoute': routeModule.exports,
        './languageMessages': {languageMessages: () => ({note: 'English'})},
    };
    const module = {exports: {}};
    new Function('require', 'module', 'exports', compile('useLanguageItems'))(name => {assert(Object.hasOwn(imports, name), name); return imports[name];}, module, module.exports);
    assert.equal(module.exports.useLanguageItems()[0].href, '/?lang=en');
    hydrated = true;
    const items = module.exports.useLanguageItems();
    assert.equal(items[0].href, '/?from=menu&lang=en#usage');
    items[0].onClick();
    assert.deepEqual(saved, ['en']);
});
