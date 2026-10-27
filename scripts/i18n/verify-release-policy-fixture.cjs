// Small real native-docs fixture: historical/current/missing release notes,
// automatic eligibility, model-call guards, publication, search and SEO.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const cheerio = require('cheerio');
const {createFixture} = require('./__tests__/fixtures/multi-locale.cjs');
const {hash, identity, loadRecords} = require('./state.cjs');
const {structure} = require('./structure.cjs');
const {audit} = require('./audit-coverage.cjs');
const {plan} = require('./plan-translations.cjs');
const {prepare, readState, targetFor} = require('./translate-docs.cjs');
const {checkIndexes} = require('./verify-search.cjs');
const {createServer} = require('../publish/serve.cjs');

const repo = path.resolve(__dirname, '../..');
const root = path.join(repo, '.i18n-build/release-policy-fixture');
const locales = ['en', 'zh-CN', 'ja', 'ko', 'ru'];
const managed = ['ja', 'ko', 'ru'];
const words = {ja:'日本語',ko:'한국어',ru:'Русский','zh-CN':'中文'};
const git = (...args) => execFileSync('git', args, {cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
function write(file, data) {const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);}
function commit(message) {git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','-qm',message);return git('rev-parse','HEAD');}
const sourceFor = name => `---\ntitle: Release ${name}\nlast_update:\n  date: 2026-01-01\n---\n\n## Usage\n\nReleaseFixtureSQL documents ${name}.\n\n\`\`\`sql\nSELECT 1;\n\`\`\`\n`;

async function addTarget(locale, name, sourceCommit) {
    const sourcePath=`releasenotes/${name}.md`,source=fs.readFileSync(path.join(root,sourcePath),'utf8');
    const targetPath=`i18n/${locale}/docusaurus-plugin-content-docs-releases/current/${name}.md`;
    const target=source.replace('title: Release',`title: ${words[locale]}`).replace('ReleaseFixtureSQL documents',`${words[locale]} ReleaseFixtureSQL`);
    write(targetPath,target);
    if (!managed.includes(locale)) return;
    const file=`translations/state/${locale}/docs.json`,state=JSON.parse(fs.readFileSync(path.join(root,file)));
    state.pages.push({pluginId:'releases',version:'current',docId:name,locale,sourceLocale:'en',sourcePath,targetPath,sourceCommit,
        sourceHash:hash(source),targetHash:hash(target),sourceTechnicalHash:(await structure(source,'.md')).technicalHash,
        reviewStatus:'machine',ownership:'machine',translatedAt:'2026-10-27T00:00:00Z',glossaryVersion:'fixture'});
    write(file,JSON.stringify(state));
}

async function create() {
    fs.rmSync(root,{recursive:true,force:true});
    await createFixture(root);
    write('releasenotes/historical.md',sourceFor('historical'));
    let source=commit('Historical source');
    for (const locale of ['zh-CN',...managed]) await addTarget(locale,'historical',source);
    const cutoff=commit('Historical translations');
    write('translations/release-notes-baseline.json',JSON.stringify({schemaVersion:1,sourceCommit:cutoff,
        pluginId:'releases',version:'current',sourceRoot:'releasenotes',sourceFiles:['releasenotes/historical.md'],
        historicalPaths:['releasenotes/historical.md'],documents:[{docId:'historical',sourcePath:'releasenotes/historical.md',sourceHash:hash(sourceFor('historical'))}]}));
    const group={id:'RELEASES',pluginId:'releases',version:'current',sourceRoot:'releasenotes',
        sourcePolicy:{mode:'new-only',baseline:'translations/release-notes-baseline.json'}};
    for (const locale of managed) {
        write(`translations/scope/${locale}.json`,JSON.stringify({schemaVersion:1,locale,maxBatchPages:20,
            groups:[group],automaticGroups:['RELEASES'],retainEnglish:[],retainSidebarLabels:[]}));
        write(`translations/state/${locale}/resolved-deletions.json`,'{"schemaVersion":1,"deletions":[]}');
    }
    for (const name of ['new-current','new-missing']) write(`releasenotes/${name}.md`,sourceFor(name));
    source=commit('New release-note sources');
    for (const locale of ['zh-CN',...managed]) await addTarget(locale,'new-current',source);
    fs.renameSync(path.join(root,'docusaurus.config.js'),path.join(root,'fixture.base.config.cjs'));
    write('docusaurus.config.js',`const base=require('./fixture.base.config.cjs');module.exports=()=>{const config=base();
config.plugins.splice(2,0,[require(${JSON.stringify(path.join(repo,'scripts/i18n/docs-plugin.cjs'))}),{id:'releases',path:'releasenotes',routeBasePath:'releases',sidebarPath:false}]);
config.themes=[[require(${JSON.stringify(path.join(repo,'scripts/i18n/search-plugin.cjs'))}),{hashed:false,language:['en'],docsRouteBasePath:['docs','community','releases'],searchContextByPaths:['docs','community','releases']}]];
return config;};\n`);
    for (const file of ['sidebars.ts','sidebarsCommunity.json','sidebarsCourse.ts','sidebarsReleases.json']) write(file,'{}');
    // Exercise the actual site's index-root and cross-context worker adapters,
    // not the upstream theme's different locale URL assumptions.
    const {bodyDependencies}=require('./page-body.cjs');
    for (const entry of ['src/theme/SearchPage/index.js','src/theme/SearchBar/index.js']) {
        for (const file of bodyDependencies(repo,entry,{shared:true}).files)
            write(file,fs.readFileSync(path.join(repo,file)));
    }
    write('static/images/search-icon.svg',fs.readFileSync(path.join(repo,'static/images/search-icon.svg')));
    const final=commit('Release-note policy fixture');
    const baseline=path.join(root,'audit-baseline');
    write('audit-baseline/summary.json',JSON.stringify({sourceCommit:cutoff}));
    for (const group of ['dev','4x','community']) write(`audit-baseline/${group}.json`,'{"entryFiles":[]}');
    const results=[];
    for (const locale of managed) {
        process.env.I18N_LOCALE=locale;
        const report=await audit({root,sourceRef:final,baseline});
        const releases=report.groups.find(group=>group.id==='RELEASES');
        assert.equal(releases.counts.historicalExcluded,1);
        assert.deepEqual(report.automaticCounts,{required:2,current:1,pending:1});
        const scope=JSON.parse(fs.readFileSync(path.join(root,`translations/scope/${locale}.json`)));
        const planned=await plan({report,scope,records:loadRecords(root,locale),baseline:[],
            readCurrent:file=>fs.readFileSync(path.join(root,file),'utf8'),readAt:()=>null});
        assert.equal(planned.selected.length,1);
        const task=planned.tasks.find(task=>task.id===planned.selected[0]);
        assert.equal(task.docId,'new-missing');
        let calls=0;
        const candidate=await prepare({root,plan:planned,taskId:task.id,scope,state:readState(root,locale),target:targetFor(root,locale),
            glossary:{schemaVersion:1,version:'fixture',keep:[],terms:[]},adapter:{model:'fixture',async translate({units}){
                calls++;return {translations:units.map(unit=>({id:unit.id,text:`${words[locale]} ${unit.text}`}))};}}});
        assert(calls>0&&candidate.target.includes(words[locale]));
        assert(candidate.target.includes('SELECT 1;'));
        assert(!fs.existsSync(path.join(root,task.targetPath)),'The mock candidate must not replace the missing-target publication case');
        const active={schemaVersion:1,candidates:[{...task,pr:'https://github.com/apache/doris-website/pull/1'}]};
        const reserved=await plan({report,scope,records:loadRecords(root,locale),active,readCurrent:file=>fs.readFileSync(path.join(root,file),'utf8'),readAt:()=>null});
        assert.equal(reserved.selected.length,0);
        results.push({locale,counts:releases.counts,mockRequests:calls,selected:task.docId,reservedCount:reserved.selected.length});
    }
    fs.writeFileSync(path.join(root,'eligibility.json'),JSON.stringify(results,null,2)+'\n');
    return results;
}

function checkSite() {
    const site=path.join(root,'build'),pages=[],search=[];
    for (const locale of locales) for (const name of ['historical','new-current','new-missing']) {
        const prefix=locale==='en'?'':`/${locale}`,route=`${prefix}/releases/${name}/`;
        const $=cheerio.load(fs.readFileSync(path.join(site,route,'index.html'),'utf8'));
        const fallback=locale!=='en'&&name==='new-missing';
        assert.equal($('.theme-doc-markdown').attr('lang'),fallback?'en':locale);
        assert.equal($('link[rel=canonical]').attr('href'),`https://doris.apache.org${fallback?'':prefix}/releases/${name}/`);
        assert.equal(/noindex/.test($('meta[name=robots]').attr('content')??''),fallback);
        if(fallback)assert.equal($(`link[rel=alternate][hreflang="${locale}"]`).length,0);
        pages.push({locale,name,route,fallback});
    }
    for(const locale of managed){
        const manifest=JSON.parse(fs.readFileSync(path.join(root,`.i18n-build/manifests/${locale}.json`)));
        const checked=checkIndexes({site,locale,manifest});
        assert.equal(checked.summary.contexts.releases,2);
        search.push({locale,indexedReleases:2});
    }
    return {pages,search};
}

async function checkBrowser() {
    const {chromium}=require('playwright'),server=createServer(path.join(root,'build'));
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true}),errors=[],results=[];
    try{const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
        for(const locale of managed){
            await page.goto(`${origin}/${locale}/releases/new-current/`);
            assert.equal(await page.locator('.theme-doc-markdown').getAttribute('lang'),locale);
            await page.goto(`${origin}/${locale}/search/?q=ReleaseFixtureSQL&ctx=releases`);
            await page.locator('section article a').first().waitFor({timeout:30000});
            const links=await page.locator('section article a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
            assert(links.some(link=>link.includes('/releases/new-current/')));
            assert(links.every(link=>link.startsWith(`/${locale}/releases/`)&&!link.includes('new-missing')));
            results.push({locale,workerSearch:true,noFallbackIndex:true});
        }assert.deepEqual(errors,[]);return {results,errors};
    }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}

async function main(){
    if(!process.argv.includes('--verify-existing')){
        await create();
        const built=spawnSync(process.execPath,[path.join(repo,'scripts/build-locales.cjs'),'--site-dir',root],
            {stdio:'inherit',env:{...process.env,DORIS_ASSET_ORIGIN:'',DORIS_OPTIMIZE_PUBLISH:'',NODE_OPTIONS:'--max-old-space-size=4096'}});
        assert.equal(built.status,0,'Release-note fixture build failed');
    }
    const result={scope:'synthetic three-note, five-language fixture; no real model calls or production notes',
        sourceCommit:git('rev-parse','HEAD'),eligibility:JSON.parse(fs.readFileSync(path.join(root,'eligibility.json'))),...checkSite()};
    if(process.argv.includes('--browser'))result.browser=await checkBrowser();
    fs.writeFileSync(path.join(repo,'.i18n-build/release-policy-fixture-verification.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({releasePages:result.pages.length,search:result.search,browser:result.browser}));
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});
module.exports={create,checkSite,checkBrowser};
