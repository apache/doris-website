// Whether master moved since a batch's source commit, and whether the move
// touches anything the batch depends on. Runner queues and model calls take
// long enough that unrelated merges are common, so only these decide:
// a changed batch page drops that page, while a change to translation
// configuration, routing identity or the pipeline itself invalidates every
// candidate and discards the batch.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {stateFileFor} = require('./state.cjs');

function repositoryUrl(repository = process.env.GITHUB_REPOSITORY || 'apache/doris-website') {
    assert.equal(repository, 'apache/doris-website', 'Unexpected repository');
    return `https://github.com/${repository}.git`;
}

function batchWide(locale) {
    const files = new Set(['translations/config.json', 'translations/release-notes-baseline.json', 'translations/blog-baseline.json', 'config/i18n.js', 'docusaurus.config.js', 'versions.json',
        'src/constant/version.ts', 'config/versions-plugin.js',
        'sidebars.ts', 'sidebarsCommunity.json', 'sidebarsCourse.ts', 'sidebarsReleases.json',
        `translations/scope/${locale}.json`, `translations/glossary/${locale}.json`,
        `translations/protection-exceptions/${locale}.json`]);
    // Top-level state files: the legacy ledger, resolved deletions and the shard schema.
    const state = new RegExp(`^translations/state/${locale}/[^/]+$`);
    return file => files.has(file) || state.test(file) || file.startsWith('versioned_sidebars/') || file.startsWith('scripts/i18n/')
        || file.startsWith(`translations/inventory/${locale}/`);
}

// Every file one page of a batch reads or writes.
function pageFiles(task, locale) {
    return [task.sourcePath, task.targetPath, task.targetPath.replace(`i18n/${locale}/`,'i18n/zh-CN/'),stateFileFor({...task, locale})];
}

// `pages` maps a task or candidate ID to its page files.
function masterDrift({root, sourceCommit, locale, pages = new Map(), remote = repositoryUrl()}) {
    const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024}).trim();
    const head = git('ls-remote', remote, 'refs/heads/master').split(/\s+/)[0];
    assert(/^[a-f0-9]{40}$/.test(head), 'Cannot read the remote master');
    if (head === sourceCommit) return {head, moved: false, files: [], batchWide: [], affected: []};
    git('fetch', '--no-tags', '--quiet', remote, 'refs/heads/master');
    const fetched = git('rev-parse', 'FETCH_HEAD');
    try {git('merge-base', '--is-ancestor', sourceCommit, fetched);}
    catch {throw new Error('master no longer contains the source commit; discard this batch and rescan');}
    // Without rename detection a moved file reports both its old and new path.
    const files = git('diff', '--name-only', '--no-renames', '-z', sourceCommit, fetched).split('\0').filter(Boolean);
    const changed = new Set(files);
    return {head: fetched, moved: true, files, batchWide: files.filter(batchWide(locale)),
        affected: [...pages].filter(([, paths]) => paths.some(file => changed.has(file))).map(([id]) => id)};
}

// Generation and publication stop on batch-wide changes and report the rest.
function checkMaster(options) {
    const drift = masterDrift(options);
    assert(!drift.batchWide.length, `master changed ${drift.batchWide.slice(0, 3).join(', ')}`
        + (drift.batchWide.length > 3 ? ' and more' : '') + ' after the source commit; discard this batch and rescan');
    return drift;
}

module.exports = {repositoryUrl, batchWide, pageFiles, masterDrift, checkMaster};
