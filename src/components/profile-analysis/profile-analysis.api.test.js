const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const { File } = require('node:buffer');
const typescript = require('typescript');

const apiPath = path.join(__dirname, 'profile-analysis.api.ts');
const compiledApi = typescript.transpileModule(fs.readFileSync(apiPath, 'utf8'), {
    compilerOptions: {
        module: typescript.ModuleKind.CommonJS,
        target: typescript.ScriptTarget.ES2020,
    },
}).outputText;
const apiModule = new Module(apiPath, module);
apiModule.filename = apiPath;
apiModule.paths = Module._nodeModulePaths(path.dirname(apiPath));
apiModule._compile(compiledApi, apiPath);

const { createAnalysisJob, getAnalysisJob, ProfileAnalysisApiError } = apiModule.exports;

function jsonResponse(body, init = {}) {
    return new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

test('creates an analysis job with the selected file and response language', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });

    const file = new File(['Query Profile text'], 'query-profile.txt', { type: 'text/plain' });

    global.fetch = async (url, options) => {
        assert.equal(url, 'http://localhost:8080/api/profile/analysis-jobs');
        assert.equal(options.method, 'POST');
        assert.equal(options.headers, undefined, 'the browser must set the multipart boundary');
        assert.ok(options.body instanceof FormData);

        const uploadedFile = options.body.get('file');
        assert.ok(uploadedFile);
        assert.equal(uploadedFile.name, 'query-profile.txt');
        assert.equal(await uploadedFile.text(), 'Query Profile text');
        assert.equal(options.body.get('language'), 'zh-CN');
        return new Response(JSON.stringify({ jobId: 'job-1', status: 'QUEUED' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '3' },
        });
    };

    assert.deepEqual(await createAnalysisJob('http://localhost:8080/', file, 'zh-CN'), {
        jobId: 'job-1',
        status: 'QUEUED',
        retryAfterMs: 3000,
    });
});

test('parses queued, running, completed, and failed job snapshots', async t => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });
    const responses = [
        { jobId: 'job-1', status: 'QUEUED', jobsAhead: 3 },
        { jobId: 'job-1', status: 'RUNNING' },
        { jobId: 'job-1', status: 'COMPLETED', result: { id: 'item_26', type: 'agent_message', text: 'Done' } },
        { jobId: 'job-1', status: 'FAILED', error: { code: 'CODEX_EXECUTION_FAILED', message: 'Failed safely.' } },
    ];
    global.fetch = async (url, options) => {
        assert.equal(url, '/api/profile/analysis-jobs/job-1');
        assert.equal(options.method, 'GET');
        return jsonResponse(responses.shift());
    };
    assert.deepEqual(await getAnalysisJob('', 'job-1'), { jobId: 'job-1', status: 'QUEUED', jobsAhead: 3 });
    assert.deepEqual(await getAnalysisJob('', 'job-1'), { jobId: 'job-1', status: 'RUNNING' });
    assert.equal((await getAnalysisJob('', 'job-1')).status, 'COMPLETED');
    assert.equal((await getAnalysisJob('', 'job-1')).status, 'FAILED');
});

test('preserves a structured backend error on non-2xx responses', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () =>
        jsonResponse({ code: 'INVALID_PROFILE', message: 'The file is not a Doris profile.' }, { status: 422 });

    await assert.rejects(createAnalysisJob('http://localhost:8080', new File(['bad'], 'bad.txt'), 'en'), error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 422);
        assert.equal(error.code, 'INVALID_PROFILE');
        assert.equal(error.message, 'The file is not a Doris profile.');
        return true;
    });
});

test('uses a safe fallback when an error response is not JSON', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () => new Response('<html>Bad gateway</html>', { status: 502 });

    await assert.rejects(createAnalysisJob('', new File(['profile'], 'profile.txt'), 'en'), error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 502);
        assert.equal(error.code, 'HTTP_ERROR');
        assert.doesNotMatch(error.message, /<html>/);
        return true;
    });
});

test('rejects a successful response that is not an agent message', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () => jsonResponse({ jobId: 'job-1', status: 'unexpected' }, { status: 202 });

    await assert.rejects(createAnalysisJob('', new File(['profile'], 'profile.txt'), 'en'), error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 502);
        assert.equal(error.code, 'INVALID_SERVER_RESPONSE');
        return true;
    });
});

test('normalizes network failures into a stable API error', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () => {
        throw new TypeError('fetch failed');
    };

    await assert.rejects(createAnalysisJob('', new File(['profile'], 'profile.txt'), 'en'), error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 0);
        assert.equal(error.code, 'NETWORK_ERROR');
        assert.doesNotMatch(error.message, /fetch failed/);
        return true;
    });
});
