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
    const isBusy = analysis.isBusy;
    const busyState =
        analysis.state === 'restoring' ||
        analysis.state === 'recovering' ||
        analysis.state === 'submitting' ||
        analysis.state === 'queued' ||
        analysis.state === 'analyzing'
            ? analysis.state
            : null;

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
                language={analysis.language}
                disabled={isBusy}
                onFileChange={analysis.selectFile}
                onLanguageChange={analysis.setLanguage}
                onAnalyze={analysis.analyze}
            />

            {busyState && <AnalysisStatus state={busyState} jobsAhead={analysis.jobsAhead} />}
            {analysis.state === 'completed' && <AnalysisStatus state="completed" jobsAhead={null} />}
            {analysis.recoveryWarning && (
                <div className="profile-analysis__warning" role="status">
                    {analysis.recoveryWarning}
                </div>
            )}
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
