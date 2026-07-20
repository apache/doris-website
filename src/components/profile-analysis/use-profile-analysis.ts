import { useCallback, useEffect, useReducer, useRef } from 'react';
import { analyzeProfile } from './profile-analysis.api';
import type { AgentMessage, AnalysisState } from './profile-analysis.types';

interface ProfileAnalysisSnapshot {
    state: AnalysisState;
    file: File | null;
    result: AgentMessage | null;
    error: string | null;
}

type ProfileAnalysisAction =
    | { type: 'select'; file: File | null }
    | { type: 'start' }
    | { type: 'complete'; result: AgentMessage }
    | { type: 'fail'; error: string };

export const initialProfileAnalysisSnapshot: ProfileAnalysisSnapshot = {
    state: 'idle',
    file: null,
    result: null,
    error: null,
};

export function profileAnalysisReducer(
    snapshot: ProfileAnalysisSnapshot,
    action: ProfileAnalysisAction,
): ProfileAnalysisSnapshot {
    switch (action.type) {
        case 'select':
            if (snapshot.state === 'analyzing') {
                return snapshot;
            }
            return {
                state: action.file ? 'ready' : 'idle',
                file: action.file,
                result: null,
                error: null,
            };
        case 'start':
            if (!snapshot.file || snapshot.state === 'analyzing') {
                return snapshot;
            }
            return {
                ...snapshot,
                state: 'analyzing',
                result: null,
                error: null,
            };
        case 'complete':
            return {
                ...snapshot,
                state: 'completed',
                result: action.result,
                error: null,
            };
        case 'fail':
            return {
                ...snapshot,
                state: 'failed',
                result: null,
                error: action.error,
            };
    }
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

    const analyze = useCallback(async () => {
        if (!snapshot.file || abortControllerRef.current) {
            return;
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;
        dispatch({ type: 'start' });

        try {
            const result = await analyzeProfile(apiBaseUrl, snapshot.file, controller.signal);
            if (mountedRef.current && abortControllerRef.current === controller) {
                dispatch({ type: 'complete', result });
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
    }, [apiBaseUrl, snapshot.file]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    return {
        ...snapshot,
        selectFile,
        analyze,
    };
}
