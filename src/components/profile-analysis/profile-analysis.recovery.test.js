const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const typescript = require('typescript');

const previousTypeScriptLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const output = typescript.transpileModule(source, {
        compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2020,
        },
    }).outputText;
    module._compile(output, filename);
};

const recoveryPath = path.join(__dirname, 'profile-analysis.recovery.ts');
const compiledRecovery = typescript.transpileModule(fs.readFileSync(recoveryPath, 'utf8'), {
    compilerOptions: {
        module: typescript.ModuleKind.CommonJS,
        target: typescript.ScriptTarget.ES2020,
    },
}).outputText;
const recoveryModule = new Module(recoveryPath, module);
recoveryModule.filename = recoveryPath;
recoveryModule.paths = Module._nodeModulePaths(path.dirname(recoveryPath));
recoveryModule._compile(compiledRecovery, recoveryPath);
const { ProfileAnalysisApiError } = require('./profile-analysis.api.ts');
require.extensions['.ts'] = previousTypeScriptLoader;

const {
    CREATE_RECOVERY_GRACE_MS,
    createOrRecoverAnalysisJob,
    pollAnalysisJobWithRecovery,
    recoverAnalysisJobWithinGrace,
    retryDelayMs,
} = recoveryModule.exports;

const jobId = '550e8400-e29b-41d4-a716-446655440000';

test('recovers an accepted job after an ambiguous create without creating a new logical request', async () => {
    let createCalls = 0;
    let recoverCalls = 0;
    let recoveringCalls = 0;

    const result = await createOrRecoverAnalysisJob({
        create: async () => {
            createCalls += 1;
            throw new ProfileAnalysisApiError(0, 'NETWORK_ERROR', 'network');
        },
        recover: async () => {
            recoverCalls += 1;
            return { jobId, status: 'RUNNING' };
        },
        wait: async () => {},
        onRecovering: () => {
            recoveringCalls += 1;
        },
        createdAt: Date.now(),
        random: () => 0.5,
    });

    assert.deepEqual(result, { jobId, status: 'RUNNING', retryAfterMs: 2000 });
    assert.equal(createCalls, 1);
    assert.equal(recoverCalls, 1);
    assert.equal(recoveringCalls, 1);
});

test('never replays create with a consumed captcha token and recovers through temporary 404s', async () => {
    let createCalls = 0;
    let recoverCalls = 0;
    let now = 10_000;
    const waits = [];

    const result = await createOrRecoverAnalysisJob({
        create: async () => {
            createCalls += 1;
            throw new ProfileAnalysisApiError(502, 'HTTP_ERROR', 'gateway');
        },
        recover: async () => {
            recoverCalls += 1;
            if (recoverCalls === 1) {
                throw new ProfileAnalysisApiError(404, 'ANALYSIS_JOB_NOT_FOUND', 'not found', 1000);
            }
            return { jobId, status: 'QUEUED' };
        },
        wait: async milliseconds => {
            waits.push(milliseconds);
            now += milliseconds;
        },
        onRecovering: () => {},
        createdAt: now,
        now: () => now,
        random: () => 0.5,
    });

    assert.equal(result.jobId, jobId);
    assert.equal(createCalls, 1);
    assert.equal(recoverCalls, 2);
    assert.deepEqual(waits, [2000]);
});

test('surfaces a captcha verifier outage without attempting job recovery', async () => {
    let recoverCalls = 0;
    await assert.rejects(
        createOrRecoverAnalysisJob({
            create: async () => {
                throw new ProfileAnalysisApiError(
                    503,
                    'CAPTCHA_UNAVAILABLE',
                    'Human verification is temporarily unavailable.',
                    30_000,
                );
            },
            recover: async () => {
                recoverCalls += 1;
                throw new Error('must not be called');
            },
            wait: async () => {},
            onRecovering: () => {},
            createdAt: Date.now(),
        }),
        error =>
            error instanceof ProfileAnalysisApiError &&
            error.code === 'CAPTCHA_UNAVAILABLE',
    );
    assert.equal(recoverCalls, 0);
});

test('keeps a fresh client request through temporary 404s until the job appears', async () => {
    let now = 10_000;
    let recoverCalls = 0;
    const waits = [];

    const recovered = await recoverAnalysisJobWithinGrace({
        createdAt: now,
        now: () => now,
        recover: async () => {
            recoverCalls += 1;
            if (recoverCalls < 3) {
                throw new ProfileAnalysisApiError(404, 'ANALYSIS_JOB_NOT_FOUND', 'not found', 1000);
            }
            return { jobId, status: 'QUEUED' };
        },
        wait: async milliseconds => {
            waits.push(milliseconds);
            now += milliseconds;
        },
        onRecovering: () => {},
        random: () => 0.5,
    });

    assert.deepEqual(recovered, { jobId, status: 'QUEUED' });
    assert.equal(recoverCalls, 3);
    assert.deepEqual(waits, [2000, 4000]);
});

test('keeps polling the same job after three transport failures and recovers on the fourth GET', async () => {
    let getCalls = 0;
    let recoveringCalls = 0;
    const waits = [];
    const progress = [];

    const terminal = await pollAnalysisJobWithRecovery({
        get: async () => {
            getCalls += 1;
            if (getCalls <= 3) {
                throw new ProfileAnalysisApiError(503, 'HTTP_ERROR', 'temporarily unavailable');
            }
            if (getCalls === 4) {
                return { jobId, status: 'RUNNING' };
            }
            return {
                jobId,
                status: 'COMPLETED',
                result: { id: 'item-1', type: 'agent_message', text: 'done' },
            };
        },
        wait: async milliseconds => {
            waits.push(milliseconds);
        },
        onRecovering: () => {
            recoveringCalls += 1;
        },
        onProgress: job => {
            progress.push(job.status);
        },
        pollIntervalMs: 2000,
        random: () => 0.5,
    });

    assert.equal(terminal.status, 'COMPLETED');
    assert.equal(getCalls, 5);
    assert.equal(recoveringCalls, 1);
    assert.deepEqual(progress, ['RUNNING']);
    assert.deepEqual(waits, [2000, 4000, 8000, 2000]);
});

test('treats a recovery 404 as final after the grace window', async () => {
    const createdAt = 20_000;
    await assert.rejects(
        recoverAnalysisJobWithinGrace({
            createdAt,
            now: () => createdAt + CREATE_RECOVERY_GRACE_MS,
            recover: async () => {
                throw new ProfileAnalysisApiError(404, 'ANALYSIS_JOB_NOT_FOUND', 'not found', 1000);
            },
            wait: async () => {
                assert.fail('an expired recovery record must not wait again');
            },
            onRecovering: () => {},
        }),
        error => error instanceof ProfileAnalysisApiError && error.status === 404,
    );
});

test('uses capped exponential retry delays with bounded jitter', () => {
    assert.equal(retryDelayMs(1, 2000, 0.5), 2000);
    assert.equal(retryDelayMs(2, 2000, 0.5), 4000);
    assert.equal(retryDelayMs(10, 2000, 0.5), 30000);
    assert.equal(retryDelayMs(1, 2000, 0), 1600);
    assert.equal(retryDelayMs(1, 2000, 1), 2400);
});
