const test=require('node:test');
const assert=require('node:assert/strict');
const {createServerCompile,snapshotMdx,restoreMdx,combineSamplingScopes}=require('../compiler-processes.cjs');
const request=()=>({configs:[{name:'client'},{name:'server'}],currentBundler:{name:'rspack'},other:'unchanged'});
test('parent restores the isolated client manifest before compiling only the server',async()=>{
    const calls=[],input=request(),stats={};
    const compile=createServerCompile({restoreManifest:value=>{assert.equal(value,input);calls.push('restore');},compile:async value=>{
        assert.deepEqual(value.configs,[input.configs[1]]);assert.equal(value.other,'unchanged');calls.push('server');return stats;
    },measureServer:async callback=>{calls.push('measure');return callback();}});
    assert.equal(await compile(input),stats);assert.deepEqual(calls,['restore','measure','server']);
    assert.deepEqual(input.configs.map(c=>c.name),['client','server']);
});
test('invalid or changed manifest stops before allocating the server compiler',async()=>{
    let calls=0;const error=new Error('manifest changed');
    const compile=createServerCompile({restoreManifest:()=>{throw error;},compile:()=>calls++});
    await assert.rejects(compile(request()),value=>value===error);assert.equal(calls,0);
});
test('server failures propagate without a second client compilation',async()=>{
    const calls=[],error=new Error('server failed');
    const compile=createServerCompile({restoreManifest:()=>{},compile:async value=>{calls.push(value.configs.map(c=>c.name));throw error;}});
    await assert.rejects(compile(request()),value=>value===error);assert.deepEqual(calls,[['server']]);
});
test('hash-router client output is retained without allocating a server',async()=>{
    const calls=[];const compile=createServerCompile({restoreManifest:()=>calls.push('restore'),compile:()=>calls.push('unexpected')});
    await compile({...request(),configs:[{name:'client'}]});assert.deepEqual(calls,['restore']);
});
test('unknown compiler shapes fail before manifest restoration',async()=>{
    let calls=0;const compile=createServerCompile({restoreManifest:()=>calls++,compile:()=>calls++});
    await assert.rejects(compile({...request(),configs:[{name:'server'},{name:'client'}]}),/Revalidate/);assert.equal(calls,0);
});
test('compiler mechanism changes select native equality, publishing and search fixtures',()=>{
    const {policy}=require('../ci-plan.cjs');
    for(const file of ['scripts/build-locale.cjs','scripts/build-locales.cjs','scripts/i18n/compiler-processes.cjs']){
        const plan=policy([file]);assert(plan.runCompilerFixture);assert(plan.runSearchFixture);assert(plan.runTranslationTests);assert(plan.runPublishFixture);assert(plan.runSamplingFixture);
    }
    assert(!policy(['src/theme/SearchBar/SearchBar.module.css']).runCompilerFixture);
});
test('MDX transfer preserves full/truncated resource keys and client asset loader code',async()=>{
    const full='export const assets = require("image?emit=true");',excerpt='truncated client JSX';
    const config={module:{rules:[{use:[{options:{crossCompilerCache:new Map([
        ['/blog/post.mdx',{promise:Promise.resolve(full)}],['/blog/post.mdx?truncated',{promise:Promise.resolve(excerpt)}],
    ])}}]}]}};
    const bytes=await snapshotMdx(config);
    const options={crossCompilerCache:new Map()},server={module:{rules:[{oneOf:[{use:{options}}]}]}};
    restoreMdx(server,bytes);
    assert.equal(await options.crossCompilerCache.get('/blog/post.mdx').promise,full);
    assert.equal(await options.crossCompilerCache.get('/blog/post.mdx?truncated').promise,excerpt);
    assert.throws(()=>options.crossCompilerCache.get('/missing.mdx'),/Missing isolated/);
});
test('conflicting client MDX variants fail instead of silently selecting a plugin',async()=>{
    const entry=code=>({options:{crossCompilerCache:new Map([['/same.mdx',{promise:Promise.resolve(code)}]])}});
    await assert.rejects(snapshotMdx({module:{rules:[{use:[entry('one'),entry('other')]}]}}),/Conflicting/);
});
test('malformed MDX snapshots fail before server compilation',()=>{
    assert.throws(()=>restoreMdx({module:{rules:[]}},Buffer.from('{"invalid":true}')),/Invalid isolated/);
});
test('sample proof preserves actual client modules and server-side checks for the same selection',()=>{
    const base={sourceSha:'a'.repeat(40),locale:'ja',selected:[{pluginId:'default',version:'current',docId:'one',route:'/ja/docs/dev/one/'}]};
    const server={...base,anchorChecksSkipped:2,compiledMdxModules:{server:['docs/one.mdx']}},client={...base,compiledMdxModules:{client:['docs/one.mdx','blog/post.mdx']}};
    const merged=combineSamplingScopes(server,client);assert.equal(merged.anchorChecksSkipped,2);assert.deepEqual(merged.compiledMdxModules,{...server.compiledMdxModules,...client.compiledMdxModules});
    assert.throws(()=>combineSamplingScopes(server,{...client,sourceSha:'b'.repeat(40)}),/scopes differ/);
    assert.throws(()=>combineSamplingScopes(server,{...client,selected:[]}),/scopes differ/);
    assert.throws(()=>combineSamplingScopes(server,{...base}),/proof is missing/);
});
