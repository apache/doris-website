const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const cheerio=require('cheerio');
const {verify,verifyAll}=require('../verify-static.cjs');

function fixture(t) {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'doris-static-cache-'));
    t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    const site=path.join(root,'build'),manifestDir=path.join(root,'manifests');
    fs.mkdirSync(manifestDir);const alternates={en:'/topic/',ja:'/ja/topic/',ko:'/ko/topic/'};
    const write=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
    for(const [locale,route]of Object.entries(alternates)) {
        const links=Object.entries(alternates).map(([lang,url])=>`<link rel="alternate" hreflang="${lang==='en'?'en-US':lang}" href="https://doris.apache.org${url}">`).join('');
        write(path.join(site,route,'index.html'),`<html><head><link rel="canonical" href="https://doris.apache.org${route}">${links}</head><body><div data-translation-status="current"></div><article class="theme-doc-markdown" lang="${locale}"><h2 id="usage">Usage</h2></article></body></html>`);
        if(locale==='en')continue;
        write(path.join(site,locale,'sitemap.xml'),`<urlset><url><loc>https://doris.apache.org${route}</loc></url></urlset>`);
        write(path.join(site,locale,'search-index.json'),JSON.stringify([{documents:[{u:route}]}]));
        write(path.join(manifestDir,locale+'.json'),JSON.stringify({locale,pages:[{permalink:route,contentLocale:locale,
            status:'current',useTarget:true,indexable:true,englishPermalink:'/topic/',alternates}],reports:[]}));
    }
    return {site,manifestDir,locales:['ja','ko']};
}
test('sharing compact metadata preserves strict results while parsing fewer complete HTML documents',t=>{
    const data=fixture(t),original=cheerio.load;let reads=0;
    cheerio.load=(source,...args)=>{if(String(source).includes('theme-doc-markdown'))reads++;return original(source,...args);};
    try {
        const separate=data.locales.map(locale=>({locale,...verify({site:data.site,manifest:path.join(data.manifestDir,locale+'.json')})}));
        const before=reads;reads=0;
        assert.deepEqual(verifyAll(data),separate);
        assert(reads<before,`${reads} shared parses must be less than ${before} separate parses`);
    } finally {cheerio.load=original;}
});
test('each invocation rereads the artifact and rejects damaged heading IDs and duplicate alternates',t=>{
    const data=fixture(t);verifyAll(data);
    const file=path.join(data.site,'topic/index.html'),original=fs.readFileSync(file,'utf8');
    fs.writeFileSync(file,original.replace('id="usage"','id="wrong"'));
    assert.throws(()=>verifyAll(data),/Source heading IDs/);
    const $=cheerio.load(original);$('head').append($('link[hreflang="ko"]').clone());fs.writeFileSync(file,$.html());
    assert.throws(()=>verifyAll(data),/Duplicate hreflang/);
});
