const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const {renderToString} = require('react-dom/server');
const cheerio = require('cheerio');
const vm = require('node:vm');
const {englishLanguageSwitchSelector, verifyLanguageSwitchHref} = require('../verify-search.cjs');

function fixture(kind, singleVersion = false, docsPluginId = 'default', currentLocale = 'ru') {
    const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
    const route = locale => `${locale === 'en' ? '' : '/' + locale}${kind === 'page' ? '/use-cases/ai/' : '/docs/dev/topic/'}`;
    const i18n = {currentLocale, defaultLocale: 'en', locales,
        localeConfigs: Object.fromEntries(locales.map(locale => [locale, {label: locale, htmlLang: locale === 'en' ? 'en-US' : locale === 'zh-CN' ? 'zh-Hans-CN' : locale}]))};
    const versions = (singleVersion ? ['current'] : ['current', '4.x']).map(name => ({name, label: name,
        mainDocId: 'topic', docs: [{id: 'topic', path: `${currentLocale === 'en' ? '' : '/' + currentLocale}/docs/${name === 'current' ? 'dev' : name}/topic/`}]}));
    const active = {activeVersion: versions[0],
        alternateDocVersions: Object.fromEntries(versions.map(version => [version.name, version.docs[0]]))};
    let phase = 'server';
    const anchor = ({to, label}) => React.createElement('a', {href: to.replace(/^pathname:\/\//, '')}, label);
    const imports = {
        react: React,
        '@docusaurus/Link': ({to, children}) => React.createElement('a', {href: to.replace(/^pathname:\/\//, '')}, children),
        '@site/src/utils/contentRoute': {useContentRouteData: () => ({kind: 'page', availableTranslations: locales})},
        '@site/src/utils/languageMessages': {languageMessages: () => ({choose: 'Language', reset: 'Reset', resetDone: 'Reset complete', resetFailed: 'Reset failed'})},
        '@site/src/utils/useLanguageItems': {useLanguageItems: () => locales.map(locale => ({locale, label: locale, htmlLang: i18n.localeConfigs[locale].htmlLang,
            href: route(locale) + (phase === 'hydrated' ? '?from=search#usage' : ''), current: locale === currentLocale, onClick() {}}))},
        '@site/src/utils/localization': {hasTranslatedPage: (_path, locale) => ['ja', 'ko', 'ru'].includes(locale)},
        '@site/src/utils/locale': {normalizePathname: pathname => pathname.replace(/^\/(en|zh-CN|ja|ko|ru)(?=\/|$)/, '')},
        '@docusaurus/router': {useLocation: () => ({pathname: route(currentLocale),
            search: phase === 'server' ? '' : '?from=search', hash: phase === 'server' ? '' : '#usage'})},
        '@site/src/utils/localePreference': {clearLocalePreference: () => true},
        '@site/src/components/brand-theme/BrandThemeSwitcher': {BrandThemeSwitcher: () => null},
        '@docusaurus/useIsBrowser': () => phase === 'hydrated',
        '@docusaurus/useBaseUrl': pathname => (currentLocale === 'en' ? '' : '/' + currentLocale) + pathname,
        '@docusaurus/useDocusaurusContext': () => ({i18n}),
        '@docusaurus/Translate': {translate: ({message}) => message},
        '@docusaurus/theme-common/internal': {useAlternatePageUtils: () => ({createUrl: ({locale}) => route(locale)})},
        '@site/src/utils/translation': {useTranslationRoutes: () => ({
            group: Object.fromEntries(locales.map(locale => [locale, route(locale)])), translatedLocales: ['ja', 'ko', 'ru']})},
        '@docusaurus/plugin-content-docs/client': {useVersions: () => versions, useActiveDocContext: () => active,
            useDocsVersionCandidates: () => versions, useDocsPreferredVersion: () => ({savePreferredVersionName() {}})},
        '@theme/NavbarItem/DropdownNavbarItem': ({items}) => React.createElement('nav', null,
            items.map((item, key) => React.createElement(anchor, {...item, key}))),
        '@theme/NavbarItem/DefaultNavbarItem': anchor,
    };
    const file = kind === 'menu' ? 'components/home-next/LanguageMenu.tsx' : kind === 'page' ? 'components/home-next/PageLanguageSwitcher.tsx'
        : `theme/NavbarItem/${kind === 'locale' ? 'LocaleDropdownNavbarItem/index.tsx' : 'DocsVersionDropdownNavbarItem.tsx'}`;
    const source = fs.readFileSync(path.resolve(__dirname, '../../../src', file), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true}}).outputText;
    const module = {exports: {}};
    new Function('require', 'module', 'exports', compiled)(name => {
        if (name.endsWith('.scss')) return {};
        assert(Object.hasOwn(imports, name), `Unexpected import ${name}`);
        return imports[name];
    }, module, module.exports);
    return next => {
        phase = next;
        return renderToString(React.createElement(kind === 'menu' ? module.exports.LanguageMenu : kind === 'page' ? module.exports.PageLanguageSwitcher : module.exports.default,
            kind === 'version' ? {docsPluginId} : {}));
    };
}

for (const [kind, singleVersion] of [['locale', false], ['version', false], ['version', true], ['page', false], ['menu', false]]) {
    test(`${kind} links match SSR before hydration and retain query/hash afterwards (single version: ${singleVersion})`, () => {
        const render = fixture(kind, singleVersion);
        const server = render('server');
        assert.equal(render('initial-client'), server, 'Initial client attributes must match server HTML');
        const links = html => cheerio.load(html)('a').map((_, node) => node.attribs.href).get();
        const initial = links(server), hydrated = links(render('hydrated'));
        assert(initial.length > 0);
        assert.deepEqual(hydrated, initial.map(href => href.endsWith('/archived-docs') ? href : href + '?from=search#usage'));
        if (kind === 'version') assert(initial.includes('/ru/archived-docs'));
    });
}

test('unversioned docs plugins do not acquire the main documentation archive link', () => {
    const html = fixture('version', true, 'community')('server');
    assert(!html.includes('/archived-docs'));
});

// Exercise the verifier's actual selector/predicate against markup rendered by
// the production LanguageMenu. This runs before the expensive full-site build.
function pageFor(html) {
    const $ = cheerio.load(html);
    const document = {querySelector(selector) {
        const node = $(selector).first();
        return node.length ? {getAttribute: name => node.attr(name)} : null;
    }};
    return {
        async waitForFunction(predicate, args) {
            const matches = vm.runInNewContext(`(${predicate.toString()})`, {document})(args);
            assert.equal(matches, true, 'Language switch href has not reached the expected URL');
        },
        locator(selector) {return {first: () => ({async getAttribute(name) {return $(selector).first().attr(name) ?? null;}})};},
    };
}

for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) test(`${locale} search acceptance locates the real menu and requires query and fragment`, async () => {
    const render = fixture('menu', false, 'default', locale);
    const expected = '/docs/dev/topic/?from=search#usage';
    const hydrated = '<a lang="en-US" href="/unrelated/">Other English link</a>' + render('hydrated');
    const $ = cheerio.load(hydrated);
    assert.equal($('a.dropdown__link[lang="en-US"]').length, 0, 'Fixture must use the current menu');
    assert.equal($(englishLanguageSwitchSelector).length, 1);
    await verifyLanguageSwitchHref(pageFor(hydrated), expected);
    await assert.rejects(verifyLanguageSwitchHref(pageFor(render('server')), expected));
    for (const href of ['/docs/dev/topic/?from=search', '/docs/dev/topic/#usage', '/other/?from=search#usage']) {
        $(englishLanguageSwitchSelector).attr('href', href);
        await assert.rejects(verifyLanguageSwitchHref(pageFor($.html()), expected));
    }
});
