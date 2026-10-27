const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const {createFixture} = require('./fixtures/multi-locale.cjs');
const {collect, validateScope} = require('../inventory.cjs');
const {contextsFor, groupFor, localizedPages, indexGroups, localizedOptions} = require('../search-plugin.cjs');

test('a future native version joins language routes and search while paused versions stay published and old versions fall back', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-lifecycle-'));
    t.after(() => fs.rmSync(root, {recursive: true, force: true}));
    const environment = {...process.env};
    t.after(() => {
        for (const key of Object.keys(process.env)) if (!(key in environment)) delete process.env[key];
        Object.assign(process.env, environment);
    });
    const {write} = await createFixture(root);
    const newVersions = ['5.x', '3.x', '2.1'];
    for (const version of newVersions) {
        fs.cpSync(path.join(root, 'versioned_docs/version-4.x'), path.join(root, `versioned_docs/version-${version}`), {recursive: true});
        write(`versioned_sidebars/version-${version}-sidebars.json`, '{}');
        for (const locale of ['zh-CN', 'ja', 'ko', 'ru']) fs.cpSync(
            path.join(root, `i18n/${locale}/docusaurus-plugin-content-docs/version-4.x`),
            path.join(root, `i18n/${locale}/docusaurus-plugin-content-docs/version-${version}`), {recursive: true});
    }
    write('versions.json', JSON.stringify(['5.x', '4.x', '3.x', '2.1']));
    const groups = [
        {id: 'DEV', pluginId: 'default', version: 'current', sourceRoot: 'docs'},
        {id: '5X', pluginId: 'default', version: '5.x', sourceRoot: 'versioned_docs/version-5.x'},
        {id: '4X', pluginId: 'default', version: '4.x', sourceRoot: 'versioned_docs/version-4.x'},
        {id: 'COMMUNITY', pluginId: 'community', version: 'current', sourceRoot: 'community'},
    ];
    for (const locale of ['ja', 'ko', 'ru']) {
        const file = `translations/state/${locale}/docs.json`;
        const state = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
        const previous = state.pages.filter(page => page.version === '4.x');
        state.pages.push(...newVersions.flatMap(version => previous.map(page => ({...page, version,
            sourcePath: page.sourcePath.replace('version-4.x/', `version-${version}/`),
            targetPath: page.targetPath.replace('version-4.x/', `version-${version}/`)}))));
        write(file, JSON.stringify(state));
        // Retiring automatic maintenance retains registration, targets and URLs.
        write(`translations/scope/${locale}.json`, JSON.stringify({schemaVersion: 1, locale,
            groups, automaticGroups: ['DEV', '5X', 'COMMUNITY'], maxBatchPages: 20, retainEnglish: []}));
    }
    const config = fs.readFileSync(path.join(root, 'docusaurus.config.js'), 'utf8')
        .replace("lastVersion:'4.x'", "lastVersion:'5.x'")
        .replace("versions:{current:{path:'dev'},", "versions:{current:{path:'dev'},'5.x':{path:'5.x'},");
    write('docusaurus.config.js', config);
    const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../../src/utils/localizedRoute.ts'), 'utf8'),
        {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
    const module = {exports: {}};
    new Function('module', 'exports', code)(module, module.exports);
    const {resolveLocalizedRoute} = module.exports;
    const sidebarCode = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../../src/utils/docs-sidebar-scope.ts'), 'utf8'),
        {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText;
    const sidebarModule = {exports: {}};
    new Function('require', 'module', 'exports', sidebarCode)(name => {
        if (name === '@site/versions.json') return JSON.parse(fs.readFileSync(path.join(root, 'versions.json'), 'utf8'));
        if (name === '@site/scripts/i18n/docs-language-policy.cjs') return require('../docs-language-policy.cjs');
        assert.equal(name, '@docusaurus/plugin-content-docs/client');
        return {};
    }, sidebarModule, sidebarModule.exports);
    for (const version of ['current', '5.x', '4.x']) assert.equal(sidebarModule.exports.supportsDocsDomainNavigation('default', version), true);
    for (const version of ['3.x', '2.1', '6.x', undefined]) assert.equal(sidebarModule.exports.supportsDocsDomainNavigation('default', version), false);
    assert.equal(sidebarModule.exports.supportsDocsDomainNavigation('community', 'current'), true);
    const contexts = contextsFor(root);
    assert.deepEqual(contexts, ['docs/dev', 'docs/5.x', 'docs/4.x', 'community', 'course', 'releases']);
    for (const locale of ['ja', 'ko', 'ru']) {
        process.env.I18N_LOCALE = locale;
        const scope = JSON.parse(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`), 'utf8'));
        validateScope(scope, locale);
        validateScope({...scope, automaticGroups: []}, locale);
        for (const version of ['3.x', '2.1']) assert.throws(() => validateScope({...scope,
            groups: [...groups, {id: 'OLD', pluginId: 'default', version, sourceRoot: `versioned_docs/version-${version}`}]}, locale), /English\/Chinese only/);
        const native = await collect(root);
        const find = version => native.pages.find(page => page.pluginId === 'default' && page.version === version && page.docId === 'shared');
        const future = find('5.x');
        const retired = find('4.x');
        assert.equal(future.status, 'current');
        assert.equal(retired.status, 'current');
        assert.equal(retired.useTarget, true);
        assert.equal(retired.permalink, `/${locale}/docs/4.x/english-shared/`);
        assert.equal(groupFor(future), 'docs/5.x');
        assert.equal(groupFor(retired), 'docs/4.x');
        assert.equal(future.permalink, `/${locale}/docs/5.x/english-shared/`);
        for (const version of ['3.x', '2.1']) {
            const old = find(version);
            assert.equal(old.status, 'unsupported_translation_version');
            assert.equal(old.contentLocale, 'en');
            assert.equal(old.useTarget, false);
            assert.equal(old.indexable, false);
            assert.equal(groupFor(old), null);
            assert.deepEqual(Object.keys(old.alternates).sort(), ['en', 'zh-CN']);
        }
        const routes = [{contentId: 'docs:default:5.x:shared', navigationRoutes: future.alternates}];
        for (const language of ['en', 'zh-CN', 'ja', 'ko', 'ru']) {
            const result = resolveLocalizedRoute({href: future.permalink + '?from=upgrade#usage', locale: language,
                switchLocale: true, currentUrl: future.permalink, routes,
                options: {url: 'https://doris.apache.org', baseUrl: '/', defaultLocale: 'en',
                    locales: ['en', 'zh-CN', 'ja', 'ko', 'ru'], trailingSlash: true}});
            assert.equal(result.href, future.alternates[language] + '?from=upgrade#usage');
        }
        const selected = localizedPages([{name: 'docusaurus-plugin-content-docs',
            content: {translationManifest: {pages: native.pages}}}], locale, contexts);
        assert.equal(selected.get(future.permalink.replace(/\/$/, '')), 'docs/5.x');
        assert.equal(selected.get(retired.permalink.replace(/\/$/, '')), 'docs/4.x');
        const indexes = indexGroups([[{u: future.permalink}, {u: retired.permalink}]], selected, contexts);
        assert.equal(indexes.get('docs/5.x')[0][0].u, future.permalink);
        assert.equal(indexes.get('docs/4.x')[0][0].u, retired.permalink);
        assert.deepEqual(indexes.get(''), [[]]);
        const options = localizedOptions({}, locale, {'docs/5.x': `${locale} 5.x`}, contexts);
        assert.equal(options.searchContextByPaths.find(item => item.path === 'docs/5.x').label[locale], `${locale} 5.x`);
    }
});
