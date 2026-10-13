// Offline, read-only planner. The native audit supplies the complete current
// scope; the T03 inventory is historical evidence, never an allowlist.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {audit} = require('./audit-coverage.cjs');
const {baselineEntries} = require('./plan-translations-baseline.cjs');
const {hash, identity, loadConfig, loadRecords} = require('./state.cjs');
const {structure} = require('./structure.cjs');

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const key = page => identity({...page, locale: 'ja'});
const sha = value => /^[a-f0-9]{64}$/.test(value ?? '');
const priority = {delete: 0, move: 1, move_and_update: 1, update: 2, formatting_review: 2,
    target_modified: 2, state_conflict: 2, source_divergence: 2, unsupported_route: 2,
    translate_new: 3, translate_backlog: 4};
const managed = (scope, item) => scope.groups.find(group => group.pluginId === item.pluginId && group.version === item.version);
const taskId = item => {
    const seed = JSON.stringify([item.pluginId, item.version, item.docId, item.locale, item.kind,
        item.sourceHash ?? '', item.previousDocId ?? '']);
    const number = BigInt(`0x${createHash('sha256').update(seed).digest('hex').slice(0, 12)}`).toString().padStart(15, '0');
    return `T06-${item.groupId}-${number}`;
};
const estimate = source => Math.max(1, Math.ceil((source?.length ?? 0) / 4));
const chinesePath = (group, page) => {
    if (!group.sourceRoot || !page.sourcePath.startsWith(`${group.sourceRoot}/`)) return null;
    const plugin = group.pluginId === 'default' ? '' : `-${group.pluginId}`;
    const version = group.version === 'current' ? 'current' : `version-${group.version}`;
    return `i18n/zh-CN/docusaurus-plugin-content-docs${plugin}/${version}/${page.sourcePath.slice(group.sourceRoot.length + 1)}`;
};

function validateActive(data, scope) {
    if (!data) return [];
    assert(data.schemaVersion === 1 && Array.isArray(data.candidates), 'Invalid active candidate schema');
    const seen = new Set();
    return data.candidates.map(candidate => {
        assert(candidate.locale === scope.locale && managed(scope, candidate), 'Active candidate outside managed scope');
        assert(typeof candidate.docId === 'string' && candidate.docId && sha(candidate.sourceHash)
            && typeof candidate.sourcePath === 'string' && candidate.sourcePath, 'Invalid active candidate identity/path/hash');
        assert(typeof candidate.pr === 'string' && candidate.pr.trim(), 'Active candidate needs a PR reference');
        const id = key(candidate);
        assert(!seen.has(id), `Duplicate active candidate: ${id}`);
        seen.add(id);
        return candidate;
    });
}

function validateResolved(data) {
    assert(data.schemaVersion === 1 && Array.isArray(data.deletions), 'Invalid resolved deletion schema');
    const ids = new Set();
    for (const item of data.deletions) {
        assert(/^T06-[A-Z0-9]+-[0-9]{15}$/.test(item.id ?? '') && sha(item.sourceHash)
            && typeof item.sourcePath === 'string' && item.sourcePath
            && typeof item.reviewedBy === 'string' && item.reviewedBy.trim()
            && typeof item.evidence === 'string' && item.evidence.trim()
            && Number.isFinite(Date.parse(item.resolvedAt)), 'Invalid resolved deletion');
        assert(!ids.has(item.id), `Duplicate resolved deletion: ${item.id}`);
        ids.add(item.id);
    }
    return data.deletions;
}

async function formattingOnly(before, after, filename) {
    if (before == null || after == null) return false;
    try {
        const extension = path.extname(filename);
        const [old, current] = await Promise.all([structure(before, extension), structure(after, extension)]);
        return old.semanticHash === current.semanticHash;
    } catch { return false; }
}

function referenceChecks(oldPage, newPage) {
    return {
        oldSourcePath: oldPage?.sourcePath ?? null,
        oldTargetPath: oldPage?.targetPath ?? null,
        oldPermalink: oldPage?.permalink ?? null,
        newSourcePath: newPage?.sourcePath ?? null,
        newTargetPath: newPage?.targetPath ?? null,
        newPermalink: newPage?.permalink ?? null,
        actions: ['check inbound Markdown/MDX links and heading anchors', 'check sidebar references and redirects',
            'remove or relocate obsolete Japanese target and state record'],
    };
}

async function plan({report, scope, records, baseline = [], active, readCurrent, readAt,
    resolved = {schemaVersion: 1, deletions: []}, chineseChangedPaths = [],
    limit = scope.maxBatchPages, tokenBudget = 50000, filters = {}}) {
    assert(report.schemaVersion === 1 && /^[a-f0-9]{40}$/.test(report.sourceCommit), 'Invalid source audit');
    assert(scope.schemaVersion === 1 && scope.locale === 'ja' && Number.isInteger(scope.maxBatchPages), 'Invalid managed scope');
    assert(Number.isInteger(limit) && limit >= 0 && limit <= scope.maxBatchPages, 'Limit exceeds managed batch size');
    assert(Number.isInteger(tokenBudget) && tokenBudget >= 0, 'Invalid token budget');
    if (filters.locale && filters.locale !== scope.locale) throw new Error(`Unsupported locale: ${filters.locale}`);
    const candidates = validateActive(active, scope);
    const resolvedDeletions = validateResolved(resolved);
    const activeByKey = new Map(candidates.map(candidate => [key(candidate), candidate]));
    const baselineByKey = new Map(baseline.filter(page => managed(scope, page)).map(page => [key(page), page]));
    const old = new Map(baselineByKey);
    for (const record of records.values()) if (managed(scope, record)) old.set(key(record), {...old.get(key(record)), ...record});
    const pages = report.groups.filter(group => managed(scope, group)).flatMap(group =>
        group.entries.filter(page => page.state !== 'draft' && page.state !== 'retain_english')
            .map(page => ({...page, groupId: group.id})));
    const current = new Set(pages.map(key));
    assert.equal(current.size, pages.length, 'Duplicate current identity');
    const removed = [...old.values()].filter(page => !current.has(key(page)) && page.disposition !== 'draft'
        && page.disposition !== 'retain_english').map(page => ({...page, groupId: managed(scope, page).id}));
    const matchedRemoval = new Set();
    const tasks = [];
    const exceptions = report.groups.flatMap(group => group.unregistered.map(sourcePath => ({kind: 'unregistered_file',
        groupId: group.id, sourcePath}))).concat(report.reports.filter(item => managed(scope, item)));
    const changedChinese = new Set(chineseChangedPaths);
    for (const page of pages) {
        const previous = old.get(key(page));
        const group = managed(scope, page);
        const chinese = chinesePath(group, page);
        if (chinese && changedChinese.has(chinese) && baselineByKey.get(key(page))?.sourceHash === page.sourceHash) {
            exceptions.push({kind: 'zh_only_change', groupId: page.groupId, docId: page.docId,
                sourcePath: page.sourcePath, chinesePath: chinese,
                reason: 'English source is unchanged since the inventory baseline; check terminology and behavior consistency.'});
        }
        if (page.state === 'current') continue;
        const source = readCurrent(page.sourcePath);
        assert(source !== null && hash(source) === page.sourceHash, `Current source/hash mismatch: ${page.sourcePath}`);
        let moveFrom = previous?.sourcePath !== page.sourcePath ? previous : null;
        if (!previous || !moveFrom) {
            // A new docId can still be a move, but only if one removed page in
            // the same plugin/version has the exact source hash and path differs.
            if (!previous) {
                const matches = removed.filter(item => !matchedRemoval.has(key(item)) && item.pluginId === page.pluginId
                    && item.version === page.version && item.sourceHash === page.sourceHash && item.sourcePath !== page.sourcePath);
                const destinations = pages.filter(item => item.pluginId === page.pluginId && item.version === page.version
                    && item.sourceHash === page.sourceHash && !old.has(key(item)));
                if (matches.length === 1 && destinations.length === 1) moveFrom = matches[0];
            }
        }
        if (moveFrom && !current.has(key(moveFrom))) matchedRemoval.add(key(moveFrom));
        const candidate = activeByKey.get(key(page));
        const activeValid = candidate?.sourceHash === page.sourceHash && candidate.sourcePath === page.sourcePath;
        if (candidate && !activeValid) exceptions.push({kind: 'stale_active_candidate', groupId: page.groupId,
            docId: page.docId, pr: candidate.pr, candidateHash: candidate.sourceHash, sourceHash: page.sourceHash});
        let kind;
        if (['source_missing', 'source_route_conflict'].includes(page.state)) kind = page.state === 'source_missing' ? 'source_divergence' : 'unsupported_route';
        else if (page.state === 'target_modified') kind = 'target_modified';
        else if (moveFrom) kind = moveFrom.sourceHash === page.sourceHash ? 'move' : 'move_and_update';
        else if (page.state === 'state_conflict' || page.state === 'unverified') kind = 'state_conflict';
        else if (page.state.startsWith('stale_')) {
            const historical = previous?.sourcePath
                ? readAt(previous.sourceCommit ?? report.baselineCommit, previous.sourcePath) : null;
            kind = historical && hash(historical) === previous.sourceHash
                && await formattingOnly(historical, source, page.sourcePath) ? 'formatting_review' : 'update';
        } else kind = previous ? 'translate_backlog' : 'translate_new';
        const protectedTask = ['target_modified', 'state_conflict', 'source_divergence', 'unsupported_route', 'formatting_review'].includes(kind);
        const task = {groupId: page.groupId, pluginId: page.pluginId, version: page.version, docId: page.docId,
            locale: scope.locale, kind, sourcePath: page.sourcePath, targetPath: page.targetPath,
            permalink: page.permalink, sourceHash: page.sourceHash, sourceCommit: report.sourceCommit,
            targetHash: page.targetHash, state: page.state, reviewStatus: page.reviewStatus,
            estimatedSourceTokens: estimate(source), requiresHumanReview: protectedTask,
            sourceChange: page.change,
            activePr: activeValid ? candidate.pr : null,
            ...(moveFrom ? {previousDocId: moveFrom.docId, reuseTarget: moveFrom.sourceHash === page.sourceHash
                && !!moveFrom.targetHash && !!moveFrom.targetPath
                && readCurrent(moveFrom.targetPath) !== null && hash(readCurrent(moveFrom.targetPath)) === moveFrom.targetHash,
            referenceChecks: referenceChecks(moveFrom, page)} : {})};
        task.id = taskId(task);
        tasks.push(task);
    }
    for (const page of removed.filter(item => !matchedRemoval.has(key(item)))) {
        const task = {groupId: page.groupId, pluginId: page.pluginId, version: page.version,
            docId: page.docId, locale: scope.locale, kind: 'delete', sourcePath: page.sourcePath,
            targetPath: page.targetPath ?? null, sourceHash: page.sourceHash ?? null, sourceCommit: report.sourceCommit,
            estimatedSourceTokens: 0, requiresHumanReview: true, activePr: null,
            referenceChecks: referenceChecks(page, null)};
        task.id = taskId(task);
        if (!resolvedDeletions.some(item => item.id === task.id && item.sourceHash === task.sourceHash
            && item.sourcePath === task.sourcePath)) tasks.push(task);
    }
    const groupOrder = new Map(scope.groups.map((group, index) => [group.id, index]));
    tasks.sort((a, b) => priority[a.kind] - priority[b.kind]
        || groupOrder.get(a.groupId) - groupOrder.get(b.groupId)
        || compare(a.sourcePath, b.sourcePath) || compare(a.id, b.id));
    const allCounts = {
        required: pages.length,
        mergedCurrent: pages.filter(page => page.state === 'current').length,
        pending: pages.filter(page => page.state !== 'current').length,
        untranslated: pages.filter(page => page.state === 'untranslated').length,
        needsUpdate: pages.filter(page => page.state !== 'current' && page.state !== 'untranslated').length,
        deletions: tasks.filter(task => task.kind === 'delete').length,
        moves: tasks.filter(task => task.kind === 'move' || task.kind === 'move_and_update').length,
        activeCandidates: tasks.filter(task => task.activePr).length,
    };
    assert.equal(allCounts.required, allCounts.mergedCurrent + allCounts.pending);
    const selectedTasks = tasks.filter(task => (!filters.plugin || task.pluginId === filters.plugin)
        && (!filters.version || task.version === filters.version)
        && (!filters.path || task.sourcePath.startsWith(filters.path) || task.targetPath?.startsWith(filters.path)));
    const selected = [];
    let tokens = 0;
    for (const task of selectedTasks) {
        if (selected.length >= limit) break;
        if (task.activePr || task.requiresHumanReview) continue;
        if (tokens + task.estimatedSourceTokens > tokenBudget) continue;
        selected.push(task.id);
        tokens += task.estimatedSourceTokens;
    }
    return {schemaVersion: 1, locale: scope.locale, sourceCommit: report.sourceCommit,
        baselineCommit: report.baselineCommit, counts: allCounts, selectedCount: selected.length,
        selectedEstimatedSourceTokens: tokens, selected, tasks: selectedTasks,
        exceptions: exceptions.sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)))};
}

function argumentsFrom(argv) {
    const options = {}, known = new Set(['--source-ref', '--output', '--audit-output', '--active-candidates', '--locale', '--plugin',
        '--version', '--path', '--limit', '--token-budget']);
    for (let i = 0; i < argv.length; i += 2) {
        assert(known.has(argv[i]) && argv[i + 1] && !options[argv[i]], `Unknown or incomplete option: ${argv[i]}`);
        options[argv[i]] = argv[i + 1];
    }
    return options;
}

async function main() {
    const options = argumentsFrom(process.argv.slice(2));
    const root = path.resolve(__dirname, '../..');
    const scope = JSON.parse(fs.readFileSync(path.join(root, 'translations/scope/ja.json'), 'utf8'));
    const config = loadConfig(root);
    assert(config.locales[scope.locale]?.sourceLocale === 'en', 'Planner requires an English primary source');
    const report = await audit({root, sourceRef: options['--source-ref'] ?? 'HEAD'});
    if (options['--audit-output']) fs.writeFileSync(options['--audit-output'], JSON.stringify(report, null, 2) + '\n');
    const chineseRoots = ['i18n/zh-CN/docusaurus-plugin-content-docs', 'i18n/zh-CN/docusaurus-plugin-content-docs-community'];
    execFileSync('git', ['diff', '--quiet', report.sourceCommit, '--', ...chineseRoots], {cwd: root});
    const untrackedChinese = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...chineseRoots],
        {cwd: root, encoding: 'utf8'}).trim();
    assert(!untrackedChinese, `Uncommitted Chinese counterpart: ${untrackedChinese}`);
    const chineseChangedPaths = execFileSync('git', ['diff', '--name-only', report.baselineCommit, report.sourceCommit, '--', ...chineseRoots],
        {cwd: root, encoding: 'utf8'}).trim().split('\n').filter(Boolean);
    const records = loadRecords(root, scope.locale);
    const active = options['--active-candidates'] ? JSON.parse(fs.readFileSync(options['--active-candidates'], 'utf8')) : null;
    const resolved = JSON.parse(fs.readFileSync(path.join(root, `translations/state/${scope.locale}/resolved-deletions.json`), 'utf8'));
    const readCurrent = file => {
        try { return fs.readFileSync(path.join(root, file), 'utf8'); } catch (error) {
            if (error.code === 'ENOENT') return null;
            throw error;
        }
    };
    const readAt = (ref, file) => {
        try { return execFileSync('git', ['show', `${ref}:${file}`],
            {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024}); }
        catch { return null; }
    };
    const result = await plan({report, scope, records, baseline: baselineEntries(), active, resolved,
        chineseChangedPaths, readCurrent, readAt,
        limit: options['--limit'] === undefined ? scope.maxBatchPages : Number(options['--limit']),
        tokenBudget: options['--token-budget'] === undefined ? 50000 : Number(options['--token-budget']),
        filters: {locale: options['--locale'], plugin: options['--plugin'], version: options['--version'], path: options['--path']}});
    const output = JSON.stringify(result, null, 2) + '\n';
    if (options['--output']) fs.writeFileSync(options['--output'], output);
    else process.stdout.write(output);
    process.stderr.write(`Japanese plan ${result.sourceCommit}: ${JSON.stringify(result.counts)}, selected ${result.selectedCount}\n`);
}

if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {plan, validateActive, validateResolved, formattingOnly, argumentsFrom};
