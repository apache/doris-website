const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const { File } = require('node:buffer');
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
require.extensions['.ts'] = previousTypeScriptLoader;

const {
    createAnalysisJob,
    getAnalysisJob,
    getAnalysisJobByClientRequestId,
    MAX_FINAL_ANSWER_BYTES,
    PRIVACY_NOTICE_VERSION,
    ProfileAnalysisApiError,
} = apiModule.exports;

const clientRequestId = 'ca9ee8aa-3f47-4aab-a151-f3a39c5a6193';
const jobId = '550e8400-e29b-41d4-a716-446655440000';
const hcaptchaToken = 'test-hcaptcha-token';

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
        assert.equal(url, 'https://agent.velodb.io/api/profile/analysis-jobs');
        assert.equal(options.method, 'POST');
        assert.deepEqual(options.headers, { 'Idempotency-Key': clientRequestId });
        assert.equal(options.headers['Content-Type'], undefined, 'the browser must set the multipart boundary');
        assert.ok(options.body instanceof FormData);

        const uploadedFile = options.body.get('file');
        assert.ok(uploadedFile);
        assert.equal(uploadedFile.name, 'query-profile.txt');
        assert.equal(await uploadedFile.text(), 'Query Profile text');
        assert.equal(options.body.get('language'), 'zh-CN');
        assert.equal(options.body.get('consent'), 'true');
        assert.equal(options.body.get('privacyNoticeVersion'), PRIVACY_NOTICE_VERSION);
        assert.equal(options.body.get('hcaptchaToken'), hcaptchaToken);
        return new Response(JSON.stringify({ jobId, status: 'QUEUED' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '3' },
        });
    };

    assert.deepEqual(
        await createAnalysisJob(
            'https://agent.velodb.io/',
            file,
            'zh-CN',
            clientRequestId,
            hcaptchaToken,
        ),
        {
        jobId,
        status: 'QUEUED',
        retryAfterMs: 3000,
        },
    );
});

test('parses queued, running, completed, and failed job snapshots', async t => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });
    const responses = [
        { jobId, status: 'QUEUED', jobsAhead: 3, dagStatus: 'PENDING' },
        { jobId, status: 'RUNNING', dagStatus: 'PARSING', dagError: null },
        { jobId, status: 'COMPLETED', result: { id: 'item_26', type: 'agent_message', text: 'Done' }, dagStatus: 'READY' },
        { jobId, status: 'FAILED', error: { code: 'CODEX_EXECUTION_FAILED', message: 'Failed safely.' }, dagStatus: 'UNAVAILABLE', dagError: 'DAG_UNAVAILABLE' },
    ];
    global.fetch = async (url, options) => {
        assert.equal(url, `/api/profile/analysis-jobs/${jobId}`);
        assert.equal(options.method, 'GET');
        return jsonResponse(responses.shift());
    };
    assert.deepEqual(await getAnalysisJob('', jobId), {
        jobId,
        status: 'QUEUED',
        jobsAhead: 3,
    });
    assert.deepEqual(await getAnalysisJob('', jobId), {
        jobId,
        status: 'RUNNING',
    });
    assert.equal((await getAnalysisJob('', jobId)).status, 'COMPLETED');
    assert.equal((await getAnalysisJob('', jobId)).status, 'FAILED');
});

test('recovers a job id from a client request id without re-uploading the profile', async t => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });
    global.fetch = async (url, options) => {
        assert.equal(url, `/api/profile/analysis-job-requests/${clientRequestId}`);
        assert.equal(options.method, 'GET');
        return jsonResponse({ jobId, status: 'RUNNING' });
    };

    assert.deepEqual(await getAnalysisJobByClientRequestId('', clientRequestId), {
        jobId,
        status: 'RUNNING',
    });
});

test('preserves Retry-After on a temporary client-request recovery 404', async t => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });
    global.fetch = async () =>
        new Response(JSON.stringify({
            code: 'ANALYSIS_JOB_NOT_FOUND',
            message: 'The analysis job was not found or has expired.',
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '1' },
        });

    await assert.rejects(
        getAnalysisJobByClientRequestId('', clientRequestId),
        error => {
            assert.ok(error instanceof ProfileAnalysisApiError);
            assert.equal(error.status, 404);
            assert.equal(error.retryAfterMs, 1000);
            return true;
        },
    );
});

test('accepts a terminal status when an idempotent create response is replayed', async t => {
    const originalFetch = global.fetch;
    t.after(() => { global.fetch = originalFetch; });
    global.fetch = async () =>
        new Response(JSON.stringify({ jobId, status: 'COMPLETED' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '2' },
        });

    assert.equal(
        (
            await createAnalysisJob(
                '',
                new File(['profile'], 'profile.txt'),
                'en',
                clientRequestId,
                hcaptchaToken,
            )
        ).status,
        'COMPLETED',
    );
});

test('preserves a structured backend error on non-2xx responses', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () =>
        jsonResponse({ code: 'INVALID_PROFILE', message: 'The file is not a Doris profile.' }, { status: 422 });

    await assert.rejects(
        createAnalysisJob(
            'https://agent.velodb.io',
            new File(['bad'], 'bad.txt'),
            'en',
            clientRequestId,
            hcaptchaToken,
        ),
        error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 422);
        assert.equal(error.code, 'INVALID_PROFILE');
        assert.equal(error.message, 'The file is not a Doris profile.');
        return true;
        },
    );
});

test('uses a safe fallback when an error response is not JSON', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () => new Response('<html>Bad gateway</html>', { status: 502 });

    await assert.rejects(
        createAnalysisJob(
            '',
            new File(['profile'], 'profile.txt'),
            'en',
            clientRequestId,
            hcaptchaToken,
        ),
        error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 502);
        assert.equal(error.code, 'HTTP_ERROR');
        assert.doesNotMatch(error.message, /<html>/);
        return true;
        },
    );
});

test('rejects a successful response that is not an agent message', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () => jsonResponse({ jobId, status: 'unexpected' }, { status: 202 });

    await assert.rejects(
        createAnalysisJob(
            '',
            new File(['profile'], 'profile.txt'),
            'en',
            clientRequestId,
            hcaptchaToken,
        ),
        error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 502);
        assert.equal(error.code, 'INVALID_SERVER_RESPONSE');
        return true;
        },
    );
});

test('rejects a completed answer over the frontend UTF-8 byte limit', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    const oversized = 'a'.repeat(MAX_FINAL_ANSWER_BYTES + 1);
    global.fetch = async () =>
        jsonResponse({
            jobId,
            status: 'COMPLETED',
            result: { id: 'item_26', type: 'agent_message', text: oversized },
            dagStatus: 'READY',
        });

    await assert.rejects(getAnalysisJob('', jobId), error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.code, 'INVALID_SERVER_RESPONSE');
        return true;
    });
});

test('rejects an API response body over the client hard limit', async t => {
    const originalFetch = global.fetch;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () =>
        new Response(JSON.stringify({ padding: 'x'.repeat(140 * 1024) }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    await assert.rejects(getAnalysisJob('', jobId), error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
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

    await assert.rejects(
        createAnalysisJob(
            '',
            new File(['profile'], 'profile.txt'),
            'en',
            clientRequestId,
            hcaptchaToken,
        ),
        error => {
        assert.ok(error instanceof ProfileAnalysisApiError);
        assert.equal(error.status, 0);
        assert.equal(error.code, 'NETWORK_ERROR');
        assert.doesNotMatch(error.message, /fetch failed/);
        return true;
        },
    );
});

test('rejects a missing hCaptcha token before sending the Profile', async t => {
    const originalFetch = global.fetch;
    let fetchCalls = 0;
    t.after(() => {
        global.fetch = originalFetch;
    });
    global.fetch = async () => {
        fetchCalls += 1;
        throw new Error('must not be called');
    };

    await assert.rejects(
        createAnalysisJob('', new File(['profile'], 'profile.txt'), 'en', clientRequestId, '  '),
        error => {
            assert.ok(error instanceof ProfileAnalysisApiError);
            assert.equal(error.code, 'CAPTCHA_MISSING');
            return true;
        },
    );
    assert.equal(fetchCalls, 0);
});
