import React, { JSX, useEffect, useId, useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '../home-next/LayoutNext';
import { keyFeatureCards, type KeyFeatureCard } from '@site/src/generated/key-features';
import './KeyFeaturesNext.scss';

type CardSpan = 's' | 'm' | 'l' | 't';

const CARD_SPANS: CardSpan[] = ['s', 'm', 'l', 't'];

function randomSpan(): CardSpan {
    return CARD_SPANS[Math.floor(Math.random() * CARD_SPANS.length)];
}

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

function matches(entry: KeyFeatureCard, query: string): boolean {
    if (!query) return true;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    if (entry.title.toLowerCase().includes(needle)) return true;
    if (entry.description.toLowerCase().includes(needle)) return true;
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
    const [spanById, setSpanById] = useState<Record<string, CardSpan>>({});
    const inputId = useId();
    const liveId = useId();

    useEffect(() => {
        const next: Record<string, CardSpan> = {};
        keyFeatureCards.forEach((entry) => {
            next[entry.id] = randomSpan();
        });
        setSpanById(next);
    }, []);

    const filtered = useMemo(
        () =>
            keyFeatureCards.map((entry, index) => ({
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
                            {String(keyFeatureCards.length).padStart(2, '0')}
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
                                `span-${spanById[entry.id] ?? 'm'}`,
                                visible ? '' : 'is-hidden',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            aria-hidden={visible ? 'false' : 'true'}
                        >
                            <Link className="kf-next__tile-link" to={entry.href}>
                                {entry.badge === 'doc' && (
                                    <span className="kf-next__tile-badge-row">
                                        <span className="kf-next__tile-badge" aria-label="Formal documentation">
                                            Doc
                                        </span>
                                    </span>
                                )}
                                <span className="kf-next__tile-top">
                                    <span className="kf-next__tile-name">{entry.title}</span>
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
