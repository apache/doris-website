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
        desc: 'Data from orders, customers, payments, CRM, ERP, ads, and logs often tells different versions of the same story. A modern data warehouse brings these signals together into one trusted analytical layer, so every team can work from consistent metrics and make decisions with confidence.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Executive Business Dashboards',
            'Sales and Revenue Analytics',
            'Marketing ROI Analysis',
        ],
    },
    {
        id: 'faster-bi',
        num: '02 / Faster BI & Self-Service',
        title: (
            <>
                Make BI
                <br />
                fast and&nbsp;interactive.
            </>
        ),
        desc: 'Tableau, Power BI, Superset, and Looker are only as responsive as the warehouse behind them. With sub-second SQL, dimensional drill-downs and ad-hoc questions become a conversation, not a wait.',
        scenariosLabel: 'Where it shows up',
        scenarios: ['Self-Service BI', 'Ad-hoc Query', 'Interactive Dashboards'],
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
        desc: 'Batch reports show what happened yesterday. A real-time data warehouse continuously ingests fresh data from CDC streams, Kafka, and Flink, keeping dashboards, alerts, and operational reports aligned with what is happening now.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Real-Time Order Monitoring',
            'Operational Dashboards',
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
        desc: 'As data grows from TBs to PBs and BI workloads become more concurrent, many warehouses add more systems, pipelines, and serving layers. Apache Doris keeps the architecture simple, so teams can support large-scale analytics with fewer moving parts and lower TCO.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Large-Scale Historical Analysis',
            'High-Concurrency BI Reporting',
            'Warehouse Modernization with Lower TCO',
        ],
    },
];

const cases: CaseStudy[] = [
    {
        id: 'sf-technology',
        num: 'Case 01 · SF Technology',
        title: 'SF Express: Replacing Presto with Apache Doris for BI and Ad-hoc Analytics',
        quote: 'Apache Doris cut our P95 query latency by nearly 70% and let us migrate 100% of ad-hoc and BI workloads off Presto, with far better stability and lower cost.',
        outcomes: [
            'P95 query latency reduced by ~70%, with sub-10s queries up from 72% to 88%',
            '48% lower compute cost and 96% data cache hit rate on lakehouse queries',
            '100% of ad-hoc and BI workloads migrated, with 97% SQL compatibility',
        ],
        href: 'https://www.velodb.io/blog/sf-technology-replaced-presto-apache-doris',
    },
    {
        id: 'xiaomi',
        num: 'Case 02 · Xiaomi',
        title: 'Xiaomi: A Unified Lakehouse with Apache Doris and Apache Paimon',
        quote: 'Apache Doris and Apache Paimon let us consolidate fragmented engines and storage into one lakehouse, with 6× faster queries and 5× higher concurrency than Presto.',
        outcomes: [
            'Query latency cut from 60s to 10s; aggregation from 40s to 8s',
            '5× higher concurrent throughput vs. Presto, with 25–75% lower latency under load',
            'One unified stack for hot Doris storage and cold Paimon data across user behavior, device, and operations analytics',
        ],
        href: 'https://www.velodb.io/blog/unified-lakehouse-apache-doris-apache-paimon-xiaomi',
    },
    {
        id: 'cainiao',
        num: 'Case 03 · Cainiao',
        title: 'Cainiao: A Real-Time Lakehouse for Global Logistics at Cainiao',
        quote: 'Data updates can be completed within seconds, and queries can be responded to within hundreds of milliseconds.',
        outcomes: [
            '90% lower cost and 72% faster average response on the real-time data platform',
            '1,000–2,000 QPS point queries (10–100ms) and 200–300 QPS sub-second multi-table joins',
            '25+ Doris clusters and 10,000+ CPUs across 3 regions running with zero failures, powering inventory, package, and order tracking for 80M daily packages',
        ],
        href: 'https://www.velodb.io/blog/apache-doris-empowers-realtime-lakehouse-cainiao',
    },
];

const requirements: Requirement[] = [
    {
        id: 'modeling',
        title: 'Modeling for Warehouse Workloads',
        desc: 'Modern data warehouses need to support detail records, fact and dimension tables, wide tables, aggregated metrics, and business-ready datasets. Strong modeling keeps definitions consistent, improves query performance, and makes trusted data reusable across teams.',
    },
    {
        id: 'freshness',
        title: 'Real-Time Data Freshness',
        desc: 'Business teams need live visibility into what is happening now. That requires streaming ingestion, CDC, incremental updates, and fresh data that becomes queryable within seconds, not after yesterday’s batch.',
    },
    {
        id: 'incremental',
        title: 'Incremental Updates and Reliable Batch Processing',
        desc: 'Modern warehouse workloads need both incremental refresh and large-scale batch execution. Materialized views and incremental computation keep aggregates, rollups, and reporting tables fresh without full recomputation, while reliable batch processing supports end-of-day jobs, backfills, and historical workloads.',
    },
    {
        id: 'lakehouse',
        title: 'Lakehouse & Open Architecture',
        desc: 'Operational databases, event streams, SaaS applications, and open lakehouse tables all contain critical business data. Modern warehouses need to integrate these sources and query data in place across formats like Iceberg, Hudi, Delta Lake, and Hive, without copying everything into another silo.',
    },
    {
        id: 'governance',
        title: 'Enterprise Governance and Operations',
        desc: 'As the warehouse becomes the shared analytics foundation, it must be secure, reliable, auditable, and easy to operate. That requires fine-grained access control, workload isolation, high availability, audit logs, and simplified operations, so every team can safely depend on the same platform.'
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
        desc: 'Support detail records, aggregated metrics, real-time upserts, and analytical datasets in one engine. Doris combines flexible table models with partitioning and bucketing to improve data organization, query performance, and reuse.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Data Model', href: '#' },
            { label: 'Rollup', href: '#' },
            { label: 'Analytic Functions', href: '#' },
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
        desc: 'Apache Doris continuously ingests streaming and CDC data, applies updates in real time, and makes fresh data queryable within seconds, so analytics can move beyond overnight batch pipelines.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Load Transaction', href: '#' },
            { label: 'Data Compaction', href: '#' },
            { label: 'Data Update/Delete', href: '#' },
            { label: 'Preaggregation', href: '#' },
            { label: 'Group Commit', href: '#' },
            { label: 'Kafka/CDC Integration', href: '#' },
        ],
    },
    {
        id: 'incremental',
        num: 'CAP · 03',
        title: (
            <>
                Incremental Refresh
                <br />
                and Batch&nbsp;Execution
            </>
        ),
        desc: 'Incrementally refreshed materialized views keep derived datasets fresh without full recomputation, while Doris reliably executes large SQL jobs for backfills, end-of-day processing, and historical workloads.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Batch Load', href: '#' },
            { label: 'Incremental Materialized View', href: '#' },
            { label: 'Spill to Disk', href: '#' },
            { label: 'Binlog/Table Stream (Coming Soon)', href: '#' },
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
        desc: 'Query, write, and manage open lakehouse tables directly with Doris. Use one SQL layer to access Iceberg, Hudi, Delta Lake, JDBC sources, and internal Doris tables, with Iceberg lifecycle operations such as writes, updates, and compaction.',
        poweredLabel: 'Powered by',
        poweredBy: [
            { label: 'Multi Catalog', href: '#' },
            { label: 'Managing Lake Table', href: '#' },
        ],
    },
    {
        id: 'enterprise',
        num: 'CAP · 05',
        title: (
            <>
                Enterprise-Grade
                <br />
                GOVERNANCE
            </>
        ),
        desc: 'Doris provides the governance and workload controls needed to run shared analytics safely across teams, with pluggable authentication, external catalog integration, and resource isolation built in.',
        poweredLabel: 'Powered by',
        poweredBy: [
            {
                label: 'Pluggable authentication and authorization modules',
                href: '#',
            },
            { label: 'Catalog integrations: Glue, Iceberg REST, and more', href: '#' },
            { label: 'Data Lineage', href: '#' },
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
                        Built for{' '}
                        <span className="accent">
                            Real-Time
                            <span className="bolt-inline">
                                <BoltIcon size="0.85em" />
                            </span>
                        </span>
                        Insights
                    </h1>
                    <p className="hero-sub" data-reveal data-reveal-delay="2">
                        Unify batch and streaming data, accelerate BI analytics, and deliver
                        trusted business insights at scale on a high-performance, real-time
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
                        When the warehouse is unified, fast, real-time, and elastic, four things
                        shift at once: the trust of the data, the speed of analysis, the freshness
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
                        Three teams run Apache Doris as the analytical core of their data
                        warehouse: at scale, with real concurrency, on live business data.
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
                        Five things a modern data warehouse has to be good at, and the specific
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
                    <Link className="btn btn-yellow" to="/docs-next/dev/getting-started/quick-start">
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
