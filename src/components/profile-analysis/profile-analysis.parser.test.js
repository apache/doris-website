const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const typescript = require('typescript');

const previousTypeScriptLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
    const output = typescript.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2020,
        },
    }).outputText;
    module._compile(output, filename);
};

const parserPath = path.join(__dirname, 'profile-analysis.parser.ts');
const parserModule = new Module(parserPath, module);
parserModule.filename = parserPath;
parserModule.paths = Module._nodeModulePaths(path.dirname(parserPath));
parserModule._compile(
    typescript.transpileModule(fs.readFileSync(parserPath, 'utf8'), {
        compilerOptions: {
            module: typescript.ModuleKind.CommonJS,
            target: typescript.ScriptTarget.ES2020,
        },
    }).outputText,
    parserPath,
);
require.extensions['.ts'] = previousTypeScriptLoader;

const {
    MAX_PARSER_LINE_BYTES,
    parseCounter,
    parseProfileText,
    ProfileParserError,
} = parserModule.exports;

function representativeProfile() {
    return [
        'Summary:',
        '  Query ID: test',
        'MergedProfile:',
        '     Fragments:',
        '       Fragment 0:',
        '         Pipeline 0(instance_num=1):',
        '           RESULT_SINK_OPERATOR(id=2147483647):',
        '             CommonCounters:',
        '                - ExecTime: avg 2.472ms, max 2.472ms, min 2.472ms',
        '           EXCHANGE_OPERATOR(id=35):',
        '              - PlanInfo',
        '                 - limit: 100',
        '             CommonCounters:',
        '                - ExecTime: avg 1.894ms, max 1.894ms, min 1.894ms',
        '                - RowsProduced: sum 100, avg 100, max 100, min 100',
        '                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns',
        '                  - WaitForData0: avg 183.936ms, max 183.936ms, min 183.936ms',
        '       Fragment 1:',
        '         Pipeline 0(instance_num=8):',
        '           DATA_STREAM_SINK_OPERATOR(dest_id=35):',
        '             CommonCounters:',
        '                - ExecTime: avg 495.552us, max 1.111ms, min 14.647us',
        '           HASH_JOIN_OPERATOR(nereids_id=22)(id=7):',
        '              - PlanInfo',
        '                 - join op: INNER JOIN(PARTITIONED)[]',
        '             CommonCounters:',
        '                - ExecTime: avg 1.2ms, max 2ms, min 1ms',
        '         Pipeline 1(instance_num=8):',
        '           HASH_JOIN_SINK_OPERATOR(nereids_id=22)(id=7):',
        '             CommonCounters:',
        '                - ExecTime: avg 3ms, max 4ms, min 2ms',
        'DetailProfile(test):',
        '  ignored instance detail',
    ].join('\n');
}

test('parses MergedProfile nodes, data flow, exchange, and dependency edges', () => {
    const dag = parseProfileText(representativeProfile());

    assert.equal(dag.schemaVersion, '1.0');
    assert.equal(dag.jobId, undefined);
    assert.deepEqual(dag.summary, {
        fragmentCount: 2,
        pipelineCount: 3,
        nodeCount: 5,
        edgeCount: 4,
        unresolvedEdgeCount: 0,
        criticalNodeId: 'fragment:1/pipeline:1/operator:0',
        maxExecTimeNs: 4_000_000,
        maxWaitTimeNs: 0,
    });
    assert.deepEqual(
        Object.fromEntries(dag.graph.edges.map(edge => [edge.kind, (dag.graph.edges.filter(item => item.kind === edge.kind)).length])),
        { PIPELINE_DATA: 2, EXCHANGE: 1, BUILD_DEPENDENCY: 1 },
    );
    const exchange = dag.graph.nodes.find(node => node.operatorType === 'EXCHANGE_OPERATOR');
    assert.equal(exchange.planInfo.limit, '100');
    assert.equal(exchange.metrics.inputRows.max, 100);
    assert.equal(exchange.timing.waitTime.maxNs, 0);
    assert.equal(exchange.timing.waitTime.breakdown.waitForDataNs, 0);
});

test('preserves multicast branches and their branch indexes', () => {
    const profile = [
        'MergedProfile:',
        '  Fragment 0:',
        '    Pipeline 0(instance_num=1):',
        '      MULTI_CAST_DATA_STREAM_SINK_OPERATOR(dest_id=-7, dest_id=-8)(id=-5):',
        '    Pipeline 1(instance_num=1):',
        '      MULTI_CAST_DATA_STREAM_SOURCE_OPERATOR(id=-7):',
        '    Pipeline 2(instance_num=1):',
        '      MULTI_CAST_DATA_STREAM_SOURCE_OPERATOR(id=-8):',
    ].join('\n');
    const dag = parseProfileText(profile);
    const edges = dag.graph.edges.filter(edge => edge.kind === 'MULTICAST');

    assert.equal(edges.length, 2);
    assert.deepEqual(edges.map(edge => edge.relationId), ['-7', '-8']);
    assert.deepEqual(edges.map(edge => edge.metadata.branchIndex), [0, 1]);
});

test('keeps unknown operator text inert and reports a non-blocking warning', () => {
    const dag = parseProfileText([
        'MergedProfile:',
        '  Fragment 0:',
        '    Pipeline 0(instance_num=1):',
        '      EVIL_<IMG_ONERROR_OPERATOR(id=1):',
        '      FUTURE_OPERATOR(id=2):',
        '        - PlanInfo',
        '          - table: <img src=x onerror=alert(1)>',
    ].join('\n'));

    assert.equal(dag.graph.nodes.length, 1);
    assert.equal(dag.graph.nodes[0].known, false);
    assert.equal(dag.graph.nodes[0].planInfo.table, '<img src=x onerror=alert(1)>');
    assert.deepEqual(dag.warnings[0], {
        kind: 'UNKNOWN_OPERATOR',
        nodeId: 'fragment:0/pipeline:0/operator:0',
        operatorType: 'FUTURE_OPERATOR',
    });
});

test('parses compound Doris durations and exact abbreviated counts', () => {
    assert.deepEqual(parseCounter('WaitForDependencyTime', 'avg 13sec796ms, max 13sec796ms, min 1us'), {
        sum: undefined,
        avg: 13_796_000_000,
        max: 13_796_000_000,
        min: 1_000,
    });
    assert.deepEqual(parseCounter('RowsProduced', 'sum 2.232K (2232), avg 279, max 309, min 253'), {
        sum: 2232,
        avg: 279,
        max: 309,
        min: 253,
    });
});

test('fails with stable errors for missing MergedProfile and oversized lines', () => {
    assert.throws(
        () => parseProfileText('Summary:\nNo graph'),
        error => error instanceof ProfileParserError && error.code === 'DAG_UNAVAILABLE',
    );
    const oversized = `MergedProfile:\n${'x'.repeat(MAX_PARSER_LINE_BYTES + 1)}`;
    assert.throws(
        () => parseProfileText(oversized),
        error => error instanceof ProfileParserError && error.code === 'DAG_TOO_LARGE',
    );
});

test('records unresolved exchange references instead of inventing an edge', () => {
    const dag = parseProfileText([
        'MergedProfile:',
        '  Fragment 0:',
        '    Pipeline 0(instance_num=1):',
        '      DATA_STREAM_SINK_OPERATOR(dest_id=99):',
    ].join('\n'));

    assert.equal(dag.graph.edges.length, 0);
    assert.deepEqual(dag.unresolvedReferences, [{
        kind: 'EXCHANGE',
        relationId: '99',
        sourceNodeId: 'fragment:0/pipeline:0/operator:0',
        reason: 'TARGET_NOT_FOUND',
    }]);
});
