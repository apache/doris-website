import React, { JSX } from 'react';

export function AnalysisStatus(): JSX.Element {
    return (
        <div className="profile-analysis__status" role="status" aria-live="polite">
            <span className="profile-analysis__spinner" aria-hidden="true" />
            <span>Uploading and analyzing the profile. This may take several minutes…</span>
        </div>
    );
}
