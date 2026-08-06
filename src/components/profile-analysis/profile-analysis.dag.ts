import type { Edge, Node } from '@xyflow/react';

import type {
    ProfileDagEdge,
    ProfileDagFragment,
    ProfileDagNode,
    ProfileDagResponse,
} from './profile-analysis.types';

export const OPERATOR_NODE_WIDTH = 224;
export const OPERATOR_NODE_HEIGHT = 104;
export const FRAGMENT_HEADER_HEIGHT = 42;

const DATA_EDGE_COLOR = 'var(--ifm-color-emphasis-600)';
const DEPENDENCY_EDGE_COLOR = 'var(--ifm-color-warning-dark)';

export type ProfileFlowNodeData =
    | {
          kind: 'fragment';
          fragmentId: string;
          label: string;
      }
    | {
          kind: 'operator';
          node: ProfileDagNode;
          pipelineLabel: string;
          instanceNum: number | null;
      };

export interface ProfileFlowEdgeData extends Record<string, unknown> {
    kind: ProfileDagEdge['kind'];
    relationId: string | null;
    dependency: boolean;
    crossFragment: boolean;
}

export type ProfileFlowNode = Node<ProfileFlowNodeData>;
export type ProfileFlowEdge = Edge<ProfileFlowEdgeData>;

interface ElkNode {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    children?: ElkNode[];
    layoutOptions?: Record<string, string>;
}

interface ElkEdge {
    id: string;
    sources: string[];
    targets: string[];
}

export interface ElkGraph extends ElkNode {
    children: ElkNode[];
    edges: ElkEdge[];
}

interface ElkLayoutEngine {
    layout(graph: ElkGraph): Promise<ElkGraph>;
}

export function isDependencyEdge(kind: ProfileDagEdge['kind']): boolean {
    return kind === 'BUILD_DEPENDENCY' || kind === 'BLOCKING_DEPENDENCY';
}

export function formatDurationNs(value: number | null | undefined): string {
    if (value == null) return 'Unknown';
    if (value < 1_000) return `${value} ns`;
    if (value < 1_000_000) return `${formatDecimal(value / 1_000)} µs`;
    if (value < 1_000_000_000) return `${formatDecimal(value / 1_000_000)} ms`;
    return `${formatDecimal(value / 1_000_000_000)} s`;
}

export function formatCount(value: number | null | undefined): string {
    if (value == null) return 'Unknown';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

export function formatBytes(value: number | null | undefined): string {
    if (value == null) return 'Unknown';
    if (value < 1024) return `${value} B`;
    const units = ['KiB', 'MiB', 'GiB', 'TiB'];
    let amount = value / 1024;
    let unitIndex = 0;
    while (amount >= 1024 && unitIndex < units.length - 1) {
        amount /= 1024;
        unitIndex += 1;
    }
    return `${formatDecimal(amount)} ${units[unitIndex]}`;
}

function formatDecimal(value: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function fragmentNumber(fragment: ProfileDagFragment): number {
    return fragment.number;
}

function pipelineNumber(pipelineId: string): string {
    const match = /\/pipeline:(\d+)$/.exec(pipelineId);
    return match?.[1] ?? pipelineId;
}

export function buildElkGraph(dag: ProfileDagResponse): ElkGraph {
    const nodesByFragment = new Map<string, ProfileDagNode[]>();
    for (const node of dag.graph.nodes) {
        const current = nodesByFragment.get(node.fragmentId) ?? [];
        current.push(node);
        nodesByFragment.set(node.fragmentId, current);
    }

    const fragments = [...dag.fragments].sort((left, right) => fragmentNumber(left) - fragmentNumber(right));
    const knownFragmentIds = new Set(fragments.map(fragment => fragment.id));
    for (const fragmentId of nodesByFragment.keys()) {
        if (!knownFragmentIds.has(fragmentId)) {
            fragments.push({ id: fragmentId, number: Number.MAX_SAFE_INTEGER, pipelineIds: [], nodeIds: [] });
        }
    }

    return {
        id: 'profile-dag',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'UP',
            'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.layered.spacing.nodeNodeBetweenLayers': '90',
            'elk.spacing.nodeNode': '48',
            'elk.spacing.componentComponent': '64',
            'elk.padding': '[top=54,left=28,bottom=28,right=28]',
        },
        children: fragments.map(fragment => ({
            id: fragment.id,
            layoutOptions: {
                'elk.padding': `[top=${FRAGMENT_HEADER_HEIGHT + 16},left=20,bottom=20,right=20]`,
            },
            children: (nodesByFragment.get(fragment.id) ?? []).map(node => ({
                id: node.id,
                width: OPERATOR_NODE_WIDTH,
                height: OPERATOR_NODE_HEIGHT,
            })),
        })),
        edges: dag.graph.edges.map(edge => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };
}

export async function layoutProfileDag(
    dag: ProfileDagResponse,
    engine?: ElkLayoutEngine,
): Promise<{ nodes: ProfileFlowNode[]; edges: ProfileFlowEdge[] }> {
    const elk = engine ?? (await createElkEngine());
    const laidOut = await elk.layout(buildElkGraph(dag));
    const fragmentById = new Map(dag.fragments.map(fragment => [fragment.id, fragment]));
    const pipelineById = new Map(dag.pipelines.map(pipeline => [pipeline.id, pipeline]));
    const sourceNodeById = new Map(dag.graph.nodes.map(node => [node.id, node]));
    const flowNodes: ProfileFlowNode[] = [];

    for (const fragmentLayout of laidOut.children ?? []) {
        const fragment = fragmentById.get(fragmentLayout.id);
        flowNodes.push({
            id: fragmentLayout.id,
            type: 'profileFragment',
            position: { x: fragmentLayout.x ?? 0, y: fragmentLayout.y ?? 0 },
            style: { width: fragmentLayout.width ?? OPERATOR_NODE_WIDTH + 40, height: fragmentLayout.height ?? 180 },
            data: {
                kind: 'fragment',
                fragmentId: fragmentLayout.id,
                label: fragment ? `Fragment ${fragment.number}` : fragmentLayout.id,
            },
            draggable: false,
            selectable: false,
            connectable: false,
        });

        for (const operatorLayout of fragmentLayout.children ?? []) {
            const node = sourceNodeById.get(operatorLayout.id);
            if (!node) continue;
            const pipeline = pipelineById.get(node.pipelineId);
            flowNodes.push({
                id: node.id,
                type: 'profileOperator',
                parentId: fragmentLayout.id,
                extent: 'parent',
                position: { x: operatorLayout.x ?? 0, y: operatorLayout.y ?? FRAGMENT_HEADER_HEIGHT },
                width: OPERATOR_NODE_WIDTH,
                height: OPERATOR_NODE_HEIGHT,
                data: {
                    kind: 'operator',
                    node,
                    pipelineLabel: `Pipeline ${pipeline?.number ?? pipelineNumber(node.pipelineId)}`,
                    instanceNum: pipeline?.instanceNum ?? null,
                },
                draggable: false,
                selectable: true,
                connectable: false,
            });
        }
    }

    return {
        nodes: flowNodes,
        edges: dag.graph.edges.map(edge => {
            const dependency = isDependencyEdge(edge.kind);
            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: 'smoothstep',
                animated: false,
                selectable: false,
                reconnectable: false,
                style: {
                    stroke: dependency ? DEPENDENCY_EDGE_COLOR : DATA_EDGE_COLOR,
                    strokeWidth: dependency ? 1.5 : 2,
                    strokeDasharray: dependency ? '7 5' : undefined,
                },
                data: {
                    kind: edge.kind,
                    relationId: edge.relationId,
                    dependency,
                    crossFragment: edge.metadata?.crossFragment === true,
                },
            };
        }),
    };
}

async function createElkEngine(): Promise<ElkLayoutEngine> {
    const module = await import('elkjs/lib/elk.bundled.js');
    const Elk = module.default;
    return new Elk() as unknown as ElkLayoutEngine;
}
