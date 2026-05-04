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
        desc: 'Data renders the moment a user lands. Interactions feel like a product, not a report — because there is no spinner between question and answer.',
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
        desc: 'Users interact more when the data is real-time and responsive. Analytics becomes part of the product loop instead of a screen people leave to find.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'User behavior analytics',
            'Product usage insights',
            'Customer activity dashboards',
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
        desc: 'Turn the analytics layer from internal cost center to a feature you sell. Charge for it. Tier it. Build a product around it.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'E-commerce merchant dashboards',
            'Partner-facing reporting portals',
            'Data-as-a-product platforms',
        ],
    },
    {
        id: 'decisions',
        num: '04 / Faster Decisions',
        title: (
            <>
                Real-time signal,
                <br />
                real-time&nbsp;moves.
            </>
        ),
        desc: 'When the dashboard reflects what just happened, operators stop reacting to yesterday and start steering today.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Finance analytics platforms',
            'Advertising analytics platforms',
            'Marketing performance dashboards',
        ],
    },
];

const cases: CaseStudy[] = [
    {
        id: 'millions',
        num: 'Case · 01',
        title: 'Powering Real-Time Analytics for Millions of Users',
        quote: 'We needed sub-second latency at high concurrency — Doris made it possible.',
        scenario: 'Customer-facing dashboards for large-scale user analytics.',
        outcomes: [
            'Sub-second query latency',
            'High-concurrency access',
            'Real-time data visibility',
        ],
        href: '#',
    },
    {
        id: 'merchants',
        num: 'Case · 02',
        title: 'Real-Time Merchant Analytics at Scale',
        quote: 'Doris helps us deliver fresh business insights to merchants without waiting for offline reports.',
        scenario:
            'E-commerce and platform merchant analytics — order analysis, conversion analysis, and user behavior analysis.',
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
        quote: 'Apache Doris enables interactive analytics on large-scale, high-frequency data with low latency.',
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
        id: 'concurrency',
        num: 'REQ · 01',
        title: 'High Concurrency',
        desc: 'Thousands of users may query simultaneously. The serving engine must hold its latency under heavy concurrent load — not just on a benchmark.',
    },
    {
        id: 'latency',
        num: 'REQ · 02',
        title: 'Low Latency',
        desc: 'Customer-facing apps demand interactive response. Sub-second queries are non-negotiable for dashboards, embedded analytics, and product workflows.',
    },
    {
        id: 'real-time',
        num: 'REQ · 03',
        title: 'Real-Time Data',
        desc: 'Users expect fresh data, not hours-old reports. The pipeline must reflect live operations and recent user activity within seconds.',
    },
    {
        id: 'multi-modal',
        num: 'REQ · 04',
        title: 'Multi-Modal Data',
        desc: 'Modern apps mix structured rows, semi-structured JSON, logs, text, and vectors in one experience. The engine has to query all of it, together.',
    },
    {
        id: 'embedded',
        num: 'REQ · 05',
        title: 'Embedded & Developer-Friendly',
        desc: 'Analytics has to drop into product backends — through SQL, APIs, and standard protocols — without a special integration team.',
    },
];

const capabilities: Capability[] = [
    {
        id: 'ingest',
        num: 'CAP · 01',
        title: (
            <>
                Real-Time
                <br />
                Ingestion + Query
            </>
        ),
        desc: 'Data becomes queryable seconds after ingestion. Dashboards reflect what happened a moment ago, not last night’s batch.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Stream ingestion from Kafka and CDC', href: '#' },
            { label: 'Incremental materialized view refresh', href: '#' },
            { label: 'Real-time query visibility', href: '#' },
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
        desc: 'Consistent low-latency on large datasets, under concurrent load — not just a single-query benchmark number.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'MPP execution engine', href: '#' },
            { label: 'Vectorized execution', href: '#' },
            { label: 'Advanced query optimizer', href: '#' },
            { label: 'Columnar storage and compression', href: '#' },
        ],
    },
    {
        id: 'multi-tenant',
        num: 'CAP · 03',
        title: (
            <>
                Multi-Tenant &amp;
                <br />
                Embedded&nbsp;Friendly
            </>
        ),
        desc: 'Serve many users, teams, or tenants from a single platform. Drop into product backends through standard SQL — no proprietary client.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'MySQL-compatible protocol', href: '#' },
            { label: 'Resource isolation', href: '#' },
            { label: 'High-concurrency scheduling', href: '#' },
            { label: 'SQL-based application integration', href: '#' },
        ],
    },
    {
        id: 'lakehouse',
        num: 'CAP · 04',
        title: (
            <>
                Lakehouse
                <br />
                Integration
            </>
        ),
        desc: 'Query open lakehouse formats directly. Combine real-time serving with existing data lake architectures — without copying data twice.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Iceberg and lakehouse query capabilities', href: '#' },
            { label: 'Zero-copy analytics', href: '#' },
            { label: 'Unified access to operational and historical data', href: '#' },
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
                        Deliver sub-second, interactive analytics experiences directly to your
                        customers, at scale.
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
                        things happen — for the user, for engagement, for revenue, and for
                        decisions.
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
                        their customers — at concurrency, on live data.
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
                        Here&rsquo;s what the serving engine has to get right — and how Apache Doris
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
                    <Link className="btn btn-yellow" to="/download">
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
                    <Link
                        className="btn btn-primary"
                        to="#"
                    >
                        Try a Demo (Comming Soon)
                        <span aria-hidden="true">→</span>
                    </Link>
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
            description="Deliver sub-second, interactive customer-facing analytics with Apache Doris — high concurrency, real-time data, and embedded SQL."
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
