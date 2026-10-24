// Run against a complete build before release; repeat against the public origin
// with the exact downloaded production artifact and its build report afterwards.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {createServer} = require('../publish/serve.cjs');
const {verifyContent} = require('./verify-global-language.cjs');
const {localeRegistry} = require('../../config/i18n');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function verifyPublicIdentity({publicOrigin, landingOnly, sourceSha, asfSha, runUrl, report, sha, site}) {
        assert(!landingOnly, 'Public acceptance requires the complete artifact');
        assert.equal(new URL(publicOrigin).protocol, 'https:');
        assert(/^[a-f0-9]{40}$/.test(sourceSha ?? '') && /^[a-f0-9]{40}$/.test(asfSha ?? ''), 'Source/asf-site identities required');
        assert(/^https:\/\/github.com\/apache\/doris-website\/actions\/runs\/\d+$/.test(runUrl ?? ''), 'Production run URL required');
        assert.equal(report.success, true); assert.equal(report.source.sha, sourceSha); assert.equal(sha, sourceSha);
        assert.equal(report.source.trackedDiffHash, digest(''), 'Production source must be clean');
        assert.deepEqual(report.locales.map(item => item.locale).sort(), ['en', 'ja', 'ko', 'ru', 'zh-CN']);
        assert(!report.validation, 'Sample compilation is not publication evidence');
        assert(report.optimization?.verification, 'A verified optimized publication artifact is required');
        assert(!fs.existsSync(path.join(site, '.ci-validation.json')), 'A sample cannot establish a release');
}
async function verify({site, directory, output, origin: publicOrigin, landingOnly = false, buildReport, sourceSha, asfSha, runUrl}) {
    const {chromium} = require('playwright');
    const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
    const manifests = Object.fromEntries(locales.map(locale => [locale, JSON.parse(fs.readFileSync(path.join(directory, locale + '.json')))]));
    const sha = manifests.en.sourceSha;
    for (const locale of locales) {
        assert.equal(manifests[locale].sourceSha, sha, 'Mixed manifest sources');
        const home = manifests[locale].pages.find(row => row.contentId === 'page:P01');
        assert(home && !home.fallback && home.contentLocale === locale && home.indexable, `Homepage not ready: ${locale}`);
        assert.deepEqual([...home.availableTranslations].sort(), [...locales].sort());
        if (!landingOnly) for (const version of ['current', '4.x', '3.x', '2.1'])
            assert(manifests[locale].pages.some(row => row.kind === 'docs' && row.pluginId === 'default' && row.version === version), `Missing version: ${locale}/${version}`);
    }
    if (publicOrigin) verifyPublicIdentity({publicOrigin, landingOnly, sourceSha, asfSha, runUrl,
        report: JSON.parse(fs.readFileSync(buildReport)), sha, site});
    const content = verifyContent(site, directory);
    let server, browser;
    if (!publicOrigin) {
        server = createServer(site); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    }
    const origin = publicOrigin?.replace(/\/$/, '') ?? `http://127.0.0.1:${server.address().port}`;
    const errors = [], results = [], assets = new Map();
    const themes = ['doris', 'golden', 'blue', 'read', 'yellow-blue', 'purple', 'yellow-black', 'sky'];
    fs.mkdirSync(path.dirname(output), {recursive: true});
    try {
        browser = await chromium.launch({headless: true});
        const context = await browser.newContext({serviceWorkers: 'block'});
        await context.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (url.origin === origin) return route.continue();
            if (!publicOrigin && url.hostname === 'cdnd.selectdb.com') {
                const response = await context.request.get(origin + url.pathname + url.search);
                return route.fulfill({response});
            }
            if (publicOrigin && ['cdnd.selectdb.com', 'cdn.selectdb.com'].includes(url.hostname)) return route.continue();
            return route.abort();
        });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {if (/hydration|did not match|server HTML/i.test(message.text())) errors.push(message.text());});
        if (publicOrigin) page.on('response', response => {
            const url = new URL(response.url());
            if (/\.(js|css|svg|png|jpe?g|webp|woff2?|html)$/.test(url.pathname) && (url.origin === origin || url.hostname === 'cdnd.selectdb.com'))
                assets.set(url.href, url.pathname);
        });
        for (const locale of locales) {
            const prefix = locale === 'en' ? '/' : `/${locale}/`;
            const htmlLang = localeRegistry.find(item => item.code === locale).htmlLang;
            for (const width of [1440, 390]) {
                await page.setViewportSize({width, height: 900});
                const response = await page.goto(origin + prefix);
                assert.equal(response.status(), 200);
                if (publicOrigin) assert.equal(digest(await response.body()), digest(fs.readFileSync(path.join(site, prefix, 'index.html'))), `Public HTML differs from artifact: ${prefix}`);
                await page.locator('html[data-has-hydrated="true"]').waitFor();
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                assert.equal(await page.locator('[data-content-id="page:P01"]').getAttribute('lang'), locale);
                assert.equal(await page.locator('.page-fallback-notice').count(), 0);
                const title = await page.locator('h1').first().textContent(); assert(title.trim());
                for (const theme of themes) {
                    if (width === 390) await page.locator('.navbar-next__menu-button').click();
                    const palette = page.locator(width === 390 ? '.brand-theme-switcher--mobile' : '.brand-theme-switcher:not(.brand-theme-switcher--mobile)');
                    await palette.locator('summary').click();
                    await palette.locator('button').nth(themes.indexOf(theme)).click();
                    if (width === 390) await page.locator('.navbar-next__menu-button').click();
                    assert.equal(await page.locator('html').getAttribute('data-brand-theme'), theme);
                    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${locale}/${width}/${theme}: horizontal overflow`);
                    for (const frame of await page.locator('iframe.features-next__realtime-frame').all()) {
                        // The existing mobile layout replaces these decorative frames.
                        if (!await frame.isVisible()) continue;
                        await frame.scrollIntoViewIfNeeded();
                        const body = await frame.contentFrame();
                        await body.locator('html').waitFor();
                        assert.equal(await body.locator('html').getAttribute('lang'), locale === 'en' ? 'en' : locale);
                        await body.locator(`html[data-brand-theme="${theme}"]`).waitFor();
                        const clipped = await body.locator('svg text').evaluateAll(nodes => nodes.filter(node => {
                            const b = node.getBBox(), svg = node.ownerSVGElement, view = svg.viewBox.baseVal;
                            return b.width > 0 && (b.x < view.x - 2 || b.x + b.width > view.x + view.width + 2);
                        }).map(node => node.textContent));
                        assert.deepEqual(clipped, [], `${locale}/${width}: clipped illustration labels`);
                    }
                    const diagrams = page.locator('svg.deployment-next__visual-image');
                    assert.equal(await diagrams.count(), 2, `${locale}: missing deployment diagrams`);
                    if (width === 1440 && theme === 'doris')
                        await diagrams.first().screenshot({path: path.join(path.dirname(output), `deployment-${locale}.png`)});
                    if (['doris', 'sky'].includes(theme)) {
                        await page.evaluate(() => scrollTo(0, 0));
                        await page.screenshot({path: path.join(path.dirname(output), `home-${locale}-${width}-${theme}.png`)});
                    }
                    results.push({locale, width, theme, title});
                }
                if (width === 390) await page.locator('.navbar-next__menu-button').click();
                const language = page.locator(width === 390 ? '.language-menu--mobile' : '.language-menu:not(.language-menu--mobile)');
                await language.locator('summary').focus(); await page.keyboard.press('Enter');
                assert.equal(await language.getAttribute('open'), ''); await page.keyboard.press('Escape');
                assert.equal(await language.getAttribute('open'), null);
                assert(await language.locator('summary').evaluate(node => document.activeElement === node && node.checkVisibility()), 'Escape must restore visible focus');
            }
            if (!landingOnly) {
                await page.setViewportSize({width: 1440, height: 900}); await page.goto(origin + prefix);
                await page.locator('.navbar-next__cta').click(); await page.waitForURL(origin + prefix + 'download/');
                assert.equal(await page.locator('[data-content-id]').getAttribute('lang'), 'en');
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                await page.reload(); assert.equal(new URL(page.url()).pathname, prefix + 'download/');
                await page.goBack(); assert.equal(new URL(page.url()).pathname, prefix);
                await page.locator('button[aria-controls="navbar-dropdown-resources"]').click();
                await page.locator(`#navbar-dropdown-resources a[href="${prefix}blog/"]`).click();
                await page.waitForURL(origin + prefix + 'blog/');
                const articleLinks = await page.locator('main a[href]').evaluateAll(nodes => nodes.map(node => new URL(node.href).pathname));
                const blog = manifests[locale].pages.find(row => row.kind === 'blog' && row.fallback && articleLinks.includes(row.route))
                    ?? manifests[locale].pages.find(row => row.kind === 'blog' && articleLinks.includes(row.route));
                assert(blog, 'No native blog link on listing');
                await page.locator(`main a[href="${blog.route}"]`).first().click(); await page.waitForURL(origin + blog.route);
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                const newTab = await context.newPage();
                await newTab.goto(origin + blog.route + '?from=m1#usage');
                assert.equal(new URL(newTab.url()).search, '?from=m1'); assert.equal(new URL(newTab.url()).hash, '#usage');
                assert.equal(await newTab.locator('html').getAttribute('lang'), htmlLang); await newTab.close();
                await page.locator('button[aria-controls="navbar-dropdown-docs"]').click();
                await page.locator('#navbar-dropdown-docs a').first().click();
                await page.waitForURL(url => url.pathname.startsWith(prefix + 'docs/dev/'));
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                await page.locator('.navbar-next__logo').click(); await page.waitForURL(origin + prefix);
                await page.locator('button[aria-controls="navbar-dropdown-community"]').click();
                await page.locator(`#navbar-dropdown-community a[href="${prefix}community/join-community/"]`).click();
                await page.waitForURL(origin + prefix + 'community/join-community/');
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                const unknown = await page.goto(origin + prefix + 'm1-unknown-route/'); assert.equal(unknown.status(), 404);
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
            }
        }
        if (publicOrigin) for (const [url, pathname] of assets) {
            const local = path.join(site, decodeURIComponent(pathname)); assert(fs.existsSync(local), `Public asset absent from artifact: ${pathname}`);
            const response = await context.request.get(url); assert(response.ok(), url);
            assert.equal(digest(await response.body()), digest(fs.readFileSync(local)), `Public asset mismatch: ${pathname}`);
        }
        assert.deepEqual(errors, []);
        const report = {schemaVersion: 1, sourceSha: sha, public: !!publicOrigin, asfSha, runUrl, origin,
            scope: landingOnly ? 'homepage only; docs/blog/community disabled' : 'complete artifact; five languages and all active versions',
            content, results, verifiedPublicAssets: assets.size, errors};
        fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n'); return report;
    } finally {await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));}
}
if (require.main === module) {
    const args = process.argv.slice(2), value = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
    verify({site: value('--site', 'build'), directory: value('--manifests', '.i18n-build/content-manifests'),
        output: value('--output', '.i18n-build/first-release.json'), origin: value('--origin'), landingOnly: args.includes('--landing-only'),
        buildReport: value('--build-report'), sourceSha: value('--source-sha'), asfSha: value('--asf-sha'), runUrl: value('--run-url')})
        .then(report => console.log(JSON.stringify({sourceSha: report.sourceSha, public: report.public, cases: report.results.length})))
        .catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {verify, verifyPublicIdentity};
