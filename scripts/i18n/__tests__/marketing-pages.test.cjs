const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {localeRegistry} = require('../../../config/i18n');
const {generate} = require('../../key-features/generate');

const root = path.resolve(__dirname, '../../..');
const pagePaths = localeRegistry.find(locale => locale.code === 'ja').translatedPages;
// The pages each locale actually registers, as the site configuration reads them.
const registered = Object.fromEntries(localeRegistry.filter(locale => locale.translatedPages?.length)
    .map(locale => [locale.code, locale.translatedPages]));
const placeholders = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();

// Every marketing.* message a page renders: the translate() calls and <Translate>
// elements reachable from its route module. Global navigation and theme chrome use
// other namespaces, so the prefix alone separates page content from them.
function pageMessages(page) {
    const messages = new Map(), seen = new Set();
    function visitFile(file) {
        file = [file, ...['.ts', '.tsx', '.js'].map(extension => file + extension), path.join(file, 'index.tsx')]
            .find(candidate => /\.[jt]sx?$/.test(candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!file || seen.has(file)) return;
        seen.add(file);
        const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true,
            file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        function visit(node) {
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                const name = node.moduleSpecifier.text;
                if (name.startsWith('@site/')) visitFile(path.join(root, name.slice(6)));
                else if (name.startsWith('.')) visitFile(path.resolve(path.dirname(file), name));
            }
            const options = ts.isCallExpression(node) && node.expression.getText(source) === 'translate' && node.arguments[0];
            if (options && ts.isObjectLiteralExpression(options)) {
                const value = key => options.properties.find(property => property.name?.getText(source) === key)?.initializer?.text;
                if (value('id')?.startsWith('marketing.')) messages.set(value('id'), value('message'));
            }
            if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'Translate') {
                const id = node.openingElement.attributes.properties.find(property => property.name?.getText(source) === 'id')?.initializer?.text;
                const message = node.children.find(child => ts.isJsxExpression(child) && child.expression)?.expression.text;
                if (id?.startsWith('marketing.')) messages.set(id, message ?? '');
            }
            ts.forEachChild(node, visit);
        }
        visit(source);
    }
    visitFile(path.join(root, 'src/pages', page, 'index'));
    return messages;
}

function modules(locale, pathname, enabled = true, translatedPages = {ja: pagePaths}) {
    const cache = new Map();
    const locales = enabled ? ['en', 'zh-CN', 'ja', 'ko', 'ru'] : ['en', 'zh-CN'];
    const i18n = {currentLocale: locale, defaultLocale: 'en', locales,
        localeConfigs: Object.fromEntries(localeRegistry.filter(record => locales.includes(record.code)).map(record => [record.code, record]))};
    const config = {url: 'https://doris.apache.org', trailingSlash: true, baseUrl: locale === 'en' ? '/' : `/${locale}/`,
        customFields: {defaultLocalePageLocales: enabled ? ['ja','ko','ru'] : [], translatedPagePaths: enabled ? translatedPages : {}}};
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const location = {pathname, search: '?from=test', hash: '#tech'};
    const plain = pathname.replace(/^\/(en|zh-CN|ja|ko|ru)(?=\/|$)/, '') || '/';
    const ordinary = ['/', '/download/', '/community-report/', '/why-doris/users/', ...pagePaths.map(page => page + '/')].includes(plain);
    const available = ["en", ...Object.keys(translatedPages).filter(lang => enabled && translatedPages[lang].includes(plain.replace(/\/$/, '')))];
    const contentRoute = ordinary ? {schemaVersion: 1, renderIntegrated: true, contentId: 'page:test', kind: 'page',
        siteLocale: locale, contentLocale: available.includes(locale) ? locale : 'en', fallback: !available.includes(locale),
        indexable: available.includes(locale), availableTranslations: available,
        navigationRoutes: Object.fromEntries(locales.map(lang => [lang, (lang === 'en' ? '' : '/' + lang) + plain]))} : undefined;
    const imports = {
        '@site/src/utils/contentRoute': {useContentRouteData: () => contentRoute, useNavigationRoutes: () => []},
        '@generated/i18n': i18n,
        '@generated/docusaurus.config': config,
        '@docusaurus/Translate': {translate: ({message}) => message},
        '@docusaurus/useDocusaurusContext': () => ({i18n, siteConfig: config}),
        '@docusaurus/useBaseUrl': source => source,
        '@docusaurus/useGlobalData': () => ({'doris-translation-status': {default: {
            alternates: {}, locales: enabled ? ['ja','ko','ru'] : [], prefixes: [`${prefix}/docs/dev`,`${prefix}/community`],
            pageRoutes: ['/', '/download/', '/community-report/', ...pagePaths.map(page => `${page}/`)].map(page => prefix + page),
        }}}),
        '@docusaurus/router': {useLocation: () => location},
        '@docusaurus/useIsBrowser': () => true,
        '@docusaurus/Head': ({children}) => React.createElement(React.Fragment, null, children),
        '@docusaurus/theme-common': {useThemeConfig: () => ({metadata: []})},
        '@docusaurus/theme-common/internal': {DEFAULT_SEARCH_TAG: 'default', keyboardFocusedClassName: 'keyboard',
            useAlternatePageUtils: () => ({createUrl: ({locale, fullyQualified}) => {
                const plain = pathname.replace(/^\/(en|zh-CN|ja|ko)(?=\/|$)/, '') || '/';
                return (fullyQualified ? config.url : '') + (locale === 'en' ? '' : `/${locale}`) + plain;
            }})},
        '@theme/SearchMetadata': () => null,
        '@docusaurus/Link': React.forwardRef(({to, href, autoAddBaseUrl = true, children, ...props}, ref) => {
            const target = (to || href).replace(/^pathname:\/\//, '');
            const baseUrl = locale === 'en' ? '' : `/${locale}`;
            const destination = autoAddBaseUrl && target.startsWith('/') && !target.startsWith(`${baseUrl}/`)
                ? baseUrl + target : target;
            return React.createElement('a', {...props, ref, href: destination}, children);
        }),
        '@site/src/components/brand-theme/BrandThemeSwitcher': {BrandThemeSwitcher: () => null},
    };
    function load(file) {
        file = path.resolve(root, file);
        if (!path.extname(file) || !fs.existsSync(file)) {
            file = ['', '.ts', '.tsx', '.js', '.json'].map(extension => file + extension)
                .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        }
        if (file.endsWith('/src/utils/contentRoute.ts')) return imports['@site/src/utils/contentRoute'];
        if (cache.has(file)) return cache.get(file).exports;
        const module = {exports: {}};
        cache.set(file, module);
        const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {
            module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true,
        }});
        const resolve = name => {
            if (Object.hasOwn(imports, name)) return imports[name];
            if (name.endsWith('.scss')) return {};
            if (name.startsWith('@site/')) return load(name.slice(6));
            if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
            return require(name);
        };
        new Function('require', 'module', 'exports', outputText)(resolve, module, module.exports);
        return module.exports;
    }
    return load;
}

function metadata(locale, pathname, enabled = true, translatedPages) {
    const {default: SiteMetadata} = modules(locale, pathname, enabled, translatedPages)('src/components/ContentMetadata.tsx');
    return require('cheerio').load(renderToStaticMarkup(React.createElement(SiteMetadata)));
}

test('ordinary fallbacks retain the site language and expose English metadata', () => {
    for (const locale of ['ja','ko','ru']) for (const page of ['/', '/download/', '/community-report/']) {
        const $ = metadata(locale, `/${locale}${page}`);
        assert.equal($('html').attr('lang'), localeRegistry.find(record => record.code === locale).htmlLang);
        assert.equal($('link[rel="canonical"]').attr('href'), `https://doris.apache.org${page}`);
        assert.equal($('meta[property="og:url"]').attr('content'), `https://doris.apache.org${page}`);
        assert.equal($('meta[property="og:locale"]').attr('content'), 'en_US');
        assert.match($('meta[name="robots"]').attr('content'), /noindex/);
        assert.equal($('link[hreflang="ja"],link[hreflang="ko"]').length, 0);
    }
    for (const [locale, pathname, lang] of [['en','/','en-US']]) {
        const $ = metadata(locale, pathname);
        assert.equal($('html').attr('lang'), lang);
        assert.equal($('meta[name="robots"]').length, 0);
        assert.equal($('link[hreflang="ja"],link[hreflang="ko"]').length, 0);
    }
    assert.equal(modules('ko','/ko')('src/utils/localization.ts').defaultLocalePath('/ko'), '/');
});

test('translated pages keep their SEO while an untranslated Korean counterpart points to English', () => {
    const pathname = '/why-doris/compare/';
    const ja = metadata('ja', `/ja${pathname}`);
    assert.equal(ja('html').attr('lang'), 'ja');
    assert.equal(ja('meta[name="robots"]').length, 0);
    assert.equal(ja('link[rel="canonical"]').attr('href'), `https://doris.apache.org/ja${pathname}`);
    const ko = metadata('ko', `/ko${pathname}`);
    assert.equal(ko('html').attr('lang'), 'ko');
    assert.equal(ko('link[rel="canonical"]').attr('href'), `https://doris.apache.org${pathname}`);
    assert.match(ko('meta[name="robots"]').attr('content'), /noindex/);
    assert.equal(ko('link[hreflang="ko"]').length, 0);
    assert.equal(ko('link[hreflang="ja"]').attr('href'), `https://doris.apache.org/ja${pathname}`);
    const translated = metadata('ko', `/ko${pathname}`, true, {ja: pagePaths, ko: ['/why-doris/compare']});
    assert.equal(translated('html').attr('lang'), 'ko');
    assert.equal(translated('meta[name="robots"]').length, 0);
    assert.equal(translated('link[hreflang="ko"]').length, 1);
});

test('native page identification excludes documentation, search and generated error routes', () => {
    for (const pathname of ['/ko/docs/dev/guide/', '/ko/community/join-community/', '/ko/search/', '/ko/404.html']) {
        const routes = modules('ko', pathname)('src/utils/translation.ts').useTranslationRoutes();
        assert.equal(routes.pageFallback, false, pathname);
        assert.equal(metadata('ko', pathname)('html').attr('lang'), 'ko');
    }
    const disabled = metadata('en', '/', false);
    assert.equal(disabled('link[hreflang="ja"],link[hreflang="ko"]').length, 0);
});

test('Japanese content links retain the site language for translated and fallback pages', () => {
    const {localizedHomeLink, hasTranslatedPage} = modules('ja', '/')('src/utils/localization.ts');
    assert.equal(pagePaths.length, 7);
    for (const page of pagePaths) {
        assert(hasTranslatedPage(`${page}/`));
        assert(hasTranslatedPage(`/ja${page}/`));
        assert.equal(localizedHomeLink(`${page}?source=nav#tech`), `/ja${page}/?source=nav#tech`);
    }
    assert.equal(localizedHomeLink('/why-doris/users'), '/ja/why-doris/users/');
    assert.equal(localizedHomeLink('/blog'), '/ja/blog/');
    assert.equal(localizedHomeLink('/download'), '/ja/download/');
    assert.equal(localizedHomeLink('/docs/dev/key-features/inverted-index'), '/ja/docs/dev/key-features/inverted-index/');
});

test('English links stay unchanged and disabled Japanese pages are not advertised', () => {
    assert.equal(modules('en', '/')('src/utils/localization.ts').localizedHomeLink('/why-doris/compare'), '/why-doris/compare/');
    assert.equal(modules('en', '/', false)('src/utils/localization.ts').hasTranslatedPage('/why-doris/compare', 'ja'), false);
});

test('each translated page exposes English/Japanese alternates from either locale', () => {
    for (const page of pagePaths) {
        for (const locale of ['en', 'ja']) {
            const pathname = `${locale === 'ja' ? '/ja' : ''}${page}/`;
            const routes = modules(locale, pathname)('src/utils/translation.ts').useTranslationRoutes();
            assert.deepEqual(routes.group, {en: `${page}/`, ja: `/ja${page}/`});
        }
    }
});

test('page language controls preserve query/hash and mark the active language', () => {
    for (const locale of ['en', 'ja']) {
        const load = modules(locale, `${locale === 'ja' ? '/ja' : ''}/use-cases/ai/`);
        const {PageLanguageSwitcher} = load('src/components/home-next/PageLanguageSwitcher.tsx');
        const html = renderToStaticMarkup(React.createElement(PageLanguageSwitcher));
        assert.match(html, /href="\/use-cases\/ai\/\?from=test#tech"/);
        assert.match(html, /href="\/ja\/use-cases\/ai\/\?from=test#tech"/);
        assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
        assert.match(html, /English/);
        assert.match(html, /日本語/);
    }
});

test('fallback Chinese benchmark pages still offer English and available translations', () => {
    const {PageLanguageSwitcher} = modules('zh-CN', '/zh-CN/why-doris/benchmarks/')
        ('src/components/home-next/PageLanguageSwitcher.tsx');
    const html = renderToStaticMarkup(React.createElement(PageLanguageSwitcher));
    assert.match(html, /href="\/why-doris\/benchmarks\/\?from=test#tech"/);
    assert.match(html, /href="\/ja\/why-doris\/benchmarks\/\?from=test#tech"/);
    assert.match(html, /href="\/zh-CN\/why-doris\/benchmarks\//);
    assert.match(html, /aria-current="page"/);
});

test('desktop and mobile benchmark navigation retains the site language', () => {
    for (const locale of ['en', 'zh-CN', 'ja']) {
        const {NavbarNext} = modules(locale, `/${locale}/docs/4.x/getting-started/what-is-apache-doris/`)
            ('src/components/home-next/NavbarNext.tsx');
        const html = renderToStaticMarkup(React.createElement(NavbarNext));
        const prefix = locale === 'en' ? '' : '/' + locale;
        assert.equal((html.match(new RegExp('href="' + prefix + '/why-doris/benchmarks/"', 'g')) ?? []).length, 2, locale);
    }
});

test('language controls stay absent on untranslated pages and when Japanese is disabled', () => {
    for (const [locale, pathname, enabled] of [['en', '/download/', true], ['ja', '/ja/why-doris/users/', true], ['en', '/use-cases/ai/', false]]) {
        const {PageLanguageSwitcher} = modules(locale, pathname, enabled)('src/components/home-next/PageLanguageSwitcher.tsx');
        assert.equal(renderToStaticMarkup(React.createElement(PageLanguageSwitcher)), '');
    }
});

test('feature cards reuse Japanese document metadata and preserve English cards and routes', t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-feature-locale-'));
    t.after(() => fs.rmSync(fixture, {recursive: true, force: true}));
    function write(file, content) {
        const target = path.join(fixture, file);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, content);
    }
    write('docs/key-features/search.mdx', '---\ntitle: Search\ndescription: Search data\nfeatureCard:\n  tags: [search]\n---\n');
    write('i18n/ja/docusaurus-plugin-content-docs/current/key-features/search.mdx', '---\ntitle: 検索\ndescription: データを検索\n---\n');
    write('i18n/zh-CN/code.json', JSON.stringify({
        'marketing.features.cards.key-features-search.title': {message: '全文检索'},
        'marketing.features.cards.key-features-search.description': {message: '使用 SQL 搜索数据'},
    }));
    generate({rootDir: fixture});
    const file = path.join(fixture, 'src/generated/key-features.ts');
    const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}});
    const module = {exports: {}};
    new Function('exports', outputText)(module.exports);
    const {keyFeatureCards, localizedKeyFeatureCards} = module.exports;
    assert.equal(keyFeatureCards[0].title, 'Search');
    assert.equal(localizedKeyFeatureCards['zh-CN'][0].title, '全文检索');
    assert.equal(localizedKeyFeatureCards['zh-CN'][0].description, '使用 SQL 搜索数据');
    assert.equal(localizedKeyFeatureCards['zh-CN'][0].href, keyFeatureCards[0].href);
    assert.equal(localizedKeyFeatureCards.ja[0].title, '検索');
    assert.equal(localizedKeyFeatureCards.ja[0].description, 'データを検索');
    assert.equal(localizedKeyFeatureCards.ja[0].href, keyFeatureCards[0].href);
    write('i18n/zh-CN/code.json', '{}');
    assert.throws(() => generate({rootDir: fixture}), /Missing Chinese feature summary: key-features-search/);
});

test('every marketing translation exists and retains interpolation placeholders', () => {
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'i18n/ja/code.json'), 'utf8'));
    let checked = 0;
    for (const directory of ['src/components/why-doris-next', 'src/components/use-cases-next']) {
        const files = fs.readdirSync(path.join(root, directory), {recursive: true})
            .filter(file => /\.tsx?$/.test(file));
        for (const file of files) {
            const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, directory, file), 'utf8'),
                ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
            function visit(node) {
                if (ts.isCallExpression(node) && node.expression.getText(source) === 'translate') {
                    const options = node.arguments[0];
                    if (options && ts.isObjectLiteralExpression(options)) {
                        const value = key => options.properties.find(property => property.name?.getText(source) === key)?.initializer?.text;
                        const id = value('id');
                        if (id?.startsWith('marketing.')) {
                            assert.equal(typeof dictionary[id]?.message, 'string', id);
                            assert.deepEqual(placeholders(dictionary[id].message), placeholders(value('message')), id);
                            checked++;
                        }
                    }
                }
                ts.forEachChild(node, visit);
            }
            visit(source);
        }
    }
    assert(checked > 0);
    assert.match(dictionary['marketing.features.hero'].message, /\{doris\}.*\{lineBreak\}/);
    assert.match(dictionary['marketing.features.noResults'].message, /\{query\}.*\{clear\}/);
});

test('global navigation has complete localized messages', () => {
    const source = ts.createSourceFile('NavbarNext.tsx', fs.readFileSync(path.join(root,
        'src/components/home-next/NavbarNext.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const locale of Object.keys(registered)) {
        const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'i18n', locale, 'code.json'), 'utf8'));
        function visit(node) {
            if (ts.isCallExpression(node) && node.expression.getText(source) === 'translate') {
                const options = node.arguments[0];
                if (options && ts.isObjectLiteralExpression(options)) {
                    const value = key => options.properties.find(property => property.name?.getText(source) === key)?.initializer?.text;
                    const id = value('id'), message = value('message');
                    assert.equal(typeof dictionary[id]?.message, 'string', `${locale} ${id}`);
                    assert.deepEqual(placeholders(dictionary[id].message), placeholders(message), `${locale} ${id}`);
                }
            }
            ts.forEachChild(node, visit);
        }
        visit(source);
    }
});

test('the Slack community prompt is localized in every target locale', () => {
    const file = 'src/components/home-next/SlackCommunityNudge.tsx';
    const source = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'),
        ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const ids = [];
    function visit(node) {
        const options = ts.isCallExpression(node) && node.expression.getText(source) === 'translate' && node.arguments[0];
        if (options && ts.isObjectLiteralExpression(options)) {
            ids.push(options.properties.find(property => property.name?.getText(source) === 'id').initializer.text);
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
    assert(ids.length > 0);
    for (const {code} of localeRegistry) {
        const dictionaryFile = path.join(root, 'i18n', code, 'code.json');
        if (!fs.existsSync(dictionaryFile)) continue;
        const dictionary = JSON.parse(fs.readFileSync(dictionaryFile, 'utf8'));
        assert.deepEqual(ids.filter(id => !dictionary[id]?.message), [], code);
    }
});

test('every registered translated page carries each of its marketing messages', () => {
    for (const [locale, pages] of Object.entries(registered)) {
        const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'i18n', locale, 'code.json'), 'utf8'));
        for (const page of pages) {
            const messages = pageMessages(page);
            assert(messages.size > 0, `${locale} ${page}`);
            for (const [id, message] of messages) {
                assert.equal(typeof dictionary[id]?.message, 'string', `${locale} ${page} ${id}`);
                assert.deepEqual(placeholders(dictionary[id].message), placeholders(message), `${locale} ${id}`);
            }
        }
    }
});

test('registered pages link every locale that translated them, from each of those locales', () => {
    for (const page of new Set(Object.values(registered).flat())) {
        const group = {en: `${page}/`, ...Object.fromEntries(Object.keys(registered)
            .filter(locale => registered[locale].includes(page)).map(locale => [locale, `/${locale}${page}/`]))};
        for (const [locale, pathname] of Object.entries(group)) {
            const load = modules(locale, pathname, true, registered);
            assert.deepEqual(load('src/utils/translation.ts').useTranslationRoutes().group, group, `${locale} ${page}`);
            const html = renderToStaticMarkup(React.createElement(load('src/components/home-next/PageLanguageSwitcher.tsx').PageLanguageSwitcher));
            for (const target of Object.values(group)) assert(html.includes(`href="${target}?from=test#tech"`), `${locale} ${page} ${target}`);
            assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1, `${locale} ${page}`);
        }
    }
});
