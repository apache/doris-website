import {translate} from '@docusaurus/Translate';
import React, { JSX } from 'react';
import type { AnalysisState } from './profile-analysis.types';

interface AnalysisStatusProps {
    state: Extract<AnalysisState, 'restoring' | 'recovering' | 'submitting' | 'queued' | 'analyzing' | 'completed'>;
    jobsAhead: number | null;
}

export function AnalysisStatus({ state, jobsAhead }: AnalysisStatusProps): JSX.Element {
    let label = translate({id: 'landing.profile.status.analyzing', message: 'Analyzing'});
    if (state === 'restoring') label = translate({id: 'landing.profile.status.restoring', message: 'Restoring analysis…'});
    if (state === 'recovering') label = translate({id: 'landing.profile.status.recovering', message: 'Connection interrupted · recovering analysis…'});
    if (state === 'submitting') label = translate({id: 'landing.profile.status.uploading', message: 'Uploading profile…'});
    if (state === 'queued') {
        label = jobsAhead === null ? translate({id: 'landing.profile.status.queued', message: 'Queued'})
            : jobsAhead === 1 ? translate({id: 'landing.profile.status.queueOne', message: 'Queued · {count} job ahead'}, {count: jobsAhead})
                : translate({id: 'landing.profile.status.queueMany', message: 'Queued · {count} jobs ahead'}, {count: jobsAhead});
    }
    if (state === 'completed') label = translate({id: 'landing.profile.status.completed', message: 'Completed'});
    return (
        <div className="profile-analysis__status" role="status" aria-live="polite">
            {state !== 'completed' && <span className="profile-analysis__spinner" aria-hidden="true" />}
            <span>{label}</span>
        </div>
    );
}
