// Verify final static output, never the development server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const cheerio = require('cheerio');
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
function option(name) { const index = argv.indexOf(name); return index < 0 ? undefined : argv[index + 1]; }
const site = path.resolve(option('--site'));
const output = path.resolve(option('--output'));
const expectJapanese = argv.includes('--expect-ja');
const redirectCdn = argv.includes('--cdn-to-local');
const devOnly = argv.includes('--dev-only');
assert(!(expectJapanese && redirectCdn), 'Japanese must load its own real same-origin resources');
fs.mkdirSync(output, { recursive: true });
const normalize = value => value.replace(/\s+/g, ' ').trim();
const sampleRoutes = [
    '/', '/docs/dev/getting-started/what-is-apache-doris/',
    '/docs/4.x/getting-started/what-is-apache-doris/',
    '/docs/dev/getting-started/intro/',
    '/docs/dev/getting-started/before-you-start-the-poc/',
    '/docs/4.x/getting-started/before-you-start-the-poc/',
    '/community/join-community/', '/community/feedback/',
    '/download/', '/use-cases/ai/', '/blog/', '/404.html',
].filter(route => !devOnly || !route.includes('/docs/4.x/'));
const japaneseRoutes = sampleRoutes.filter(route => route === '/' || route.startsWith('/docs/') || route.startsWith('/community/')).map(route => `/ja${route}`);
const themes = ['doris', 'golden', 'blue', 'read', 'yellow-blue', 'purple', 'yellow-black', 'sky'];
function fileFor(route) {
    const filename = path.resolve(site, `.${decodeURIComponent(new URL(route, 'http://local').pathname)}`);
    assert(filename === site || filename.startsWith(`${site}${path.sep}`));
    return path.extname(filename) ? filename : path.join(filename, 'index.html');
}
function signature(route) {
    const file = fileFor(route);
    assert(fs.existsSync(file), `Missing static route: ${route}`);
    const $ = cheerio.load(fs.readFileSync(file, 'utf8'));
    // Japanese is a deliberate additional switch option when enabled. It must
    // not alter existing locale content or destinations.
    $('script, style, noscript, a[lang="ja"]').remove();
    return {
        lang: $('html').attr('lang'), title: $('title').text(),
        description: $('meta[name="description"]').attr('content') ?? null,
        canonical: $('link[rel="canonical"]').attr('href'),
        text: normalize($('body').text()),
        headings: $('h1,h2,h3').map((index, node) => [[$(node).prop('tagName'), $(node).attr('id') || '', normalize($(node).text())]]).get(),
        links: $('a').map((index, node) => [[normalize($(node).text()), $(node).attr('href') || '']]).get().sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    };
}
const signatures = Object.fromEntries(['', '/zh-CN'].flatMap(prefix => sampleRoutes.map(route => [prefix + route, signature(prefix + route)])));
fs.writeFileSync(path.join(output, 'signatures.json'), JSON.stringify(signatures, null, 2));
const results = { site, expectJapanese, redirectCdn, devOnly, checks: [], pages: [], network: [], errors: [] };
const baselineRenderedPath = option('--baseline') && path.join(path.dirname(option('--baseline')), 'rendered.json');
const baselineRendered = baselineRenderedPath && fs.existsSync(baselineRenderedPath)
    ? JSON.parse(fs.readFileSync(baselineRenderedPath, 'utf8')) : undefined;
const baselineResultPath = option('--baseline') && path.join(path.dirname(option('--baseline')), 'result.json');
const baselineErrors = baselineResultPath && fs.existsSync(baselineResultPath)
    ? JSON.parse(fs.readFileSync(baselineResultPath, 'utf8')).errors : [];
function checked(name, details) { results.checks.push({ name, details }); console.log(name); }
if (option('--baseline')) {
    const baseline = JSON.parse(fs.readFileSync(option('--baseline'), 'utf8'));
    for (const [route, expected] of Object.entries(baseline)) {
        if (devOnly && route.includes('/docs/4.x/')) continue;
        assert.deepEqual(signatures[route], { description: null, ...expected }, `Existing locale changed at ${route}`);
    }
    checked('English/Chinese text, headings, links, metadata match baseline', Object.keys(baseline));
}
if (!expectJapanese) {
    assert(!fs.existsSync(path.join(site, 'ja', 'index.html')));
    for (const route of Object.keys(signatures)) assert(!fs.readFileSync(fileFor(route), 'utf8').includes('lang="ja"'), `Japanese switch leaked into default build: ${route}`);
    checked('Japanese routes and language options absent by default');
}
if (expectJapanese) {
    const translatedRoutes = [
        '/ja/docs/dev/getting-started/what-is-apache-doris/',
        '/ja/docs/4.x/getting-started/what-is-apache-doris/',
        '/ja/docs/dev/getting-started/intro/', '/ja/community/join-community/',
    ].filter(route => !devOnly || !route.includes('/docs/4.x/'));
    for (const route of translatedRoutes) {
        const $ = cheerio.load(fs.readFileSync(fileFor(route), 'utf8'));
        const english = cheerio.load(fs.readFileSync(fileFor(route.replace(/^\/ja/, '')), 'utf8'));
        const ids = root => root('.theme-doc-markdown h1,.theme-doc-markdown h2,.theme-doc-markdown h3')
            .map((index, node) => root(node).attr('id') || '').get();
        assert.deepEqual(ids($), ids(english), `English heading IDs changed: ${route}`);
        assert.deepEqual($('.theme-doc-markdown pre code').map((index, node) => $(node).text()).get(),
            english('.theme-doc-markdown pre code').map((index, node) => english(node).text()).get(), `Protected code changed: ${route}`);
        $('.theme-doc-markdown a,.theme-doc-markdown img,.theme-doc-markdown iframe').each((index, node) => {
            const href = $(node).attr('href') || $(node).attr('src');
            if (!href || /^(https?:|mailto:|#)/.test(href)) return;
            const target = new URL(href, `http://local${route}`);
            assert(fs.existsSync(fileFor(target.pathname)), `Broken sample link/image/frame: ${route} -> ${href}`);
        });
    }
    checked('All four translations preserve English heading IDs/code and resolve their body links/images/frames');
}
const server = http.createServer((request, response) => {
    let file = fileFor(request.url);
    if (!fs.existsSync(file)) { response.writeHead(404); response.end('Not found'); return; }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
});
let browser;
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    // Block only unrelated third-party analytics/AI requests, identically for
    // baseline and PoC. Local assets and search are never mocked in the PoC.
    await context.route(/https:\/\/(widget\.kapa\.ai|analytics\.apache\.org|www\.googletagmanager\.com)\//, route => route.abort());
    if (redirectCdn) await context.route('https://cdnd.selectdb.com/**', async route => {
        const url = new URL(route.request().url());
        await route.fulfill({ response: await context.request.get(`${origin}${url.pathname}`) });
    });
    context.on('response', response => {
        const url = response.url();
        if (/\.(js|css)(\?|$)/.test(url) && url.startsWith(origin)) {
            results.network.push({ url: url.replace(origin, ''), status: response.status() });
        }
    });
    async function pageFor(route, viewport) {
        const page = await context.newPage();
        if (viewport) await page.setViewportSize(viewport);
        page.on('pageerror', error => results.errors.push({ route, error: error.message }));
        const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, route);
        await page.waitForTimeout(250);
        assert(await page.locator('#__docusaurus').innerText(), `Empty hydrated page: ${route}`);
        return page;
    }
    for (const route of Object.keys(signatures).concat(expectJapanese ? japaneseRoutes : [])) {
        const page = await pageFor(route);
        const state = await page.evaluate(() => ({
            lang: document.documentElement.lang,
            title: document.title,
            headings: [...document.querySelectorAll('h1,h2,h3')].map(node => [node.tagName, node.id, node.textContent.replace(/\s+/g, ' ').trim()]),
            notice: !!document.querySelector('[aria-label="翻訳状況"]'),
        }));
        results.pages.push({ route, ...state });
        if (!route.startsWith('/ja/')) {
            assert.equal(state.notice, false, `Japanese notice on ${route}`);
            // The existing blog populates posts after mount; some baseline
            // Chinese SSR heading IDs also differ from the hydrated values.
            // Preserve and report both representations, then compare each to
            // its own baseline instead of treating these as new regressions.
            if (JSON.stringify(state.headings) !== JSON.stringify(signatures[route].headings)) {
                results.checks.push({ name: 'Baseline SSR/rendered heading difference', route, ssr: signatures[route].headings, rendered: state.headings });
            }
            if (baselineRendered) assert.deepEqual(state, baselineRendered[route], `Rendered locale changed: ${route}`);
        }
        if (route.startsWith('/ja/')) {
            assert.equal(state.lang, 'ja');
            const fallback = route.includes('before-you-start-the-poc') || route.endsWith('/feedback/');
            assert.equal(state.notice, fallback, route);
            const body = page.locator('.theme-doc-markdown');
            if (fallback) {
                assert(await page.locator('div[lang="en"] .theme-doc-markdown').count(), `English body language missing: ${route}`);
                const english = cheerio.load(fs.readFileSync(fileFor(route.replace(/^\/ja/, '')), 'utf8'));
                assert.equal(normalize(await body.textContent()), normalize(english('.theme-doc-markdown').text()), `Wrong version or stale fallback: ${route}`);
            } else if (route !== '/ja/') {
                assert(/[\u3040-\u30ff]/.test(await body.textContent()), `Not a real translation: ${route}`);
            }
            await page.reload({ waitUntil: 'networkidle' });
            assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
        }
        await page.close();
    }
    checked('Direct static routes, refresh, SSR/hydration and per-file/version fallback');
    for (const prefix of ['', '/zh-CN']) {
        const page = await pageFor(`${prefix}/docs/${devOnly ? 'dev' : '4.x'}/getting-started/what-is-apache-doris/`);
        const workers = [];
        page.on('worker', worker => workers.push(worker.url()));
        const input = page.locator('input[aria-label="Search"]:visible').first();
        await input.focus();
        // Focus initializes autocomplete for the current docs context. Typing
        // before it is ready races the site's existing no-context instance.
        await page.waitForTimeout(1500);
        await input.fill('Doris');
        const suggestion = page.locator('[class*="suggestion_"]');
        await suggestion.first().waitFor({ timeout: 30000 });
        assert(await suggestion.count() > 0);
        results.checks.push({ name: `Search suggestions ${prefix || 'en'}`, workers, text: (await suggestion.first().innerText()).slice(0, 300) });
        await page.close();
    }
    checked('Existing English/Chinese search suggestions');
    if (expectJapanese) {
        const page = await pageFor('/ja/docs/dev/getting-started/intro/');
        let documentRequests = 0;
        page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests++; });
        await page.locator('a.getting-started-card[href="/ja/docs/dev/getting-started/what-is-apache-doris/"]').click();
        await page.waitForURL('**/ja/docs/dev/getting-started/what-is-apache-doris/');
        assert.equal(documentRequests, 0, 'MDX card should navigate within Japanese SPA');
        await page.goBack();
        await page.waitForURL('**/ja/docs/dev/getting-started/intro/');
        await page.locator('a.getting-started-card[href="/ja/docs/dev/getting-started/before-you-start-the-poc/"]').click();
        await page.waitForSelector('[aria-label="翻訳状況"]');
        checked('MDX card SPA navigation, browser back and untranslated card destination');
        const version = devOnly ? 'dev' : '4.x';
        await page.goto(`${origin}/docs/${version}/getting-started/what-is-apache-doris/?poc=1#technical-features`, { waitUntil: 'networkidle' });
        await page.locator('.dropdown').filter({ has: page.locator('a[lang="ja"]') }).first().hover();
        await page.locator('a[lang="ja"]').first().click();
        await page.waitForURL(`**/ja/docs/${version}/getting-started/what-is-apache-doris/?poc=1#technical-features`);
        assert(await page.locator('#technical-features').count(), 'Translated heading lost English anchor');
        await page.locator('.dropdown').filter({ has: page.locator('a[lang="en-US"]') }).first().hover();
        await page.locator('a[lang="en-US"]').first().click();
        await page.waitForURL(`**/docs/${version}/getting-started/what-is-apache-doris/?poc=1#technical-features`);
        checked(`Language switching preserves page, ${version} version, query and English heading hash`);
        await page.close();
        for (const width of [1440, 390]) {
            for (const theme of themes) {
                const page = await pageFor('/ja/', { width, height: 1000 });
                await page.evaluate(theme => { localStorage.setItem('doris-brand-theme', theme); }, theme);
                await page.reload({ waitUntil: 'networkidle' });
                assert.equal(await page.locator('html').getAttribute('data-brand-theme'), theme);
                const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
                assert(dimensions.document <= dimensions.viewport + 1, `Horizontal overflow: ja ${width} ${theme}`);
                if (width === 390) {
                    await page.locator('.navbar-next__menu-button').click();
                    assert.equal(await page.locator('.navbar-next__menu-button').getAttribute('aria-expanded'), 'true');
                    const ids = await page.locator('.navbar-next__mobile-links').evaluateAll(nodes => nodes.map(node => node.id));
                    assert.equal(new Set(ids).size, ids.length, 'Translated nav labels produced duplicate DOM IDs');
                    await page.locator('.navbar-next__menu-button').click();
                }
                await page.screenshot({ path: path.join(output, `ja-${width}-${theme}.png`), fullPage: true });
                results.checks.push({ name: 'Japanese homepage theme and viewport', theme, width, dimensions });
                await page.close();
            }
        }
        checked('Japanese homepage desktop/mobile and all eight brand themes');
    }
    for (const prefix of ['', '/zh-CN']) for (const width of [1440, 390]) {
        const page = await pageFor(`${prefix}/`, { width, height: 1000 });
        await page.screenshot({ path: path.join(output, `${prefix ? 'zh' : 'en'}-${width}.png`), fullPage: true });
        assert(!await page.locator('[aria-label="翻訳状況"]').count());
        await page.close();
    }
    const failedResources = results.network.filter(response => response.status >= 400);
    assert.deepEqual(failedResources, [], 'This artifact has missing JS/CSS/worker resources');
    if (expectJapanese) assert(results.network.some(response => response.url.startsWith('/ja/assets/') && response.url.endsWith('.js')), 'Japanese did not load its own JS');
    if (redirectCdn) {
        // Capture existing failures, including the search widget's empty-context
        // race, so the PoC cannot silently introduce any additional errors.
        checked('Captured original baseline page errors', results.errors);
    } else {
        const existingErrors = new Set(baselineErrors.map(error => JSON.stringify(error)));
        const newErrors = results.errors.filter(error => !existingErrors.has(JSON.stringify(error)));
        assert.deepEqual(newErrors, [], 'New page or hydration errors');
    }
    checked('Own JS/CSS resources load successfully; page errors match baseline');
    results.passed = true;
})().catch(error => {
    results.passed = false;
    results.failure = error.stack;
    console.error(error);
    process.exitCode = 1;
}).finally(async () => {
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(output, 'rendered.json'), JSON.stringify(Object.fromEntries(results.pages.filter(page => !page.route.startsWith('/ja/')).map(({ route, ...state }) => [route, state])), null, 2));
    if (browser) await browser.close();
    server.close();
});
