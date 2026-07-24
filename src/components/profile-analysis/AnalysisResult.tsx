import React, { JSX } from 'react';
import { AnalysisMarkdown } from './AnalysisMarkdown';
import type { AgentMessage } from './profile-analysis.types';

interface AnalysisResultProps {
    result: AgentMessage;
}

export function AnalysisResult({ result }: AnalysisResultProps): JSX.Element {
    return (
        <section className="profile-analysis__result" aria-labelledby="profile-analysis-result-title">
            <h2 id="profile-analysis-result-title">Analysis result</h2>
            <div className="profile-analysis__ai-warning" role="note">
                <strong>AI-generated result:</strong> Verify the evidence against the original Profile and have a
                qualified engineer review recommendations before making production changes. Do not execute commands
                or configuration changes automatically.
            </div>
            <AnalysisMarkdown>{result.text}</AnalysisMarkdown>
        </section>
    );
}
