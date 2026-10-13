// Run only with a dedicated GitHub App installation token on trusted master.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {managedPath} = require('./translation-engine.cjs');
const {botBranch} = require('./workflow-prs.cjs');

const root = path.resolve(__dirname, '../..');
const statePath = 'translations/state/ja/docs.json';
const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();

function expectedFiles(manifest, scope) {
    assert(manifest.schemaVersion === 1 && manifest.provider === 'openai'
        && manifest.candidates.length > 0 && manifest.candidates.length <= scope.maxBatchPages,
    'Invalid live candidate manifest');
    const files = manifest.candidates.map(candidate => {
        managedPath(scope, {...candidate, locale: 'ja'});
        return candidate.targetPath;
    });
    assert.equal(new Set(files).size, files.length, 'Duplicate target path');
    return [statePath, ...files].sort();
}

function checkStaged(manifest, scope) {
    const expected = expectedFiles(manifest, scope);
    git('add', '--', ...expected);
    const staged = git('diff', '--cached', '--name-only', '-z').split('\0').filter(Boolean).sort();
    assert.deepEqual(staged, expected, 'Staged files differ from managed Japanese targets/state');
    assert.equal(git('diff', '--name-only'), '', 'Unstaged tracked changes remain');
    git('diff', '--cached', '--check');
    return expected;
}

function main() {
    const output = process.argv[2];
    assert(output && process.argv.length === 3, 'Usage: workflow-publish.cjs <scan-directory>');
    assert(process.env.GH_TOKEN && process.env.GITHUB_RUN_ID, 'GitHub App token and run ID required');
    const manifest = JSON.parse(fs.readFileSync(path.join(output, 'generation.json'), 'utf8'));
    const scope = JSON.parse(fs.readFileSync(path.join(root, 'translations/scope/ja.json'), 'utf8'));
    assert.equal(git('rev-parse', 'HEAD'), manifest.sourceCommit, 'Source checkout changed before publishing');
    const expected = checkStaged(manifest, scope);
    const branch = `${botBranch}${process.env.GITHUB_RUN_ID}`;
    assert(/^i18n\/ja-automated-[0-9]+$/.test(branch), 'Unsafe run ID');
    git('config', 'user.name', 'doris-japanese-translation[bot]');
    git('config', 'user.email', 'doris-japanese-translation[bot]@users.noreply.github.com');
    git('switch', '-c', branch);
    git('commit', '-m', 'docs(i18n): add machine Japanese translation candidates');
    const newHead = git('rev-parse', 'HEAD');
    const bodyFile = path.join(output, 'pr-body.md');
    const body = fs.readFileSync(bodyFile, 'utf8');
    assert(body.includes('bot-head=PENDING'), 'Missing PR ownership marker');
    fs.writeFileSync(bodyFile, body.replace('bot-head=PENDING', `bot-head=${newHead}`)
        + '\nLocal Japanese translation gate: passed.\n');
    execFileSync(process.execPath, [path.join(__dirname, 'check-translations.cjs'), '--base', manifest.sourceCommit],
        {cwd: root, stdio: 'inherit'});
    const remoteMaster = git('ls-remote', 'origin', 'refs/heads/master').split(/\s+/)[0];
    assert.equal(remoteMaster, manifest.sourceCommit, 'master advanced before publish; rescan required');
    // gh configures Git's credential helper from GH_TOKEN. The token is never
    // placed in a remote URL, command argument, log or generated file.
    execFileSync('gh', ['auth', 'setup-git'], {cwd: root, stdio: 'inherit'});
    if (manifest.replacesPr) {
        const old = JSON.parse(execFileSync('gh', ['pr', 'view', String(manifest.replacesPr.number),
            '--repo', 'apache/doris-website', '--json', 'headRefOid,state'], {cwd: root, encoding: 'utf8'}));
        assert(old.state === 'OPEN' && old.headRefOid === manifest.replacesPr.headSha,
            'Previous robot PR was edited or closed; preserve it and rescan');
        execFileSync('gh', ['pr', 'close', String(manifest.replacesPr.number),
            '--repo', 'apache/doris-website'], {cwd: root, stdio: 'inherit'});
    }
    git('push', 'origin', `HEAD:refs/heads/${branch}`);
    const url = execFileSync('gh', ['pr', 'create', '--repo', 'apache/doris-website', '--base', 'master',
        '--head', branch, '--draft', '--title', 'docs(i18n): machine Japanese translation candidates',
        '--body-file', bodyFile], {cwd: root, encoding: 'utf8'}).trim();
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        `\nOpened draft translation PR: ${url}; ${expected.length - 1} candidate pages.\n`);
    process.stdout.write(`${url}\n`);
}

if (require.main === module) {
    try {main();} catch (error) {console.error(error.message); process.exitCode = 1;}
}
module.exports = {expectedFiles, checkStaged};
