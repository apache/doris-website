// Native route coverage and representative navigation UI. verify-static covers
// body language and SEO on every page; this avoids parsing the same site twice.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const {inventoryBaseline} = require('./state.cjs');
const root = path.resolve(__dirname, '../..');

function verifyRedirect(html, target) {
    const $ = cheerio.load(html);
    const origin = 'https://doris.apache.org';
    const expected = new URL(target, origin).href;
    assert.equal($('link[rel="canonical"]').length, 1, 'Missing or duplicate redirect canonical');
    const canonical = $('link[rel="canonical"]').attr('href');
    assert(canonical, 'Missing redirect canonical URL');
    assert.equal(new URL(canonical, origin).href, expected);
    const refresh = $('meta[http-equiv="refresh"]').attr('content');
    assert(refresh?.startsWith('0; url='), 'Missing immediate native redirect');
    assert.equal(new URL(refresh.slice('0; url='.length), origin).href, expected);
}

function verify({site, locale = 'ja', snapshot = inventoryBaseline(root, locale), devOnly = false,
    manifest = path.join(root, '.i18n-build/manifests', `${locale}.json`)}) {
    const summary = JSON.parse(fs.readFileSync(path.join(snapshot, 'summary.json'), 'utf8'));
    assert.equal(summary.locale, locale, 'Inventory belongs to a different locale');
    const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    assert.equal(data.locale, locale, 'Translation manifest belongs to a different locale');
    const scope = JSON.parse(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`), 'utf8'));
    const dictionary = JSON.parse(fs.readFileSync(path.join(root, `i18n/${locale}/code.json`), 'utf8'));
    const filename = route => path.join(site, decodeURIComponent(route), 'index.html');
    const read = route => {
        assert(fs.existsSync(filename(route)), `Missing static document/entry: ${route}`);
        return cheerio.load(fs.readFileSync(filename(route), 'utf8'));
    };
    let routes = 0;
    const checks = [];
    for (const group of scope.groups.filter(group => !devOnly || group.version !== '4.x')) {
        // Use the current build manifest, not a historical snapshot allowlist.
        const pages = data.pages.filter(page => page.pluginId === group.pluginId && page.version === group.version && !page.draft);
        assert(pages.length, `Missing built native group: ${group.id}`);
        for (const page of pages) {
            assert(fs.existsSync(filename(page.permalink)), `Missing native route: ${page.permalink}`);
            routes++;
        }
        const representative = pages.find(page => page.status === 'current' && page.indexable) ?? pages[0];
        const $ = read(representative.permalink);
        assert.equal($('.theme-doc-markdown').attr('lang'), representative.contentLocale, representative.permalink);
        const sidebar = $('.theme-doc-sidebar-container');
        assert(sidebar.length, `Missing document sidebar: ${representative.permalink}`);
        const links = sidebar.find('a[href]').map((_, node) => $(node).attr('href')).get();
        for (const link of links.filter(link => link.startsWith(`/${locale}/`))) read(new URL(link, 'https://doris.apache.org').pathname);
        const domains = [];
        if (group.pluginId === 'default') {
            const label = dictionary['docs.navigation.sections']?.message ?? 'Documentation sections';
            const nav = $('nav').filter((_, node) => $(node).attr('aria-label') === label);
            assert(nav.length, `Missing document domain navigation: ${representative.permalink}`);
            for (const node of nav.find('a[href]').toArray()) {
                const link = $(node).attr('href');
                assert(link.startsWith(`/${locale}/docs/`), `Wrong domain locale: ${link}`);
                read(new URL(link, 'https://doris.apache.org').pathname);
                domains.push($(node).text());
            }
            assert(domains.length, 'No document domains');
        }
        checks.push({group: group.id, routes: pages.length, sample: representative.permalink,
            contentLocale: representative.contentLocale, sidebarLinks: links.length, domains: [...new Set(domains)]});
    }
    if (!devOnly) {
        const entry = `/${locale}/docs/`;
        const origin = 'https://doris.apache.org';
        let target;
        if (fs.existsSync(filename(entry))) {
            const html = read(entry);
            target = new URL(html('link[rel="canonical"]').attr('href'), origin).pathname;
            verifyRedirect(html.html(), target);
        } else {
            const redirects = JSON.parse(fs.readFileSync(path.join(site, '.publish/redirects.json'), 'utf8')).redirects;
            const redirect = redirects.find(([from]) => from.replace(/\/$/, '') === entry.replace(/\/$/, ''));
            assert(redirect, `Missing compacted stable entry: ${entry}`);
            const url = new URL(redirect[1], origin);
            assert.equal(url.origin, origin, 'Stable entry must remain on this site');
            target = url.pathname;
        }
        assert(data.pages.some(page => page.pluginId === 'default' && page.version === '4.x' && page.permalink === target),
            `Stable entry is not a registered 4.x document: ${target}`);
        read(target);
        checks.push({entry, target});
    }
    return {locale, snapshotSourceCommit: summary.sourceCommit, manifest, devOnly, routes, bodyLanguageSamples: checks.filter(check => check.sample).length, checks};
}
if (require.main === module) {
    try {
        const args = process.argv.slice(2);
        const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
        const locale = option('--locale') ?? 'ja';
        const result = verify({site: path.resolve(option('--site')), locale,
            snapshot: option('--snapshot') ? path.resolve(option('--snapshot')) : undefined,
            manifest: option('--manifest') ? path.resolve(option('--manifest')) : undefined, devOnly: args.includes('--dev-only')});
        if (option('--output')) fs.writeFileSync(option('--output'), JSON.stringify(result, null, 2) + '\n');
        console.log(JSON.stringify(result));
    } catch (error) {console.error(error); process.exitCode = 1;}
}
module.exports = {verify, verifyRedirect};
