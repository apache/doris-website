import React, { JSX, useEffect, useMemo, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { DagUiState, ProfileDagResponse, ProfileDagNode as ProfileDagNodeData } from './profile-analysis.types';
import {
    formatBytes,
    formatCount,
    formatDurationNs,
    layoutProfileDag,
    type ProfileFlowNode,
} from './profile-analysis.dag';
import { ProfileDagFragmentNode, ProfileDagNode } from './ProfileDagNode';
import { ProfileDagEdge } from './ProfileDagEdge';
import './ProfileDag.scss';

export interface ProfileDagProps {
    state: DagUiState;
    dag: ProfileDagResponse | null;
    error?: string | null;
}

const nodeTypes = {
    profileOperator: ProfileDagNode,
    profileFragment: ProfileDagFragmentNode,
};

const edgeTypes = {
    profileElk: ProfileDagEdge,
};

const stateMessages: Partial<Record<DagUiState, string>> = {
    idle: 'The execution graph will appear after an analysis starts.',
    pending: 'Waiting to parse the execution graph…',
    parsing: 'Parsing the execution graph…',
    loading: 'Laying out the execution graph…',
    unavailable: 'An execution graph is not available for this Profile.',
    failed: 'The execution graph could not be generated.',
};

function safePlanInfoValue(value: unknown): string | null {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
        const values = value
            .filter(item => typeof item === 'string' || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item)))
            .map(String);
        return values.length > 0 ? values.join(', ') : null;
    }
    return null;
}

function titleFromKey(key: string): string {
    return key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/^./, character => character.toUpperCase());
}

function Metric({ label, value, bytes = false }: { label: string; value: { sum?: number | null; avg?: number | null; max?: number | null; min?: number | null } | null | undefined; bytes?: boolean }): JSX.Element | null {
    if (!value) {
        return null;
    }
    const format = bytes ? formatBytes : formatCount;
    return (
        <div className="profile-dag-details__metric">
            <dt>{label}</dt>
            <dd>
                Max {format(value.max ?? null)} · Avg {format(value.avg ?? null)} · Sum {format(value.sum ?? null)}
            </dd>
        </div>
    );
}

function NodeDetails({ node, onClose }: { node: ProfileDagNodeData; onClose: () => void }): JSX.Element {
    const planInfo = Object.entries(node.planInfo ?? {})
        .map(([key, value]) => [key, safePlanInfoValue(value)] as const)
        .filter((entry): entry is readonly [string, string] => entry[1] !== null);
    const breakdown = node.timing?.waitTime?.breakdown;

    return (
        <aside className="profile-dag-details" aria-label="Operator details">
            <header>
                <div>
                    <p>Operator details</p>
                    <h3>{node.label}</h3>
                </div>
                <button type="button" onClick={onClose} aria-label="Close operator details">×</button>
            </header>
            <dl>
                <div><dt>Type</dt><dd>{node.operatorType}</dd></div>
                <div><dt>Role</dt><dd>{node.role}</dd></div>
                <div><dt>Fragment</dt><dd>{node.fragmentId}</dd></div>
                <div><dt>Pipeline</dt><dd>{node.pipelineId}</dd></div>
                {node.planNodeId !== null && node.planNodeId !== undefined && <div><dt>Plan node ID</dt><dd>{node.planNodeId}</dd></div>}
                {node.nereidsId !== null && node.nereidsId !== undefined && <div><dt>Nereids ID</dt><dd>{node.nereidsId}</dd></div>}
            </dl>
            <section>
                <h4>Timing</h4>
                <dl>
                    <div><dt>Execution max</dt><dd>{formatDurationNs(node.timing?.execTime?.maxNs ?? null)}</dd></div>
                    <div><dt>Execution average</dt><dd>{formatDurationNs(node.timing?.execTime?.avgNs ?? null)}</dd></div>
                    <div><dt>Execution minimum</dt><dd>{formatDurationNs(node.timing?.execTime?.minNs ?? null)}</dd></div>
                    <div><dt>Wait max</dt><dd>{formatDurationNs(node.timing?.waitTime?.maxNs ?? null)}</dd></div>
                    {breakdown && <>
                        <div><dt>Dependency wait</dt><dd>{formatDurationNs(breakdown.waitForDependencyNs ?? null)}</dd></div>
                        <div><dt>Data wait</dt><dd>{formatDurationNs(breakdown.waitForDataNs ?? null)}</dd></div>
                        <div><dt>RPC buffer wait</dt><dd>{formatDurationNs(breakdown.waitForRpcBufferQueueNs ?? null)}</dd></div>
                    </>}
                </dl>
            </section>
            {planInfo.length > 0 && <section>
                <h4>Plan information</h4>
                <dl>{planInfo.map(([key, value]) => <div key={key}><dt>{titleFromKey(key)}</dt><dd>{value}</dd></div>)}</dl>
            </section>}
            <section>
                <h4>Metrics</h4>
                <dl>
                    <Metric label="Input rows" value={node.metrics?.inputRows} />
                    <Metric label="Output rows" value={node.metrics?.outputRows} />
                    <Metric label="Memory usage" value={node.metrics?.memoryUsageBytes} bytes />
                    <Metric label="Peak memory" value={node.metrics?.memoryPeakBytes} bytes />
                </dl>
            </section>
        </aside>
    );
}

function ProfileDagCanvas({ dag }: { dag: ProfileDagResponse }): JSX.Element {
    const [nodes, setNodes] = useState<ProfileFlowNode[]>([]);
    const [edges, setEdges] = useState<Awaited<ReturnType<typeof layoutProfileDag>>['edges']>([]);
    const [selectedNode, setSelectedNode] = useState<ProfileDagNodeData | null>(null);
    const [layoutError, setLayoutError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const hasFitVisibleCanvasRef = useRef(false);
    const { fitView } = useReactFlow<ProfileFlowNode>();

    useEffect(() => {
        let cancelled = false;
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setLayoutError(null);
        hasFitVisibleCanvasRef.current = false;
        layoutProfileDag(dag)
            .then(layout => {
                if (!cancelled) {
                    setNodes(layout.nodes);
                    setEdges(layout.edges);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLayoutError('The execution graph could not be laid out.');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [dag]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || nodes.length === 0) return;

        const fitWhenVisible = () => {
            if (hasFitVisibleCanvasRef.current || canvas.clientWidth === 0 || canvas.clientHeight === 0) return;
            hasFitVisibleCanvasRef.current = true;
            requestAnimationFrame(() => void fitView({ padding: 0.12 }));
        };
        const observer = new ResizeObserver(fitWhenVisible);
        observer.observe(canvas);
        fitWhenVisible();
        return () => observer.disconnect();
    }, [fitView, nodes.length]);

    const onNodeClick = useMemo<NodeMouseHandler<ProfileFlowNode>>(
        () => (_event, flowNode) => {
            if (flowNode.data.kind === 'operator') {
                setSelectedNode(flowNode.data.node);
            }
        },
        [],
    );

    if (layoutError) {
        return <div className="profile-dag__message profile-dag__message--error" role="alert">{layoutError}</div>;
    }
    if (nodes.length === 0) {
        return <div className="profile-dag__message"><span className="profile-analysis__spinner" aria-hidden="true" /> Laying out the execution graph…</div>;
    }

    return (
        <div className={`profile-dag__workspace${selectedNode ? ' profile-dag__workspace--details' : ''}`}>
            <div ref={canvasRef} className="profile-dag__canvas" aria-label="Profile execution graph">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodeClick={onNodeClick}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    edgesReconnectable={false}
                    deleteKeyCode={null}
                    panOnDrag
                    zoomOnScroll
                    zoomOnPinch
                    fitView
                    fitViewOptions={{ padding: 0.12 }}
                    minZoom={0.08}
                    maxZoom={1.8}
                >
                    <Background gap={24} size={1} />
                    <MiniMap pannable zoomable aria-label="Execution graph overview" />
                    <Controls showInteractive={false} />
                </ReactFlow>
            </div>
            {selectedNode && <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />}
        </div>
    );
}

export function ProfileDag({ state, dag, error = null }: ProfileDagProps): JSX.Element {
    if (state !== 'ready' || !dag) {
        const message = error || stateMessages[state] || 'The execution graph is not available.';
        const isError = state === 'failed' || state === 'unavailable';
        return <div className={`profile-dag__message${isError ? ' profile-dag__message--error' : ''}`} role={isError ? 'alert' : 'status'}>{message}</div>;
    }

    const issueCount = dag.unresolvedReferences.length + dag.warnings.length;
    return (
        <section className="profile-dag" aria-label="Execution graph">
            <div className="profile-dag__summary">
                <span>{dag.summary.fragmentCount} fragments</span>
                <span>{dag.summary.pipelineCount} pipelines</span>
                <span>{dag.summary.nodeCount} operators</span>
                <span>{dag.summary.edgeCount} connections</span>
                {issueCount > 0 && <span className="profile-dag__issues">{issueCount} non-blocking parsing {issueCount === 1 ? 'notice' : 'notices'}</span>}
            </div>
            <div className="profile-dag__legend" aria-label="Execution graph legend">
                <span><i className="profile-dag__legend-line" /> Data flow</span>
                <span><i className="profile-dag__legend-line profile-dag__legend-line--dependency" /> Execution dependency (prerequisite → dependent)</span>
                <span><i className="profile-dag__legend-swatch profile-dag__legend-swatch--exec" /> Longer execution</span>
                <span><i className="profile-dag__legend-swatch profile-dag__legend-swatch--wait" /> Longer wait</span>
            </div>
            <BrowserOnly fallback={<div className="profile-dag__message">Loading the execution graph…</div>}>
                {() => <ReactFlowProvider><ProfileDagCanvas dag={dag} /></ReactFlowProvider>}
            </BrowserOnly>
        </section>
    );
}
