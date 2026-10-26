// Recount the complete native scope on every run. The T03 snapshot is only a
// comparison baseline, never an allowlist for new documents or sidebar keys.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const {hash, identity, inventoryBaseline, loadRecordsAt, pipelineLocale} = require('./state.cjs');
const {collect, validateScope} = require('./inventory.cjs');

const keyFor = locale => page => identity({...page,locale});
// One `git show` per page is several thousand processes for a full-scope
// audit. Read the same blobs through one `git cat-file --batch` process and
// keep only the SHA-256 the audit compares.
function refHashes(root, ref, files) {
    const unique = [...new Set(files)], hashes = new Map();
    if (!unique.length) return hashes;
    const result = spawnSync('git', ['cat-file', '--batch'], {
        cwd: root, maxBuffer: 512 * 1024 * 1024,
        input: unique.map(file => `${ref}:${file}`).join('\n') + '\n',
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
        throw new Error(`git cat-file --batch failed: ${result.stderr.toString().trim()}`);
    let offset = 0;
    for (const file of unique) {
        const newline = result.stdout.indexOf(0x0a, offset);
        assert(newline >= 0, `Truncated git cat-file output at ${file}`);
        const header = result.stdout.toString('utf8', offset, newline);
        offset = newline + 1;
        if (header.endsWith(' missing')) {hashes.set(file, null); continue;}
        const match = header.match(/^[0-9a-f]+ blob (\d+)$/);
        assert(match, `Unexpected git cat-file header for ${file}: ${header}`);
        const size = Number(match[1]);
        hashes.set(file, hash(result.stdout.toString('utf8', offset, offset + size)));
        offset += size + 1;
    }
    return hashes;
}
function baselineEntries(root) {
    return ['dev','4x','community'].flatMap(group => {
        const meta = JSON.parse(fs.readFileSync(path.join(root,`${group}.json`),'utf8'));
        return meta.entryFiles.flatMap(shard => JSON.parse(fs.readFileSync(path.join(root,shard),'utf8')).entries);
    });
}
function sidebarAudit(native,root,scope) {
    const result = [];
    for (const group of scope.groups) {
        if (group.kind) continue; // Source modules/partials have no native sidebar.
        const plugin = native.labels.find(item => item.pluginId === group.pluginId);
        assert(plugin, `Missing native sidebar plugin ${group.pluginId}`);
        const versionFile = plugin.files.find(file => file.path === (group.version === 'current' ? 'current' : `version-${group.version}`));
        assert(versionFile, `Missing native sidebar keys ${group.id}`);
        const suffix = group.pluginId === 'default' ? '' : `-${group.pluginId}`;
        const dir = path.join(root,`i18n/${scope.locale}/docusaurus-plugin-content-docs${suffix}`);
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
async function audit({root,sourceRef,baseline,native}) {
    const locale = pipelineLocale(root);
    const key = keyFor(locale);
    baseline ??= inventoryBaseline(root, locale);
    const commit = execFileSync('git',['rev-parse',`${sourceRef}^{commit}`],{cwd:root,encoding:'utf8'}).trim();
    execFileSync('git',['diff','--quiet',commit,'--',`i18n/${locale}`,`translations/state/${locale}`],{cwd:root});
    const untracked = execFileSync('git',['ls-files','--others','--exclude-standard','--',`i18n/${locale}`,`translations/state/${locale}`],
        {cwd:root,encoding:'utf8'}).trim();
    assert(!untracked,`Uncommitted translated targets/state cannot count at ${commit}: ${untracked}`);
    const scope = JSON.parse(fs.readFileSync(path.join(root,`translations/scope/${locale}.json`),'utf8'));
    validateScope(scope, locale);
    const committedRecords = loadRecordsAt(root, locale, commit);
    native ||= await collect(root);
    const old = new Map(baselineEntries(baseline).map(page => [key(page),page]));
    const current = new Set(), groups = [];
    const files = group => execFileSync('git',['ls-tree','-r','--name-only',commit,'--',group.sourceRoot],{cwd:root,encoding:'utf8'})
        .split('\n').filter(file => group.kind ? require('./source-groups.cjs').matchesSource(group, file)
            && require('./source-groups.cjs').hasProse(root, group, file) : /\.(md|mdx)$/.test(file));
    const scoped = scope.groups.map(group => ({group,
        pages:native.pages.filter(page => page.pluginId === group.pluginId && page.version === group.version)}));
    const sourceHashes = refHashes(root, commit, scoped.flatMap(({pages}) => pages.map(page => page.englishPath)));
    const targetHashes = refHashes(root, commit, scoped.flatMap(({pages}) => pages
        .filter(page => page.status === 'current' && page.reviewStatus !== 'unverified' && page.useTarget)
        .map(page => page.targetPath)));
    for (const {group, pages} of scoped) {
        assert(pages.length,`Missing native group ${group.id}`);
        const sourceFiles = files(group), seen = new Set(), entries = [];
        for (const page of pages) {
            assert(page.englishPath.startsWith(group.sourceRoot+'/'),`Wrong source root: ${page.englishPath}`);
            assert(sourceFiles.includes(page.englishPath),`Native page missing at source ref: ${page.englishPath}`);
            assert.equal(sourceHashes.get(page.englishPath),hash(fs.readFileSync(path.join(root,page.englishPath),'utf8')),
                `Source differs from ${commit}: ${page.englishPath}`);
            assert(!seen.has(page.englishPath),`Duplicate native source ${page.englishPath}`);
            seen.add(page.englishPath); current.add(key(page));
            const previous = old.get(key(page));
            const disposition = page.draft ? 'draft' : scope.retainEnglish.some(entry => key(entry) === key(page)) ? 'retain_english' : 'translate';
            const mergedCurrent = page.status === 'current' && page.reviewStatus !== 'unverified' && page.useTarget
                    && targetHashes.get(page.targetPath) !== null
                    && targetHashes.get(page.targetPath) === page.targetHash
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
        'translations/config.json',`translations/scope/${locale}.json`];
    if (scope.groups.some(group => group.pluginId === 'course')) routingInputs.push('sidebarsCourse.ts');
    if (scope.groups.some(group => group.pluginId === 'releases')) routingInputs.push('sidebarsReleases.json');
    routingInputs.push(`translations/state/${locale}/docs.json`, `translations/state/${locale}/resolved-deletions.json`);
    const schemaPath = `translations/state/${locale}/shards.schema.json`;
    if (refHashes(root, commit, [schemaPath]).get(schemaPath) !== null) routingInputs.push(schemaPath);
    routingInputs.push(...execFileSync('git', ['ls-tree', '-r', '--name-only', commit, '--', `translations/state/${locale}/pages`],
        {cwd:root,encoding:'utf8'}).split('\n').filter(Boolean));
    const routingHashes = refHashes(root, commit, routingInputs);
    for (const file of routingInputs) assert.equal(routingHashes.get(file),hash(fs.readFileSync(path.join(root,file),'utf8')),
        `Routing input differs from source ref: ${file}`);
    return {schemaVersion:1,sourceCommit:commit,baselineCommit:JSON.parse(fs.readFileSync(path.join(baseline,'summary.json'),'utf8')).sourceCommit,
        routingInputHashes:Object.fromEntries(routingInputs.map(file => [file,routingHashes.get(file)])),
        groups,removed,labels,sidebar,reports:native.reports,
        fallbackOnlyVersions: require('./docs-language-policy.cjs').fallbackOnlyVersions.map(version => ({pluginId:'default',version,
            proseLocales:['en','zh-CN'],otherLocaleContent:'en',requiredTranslation:false}))};
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
