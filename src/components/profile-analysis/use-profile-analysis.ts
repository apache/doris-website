import { useCallback, useEffect, useReducer, useRef } from 'react';
import { createAnalysisJob, getAnalysisJob, ProfileAnalysisApiError } from './profile-analysis.api';
import type { AgentMessage, AnalysisJobSnapshot, AnalysisState, ResponseLanguage } from './profile-analysis.types';

const MAX_CONSECUTIVE_POLL_FAILURES = 3;

interface ProfileAnalysisSnapshot {
    state: AnalysisState;
    file: File | null;
    language: ResponseLanguage;
    jobId: string | null;
    jobsAhead: number | null;
    result: AgentMessage | null;
    error: string | null;
}

type ProfileAnalysisAction =
    | { type: 'select'; file: File | null }
    | { type: 'set_language'; language: ResponseLanguage }
    | { type: 'start' }
    | { type: 'job_created'; jobId: string; status: 'QUEUED' | 'RUNNING' }
    | { type: 'job_status'; job: AnalysisJobSnapshot }
    | { type: 'complete'; result: AgentMessage }
    | { type: 'fail'; error: string };

export const initialProfileAnalysisSnapshot: ProfileAnalysisSnapshot = {
    state: 'idle',
    file: null,
    language: 'en',
    jobId: null,
    jobsAhead: null,
    result: null,
    error: null,
};

export function profileAnalysisReducer(
    snapshot: ProfileAnalysisSnapshot,
    action: ProfileAnalysisAction,
): ProfileAnalysisSnapshot {
    switch (action.type) {
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
                state: action.status === 'QUEUED' ? 'queued' : 'analyzing',
                jobId: action.jobId,
                jobsAhead: null,
            };
        case 'job_status':
            if (action.job.status === 'QUEUED') {
                return { ...snapshot, state: 'queued', jobsAhead: action.job.jobsAhead };
            }
            if (action.job.status === 'RUNNING') {
                return { ...snapshot, state: 'analyzing', jobsAhead: null };
            }
            return snapshot;
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
    return state === 'submitting' || state === 'queued' || state === 'analyzing';
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

export function getProfileAnalysisErrorMessage(reason: unknown): string {
    if (reason instanceof Error) {
        return reason.message;
    }
    return 'Profile analysis failed. Please try again.';
}

export function useProfileAnalysis(apiBaseUrl: string) {
    const [snapshot, dispatch] = useReducer(profileAnalysisReducer, initialProfileAnalysisSnapshot);
    const abortControllerRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    const selectFile = useCallback((file: File | null) => {
        if (abortControllerRef.current) {
            return;
        }
        dispatch({ type: 'select', file });
    }, []);

    const setLanguage = useCallback((language: ResponseLanguage) => {
        if (abortControllerRef.current) {
            return;
        }
        dispatch({ type: 'set_language', language });
    }, []);

    const analyze = useCallback(async () => {
        if (!snapshot.file || abortControllerRef.current) {
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        dispatch({ type: 'start' });

        try {
            const created = await createAnalysisJob(apiBaseUrl, snapshot.file, snapshot.language, controller.signal);
            if (!mountedRef.current || abortControllerRef.current !== controller) return;
            dispatch({ type: 'job_created', jobId: created.jobId, status: created.status });

            let consecutiveFailures = 0;
            while (!controller.signal.aborted) {
                try {
                    const job = await getAnalysisJob(apiBaseUrl, created.jobId, controller.signal);
                    consecutiveFailures = 0;
                    if (!mountedRef.current || abortControllerRef.current !== controller) return;
                    if (job.status === 'COMPLETED') {
                        dispatch({ type: 'complete', result: job.result });
                        return;
                    }
                    if (job.status === 'FAILED') {
                        dispatch({ type: 'fail', error: job.error.message });
                        return;
                    }
                    dispatch({ type: 'job_status', job });
                } catch (reason) {
                    if (
                        reason instanceof ProfileAnalysisApiError &&
                        (reason.code === 'NETWORK_ERROR' || reason.status >= 500)
                    ) {
                        consecutiveFailures += 1;
                        if (consecutiveFailures >= MAX_CONSECUTIVE_POLL_FAILURES) throw reason;
                    } else {
                        throw reason;
                    }
                }
                await wait(created.retryAfterMs, controller.signal);
            }
        } catch (reason) {
            if (mountedRef.current && abortControllerRef.current === controller) {
                dispatch({ type: 'fail', error: getProfileAnalysisErrorMessage(reason) });
            }
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
        }
    }, [apiBaseUrl, snapshot.file, snapshot.language]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    return {
        ...snapshot,
        isBusy: isBusy(snapshot.state),
        selectFile,
        setLanguage,
        analyze,
    };
}
