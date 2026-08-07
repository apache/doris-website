const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const typescript = require('typescript');

const previousTypeScriptLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
    const output = typescript.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: {
            esModuleInterop: true,
            jsx: typescript.JsxEmit.React,
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2020,
        },
    }).outputText;
    module._compile(output, filename);
};
const { initialLocalProfileDagSnapshot, localProfileDagReducer } = require('./use-local-profile-dag.ts');
require.extensions['.ts'] = previousTypeScriptLoader;

const dag = {
    schemaVersion: '1.0', profile: {}, graph: { direction: 'BOTTOM_TO_TOP', nodes: [], edges: [] },
    fragments: [], pipelines: [], unresolvedReferences: [], warnings: [],
    summary: { fragmentCount: 0, pipelineCount: 0, nodeCount: 0, edgeCount: 0, unresolvedEdgeCount: 0 },
};

test('local DAG reducer has an independent parsing and success lifecycle', () => {
    const parsing = localProfileDagReducer(initialLocalProfileDagSnapshot, { type: 'start' });
    assert.deepEqual(parsing, { state: 'parsing', dag: null, error: null });
    assert.deepEqual(localProfileDagReducer(parsing, { type: 'success', dag }), {
        state: 'ready', dag, error: null,
    });
});

test('local DAG failure never carries a stale graph and reset returns to idle', () => {
    const ready = { state: 'ready', dag, error: null };
    const failed = localProfileDagReducer(ready, {
        type: 'failure', state: 'unavailable', error: 'No MergedProfile.',
    });
    assert.deepEqual(failed, { state: 'unavailable', dag: null, error: 'No MergedProfile.' });
    assert.equal(localProfileDagReducer(failed, { type: 'reset' }), initialLocalProfileDagSnapshot);
});

