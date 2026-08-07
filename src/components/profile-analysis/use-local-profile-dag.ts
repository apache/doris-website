import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
    profileParserErrorMessage,
    startProfileParse,
    type ProfileParseOperation,
    type ProfileParserWorkerFactory,
} from './profile-analysis.parser-client';
import { ProfileParserError } from './profile-analysis.parser';
import type { DagUiState, ProfileGraphIR } from './profile-analysis.types';

export interface LocalProfileDagSnapshot {
    state: DagUiState;
    dag: ProfileGraphIR | null;
    error: string | null;
}

type LocalProfileDagAction =
    | { type: 'reset' }
    | { type: 'start' }
    | { type: 'success'; dag: ProfileGraphIR }
    | { type: 'failure'; state: Extract<DagUiState, 'unavailable' | 'failed'>; error: string };

export const initialLocalProfileDagSnapshot: LocalProfileDagSnapshot = {
    state: 'idle',
    dag: null,
    error: null,
};

export function localProfileDagReducer(
    snapshot: LocalProfileDagSnapshot,
    action: LocalProfileDagAction,
): LocalProfileDagSnapshot {
    switch (action.type) {
        case 'reset':
            return initialLocalProfileDagSnapshot;
        case 'start':
            return { state: 'parsing', dag: null, error: null };
        case 'success':
            return { state: 'ready', dag: action.dag, error: null };
        case 'failure':
            return { state: action.state, dag: null, error: action.error };
    }
}

function isAbortError(reason: unknown): boolean {
    return reason instanceof Error && reason.name === 'AbortError';
}

export function useLocalProfileDag(createWorker: ProfileParserWorkerFactory) {
    const [snapshot, dispatch] = useReducer(localProfileDagReducer, initialLocalProfileDagSnapshot);
    const operationRef = useRef<ProfileParseOperation | null>(null);
    const mountedRef = useRef(true);

    const cancel = useCallback(() => {
        operationRef.current?.cancel();
        operationRef.current = null;
    }, []);

    const reset = useCallback(() => {
        cancel();
        dispatch({ type: 'reset' });
    }, [cancel]);

    const buildGraph = useCallback(
        async (file: File) => {
            cancel();
            dispatch({ type: 'start' });
            const operation = startProfileParse(file, createWorker);
            operationRef.current = operation;
            try {
                const dag = await operation.promise;
                if (mountedRef.current && operationRef.current === operation) {
                    operationRef.current = null;
                    dispatch({ type: 'success', dag });
                }
            } catch (reason) {
                if (isAbortError(reason)) return;
                if (mountedRef.current && operationRef.current === operation) {
                    operationRef.current = null;
                    const code = reason instanceof ProfileParserError ? reason.code : 'DAG_PARSE_FAILED';
                    dispatch({
                        type: 'failure',
                        state: code === 'DAG_UNAVAILABLE' || code === 'DAG_TOO_LARGE' ? 'unavailable' : 'failed',
                        error: reason instanceof Error ? reason.message : profileParserErrorMessage(code),
                    });
                }
            }
        },
        [cancel, createWorker],
    );

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            cancel();
        };
    }, [cancel]);

    return {
        ...snapshot,
        isBusy: snapshot.state === 'parsing',
        buildGraph,
        reset,
    };
}

