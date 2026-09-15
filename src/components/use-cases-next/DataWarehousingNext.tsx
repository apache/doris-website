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

function BoltIcon({ size = 24, color = 'var(--brand-accent)', className }: BoltIconProps): JSX.Element {
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

function ValueIcon({ id }: { id: string }): JSX.Element {
    const common = {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
    } as const;

    if (id === 'faster-bi') {
        return (
            <svg {...common} aria-hidden="true">
                <path d="M13 2 3 14h7l-1 8 11-13h-7l1-7z" />
            </svg>
        );
    }
    if (id === 'real-time') {
        return (
            <svg {...common} aria-hidden="true">
                <polyline points="3 12 8 12 11 7 15 17 18 12 21 12" />
            </svg>
        );
    }
    if (id === 'scalable') {
        return (
            <svg {...common} aria-hidden="true">
                <path d="M12 2 2 7l10 5 10-5-10-5z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
            </svg>
        );
    }

    return (
        <svg {...common} aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
            <path d="M9 3v18" />
        </svg>
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
    summary: string;
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
    logo: string;
    logoAlt: string;
    logoClass: string;
    logoText?: string;
    logoTextClass?: string;
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
        summary:
            'Orders, customers, payments, CRM, ERP, ads, and logs become one trusted analytical layer, so every team works from consistent metrics.',
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
        summary:
            'Sub-second SQL turns dimensional drill-downs and ad-hoc questions into fast, interactive conversations across BI tools.',
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
        summary:
            'Fresh CDC, Kafka, and Flink data keeps dashboards, alerts, and operational reports aligned with what is happening now.',
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
        summary:
            'Doris supports TB-to-PB analytics and high concurrency with fewer systems, pipelines, and serving layers, lowering TCO.',
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
        logo: '/images/next/user-logos/sf-express-white.png',
        logoAlt: 'SF Express',
        logoClass: 'case-logo case-logo--sf',
        logoText: 'SF EXPRESS',
        logoTextClass: 'case-logo-text',
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
        logo: '/images/next/user-logos/xiaomi.svg',
        logoAlt: 'Xiaomi',
        logoClass: 'case-logo case-logo--xiaomi',
        logoText: 'XIAO MI',
        logoTextClass: 'case-logo-text',
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
        logo: '/images/next/user-logos/cainiao-icon.png',
        logoAlt: 'Cainiao',
        logoClass: 'case-logo case-logo--cainiao',
        logoText: 'CAI NIAO',
        logoTextClass: 'case-logo-text',
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
            { label: 'Data Model', href: '/docs/dev/key-features/data-model' },
            { label: 'Rollup', href: '/docs/dev/key-features/preaggregation-and-rollup' },
            { label: 'Analytic Functions', href: '/docs/dev/key-features/analytic-functions' },
            { label: 'Partitioning and Bucketing', href: '/docs/dev/key-features/partitioning-and-bucketing' },
            { label: 'Unique Key', href: '/docs/dev/key-features/unique-key' },
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
            { label: 'Load Transaction', href: '/docs/dev/key-features/load-transaction' },
            { label: 'Data Compaction', href: '/docs/dev/key-features/data-compaction' },
            { label: 'Data Update/Delete', href: '/docs/dev/key-features/data-update-delete' },
            { label: 'Preaggregation', href: '/docs/dev/key-features/preaggregation-and-rollup' },
            { label: 'Group Commit', href: '/docs/dev/key-features/group-commit' },
            { label: 'Kafka/CDC Integration', href: '/docs/dev/key-features/kafka-cdc-integration' },
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
            { label: 'Batch Load', href: '/docs/dev/key-features/batch-load' },
            { label: 'Incremental Materialized View', href: '/docs/dev/key-features/incremental-materialized-view' },
            { label: 'Spill to Disk', href: '/docs/dev/key-features/spill-to-disk' },
            { label: 'Binlog/Table Stream (Coming Soon)', href: '/docs/dev/key-features/binlog-table-stream' },
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
            { label: 'Multi Catalog', href: '/docs/dev/key-features/multi-catalog' },
            { label: 'Managing Lake Table', href: '/docs/dev/key-features/managing-lake-table' },
            { label: 'Iceberg', href: '/docs/dev/key-features/iceberg' },
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
                href: '/docs/dev/key-features/pluggable-auth',
            },
            { label: 'Catalog integrations: Glue, Iceberg REST, and more', href: '/docs/dev/key-features/catalog-integrations' },
            { label: 'Data Lineage', href: '/docs/dev/key-features/data-lineage' },
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
    return (
        <section className="section section-value" id="value">
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container section-inner">
                <div className="value-layout">
                    <div className="value-copy" data-reveal>
                        <h2 className="section-title section-title-stacked">
                            <span>Why modern Data&nbsp;Warehousing</span>
                            <span>changes the&nbsp;business.</span>
                        </h2>
                        <p className="value-copy__lead">
                            When the warehouse is unified, fast, real-time, and elastic, four
                            things shift at once:
                        </p>
                        <ul className="value-points">
                            <li className="value-point" data-reveal>
                                The trust of the data
                            </li>
                            <li className="value-point" data-reveal>
                                The speed of analysis
                            </li>
                            <li className="value-point" data-reveal>
                                The freshness of decisions
                            </li>
                            <li className="value-point" data-reveal>
                                The cost of running it all
                            </li>
                        </ul>
                    </div>
                    <ol className="value-cards">
                        {valueCards.map(c => {
                            const [numPart, ...titleParts] = c.num.split('/');
                            const valueTitle = titleParts.join('/').trim();
                            return (
                                <li key={c.id} className="value-card" data-reveal>
                                    <div className="value-card__meta">
                                        <span className="value-card__num">{numPart.trim()}</span>
                                        <span className="value-card__icon" aria-hidden="true">
                                            <ValueIcon id={c.id} />
                                        </span>
                                    </div>
                                    <div className="value-card__body">
                                        <h3 className="value-card__title">{valueTitle}</h3>
                                        <p className="value-card__summary">{c.summary}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
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
        <div className="dw-capability-tags" data-reveal>
            {capabilities.map((c, index) => (
                <article className="dw-capability-tag" key={c.id}>
                    <div className="dw-capability-tag__num">
                        {String(index + 1).padStart(2, '0')}
                    </div>
                    <h4 className="dw-capability-tag__title">{c.title}</h4>
                    <div className="dw-capability-tag__footer">
                        <div className="dw-capability-tag__label">{c.poweredLabel}</div>
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
            ))}
        </div>
    );
}

function TechSection(): JSX.Element {
    const [openRequirement, setOpenRequirement] = useState<string | null>(null);

    return (
        <>
            <section className="section section-tech" id="tech">
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

                <div className="dw-architecture-panel" data-reveal>
                    <div className="dw-architecture-diagram">
                        <img
                            src="/images/use-cases/dw-architecture.png"
                            alt="Modern data warehouse architecture"
                            loading="lazy"
                        />
                    </div>
                    <div className="dw-architecture-features">
                        {requirements.map((r, index) => {
                            const isOpen = openRequirement === r.id;
                            return (
                                <article
                                    className={`dw-arch-feature${isOpen ? ' is-open' : ''}`}
                                    key={r.id}
                                >
                                    <button
                                        type="button"
                                        className="dw-arch-feature__trigger"
                                        onClick={() =>
                                            setOpenRequirement(isOpen ? null : r.id)
                                        }
                                        aria-expanded={isOpen}
                                        aria-controls={`dw-req-${r.id}`}
                                    >
                                        <span className="dw-arch-feature__index">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <span className="dw-arch-feature__title">{r.title}</span>
                                        <svg
                                            className="dw-arch-feature__icon"
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
                                        <div
                                            className="dw-arch-feature__body"
                                            id={`dw-req-${r.id}`}
                                        >
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

            <section className="section section-tech-capabilities" id="capabilities">
                <div className="container section-inner">
                    <h3 className="tech-layer-heading">Apache Doris capabilities for Warehouse</h3>
                    <p className="dw-capability-sub">
                        For more technical details about Apache Doris in warehouse, refer to the
                        technical blogs
                    </p>

                    <CapabilityTags />
                </div>
            </section>
        </>
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
