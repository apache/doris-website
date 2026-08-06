import { ProfileAnalysisApiError } from './profile-analysis.api';
import type {
    AnalysisJobSnapshot,
    CreateAnalysisJobResponse,
    RecoveredAnalysisJobResponse,
} from './profile-analysis.types';

export const DEFAULT_ANALYSIS_POLL_INTERVAL_MS = 2_000;
export const CREATE_RECOVERY_GRACE_MS = 60_000;
export const RECOVERING_FAILURE_THRESHOLD = 3;
const MAX_RETRY_DELAY_MS = 30_000;

export function isRetryableTransportFailure(reason: unknown): boolean {
    return (
        reason instanceof ProfileAnalysisApiError &&
        (reason.code === 'NETWORK_ERROR' || reason.status >= 500)
    );
}

export function retryDelayMs(
    failureCount: number,
    baseDelayMs = DEFAULT_ANALYSIS_POLL_INTERVAL_MS,
    randomValue = Math.random(),
): number {
    const exponent = Math.max(0, Math.min(failureCount - 1, 10));
    const uncappedDelay = baseDelayMs * 2 ** exponent;
    const cappedDelay = Math.min(uncappedDelay, MAX_RETRY_DELAY_MS);
    const jitterMultiplier = 0.8 + Math.min(1, Math.max(0, randomValue)) * 0.4;
    return Math.max(1, Math.round(cappedDelay * jitterMultiplier));
}

interface CreateOrRecoverOperations {
    create(): Promise<CreateAnalysisJobResponse>;
    recover(): Promise<RecoveredAnalysisJobResponse>;
    wait(milliseconds: number): Promise<void>;
    onRecovering(): void;
    createdAt: number;
    now?: () => number;
    random?: () => number;
}

export async function createOrRecoverAnalysisJob(
    operations: CreateOrRecoverOperations,
): Promise<CreateAnalysisJobResponse> {
    try {
        return await operations.create();
    } catch (createFailure) {
        // hCaptcha tokens are single-use. A verifier outage is authoritative and
        // retrying/recovering would hide the actionable backend error.
        if (
            createFailure instanceof ProfileAnalysisApiError &&
            createFailure.code === 'CAPTCHA_UNAVAILABLE'
        ) {
            throw createFailure;
        }
        if (!isRetryableTransportFailure(createFailure)) throw createFailure;
    }

    // The POST may have reached Spring even when the browser did not receive the
    // response. Never replay it with the consumed hCaptcha token. Resolve the
    // original Idempotency-Key through the read-only recovery endpoint instead.
    operations.onRecovering();
    const recovered = await recoverAnalysisJobWithinGrace({
        recover: operations.recover,
        wait: operations.wait,
        onRecovering: operations.onRecovering,
        createdAt: operations.createdAt,
        now: operations.now,
        random: operations.random,
    });
    return {
        ...recovered,
        retryAfterMs: DEFAULT_ANALYSIS_POLL_INTERVAL_MS,
    };
}

interface RecoverWithinGraceOperations {
    recover(): Promise<RecoveredAnalysisJobResponse>;
    wait(milliseconds: number): Promise<void>;
    onRecovering(): void;
    createdAt: number;
    now?: () => number;
    random?: () => number;
}

export async function recoverAnalysisJobWithinGrace(
    operations: RecoverWithinGraceOperations,
): Promise<RecoveredAnalysisJobResponse> {
    let failureCount = 0;
    const now = operations.now ?? Date.now;

    while (true) {
        try {
            return await operations.recover();
        } catch (reason) {
            const isNotFound =
                reason instanceof ProfileAnalysisApiError &&
                reason.status === 404;
            if (!isNotFound && !isRetryableTransportFailure(reason)) throw reason;

            if (isNotFound && now() - operations.createdAt >= CREATE_RECOVERY_GRACE_MS) {
                throw reason;
            }

            failureCount += 1;
            operations.onRecovering();
            const retryAfter =
                reason instanceof ProfileAnalysisApiError
                    ? reason.retryAfterMs
                    : undefined;
            await operations.wait(
                Math.max(
                    retryAfter ?? 0,
                    retryDelayMs(
                        failureCount,
                        DEFAULT_ANALYSIS_POLL_INTERVAL_MS,
                        operations.random?.(),
                    ),
                ),
            );
        }
    }
}

interface PollWithRecoveryOperations {
    get(): Promise<AnalysisJobSnapshot>;
    wait(milliseconds: number): Promise<void>;
    onRecovering(): void;
    onProgress(job: Extract<AnalysisJobSnapshot, { status: 'QUEUED' | 'RUNNING' }>): void;
    onSnapshot?(job: AnalysisJobSnapshot): void | Promise<void>;
    isComplete?(job: AnalysisJobSnapshot): boolean;
    pollIntervalMs: number;
    random?: () => number;
}

export async function pollAnalysisJobWithRecovery(
    operations: PollWithRecoveryOperations,
): Promise<AnalysisJobSnapshot> {
    let consecutiveFailures = 0;
    while (true) {
        try {
            const job = await operations.get();
            consecutiveFailures = 0;
            await operations.onSnapshot?.(job);
            const isComplete = operations.isComplete
                ? operations.isComplete(job)
                : job.status === 'COMPLETED' || job.status === 'FAILED';
            if (isComplete) {
                return job;
            }
            if (job.status === 'QUEUED' || job.status === 'RUNNING') {
                operations.onProgress(job);
            }
            await operations.wait(operations.pollIntervalMs);
        } catch (reason) {
            if (!isRetryableTransportFailure(reason)) throw reason;
            consecutiveFailures += 1;
            if (consecutiveFailures >= RECOVERING_FAILURE_THRESHOLD) {
                operations.onRecovering();
            }
            await operations.wait(
                retryDelayMs(
                    consecutiveFailures,
                    operations.pollIntervalMs,
                    operations.random?.(),
                ),
            );
        }
    }
}
