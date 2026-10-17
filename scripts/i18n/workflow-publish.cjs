// Run only with a dedicated GitHub App token or a maintainer PAT on trusted master.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {languageName, pipelineLocale, stateFileFor} = require('./state.cjs');
const {managedPath} = require('./translation-engine.cjs');
const {statePathFor} = require('./workflow-prs.cjs');
const {botBranchFor, botBranchPattern} = require('./automation-naming.cjs');

const root = path.resolve(__dirname, '../..');
const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();

function expectedFiles(manifest, scope) {
    assert(manifest.schemaVersion === 1 && manifest.provider === 'codex'
        && manifest.candidates.length > 0 && manifest.candidates.length <= scope.maxBatchPages,
    'Invalid live candidate manifest');
    const files = manifest.candidates.flatMap(candidate => {
        managedPath(scope, {...candidate, locale: scope.locale});
        // Older manifests use the shared ledger; new ones name one exact shard.
        const statePath = candidate.statePath ?? statePathFor(scope.locale);
        assert(statePath === statePathFor(scope.locale)
            || statePath === stateFileFor({...candidate, locale: scope.locale}), 'Invalid candidate state path');
        return [candidate.targetPath, statePath];
    });
    assert.equal(new Set(manifest.candidates.map(item => item.targetPath)).size, manifest.candidates.length, 'Duplicate target path');
    return [...new Set(files)].sort();
}

function checkStaged(manifest, scope) {
    const expected = expectedFiles(manifest, scope);
    git('add', '--', ...expected);
    const staged = git('diff', '--cached', '--name-only', '-z').split('\0').filter(Boolean).sort();
    assert.deepEqual(staged, expected, 'Staged files differ from the managed targets/state');
    assert.equal(git('diff', '--name-only'), '', 'Unstaged tracked changes remain');
    git('diff', '--cached', '--check');
    return expected;
}

function authorFor(kind, user = {}, language) {
    if (kind === 'app') {
        const name = `doris-${language.toLowerCase()}-translation[bot]`;
        return {name, email: `${name}@users.noreply.github.com`};
    }
    assert(kind === 'pat' && /^[A-Za-z0-9-]+$/.test(user.login ?? '')
        && Number.isInteger(user.id) && user.id > 0, 'Invalid personal token owner');
    return {name: user.login, email: `${user.id}+${user.login}@users.noreply.github.com`};
}

async function main() {
    const output = process.argv[2];
    assert(output && process.argv.length === 3, 'Usage: workflow-publish.cjs <scan-directory>');
    assert(process.env.GH_TOKEN && process.env.GITHUB_RUN_ID, 'GitHub write token and run ID required');
    const kind = process.env.I18N_PR_AUTH_KIND;
    assert(kind === 'app' || kind === 'pat', 'Unsupported GitHub write identity');
    const manifest = JSON.parse(fs.readFileSync(path.join(output, 'generation.json'), 'utf8'));
    assert(!manifest.replacesPr, 'Preserve existing translation PRs; rescan with the current generator');
    const locale = pipelineLocale(root);
    const language = languageName(root, locale);
    const scope = JSON.parse(fs.readFileSync(path.join(root, `translations/scope/${locale}.json`), 'utf8'));
    assert.equal(git('rev-parse', 'HEAD'), manifest.sourceCommit, 'Source checkout changed before publishing');
    checkStaged(manifest, scope);
    const branch = `${botBranchFor(locale)}${process.env.GITHUB_RUN_ID}`;
    assert(botBranchPattern(locale).test(branch), 'Unsafe run ID');
    const user = kind === 'pat' ? JSON.parse(execFileSync('gh', ['api', 'user', '--jq', '{login,id}'],
        {cwd: root, encoding: 'utf8'})) : null;
    const author = authorFor(kind, user, language);
    git('config', 'user.name', author.name);
    git('config', 'user.email', author.email);
    git('switch', '-c', branch);
    git('commit', '-m', `docs(i18n): add machine ${language} translation candidates`);
    const newHead = git('rev-parse', 'HEAD');
    const bodyFile = path.join(output, 'pr-body.md');
    const body = fs.readFileSync(bodyFile, 'utf8');
    assert(body.includes('bot-head=PENDING'), 'Missing PR ownership marker');
    await require('./pr-preflight.cjs').preflight({root, base: manifest.sourceCommit});
    fs.writeFileSync(bodyFile, body.replace('bot-head=PENDING', `bot-head=${newHead}`)
        + `\nShared PR admission checks: passed (translation state, syntax, internal links).\n`);
    const remoteMaster = git('ls-remote', 'origin', 'refs/heads/master').split(/\s+/)[0];
    assert.equal(remoteMaster, manifest.sourceCommit, 'master advanced before publish; rescan required');
    // gh configures Git's credential helper from GH_TOKEN. The token is never
    // placed in a remote URL, command argument, log or generated file.
    execFileSync('gh', ['auth', 'setup-git'], {cwd: root, stdio: 'inherit'});
    git('push', 'origin', `HEAD:refs/heads/${branch}`);
    const url = execFileSync('gh', ['pr', 'create', '--repo', 'apache/doris-website', '--base', 'master',
        '--head', branch, '--label', `translate-${locale}`,
        '--title', `docs(i18n): machine ${language} translation candidates`,
        '--body-file', bodyFile], {cwd: root, encoding: 'utf8'}).trim();
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `\nOpened translation PR for review: ${url}; ${manifest.candidates.length} candidate pages.\n`);
    process.stdout.write(`${url}\n`);
}

if (require.main === module) {
    main().catch(error => {console.error(error.message); process.exitCode = 1;});
}
module.exports = {expectedFiles, checkStaged, authorFor};
