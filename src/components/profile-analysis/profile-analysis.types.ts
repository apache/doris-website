export interface AgentMessage {
    id: string;
    type: 'agent_message';
    text: string;
}

export interface ApiErrorBody {
    code: string;
    message: string;
}

export type ResponseLanguage = 'en' | 'zh-CN';

export type AnalysisState =
    | 'restoring'
    | 'recovering'
    | 'idle'
    | 'ready'
    | 'submitting'
    | 'queued'
    | 'analyzing'
    | 'completed'
    | 'failed';

export type AnalysisJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type DagUiState = 'idle' | 'parsing' | 'ready' | 'unavailable' | 'failed';

export interface CreateAnalysisJobResponse {
    jobId: string;
    status: AnalysisJobStatus;
    retryAfterMs: number;
}

export interface RecoveredAnalysisJobResponse {
    jobId: string;
    status: AnalysisJobStatus;
}

export type AnalysisJobSnapshot =
    | { jobId: string; status: 'QUEUED'; jobsAhead: number }
    | { jobId: string; status: 'RUNNING' }
    | { jobId: string; status: 'COMPLETED'; result: AgentMessage }
    | { jobId: string; status: 'FAILED'; error: ApiErrorBody };

export type DagOperatorRole =
    | 'SOURCE'
    | 'SINK'
    | 'PROBE'
    | 'BUILD'
    | 'PRODUCER'
    | 'CONSUMER'
    | 'UNKNOWN';

export interface DagAggregateMetric {
    sum?: number | null;
    avg?: number | null;
    max?: number | null;
    min?: number | null;
}

export interface DagExecTime {
    sumNs?: number | null;
    avgNs?: number | null;
    maxNs?: number | null;
    minNs?: number | null;
    display?: string;
}

export interface DagWaitTime {
    totalNs?: number | null;
    maxNs?: number | null;
    avgNs?: number | null;
    display?: string;
    breakdown?: Record<string, number | null>;
}

export interface ProfileDagNode {
    id: string;
    fragmentId: string;
    pipelineId: string;
    ordinal: number;
    operatorType: string;
    operatorFamily: string;
    role: DagOperatorRole | string;
    label: string;
    planNodeId?: number | null;
    nereidsId?: number | null;
    destId?: number | null;
    destIds: number[];
    known: boolean;
    lineNumber: number;
    headerAttributes?: Record<string, string | number | boolean | Array<string | number | boolean>>;
    planInfo: Record<string, string | number | boolean | Array<string | number | boolean>>;
    timing?: {
        execTime?: DagExecTime;
        waitTime?: DagWaitTime;
    };
    metrics?: Record<string, DagAggregateMetric | null>;
    analysis?: {
        heat?: number | null;
        waitHeat?: number | null;
        isBottleneck?: boolean;
    };
}

export type DagEdgeKind =
    | 'PIPELINE_DATA'
    | 'EXCHANGE'
    | 'LOCAL_EXCHANGE'
    | 'MULTICAST'
    | 'BUILD_DEPENDENCY'
    | 'BLOCKING_DEPENDENCY';

export interface ProfileDagEdge {
    id: string;
    kind: DagEdgeKind;
    source: string;
    target: string;
    relationId?: string | null;
    resolved: true;
    metadata?: Record<string, string | number | boolean | null>;
}

export interface ProfileDagFragment {
    id: string;
    number: number;
    pipelineIds: string[];
    nodeIds: string[];
}

export interface ProfileDagPipeline {
    id: string;
    fragmentId: string;
    number: number;
    instanceNum: number;
    nodeIds: string[];
    waitWorkerTime?: Record<string, number | null>;
}

export interface ProfileDagUnresolvedReference {
    kind: string;
    relationId?: string | null;
    sourceNodeId: string;
    reason: string;
}

export interface ProfileDagWarning {
    kind?: string;
    code?: string;
    nodeId?: string;
    operatorType?: string;
    message?: string;
    lineNumber?: number;
}

export interface ProfileDagSummary {
    fragmentCount: number;
    pipelineCount: number;
    nodeCount: number;
    edgeCount: number;
    unresolvedEdgeCount: number;
    criticalNodeId?: string | null;
    maxExecTimeNs?: number | null;
    maxWaitTimeNs?: number | null;
}

export interface ProfileGraphIR {
    schemaVersion: '1.0';
    parserVersion?: string;
    jobId?: string;
    profile: Record<string, unknown>;
    graph: {
        direction: 'BOTTOM_TO_TOP';
        nodes: ProfileDagNode[];
        edges: ProfileDagEdge[];
    };
    fragments: ProfileDagFragment[];
    pipelines: ProfileDagPipeline[];
    unresolvedReferences: ProfileDagUnresolvedReference[];
    warnings: ProfileDagWarning[];
    summary: ProfileDagSummary;
}

export type ProfileDag = ProfileGraphIR;
export type ProfileDagResponse = ProfileGraphIR;
