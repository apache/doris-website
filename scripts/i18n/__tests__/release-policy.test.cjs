const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, identity} = require('../state.cjs');
const {releasePolicy, loadBaseline} = require('../release-policy.cjs');
const {checkedTask} = require('../translation-engine.cjs');
const {prepare} = require('../translate-docs.cjs');
const {plan} = require('../plan-translations.cjs');
const {batchWide} = require('../master-drift.cjs');
const {policy: ciPolicy} = require('../ci-plan.cjs');
const {sidebarAudit, hasPending} = require('../audit-coverage.cjs');

function fixture(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doris-release-policy-'));
    t.after(() => fs.rmSync(root, {recursive:true,force:true}));
    const git = (...args) => execFileSync('git', args, {cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
    const write = (name, text) => {fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),text);};
    const commit = () => {git('add','.');git('commit','-qm','Fixture change');return git('rev-parse','HEAD');};
    git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.com');
    write('releasenotes/legacy.md','---\ntitle: Release 1.0\n---\n\nHistorical release details.\n');
    const earlier = commit();
    git('mv','releasenotes/legacy.md','releasenotes/history.md');
    write('releasenotes/unregistered.md','An existing unregistered release note.\n');
    const cutoff = commit();
    const group = {id:'RELEASES',pluginId:'releases',version:'current',sourceRoot:'releasenotes',
        sourcePolicy:{mode:'new-only',baseline:'translations/release-notes-baseline.json'}};
    const baseline = {schemaVersion:1,sourceCommit:cutoff,pluginId:'releases',version:'current',sourceRoot:'releasenotes',
        documents:[{docId:'history',sourcePath:'releasenotes/history.md',sourceHash:hash(fs.readFileSync(path.join(root,'releasenotes/history.md'),'utf8'))}],
        sourceFiles:['releasenotes/history.md','releasenotes/unregistered.md'],
        historicalPaths:['releasenotes/history.md','releasenotes/legacy.md','releasenotes/unregistered.md']};
    const saveBaseline = () => write(group.sourcePolicy.baseline,JSON.stringify(baseline));
    saveBaseline();commit();
    const scope = {schemaVersion:1,locale:'ja',maxBatchPages:20,automaticGroups:['RELEASES'],groups:[group],retainEnglish:[]};
    const page = (file, docId = path.basename(file,'.md')) => ({pluginId:'releases',version:'current',locale:'ja',docId,
        sourcePath:file,sourceHash:hash(fs.readFileSync(path.join(root,file),'utf8')),
        targetPath:'i18n/ja/docusaurus-plugin-content-docs-releases/current/'+file.slice('releasenotes/'.length)});
    const selectedPlan = task => ({schemaVersion:1,locale:'ja',sourceCommit:git('rev-parse','HEAD'),selected:['selected'],
        tasks:[{...task,id:'selected',kind:'translate_new'}]});
    return {root,git,write,commit,cutoff,earlier,group,scope,baseline,saveBaseline,page,selectedPlan};
}

test('the cutoff excludes registered, unregistered and previously renamed historical sources', t => {
    const f=fixture(t),p=releasePolicy(f.root,f.group);
    assert.equal(p.classify(f.page('releasenotes/history.md')).kind,'historical_excluded');
    assert.equal(p.classify(f.page('releasenotes/unregistered.md')).kind,'historical_excluded');
    f.write('releasenotes/legacy.md','A historical path registered again with different text.\n');f.commit();
    assert.equal(releasePolicy(f.root,f.group).classify(f.page('releasenotes/legacy.md')).kind,'historical_excluded');
});

test('a genuinely new note and its later updates remain eligible', t => {
    const f=fixture(t);f.write('releasenotes/release-2.md','---\ntitle: Release 2.0\n---\n\nA genuinely new release.\n');f.commit();
    const task=f.page('releasenotes/release-2.md');
    assert.equal(releasePolicy(f.root,f.group).classify(task).kind,'eligible');
    assert.equal(checkedTask(f.selectedPlan(task),'selected',f.scope,f.root).source.includes('new release'),true);
    f.write('releasenotes/release-2.md','---\ntitle: Release 2.0\n---\n\nUpdated new release.\n');f.commit();
    assert.equal(releasePolicy(f.root,f.group).classify(f.page('releasenotes/release-2.md')).kind,'eligible');
});

test('historical moves, later edits and re-registered IDs do not become new notes', t => {
    const f=fixture(t);f.git('mv','releasenotes/history.md','releasenotes/moved.md');f.commit();
    f.write('releasenotes/moved.md','---\ntitle: Historical update\n---\n\nChanged after moving.\n');f.commit();
    assert.equal(releasePolicy(f.root,f.group).classify(f.page('releasenotes/moved.md')).kind,'historical_excluded');
    f.write('releasenotes/registered-again.md','An old identity under a new source path.\n');f.commit();
    assert.equal(releasePolicy(f.root,f.group).classify(f.page('releasenotes/registered-again.md','history')).kind,'historical_excluded');
});

test('exact historical copies and ambiguous delete/add changes cannot trigger generation', t => {
    const f=fixture(t);f.write('releasenotes/copy.md',fs.readFileSync(path.join(f.root,'releasenotes/history.md'),'utf8'));f.commit();
    assert.notEqual(releasePolicy(f.root,f.group).classify(f.page('releasenotes/copy.md')).kind,'eligible');
    f.git('rm','releasenotes/history.md');f.write('releasenotes/uncertain.md','Completely rewritten source with an unidentified historical deletion.\n');f.commit();
    assert.equal(releasePolicy(f.root,f.group).classify(f.page('releasenotes/uncertain.md')).kind,'policy_review');
});

test('a forced historical task is rejected before any adapter/model call', async t => {
    const f=fixture(t),task=f.page('releasenotes/history.md');let calls=0;
    await assert.rejects(prepare({root:f.root,plan:f.selectedPlan(task),taskId:'selected',scope:f.scope,
        state:{data:{pages:[]}},adapter:{translate(){calls++;throw Error('must not run')}},glossary:{},target:{locale:'ja'}}),
    /Release Notes task excluded/);
    assert.equal(calls,0);
});

test('generation rejects an uncommitted policy change and an absent policy', t => {
    const f=fixture(t);f.write('releasenotes/new.md','A new release.\n');f.commit();
    const task=f.page('releasenotes/new.md'),p=f.selectedPlan(task);
    f.write(f.group.sourcePolicy.baseline,JSON.stringify(f.baseline)+'\n');
    assert.throws(()=>checkedTask(p,'selected',f.scope,f.root),/policy changed since planning/);
    const scope={...f.scope,groups:[{...f.group,sourcePolicy:undefined}]};
    assert.throws(()=>checkedTask(p,'selected',scope,f.root),/requires a new-only source policy/);
});

test('incomplete, changed or non-ancestor cutoff evidence fails closed', t => {
    const f=fixture(t);
    assert.throws(()=>releasePolicy(f.root,f.group,f.earlier),/baseline must be an ancestor/);
    f.baseline.historicalPaths=f.baseline.historicalPaths.filter(file=>!file.endsWith('/legacy.md'));f.saveBaseline();
    assert.throws(()=>releasePolicy(f.root,f.group),/omits historical path identities/);
    f.baseline.historicalPaths.push('releasenotes/legacy.md');f.baseline.documents[0].sourceHash='0'.repeat(64);f.saveBaseline();
    assert.throws(()=>releasePolicy(f.root,f.group),/hash mismatch/);
    assert.throws(()=>loadBaseline(f.root,{...f.group,sourcePolicy:{mode:'new-only',baseline:'../outside.json'}}),/Invalid release-note source policy/);
});

test('historical targets stay out of pending, deletion tasks and duplicate generation', async t => {
    const f=fixture(t);f.write('releasenotes/new.md','New release details.\n');const sourceCommit=f.commit();
    const old=f.page('releasenotes/history.md'),fresh=f.page('releasenotes/new.md'),eligibility=releasePolicy(f.root,f.group).classify(old);
    const report={schemaVersion:1,sourceCommit,baselineCommit:f.cutoff,reports:[],
        policyExclusions:[{...old,...eligibility}],
        groups:[{...f.group,unregistered:[],entries:[{...old,state:'historical_excluded'},{...fresh,state:'untranslated'}]}]};
    const args={report,scope:f.scope,records:new Map([[identity(old),old]]),baseline:[old],
        readCurrent:file=>fs.readFileSync(path.join(f.root,file),'utf8'),readAt:()=>null};
    const result=await plan(args);
    assert.equal(result.counts.required,1);assert.equal(result.automaticCounts.pending,1);
    assert.equal(result.tasks.length,1);assert.equal(result.tasks[0].sourcePath,fresh.sourcePath);
    assert.equal(result.selected.length,1);
    const reserved=await plan({...args,active:{schemaVersion:1,candidates:[{...fresh,pr:'https://github.com/apache/doris-website/pull/1'}]}});
    assert.equal(reserved.selected.length,0);assert.equal(reserved.counts.activeCandidates,1);
    const empty=await plan({...args,report:{...report,groups:[{...f.group,unregistered:[],entries:[{...old,state:'historical_excluded'}]}]},
        readCurrent:()=>{throw Error('An excluded historical source must not be read for translation')}});
    assert.equal(empty.automaticCounts.required,0);assert.equal(empty.selected.length,0);assert.deepEqual(empty.tasks,[]);
});

test('cutoff changes invalidate a batch and receive representative CI with configuration validation', () => {
    assert(batchWide('ja')('translations/release-notes-baseline.json'));
    const p=ciPolicy(['translations/release-notes-baseline.json']);
    assert.equal(p.mode,'sample');assert.equal(p.runTranslationTests,true);assert.equal(p.publicationAllowed,false);
});

test('baseline symlinks cannot read files outside the reviewed source tree', t => {
    const f=fixture(t),baseline=path.join(f.root,f.group.sourcePolicy.baseline);
    fs.renameSync(baseline,baseline+'.saved');
    fs.symlinkSync(baseline+'.saved',baseline);
    assert.throws(()=>loadBaseline(f.root,f.group),/Symlink in Release Notes baseline path/);
});

test('historical navigation stays in the census without becoming an automatic label backlog', t => {
    const f=fixture(t);f.write('releasenotes/new.md','A genuinely new release.\n');f.commit();
    const policy=releasePolicy(f.root,f.group);
    const native={pages:[f.page('releasenotes/history.md'),f.page('releasenotes/new.md')],
        labels:[{pluginId:'releases',files:[{path:'current',content:{
            'sidebar.releases.doc.history':{message:'Release 1.0'},
            'sidebar.releases.doc.new':{message:'Release 2.0'},
            'sidebar.releases.category.Core':{message:'Doris Core'},
        }}]}]};
    const rows=sidebarAudit(native,f.root,f.scope,new Map([['RELEASES',policy]]));
    assert.equal(rows.find(row=>row.key.endsWith('.history')).maintenance,'historical_excluded');
    assert.equal(rows.find(row=>row.key.endsWith('.new')).maintenance,'eligible');
    assert.equal(rows.find(row=>row.key.endsWith('.Core')).maintenance,'retained_navigation');
    const report={groups:[{counts:{pending:83}}],labels:{missing:83,untranslated:10},
        automaticCounts:{pending:0},automaticLabels:{missing:0,untranslated:0}};
    assert.equal(hasPending(report),false);
    assert.equal(hasPending({...report,automaticCounts:{pending:1}}),true);
    assert.equal(hasPending({...report,automaticLabels:{missing:1}}),true);
});
