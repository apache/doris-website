import React, { JSX, useCallback, useId, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { AnalysisResult } from './AnalysisResult';
import { AnalysisStatus } from './AnalysisStatus';
import { ProfileUploader } from './ProfileUploader';
import { ProfileDag } from './ProfileDag';
import { useProfileAnalysis } from './use-profile-analysis';
import { useLocalProfileDag } from './use-local-profile-dag';
import type { ProfileParserWorker } from './profile-analysis.parser-client';
import './ProfileAnalysis.scss';

export function ProfileAnalyzer(): JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    const configuredApiBaseUrl = siteConfig.customFields?.profileAnalysisApiBaseUrl;
    const apiBaseUrl = typeof configuredApiBaseUrl === 'string' ? configuredApiBaseUrl : '';
    const configuredHCaptchaSiteKey = siteConfig.customFields?.profileAnalysisHCaptchaSiteKey;
    const hcaptchaSiteKey =
        typeof configuredHCaptchaSiteKey === 'string' ? configuredHCaptchaSiteKey : '';
    const analysis = useProfileAnalysis(apiBaseUrl);
    const createParserWorker = useCallback(
        () =>
            new Worker(new URL('./profile-analysis.parser.worker.ts', import.meta.url), {
                type: 'module',
                name: 'doris-profile-parser',
            }) as ProfileParserWorker,
        [],
    );
    const localDag = useLocalProfileDag(createParserWorker);
    const [activeResultTab, setActiveResultTab] = useState<'graph' | 'analysis'>('analysis');
    const tabIdPrefix = useId();
    const isAiBusy = analysis.isBusy;
    const busyState =
        analysis.state === 'restoring' ||
        analysis.state === 'recovering' ||
        analysis.state === 'submitting' ||
        analysis.state === 'queued' ||
        analysis.state === 'analyzing'
            ? analysis.state
            : null;
    const hasAiActivity =
        analysis.jobId !== null || busyState !== null || analysis.result !== null || analysis.error !== null;
    const hasDagActivity = localDag.state !== 'idle';
    const hasWorkspace = hasAiActivity || hasDagActivity;

    const handleFileChange = useCallback(
        (file: File | null) => {
            localDag.reset();
            analysis.selectFile(file);
        },
        [analysis.selectFile, localDag.reset],
    );

    const handleBuildGraph = useCallback(() => {
        if (!analysis.file) return;
        setActiveResultTab('graph');
        void localDag.buildGraph(analysis.file);
    }, [analysis.file, localDag.buildGraph]);

    const handleAnalyze = useCallback(
        (hcaptchaToken: string, resetCaptcha: () => void) => {
            setActiveResultTab('analysis');
            void analysis.analyze(hcaptchaToken, resetCaptcha);
        },
        [analysis.analyze],
    );

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
                    Choose one Query Profile to visualize its execution graph locally or request an independent
                    AI-assisted diagnosis. Each AI upload starts a new analysis and does not create a conversation
                    history.
                </p>
            </header>

            <ProfileUploader
                file={analysis.file}
                language={analysis.language}
                aiDisabled={isAiBusy}
                dagBusy={localDag.isBusy}
                hcaptchaSiteKey={hcaptchaSiteKey}
                onFileChange={handleFileChange}
                onLanguageChange={analysis.setLanguage}
                onBuildGraph={handleBuildGraph}
                onAnalyze={handleAnalyze}
            />

            {analysis.recoveryWarning && (
                <div className="profile-analysis__warning" role="status">
                    {analysis.recoveryWarning}
                </div>
            )}
            {hasWorkspace && (
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
                        <ProfileDag state={localDag.state} dag={localDag.dag} error={localDag.error} />
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
