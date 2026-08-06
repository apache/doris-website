import type {
    AgentMessage,
    AnalysisJobSnapshot,
    AnalysisJobStatus,
    ApiErrorBody,
    CreateAnalysisJobResponse,
    DagStatus,
    ProfileDagFetchResult,
    ProfileDag,
    RecoveredAnalysisJobResponse,
    ResponseLanguage,
} from './profile-analysis.types';
import { isUuid } from './profile-analysis.storage';
import { prepareProfileFile } from './profile-analysis.file';

const ANALYSIS_JOBS_PATH = '/api/profile/analysis-jobs';
const ANALYSIS_JOB_REQUESTS_PATH = '/api/profile/analysis-job-requests';
const DEFAULT_POLL_INTERVAL_MS = 2_000;
export const PRIVACY_NOTICE_VERSION = '2026-07-22';
export const MAX_FINAL_ANSWER_BYTES = 64 * 1024;
const MAX_API_RESPONSE_BYTES = 128 * 1024;
export const MAX_DAG_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_DAG_NODES = 500;
const MAX_DAG_EDGES = 1_000;
const MAX_DAG_STRING_BYTES = 16 * 1024;
const MAX_DAG_ID_BYTES = 512;

export class ProfileAnalysisApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly retryAfterMs?: number,
    ) {
        super(message);
        this.name = 'ProfileAnalysisApiError';
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isAgentMessage(value: unknown): value is AgentMessage {
    return (
        isRecord(value) &&
        typeof value.id === 'string' &&
        value.id.length > 0 &&
        new TextEncoder().encode(value.id).byteLength <= 128 &&
        value.type === 'agent_message' &&
        typeof value.text === 'string' &&
        value.text.trim().length > 0 &&
        new TextEncoder().encode(value.text).byteLength <= MAX_FINAL_ANSWER_BYTES
    );
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
    return isRecord(value) && typeof value.code === 'string' && typeof value.message === 'string';
}

function isJobId(value: unknown): value is string {
    return isUuid(value);
}

function isAnalysisJobStatus(value: unknown): value is AnalysisJobStatus {
    return value === 'QUEUED' || value === 'RUNNING' || value === 'COMPLETED' || value === 'FAILED';
}

function isDagStatus(value: unknown): value is DagStatus {
    return (
        value === 'PENDING' ||
        value === 'PARSING' ||
        value === 'READY' ||
        value === 'UNAVAILABLE' ||
        value === 'FAILED'
    );
}

function parseDagJobState(body: Record<string, unknown>): { dagStatus: DagStatus; dagError: string | null } {
    if (!isDagStatus(body.dagStatus)) throw invalidResponse();
    if (body.dagError !== undefined && body.dagError !== null && typeof body.dagError !== 'string') {
        throw invalidResponse();
    }
    return {
        dagStatus: body.dagStatus,
        dagError: typeof body.dagError === 'string' ? body.dagError : null,
    };
}

function isBoundedString(value: unknown, maxBytes = MAX_DAG_STRING_BYTES): value is string {
    return typeof value === 'string' && new TextEncoder().encode(value).byteLength <= maxBytes;
}

function isDagId(value: unknown): value is string {
    return isBoundedString(value, MAX_DAG_ID_BYTES) && value.length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
    return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isSafeInteger(value: unknown): value is number {
    return Number.isSafeInteger(value);
}

function isNullableNonNegativeInteger(value: unknown): value is number | null {
    return value === null || isNonNegativeInteger(value);
}

function isOptionalNullableNonNegativeInteger(value: unknown): value is number | null | undefined {
    return value === undefined || isNullableNonNegativeInteger(value);
}

function isOptionalNullableSafeInteger(value: unknown): value is number | null | undefined {
    return value === undefined || value === null || isSafeInteger(value);
}

function isBoundedScalar(value: unknown): value is string | number | boolean {
    return (
        isBoundedString(value) ||
        typeof value === 'boolean' ||
        (typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value))
    );
}

function isBoundedScalarRecord(value: unknown, allowNull = false): boolean {
    if (!isRecord(value) || Object.keys(value).length > 128) return false;
    return Object.entries(value).every(([key, item]) => {
        if (!isBoundedString(key, 256)) return false;
        if (allowNull && item === null) return true;
        if (isBoundedScalar(item)) return true;
        return Array.isArray(item) && item.length <= 128 && item.every(isBoundedScalar);
    });
}

function isAggregateMetric(value: unknown): boolean {
    return (
        isRecord(value) &&
        isOptionalNullableNonNegativeInteger(value.sum) &&
        isOptionalNullableNonNegativeInteger(value.avg) &&
        isOptionalNullableNonNegativeInteger(value.max) &&
        isOptionalNullableNonNegativeInteger(value.min)
    );
}

function isExecTime(value: unknown): boolean {
    return (
        isRecord(value) &&
        isOptionalNullableNonNegativeInteger(value.sumNs) &&
        isOptionalNullableNonNegativeInteger(value.avgNs) &&
        isOptionalNullableNonNegativeInteger(value.maxNs) &&
        isOptionalNullableNonNegativeInteger(value.minNs) &&
        (value.display === undefined || isBoundedString(value.display))
    );
}

function isWaitTime(value: unknown): boolean {
    return (
        isRecord(value) &&
        isOptionalNullableNonNegativeInteger(value.totalNs) &&
        isOptionalNullableNonNegativeInteger(value.maxNs) &&
        isOptionalNullableNonNegativeInteger(value.avgNs) &&
        (value.display === undefined || isBoundedString(value.display)) &&
        (value.breakdown === undefined ||
            (isRecord(value.breakdown) &&
                Object.keys(value.breakdown).length <= 64 &&
                Object.entries(value.breakdown).every(
                    ([key, item]) => isBoundedString(key, 256) && isNullableNonNegativeInteger(item),
                )))
    );
}

function isDagNode(value: unknown): boolean {
    if (!isRecord(value)) return false;
    if (
        !isDagId(value.id) ||
        !isDagId(value.fragmentId) ||
        !isDagId(value.pipelineId) ||
        !isNonNegativeInteger(value.ordinal) ||
        !isBoundedString(value.operatorType, 512) ||
        !isBoundedString(value.operatorFamily, 512) ||
        !isBoundedString(value.role, 128) ||
        !isBoundedString(value.label, 1_024) ||
        !isOptionalNullableSafeInteger(value.planNodeId) ||
        !isOptionalNullableSafeInteger(value.nereidsId) ||
        !isOptionalNullableSafeInteger(value.destId) ||
        !Array.isArray(value.destIds) ||
        value.destIds.length > 128 ||
        !value.destIds.every(isSafeInteger) ||
        typeof value.known !== 'boolean' ||
        !isNonNegativeInteger(value.lineNumber) ||
        !isBoundedScalarRecord(value.planInfo)
    ) {
        return false;
    }
    if (value.headerAttributes !== undefined && !isBoundedScalarRecord(value.headerAttributes)) return false;
    if (value.timing !== undefined) {
        if (!isRecord(value.timing)) return false;
        if (value.timing.execTime !== undefined && !isExecTime(value.timing.execTime)) return false;
        if (value.timing.waitTime !== undefined && !isWaitTime(value.timing.waitTime)) return false;
    }
    if (value.metrics !== undefined) {
        if (!isRecord(value.metrics) || Object.keys(value.metrics).length > 64) return false;
        if (!Object.values(value.metrics).every(metric => metric === null || isAggregateMetric(metric))) return false;
    }
    if (value.analysis !== undefined) {
        if (!isRecord(value.analysis)) return false;
        for (const heat of [value.analysis.heat, value.analysis.waitHeat]) {
            if (heat !== undefined && heat !== null && !(typeof heat === 'number' && Number.isFinite(heat) && heat >= 0 && heat <= 1)) {
                return false;
            }
        }
        if (value.analysis.isBottleneck !== undefined && typeof value.analysis.isBottleneck !== 'boolean') {
            return false;
        }
    }
    return true;
}

function isDagEdge(value: unknown, nodeIds: Set<string>): boolean {
    if (!isRecord(value)) return false;
    const kinds = new Set([
        'PIPELINE_DATA',
        'EXCHANGE',
        'LOCAL_EXCHANGE',
        'MULTICAST',
        'BUILD_DEPENDENCY',
        'BLOCKING_DEPENDENCY',
    ]);
    return (
        isDagId(value.id) &&
        typeof value.kind === 'string' &&
        kinds.has(value.kind) &&
        isDagId(value.source) &&
        isDagId(value.target) &&
        nodeIds.has(value.source) &&
        nodeIds.has(value.target) &&
        (value.relationId === undefined ||
            value.relationId === null ||
            isBoundedString(value.relationId, MAX_DAG_ID_BYTES)) &&
        value.resolved === true &&
        (value.metadata === undefined || isBoundedScalarRecord(value.metadata, true))
    );
}

function isDagGroup(value: unknown, kind: 'fragment' | 'pipeline', nodeIds: Set<string>): boolean {
    if (!isRecord(value) || !isDagId(value.id) || !isNonNegativeInteger(value.number)) return false;
    if (!Array.isArray(value.nodeIds) || value.nodeIds.length > MAX_DAG_NODES) return false;
    if (!value.nodeIds.every(nodeId => isDagId(nodeId) && nodeIds.has(nodeId))) return false;
    if (kind === 'fragment') {
        return (
            Array.isArray(value.pipelineIds) &&
            value.pipelineIds.length <= MAX_DAG_NODES &&
            value.pipelineIds.every(isDagId)
        );
    }
    return (
        isDagId(value.fragmentId) &&
        isNonNegativeInteger(value.instanceNum) &&
        (value.waitWorkerTime === undefined ||
            (isRecord(value.waitWorkerTime) &&
                Object.values(value.waitWorkerTime).every(isNullableNonNegativeInteger)))
    );
}

function isUnresolvedReference(value: unknown, nodeIds: Set<string>): boolean {
    return (
        isRecord(value) &&
        isBoundedString(value.kind, 256) &&
        (value.relationId === undefined ||
            value.relationId === null ||
            isBoundedString(value.relationId, MAX_DAG_ID_BYTES)) &&
        isDagId(value.sourceNodeId) &&
        nodeIds.has(value.sourceNodeId) &&
        isBoundedString(value.reason, 1_024)
    );
}

function isWarning(value: unknown): boolean {
    if (!isRecord(value) || Object.keys(value).length > 16) return false;
    return Object.entries(value).every(([key, item]) => {
        if (!isBoundedString(key, 128)) return false;
        if (key === 'lineNumber') return isNonNegativeInteger(item);
        return item === null || isBoundedScalar(item);
    });
}

function isDagSummary(value: unknown, nodeCount: number, edgeCount: number): boolean {
    if (!isRecord(value)) return false;
    return (
        isNonNegativeInteger(value.fragmentCount) &&
        isNonNegativeInteger(value.pipelineCount) &&
        value.nodeCount === nodeCount &&
        value.edgeCount === edgeCount &&
        isNonNegativeInteger(value.unresolvedEdgeCount) &&
        (value.criticalNodeId === undefined || value.criticalNodeId === null || isDagId(value.criticalNodeId)) &&
        (value.maxExecTimeNs === undefined || isNullableNonNegativeInteger(value.maxExecTimeNs)) &&
        (value.maxWaitTimeNs === undefined || isNullableNonNegativeInteger(value.maxWaitTimeNs))
    );
}

function isProfileDag(value: unknown, expectedJobId: string): value is ProfileDag {
    if (
        !isRecord(value) ||
        value.schemaVersion !== '1.0' ||
        (value.parserVersion !== undefined && !isBoundedString(value.parserVersion, 128)) ||
        value.jobId !== expectedJobId ||
        !isRecord(value.profile) ||
        !isRecord(value.graph) ||
        value.graph.direction !== 'BOTTOM_TO_TOP' ||
        !Array.isArray(value.graph.nodes) ||
        !Array.isArray(value.graph.edges) ||
        value.graph.nodes.length > MAX_DAG_NODES ||
        value.graph.edges.length > MAX_DAG_EDGES ||
        !value.graph.nodes.every(isDagNode)
    ) {
        return false;
    }
    const nodeIds = new Set(value.graph.nodes.map(node => (node as Record<string, unknown>).id as string));
    if (nodeIds.size !== value.graph.nodes.length) return false;
    if (!value.graph.edges.every(edge => isDagEdge(edge, nodeIds))) return false;
    const edgeIds = new Set(value.graph.edges.map(edge => (edge as Record<string, unknown>).id as string));
    if (edgeIds.size !== value.graph.edges.length) return false;
    if (!Array.isArray(value.fragments) || !value.fragments.every(fragment => isDagGroup(fragment, 'fragment', nodeIds))) {
        return false;
    }
    if (!Array.isArray(value.pipelines) || !value.pipelines.every(pipeline => isDagGroup(pipeline, 'pipeline', nodeIds))) {
        return false;
    }
    if (
        !Array.isArray(value.unresolvedReferences) ||
        value.unresolvedReferences.length > MAX_DAG_EDGES ||
        !value.unresolvedReferences.every(reference => isUnresolvedReference(reference, nodeIds)) ||
        !Array.isArray(value.warnings) ||
        value.warnings.length > MAX_DAG_NODES + MAX_DAG_EDGES ||
        !value.warnings.every(isWarning) ||
        !isDagSummary(value.summary, value.graph.nodes.length, value.graph.edges.length)
    ) {
        return false;
    }
    return true;
}

function invalidResponse(): ProfileAnalysisApiError {
    return new ProfileAnalysisApiError(
        502,
        'INVALID_SERVER_RESPONSE',
        'The profile analysis service returned an invalid response.',
    );
}

function retryAfterMs(response: Response): number | undefined {
    const seconds = Number(response.headers.get('Retry-After'));
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : undefined;
}

function apiUrl(apiBaseUrl: string, path: string): string {
    return `${apiBaseUrl.replace(/\/+$/, '')}${path}`;
}

async function fetchJson(
    url: string,
    init: RequestInit,
    maxResponseBytes = MAX_API_RESPONSE_BYTES,
): Promise<{ response: Response; body: unknown }> {
    let response: Response;
    try {
        response = await fetch(url, init);
    } catch (error) {
        if (isAbortError(error)) {
            throw error;
        }
        throw new ProfileAnalysisApiError(
            0,
            'NETWORK_ERROR',
            'Unable to reach the profile analysis service. Please try again.',
        );
    }

    const body = await readJson(response, maxResponseBytes);
    if (!response.ok) {
        if (isRecord(body) && typeof body.code === 'string') {
            throw new ProfileAnalysisApiError(
                response.status,
                body.code,
                typeof body.message === 'string'
                    ? body.message
                    : `Profile analysis failed (${body.code}). Please try again.`,
                retryAfterMs(response),
            );
        }
        throw new ProfileAnalysisApiError(
            response.status,
            'HTTP_ERROR',
            `Profile analysis failed (HTTP ${response.status}). Please try again.`,
            retryAfterMs(response),
        );
    }
    return { response, body };
}

async function readJson(response: Response, maxResponseBytes: number): Promise<unknown> {
    if (!response.body) return undefined;

    try {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value.byteLength;
            if (totalBytes > maxResponseBytes) {
                await reader.cancel();
                throw invalidResponse();
            }
            chunks.push(value);
        }

        const bytes = new Uint8Array(totalBytes);
        let offset = 0;
        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
        }
        if (bytes.byteLength === 0) return undefined;
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } catch {
        if (response.bodyUsed) {
            // Do not expose parser, proxy, or upstream response details.
        }
        return undefined;
    }
}

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

export async function createAnalysisJob(
    apiBaseUrl: string,
    file: File,
    language: ResponseLanguage,
    clientRequestId: string,
    hcaptchaToken: string,
    signal?: AbortSignal,
): Promise<CreateAnalysisJobResponse> {
    if (!isUuid(clientRequestId)) throw invalidResponse();
    if (!hcaptchaToken.trim()) {
        throw new ProfileAnalysisApiError(
            400,
            'CAPTCHA_MISSING',
            'Complete the human verification before analyzing the Profile.',
        );
    }

    const formData = new FormData();
    formData.append('file', await prepareProfileFile(file));
    formData.append('language', language);
    formData.append('consent', 'true');
    formData.append('privacyNoticeVersion', PRIVACY_NOTICE_VERSION);
    formData.append('hcaptchaToken', hcaptchaToken);

    const { response, body } = await fetchJson(apiUrl(apiBaseUrl, ANALYSIS_JOBS_PATH), {
        method: 'POST',
        headers: { 'Idempotency-Key': clientRequestId },
        body: formData,
        signal,
    });

    if (
        response.status !== 202 ||
        !isRecord(body) ||
        !isJobId(body.jobId) ||
        !isAnalysisJobStatus(body.status)
    ) {
        throw invalidResponse();
    }

    const retryAfterSeconds = Number(response.headers.get('Retry-After'));
    return {
        jobId: body.jobId,
        status: body.status,
        retryAfterMs:
            Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                ? retryAfterSeconds * 1_000
                : DEFAULT_POLL_INTERVAL_MS,
    };
}

export async function getAnalysisJobByClientRequestId(
    apiBaseUrl: string,
    clientRequestId: string,
    signal?: AbortSignal,
): Promise<RecoveredAnalysisJobResponse> {
    if (!isUuid(clientRequestId)) throw invalidResponse();

    const { body } = await fetchJson(
        apiUrl(apiBaseUrl, `${ANALYSIS_JOB_REQUESTS_PATH}/${encodeURIComponent(clientRequestId)}`),
        { method: 'GET', signal },
    );
    if (!isRecord(body) || !isJobId(body.jobId) || !isAnalysisJobStatus(body.status)) {
        throw invalidResponse();
    }
    if (body.dagStatus === undefined && body.dagError === undefined) {
        return { jobId: body.jobId, status: body.status };
    }
    return { jobId: body.jobId, status: body.status, ...parseDagJobState(body) };
}

export async function getAnalysisJob(
    apiBaseUrl: string,
    jobId: string,
    signal?: AbortSignal,
): Promise<AnalysisJobSnapshot> {
    const { body } = await fetchJson(
        apiUrl(apiBaseUrl, `${ANALYSIS_JOBS_PATH}/${encodeURIComponent(jobId)}`),
        { method: 'GET', signal },
    );

    if (!isRecord(body) || body.jobId !== jobId) {
        throw invalidResponse();
    }
    const dagState = parseDagJobState(body);

    switch (body.status) {
        case 'QUEUED':
            if (!Number.isInteger(body.jobsAhead) || (body.jobsAhead as number) < 0) throw invalidResponse();
            return { jobId, status: 'QUEUED', jobsAhead: body.jobsAhead as number, ...dagState };
        case 'RUNNING':
            return { jobId, status: 'RUNNING', ...dagState };
        case 'COMPLETED':
            if (!isAgentMessage(body.result)) throw invalidResponse();
            return { jobId, status: 'COMPLETED', result: body.result, ...dagState };
        case 'FAILED':
            if (!isApiErrorBody(body.error)) throw invalidResponse();
            return { jobId, status: 'FAILED', error: body.error, ...dagState };
        default:
            throw invalidResponse();
    }
}

export async function getProfileDag(
    apiBaseUrl: string,
    jobId: string,
    signal?: AbortSignal,
): Promise<ProfileDagFetchResult> {
    if (!isJobId(jobId)) throw invalidResponse();
    const { response, body } = await fetchJson(
        apiUrl(apiBaseUrl, `${ANALYSIS_JOBS_PATH}/${encodeURIComponent(jobId)}/dag`),
        { method: 'GET', signal },
        MAX_DAG_RESPONSE_BYTES,
    );

    if (response.status === 202) {
        if (
            !isRecord(body) ||
            body.jobId !== jobId ||
            (body.dagStatus !== 'PENDING' && body.dagStatus !== 'PARSING')
        ) {
            throw invalidResponse();
        }
        return {
            jobId,
            dagStatus: body.dagStatus,
            retryAfterMs: retryAfterMs(response) ?? 1_000,
        };
    }
    if (response.status !== 200 || !isProfileDag(body, jobId)) throw invalidResponse();
    return { dagStatus: 'READY', dag: body };
}
