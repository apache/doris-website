// Real native docs dates and footer checks, including untracked translation views.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync,execFileSync}=require('node:child_process');
const cheerio=require('cheerio');
const {createFixture}=require('./__tests__/fixtures/multi-locale.cjs');
const {hash}=require('./state.cjs');
const root=path.resolve(__dirname,'../..'),fixture=path.join(root,'.i18n-build/date-fixture');
async function main(){
    fs.rmSync(fixture,{recursive:true,force:true});
    await createFixture(fixture);
    for(const locale of ['ja','ko','ru']){
        const file=path.join(fixture,'translations/state',locale,'docs.json'),state=JSON.parse(fs.readFileSync(file));
        for(const record of state.pages){
            const target=path.join(fixture,record.targetPath),content=fs.readFileSync(target,'utf8').replace(/last_update:\n  date: 2026-01-01\n/,'');
            fs.writeFileSync(target,content);record.targetHash=hash(content);
        }
        fs.writeFileSync(file,JSON.stringify(state));
    }
    fs.appendFileSync(path.join(fixture,'docusaurus.config.js'),`\nconst original=module.exports;module.exports=()=>{const config=original();
for(const item of config.plugins)if(Array.isArray(item)&&item[1]?.path){item[1].showLastUpdateTime=true;item[1].showLastUpdateAuthor=true;}
return config;};\n`);
    execFileSync('git',['add','.'],{cwd:fixture});
    execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Source date fixture'],{cwd:fixture});
    const directory=path.join(root,'.i18n-build/date-git-calls'),probe=path.join(root,'.i18n-build/date-git-probe.cjs');
    fs.rmSync(directory,{recursive:true,force:true});fs.mkdirSync(directory,{recursive:true});
    fs.writeFileSync(probe,`const fs=require('node:fs'),path=require('node:path');
const utils=require(${JSON.stringify(require.resolve('@docusaurus/utils/lib/gitUtils.js'))}),original=utils.getFileCommitDate,paths=[];
utils.getFileCommitDate=function(file,...args){paths.push(file);return original(file,...args);};
process.on('exit',()=>{fs.writeFileSync(path.join(process.env.DORIS_DATE_PROBE_DIRECTORY,process.pid+'.json'),JSON.stringify({paths}));});\n`);
    const result=spawnSync(process.execPath,[path.join(root,'scripts/build-locales.cjs'),'--site-dir',fixture],{
        cwd:root,stdio:'inherit',env:{...process.env,NODE_OPTIONS:`--max-old-space-size=4096 --require ${JSON.stringify(probe)}`,
            DORIS_DATE_PROBE_DIRECTORY:directory}});
    assert.equal(result.status,0,'Source date five-language native build');
    const calls=fs.readdirSync(directory).flatMap(file=>JSON.parse(fs.readFileSync(path.join(directory,file))).paths);
    const viewCalls=calls.filter(file=>/[/\\]\.i18n-build[/\\](ja|ko|ru)[/\\]docusaurus-plugin-content-docs/.test(file));
    assert.equal(viewCalls.length,0,'Generated translation views must never query Git dates');
    assert(calls.length>0,'Real source author dates must still use native Git lookup when required');
    const checked=[];
    for(const locale of ['en','zh-CN','ja','ko','ru']){
        const manifest=JSON.parse(fs.readFileSync(path.join(fixture,'.i18n-build/content-manifests',locale+'.json')));
        for(const page of manifest.pages.filter(page=>page.kind==='docs')){
            const $=cheerio.load(fs.readFileSync(path.join(fixture,'build',page.route,'index.html'),'utf8')),footer=$('.theme-last-updated');
            assert.equal(footer.length,1,`Date footer options must remain enabled: ${page.route}`);
            assert.equal(footer.find('time').attr('datetime'),'2026-01-01T00:00:00.000Z',page.route);
            assert(footer.text().includes('Fixture'),`Source author: ${page.route}`);
            checked.push({locale,route:page.route,contentLocale:page.contentLocale,sourceDate:'2026-01-01',sourceAuthor:'Fixture'});
        }
    }
    const report={passed:true,implementationSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
        fixtureSourceSha:execFileSync('git',['rev-parse','HEAD'],{cwd:fixture,encoding:'utf8'}).trim(),
        temporaryViewGitCalls:0,sourceGitCalls:calls.length,checked,
        scope:'Real five-language native docs build; source date/author and visible footer options retained for source, translated and fallback pages. No full website build.'};
    fs.writeFileSync(path.join(root,'.i18n-build/doc-dates-fixture-verification.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({passed:true,temporaryViewGitCalls:0,sourceGitCalls:calls.length,checked:checked.length}));
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
