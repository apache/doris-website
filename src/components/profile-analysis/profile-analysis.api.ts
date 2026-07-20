import type { AgentMessage, ApiErrorBody } from './profile-analysis.types';

const ANALYZE_PATH = '/api/profile/analyze';

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

export async function analyzeProfile(
    apiBaseUrl: string,
    file: File,
    signal?: AbortSignal,
): Promise<AgentMessage> {
    const formData = new FormData();
    formData.append('file', file);

    let response: Response;
    try {
        response = await fetch(`${apiBaseUrl.replace(/\/+$/, '')}${ANALYZE_PATH}`, {
            method: 'POST',
            body: formData,
            signal,
        });
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

    if (!isAgentMessage(body)) {
        throw new ProfileAnalysisApiError(
            502,
            'INVALID_SERVER_RESPONSE',
            'The profile analysis service returned an invalid response.',
        );
    }

    return body;
}
