// Exercise T08 against a local bare Git remote, a schema-shaped Codex mock,
// and a GitHub CLI mock. Nothing is sent to GitHub or to a model service.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const {loadRecords, stateFileFor} = require('./state.cjs');

const sourceRoot = path.resolve(__dirname, '../..');
const sourcePath = process.env.I18N_SIM_SOURCE_PATH
    || 'docs/admin-manual/system-tables/information_schema/engines.md';
assert(sourcePath.startsWith('docs/') && /\.mdx?$/.test(sourcePath)
    && !sourcePath.split('/').includes('..'), 'Simulation source must be a Dev document');
const targetPath = `i18n/ja/docusaurus-plugin-content-docs/current/${sourcePath.slice(5)}`;
const runId = '123456';
const pages = Number(process.env.I18N_SIM_PAGES || '1');
const scenario = process.env.I18N_SIM_SCENARIO || 'retry';
assert([1, 10].includes(pages), 'Simulation supports one or ten pages');
assert(['success', 'retry', 'fallback'].includes(scenario), 'Unknown simulation scenario');

function command(binary, args, options = {}) {
    return execFileSync(binary, args, {encoding: 'utf8', ...options}).trim();
}

function writeExecutable(file, contents) {
    fs.writeFileSync(file, contents, {mode: 0o755});
}

function codexMock(mode, repo) {
    return `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const answer = args[args.indexOf('--output-last-message') + 1];
const prompt = fs.readFileSync(0, 'utf8');
const marker = 'Translation input:\\n';
const payload = JSON.parse(prompt.slice(prompt.indexOf(marker) + marker.length));
const {extractUnits} = require(${JSON.stringify(path.join(repo, 'scripts/i18n/translation-engine.cjs'))});
(async () => {
    let translation = payload.document;
    const units = await extractUnits(translation, ${JSON.stringify(path.extname(sourcePath))});
    for (const unit of [...units].reverse()) translation = translation.slice(0, unit.start)
        + '訳' + unit.text + translation.slice(unit.end);
    if (${JSON.stringify(mode)} === 'invalid') translation = '';
    if (${JSON.stringify(mode)} === 'retry' && payload.feedback.length === 0)
        translation = translation.replace(/^#{1,6} .*$/gm, '');
    if (${JSON.stringify(mode)} === 'fallback') translation += '\\n' + '\x60\x60\x60sql\\nSELECT 42;\\n\x60\x60\x60\\n';
    fs.writeFileSync(answer, JSON.stringify({translation}));
    process.stdout.write(JSON.stringify({type: 'turn.completed', usage: {total_tokens: 100000}}) + '\\n');
})().catch(error => {console.error(error.message);process.exitCode = 1;});
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
    assert(!args.includes('--draft'));
    assert.equal(value('--base'), 'master');
    assert.equal(value('--repo'), 'apache/doris-website');
    assert.equal(value('--label'), 'translate-ja');
    const body = fs.readFileSync(value('--body-file'), 'utf8');
    assert.match(body, /japanese-translation-automation:v1 bot-head=[a-f0-9]{40}/);
    const record = {draft: false, base: value('--base'), head: value('--head'), labels: [value('--label')], body,
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
        cwd: root, env, encoding: 'utf8', timeout: 1200000, maxBuffer: 16 * 1024 * 1024,
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
    const remote = path.join(output, 'remote.git');
    const repo = path.join(output, 'repo');
    const bin = path.join(output, 'bin');
    const scan = path.join(output, 'scan');
    const logs = path.join(output, 'logs');
    const auth = path.join(output, 'codex-home');
    for (const dir of [bin, scan, logs, auth]) fs.mkdirSync(dir, {recursive: true});
    command('git', ['clone', '--bare', '--shared', '-q', sourceRoot, remote]);
    command('git', ['update-ref', 'refs/heads/master', command('git', ['rev-parse', 'HEAD'], {cwd: sourceRoot})], {cwd: remote});
    command('git', ['symbolic-ref', 'HEAD', 'refs/heads/master'], {cwd: remote});
    command('git', ['clone', '--shared', '-q', remote, repo]);
    command('git', ['config', '--local', 'user.name', 'Local Simulator'], {cwd: repo});
    command('git', ['config', '--local', 'user.email', 'local@example.invalid'], {cwd: repo});
    command('git', ['config', '--local', `url.file://${remote}.insteadOf`,
        'https://github.com/apache/doris-website.git'], {cwd: repo});
    fs.symlinkSync(fs.realpathSync(path.join(sourceRoot, 'node_modules')), path.join(repo, 'node_modules'), 'dir');
    // Include uncommitted implementation changes only in the disposable clone.
    for (const file of ['scripts/i18n', 'scripts/check_md_links_single.py', '.github/workflows'])
        fs.cpSync(path.join(sourceRoot, file), path.join(repo, file), {recursive: true});
    let selectedPath = sourcePath;
    if (pages === 10) {
        selectedPath = 'docs/translation-simulation/';
        fs.mkdirSync(path.join(repo, selectedPath), {recursive: true});
        for (let index = 0; index < pages; index++) fs.writeFileSync(path.join(repo, selectedPath, `page-${index}.md`),
            `# Guide ${index}\n\nDoris guide.\n\n\x60\x60\x60sql\nSELECT ${index};\n\x60\x60\x60\n`);
    } else {
        // Force the selected real page into the pending queue in this clone.
        const record = [...loadRecords(repo, 'ja').values()].find(page => page.targetPath === targetPath);
        const stateFile = path.join(repo, 'translations/state/ja/docs.json');
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        state.pages = state.pages.filter(page => page.targetPath !== targetPath);
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
        if (record) fs.rmSync(path.join(repo, stateFileFor(record)), {force: true});
        fs.rmSync(path.join(repo, targetPath), {force: true});
    }
    command('git', ['add', '.'], {cwd: repo});
    command('git', ['commit', '-qm', 'Local simulation implementation and source fixture'], {cwd: repo});
    command('git', ['push', '-q', 'origin', 'HEAD:master'], {cwd: repo});
    fs.writeFileSync(path.join(auth, 'auth.json'), '{}\n');
    writeExecutable(path.join(bin, 'gh'), ghMock);
    writeExecutable(path.join(bin, 'codex-valid'), codexMock(scenario, repo));
    writeExecutable(path.join(bin, 'codex-invalid'), codexMock('invalid', repo));
    const env = {...process.env, PATH: `${bin}:${process.env.PATH}`, GH_TOKEN: 'local-simulation',
        GITHUB_REPOSITORY: 'apache/doris-website', GITHUB_EVENT_NAME: 'workflow_dispatch',
        GITHUB_RUN_ID: runId, I18N_PR_AUTH_KIND: 'pat', I18N_MODE: pages === 1 ? 'validate' : 'generate',
        I18N_PATH: selectedPath, I18N_MAX_PAGES: String(pages),
        I18N_LIMIT: '20', DORIS_ENABLE_JA: 'true', CODEX_HOME: auth,
        I18N_SIM_PR_RECORD: path.join(output, 'pull-request.json')};
    runNode(repo, 'scripts/i18n/workflow-prs.cjs', [scan], env, logs);
    runNode(repo, 'scripts/i18n/workflow-scan.cjs', [scan], env, logs);
    const plan = JSON.parse(fs.readFileSync(path.join(scan, 'plan.json'), 'utf8'));
    assert.equal(plan.selected.length, pages);
    const failed = {...env, CODEX_BIN: path.join(bin, 'codex-invalid'), I18N_SIM_PHASE: '-invalid'};
    runNode(repo, 'scripts/i18n/workflow-generate.cjs', [scan], failed, logs, pages === 1 ? 1 : 0);
    const failure = JSON.parse(fs.readFileSync(path.join(scan, 'generation.json'), 'utf8'));
    assert.equal(failure.candidates.length, 0);
    assert.match(failure.failures[0].error, /No usable document after three attempts/);
    assert.equal(failure.liveCall, true);
    assert.equal(failure.usedTokens, pages * 300000);
    const valid = {...env, CODEX_BIN: path.join(bin, 'codex-valid'), I18N_SIM_PHASE: '-valid'};
    runNode(repo, 'scripts/i18n/workflow-generate.cjs', [scan], valid, logs);
    const generation = JSON.parse(fs.readFileSync(path.join(scan, 'generation.json'), 'utf8'));
    assert.equal(generation.candidates.length, pages);
    assert.equal(generation.failures.length, 0);
    const requests = generation.candidates.reduce((sum, candidate) => sum + candidate.requests, 0);
    assert(Number.isInteger(requests) && requests > 0);
    assert.equal(generation.usedTokens, requests * 100000);
    const attempts = {success: 1, retry: 2, fallback: 3}[scenario];
    assert.equal(requests, pages * attempts);
    assert(generation.candidates.every(candidate => candidate.generation.attempts === attempts
        && candidate.generation.acceptedWithWarnings === (scenario === 'fallback')));
    runNode(repo, 'scripts/i18n/workflow-publish.cjs', [scan], env, logs);
    const pr = JSON.parse(fs.readFileSync(env.I18N_SIM_PR_RECORD, 'utf8'));
    assert.match(pr.body, /Shared PR admission checks: passed/);
    assert.equal(pr.head, `i18n/ja-automated-${runId}`);
    const branch = command('git', ['rev-parse', `refs/heads/${pr.head}`], {cwd: remote});
    const candidate = generation.candidates[0];
    const target = command('git', ['show', `${branch}:${candidate.targetPath}`], {cwd: remote});
    assert.match(target, /[\u3040-\u30ff\u3400-\u9fff]/);
    const state = [...loadRecords(repo, 'ja').values()];
    assert(state.some(page => page.sourcePath === candidate.sourcePath && page.reviewStatus === 'machine'
        && page.sourceHash === candidate.sourceHash && page.targetHash === candidate.targetHash));
    const expectedFiles = [...new Set(generation.candidates.flatMap(item => [item.targetPath, item.statePath]))].sort();
    const committedFiles = command('git', ['diff', '--name-only', plan.sourceCommit, branch], {cwd: repo}).split('\n').sort();
    assert.deepEqual(committedFiles, expectedFiles);
    const report = {kind: 'local simulation; no external model or GitHub writes', output,
        sourceCommit: plan.sourceCommit, selected: plan.selected, sourcePath: selectedPath, scenario,
        invalidModel: {exitCode: pages === 1 ? 1 : 0, error: failure.failures[0].error, usedTokens: failure.usedTokens},
        generation: {candidates: generation.candidates.length, failures: generation.failures.length,
            requests, attemptsPerDocument: attempts, retainedWithWarnings: scenario === 'fallback' ? pages : 0,
            usedTokens: generation.usedTokens},
        documents: generation.candidates.map(item => ({sourcePath: item.sourcePath,
            sourceChars: fs.readFileSync(path.join(repo, item.sourcePath), 'utf8').length,
            attempts: item.generation.attempts, warnings: item.generation.warnings.length})),
        admission: {status: 'passed', checks: ['translation state', 'syntax', 'internal links']},
        pullRequest: {url: pr.url, draft: pr.draft, branch: pr.head, commit: branch, files: committedFiles, labels: pr.labels}};
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}

try {main();} catch (error) {console.error(error); process.exitCode = 1;}
