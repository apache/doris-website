const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {execFileSync,spawnSync} = require('node:child_process');
const {createFixture} = require('./__tests__/fixtures/multi-locale.cjs');
const root = path.resolve(__dirname,'../..');
const fixture = path.join(root,'.i18n-build/compiler-fixture');
function inventory(directory) {
    const files={};
    function walk(current){for(const entry of fs.readdirSync(current,{withFileTypes:true})){
        const file=path.join(current,entry.name);
        if(entry.isDirectory())walk(file);
        else {const bytes=fs.readFileSync(file);files[path.relative(directory,file)]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
    }}
    walk(directory);return files;
}
async function main() {
    fs.rmSync(fixture,{recursive:true,force:true});
    const {write}=await createFixture(fixture);
    write('docs/pixel.svg','<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>');
    fs.appendFileSync(path.join(fixture,'docs/01-shared.md'),'\n![Local image](./pixel.svg)\n');
    write('blog/2026-01-01-first.md','---\ntitle: First post\nslug: first\n---\n\nExcerpt.\n\n<!-- truncate -->\n\n## More\n\nFull blog body.\n');
    write('blog/2026-01-02-second.md','---\ntitle: Second post\nslug: second\n---\n\nSecond body.\n');
    write('i18n/ja/docusaurus-plugin-content-blog/2026-01-01-first.md','---\ntitle: 日本語の記事\nslug: first\n---\n\n日本語。\n\n<!-- truncate -->\n\n## More\n\n記事の本文。\n');
    fs.appendFileSync(path.join(fixture,'docusaurus.config.js'),`\nconst original=module.exports;
module.exports=()=>{const config=original();config.future={experimental_faster:true};
config.presets[0][1].blog={path:'blog',showReadingTime:false,onInlineAuthors:'ignore',onUntruncatedBlogPosts:'ignore'};
config.plugins.push(require(${JSON.stringify(path.join(root,'config/custom-docusaurus-plugin.js'))}));return config;};\n`);
    write('.gitignore','node_modules\n.i18n-build/\n.docusaurus/\nbuild/\n');
    execFileSync('git',['add','.'],{cwd:fixture});
    execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Pinned native compiler equality fixture'],{cwd:fixture});
    const modes={};
    for(const mode of ['parallel','isolated']){
        const child=spawnSync(process.execPath,[path.join(root,'scripts/build-locales.cjs'),'--site-dir',fixture],{
            cwd:root,stdio:'inherit',env:{...process.env,NODE_OPTIONS:'--max-old-space-size=4096',
                DORIS_COMPILER_MODE:mode,DORIS_OPTIMIZE_PUBLISH:'false',DORIS_ASSET_ORIGIN:'',
                TERSER_PARALLEL:'2',RAYON_NUM_THREADS:'4',DOCUSAURUS_SSR_CONCURRENCY:'4',DORIS_BUILD_METRICS:'true'}});
        assert.equal(child.status,0,mode+' native fixture build');
        const build=JSON.parse(fs.readFileSync(path.join(fixture,'.i18n-build/build-result.json')));
        assert.equal(build.locales.length,5);
        const metrics=build.locales.map(({locale})=>JSON.parse(fs.readFileSync(path.join(fixture,'.i18n-build/compiler-metrics',locale+'.json'))));
        if(mode==='isolated')for(const record of metrics){
            assert.equal(record.bundler,'rspack');assert.deepEqual(record.records.map(r=>r.name),['client','server']);
            assert(record.records.every(r=>r.success));assert(record.records[0].finishedAtMs<=record.records[1].startedAtMs);
            assert.notEqual(record.records[0].pid,record.records[1].pid);assert.equal(record.clientExitCode,0);
            assert(record.clientExitedAtMs<=record.records[1].startedAtMs,'Server started before the client process exited');
        }
        modes[mode]={files:inventory(path.join(fixture,'build')),metrics};
    }
    const paths=new Set([...Object.keys(modes.parallel.files),...Object.keys(modes.isolated.files)]);
    const differences=[...paths].filter(file=>JSON.stringify(modes.parallel.files[file])!==JSON.stringify(modes.isolated.files[file]));
    const result={passed:!differences.length,scope:'Same-source five-language real Rspack HTML/JS/CSS output; no full website build',
        implementationSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
        fixtureSource:execFileSync('git',['rev-parse','HEAD'],{cwd:fixture,encoding:'utf8'}).trim(),
        locales:5,filesCompared:paths.size,bytesCompared:Object.values(modes.isolated.files).reduce((sum,row)=>sum+row.bytes,0),
        differences,modes};
    fs.writeFileSync(path.join(root,'.i18n-build/compiler-fixture-verification.json'),JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({passed:result.passed,filesCompared:paths.size,differences}));assert(result.passed,'Process-isolated native compilation changed emitted artifacts');
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={inventory};
