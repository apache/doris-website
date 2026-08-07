import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
    createAnalysisJob,
    getAnalysisJob,
    getAnalysisJobByClientRequestId,
    ProfileAnalysisApiError,
} from './profile-analysis.api';
import {
    clearStoredAnalysisJob,
    createClientRequestId,
    readStoredAnalysisJob,
    type StoredAnalysisJob,
    writeStoredAnalysisJob,
} from './profile-analysis.storage';
import {
    createOrRecoverAnalysisJob,
    DEFAULT_ANALYSIS_POLL_INTERVAL_MS,
    pollAnalysisJobWithRecovery,
    recoverAnalysisJobWithinGrace,
} from './profile-analysis.recovery';
import type {
    AgentMessage,
    AnalysisJobSnapshot,
    AnalysisJobStatus,
    AnalysisState,
    ResponseLanguage,
} from './profile-analysis.types';

const STORAGE_UNAVAILABLE_WARNING = 'This analysis cannot be restored after a page refresh in this browser.';

interface ProfileAnalysisSnapshot {
    state: AnalysisState;
    file: File | null;
    language: ResponseLanguage;
    jobId: string | null;
    jobsAhead: number | null;
    result: AgentMessage | null;
    error: string | null;
    recoveryWarning: string | null;
}

type ProfileAnalysisAction =
    | { type: 'restore_empty' }
    | { type: 'restore_record'; jobId: string | null; language: ResponseLanguage }
    | { type: 'recovering' }
    | { type: 'storage_unavailable' }
    | { type: 'select'; file: File | null }
    | { type: 'set_language'; language: ResponseLanguage }
    | { type: 'start' }
    | { type: 'job_created'; jobId: string; status: AnalysisJobStatus }
    | { type: 'job_status'; job: AnalysisJobSnapshot }
    | { type: 'complete'; result: AgentMessage }
    | { type: 'fail'; error: string };

export const initialProfileAnalysisSnapshot: ProfileAnalysisSnapshot = {
    state: 'restoring',
    file: null,
    language: 'en',
    jobId: null,
    jobsAhead: null,
    result: null,
    error: null,
    recoveryWarning: null,
};

export function profileAnalysisReducer(
    snapshot: ProfileAnalysisSnapshot,
    action: ProfileAnalysisAction,
): ProfileAnalysisSnapshot {
    switch (action.type) {
        case 'restore_empty':
            return snapshot.state === 'restoring' ? { ...snapshot, state: 'idle' } : snapshot;
        case 'restore_record':
            return {
                ...snapshot,
                state: 'restoring',
                file: null,
                language: action.language,
                jobId: action.jobId,
                jobsAhead: null,
                result: null,
                error: null,
            };
        case 'recovering':
            return {
                ...snapshot,
                state: 'recovering',
                jobsAhead: null,
                error: null,
            };
        case 'storage_unavailable':
            return { ...snapshot, recoveryWarning: STORAGE_UNAVAILABLE_WARNING };
        case 'select':
            if (isBusy(snapshot.state)) {
                return snapshot;
            }
            return {
                state: action.file ? 'ready' : 'idle',
                file: action.file,
                language: snapshot.language,
                result: null,
                error: null,
                jobId: null,
                jobsAhead: null,
                recoveryWarning: snapshot.recoveryWarning,
            };
        case 'set_language':
            if (isBusy(snapshot.state)) {
                return snapshot;
            }
            return {
                ...snapshot,
                language: action.language,
                state: snapshot.file ? 'ready' : 'idle',
                jobId: null,
                jobsAhead: null,
                result: null,
                error: null,
            };
        case 'start':
            if (!snapshot.file || isBusy(snapshot.state)) {
                return snapshot;
            }
            return {
                ...snapshot,
                state: 'submitting',
                jobId: null,
                jobsAhead: null,
                result: null,
                error: null,
            };
        case 'job_created':
            return {
                ...snapshot,
                // A replayed idempotent POST may report a terminal status without
                // carrying the result body. The authoritative GET below resolves it.
                state: action.status === 'QUEUED' ? 'queued' : 'analyzing',
                jobId: action.jobId,
                jobsAhead: null,
            };
        case 'job_status': {
            if (action.job.status === 'QUEUED') {
                return {
                    ...snapshot,
                    state: 'queued',
                    jobId: action.job.jobId,
                    jobsAhead: action.job.jobsAhead,
                };
            }
            if (action.job.status === 'RUNNING') {
                return {
                    ...snapshot,
                    state: 'analyzing',
                    jobId: action.job.jobId,
                    jobsAhead: null,
                };
            }
            if (action.job.status === 'COMPLETED') {
                return {
                    ...snapshot,
                    state: 'completed',
                    jobId: action.job.jobId,
                    jobsAhead: null,
                    result: action.job.result,
                    error: null,
                };
            }
            return {
                ...snapshot,
                state: 'failed',
                jobId: action.job.jobId,
                jobsAhead: null,
                result: null,
                error: action.job.error.message,
            };
        }
        case 'complete':
            return {
                ...snapshot,
                state: 'completed',
                result: action.result,
                error: null,
                jobsAhead: null,
            };
        case 'fail':
            return {
                ...snapshot,
                state: 'failed',
                result: null,
                error: action.error,
                jobsAhead: null,
            };
    }
}

function isBusy(state: AnalysisState): boolean {
    return (
        state === 'restoring' ||
        state === 'recovering' ||
        state === 'submitting' ||
        state === 'queued' ||
        state === 'analyzing'
    );
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const handleAbort = () => {
            window.clearTimeout(timeout);
            reject(new DOMException('The operation was aborted.', 'AbortError'));
        };
        const timeout = window.setTimeout(() => {
            signal.removeEventListener('abort', handleAbort);
            resolve();
        }, milliseconds);
        signal.addEventListener('abort', handleAbort, { once: true });
    });
}

function isAbortError(reason: unknown): boolean {
    return reason instanceof Error && reason.name === 'AbortError';
}

export function getProfileAnalysisErrorMessage(reason: unknown): string {
    if (reason instanceof ProfileAnalysisApiError) {
        switch (reason.code) {
            case 'CAPTCHA_MISSING':
                return 'Complete the human verification before analyzing the Profile.';
            case 'CAPTCHA_INVALID':
                return 'Human verification failed or expired. Complete it again and retry.';
            case 'CAPTCHA_UNAVAILABLE':
                return 'Human verification is temporarily unavailable. Please try again later.';
        }
    }
    if (reason instanceof Error) {
        return reason.message;
    }
    return 'Profile analysis failed. Please try again.';
}

export function useProfileAnalysis(apiBaseUrl: string) {
    const [snapshot, dispatch] = useReducer(profileAnalysisReducer, initialProfileAnalysisSnapshot);
    const abortControllerRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    const releaseController = useCallback((controller: AbortController) => {
        if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
        }
    }, []);

    const pollJob = useCallback(
        async (jobId: string, pollIntervalMs: number, controller: AbortController): Promise<void> => {
            let settled = false;
            await pollAnalysisJobWithRecovery({
                get: () => getAnalysisJob(apiBaseUrl, jobId, controller.signal),
                wait: milliseconds => wait(milliseconds, controller.signal),
                onRecovering: () => {
                    if (mountedRef.current && abortControllerRef.current === controller) {
                        dispatch({ type: 'recovering' });
                    }
                },
                onProgress: () => {},
                onSnapshot: job => {
                    if (!mountedRef.current || abortControllerRef.current !== controller) return;
                    settled = job.status === 'COMPLETED' || job.status === 'FAILED';
                    dispatch({ type: 'job_status', job });
                },
                isComplete: () => settled,
                pollIntervalMs,
            });
        },
        [apiBaseUrl],
    );

    const selectFile = useCallback((file: File | null) => {
        if (abortControllerRef.current) {
            return;
        }
        clearStoredAnalysisJob();
        dispatch({ type: 'select', file });
    }, []);

    const setLanguage = useCallback((language: ResponseLanguage) => {
        if (abortControllerRef.current) {
            return;
        }
        clearStoredAnalysisJob();
        dispatch({ type: 'set_language', language });
    }, []);

    const analyze = useCallback(async (hcaptchaToken: string, resetCaptcha: () => void) => {
        if (!snapshot.file || abortControllerRef.current || !hcaptchaToken.trim()) {
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        dispatch({ type: 'start' });

        try {
            const clientRequestId = createClientRequestId();
            const recoveryRecord: StoredAnalysisJob = {
                version: 1,
                clientRequestId,
                createdAt: Date.now(),
                fileName: snapshot.file.name,
                language: snapshot.language,
            };
            if (!writeStoredAnalysisJob(recoveryRecord)) {
                dispatch({ type: 'storage_unavailable' });
            }

            let captchaReset = false;
            const resetCaptchaAfterCreateAttempt = () => {
                if (captchaReset) return;
                captchaReset = true;
                resetCaptcha();
            };
            const created = await createOrRecoverAnalysisJob({
                create: async () => {
                    try {
                        return await createAnalysisJob(
                            apiBaseUrl,
                            snapshot.file as File,
                            snapshot.language,
                            clientRequestId,
                            hcaptchaToken,
                            controller.signal,
                        );
                    } finally {
                        // Reset as soon as the single POST settles. Recovery and job
                        // polling may continue for minutes and do not use this token.
                        resetCaptchaAfterCreateAttempt();
                    }
                },
                recover: () =>
                    getAnalysisJobByClientRequestId(
                        apiBaseUrl,
                        clientRequestId,
                        controller.signal,
                    ),
                wait: milliseconds => wait(milliseconds, controller.signal),
                onRecovering: () => {
                    if (mountedRef.current && abortControllerRef.current === controller) {
                        dispatch({ type: 'recovering' });
                    }
                },
                createdAt: recoveryRecord.createdAt,
            });
            if (!mountedRef.current || abortControllerRef.current !== controller) return;

            const storedWithJobId: StoredAnalysisJob = { ...recoveryRecord, jobId: created.jobId };
            if (!writeStoredAnalysisJob(storedWithJobId)) {
                dispatch({ type: 'storage_unavailable' });
            }
            dispatch({ type: 'job_created', jobId: created.jobId, status: created.status });
            await pollJob(created.jobId, created.retryAfterMs, controller);
        } catch (reason) {
            if (
                reason instanceof ProfileAnalysisApiError &&
                ((reason.status >= 400 && reason.status < 500) ||
                    reason.code === 'CAPTCHA_UNAVAILABLE')
            ) {
                clearStoredAnalysisJob();
            }
            if (
                !isAbortError(reason) &&
                mountedRef.current &&
                abortControllerRef.current === controller
            ) {
                dispatch({ type: 'fail', error: getProfileAnalysisErrorMessage(reason) });
            }
        } finally {
            releaseController(controller);
        }
    }, [apiBaseUrl, pollJob, releaseController, snapshot.file, snapshot.language]);

    useEffect(() => {
        mountedRef.current = true;
        const stored = readStoredAnalysisJob();
        if (!stored.available) {
            dispatch({ type: 'storage_unavailable' });
        }
        if (!stored.record) {
            dispatch({ type: 'restore_empty' });
            return () => {
                mountedRef.current = false;
            };
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        dispatch({
            type: 'restore_record',
            jobId: stored.record.jobId ?? null,
            language: stored.record.language,
        });

        const restore = async () => {
            try {
                let jobId = stored.record?.jobId;
                if (!jobId && stored.record) {
                    const recovered = await recoverAnalysisJobWithinGrace({
                        recover: () =>
                            getAnalysisJobByClientRequestId(
                                apiBaseUrl,
                                stored.record!.clientRequestId,
                                controller.signal,
                            ),
                        wait: milliseconds => wait(milliseconds, controller.signal),
                        onRecovering: () => {
                            if (mountedRef.current && abortControllerRef.current === controller) {
                                dispatch({ type: 'recovering' });
                            }
                        },
                        createdAt: stored.record.createdAt,
                    });
                    jobId = recovered.jobId;
                    if (!writeStoredAnalysisJob({ ...stored.record, jobId })) {
                        dispatch({ type: 'storage_unavailable' });
                    }
                    if (!mountedRef.current || abortControllerRef.current !== controller) return;
                    dispatch({ type: 'restore_record', jobId, language: stored.record.language });
                }
                if (!jobId) {
                    throw new ProfileAnalysisApiError(
                        404,
                        'ANALYSIS_JOB_NOT_FOUND',
                        'The previous analysis could not be recovered. Please select the file and try again.',
                    );
                }
                await pollJob(jobId, DEFAULT_ANALYSIS_POLL_INTERVAL_MS, controller);
            } catch (reason) {
                if (reason instanceof ProfileAnalysisApiError && reason.status === 404) {
                    clearStoredAnalysisJob();
                }
                if (
                    !isAbortError(reason) &&
                    mountedRef.current &&
                    abortControllerRef.current === controller
                ) {
                    dispatch({ type: 'fail', error: getProfileAnalysisErrorMessage(reason) });
                }
            } finally {
                releaseController(controller);
            }
        };

        void restore();
        return () => {
            mountedRef.current = false;
            controller.abort();
            releaseController(controller);
        };
    }, [apiBaseUrl, pollJob, releaseController]);

    return {
        ...snapshot,
        isBusy: isBusy(snapshot.state),
        selectFile,
        setLanguage,
        analyze,
    };
}
