const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {optimize} = require('../optimize.cjs');
const redirect = require('@docusaurus/plugin-client-redirects/lib/createRedirectPageContent').default;

const locales = ['en','zh-CN','ja'].map(locale => ({locale,directory:locale === 'en' ? '.' : locale}));
function fixture(t, selectedLocales = locales) {
    const site = fs.mkdtempSync(path.join(os.tmpdir(),'doris-publish-test-'));
    t.after(() => fs.rmSync(site,{recursive:true,force:true}));
    const write = (name,content) => {
        const file = path.join(site,name);
        fs.mkdirSync(path.dirname(file),{recursive:true});
        fs.writeFileSync(file,content);
    };
    write('.htaccess','# root controls\n');
    for (const locale of selectedLocales) {
        const prefix = locale.directory === '.' ? '' : locale.directory+'/';
        write(prefix+'index.html','<main>Real homepage</main>');
        write(prefix+'assets/shared/same.png',Buffer.alloc(65536,42));
        write(prefix+'images/old.png',Buffer.alloc(65536,42));
        write(prefix+'docs/dev/current/index.html','<main>Current document</main>');
        write(prefix+'docs/dev/current.html/index.html',redirect({toUrl:`/${prefix}docs/dev/current/`}));
        write(prefix+'docs/dev/current.htm/index.html',redirect({toUrl:`/${prefix}docs/dev/current/`}));
        write(prefix+'docs/dev/old/index.html',redirect({toUrl:`/${prefix}docs/dev/current/`}));
    }
    return {site,write};
}

test('shares binary assets without changing bundles, and retains every legacy redirect target', t => {
    const {site,write} = fixture(t);
    write('ja/assets/js/ja.hash.js','const url="/assets/shared/same.png";');
    write('assets/js/en.hash.js','const locale="en";');
    write('ja/.htaccess','# root controls\n');
    const result = optimize({site,locales});
    assert(result.after.bytes < result.before.bytes / 3);
    assert.equal(result.redirectPages,9);
    assert(result.apacheRootRules < result.redirectPages);
    assert.equal(fs.readFileSync(path.join(site,'assets/js/ja.hash.js'),'utf8'),'const url="/assets/shared/same.png";');
    assert(!fs.existsSync(path.join(site,'ja/assets')));
    assert(!fs.existsSync(path.join(site,'ja/.htaccess')));
    assert(!fs.existsSync(path.join(site,'images/old.png')));
    const manifest = JSON.parse(fs.readFileSync(path.join(site,'.publish/redirects.json'),'utf8'));
    assert(manifest.redirects.some(([from,to]) => from === '/ja/images/old.png' && to === '/assets/shared/same.png'));
    assert(manifest.redirects.some(([from,to]) => from === '/ja/docs/dev/current.html/' && to === '/ja/docs/dev/current/'));
    assert(fs.readFileSync(path.join(site,'.htaccess'),'utf8').endsWith('# root controls\n'));
});

test('a locale-only artifact promotes its assets while preserving language-specific differences', t => {
    const {site,write} = fixture(t);
    fs.rmSync(site,{recursive:true});
    write('ja/index.html','<main>Japanese</main>');
    write('ja/images/example.png','Japanese image');
    write('zh-CN/images/example.png','Chinese image');
    optimize({site,locales:locales.slice(1)});
    const manifest = JSON.parse(fs.readFileSync(path.join(site,'.publish/redirects.json'),'utf8'));
    for (const locale of ['ja','zh-CN']) {
        const target = manifest.redirects.find(([from]) => from === `/${locale}/images/example.png`)[1];
        assert.equal(fs.readFileSync(path.join(site,target),'utf8'),locale === 'ja' ? 'Japanese image' : 'Chinese image');
    }
    assert(!fs.existsSync(path.join(site,'index.html')));
});

test('hash filename collisions fail instead of silently mixing languages', t => {
    const {site,write} = fixture(t);
    write('assets/js/same.hash.js','English');
    write('ja/assets/js/same.hash.js','Japanese');
    assert.throws(() => optimize({site,locales}),/filename collision/);
});

test('retains distinct compiled URLs even when their binary contents match', t => {
    const {site,write} = fixture(t);
    write('assets/shared/other-name.PNG',Buffer.alloc(65536,42));
    optimize({site,locales});
    assert(fs.existsSync(path.join(site,'assets/shared/same.png')));
    assert(fs.existsSync(path.join(site,'assets/shared/other-name.PNG')));
});

test('verifies homepage redirects and unquoted resource attributes from the faster minifier', t => {
    const {site,write} = fixture(t);
    write('vendors/index.html',redirect({toUrl:'/'}));
    write('assets/js/entry.hash.js','console.log("entry");');
    write('index.html','<script src=/assets/js/entry.hash.js></script>');
    optimize({site,locales});
    const result = require('../verify.cjs').verify(site);
    assert.equal(result.compiledAssetReferences,1);
});

test('SVGs with relative references retain their original base URLs', t => {
    const {site,write} = fixture(t);
    for (const directory of ['one','two']) {
        write(`images/${directory}/image.svg`,'<svg xmlns="http://www.w3.org/2000/svg"><image href="nested.png"/></svg>');
        write(`images/${directory}/nested.png`,directory);
    }
    optimize({site,locales});
    for (const directory of ['one','two']) assert(fs.existsSync(path.join(site,`images/${directory}/image.svg`)));
});

test('keeps custom HTML, preserves query/fragment semantics, and flattens redirect chains', t => {
    const {site,write} = fixture(t);
    write('slack/index.html','<script>window.location.href="tracked"</script>');
    write('first/index.html',redirect({toUrl:'/second/'}));
    write('second/index.html',redirect({toUrl:'/docs/dev/current/?fixed=1#usage'}));
    optimize({site,locales});
    assert(fs.existsSync(path.join(site,'slack/index.html')));
    const manifest = JSON.parse(fs.readFileSync(path.join(site,'.publish/redirects.json'),'utf8'));
    assert.deepEqual(manifest.redirects.find(([from]) => from === '/first/'),['/first/','/docs/dev/current/?fixed=1#usage',false,301]);
    assert(fs.readFileSync(path.join(site,'.htaccess'),'utf8').includes(',QSD]'));
});

test('rejects redirect cycles and artifact symlinks', t => {
    const {site,write} = fixture(t);
    write('one/index.html',redirect({toUrl:'/two/'}));
    write('two/index.html',redirect({toUrl:'/one/'}));
    assert.throws(() => optimize({site,locales}),/redirect cycle/);
    fs.symlinkSync('/tmp',path.join(site,'outside'));
    assert.throws(() => optimize({site,locales}),/symlink/);
});

test('Apache serves compacted legacy prefixes, Unicode paths, assets and query/fragment redirects',
    {skip:process.env.DORIS_TEST_APACHE !== 'true'}, async t => {
    const {site,write} = fixture(t);
    write('docs/3.x/prefix/index.html','<main>Legacy destination</main>');
    write('docs/3.0/prefix/index.html',redirect({toUrl:'/docs/3.x/prefix/'}));
    write('docs/prefix/index.html',redirect({toUrl:'/docs/3.x/prefix/'}));
    write('releases/v4.0/release-4.0.1/index.html','<main>Release</main>');
    write('docs/4.x/releasenotes/v4.0/release-4.0.1/index.html',redirect({toUrl:'/releases/v4.0/release-4.0.1/'}));
    write('legacy-4.0/index.html',redirect({toUrl:'/docs/dev/current/?fixed=1#usage'}));
    write('한글 alias/index.html',redirect({toUrl:'/docs/dev/current/#한글'}));
    write('docs/한글/index.html','<main>Unicode target</main>');
    write('docs/한글.html/index.html',redirect({toUrl:'/docs/한글/'}));
    write('docs/real/index.html','<main>Short route</main>');
    write('docs/real.html/index.html','<main>Distinct real HTML-suffix route</main>');
    optimize({site,locales});
    const server = await require('../apache.cjs').apache(site);
    t.after(() => server.close());
    const manifest = JSON.parse(fs.readFileSync(path.join(site,'.publish/redirects.json'),'utf8'));
    for (const [from,to,preserveQuery,status] of manifest.redirects) {
        for (const source of from.endsWith('/') ? [from,from.slice(0,-1),from+'index.html'] : [from]) {
            const response = await fetch(server.origin+source+'?probe=1',{redirect:'manual'});
            assert.equal(response.status,status,source);
            if (status === 302) assert.equal(response.headers.get('cache-control'),'no-store');
            const expected = new URL(to,server.origin);
            if (preserveQuery) expected.search = '?probe=1';
            const normalize = value => value.replace(/%[\da-f]{2}/ig,part => part.toUpperCase());
            assert.equal(normalize(new URL(response.headers.get('location'),server.origin).href),normalize(expected.href),source);
        }
    }
    assert.equal((await fetch(server.origin+'/docs/3.0/missing/')).status,404);
    const actualPage = await fetch(server.origin+'/docs/real.html/',{redirect:'manual'});
    assert.equal(actualPage.status,200);
    assert((await actualPage.text()).includes('Distinct real HTML-suffix route'));
    assert.equal((await fetch(server.origin+'/ja/assets/shared/same.png')).status,200);
});

module.exports = {fixture,locales};


for (const locale of ['ko','ru']) test(`five-language publication preserves ${locale} indexes, workers and redirects`, async t => {
    const selected = ['en','zh-CN','ja','ko','ru'].map(locale => ({locale,directory:locale === 'en' ? '.' : locale}));
    const {site,write} = fixture(t, selected);
    const worker = 'self.onmessage = event => self.postMessage(event.data);';
    write(`${locale}/assets/js/${locale}.worker.0123abcd.js`,worker);
    write(`${locale}/index.html`,`<html lang="${locale}"><script src="/assets/js/${locale}.worker.0123abcd.js"></script></html>`);
    const index = JSON.stringify([{documents:[{u:`/${locale}/docs/dev/current/`,t:locale === 'ru' ? 'Русский документ' : '한국어 문서'}]}]);
    write(`${locale}/search-index-docs-dev.json`,index);
    const result = optimize({site,locales:selected});
    assert.equal(result.redirectPages,15);
    assert.equal(fs.readFileSync(path.join(site,`assets/js/${locale}.worker.0123abcd.js`),'utf8'),worker);
    assert.equal(fs.readFileSync(path.join(site,`${locale}/search-index-docs-dev.json`),'utf8'),index);
    assert(!fs.existsSync(path.join(site,`${locale}/assets`)));
    require('../verify.cjs').verify(site);
    const server = require('../serve.cjs').createServer(site);
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(origin+`/${locale}/docs/dev/old/?from=test`,{redirect:'manual'});
    assert.equal(response.status,301);
    assert.equal(new URL(response.headers.get('location'),origin).pathname,`/${locale}/docs/dev/current/`);
    assert.equal(new URL(response.headers.get('location'),origin).search,'?from=test');
    assert.equal(await (await fetch(origin+`/assets/js/${locale}.worker.0123abcd.js`)).text(),worker);
    assert.equal(await (await fetch(origin+`/${locale}/search-index-docs-dev.json`)).text(),index);
});

test('a fifth-language compiled filename collision rejects the artifact', t => {
    const selected = ['en','zh-CN','ja','ko','ru'].map(locale => ({locale,directory:locale === 'en' ? '.' : locale}));
    const {site,write} = fixture(t, selected);
    write('assets/js/collision.0123abcd.js','English');
    write('ru/assets/js/collision.0123abcd.js','Russian');
    assert.throws(() => optimize({site,locales:selected}),/filename collision/);
});
