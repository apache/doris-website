// Reconcile every open master PR that touches a managed Japanese document.
// PR titles and authors are never used to decide whether a page is active.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash, identity, languageName, pipelineLocale, stateFileFor} = require('./state.cjs');
const {managedPath} = require('./translation-engine.cjs');
const {botBranchFor, ownershipMarker} = require('./automation-naming.cjs');

const statePathFor = locale => `translations/state/${locale}/docs.json`;
const json = value => JSON.parse(value);
const ordered = values => [...values].sort((a, b) => a.localeCompare(b, 'en'));

function managedTarget(scope, target) {
    return scope.groups.some(group => {
        const suffix = group.pluginId === 'default' ? '' : `-${group.pluginId}`;
        const version = group.version === 'current' ? 'current' : `version-${group.version}`;
        return target.startsWith(group.kind==='blog'?`i18n/${scope.locale}/docusaurus-plugin-content-blog/`:`i18n/${scope.locale}/docusaurus-plugin-content-docs${suffix}/${version}/`)
            && (group.kind === 'code' ? /\.tsx?$/.test(target) : /\.mdx?$/.test(target));
    });
}

function parseState(raw) {
    const data = json(raw);
    assert(data.schemaVersion === 1 && Array.isArray(data.pages), 'Invalid translation state in open PR');
    return data.pages;
}

async function reconcileOpenPrs({scope, language, pulls, filesFor, readHead, readBase, repository}) {
    const active = new Map(), blocked = new Set(), exceptions = [], relevant = [];
    const botPrs = [], botDetails = [];
    const statePath = statePathFor(scope.locale);
    const markerPattern = ownershipMarker(language);
    for (const pull of pulls) {
        if (pull.base?.ref !== 'master') continue;
        if (pull.head?.repo?.full_name === repository && pull.head?.ref?.startsWith(botBranchFor(scope.locale))) {
            botPrs.push(pull.number);
            const marker = markerPattern.exec(pull.body || '');
            botDetails.push({number: pull.number, branch: pull.head.ref, headSha: pull.head.sha,
                expectedHead: marker?.[1] || null, untouched: marker?.[1] === pull.head.sha});
            if (marker?.[1] !== pull.head.sha) exceptions.push({kind: 'edited_robot_branch', pr: pull.number,
                headSha: pull.head.sha, recordedHead: marker?.[1] || null});
        }
        const files = await filesFor(pull);
        const changed = new Set(files.map(file => file.filename).filter(file => managedTarget(scope, file)));
        const shards = files.map(file => file.filename)
            .filter(file => new RegExp(`^translations/state/${scope.locale}/pages/.+\\.json$`).test(file));
        const stateChanged = files.some(file => file.filename === statePath) || shards.length > 0;
        if (!changed.size && !stateChanged) continue;
        relevant.push(pull.number);
        let pages;
        try {
            const raw = await readHead(pull, statePath);
            const byIdentity = new Map(parseState(raw).map(page => [identity(page), page]));
            let base;
            const shardFiles = new Set(shards);
            if (stateChanged) {
                // Current master may contain translations merged after this PR branched.
                assert(typeof readBase === 'function', 'PR merge-base reader is required');
                base = new Map(parseState(await readBase(pull, statePath))
                    .map(page => [identity(page), page]));
                if (files.some(file => file.filename === statePath)) {
                    for (const page of [...byIdentity.values(), ...base.values()]) {
                        if (JSON.stringify(byIdentity.get(identity(page))) !== JSON.stringify(base.get(identity(page))))
                            shardFiles.add(stateFileFor(page));
                    }
                }
            }
            for (const file of shardFiles) {
                for (const [records, rawShard] of [[byIdentity, await readHead(pull, file)],
                    [base, await readBase(pull, file)]]) {
                    if (rawShard === null) continue; // Added or deleted shard.
                    const shard = json(rawShard);
                    assert(shard.schemaVersion === 1 && shard.page && stateFileFor(shard.page) === file,
                        `Invalid open PR state shard ${file}`);
                    records.set(identity(shard.page), shard.page);
                    if (shards.includes(file)) changed.add(shard.page.targetPath);
                }
            }
            pages = [...byIdentity.values()];
            if (stateChanged) {
                for (const page of pages) {
                    if (!managedTarget(scope, page.targetPath)) continue;
                    const old = base.get(identity(page));
                    if (JSON.stringify(old) !== JSON.stringify(page)) changed.add(page.targetPath);
                }
                for (const page of base.values()) {
                    if (managedTarget(scope, page.targetPath)
                        && !byIdentity.has(identity(page))) changed.add(page.targetPath);
                }
            }
        } catch (error) {
            for (const targetPath of changed) blocked.add(targetPath);
            exceptions.push({kind: 'unreadable_open_pr_state', pr: pull.number, detail: error.message,
                targetPaths: ordered(changed)});
            continue;
        }
        for (const targetPath of changed) {
            const matching = pages.filter(page => page.targetPath === targetPath);
            const record = matching[0];
            try {
                assert(matching.length === 1 && record && /^[a-f0-9]{64}$/.test(record.sourceHash ?? '')
                    && /^[a-f0-9]{64}$/.test(record.targetHash ?? ''), 'Missing or invalid state record');
                managedPath(scope, record);
                const target = await readHead(pull, targetPath);
                assert(target !== null && hash(target) === record.targetHash, 'Target does not match PR state hash');
                const candidate = {pluginId: record.pluginId, version: record.version, docId: record.docId,
                    locale: scope.locale, sourcePath: record.sourcePath, sourceHash: record.sourceHash,
                    pr: `#${pull.number}`};
                const key = identity(candidate);
                if (active.has(key)) {
                    blocked.add(targetPath);
                    exceptions.push({kind: 'duplicate_open_pr_candidate', pr: pull.number,
                        otherPr: active.get(key).pr, targetPath});
                    active.delete(key);
                } else active.set(key, candidate);
            } catch (error) {
                blocked.add(targetPath);
                exceptions.push({kind: 'unresolved_open_pr_candidate', pr: pull.number,
                    targetPath, detail: error.message});
            }
        }
    }
    const candidates = [...active.values()].filter(candidate => !blocked.has(
        managedPath(scope, {...candidate, targetPath: targetFor(scope, candidate)})));
    return {schemaVersion: 1, active: {schemaVersion: 1, candidates, blockedTargets: ordered(blocked)}, blockedTargets: ordered(blocked),
        botPrs: botPrs.sort((a, b) => a - b), botDetails, openPrCount: pulls.length,
        relevantPrs: relevant.sort((a, b) => a - b), exceptions};
}

function targetFor(scope, candidate) {
    const group = scope.groups.find(item => item.pluginId === candidate.pluginId && item.version === candidate.version);
    assert(group && candidate.sourcePath.startsWith(`${group.sourceRoot}/`), 'Invalid candidate source root');
    const suffix = candidate.pluginId === 'default' ? '' : `-${candidate.pluginId}`;
    const version = candidate.version === 'current' ? 'current' : `version-${candidate.version}`;
    return (group.kind==='blog'?`i18n/${scope.locale}/docusaurus-plugin-content-blog/`:`i18n/${scope.locale}/docusaurus-plugin-content-docs${suffix}/${version}/`)
        + candidate.sourcePath.slice(group.sourceRoot.length + 1);
}

function ghPages(endpoint, {run = execFileSync, wait = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms)} = {}) {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const raw = run('gh', ['api', '--paginate', '--slurp', endpoint],
                {encoding:'utf8',maxBuffer:32*1024*1024});
            return json(raw).flat();
        } catch (error) {
            // Retry the complete read, including all pages; never use partial
            // output to decide which documents are already in an active PR.
            const transient = /HTTP (?:429|500|502|503|504)|TLS handshake timeout|connection reset|ETIMEDOUT|EAI_AGAIN/i
                .test(String(error.stderr ?? '') + '\n' + error.message);
            if (!transient || attempt === 2) throw error;
            console.warn(`Retrying GitHub PR read after a transient error (${attempt + 1}/2)`);
            wait(1000 * (attempt + 1));
        }
    }
}

async function main() {
    const root = path.resolve(__dirname, '../..');
    const output = process.argv[2];
    assert(output && process.argv.length === 3, 'Usage: workflow-prs.cjs <output-directory>');
    fs.mkdirSync(output, {recursive: true});
    const repository = process.env.GITHUB_REPOSITORY || 'apache/doris-website';
    assert(repository === 'apache/doris-website', 'Unexpected repository');
    const locale = pipelineLocale(root);
    const scope = json(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`), 'utf8'));
    const pulls = ghPages(`repos/${repository}/pulls?state=open&base=master&per_page=100`);
    const remote = process.env.I18N_PR_REMOTE || 'origin';
    const fetched = new Map(), bases = new Map();
    const fetchHead = pull => {
        if (!fetched.has(pull.number)) {
            execFileSync('git', ['fetch', '--no-tags', remote, `refs/pull/${pull.number}/head`],
                {cwd: root, stdio: ['ignore', 'ignore', 'pipe']});
            const fetchedSha = execFileSync('git', ['rev-parse', 'FETCH_HEAD'], {cwd: root, encoding: 'utf8'}).trim();
            assert.equal(fetchedSha, pull.head.sha, `Open PR #${pull.number} changed during reconciliation`);
            fetched.set(pull.number, fetchedSha);
        }
        return fetched.get(pull.number);
    };
    const readFile = (commit, file) => {
        try {return execFileSync('git', ['show', `${commit}:${file}`],
            {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024});}
        catch {return null;}
    };
    const readHead = (pull, file) => readFile(fetchHead(pull), file);
    const readBase = (pull, file) => {
        if (!bases.has(pull.number)) {
            const commit = execFileSync('git', ['merge-base', 'HEAD', fetchHead(pull)],
                {cwd: root, encoding: 'utf8'}).trim();
            assert(/^[a-f0-9]{40}$/.test(commit), `Missing merge base for PR #${pull.number}`);
            bases.set(pull.number, commit);
        }
        return readFile(bases.get(pull.number), file);
    };
    const result = await reconcileOpenPrs({scope, language: languageName(root, locale), pulls,
        filesFor: pull => ghPages(`repos/${repository}/pulls/${pull.number}/files?per_page=100`),
        readHead, readBase, repository});
    fs.writeFileSync(path.join(output, 'active-candidates.json'), JSON.stringify(result.active, null, 2) + '\n');
    fs.writeFileSync(path.join(output, 'open-pr-reconciliation.json'), JSON.stringify(result, null, 2) + '\n');
    process.stdout.write(JSON.stringify({openPrCount: result.openPrCount,
        relevantPrs: result.relevantPrs, active: result.active.candidates.length,
        blocked: result.blockedTargets.length, exceptions: result.exceptions.length}) + '\n');
}

if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
module.exports = {reconcileOpenPrs, managedTarget, targetFor, statePathFor, ghPages};
