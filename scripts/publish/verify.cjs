const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {Script} = require('node:vm');
const {inventory} = require('./optimize.cjs');
const {validateApacheControls} = require('./apache-controls.cjs');

function verify(site) {
    site = path.resolve(site);
    assert(!fs.existsSync(path.join(site,'.ci-validation.json')), 'Sample validation artifacts must not be published');
    const manifest = JSON.parse(fs.readFileSync(path.join(site,'.publish/redirects.json'),'utf8'));
    const redirects = new Map(manifest.redirects.map(([from,to]) => [decodeURIComponent(from),to]));
    const files = inventory(site);
    const available = new Set(files.map(item => item.relative));
    const assetOrigin = require('../../config/asset-origin').getAssetOrigin();
    const assetBase = assetOrigin ? new URL(assetOrigin.replace(/\/?$/, '/')) : null;
    const assetPrefix = assetBase?.pathname.replace(/\/$/, '') ?? '';
    const ownOrigins = new Set(['https://doris.apache.org',...(assetBase ? [assetBase.origin] : [])]);
    const localPath = url => assetBase && url.origin === assetBase.origin
        && assetPrefix && url.pathname.startsWith(assetPrefix + '/')
        ? url.pathname.slice(assetPrefix.length) : url.pathname;
    const resolve = value => {
        let url = new URL(value,'https://doris.apache.org');
        const key = decodeURIComponent(localPath(url));
        const target = redirects.get(key) ?? redirects.get(key+'/');
        if (target) url = new URL(target,url);
        const pathname = localPath(url);
        let relative = decodeURIComponent(pathname).replace(/^\//,'');
        const prefix = manifest.assetPrefixes.find(prefix => pathname.startsWith(prefix));
        if (prefix) relative = 'assets/'+decodeURIComponent(pathname.slice(prefix.length));
        return available.has(relative) || available.has(path.posix.join(relative,'index.html'));
    };
    for (const [from,to] of manifest.redirects) {
        if (to.startsWith('/')) assert(resolve(to), `Missing redirect destination: ${from} -> ${to}`);
    }
    let references = 0, compiledJavaScriptFiles = 0;
    const check = (value,source) => {
        if (value.startsWith('data:')) return;
        const sourceBase = source.endsWith('.css') && assetBase
            ? new URL(source, assetBase) : new URL(source, 'https://doris.apache.org/');
        const url = new URL(value, sourceBase);
        if (!ownOrigins.has(url.origin)) return;
        const pathname = localPath(url);
        const misplacedCompiledAsset = assetBase && url.origin === assetBase.origin
            && url.pathname.includes('/assets/') && !/^\/(media|downloads)\//.test(url.pathname);
        if (!pathname.startsWith('/assets/') && !misplacedCompiledAsset) return;
        if (assetBase && assetBase.origin !== 'https://doris.apache.org'
            && url.origin === assetBase.origin && assetPrefix) {
            assert(url.pathname.startsWith(assetPrefix + '/'), `Missing CDN asset prefix in ${source}: ${value}`);
        }
        assert(resolve(url.href),`Missing compiled asset in ${source}: ${value}`);
        references++;
    };
    for (const item of files) {
        if (path.basename(item.file) === '.htaccess') {
            validateApacheControls(fs.readFileSync(item.file,'utf8'),item.relative);
        } else if (item.relative.endsWith('.html')) {
            const content = fs.readFileSync(item.file,'utf8');
            for (const tag of content.matchAll(/<(?:script|link|img|source|video|audio)\b[^>]*>/g)) {
                for (const attribute of tag[0].matchAll(/\b(?:src|href)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
                    check(attribute[1] ?? attribute[2] ?? attribute[3],item.relative);
                }
            }
        } else if (item.relative.endsWith('.css')) {
            for (const match of fs.readFileSync(item.file,'utf8').matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) check(match[1],item.relative);
        } else if (item.relative.startsWith('assets/') && item.relative.endsWith('.js')) {
            // Check syntax without executing browser code. A successful SSG
            // build can still contain a malformed client entry or lazy chunk.
            try {new Script(fs.readFileSync(item.file, 'utf8'), {filename: item.relative});}
            catch (error) {throw new SyntaxError(`Invalid compiled JavaScript in ${item.relative}: ${error.message}`);}
            compiledJavaScriptFiles++;
        }
    }
    return {files:files.length,redirects:manifest.redirects.length,compiledAssetReferences:references,compiledJavaScriptFiles};
}

if (require.main === module) {
    console.log(JSON.stringify(verify(process.argv[2] ?? 'build'),null,2));
}
module.exports = {verify};
