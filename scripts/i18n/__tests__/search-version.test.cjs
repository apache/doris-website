const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const {processDocInfos} = require('@yang1666204/docusaurus-search-local/dist/server/server/utils/processDocInfos');
const source = fs.readFileSync(path.resolve(__dirname, '../../../src/utils/searchVersion.js'), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}});
const compiled = {exports: {}};
new Function('exports', outputText)(compiled.exports);
const {searchIndexBaseUrl} = compiled.exports;

for (const locale of ['en', 'zh-CN']) for (const devOnly of [true, false]) {
    test(`source search matches native index placement: ${locale}, devOnly=${devOnly}`, () => {
        const baseUrl = locale === 'en' ? '/' : `/${locale}/`;
        const outDir = path.join('/artifact', locale === 'en' ? '' : locale);
        const versions = [{name: 'current', path: `${baseUrl}docs/dev`, isLast: devOnly},
            ...(!devOnly ? [{name: '4.x', path: `${baseUrl}docs/4.x`, isLast: true}] : [])];
        const loadedVersions = versions.map(version => ({...version, docs: [{permalink: `${version.path}/intro/`}]}));
        const native = processDocInfos({baseUrl, outDir, siteConfig: {trailingSlash: true},
            routesPaths: loadedVersions.flatMap(version => version.docs.map(doc => doc.permalink)),
            plugins: [{name: 'docusaurus-plugin-content-docs', content: {loadedVersions}}]},
        {indexDocs: true, indexBlog: false, indexPages: false, docsRouteBasePath: ['docs']});
        for (const version of versions) {
            const pathname = `${version.path}/intro/`;
            const entry = native.find(item => item.paths.some(doc => doc.url === pathname));
            assert(entry, pathname);
            const relative = path.relative('/artifact', entry.outDir).split(path.sep).join('/');
            const expected = relative ? `/${relative}/` : '/';
            assert.equal(searchIndexBaseUrl(baseUrl, versions, {pathname}), expected);
            assert.equal(searchIndexBaseUrl(baseUrl, versions, {versionPath: version.path.slice(baseUrl.length) + '/'}), expected);
        }
    });
}

test('native last-version metadata overrides the static default, including nested base URLs', () => {
    const base = '/site/zh-CN/';
    const versions = [{path: `${base}docs/dev`, isLast: true}, {path: `${base}docs/4.x`, isLast: false}];
    assert.equal(searchIndexBaseUrl(base, versions, {pathname: `${base}docs/dev/topic/`}), base);
    assert.equal(searchIndexBaseUrl(base, versions, {versionPath: 'docs/4.x/'}), `${base}docs/4.x/`);
    assert.equal(searchIndexBaseUrl(base, versions, {pathname: `${base}community/topic/`}), base);
    assert.equal(searchIndexBaseUrl(base, versions, {versionPath: 'docs/unknown/'}), base);
    assert.equal(searchIndexBaseUrl(base, [], {versionPath: ''}), base);
    assert.equal(searchIndexBaseUrl(base, versions, {pathname: `${base}docs/devish/topic/`}), base);
});
