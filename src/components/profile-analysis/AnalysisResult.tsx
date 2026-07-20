import React, { JSX } from 'react';
import type { AgentMessage } from './profile-analysis.types';

interface AnalysisResultProps {
    result: AgentMessage;
}

export function AnalysisResult({ result }: AnalysisResultProps): JSX.Element {
    return (
        <section className="profile-analysis__result" aria-labelledby="profile-analysis-result-title">
            <h2 id="profile-analysis-result-title">Analysis result</h2>
            <pre tabIndex={0}>{result.text}</pre>
        </section>
    );
}
