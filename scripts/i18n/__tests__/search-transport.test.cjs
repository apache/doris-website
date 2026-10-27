const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const lunr = require('lunr');
const {adaptSearchWorker} = require('../search-worker-loader.cjs');
const {targetFingerprint} = require('../search-plugin.cjs');
const root = path.resolve(__dirname, '../../..');
function compile(source, imports = {}) {
    const {outputText} = ts.transpileModule(source, {compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    }});
    const module = {exports: {}};
    new Function('require','module','exports','location',outputText)(name => {
        if (Object.hasOwn(imports, name)) return imports[name];
        return require(name);
    },module,module.exports,{origin:'https://doris.apache.org'});
    return module.exports;
}
const {fetchSearchIndex} = compile(fs.readFileSync(path.join(root,'src/utils/fetchSearchIndex.js'),'utf8'));
const base = {origin:'https://doris.apache.org',siteOrigin:'https://doris.apache.org',assetOrigin:'https://cdnd.selectdb.com'};

test('production search reads its configured CDN and preserves version, locale and fingerprint', async () => {
    const requests=[],data=[{documents:[]}];
    const result=await fetchSearchIndex('/ko/search-index-docs-dev-aabb.json?probe=1', {...base,
        fetchImpl:async url=>{requests.push(url);return {ok:true,json:async()=>data};}});
    assert.equal(result,data);
    assert.deepEqual(requests,['https://cdnd.selectdb.com/ko/search-index-docs-dev-aabb.json?probe=1']);
});

test('CDN HTTP, JSON and network failures fall back to the same-origin index', async () => {
    for (const failure of ['http','json','network']) {
        const requests=[];
        const result=await fetchSearchIndex('/zh-CN/docs/dev/search-index-docs-aabb.json', {...base,
            fetchImpl:async url=>{
                requests.push(url);
                if(requests.length===1) {
                    if(failure==='network')throw new Error('offline');
                    return {ok:failure!=='http',status:503,json:async()=>{throw new Error('bad JSON');}};
                }
                return {ok:true,json:async()=>[]};
            }});
        assert.deepEqual(result,[]);
        assert.deepEqual(requests,['https://cdnd.selectdb.com/zh-CN/docs/dev/search-index-docs-aabb.json','https://doris.apache.org/zh-CN/docs/dev/search-index-docs-aabb.json']);
    }
});

test('local previews do not read production CDN data, and external version URLs fail closed', async () => {
    const requests=[];
    await fetchSearchIndex('/docs/dev/search-index-docs-aabb.json', {...base,origin:'http://127.0.0.1:3000',
        fetchImpl:async url=>{requests.push(url);return {ok:true,json:async()=>[]};}});
    assert.deepEqual(requests,['http://127.0.0.1:3000/docs/dev/search-index-docs-aabb.json']);
    await assert.rejects(fetchSearchIndex('https://example.com/search-index.json',base),/Unexpected search index origin/);
});

test('a stalled response is aborted before trying the other host', async () => {
    const requests=[];
    await fetchSearchIndex('/search-index-aabb.json', {...base,timeoutMs:5,
        fetchImpl:async(url,{signal})=>{
            requests.push(url);
            if(requests.length===1)return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))));
            return {ok:true,json:async()=>[]};
        }});
    assert.equal(requests.length,2);
});

test('the actual worker discards rejected cache entries and reuses successful ones', async () => {
    const source=fs.readFileSync(require.resolve('@yang1666204/docusaurus-search-local/dist/client/client/theme/worker.js'),'utf8');
    const index=lunr(function(){this.ref('i');this.field('t');this.add({i:'1',t:'Doris'});});
    const payload=[{documents:[{i:1,t:'Doris',u:'/docs/dev/intro/'}],index:index.toJSON()}];
    let calls=0;
    const {SearchWorker}=compile(adaptSearchWorker(source,base), {
        [require.resolve('../../../src/utils/fetchSearchIndex.js')]:{fetchSearchIndex:async()=>{if(++calls===1)throw new Error('offline');return payload;}},
        comlink:{expose(){}},
        '../utils/proxiedGeneratedConstants':{searchIndexUrl:'search-index{dir}-aabb.json',language:['en']},
        '../utils/tokenize':{},'../utils/smartQueries':{},'../../shared/interfaces':{},
        '../utils/sortSearchResults':{},'../utils/processTreeStatusOfSearchResults':{},
    });
    const worker=new SearchWorker();
    await assert.rejects(worker.fetchIndexes('/docs/dev/','docs'),/offline/);
    await worker.fetchIndexes('/docs/dev/','docs');
    await worker.fetchIndexes('/docs/dev/','docs');
    assert.equal(calls,2);
    await assert.rejects(worker.fetchIndexes('https://example.com/','docs'),/Unexpected version url/);
    assert.throws(()=>adaptSearchWorker(source.replace('const cache = new Map();','const changed = 1;')),/Unexpected search worker/);
});

test('source-language search fingerprints include historical versions; managed fallback versions do not', t => {
    const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'doris-search-fingerprint-'));
    t.after(()=>fs.rmSync(fixture,{recursive:true,force:true}));
    fs.writeFileSync(path.join(fixture,'versions.json'),'["4.x","3.x","2.1"]');
    fs.mkdirSync(path.join(fixture,'versioned_docs/version-3.x'),{recursive:true});
    const file=path.join(fixture,'versioned_docs/version-3.x/topic.md');fs.writeFileSync(file,'Before');
    const english=targetFingerprint(fixture,'en',{allVersions:true}),japanese=targetFingerprint(fixture,'ja');
    fs.writeFileSync(file,'After');
    assert.notEqual(targetFingerprint(fixture,'en',{allVersions:true}),english);
    assert.equal(targetFingerprint(fixture,'ja'),japanese);
});
