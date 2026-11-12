const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const {outputText}=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../../src/utils/searchScopes.js'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});
const moduleValue={exports:{}};new Function('exports',outputText)(moduleValue.exports);
const {resolveSearchScope,convertSearchParams,docSearchSourceVersion}=moduleValue.exports;
const {verifySourceSearchHref}=require('../verify-search.cjs');
const versions=['dev','4.x','3.x','2.1'].map(name=>({path:'/docs/'+name,isLast:name==='4.x'}));
const source={versions,contexts:['docs','community','course','releases'],managed:false};
const managed={versions,contexts:['docs/dev','docs/4.x','community','course','releases'],managed:true};

test('Dev and stable document scope survives both source/managed URL representations',()=>{
    assert.deepEqual(resolveSearchScope({context:'docs/dev'},source),{context:'docs',version:'docs/dev/',sourceOnlyVersion:null});
    assert.deepEqual(resolveSearchScope({context:'docs',version:'docs/dev/'},managed),{context:'docs/dev',version:'',sourceOnlyVersion:null});
    assert.equal(resolveSearchScope({context:'docs'},managed).context,'docs/4.x');
    assert.deepEqual(resolveSearchScope({context:'docs/4.x'},source),{context:'docs',version:'',sourceOnlyVersion:null});
});
test('old managed versions select explicit source search instead of current translated indexes',()=>{
    for(const version of ['3.x','2.1']) {
        assert.deepEqual(resolveSearchScope({context:'docs',version:'docs/'+version+'/'},managed),
            {context:'',version:'docs/'+version+'/',sourceOnlyVersion:version});
        assert.equal(resolveSearchScope({context:'docs/'+version},managed).sourceOnlyVersion,version);
        assert.equal(resolveSearchScope({context:'docs/'+version},source).version,'docs/'+version+'/');
        assert.equal(docSearchSourceVersion('/ja/docs/'+version+'/intro/',versions.map(v=>({...v,path:'/ja'+v.path})),managed.contexts),version);
    }
    assert.equal(docSearchSourceVersion('/ja/docs/dev/intro/',versions.map(v=>({...v,path:'/ja'+v.path})),managed.contexts),null);
    assert.equal(docSearchSourceVersion('/ja/community/intro/',versions.map(v=>({...v,path:'/ja'+v.path})),managed.contexts),null);
});
test('plugin contexts preserve their identity and cannot inherit a docs version',()=>{
    for(const context of ['community','course','releases'])for(const options of [source,managed])
        assert.deepEqual(resolveSearchScope({context,version:'docs/3.x/'},options),{context,version:'',sourceOnlyVersion:null});
});
test('language conversion preserves the query and unrelated parameters through a round trip',()=>{
    const original=new URLSearchParams({q:'Doris + query_vector',ctx:'docs/dev',probe:'/a?b=c'});
    const english=convertSearchParams(original,source),japanese=convertSearchParams(english,managed);
    assert.equal(english.get('ctx'),'docs');assert.equal(english.get('version'),'docs/dev/');
    assert.equal(japanese.get('ctx'),'docs/dev');assert(!japanese.has('version'));
    for(const value of [english,japanese]){assert.equal(value.get('q'),original.get('q'));assert.equal(value.get('probe'),original.get('probe'));}
    assert.equal(original.get('ctx'),'docs/dev');
});
test('source search acceptance validates URL values independently of parameter order',()=>{
    const origin='http://127.0.0.1:3000',query='zzzzqqqq_xxxxwwww';
    // Use the same scope conversion as SearchPage, including its canonical
    // ctx-first URL, which failed the old /search/?q= prefix assertion.
    for(const input of [{q:query,ctx:'docs/dev'},{ctx:'docs/dev',q:query}]) {
        const params=convertSearchParams(new URLSearchParams(input),source);
        verifySourceSearchHref('/search/?'+params,origin,query);
    }
    const encodedQuery='Doris + 日本語 & запрос';
    verifySourceSearchHref('/search/?'+new URLSearchParams({version:'docs/dev/',ctx:'docs',q:encodedQuery}),origin,encodedQuery);
    for(const href of [
        '/search/?ctx=docs&q=other&version=docs%2Fdev%2F',
        '/search/?q='+query+'&version=docs%2Fdev%2F',
        '/search/?ctx=community&q='+query+'&version=docs%2Fdev%2F',
        '/search/?ctx=docs&q='+query,
        '/search/?ctx=docs&q='+query+'&version=docs%2F4.x%2F',
        '/ja/search/?ctx=docs&q='+query+'&version=docs%2Fdev%2F',
        'https://example.invalid/search/?ctx=docs&q='+query+'&version=docs%2Fdev%2F',
        '/search/?ctx=docs&q='+query+'&q=other&version=docs%2Fdev%2F',
    ])assert.throws(()=>verifySourceSearchHref(href,origin,query),undefined,href);
});
test('an implicit native default stays on the stable version when switching languages',()=>{
    const target=convertSearchParams(new URLSearchParams({q:'Doris'}),managed,source);
    assert.equal(target.get('ctx'),'docs/4.x');
    assert.equal(target.get('q'),'Doris');assert(!target.has('version'));
});
test('latest version and unsupported status come from native metadata and registered contexts',()=>{
    const futureVersions=[{path:'/site/ru/docs/dev'},{path:'/site/ru/docs/5.x',isLast:true},{path:'/site/ru/docs/4.x'}];
    const options={managed:true,versions:futureVersions,contexts:['docs/dev','docs/5.x','community']};
    assert.equal(resolveSearchScope({context:'docs'},options).context,'docs/5.x');
    assert.equal(resolveSearchScope({context:'docs/4.x'},options).sourceOnlyVersion,'4.x');
    assert.equal(resolveSearchScope({context:'https://example.com'},source).context,'docs');
});
