// Exercise T08 against a local bare Git remote, a schema-shaped Codex mock,
// and a GitHub CLI mock. Nothing is sent to GitHub or to a model service.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const {loadRecords} = require('./state.cjs');

const sourceRoot = path.resolve(__dirname, '../..');
const sourcePath = process.env.I18N_SIM_SOURCE_PATH
    || 'docs/admin-manual/system-tables/information_schema/engines.md';
assert(sourcePath.startsWith('docs/') && /\.mdx?$/.test(sourcePath)
    && !sourcePath.split('/').includes('..'), 'Simulation source must be a Dev document');
const targetPath = `i18n/ja/docusaurus-plugin-content-docs/current/${sourcePath.slice(5)}`;
const runId = '123456';

function command(binary, args, options = {}) {
    return execFileSync(binary, args, {encoding: 'utf8', ...options}).trim();
}

function writeExecutable(file, contents) {
    fs.writeFileSync(file, contents, {mode: 0o755});
}

function codexMock(invalid) {
    return `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const answer = args[args.indexOf('--output-last-message') + 1];
const prompt = fs.readFileSync(0, 'utf8');
const marker = 'Translation input:\\n';
const payload = JSON.parse(prompt.slice(prompt.indexOf(marker) + marker.length));
const translations = payload.units.map((unit, index) => ({id: unit.id,
    text: ${invalid ? 'index === 0 ? \'\' : \'訳\' + unit.text' : "'訳' + unit.text"}}));
fs.writeFileSync(answer, JSON.stringify({translations}));
process.stdout.write(JSON.stringify({type: 'turn.completed', usage: {total_tokens: 100000}}) + '\\n');
`;
}

const ghMock = `#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args[0] === 'api' && args.some(arg => arg.startsWith('repos/apache/doris-website/pulls?'))) {
    process.stdout.write('[[]]\\n');
} else if (args[0] === 'api' && args[1] === 'user') {
    process.stdout.write(JSON.stringify({login: 'local-simulator', id: 12345}) + '\\n');
} else if (args[0] === 'auth' && args[1] === 'setup-git') {
    process.exit(0);
} else if (args[0] === 'pr' && args[1] === 'create') {
    const value = flag => args[args.indexOf(flag) + 1];
    assert(args.includes('--draft'));
    assert.equal(value('--base'), 'master');
    assert.equal(value('--repo'), 'apache/doris-website');
    assert.equal(value('--label'), 'translate-ja');
    const body = fs.readFileSync(value('--body-file'), 'utf8');
    assert.match(body, /japanese-translation-automation:v1 bot-head=[a-f0-9]{40}/);
    const record = {draft: true, base: value('--base'), head: value('--head'), labels: [value('--label')], body,
        url: 'https://example.invalid/apache/doris-website/pull/1'};
    fs.writeFileSync(process.env.I18N_SIM_PR_RECORD, JSON.stringify(record, null, 2) + '\\n');
    process.stdout.write(record.url + '\\n');
} else {
    process.stderr.write('Unexpected simulated gh command: ' + args.join(' ') + '\\n');
    process.exit(1);
}
`;

function runNode(root, script, args, env, logDir, expectedStatus = 0) {
    const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
        cwd: root, env, encoding: 'utf8', timeout: 300000, maxBuffer: 16 * 1024 * 1024,
    });
    const name = path.basename(script, '.cjs') + (env.I18N_SIM_PHASE || '');
    fs.writeFileSync(path.join(logDir, `${name}.log`), `${result.stdout || ''}${result.stderr || ''}`);
    assert(!result.error, `${name}: ${result.error?.message}`);
    assert.equal(result.status, expectedStatus, `${name} returned ${result.status}: ${result.stderr}`);
    return result;
}

function main() {
    const output = process.argv[2] ? path.resolve(process.argv[2])
        : fs.mkdtempSync(path.join(os.tmpdir(), 'doris-ja-workflow-sim-'));
    assert(process.argv.length <= 3, 'Usage: node scripts/i18n/simulate-workflow.cjs [empty-output-dir]');
    if (fs.existsSync(output)) assert.equal(fs.readdirSync(output).length, 0, 'Output directory must be empty');
    fs.mkdirSync(output, {recursive: true});
    assert.equal(command('git', ['status', '--porcelain', '--untracked-files=no'], {cwd: sourceRoot}), '',
        'Commit tracked workflow changes before simulating');
    const remote = path.join(output, 'remote.git');
    const repo = path.join(output, 'repo');
    const bin = path.join(output, 'bin');
    const scan = path.join(output, 'scan');
    const logs = path.join(output, 'logs');
    const auth = path.join(output, 'codex-home');
    for (const dir of [bin, scan, logs, auth]) fs.mkdirSync(dir, {recursive: true});
    command('git', ['init', '--bare', '-q', remote]);
    command('git', ['push', remote, 'HEAD:refs/heads/master'], {cwd: sourceRoot});
    command('git', ['symbolic-ref', 'HEAD', 'refs/heads/master'], {cwd: remote});
    command('git', ['clone', '-q', remote, repo]);
    command('git', ['config', '--local', 'user.name', 'Local Simulator'], {cwd: repo});
    command('git', ['config', '--local', 'user.email', 'local@example.invalid'], {cwd: repo});
    command('git', ['config', '--local', `url.file://${remote}.insteadOf`,
        'https://github.com/apache/doris-website.git'], {cwd: repo});
    fs.symlinkSync(fs.realpathSync(path.join(sourceRoot, 'node_modules')), path.join(repo, 'node_modules'), 'dir');
    fs.writeFileSync(path.join(auth, 'auth.json'), '{}\n');
    writeExecutable(path.join(bin, 'gh'), ghMock);
    writeExecutable(path.join(bin, 'codex-valid'), codexMock(false));
    writeExecutable(path.join(bin, 'codex-invalid'), codexMock(true));
    const env = {...process.env, PATH: `${bin}:${process.env.PATH}`, GH_TOKEN: 'local-simulation',
        GITHUB_REPOSITORY: 'apache/doris-website', GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_RUN_ID: runId, I18N_PR_AUTH_KIND: 'pat', I18N_MODE: 'validate',
        I18N_VALIDATION_RUN: 'true', I18N_PATH: sourcePath, I18N_MAX_PAGES: '1',
        I18N_LIMIT: '20', DORIS_ENABLE_JA: 'true', CODEX_HOME: auth,
        I18N_SIM_PR_RECORD: path.join(output, 'draft-pr.json')};
    runNode(repo, 'scripts/i18n/workflow-prs.cjs', [scan], env, logs);
    runNode(repo, 'scripts/i18n/workflow-scan.cjs', [scan], env, logs);
    const plan = JSON.parse(fs.readFileSync(path.join(scan, 'plan.json'), 'utf8'));
    assert.equal(plan.selected.length, 1);
    assert.equal(plan.tasks.find(task => task.id === plan.selected[0]).sourcePath, sourcePath);
    const failed = {...env, CODEX_BIN: path.join(bin, 'codex-invalid'), I18N_SIM_PHASE: '-invalid'};
    runNode(repo, 'scripts/i18n/workflow-generate.cjs', [scan], failed, logs, 1);
    const failure = JSON.parse(fs.readFileSync(path.join(scan, 'generation.json'), 'utf8'));
    assert.equal(failure.candidates.length, 0);
    assert.equal(failure.failures[0].error, 'Invalid model translation unit');
    assert.equal(failure.liveCall, true);
    assert.equal(failure.usedTokens, 100000);
    const valid = {...env, CODEX_BIN: path.join(bin, 'codex-valid'), I18N_SIM_PHASE: '-valid'};
    runNode(repo, 'scripts/i18n/workflow-generate.cjs', [scan], valid, logs);
    const generation = JSON.parse(fs.readFileSync(path.join(scan, 'generation.json'), 'utf8'));
    assert.equal(generation.candidates.length, 1);
    assert.equal(generation.failures.length, 0);
    assert.equal(generation.usedTokens, 100000);
    runNode(repo, 'scripts/i18n/workflow-publish.cjs', [scan], env, logs);
    const pr = JSON.parse(fs.readFileSync(env.I18N_SIM_PR_RECORD, 'utf8'));
    assert.equal(pr.head, `i18n/ja-automated-${runId}`);
    const branch = command('git', ['rev-parse', `refs/heads/${pr.head}`], {cwd: remote});
    const target = command('git', ['show', `${branch}:${targetPath}`], {cwd: remote});
    assert.match(target, /[\u3040-\u30ff\u3400-\u9fff]/);
    const state = [...loadRecords(repo, 'ja').values()];
    const candidate = generation.candidates[0];
    assert(state.some(page => page.sourcePath === sourcePath && page.reviewStatus === 'machine'
        && page.sourceHash === candidate.sourceHash && page.targetHash === candidate.targetHash));
    const expectedFiles = [targetPath, candidate.statePath].sort();
    const committedFiles = command('git', ['diff', '--name-only', plan.sourceCommit, branch], {cwd: repo}).split('\n').sort();
    assert.deepEqual(committedFiles, expectedFiles);
    const report = {kind: 'local simulation; no external model or GitHub writes', output,
        sourceCommit: plan.sourceCommit, selected: plan.selected, sourcePath,
        invalidModel: {exitCode: 1, error: failure.failures[0].error, usedTokens: failure.usedTokens},
        generation: {candidates: generation.candidates.length, usedTokens: generation.usedTokens},
        draftPr: {url: pr.url, branch: pr.head, commit: branch, files: committedFiles, labels: pr.labels}};
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

try {main();} catch (error) {console.error(error); process.exitCode = 1;}
