const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cheerio = require('cheerio');
const {verify: verifyStatic} = require('./verify-static.cjs');
const {createServer} = require('../publish/serve.cjs');
async function verifyCourseNavigation(page, url) {
    await page.goto(url + '?courseProbe=1');
    const progress = page.locator('.course-player [role="progressbar"]');
    await progress.waitFor();
    const chineseTitle = page.locator('.course-doc-content[lang="zh-CN"] .course-player__unit:not([hidden]) h2');
    if (await chineseTitle.count()) {
        await chineseTitle.locator('.course-player__title-word').first().waitFor();
        const title = await chineseTitle.evaluate(node => ({width: node.clientWidth, scrollWidth: node.scrollWidth,
            words: [...node.querySelectorAll('.course-player__title-word')].map(word => word.getClientRects().length)}));
        assert(title.scrollWidth <= title.width + 1 && title.words.every(rects => rects === 1), 'Chinese lesson title splits words or overflows');
    }
    const secondId = await page.locator('.course-player__unit').nth(1).getAttribute('id');
    await page.locator('.course-player__next').click();
    await page.waitForFunction(() => document.querySelector('.course-player [role="progressbar"]')?.getAttribute('aria-valuenow') === '2');
    assert.equal(new URL(page.url()).hash, '#' + secondId);
    const links = '.language-menu__links a, a.dropdown__link[lang]';
    assert(await page.locator(links).count() > 1, 'Course language links missing');
    await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(anchor => {
        const target = new URL(anchor.getAttribute('href'), window.location.href);
        return target.search === window.location.search && target.hash === window.location.hash;
    }), links);
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('.course-player [role="progressbar"]')?.getAttribute('aria-valuenow') === '1');
    await page.goForward();
    await page.waitForFunction(() => document.querySelector('.course-player [role="progressbar"]')?.getAttribute('aria-valuenow') === '2');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.course-player [role="progressbar"]')?.getAttribute('aria-valuenow') === '2');
}
async function verify({root = process.cwd(), browser = true}) {
    const site = path.join(root, '.i18n-build/ci-sample/site');
    const plan = JSON.parse(fs.readFileSync(path.join(root, '.i18n-build/ci-plan.json')));
    const marker = JSON.parse(fs.readFileSync(path.join(site, '.ci-validation.json')));
    assert.equal(marker.publicationAllowed, false);
    assert.equal(marker.source?.sha ?? marker.sourceSha, plan.sourceSha, 'Stale sample artifact');
    const build = JSON.parse(fs.readFileSync(path.join(root, '.i18n-build/build-result.json')));
    assert.equal(build.success, true);
    assert.equal(build.source.sha, plan.sourceSha);
    assert.equal(build.validation?.mode, 'sample');
    assert.equal(build.source.trackedDiffHash, plan.trackedDiffHash);
    const results = [];
    for (const locale of plan.locales) {
        const scope = JSON.parse(
            fs.readFileSync(path.join(root, '.i18n-build/ci-sample/scopes', locale + '.json')),
        );
        assert.equal(scope.sourceSha, plan.sourceSha);
        assert.equal(scope.status, 'compiled');
        assert(scope.compiledMdxModules?.client?.length > 0);
        assert(scope.renderedDocs > 0 && scope.renderedDocs <= scope.metadataDocs);
        for (const row of scope.selected) {
            const filename = path.join(site, decodeURIComponent(row.route), 'index.html');
            assert(fs.existsSync(filename), `Missing selected document: ${row.route}`);
            const $ = cheerio.load(fs.readFileSync(filename));
            assert.equal($('link[rel="canonical"]').length, 1, row.route);
            assert($('main').text().trim(), row.route);
        }
        if (['ja', 'ko', 'ru'].includes(locale))
            verifyStatic({
                site,
                manifest: path.join(root, '.i18n-build/manifests', locale + '.json'),
                partial: true,
            });
        results.push({
            locale,
            metadataDocs: scope.metadataDocs,
            renderedDocs: scope.renderedDocs,
            metadataRoutes: scope.metadataRoutes,
            compiledRoutes: scope.compiledRoutes.length,
            compiledMdxModules: new Set(Object.values(scope.compiledMdxModules).flat()).size,
            anchorChecksSkipped: scope.anchorChecksSkipped,
            linkCheckMode: scope.linkCheckMode,
        });
    }
    if (browser) {
        const {chromium} = require('playwright'),
            server = createServer(site);
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const origin = `http://127.0.0.1:${server.address().port}`;
        let instance;
        try {
            instance = await chromium.launch({headless: true});
            for (const locale of plan.locales) {
                const context = await instance.newContext({serviceWorkers: 'block'}),
                    page = await context.newPage();
                const errors = [];
                page.on('pageerror', e => errors.push(e.message));
                const scope = JSON.parse(
                    fs.readFileSync(
                        path.join(root, '.i18n-build/ci-sample/scopes', locale + '.json'),
                    ),
                );
                const row =
                    scope.selected.find(r => r.pluginId === 'default' && r.version === 'current') ??
                    scope.selected[0];
                const response = await page.goto(origin + row.route);
                assert.equal(response.status(), 200);
                await page.locator('html[data-has-hydrated="true"]').waitFor();
                const course = scope.selected.find(r => r.pluginId === 'course');
                if (course) await verifyCourseNavigation(page, origin + course.route);
                assert.deepEqual(errors, [], locale);
                await context.close();
            }
        } finally {
            await instance?.close();
            await new Promise(resolve => server.close(resolve));
        }
    }
    const report = {
        schemaVersion: 1,
        mode: 'sample',
        publicationAllowed: false,
        sourceSha: plan.sourceSha,
        completeDocumentCompilation: false,
        results,
    };
    if (process.env.GITHUB_STEP_SUMMARY)
        fs.appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            '| Language | Native document metadata | Rendered documents | Compiled MDX modules (including blog/imports) | Unverified destination anchors |\n' +
                '| --- | ---: | ---: | ---: | ---: |\n' +
                results
                    .map(
                        r =>
                            `| ${r.locale} | ${r.metadataDocs} | ${r.renderedDocs} | ${r.compiledMdxModules} | ${r.anchorChecksSkipped} |`,
                    )
                    .join('\n') +
                '\n\n',
        );
    fs.writeFileSync(
        path.join(root, '.i18n-build/ci-sample/verification.json'),
        JSON.stringify(report, null, 2) + '\n',
    );
    console.log(JSON.stringify(report));
    return report;
}
if (require.main === module)
    verify({browser: !process.argv.includes('--no-browser')}).catch(e => {
        console.error(e);
        process.exitCode = 1;
    });
module.exports = {verify, verifyCourseNavigation};
