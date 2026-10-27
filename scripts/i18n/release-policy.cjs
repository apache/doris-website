// The release-note cutoff controls automation only. Native publication and
// existing translated files/records keep their ordinary fallback semantics.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {hash} = require('./state.cjs');

const cache = new Map();
const sourcePath = file => typeof file === 'string' && file && !path.isAbsolute(file)
    && !/[\\\x00-\x1f\x7f]/.test(file) && file.split('/').every(part => part && part !== '.' && part !== '..');
const docKey = page => JSON.stringify([page.pluginId, page.version, page.docId]);

function validatePolicy(group) {
    const policy = group.sourcePolicy;
    if (policy === undefined) return;
    assert(group.pluginId === 'releases' && group.version === 'current' && !group.kind
        && policy && policy.mode === 'new-only' && policy.baseline === 'translations/release-notes-baseline.json',
    'Invalid release-note source policy');
}

function loadBaseline(root, group) {
    validatePolicy(group);
    assert(group.sourcePolicy, 'Automatic Release Notes generation requires a new-only source policy');
    const file = group.sourcePolicy.baseline;
    let cursor = root;
    for (const part of file.split('/')) {
        cursor = path.join(cursor, part);
        assert(!fs.lstatSync(cursor).isSymbolicLink(), 'Symlink in Release Notes baseline path');
    }
    assert(fs.lstatSync(cursor).isFile(), 'Release Notes baseline must be a regular file');
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const data = JSON.parse(source);
    assert(data.schemaVersion === 1 && /^[a-f0-9]{40}$/.test(data.sourceCommit)
        && data.pluginId === group.pluginId && data.version === group.version
        && data.sourceRoot === group.sourceRoot, 'Invalid Release Notes baseline identity');
    for (const name of ['documents', 'sourceFiles', 'historicalPaths']) assert(Array.isArray(data[name]), `Missing baseline ${name}`);
    const ids = new Set(), files = new Set();
    for (const doc of data.documents) {
        assert(typeof doc.docId === 'string' && doc.docId && !ids.has(doc.docId)
            && sourcePath(doc.sourcePath) && doc.sourcePath.startsWith(group.sourceRoot + '/')
            && !files.has(doc.sourcePath) && /^[a-f0-9]{64}$/.test(doc.sourceHash), 'Invalid/duplicate historical release note');
        ids.add(doc.docId); files.add(doc.sourcePath);
    }
    for (const name of ['sourceFiles', 'historicalPaths']) {
        assert(new Set(data[name]).size === data[name].length && data[name].every(file => sourcePath(file)
            && file.startsWith(group.sourceRoot + '/') && /\.mdx?$/.test(file)), `Invalid baseline ${name}`);
    }
    assert(data.sourceFiles.every(file => data.historicalPaths.includes(file))
        && [...files].every(file => data.sourceFiles.includes(file)), 'Incomplete historical source census');
    return {file, source, data};
}

function releasePolicy(root, group, sourceRef = 'HEAD') {
    if (!group.sourcePolicy) return null;
    const baseline = loadBaseline(root, group);
    const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe']});
    const ref = git(['rev-parse', `${sourceRef}^{commit}`]).trim();
    const key = JSON.stringify([root, group, ref, hash(baseline.source)]);
    if (cache.has(key)) return cache.get(key);
    const data = baseline.data;
    try {git(['merge-base', '--is-ancestor', data.sourceCommit, ref]);}
    catch {throw new Error('Release Notes baseline must be an ancestor of the audited source commit');}
    const census = git(['ls-tree', '-r', '--name-only', data.sourceCommit, '--', group.sourceRoot])
        .split('\n').filter(file => /\.mdx?$/.test(file)).sort();
    assert.deepEqual([...data.sourceFiles].sort(), census, 'Release Notes baseline omits historical source files');
    const historicalCensus = [...new Set(git(['log', '--format=', '--name-only', data.sourceCommit, '--', group.sourceRoot])
        .split('\n').filter(file => file.startsWith(group.sourceRoot + '/') && /\.mdx?$/.test(file)))].sort();
    assert.deepEqual([...data.historicalPaths].sort(), historicalCensus, 'Release Notes baseline omits historical path identities');
    for (const doc of data.documents) assert.equal(hash(git(['show', `${data.sourceCommit}:${doc.sourcePath}`])),
        doc.sourceHash, `Historical release-note hash mismatch: ${doc.sourcePath}`);
    const historical = new Set(data.historicalPaths), ids = new Set(data.documents.map(doc => doc.docId));
    const hashes = new Set(data.documents.map(doc => doc.sourceHash));
    const origins = new Map([...historical].map(file => [file, {kind: 'historical', origin: file}]));
    const inGroup = file => file?.startsWith(group.sourceRoot + '/') && /\.mdx?$/.test(file);
    // First-parent diffs describe the actual committed tree at each mainline
    // step. Branch commits must not be replayed a second time at their merge.
    const history = git(['log', '--first-parent', '--diff-merges=first-parent', '--reverse',
        '--format=%x1e%H', '--name-status', '-z', '-M', '-C100%', '--find-copies-harder', `${data.sourceCommit}..${ref}`]);
    for (const chunk of history.split('\x1e').filter(Boolean)) {
        const tokens = chunk.split('\0'), commit = tokens.shift().trim();
        assert(/^[a-f0-9]{40}$/.test(commit), 'Invalid release-note Git history');
        const events = [];
        for (let index = 0; index < tokens.length;) {
            const status = tokens[index++].trim();
            if (!status) continue;
            assert(/^[ACDMRTUXB][0-9]*$/.test(status), 'Invalid release-note Git change');
            const from = tokens[index++];
            const to = /^[RC]/.test(status) ? tokens[index++] : from;
            events.push({status, from, to});
        }
        const ambiguous = events.some(event => event.status === 'D' && inGroup(event.from)
            && origins.get(event.from)?.kind !== 'new');
        for (const event of events) {
            const prior = origins.get(event.from);
            if (event.status[0] === 'R' || event.status[0] === 'C') {
                if (prior || inGroup(event.to)) origins.set(event.to, prior ?? {kind: 'review', origin: event.from, commit});
            } else if (event.status === 'A' && inGroup(event.to) && !origins.has(event.to)) {
                origins.set(event.to, {kind: ambiguous ? 'review' : 'new', origin: event.to, commit});
            }
            // Retain deleted path identities, so deleting and later adding a
            // historical note never turns it into a newly eligible document.
        }
    }
    function classify(page) {
        const file = page.englishPath ?? page.sourcePath;
        const origin = origins.get(file);
        let kind, reason;
        if (ids.has(page.docId) || historical.has(file) || origin?.kind === 'historical') {
            kind = 'historical_excluded'; reason = 'Registered or present before the fixed release-note cutoff, including moves and re-registrations.';
        } else if (origin?.kind !== 'new' || hashes.has(page.sourceHash)) {
            kind = 'policy_review'; reason = 'Cannot establish a genuinely new release note after the cutoff; reconcile its source identity manually.';
        } else {
            kind = 'eligible'; reason = 'A new source identity committed after the fixed release-note cutoff.';
        }
        return {kind, reason, baselineCommit: data.sourceCommit, originPath: origin?.origin ?? file,
            introducedCommit: origin?.commit ?? null};
    }
    const result = {classify, baselinePath: baseline.file, baselineCommit: data.sourceCommit,
        baselineHash: hash(baseline.source), sourceCommit: ref};
    cache.set(key, result);
    return result;
}

function policiesFor(root, scope, ref = 'HEAD') {
    return new Map(scope.groups.filter(group => group.sourcePolicy)
        .map(group => [group.id, releasePolicy(root, group, ref)]));
}

module.exports = {docKey, validatePolicy, loadBaseline, releasePolicy, policiesFor};
