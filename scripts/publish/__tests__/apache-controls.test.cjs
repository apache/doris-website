const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {writeApache, inventory} = require('../optimize.cjs');
const {verify} = require('../verify.cjs');

const locales = ['en','zh-CN','ja','ko','ru'].map(locale => ({locale,directory:locale === 'en' ? '.' : locale}));

function fixture(t, bulk = false) {
    const site = fs.mkdtempSync(path.join(os.tmpdir(),'doris-apache-controls-'));
    t.after(() => fs.rmSync(site,{recursive:true,force:true}));
    const write = (file,content) => {
        fs.mkdirSync(path.dirname(path.join(site,file)),{recursive:true});
        fs.writeFileSync(path.join(site,file),content);
    };
    const redirects = new Map();
    write('.htaccess','# Original controls\n');
    write('assets/shared/image.png','image');
    for (const locale of locales) {
        const prefix = locale.directory === '.' ? '' : locale.directory+'/';
        write(prefix+'index.html','<main>Home</main>');
        write(prefix+'archived-docs/index.html','<main>Archived Versions</main>');
        if (!bulk) continue;
        for (let i = 0; i < 600; i++) {
            redirects.set('/'+prefix+`docs/2.1/sql-manual/历史函数-${i}/`,
                {to:'/'+prefix+'archived-docs/',preserveQuery:true,status:301});
            redirects.set('/'+prefix+`docs/2.0/sql-manual/历史函数-${i}/`,
                {to:'/'+prefix+'archived-docs/?version=2.0#downloads',preserveQuery:false,status:301});
            redirects.set('/'+prefix+`images/历史图片-${i}.png`,
                {to:'/assets/shared/image.png',preserveQuery:true,status:302});
        }
    }
    write('.publish/redirects.json',JSON.stringify({assetPrefixes:[],redirects:[...redirects]
        .map(([from,item]) => [from,item.to,item.preserveQuery,item.status])}));
    return {site,write,redirects};
}

test('bounds many-to-one archive and Unicode asset rules in every locale by UTF-8 bytes', t => {
    const {site,redirects} = fixture(t,true);
    writeApache({site,locales,redirects});
    const controls = inventory(site).filter(item => path.basename(item.file) === '.htaccess');
    assert.equal(controls.length,6);
    for (const item of controls) {
        for (const line of fs.readFileSync(item.file,'utf8').split('\n')) {
            assert(Buffer.byteLength(line) <= 8000,`${item.relative}: ${Buffer.byteLength(line)} bytes`);
        }
    }
    verify(site);
});

test('rejects an individual redirect that cannot fit into an Apache rule', t => {
    for (const field of ['source','target']) {
        const {site} = fixture(t);
        const source = field === 'source' ? '/'+ '长'.repeat(3000) : '/legacy/';
        const to = field === 'target' ? '/'+ 'x'.repeat(8000) : '/archived-docs/';
        assert.throws(() => writeApache({site,locales,redirects:new Map([
            [source,{to,preserveQuery:true,status:301}],
        ])}),/Apache.*line/i,field);
    }
});

test('publication verification rejects oversized root and nested Apache controls', t => {
    const {site,write,redirects} = fixture(t);
    writeApache({site,locales,redirects});
    for (const file of ['.htaccess','zh-CN/images/.htaccess']) {
        // Fewer than 8,000 characters can still exceed the limit in UTF-8.
        write(file,'#'+'长'.repeat(3000)+'\n');
        assert.throws(() => verify(site),error => error.message.includes(file) && /Apache.*line/i.test(error.message));
        write(file,'# Valid controls\n');
    }
    // Apache joins continuation lines before checking the line limit.
    write('.htaccess','#'+'x'.repeat(5000)+'\\\n'+'x'.repeat(5000)+'\n');
    assert.throws(() => verify(site),/Apache.*line/i);
});

test('Apache serves pages and large archive/asset redirect groups after splitting',
    {skip:process.env.DORIS_TEST_APACHE !== 'true'}, async t => {
    const {site,redirects} = fixture(t,true);
    writeApache({site,locales,redirects});
    const server = await require('../apache.cjs').apache(site);
    t.after(() => server.close());
    const probe = async (source,options) => {
        const response = await fetch(server.origin+source,options);
        await response.arrayBuffer();
        return response;
    };
    for (const locale of locales) {
        const prefix = locale.directory === '.' ? '' : locale.directory+'/';
        assert.equal((await probe('/'+prefix)).status,200);
        assert.equal((await probe('/'+prefix+'archived-docs/')).status,200);
        for (const i of [0,99,100,299,599]) {
            const from = '/'+prefix+`docs/2.1/sql-manual/历史函数-${i}/`;
            for (const source of [from,from.slice(0,-1),from+'index.html']) {
                const response = await probe(source+'?probe=1',{redirect:'manual'});
                assert.equal(response.status,301,source);
                assert.equal(new URL(response.headers.get('location')).pathname,'/'+prefix+'archived-docs/');
                assert.equal(new URL(response.headers.get('location')).search,'?probe=1');
            }
            const fixed = await probe('/'+prefix+`docs/2.0/sql-manual/历史函数-${i}/?probe=1`,{redirect:'manual'});
            assert.equal(fixed.status,301);
            assert.equal(new URL(fixed.headers.get('location')).pathname,'/'+prefix+'archived-docs/');
            assert.equal(new URL(fixed.headers.get('location')).search,'?version=2.0');
            assert.equal(new URL(fixed.headers.get('location')).hash,'#downloads');
            const image = await probe('/'+prefix+`images/历史图片-${i}.png?probe=1`,{redirect:'manual'});
            assert.equal(image.status,302);
            assert.equal(new URL(image.headers.get('location')).pathname,'/assets/shared/image.png');
            assert.equal(new URL(image.headers.get('location')).search,'?probe=1');
            assert.equal(image.headers.get('cache-control'),'no-store');
        }
        assert.equal((await probe('/'+prefix+'docs/2.1/unknown/',{redirect:'manual'})).status,404);
    }
});
