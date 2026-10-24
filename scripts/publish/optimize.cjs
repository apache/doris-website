const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const assert = require('node:assert/strict');

const binary = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|ttf|otf|woff2?|eot|pdf|zip|docx?|xlsx?|mp[34]|webm|wav|ogg)$/i;
const begin = '# BEGIN DORIS PUBLISH OPTIMIZATION';
const end = '# END DORIS PUBLISH OPTIMIZATION';
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function inventory(root) {
    const files = [];
    function walk(directory) {
        for (const entry of fs.readdirSync(directory, {withFileTypes:true}).sort((a,b) => a.name.localeCompare(b.name))) {
            const file = path.join(directory, entry.name);
            assert(!entry.isSymbolicLink(), `Publish artifact contains a symlink: ${file}`);
            if (entry.isDirectory()) walk(file);
            else if (entry.isFile()) files.push({file, relative:path.relative(root,file).split(path.sep).join('/'), size:fs.statSync(file).size});
        }
    }
    walk(root);
    return files;
}

function optimize({site, locales, reportFile}) {
    assert(!fs.existsSync(path.join(site,'.ci-validation.json')), 'Sample validation artifacts must not be published');
    site = path.resolve(site);
    const before = inventory(site);
    const prefixes = locales.filter(locale => locale.directory !== '.').map(locale => locale.directory);
    const stripLocale = relative => {
        const prefix = prefixes.find(value => relative.startsWith(`${value}/`));
        return prefix ? relative.slice(prefix.length + 1) : relative;
    };
    const redirects = new Map();
    const controls = path.join(site,'.htaccess');
    for (const prefix of prefixes) {
        const copy = path.join(site,prefix,'.htaccess');
        if (!fs.existsSync(copy)) continue;
        if (!fs.existsSync(controls)) fs.copyFileSync(copy,controls);
        assert.equal(fs.readFileSync(copy,'utf8'),fs.readFileSync(controls,'utf8'),
            `Locale has different Apache controls: ${prefix}`);
        fs.unlinkSync(copy);
    }
    const url = relative => '/' + relative.split('/').map(encodeURIComponent).join('/');
    const add = (from, to, preserveQuery = true, status = 301) => {
        assert(from.startsWith('/') && !/[\r\n]/.test(from + to), 'Unsafe publication redirect');
        assert(!redirects.has(from) || redirects.get(from).to === to, `Conflicting publication redirect: ${from}`);
        redirects.set(from, {to, preserveQuery,status});
    };
    let sharedFiles = 0, redirectPages = 0;

    // All webpack runtimes already reference the root pool, including lazy
    // chunks and same-origin search workers. Never rewrite a hashed bundle.
    for (const item of before) {
        const relative = stripLocale(item.relative);
        if (relative === item.relative || !relative.startsWith('assets/')) continue;
        const target = path.join(site, relative);
        if (fs.existsSync(target)) {
            assert.equal(digest(item.file), digest(target), `Shared asset filename collision: ${relative}`);
            fs.unlinkSync(item.file);
        } else {
            fs.mkdirSync(path.dirname(target), {recursive:true});
            fs.renameSync(item.file,target);
        }
        sharedFiles++;
    }

    // Keep webpack's content-addressed URL when a static file also passed
    // through a loader. Public legacy URLs remain HTTP redirects to that file.
    const groups = new Map();
    for (const item of inventory(site).filter(item => binary.test(item.relative))) {
        // A standalone SVG may resolve other resources relative to its own
        // location. Identical bytes do not imply interchangeable base URLs.
        if (/\.svg$/i.test(item.relative) && /(?:href\s*=\s*["'](?!#|data:)|url\(\s*["']?(?!#|data:))/i
            .test(fs.readFileSync(item.file,'utf8'))) continue;
        const key = `${digest(item.file)}:${path.extname(item.relative).toLowerCase()}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
    }
    for (const items of groups.values()) {
        const rank = item => item.relative.startsWith('assets/') ? 0 : stripLocale(item.relative) === item.relative ? 1 : 2;
        items.sort((a,b) => rank(a)-rank(b) || a.relative.length-b.relative.length || a.relative.localeCompare(b.relative));
        let canonical = items[0];
        if (rank(canonical) === 2) {
            let relative = stripLocale(canonical.relative);
            if (fs.existsSync(path.join(site,relative))) relative = `assets/shared/${digest(canonical.file)}${path.extname(relative)}`;
            const file = path.join(site,relative);
            fs.mkdirSync(path.dirname(file),{recursive:true});
            fs.copyFileSync(canonical.file,file);
            canonical = {relative,file};
        }
        for (const item of items) {
            if (item.relative === canonical.relative) continue;
            // Distinct compiled URLs may be used on the CDN, which does not
            // interpret Apache aliases. Their content hashes are established
            // by webpack; retain every distinct root asset filename.
            if (item.relative.startsWith('assets/')) continue;
            add(url(item.relative),url(canonical.relative),true,302);
            fs.unlinkSync(item.file);
            sharedFiles++;
        }
    }

    const createRedirect = require('@docusaurus/plugin-client-redirects/lib/createRedirectPageContent').default;
    const cheerio = require('cheerio');
    for (const item of inventory(site)) {
        if (path.basename(item.file) === '.DS_Store') {
            fs.unlinkSync(item.file);
            continue;
        }
        if (!item.relative.endsWith('/index.html') || item.size > 8192) continue;
        const content = fs.readFileSync(item.file,'utf8');
        if (!content.includes('window.location.href')) continue;
        const canonical = cheerio.load(content)('link[rel="canonical"]').attr('href');
        if (!canonical) continue;
        let target;
        try { target = decodeURI(canonical); } catch { continue; }
        // Only recognize the pinned plugin's exact template. Tracking pages,
        // custom redirects and arbitrary small HTML pages stay untouched.
        if (createRedirect({toUrl:target}) !== content) continue;
        const from = url(item.relative.slice(0,-'index.html'.length));
        const parsed = new URL(target,'https://doris.apache.org');
        add(from,canonical,!parsed.search && !parsed.hash);
        fs.unlinkSync(item.file);
        redirectPages++;
    }

    // Resolve chains once, then reject cycles before committing the artifact.
    for (const [from, item] of redirects) {
        const seen = new Set([from]);
        while (redirects.has(item.to)) {
            assert(!seen.has(item.to), `Publication redirect cycle: ${from}`);
            seen.add(item.to);
            const next = redirects.get(item.to);
            item.to = next.to;
            item.preserveQuery = item.preserveQuery && next.preserveQuery;
            if (next.status === 302) item.status = 302;
        }
    }

    const apache = writeApache({site,locales,redirects});
    fs.mkdirSync(path.join(site,'.publish'),{recursive:true});
    fs.writeFileSync(path.join(site,'.publish/redirects.json'),JSON.stringify({schemaVersion:1,
        assetPrefixes:prefixes.map(prefix => `/${prefix}/assets/`),
        redirects:[...redirects].map(([from,item]) => [from,item.to,item.preserveQuery,item.status])}));
    function clean(directory) {
        for (const entry of fs.readdirSync(directory,{withFileTypes:true})) {
            if (!entry.isDirectory()) continue;
            const child = path.join(directory,entry.name);
            clean(child);
            if (!fs.readdirSync(child).length) fs.rmdirSync(child);
        }
    }
    clean(site);
    const after = inventory(site);
    const result = {before:{files:before.length,bytes:before.reduce((n,item) => n+item.size,0)},
        after:{files:after.length,bytes:after.reduce((n,item) => n+item.size,0)},sharedFiles,redirectPages,
        apacheRules:apache.total,apacheRootRules:apache.root};
    if (reportFile) {
        fs.mkdirSync(path.dirname(reportFile),{recursive:true});
        fs.writeFileSync(reportFile,JSON.stringify(result,null,2)+'\n');
    }
    return result;
}

module.exports = {optimize,inventory,writeApache};

function writeApache({site,locales,redirects,replaceExisting = false}) {
    const prefixes = locales.filter(locale => locale.directory !== '.').map(locale => locale.directory);
    const controls = path.join(site,'.htaccess');
    const rules = [begin, '<IfModule mod_rewrite.c>', 'RewriteEngine On',
        // Existing files must retain priority over every compatibility alias.
        'RewriteCond %{REQUEST_FILENAME} -f [OR]', 'RewriteCond %{REQUEST_FILENAME}/index.html -f',
        'RewriteRule ^ - [END]'];
    const generic = [];
    const extensionAliases = [...redirects].filter(([from,item]) => from.replace(/\.html?\/$/,'/') === item.to);
    if (extensionAliases.length) {
        rules.push('RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f',
            'RewriteRule "^(.+?)\\.html?(?:/index\\.html|/)?$" "/$1/" [R=301,L]');
        generic.push(([from,item]) => from.replace(/\.html?\/$/,'/') === item.to);
    }
    for (const prefix of prefixes) {
        rules.push('RewriteCond %{DOCUMENT_ROOT}/$1 -f',
            `RewriteRule "^${escapeRegex(prefix)}/(assets/.+)$" "/$1" [R=302,L,E=DORIS_ASSET_REDIRECT:1]`);
    }
    // Compress the large legacy prefix families into guarded rules. Only a
    // real built destination can redirect an otherwise missing source URL.
    for (const locale of locales) {
        const prefix = locale.directory === '.' ? '' : `${locale.directory}/`;
        for (const [source,target] of [[`${prefix}docs/3.0/`,`${prefix}docs/3.x/`],
            [`${prefix}docs/`,`${prefix}docs/3.x/`]]) {
            const matches = ([from,item]) => from.startsWith('/'+source)
                && item.to === '/'+target+from.slice(source.length+1);
            if ([...redirects].some(matches)) {
                rules.push(`RewriteCond %{DOCUMENT_ROOT}/${target}$1/index.html -f`,
                    `RewriteRule "^${escapeRegex(source)}(.+?)(?:/index\\.html|/)?$" "/${target}$1/" [R=301,L]`);
                generic.push(matches);
            }
        }
        const release = ([from,item]) => {
            const match = from.match(new RegExp(`^/${escapeRegex(prefix)}docs/(?:4\\.x|3\\.x|2\\.1|2\\.0|1\\.2|4\\.0|3\\.1|3\\.0|dev)/releasenotes/(.+)$`));
            return match && item.to === `/${prefix}releases/${match[1]}`;
        };
        if ([...redirects].some(release)) {
            rules.push(`RewriteCond %{DOCUMENT_ROOT}/${prefix}releases/$1/index.html -f`,
                `RewriteRule "^${escapeRegex(prefix)}docs/(?:4\\.x|3\\.x|2\\.1|2\\.0|1\\.2|4\\.0|3\\.1|3\\.0|dev)/releasenotes/(.+?)(?:/index\\.html|/)?$" "/${prefix}releases/$1/" [R=301,L]`);
            generic.push(release);
        }
    }
    const exact = new Map();
    for (const entry of redirects) {
        if (generic.some(matches => matches(entry))) continue;
        const [from,item] = entry;
        const decoded = decodeURIComponent(from).replace(/^\//,'');
        const localePrefix = prefixes.find(prefix => decoded.startsWith(prefix+'/'));
        const relative = localePrefix ? decoded.slice(localePrefix.length+1) : decoded;
        const first = relative.split('/')[0];
        // Keep large binary alias tables out of ordinary HTML/JS requests.
        // These namespaces contain static resources, not content-plugin routes.
        const directory = item.status === 302 && ['images','fonts','pdf','files'].includes(first)
            ? (localePrefix ? localePrefix+'/' : '')+first : '';
        const key = JSON.stringify({item,directory});
        if (!exact.has(key)) exact.set(key, {item,directory,from:[]});
        exact.get(key).from.push({path:(directory ? decoded.slice(directory.length+1) : decoded).replace(/\/$/,''),
            directory:from.endsWith('/')});
    }
    const assetRules = new Map();
    for (const {item,from,directory} of exact.values()) {
        // Quote and escape config syntax, while leaving the already encoded
        // redirect target intact (NE avoids double encoding it).
        const target = item.to.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\$/g,'\\$').replace(/%/g,'\\%');
        const pattern = from.map(value => escapeRegex(value.path)
            + (value.directory ? '(?:/index\\.html|/)?' : '')).join('|').replace(/"/g,'\\"');
        const rule = `RewriteRule "^(?:${pattern})$" "${target}" [R=${item.status},L,NE${item.preserveQuery ? '' : ',QSD'}${item.status === 302 ? ',E=DORIS_ASSET_REDIRECT:1' : ''}]`;
        if (directory) {
            if (!assetRules.has(directory)) assetRules.set(directory,[]);
            assetRules.get(directory).push(rule);
        } else rules.push(rule);
    }
    rules.push('</IfModule>','<IfModule mod_headers.c>',
        'Header always set Cache-Control "no-store" env=DORIS_ASSET_REDIRECT','</IfModule>',end);
    let original = fs.existsSync(controls) ? fs.readFileSync(controls,'utf8') : '';
    if (original.includes(begin)) {
        assert(replaceExisting, 'Artifact was already optimized');
        const finish = original.indexOf(end)+end.length;
        assert(finish >= end.length, 'Incomplete publication controls');
        original = original.slice(0,original.indexOf(begin))+original.slice(finish).replace(/^\n+/,'');
    }
    fs.writeFileSync(controls,rules.join('\n')+'\n\n'+original);
    for (const [directory,lines] of assetRules) {
        const file = path.join(site,directory,'.htaccess');
        assert(!fs.existsSync(file) || (replaceExisting && fs.readFileSync(file,'utf8').startsWith(begin)),
            `Cannot replace existing asset controls: ${directory}`);
        fs.mkdirSync(path.dirname(file),{recursive:true});
        fs.writeFileSync(file,[begin,'<IfModule mod_rewrite.c>','RewriteEngine On',
            'RewriteOptions IgnoreInherit',...lines,'</IfModule>',end,''].join('\n'));
    }
    return {root:rules.filter(line => line.startsWith('RewriteRule')).length,
        total:rules.filter(line => line.startsWith('RewriteRule')).length
            + [...assetRules.values()].reduce((n,lines) => n+lines.length,0)};
}
