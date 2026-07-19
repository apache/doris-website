import React, { JSX, useEffect, useRef, useState } from 'react';
import { LayoutNext } from '../home-next/LayoutNext';
import './CommunityReportNext.scss';
import './WeeklyReport.scss';

export interface WeeklyReportStat {
    num: string;
    label: string;
}

/** One PR / issue reference, rendered as a linked `#<num>`. */
export interface WeeklyReportRef {
    num: number;
    title: string;
    url: string;
    /** Open PR opened within the report week (in-progress only). */
    isNew?: boolean;
}

/** One scenario line inside the new community-radar website export. */
export interface WeeklyReportScenario {
    name: string;
    mergedNarrative?: string;
    inProgressNarrative?: string;
    merged?: WeeklyReportRef[];
    inProgress?: WeeklyReportRef[];
}

/** Legacy section shape from the first structured MDX export. */
export interface WeeklyReportLegacyScenario {
    name: string;
    narrative?: string;
    prs?: WeeklyReportRef[];
    refs?: WeeklyReportRef[];
}

export interface WeeklyReportHighlight {
    title: string;
    narrative: string;
    prs?: WeeklyReportRef[];
}

export interface WeeklyReportDemand {
    name: string;
    narrative?: string;
    refs?: WeeklyReportRef[];
}

/** One repository's chapter: the three scenario sections. */
export interface WeeklyReportRepo {
    repo: string;
    scenarios?: WeeklyReportScenario[];
    demand?: WeeklyReportDemand[];
    /** Backward-compatible fields for already-published structured reports. */
    merged?: WeeklyReportLegacyScenario[];
    inProgress?: WeeklyReportLegacyScenario[];
}

/**
 * Structured report body exported by community-radar (`export const report`).
 * When present it is laid out by this component; otherwise the compiled Markdown
 * body is rendered instead (the legacy / hand-authored path).
 */
export interface WeeklyReportData {
    summary: {
        lead: string;
        highlights: Array<string | WeeklyReportHighlight>;
        numbers?: { mergedPrs: number; newIssues: number; contributors: number };
    };
    repos: WeeklyReportRepo[];
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
    /** Structured body (from community-radar's export); takes precedence over Component. */
    report?: WeeklyReportData;
    /** The compiled markdown body as a React component (fallback when no `report`). */
    Component: React.ComponentType;
}

interface CommunityReportNextProps {
    /** All reports, ordered newest-first (see the page's loadReports()). */
    reports: WeeklyReportEntry[];
}

const COMMUNITY_SURVEY_URL =
    'https://docs.google.com/forms/d/e/1FAIpQLSeSppR5JJyXIxNoPlG_hS8RTW8k2tsCkpC0h68WSN6CEUsWcA/viewform';
const DORIS_ROADMAP_ISSUE_URL = 'https://github.com/apache/doris/issues/60036';

const sidebarLinks = [
    {
        title: 'Help Shape the Future of Apache Doris',
        description: 'Complete the survey to help us build a better Doris community.',
        href: COMMUNITY_SURVEY_URL,
    },
    {
        title: 'Which Doris Feature Do You Want to Discuss or Build?',
        description: 'Leave your reply on the GitHub issue.',
        href: DORIS_ROADMAP_ISSUE_URL,
    },
];

export default function CommunityReportNext({ reports }: CommunityReportNextProps): JSX.Element {
    const latest = reports[0];
    const historical = reports.slice(1);
    const [selectedId, setSelectedId] = useState<string>(latest?.id ?? '');
    const [isPastMenuOpen, setIsPastMenuOpen] = useState(false);
    const pastMenuRef = useRef<HTMLDivElement>(null);

    // Allow deep-linking to a specific report via URL hash, e.g.
    // /community-report#2026-06-22. Read on mount (client-only; window is
    // undefined during SSR) and fall back to the latest report.
    useEffect(() => {
        const hash = window.location.hash.replace(/^#/, '');
        if (hash && reports.some(r => r.id === hash)) {
            setSelectedId(hash);
        }
    }, [reports]);

    useEffect(() => {
        if (!isPastMenuOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!pastMenuRef.current?.contains(event.target as Node)) {
                setIsPastMenuOpen(false);
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsPastMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isPastMenuOpen]);

    const select = (id: string) => {
        setSelectedId(id);
        setIsPastMenuOpen(false);
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `#${id}`);
        }
    };

    const selected = reports.find(r => r.id === selectedId) ?? latest;
    const isHistoricalSelected = historical.some(r => r.id === selectedId);
    const selectedHistoricalLabel = isHistoricalSelected ? selected?.label : 'Past reports...';
    const SelectedReport = selected?.Component;

    return (
        <LayoutNext
            title="Community Report — Apache Doris"
            description="Weekly reports from the Apache Doris community: merged features, fixes, new contributors, and notable discussions."
        >
            <div className="community-report">
                <div className="community-report__layout">
                    <aside className="community-report__sidebar" aria-label="Reports and community feedback">
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
                                <div className="community-report__select-wrap" ref={pastMenuRef}>
                                    <button
                                        type="button"
                                        className={
                                            'community-report__select-button' +
                                            (isPastMenuOpen ? ' community-report__select-button--open' : '') +
                                            (!isHistoricalSelected ? ' community-report__select-button--placeholder' : '')
                                        }
                                        aria-haspopup="listbox"
                                        aria-expanded={isPastMenuOpen}
                                        aria-controls="community-report-past-menu"
                                        onClick={() => setIsPastMenuOpen(open => !open)}
                                        onKeyDown={event => {
                                            if (event.key === 'ArrowDown') {
                                                event.preventDefault();
                                                setIsPastMenuOpen(true);
                                            }
                                        }}
                                    >
                                        <span>{selectedHistoricalLabel}</span>
                                    </button>
                                    {isPastMenuOpen && (
                                        <div
                                            id="community-report-past-menu"
                                            className="community-report__select-menu"
                                            role="listbox"
                                            aria-label="Browse past weekly reports"
                                        >
                                            {historical.map(r => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selectedId === r.id}
                                                    className={
                                                        'community-report__select-option' +
                                                        (selectedId === r.id
                                                            ? ' community-report__select-option--selected'
                                                            : '')
                                                    }
                                                    onClick={() => select(r.id)}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="community-report__links" aria-label="Community feedback links">
                            {sidebarLinks.map(link => (
                                <a
                                    key={link.href}
                                    className="community-report__link-card"
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="community-report__link-title">{link.title}</span>
                                    <span className="community-report__link-description">{link.description}</span>
                                </a>
                            ))}
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

                                {selected.stats && selected.stats.length > 0 && !selected.report?.summary.numbers && (
                                    <div className="weekly-report__stats">
                                        {selected.stats.map((stat, i) => (
                                            <div className="weekly-report__stat" key={`${stat.label}-${i}`}>
                                                <span className="weekly-report__stat-num">{stat.num}</span>
                                                <span className="weekly-report__stat-label">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selected.report ? (
                                    <StructuredBody key={selected.id} report={selected.report} />
                                ) : (
                                    <div className="weekly-report__body">
                                        {SelectedReport && <SelectedReport />}
                                    </div>
                                )}
                            </article>
                        )}
                    </main>
                </div>
            </div>
        </LayoutNext>
    );
}

// ---------------------------------------------------------------------------
// Structured body — the community-radar website layout:
// overview -> highlights -> by scenario -> community pulse -> demand signals.
// It is rendered under this site's visual language. Hand-authored Markdown
// reports fall back to __body above.
// ---------------------------------------------------------------------------

function StructuredBody({ report }: { report: WeeklyReportData }): JSX.Element {
    const { summary, repos } = report;
    const [activeRepo, setActiveRepo] = useState(0);
    const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
    const [activeScenario, setActiveScenario] = useState(0);
    const repo = repos[Math.min(activeRepo, repos.length - 1)];
    const highlights = summary.highlights ?? [];
    const scenarios = repo ? normalizeScenarios(repo) : [];
    const activeScenarioIndex = scenarios.length > 0 ? Math.min(activeScenario, scenarios.length - 1) : 0;
    const selectedScenario = scenarios[activeScenarioIndex];

    return (
        <div className="wr-structured">
            {summary.lead && (
                <section className="wr-section">
                    <SectionTitle index="00" title="Overview" />
                    <p className="wr-pulse__lead">{summary.lead}</p>
                </section>
            )}

            {highlights.length > 0 && (
                <section className="wr-section">
                    <SectionTitle index="01" title="Highlights" />
                    <div className="wr-highlights">
                        {highlights.map((h, i) => (
                            <HighlightCard
                                key={i}
                                highlight={h}
                                index={i + 1}
                                expanded={activeHighlight === i}
                                onToggle={() => setActiveHighlight(activeHighlight === i ? null : i)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {repos.length > 1 && (
                <nav className="wr-tabs" aria-label="Repositories">
                    {repos.map((r, i) => (
                        <button
                            key={r.repo}
                            type="button"
                            className={'wr-tab' + (i === activeRepo ? ' wr-tab--active' : '')}
                            onClick={() => {
                                setActiveRepo(i);
                                setActiveScenario(0);
                            }}
                        >
                            {r.repo}
                        </button>
                    ))}
                </nav>
            )}

            {repo && (
                <>
                    <section className="wr-section">
                        <SectionTitle index="02" title="By Scenario" />
                        {scenarios.length === 0 ? (
                            <p className="wr-empty">Nothing to report this week.</p>
                        ) : (
                            <div className="wr-scenarios-tabs">
                                <div className="wr-scenario-tabs" role="tablist" aria-label={`${repo.repo} scenarios`}>
                                    {scenarios.map((s, i) => (
                                        <button
                                            key={s.name + i}
                                            type="button"
                                            id={`wr-scenario-tab-${i}`}
                                            role="tab"
                                            aria-selected={i === activeScenarioIndex}
                                            aria-controls={`wr-scenario-panel-${i}`}
                                            className={
                                                'wr-scenario-tab' +
                                                (i === activeScenarioIndex ? ' wr-scenario-tab--active' : '')
                                            }
                                            onClick={() => setActiveScenario(i)}
                                        >
                                            <span className="wr-scenario-tab__idx">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span className="wr-scenario-tab__label">{s.name}</span>
                                        </button>
                                    ))}
                                </div>
                                {selectedScenario && (
                                    <div
                                        id={`wr-scenario-panel-${activeScenarioIndex}`}
                                        role="tabpanel"
                                        aria-labelledby={`wr-scenario-tab-${activeScenarioIndex}`}
                                        className="wr-scenario-panel"
                                    >
                                        <ScenarioCard scenario={selectedScenario} index={activeScenarioIndex + 1} />
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {summary.numbers && (
                        <section className="wr-section">
                            <SectionTitle index="03" title="Community Pulse" />
                            <div className="wr-pulse">
                                <PulseFigure num={summary.numbers.mergedPrs} label="Merged PRs" />
                                <PulseFigure num={summary.numbers.newIssues} label="New issues" />
                                <PulseFigure num={summary.numbers.contributors} label="Contributors" />
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

function SectionTitle({ index, title }: { index: string; title: string }): JSX.Element {
    return (
        <h2 className="wr-section__title">
            <span className="wr-section__index">{index}</span>
            {title}
        </h2>
    );
}

function HighlightCard({
    highlight,
    index,
    expanded,
    onToggle,
}: {
    highlight: string | WeeklyReportHighlight;
    index: number;
    expanded: boolean;
    onToggle: () => void;
}): JSX.Element {
    const title = typeof highlight === 'string' ? highlight : highlight.title;
    const narrative = typeof highlight === 'string' ? undefined : highlight.narrative;
    const prs = typeof highlight === 'string' ? [] : highlight.prs ?? [];
    const panelId = `wr-highlight-panel-${index}`;

    if (typeof highlight === 'string') {
        return (
            <article className="wr-highlight">
                <button type="button" className="wr-highlight__trigger" disabled>
                    <span className="wr-highlight__idx">{String(index).padStart(2, '0')}</span>
                    <span className="wr-highlight__title">{title}</span>
                </button>
            </article>
        );
    }

    return (
        <article className={'wr-highlight' + (expanded ? ' wr-highlight--open' : '')}>
            <h3 className="wr-highlight__heading">
                <button
                    type="button"
                    className="wr-highlight__trigger"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={onToggle}
                >
                    <span className="wr-highlight__idx">{String(index).padStart(2, '0')}</span>
                    <span className="wr-highlight__title">{title}</span>
                    <span className="wr-highlight__chevron" aria-hidden="true" />
                </button>
            </h3>
            {expanded && (
                <div className="wr-highlight__panel" id={panelId}>
                    {narrative && <p className="wr-highlight__text">{narrative}</p>}
                    <RefList items={prs} />
                </div>
            )}
        </article>
    );
}

function PulseFigure({ num, label }: { num: number; label: string }): JSX.Element {
    return (
        <div className="wr-pulse__figure">
            <span className="wr-pulse__num">{num}</span>
            <span className="wr-pulse__label">{label}</span>
        </div>
    );
}

function normalizeScenarios(repo: WeeklyReportRepo): WeeklyReportScenario[] {
    if (repo.scenarios) {
        return repo.scenarios;
    }
    const byName = new Map<string, WeeklyReportScenario>();

    const ensure = (name: string): WeeklyReportScenario => {
        const existing = byName.get(name);
        if (existing) {
            return existing;
        }
        const next = { name };
        byName.set(name, next);
        return next;
    };

    (repo.merged ?? []).forEach(s => {
        const target = ensure(s.name);
        target.mergedNarrative = s.narrative;
        target.merged = s.prs ?? [];
    });
    (repo.inProgress ?? []).forEach(s => {
        const target = ensure(s.name);
        target.inProgressNarrative = s.narrative;
        target.inProgress = s.prs ?? [];
    });

    return Array.from(byName.values());
}

function ScenarioCard({
    scenario,
    index,
}: {
    scenario: WeeklyReportScenario;
    index: number;
}): JSX.Element {
    return (
        <article className="wr-scn">
            <div className="wr-scn__head">
                <h3 className="wr-scn__name">{scenario.name}</h3>
                <span className="wr-scn__idx">{String(index).padStart(2, '0')}</span>
            </div>
            {scenario.mergedNarrative && (
                <ScenarioBlock label="Merged" narrative={scenario.mergedNarrative} items={scenario.merged ?? []} />
            )}
            {scenario.inProgressNarrative && (
                <ScenarioBlock
                    label="In progress"
                    narrative={scenario.inProgressNarrative}
                    items={scenario.inProgress ?? []}
                />
            )}
        </article>
    );
}

function ScenarioBlock({
    label,
    narrative,
    items,
}: {
    label: string;
    narrative: string;
    items: WeeklyReportRef[];
}): JSX.Element {
    return (
        <div className="wr-scn__block">
            <div className="wr-scn__label">{label}</div>
            <p className="wr-scn__narr">{narrative}</p>
            <RefList items={items} />
        </div>
    );
}

function RefList({ items }: { items: WeeklyReportRef[] }): JSX.Element | null {
    if (items.length === 0) {
        return null;
    }

    return (
        <ul className="wr-scn__prs">
            {items.map(it => (
                <li className="wr-scn__pr" key={it.num}>
                    <span className="wr-scn__pr-title">{it.title}</span>
                    <span className="wr-scn__pr-meta">
                        {it.isNew && <span className="wr-scn__new">Newly opened</span>}
                        <a className="wr-scn__pr-num" href={it.url} target="_blank" rel="noopener noreferrer">
                            #{it.num}
                        </a>
                    </span>
                </li>
            ))}
        </ul>
    );
}
