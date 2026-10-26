const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {blogStateFileFor,loadManual,readManualRecords,digestFiles,decideManual}=require('../manual-state.cjs');
function fixture(t){
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'blog-shards-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    const write=(file,value)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,typeof value==='string'?value:JSON.stringify(value));};
    const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:'pipe'}).trim();
    const commit=()=>{git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','-qm','Article translation');};
    const add=(name,locale)=>{
        const sourceFiles=[`blog/${name}`],targetFiles=[`i18n/${locale}/docusaurus-plugin-content-blog/${name}`];
        write(targetFiles[0],`Translated ${name}\n`);
        const page={contentId:'blog:'+name,locale,state:'ready',sourceFiles,targetFiles,
            sourceHash:digestFiles(root,sourceFiles),targetHash:digestFiles(root,targetFiles),reviewStatus:'machine'};
        write(blogStateFileFor(page),{schemaVersion:1,page});return page;
    };
    write('blog/first.md','# First\n');write('blog/nested/second.mdx','# Second\n');
    git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.com');
    commit();return{root,write,git,commit,add};
}
test('independent article and language translation branches merge without a shared state edit',t=>{
    const {root,git,commit,add}=fixture(t),base=git('rev-parse','HEAD');
    git('checkout','-qb','first');const first=add('first.md','ja');commit();
    git('checkout','-qb','second',base);const second=add('nested/second.mdx','ja');commit();
    git('merge','--no-edit','first');
    assert.equal(loadManual(root,'blog').length,2);
    git('checkout','-qb','another-language',base);const korean=add('first.md','ko');commit();
    git('merge','--no-edit','second');
    const records=loadManual(root,'blog');assert.equal(records.length,3);
    for(const record of records)assert.equal(decideManual({root,record,sourceFiles:record.sourceFiles}).state,'ready');
    assert.equal(new Set([first,second,korean].map(blogStateFileFor)).size,3);
    assert(!fs.existsSync(path.join(root,'translations/blog/state.json')));
});
test('misplaced, duplicate and unsafe blog identities fail closed; historical indexes remain readable',t=>{
    const {root,write,git,commit,add}=fixture(t);
    const record=add('first.md','ja');commit();
    write('translations/blog/pages/ja/wrong.md.json',{schemaVersion:1,page:record});
    assert.throws(()=>loadManual(root,'blog'),/Invalid blog state shard/);
    fs.unlinkSync(path.join(root,'translations/blog/pages/ja/wrong.md.json'));
    for(const contentId of ['blog:../escape.md','blog:/absolute.md','blog:folder/./post.md','blog:'])
        assert.throws(()=>blogStateFileFor({...record,contentId}),/identity\/path/);
    fs.rmSync(path.join(root,'translations/blog/pages'),{recursive:true});
    write('translations/blog/state.json',{schemaVersion:1,pages:[record]});commit();const legacy=git('rev-parse','HEAD');
    assert.deepEqual(readManualRecords(root,'blog',legacy),[record]);
    assert.throws(()=>loadManual(root,'blog'),/per-article\/locale shards/);
});
