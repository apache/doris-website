// Load and reconcile the same numbered Codex auth pool used by the Doris
// code-review runner. Secrets stay in RUNNER_TEMP and never enter artifacts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash, randomInt} = require('node:crypto');
const {execFileSync} = require('node:child_process');

const endpoint = 'oss-cn-hongkong.aliyuncs.com';
const prefix = 'oss://doris-community-ci/codex/auth.json.';
const candidatePattern = /^oss:\/\/doris-community-ci\/codex\/auth\.json\.[0-9]+$/;
const sha256 = value => createHash('sha256').update(value).digest('hex');

function oss(args) {
    assert(process.env.OSS_AK && process.env.OSS_SK, 'OSS credentials are required');
    try {return execFileSync('ossutil', ['-i', process.env.OSS_AK, '-k', process.env.OSS_SK,
        '-e', endpoint, ...args], {encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore']});}
    catch {throw new Error('OSS operation failed; inspect object access and retry the workflow');}
}

function listed(object) {
    return oss(['ls', object, '-s']).split('\n').some(line => line.trim() === object);
}

function validAuth(raw) {
    const data = JSON.parse(raw);
    assert(data.auth_mode === 'chatgpt' && typeof data.tokens?.access_token === 'string'
        && data.tokens.access_token && typeof data.tokens?.refresh_token === 'string'
        && data.tokens.refresh_token, 'Invalid Codex ChatGPT auth snapshot');
    return data;
}

function candidatesFrom(listing) {
    return [...new Set(listing.split('\n').map(line => line.trim()).filter(item => candidatePattern.test(item)))];
}

function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function appendEnv(name, value) {
    assert(process.env.GITHUB_ENV, 'GITHUB_ENV is required');
    fs.appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
}

function load() {
    const runnerTemp = process.env.RUNNER_TEMP;
    assert(runnerTemp && fs.existsSync(runnerTemp), 'RUNNER_TEMP is required');
    const home = fs.mkdtempSync(path.join(runnerTemp, 'japanese-codex-home-'));
    fs.chmodSync(home, 0o700);
    const candidates = shuffle(candidatesFrom(oss(['ls', prefix, '-s'])));
    assert(candidates.length, 'No numbered Codex auth snapshots found');
    for (const object of candidates) {
        const contextObject = `${object}.context`;
        if (listed(contextObject)) {
            const contextFile = path.join(home, 'context.json');
            oss(['cp', '-f', contextObject, contextFile]);
            try {
                const context = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
                if (context.version === 1 && context.state === 'usage_limited'
                    && Number.isInteger(context.retry_after_epoch)
                    && context.retry_after_epoch > Math.floor(Date.now() / 1000)) continue;
            } catch { /* An unusable advisory context cannot select a credential. */ continue; }
        }
        const candidateFile = path.join(home, 'candidate-auth.json');
        oss(['cp', '-f', object, candidateFile]);
        const raw = fs.readFileSync(candidateFile, 'utf8');
        const auth = validAuth(raw);
        const refreshHash = sha256(auth.tokens.refresh_token);
        if (listed(`${object}.invalid.${refreshHash}`)) continue;
        const authFile = path.join(home, 'auth.json');
        fs.renameSync(candidateFile, authFile);
        fs.chmodSync(authFile, 0o600);
        fs.writeFileSync(path.join(home, 'config.toml'),
            'cli_auth_credentials_store = "file"\napproval_policy = "never"\n'
            + '[features]\nshell_tool = false\nunified_exec = false\n', {mode: 0o600});
        appendEnv('CODEX_HOME', home);
        appendEnv('I18N_CODEX_AUTH_OBJECT', object);
        appendEnv('I18N_CODEX_AUTH_SHA', sha256(raw));
        appendEnv('I18N_CODEX_REFRESH_SHA', refreshHash);
        process.stdout.write(`Selected Codex auth snapshot ${object.slice(prefix.length)}\n`);
        return;
    }
    throw new Error('No eligible Codex auth snapshot; all are usage-limited or invalid');
}

function sync() {
    const home = process.env.CODEX_HOME;
    const object = process.env.I18N_CODEX_AUTH_OBJECT;
    const originalHash = process.env.I18N_CODEX_AUTH_SHA;
    const refreshHash = process.env.I18N_CODEX_REFRESH_SHA;
    assert(home && object && candidatePattern.test(object) && /^[a-f0-9]{64}$/.test(originalHash ?? ''),
        'Missing selected Codex auth identity');
    assert(/^[a-f0-9]{64}$/.test(refreshHash ?? ''), 'Missing selected refresh-token identity');
    if (fs.existsSync(path.join(home, 'japanese-refresh-token-reused'))) {
        const invalidFile = path.join(home, 'invalid-token.json');
        fs.writeFileSync(invalidFile, JSON.stringify({version: 1, state: 'auth_invalid',
            reason: 'refresh_token_reused', refresh_token_sha256: refreshHash}) + '\n', {mode: 0o600});
        oss(['cp', '-f', invalidFile, `${object}.invalid.${refreshHash}`]);
        process.stdout.write('Recorded reused Codex refresh token for this snapshot\n');
        return;
    }
    const authFile = path.join(home, 'auth.json');
    const raw = fs.readFileSync(authFile, 'utf8');
    validAuth(raw);
    if (sha256(raw) === originalHash) {
        process.stdout.write('Codex auth snapshot did not change\n');
        return;
    }
    const remoteFile = path.join(home, `remote-auth-${randomInt(1_000_000)}.json`);
    try {
        oss(['cp', '-f', object, remoteFile]);
        if (sha256(fs.readFileSync(remoteFile)) !== originalHash) {
            process.stdout.write('Codex auth changed remotely; skipped stale refresh upload\n');
            return;
        }
        oss(['cp', '-f', authFile, object]);
        process.stdout.write('Synced refreshed Codex auth snapshot\n');
    } finally {fs.rmSync(remoteFile, {force: true});}
}

if (require.main === module) {
    try {
        assert(['load', 'sync'].includes(process.argv[2]) && process.argv.length === 3,
            'Usage: codex-auth.cjs load|sync');
        if (process.argv[2] === 'load') load(); else sync();
    } catch (error) {console.error(error.message); process.exitCode = 1;}
}

module.exports = {candidatesFrom, validAuth, load, sync};
