import React, { JSX } from 'react';
import type { AnalysisState } from './profile-analysis.types';

interface AnalysisStatusProps {
    state: Extract<AnalysisState, 'restoring' | 'recovering' | 'submitting' | 'queued' | 'analyzing' | 'completed'>;
    jobsAhead: number | null;
}

export function AnalysisStatus({ state, jobsAhead }: AnalysisStatusProps): JSX.Element {
    let label = 'Analyzing';
    if (state === 'restoring') label = 'Restoring analysis…';
    if (state === 'recovering') label = 'Connection interrupted · recovering analysis…';
    if (state === 'submitting') label = 'Uploading profile…';
    if (state === 'queued') {
        label = jobsAhead === null ? 'Queued' : `Queued · ${jobsAhead} ${jobsAhead === 1 ? 'job' : 'jobs'} ahead`;
    }
    if (state === 'completed') label = 'Completed';
    return (
        <div className="profile-analysis__status" role="status" aria-live="polite">
            {state !== 'completed' && <span className="profile-analysis__spinner" aria-hidden="true" />}
            <span>{label}</span>
        </div>
    );
}
