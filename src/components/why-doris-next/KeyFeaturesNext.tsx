import React, { JSX, useEffect, useId, useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '../home-next/LayoutNext';
import './KeyFeaturesNext.scss';

interface GlossaryEntry {
    id: string;
    name: string;
    tags?: string[];
    href: string;
    span?: 's' | 'm' | 'l' | 't';
}

const glossaryEntries: GlossaryEntry[] = [
    {
        id: 'real-time-analytics',
        name: 'Real-time Analytics',
        tags: ['streaming', 'low-latency'],
        href: '/docs-next/dev/data-operate/import/import-way/stream-load-manual',
        span: 'l',
    },
    {
        id: 'lakehouse-analytics',
        name: 'Lakehouse Analytics',
        tags: ['iceberg', 'hudi', 'delta'],
        href: '/docs-next/dev/lakehouse/lakehouse-overview',
        span: 'm',
    },
    {
        id: 'hybrid-search',
        name: 'Hybrid Search',
        tags: ['vector', 'bm25'],
        href: '/docs-next/dev/table-design/index/inverted-index/overview',
        span: 'm',
    },
    {
        id: 'mpp-engine',
        name: 'MPP Query Engine',
        tags: ['parallel', 'scale-out'],
        href: '/docs-next/dev/getting-started/what-is-apache-doris',
        span: 's',
    },
    {
        id: 'vectorized-execution',
        name: 'Vectorized Execution',
        tags: ['simd', 'cpu'],
        href: '/docs-next/dev/getting-started/what-is-apache-doris',
        span: 'm',
    },
    {
        id: 'materialized-views',
        name: 'Materialized Views',
        tags: ['acceleration', 'rewrite'],
        href: '/docs-next/dev/query-acceleration/materialized-view/overview',
        span: 's',
    },
    {
        id: 'inverted-index',
        name: 'Inverted Index',
        tags: ['text', 'search'],
        href: '/docs-next/dev/table-design/index/inverted-index/overview',
        span: 't',
    },
    {
        id: 'stream-load',
        name: 'Stream Load',
        tags: ['ingest', 'http'],
        href: '/docs-next/dev/data-operate/import/import-way/stream-load-manual',
        span: 't',
    },
    {
        id: 'routine-load',
        name: 'Routine Load',
        tags: ['kafka', 'streaming'],
        href: '/docs-next/dev/data-operate/import/import-way/routine-load-manual',
        span: 's',
    },
    {
        id: 'compute-storage',
        name: 'Compute-Storage Separation',
        tags: ['cloud', 'elastic'],
        href: '/docs-next/dev/lakehouse/catalog-overview',
        span: 'l',
    },
    {
        id: 'cbo',
        name: 'Cost-Based Optimizer',
        tags: ['planner', 'statistics'],
        href: '/docs-next/dev/getting-started/what-is-apache-doris',
        span: 'm',
    },
    {
        id: 'pipeline-execution',
        name: 'Pipeline Execution',
        tags: ['parallel', 'morsel'],
        href: '/docs-next/dev/getting-started/what-is-apache-doris',
        span: 's',
    },
    {
        id: 'workload-management',
        name: 'Workload Management',
        tags: ['isolation', 'qos'],
        href: '/docs-next/dev/admin-manual/workload-management/workload-group',
        span: 'm',
    },
    {
        id: 'high-availability',
        name: 'High Availability',
        tags: ['fault-tolerance', 'replica'],
        href: '/docs-next/dev/install/preparation/cluster-planning',
        span: 't',
    },
    {
        id: 'multi-catalog',
        name: 'Multi-Catalog Federation',
        tags: ['external', 'jdbc', 'hive'],
        href: '/docs-next/dev/lakehouse/catalog-overview',
        span: 'm',
    },
];

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
        if (!('IntersectionObserver' in window)) {
            items.forEach((item) => item.classList.add('is-visible'));
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );

        items.forEach((item) => observer.observe(item));
        return () => observer.disconnect();
    }, []);
}

function BoltIcon({ size = 24, color = '#FFD23F' }: { size?: number | string; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"
                fill={color}
                stroke={color}
                strokeWidth="0.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function matches(entry: GlossaryEntry, query: string): boolean {
    if (!query) return true;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    if (entry.name.toLowerCase().includes(needle)) return true;
    if (entry.tags?.some((tag) => tag.toLowerCase().includes(needle))) return true;
    return false;
}

function themeFor(index: number): string {
    const themes = ['t-green', 't-cream', 't-green-deep', 't-cream-warm'];
    return themes[index % themes.length];
}

function KeyFeaturesHero(): JSX.Element {
    return (
        <section className="kf-next__hero" id="hero">
            <div className="kf-next__hero-bg" aria-hidden="true" />
            <div className="kf-next__hero-grid" aria-hidden="true" />
            <div className="kf-next__container">
                <div className="kf-next__hero-stack">
                    <h1 className="kf-next__hero-title" data-reveal data-reveal-delay="1">
                        Everything you need to know
                        <br />
                        about{' '}
                        <span className="kf-next__accent">
                            Apache Doris
                            <span className="kf-next__bolt-inline">
                                <BoltIcon size="0.85em" />
                            </span>
                        </span>
                    </h1>
                    <p className="kf-next__hero-sub" data-reveal data-reveal-delay="2">
                        A reference index for the core technologies and key features of Apache Doris
                    </p>
                </div>
            </div>
        </section>
    );
}

function GlossarySection(): JSX.Element {
    const [query, setQuery] = useState('');
    const inputId = useId();
    const liveId = useId();

    const filtered = useMemo(
        () =>
            glossaryEntries.map((entry, index) => ({
                entry,
                originalIdx: index,
                visible: matches(entry, query),
            })),
        [query]
    );

    const visibleCount = filtered.filter((item) => item.visible).length;

    return (
        <section className="kf-next__section kf-next__section--glossary" id="glossary">
            <div className="kf-next__container kf-next__section-inner">
                <div className="kf-next__glossary-controls" data-reveal>
                    <label className="kf-next__search" htmlFor={inputId}>
                        <svg
                            className="kf-next__search-icon"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                            <path
                                d="M15.5 15.5L20 20"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                        <input
                            id={inputId}
                            type="search"
                            className="kf-next__search-input"
                            placeholder="Search features - try “lakehouse”, “MPP”, “index”…"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                            aria-describedby={liveId}
                        />
                        {query && (
                            <button
                                type="button"
                                className="kf-next__search-clear"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </label>

                    <div className="kf-next__meta" id={liveId} aria-live="polite">
                        <span className="kf-next__meta-count">
                            <strong>{String(visibleCount).padStart(2, '0')}</strong>
                            {' / '}
                            {String(glossaryEntries.length).padStart(2, '0')}
                        </span>
                        <span className="kf-next__meta-label">features</span>
                    </div>
                </div>

                <ul className="kf-next__grid" data-reveal data-reveal-delay="1">
                    {filtered.map(({ entry, originalIdx, visible }) => (
                        <li
                            key={entry.id}
                            className={[
                                'kf-next__tile',
                                themeFor(originalIdx),
                                `span-${entry.span ?? 'm'}`,
                                visible ? '' : 'is-hidden',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            aria-hidden={visible ? 'false' : 'true'}
                        >
                            <Link className="kf-next__tile-link" to={entry.href}>
                                <span className="kf-next__tile-main">
                                    <span className="kf-next__tile-name">{entry.name}</span>
                                </span>
                                <span className="kf-next__tile-meta">
                                    {entry.tags && entry.tags.length > 0 && (
                                        <span className="kf-next__tile-tags">
                                            {entry.tags.slice(0, 2).join(' · ')}
                                        </span>
                                    )}
                                    <span className="kf-next__tile-arrow" aria-hidden="true">
                                        →
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {visibleCount === 0 && (
                    <div className="kf-next__empty" role="status">
                        No features match <strong>“{query}”</strong>. Try a broader term, or{' '}
                        <button type="button" className="kf-next__empty-clear" onClick={() => setQuery('')}>
                            clear the search
                        </button>
                        .
                    </div>
                )}
            </div>
        </section>
    );
}

function KeyFeaturesContent(): JSX.Element {
    useRevealObserver();

    return (
        <div className="kf-next">
            <KeyFeaturesHero />
            <GlossarySection />
        </div>
    );
}

export default function KeyFeaturesNext(): JSX.Element {
    return (
        <LayoutNext
            title="Key Features"
            description="A reference index for the core technologies and key features of Apache Doris, including real-time analytics, lakehouse federation, and hybrid search."
        >
            <KeyFeaturesContent />
        </LayoutNext>
    );
}
