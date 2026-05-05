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
}

const SWIPE_THRESHOLD = 40;

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
    const touchIsHorizontal = useRef<boolean>(false);

    const go = useCallback(
        (i: number) => setActive(((i % total) + total) % total),
        [total]
    );

    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft') go(active - 1);
        if (e.key === 'ArrowRight') go(active + 1);
    };

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        const t = e.touches[0];
        touchStartX.current = t.clientX;
        touchStartY.current = t.clientY;
        touchIsHorizontal.current = false;
    };

    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const t = e.touches[0];
        const dx = t.clientX - touchStartX.current;
        const dy = t.clientY - touchStartY.current;
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            touchIsHorizontal.current = true;
        }
    };

    const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null) {
            return;
        }
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX.current;
        if (touchIsHorizontal.current && Math.abs(dx) > SWIPE_THRESHOLD) {
            if (dx < 0) go(active + 1);
            else go(active - 1);
        }
        touchStartX.current = null;
        touchStartY.current = null;
        touchIsHorizontal.current = false;
    };

    const footerClass = footerVariant === 'powered' ? 'cap-powered' : 'cf-scenarios';
    const footerLabelClass =
        footerVariant === 'powered' ? 'cap-powered-label' : 'cf-scenarios-label';

    return (
        <div
            className="cover-flow-wrap"
            onKeyDown={onKey}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
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
            'Observability connects logs, traces, and metrics to help teams detect anomalies and find root causes before failures spread. For AI agents, it turns LLM timeouts, prompt failures, failed tool calls, and runaway loops into analyzable execution data.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Application performance monitoring',
            'Microservice troubleshooting',
            'AI agent workflow debugging',
        ],
    },
    {
        id: 'sla',
        num: '02 / User Experience & SLA',
        title: (
            <>
                PROTECT EVERY USER EXPERIENCE,
                <br />
                FROM LATENCY TO ANSWER QUALITY.
            </>
        ),
        desc:
            'Modern observability connects system health to real user impact. For AI applications, that means tracking not only latency, errors, and degraded endpoints, but also answer accuracy, task completion, grounded responses, and human handoff.',
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
                CONTROL OBSERVABILITY COSTS
                <br />
                AS DATA GROWS.
            </>
        ),
        desc:
            'Logs, traces, and agent events can grow faster than budgets. Keep recent data fast for troubleshooting, use aggregates for trends, and move historical data to lower-cost storage.',
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
                MAKE AI APPLICATIONS
                <br />
                IMPROVE OVER TIME..
            </>
        ),
        desc:
            'AI applications can return valid responses that are still wrong, incomplete, or ungrounded. By observing prompts, responses, RAG context, tool calls, scores, and user feedback, teams can continuously improve prompt quality, retrieval accuracy, and task completion.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'LLM application monitoring',
            'RAG quality evaluation',
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
            'Observability becomes more valuable when every signal is tied to business impact. Teams can see which customers, tenants, and workflows are affected — and understand how AI agent failures impact conversion, support load, and revenue.',
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
        title: 'Ingest Every Signal in Real Time',
        desc:
            'Modern observability data streams from applications, Kubernetes, APIs, gateways, databases, and AI systems. Your platform needs to absorb high-volume logs, traces, metrics, and AI agent events with low latency, so every signal — from LLM requests and tool calls to RAG retrievals, token costs, evaluations, and user feedback — is ready to query in near real time.',
    },
    {
        id: 'schema',
        num: 'REQ · 02',
        title: 'Analyze Dynamic JSON Without Heavy ETL',
        desc:
            'Logs, traces, tool outputs, model responses, and agent events often arrive as nested JSON with constantly changing fields. The platform must handle schema evolution and make any new field immediately queryable, so teams can filter, investigate, and analyze new signals without rebuilding pipelines.'
    },
    {
        id: 'search',
        num: 'REQ · 03',
        title: 'Fast Full-Text Search Across Logs and Agent Signals',
        desc:
            'Observability data contains massive volumes of searchable text, from error messages, stack traces and log lines to prompts, model responses, tool outputs and agent failure reasons. Teams need fast keyword and full-text search so they can find failures, trace requests and investigate agent behavior at scale.',
    },
    {
        id: 'analytics',
        num: 'REQ · 04',
        title: 'Interactive Analytics on Metrics, Cost & Quality',
        desc:
            'Observability is not only search. Teams need to slice, aggregate, and drill into massive telemetry datasets to analyze reliability, cost, and AI quality — from P99 latency and SLA trends to token usage, model cost, RAG quality, and agent task completion. That requires a high-performance analytical engine alongside fast search.',
    },
    {
        id: 'hybrid',
        num: 'REQ · 05',
        title: 'Hybrid Search for AI Agent Observability',
        desc:
            'AI agent observability requires more than keyword search over logs. Teams need to correlate structured metadata with full-text and semantic search across prompts, responses, tool calls and traces, so they can find exact matches, similar failures, hallucinated outputs and recurring agent behavior patterns in one query.',
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
            'Apache Doris ingests high-volume telemetry from Kafka, CDC pipelines, and streaming APIs with low latency. Logs, metrics, traces, and AI agent events become queryable in near real time for fast debugging, monitoring, and cost analysis.',
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
            'VARIANT lets teams query JSON and semi-structured observability data as it evolves, from logs and traces to tool outputs and agent events, without rebuilding schemas or ETL pipelines.',
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
                Fast Full-Text Search
                <br />
                with Inverted Index &amp; BM25
            </>
        ),
        desc:
            'Search massive volumes of logs, prompts, responses and tool outputs with inverted indexes, tokenized text search and BM25 relevance scoring, so teams can quickly find failures and understand agent behavior.',
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
                INTERACTIVE ANALYTICS
                <br />
                for Observability&nbsp;Dashboards
            </>
        ),
        desc:
            'Doris accelerates dashboard analytics over observability metrics with a high-performance OLAP engine, materialized views, and transparent SQL query rewriting — from error rates and latency to token usage, model cost, and SLA trends.',
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
            'Doris 4.0 unifies structured filtering, full-text search and vector similarity search in SQL. Teams can search prompts, responses, tool outputs and traces by metadata, keywords and semantic similarity, all in one query.',
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
    return (
        <section className="hero" id="hero">
            <div className="container">
                <div className="hero-grid">
                    <div className="hero-left">
                        <h1 className="hero-title" data-reveal data-reveal-delay="1">
                            <span className="accent">Real-Time</span>
                            <span className="bolt-inline">
                                <BoltIcon size="0.85em" />
                            </span>{' '}
                            Observability
                            <br />
                            for the AI Agent&nbsp;Era
                        </h1>
                        <p className="hero-sub" data-reveal data-reveal-delay="2">
                            Apache Doris unifies logs, metrics, traces and AI agent events on a
                            single high-performance analytical foundation, so teams troubleshoot
                            faster, control costs and keep improving AI quality over time.
                        </p>
                    </div>
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
        footer: { label: c.scenariosLabel, items: c.scenarios },
    }));

    return (
        <section className="section section-value section-cream" id="value">
            <div className="container section-inner">
                <div className="section-head section-head-wide" data-reveal>
                    <h2 className="section-title section-title-stacked">
                        <span>Why Observability&nbsp;matters</span>
                        <span>for modern&nbsp;teams.</span>
                    </h2>
                    <p className="section-sub">
                        When teams unify observability across logs, traces, metrics and AI agent
                        events, five things shift at once: incident detection, user experience,
                        cost at scale, AI quality, and the link between system behavior and business
                        outcomes.
                    </p>
                </div>

                <CoverFlow items={items} footerVariant="scenarios" ariaLabel="Value cards" />
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
                        Three teams run Apache Doris as the analytical foundation for
                        observability: at scale, on real-time operational data, across logs,
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
                <div className="section-head section-head-wide" data-reveal>
                    <h2 className="section-title section-title-stacked">
                        <span>What modern&nbsp;Observability&nbsp;demands</span>
                        <span>and how Apache&nbsp;Doris&nbsp;answers.</span>
                    </h2>
                    <p className="section-sub">
                        Five things a modern observability platform has to be good at, and the
                        specific Apache Doris capabilities that meet each one.
                    </p>
                </div>

                <h3 className="tech-layer-heading">Observability technical requirements</h3>
                <div className={`req-grid${useSix ? ' req-grid-6' : ''}`} data-reveal>
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
                    Build Observability for the AI Agent Era
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
                        Try an Observability Demo
                        <span aria-hidden="true">→</span>
                    </a>
                </div>
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
                <CtaSection />
            </div>
        </LayoutNext>
    );
}
