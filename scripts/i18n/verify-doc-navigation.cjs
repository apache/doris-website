// Static document scope/navigation checks, alongside the browser PoC verifier.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');

function verify({site, snapshot, devOnly = false}) {
    const summary = JSON.parse(fs.readFileSync(path.join(snapshot, 'summary.json'), 'utf8'));
    let routes = 0;
    const checks = [];
    const read = route => {
        const file = path.join(site, decodeURIComponent(route), 'index.html');
        assert(fs.existsSync(file), `Missing static document/entry: ${route}`);
        return cheerio.load(fs.readFileSync(file, 'utf8'));
    };
    for (const group of summary.groups.filter(group => !devOnly || group.version !== '4.x')) {
        const data = JSON.parse(fs.readFileSync(path.join(snapshot, `${group.id.toLowerCase()}.json`), 'utf8'));
        const entries = data.entryFiles.flatMap(file => JSON.parse(fs.readFileSync(path.join(snapshot, file), 'utf8')).entries);
        assert.equal(entries.length, group.counts.registered);
        for (const entry of entries.filter(entry => entry.disposition !== 'draft')) {
            const $ = read(entry.permalink);
            assert.equal($('.theme-doc-markdown').attr('lang'), entry.mergedCurrent ? 'ja' : 'en', entry.permalink);
            routes++;
        }
        const representative = entries.find(entry => entry.mergedCurrent);
        const $ = read(representative.permalink);
        const sidebar = $('.theme-doc-sidebar-container').text();
        const expected = group.id === 'COMMUNITY'
            ? ['コミュニティについて', '貢献する方法', '開発とデバッグ', 'リリース', '設計ドキュメント']
            // The repository's tabbed sidebar initially renders Get Started.
            : ['入門', '機能とアーキテクチャ', 'インストールとデプロイ', '接続と連携'];
        for (const label of expected) assert(sidebar.includes(label), `Missing Japanese sidebar label ${label}: ${representative.permalink}`);
        if (group.pluginId === 'default') {
            const domains = $('nav[aria-label="Documentation sections"]').text();
            for (const label of ['入門', 'ガイド', 'ソリューション', '運用と保守', 'SQL リファレンス']) {
                assert(domains.includes(label), `Missing Japanese document domain: ${label}`);
            }
        }
        const links = $('.theme-doc-sidebar-container a[href]').map((i, node) => $(node).attr('href')).get();
        for (const link of links.filter(link => link.startsWith('/ja/'))) {
            read(new URL(link, 'https://doris.apache.org').pathname);
        }
        checks.push({group: group.id, routes: group.counts.required, sidebarLabels: expected, sidebarLinks: links.length});
    }
    if (!devOnly) {
        const $ = read('/ja/docs/');
        const target = '/ja/docs/4.x/getting-started/what-is-apache-doris/';
        // Native client-redirect pages use a relative canonical. Resolve it as
        // a browser would; document pages are checked separately by T02.
        assert.equal(new URL($('link[rel="canonical"]').attr('href'), 'https://doris.apache.org').href,
            `https://doris.apache.org${target}`);
        assert($('a').map((i, node) => $(node).attr('href')).get().includes(target));
        checks.push({entry: '/ja/docs/', target});
    }
    return {sourceCommit: summary.sourceCommit, devOnly, routes, checks};
}
if (require.main === module) {
    const args = process.argv.slice(2);
    const option = name => args[args.indexOf(name) + 1];
    const result = verify({site: path.resolve(option('--site')),
        snapshot: args.includes('--snapshot') ? path.resolve(option('--snapshot')) : path.resolve(__dirname, '../../translations/inventory/ja/2026-10-12'),
        devOnly: args.includes('--dev-only')});
    if (args.includes('--output')) fs.writeFileSync(option('--output'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
}
module.exports = {verify};
