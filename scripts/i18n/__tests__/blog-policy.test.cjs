const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createContentFixture}=require('./fixtures/content-manifest.cjs');
const {stableMetadata,feedContent}=require('../blog-policy.cjs');
async function nativeBlog(root,locale){
    const {loadContext}=require('@docusaurus/core/lib/server/site.js');
    const {loadPluginConfigs}=require('@docusaurus/core/lib/server/plugins/configs.js');
    const {initPluginsConfigs}=require('@docusaurus/core/lib/server/plugins/init.js');
    const ctx=await loadContext({siteDir:root,locale});
    const configs=(await loadPluginConfigs(ctx)).filter(c=>c.plugin.isManualBlogPlugin);
    const [{plugin}]=await initPluginsConfigs(ctx,configs);
    return plugin.loadContent();
}
test('native aggregate and feed decisions remain independent of untranslated peer articles',async t=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'blog-policy-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    await createContentFixture(root);
    for(const [locale,count] of Object.entries({'zh-CN':0,ja:1,ko:2,ru:3})){
        const content=await nativeBlog(root,locale),entries=content.contentIdentity.entries.filter(e=>e.siteLocale===locale);
        assert.equal(feedContent(content).blogPosts.length,count);
        const aggregate=entries.find(e=>e.aggregate&&e.englishRoute==='/blog/');
        assert(aggregate);assert.equal(aggregate.indexable,count>0);
        assert.equal(entries.filter(e=>!e.aggregate&&e.fallback).length,3-count);
    }
    // A blocked target's draft metadata must not remove the English identity.
    const file=path.join(root,'translations/blog/state.json'),state=JSON.parse(fs.readFileSync(file));
    state.pages.find(p=>p.locale==='ja').state='blocked';fs.writeFileSync(file,JSON.stringify(state));
    const target=path.join(root,'i18n/ja/docusaurus-plugin-content-blog/2026-01-01-sample.md');
    fs.writeFileSync(target,fs.readFileSync(target,'utf8').replace('---\ntitle:','---\ndraft: true\ntitle:'));
    const blocked=await nativeBlog(root,'ja');
    assert.equal(blocked.blogPosts.length,3);assert.equal(feedContent(blocked).blogPosts.length,0);
    assert(blocked.blogPosts.find(p=>p.metadata.permalink==='/ja/blog/native-0').metadata.source.startsWith('@site/blog/'));
});
test('published metadata cannot change stable article, tag or author identities',()=>{
    const original={source:'@site/blog/source.md',permalink:'/blog/source/',date:'2026-01-01',unlisted:false,
        frontMatter:{order:1},authors:[{key:'author'}],tags:[{permalink:'/blog/tags/stable/'}]};
    const target={...original,permalink:'/ja/blog/source/',tags:[{permalink:'/ja/blog/tags/stable/'}]};
    stableMetadata(original,target,'/','/ja/');
    for(const change of [{permalink:'/ja/blog/translated-title/'},{date:'2026-01-02'},{authors:[{key:'other'}]},
        {tags:[{permalink:'/ja/blog/tags/translated-title/'}]},{frontMatter:{order:2}}])
        assert.throws(()=>stableMetadata(original,{...target,...change},'/','/ja/'),/changed/);
});
