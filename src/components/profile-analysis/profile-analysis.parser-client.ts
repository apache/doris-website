import { MAX_PARSER_BYTES, ProfileParserError, type ProfileParserErrorCode } from './profile-analysis.parser';
import type { ProfileParseRequest, ProfileParseResponse } from './profile-analysis.parser-protocol';
import type { ProfileGraphIR } from './profile-analysis.types';

export const DEFAULT_PROFILE_PARSE_TIMEOUT_MS = 8_000;

export interface ProfileParserWorker {
    onmessage: ((event: MessageEvent<ProfileParseResponse>) => void) | null;
    onerror: ((event: ErrorEvent) => void) | null;
    postMessage(message: ProfileParseRequest): void;
    terminate(): void;
}

export type ProfileParserWorkerFactory = () => ProfileParserWorker;

export interface ProfileParseOperation {
    requestId: string;
    promise: Promise<ProfileGraphIR>;
    cancel(): void;
}

export function profileParserErrorMessage(code: ProfileParserErrorCode): string {
    if (code === 'DAG_TOO_LARGE') return 'This execution graph is too large to display.';
    if (code === 'DAG_UNAVAILABLE') return 'An execution graph is not available for this Profile.';
    return 'The execution graph could not be generated.';
}

export function startProfileParse(
    file: File,
    createWorker: ProfileParserWorkerFactory,
    timeoutMs = DEFAULT_PROFILE_PARSE_TIMEOUT_MS,
): ProfileParseOperation {
    const requestId = crypto.randomUUID();
    let worker: ProfileParserWorker | null = null;
    let settled = false;
    let rejectPromise: ((reason: unknown) => void) | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
        if (timeout !== null) clearTimeout(timeout);
        timeout = null;
        worker?.terminate();
        worker = null;
    };
    const promise = new Promise<ProfileGraphIR>((resolve, reject) => {
        rejectPromise = reject;
        if (file.size > MAX_PARSER_BYTES) {
            settled = true;
            reject(new ProfileParserError('DAG_TOO_LARGE', profileParserErrorMessage('DAG_TOO_LARGE')));
            return;
        }
        try {
            worker = createWorker();
        } catch {
            settled = true;
            reject(new ProfileParserError('DAG_PARSE_FAILED', profileParserErrorMessage('DAG_PARSE_FAILED')));
            return;
        }
        worker.onmessage = event => {
            if (settled || event.data.requestId !== requestId) return;
            settled = true;
            finish();
            if (event.data.type === 'PARSE_SUCCESS') resolve(event.data.dag);
            else reject(new ProfileParserError(event.data.code, profileParserErrorMessage(event.data.code)));
        };
        worker.onerror = () => {
            if (settled) return;
            settled = true;
            finish();
            reject(new ProfileParserError('DAG_PARSE_FAILED', profileParserErrorMessage('DAG_PARSE_FAILED')));
        };
        timeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            finish();
            reject(new ProfileParserError('DAG_PARSE_FAILED', 'The execution graph parser timed out.'));
        }, timeoutMs);
        worker.postMessage({ type: 'PARSE_PROFILE', requestId, file });
    });

    return {
        requestId,
        promise,
        cancel() {
            if (settled) return;
            settled = true;
            finish();
            rejectPromise?.(new DOMException('The operation was aborted.', 'AbortError'));
        },
    };
}

