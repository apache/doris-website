const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const {createServer} = require('../publish/serve.cjs');
const {localeRegistry} = require('../../config/i18n');

function verifyContent(site, directory) {
    const reports = [];
    for (const filename of fs.readdirSync(directory).filter(file => /^[^.]+(?:-[^.]+)?\.json$/.test(file))) {
        const manifest = JSON.parse(fs.readFileSync(path.join(directory, filename)));
        if (!manifest.pages) continue;
        const locale = manifest.locale;
        const lang = code => localeRegistry.find(item => item.code === code)?.htmlLang ?? code;
        const sample = new Set();
        const pages = manifest.pages.filter(page => {
            if (['page', 'utility'].includes(page.kind)) return true;
            const key = page.kind + ':' + (page.pluginId ?? '') + ':' + (page.version ?? '');
            if (sample.has(key)) return false;
            sample.add(key); return true;
        });
        const sitemapFile = path.join(site, locale === 'en' ? '' : locale, 'sitemap.xml');
        const xml = fs.existsSync(sitemapFile) ? cheerio.load(fs.readFileSync(sitemapFile), {xmlMode: true}) : null;
        const indexed = new Set(xml ? xml('loc').map((_, node) => new URL(xml(node).text()).pathname).get() : []);
        for (const page of pages) {
            const html = fs.readFileSync(path.join(site, decodeURIComponent(page.route), 'index.html'), 'utf8');
            const $ = cheerio.load(html);
            const canonical = 'https://doris.apache.org' + (page.fallback ? page.englishRoute : page.route);
            assert.equal($('html').attr('lang'), lang(locale), page.route);
            assert.equal($('link[rel="canonical"]').length, 1, page.route);
            assert.equal($('link[rel="canonical"]').attr('href'), canonical, page.route);
            assert.equal($('meta[property="og:url"]').attr('content'), canonical, page.route);
            assert.equal(($('meta[name="robots"]').attr('content') ?? '').includes('noindex'), !page.indexable, page.route);
            assert.equal(indexed.has(page.route), page.indexable, `Sitemap: ${page.route}`);
            if (page.kind === 'page') {
                assert.equal($('[data-content-id]').attr('lang'), page.contentLocale, page.route);
                assert.equal($('.page-fallback-notice').length, page.fallback ? 1 : 0, page.route);
            }
            const links = $('link[rel="alternate"][hreflang]');
            assert.equal(links.length, page.availableTranslations.length + (page.availableTranslations.includes('en') ? 1 : 0), page.route);
            for (const code of page.availableTranslations) {
                assert.equal(links.filter(`[hreflang="${lang(code)}"]`).attr('href'), 'https://doris.apache.org' + page.navigationRoutes[code], page.route);
                const other = cheerio.load(fs.readFileSync(path.join(site, decodeURIComponent(page.navigationRoutes[code]), 'index.html')));
                for (const back of page.availableTranslations) assert.equal(other(`link[hreflang="${lang(back)}"]`).attr('href'), 'https://doris.apache.org' + page.navigationRoutes[back]);
            }
        }
        reports.push({locale, sampledPages: pages.length, sourceSha: manifest.sourceSha});
    }
    return reports;
}
async function verifyBrowser(site, {fixture = false, manifests = '.i18n-build/content-manifests',
    ordinary = fixture ? 'sample-2/' : 'download/', output = '.i18n-build/browser-global-language.json'} = {}) {
    const manifest = JSON.parse(fs.readFileSync(path.join(manifests, 'ja.json')));
    const ordinaryPage = manifest.pages.find(page => page.kind === 'page' && page.route === '/ja/' + ordinary);
    assert(ordinaryPage, `Missing ordinary-page manifest entry: /ja/${ordinary}`);
    // The fixture deliberately exercises fallback. A real page may acquire a
    // translation without changing its language-menu/navigation contract.
    if (fixture && ordinary === 'sample-2/') assert.equal(ordinaryPage.fallback, true);
    const {chromium} = require('playwright');
    const server = createServer(site);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    let browser;
    const errors = [], themes = [];
    try {
        browser = await chromium.launch({headless: true});
        const context = await browser.newContext();
        // Production CDN URLs are fulfilled from the very artifact being tested.
        const localAssets = async route => {
            const url = new URL(route.request().url());
            if (url.origin === origin) return route.continue();
            if (url.hostname === 'cdnd.selectdb.com') {
                const response = await context.request.get(origin + url.pathname + url.search);
                return route.fulfill({response});
            }
            return route.abort();
        };
        await context.route('**/*', localAssets);
        const page = await context.newPage();
        page.on('pageerror', error => {errors.push(error.message);});
        page.on('console', message => {if (/hydration|did not match|server HTML/i.test(message.text())) errors.push(message.text());});
        await page.goto(origin + '/ja/' + ordinary + '?from=qa#usage');
        await page.locator('.language-menu a[href*="from=qa"]').first().waitFor({state: 'attached'});
        assert.equal(await page.locator('[data-content-id]').first().getAttribute('lang'), ordinaryPage.contentLocale);
        const menu = page.locator('.language-menu:not(.language-menu--mobile)');
        await menu.locator('summary').click();
        const english = menu.locator('a[lang="en-US"]');
        assert.equal(await english.getAttribute('href'), '/' + ordinary + '?from=qa#usage');
        await english.click();
        await page.waitForURL(origin + '/' + ordinary + '?from=qa#usage');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('doris.localePreference')).locale), 'en');
        await page.evaluate(() => localStorage.setItem('doris.localePreference', JSON.stringify({version: 1, locale: 'ja', updatedAt: Date.now()})));
        await page.goto(origin + '/ko/' + ordinary);
        assert.equal(new URL(page.url()).pathname, '/ko/' + ordinary);
        assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
        const denied = await browser.newContext();
        await denied.route('**/*', localAssets);
        await denied.addInitScript(() => {
            Storage.prototype.getItem = () => {throw new Error('Storage disabled');};
            Storage.prototype.setItem = () => {throw new Error('Storage disabled');};
        });
        const deniedPage = await denied.newPage();
        await deniedPage.goto(origin + '/ja/' + ordinary);
        await deniedPage.locator('.language-menu').first().locator('summary').click();
        await deniedPage.locator('.language-menu').first().locator('a[lang="ko"]').click();
        await deniedPage.waitForURL(origin + '/ko/' + ordinary);
        await denied.close();
        if (fixture) {
            await page.goto(origin + '/');
            await page.locator('html[data-has-hydrated="true"]').waitFor();
            const [download] = await Promise.all([page.waitForEvent('download'), page.locator('nav a[href="/files/manual.txt"]').click()]);
            assert.equal(await fs.promises.readFile(await download.path(), 'utf8'), 'Fixture download');
            await page.goto(origin + '/ja/');
            for (const target of ['/ja/sample-2/', '/ja/blog/native-0/', '/ja/docs/4.x/english-shared/', '/ja/']) {
                const link = page.locator(`nav a[href="${target}"]`).first();
                if (await link.count()) {await link.click(); await page.waitForURL(origin + target);} else await page.goto(origin + target);
                assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
            }
            await page.goto(origin + '/ja/docs/dev/english-shared/?from=qa#usage');
            await page.locator('.language-menu a[href*="from=qa"]').first().waitFor({state: 'attached'});
            assert.equal(await page.locator('.language-menu a[lang="zh-Hans-CN"]').first().getAttribute('href'), '/zh-CN/docs/dev/chinese-shared/?from=qa#usage');
            const response = await page.goto(origin + '/ja/docs/dev/unknown/');
            assert.equal(response.status(), 404);
            assert.equal(await page.locator('h1').count(), 1);
            assert((await page.locator('h1').textContent()).trim());
            assert.equal(await page.locator('.theme-doc-markdown').count(), 0);
        } else {
            for (const width of [1440, 390]) {
                await page.setViewportSize({width, height: 900});
                await page.goto(origin + '/ru/download/');
                const details = page.locator('.navbar-next .language-menu');
                await details.locator('summary').scrollIntoViewIfNeeded();
                await details.locator('summary').focus(); await page.keyboard.press('Enter');
                assert.equal(await details.getAttribute('open'), '');
                for (const theme of ['doris', 'golden', 'blue', 'read', 'yellow-blue', 'purple', 'yellow-black', 'sky']) {
                    await page.evaluate(theme => {document.documentElement.dataset.brandTheme = theme;}, theme);
                    for (const link of await details.locator('a').all()) {
                        await link.scrollIntoViewIfNeeded(); const box = await link.boundingBox();
                        assert(box.x >= -1 && box.x + box.width <= width + 1, `${width}/${theme}: clipped language link`);
                    }
                    const contrast = await details.locator('summary').evaluate(node => {
                        const luminance = color => {
                            const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255)
                                .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
                            return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
                        };
                        const a = luminance(getComputedStyle(node).color), b = luminance(getComputedStyle(node.closest('.navbar-next')).backgroundColor);
                        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
                    });
                    assert(contrast >= 4.5, `${width}/${theme}: language label contrast ${contrast}`);
                    themes.push({width, theme, contrast});
                    if (['doris', 'yellow-black', 'sky'].includes(theme)) await page.screenshot({path: path.join(path.dirname(output), `language-menu-${width}-${theme}.png`)});
                }
                await page.keyboard.press('Escape');
                assert.equal(await details.getAttribute('open'), null);
            }
        }
        const noJs = await browser.newContext({javaScriptEnabled: false});
        const noJsPage = await noJs.newPage(); await noJsPage.goto(origin + '/ja/' + ordinary);
        assert.equal(await noJsPage.locator('[data-content-id]').first().getAttribute('lang'), ordinaryPage.contentLocale);
        assert.equal(await noJsPage.locator('.page-fallback-notice').count(), ordinaryPage.fallback ? 1 : 0);
        assert.equal(await noJsPage.locator('.language-menu a').first().getAttribute('href'), '/' + ordinary);
        await noJs.close();
        assert.deepEqual(errors, []);
        const result = {site: path.resolve(site), fixture, themes, errors, checks: ['SSR suffix hydration', 'manual en preference', 'URL overrides stored ja', 'storage disabled', 'no JavaScript', ...(fixture ? ['internal resource download', 'navigation chain', 'localized unknown docs 404'] : ['keyboard', 'mobile', 'all brand themes'])]};
        fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
        return result;
    } finally {await browser?.close(); await new Promise(resolve => server.close(resolve));}
}
async function main() {
    const args = process.argv.slice(2); const value = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
    const site = value('--site', 'build'), output = value('--output', '.i18n-build/browser-global-language.json');
    fs.mkdirSync(path.dirname(output), {recursive: true});
    const manifests = value('--manifests', '.i18n-build/content-manifests');
    const content = verifyContent(site, manifests);
    const browser = await verifyBrowser(site, {fixture: args.includes('--fixture'), manifests, output});
    if (args.includes('--fixture'))
        browser.translatedPage = await verifyBrowser(site, {fixture: true, manifests, ordinary: 'sample-0/', output});
    fs.writeFileSync(output, JSON.stringify({content, ...browser}, null, 2) + '\n');
    console.log(JSON.stringify({content, ...browser}));
}
if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {verifyContent, verifyBrowser};
