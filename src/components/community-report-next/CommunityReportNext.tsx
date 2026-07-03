import React, { JSX, useEffect, useState } from 'react';
import { LayoutNext } from '../home-next/LayoutNext';
import './CommunityReportNext.scss';
import './WeeklyReport.scss';

export interface WeeklyReportStat {
    num: string;
    label: string;
}

export interface WeeklyReportEntry {
    /** Stable id (the markdown filename without extension); used as the URL hash. */
    id: string;
    /** Date range shown in the sidebar and page title, e.g. "Jun 29 – Jul 5, 2026". */
    label: string;
    /** Optional subtitle, e.g. "Week 27, 2026". */
    week?: string;
    /** Optional summary cards rendered above the report body. */
    stats?: WeeklyReportStat[];
    /** The compiled markdown body as a React component. */
    Component: React.ComponentType;
}

interface CommunityReportNextProps {
    /** All reports, ordered newest-first (see the page's loadReports()). */
    reports: WeeklyReportEntry[];
}

export default function CommunityReportNext({ reports }: CommunityReportNextProps): JSX.Element {
    const latest = reports[0];
    const historical = reports.slice(1);
    const [selectedId, setSelectedId] = useState<string>(latest?.id ?? '');

    // Allow deep-linking to a specific report via URL hash, e.g.
    // /community-report#2026-06-22. Read on mount (client-only; window is
    // undefined during SSR) and fall back to the latest report.
    useEffect(() => {
        const hash = window.location.hash.replace(/^#/, '');
        if (hash && reports.some(r => r.id === hash)) {
            setSelectedId(hash);
        }
    }, [reports]);

    const select = (id: string) => {
        setSelectedId(id);
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#${id}`);
        }
    };

    const selected = reports.find(r => r.id === selectedId) ?? latest;
    const isHistoricalSelected = historical.some(r => r.id === selectedId);
    const SelectedReport = selected?.Component;

    return (
        <LayoutNext
            title="Community Report — Apache Doris"
            description="Weekly reports from the Apache Doris community: merged features, fixes, new contributors, and notable discussions."
        >
            <div className="community-report">
                <div className="community-report__layout">
                    <aside className="community-report__sidebar" aria-label="Reports">
                        <div className="community-report__section">
                            <h2 className="community-report__section-title">Weekly Report</h2>

                            {latest && (
                                <button
                                    type="button"
                                    className={
                                        'community-report__entry' +
                                        (selectedId === latest.id ? ' community-report__entry--active' : '')
                                    }
                                    onClick={() => select(latest.id)}
                                >
                                    <span className="community-report__entry-badge">Latest</span>
                                    <span className="community-report__entry-label">{latest.label}</span>
                                </button>
                            )}

                            {historical.length > 0 && (
                                <div className="community-report__select-wrap">
                                    <select
                                        className="community-report__select"
                                        aria-label="Browse past weekly reports"
                                        value={isHistoricalSelected ? selectedId : ''}
                                        onChange={e => select(e.target.value)}
                                    >
                                        <option value="" disabled>
                                            Past reports…
                                        </option>
                                        {historical.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </aside>

                    <main className="community-report__content">
                        {selected && (
                            <article className="weekly-report">
                                <header className="weekly-report__header">
                                    <p className="weekly-report__eyebrow">Community Weekly Report</p>
                                    <h1 className="weekly-report__title">{selected.label}</h1>
                                    {selected.week && <p className="weekly-report__meta">{selected.week}</p>}
                                </header>

                                {selected.stats && selected.stats.length > 0 && (
                                    <div className="weekly-report__stats">
                                        {selected.stats.map((stat, i) => (
                                            <div className="weekly-report__stat" key={`${stat.label}-${i}`}>
                                                <span className="weekly-report__stat-num">{stat.num}</span>
                                                <span className="weekly-report__stat-label">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="weekly-report__body">
                                    {SelectedReport && <SelectedReport />}
                                </div>
                            </article>
                        )}
                    </main>
                </div>
            </div>
        </LayoutNext>
    );
}
