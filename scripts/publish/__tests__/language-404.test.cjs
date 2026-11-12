const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createServer} = require('../serve.cjs');
const {apache} = require('../apache.cjs');
const {optimize} = require('../optimize.cjs');
const redirect = require('@docusaurus/plugin-client-redirects/lib/createRedirectPageContent').default;
const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];

for (const host of ['preview', 'apache']) test(`${host} preserves real language 404s, fallback 200 and known historical redirects`, async t => {
    const site = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-language-404-'));
    t.after(() => fs.rmSync(site, {recursive: true, force: true}));
    const write = (file, text) => {fs.mkdirSync(path.dirname(path.join(site, file)), {recursive: true}); fs.writeFileSync(path.join(site, file), text);};
    write('.htaccess', fs.readFileSync(path.resolve(__dirname, '../../../static/.htaccess')));
    for (const locale of locales) {
        const prefix = locale === 'en' ? '' : locale + '/';
        write(prefix + '404.html', `<html lang="${locale}"><h1>${locale} not found</h1></html>`);
        write(prefix + 'index.html', '<h1>Home</h1>');
        write(prefix + 'download/index.html', '<main lang="en">English fallback</main>');
        write(prefix + 'docs/dev/known/index.html', '<h1>Known document</h1>');
        write(prefix + 'docs/dev/old/index.html', redirect({toUrl: '/' + prefix + 'docs/dev/known/'}));
    }
    optimize({site, locales: locales.map(locale => ({locale, directory: locale === 'en' ? '.' : locale}))});
    let origin;
    if (host === 'apache') {
        const server = await apache(site); origin = server.origin; t.after(() => server.close());
    } else {
        const server = createServer(site); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        origin = `http://127.0.0.1:${server.address().port}`; t.after(() => new Promise(resolve => server.close(resolve)));
    }
    for (const locale of locales) {
        const prefix = locale === 'en' ? '' : '/' + locale;
        for (const missing of ['/missing/', '/docs/dev/unknown/', '/blog/unknown/']) {
            const response = await fetch(origin + prefix + missing, {redirect: 'manual'});
            assert.equal(response.status, 404, prefix + missing);
            assert((await response.text()).includes(`${locale} not found`));
        }
        assert.equal((await fetch(origin + prefix + '/download/')).status, 200);
        const old = await fetch(origin + prefix + '/docs/dev/old/?from=test', {redirect: 'manual'});
        assert.equal(old.status, 301);
        assert.equal(new URL(old.headers.get('location'), origin).pathname, prefix + '/docs/dev/known/');
        assert.equal(new URL(old.headers.get('location'), origin).search, '?from=test');
    }
});
