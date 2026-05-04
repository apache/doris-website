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
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import './DataWarehousingNext.scss';

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('.dw-page [data-reveal]');
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

interface ShapeProps {
    kind: ShapeKind;
    style?: CSSProperties;
}

function Shape({ kind, style }: ShapeProps): JSX.Element {
    return <span className={`shape shape-${kind}`} style={style} aria-hidden="true" />;
}

interface ShapeSpec {
    kind: ShapeKind;
    style: CSSProperties;
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
    outcomes: string[];
    href: string;
}

interface Requirement {
    id: string;
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
        id: 'unified-view',
        num: '01 / Unified Business View',
        title: (
            <>
                Unify fragmented data
                <br />
                into a single source of&nbsp;truth.
            </>
        ),
        desc: 'Order, user, payment, CRM, ERP, ad and log systems all answer the same question differently. Data Warehousing folds them into one consistent, trusted analytical asset — so every team works from the same numbers.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Executive Business Dashboard',
            'Sales and Revenue Analytics',
            'Marketing ROI Analysis',
        ],
    },
    {
        id: 'faster-bi',
        num: '02 / Faster BI & Self-Service',
        title: (
            <>
                Make BI analytics
                <br />
                fast and&nbsp;interactive.
            </>
        ),
        desc: 'Tableau, Power BI, Superset and Looker only feel good when the warehouse beneath them is fast. Sub-second SQL turns dimensional drill-downs and ad-hoc questions into a conversation, not a wait.',
        scenariosLabel: 'Where it shows up',
        scenarios: ['Self-Service BI', 'Ad-hoc Query', 'Interactive Dashboard'],
    },
    {
        id: 'real-time',
        num: '03 / Real-Time Monitoring',
        title: (
            <>
                From yesterday&rsquo;s reports
                <br />
                to real-time&nbsp;decisions.
            </>
        ),
        desc: 'Daily batches show yesterday. Real-time Data Warehousing ingests through CDC, Kafka, Flink and Stream Load so dashboards, alerts and operational reports always reflect the business as it is right now.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Real-Time Order Monitoring',
            'Operational Dashboard',
            'Risk and Anomaly Detection',
        ],
    },
    {
        id: 'scalable',
        num: '04 / Scalable & Cost-Efficient',
        title: (
            <>
                Scale analytics
                <br />
                without adding&nbsp;complexity.
            </>
        ),
        desc: 'TB- and PB-scale data, hundreds of concurrent analysts, tight storage budgets — modern warehouses have to balance all of it. A simpler architecture means fewer moving parts and a lower TCO at the same workload.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Large-Scale Historical Analysis',
            'High-Concurrency BI Reporting',
            'Cost-Efficient Data Platform Modernization',
        ],
    },
];

const cases: CaseStudy[] = [
    {
        id: 'xiaomi',
        num: 'Case · 01 · Xiaomi',
        title: 'Building a Unified Analytics Platform for Massive-Scale Data',
        quote: 'Apache Doris helps us simplify our analytics architecture while delivering high-performance queries across large-scale business data.',
        outcomes: [
            'Unified analytics across massive business data',
            'Simplified multi-component analytics architecture',
            'Faster BI and interactive query performance',
        ],
        href: 'https://doris.apache.org/blog/',
    },
    {
        id: 'tencent-music',
        num: 'Case · 02 · Tencent Music',
        title: 'Accelerating Real-Time Analytics for User Behavior and Business Insights',
        quote: 'With Apache Doris, we are able to support real-time analytical workloads with faster query response and simpler data pipelines.',
        outcomes: [
            'Real-time user behavior analytics',
            'Faster query response for business insights',
            'Simplified real-time data pipelines',
        ],
        href: 'https://doris.apache.org/blog/',
    },
    {
        id: 'vivo',
        num: 'Case · 03 · Vivo',
        title: 'Powering High-Concurrency BI and Operational Analytics',
        quote: 'Apache Doris enables our teams to run large-scale analytical queries with high concurrency and stable performance.',
        outcomes: [
            'High-concurrency BI workloads',
            'Unified analytics services for multiple business teams',
            'Stable performance on large-scale data',
        ],
        href: 'https://doris.apache.org/blog/',
    },
];

const requirements: Requirement[] = [
    {
        id: 'modeling',
        title: 'Modeling for Warehouse Workloads',
        desc: 'Detail records, aggregated metrics, fact and dimension tables, wide tables, business-ready datasets — modeling unifies definitions, improves query performance, and makes data reusable across teams.',
    },
    {
        id: 'freshness',
        title: 'Real-Time Data Freshness',
        desc: 'Business teams want to monitor what is happening now. That means streaming ingestion, CDC, incremental updates and immediate query visibility — not yesterday’s batch.',
    },
    {
        id: 'incremental',
        title: 'Incremental Computation and Batch Processing',
        desc: 'Materialized views and incremental computation keep derived datasets fresh without recomputing from scratch, while heavy SQL jobs still need to be scheduled and executed reliably for end-of-day, backfill and historical workloads.',
    },
    {
        id: 'lakehouse',
        title: 'Lakehouse & Open Architecture',
        desc: 'Operational databases, event streams, SaaS systems and open lakehouse formats — Iceberg, Hudi, Delta Lake, Hive and object storage — all hold pieces of the business. Warehouses need to integrate these sources and read open formats in place, not copy everything into another silo.',
    },
    {
        id: 'governance',
        title: 'Governance & Operational Simplicity',
        desc: 'Once the warehouse is the shared analytics foundation, it needs access control, workload isolation, HA, auditability and operational simplicity — that’s what makes it safe for every team to depend on.',
    },
];

const capabilities: Capability[] = [
    {
        id: 'modeling',
        num: 'CAP · 01',
        title: (
            <>
                Flexible Warehouse
                <br />
                Data Modeling
            </>
        ),
        desc: 'Multiple data models and physical design options cover detailed records, aggregated metrics, real-time updates and warehouse-style analytical tables in one engine.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Duplicate Key Model', href: '#' },
            { label: 'Aggregate Key Model', href: '#' },
            { label: 'Unique Key Model', href: '#' },
            { label: 'Partitioning and Bucketing', href: '#' },
        ],
    },
    {
        id: 'ingest',
        num: 'CAP · 02',
        title: (
            <>
                Real-Time Ingestion
                <br />
                and&nbsp;Updates
            </>
        ),
        desc: 'Apache Doris supports continuous, fresh ingestion so analytics moves off the batch cadence and onto a live one — without rewriting upstream pipelines.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Built-in MySQL/PostgreSQL CDC capabilities', href: '#' },
            { label: 'Built-in Kafka message subscription capabilities', href: '#' },
            { label: 'High-concurrency, low-latency data ingestion', href: '#' },
            { label: 'Real-time data update capabilities', href: '#' },
        ],
    },
    {
        id: 'incremental',
        num: 'CAP · 03',
        title: (
            <>
                Incremental Computation
                <br />
                and Batch&nbsp;Execution
            </>
        ),
        desc: 'Incremental materialized views keep derived datasets fresh without full recomputation, and the engine can schedule and execute heavy SQL jobs reliably for backfill and historical workloads.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Incremental materialized views', href: '#' },
            { label: 'Binlog, Table Stream, and Dynamic Table (Coming soon)', href: '#' },
            { label: 'Spill to disk', href: '#' },
        ],
    },
    {
        id: 'lakehouse',
        num: 'CAP · 04',
        title: (
            <>
                Lakehouse
                <br />
                Compute Engine
            </>
        ),
        desc: 'Doris reads, writes and manages open lakehouse data directly — full lifecycle support for Iceberg tables including query, write, update and compaction — and federates it with internal Doris tables in one access layer.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Multi-Catalog: Iceberg, Hudi, Delta Lake, JDBC, and more', href: '#' },
            { label: 'Data and metadata cache layer', href: '#' },
        ],
    },
    {
        id: 'enterprise',
        num: 'CAP · 05',
        title: (
            <>
                Enterprise-Ready
                <br />
                Management
            </>
        ),
        desc: 'Access control, workload management, HA and operational reliability — the things that make a shared, business-critical analytics platform safe to run.',
        poweredLabel: 'Powered by',
        poweredBy: [
            {
                label: 'Pluggable authentication and authorization modules: LDAP, RBAC, OIDC, and more',
                href: '#',
            },
            { label: 'Catalog integrations: Glue, Iceberg REST, and more', href: '#' },
            { label: 'Workload Group for resource isolation', href: '#' },
        ],
    },
];

function Hero(): JSX.Element {
    return (
        <section className="hero" id="hero">
            <div className="hero-bg" aria-hidden="true" />
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container">
                <div className="hero-left">
                    <h1 className="hero-title" data-reveal data-reveal-delay="1">
                        Modern Data Warehousing,
                        <br />
                        Powered by{' '}
                        <span className="accent">
                            Apache Doris
                            <span className="bolt-inline">
                                <BoltIcon size="0.85em" />
                            </span>
                        </span>
                    </h1>
                    <p className="hero-sub" data-reveal data-reveal-delay="2">
                        Unify batch and real-time data, accelerate BI analytics, and deliver
                        trusted business insights at scale with a high-performance, real-time
                        analytical database.
                    </p>
                </div>
            </div>
        </section>
    );
}

function ValueSection(): JSX.Element {
    const shapes: ShapeSpec[] = [
        { kind: 'diamond', style: { top: 120, right: '12%' } },
        { kind: 'ring', style: { bottom: 90, left: '8%' } },
    ];

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
                <div className="section-head section-head-wide" data-reveal>
                    <h2 className="section-title section-title-stacked">
                        <span>Why modern Data&nbsp;Warehousing</span>
                        <span>changes the&nbsp;business.</span>
                    </h2>
                    <p className="section-sub">
                        When the warehouse is unified, fast, real-time and elastic, four things
                        shift at once — the trust of the data, the speed of analysis, the freshness
                        of decisions, and the cost of running it all.
                    </p>
                </div>

                <CoverFlow items={items} footerVariant="scenarios" ariaLabel="Value cards" />
            </div>
            <Shapes specs={shapes} />
        </section>
    );
}

function CasesSection(): JSX.Element {
    return (
        <section className="section section-cases" id="cases">
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container section-inner">
                <div className="section-head" data-reveal>
                    <h2 className="section-title">Already running in production.</h2>
                    <p className="section-sub">
                        Three teams using Apache Doris as the analytical core of their data
                        warehouse — at scale, with real concurrency, on live business data.
                    </p>
                </div>

                <div className="cases-grid">
                    {cases.map((c, i) => (
                        <a
                            key={c.id}
                            className="case-card"
                            href={c.href}
                            target="_blank"
                            rel="noreferrer"
                            data-reveal
                            data-reveal-delay={i > 0 ? String(i) : undefined}
                        >
                            <div className="case-num">{c.num}</div>
                            <h3 className="case-title">{c.title}</h3>
                            <p className="case-quote">&ldquo;{c.quote}&rdquo;</p>
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
                <div className="section-head section-head-wide" data-reveal>
                    <h2 className="section-title section-title-stacked">
                        <span>What Data&nbsp;Warehousing&nbsp;demands</span>
                        <span>and how Apache&nbsp;Doris&nbsp;answers.</span>
                    </h2>
                    <p className="section-sub">
                        Five things a modern data warehouse has to be good at — and the specific
                        Apache Doris capabilities that meet each one.
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

function CtaSection(): JSX.Element {
    return (
        <section className="section-cta" id="start">
            <div className="cta-inner container">
                <h2 className="cta-title" data-reveal data-reveal-delay="1">
                    Build Modern Data Warehousing
                    <br />
                    with <span className="accent">Apache Doris.</span>
                </h2>
                <div className="cta-actions" data-reveal data-reveal-delay="2">
                    <a className="btn btn-yellow" href="#">
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
                        Get Started with Apache Doris
                    </a>
                    <a className="btn btn-primary" href="#TODO">
                        Try a Data Warehousing Demo
                        <span aria-hidden="true">→</span>
                    </a>
                </div>
            </div>
        </section>
    );
}

export default function DataWarehousingNext(): JSX.Element {
    useRevealObserver();
    return (
        <LayoutNext
            title="Apache Doris: Data Warehousing for fast, governed analytics"
            description="Apache Doris provides a modern data warehousing layer for low-latency dashboards, high-concurrency analytics, and operational reporting on familiar SQL models."
        >
            <div className="dw-page">
                <Hero />
                <ValueSection />
                <CasesSection />
                <TechSection />
                <CtaSection />
            </div>
        </LayoutNext>
    );
}
