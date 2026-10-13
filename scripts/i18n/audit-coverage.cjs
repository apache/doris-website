// Recount the complete native scope on every run. The T03 snapshot is only a
// comparison baseline, never an allowlist for new documents or sidebar keys.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, identity, loadRecordsAt} = require('./state.cjs');
const {collect, validateScope} = require('./inventory.cjs');

const baselineDir = path.resolve(__dirname,'../../translations/inventory/ja/2026-10-12');
const key = page => identity({...page,locale:'ja'});
const refContent = (root,ref,file) => {
    try {return execFileSync('git',['show',`${ref}:${file}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:16*1024*1024});}
    catch {return null;}
};
function baselineEntries(root = baselineDir) {
    return ['dev','4x','community'].flatMap(group => {
        const meta = JSON.parse(fs.readFileSync(path.join(root,`${group}.json`),'utf8'));
        return meta.entryFiles.flatMap(shard => JSON.parse(fs.readFileSync(path.join(root,shard),'utf8')).entries);
    });
}
function sidebarAudit(native,root,scope) {
    const result = [];
    for (const group of scope.groups) {
        const plugin = native.labels.find(item => item.pluginId === group.pluginId);
        assert(plugin, `Missing native sidebar plugin ${group.pluginId}`);
        const versionFile = plugin.files.find(file => file.path === (group.version === 'current' ? 'current' : `version-${group.version}`));
        assert(versionFile, `Missing native sidebar keys ${group.id}`);
        const suffix = group.pluginId === 'default' ? '' : `-${group.pluginId}`;
        const dir = path.join(root,`i18n/ja/docusaurus-plugin-content-docs${suffix}`);
        const target = path.join(dir,`${versionFile.path}.json`);
        const translated = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target,'utf8')) : {};
        const sourceKeys = Object.entries(versionFile.content).filter(([name]) => name.startsWith('sidebar.'));
        const retained = scope.retainSidebarLabels || [];
        for (const [name, value] of sourceKeys) {
            const exception = retained.find(entry => entry.pluginId === group.pluginId && entry.version === group.version && entry.key === name);
            if (exception && (!exception.reason?.trim() || value.message !== translated[name]?.message))
                throw new Error(`Invalid retained sidebar label ${name}`);
            const state = !translated[name]?.message ? 'missing' : translated[name].message === value.message
                ? exception ? 'retained_technical' : 'untranslated' : 'translated';
            result.push({group:group.id, pluginId:group.pluginId,version:group.version,key:name,
                source:value.message,translation:translated[name]?.message || null,state});
        }
        for (const exception of retained.filter(entry => entry.pluginId === group.pluginId && entry.version === group.version))
            assert(sourceKeys.some(([name]) => name === exception.key),`Unused sidebar exception ${exception.key}`);
    }
    return result;
}
async function audit({root,sourceRef,baseline = baselineDir,native}) {
    const commit = execFileSync('git',['rev-parse',`${sourceRef}^{commit}`],{cwd:root,encoding:'utf8'}).trim();
    execFileSync('git',['diff','--quiet',commit,'--','i18n/ja','translations/state/ja'],{cwd:root});
    const untracked = execFileSync('git',['ls-files','--others','--exclude-standard','--','i18n/ja','translations/state/ja'],
        {cwd:root,encoding:'utf8'}).trim();
    assert(!untracked,`Uncommitted Japanese targets/state cannot count at ${commit}: ${untracked}`);
    const scope = JSON.parse(fs.readFileSync(path.join(root,'translations/scope/ja.json'),'utf8'));
    validateScope(scope);
    const committedRecords = loadRecordsAt(root, 'ja', commit);
    native ||= await collect(root);
    const old = new Map(baselineEntries(baseline).map(page => [key(page),page]));
    const current = new Set(), groups = [];
    const files = group => execFileSync('git',['ls-tree','-r','--name-only',commit,'--',group.sourceRoot],{cwd:root,encoding:'utf8'})
        .split('\n').filter(file => /\.(md|mdx)$/.test(file));
    for (const group of scope.groups) {
        const pages = native.pages.filter(page => page.pluginId === group.pluginId && page.version === group.version);
        assert(pages.length,`Missing native group ${group.id}`);
        const sourceFiles = files(group), seen = new Set(), entries = [];
        for (const page of pages) {
            assert(page.englishPath.startsWith(group.sourceRoot+'/'),`Wrong source root: ${page.englishPath}`);
            assert(sourceFiles.includes(page.englishPath),`Native page missing at source ref: ${page.englishPath}`);
            assert.equal(hash(refContent(root,commit,page.englishPath)),hash(fs.readFileSync(path.join(root,page.englishPath),'utf8')),
                `Source differs from ${commit}: ${page.englishPath}`);
            assert(!seen.has(page.englishPath),`Duplicate native source ${page.englishPath}`);
            seen.add(page.englishPath); current.add(key(page));
            const previous = old.get(key(page));
            const disposition = page.draft ? 'draft' : scope.retainEnglish.some(entry => key(entry) === key(page)) ? 'retain_english' : 'translate';
            const mergedCurrent = page.status === 'current' && page.reviewStatus !== 'unverified' && page.useTarget
                    && refContent(root,commit,page.targetPath) !== null
                    && hash(refContent(root,commit,page.targetPath)) === page.targetHash
                && committedRecords.get(key(page))?.targetHash === page.targetHash;
            const state = disposition !== 'translate' ? disposition : page.status === 'current'
                ? mergedCurrent ? 'current' : 'unverified' : page.status;
            entries.push({pluginId:page.pluginId,version:page.version,docId:page.docId,sourcePath:page.sourcePath,
                targetPath:page.targetPath,sourceHash:page.sourceHash,targetHash:page.targetHash,
                sourceCommit:commit,permalink:page.permalink,reviewStatus:page.reviewStatus,state,
                change:!previous ? 'new' : previous.sourcePath !== page.sourcePath ? 'moved'
                    : previous.sourceHash !== page.sourceHash ? 'source_changed' : 'unchanged'});
        }
        const unregistered = sourceFiles.filter(file => !seen.has(file));
        const required = entries.filter(entry => !['draft','retain_english'].includes(entry.state));
        groups.push({id:group.id,pluginId:group.pluginId,version:group.version,
            counts:{registered:entries.length,required:required.length,current:required.filter(entry => entry.state === 'current').length,
                pending:required.filter(entry => entry.state !== 'current').length,new:entries.filter(entry => entry.change === 'new').length,
                changed:entries.filter(entry => entry.change === 'source_changed').length,moved:entries.filter(entry => entry.change === 'moved').length,
                drafts:entries.filter(entry => entry.state === 'draft').length,unregistered:unregistered.length},
            unregistered,entries});
    }
    const removed = [...old.values()].filter(page => !current.has(key(page)))
        .map(page => ({pluginId:page.pluginId,version:page.version,docId:page.docId,sourcePath:page.sourcePath,
            likelyMoveTo: groups.flatMap(group => group.entries).find(entry => entry.sourceHash === page.sourceHash
                && entry.pluginId === page.pluginId && entry.version === page.version)?.sourcePath || null}));
    const sidebar = sidebarAudit(native,root,scope);
    const labels = Object.fromEntries(['translated','untranslated','missing','retained_technical']
        .map(state => [state,sidebar.filter(entry => entry.state === state).length]));
    const routingInputs = ['docusaurus.config.js','versions.json','sidebars.ts','sidebarsCommunity.json','versioned_sidebars/version-4.x-sidebars.json',
        'translations/config.json','translations/scope/ja.json'];
    routingInputs.push('translations/state/ja/docs.json', 'translations/state/ja/resolved-deletions.json');
    if (refContent(root, commit, 'translations/state/ja/shards.schema.json') !== null)
        routingInputs.push('translations/state/ja/shards.schema.json');
    routingInputs.push(...execFileSync('git', ['ls-tree', '-r', '--name-only', commit, '--', 'translations/state/ja/pages'],
        {cwd:root,encoding:'utf8'}).split('\n').filter(Boolean));
    for (const file of routingInputs) assert.equal(refContent(root,commit,file),fs.readFileSync(path.join(root,file),'utf8'),
        `Routing input differs from source ref: ${file}`);
    return {schemaVersion:1,sourceCommit:commit,baselineCommit:JSON.parse(fs.readFileSync(path.join(baseline,'summary.json'),'utf8')).sourceCommit,
        routingInputHashes:Object.fromEntries(routingInputs.map(file => [file,hash(refContent(root,commit,file))])),
        groups,removed,labels,sidebar,reports:native.reports};
}
if (require.main === module) {
    const args = process.argv.slice(2), option = name => args[args.indexOf(name)+1];
    const root = path.resolve(__dirname,'../..');
    audit({root,sourceRef:args.includes('--source-ref') ? option('--source-ref') : 'HEAD'})
        .then(result => {const output = JSON.stringify(result,null,2)+'\n';
            if(args.includes('--output')) fs.writeFileSync(option('--output'),output); else process.stdout.write(output);
            console.log(JSON.stringify({sourceCommit:result.sourceCommit,groups:result.groups.map(({id,counts}) => ({id,counts})),
                labels:result.labels,removed:result.removed.length}));
            if(args.includes('--fail-on-pending') && (result.groups.some(group => group.counts.pending) || result.labels.missing || result.labels.untranslated)) process.exitCode=1;
        }).catch(error => {console.error(error);process.exitCode=1;});
}
module.exports = {audit,sidebarAudit};
