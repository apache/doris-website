import React, {
    CSSProperties,
    JSX,
    KeyboardEvent,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import './ObservabilityNext.scss';

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('.ob-page [data-reveal]');
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

interface CoverFlowItem {
    id: string;
    num: string;
    title: ReactNode;
    desc: string;
    footer: {
        label: string;
        items: string[];
    };
}

interface CoverFlowProps {
    items: CoverFlowItem[];
    footerVariant?: 'scenarios' | 'powered';
    ariaLabel?: string;
    hoverDelayMs?: number;
}

const HOVER_DELAY_DEFAULT = 60;

function CoverFlow({
    items,
    footerVariant = 'scenarios',
    ariaLabel,
    hoverDelayMs = HOVER_DELAY_DEFAULT,
}: CoverFlowProps): JSX.Element {
    const [active, setActive] = useState(0);
    const total = items.length;
    const hoverTimer = useRef<number | null>(null);
    const stageRef = useRef<HTMLDivElement | null>(null);

    const go = useCallback(
        (i: number) => setActive(((i % total) + total) % total),
        [total]
    );

    const onHoverEnter = (i: number) => {
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
        hoverTimer.current = window.setTimeout(() => go(i), hoverDelayMs);
    };
    const onHoverLeave = () => {
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    };

    useEffect(() => {
        return () => {
            if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
        };
    }, []);

    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft') go(active - 1);
        if (e.key === 'ArrowRight') go(active + 1);
    };

    const footerClass = footerVariant === 'powered' ? 'cap-powered' : 'cf-scenarios';
    const footerLabelClass =
        footerVariant === 'powered' ? 'cap-powered-label' : 'cf-scenarios-label';

    return (
        <div className="cover-flow-wrap" onKeyDown={onKey} aria-label={ariaLabel}>
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
                            onMouseEnter={() => onHoverEnter(i)}
                            onMouseLeave={onHoverLeave}
                            onClick={() => {
                                onHoverLeave();
                                go(i);
                            }}
                        >
                            <div className="cf-num">{it.num}</div>
                            <h3 className="cf-title">{it.title}</h3>
                            <p className="cf-desc">{it.desc}</p>
                            <div className={footerClass}>
                                <div className={footerLabelClass}>{it.footer.label}</div>
                                <ul>
                                    {it.footer.items.map(x => (
                                        <li key={x}>{x}</li>
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
    poweredBy: string[];
}

const valueCards: ValueCard[] = [
    {
        id: 'incidents',
        num: '01 / Faster Incident Detection',
        title: (
            <>
                Detect anomalies and find
                <br />
                the root cause&nbsp;sooner.
            </>
        ),
        desc:
            'Modern applications generate massive operational signals across services, infrastructure, databases, APIs and AI systems. Observability correlates logs with traces and metrics so teams identify the root cause of incidents before more users are impacted. In AI agent systems, a failed experience may come from an LLM timeout, a bad prompt, a failed tool call, an irrelevant retrieval or an unexpected agent loop — observability turns these complex execution paths into analyzable data.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Application performance monitoring',
            'Microservice troubleshooting',
            'AI agent execution debugging',
        ],
    },
    {
        id: 'sla',
        num: '02 / User Experience & SLA',
        title: (
            <>
                Protect the experience
                <br />
                real users actually&nbsp;get.
            </>
        ),
        desc:
            'Observability connects system signals to real user impact — latency, error rates, failed requests, degraded endpoints, customer-level effects. For AI applications, experience is also about whether the answer was correct, the agent completed the task, the response was grounded in the right context, and whether the workflow needed human escalation.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Customer-facing analytics',
            'SaaS tenant-level monitoring',
            'AI assistant quality monitoring',
        ],
    },
    {
        id: 'cost',
        num: '03 / Lower Cost at Scale',
        title: (
            <>
                Keep observability
                <br />
                affordable as data&nbsp;grows.
            </>
        ),
        desc:
            'Logs, traces, metrics and agent events grow extremely fast. Traditional observability stacks become expensive when everything is indexed, full traces are stored, and detailed logs are retained for long periods. A modern architecture balances performance and cost: hot data for fast troubleshooting, aggregated data for long-term trends, flexible storage for historical analysis.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'High-volume log analytics',
            'Long-term audit and compliance retention',
            'Cost analysis for LLM and agent workloads',
        ],
    },
    {
        id: 'ai-quality',
        num: '04 / Continuous AI Improvement',
        title: (
            <>
                Make AI applications
                <br />
                get better over&nbsp;time.
            </>
        ),
        desc:
            'AI applications are probabilistic. A request can succeed technically but still produce a wrong, unhelpful, unsafe or ungrounded answer. AI agent observability lets teams analyze prompts, model responses, RAG context, tool calls, evaluation scores, token usage and user feedback — feeding back into prompt quality, model selection, retrieval accuracy, tool reliability and task completion.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'LLM application monitoring',
            'RAG quality analysis',
            'AI agent evaluation and optimization',
        ],
    },
    {
        id: 'business',
        num: '05 / Business-Aware Operations',
        title: (
            <>
                Connect system behavior
                <br />
                to business&nbsp;outcomes.
            </>
        ),
        desc:
            'Observability is most valuable when it is wired to business impact, not only to system errors. Teams can understand which customers, tenants, workloads, models, endpoints or workflows are affected — and for AI agents, how failures translate into user journeys, conversion, support load, customer trust and revenue.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Tenant-level impact analysis',
            'Business-impact incident prioritization',
            'AI workflow success tracking',
        ],
    },
];

const cases: CaseStudy[] = [
    {
        id: 'logs',
        num: 'Case · 01 · Log Analytics',
        title: 'High-Volume Log Analytics at Scale',
        quote:
            'Apache Doris helps us analyze massive volumes of log data with high performance and low latency, enabling our teams to troubleshoot issues faster and support real-time operational analysis.',
        outcomes: [
            'Real-time log ingestion and analysis',
            'Faster troubleshooting across large-scale systems',
            'Reduced storage and query cost for observability workloads',
        ],
        href: 'https://doris.apache.org/blog/',
    },
    {
        id: 'monitoring',
        num: 'Case · 02 · Real-Time Monitoring',
        title: 'Real-Time Monitoring for Business-Critical Systems',
        quote:
            'With Apache Doris, we can monitor key system and business metrics in real time, supporting interactive dashboards and rapid root cause analysis when incidents happen.',
        outcomes: [
            'Real-time dashboard analytics',
            'Low-latency multidimensional queries',
            'Better SLA monitoring and incident response',
        ],
        href: 'https://doris.apache.org/blog/',
    },
    {
        id: 'unified',
        num: 'Case · 03 · Unified Telemetry',
        title: 'Unified Analytics Across Logs, Metrics and Events',
        quote:
            'Apache Doris allows us to bring different types of observability data together and analyze them through SQL, helping engineering and operations teams gain a unified view of system behavior.',
        outcomes: [
            'Unified analysis across logs, metrics and event data',
            'SQL-based investigation and reporting',
            'Scalable analytics for long-term observability data',
        ],
        href: 'https://doris.apache.org/blog/',
    },
];

const requirements: Requirement[] = [
    {
        id: 'ingest',
        num: 'REQ · 01',
        title: 'Real-Time Ingestion of High-Volume Telemetry',
        desc:
            'Logs, traces, metrics and AI agent events stream continuously from applications, Kubernetes, APIs, gateways, databases and AI systems. The platform must support high-throughput ingestion with low latency so signals — including LLM requests, prompts, agent step traces, tool calls, RAG retrieval events, token cost metrics, evaluation scores and user feedback — become queryable almost immediately.',
    },
    {
        id: 'schema',
        num: 'REQ · 02',
        title: 'Flexible Schema for Logs, Traces & Agent Events',
        desc:
            'Observability data is highly semi-structured. Logs, traces, agent events, tool outputs and model responses arrive as JSON with frequently changing fields. The platform must support dynamic fields, nested JSON, schema evolution, fast filtering on extracted fields, and analysis without heavy ETL — even more important for AI agents where each tool, model and framework emits a different event shape.',
    },
    {
        id: 'search',
        num: 'REQ · 03',
        title: 'Fast Search Across Text-Heavy Signals',
        desc:
            'Engineers search massive text — error messages, stack traces, log lines, request and trace IDs, prompt content, model responses, tool outputs, agent failure reasons. Traditional observability requires keyword search; AI agent observability further requires searching across prompts, responses and natural-language outputs at scale.',
    },
    {
        id: 'analytics',
        num: 'REQ · 04',
        title: 'Interactive Analytics on Metrics, Cost & Quality',
        desc:
            'Observability is not only search. Teams run interactive analytical queries over massive datasets — error rate by service, P99 latency by endpoint, cost by model, token usage by tenant, tool failure rate, prompt-version performance, RAG quality distribution, agent task completion, SLA/SLO trends. That requires a high-performance analytical engine, not just a log search system.',
    },
    {
        id: 'hybrid',
        num: 'REQ · 05',
        title: 'Hybrid Search for AI Agent Observability',
        desc:
            'AI agent observability introduces new query patterns beyond logs and metrics. Teams need to find not only exact matches, but semantically similar failures and behaviors — similar user questions, hallucinated answers, prompts that produced bad outputs, traces with similar failure shapes — combining structured filters, full-text search and vector search in one query.',
    },
];

const capabilities: Capability[] = [
    {
        id: 'cap-ingest',
        num: 'CAP · 01',
        title: (
            <>
                Real-Time Ingestion
                <br />
                for Logs &amp; Agent&nbsp;Traces
            </>
        ),
        desc:
            'Apache Doris supports real-time ingestion from Kafka through Routine Load — designed for continuous streaming with common observability formats like CSV and JSON — and provides built-in CDC and message-based ingestion to bring logs, metrics, traces, database changes and AI agent events into the warehouse with low latency.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'Routine Load',
            'Stream Load',
            'Built-in MySQL / PostgreSQL CDC',
            'Built-in Kafka subscription',
            'Real-time data update',
        ],
    },
    {
        id: 'cap-variant',
        num: 'CAP · 02',
        title: (
            <>
                Semi-Structured Analytics
                <br />
                with VARIANT
            </>
        ),
        desc:
            'The VARIANT type is built for flexible analysis of JSON-like data, log-style workloads and dynamic event structures — so observability teams can ingest and analyze logs, traces, tool outputs, model responses and agent events without heavy upfront schema modeling.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'VARIANT data type',
            'JSON analysis',
            'Dynamic schema support',
            'Nested field access',
            'Auto-columnar storage for hot fields',
        ],
    },
    {
        id: 'cap-search',
        num: 'CAP · 03',
        title: (
            <>
                Fast Text Search
                <br />
                with Inverted Index &amp; BM25
            </>
        ),
        desc:
            'Inverted indexes map terms to document IDs for quick search across large volumes of text-heavy observability data. BM25 relevance scoring ranks results across logs, prompts, responses, tool outputs and failure messages.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'Inverted index',
            'Full-text search',
            'Tokenized text search',
            'BM25 relevance scoring',
            'Search over prompts and tool outputs',
        ],
    },
    {
        id: 'cap-olap',
        num: 'CAP · 04',
        title: (
            <>
                Interactive OLAP
                <br />
                for Observability&nbsp;Dashboards
            </>
        ),
        desc:
            'OLAP-style analytical queries and materialized views accelerate repeated dashboard reads and pre-aggregated metrics — error rates, latency, token usage, model cost, tool failures, SLA trends, AI quality scores — through fast SQL-based analytics with transparent rewriting.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'Columnar storage',
            'MPP query engine',
            'Vectorized execution',
            'Materialized views',
            'Rollup / pre-aggregation',
            'High-concurrency dashboard queries',
        ],
    },
    {
        id: 'cap-hybrid',
        num: 'CAP · 05',
        title: (
            <>
                Hybrid Search across
                <br />
                Structured, Text &amp; Vector
            </>
        ),
        desc:
            'Doris 4.0 introduces vector indexing for similarity search alongside structured SQL. Secondary indexes such as inverted indexes accelerate filtered vector queries and TopN search — aligning with hybrid AI-agent observability patterns that combine structured filters, full-text search and semantic similarity.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'Vector index (HNSW)',
            'Vector similarity search',
            'Full-text search',
            'Inverted index',
            'Structured SQL filtering',
        ],
    },
];

function Hero(): JSX.Element {
    const shapes: ShapeSpec[] = [
        { kind: 'diamond', style: { top: 110, left: '38%' } },
        { kind: 'ring', style: { bottom: 180, left: '18%' } },
        { kind: 'cross', style: { top: 220, right: '14%' } },
        { kind: 'circle', style: { bottom: 140, right: '28%' } },
    ];

    return (
        <section className="hero" id="hero">
            <div className="hero-bg" aria-hidden="true" />
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container">
                <div className="hero-grid">
                    <div className="hero-left">
                        <div className="eyebrow hero-eyebrow" data-reveal>
                            <span className="eyebrow-line" />
                            <span>Use Case</span>
                            <span className="ver-pill">Observability</span>
                        </div>
                        <h1 className="hero-title" data-reveal data-reveal-delay="1">
                            Observability
                            <br />
                            for the AI
                            <br />
                            Agent Era,
                            <br />
                            Powered&nbsp;by
                            <br />
                            <span className="accent">
                                Apache{' '}
                                <span className="bolt-inline">
                                    <BoltIcon size="0.85em" />
                                </span>{' '}
                                Doris
                            </span>
                        </h1>
                        <p className="hero-sub" data-reveal data-reveal-delay="2">
                            As applications evolve from microservices to AI agents, observability is
                            no longer limited to logs, metrics and traces. Teams need to understand
                            every system event, user request, LLM call, RAG retrieval, tool
                            execution and agent decision path in real time. Apache Doris provides a
                            high-performance analytical foundation for storing, searching and
                            analyzing massive observability data — so teams troubleshoot faster,
                            control costs and continuously improve AI application quality.
                        </p>
                        <div className="hero-scroll-cue" data-reveal data-reveal-delay="3">
                            <span>Scroll for the case</span>
                            <span className="arrow" aria-hidden="true">
                                ↓
                            </span>
                        </div>
                    </div>
                    <div className="hero-right" aria-hidden="true" />
                </div>
            </div>
            <Shapes specs={shapes} />
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
        footer: { label: c.scenariosLabel, items: c.scenarios },
    }));

    return (
        <section className="section section-value section-cream" id="value">
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container section-inner">
                <div className="section-head" data-reveal>
                    <div className="eyebrow">
                        <span className="eyebrow-line" />
                        <span>Section 02 · Business Value</span>
                    </div>
                    <h2 className="section-title">
                        Why Observability matters
                        <br />
                        for modern&nbsp;teams.
                    </h2>
                    <p className="section-sub">
                        When observability is unified across logs, traces, metrics and AI agent
                        events, five things shift at once — incident detection, user experience,
                        cost at scale, AI quality, and the link between system behavior and business
                        outcomes.
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
                    <div className="eyebrow">
                        <span className="eyebrow-line" />
                        <span>Section 03 · Customer Stories</span>
                    </div>
                    <h2 className="section-title">Already running in production.</h2>
                    <p className="section-sub">
                        Three teams using Apache Doris as the analytical foundation for
                        observability — at scale, on real-time operational data, across logs,
                        metrics and events.
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
    const useSix = requirements.length === 6;

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
                    <div className="eyebrow">
                        <span className="eyebrow-line" />
                        <span>Section 04 · Requirements & Capabilities</span>
                    </div>
                    <h2 className="section-title">
                        What modern Observability demands
                        <br />
                        and how Apache Doris&nbsp;answers.
                    </h2>
                    <p className="section-sub">
                        Five things a modern observability platform has to be good at — and the
                        specific Apache Doris capabilities that meet each one.
                    </p>
                </div>

                <div className="tech-layer-label">
                    Top layer · Observability technical requirements
                </div>
                <div className={`req-grid${useSix ? ' req-grid-6' : ''}`} data-reveal>
                    {requirements.map(r => (
                        <div className="req-card" key={r.id}>
                            <div className="req-num">{r.num}</div>
                            <h4 className="req-title">{r.title}</h4>
                            <p className="req-desc">{r.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="tech-divider">
                    <span className="tech-divider-line" />
                    <span className="tech-divider-label">
                        <BoltIcon size={14} />
                        How Apache Doris answers
                    </span>
                    <span className="tech-divider-line" />
                </div>

                <div className="tech-layer-label">
                    Bottom layer · Apache Doris technical capabilities
                </div>

                <CoverFlow
                    items={capabilityItems}
                    footerVariant="powered"
                    ariaLabel="Capability cards"
                />
            </div>
        </section>
    );
}

export default function ObservabilityNext(): JSX.Element {
    useRevealObserver();
    return (
        <LayoutNext
            title="Apache Doris: Observability for the AI Agent Era"
            description="Apache Doris provides a high-performance analytical foundation for logs, metrics, traces and AI agent events — unifying real-time ingestion, full-text search, OLAP and hybrid vector search."
        >
            <div className="ob-page">
                <Hero />
                <ValueSection />
                <CasesSection />
                <TechSection />
            </div>
        </LayoutNext>
    );
}
