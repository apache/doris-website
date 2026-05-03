import React, { JSX, useEffect, useId, useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import './DataWarehousingNext.scss';

type SatelliteKind = 'warehouse' | 'catalog' | 'storage' | 'compute';

interface Satellite {
    kind: SatelliteKind;
    label: string;
    sublabel: string;
    x: number;
    y: number;
}

interface SectionHeadProps {
    num: string;
    eyebrow: string;
    title: string;
    sub: string;
}

interface StatCard {
    value: string;
    label: string;
    detail: string;
}

const TAGS = [
    'MPP SQL',
    'Star schema',
    'Snowflake joins',
    'CDC',
    'Materialized views',
    'Low-latency BI',
    'Near-real-time loads',
    'Cost governance',
];

const SATELLITES: Satellite[] = [
    { kind: 'warehouse', label: 'BI apps', sublabel: 'Tableau / Looker / Superset', x: 18, y: 20 },
    { kind: 'warehouse', label: 'Dashboards', sublabel: 'Executive reporting', x: 82, y: 20 },
    { kind: 'catalog', label: 'Catalogs', sublabel: 'Hive / Glue / Unity', x: 82, y: 80 },
    { kind: 'storage', label: 'Object storage', sublabel: 'S3 / OSS / GCS / ADLS', x: 18, y: 80 },
    { kind: 'compute', label: 'Streaming ingest', sublabel: 'Kafka / CDC / Flink', x: 50, y: 14 },
    { kind: 'compute', label: 'Ad hoc SQL', sublabel: 'Analysts and data science', x: 50, y: 88 },
];

const CHALLENGES = [
    {
        num: '01',
        title: 'Interactive BI should not feel batch-bound',
        text:
            'Traditional warehouses can look fast on a slide, but real reporting still slows down when joins widen, filters multiply, and concurrency spikes at the top of the hour.',
        pain: 'Query queues',
    },
    {
        num: '02',
        title: 'Copies create drift and delay',
        text:
            'Teams duplicate operational data, build one more semantic layer, and end up reconciling three versions of the same metric. The warehouse becomes a second truth, not a simpler one.',
        pain: 'Metric drift',
    },
    {
        num: '03',
        title: 'Governance breaks when data is fragmented',
        text:
            'When ingestion, transformation, and serving live in separate systems, access control and lineage get harder to reason about just when business users need them most.',
        pain: 'Control gaps',
    },
];

const PILLARS = [
    {
        rank: 'PILLAR / 01',
        num: 'Sub-second',
        unit: 'latency',
        lab: 'For dashboard paths',
        title: 'Keep warehouse queries interactive under real load.',
        text:
            'Doris combines MPP execution, vectorized processing, and aggressive pruning so common warehouse workloads stay responsive as concurrency rises.',
        foot: 'Fast paths for BI',
    },
    {
        rank: 'PILLAR / 02',
        num: '1',
        unit: 'surface',
        lab: 'For your data model',
        title: 'Use one SQL engine for ingest, serving, and analytics.',
        text:
            'The same system can absorb fresh data, maintain serving tables, and answer analyst queries without forcing a warehouse split across multiple products.',
        foot: 'Unified operations',
    },
    {
        rank: 'PILLAR / 03',
        num: '0',
        unit: 'extra',
        lab: 'Copies required',
        title: 'Preserve your source systems instead of cloning them.',
        text:
            'Connect to operational feeds, internal tables, and open storage directly. Keep the original data flow intact while the warehouse layer handles presentation and speed.',
        foot: 'No duplicate truth',
    },
];

const RESOURCES = [
    { num: '/ 01', tag: 'Guide', title: 'Warehouse modernization with Apache Doris', kind: 'OVERVIEW' },
    { num: '/ 02', tag: 'Playbook', title: 'Designing low-latency star schemas and aggregates', kind: 'REFERENCE' },
    { num: '/ 03', tag: 'Benchmark', title: 'Doris vs legacy warehouse for dashboard latency', kind: 'REPORT' },
    { num: '/ 04', tag: 'Tutorial', title: 'Building a warehouse serving layer from CDC and batch', kind: 'HOW-TO' },
    { num: '/ 05', tag: 'Case study', title: 'How teams removed duplicate serving copies with Doris', kind: 'STORY' },
    { num: '/ 06', tag: 'Docs', title: 'Materialized views, caching, and load patterns', kind: 'REFERENCE' },
];

const STAT_CARDS: StatCard[] = [
    { value: '1', label: 'SQL surface', detail: 'Analysts keep one mental model for warehouse and serving queries.' },
    { value: '3x', label: 'Faster dashboards', detail: 'A realistic target when warehouse bottlenecks are driven by scan, join, and concurrency pressure.' },
    { value: '0', label: 'Extra copies', detail: 'Keep the serving layer close to the source data instead of cloning it yet again.' },
];

function SectionHead({ num, eyebrow, title, sub }: SectionHeadProps): JSX.Element {
    return (
        <div className="dw-section-head">
            <div className="dw-section-head__copy">
                <div className="dw-eyebrow">
                    <span className="dw-eyebrow__line" aria-hidden="true" />
                    <span className="dw-eyebrow__num">{num}</span>
                    <span aria-hidden="true">·</span>
                    <span>{eyebrow}</span>
                </div>
                <h2 className="dw-section-head__title">{title}</h2>
                <p className="dw-section-head__sub">{sub}</p>
            </div>
        </div>
    );
}

function LogoMark(): JSX.Element {
    return (
        <Link className="dw-brand" to="/" aria-label="Apache Doris home">
            <span className="dw-brand__mark">D</span>
            <span className="dw-brand__text">Apache Doris</span>
            <span className="dw-brand__version">use case</span>
        </Link>
    );
}

function HeroDiagram(): JSX.Element {
    const gradientId = useId();
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => setTick(current => current + 1), 50);
        return () => window.clearInterval(timer);
    }, []);

    const W = 560;
    const H = 440;
    const cx = W / 2;
    const cy = H / 2 + 10;

    const flows = useMemo(
        () =>
            SATELLITES.map((sat, index) => ({
                ...sat,
                id: index,
                x2: (sat.x / 100) * W,
                y2: (sat.y / 100) * H,
            })),
        []
    );

    return (
        <div className="dw-orbit-card">
            <div className="dw-orbit-card__stripes" aria-hidden="true" />
            <div className="dw-orbit-card__meta">
                <span>WAREHOUSE FABRIC</span>
                <span>FAST SQL · OPEN DATA · GOVERNED ACCESS</span>
            </div>
            <div className="dw-orbit-card__tag">
                <span>QUERY ENGINE</span>
                <span className="dw-orbit-card__tag-sep">/</span>
                <span>APACHE DORIS</span>
            </div>

            <div className="dw-orbit-card__stage">
                <div className="dw-orbit-card__rings" aria-hidden="true" />

                <svg className="dw-orbit-card__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <defs>
                        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#2DDFA8" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#2DDFA8" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx={cx} cy={cy} r="108" fill={`url(#${gradientId})`} />

                    {flows.map(flow => {
                        const kindStroke =
                            flow.kind === 'warehouse'
                                ? 'rgba(11, 122, 88, 0.5)'
                                : flow.kind === 'catalog'
                                  ? 'rgba(11, 122, 88, 0.32)'
                                  : flow.kind === 'storage'
                                    ? 'rgba(15, 26, 20, 0.22)'
                                    : 'rgba(255, 92, 57, 0.35)';
                        const dash = flow.kind === 'warehouse' ? '0' : '4 4';

                        return (
                            <line
                                key={flow.id}
                                x1={cx}
                                y1={cy}
                                x2={flow.x2}
                                y2={flow.y2}
                                stroke={kindStroke}
                                strokeWidth="1"
                                strokeDasharray={dash}
                            />
                        );
                    })}

                    {flows.map(flow => {
                        const phase = ((tick + flow.id * 11) % 100) / 100;
                        const back = ((tick + flow.id * 9 + 50) % 100) / 100;
                        const fxF = flow.x2 + (cx - flow.x2) * phase;
                        const fyF = flow.y2 + (cy - flow.y2) * phase;
                        const fxB = cx + (flow.x2 - cx) * back;
                        const fyB = cy + (flow.y2 - cy) * back;
                        const fillF = flow.kind === 'storage' ? '#FFD23F' : flow.kind === 'catalog' ? '#0B7A58' : '#FF5C39';

                        return (
                            <g key={`packet-${flow.id}`}>
                                <circle cx={fxF} cy={fyF} r="2.7" fill={fillF} opacity="0.95" />
                                <circle cx={fxB} cy={fyB} r="2" fill="#FFD23F" opacity="0.85" />
                            </g>
                        );
                    })}
                </svg>

                {flows.map(flow => (
                    <div
                        key={flow.id}
                        className={`dw-orbit-sat dw-orbit-sat--${flow.kind}`}
                        style={{ left: `${flow.x}%`, top: `${flow.y}%` }}
                    >
                        <span className="dw-orbit-sat__dot" aria-hidden="true" />
                        <span className="dw-orbit-sat__label">{flow.label}</span>
                        <span className="dw-orbit-sat__sub">{flow.sublabel}</span>
                    </div>
                ))}

                <div className="dw-orbit-card__core">
                    <span className="dw-orbit-card__core-kicker">Warehouse</span>
                    <span className="dw-orbit-card__core-title">DORIS</span>
                    <span className="dw-orbit-card__core-sub">MPP · vectorized · governed</span>
                </div>
            </div>

            <div className="dw-orbit-card__stats">
                {STAT_CARDS.map(stat => (
                    <div key={stat.label} className="dw-orbit-card__stat">
                        <div className="dw-orbit-card__stat-value">{stat.value}</div>
                        <div className="dw-orbit-card__stat-label">{stat.label}</div>
                        <div className="dw-orbit-card__stat-detail">{stat.detail}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HeroSection(): JSX.Element {
    return (
        <section className="dw-hero">
            <div className="dw-hero__copy">
                <div className="dw-hero__eyebrow">
                    <span className="dw-hero__eyebrow-line" aria-hidden="true" />
                    <span className="dw-hero__eyebrow-num">USE CASE / 02</span>
                    <span aria-hidden="true">·</span>
                    <span>Data Warehousing</span>
                </div>
                <h1>
                    Warehouse
                    <br />
                    analytics
                    <br />
                    that stay <span className="dw-hero__accent">fast</span>.
                </h1>
                <p className="dw-hero__lede">
                    Apache Doris gives data teams a modern warehouse layer for operational reporting, executive dashboards,
                    and high-concurrency analytics. Keep the model familiar, cut duplication, and serve answers in seconds.
                </p>
                <div className="dw-hero__ctas">
                    <Link className="dw-btn dw-btn--primary" to="/docs-next/dev/getting-started/what-is-apache-doris">
                        Get Started
                    </Link>
                    <Link className="dw-btn dw-btn--yellow" to="/why-doris/compare">
                        Compare Performance
                    </Link>
                    <a className="dw-btn dw-btn--ghost" href="https://github.com/apache/doris" target="_blank" rel="noreferrer noopener">
                        View GitHub
                    </a>
                </div>
                <div className="dw-hero__tags" aria-label="Warehouse capabilities">
                    {TAGS.map(tag => (
                        <span key={tag} className="dw-tag">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            <HeroDiagram />
        </section>
    );
}

function ChallengesSection(): JSX.Element {
    return (
        <section className="dw-section">
            <SectionHead
                num="SECTION / 02"
                eyebrow="The Challenge"
                title="Warehouses need to serve business users, not just store data."
                sub="The hard part is not loading rows. It is keeping reports responsive when the data model grows, concurrency rises, and every business team expects the warehouse to be their source of truth."
            />
            <div className="dw-grid dw-grid--triple">
                {CHALLENGES.map(card => (
                    <article key={card.num} className="dw-card dw-card--challenge">
                        <div className="dw-card__num">/ {card.num}</div>
                        <div className="dw-card__icon" aria-hidden="true">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {card.num === '01' ? (
                                    <>
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M12 7v5l3 2" />
                                    </>
                                ) : card.num === '02' ? (
                                    <>
                                        <path d="M3 8l4-4 4 4M7 4v10" />
                                        <path d="M21 16l-4 4-4-4M17 20V10" />
                                    </>
                                ) : (
                                    <>
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                    </>
                                )}
                            </svg>
                        </div>
                        <h3 className="dw-card__title">{card.title}</h3>
                        <p className="dw-card__text">{card.text}</p>
                        <div className="dw-card__pain">{card.pain}</div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function WhySection(): JSX.Element {
    return (
        <section className="dw-section">
            <SectionHead
                num="SECTION / 03"
                eyebrow="Why Doris"
                title="A warehouse layer that keeps the promise of one system."
                sub="Use Doris as the fast serving layer for warehouse workloads: it fits into existing SQL habits, supports high concurrency, and stays close to the source data model."
            />
            <div className="dw-grid dw-grid--triple">
                {PILLARS.map(pillar => (
                    <article key={pillar.rank} className="dw-pill">
                        <div className="dw-pill__rank">{pillar.rank}</div>
                        <div className="dw-pill__stat">
                            <span className="dw-pill__value">{pillar.num}</span>
                            <span className="dw-pill__unit">{pillar.unit}</span>
                        </div>
                        <div className="dw-pill__lab">{pillar.lab}</div>
                        <h3 className="dw-pill__title">{pillar.title}</h3>
                        <p className="dw-pill__text">{pillar.text}</p>
                        <div className="dw-pill__foot">
                            <span>
                                <strong>{pillar.foot}</strong>
                            </span>
                            <span className="dw-pill__arrow" aria-hidden="true">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M13 5l7 7-7 7" />
                                </svg>
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function ArchSection(): JSX.Element {
    return (
        <section className="dw-section">
            <div className="dw-arch">
                <div className="dw-arch__head">
                    <div className="dw-section-head__copy">
                        <div className="dw-eyebrow">
                            <span className="dw-eyebrow__line" aria-hidden="true" />
                            <span className="dw-eyebrow__num">SECTION / 04</span>
                            <span aria-hidden="true">·</span>
                            <span>Architecture</span>
                        </div>
                        <h2 className="dw-section-head__title">One warehouse engine. Open data below, fast SQL above.</h2>
                        <p className="dw-section-head__sub">
                            Doris sits between data producers and business consumers, pushing down what it can, caching what matters,
                            and keeping the warehouse model manageable as usage grows.
                        </p>
                    </div>
                </div>

                <div className="dw-arch__stack">
                    <div className="dw-arch-row">
                        <div className="dw-arch-row__label">
                            <span className="dw-arch-row__kicker">Layer / 04</span>
                            <span className="dw-arch-row__title">Workloads</span>
                        </div>
                        <div className="dw-chip-grid">
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Tableau
                                <small>SQL</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Looker
                                <small>SQL</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Superset
                                <small>SQL</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Notebooks
                                <small>JDBC</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                APIs
                                <small>MySQL wire</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                AI agents
                                <small>SQL</small>
                            </span>
                        </div>
                    </div>

                    <div className="dw-arch-row dw-arch-row--highlight">
                        <div className="dw-arch-row__label">
                            <span className="dw-arch-row__kicker">Layer / 03</span>
                            <span className="dw-arch-row__title">Compute</span>
                        </div>
                        <div className="dw-chip-grid">
                            <span className="dw-chip dw-chip--highlight">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Apache Doris
                                <small>MPP · vectorized</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Query optimizer
                                <small>CBO</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Predicate pushdown
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Smart cache
                                <small>Hot data</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Materialized views
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                High concurrency
                            </span>
                        </div>
                    </div>

                    <div className="dw-arch-row">
                        <div className="dw-arch-row__label">
                            <span className="dw-arch-row__kicker">Layer / 02</span>
                            <span className="dw-arch-row__title">Sources</span>
                        </div>
                        <div className="dw-chip-grid">
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                CDC streams
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Batch loads
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Open storage
                                <small>S3 / OSS / GCS</small>
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Existing warehouse feeds
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Star schemas
                            </span>
                            <span className="dw-chip">
                                <span className="dw-chip__dot" aria-hidden="true" />
                                Incremental refresh
                            </span>
                        </div>
                    </div>
                </div>

                <div className="dw-arch__notes">
                    <article className="dw-note">
                        <div className="dw-note__num">NOTE / 01</div>
                        <h4 className="dw-note__title">Push down as much work as possible</h4>
                        <p className="dw-note__text">
                            Filter early, reduce scan width, and keep hot aggregations available for the paths that matter most.
                        </p>
                    </article>
                    <article className="dw-note">
                        <div className="dw-note__num">NOTE / 02</div>
                        <h4 className="dw-note__title">Keep the serving layer close to the model</h4>
                        <p className="dw-note__text">
                            The warehouse should help teams understand the business, not force them into a new data language every quarter.
                        </p>
                    </article>
                    <article className="dw-note">
                        <div className="dw-note__num">NOTE / 03</div>
                        <h4 className="dw-note__title">Avoid one more copy unless it truly pays off</h4>
                        <p className="dw-note__text">
                            Doris can serve as the analytical front line without turning every data change into another full warehouse rebuild.
                        </p>
                    </article>
                </div>
            </div>
        </section>
    );
}

function ProofSection(): JSX.Element {
    return (
        <section className="dw-section">
            <SectionHead
                num="SECTION / 05"
                eyebrow="In Practice"
                title="Teams use Doris to simplify warehouse serving."
                sub="The common pattern is straightforward: preserve upstream pipelines, add a faster serving surface, and give analysts one place to ask questions without waiting for heavy copies to catch up."
            />
            <div className="dw-grid dw-grid--proof">
                <article className="dw-quote dw-quote--featured">
                    <div className="dw-quote__mark" aria-hidden="true">
                        "
                    </div>
                    <div className="dw-quote__eyebrow">RETAIL · WAREHOUSE SERVING</div>
                    <p className="dw-quote__text">
                        We kept our existing pipelines and moved the slow reporting layer onto Doris. The data model stayed familiar,
                        but the dashboards started responding like a product, not a nightly job.
                    </p>
                    <div className="dw-quote__attr">
                        <div className="dw-quote__logo">RT</div>
                        <div>
                            <div className="dw-quote__name">Data Platform Lead</div>
                            <div className="dw-quote__role">Retail analytics team</div>
                        </div>
                        <div className="dw-quote__metric">
                            <div className="dw-quote__metric-value">24x</div>
                            <div className="dw-quote__metric-label">Faster report paths</div>
                        </div>
                    </div>
                </article>

                <article className="dw-quote">
                    <div className="dw-quote__mark" aria-hidden="true">
                        "
                    </div>
                    <div className="dw-quote__eyebrow">FINTECH · NO EXTRA COPY</div>
                    <p className="dw-quote__text">
                        We stopped creating another warehouse-side replica just to satisfy the executive dashboard tier. Doris gives us the
                        serving speed without adding another place to reconcile numbers.
                    </p>
                    <div className="dw-quote__attr">
                        <div className="dw-quote__logo">FT</div>
                        <div>
                            <div className="dw-quote__name">Analytics Architect</div>
                            <div className="dw-quote__role">Financial services</div>
                        </div>
                        <div className="dw-quote__metric">
                            <div className="dw-quote__metric-value">0</div>
                            <div className="dw-quote__metric-label">Extra replicas</div>
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}

function ResourcesSection(): JSX.Element {
    return (
        <section className="dw-section">
            <SectionHead
                num="SECTION / 06"
                eyebrow="Resources"
                title="Go deeper on warehouse design with Doris."
                sub="Explore guides, benchmarks, and setup references that help a team evaluate whether Doris should be the warehouse serving layer or the main analytic engine."
            />
            <div className="dw-grid dw-grid--resources">
                {RESOURCES.map(resource => (
                    <a key={resource.num} className="dw-resource" href="#">
                        <div className="dw-resource__top">
                            <span className="dw-resource__num">{resource.num}</span>
                            <span className="dw-resource__tag">{resource.tag}</span>
                        </div>
                        <h4 className="dw-resource__title">{resource.title}</h4>
                        <div className="dw-resource__footer">
                            <span>{resource.kind}</span>
                            <span>READ →</span>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}

function CtaSection(): JSX.Element {
    return (
        <section className="dw-section">
            <div className="dw-cta">
                <div className="dw-cta__copy">
                    <h3>Bring your warehouse plans into one fast serving layer.</h3>
                    <p>
                        Start with the current model, keep the upstream sources intact, and use Doris to deliver the interactive analytics
                        experience business users expect.
                    </p>
                </div>
                <div className="dw-cta__actions">
                    <Link className="dw-btn dw-btn--yellow" to="/docs-next/dev/getting-started/what-is-apache-doris">
                        Quick Start
                    </Link>
                    <Link className="dw-btn dw-btn--ghost dw-btn--light" to="/community/join-community">
                        Talk to the Community
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default function DataWarehousingNext(): JSX.Element {
    return (
        <LayoutNext
            title="Apache Doris: Data Warehousing for fast, governed analytics"
            description="Apache Doris provides a modern data warehousing layer for low-latency dashboards, high-concurrency analytics, and operational reporting on familiar SQL models."
        >
            <div className="dw-page">
                <div className="dw-page__noise" aria-hidden="true" />
                <div className="dw-page__container">
                    <div className="dw-page__brand-row">
                        <LogoMark />
                        <div className="dw-page__brand-note">Data Warehousing use case</div>
                    </div>
                    <HeroSection />
                    <ChallengesSection />
                    <WhySection />
                    <ArchSection />
                    <ProofSection />
                    <ResourcesSection />
                    <CtaSection />
                </div>
            </div>
        </LayoutNext>
    );
}
