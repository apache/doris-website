const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {inspectDocument} = require('../document-checks.cjs');
const {loadConfig} = require('../state.cjs');
const settings = loadConfig(path.resolve(__dirname,'../../..')).locales.ko;
const glossary = require('../../../translations/glossary/ko.json');
const source = '---\ntitle: Guide\ndescription: Doris guide\nsidebar_label: Guide\nlanguage: en\nkeywords: [Doris, guide]\nslug: /guide\n---\n# Guide\n\nDoris guide.\n';
const translated = '---\ntitle: 가이드\ndescription: Doris 사용 안내\nsidebar_label: 가이드\nlanguage: ko\nkeywords: [Doris, 가이드]\nslug: /guide\n---\n# 가이드\n\nDoris 사용 안내입니다.\n';
const inspect = translation => inspectDocument({source,translation,extension:'.md',glossary,targetLocale:'ko',targetScriptPattern:settings.scriptPattern});

test('Korean prose cannot silently retain a Japanese or English front-matter language', async () => {
    assert.deepEqual((await inspect(translated)).issues,[]);
    for (const language of ['ja','en']) {
        const result = await inspect(translated.replace('language: ko',`language: ${language}`));
        assert(result.issues.some(issue => issue.check === 'frontmatter' && issue.message.includes('language')));
    }
});

test('complete Korean documents retain visible metadata fields and keyword coverage', async () => {
    for (const changed of [translated.replace('title: 가이드\n',''), translated.replace('description: Doris 사용 안내\n',''),
        translated.replace('keywords: [Doris, 가이드]','keywords: [Doris]')]) {
        assert((await inspect(changed)).issues.some(issue => issue.check === 'frontmatter'));
    }
});

const fs = require('node:fs');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {hash,identity,stateFileFor,loadRecords} = require('../state.cjs');
const {plan: makePlan} = require('../plan-translations.cjs');
const {prepare,applyCandidates,applyStaged,readState,targetFor} = require('../translate-docs.cjs');
const {pairFor,copyPair} = require('../workflow-generate.cjs');
const {translateWholeDocument} = require('../translate-document.cjs');
const {codexAdapter} = require('../codex-adapter.cjs');
const {checkLinks} = require('../document-checks.cjs');
const {structure} = require('../structure.cjs');
const scope = require('../../../translations/scope/ko.json');
const repo = path.resolve(__dirname,'../../..');
const mdxSource = '---\ntitle: Guide\nlanguage: en\nslug: /guide\n---\nimport Card from "@site/src/Card";\n\n# Guide\n\nDoris guide. [Next](./next.md)\n\n<Card title="Details" mode={1} />\n\n```sql\nSELECT 1;\n```\n';
const mdxTarget = mdxSource.replace('title: Guide','title: 가이드').replace('language: en','language: ko')
    .replace('# Guide','# 가이드').replace('Doris guide.','Doris 사용 안내입니다.').replace('[Next]','[다음]')
    .replace('title="Details"','title="세부 정보"');

function taskFor(docId, {version='current',pluginId='default',sourcePath,content=mdxSource,state='untranslated'} = {}) {
    const group = scope.groups.find(group => group.pluginId === pluginId && group.version === version);
    sourcePath ??= `${group.sourceRoot}/${docId}.mdx`;
    const relative = sourcePath.slice(group.sourceRoot.length+1);
    const plugin = pluginId==='default'?'':`-${pluginId}`;
    const directory = version==='current'?'current':`version-${version}`;
    return {pluginId,version,docId,sourcePath,locale:'ko',sourceHash:hash(content),state,reviewStatus:'unverified',
        targetHash:null,targetPath:`i18n/ko/docusaurus-plugin-content-docs${plugin}/${directory}/${relative}`,
        permalink:`/ko/${pluginId==='default'?`docs/${version==='current'?'dev':version}`:'community'}/${docId}/`};
}

async function planFor(pages,{baseline=[],records=new Map(),active,reports=[],chineseChangedPaths=[],files={},historical={}}={}) {
    return makePlan({scope,report:{schemaVersion:1,sourceCommit:'a'.repeat(40),baselineCommit:'b'.repeat(40),reports,
        groups:scope.groups.map(group=>({...group,unregistered:[],entries:pages.filter(page=>page.pluginId===group.pluginId&&page.version===group.version)}))},
        baseline,records,active,chineseChangedPaths,limit:20,
        readCurrent:file=>files[file]??(pages.some(page=>page.sourcePath===file)?mdxSource:null),readAt:(ref,file)=>historical[`${ref}:${file}`]??null});
}

test('Korean dynamic plans isolate native identities, source updates, moves and active PRs', async () => {
    const pages=[taskFor('new'),taskFor('same'),taskFor('same',{version:'4.x'}),taskFor('same',{pluginId:'community'}),
        taskFor('done',{state:'current'}),taskFor('edited',{state:'stale_technical'}),
        taskFor('moved',{sourcePath:'docs/new/moved.mdx',state:'state_conflict'}),taskFor('human',{state:'target_modified'})];
    const baseline=[{...pages[4],disposition:'translate'},
        {...pages[5],sourceHash:hash('old source'),disposition:'translate'},
        {...pages[6],sourcePath:'docs/old/moved.mdx',disposition:'translate',targetHash:hash('이전 번역')},
        {...taskFor('gone'),sourceHash:hash('removed source'),disposition:'translate'}];
    const active={schemaVersion:1,candidates:[{...pages[0],sourceHash:hash('older candidate'),pr:'#fixture-open'}]};
    const options={baseline,active,files:{'i18n/ko/docusaurus-plugin-content-docs/current/new/moved.mdx':'이전 번역'},
        chineseChangedPaths:['i18n/zh-CN/docusaurus-plugin-content-docs/current/done.mdx'],
        reports:[{kind:'unsupported_source_route',pluginId:'default',version:'current',sourceLocale:'zh-CN',sourcePath:'i18n/zh-CN/only.mdx'}]};
    const result=await planFor(pages,options);
    assert.deepEqual(result,await planFor(pages,options));
    assert.equal(result.counts.mergedCurrent,1);
    assert.equal(result.tasks.find(task=>task.docId==='edited').kind,'update');
    assert.equal(result.tasks.find(task=>task.docId==='moved').kind,'move');
    assert.equal(result.tasks.find(task=>task.docId==='gone').kind,'delete');
    assert.equal(result.tasks.find(task=>task.docId==='human').requiresHumanReview,true);
    assert(!result.selected.includes(result.tasks.find(task=>task.docId==='new').id));
    assert(result.exceptions.some(item=>item.kind==='stale_active_candidate'));
    assert(result.exceptions.some(item=>item.kind==='zh_only_change'));
    assert(result.exceptions.some(item=>item.kind==='unsupported_source_route'));
    assert.equal(new Set(result.tasks.filter(task=>task.docId==='same').map(task=>task.id)).size,3);
    assert(result.tasks.every(task=>task.locale==='ko'&&task.targetPath.startsWith('i18n/ko/')));
    const afterClose=await planFor(pages,{...options,active:{schemaVersion:1,candidates:[]}});
    assert(afterClose.selected.includes(afterClose.tasks.find(task=>task.docId==='new').id));
    assert.equal(pairFor({...pages[0],pluginId:'other'},pages,scope),null);
});

function fixture(t) {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'ko-toolchain-'));
    t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
    const write=(file,text)=>{const full=path.join(root,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,text);};
    write('.gitignore','.i18n-build/\n.codex/\n');
    // These cases exercise legacy ledger/write guards; the source-driven
    // contributor workflow has dedicated real-Git tests.
    const config=JSON.parse(fs.readFileSync(path.join(repo,'translations/config.json'),'utf8'));
    delete config.maintenancePolicy;write('translations/config.json',JSON.stringify(config));
    write('translations/scope/ko.json',JSON.stringify(scope));
    write('translations/scope/ja.json',JSON.stringify({...scope,locale:'ja'}));
    write('translations/state/ko/docs.json','{"schemaVersion":1,"pages":[]}\n');
    write('translations/state/ko/shards.schema.json','{"schemaVersion":1,"format":"page-record-v1"}\n');
    write('translations/state/ja/docs.json','{"schemaVersion":1,"pages":[],"sentinel":"unchanged"}\n');
    write('scripts/check_md_links_single.py',fs.readFileSync(path.join(repo,'scripts/check_md_links_single.py'),'utf8'));
    fs.mkdirSync(path.join(root,'static'));
    write('docs/guide.mdx',mdxSource);write('docs/next.md','# Next\n');
    write('versioned_docs/version-4.x/guide.mdx',mdxSource);write('versioned_docs/version-4.x/next.md','# Next\n');
    const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
    git('init','-q');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','-qm','source');
    const sourceCommit=git('rev-parse','HEAD');
    const primary={...taskFor('guide'),id:'T06-DEV-000000000000001',kind:'translate_new'};
    const partner={...taskFor('guide',{version:'4.x'}),id:'T06-4X-000000000000002',kind:'translate_new'};
    const plan={schemaVersion:1,locale:'ko',sourceCommit,tasks:[primary,partner],selected:[primary.id,partner.id]};
    write('.codex/auth.json','{}'); // Fake snapshot for an injected process; no real credentials/model.
    return {root,write,git,plan,primary,partner};
}

function model(root,answer) {
    let calls=0;const prompts=[];
    const adapter=codexAdapter({language:settings.languageName,locale:'ko',codexHome:path.join(root,'.codex'),
        spawnImpl:(_bin,args,options)=>{
            assert(args.includes('read-only')&&args.includes('--ignore-user-config'));
            assert(!Object.hasOwn(options.env,'OPENAI_API_KEY'));
            prompts.push(options.input);calls++;
            const translation=typeof answer==='function'?answer(calls):answer;
            fs.writeFileSync(args[args.indexOf('--output-last-message')+1],JSON.stringify({translation}));
            return {status:0,stdout:JSON.stringify({type:'turn.completed',usage:{input_tokens:10,output_tokens:10}})+'\n'};
        }});
    return {adapter,prompts,get calls(){return calls;}};
}

const generate = (data,state,adapter) => prepare({root:data.root,plan:data.plan,taskId:data.primary.id,scope,state,adapter,
    glossary,target:targetFor(data.root,'ko')});

test('Korean Codex fixtures retry metadata and SQL feedback, then apply per-page shards and a safe Dev/4.x copy', async t => {
    const data=fixture(t), state=readState(data.root,'ko');
    const mock=model(data.root,attempt=>attempt===1?mdxTarget.replace('language: ko','language: ja')
        :attempt===2?mdxTarget.replace('SELECT 1','SELECT 2'):mdxTarget);
    const candidate=await generate(data,state,mock.adapter);
    assert.equal(mock.calls,3);assert.equal(mock.adapter.usedTokens,60);
    assert(mock.prompts.every(prompt=>prompt.includes('natural Korean')));
    assert.equal(candidate.record.generation.acceptedWithWarnings,false);
    assert(candidate.record.generation.history[0].issues.some(issue=>issue.check==='frontmatter'));
    assert(candidate.record.generation.history[1].issues.some(issue=>issue.check==='protected-content'));
    const partner=pairFor(data.primary,data.plan.tasks,scope);assert.equal(partner.id,data.partner.id);
    assert.equal(pairFor(data.primary,[{...data.partner,sourceHash:hash('different')}],scope),null);
    assert.equal(pairFor(data.primary,[{...data.partner,sourcePath:'versioned_docs/version-4.x/other/guide.mdx'}],scope),null);
    const copied=copyPair(candidate,partner,scope,state,data.root);
    checkLinks({root:data.root,targetPath:copied.record.targetPath,target:copied.target});
    const ja=fs.readFileSync(path.join(data.root,'translations/state/ja/docs.json'),'utf8');
    applyCandidates(state,[candidate,copied]);
    const records=loadRecords(data.root,'ko');assert.equal(records.size,2);
    for(const record of records.values()) {
        assert.equal(record.locale,'ko');assert.equal(record.reviewStatus,'machine');assert.equal(record.ownership,'machine');
        assert.equal(record.sourceCommit,data.plan.sourceCommit);
        assert(fs.existsSync(path.join(data.root,stateFileFor(record))));
    }
    assert.equal(fs.readFileSync(path.join(data.root,'translations/state/ja/docs.json'),'utf8'),ja);
    assert.equal(fs.readFileSync(path.join(data.root,'translations/state/ko/docs.json'),'utf8'),'{"schemaVersion":1,"pages":[]}\n');
    assert.equal(fs.readFileSync(path.join(data.root,'docs/guide.mdx'),'utf8'),mdxSource);
    assert.equal(fs.readFileSync(path.join(data.root,'versioned_docs/version-4.x/guide.mdx'),'utf8'),mdxSource);
});

test('Korean generation rejects source races, human ownership and cross-locale tasks', async t => {
    const data=fixture(t), mock=model(data.root,mdxTarget);
    data.write('docs/guide.mdx',mdxSource+'\nChanged\n');
    await assert.rejects(generate(data,readState(data.root,'ko'),mock.adapter),/Source changed/);
    data.write('docs/guide.mdx',mdxSource);
    const human=readState(data.root,'ko');human.data.pages.push({...data.primary,ownership:'human'});
    await assert.rejects(generate(data,human,mock.adapter),/Human maintained/);
    const wrong={...data,plan:{...data.plan,tasks:[{...data.primary,locale:'ja'}]}};
    await assert.rejects(generate(wrong,readState(data.root,'ko'),mock.adapter),/outside the managed/);
    assert.equal(mock.calls,0);
});

test('Korean candidate application refuses target edits and concurrent shard creation', async t => {
    const data=fixture(t), state=readState(data.root,'ko');
    const candidate=await generate(data,state,model(data.root,mdxTarget).adapter);
    data.write(data.primary.targetPath,'human edit');
    assert.throws(()=>applyCandidates(state,[candidate]),/Target changed/);
    assert.equal(fs.readFileSync(path.join(data.root,data.primary.targetPath),'utf8'),'human edit');
    fs.rmSync(path.join(data.root,data.primary.targetPath));
    data.write(stateFileFor(candidate.record),JSON.stringify({schemaVersion:1,page:{...candidate.record,ownership:'human'}}));
    assert.throws(()=>applyCandidates(state,[candidate]),/State changed/);
    assert(!fs.existsSync(path.join(data.root,data.primary.targetPath)));
});

test('a third wrong-language Korean fixture remains an explicitly warned review candidate', async () => {
    const result=await translateWholeDocument({source:'# Guide\n\nDoris guide.\n',extension:'.md',glossary,
        targetLocale:'ko',targetScriptPattern:settings.scriptPattern,adapter:{translateDocument:async()=>({translation:'# ガイド\n\nDoris のガイド。\n'})}});
    assert.equal(result.requests,3);assert.equal(result.generation.acceptedWithWarnings,true);
    assert(result.generation.warnings.some(issue=>issue.check==='language'));
    assert.equal(result.generation.history.length,3);
});

test('Korean staged application checks the exact bytes once, uses Ko shards and rejects a Ja selector', async t => {
    const data=fixture(t), state=readState(data.root,'ko');
    const words={Guide:'가이드','Doris guide.':'Doris 사용 안내입니다.',Next:'다음',Details:'세부 정보'};
    const adapter={model:'fixture',translate:async({units})=>({translations:units.map(unit=>({id:unit.id,text:words[unit.text]??unit.text}))})};
    const candidate=await generate(data,state,adapter);
    assert.equal(candidate.record.generation,undefined,'Legacy unit-based provider must not claim a Codex retry history');
    const directory='.i18n-build/reviewed';
    const planFile=path.join(data.root,'.i18n-build/plan.json');
    data.write('.i18n-build/plan.json',JSON.stringify(data.plan));
    const candidatePath=`${directory}/${data.primary.id}/candidate.mdx`;
    data.write(candidatePath,candidate.target);
    // Synthetic staging protocol, not a live provider call or live verification.
    data.write(`${directory}/manifest.json`,JSON.stringify({schemaVersion:2,provider:'openai',liveCall:true,liveVerified:false,
        applied:false,sourceCommit:data.plan.sourceCommit,glossaryVersion:glossary.version,candidates:[{
            id:data.primary.id,sourceHash:data.primary.sourceHash,sourcePath:data.primary.sourcePath,
            targetPath:data.primary.targetPath,targetHash:candidate.record.targetHash,targetChanged:true,
            baseline:candidate.baseline,record:candidate.record}]}));
    const previous=process.env.I18N_LOCALE;
    try {
        process.env.I18N_LOCALE='ja';
        await assert.rejects(applyStaged(data.root,planFile,directory),/Invalid translation plan/);
        process.env.I18N_LOCALE='ko';
        data.write(candidatePath,candidate.target+'\n나중에 편집\n');
        await assert.rejects(applyStaged(data.root,planFile,directory),/edited after validation/);
        data.write(candidatePath,candidate.target);
        const result=await applyStaged(data.root,planFile,directory);
        assert.equal(result.applied,true);assert.equal(result.liveVerified,false);
        assert.equal(fs.readFileSync(path.join(data.root,data.primary.targetPath),'utf8'),candidate.target);
        assert.equal(loadRecords(data.root,'ko').get(identity(candidate.record)).targetHash,hash(candidate.target));
        assert.equal(loadRecords(data.root,'ja').size,0);
        assert.equal(fs.readFileSync(path.join(data.root,'translations/state/ko/docs.json'),'utf8'),'{"schemaVersion":1,"pages":[]}\n');
        await assert.rejects(applyStaged(data.root,planFile,directory),/Invalid staged live candidates/);
    } finally {if(previous===undefined)delete process.env.I18N_LOCALE;else process.env.I18N_LOCALE=previous;}
});

test('Korean staged candidates cannot replace a newer consistent machine target and state', async t => {
    const data=fixture(t), state=readState(data.root,'ko');
    const words={Guide:'가이드','Doris guide.':'Doris 사용 안내입니다.',Next:'다음',Details:'세부 정보'};
    const candidate=await generate(data,state,{model:'fixture',translate:async({units})=>({
        translations:units.map(unit=>({id:unit.id,text:words[unit.text]??unit.text}))})});
    const directory='.i18n-build/older-candidate';
    data.write('.i18n-build/plan.json',JSON.stringify(data.plan));
    data.write(`${directory}/${data.primary.id}/candidate.mdx`,candidate.target);
    data.write(`${directory}/manifest.json`,JSON.stringify({schemaVersion:2,provider:'openai',liveCall:true,
        liveVerified:false,applied:false,sourceCommit:data.plan.sourceCommit,glossaryVersion:glossary.version,
        candidates:[{id:data.primary.id,sourceHash:data.primary.sourceHash,sourcePath:data.primary.sourcePath,
            targetPath:data.primary.targetPath,targetHash:candidate.record.targetHash,
            targetChanged:true,baseline:candidate.baseline,record:candidate.record}]}));
    const newer=candidate.target.replace('Doris 사용 안내입니다.','Doris의 새로운 사용 안내입니다.');
    data.write(data.primary.targetPath,newer);
    data.write(stateFileFor(candidate.record),JSON.stringify({schemaVersion:1,page:{...candidate.record,targetHash:hash(newer)}}));
    const previous=process.env.I18N_LOCALE;
    try {
        process.env.I18N_LOCALE='ko';
        await assert.rejects(applyStaged(data.root,path.join(data.root,'.i18n-build/plan.json'),directory),/baseline changed since staging/);
        assert.equal(fs.readFileSync(path.join(data.root,data.primary.targetPath),'utf8'),newer);
        assert.equal(loadRecords(data.root,'ko').get(identity(candidate.record)).targetHash,hash(newer));
    } finally {if(previous===undefined)delete process.env.I18N_LOCALE;else process.env.I18N_LOCALE=previous;}
});

test('Korean formatting-only source changes require review and keep the recorded hashes', async () => {
    const before=mdxSource, after=mdxSource+'\n';
    const page=taskFor('formatted',{content:after,state:'stale_unknown'});
    const old={...page,sourceHash:hash(before),sourceCommit:'b'.repeat(40),targetHash:hash('이전 번역'),disposition:'translate'};
    const result=await planFor([page],{baseline:[old],files:{[page.sourcePath]:after},historical:{[`${old.sourceCommit}:${page.sourcePath}`]:before}});
    assert.equal(result.tasks[0].kind,'formatting_review');
    assert.equal(result.tasks[0].requiresHumanReview,true);
    assert.deepEqual(result.selected,[]);
    assert.equal(old.sourceHash,hash(before));
});

test('Korean legacy state remains readable and an existing page shard wins without a marker', async t => {
    const data=fixture(t);
    fs.rmSync(path.join(data.root,'translations/state/ko/shards.schema.json'));
    data.git('add','-u');data.git('-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','-qm','legacy layout');
    data.plan.sourceCommit=data.git('rev-parse','HEAD');
    const state=readState(data.root,'ko');
    const candidate=await generate(data,state,model(data.root,mdxTarget).adapter);
    applyCandidates(state,[candidate]);
    assert(!fs.existsSync(path.join(data.root,stateFileFor(candidate.record))));
    assert.equal(loadRecords(data.root,'ko').size,1);
    data.write(stateFileFor(candidate.record),JSON.stringify({schemaVersion:1,page:{...candidate.record,ownership:'human'}}));
    assert.equal(loadRecords(data.root,'ko').get(identity(candidate.record)).ownership,'human');
    await assert.rejects(generate(data,readState(data.root,'ko'),model(data.root,mdxTarget).adapter),/Human maintained/);
});

test('Korean generation rejects versions outside scope, path drift and symlink targets without a model call', async t => {
    const data=fixture(t), mock=model(data.root,mdxTarget);
    for (const changed of [{version:'3.x'}, {targetPath:'i18n/ja/docusaurus-plugin-content-docs/current/guide.mdx'},
        {sourcePath:'docs/../guide.mdx'}]) {
        const plan={...data.plan,tasks:[{...data.primary,...changed}]};
        await assert.rejects(generate({...data,plan},readState(data.root,'ko'),mock.adapter),/outside|managed|target|Invalid/i);
    }
    fs.symlinkSync(os.tmpdir(),path.join(data.root,'i18n'));
    await assert.rejects(generate(data,readState(data.root,'ko'),mock.adapter),/Symlink/);
    assert.equal(mock.calls,0);
});
