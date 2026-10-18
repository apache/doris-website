// Small real builds: no production ko registration or full-version site build.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {createFixture} = require('./__tests__/fixtures/multi-locale.cjs');
const {verify} = require('./verify-static.cjs');
const root = path.resolve(__dirname, '../..');

async function verifyBrowser(site, locales) {
    const http = require('node:http');
    const {chromium} = require('playwright');
    const server = http.createServer(async (request, response) => {
        try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://local').pathname);
            const file = path.join(site, pathname, path.extname(pathname) ? '' : 'index.html');
            response.setHeader('Content-Type', {'.js':'application/javascript', '.css':'text/css', '.html':'text/html; charset=utf-8'}[path.extname(file)] ?? 'application/octet-stream');
            response.end(await fs.readFile(file));
        } catch {response.writeHead(404); response.end('Not found');}
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({headless: true});
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const origin = `http://127.0.0.1:${server.address().port}`;
        for (const locale of locales) {
            await page.goto(origin + `/${locale}/docs/dev/english-shared/?fixture=1#usage`, {waitUntil: 'networkidle'});
            assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), locale);
            for (const lang of ['en-US', 'zh-Hans-CN', ...locales]) assert.equal(await page.locator(`link[rel="alternate"][hreflang="${lang}"]`).count(), 1);
            const other = locale === 'ja' ? 'ko-only' : 'ja-only';
            await page.locator(`.theme-doc-markdown a[href="/${locale}/docs/dev/english-${other}/"]`).click();
            await page.waitForSelector('[data-translation-status="stale_technical"]');
            assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), 'en');
            assert.equal(await page.locator(`link[rel="alternate"][hreflang="${locale}"]`).count(), 0);
            assert.equal(await page.locator('link[rel="alternate"][hreflang="zh-Hans-CN"]').getAttribute('href'),
                `https://doris.apache.org/zh-CN/docs/dev/chinese-${other}/`);
            await page.goBack({waitUntil: 'networkidle'});
            assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), locale);
            await page.reload({waitUntil: 'networkidle'});
            assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'), locale);
        }
        assert.deepEqual(errors, []);
        return {passed: true, locales, checks: ['hydration', 'complete alternates', 'SPA stale fallback', 'Chinese slug', 'back', 'refresh']};
    } finally {await browser.close(); await new Promise(resolve => server.close(resolve));}
}

async function main() {
    const results = [];
    for (const disabled of [false, true]) {
        const fixture = path.join(root, '.i18n-build', disabled ? 'multi-locale-disabled-fixture' : 'multi-locale-fixture');
        await fs.rm(fixture, {recursive: true, force: true});
        await createFixture(fixture);
        const result = spawnSync(process.execPath, [path.join(root, 'scripts/build-locales.cjs'), '--site-dir', fixture],
            {stdio: 'inherit', env: {...process.env, FIXTURE_DISABLE_KO: disabled ? 'true' : '', NODE_OPTIONS: '--max-old-space-size=4096'}});
        assert.equal(result.status, 0, 'Multi-locale fixture build failed');
        const locales = disabled ? ['ja'] : ['ja', 'ko'];
        const site = path.join(fixture, 'build');
        const verification = Object.fromEntries(locales.map(locale => [locale, verify({site,
            manifest: path.join(fixture, '.i18n-build/manifests', `${locale}.json`)})]));
        const browser = process.argv.includes('--browser') ? await verifyBrowser(site, locales) : undefined;
        results.push({fixture, disabled, verification, browser});
    }
    await fs.writeFile(path.join(root, '.i18n-build/multi-locale-verification.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results, null, 2));
}
if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
