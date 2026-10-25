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
async function verify({site, directory, output, origin: publicOrigin, landingOnly = false, sample = false, buildReport, sourceSha, asfSha, runUrl}) {
    const {chromium} = require('playwright');
    const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
    const manifests = Object.fromEntries(locales.map(locale => [locale, JSON.parse(fs.readFileSync(path.join(directory, locale + '.json')))]));
    const sha = manifests.en.sourceSha;
    for (const locale of locales) {
        assert.equal(manifests[locale].sourceSha, sha, 'Mixed manifest sources');
        const home = manifests[locale].pages.find(row => row.contentId === 'page:P01');
        const intentionalFallback = false;
        assert(home && home.fallback === intentionalFallback && home.contentLocale === (intentionalFallback ? 'en' : locale)
            && home.indexable === !intentionalFallback, `Homepage policy mismatch: ${locale}`);
        assert.deepEqual([...home.availableTranslations].sort(), locales.slice().sort());
        if (!landingOnly) for (const version of ['current', '4.x', '3.x', '2.1'])
            assert(manifests[locale].pages.some(row => row.kind === 'docs' && row.pluginId === 'default' && row.version === version), `Missing version: ${locale}/${version}`);
    }
    if (publicOrigin) verifyPublicIdentity({publicOrigin, landingOnly: landingOnly || sample, sourceSha, asfSha, runUrl,
        report: JSON.parse(fs.readFileSync(buildReport)), sha, site});
    if (sample) assert.equal(JSON.parse(fs.readFileSync(path.join(site, '.ci-validation.json'))).publicationAllowed, false);
    const content = sample ? [{scope: 'sample navigation only', fullStaticReciprocity: false}] : verifyContent(site, directory);
    let server, browser;
    if (!publicOrigin) {
        server = createServer(site); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    }
    const origin = publicOrigin?.replace(/\/$/, '') ?? `http://127.0.0.1:${server.address().port}`;
    const normalized = pathname => pathname.replace(/\/+$/, '') || '/';
    const waitPath = (page, pathname) => page.waitForURL(url => url.origin === origin && normalized(url.pathname) === normalized(pathname));
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
            for (const width of [1440, 1280, 900, 390]) {
                await page.setViewportSize({width, height: 900});
                const response = await page.goto(origin + prefix);
                assert.equal(response.status(), 200);
                if (publicOrigin) assert.equal(digest(await response.body()), digest(fs.readFileSync(path.join(site, prefix, 'index.html'))), `Public HTML differs from artifact: ${prefix}`);
                await page.locator('html[data-has-hydrated="true"]').waitFor();
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                const home = manifests[locale].pages.find(row => row.contentId === 'page:P01');
                assert.equal(await page.locator('[data-content-id="page:P01"]').getAttribute('lang'), home.contentLocale);
                assert.equal(await page.locator('.page-fallback-notice').count(), home.fallback ? 1 : 0);
                const title = await page.locator('h1').first().innerText(); assert(title.trim());
                // The external widget is blocked in local tests. Exercise its
                // actual label overrides independently of network/error timing.
                const aiLabelStates = await page.locator('#navbar-ask-ai-btn').evaluate(button => {
                    const trigger = button.getAttribute('data-kapa-trigger');
                    const busy = button.getAttribute('aria-busy'), disabled = button.getAttribute('aria-disabled');
                    const labels = [...button.querySelectorAll('[data-kapa-label]')];
                    const original = labels.map(label => label.textContent);
                    const results = [];
                    button.removeAttribute('data-kapa-trigger');
                    for (const state of ['loading', 'slow', 'error']) {
                        button.setAttribute('aria-busy', state === 'error' ? 'false' : 'true');
                        button.setAttribute('aria-disabled', state === 'error' ? 'true' : 'false');
                        labels.forEach(label => {label.textContent = label.getAttribute('data-kapa-' + state + '-label')
                            || (state === 'slow' && label.getAttribute('data-kapa-loading-label'))
                            || {loading: 'Loading AI…', slow: 'Still loading…', error: 'AI unavailable'}[state];});
                        results.push({state, scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth});
                    }
                    labels.forEach((label, index) => {label.textContent = original[index];});
                    if (trigger !== null) button.setAttribute('data-kapa-trigger', trigger);
                    if (busy !== null) button.setAttribute('aria-busy', busy);
                    if (disabled !== null) button.setAttribute('aria-disabled', disabled);
                    return results;
                });
                for (const state of aiLabelStates) assert(state.scrollWidth <= state.viewport + 1,
                    `${locale}/${width}/${state.state}: AI label overflow`);
                assert.equal(await page.locator('.navbar-next .language-menu').count(), 1);
                assert.equal(await page.locator('.page-language-switcher').count(), 0);
                assert.equal(title.replace(/\s+/g, ' ').trim().toLowerCase(), 'lightning fast analytics and search database');
                for (const theme of themes) {
                    const language = page.locator('.navbar-next .language-menu');
                    await language.locator('summary').click();
                    await language.locator(`[data-brand-theme-option="${theme}"]`).click();
                    assert.equal(await page.locator('html').getAttribute('data-brand-theme'), theme);
                    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${locale}/${width}/${theme}: horizontal overflow`);
                    for (const frame of await page.locator('iframe.features-next__realtime-frame').all()) {
                        // The existing mobile layout replaces these decorative frames.
                        if (!await frame.isVisible()) continue;
                        await frame.scrollIntoViewIfNeeded();
                        const body = await frame.contentFrame();
                        await body.locator('html').waitFor();
                        assert.equal(await body.locator('html').getAttribute('lang'), home.contentLocale);
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
                    results.push({locale, width, theme, title, aiLabelStates});
                }
                const language = page.locator('.navbar-next .language-menu');
                await language.locator('summary').focus(); await page.keyboard.press('Enter');
                assert.equal(await language.getAttribute('open'), ''); await page.keyboard.press('Escape');
                assert.equal(await language.getAttribute('open'), null);
                assert(await language.locator('summary').evaluate(node => document.activeElement === node && node.checkVisibility()), 'Escape must restore visible focus');
            }
            if (!landingOnly) {
                await page.setViewportSize({width: 1440, height: 900}); await page.goto(origin + prefix);
                await page.locator('.navbar-next__cta').click(); await waitPath(page, prefix + 'download/');
                const download = manifests[locale].pages.find(row => row.contentId === 'page:P10');
                await page.locator(`[data-content-id="page:P10"][lang="${download.contentLocale}"]`).waitFor();
                assert.equal(await page.locator('[data-content-id="page:P10"]').getAttribute('lang'), download.contentLocale);
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                await page.reload(); assert.equal(normalized(new URL(page.url()).pathname), normalized(prefix + 'download/'));
                await page.goBack(); assert.equal(normalized(new URL(page.url()).pathname), normalized(prefix));
                await page.locator('[data-content-id="page:P01"]').waitFor();
                await page.locator('button[aria-controls="navbar-dropdown-resources"]').click();
                await page.locator(`#navbar-dropdown-resources a[href="${prefix}blog/"]`).click();
                await waitPath(page, prefix + 'blog/');
                await page.locator('main a[href*="/blog/"]').first().waitFor();
                const articleLinks = await page.locator('main a[href]').evaluateAll((nodes, expectedOrigin) => nodes
                    .filter(node => new URL(node.href).origin === expectedOrigin)
                    .map(node => new URL(node.href).pathname.replace(/\/+$/, '')), origin);
                const blog = manifests[locale].pages.find(row => row.kind === 'blog' && row.fallback && articleLinks.includes(normalized(row.route)))
                    ?? manifests[locale].pages.find(row => row.kind === 'blog' && articleLinks.includes(normalized(row.route)));
                assert(blog, 'No native blog link on listing');
                const articleLink = page.locator(`main a[href="${blog.route}"], main a[href="${normalized(blog.route)}"]`).first();
                await articleLink.click(); await waitPath(page, blog.route);
                await page.locator(`article.blog-article-content[lang="${blog.contentLocale}"]`).waitFor();
                assert.equal(await page.locator('article.blog-article-content').getAttribute('lang'), blog.contentLocale);
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                const newTab = await context.newPage();
                await newTab.goto(origin + blog.route + '?from=m1#usage');
                assert.equal(new URL(newTab.url()).search, '?from=m1'); assert.equal(new URL(newTab.url()).hash, '#usage');
                assert.equal(await newTab.locator('html').getAttribute('lang'), htmlLang); await newTab.close();
                await page.locator('button[aria-controls="navbar-dropdown-docs"]').click();
                await page.locator('#navbar-dropdown-docs a').first().click();
                await page.waitForURL(url => url.pathname.startsWith(prefix + 'docs/dev/'));
                await page.locator('.theme-doc-markdown').waitFor();
                const doc = manifests[locale].pages.find(row => row.kind === 'docs' && normalized(row.route) === normalized(new URL(page.url()).pathname));
                assert(doc, 'Document route must retain its native identity');
                assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), doc.contentLocale);
                assert.equal(await page.locator('html').getAttribute('lang'), htmlLang);
                await page.locator('.navbar-next__logo').click(); await waitPath(page, prefix);
                await page.locator('[data-content-id="page:P01"]').waitFor();
                await page.locator('button[aria-controls="navbar-dropdown-community"]').click();
                await page.locator(`#navbar-dropdown-community a[href="${prefix}community/join-community/"]`).click();
                await waitPath(page, prefix + 'community/join-community/');
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
            scope: landingOnly ? 'homepage only; docs/blog/community disabled' : sample ? 'sample navigation; full native metadata, partial document compilation, no publication proof' : 'complete artifact; five languages and all active versions',
            content, results, verifiedPublicAssets: assets.size, errors};
        fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n'); return report;
    } finally {await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));}
}
if (require.main === module) {
    const args = process.argv.slice(2), value = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
    verify({site: value('--site', 'build'), directory: value('--manifests', '.i18n-build/content-manifests'),
        output: value('--output', '.i18n-build/first-release.json'), origin: value('--origin'), landingOnly: args.includes('--landing-only'), sample: args.includes('--sample'),
        buildReport: value('--build-report'), sourceSha: value('--source-sha'), asfSha: value('--asf-sha'), runUrl: value('--run-url')})
        .then(report => console.log(JSON.stringify({sourceSha: report.sourceSha, public: report.public, cases: report.results.length})))
        .catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {verify, verifyPublicIdentity};
