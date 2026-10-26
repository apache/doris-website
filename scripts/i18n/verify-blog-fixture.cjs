// Tiny real site: three listed posts with 0/1/2/3 translated counterparts,
// unlisted/draft posts, native author/tag/archive routes and the real list UI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const cheerio = require('cheerio');
const {createBlogFixture,createPilotFixture} = require('./__tests__/fixtures/blog.cjs');
const repo = path.resolve(__dirname, '../..');
async function main() {
    const pilot=process.argv.includes('--pilot');
    const root = path.join(repo, pilot?'.i18n-build/blog-pilot-fixture':'.i18n-build/blog-fixture');
    fs.rmSync(root, {recursive: true, force: true});
    await (pilot?createPilotFixture:createBlogFixture)(root);
    const run = spawnSync(process.execPath, [path.join(repo,'scripts/build-locales.cjs'),'--site-dir',root],
        {stdio:'inherit', env:{...process.env,NODE_OPTIONS:'--max-old-space-size=4096'}});
    assert.equal(run.status, 0, 'Local blog fixture build failed');
    if(pilot) return verifyPilot(root);
    const results = [];
    for (const [locale, translated] of Object.entries({en:3,'zh-CN':0,ja:1,ko:2,ru:3})) {
        const manifest = JSON.parse(fs.readFileSync(path.join(root,'.i18n-build/content-manifests',locale+'.json')));
        const prefix = locale==='en'?'':`/${locale}`;
        const read = route => cheerio.load(fs.readFileSync(path.join(root,'build',route,'index.html')));
        const posts = manifest.pages.filter(page => page.contentId.startsWith('blog:') && !page.route.endsWith('/unlisted/'));
        assert.equal(posts.filter(page => !page.fallback).length,translated);
        for (const entry of manifest.pages.filter(page => page.kind==='blog')) {
            const $ = read(entry.route);
            assert.equal($('link[rel="canonical"]').length,1,entry.route);
            assert.equal($('link[rel="canonical"]').attr('href'),'https://doris.apache.org'+(entry.fallback?entry.englishRoute:entry.route),entry.route);
            assert.equal(($('meta[name="robots"]').attr('content')??'').includes('noindex'),!entry.indexable,entry.route);
            const alternates=$('link[rel="alternate"][hreflang]').map((_,n)=>$(n).attr('hreflang')).get();
            assert.equal(alternates.length,entry.availableTranslations.length+(entry.availableTranslations.includes('en')?1:0),entry.route);
        }
        const list=read(prefix+'/blog/');
        assert(list('article[itemprop="blogPost"]').length>=3,'List must have server-rendered posts without JavaScript');
        assert.equal(list('.blog-language-note').length>0,locale!=='en'&&translated<3);
        const feed=path.join(root,'build',prefix,'blog/rss.xml');
        if(translated===0){assert(!fs.existsSync(feed));assert.equal(list('link[rel="alternate"][type="application/rss+xml"]').length,0);}
        else {const xml=cheerio.load(fs.readFileSync(feed),{xmlMode:true});assert.equal(xml('item').length,translated);}
        assert(!fs.existsSync(path.join(root,'build',prefix,'blog/draft/index.html')));
        const article=read(prefix+'/blog/native-0/');
        assert.equal(article('article[lang]').first().attr('lang'),locale==='zh-CN'?'en':locale);
        assert(article('#usage').length);assert(article('code').text().includes('SELECT 1;'));
        for(const [label,route] of [['Another post','/blog/native-0/#usage'],['Fallback peer','/blog/native-2/#usage'],['Same-origin link','/blog/native-0/#usage']])
            assert.equal(article('article a').filter((_,node)=>article(node).text()===label).attr('href'),prefix+route);
        for(const version of ['3.x','2.1']) {
            const old=manifest.pages.find(p=>p.pluginId==='default'&&p.version===version);
            const doc=read(old.route);assert.equal(old.contentLocale,locale==='zh-CN'?'zh-CN':'en');
            if(['ja','ko','ru'].includes(locale)) {
                assert.equal(old.state,'unsupported_translation_version');assert.equal(old.fallback,true);
                assert(doc('.theme-doc-markdown').text().includes('English historical prose.'));
                assert(!doc('.theme-doc-markdown').text().includes('historical target that policy must ignore'));
            }
        }
        results.push({locale,translated,postRoutes:posts.length,aggregateRoutes:manifest.pages.filter(p=>p.aggregate).length});
    }
    const output=path.join(repo,'.i18n-build/blog-fixture-verification.json');
    fs.writeFileSync(output,JSON.stringify({scope:'small local fixture only',root,results},null,2)+'\n');
    console.log(JSON.stringify({output,results}));
}
function verifyPilot(root) {
    const results=[];
    for(const locale of ['en','zh-CN','ja','ko','ru']) {
        const manifest=JSON.parse(fs.readFileSync(path.join(root,'.i18n-build/content-manifests',locale+'.json')));
        const posts=manifest.pages.filter(page=>page.contentId.startsWith('blog:')&&!page.contentId.includes('2026-01-'));
        assert.equal(posts.length,4);
        for(const entry of posts) {
            const $=cheerio.load(fs.readFileSync(path.join(root,'build',entry.route,'index.html')));
            assert.equal(entry.fallback,false);assert.equal($('article.blog-article-content').attr('lang'),locale);
            assert.equal($('link[rel="canonical"]').attr('href'),'https://doris.apache.org'+entry.route);
            assert.equal($('.page-fallback-notice').length,0);
            for(const image of $('article img[src]').toArray()) {
                const src=$(image).attr('src');if(!src.startsWith('/')) continue;
                assert(fs.existsSync(path.join(root,'build',src)),`Missing pilot image ${src}`);
            }
        }
        const prefix=locale==='en'?'':`/${locale}`;
        const list=cheerio.load(fs.readFileSync(path.join(root,'build',prefix,'blog/index.html')));
        assert.equal(list('article.blog-card').length,9); // First page of the small pagination control set.
        if(locale!=='en') assert(list('.blog-language-note').length>0);
        results.push({locale,pilotArticles:posts.map(p=>({contentId:p.contentId,route:p.route})),untranslatedHeadline:true});
    }
    const output=path.join(repo,'.i18n-build/blog-pilot-verification.json');
    fs.writeFileSync(output,JSON.stringify({scope:'four actual pilot articles only; no full-site build',root,results},null,2)+'\n');
    console.log(JSON.stringify({output,locales:results.length,pilotArticleRoutes:20}));
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={main};
