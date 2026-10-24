const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const {renderToString} = require('react-dom/server');
const cheerio = require('cheerio');

function fixture(kind, singleVersion = false) {
    const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
    const route = locale => `${locale === 'en' ? '' : '/' + locale}${kind === 'page' ? '/use-cases/ai/' : '/docs/dev/topic/'}`;
    const i18n = {currentLocale: 'ru', defaultLocale: 'en', locales,
        localeConfigs: Object.fromEntries(locales.map(locale => [locale, {label: locale, htmlLang: locale}]))};
    const versions = (singleVersion ? ['current'] : ['current', '4.x']).map(name => ({name, label: name,
        mainDocId: 'topic', docs: [{id: 'topic', path: `/ru/docs/${name === 'current' ? 'dev' : name}/topic/`}]}));
    const active = {activeVersion: versions[0],
        alternateDocVersions: Object.fromEntries(versions.map(version => [version.name, version.docs[0]]))};
    let phase = 'server';
    const anchor = ({to, label}) => React.createElement('a', {href: to.replace(/^pathname:\/\//, '')}, label);
    const imports = {
        react: React,
        '@docusaurus/Link': ({to, children}) => React.createElement('a', {href: to.replace(/^pathname:\/\//, '')}, children),
        '@site/src/utils/contentRoute': {useContentRouteData: () => ({kind: 'page', availableTranslations: locales})},
        '@site/src/utils/useLanguageItems': {useLanguageItems: () => locales.map(locale => ({locale, label: locale, htmlLang: locale,
            href: route(locale) + (phase === 'hydrated' ? '?from=search#usage' : ''), current: locale === 'ru', onClick() {}}))},
        '@site/src/utils/localization': {hasTranslatedPage: (_path, locale) => ['ja', 'ko', 'ru'].includes(locale)},
        '@site/src/utils/locale': {normalizePathname: pathname => pathname.replace(/^\/(en|zh-CN|ja|ko|ru)(?=\/|$)/, '')},
        '@docusaurus/router': {useLocation: () => ({pathname: route('ru'),
            search: phase === 'server' ? '' : '?from=search', hash: phase === 'server' ? '' : '#usage'})},
        '@docusaurus/useIsBrowser': () => phase === 'hydrated',
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
    const file = kind === 'page' ? 'components/home-next/PageLanguageSwitcher.tsx'
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
        return renderToString(React.createElement(kind === 'page' ? module.exports.PageLanguageSwitcher : module.exports.default));
    };
}

for (const [kind, singleVersion] of [['locale', false], ['version', false], ['version', true], ['page', false]]) {
    test(`${kind} links match SSR before hydration and retain query/hash afterwards (single version: ${singleVersion})`, () => {
        const render = fixture(kind, singleVersion);
        const server = render('server');
        assert.equal(render('initial-client'), server, 'Initial client attributes must match server HTML');
        const links = html => cheerio.load(html)('a').map((_, node) => node.attribs.href).get();
        const initial = links(server), hydrated = links(render('hydrated'));
        assert(initial.length > 0);
        assert.deepEqual(hydrated, initial.map(href => href + '?from=search#usage'));
    });
}
