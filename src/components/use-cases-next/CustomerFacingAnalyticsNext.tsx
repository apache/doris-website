import React, {
    JSX,
    KeyboardEvent,
    ReactNode,
    TouchEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import './CustomerFacingAnalyticsNext.scss';

interface FooterItem {
    label: string;
    href?: string;
}

interface CoverFlowItem {
    id: string;
    num: string;
    title: ReactNode;
    desc: string;
    footer: {
        label: string;
        items: FooterItem[];
    };
}

interface CoverFlowProps {
    items: CoverFlowItem[];
    footerVariant?: 'scenarios' | 'powered';
    ariaLabel?: string;
}

function CoverFlow({
    items,
    footerVariant = 'scenarios',
    ariaLabel,
}: CoverFlowProps): JSX.Element {
    const [active, setActive] = useState(0);
    const total = items.length;
    const stageRef = useRef<HTMLDivElement | null>(null);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const go = useCallback(
        (i: number) => setActive(((i % total) + total) % total),
        [total]
    );

    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft') go(active - 1);
        if (e.key === 'ArrowRight') go(active + 1);
    };

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        touchStartX.current = null;
        touchStartY.current = null;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0) go(active + 1);
            else go(active - 1);
        }
    };

    const footerClass = footerVariant === 'powered' ? 'cap-powered' : 'cf-scenarios';
    const footerLabelClass =
        footerVariant === 'powered' ? 'cap-powered-label' : 'cf-scenarios-label';

    return (
        <div
            className="cover-flow-wrap"
            onKeyDown={onKey}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label={ariaLabel}
        >
            <div className="cover-flow" ref={stageRef}>
                {items.map((it, i) => {
                    const offset = i - active;
                    return (
                        <article
                            key={it.id}
                            className="cf-card"
                            data-offset={String(offset)}
                            aria-hidden={offset === 0 ? 'false' : 'true'}
                            tabIndex={offset === 0 ? 0 : -1}
                            onClick={() => go(i)}
                        >
                            <div className="cf-num">{it.num}</div>
                            <h3 className="cf-title">{it.title}</h3>
                            <p className="cf-desc">{it.desc}</p>
                            <div className={footerClass}>
                                <div className={footerLabelClass}>{it.footer.label}</div>
                                <ul>
                                    {it.footer.items.map(x => (
                                        <li key={x.label}>
                                            {x.href !== undefined ? (
                                                <a href={x.href}>{x.label}</a>
                                            ) : (
                                                x.label
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="cf-nav">
                <button
                    type="button"
                    className="cf-btn"
                    onClick={() => go(active - 1)}
                    aria-label="Previous"
                >
                    ←
                </button>
                <span className="cf-indicator">
                    <strong>{String(active + 1).padStart(2, '0')}</strong>
                    {' / '}
                    {String(total).padStart(2, '0')}
                </span>
                <button
                    type="button"
                    className="cf-btn"
                    onClick={() => go(active + 1)}
                    aria-label="Next"
                >
                    →
                </button>
            </div>

            <div className="cf-dots" role="tablist" aria-label={ariaLabel}>
                {items.map((it, i) => (
                    <button
                        key={it.id}
                        type="button"
                        className={`cf-dot ${i === active ? 'active' : ''}`}
                        onClick={() => go(i)}
                        aria-label={`Card ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

function HighlightIcon({ id }: { id: string }): JSX.Element {
    const common = {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    } as const;

    if (id === 'engagement') {
        return (
            <svg {...common} aria-hidden="true">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
            </svg>
        );
    }
    if (id === 'monetization') {
        return (
            <svg {...common} aria-hidden="true">
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        );
    }
    if (id === 'decisions') {
        return (
            <svg {...common} aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        );
    }

    return (
        <svg {...common} aria-hidden="true">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a7 7 0 0 0-4.9 12c.6.6 1 1.5 1 2.5h7.8c0-1 .4-1.9 1-2.5A7 7 0 0 0 12 2z" />
        </svg>
    );
}

function LegacyHero(): JSX.Element {
    return (
        <section className="legacy-hero" id="production-hero">
            <div className="legacy-hero__bg" aria-hidden="true" />
            <div className="legacy-hero__grid" aria-hidden="true" />
            <div className="container legacy-hero__inner">
                <div className="legacy-hero__left">
                    <h1 className="legacy-hero__title" data-reveal data-reveal-delay="1">
                        Customer-Facing Analytics,
                        <br />
                        Powered by{' '}
                        <span className="accent">
                            Real-Time
                            <span className="legacy-hero__bolt" aria-hidden="true">
                                <svg
                                    width="0.85em"
                                    height="0.85em"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"
                                        fill="var(--brand-accent)"
                                        stroke="var(--brand-accent)"
                                        strokeWidth="0.5"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>{' '}
                            Data
                        </span>
                    </h1>
                    <p className="legacy-hero__sub" data-reveal data-reveal-delay="2">
                        Deliver sub-second, interactive analytics directly to your customers,
                        at scale.
                    </p>
                </div>
            </div>
        </section>
    );
}

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('.cfa-page [data-reveal]');
        if (!('IntersectionObserver' in window)) {
            items.forEach(i => i.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('is-visible');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );
        items.forEach(i => io.observe(i));
        return () => io.disconnect();
    }, []);
}

interface ValueSummary {
    id: string;
    num: string;
    title: string;
    summary: string;
}

interface CaseStudy {
    id: string;
    num: string;
    title: string;
    quote: string;
    scenario: string;
    outcomes: string[];
    href: string;
    logo: string;
    logoAlt: string;
    logoClass: string;
    logoText?: string;
    logoTextClass?: string;
}

interface Requirement {
    id: string;
    num: string;
    title: string;
    desc: string;
}

interface Capability {
    id: string;
    num: string;
    title: ReactNode;
    desc: string;
    poweredLabel: string;
    poweredBy: FooterItem[];
}

const valueSummaries: ValueSummary[] = [
    {
        id: 'better-ux',
        num: '01',
        title: 'Better User Experience',
        summary:
            'Dashboards load the moment users arrive, so analytics feels like a native part of the product instead of a report to wait for.',
    },
    {
        id: 'engagement',
        num: '02',
        title: 'Higher Engagement & Retention',
        summary: 'Live, responsive analytics turns product data into a reason for users to come back.',
    },
    {
        id: 'monetization',
        num: '03',
        title: 'Monetization',
        summary:
            'Customer-facing analytics becomes a premium, revenue-generating feature inside your own product.',
    },
    {
        id: 'decisions',
        num: '04',
        title: 'Faster Decisions',
        summary:
            'Real-time signal lets teams act before opportunities pass instead of reacting to yesterday\'s data.',
    },
];

const cases: CaseStudy[] = [
    {
        id: 'jd',
        num: 'Case · 01',
        title: 'Real-Time OLAP for JD.com Search Box',
        quote: 'Replacing Flink’s window computing with Doris improved development efficiency, adapted to dimension changes, and reduced computing resources.',
        scenario:
            'Real-time analytics for the JD.com search box: overall search traffic, online A/B test monitoring, and trending search word lists, all refined to SKU-level granularity for business analysts.',
        outcomes: [
            'Processes a daily volume of 10 billion data rows',
            'Achieves high throughput with 10,000 QPS and a minimum query latency of 150ms.',
            'Enables real-time data ingestion by 1 million rows per second.',
        ],
        href: 'https://www.velodb.io/blog/jd-com-s-exploration-practice-apache-doris',
        logo: '/images/next/user-logos/jd-color.png',
        logoAlt: 'JD.COM',
        logoClass: 'case-logo case-logo--jd',
    },
    {
        id: 'merchants',
        num: 'Case · 02',
        title: 'Real-Time Recommendations for Xanh SM',
        quote:
            'Apache Doris and its Compute-Storage Decouple Mode allowed us to run both workloads from a single storage layer, cutting infrastructure cost and complexity without sacrificing performance.',
        scenario:
            'Xanh SM, Vietnam\'s leading EV ride-hailing platform, runs analytics and real-time serving on Apache Doris to power personalized destination recommendations.',
        outcomes: [
            '175,000 records written per second in under 1 second',
            'P9999 query latency occasionally exceeded 100ms',
            'average query latency held at ~76ms across most time windows',
        ],
        href: 'https://www.velodb.io/blog/how-xanhsm-built-real-time-recommendations-with-apache-doris',
        logo: '/images/next/user-logos/green-sm.svg',
        logoAlt: 'Green SM',
        logoClass: 'case-logo case-logo--green-sm',
    },
    {
        id: 'high-frequency',
        num: 'Case · 03',
        title: 'Real-Time Analytics for ZTO',
        quote: '',
        scenario:
            'Inverted indexes on the high-frequency filter fields to support real-time monitoring, multi-dimensional analytics, and precise filtering queries',
        outcomes: [
            'Multi-dimensional equality filter queries dropped from over 1 minute to under 1 second (60x); complex aggregations dropped from 5-10 minutes to under 1 minute.',
            'Critical query concurrency grew from under 50 to 100+, while timeout rate fell from 30% to under 5% and latency variance narrowed from ±3s to ±1s.',
            'The full workload now runs on one-third of the original hardware, with 500 million daily record updates visible in queries within seconds.',
        ],
        href: 'https://www.velodb.io/blog/how-zto-express-rebuilt-real-time-analytics-with-inverted-index',
        logo: '/images/next/user-logos/zto-circle.png',
        logoAlt: 'ZTO',
        logoClass: 'case-logo case-logo--zto',
        logoText: 'ZTO EXPRESS',
        logoTextClass: 'case-logo-text case-logo-text--zto',
    },
];

const requirements: Requirement[] = [
    {
        id: 'latency',
        num: 'REQ · 01',
        title: 'End-to-End Low Latency',
        desc: 'Customer-facing apps need both fresh data and fast responses. New events must become queryable within seconds, and analytical queries must return in sub-second time for dashboards, embedded analytics, and in-product workflows.'
    },
    {
        id: 'concurrency',
        num: 'REQ · 02',
        title: 'High Concurrency',
        desc: 'Thousands of users may query data at the same time. The analytics engine must maintain low latency under heavy concurrent load, not just perform well in isolated benchmarks.'
    },
    {
        id: 'multi-tenancy',
        num: 'REQ · 03',
        title: 'Multi-Tenancy & Resource Isolation',
        desc: 'Customer-facing analytics often serves many tenants, users, or embedded applications from the same platform. The engine must isolate data, workloads, and resources so one tenant’s activity does not affect another tenant’s performance, security, or experience.',
    },
    {
        id: 'lakehouse',
        num: 'REQ · 04',
        title: 'Lakehouse & Open Data Access',
        desc: 'Data already lives in open lakehouse formats, object storage, and existing data lake architectures. The analytics engine must query it in place, combine it with real-time serving data, and deliver fresh insights without creating another data copy.'
    },
];

const capabilities: Capability[] = [
    {
        id: 'ingest',
        num: 'CAP · 01',
        title: (
            <>
                INGEST TO QUERY
                <br />
                IN SECONDS
            </>
        ),
        desc: 'New data becomes queryable within seconds, while dashboards and in-product analytics stay fast and interactive. Users see the latest activity as it happens, not after the next batch cycle.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Load Transaction', href: '/docs/dev/key-features/load-transaction' },
            { label: 'Data Compaction', href: '/docs/dev/key-features/data-compaction' },
            { label: 'Data Update/Delete', href: '/docs/dev/key-features/data-update-delete' },
            { label: 'Preaggregation', href: '/docs/dev/key-features/preaggregation-and-rollup' },
            { label: 'Group Commit', href: '/docs/dev/key-features/group-commit' },
            { label: 'Kafka/CDC Integration', href: '/docs/dev/key-features/kafka-cdc-integration' },
            { label: 'Incremental Materialized View', href: '/docs/dev/key-features/incremental-materialized-view' },
            { label: 'Unique Key', href: '/docs/dev/key-features/unique-key' },
        ],
    },
    {
        id: 'subsecond',
        num: 'CAP · 02',
        title: (
            <>
                Sub-Second
                <br />
                at High Concurrency
            </>
        ),
        desc: 'Apache Doris sustains fast, predictable query response times as concurrent users and data volumes grow, not just in single-query benchmarks.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Data Pruning', href: '/docs/dev/key-features/data-pruning' },
            { label: 'High Concurrency Point Query', href: '/docs/dev/key-features/high-concurrency-point-query' },
            { label: 'Vectorized Execution', href: '/docs/dev/key-features/vectorized-execution' },
            { label: 'Columnar Storage', href: '/docs/dev/key-features/columnar-storage' },
            { label: 'Prepared Statement', href: '/docs/dev/key-features/prepared-statement' },
            { label: 'Query Cache', href: '/docs/dev/key-features/query-cache' },
            { label: 'Condition Cache', href: '/docs/dev/key-features/condition-cache' },
        ],
    },
    {
        id: 'multi-tenant',
        num: 'CAP · 03',
        title: (
            <>
                Multi-Tenant &amp;
                <br />
                RESOURCE ISOLATION
            </>
        ),
        desc: 'Serve many users, teams, or tenants from a single platform. Isolate workloads and control resource usage so heavy queries from one tenant do not impact others.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Workload Group', href: '/docs/dev/key-features/workload-group' },
            { label: 'Resource Group', href: '/docs/dev/key-features/resource-group' },
            { label: 'Compute Group', href: '/docs/dev/key-features/compute-group' },
            { label: 'Pipeline Execution Engine', href: '/docs/dev/key-features/pipeline-execution-engine' },
        ],
    },
    {
        id: 'lakehouse',
        num: 'CAP · 04',
        title: (
            <>
                Lakehouse Integration
            </>
        ),
        desc: 'Query open lakehouse formats directly. Combine real-time serving with existing data lake architectures, without copying data twice.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Parquet Reader Optimization', href: '/docs/dev/key-features/parquet-reader-optimization' },
            { label: 'Data Cache & Page Cache', href: '/docs/dev/key-features/data-cache-page-cache' },
            { label: 'Metadata Cache', href: '/docs/dev/key-features/metadata-cache' },
            { label: 'Iceberg', href: '/docs/dev/key-features/iceberg' },
        ],
    },
];

function Hero(): JSX.Element {
    return (
        <section className="hero" id="hero">
            <div className="hero-bg" aria-hidden="true" />
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container hero-inner">
                <div className="hero-left">
                    <div className="hero-kicker" data-reveal data-reveal-delay="1">
                        Customer-Facing Analytics
                    </div>
                    <h1 className="hero-title" data-reveal data-reveal-delay="1">
                        <span className="hero-title__line">Why real-time</span>
                        <span className="hero-title__line">changes the&nbsp;product.</span>
                    </h1>
                    <p className="hero-sub" data-reveal data-reveal-delay="2">
                        When analytics shifts from internal report to live product surface,
                        four things change at once:
                    </p>
                    <ul className="hero-points">
                        <li className="hero-point" data-reveal>
                            The user experience
                        </li>
                        <li className="hero-point" data-reveal>
                            Engagement
                        </li>
                        <li className="hero-point" data-reveal>
                            Revenue
                        </li>
                        <li className="hero-point" data-reveal>
                            The speed of decisions
                        </li>
                    </ul>
                </div>

                <ol className="hero-highlights">
                    {valueSummaries.map(item => (
                        <li key={item.id} className="hero-highlight">
                            <div className="hero-highlight__meta">
                                <span className="hero-highlight__num">{item.num}</span>
                                <span className="hero-highlight__icon" aria-hidden="true">
                                    <HighlightIcon id={item.id} />
                                </span>
                            </div>
                            <div className="hero-highlight__body">
                                <span className="hero-highlight__title">{item.title}</span>
                                <span className="hero-highlight__summary">{item.summary}</span>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

function CasesSection(): JSX.Element {
    return (
        <section className="section section-cases" id="cases">
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container section-inner">
                <div className="section-head" data-reveal>
                    <h2 className="section-title">Already shipping in production.</h2>
                    <p className="section-sub">
                        Three teams using Apache Doris to serve sub-second analytics directly to
                        their customers, at concurrency, on live data.
                    </p>
                </div>

                <div className="cases-grid">
                    {cases.map((c, i) => (
                        <a
                            key={c.id}
                            className="case-card"
                            href={c.href}
                            data-reveal
                            data-reveal-delay={i > 0 ? String(i) : undefined}
                        >
                            <div className="case-num">{c.num}</div>
                            <h3 className="case-title">{c.title}</h3>
                            {c.quote ? (
                                <p className="case-quote">&ldquo;{c.quote}&rdquo;</p>
                            ) : null}
                            <div className="case-section">Scenario</div>
                            <p className="case-scenario">{c.scenario}</p>
                            <div className="case-section">Outcome</div>
                            <ul className="case-metrics">
                                {c.outcomes.map(o => (
                                    <li key={o}>{o}</li>
                                ))}
                            </ul>
                            <span className="case-link">
                                <img className={c.logoClass} src={c.logo} alt={c.logoAlt} />
                                {c.logoText ? (
                                    <span className={c.logoTextClass}>{c.logoText}</span>
                                ) : null}
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CapabilityTags(): JSX.Element {
    return (
        <div className="capability-tags" data-reveal>
            {capabilities.map(c => {
                const tagNum = c.num.split('·').pop()?.trim() ?? c.num;
                return (
                    <article className="capability-tag" key={c.id}>
                        <span className="capability-tag__hole" aria-hidden="true" />
                        <div className="capability-tag__num">{tagNum}</div>
                        <h4 className="capability-tag__title">{c.title}</h4>
                        <div className="capability-tag__footer">
                            <div className="capability-tag__label">{c.poweredLabel}</div>
                            <ul>
                                {c.poweredBy.map(item => (
                                    <li key={item.label}>
                                        {item.href !== undefined ? (
                                            <a href={item.href}>{item.label}</a>
                                        ) : (
                                            item.label
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function TechSection(): JSX.Element {
    const [openRequirement, setOpenRequirement] = useState<string | null>(null);

    return (
        <>
        <section className="section section-tech" id="tech">
            <div className="container section-inner">
                <div className="section-head" data-reveal>
                    <h2 className="section-title">
                        What it actually takes
                        <br />
                        to serve analytics at the&nbsp;edge.
                    </h2>
                    <p className="section-sub">
                        Customer-facing analytics is a different workload than internal BI.
                        Here&rsquo;s what the serving engine has to get right, and how Apache Doris
                        answers each one.
                    </p>
                </div>

                <div className="architecture-panel" data-reveal>
                    <div className="architecture-diagram">
                        <img
                            src="/images/use-cases/cfa-architecture.jpg"
                            alt="Apache Doris product overview architecture"
                            loading="lazy"
                        />
                    </div>
                    <div className="architecture-features">
                        {requirements.map((r, index) => {
                            const isOpen = openRequirement === r.id;
                            return (
                                <article
                                    className={`arch-feature${isOpen ? ' is-open' : ''}`}
                                    key={r.id}
                                >
                                    <button
                                        type="button"
                                        className="arch-feature__trigger"
                                        onClick={() =>
                                            setOpenRequirement(isOpen ? null : r.id)
                                        }
                                        aria-expanded={isOpen}
                                        aria-controls={`req-${r.id}`}
                                    >
                                        <span className="arch-feature__index">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="arch-feature__title">{r.title}</span>
                                        <svg
                                            className="arch-feature__icon"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            aria-hidden="true"
                                        >
                                            {isOpen ? (
                                                <path d="M5 12h14" />
                                            ) : (
                                                <path d="M12 5v14M5 12h14" />
                                            )}
                                        </svg>
                                    </button>
                                    {isOpen ? (
                                        <div className="arch-feature__body" id={`req-${r.id}`}>
                                            <p>{r.desc}</p>
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>

        <section className="section section-tech section-tech-capabilities" id="capabilities">
            <div className="container section-inner">
                <h3 className="tech-layer-heading">
                    Apache Doris capabilities for Customer-facing Analytics
                </h3>
                <p className="capability-sub">
                    For more technical details about Apache Doris in real-time analytics, refer to
                    the technical blogs
                </p>

                <CapabilityTags />
            </div>
        </section>
        </>
    );
}

function CTASection(): JSX.Element {
    return (
        <section className="section-cta" id="start">
            <div className="cta-inner container">
                <h2 className="cta-title" data-reveal data-reveal-delay="1">
                    Build Customer-Facing Analytics
                    <br />
                    with <span className="accent">Apache Doris.</span>
                </h2>
                <div className="cta-actions" data-reveal data-reveal-delay="2">
                    <Link className="btn btn-yellow" to="/docs/dev/getting-started/quick-start">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            aria-hidden="true"
                        >
                            <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" />
                        </svg>
                        Get Started
                    </Link>
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled
                        aria-disabled="true"
                    >
                        Try a Demo (coming soon)
                    </button>
                </div>
            </div>
        </section>
    );
}

export default function CustomerFacingAnalyticsNext(): JSX.Element {
    useRevealObserver();
    return (
        <LayoutNext
            title="Apache Doris | Customer-Facing Analytics"
            description="Deliver sub-second, interactive customer-facing analytics with Apache Doris: high concurrency, real-time data, and embedded SQL."
        >
            <div className="cfa-page" data-screen-label="Customer-Facing Analytics">
                <LegacyHero />
                <Hero />
                <CasesSection />
                <TechSection />
                <CTASection />
            </div>
        </LayoutNext>
    );
}
