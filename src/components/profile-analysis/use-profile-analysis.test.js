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
const { ProfileAnalysisApiError } = require('./profile-analysis.api.ts');

require.extensions['.ts'] = previousTypeScriptLoader;

const firstFile = { name: 'first.txt' };
const secondFile = { name: 'second.txt' };
const result = { id: 'item_26', type: 'agent_message', text: 'Final diagnosis' };
const idleSnapshot = profileAnalysisReducer(initialProfileAnalysisSnapshot, { type: 'restore_empty' });

test('moves from idle through ready, analyzing, and completed', () => {
    const ready = profileAnalysisReducer(idleSnapshot, { type: 'select', file: firstFile });
    assert.deepEqual(ready, {
        state: 'ready',
        file: firstFile,
        language: 'en',
        jobId: null,
        jobsAhead: null,
        result: null,
        error: null,
        dagState: 'idle',
        dag: null,
        dagError: null,
        recoveryWarning: null,
    });

    const submitting = profileAnalysisReducer(ready, { type: 'start' });
    assert.equal(submitting.state, 'submitting');
    const queued = profileAnalysisReducer(submitting, { type: 'job_created', jobId: 'job-1', status: 'QUEUED' });
    const analyzing = profileAnalysisReducer(queued, {
        type: 'job_status', job: { jobId: 'job-1', status: 'RUNNING', dagStatus: 'PARSING', dagError: null },
    });

    const completed = profileAnalysisReducer(analyzing, { type: 'complete', result });
    assert.equal(completed.state, 'completed');
    assert.equal(completed.result, result);
    assert.equal(completed.error, null);
});

test('does not start without a file or replace a file while analyzing', () => {
    assert.equal(profileAnalysisReducer(idleSnapshot, { type: 'start' }), idleSnapshot);

    const ready = profileAnalysisReducer(idleSnapshot, { type: 'select', file: firstFile });
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
        dagState: 'idle',
        dag: null,
        dagError: null,
        recoveryWarning: null,
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
        dagState: 'failed',
        dag: null,
        dagError: 'The execution graph can no longer be recovered.',
        recoveryWarning: null,
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
        dagState: 'idle',
        dag: null,
        dagError: null,
        recoveryWarning: null,
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
        dagState: 'idle',
        dag: null,
        dagError: null,
        recoveryWarning: null,
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
        dagState: 'idle',
        dag: null,
        dagError: null,
        recoveryWarning: null,
    });

    const analyzing = profileAnalysisReducer(chinese, { type: 'start' });
    assert.equal(
        profileAnalysisReducer(analyzing, { type: 'set_language', language: 'en' }),
        analyzing,
    );
});

test('restores persisted job metadata before polling resumes', () => {
    const restoring = profileAnalysisReducer(initialProfileAnalysisSnapshot, {
        type: 'restore_record',
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        language: 'zh-CN',
    });
    assert.equal(restoring.state, 'restoring');
    assert.equal(restoring.file, null);
    assert.equal(restoring.language, 'zh-CN');
    assert.equal(restoring.jobId, '550e8400-e29b-41d4-a716-446655440000');

    const running = profileAnalysisReducer(restoring, {
        type: 'job_status',
        job: {
            jobId: '550e8400-e29b-41d4-a716-446655440000',
            status: 'RUNNING',
            dagStatus: 'PARSING',
            dagError: null,
        },
    });
    assert.equal(running.state, 'analyzing');
});

test('warns when session storage is unavailable without failing the analysis state', () => {
    const warned = profileAnalysisReducer(idleSnapshot, { type: 'storage_unavailable' });
    assert.equal(warned.state, 'idle');
    assert.match(warned.recoveryWarning, /cannot be restored after a page refresh/);
});

test('keeps an uncertain analysis busy while its original identifiers are recovered', () => {
    const running = {
        state: 'analyzing',
        file: firstFile,
        language: 'en',
        jobId: '550e8400-e29b-41d4-a716-446655440000',
        jobsAhead: null,
        result: null,
        error: null,
        dagState: 'parsing',
        dag: null,
        dagError: null,
        recoveryWarning: null,
    };
    const recovering = profileAnalysisReducer(running, { type: 'recovering' });
    assert.equal(recovering.state, 'recovering');
    assert.equal(recovering.jobId, running.jobId);
    assert.equal(recovering.file, firstFile);
    assert.equal(profileAnalysisReducer(recovering, { type: 'start' }), recovering);
    assert.equal(profileAnalysisReducer(recovering, { type: 'select', file: secondFile }), recovering);
});

test('keeps the current task busy when Codex completes before the execution graph', () => {
    const ready = profileAnalysisReducer(idleSnapshot, { type: 'select', file: firstFile });
    const submitting = profileAnalysisReducer(ready, { type: 'start' });
    const queued = profileAnalysisReducer(submitting, { type: 'job_created', jobId: 'job-1', status: 'QUEUED' });
    const codexCompleted = profileAnalysisReducer(queued, {
        type: 'job_status',
        job: {
            jobId: 'job-1',
            status: 'COMPLETED',
            result,
            dagStatus: 'PARSING',
            dagError: null,
        },
    });

    assert.equal(codexCompleted.state, 'completed');
    assert.equal(codexCompleted.dagState, 'parsing');
    assert.equal(profileAnalysisReducer(codexCompleted, { type: 'select', file: secondFile }), codexCompleted);
    assert.equal(profileAnalysisReducer(codexCompleted, { type: 'start' }), codexCompleted);
});

test('keeps a ready execution graph when the independent AI analysis fails', () => {
    const graph = { schemaVersion: '1.0', jobId: 'job-1' };
    const withGraph = profileAnalysisReducer(
        { ...idleSnapshot, state: 'analyzing', jobId: 'job-1', dagState: 'loading' },
        { type: 'dag_loaded', dag: graph },
    );
    const failed = profileAnalysisReducer(withGraph, {
        type: 'job_status',
        job: {
            jobId: 'job-1',
            status: 'FAILED',
            error: { code: 'CODEX_EXECUTION_FAILED', message: 'AI analysis failed.' },
            dagStatus: 'READY',
            dagError: null,
        },
    });

    assert.equal(failed.state, 'failed');
    assert.equal(failed.error, 'AI analysis failed.');
    assert.equal(failed.dagState, 'ready');
    assert.equal(failed.dag, graph);
});

test('does not turn a terminal DAG client failure back into an endless loading state', () => {
    const terminalDagFailure = {
        ...idleSnapshot,
        state: 'analyzing',
        jobId: 'job-1',
        dagState: 'failed',
        dagError: 'The execution graph could not be loaded.',
    };
    const next = profileAnalysisReducer(terminalDagFailure, {
        type: 'job_status',
        job: {
            jobId: 'job-1',
            status: 'RUNNING',
            dagStatus: 'READY',
            dagError: null,
        },
    });

    assert.equal(next.dagState, 'failed');
    assert.equal(next.dagError, terminalDagFailure.dagError);
});

test('normalizes unknown failures without exposing non-error values', () => {
    assert.equal(getProfileAnalysisErrorMessage(new Error('Backend timed out')), 'Backend timed out');
    assert.equal(getProfileAnalysisErrorMessage({ secret: 'internal detail' }), 'Profile analysis failed. Please try again.');
});

test('maps hCaptcha backend errors to actionable messages', () => {
    assert.match(
        getProfileAnalysisErrorMessage(
            new ProfileAnalysisApiError(403, 'CAPTCHA_INVALID', 'backend detail'),
        ),
        /failed or expired/,
    );
    assert.match(
        getProfileAnalysisErrorMessage(
            new ProfileAnalysisApiError(503, 'CAPTCHA_UNAVAILABLE', 'backend detail'),
        ),
        /temporarily unavailable/,
    );
});
