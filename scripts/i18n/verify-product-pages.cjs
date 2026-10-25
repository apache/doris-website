// Verify the seven existing product pages against native content decisions.
// Missing document translations remain explicit gaps even when the page works.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const cheerio = require('cheerio');
const matter = require('gray-matter');
const {createServer} = require('../publish/serve.cjs');
const {localeRegistry} = require('../../config/i18n');
const {generate} = require('../key-features/generate');

const root = path.resolve(__dirname, '../..');
const productIds = ['P02', 'P03', 'P04', 'P06', 'P07', 'P08', 'P09'];
const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
const themes = ['doris', 'golden', 'blue', 'read', 'yellow-blue', 'purple', 'yellow-black', 'sky'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const normalized = pathname => pathname.replace(/\/+$/, '') || '/';
const withLocale = (locale, route) => (locale === 'en' ? '' : '/' + locale) + route;

function assetResolver(site) {
    site = path.resolve(site);
    const file = path.join(site, '.publish/redirects.json');
    const manifest = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {redirects: [], assetPrefixes: []};
    const redirects = new Map(manifest.redirects.map(([from, to]) => [decodeURIComponent(from), to]));
    return pathname => {
        let current = decodeURIComponent(pathname);
        for (let count = 0; count < 20; count++) {
            const file = path.join(site, current);
            assert(file.startsWith(site + path.sep), 'Asset outside artifact');
            if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
            const target = redirects.get(current) ?? redirects.get(current + '/');
            if (target) {
                const next = new URL(target, 'https://doris.apache.org');
                assert.equal(next.origin, 'https://doris.apache.org');
                current = decodeURIComponent(next.pathname); continue;
            }
            const prefix = manifest.assetPrefixes.find(prefix => current.startsWith(prefix));
            if (!prefix) break;
            current = '/assets/' + current.slice(prefix.length);
        }
        throw new Error('Unresolved artifact asset: ' + pathname);
    };
}

function staticChecks(site, directory) {
    const manifests = Object.fromEntries(locales.map(locale => [locale,
        JSON.parse(fs.readFileSync(path.join(directory, locale + '.json')))]));
    const sourceSha = manifests.en.sourceSha;
    const cards = generate({rootDir: root});
    const pages = [], documents = [];
    for (const locale of locales) {
        assert.equal(manifests[locale].sourceSha, sourceSha, 'Mixed native sources');
        const indexed = new Set(cheerio.load(fs.readFileSync(path.join(site, locale === 'en' ? '' : locale, 'sitemap.xml')),
            {xmlMode: true})('loc').map((_, node) => new URL(node.children[0].data).pathname).get());
        for (const id of productIds) {
            const native = manifests[locale].pages.find(row => row.contentId === 'page:' + id);
            assert(native, `Missing native product: ${id}/${locale}`);
            const expectedLocale = locale === 'zh-CN' ? 'en' : locale;
            assert.equal(native.contentLocale, expectedLocale);
            assert.equal(native.fallback, locale === 'zh-CN');
            const html = fs.readFileSync(path.join(site, decodeURIComponent(native.route), 'index.html'));
            const $ = cheerio.load(html);
            assert.equal($('html').attr('lang'), localeRegistry.find(item => item.code === locale).htmlLang);
            assert.equal($('[data-content-id="page:' + id + '"]').attr('lang'), expectedLocale);
            assert.equal($('.page-fallback-notice').length, native.fallback ? 1 : 0);
            const canonical = 'https://doris.apache.org' + (native.fallback ? native.englishRoute : native.route);
            assert.equal($('link[rel="canonical"]').length, 1);
            assert.equal($('link[rel="canonical"]').attr('href'), canonical);
            assert.equal($('meta[property="og:url"]').attr('content'), canonical);
            assert.equal(/noindex/.test($('meta[name="robots"]').attr('content') ?? ''), !native.indexable);
            assert.equal(indexed.has(native.route), native.indexable);
            assert.deepEqual([...native.availableTranslations].sort(), ['en', 'ja', 'ko', 'ru']);
            assert.equal($('link[rel="alternate"][hreflang]').length, 5);
            for (const other of ['en', 'ja', 'ko', 'ru']) {
                const language = localeRegistry.find(item => item.code === other).htmlLang;
                assert.equal($(`link[rel="alternate"][hreflang="${language}"]`).attr('href'),
                    'https://doris.apache.org' + native.navigationRoutes[other]);
            }
            assert($('title').text().trim() && $('meta[name="description"]').attr('content')?.trim());
            if (id === 'P04') {
                const tiles = $('.kf-next__tile'); assert.equal(tiles.length, cards.length);
                cards.forEach((card, index) => {
                    const route = withLocale(expectedLocale, card.href);
                    const doc = manifests[expectedLocale].pages.find(row => row.kind === 'docs'
                        && normalized(row.route) === normalized(route));
                    assert(doc, 'Missing feature document identity: ' + route);
                    const target = doc.contentLocale === 'en' ? card.sourcePath
                        : `i18n/${doc.contentLocale}/docusaurus-plugin-content-docs/current/${card.sourcePath.replace(/^docs\//, '')}`;
                    const {data, content} = matter(fs.readFileSync(path.join(root, target), 'utf8'));
                    assert(content.trim().length > 100, 'Feature metadata without a complete body: ' + target);
                    const tile = tiles.eq(index);
                    assert.equal(tile.find('.kf-next__tile-name').text(), data.title);
                    if (tile.find('.kf-next__tile-desc').length)
                        assert.equal(tile.find('.kf-next__tile-desc').text(), data.description);
                    assert.equal(normalized(tile.find('a').attr('href')), normalized(withLocale(locale, card.href)));
                    documents.push({locale, id: card.id, route: withLocale(locale, card.href), sourcePath: card.sourcePath,
                        metadataSource: target, contentLocale: doc.contentLocale, state: doc.state,
                        fallback: doc.fallback, reviewStatus: doc.reviewStatus});
                });
            }
            pages.push({locale, id, route: native.route, englishRoute: native.englishRoute,
                contentLocale: native.contentLocale, fallback: native.fallback, sha256: hash(html)});
        }
    }
    return {sourceSha, cards, pages, documents, documentGaps: documents.filter(row =>
        ['ja', 'ko', 'ru'].includes(row.locale)
        && (row.fallback || row.state !== 'current' || row.reviewStatus === 'unverified'))};
}

function svgBounds() {
    const issues = [];
    for (const svg of document.querySelectorAll('main svg[viewBox]')) {
        const view = svg.viewBox.baseVal;
        for (const text of svg.querySelectorAll('text')) {
            const box = text.getBBox(); if (!box.width) continue;
            const matrix = svg.getCTM().inverse().multiply(text.getCTM());
            const points = [[box.x, box.y], [box.x + box.width, box.y + box.height]]
                .map(([x, y]) => [matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f]);
            if (points.some(([x, y]) => x < view.x - 1 || x > view.x + view.width + 1
                || y < view.y - 1 || y > view.y + view.height + 1)) issues.push(text.textContent);
        }
    }
    return issues;
}

async function verify({site, directory, output, origin: publicOrigin, requireComplete = true}) {
    site = path.resolve(site); directory = path.resolve(directory); output = path.resolve(output);
    const {chromium} = require('playwright');
    const native = staticChecks(site, directory);
    if (publicOrigin) {
        assert(!fs.existsSync(path.join(site, '.ci-validation.json')), 'A partial CI artifact cannot establish public acceptance');
        assert(fs.existsSync(path.join(site, '.publish/redirects.json')), 'Public acceptance requires the optimized publication artifact');
        for (const locale of locales) {
            const manifest = JSON.parse(fs.readFileSync(path.join(directory, locale + '.json')));
            for (const version of ['current', '4.x', '3.x', '2.1'])
                assert(manifest.pages.some(row => row.kind === 'docs' && row.pluginId === 'default' && row.version === version),
                    `Missing publication version: ${locale}/${version}`);
        }
    }
    const report = {schemaVersion: 1, sourceSha: native.sourceSha,
        verificationCodeSha: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
        public: !!publicOrigin, requireComplete, contentComplete: native.documentGaps.length === 0,
        ...native, layouts: [], interactions: [], resources: [], errors: [], failures: [],
        humanProofreading: false, startedAt: new Date().toISOString()};
    fs.mkdirSync(path.dirname(output), {recursive: true});
    let server, browser;
    const check = (value, message, detail) => {if (!value) report.failures.push({message, detail});};
    try {
        if (!publicOrigin) {server = createServer(site); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));}
        const origin = publicOrigin?.replace(/\/$/, '') ?? `http://127.0.0.1:${server.address().port}`;
        browser = await chromium.launch();
        const context = await browser.newContext({serviceWorkers: 'block', reducedMotion: 'reduce'});
        await context.route('**/*', async route => {
            const url = new URL(route.request().url());
            if (url.origin === origin) return route.continue();
            if (['cdnd.selectdb.com', 'cdn.selectdb.com'].includes(url.hostname)) {
                if (publicOrigin) return route.continue();
                return route.fulfill({response: await context.request.get(origin + url.pathname + url.search)});
            }
            return route.abort();
        });
        const page = await context.newPage(), assets = new Map();
        page.on('pageerror', error => report.errors.push(error.message));
        page.on('console', message => {if (/hydration|did not match|server HTML/i.test(message.text())) report.errors.push(message.text());});
        page.on('response', response => {
            const url = new URL(response.url());
            if ((url.origin === origin || ['cdnd.selectdb.com', 'cdn.selectdb.com'].includes(url.hostname))
                && /\.(js|css|svg|png|jpe?g|webp|woff2?)$/.test(url.pathname)) assets.set(url.href, url.pathname);
        });
        const open = async route => {
            const response = await page.goto(origin + route, {waitUntil: 'domcontentloaded'});
            assert.equal(response.status(), 200, route);
            await page.locator('html[data-has-hydrated="true"]').waitFor();
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(node => node.classList.add('is-visible')));
            return response;
        };
        for (const width of [1440, 390]) {
            await page.setViewportSize({width, height: 1000});
            for (const product of native.pages) {
                const response = await open(product.route + '?from=t10#t10');
                if (publicOrigin) assert.equal(hash(await response.body()), product.sha256, product.route);
                assert.equal(await page.locator(`[data-content-id="page:${product.id}"]`).getAttribute('lang'), product.contentLocale);
                const badLinks = await page.locator('[data-content-id] a[href]').evaluateAll((links, expected) => links
                    .filter(link => !link.closest('.page-language-switcher,.language-menu'))
                    .map(link => new URL(link.href)).filter(url => url.origin === location.origin).map(url => url.pathname)
                    .filter(href => !/\.(pdf|zip|gz|png|svg|jpe?g)(?:[?#]|$)/.test(href))
                    .filter(href => expected === 'en' ? /^\/(?:zh-CN|ja|ko|ru)(?:\/|$)/.test(href)
                        : !href.startsWith('/' + expected + '/')), product.locale);
                check(!badLinks.length, 'Product link lost site language', {product, badLinks});
                for (const theme of themes) {
                    // The shared selector itself is covered by first-release;
                    // inspect every product's rendering under each real token set.
                    await page.evaluate(theme => {document.documentElement.dataset.brandTheme = theme;}, theme);
                    const layout = await page.evaluate(() => ({viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
                        primary: getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim(),
                        accent: getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim()}));
                    const svgIssues = await page.evaluate(svgBounds);
                    check(layout.scrollWidth <= width + 1 && layout.primary && layout.accent && !svgIssues.length,
                        'Product layout/theme', {id: product.id, locale: product.locale, width, theme, layout, svgIssues});
                    report.layouts.push({id: product.id, locale: product.locale, width, theme, ...layout, svgIssues});
                    if ((width === 1440 && theme === 'doris') || (width === 390 && theme === 'sky')) {
                        await page.evaluate(async () => {
                            await new Promise(requestAnimationFrame);
                            await Promise.allSettled(document.getAnimations()
                                .filter(animation => animation.playState === 'running'
                                    && Number.isFinite(animation.effect?.getComputedTiming().endTime))
                                .map(animation => animation.finished));
                        });
                        await page.screenshot({path: path.join(path.dirname(output), `${product.id}-${product.locale}-${width}-${theme}.png`)});
                    }
                }
                const inPanel = !await page.locator('.language-menu:not(.language-menu--mobile)').isVisible();
                if (inPanel) await page.locator('.navbar-next__menu-button').click();
                const menu = page.locator(inPanel ? '.language-menu--mobile' : '.language-menu:not(.language-menu--mobile)');
                await menu.locator('summary').focus(); await page.keyboard.press('Enter');
                assert.equal(await menu.getAttribute('open'), ''); await page.keyboard.press('Escape');
                assert.equal(await menu.getAttribute('open'), null);
                assert(await menu.locator('summary').evaluate(node => document.activeElement === node));
                if (inPanel) await page.locator('.navbar-next__menu-button').click();
            }
        }
        await page.setViewportSize({width: 1440, height: 1000});
        const section = async (locale, name, run) => {
            try {report.interactions.push({locale, name, ...await run()});}
            catch (error) {report.failures.push({locale, name, message: error.message});}
        };
        for (const locale of ['ja', 'ko', 'ru']) {
            const route = id => native.pages.find(row => row.id === id && row.locale === locale).route;
            await section(locale, 'compare tabs, cases and anchor', async () => {
                await open(route('P02') + '#trino');
                await page.waitForFunction(() => document.querySelector('.cmp-next__tabs [aria-selected=true]')?.textContent.includes('Trino'));
                const tabs = page.locator('.cmp-next__tabs [role=tab]'); let selected = 0, cases = 0;
                for (const tab of await tabs.all()) {
                    if (await tab.locator('.cmp-next__tab-soon').count()) continue;
                    await tab.focus(); await page.keyboard.press('Enter'); assert.equal(await tab.getAttribute('aria-selected'), 'true'); selected++;
                    for (const [index, dot] of (await page.locator('.cmp-cf__dot').all()).entries()) {
                        await dot.focus(); await page.keyboard.press('Enter');
                        assert.equal(await page.locator('.cmp-cf__item--active').getAttribute('data-idx'), String(index)); cases++;
                    }
                }
                assert.equal(selected, 3); assert.equal(cases, 9);
                return {tabs: selected, cases};
            });
            await section(locale, 'benchmark tabs, details and tooltip', async () => {
                await open(route('P03')); const tabs = page.locator('.b-tabs [role=tab]'); assert.equal(await tabs.count(), 5);
                for (const tab of await tabs.all()) {await tab.focus(); await page.keyboard.press('Enter'); assert.equal(await tab.getAttribute('aria-selected'), 'true');}
                const card = page.locator('.b-card').first(); await card.scrollIntoViewIfNeeded(); await card.focus(); await page.keyboard.press('Enter');
                await page.locator('.b-detail').first().waitFor();
                const bar = page.locator('.b-cluster-bar').first(); if (await bar.count()) {await bar.hover(); await page.locator('.b-floating-tip').first().waitFor();}
                return {tabs: await tabs.count(), details: await page.locator('.b-detail').count()};
            });
            await section(locale, 'feature search, clear and native document', async () => {
                await open(route('P04')); assert.equal(await page.locator('.kf-next__tile').count(), native.cards.length);
                const visible = () => page.locator('.kf-next__tile:not(.is-hidden)').count();
                const title = await page.locator('.kf-next__tile-name').first().innerText();
                for (const query of [title, 'MPP', 'lakehouse']) {await page.locator('input[type=search]').fill(query); assert(await visible() > 0, query);}
                await page.locator('input[type=search]').fill('zzzzzzzzzzzz'); assert.equal(await visible(), 0);
                await page.locator('.kf-next__empty-clear').focus(); await page.keyboard.press('Enter'); assert.equal(await visible(), native.cards.length);
                await page.locator('input[type=search]').fill('MPP'); await page.locator('.kf-next__search-clear').focus();
                await page.keyboard.press('Enter'); assert.equal(await visible(), native.cards.length);
                await page.locator('.kf-next__tile a').first().click();
                await page.waitForURL(url => url.pathname.startsWith('/' + locale + '/docs/dev/'));
                await page.locator('.theme-doc-markdown').waitFor(); assert.equal(await page.locator('html').getAttribute('lang'), locale);
                return {cards: native.cards.length, title, document: new URL(page.url()).pathname};
            });
            for (const id of ['P06', 'P07', 'P08', 'P09']) await section(locale, 'requirement keyboard ' + id, async () => {
                await open(route(id)); const toggles = page.locator('main button[aria-expanded]');
                assert.equal(await toggles.count(), {P06: 4, P07: 5, P08: 5, P09: 5}[id]);
                for (const toggle of await toggles.all()) {const before = await toggle.getAttribute('aria-expanded');
                    await toggle.scrollIntoViewIfNeeded(); await toggle.focus(); await page.keyboard.press('Enter');
                    assert.notEqual(await toggle.getAttribute('aria-expanded'), before); assert(await toggle.evaluate(node => document.activeElement === node));}
                return {toggles: await toggles.count()};
            });
        }
        await section('all', 'language switches retain product identity and suffix', async () => {
            const product = native.pages.find(row => row.id === 'P09' && row.locale === 'ja');
            await open(product.route + '?from=t10#t10'); const routes = [];
            for (const locale of ['ko', 'ru', 'zh-CN', 'en', 'ja']) {
                const htmlLang = localeRegistry.find(row => row.code === locale).htmlLang;
                await page.locator(`.page-language-switcher a[lang="${htmlLang}"]`).click();
                const expected = withLocale(locale, product.englishRoute);
                await page.waitForURL(url => url.pathname === expected);
                const url = new URL(page.url()); assert.equal(url.search, '?from=t10'); assert.equal(url.hash, '#t10');
                routes.push(url.pathname); await page.reload(); assert.equal(new URL(page.url()).pathname, expected);
            }
            return {routes};
        });
        if (publicOrigin) {
            await page.waitForLoadState('networkidle');
            const resolve = assetResolver(site), pending = [...assets]; let cursor = 0;
            await Promise.all(Array.from({length: 8}, async () => {
                while (cursor < pending.length) {
                    const [url, pathname] = pending[cursor++], file = resolve(pathname), response = await context.request.get(url);
                    assert(response.ok(), url); const digest = hash(await response.body()); assert.equal(digest, hash(fs.readFileSync(file)), url);
                    report.resources.push({url, artifactPath: path.relative(site, file), sha256: digest});
                }
            }));
            assert.equal(assets.size, pending.length, 'Resource inventory changed');
        }
        check(!report.errors.length, 'Browser/hydration errors', report.errors);
        if (requireComplete) check(!report.documentGaps.length, 'Feature documents still use English fallback', report.documentGaps);
    } catch (error) {report.failures.push({message: error.message, stack: error.stack});}
    finally {
        await browser?.close(); if (server) await new Promise(resolve => server.close(resolve));
        report.completedAt = new Date().toISOString(); report.passed = !report.failures.length;
        fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
    }
    return report;
}

if (require.main === module) {
    const args = process.argv.slice(2), value = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
    verify({site: value('--site', 'build'), directory: value('--manifests', '.i18n-build/content-manifests'),
        output: value('--output', '.i18n-build/product-pages.json'), origin: value('--origin'), requireComplete: !args.includes('--allow-document-fallback')})
        .then(report => {console.log(JSON.stringify({passed: report.passed, pages: report.pages.length, layouts: report.layouts.length,
            interactions: report.interactions.length, contentComplete: report.contentComplete, requireComplete: report.requireComplete,
            documentGaps: report.documentGaps, failures: report.failures}, null, 2)); if (!report.passed) process.exitCode = 1;})
        .catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {verify, staticChecks, assetResolver};
