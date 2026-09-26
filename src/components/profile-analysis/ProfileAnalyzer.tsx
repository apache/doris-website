import React, { JSX, useCallback, useEffect, useId, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { AiAnalysisForm } from './AiAnalysisForm';
import { AnalysisResult } from './AnalysisResult';
import { AnalysisStatus } from './AnalysisStatus';
import { ProfileUploader } from './ProfileUploader';
import { ProfileDag } from './ProfileDag';
import { useProfileAnalysis } from './use-profile-analysis';
import { useLocalProfileDag } from './use-local-profile-dag';
import type { ProfileParserWorker } from './profile-analysis.parser-client';
import './ProfileAnalysis.scss';

type ProfileAnalysisTab = 'visualize' | 'ai';

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
    const [activeTab, setActiveTab] = useState<ProfileAnalysisTab>('visualize');
    const tabChosenRef = useRef(false);
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
    const hasAiActivity = analysis.jobId !== null || analysis.result !== null || analysis.error !== null;

    const selectTab = useCallback((tab: ProfileAnalysisTab) => {
        tabChosenRef.current = true;
        setActiveTab(tab);
    }, []);

    // An analysis restored after a page refresh resumes on the AI tab so its progress stays visible.
    useEffect(() => {
        if (tabChosenRef.current || !hasAiActivity) return;
        setActiveTab('ai');
    }, [hasAiActivity]);

    const handleFileChange = useCallback(
        (file: File | null) => {
            localDag.reset();
            analysis.selectFile(file);
        },
        [analysis.selectFile, localDag.reset],
    );

    const handleVisualize = useCallback(() => {
        if (!analysis.file) return;
        void localDag.buildGraph(analysis.file);
    }, [analysis.file, localDag.buildGraph]);

    const handleAnalyze = useCallback(
        (hcaptchaToken: string, resetCaptcha: () => void) => {
            void analysis.analyze(hcaptchaToken, resetCaptcha);
        },
        [analysis.analyze],
    );

    const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextTab: ProfileAnalysisTab =
            event.key === 'Home'
                ? 'visualize'
                : event.key === 'End'
                  ? 'ai'
                  : activeTab === 'visualize'
                    ? 'ai'
                    : 'visualize';
        selectTab(nextTab);
        window.requestAnimationFrame(() => {
            document.getElementById(`${tabIdPrefix}-${nextTab}-tab`)?.focus();
        });
    };

    return (
        <div className="profile-analysis">
            <header className="profile-analysis__header">
                <p className="profile-analysis__eyebrow">Query diagnostics</p>
                <h1>Apache Doris Profile Analysis</h1>
            </header>

            <ProfileUploader file={analysis.file} disabled={isAiBusy} onFileChange={handleFileChange} />

            {analysis.recoveryWarning && (
                <div className="profile-analysis__warning" role="status">
                    {analysis.recoveryWarning}
                </div>
            )}

            <section className="profile-analysis__workspace" aria-label="Profile analysis actions and results">
                <div className="profile-analysis__tabs" role="tablist" aria-label="Profile analysis actions">
                    <button
                        type="button"
                        id={`${tabIdPrefix}-visualize-tab`}
                        role="tab"
                        aria-selected={activeTab === 'visualize'}
                        aria-controls={`${tabIdPrefix}-visualize-panel`}
                        tabIndex={activeTab === 'visualize' ? 0 : -1}
                        onClick={() => selectTab('visualize')}
                        onKeyDown={handleTabKeyDown}
                    >
                        Visualize Execution
                    </button>
                    <button
                        type="button"
                        id={`${tabIdPrefix}-ai-tab`}
                        role="tab"
                        aria-selected={activeTab === 'ai'}
                        aria-controls={`${tabIdPrefix}-ai-panel`}
                        tabIndex={activeTab === 'ai' ? 0 : -1}
                        onClick={() => selectTab('ai')}
                        onKeyDown={handleTabKeyDown}
                    >
                        AI-assisted analysis
                    </button>
                </div>
                <div
                    id={`${tabIdPrefix}-visualize-panel`}
                    role="tabpanel"
                    aria-labelledby={`${tabIdPrefix}-visualize-tab`}
                    hidden={activeTab !== 'visualize'}
                    className="profile-analysis__tab-panel"
                >
                    <div className="profile-analysis__panel">
                        <p className="profile-analysis__panel-intro">
                            Visualize the Profile. Select Visualize Execution to parse the file in your browser
                            and render its execution graph as an interactive diagram. The file is not uploaded for
                            this action.
                        </p>
                        <button
                            className="button button--primary profile-analysis__action-button"
                            type="button"
                            disabled={!analysis.file || localDag.isBusy}
                            onClick={handleVisualize}
                        >
                            {localDag.isBusy ? 'Visualizing…' : 'Visualize Execution'}
                        </button>
                    </div>
                    <ProfileDag state={localDag.state} dag={localDag.dag} error={localDag.error} />
                </div>
                <div
                    id={`${tabIdPrefix}-ai-panel`}
                    role="tabpanel"
                    aria-labelledby={`${tabIdPrefix}-ai-tab`}
                    hidden={activeTab !== 'ai'}
                    className="profile-analysis__tab-panel"
                >
                    <AiAnalysisForm
                        file={analysis.file}
                        language={analysis.language}
                        disabled={isAiBusy}
                        hcaptchaSiteKey={hcaptchaSiteKey}
                        onLanguageChange={analysis.setLanguage}
                        onAnalyze={handleAnalyze}
                    />
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
        </div>
    );
}
