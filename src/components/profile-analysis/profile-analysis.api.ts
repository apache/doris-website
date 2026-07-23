import type {
    AgentMessage,
    AnalysisJobSnapshot,
    ApiErrorBody,
    CreateAnalysisJobResponse,
    ResponseLanguage,
} from './profile-analysis.types';

const ANALYSIS_JOBS_PATH = '/api/profile/analysis-jobs';
const DEFAULT_POLL_INTERVAL_MS = 2_000;

export class ProfileAnalysisApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
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
        value.type === 'agent_message' &&
        typeof value.text === 'string'
    );
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
    return isRecord(value) && typeof value.code === 'string' && typeof value.message === 'string';
}

function isJobId(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

function invalidResponse(): ProfileAnalysisApiError {
    return new ProfileAnalysisApiError(
        502,
        'INVALID_SERVER_RESPONSE',
        'The profile analysis service returned an invalid response.',
    );
}

function apiUrl(apiBaseUrl: string, path: string): string {
    return `${apiBaseUrl.replace(/\/+$/, '')}${path}`;
}

async function fetchJson(url: string, init: RequestInit): Promise<{ response: Response; body: unknown }> {
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

    const body = await readJson(response);
    if (!response.ok) {
        if (isApiErrorBody(body)) {
            throw new ProfileAnalysisApiError(response.status, body.code, body.message);
        }
        throw new ProfileAnalysisApiError(
            response.status,
            'HTTP_ERROR',
            `Profile analysis failed (HTTP ${response.status}). Please try again.`,
        );
    }
    return { response, body };
}

async function readJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
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
    signal?: AbortSignal,
): Promise<CreateAnalysisJobResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    const { response, body } = await fetchJson(apiUrl(apiBaseUrl, ANALYSIS_JOBS_PATH), {
            method: 'POST',
            body: formData,
            signal,
        });

    if (
        response.status !== 202 ||
        !isRecord(body) ||
        !isJobId(body.jobId) ||
        (body.status !== 'QUEUED' && body.status !== 'RUNNING')
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

    switch (body.status) {
        case 'QUEUED':
            if (!Number.isInteger(body.jobsAhead) || (body.jobsAhead as number) < 0) throw invalidResponse();
            return { jobId, status: 'QUEUED', jobsAhead: body.jobsAhead as number };
        case 'RUNNING':
            return { jobId, status: 'RUNNING' };
        case 'COMPLETED':
            if (!isAgentMessage(body.result)) throw invalidResponse();
            return { jobId, status: 'COMPLETED', result: body.result };
        case 'FAILED':
            if (!isApiErrorBody(body.error)) throw invalidResponse();
            return { jobId, status: 'FAILED', error: body.error };
        default:
            throw invalidResponse();
    }
}
