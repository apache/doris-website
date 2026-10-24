// Real sequential builds: five languages, then Russian disabled. The manifests
// come from plugin loadContent output, never from hand-written result JSON.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {spawnSync, execFileSync} = require('node:child_process');
const {hash} = require('./state.cjs');
const cheerio = require('cheerio');
const {createContentFixture} = require('./__tests__/fixtures/content-manifest.cjs');
const {validateManifest, sourceSha, routeData} = require('./content-manifest.cjs');
const {verifyContent} = require('./verify-global-language.cjs');
const {verify: verifyStatic} = require('./verify-static.cjs');
const root = path.resolve(__dirname, '../..');
async function main() {
    const implementation = () => ({sha: sourceSha(root), trackedDiffHash: hash(execFileSync('git', ['diff', 'HEAD', '--binary'], {cwd: root, encoding: 'utf8'}))});
    const initialImplementation = implementation();
    const results = [];
    for (const disabled of [false, true]) {
        const fixture = path.join(root, '.i18n-build', disabled ? 'content-disabled-fixture' : 'content-fixture');
        await fs.rm(fixture, {recursive: true, force: true});
        await createContentFixture(fixture);
        const result = spawnSync(process.execPath, [path.join(root, 'scripts/build-locales.cjs'), '--site-dir', fixture],
            {stdio: 'inherit', env: {...process.env, FIXTURE_DISABLE_RU: disabled ? 'true' : '', NODE_OPTIONS: '--max-old-space-size=4096'}});
        assert.equal(result.status, 0, 'Content fixture build failed');
        const locales = ['en', 'zh-CN', 'ja', 'ko', ...(disabled ? [] : ['ru'])];
        const manifests = [];
        for (const locale of locales) {
            const manifest = validateManifest(JSON.parse(await fs.readFile(path.join(fixture, '.i18n-build/content-manifests', locale + '.json'), 'utf8')));
            assert.equal(manifest.sourceSha, sourceSha(fixture));
            let checked = 0;
            for (const page of manifest.pages) {
                for (const route of Object.values(page.navigationRoutes)) await fs.access(path.join(fixture, 'build', decodeURIComponent(route), 'index.html'));
                if (disabled) assert(!page.navigationRoutes.ru && !page.availableTranslations.includes('ru'));
                const html = await fs.readFile(path.join(fixture, 'build', decodeURIComponent(page.route), 'index.html'), 'utf8');
                const $ = cheerio.load(html);
                if (page.kind === 'docs') assert.equal($('.theme-doc-markdown').attr('lang'), page.contentLocale);
                if (page.contentId.startsWith('page:sample-')) {
                    const i = page.contentId.slice(-1);
                    assert($('main').text().includes(page.fallback || locale === 'en' ? `English sample ${i}` : `${locale} translated sample ${i}`));
                }
                if (page.kind === 'blog') {
                    const i = page.contentId.match(/01-0(\d)/)[1] - 1;
                    assert($('article').text().includes(page.fallback || locale === 'en' ? `English article ${i}` : `${locale} translated article ${i}`));
                }
                if (page.contentId === 'page:blocked') {
                    assert.equal(page.state, locale === 'en' ? 'source' : 'blocked');
                    assert($('main').text().includes('English blocked body'));
                    assert(!$('main').text().includes('blocked target'));
                }
                checked++;
            }
            const sizes = JSON.parse(await fs.readFile(path.join(fixture, '.i18n-build/content-manifests', locale + '.sizes.json'), 'utf8'));
            assert(sizes.maxRouteBytes < 2048);
            assert.equal(sizes.clientGlobalBytesAdded, 0);
            const first = manifest.pages.find(page => page.contentId === 'blog:2026-01-01-sample.md');
            assert.deepEqual(first.availableTranslations, locales.filter(lang => lang !== 'zh-CN'));
            manifests.push({locale, checked, fullBytes: sizes.fullBytes, maxRouteBytes: sizes.maxRouteBytes,
                fallback: manifest.pages.filter(page => page.fallback).length,
                reportKinds: [...new Set(manifest.reports.map(report => report.kind))]});
            // One page payload can be consumed independently of the full manifest.
            assert.equal(routeData(first).contentId, first.contentId);
            if (['ja', 'ko', 'ru'].includes(locale)) verifyStatic({site: path.join(fixture, 'build'),
                manifest: path.join(fixture, '.i18n-build/manifests', locale + '.json')});
        }
        if (disabled) await assert.rejects(fs.access(path.join(fixture, 'build/ru/index.html')));
        await assert.rejects(fs.access(path.join(fixture, 'build/ja/orphan/index.html')));
        await assert.rejects(fs.access(path.join(fixture, 'build/ja/blog/2026/01/10/orphan/index.html')));
        const seo = verifyContent(path.join(fixture, 'build'), path.join(fixture, '.i18n-build/content-manifests'));
        assert.deepEqual(implementation(), initialImplementation, 'Implementation changed during fixture builds');
        results.push({disabled, fixture, sourceSha: sourceSha(fixture), implementation: initialImplementation, manifests, seo});
    }
    await fs.writeFile(path.join(root, '.i18n-build/content-fixture-verification.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results, null, 2));
}
if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
