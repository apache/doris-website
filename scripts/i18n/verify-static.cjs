const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');

function verify({site, manifest}) {
    const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    const sitemapFile = path.join(site, 'ja/sitemap.xml');
    const sitemap = fs.existsSync(sitemapFile) ? cheerio.load(fs.readFileSync(sitemapFile, 'utf8'), {xmlMode: true}) : null;
    const sitemapPaths = new Set(sitemap ? sitemap('loc').map((i, node) => new URL(sitemap(node).text()).pathname).get() : []);
    const indexedPaths = new Set();
    function readIndexes(dir) {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const file = path.join(dir, entry.name);
            if (entry.isDirectory()) readIndexes(file);
            else if (/^search-index.*\.json$/.test(entry.name)) {
                for (const index of JSON.parse(fs.readFileSync(file, 'utf8'))) {
                    for (const doc of index.documents ?? []) {
                        if (doc.u) indexedPaths.add(new URL(doc.u, 'https://doris.apache.org').pathname.replace(/\/$/, '') + '/');
                    }
                }
            }
        }
    }
    readIndexes(path.join(site, 'ja'));
    let verified = 0;
    for (const page of data.pages) {
        const filename = path.join(site, decodeURIComponent(page.permalink), 'index.html');
        if (!fs.existsSync(filename)) {
            assert(page.draft, `Missing non-draft static page: ${page.permalink}`);
            continue;
        }
        const $ = cheerio.load(fs.readFileSync(filename, 'utf8'));
        const body = $('.theme-doc-markdown,.course-doc-content');
        assert.equal(body.attr('lang'), page.contentLocale, `Body language: ${page.permalink}`);
        assert.equal($('[data-translation-status]').attr('data-translation-status'), page.status, `Notice: ${page.permalink}`);
        assert.equal($('link[rel="canonical"]').length, 1, `Duplicate canonical: ${page.permalink}`);
        const canonical = page.useTarget ? page.permalink : page.contentLocale === 'en' ? page.englishPermalink : page.sourcePermalink;
        assert.equal($('link[rel="canonical"]').attr('href'), `https://doris.apache.org${canonical}`);
        const alternates = $('link[rel="alternate"][hreflang]');
        const japanese = alternates.filter('[hreflang="ja"]');
        assert.equal(japanese.length, page.alternates.ja ? 1 : 0, `Japanese alternate: ${page.permalink}`);
        if (!page.indexable) {
            assert($('meta[name="robots"]').attr('content').includes('noindex'), page.permalink);
            assert(!sitemapPaths.has(page.permalink), `Fallback/stale page in sitemap: ${page.permalink}`);
            assert(!indexedPaths.has(page.permalink), `Fallback/stale page in local search index: ${page.permalink}`);
            for (const permalink of Object.values(page.alternates)) {
                const file = path.join(site, permalink, 'index.html');
                if (fs.existsSync(file)) {
                    const counterpart = cheerio.load(fs.readFileSync(file, 'utf8'));
                    assert.equal(counterpart('link[rel="alternate"][hreflang="ja"]').length, 0,
                        `Fallback/stale Japanese alternate in ${permalink}`);
                }
            }
        } else {
            assert(!($('meta[name="robots"]').attr('content') ?? '').includes('noindex'), page.permalink);
            assert(sitemapPaths.has(page.permalink), `Current page missing from sitemap: ${page.permalink}`);
            const ids = root => root('.theme-doc-markdown h1,.theme-doc-markdown h2,.theme-doc-markdown h3,.theme-doc-markdown h4,.theme-doc-markdown h5,.theme-doc-markdown h6').map((i, node) => root(node).attr('id') ?? '').get();
            const english = cheerio.load(fs.readFileSync(path.join(site, page.englishPermalink, 'index.html'), 'utf8'));
            assert.deepEqual(ids($), ids(english), `Source heading IDs: ${page.permalink}`);
            for (const [lang, permalink] of Object.entries(page.alternates)) {
                const counterpart = cheerio.load(fs.readFileSync(path.join(site, permalink, 'index.html'), 'utf8'));
                const links = counterpart('link[rel="alternate"][hreflang]');
                for (const [otherLang, otherPath] of Object.entries(page.alternates)) {
                    const htmlLang = otherLang === 'en' ? 'en-US' : otherLang === 'zh-CN' ? 'zh-Hans-CN' : otherLang;
                    assert.equal(links.filter(`[hreflang="${htmlLang}"]`).attr('href'), `https://doris.apache.org${otherPath}`,
                        `Non-reciprocal alternates ${lang} -> ${otherLang}: ${permalink}`);
                    assert.equal(links.filter(`[hreflang="${htmlLang}"]`).length, 1, `Duplicate hreflang: ${permalink}`);
                }
            }
        }
        verified++;
    }
    return {verified, indexedPaths: indexedPaths.size, states: Object.fromEntries([...new Set(data.pages.map(page => page.status))]
        .map(status => [status, data.pages.filter(page => page.status === status).length])), reports: data.reports};
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const option = name => args[args.indexOf(name) + 1];
    const result = verify({site: path.resolve(option('--site')), manifest: path.resolve(option('--manifest'))});
    if (args.includes('--output')) fs.writeFileSync(option('--output'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({verified: result.verified, states: result.states, reports: result.reports.length}));
}
module.exports = {verify};
