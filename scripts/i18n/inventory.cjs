// Offline scope snapshot. Load native docs metadata/sidebars, without Webpack,
// SSR, model requests, or changing the production plugin/version configuration.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, identity, decide, loadRecordsAt} = require('./state.cjs');

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const key = page => identity({...page, locale: 'ja'});
function validateScope(scope) {
    assert(scope.schemaVersion === 1 && scope.locale === 'ja', 'Unsupported scope');
    assert(Number.isInteger(scope.maxBatchPages) && scope.maxBatchPages > 0 && scope.maxBatchPages <= 20, 'Batch limit must be 1..20');
    const groups = new Set();
    const identities = new Set();
    assert(Array.isArray(scope.groups) && scope.groups.length && Array.isArray(scope.retainEnglish), 'Scope needs groups and explicit exceptions');
    for (const group of scope.groups) {
        assert(typeof group.pluginId === 'string' && group.pluginId && typeof group.version === 'string' && group.version, 'Group needs plugin/version');
        assert(/^[A-Z0-9]+$/.test(group.id) && !groups.has(group.id), 'Invalid/duplicate group');
        assert(!identities.has(key({...group, docId: ''})), 'Duplicate plugin/version group');
        assert(group.sourceRoot && !path.isAbsolute(group.sourceRoot) && !group.sourceRoot.split('/').includes('..'), 'Invalid source root');
        groups.add(group.id);
        identities.add(key({...group, docId: ''}));
    }
    const exceptions = new Set();
    for (const entry of scope.retainEnglish) {
        assert(entry.reason?.trim() && !exceptions.has(key(entry)), 'English exception needs a unique identity and reason');
        assert(scope.groups.some(group => group.pluginId === entry.pluginId && group.version === entry.version), 'English exception outside scope');
        exceptions.add(key(entry));
    }
}

function sidebarOrder(sidebars) {
    const ids = [];
    function walk(items) {
        for (const item of items) {
            if (item.type === 'category') {
                if (item.link?.type === 'doc') ids.push(item.link.id);
                walk(item.items);
            } else if (item.type === 'doc' || item.type === 'ref') ids.push(item.id);
            else if (item.docId) ids.push(item.docId);
        }
    }
    Object.values(sidebars).forEach(walk);
    return new Map([...new Set(ids)].map((id, index) => [id, index]));
}

// A candidate in the working tree, or even on a feature branch, cannot count
// as merged coverage. The caller supplies the reviewed, merged source commit.
function mergedCurrent(page, committedHash) {
    return page.status === 'current' && page.useTarget && page.reviewStatus !== 'unverified'
        && committedHash(page.targetPath) === page.targetHash;
}

function buildGroup({group, pages, files, order, scope, committedHash, committedRecords}) {
    const relevant = pages.filter(page => page.pluginId === group.pluginId && page.version === group.version);
    assert(relevant.length, `Missing native plugin/version: ${group.id}`);
    const identities = new Set();
    const routes = new Set();
    const paths = new Set();
    const exceptions = [];
    const entries = relevant.map(page => {
        assert(!identities.has(key(page)), `Duplicate native identity: ${key(page)}`);
        assert(!routes.has(page.permalink), `Duplicate native route: ${page.permalink}`);
        assert(page.englishPath.startsWith(group.sourceRoot + '/'), `Source root mismatch: ${page.englishPath}`);
        identities.add(key(page)); routes.add(page.permalink); paths.add(page.englishPath);
        const allowed = scope.retainEnglish.find(entry => key(entry) === key(page));
        const disposition = page.draft ? 'draft' : allowed ? 'retain_english' : 'translate';
        const record = committedRecords.get(key(page));
        const complete = disposition === 'translate' && mergedCurrent(page, committedHash)
            && record?.sourceHash === page.sourceHash && record?.targetHash === page.targetHash
            && record?.sourcePath === page.sourcePath && record?.targetPath === page.targetPath
            && record?.sourceLocale === page.sourceLocale && record?.reviewStatus === page.reviewStatus;
        if (disposition !== 'translate') exceptions.push({kind: disposition, sourcePath: page.englishPath,
            docId: page.docId, reason: page.draft ? 'Native front matter marks this document as draft; no production page.' : allowed.reason});
        return {pluginId: page.pluginId, version: page.version, docId: page.docId, locale: 'ja',
            sourceLocale: page.sourceLocale, sourcePath: page.sourcePath, englishPath: page.englishPath,
            targetPath: page.targetPath, permalink: page.permalink, englishPermalink: page.englishPermalink,
            sourceHash: page.sourceHash, targetHash: page.targetHash, status: page.status,
            reviewStatus: page.reviewStatus, unlisted: page.unlisted, disposition,
            mergedCurrent: complete, batchId: null};
    }).sort((a, b) => (order.get(a.docId) ?? Infinity) - (order.get(b.docId) ?? Infinity)
        || compare(a.sourcePath, b.sourcePath));
    for (const file of files) {
        if (!paths.has(file)) exceptions.push({kind: 'unregistered_file', sourcePath: file,
            reason: 'Not registered by the native docs include/exclude rules.'});
    }
    for (const file of paths) assert(files.includes(file), `Native source absent from census: ${file}`);
    for (const allowed of scope.retainEnglish.filter(entry => entry.pluginId === group.pluginId && entry.version === group.version)) {
        assert(identities.has(key(allowed)), `Unused English exception: ${key(allowed)}`);
    }
    const pending = entries.filter(page => page.disposition === 'translate' && !page.mergedCurrent);
    const batches = [];
    for (let i = 0; i < pending.length; i += scope.maxBatchPages) {
        const id = `T09-${group.id}-${String(batches.length + 1).padStart(3, '0')}`;
        const batchPages = pending.slice(i, i + scope.maxBatchPages);
        batchPages.forEach(page => { page.batchId = id; });
        batches.push({id, status: 'TODO', pr: null, review: 'pending',
            docIds: batchPages.map(page => page.docId), pages: batchPages.length,
            remainingAfterBatch: pending.length - i - batchPages.length});
    }
    const required = entries.filter(page => page.disposition === 'translate');
    const counts = {sourceFiles: files.length, registered: entries.length, required: required.length,
        mergedCurrent: required.filter(page => page.mergedCurrent).length,
        humanReviewed: required.filter(page => page.mergedCurrent && page.reviewStatus === 'human').length,
        machineReviewed: required.filter(page => page.mergedCurrent && page.reviewStatus === 'machine').length,
        untranslated: required.filter(page => page.status === 'untranslated').length,
        needsUpdate: required.filter(page => !page.mergedCurrent && page.status !== 'untranslated').length,
        drafts: entries.filter(page => page.disposition === 'draft').length,
        retainEnglish: entries.filter(page => page.disposition === 'retain_english').length,
        unregistered: exceptions.filter(entry => entry.kind === 'unregistered_file').length,
        pending: pending.length, batches: batches.length};
    assert.equal(counts.required, counts.mergedCurrent + counts.untranslated + counts.needsUpdate);
    return {...group, counts, entries, exceptions, batches};
}

function markdownFiles(root, dir) {
    return fs.readdirSync(path.join(root, dir), {withFileTypes: true}).flatMap(entry => {
        const file = `${dir}/${entry.name}`;
        return entry.isDirectory() ? markdownFiles(root, file) : /\.(md|mdx)$/.test(entry.name) ? [file] : [];
    }).sort(compare);
}

async function collect(root) {
    assert.equal(require('@docusaurus/core/package.json').version, '3.6.3', 'Revalidate native inventory API after upgrading Docusaurus');
    for (const name of ['DOCS_VERSIONS', 'LANDING_ONLY', 'SKIP_DOCS', 'SKIP_COMMUNITY', 'SKIP_COURSE', 'SKIP_RELEASES']) {
        assert(!process.env[name] || process.env[name] === 'false', `Inventory must not use ${name}`);
    }
    process.env.DORIS_ENABLE_JA = 'true';
    process.env.NODE_ENV = 'production';
    delete process.env.DOCUSAURUS_CURRENT_LOCALE;
    const {loadContext} = require('@docusaurus/core/lib/server/site.js');
    const {applyTrailingSlash} = require('@docusaurus/utils-common');
    const {loadPluginConfigs} = require('@docusaurus/core/lib/server/plugins/configs.js');
    const {initPluginsConfigs} = require('@docusaurus/core/lib/server/plugins/init.js');
    const context = await loadContext({siteDir: root});
    const configs = (await loadPluginConfigs(context)).filter(config => config.plugin.isTranslationDocsPlugin);
    const plugins = (await initPluginsConfigs(context, configs)).map(result => result.plugin);
    const pages = [], reports = [], versions = [], labels = [];
    for (const plugin of plugins) {
        const content = await plugin.loadContent();
        assert(content.translationManifest, 'Missing T02 native translation manifest');
        pages.push(...content.translationManifest.pages);
        reports.push(...content.translationManifest.reports);
        for (const version of content.loadedVersions) {
            versions.push({pluginId: plugin.options.id, version: version.versionName, order: sidebarOrder(version.sidebars)});
            const registered = new Map([...version.docs, ...version.drafts].map(doc => [doc.id, doc]));
            for (const page of content.translationManifest.pages.filter(page => page.version === version.versionName)) {
                const doc = registered.get(page.docId);
                assert(doc && applyTrailingSlash(doc.permalink, {trailingSlash: context.siteConfig.trailingSlash, baseUrl: context.baseUrl})
                    === page.englishPermalink, `Native route mismatch: ${key(page)}`);
                registered.delete(page.docId);
            }
            assert.equal(registered.size, 0, 'Native docs missing from translation manifest');
        }
        labels.push({pluginId: plugin.options.id, files: await plugin.getTranslationFiles({content})});
    }
    return {pages, reports, versions, labels};
}

function renderBatches(snapshot) {
    const lines = ['# Japanese document batches', '', `Source commit: \`${snapshot.sourceCommit}\`.`, '',
        'Each TODO batch is one independent PR, after T03 and T04 merge. No model calls are needed for manual batches.',
        'Counts below describe the source snapshot. Fallback routes and unmerged candidates do not count as coverage.',
        'Dev and 4.x use their own source files and hashes. Keep each PR at most 20 pages; split a batch further when needed.', '',
        '| Group | Required | Merged/current | Untranslated | Needs update | Pending | Batches |',
        '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'];
    for (const group of snapshot.groups) {
        const c = group.counts;
        lines.push(`| ${group.id} | ${c.required} | ${c.mergedCurrent} | ${c.untranslated} | ${c.needsUpdate} | ${c.pending} | ${c.batches} |`);
    }
    lines.push('', 'Start with DEV-001, then 4X-001 and COMMUNITY-001. Follow the numbered batches within each group.',
        'The native sidebar determines priority; documents outside a sidebar follow in source-path order.',
        'Exact target paths, routes, source hashes and exceptions are in the adjacent group JSON files and their entry shards.',
        'The four merged PoC translations have machine review status. They still need Japanese proofreading before public delivery.', '',
        'These initial IDs remain the audit baseline. Record PRs and proofreading in this ledger after each batch; regenerate a new snapshot separately rather than overwriting active assignments.', '');
    for (const group of snapshot.groups) for (const batch of group.batches) {
        lines.push(`## ${batch.id}`, '', `Status: ${batch.status}. PR: none. Japanese proofreading: pending.`, '',
            `Dependencies: T03 and T04. Pages: ${batch.pages}. Remaining in ${group.id} after this batch: ${batch.remainingAfterBatch}.`, '',
            '| Doc ID | Source file | Source SHA-256 |', '| --- | --- | --- |');
        for (const docId of batch.docIds) {
            const page = group.entries.find(entry => entry.docId === docId);
            lines.push(`| ${docId} | ${page.sourcePath} | \`${page.sourceHash}\` |`);
        }
        lines.push('', 'Acceptance: protected code/SQL/outputs, front matter, images/alt text, MDX, links and heading IDs verified;',
            'source/target state recorded; version-specific build and Japanese proofreading recorded in the PR.', '');
    }
    return lines.join('\n');
}

async function main() {
    const args = process.argv.slice(2);
    const option = name => args[args.indexOf(name) + 1];
    assert(args.includes('--source-ref') && args.includes('--output'), 'Usage: inventory.cjs --source-ref <merged SHA> --output <new directory>');
    const root = path.resolve(__dirname, '../..');
    const sourceCommit = option('--source-ref');
    assert(/^[a-f0-9]{40}$/.test(sourceCommit), 'Use a full merged commit SHA');
    const output = path.resolve(option('--output'));
    assert(!fs.existsSync(output), 'Use a new snapshot directory; never overwrite active batch assignments');
    const scope = JSON.parse(fs.readFileSync(path.join(root, 'translations/scope/ja.json'), 'utf8'));
    validateScope(scope);
    const gitRead = file => {
        try {return execFileSync('git', ['show', `${sourceCommit}:${file}`], {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024});}
        catch {return null;}
    };
    execFileSync('git', ['cat-file', '-e', `${sourceCommit}^{commit}`], {cwd: root});
    const committedRecords = loadRecordsAt(root, 'ja', sourceCommit);
    const committedCache = new Map();
    const committedHash = file => {
        if (!committedCache.has(file)) {
            const value = gitRead(file);
            committedCache.set(file, value === null ? null : hash(value));
        }
        return committedCache.get(file);
    };
    const native = await collect(root);
    for (const page of native.pages) {
        const record = committedRecords.get(key(page));
        if (!record) continue;
        const source = gitRead(page.sourcePath);
        const target = gitRead(page.targetPath);
        // Validate the committed record itself, rather than letting a repaired
        // working-tree record turn an old invalid state into merged coverage.
        const committed = source !== null && decide({page, source, target: target ?? undefined, record});
        if (!committed || committed.status !== 'current' || !committed.indexable) committedRecords.delete(key(page));
    }
    for (const page of native.pages.filter(page => scope.groups.some(group => group.pluginId === page.pluginId && group.version === page.version))) {
        assert.equal(committedHash(page.sourcePath), page.sourceHash, `Source differs from pinned commit: ${page.sourcePath}`);
        const englishHash = hash(fs.readFileSync(path.join(root, page.englishPath), 'utf8'));
        assert.equal(committedHash(page.englishPath), englishHash, `English source differs from pinned commit: ${page.englishPath}`);
    }
    const groups = scope.groups.map(group => {
        const files = markdownFiles(root, group.sourceRoot);
        const committedFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', sourceCommit, '--', group.sourceRoot], {cwd: root, encoding: 'utf8'})
            .split('\n').filter(file => /\.(md|mdx)$/.test(file)).sort(compare);
        assert.deepEqual(files, committedFiles, `Source census differs from pinned commit: ${group.sourceRoot}`);
        return buildGroup({group, pages: native.pages, files, scope, committedHash, committedRecords,
            order: native.versions.find(version => version.pluginId === group.pluginId && version.version === group.version)?.order ?? new Map()});
    });
    const reports = native.reports.map(report => ({...report, inScope: scope.groups.some(group => group.pluginId === report.pluginId && group.version === report.version)}))
        .sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)));
    const routingInputs = ['docusaurus.config.js', 'versions.json', 'sidebars.ts', 'sidebarsCommunity.json', 'versioned_sidebars/version-4.x-sidebars.json', 'translations/config.json', 'translations/scope/ja.json'];
    const snapshot = {schemaVersion: 1, locale: 'ja', sourceCommit,
        routingInputs: Object.fromEntries(routingInputs.map(file => [file, hash(fs.readFileSync(path.join(root, file), 'utf8'))])),
        nativeVersions: native.versions.map(({order, ...version}) => version), groups, reports};
    fs.mkdirSync(output, {recursive: true});
    for (const group of groups) {
        // Small deterministic shards respect the repository's asset size limit
        // and make individual translation scopes easier to inspect.
        const directory = group.id.toLowerCase();
        const entryFiles = [];
        fs.mkdirSync(path.join(output, directory));
        for (let i = 0; i < group.entries.length; i += 200) {
            const filename = `${directory}/${String(entryFiles.length + 1).padStart(3, '0')}.json`;
            entryFiles.push(filename);
            fs.writeFileSync(path.join(output, filename), JSON.stringify({schemaVersion: 1, sourceCommit,
                groupId: group.id, entries: group.entries.slice(i, i + 200)}, null, 2) + '\n');
        }
        const {entries, ...metadata} = group;
        fs.writeFileSync(path.join(output, `${directory}.json`), JSON.stringify({schemaVersion: 1, sourceCommit, ...metadata, entryFiles}, null, 2) + '\n');
    }
    const {groups: ignored, ...summary} = snapshot;
    fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify({...summary, groups: groups.map(({entries, batches, exceptions, ...group}) => ({...group, exceptions}))}, null, 2) + '\n');
    fs.writeFileSync(path.join(output, 'batches.md'), renderBatches(snapshot));
    fs.writeFileSync(path.join(output, 'sidebar-labels.json'), JSON.stringify(native.labels.filter(plugin => groups.some(group => group.pluginId === plugin.pluginId))
        .map(plugin => ({...plugin, files: plugin.files.filter(file => groups.some(group => group.pluginId === plugin.pluginId && (group.version === 'current' ? 'current' : `version-${group.version}`) === file.path))})), null, 2) + '\n');
    console.log(JSON.stringify({sourceCommit, groups: groups.map(group => ({id: group.id, ...group.counts})), reports: reports.length}));
}

if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {validateScope, sidebarOrder, buildGroup, mergedCurrent, renderBatches, collect};
