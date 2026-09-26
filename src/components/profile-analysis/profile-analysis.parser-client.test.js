const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { File } = require('node:buffer');
const typescript = require('typescript');

const previousTypeScriptLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
    const output = typescript.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 },
    }).outputText;
    module._compile(output, filename);
};
const client = require('./profile-analysis.parser-client.ts');
const parser = require('./profile-analysis.parser.ts');
const workerParser = require('./profile-analysis.parser.worker.ts');
require.extensions['.ts'] = previousTypeScriptLoader;

class FakeWorker {
    onmessage = null;
    onerror = null;
    posted = [];
    terminated = 0;

    postMessage(message) {
        this.posted.push(message);
    }

    terminate() {
        this.terminated += 1;
    }
}

const file = new File(['MergedProfile:'], 'profile.txt', { type: 'text/plain' });
const dag = {
    schemaVersion: '1.0',
    graph: { direction: 'BOTTOM_TO_TOP', nodes: [], edges: [] },
    profile: {}, fragments: [], pipelines: [], unresolvedReferences: [], warnings: [],
    summary: { fragmentCount: 0, pipelineCount: 0, nodeCount: 0, edgeCount: 0, unresolvedEdgeCount: 0 },
};

test('posts one file request, accepts only its request id, and terminates after success', async () => {
    const worker = new FakeWorker();
    const operation = client.startProfileParse(file, () => worker, 1_000);

    assert.equal(worker.posted.length, 1);
    assert.equal(worker.posted[0].type, 'PARSE_PROFILE');
    assert.equal(worker.posted[0].file, file);
    worker.onmessage({ data: { type: 'PARSE_SUCCESS', requestId: 'stale', dag } });
    assert.equal(worker.terminated, 0);
    worker.onmessage({ data: { type: 'PARSE_SUCCESS', requestId: operation.requestId, dag } });

    assert.equal(await operation.promise, dag);
    assert.equal(worker.terminated, 1);
});

test('maps stable parser failures and terminates the worker', async () => {
    const worker = new FakeWorker();
    const operation = client.startProfileParse(file, () => worker, 1_000);
    worker.onmessage({ data: { type: 'PARSE_FAILURE', requestId: operation.requestId, code: 'DAG_UNAVAILABLE' } });

    await assert.rejects(operation.promise, error => error.code === 'DAG_UNAVAILABLE');
    assert.equal(worker.terminated, 1);
});

test('terminates and rejects an operation on timeout', async () => {
    const worker = new FakeWorker();
    const operation = client.startProfileParse(file, () => worker, 5);

    await assert.rejects(operation.promise, /timed out/);
    assert.equal(worker.terminated, 1);
});

test('cancels an in-flight operation and ignores late worker responses', async () => {
    const worker = new FakeWorker();
    const operation = client.startProfileParse(file, () => worker, 1_000);
    operation.cancel();
    worker.onmessage({ data: { type: 'PARSE_SUCCESS', requestId: operation.requestId, dag } });

    await assert.rejects(operation.promise, error => error.name === 'AbortError');
    assert.equal(worker.terminated, 1);
});

test('rejects oversized prepared files before creating a worker', async () => {
    let workerCalls = 0;
    const oversized = { name: 'large.txt', size: parser.MAX_PARSER_BYTES + 1 };
    const operation = client.startProfileParse(oversized, () => {
        workerCalls += 1;
        return new FakeWorker();
    });

    await assert.rejects(operation.promise, error => error.code === 'DAG_TOO_LARGE');
    assert.equal(workerCalls, 0);
});

test('rejects invalid UTF-8 before parsing Profile structure', async () => {
    const invalidUtf8 = new File([new Uint8Array([0xc3, 0x28])], 'invalid.txt', { type: 'text/plain' });

    await assert.rejects(workerParser.parseProfileFile(invalidUtf8), error => {
        assert.equal(error.code, 'DAG_PARSE_FAILED');
        assert.match(error.message, /valid UTF-8/);
        return true;
    });
});
