import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
    createAnalysisJob,
    getProfileDag,
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
    isRetryableTransportFailure,
    pollAnalysisJobWithRecovery,
    recoverAnalysisJobWithinGrace,
    retryDelayMs,
} from './profile-analysis.recovery';
import type {
    AgentMessage,
    AnalysisJobSnapshot,
    AnalysisJobStatus,
    AnalysisState,
    DagStatus,
    DagUiState,
    ProfileDagResponse,
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
    dagState: DagUiState;
    dag: ProfileDagResponse | null;
    dagError: string | null;
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
    | { type: 'dag_status'; status: Extract<DagStatus, 'PENDING' | 'PARSING'> }
    | { type: 'dag_loading'; error?: string | null }
    | { type: 'dag_loaded'; dag: ProfileDagResponse }
    | { type: 'dag_failed'; state: Extract<DagUiState, 'unavailable' | 'failed'>; error: string }
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
    dagState: 'idle',
    dag: null,
    dagError: null,
    recoveryWarning: null,
};

function dagErrorMessage(status: Extract<DagStatus, 'UNAVAILABLE' | 'FAILED'>, code: string | null): string {
    if (code === 'DAG_TOO_LARGE') {
        return 'This execution graph is too large to display.';
    }
    if (status === 'UNAVAILABLE') {
        return 'An execution graph is not available for this Profile.';
    }
    return 'The execution graph could not be generated.';
}

function dagStateFromJob(snapshot: ProfileAnalysisSnapshot, job: AnalysisJobSnapshot): Pick<
    ProfileAnalysisSnapshot,
    'dagState' | 'dagError'
> {
    if (snapshot.dag) return { dagState: 'ready', dagError: null };
    // A client-side schema or rendering failure is terminal for this DAG. The
    // backend continues to report READY on later job polls, but that must not
    // turn the terminal error back into an endless local loading state.
    if (snapshot.dagState === 'failed' || snapshot.dagState === 'unavailable') {
        return { dagState: snapshot.dagState, dagError: snapshot.dagError };
    }
    if (job.dagStatus === 'PENDING') return { dagState: 'pending', dagError: null };
    if (job.dagStatus === 'PARSING') return { dagState: 'parsing', dagError: null };
    if (job.dagStatus === 'READY') return { dagState: 'loading', dagError: null };
    if (job.dagStatus === 'UNAVAILABLE') {
        return { dagState: 'unavailable', dagError: dagErrorMessage('UNAVAILABLE', job.dagError) };
    }
    return { dagState: 'failed', dagError: dagErrorMessage('FAILED', job.dagError) };
}

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
                dagState: 'idle',
                dag: null,
                dagError: null,
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
            if (isSnapshotBusy(snapshot)) {
                return snapshot;
            }
            return {
                state: action.file ? 'ready' : 'idle',
                file: action.file,
                language: snapshot.language,
                result: null,
                error: null,
                dagState: 'idle',
                dag: null,
                dagError: null,
                jobId: null,
                jobsAhead: null,
                recoveryWarning: snapshot.recoveryWarning,
            };
        case 'set_language':
            if (isSnapshotBusy(snapshot)) {
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
                dagState: 'idle',
                dag: null,
                dagError: null,
            };
        case 'start':
            if (!snapshot.file || isSnapshotBusy(snapshot)) {
                return snapshot;
            }
            return {
                ...snapshot,
                state: 'submitting',
                jobId: null,
                jobsAhead: null,
                result: null,
                error: null,
                dagState: 'pending',
                dag: null,
                dagError: null,
            };
        case 'job_created':
            return {
                ...snapshot,
                // A replayed idempotent POST may report a terminal status without
                // carrying the result body. The authoritative GET below resolves it.
                state: action.status === 'QUEUED' ? 'queued' : 'analyzing',
                jobId: action.jobId,
                jobsAhead: null,
                dagState: 'pending',
                dag: null,
                dagError: null,
            };
        case 'job_status': {
            const dagSnapshot = dagStateFromJob(snapshot, action.job);
            if (action.job.status === 'QUEUED') {
                return {
                    ...snapshot,
                    ...dagSnapshot,
                    state: 'queued',
                    jobId: action.job.jobId,
                    jobsAhead: action.job.jobsAhead,
                };
            }
            if (action.job.status === 'RUNNING') {
                return {
                    ...snapshot,
                    ...dagSnapshot,
                    state: 'analyzing',
                    jobId: action.job.jobId,
                    jobsAhead: null,
                };
            }
            if (action.job.status === 'COMPLETED') {
                return {
                    ...snapshot,
                    ...dagSnapshot,
                    state: 'completed',
                    jobId: action.job.jobId,
                    jobsAhead: null,
                    result: action.job.result,
                    error: null,
                };
            }
            return {
                ...snapshot,
                ...dagSnapshot,
                state: 'failed',
                jobId: action.job.jobId,
                jobsAhead: null,
                result: null,
                error: action.job.error.message,
            };
        }
        case 'dag_status':
            return snapshot.dag
                ? snapshot
                : { ...snapshot, dagState: action.status === 'PENDING' ? 'pending' : 'parsing', dagError: null };
        case 'dag_loading':
            return snapshot.dag
                ? snapshot
                : { ...snapshot, dagState: 'loading', dagError: action.error ?? null };
        case 'dag_loaded':
            return { ...snapshot, dagState: 'ready', dag: action.dag, dagError: null };
        case 'dag_failed':
            return snapshot.dag
                ? snapshot
                : { ...snapshot, dagState: action.state, dag: null, dagError: action.error };
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
                dagState: snapshot.dag ? 'ready' : snapshot.jobId ? 'failed' : 'idle',
                dagError: snapshot.dag
                    ? null
                    : snapshot.jobId
                      ? 'The execution graph can no longer be recovered.'
                      : null,
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

function isDagBusy(state: DagUiState): boolean {
    return state === 'pending' || state === 'parsing' || state === 'loading';
}

function isSnapshotBusy(snapshot: ProfileAnalysisSnapshot): boolean {
    return isBusy(snapshot.state) || isDagBusy(snapshot.dagState);
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
            let codexSettled = false;
            let dagSettled = false;
            let dagFailureCount = 0;
            await pollAnalysisJobWithRecovery({
                get: () => getAnalysisJob(apiBaseUrl, jobId, controller.signal),
                wait: milliseconds => wait(milliseconds, controller.signal),
                onRecovering: () => {
                    if (mountedRef.current && abortControllerRef.current === controller) {
                        if (codexSettled) {
                            dispatch({
                                type: 'dag_loading',
                                error: 'Connection interrupted. Retrying the execution graph…',
                            });
                        } else {
                            dispatch({ type: 'recovering' });
                        }
                    }
                },
                onProgress: () => {},
                onSnapshot: async job => {
                    if (!mountedRef.current || abortControllerRef.current !== controller) return;
                    codexSettled = job.status === 'COMPLETED' || job.status === 'FAILED';
                    dispatch({ type: 'job_status', job });

                    if (job.dagStatus === 'UNAVAILABLE' || job.dagStatus === 'FAILED') {
                        dagSettled = true;
                        return;
                    }
                    if (job.dagStatus !== 'READY' || dagSettled) return;

                    dispatch({ type: 'dag_loading' });
                    try {
                        const dagResult = await getProfileDag(apiBaseUrl, jobId, controller.signal);
                        dagFailureCount = 0;
                        if (!mountedRef.current || abortControllerRef.current !== controller) return;
                        if (dagResult.dagStatus === 'READY') {
                            dagSettled = true;
                            dispatch({ type: 'dag_loaded', dag: dagResult.dag });
                        } else {
                            dispatch({ type: 'dag_status', status: dagResult.dagStatus });
                        }
                    } catch (reason) {
                        if (isAbortError(reason)) throw reason;
                        if (reason instanceof ProfileAnalysisApiError && reason.status === 404) {
                            throw reason;
                        }
                        if (reason instanceof ProfileAnalysisApiError && reason.status === 409) {
                            dagSettled = true;
                            dispatch({
                                type: 'dag_failed',
                                state: 'unavailable',
                                error: dagErrorMessage('UNAVAILABLE', reason.code),
                            });
                            return;
                        }
                        if (
                            reason instanceof ProfileAnalysisApiError &&
                            reason.code !== 'INVALID_SERVER_RESPONSE' &&
                            isRetryableTransportFailure(reason)
                        ) {
                            dagFailureCount += 1;
                            dispatch({
                                type: 'dag_loading',
                                error: 'Connection interrupted. Retrying the execution graph…',
                            });
                            await wait(retryDelayMs(dagFailureCount, pollIntervalMs), controller.signal);
                            return;
                        }
                        dagSettled = true;
                        dispatch({
                            type: 'dag_failed',
                            state: 'failed',
                            error: 'The execution graph could not be loaded.',
                        });
                    }
                },
                isComplete: () => codexSettled && dagSettled,
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
        isBusy: isSnapshotBusy(snapshot),
        selectFile,
        setLanguage,
        analyze,
    };
}
