import type { ResponseLanguage } from './profile-analysis.types';

export const ACTIVE_ANALYSIS_STORAGE_KEY = 'profile-analysis.active-job.v1';
export const ACTIVE_ANALYSIS_STORAGE_VERSION = 1;

const MAX_RECOVERY_RECORD_AGE_MS = 24 * 60 * 60 * 1_000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1_000;
const MAX_FILE_NAME_LENGTH = 255;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_STORAGE_FIELDS = new Set([
    'version',
    'clientRequestId',
    'jobId',
    'createdAt',
    'fileName',
    'language',
]);

export interface StoredAnalysisJob {
    version: 1;
    clientRequestId: string;
    jobId?: string;
    createdAt: number;
    fileName?: string;
    language: ResponseLanguage;
}

export interface StoredAnalysisJobReadResult {
    available: boolean;
    record: StoredAnalysisJob | null;
}

function browserSessionStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
}

export function isUuid(value: unknown): value is string {
    return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function createClientRequestId(): string {
    const randomUuid = globalThis.crypto?.randomUUID;
    if (typeof randomUuid !== 'function') {
        throw new Error('This browser cannot create a secure analysis request identifier.');
    }
    return randomUuid.call(globalThis.crypto);
}

export function readStoredAnalysisJob(now = Date.now()): StoredAnalysisJobReadResult {
    let storage: Storage | null;
    try {
        storage = browserSessionStorage();
        if (!storage) return { available: false, record: null };
        const raw = storage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY);
        if (raw === null) return { available: true, record: null };

        const record = parseStoredAnalysisJob(raw, now);
        if (!record) storage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY);
        return { available: true, record };
    } catch {
        return { available: false, record: null };
    }
}

export function writeStoredAnalysisJob(record: StoredAnalysisJob): boolean {
    if (!isStoredAnalysisJob(record, Date.now())) return false;
    try {
        const storage = browserSessionStorage();
        if (!storage) return false;
        storage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, JSON.stringify(record));
        return true;
    } catch {
        return false;
    }
}

export function clearStoredAnalysisJob(): boolean {
    try {
        const storage = browserSessionStorage();
        if (!storage) return false;
        storage.removeItem(ACTIVE_ANALYSIS_STORAGE_KEY);
        return true;
    } catch {
        return false;
    }
}

export function parseStoredAnalysisJob(raw: string, now = Date.now()): StoredAnalysisJob | null {
    try {
        const value: unknown = JSON.parse(raw);
        return isStoredAnalysisJob(value, now) ? value : null;
    } catch {
        return null;
    }
}

function isStoredAnalysisJob(value: unknown, now: number): value is StoredAnalysisJob {
    if (typeof value !== 'object' || value === null) return false;
    const record = value as Record<string, unknown>;
    if (Object.keys(record).some(key => !ALLOWED_STORAGE_FIELDS.has(key))) return false;
    if (
        record.version !== ACTIVE_ANALYSIS_STORAGE_VERSION ||
        !isUuid(record.clientRequestId) ||
        !Number.isInteger(record.createdAt) ||
        (record.createdAt as number) <= 0 ||
        (record.createdAt as number) > now + MAX_CLOCK_SKEW_MS ||
        now - (record.createdAt as number) > MAX_RECOVERY_RECORD_AGE_MS ||
        (record.language !== 'en' && record.language !== 'zh-CN')
    ) {
        return false;
    }
    if (record.jobId !== undefined && !isUuid(record.jobId)) return false;
    if (
        record.fileName !== undefined &&
        (typeof record.fileName !== 'string' ||
            record.fileName.length === 0 ||
            record.fileName.length > MAX_FILE_NAME_LENGTH ||
            /[/\\\u0000-\u001f\u007f]/.test(record.fileName))
    ) {
        return false;
    }
    return true;
}
