import type {
    AgentMessage,
    AnalysisJobSnapshot,
    AnalysisJobStatus,
    ApiErrorBody,
    CreateAnalysisJobResponse,
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
    return { jobId: body.jobId, status: body.status };
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
