// Trusted-master automation only. A closed-by-default workflow supplies the
// model credential; this module writes only validated managed ja files/state.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, identity} = require('./state.cjs');
const {checkedTask, managedPath, safeFile} = require('./translation-engine.cjs');
const {codexAdapter} = require('./codex-adapter.cjs');
const {prepare, applyCandidates, readState} = require('./translate-docs.cjs');
const {replaceableBotPr} = require('./workflow-scan.cjs');

const root = path.resolve(__dirname, '../..');
const allowedKinds = new Set(['translate_new', 'translate_backlog', 'update']);

function relativeSource(task, scope) {
    const group = scope.groups.find(item => item.pluginId === task.pluginId && item.version === task.version);
    assert(group && task.sourcePath.startsWith(`${group.sourceRoot}/`), 'Invalid source root for pairing');
    return task.sourcePath.slice(group.sourceRoot.length + 1);
}

function pairFor(task, tasks, scope) {
    if (task.pluginId !== 'default' || !['current', '4.x'].includes(task.version)) return null;
    const otherVersion = task.version === 'current' ? '4.x' : 'current';
    const matches = tasks.filter(other => other.pluginId === 'default' && other.version === otherVersion
        && other.docId === task.docId && other.sourceHash === task.sourceHash
        && relativeSource(other, scope) === relativeSource(task, scope));
    assert(matches.length <= 1, 'Ambiguous Dev/4.x source pair');
    const partner = matches[0];
    return partner && allowedKinds.has(partner.kind) && !partner.activePr && !partner.requiresHumanReview
        ? partner : null;
}

function machineOwned(task, state) {
    const existing = state.data.pages.find(item => identity(item) === identity(task));
    return !existing || existing.ownership === 'machine';
}

function copyPair(primary, partner, scope, state, rootDir = root) {
    managedPath(scope, partner);
    assert.equal(primary.task.sourceHash, partner.sourceHash, 'Paired source hash differs');
    const targetFile = safeFile(rootDir, partner.targetPath);
    const previousTarget = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf8') : null;
    const existing = state.data.pages.find(item => identity(item) === identity(partner));
    assert(!previousTarget || existing, 'Untracked paired target needs human review');
    if (existing) assert(existing.sourcePath === partner.sourcePath && existing.targetPath === partner.targetPath
        && previousTarget !== null && hash(previousTarget) === existing.targetHash
        && existing.ownership === 'machine', 'Paired target changed or is human maintained');
    const source = fs.readFileSync(safeFile(rootDir, partner.sourcePath), 'utf8');
    assert.equal(hash(source), partner.sourceHash, 'Paired source changed');
    assert.equal(execFileSync('git', ['show', `HEAD:${partner.sourcePath}`], {cwd: rootDir, encoding: 'utf8'}), source,
        'Paired source has uncommitted changes');
    const record = {...primary.record, pluginId: partner.pluginId, version: partner.version,
        docId: partner.docId, sourcePath: partner.sourcePath, targetPath: partner.targetPath,
        sourceHash: partner.sourceHash};
    return {...primary, task: partner, targetFile, previousTarget, record,
        requests: 0, reusedFrom: primary.task.id};
}

function ensureMasterFresh(sourceCommit) {
    const repository = process.env.GITHUB_REPOSITORY || 'apache/doris-website';
    assert.equal(repository, 'apache/doris-website', 'Unexpected repository');
    const actual = execFileSync('git', ['ls-remote', `https://github.com/${repository}.git`, 'refs/heads/master'],
        {encoding: 'utf8'}).trim().split(/\s+/)[0];
    assert.equal(actual, sourceCommit, 'master advanced during generation; discard this batch and rescan');
}

function bodyFor(manifest) {
    const rows = manifest.candidates.map(item => `| ${item.kind} | ${item.version} | [\`${item.sourcePath}\`](https://github.com/apache/doris-website/blob/${manifest.sourceCommit}/${item.sourcePath}) | \`${item.sourceHash.slice(0, 12)}\` | ${item.reusedFrom ? `copied from \`${item.reusedFrom}\`` : 'model call'} |`);
    const failures = manifest.failures.length ? manifest.failures.map(item => `- \`${item.id}\` (${item.sourcePath}): ${item.error}`).join('\n') : 'None.';
    return ['## Japanese translation candidate', '',
        `Source commit: \`${manifest.sourceCommit}\``,
        `Model: \`${manifest.model}\`; glossary: \`${manifest.glossaryVersion}\``,
        'Review status: machine. Japanese proofreading and the normal PR checks are still required.',
        '', '| Action | Version | English source | SHA-256 prefix | Generation |',
        '| --- | --- | --- | --- | --- |', ...rows, '', '## Failed or skipped tasks', '', failures, '',
        '## Validation', '', 'The generator checked committed source hashes, managed paths, protected syntax,',
        'target/state hashes and the current master SHA before applying the candidate.',
        'The PR checks must verify links, routes, coverage and the site build before merging.',
        '', '<!-- japanese-translation-automation:v1 bot-head=PENDING -->', ''].join('\n');
}

async function generate({plan, reconciliation, maxPages = 2,
    adapter, glossary, rootDir = root, ensureFresh = ensureMasterFresh, output}) {
    assert(Number.isInteger(maxPages) && maxPages > 0 && maxPages <= 20, 'Invalid page limit');
    assert(plan.schemaVersion === 1 && plan.sourceCommit === execFileSync('git', ['rev-parse', 'HEAD'],
        {cwd: rootDir, encoding: 'utf8'}).trim(), 'Plan does not match trusted checkout');
    const replaces = replaceableBotPr(plan, reconciliation);
    assert(reconciliation.botPrs.length === 0 || replaces,
        'An automated Japanese PR is already open or was edited after generation');
    const scope = JSON.parse(fs.readFileSync(path.join(rootDir, 'translations/scope/ja.json'), 'utf8'));
    const state = readState(rootDir);
    const blocked = new Set(reconciliation.blockedTargets);
    const candidates = [], failures = [], consumed = new Set();
    for (const id of plan.selected) {
        if (candidates.length >= maxPages) break;
        const task = plan.tasks.find(item => item.id === id);
        if (!task || consumed.has(id) || blocked.has(task.targetPath)) continue;
        consumed.add(id);
        if (!machineOwned(task, state)) {
            failures.push({id, sourcePath: task.sourcePath, error: 'Human maintained target requires manual review'});
            continue;
        }
        let partner = pairFor(task, plan.tasks, scope);
        if (partner && (blocked.has(partner.targetPath) || !machineOwned(partner, state)
            || candidates.length + 2 > maxPages)) partner = null;
        try {
            checkedTask(plan, id, scope, rootDir);
            const primary = await prepare({root: rootDir, plan, taskId: id, scope, state, adapter, glossary,
                maxDocumentChars: 60000, maxChunkChars: 5000});
            candidates.push(primary);
            if (partner) try {
                const copy = copyPair(primary, partner, scope, state, rootDir);
                candidates.push(copy);
                consumed.add(partner.id);
            } catch (error) {
                failures.push({id: partner.id, sourcePath: partner.sourcePath, error: error.message});
            }
        } catch (error) {
            failures.push({id, sourcePath: task.sourcePath, error: error.message});
        }
    }
    const manifest = {schemaVersion: 1, sourceCommit: plan.sourceCommit, provider: 'codex',
        model: adapter.model, glossaryVersion: glossary.version, liveCall: adapter.usedTokens > 0,
        liveVerified: false, usedTokens: adapter.usedTokens,
        replacesPr: replaces ? {number: replaces.number, headSha: replaces.headSha} : null,
        candidates: candidates.map(item => ({id: item.task.id, kind: item.task.kind,
            pluginId: item.task.pluginId, version: item.task.version, docId: item.task.docId,
            sourcePath: item.task.sourcePath, sourceHash: item.task.sourceHash,
            targetPath: item.task.targetPath, targetHash: item.record.targetHash,
            reusedFrom: item.reusedFrom || null, requests: item.requests})), failures};
    fs.mkdirSync(output, {recursive: true});
    fs.writeFileSync(path.join(output, 'generation.json'), JSON.stringify(manifest, null, 2) + '\n');
    if (candidates.length) {
        ensureFresh(plan.sourceCommit);
        for (const item of candidates) checkedTask({...plan, selected: [...plan.selected, item.task.id]},
            item.task.id, scope, rootDir);
        for (const item of candidates) {
            const candidateFile = path.join(output, 'candidates', item.task.targetPath);
            fs.mkdirSync(path.dirname(candidateFile), {recursive: true});
            fs.writeFileSync(candidateFile, item.target);
        }
        applyCandidates(state, candidates);
        fs.writeFileSync(path.join(output, 'pr-body.md'), bodyFor(manifest));
    }
    return manifest;
}

function allowGeneration(env) {
    if (env.I18N_VALIDATION_RUN === 'true') {
        return env.GITHUB_EVENT_NAME === 'workflow_dispatch'
            && /\.mdx?$/.test(env.I18N_PATH || '') && env.I18N_MAX_PAGES === '1';
    }
    return env.I18N_AUTO_TRANSLATE_ENABLED === 'true' && env.I18N_LIVE_VERIFIED === 'true';
}

async function main() {
    const output = process.argv[2];
    assert(output && process.argv.length === 3, 'Usage: workflow-generate.cjs <scan-directory>');
    assert(allowGeneration(process.env), 'Live automation is not enabled or limited validation was not requested');
    const plan = JSON.parse(fs.readFileSync(path.join(output, 'plan.json'), 'utf8'));
    if (process.env.I18N_VALIDATION_RUN === 'true') {
        assert(plan.selected.length === 1 && plan.tasks.find(task => task.id === plan.selected[0])?.sourcePath === process.env.I18N_PATH,
            'Validation mode must select exactly one source file');
    }
    const reconciliation = JSON.parse(fs.readFileSync(path.join(output, 'open-pr-reconciliation.json'), 'utf8'));
    const glossary = JSON.parse(fs.readFileSync(path.join(root, 'translations/glossary/ja.json'), 'utf8'));
    assert(process.env.CODEX_BIN && fs.existsSync(process.env.CODEX_BIN), 'Pinned Codex runtime is required');
    const adapter = codexAdapter({model: process.env.I18N_CODEX_MODEL || 'gpt-6-sol',
        codexBin: process.env.CODEX_BIN, codexHome: process.env.CODEX_HOME});
    const manifest = await generate({plan, reconciliation, maxPages: Number(process.env.I18N_MAX_PAGES || '2'),
        adapter, glossary, output});
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
        `created=${manifest.candidates.length > 0}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `\nGenerated ${manifest.candidates.length} Japanese page candidates at ${manifest.sourceCommit}; `
        + `${manifest.failures.length} failed or need manual handling. No translation is merged yet.\n`);
    process.stdout.write(JSON.stringify({candidates: manifest.candidates.length,
        failures: manifest.failures.length, usedTokens: manifest.usedTokens}) + '\n');
    if (process.env.I18N_VALIDATION_RUN === 'true' && manifest.candidates.length === 0)
        process.exitCode = 1;
}

if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
module.exports = {pairFor, machineOwned, copyPair, bodyFor, generate, allowGeneration};
