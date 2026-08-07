const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const typescript = require('typescript');

const dagPath = path.join(__dirname, 'profile-analysis.dag.ts');
const output = typescript.transpileModule(fs.readFileSync(dagPath, 'utf8'), {
    compilerOptions: {
        esModuleInterop: true,
        module: typescript.ModuleKind.CommonJS,
        target: typescript.ScriptTarget.ES2020,
    },
}).outputText;
const dagModule = new Module(dagPath, module);
dagModule.filename = dagPath;
dagModule.paths = Module._nodeModulePaths(path.dirname(dagPath));
dagModule._compile(output, dagPath);

const {
    buildElkGraph,
    formatBytes,
    formatCount,
    formatDurationNs,
    isDependencyEdge,
    layoutProfileDag,
    selectSlowestOperators,
    OPERATOR_NODE_HEIGHT,
    OPERATOR_NODE_WIDTH,
} = dagModule.exports;

function fixture() {
    const operator = (id, fragmentId, pipelineId, overrides = {}) => ({
        id,
        fragmentId,
        pipelineId,
        ordinal: 0,
        operatorType: 'OLAP_SCAN_OPERATOR',
        operatorFamily: 'SCAN',
        role: 'SOURCE',
        label: 'OLAP SCAN',
        planNodeId: 1,
        nereidsId: null,
        destId: null,
        destIds: [],
        known: true,
        lineNumber: 10,
        planInfo: {},
        timing: {},
        metrics: {},
        analysis: { heat: null, waitHeat: null, isBottleneck: false },
        ...overrides,
    });
    return {
        schemaVersion: '1.0',
        parserVersion: '0.2.0',
        jobId: 'job-1',
        profile: {},
        graph: {
            direction: 'BOTTOM_TO_TOP',
            nodes: [
                operator('fragment:0/pipeline:0/operator:0', 'fragment:0', 'fragment:0/pipeline:0'),
                operator('fragment:1/pipeline:2/operator:0', 'fragment:1', 'fragment:1/pipeline:2', {
                    label: 'HASH JOIN',
                    operatorFamily: 'HASH_JOIN',
                }),
            ],
            edges: [
                {
                    id: 'edge:data',
                    kind: 'EXCHANGE',
                    source: 'fragment:0/pipeline:0/operator:0',
                    target: 'fragment:1/pipeline:2/operator:0',
                    relationId: '35',
                    resolved: true,
                    metadata: { crossFragment: true, destId: 35 },
                },
                {
                    id: 'edge:dependency',
                    kind: 'BUILD_DEPENDENCY',
                    source: 'fragment:1/pipeline:2/operator:0',
                    target: 'fragment:0/pipeline:0/operator:0',
                    relationId: null,
                    resolved: true,
                    metadata: {},
                },
            ],
        },
        fragments: [
            {
                id: 'fragment:0',
                number: 0,
                pipelineIds: ['fragment:0/pipeline:0'],
                nodeIds: ['fragment:0/pipeline:0/operator:0'],
            },
            {
                id: 'fragment:1',
                number: 1,
                pipelineIds: ['fragment:1/pipeline:2'],
                nodeIds: ['fragment:1/pipeline:2/operator:0'],
            },
        ],
        pipelines: [
            {
                id: 'fragment:0/pipeline:0',
                fragmentId: 'fragment:0',
                number: 0,
                instanceNum: 1,
                nodeIds: ['fragment:0/pipeline:0/operator:0'],
            },
            {
                id: 'fragment:1/pipeline:2',
                fragmentId: 'fragment:1',
                number: 2,
                instanceNum: 64,
                nodeIds: ['fragment:1/pipeline:2/operator:0'],
            },
        ],
        unresolvedReferences: [],
        warnings: [],
        summary: {
            fragmentCount: 2,
            pipelineCount: 2,
            nodeCount: 2,
            edgeCount: 2,
            unresolvedEdgeCount: 0,
            criticalNodeId: null,
            maxExecTimeNs: null,
            maxWaitTimeNs: null,
        },
    };
}

function timedFixture(entries) {
    const dag = fixture();
    const template = dag.graph.nodes[0];
    dag.graph.nodes = entries.map(([id, maxNs, overrides = {}]) => {
        const segments = id.split('/');
        return {
            ...template,
            id,
            fragmentId: segments[0],
            pipelineId: segments.slice(0, 2).join('/'),
            timing: maxNs === null ? {} : { execTime: { maxNs } },
            ...overrides,
        };
    });
    return dag;
}

test('ranks the slowest operators by exec max and keeps at most five entries', () => {
    const hotspots = selectSlowestOperators(
        timedFixture([
            ['fragment:0/pipeline:0/operator:0', 5_000_000],
            ['fragment:1/pipeline:2/operator:0', 900_000_000, { label: 'HASH JOIN', planNodeId: 10 }],
            ['fragment:2/pipeline:0/operator:0', 300_000_000],
            ['fragment:3/pipeline:1/operator:0', 80_000_000],
            ['fragment:4/pipeline:0/operator:0', 40_000_000],
            ['fragment:5/pipeline:0/operator:0', 20_000_000],
        ]),
    );

    assert.deepEqual(
        hotspots.map(hotspot => hotspot.execMaxNs),
        [900_000_000, 300_000_000, 80_000_000, 40_000_000, 20_000_000],
    );
    assert.equal(hotspots[0].id, 'fragment:1/pipeline:2/operator:0');
    assert.equal(hotspots[0].label, 'HASH JOIN');
    assert.equal(hotspots[0].location, 'Fragment 1 · Pipeline 2');
    assert.equal(hotspots[0].planNodeId, 10);
    assert.equal(formatDurationNs(hotspots[0].execMaxNs), '900 ms');
});

test('lists only operators the Profile timed and orders ties predictably', () => {
    const hotspots = selectSlowestOperators(
        timedFixture([
            ['fragment:1/pipeline:0/operator:0', null],
            ['fragment:0/pipeline:0/operator:0', 0],
            ['fragment:2/pipeline:0/operator:0', 12_000, { planNodeId: null }],
            ['fragment:3/pipeline:0/operator:0', 12_000],
        ]),
    );

    assert.deepEqual(
        hotspots.map(hotspot => hotspot.id),
        ['fragment:2/pipeline:0/operator:0', 'fragment:3/pipeline:0/operator:0'],
    );
    assert.equal(hotspots[0].planNodeId, null);
    assert.deepEqual(selectSlowestOperators(timedFixture([['fragment:0/pipeline:0/operator:0', null]])), []);
    assert.equal(selectSlowestOperators(timedFixture([['fragment:0/pipeline:0/operator:0', 5]]), 0).length, 0);
});

test('builds one ELK compound parent per Fragment and keeps all cross-Fragment edges', () => {
    const graph = buildElkGraph(fixture());

    assert.equal(graph.layoutOptions['elk.direction'], 'UP');
    assert.equal(graph.layoutOptions['elk.hierarchyHandling'], 'INCLUDE_CHILDREN');
    assert.deepEqual(graph.children.map(fragment => fragment.id), ['fragment:0', 'fragment:1']);
    assert.equal(graph.children[0].children[0].width, OPERATOR_NODE_WIDTH);
    assert.equal(graph.children[0].children[0].height, OPERATOR_NODE_HEIGHT);
    assert.deepEqual(graph.edges[0], {
        id: 'edge:data',
        sources: ['fragment:0/pipeline:0/operator:0'],
        targets: ['fragment:1/pipeline:2/operator:0'],
    });
});

test('maps laid-out operators to fixed read-only child nodes and keeps pipeline as a badge', async () => {
    const dag = fixture();
    const engine = {
        async layout(graph) {
            return {
                ...graph,
                children: graph.children.map((fragment, fragmentIndex) => ({
                    ...fragment,
                    x: fragmentIndex * 400,
                    y: fragmentIndex * 200,
                    width: 300,
                    height: 220,
                    children: fragment.children.map(node => ({ ...node, x: 20, y: 60 })),
                })),
            };
        },
    };

    const result = await layoutProfileDag(dag, engine);
    const operator = result.nodes.find(node => node.id === 'fragment:1/pipeline:2/operator:0');
    const fragment = result.nodes.find(node => node.id === 'fragment:1');

    assert.equal(fragment.data.label, 'Fragment 1');
    assert.equal(fragment.draggable, false);
    assert.equal(operator.parentId, 'fragment:1');
    assert.equal(operator.extent, 'parent');
    assert.equal(operator.draggable, false);
    assert.equal(operator.connectable, false);
    assert.equal(operator.data.pipelineLabel, 'Pipeline 2');
    assert.equal(operator.data.instanceNum, 64);
    assert.deepEqual(operator.position, { x: 20, y: 60 });
});

test('visually distinguishes data edges from dependency edges without animation', async () => {
    const graph = buildElkGraph(fixture());
    const result = await layoutProfileDag(fixture(), { layout: async () => graph });
    const data = result.edges.find(edge => edge.id === 'edge:data');
    const dependency = result.edges.find(edge => edge.id === 'edge:dependency');

    assert.equal(data.data.dependency, false);
    assert.equal(data.data.crossFragment, true);
    assert.equal(data.type, 'profileElk');
    assert.equal(data.data.elkPath, null);
    assert.equal(data.markerEnd.type, 'arrowclosed');
    assert.equal(data.style.strokeDasharray, undefined);
    assert.equal(dependency.data.dependency, true);
    assert.equal(dependency.data.crossFragment, false);
    assert.equal(dependency.markerEnd.type, 'arrow');
    assert.equal(dependency.style.strokeDasharray, '7 5');
    assert.equal(dependency.animated, false);
    assert.equal(isDependencyEdge('BLOCKING_DEPENDENCY'), true);
    assert.equal(isDependencyEdge('MULTICAST'), false);
});

test('uses simplified orthogonal ELK sections as absolute React Flow paths', async () => {
    const dag = fixture();
    const graph = buildElkGraph(dag);
    const result = await layoutProfileDag(dag, {
        async layout() {
            return {
                ...graph,
                children: graph.children.map((fragment, index) => ({
                    ...fragment,
                    x: index * 500,
                    y: index * 300,
                    width: 300,
                    height: 240,
                    children: fragment.children.map(node => ({ ...node, x: 20, y: 60 })),
                })),
                edges: graph.edges.map((edge, index) => ({
                    ...edge,
                    container: index === 0 ? 'profile-dag' : 'fragment:1',
                    sections: [{
                        startPoint: { x: 10, y: 50 },
                        bendPoints: [
                            { x: 10, y: 40 },
                            { x: 10, y: 30 },
                            { x: 80, y: 30 },
                        ],
                        endPoint: { x: 80, y: 20 },
                    }],
                })),
            };
        },
    });

    const rootEdge = result.edges.find(edge => edge.id === 'edge:data');
    const fragmentEdge = result.edges.find(edge => edge.id === 'edge:dependency');
    assert.equal(rootEdge.data.elkPath, 'M 10 50 L 10 30 L 80 30 L 80 20');
    assert.equal(fragmentEdge.data.elkPath, 'M 510 350 L 510 330 L 580 330 L 580 320');
    assert.doesNotMatch(rootEdge.data.elkPath, /[CQ]/);
});

test('ELK lays out a complete graph containing a cross-Fragment edge', async () => {
    const result = await layoutProfileDag(fixture());

    assert.equal(result.nodes.length, 4);
    assert.equal(result.edges.length, 2);
    for (const node of result.nodes) {
        assert.equal(Number.isFinite(node.position.x), true);
        assert.equal(Number.isFinite(node.position.y), true);
    }
});

test('formats unknown values distinctly from real zero values using English text', () => {
    assert.equal(formatDurationNs(null), 'Unknown');
    assert.equal(formatDurationNs(0), '0 ns');
    assert.equal(formatDurationNs(1_500), '1.5 µs');
    assert.equal(formatDurationNs(2_500_000), '2.5 ms');
    assert.equal(formatDurationNs(3_000_000_000), '3 s');
    assert.equal(formatBytes(undefined), 'Unknown');
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1536), '1.5 KiB');
    assert.equal(formatCount(null), 'Unknown');
    assert.equal(formatCount(0), '0');
    assert.equal(formatCount(120500), '120,500');
});
