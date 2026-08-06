import React, { JSX, useEffect, useId, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { AnalysisResult } from './AnalysisResult';
import { AnalysisStatus } from './AnalysisStatus';
import { ProfileUploader } from './ProfileUploader';
import { ProfileDag } from './ProfileDag';
import { useProfileAnalysis } from './use-profile-analysis';
import './ProfileAnalysis.scss';

export function ProfileAnalyzer(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const configuredApiBaseUrl = siteConfig.customFields?.profileAnalysisApiBaseUrl;
    const apiBaseUrl = typeof configuredApiBaseUrl === 'string' ? configuredApiBaseUrl : '';
    const configuredHCaptchaSiteKey = siteConfig.customFields?.profileAnalysisHCaptchaSiteKey;
    const hcaptchaSiteKey =
        typeof configuredHCaptchaSiteKey === 'string' ? configuredHCaptchaSiteKey : '';
    const analysis = useProfileAnalysis(apiBaseUrl);
    const [activeResultTab, setActiveResultTab] = useState<'graph' | 'analysis'>('graph');
    const tabIdPrefix = useId();
    const isBusy = analysis.isBusy;
    const busyState =
        analysis.state === 'restoring' ||
        analysis.state === 'recovering' ||
        analysis.state === 'submitting' ||
        analysis.state === 'queued' ||
        analysis.state === 'analyzing'
            ? analysis.state
            : null;
    const hasJob = analysis.jobId !== null;

    useEffect(() => {
        setActiveResultTab('graph');
    }, [analysis.jobId]);

    const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextTab =
            event.key === 'Home'
                ? 'graph'
                : event.key === 'End'
                  ? 'analysis'
                  : activeResultTab === 'graph'
                    ? 'analysis'
                    : 'graph';
        setActiveResultTab(nextTab);
        window.requestAnimationFrame(() => {
            document.getElementById(`${tabIdPrefix}-${nextTab}-tab`)?.focus();
        });
    };

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
                hcaptchaSiteKey={hcaptchaSiteKey}
                onFileChange={analysis.selectFile}
                onLanguageChange={analysis.setLanguage}
                onAnalyze={analysis.analyze}
            />

            {!hasJob && busyState && <AnalysisStatus state={busyState} jobsAhead={analysis.jobsAhead} />}
            {analysis.recoveryWarning && (
                <div className="profile-analysis__warning" role="status">
                    {analysis.recoveryWarning}
                </div>
            )}
            {!hasJob && analysis.error && (
                <div className="profile-analysis__error" role="alert">
                    <strong>Analysis failed.</strong>
                    <span>{analysis.error}</span>
                </div>
            )}
            {hasJob && (
                <section className="profile-analysis__workspace" aria-labelledby={`${tabIdPrefix}-workspace-title`}>
                    <h2 id={`${tabIdPrefix}-workspace-title`} className="profile-analysis__workspace-title">
                        Analysis workspace
                    </h2>
                    <div className="profile-analysis__tabs" role="tablist" aria-label="Profile analysis results">
                        <button
                            type="button"
                            id={`${tabIdPrefix}-graph-tab`}
                            role="tab"
                            aria-selected={activeResultTab === 'graph'}
                            aria-controls={`${tabIdPrefix}-graph-panel`}
                            tabIndex={activeResultTab === 'graph' ? 0 : -1}
                            onClick={() => setActiveResultTab('graph')}
                            onKeyDown={handleTabKeyDown}
                        >
                            Execution graph
                        </button>
                        <button
                            type="button"
                            id={`${tabIdPrefix}-analysis-tab`}
                            role="tab"
                            aria-selected={activeResultTab === 'analysis'}
                            aria-controls={`${tabIdPrefix}-analysis-panel`}
                            tabIndex={activeResultTab === 'analysis' ? 0 : -1}
                            onClick={() => setActiveResultTab('analysis')}
                            onKeyDown={handleTabKeyDown}
                        >
                            AI analysis
                        </button>
                    </div>
                    <div
                        id={`${tabIdPrefix}-graph-panel`}
                        role="tabpanel"
                        aria-labelledby={`${tabIdPrefix}-graph-tab`}
                        hidden={activeResultTab !== 'graph'}
                        className="profile-analysis__tab-panel"
                    >
                        <ProfileDag state={analysis.dagState} dag={analysis.dag} error={analysis.dagError} />
                    </div>
                    <div
                        id={`${tabIdPrefix}-analysis-panel`}
                        role="tabpanel"
                        aria-labelledby={`${tabIdPrefix}-analysis-tab`}
                        hidden={activeResultTab !== 'analysis'}
                        className="profile-analysis__tab-panel"
                    >
                        {busyState && <AnalysisStatus state={busyState} jobsAhead={analysis.jobsAhead} />}
                        {analysis.state === 'completed' && <AnalysisStatus state="completed" jobsAhead={null} />}
                        {analysis.error && (
                            <div className="profile-analysis__error" role="alert">
                                <strong>Analysis failed.</strong>
                                <span>{analysis.error}</span>
                            </div>
                        )}
                        {analysis.result && <AnalysisResult result={analysis.result} />}
                    </div>
                </section>
            )}
        </div>
    );
}
