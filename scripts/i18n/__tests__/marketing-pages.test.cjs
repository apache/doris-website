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

function modules(locale, pathname, enabled = true) {
    const cache = new Map();
    const i18n = {currentLocale: locale, defaultLocale: 'en', locales: enabled ? ['en', 'zh-CN', 'ja'] : ['en', 'zh-CN'],
        localeConfigs: Object.fromEntries(localeRegistry.map(record => [record.code, record]))};
    const location = {pathname, search: '?from=test', hash: '#tech'};
    const imports = {
        '@generated/i18n': i18n,
        '@generated/docusaurus.config': {baseUrl: locale === 'en' ? '/' : `/${locale}/`,
            customFields: {defaultLocalePageLocales: ['ja'], translatedPagePaths: enabled ? {ja: pagePaths} : {}}},
        '@docusaurus/Translate': {translate: ({message}) => message},
        '@docusaurus/useDocusaurusContext': () => ({i18n}),
        '@docusaurus/useBaseUrl': source => source,
        '@docusaurus/useGlobalData': () => ({}),
        '@docusaurus/router': {useLocation: () => location},
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

test('Japanese links retain translated pages and suffixes while other ordinary pages use English', () => {
    const {localizedHomeLink, hasTranslatedPage} = modules('ja', '/')('src/utils/localization.ts');
    assert.equal(pagePaths.length, 7);
    for (const page of pagePaths) {
        assert(hasTranslatedPage(`${page}/`));
        assert(hasTranslatedPage(`/ja${page}/`));
        assert.equal(localizedHomeLink(`${page}?source=nav#tech`), `${page}?source=nav#tech`);
    }
    assert.equal(localizedHomeLink('/why-doris/users'), 'pathname:///why-doris/users');
    assert.equal(localizedHomeLink('/blog'), 'pathname:///blog');
    assert.equal(localizedHomeLink('/download'), 'pathname:///download');
    assert.equal(localizedHomeLink('/docs/dev/key-features/inverted-index'), '/docs/dev/key-features/inverted-index');
});

test('English links stay unchanged and disabled Japanese pages are not advertised', () => {
    assert.equal(modules('en', '/')('src/utils/localization.ts').localizedHomeLink('/why-doris/compare'), '/why-doris/compare');
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
    assert.doesNotMatch(html, /href="\/zh-CN\//);
    assert.doesNotMatch(html, /aria-current="page"/);
});

test('desktop and mobile benchmark navigation always enters the English page', () => {
    for (const locale of ['en', 'zh-CN', 'ja']) {
        const {NavbarNext} = modules(locale, `/${locale}/docs/4.x/getting-started/what-is-apache-doris/`)
            ('src/components/home-next/NavbarNext.tsx');
        const html = renderToStaticMarkup(React.createElement(NavbarNext));
        assert.equal((html.match(/href="\/why-doris\/benchmarks"/g) ?? []).length, 2, locale);
        assert.doesNotMatch(html, /href="\/(zh-CN|ja)\/why-doris\/benchmarks/);
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
    generate({rootDir: fixture});
    const file = path.join(fixture, 'src/generated/key-features.ts');
    const {outputText} = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}});
    const module = {exports: {}};
    new Function('exports', outputText)(module.exports);
    const {keyFeatureCards, localizedKeyFeatureCards} = module.exports;
    assert.equal(keyFeatureCards[0].title, 'Search');
    assert.equal(localizedKeyFeatureCards.ja[0].title, '検索');
    assert.equal(localizedKeyFeatureCards.ja[0].description, 'データを検索');
    assert.equal(localizedKeyFeatureCards.ja[0].href, keyFeatureCards[0].href);
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
                            const placeholders = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort();
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

test('Japanese page translations leave global navigation in English', () => {
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, 'i18n/ja/code.json'), 'utf8'));
    const source = ts.createSourceFile('NavbarNext.tsx', fs.readFileSync(path.join(root,
        'src/components/home-next/NavbarNext.tsx'), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === 'translate') {
            const options = node.arguments[0];
            if (options && ts.isObjectLiteralExpression(options)) {
                const value = key => options.properties.find(property => property.name?.getText(source) === key)?.initializer?.text;
                const id = value('id'), message = value('message');
                assert.equal(dictionary[id]?.message ?? message, message, id);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
});
