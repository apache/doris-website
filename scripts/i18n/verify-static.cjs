const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const {localeRegistry} = require('../../config/i18n');

// The manifest names the locale it describes, so verified artifacts follow the
// configured htmlLang instead of a language written into this file.
const htmlLangFor = locale => localeRegistry.find(item => item.code === locale)?.htmlLang ?? locale;

// `partial` verifies a site built from a locale subset. Assertions about the
// current locale itself still run; a counterpart page that the subset did not
// build is reported as skipped instead of read. Publishing always verifies the
// complete site, where every counterpart must be present.
function verify({site, manifest, partial = false}) {
    const data = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    const locale = data.locale;
    const contentFile = path.join(path.dirname(path.dirname(manifest)), 'content-manifests', locale + '.json');
    const contentPages = fs.existsSync(contentFile) ? JSON.parse(fs.readFileSync(contentFile)).pages : [];
    const contentByRoute = new Map(contentPages.map(page => [page.route, page]));
    if (!locale) throw new Error(`Manifest has no locale: ${manifest}`);
    const htmlLang = htmlLangFor(locale);
    const sitemapFile = path.join(site, locale, 'sitemap.xml');
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
    readIndexes(path.join(site, locale));
    let verified = 0;
    let skipped = 0;
    function counterpart(permalink, check) {
        const file = path.join(site, permalink, 'index.html');
        if (fs.existsSync(file)) return cheerio.load(fs.readFileSync(file, 'utf8'));
        assert(partial, `Missing counterpart page (${check}): ${permalink}`);
        skipped++;
        return null;
    }
    for (const page of data.pages) {
        const decision = contentByRoute.get(page.permalink);
        const alternateGroup = decision ? Object.fromEntries(decision.availableTranslations.map(locale => [locale, decision.navigationRoutes[locale]])) : page.alternates;
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
        const localized = alternates.filter(`[hreflang="${htmlLang}"]`);
        assert.equal(localized.length, alternateGroup[locale] ? 1 : 0, `Localized alternate: ${page.permalink}`);
        if (!page.indexable) {
            assert($('meta[name="robots"]').attr('content').includes('noindex'), page.permalink);
            assert(!sitemapPaths.has(page.permalink), `Fallback/stale page in sitemap: ${page.permalink}`);
            assert(!indexedPaths.has(page.permalink), `Fallback/stale page in local search index: ${page.permalink}`);
            for (const permalink of Object.values(alternateGroup)) {
                const file = path.join(site, permalink, 'index.html');
                if (fs.existsSync(file)) {
                    const counterpart = cheerio.load(fs.readFileSync(file, 'utf8'));
                    assert.equal(counterpart(`link[rel="alternate"][hreflang="${htmlLang}"]`).length, 0,
                        `Fallback/stale localized alternate in ${permalink}`);
                }
            }
        } else {
            assert(!($('meta[name="robots"]').attr('content') ?? '').includes('noindex'), page.permalink);
            assert(sitemapPaths.has(page.permalink), `Current page missing from sitemap: ${page.permalink}`);
            const ids = root => root('.theme-doc-markdown h1,.theme-doc-markdown h2,.theme-doc-markdown h3,.theme-doc-markdown h4,.theme-doc-markdown h5,.theme-doc-markdown h6').map((i, node) => root(node).attr('id') ?? '').get();
            const english = counterpart(page.englishPermalink, 'source heading IDs');
            if (english) assert.deepEqual(ids($), ids(english), `Source heading IDs: ${page.permalink}`);
            for (const [lang, permalink] of Object.entries(alternateGroup)) {
                const counterpart$ = counterpart(permalink, 'reciprocal alternates');
                if (!counterpart$) continue;
                const links = counterpart$('link[rel="alternate"][hreflang]');
                for (const [otherLang, otherPath] of Object.entries(alternateGroup)) {
                    const otherHtmlLang = htmlLangFor(otherLang);
                    assert.equal(links.filter(`[hreflang="${otherHtmlLang}"]`).attr('href'), `https://doris.apache.org${otherPath}`,
                        `Non-reciprocal alternates ${lang} -> ${otherLang}: ${permalink}`);
                    assert.equal(links.filter(`[hreflang="${otherHtmlLang}"]`).length, 1, `Duplicate hreflang: ${permalink}`);
                }
            }
        }
        verified++;
    }
    const ordinaryPages = {verified: 0, fallback: 0};
    const record = localeRegistry.find(item => item.code === locale);
    for (const permalink of data.pageRoutes ?? []) {
        const filename = path.join(site, decodeURIComponent(permalink), 'index.html');
        assert(fs.existsSync(filename), `Missing ordinary page: ${permalink}`);
        const $ = cheerio.load(fs.readFileSync(filename, 'utf8'));
        const source = permalink.startsWith(`/${locale}/`) ? permalink.slice(locale.length + 1) : permalink;
        const translatedPages = data.translatedPagePaths?.[locale] ?? record?.translatedPages;
        const decision = contentByRoute.get(permalink);
        const fallback = decision ? decision.fallback : record?.ordinaryPages === false && !translatedPages?.includes(source.replace(/\/+$/, ''));
        if (fallback) {
            assert.equal($('html').attr('lang'), htmlLang, `Fallback navigation language: ${permalink}`);
            assert.equal($('link[rel="canonical"]').length, 1, `Duplicate ordinary canonical: ${permalink}`);
            assert.equal($('link[rel="canonical"]').attr('href'), `https://doris.apache.org${source}`);
            assert.equal($('meta[property="og:url"]').attr('content'), `https://doris.apache.org${source}`);
            assert.equal($('meta[property="og:locale"]').attr('content'), 'en_US');
            assert(($('meta[name="robots"]').attr('content') ?? '').includes('noindex'), `Indexed English fallback: ${permalink}`);
            assert(!sitemapPaths.has(permalink), `Ordinary fallback in sitemap: ${permalink}`);
            assert.equal($(`link[rel="alternate"][hreflang="${htmlLang}"]`).length, 0, `Ordinary fallback alternate: ${permalink}`);
            for (const sourceRoute of (decision ? Object.values(decision.navigationRoutes) : [source, `/zh-CN${source}`])) {
                const source$ = counterpart(sourceRoute, 'ordinary fallback alternates');
                if (source$) assert.equal(source$(`link[rel="alternate"][hreflang="${htmlLang}"]`).length, 0,
                    `Source advertises ordinary fallback: ${sourceRoute}`);
            }
            ordinaryPages.fallback++;
        } else {
            assert.equal($('html').attr('lang'), htmlLang, `Translated ordinary page language: ${permalink}`);
        }
        ordinaryPages.verified++;
    }
    return {verified, skipped, partial, indexedPaths: indexedPaths.size, ordinaryPages,
        states: Object.fromEntries([...new Set(data.pages.map(page => page.status))]
            .map(status => [status, data.pages.filter(page => page.status === status).length])), reports: data.reports};
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const option = name => args[args.indexOf(name) + 1];
    const result = verify({site: path.resolve(option('--site')), manifest: path.resolve(option('--manifest')),
        partial: args.includes('--partial')});
    if (args.includes('--output')) fs.writeFileSync(option('--output'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({verified: result.verified, skipped: result.skipped, partial: result.partial,
        states: result.states, ordinaryPages: result.ordinaryPages, reports: result.reports.length}));
}
module.exports = {verify};
