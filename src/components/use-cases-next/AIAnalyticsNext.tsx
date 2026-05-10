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
import './AIAnalyticsNext.scss';

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('.ai-page [data-reveal]');
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
    customFooter?: ReactNode;
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
                            {it.customFooter ?? (
                                <div className={footerClass}>
                                    <div className={footerLabelClass}>{it.footer.label}</div>
                                    <ul>
                                        {it.footer.items.map(x => (
                                            <li key={x}>{x}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
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
        id: 'real-time',
        num: '01 / Real-Time AI Decisions',
        title: (
            <>
                Power real-time
                <br />
                AI&nbsp;decisions.
            </>
        ),
        desc:
            'AI agents need fresh business context, not yesterday’s batch data. Real-time analytics lets them query live operational data, detect changes, and act while the user interaction or business process is still happening.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Real-time fraud detection',
            'Personalized recommendation',
            'Ad serving and bidding',
            'AI customer support agents',
            'Operations copilots and agents',
        ],
    },
    {
        id: 'data-aware',
        num: '02 / Data-Aware Applications',
        title: (
            <>
                Make AI applications
                <br />
                data-aware.
            </>
        ),
        desc:
            'AI applications need more than prompts. To deliver useful answers and take reliable actions, copilots, agents, and RAG systems need fresh, trusted, queryable enterprise data. With real-time access to business context, user history, operational metrics, documents, logs, and feedback, AI applications can turn enterprise data into context, memory, and intelligence.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Enterprise copilots',
            'Customer-facing AI assistants',
            'Internal knowledge assistants',
            'AI-powered business workflows',
            'Agent-facing analytics',
        ],
    },
    {
        id: 'rag-quality',
        num: '03 / RAG & Knowledge Retrieval',
        title: (
            <>
                Improve RAG and
                <br />
                knowledge&nbsp;retrieval.
            </>
        ),
        desc:
            'RAG systems need more than vector search alone. In real enterprise environments, the right context depends on semantic similarity, keyword relevance, metadata, permissions, time ranges, and business signals. By combining SQL filtering, full-text search, BM25, and vector search in one query, teams can retrieve more accurate context for LLMs and reduce hallucinations caused by incomplete or irrelevant retrieval.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'RAG applications',
            'Enterprise knowledge search',
            'AI copilots',
            'Agent memory',
            'Document and log retrieval',
        ],
    },
    {
        id: 'observable',
        num: '04 / AI Observability',
        title: (
            <>
                Make AI systems
                <br />
                observable.
            </>
        ),
        desc:
            'AI systems do not fail like traditional applications. A request may complete successfully while still returning a wrong answer, an ungrounded response, excessive cost, or poor user experience. Teams need to analyze prompts, responses, traces, tool calls, retrieval context, token usage, latency, cost, evaluation scores, and user feedback together to debug issues, monitor quality, control spend, and continuously improve agent behavior.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'LLM application monitoring',
            'AI agent trace analysis',
            'RAG quality analysis',
            'Prompt and response debugging',
            'Model cost and quality optimization',
        ],
    },
    {
        id: 'simplify',
        num: '05 / Simplified AI Data Stack',
        title: (
            <>
                Simplify
                <br />
                the AI Data Stack
            </>
        ),
        desc:
            'AI applications often depend on a fragmented stack of real-time databases, search engines, vector databases, log analytics systems, lakehouse platforms, and LLMOps tools. Apache Doris unifies real-time analytics, semi-structured data analysis, full-text search, vector search, hybrid search, and AI-native SQL in one high-performance analytical engine. Teams can reduce duplicated pipelines, improve result consistency, and lower the operational cost of serving AI workloads at scale.',
        scenariosLabel: 'Where it shows up',
        scenarios: [
            'Unified AI data platforms',
            'Real-time analytics serving',
            'AI observability backends',
            'Hybrid search applications',
            'Cost-efficient analytics at scale',
        ],
    },
];

const cases: CaseStudy[] = [
    {
        id: 'real-time-ai',
        num: 'Case · 01 · Real-Time AI',
        title: 'Real-Time Analytics for AI Applications',
        quote:
            'Apache Doris helps us serve low-latency analytical queries over fresh business data, enabling intelligent applications and user-facing systems to make timely decisions at scale.',
        outcomes: [
            'Real-time data ingestion and query visibility',
            'Low-latency analytics for online applications',
            'High-concurrency analytical serving for AI-powered workflows',
        ],
        href: 'https://doris.apache.org/blog/',
    },
    {
        id: 'hybrid-rag',
        num: 'Case · 02 · Hybrid Search',
        title: 'Hybrid Search for RAG and Knowledge Retrieval',
        quote:
            'With Apache Doris, we can combine structured filters, full-text search and vector search in one analytical system, helping our AI applications retrieve more accurate and relevant context.',
        outcomes: [
            'Unified search across structured, text and vector data',
            'Better retrieval quality for RAG applications',
            'SQL-based filtering, ranking and analysis over AI knowledge data',
        ],
        href: 'https://doris.apache.org/blog/',
    },
    {
        id: 'ai-obs',
        num: 'Case · 03 · AI Observability',
        title: 'AI Observability and Agent Analytics at Scale',
        quote:
            'Apache Doris allows us to analyze prompts, responses, traces, tool calls, costs and quality signals at scale, giving our teams better visibility into AI application behavior.',
        outcomes: [
            'Scalable analysis of AI observability data',
            'Real-time troubleshooting for agent workflows',
            'Cost, latency and quality analytics for LLM applications',
        ],
        href: 'https://doris.apache.org/blog/',
    },
];

const requirements: Requirement[] = [
    {
        id: 'latency',
        num: 'REQ · 01',
        title: 'End-to-End Low Latency for AI Applications',
        desc:
            'AI applications and autonomous agents need to act on fresh data in real time. New events, CDC updates, and streaming data must become queryable within seconds, while analytical queries need to return in sub-second time—even under high-concurrency production traffic.',
    },
    {
        id: 'observability',
        num: 'REQ · 02',
        title: 'Analytics for AI Observability Data',
        desc:
            'AI observability goes beyond logs, metrics, and traces. Teams need to analyze model calls, prompts, responses, tool executions, retrieval events, token usage, latency, cost, evaluation scores, and user feedback in one place. The serving layer must handle flexible schemas, fast search, and interactive aggregation across large-scale AI-native data.',
    },
    {
        id: 'schema',
        num: 'REQ · 03',
        title: 'Flexible Schema for AI-Native Data',
        desc:
            'AI-native applications generate constantly changing, semi-structured events from models, agents, tools, frameworks, and workflows. The platform must handle dynamic JSON, nested fields, schema evolution, fast filtering, and ad hoc SQL exploration without heavy ETL, so teams can analyze every agent step, tool call, retrieval event, and model response directly.',
    },
    {
        id: 'hybrid-search',
        num: 'REQ · 04',
        title: 'Hybrid Search and Analytics for AI-Native Data',
        desc:
            'AI applications search across documents, logs, prompts, responses, feedback, knowledge bases, support tickets, and embeddings. SQL, keyword search, and vector search each solve part of the problem. AI-ready analytics combines structured filters, full-text search, semantic similarity, and relevance-aware ranking in one workflow.',
    },
    {
        id: 'ecosystem',
        num: 'REQ · 05',
        title: 'LLM Ecosystem Integration',
        desc:
            'AI applications rely on a fast-changing ecosystem of agent frameworks, LLMOps platforms, observability tools, MCP workflows, and custom pipelines. The platform must connect to that ecosystem so agents, copilots, RAG systems, and LLMOps tools can read trusted data and write AI signals through SQL, APIs, connectors, and MCP.',
    },
];

const capabilities: Capability[] = [
    {
        id: 'cap-realtime',
        num: 'CAP · 01',
        title: (
            <>
                Real-Time Ingestion &amp;
                <br />
                Low-Latency&nbsp;Serving
            </>
        ),
        desc:
            'AI applications and customer-facing analytics share the same hard requirement: ingest events in seconds, serve queries in sub-second time, under high concurrency. Apache Doris meets both with streaming and CDC ingestion, real-time query visibility, and an MPP execution engine — so AI agents and user-facing dashboards can run on one analytical foundation instead of two.',
        poweredLabel: 'Powered by',
        poweredBy: [],
    },
    {
        id: 'cap-ai-obs',
        num: 'CAP · 02',
        title: (
            <>
                AI Observability for Prompts,
                <br />
                Traces, Cost &amp;&nbsp;Quality
            </>
        ),
        desc:
            'AI observability and traditional observability run on the same engine: ingest high-volume telemetry in real time, search and aggregate massive event streams, slice the data by any dimension. Apache Doris extends that foundation to AI-native signals — prompts, responses, traces, tool calls, retrieval events, token usage, cost, and evaluation scores — so AI quality, performance, and spend become queryable through one SQL surface alongside logs, metrics, and traces.',
        poweredLabel: 'Powered by',
        poweredBy: [],
    },
    {
        id: 'cap-variant',
        num: 'CAP · 03',
        title: (
            <>
                Flexible JSON Anlytics
                <br />
                with&nbsp;VARIANT
            </>
        ),
        desc:
            'Apache Doris lets teams ingest and analyze evolving JSON-like data without rigid upfront schema design. With the VARIANT type, Doris supports dynamic event structures, nested fields, and AI application metadata, so teams can query agent events, tool outputs, model responses, RAG metadata, user feedback, and observability signals directly in SQL.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'VARIANT data type',
        ],
    },
    {
        id: 'cap-hybrid',
        num: 'CAP · 04',
        title: (
            <>
                Hybrid Search across
                <br />
                SQL, TEXT & VECTORS
            </>
        ),
        desc:
            'Apache Doris brings SQL filtering, full-text search, BM25 relevance scoring, and vector search into one analytical engine for RAG, enterprise search, AI copilots, agent memory, and AI observability. Teams can retrieve the right context from documents, logs, prompts, responses, feedback, and embeddings while applying business filters such as tenant, user, time range, permissions, model version, and workflow status.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'Inverted Index',
            'Full-text Search',
            'BM25',
            'Vector Index',
            'Embedding',
            'Reciprocal Rank Fusion',
        ],
    },
    {
        id: 'cap-ai-sql',
        num: 'CAP · 05',
        title: (
            <>
                AI-Native SQL &amp;
                <br />
                Toolchain Integration
            </>
        ),
        desc:
            'Doris brings LLM-powered processing and AI ecosystem integration into analytical workflows. Teams can use SQL to query enterprise data, process AI-generated signals, and expose analytics to agents, copilots, RAG systems, and LLMOps tools. LLM SQL functions enable summarization, sentiment analysis, classification, and extraction, while MCP, APIs, and connectors make Doris accessible across AI workflows.',
        poweredLabel: 'Powered by',
        poweredBy: [
            'LLM SQL functions',
            'MCP Server',
            'Semantic Layer(Coming Soon)',
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
                        <span className="accent">
                            Real-Time
                            <span className="bolt-inline">
                                <BoltIcon size="0.85em" />
                            </span>
                            , AI-Ready 
                        </span>{' '}
                        <br />
                        Analytics for the Agent Era
                    </h1>
                    <p className="hero-sub" data-reveal data-reveal-delay="2">
                        Apache Doris gives AI applications real-time access to fresh, trusted, and queryable enterprise data. Teams can build data-aware agents, improve RAG quality, monitor AI behavior, and run analytics and hybrid search across structured, semi-structured, and unstructured data at scale.
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
        footer: { label: c.scenariosLabel, items: c.scenarios },
    }));

    return (
        <section className="section section-value section-cream" id="value">
            <div className="hero-bg-grid" aria-hidden="true" />
            <div className="container section-inner">
                <div className="section-head section-head-wide" data-reveal>
                    <h2 className="section-title section-title-stacked">
                        <span>Why AI-ready&nbsp;analytics&nbsp;matters</span>
                        <span>for the agent&nbsp;era.</span>
                    </h2>
                    <p className="section-sub">
                        When the analytical foundation is fresh, hybrid, observable, and unified,
                        five things shift at once for AI: decision quality, application context,
                        retrieval relevance, agent visibility, and the cost of running it all.
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
                        Three teams use Apache Doris as the analytical foundation for
                        AI-related workloads: real-time AI applications, hybrid search for RAG,
                        and AI observability at scale.
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

    const relatedLinks: Record<string, { to: string; title: string; desc: string }> = {
        'cap-realtime': {
            to: '/use-cases/customer-facing-analytics',
            title: 'Customer-Facing Analytics',
            desc:
                'How teams use Apache Doris to deliver sub-second, embedded, multi-tenant analytics to end users at scale.',
        },
        'cap-ai-obs': {
            to: '/use-cases/observability',
            title: 'Observability for the AI Agent Era',
            desc:
                'How teams unify logs, metrics, traces, and AI agent events on Apache Doris — from PB-scale logging to interactive dashboards.',
        },
    };

    const capabilityItems: CoverFlowItem[] = capabilities.map(c => {
        const base: CoverFlowItem = {
            id: c.id,
            num: c.num,
            title: c.title,
            desc: c.desc,
            footer: { label: c.poweredLabel, items: c.poweredBy },
        };
        const related = relatedLinks[c.id];
        if (related) {
            return {
                ...base,
                customFooter: (
                    <div className="cap-related">
                        <div className="cap-related-eyebrow">
                            Deep dive · Related use case
                        </div>
                        <Link
                            to={related.to}
                            className="cap-related-card"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="cap-related-card-title">{related.title}</div>
                            <p className="cap-related-card-desc">{related.desc}</p>
                            <span className="cap-related-card-cta">
                                Explore the use case <span aria-hidden="true">→</span>
                            </span>
                        </Link>
                    </div>
                ),
            };
        }
        return base;
    });

    return (
        <section className="section section-tech section-cream" id="tech">
            <div className="container section-inner">
                <div className="section-head section-head-wide" data-reveal>
                    <h2 className="section-title section-title-stacked">
                        <span>What AI-ready&nbsp;analytics&nbsp;demands</span>
                        <span>and how Apache&nbsp;Doris&nbsp;answers.</span>
                    </h2>
                    <p className="section-sub">
                        Five things a modern AI-ready analytics platform has to do well, and
                        the specific Apache Doris capabilities that meet each one.
                    </p>
                </div>

                <h3 className="tech-layer-heading">AI-ready analytics technical requirements</h3>
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
                    Build AI-Ready Analytics
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

export default function AIAnalyticsNext(): JSX.Element {
    useRevealObserver();
    return (
        <LayoutNext
            title="Apache Doris: AI-Ready Analytics for the Agent Era"
            description="Apache Doris provides a high-performance analytical foundation for AI applications, RAG systems and AI observability — unifying real-time analytics, hybrid search and AI-native SQL."
        >
            <div className="ai-page">
                <Hero />
                <ValueSection />
                {/* <CasesSection /> */}
                <TechSection />
                <CtaSection />
            </div>
        </LayoutNext>
    );
}
