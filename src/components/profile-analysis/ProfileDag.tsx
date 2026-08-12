import React, { JSX, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
    Background,
    Controls,
    MiniMap,
    Panel,
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
    selectSlowestOperators,
    OPERATOR_NODE_HEIGHT,
    OPERATOR_NODE_WIDTH,
    type ProfileFlowNode,
    type ProfileHotspot,
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

/** Zoom applied when a hotspot entry centers its operator on the canvas. */
const FOCUS_ZOOM = 1;

/** Full screen keeps the site navigation usable, so the canvas starts below this element. */
const NAVBAR_SELECTOR = '.navbar-next';

/** Custom property holding the measured navbar height the full-screen canvas starts below. */
const NAVBAR_OFFSET_PROPERTY = '--profile-dag-navbar-offset';

const EXPAND_ICON_PATH = 'M6 1.5H1.5V6M10 1.5h4.5V6M14.5 10v4.5H10M6 14.5H1.5V10';
const COLLAPSE_ICON_PATH = 'M1.5 5.5H6V1.5M14.5 5.5H10V1.5M10 14.5V10h4.5M6 14.5V10H1.5';

const stateMessages: Partial<Record<DagUiState, string>> = {
    idle: 'Choose a Profile and select Visualize Execution.',
    parsing: 'Parsing the execution graph…',
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

function HotspotList({
    hotspots,
    onFocus,
}: {
    hotspots: ProfileHotspot[];
    onFocus: (nodeId: string) => void;
}): JSX.Element {
    const [expanded, setExpanded] = useState(true);
    const titleId = useId();

    return (
        <Panel position="top-left" className="profile-dag-hotspots" role="region" aria-labelledby={titleId}>
            <div className="profile-dag-hotspots__header">
                <div>
                    <h4 id={titleId}>Slowest operators</h4>
                    <p className="profile-dag-hotspots__hint">Ranked by exec max</p>
                </div>
                <button
                    type="button"
                    className="profile-dag-hotspots__toggle"
                    aria-expanded={expanded}
                    onClick={() => setExpanded(open => !open)}
                >
                    {expanded ? 'Hide' : 'Show'}
                </button>
            </div>
            {expanded && (
                <ol className="profile-dag-hotspots__list">
                    {hotspots.map((hotspot, index) => (
                        <li key={hotspot.id}>
                            <button
                                type="button"
                                className="profile-dag-hotspots__item"
                                title={hotspot.id}
                                onClick={() => onFocus(hotspot.id)}
                            >
                                <span className="profile-dag-hotspots__rank" aria-hidden="true">
                                    {index + 1}
                                </span>
                                <span className="profile-dag-hotspots__body">
                                    <span className="profile-dag-hotspots__name">{hotspot.label}</span>
                                    <span className="profile-dag-hotspots__meta">
                                        {hotspot.planNodeId !== null && `id=${hotspot.planNodeId} · `}
                                        {hotspot.location}
                                    </span>
                                </span>
                                <span className="profile-dag-hotspots__time">
                                    {formatDurationNs(hotspot.execMaxNs)}
                                </span>
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </Panel>
    );
}

function FullscreenToggle({
    active,
    onToggle,
}: {
    active: boolean;
    onToggle: (next: boolean) => void;
}): JSX.Element {
    return (
        <Panel position="top-right" className="profile-dag-fullscreen">
            <button
                type="button"
                className="profile-dag-fullscreen__button"
                aria-pressed={active}
                title={active ? 'Exit full screen (Esc)' : 'Expand the execution graph to full screen'}
                onClick={() => onToggle(!active)}
            >
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d={active ? COLLAPSE_ICON_PATH : EXPAND_ICON_PATH} />
                </svg>
                {active ? 'Exit full screen' : 'Full screen'}
            </button>
        </Panel>
    );
}

function ProfileDagCanvas({ dag }: { dag: ProfileDagResponse }): JSX.Element {
    const [nodes, setNodes] = useState<ProfileFlowNode[]>([]);
    const [edges, setEdges] = useState<Awaited<ReturnType<typeof layoutProfileDag>>['edges']>([]);
    const [selectedNode, setSelectedNode] = useState<ProfileDagNodeData | null>(null);
    const [layoutError, setLayoutError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<HTMLDivElement>(null);
    const hasFitVisibleCanvasRef = useRef(false);
    const { fitView, getInternalNode, setCenter } = useReactFlow<ProfileFlowNode>();
    const hotspots = useMemo(() => selectSlowestOperators(dag), [dag]);

    useEffect(() => {
        let cancelled = false;
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setLayoutError(null);
        setIsFullscreen(false);
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

    const changeFullscreen = useCallback((next: boolean) => {
        // The canvas changes size, so let the resize observer above fit the graph again.
        hasFitVisibleCanvasRef.current = false;
        setIsFullscreen(next);
    }, []);

    // Full screen stops below the navbar, whose height is measured because it grows on
    // narrow screens, and the page behind the canvas is kept from scrolling.
    useEffect(() => {
        const workspace = workspaceRef.current;
        if (!isFullscreen || !workspace) return;

        const navbar = document.querySelector(NAVBAR_SELECTOR);
        const applyNavbarOffset = () => {
            const offset = navbar ? Math.max(0, navbar.getBoundingClientRect().bottom) : 0;
            workspace.style.setProperty(NAVBAR_OFFSET_PROPERTY, `${offset}px`);
        };
        const exitOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') changeFullscreen(false);
        };
        const previousBodyOverflow = document.body.style.overflow;

        applyNavbarOffset();
        document.body.style.overflow = 'hidden';
        window.addEventListener('resize', applyNavbarOffset);
        window.addEventListener('keydown', exitOnEscape);
        return () => {
            window.removeEventListener('resize', applyNavbarOffset);
            window.removeEventListener('keydown', exitOnEscape);
            document.body.style.overflow = previousBodyOverflow;
            workspace.style.removeProperty(NAVBAR_OFFSET_PROPERTY);
        };
    }, [changeFullscreen, isFullscreen]);

    const highlightNode = useCallback((nodeId: string) => {
        setNodes(current => current.map(node => ({ ...node, selected: node.id === nodeId })));
    }, []);

    const focusNode = useCallback(
        (nodeId: string) => {
            const internalNode = getInternalNode(nodeId);
            if (!internalNode) return;
            const { x, y } = internalNode.internals.positionAbsolute;
            const width = internalNode.measured.width ?? OPERATOR_NODE_WIDTH;
            const height = internalNode.measured.height ?? OPERATOR_NODE_HEIGHT;
            highlightNode(nodeId);
            void setCenter(x + width / 2, y + height / 2, { zoom: FOCUS_ZOOM, duration: 500 });
        },
        [getInternalNode, highlightNode, setCenter],
    );

    const onNodeClick = useMemo<NodeMouseHandler<ProfileFlowNode>>(
        () => (_event, flowNode) => {
            if (flowNode.data.kind === 'operator') {
                setSelectedNode(flowNode.data.node);
                highlightNode(flowNode.id);
            }
        },
        [highlightNode],
    );

    if (layoutError) {
        return <div className="profile-dag__message profile-dag__message--error" role="alert">{layoutError}</div>;
    }
    if (nodes.length === 0) {
        return <div className="profile-dag__message"><span className="profile-analysis__spinner" aria-hidden="true" /> Laying out the execution graph…</div>;
    }

    const workspaceClassName = [
        'profile-dag__workspace',
        selectedNode ? 'profile-dag__workspace--details' : '',
        isFullscreen ? 'profile-dag__workspace--fullscreen' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div ref={workspaceRef} className={workspaceClassName}>
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
                    {hotspots.length > 0 && <HotspotList hotspots={hotspots} onFocus={focusNode} />}
                    <FullscreenToggle active={isFullscreen} onToggle={changeFullscreen} />
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
