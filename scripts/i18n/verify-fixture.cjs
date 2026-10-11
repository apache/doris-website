// Build a small, real Docusaurus site to exercise stale content, metadata and
// orphan routing without changing any document in the working tree.
const fs = require('node:fs/promises');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const assert = require('node:assert/strict');
const {hash} = require('./state.cjs');
const {structure} = require('./structure.cjs');
const {verify} = require('./verify-static.cjs');
const root = path.resolve(__dirname, '../..');
const fixture = path.join(root, '.i18n-build/fixture');
const sourceBase = '---\ntitle: Example\nlast_update:\n  date: 2026-01-01\n---\n## Usage\n\nUse Doris.\n\n```sql\nSELECT 1;\n```\n\n[Current translation](./machine.md)\n';
const japanese = sourceBase.replace('title: Example', 'title: 例').replace('## Usage', '## 使用方法')
    .replace('Use Doris.', 'Doris を使用します。').replace('date: 2026-01-01', 'date: 2026-10-11');

async function write(file, content) {
    await fs.mkdir(path.dirname(path.join(fixture, file)), {recursive: true});
    await fs.writeFile(path.join(fixture, file), content);
}

async function verifyBrowser(site) {
    const http = require('node:http');
    const {chromium} = require('playwright');
    const server = http.createServer(async (request, response) => {
        try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
            const file = path.join(site, pathname, path.extname(pathname) ? '' : 'index.html');
            response.setHeader('Content-Type', {'.js':'application/javascript', '.css':'text/css', '.html':'text/html; charset=utf-8'}[path.extname(file)] ?? 'application/octet-stream');
            response.end(await fs.readFile(file));
        } catch { response.writeHead(404); response.end('Not found'); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless:true});
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const origin = `http://127.0.0.1:${server.address().port}`;
        await page.goto(origin + '/ja/docs/dev/technical/?from=fixture#usage', {waitUntil:'networkidle'});
        assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), 'en');
        assert.equal((await page.locator('.theme-doc-markdown pre code').textContent()).trim(), 'SELECT 2;');
        assert.equal(await page.locator('[data-translation-status] a[hreflang="en"]').getAttribute('href'), '/docs/dev/technical/?from=fixture#usage');
        await page.locator('.theme-doc-markdown a[href="/ja/docs/dev/machine/"]').click();
        await page.waitForSelector('[data-translation-status="current"]');
        assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), 'ja');
        await page.waitForFunction(() => !document.querySelector('meta[name="robots"]'));
        assert.equal(await page.locator('meta[name="robots"]').count(), 0);
        await page.goBack();
        await page.waitForSelector('[data-translation-status="stale_technical"]');
        await page.waitForFunction(() => document.querySelector('link[rel="canonical"]').getAttribute('href') === 'https://doris.apache.org/docs/dev/technical/');
        assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), 'en');
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://doris.apache.org/docs/dev/technical/');
        assert((await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
        await page.reload({waitUntil:'networkidle'});
        assert.equal(await page.locator('[data-translation-status]').getAttribute('data-translation-status'), 'stale_technical');
        for (const [docId, status, language] of [['prose','stale_prose','ja'], ['human','current','ja'], ['unverified','unverified','en']]) {
            await page.goto(origin + `/ja/docs/dev/${docId}/`, {waitUntil:'networkidle'});
            assert.equal(await page.locator('[data-translation-status]').getAttribute('data-translation-status'), status);
            assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), language);
        }
        assert.deepEqual(errors, []);
        return {passed:true, checks:['latest stale SQL', 'SPA fallback-to-translation', 'back', 'refresh', 'query/hash English link', 'prose/human/unverified hydration']};
    } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
async function main() {
    await fs.rm(fixture, {recursive: true, force: true});
    await fs.mkdir(fixture, {recursive: true});
    await fs.symlink(path.join(root, 'node_modules'), path.join(fixture, 'node_modules'));
    const pages = [];
    for (const name of ['untranslated', 'machine', 'human', 'unverified', 'prose', 'technical', 'unknown',
        'modified', 'heading', 'bad-metadata', 'deleted', 'chinese-source']) {
        const sourcePath = `docs/${name}.md`;
        const targetPath = `i18n/ja/docusaurus-plugin-content-docs/current/${name}.md`;
        const source = name === 'chinese-source' ? sourceBase.replace('Use Doris.', '使用 Doris。') : sourceBase;
        const sourceLocale = name === 'chinese-source' ? 'zh-CN' : 'en';
        const record = {pluginId: 'default', version: 'current', docId: name, locale: 'ja', sourceLocale,
            sourcePath: sourceLocale === 'en' ? sourcePath : `i18n/zh-CN/docusaurus-plugin-content-docs/current/${name}.md`,
            targetPath, sourceCommit: 'a'.repeat(40), sourceHash: hash(source),
            sourceTechnicalHash: (await structure(source, '.md')).technicalHash, targetHash: hash(japanese),
            reviewStatus: name === 'human' ? 'human' : 'machine', ownership: name === 'human' ? 'human' : 'machine',
            translatedAt: '2026-10-11T19:57:11Z', glossaryVersion: '0'};
        if (name !== 'deleted') await write(sourcePath, name === 'technical' ? sourceBase.replace('SELECT 1', 'SELECT 2')
            : ['prose', 'unknown'].includes(name) ? sourceBase.replace('Use Doris.', 'Try Doris.') : sourceBase);
        if (name !== 'deleted') await write(`i18n/zh-CN/docusaurus-plugin-content-docs/current/${name}.md`,
            name === 'machine' ? source.replace('title: Example', 'title: Example\nslug: /localized-machine') : source);
        if (name !== 'untranslated') await write(targetPath, name === 'modified' ? japanese + '\n手動編集\n'
            : name === 'heading' ? japanese.replace('## 使用方法\n', '')
            : name === 'bad-metadata' ? japanese.replace('title: 例', 'id: invalid/id\ntitle: 例') : japanese);
        if (name === 'heading') record.targetHash = hash(japanese.replace('## 使用方法\n', ''));
        if (name === 'bad-metadata') record.targetHash = hash(japanese.replace('title: 例', 'id: invalid/id\ntitle: 例'));
        if (name === 'prose') record.safeSourceChange = {kind: 'prose', fromSourceHash: record.sourceHash,
            toSourceHash: hash(sourceBase.replace('Use Doris.', 'Try Doris.')), targetHash: record.targetHash,
            reviewedBy: 'fixture-reviewer', reviewedAt: '2026-10-11T20:00:00Z'};
        if (!['untranslated', 'unverified'].includes(name)) pages.push(record);
    }
    await write('i18n/zh-CN/docusaurus-plugin-content-docs/current/chinese-only.md', sourceBase);
    await write('versions.json', '["4.x"]\n');
    await write('versioned_docs/version-4.x/machine.md', sourceBase.replace('SELECT 1', 'SELECT 4'));
    await write('versioned_sidebars/version-4.x-sidebars.json', '{}\n');
    await write('i18n/ja/docusaurus-plugin-content-docs/version-4.x/machine.md', japanese);
    pages.push({...pages.find(page => page.docId === 'machine'), version: '4.x',
        sourcePath: 'versioned_docs/version-4.x/machine.md', targetPath: 'i18n/ja/docusaurus-plugin-content-docs/version-4.x/machine.md'});
    await write('community/machine.md', sourceBase);
    await write('i18n/ja/docusaurus-plugin-content-docs-community/current/machine.md', japanese);
    pages.push({...pages.find(page => page.docId === 'machine'), pluginId: 'community',
        sourcePath: 'community/machine.md', targetPath: 'i18n/ja/docusaurus-plugin-content-docs-community/current/machine.md'});
    await write('translations/config.json', JSON.stringify({schemaVersion: 1, locales: {ja: {sourceLocale: 'en',
        sourceOverrides: ['chinese-source', 'chinese-only'].map(docId => ({pluginId: 'default', version: 'current', docId, sourceLocale: 'zh-CN'}))}}}));
    await write('translations/state/ja/docs.json', JSON.stringify({schemaVersion: 1, pages}, null, 2));
    // Reuse the production components, including the single alternate emitter.
    for (const file of ['src/utils/translation.ts', 'src/utils/japanese.ts', 'src/theme/SiteMetadata/index.tsx',
        'src/theme/DocItem/Metadata/index.tsx', 'src/theme/DocItem/Content/index.tsx',
        'src/theme/DocItem/Layout/TranslationStatus.tsx', 'src/theme/DocItem/Layout/JapaneseFallback.module.css']) {
        await write(file, await fs.readFile(path.join(root, file), 'utf8'));
    }
    await write('src/theme/DocItem/Layout/index.tsx', `import React from 'react';
import Original from '@theme-original/DocItem/Layout';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {docTranslation} from '@site/src/utils/translation';
import TranslationStatus from './TranslationStatus';
export default function Layout(props) {
 const state = docTranslation(useDoc().metadata);
 return <>{state && <TranslationStatus state={state}/>}<Original {...props}/></>;
}\n`);
    await write('src/pages/index.tsx', "import React from 'react'; export default function Home(){return <main>Fixture</main>;}\n");
    await write('docusaurus.config.js', `module.exports = {
 title: 'Fixture', url: 'https://doris.apache.org', baseUrl: '/', trailingSlash: true,
 i18n: {defaultLocale: 'en', locales: ['en','zh-CN','ja'], localeConfigs: {
 en: {htmlLang:'en-US'}, 'zh-CN': {htmlLang:'zh-Hans-CN'}, ja:{htmlLang:'ja'}}},
 plugins: [[require(${JSON.stringify(path.join(root, 'scripts/i18n/docs-plugin.cjs'))}), {
 path:'docs', sidebarPath:false, lastVersion:'4.x', versions:{current:{path:'dev'},'4.x':{path:'4.x'}},showLastUpdateTime:true}],
 [require(${JSON.stringify(path.join(root, 'scripts/i18n/docs-plugin.cjs'))}), {id:'community', path:'community', routeBasePath:'community',sidebarPath:false}],
 require(${JSON.stringify(path.join(root, 'scripts/i18n/status-plugin.cjs'))}),
 function fixtureCache(){return {name:'fixture-cache',configureWebpack:()=>({cache:false})}}],
 presets: [['classic',{docs:false,blog:false}]],
};\n`);
    const result = spawnSync(process.execPath, [path.join(root, 'node_modules/@docusaurus/core/bin/docusaurus.mjs'),
        'build', fixture, '--locale', 'en', '--locale', 'zh-CN', '--locale', 'ja'], {stdio: 'inherit',
        env: {...process.env, NODE_OPTIONS: '--max-old-space-size=4096'}});
    assert.equal(result.status, 0, 'Docusaurus fixture build failed');
    const manifest = path.join(fixture, '.i18n-build/manifests/ja.json');
    const verification = verify({site: path.join(fixture, 'build'), manifest});
    const data = JSON.parse(await fs.readFile(manifest, 'utf8'));
    const stateFor = (docId, version = 'current', pluginId = 'default') => data.pages.find(page => page.docId === docId && page.version === version && page.pluginId === pluginId);
    for (const [name, status] of Object.entries({untranslated:'untranslated',machine:'current',human:'current',unverified:'unverified',
        prose:'stale_prose', technical:'stale_technical',unknown:'stale_unknown',modified:'target_modified',heading:'heading_conflict',
        'bad-metadata':'state_conflict','chinese-source':'current'})) {
        assert.equal(stateFor(name).status, status);
    }
    assert.equal(stateFor('machine','4.x').status, 'stale_technical');
    assert.equal(stateFor('machine','current','community').status, 'current');
    assert(data.reports.some(report => report.kind === 'source_deleted' && report.docId === 'deleted'));
    assert(data.reports.some(report => report.kind === 'unsupported_source_route' && report.sourcePath.endsWith('chinese-only.md')));
    await assert.rejects(fs.access(path.join(fixture, 'build/ja/docs/dev/deleted/index.html')));
    await assert.rejects(fs.access(path.join(fixture, 'build/ja/docs/dev/chinese-only/index.html')));
    const html = await fs.readFile(path.join(fixture, 'build/ja/docs/dev/technical/index.html'), 'utf8');
    const $ = require('cheerio').load(html);
    assert.equal($('.theme-doc-markdown pre code').text().trim(), 'SELECT 2;', 'Latest SQL not rendered');
    const metadataDir = path.join(fixture, '.docusaurus/docusaurus-plugin-content-docs/default');
    const metadata = await Promise.all((await fs.readdir(metadataDir)).filter(file => file.endsWith('.json'))
        .map(async file => JSON.parse(await fs.readFile(path.join(metadataDir, file), 'utf8'))));
    const machine = metadata.find(doc => doc.id === 'machine' && doc.version === 'current' && doc.translation);
    assert.equal(machine.lastUpdatedAt, new Date('2026-01-01').getTime(), 'Translation date replaced source content date');
    assert.equal(machine.translation.translatedAt, '2026-10-11T19:57:11Z');
    assert.equal(hash(await fs.readFile(path.join(fixture, 'i18n/ja/docusaurus-plugin-content-docs/current/technical.md'), 'utf8')), hash(japanese));
    const browser = process.argv.includes('--browser') ? await verifyBrowser(path.join(fixture, 'build')) : undefined;
    console.log(JSON.stringify({fixture, ...verification, browser}, null, 2));
}
if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {verifyBrowser};
