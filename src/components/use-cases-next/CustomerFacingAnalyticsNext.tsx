import React, { JSX, ReactNode, useEffect, useId, useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import './CustomerFacingAnalyticsNext.scss';

interface MetricTarget {
    value: number;
    spread: number;
    interval: number;
}

function useCounter(target: number, duration = 1400): number {
    const [value, setValue] = useState(() => target * 0.62);

    useEffect(() => {
        let raf = 0;
        const from = value;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(from + (target - from) * eased);
            if (progress < 1) {
                raf = window.requestAnimationFrame(tick);
            }
        };

        raf = window.requestAnimationFrame(tick);
        return () => window.cancelAnimationFrame(raf);
    }, [duration, target]);

    return value;
}

function useDriftingTarget({ value, spread, interval }: MetricTarget): number {
    const [target, setTarget] = useState(value);

    useEffect(() => {
        const timer = window.setInterval(() => {
            const delta = (Math.random() - 0.5) * 2 * spread;
            setTarget(value + delta);
        }, interval);

        return () => window.clearInterval(timer);
    }, [interval, spread, value]);

    return target;
}

function SectionEyebrow({ num, label }: { num: string; label: string }): JSX.Element {
    return (
        <div className="cfa-eyebrow">
            <span className="cfa-eyebrow__line" aria-hidden="true" />
            <span className="cfa-eyebrow__num">{num}</span>
            <span aria-hidden="true">·</span>
            <span>{label}</span>
        </div>
    );
}

function HeroStream(): JSX.Element {
    const gradientId = useId();
    const eventsTarget = useDriftingTarget({ value: 184000, spread: 16000, interval: 1800 });
    const events = Math.round(useCounter(eventsTarget, 1200));
    const latencyTarget = useDriftingTarget({ value: 34, spread: 10, interval: 1600 });
    const latency = Math.round(useCounter(latencyTarget, 900));

    const sparkline = useMemo(
        () => Array.from({ length: 28 }, (_, i) => 30 + Math.sin(i * 0.56) * 9 + (i % 5) * 1.8),
        []
    );
    const [points, setPoints] = useState(sparkline);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setPoints(prev => {
                const next = prev.slice(1);
                const base = 28 + Math.sin(Date.now() / 880) * 11;
                next.push(base + (Math.random() - 0.5) * 12);
                return next;
            });
        }, 480);

        return () => window.clearInterval(timer);
    }, []);

    const width = 280;
    const height = 52;
    const pad = 2;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const xy = points.map((v, i) => {
        const x = pad + (i / (points.length - 1)) * (width - pad * 2);
        const y = pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
        return [x, y] as const;
    });
    const path = xy.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const area = `${path} L ${xy[xy.length - 1][0].toFixed(1)} ${height} L ${xy[0][0].toFixed(1)} ${height} Z`;

    return (
        <div className="cfa-stream">
            <div className="cfa-stream__stripes" aria-hidden="true" />
            <div className="cfa-stream__head">
                <span className="cfa-stream__tag">
                    <span className="cfa-stream__pulse" aria-hidden="true" />
                    LIVE · INGEST
                </span>
                <span className="cfa-stream__meta">TENANT 12 / 48 · P50 21ms</span>
            </div>

            <div className="cfa-pipeline">
                <div className="cfa-source-stack">
                    <div className="cfa-source">
                        <span className="cfa-source__dot" />
                        <span>APP EVENTS</span>
                        <span className="cfa-source__rate">98k/s</span>
                    </div>
                    <div className="cfa-source">
                        <span className="cfa-source__dot cfa-source__dot--coral" />
                        <span>MYSQL CDC</span>
                        <span className="cfa-source__rate">32k/s</span>
                    </div>
                    <div className="cfa-source">
                        <span className="cfa-source__dot cfa-source__dot--yellow" />
                        <span>PAYMENTS</span>
                        <span className="cfa-source__rate">12k/s</span>
                    </div>
                    <div className="cfa-source">
                        <span className="cfa-source__dot cfa-source__dot--green" />
                        <span>OBJECT STORE</span>
                        <span className="cfa-source__rate">batch</span>
                    </div>
                </div>

                <div className="cfa-core">
                    <span className="cfa-core__label">Doris</span>
                    {[0, 1, 2, 3].map(i => (
                        <span key={i} className={`cfa-core__packet cfa-core__packet--${i + 1}`} />
                    ))}
                </div>

                <div className="cfa-source-stack cfa-source-stack--right">
                    <div className="cfa-source">
                        <span className="cfa-source__dot" />
                        <span>EMBEDDED DASHBOARDS</span>
                    </div>
                    <div className="cfa-source">
                        <span className="cfa-source__dot cfa-source__dot--coral" />
                        <span>CUSTOMER PORTALS</span>
                    </div>
                    <div className="cfa-source">
                        <span className="cfa-source__dot cfa-source__dot--yellow" />
                        <span>AI AGENTS</span>
                    </div>
                    <div className="cfa-source">
                        <span className="cfa-source__dot cfa-source__dot--green" />
                        <span>ALERTS</span>
                    </div>
                </div>
            </div>

            <div className="cfa-counters">
                <div className="cfa-counter">
                    <div className="cfa-counter__label">EVENTS / SEC</div>
                    <div className="cfa-counter__value">{events.toLocaleString()}</div>
                    <div className="cfa-counter__trend cfa-counter__trend--up">2.8% vs 1m</div>
                </div>
                <div className="cfa-counter">
                    <div className="cfa-counter__label">QUERY P99</div>
                    <div className="cfa-counter__value">
                        {latency}
                        <em>ms</em>
                    </div>
                    <div className="cfa-counter__trend cfa-counter__trend--coral">SLO &lt; 100ms</div>
                </div>
            </div>

            <div className="cfa-spark">
                <div className="cfa-spark__head">
                    <span className="cfa-spark__label">QPS · LAST 60s</span>
                    <span className="cfa-spark__value">11.8k avg</span>
                </div>
                <svg className="cfa-spark__svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="QPS trend over the last 60 seconds">
                    <defs>
                        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#0B7A58" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#0B7A58" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={area} fill={`url(#${gradientId})`} />
                    <path d={path} fill="none" stroke="#0B7A58" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                    <circle
                        cx={xy[xy.length - 1][0]}
                        cy={xy[xy.length - 1][1]}
                        r="2.4"
                        fill="#FFD23F"
                        stroke="#0B7A58"
                        strokeWidth="1"
                    />
                </svg>
            </div>
        </div>
    );
}

function Hero(): JSX.Element {
    return (
        <header className="cfa-hero">
            <div className="cfa-hero__copy">
                <SectionEyebrow num="USE CASE / 02" label="Customer-Facing Analytics" />
                <h1>
                    Subsecond
                    <span className="cfa-hero__accent"> analytics</span>
                    <br />
                    inside your product.
                </h1>
                <p className="cfa-hero__lede">
                    Use Doris for embedded dashboards, account-level reporting, and live decisioning
                    surfaces without bolting on caches or per-tenant replicas.
                </p>
                <div className="cfa-hero__ctas">
                    <Link className="cfa-btn cfa-btn--primary" to="/download">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" />
                        </svg>
                        Download Doris
                    </Link>
                    <Link className="cfa-btn cfa-btn--yellow" to="/docs-next/dev/getting-started/what-is-apache-doris">
                        Quick Start →
                    </Link>
                    <Link className="cfa-btn cfa-btn--ghost" to="/community/join-community">
                        Talk to Engineering
                    </Link>
                </div>
                <div className="cfa-hero__stats">
                    <div className="cfa-hero__stat">
                        <span className="cfa-hero__stat-num">~ <em>1s</em></span>
                        <span className="cfa-hero__stat-label">Freshness Target</span>
                    </div>
                    <div className="cfa-hero__stat">
                        <span className="cfa-hero__stat-num">&lt; <em>100ms</em></span>
                        <span className="cfa-hero__stat-label">Interactive Query Latency</span>
                    </div>
                    <div className="cfa-hero__stat">
                        <span className="cfa-hero__stat-num">&gt; <em>10k</em> QPS</span>
                        <span className="cfa-hero__stat-label">Concurrent Users</span>
                    </div>
                </div>
            </div>

            <HeroStream />
        </header>
    );
}

interface Card {
    num: string;
    icon: ReactNode;
    title: string;
    text: string;
    tags: string[];
}

const APPLICATIONS: Card[] = [
    {
        num: '01 / 03',
        icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 12l4-4 4 4 4-6 6 8" />
                <path d="M3 20h18" />
            </svg>
        ),
        title: 'Embedded Dashboards',
        text: 'Ship customer analytics directly inside your SaaS app. Doris serves each tenant with fresh rows, high concurrency, and predictable latency without building a separate serving layer.',
        tags: ['Tenant Isolation', 'SaaS Reporting', 'Embedded BI', 'Customer Portals'],
    },
    {
        num: '02 / 03',
        icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <path d="M8 20h8M12 18v2M7 8h10M7 12h6" />
            </svg>
        ),
        title: 'Customer Reporting',
        text: 'Support recurring billing views, usage rollups, and account-level exports with SQL that stays familiar to your data team and fast enough for your users.',
        tags: ['Usage Reports', 'Billing Analytics', 'Exports', 'Ad-Hoc Queries'],
    },
    {
        num: '03 / 03',
        icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </svg>
        ),
        title: 'Real-Time Decisioning',
        text: 'Deliver live alerts, recommendation surfaces, and operational summaries that need current data at the moment a customer opens the product.',
        tags: ['Fraud Signals', 'Recommendations', 'Live Alerts', 'Operational Views'],
    },
];

function Applications(): JSX.Element {
    return (
        <section className="cfa-section">
            <div className="cfa-section__head">
                <div className="cfa-section__copy">
                    <SectionEyebrow num="02" label="Applications" />
                    <h2 className="cfa-section__title">Three ways teams use customer-facing analytics.</h2>
                    <p className="cfa-section__sub">
                        From embedded reporting to decisioning. From internal data teams to product
                        teams shipping analytics directly to external users.
                    </p>
                </div>
            </div>

            <div className="cfa-apps">
                {APPLICATIONS.map((item, index) => (
                    <article key={item.title} className="cfa-app" style={{ animationDelay: `${index * 90}ms` }}>
                        <span className="cfa-app__num">{item.num}</span>
                        <div className="cfa-app__mark">{item.icon}</div>
                        <h3 className="cfa-app__title">{item.title}</h3>
                        <p className="cfa-app__text">{item.text}</p>
                        <div className="cfa-app__tags">
                            {item.tags.map(tag => (
                                <span key={tag} className="cfa-app__tag">
                                    <span className="cfa-app__tag-dot" aria-hidden="true" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

interface Pillar {
    pre: string;
    num: string;
    unit: string;
    label: string;
    title: string;
    items: string[];
}

const PILLARS: Pillar[] = [
    {
        pre: '~',
        num: '1',
        unit: 's',
        label: 'Freshness Target',
        title: 'Real-Time Ingestion & Update',
        items: ['Streaming ingestion from CDC and Kafka', 'Atomic writes with MVCC reads', 'Fast schema evolution', 'Fresh data without batch lag'],
    },
    {
        pre: '<',
        num: '100',
        unit: 'ms',
        label: 'Interactive Query Latency',
        title: 'Blazing-Fast Analytics',
        items: ['MPP distributed architecture', 'Vectorized execution engine', 'CBO-driven joins', 'Predicate push-down and pruning'],
    },
    {
        pre: '>',
        num: '10k',
        unit: 'QPS',
        label: 'Concurrent Users',
        title: 'High-Concurrency Customer Access',
        items: ['Tenant-aware data modeling', 'Partitioning and indexing', 'Pre-aggregation where it helps', 'Scaling without per-customer replicas'],
    },
];

function Pillars(): JSX.Element {
    return (
        <section className="cfa-section">
            <div className="cfa-section__head">
                <div className="cfa-section__copy">
                    <SectionEyebrow num="03" label="Why Choose Doris" />
                    <h2 className="cfa-section__title">Three numbers that define customer-facing analytics.</h2>
                    <p className="cfa-section__sub">
                        Freshness you can promise. Latency you can expose in the UI. Concurrency you can
                        scale without adding per-tenant infrastructure.
                    </p>
                </div>
            </div>

            <div className="cfa-pillars">
                {PILLARS.map((pillar, index) => (
                    <article key={pillar.title} className="cfa-pillar" style={{ animationDelay: `${index * 90}ms` }}>
                        <div className="cfa-pillar__stat">
                            <span className="cfa-pillar__pre">{pillar.pre}</span>
                            <span className="cfa-pillar__num">{pillar.num}</span>
                            <span className="cfa-pillar__unit">{pillar.unit}</span>
                        </div>
                        <div className="cfa-pillar__label">{pillar.label}</div>
                        <h3 className="cfa-pillar__title">{pillar.title}</h3>
                        <ul className="cfa-pillar__list">
                            {pillar.items.map(item => (
                                <li key={item}>
                                    <span className="cfa-pillar__check" aria-hidden="true">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}

function Architecture(): JSX.Element {
    return (
        <section className="cfa-section">
            <div className="cfa-arch">
                <div className="cfa-arch__left">
                    <SectionEyebrow num="04" label="Architecture" />
                    <h2 className="cfa-arch__title">
                        A simpler
                        <br />
                        customer analytics stack.
                    </h2>
                    <p className="cfa-arch__sub">
                        Doris collapses ingestion, transformation, analytics, and serving into one
                        MySQL-protocol endpoint. Fewer hops means lower latency and a stack that is
                        easier to keep reliable.
                    </p>
                    <div className="cfa-arch__features">
                            <div className="cfa-arch__feature">
                            <div className="cfa-arch__icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M4 6h16M4 12h16M4 18h10" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="cfa-arch__feature-title">Diverse Real-Time Data Imports</h4>
                                <p className="cfa-arch__feature-text">
                                    StreamLoad for direct writes, RoutineLoad for Kafka-style continuous pulls,
                                    and ETL paths that fit the pipeline you already have.
                                </p>
                            </div>
                        </div>
                        <div className="cfa-arch__feature">
                            <div className="cfa-arch__icon cfa-arch__icon--yellow">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <ellipse cx="12" cy="6" rx="8" ry="3" />
                                    <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="cfa-arch__feature-title">MySQL-Compatible Protocol</h4>
                                <p className="cfa-arch__feature-text">
                                    Standard JDBC and ODBC support, which keeps the analytics layer usable by the
                                    BI tools and SQL clients your team already knows.
                                </p>
                            </div>
                        </div>
                        <div className="cfa-arch__feature">
                            <div className="cfa-arch__icon cfa-arch__icon--coral">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M5 12h14M13 6l6 6-6 6" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="cfa-arch__feature-title">Simplified Product Data Pipeline</h4>
                                <p className="cfa-arch__feature-text">
                                    Less glue code, fewer caches, and fewer per-customer replicas mean faster
                                    delivery for the product team and fewer operational surprises.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cfa-arch__right">
                    <div className="cfa-diagram" aria-label="Customer analytics architecture diagram">
                        <div className="cfa-diagram__column">
                            <div className="cfa-diagram__column-label">SOURCES</div>
                            <div className="cfa-diagram__node">App Events<small>StreamLoad</small></div>
                            <div className="cfa-diagram__node">CRM<small>CDC</small></div>
                            <div className="cfa-diagram__node">Payments<small>ETL</small></div>
                            <div className="cfa-diagram__node">Object Store<small>Bulk Load</small></div>
                        </div>
                        <div className="cfa-diagram__center">
                            <span className="cfa-diagram__pill">Real-Time</span>
                            <div className="cfa-diagram__core">Doris</div>
                            <span className="cfa-diagram__pill">Subsecond</span>
                        </div>
                        <div className="cfa-diagram__column">
                            <div className="cfa-diagram__column-label">CONSUMERS</div>
                            <div className="cfa-diagram__node">BI Tools<small>Tableau · Superset</small></div>
                            <div className="cfa-diagram__node">SaaS App<small>Embedded</small></div>
                            <div className="cfa-diagram__node">AI Agent<small>Decisioning</small></div>
                            <div className="cfa-diagram__node">Alerts<small>Fraud · Ops</small></div>
                        </div>
                        <svg className="cfa-diagram__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                            {[18, 38, 58, 78].map((y, index) => (
                                <g key={index}>
                                    <path d={`M 28 ${y} Q 42 ${y} 50 50`} fill="none" stroke="rgba(11,122,88,0.35)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
                                    <path d={`M 50 50 Q 58 ${y} 72 ${y}`} fill="none" stroke="rgba(11,122,88,0.35)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}

interface LogoCell {
    name: string;
    stat: string;
    meta: string;
}

const LOGOS: LogoCell[] = [
    { name: 'Tencent Music', stat: '8× faster', meta: 'Music streaming' },
    { name: 'JD.com', stat: '70% cost ↓', meta: 'E-commerce' },
    { name: 'NetEase', stat: '< 50ms P99', meta: 'Gaming' },
    { name: 'Youzan', stat: '2–3× joins', meta: 'SaaS' },
    { name: 'Xiaomi', stat: '12k QPS', meta: 'Telemetry' },
    { name: 'Kuaishou', stat: '600M DAU', meta: 'Short video' },
];

function Cases(): JSX.Element {
    return (
        <section className="cfa-section">
            <div className="cfa-section__head cfa-section__head--split">
                <div className="cfa-section__copy">
                    <SectionEyebrow num="05" label="In Production" />
                    <h2 className="cfa-section__title">5,000+ companies, billions of rows per second.</h2>
                    <p className="cfa-section__sub">
                        The customer-facing analytics pattern shows up in product usage, billing,
                        support, and in-app reporting where freshness and concurrency both matter.
                    </p>
                </div>
                <Link className="cfa-btn cfa-btn--ghost cfa-btn--inline" to="/users">
                    All User Stories →
                </Link>
            </div>

            <div className="cfa-cases">
                <article className="cfa-quote">
                    <span className="cfa-quote__mark" aria-hidden="true">"</span>
                    <span className="cfa-quote__eyebrow">Featured · Tencent Music</span>
                    <p className="cfa-quote__text">
                        After migrating to Apache Doris, the analytics layer improved timeliness,
                        reduced operational overhead, and gave the product team a single engine for
                        customer-facing dashboards.
                    </p>
                    <div className="cfa-quote__attr">
                        <div className="cfa-quote__logo">T</div>
                        <div>
                            <div className="cfa-quote__name">Tencent Music Entertainment</div>
                            <div className="cfa-quote__role">Real-time analytics platform · 800M MAU</div>
                        </div>
                        <div className="cfa-quote__metrics">
                            <div className="cfa-quote__metric">
                                <div className="cfa-quote__metric-value">8×</div>
                                <div className="cfa-quote__metric-label">Query Speed</div>
                            </div>
                            <div className="cfa-quote__metric">
                                <div className="cfa-quote__metric-value">−40%</div>
                                <div className="cfa-quote__metric-label">Infra Cost</div>
                            </div>
                        </div>
                    </div>
                </article>

                <div className="cfa-logos">
                    <div className="cfa-logos__head">Trusted by</div>
                    <div className="cfa-logos__cells">
                        {LOGOS.map(item => (
                            <div key={item.name} className="cfa-logo-cell">
                                <div className="cfa-logo-cell__name">{item.name}</div>
                                <div>
                                    <div className="cfa-logo-cell__stat">{item.stat}</div>
                                    <div className="cfa-logo-cell__meta">{item.meta}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

interface Resource {
    num: string;
    tag: string;
    title: string;
}

const RESOURCES: Resource[] = [
    { num: '01', tag: 'Engineering Deep Dive', title: 'Why Apache Doris excels at OLAP for real-time customer analytics.' },
    { num: '02', tag: 'Pattern', title: 'Integrating Apache Flink and Doris for embedded analytics at scale.' },
    { num: '03', tag: 'Feature', title: 'Automatic and flexible data sharding with auto partitioning.' },
    { num: '04', tag: 'Benchmark', title: 'Apache Doris tops RTABench for low-latency analytics.' },
    { num: '05', tag: 'Engineering', title: 'How Doris execution engine improvements keep queries subsecond.' },
    { num: '06', tag: 'Case Study', title: "JD.com's practice with Doris in real-time OLAP." },
];

function Resources(): JSX.Element {
    return (
        <section className="cfa-section">
            <div className="cfa-section__head cfa-section__head--split">
                <div className="cfa-section__copy">
                    <SectionEyebrow num="06" label="Featured Reading" />
                    <h2 className="cfa-section__title">Go deeper, when you’re ready.</h2>
                </div>
                <Link className="cfa-btn cfa-btn--ghost cfa-btn--inline" to="/blog">
                    Browse the Blog →
                </Link>
            </div>

            <div className="cfa-resources">
                {RESOURCES.map(resource => (
                    <Link key={resource.num} className="cfa-resource" to="/blog">
                        <div className="cfa-resource__top">
                            <span className="cfa-resource__num">{resource.num}</span>
                            <span className="cfa-resource__tag">{resource.tag}</span>
                        </div>
                        <h4 className="cfa-resource__title">{resource.title}</h4>
                        <div className="cfa-resource__arrow">
                            <span>Read article</span>
                            <span aria-hidden="true">→</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function CTA(): JSX.Element {
    return (
        <section className="cfa-section">
            <div className="cfa-cta">
                <div className="cfa-cta__text">
                    <h3>Build your customer-facing analytics stack on Doris.</h3>
                    <p>
                        Apache 2.0 license. MySQL protocol. Real-time ingest and subsecond queries for
                        the SaaS dashboards, billing views, and embedded analytics your customers rely on.
                    </p>
                </div>
                <div className="cfa-cta__actions">
                    <Link className="cfa-btn cfa-btn--yellow" to="/docs-next/dev/getting-started/what-is-apache-doris">
                        Quick Start →
                    </Link>
                    <Link className="cfa-btn cfa-btn--ghost cfa-btn--light" to="/community/join-community">
                        Talk to Engineering
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function CustomerFacingAnalyticsNext(): JSX.Element {
    return (
        <LayoutNext
            title="Apache Doris | Customer-Facing Analytics"
            description="Build embedded, tenant-safe customer-facing analytics with Apache Doris: fresh data, subsecond queries, and high concurrency for SaaS products."
        >
            <div className="cfa-page" data-screen-label="Customer-Facing Analytics">
                <Hero />
                <Applications />
                <Pillars />
                <Architecture />
                <Cases />
                <Resources />
                <CTA />
            </div>
        </LayoutNext>
    );
}
