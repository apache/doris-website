import React, { JSX } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { AnalysisResult } from './AnalysisResult';
import { AnalysisStatus } from './AnalysisStatus';
import { ProfileUploader } from './ProfileUploader';
import { useProfileAnalysis } from './use-profile-analysis';
import './ProfileAnalysis.scss';

export function ProfileAnalyzer(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const configuredApiBaseUrl = siteConfig.customFields?.profileAnalysisApiBaseUrl;
    const apiBaseUrl = typeof configuredApiBaseUrl === 'string' ? configuredApiBaseUrl : '';
    const analysis = useProfileAnalysis(apiBaseUrl);
    const isAnalyzing = analysis.state === 'analyzing';

    return (
        <div className="profile-analysis">
            <header className="profile-analysis__header">
                <p className="profile-analysis__eyebrow">Query diagnostics</p>
                <h1>Apache Doris Profile Analysis</h1>
                <p>
                    Upload one Query Profile to receive an independent AI-assisted diagnosis. Each upload starts a
                    new analysis and does not create a conversation history.
                </p>
            </header>

            <ProfileUploader
                file={analysis.file}
                disabled={isAnalyzing}
                onFileChange={analysis.selectFile}
                onAnalyze={analysis.analyze}
            />

            {isAnalyzing && <AnalysisStatus />}
            {analysis.error && (
                <div className="profile-analysis__error" role="alert">
                    <strong>Analysis failed.</strong>
                    <span>{analysis.error}</span>
                </div>
            )}
            {analysis.result && <AnalysisResult result={analysis.result} />}
        </div>
    );
}
