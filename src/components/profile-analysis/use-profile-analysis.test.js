const assert = require('node:assert/strict');
const test = require('node:test');
const typescript = require('typescript');

const previousTypeScriptLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
    const source = require('node:fs').readFileSync(filename, 'utf8');
    const output = typescript.transpileModule(source, {
        compilerOptions: {
            esModuleInterop: true,
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2020,
        },
    }).outputText;
    module._compile(output, filename);
};

const {
    getProfileAnalysisErrorMessage,
    initialProfileAnalysisSnapshot,
    profileAnalysisReducer,
} = require('./use-profile-analysis.ts');

require.extensions['.ts'] = previousTypeScriptLoader;

const firstFile = { name: 'first.txt' };
const secondFile = { name: 'second.txt' };
const result = { id: 'item_26', type: 'agent_message', text: 'Final diagnosis' };

test('moves from idle through ready, analyzing, and completed', () => {
    const ready = profileAnalysisReducer(initialProfileAnalysisSnapshot, { type: 'select', file: firstFile });
    assert.deepEqual(ready, {
        state: 'ready',
        file: firstFile,
        language: 'en',
        jobId: null,
        jobsAhead: null,
        result: null,
        error: null,
    });

    const submitting = profileAnalysisReducer(ready, { type: 'start' });
    assert.equal(submitting.state, 'submitting');
    const queued = profileAnalysisReducer(submitting, { type: 'job_created', jobId: 'job-1', status: 'QUEUED' });
    const analyzing = profileAnalysisReducer(queued, {
        type: 'job_status', job: { jobId: 'job-1', status: 'RUNNING' },
    });

    const completed = profileAnalysisReducer(analyzing, { type: 'complete', result });
    assert.equal(completed.state, 'completed');
    assert.equal(completed.result, result);
    assert.equal(completed.error, null);
});

test('does not start without a file or replace a file while analyzing', () => {
    assert.equal(
        profileAnalysisReducer(initialProfileAnalysisSnapshot, { type: 'start' }),
        initialProfileAnalysisSnapshot,
    );

    const ready = profileAnalysisReducer(initialProfileAnalysisSnapshot, { type: 'select', file: firstFile });
    const analyzing = profileAnalysisReducer(ready, { type: 'start' });
    assert.equal(profileAnalysisReducer(analyzing, { type: 'select', file: secondFile }), analyzing);
});

test('stores failures and clears the old result and error when a new file is selected', () => {
    const completed = {
        state: 'completed',
        file: firstFile,
        language: 'en',
        jobId: 'old-job',
        jobsAhead: null,
        result,
        error: null,
    };
    const failed = profileAnalysisReducer(completed, { type: 'fail', error: 'Analyzer unavailable' });
    assert.deepEqual(failed, {
        state: 'failed',
        file: firstFile,
        language: 'en',
        jobId: 'old-job',
        jobsAhead: null,
        result: null,
        error: 'Analyzer unavailable',
    });

    const next = profileAnalysisReducer(failed, { type: 'select', file: secondFile });
    assert.deepEqual(next, {
        state: 'ready',
        file: secondFile,
        language: 'en',
        jobId: null,
        jobsAhead: null,
        result: null,
        error: null,
    });
});

test('stores response language per request, clears stale output, and freezes it while analyzing', () => {
    const completed = {
        state: 'completed',
        file: firstFile,
        language: 'en',
        jobId: 'old-job',
        jobsAhead: null,
        result,
        error: null,
    };
    const chinese = profileAnalysisReducer(completed, { type: 'set_language', language: 'zh-CN' });
    assert.deepEqual(chinese, {
        state: 'ready',
        file: firstFile,
        language: 'zh-CN',
        jobId: null,
        jobsAhead: null,
        result: null,
        error: null,
    });

    const analyzing = profileAnalysisReducer(chinese, { type: 'start' });
    assert.equal(
        profileAnalysisReducer(analyzing, { type: 'set_language', language: 'en' }),
        analyzing,
    );
});

test('normalizes unknown failures without exposing non-error values', () => {
    assert.equal(getProfileAnalysisErrorMessage(new Error('Backend timed out')), 'Backend timed out');
    assert.equal(getProfileAnalysisErrorMessage({ secret: 'internal detail' }), 'Profile analysis failed. Please try again.');
});
