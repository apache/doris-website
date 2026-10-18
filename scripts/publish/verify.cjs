const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {inventory} = require('./optimize.cjs');

function verify(site) {
    site = path.resolve(site);
    const manifest = JSON.parse(fs.readFileSync(path.join(site,'.publish/redirects.json'),'utf8'));
    const redirects = new Map(manifest.redirects.map(([from,to]) => [decodeURIComponent(from),to]));
    const files = inventory(site);
    const available = new Set(files.map(item => item.relative));
    const assetOrigin = require('../../config/asset-origin').getAssetOrigin();
    const ownOrigins = new Set(['https://doris.apache.org',...(assetOrigin ? [new URL(assetOrigin).origin] : [])]);
    const resolve = value => {
        let url = new URL(value,'https://doris.apache.org');
        const key = decodeURIComponent(url.pathname);
        const target = redirects.get(key) ?? redirects.get(key+'/');
        if (target) url = new URL(target,url);
        let relative = decodeURIComponent(url.pathname).replace(/^\//,'');
        const prefix = manifest.assetPrefixes.find(prefix => url.pathname.startsWith(prefix));
        if (prefix) relative = 'assets/'+decodeURIComponent(url.pathname.slice(prefix.length));
        return available.has(relative) || available.has(path.posix.join(relative,'index.html'));
    };
    for (const [from,to] of manifest.redirects) {
        if (to.startsWith('/')) assert(resolve(to), `Missing redirect destination: ${from} -> ${to}`);
    }
    let references = 0;
    const check = (value,source) => {
        if (value.startsWith('data:')) return;
        const url = new URL(value,`https://doris.apache.org/${source}`);
        if (!ownOrigins.has(url.origin)) return;
        if (!url.pathname.startsWith('/assets/')) return;
        assert(resolve(url.href),`Missing compiled asset in ${source}: ${value}`);
        references++;
    };
    for (const item of files) {
        if (item.relative.endsWith('.html')) {
            const content = fs.readFileSync(item.file,'utf8');
            for (const tag of content.matchAll(/<(?:script|link|img|source|video|audio)\b[^>]*>/g)) {
                for (const attribute of tag[0].matchAll(/\b(?:src|href)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
                    check(attribute[1] ?? attribute[2] ?? attribute[3],item.relative);
                }
            }
        } else if (item.relative.endsWith('.css')) {
            for (const match of fs.readFileSync(item.file,'utf8').matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) check(match[1],item.relative);
        }
    }
    return {files:files.length,redirects:manifest.redirects.length,compiledAssetReferences:references};
}

if (require.main === module) {
    console.log(JSON.stringify(verify(process.argv[2] ?? 'build'),null,2));
}
module.exports = {verify};
