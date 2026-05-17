import React, {
    CSSProperties,
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

interface BoltIconProps {
    size?: number | string;
    color?: string;
    className?: string;
}

function BoltIcon({ size = 24, color = '#FFD23F', className }: BoltIconProps): JSX.Element {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden="true"
        >
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

type ShapeKind = 'diamond' | 'circle' | 'ring' | 'cross';

interface ShapeSpec {
    kind: ShapeKind;
    style: CSSProperties;
}

function Shape({ kind, style }: { kind: ShapeKind; style?: CSSProperties }): JSX.Element {
    return <span className={`shape shape-${kind}`} style={style} aria-hidden="true" />;
}

function Shapes({ specs }: { specs: ShapeSpec[] }): JSX.Element {
    return (
        <>
            {specs.map((s, i) => (
                <Shape key={i} kind={s.kind} style={s.style} />
            ))}
        </>
    );
}

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

interface ValueCard {
    id: string;
    num: string;
    title: ReactNode;
    desc: string;
    scenariosLabel: string;
    scenarios: string[];
}

interface CaseStudy {
    id: string;
    num: string;
    title: string;
    quote: string;
    scenario: string;
    outcomes: string[];
    href: string;
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

const valueCards: ValueCard[] = [
    {
        id: 'better-ux',
        num: '01 / Better User Experience',
        title: (
            <>
                Instant dashboards.
                <br />
                No&nbsp;waiting.
                <br />
                No&nbsp;refresh.
            </>
        ),
        desc: 'Dashboards load the moment users arrive. Every interaction feels like part of the product, not a report — with no spinner standing between a question and its answer.',
        scenariosLabel: 'Where it shows up',
        scenarios: ['SaaS product dashboards', 'Embedded analytics in applications'],
    },
    {
        id: 'engagement',
        num: '02 / Higher Engagement & Retention',
        title: (
            <>
                Data that&rsquo;s alive
                <br />
                keeps users coming&nbsp;back.
            </>
        ),
        desc: 'Users engage more when data feels live, responsive, and part of the product experience. Analytics becomes a reason to return, not a separate screen users have to leave the workflow to find.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'In-product usage dashboards',
            'Real-time behavior insights',
            'Customer activity timelines',
        ],
    },
    {
        id: 'monetization',
        num: '03 / Monetization',
        title: (
            <>
                Analytics as
                <br />
                a product&nbsp;capability.
            </>
        ),
        desc: 'Turn customer-facing analytics into a revenue-generating product feature. Embed dashboards, reporting, and data products into your application, then package them into premium tiers your customers are willing to pay for.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Merchant analytics dashboards',
            'Partner and customer reporting portals',
            'Data products and premium analytics tiers',
        ],
    },
    {
        id: 'decisions',
        num: '04 / Faster Decisions',
        title: (
            <>
                Real-time signal,
                <br />
                real-time&nbsp;DECISIONS.
            </>
        ),
        desc: 'When dashboards reflect what is happening now, teams can act before opportunities pass instead of reacting to yesterday’s data.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Financial analytics dashboards',
            'Advertising performance platforms',
            'Marketing performance dashboards',
        ],
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
    },
    {
        id: 'merchants',
        num: 'Case · 02',
        title: 'Real-Time Merchant Analytics at Scale',
        quote: 'Doris lets us deliver fresh business insights to merchants without waiting for offline reports.',
        scenario:
            'E-commerce and platform merchant analytics, covering order analysis, conversion analysis, and user behavior analysis.',
        outcomes: [
            'Real-time order insights',
            'Concurrent dashboard access',
            'Faster operational decisions',
        ],
        href: '#',
    },
    {
        id: 'high-frequency',
        num: 'Case · 03',
        title: 'Interactive Analytics for High-Frequency Business Data',
        quote: 'Apache Doris gives us interactive analytics on large-scale, high-frequency data with low latency.',
        scenario: 'Finance, advertising, and marketing analytics platforms serving external users.',
        outcomes: [
            'Large-scale data analysis',
            'Low-latency interactive queries',
            'Reliable analytics serving layer',
        ],
        href: '#',
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
            { label: 'Unique Key', href: '/key-features/unique-key' },
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
            { label: 'Iceberg', href: '/key-features/iceberg' },
        ],
    },
];

const valueShapes: ShapeSpec[] = [
    { kind: 'diamond', style: { top: 120, right: '12%' } },
    { kind: 'ring', style: { bottom: 90, left: '8%' } },
];

function Hero(): JSX.Element {
    return (
        <section className="hero" id="hero">
            <div className="hero-bg" aria-hidden="true" />
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container">
                <div className="hero-left">
                    <h1 className="hero-title" data-reveal data-reveal-delay="1">
                        Customer-Facing Analytics,
                        <br />
                        Powered by{' '}
                        <span className="accent">
                            Real-Time
                            <span className="bolt-inline">
                                <BoltIcon size="0.85em" />
                            </span>{' '}
                            Data
                        </span>
                    </h1>
                    <p className="hero-sub" data-reveal data-reveal-delay="2">
                        Deliver sub-second, interactive analytics directly to your customers,
                        at scale.
                    </p>
                </div>
            </div>
        </section>
    );
}

function ValueSection(): JSX.Element {
    const items: CoverFlowItem[] = valueCards.map(c => ({
        id: c.id,
        num: c.num,
        title: c.title,
        desc: c.desc,
        footer: {
            label: c.scenariosLabel,
            items: c.scenarios.map(s => ({ label: s })),
        },
    }));

    return (
        <section className="section section-value section-cream" id="value">
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container section-inner">
                <div className="section-head" data-reveal>
                    <h2 className="section-title">
                        Why real-time
                        <br />
                        changes the product.
                    </h2>
                    <p className="section-sub">
                        When analytics shifts from internal report to live product surface, four
                        things change at once: the user experience, engagement, revenue, and the
                        speed of decisions.
                    </p>
                </div>

                <CoverFlow items={items} footerVariant="scenarios" ariaLabel="Value cards" />
            </div>
            <Shapes specs={valueShapes} />
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
                            <p className="case-quote">&ldquo;{c.quote}&rdquo;</p>
                            <div className="case-section">Scenario</div>
                            <p className="case-scenario">{c.scenario}</p>
                            <div className="case-section">Outcome</div>
                            <ul className="case-metrics">
                                {c.outcomes.map(o => (
                                    <li key={o}>{o}</li>
                                ))}
                            </ul>
                            <span className="case-link">
                                Read Case Study <span aria-hidden="true">→</span>
                            </span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TechSection(): JSX.Element {
    const capabilityItems: CoverFlowItem[] = capabilities.map(c => ({
        id: c.id,
        num: c.num,
        title: c.title,
        desc: c.desc,
        footer: { label: c.poweredLabel, items: c.poweredBy },
    }));

    return (
        <section className="section section-tech section-cream" id="tech">
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

                <h3 className="tech-layer-heading">Technical requirements</h3>
                <div className="req-grid" data-reveal>
                    {requirements.map(r => (
                        <div className="req-card" key={r.id}>
                            <h4 className="req-title">{r.title}</h4>
                            <p className="req-desc">{r.desc}</p>
                        </div>
                    ))}
                </div>

                <h3 className="tech-layer-heading">Apache Doris capabilities</h3>

                <CoverFlow
                    items={capabilityItems}
                    footerVariant="powered"
                    ariaLabel="Capability cards"
                />
            </div>
        </section>
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
                <Hero />
                <ValueSection />
                <CasesSection />
                <TechSection />
                <CTASection />
            </div>
        </LayoutNext>
    );
}
