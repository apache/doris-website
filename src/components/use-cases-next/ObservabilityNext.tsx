import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { Bolt } from './UseCaseIcons';
import { ObservabilityFigure } from './figures/ObservabilityFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'ob',
    screenLabel: 'Observability',
    meta: {
        title: 'Apache Doris: Observability for the AI Agent Era',
        description:
            'Apache Doris is a high-performance analytical foundation for logs, metrics, traces, and AI agent events: real-time ingestion, full-text search, OLAP, and hybrid vector search in one engine.',
    },
    hero: {
        title: (
            <>
                <span className="uc-accent">
                    Real-Time
                    <Bolt />
                </span>{' '}
                Observability
                <br />
                for the AI Agent Era
            </>
        ),
        sub: 'Apache Doris unifies logs, metrics, traces, and AI agent events on one high-performance analytical engine, so teams troubleshoot faster, control costs, and keep improving AI quality.',
    },
    value: {
        title: ['Why observability', 'matters for', 'the agent era.'],
        lead: 'When teams unify observability across logs, traces, metrics, and AI agent events, five things shift at once:',
        points: [
            'Incident detection',
            'User experience',
            'Cost at scale',
            'AI quality',
            'The link between system behavior and business outcomes',
        ],
        cards: [
            {
                id: 'incidents',
                icon: 'pulse',
                title: 'Faster Incident Detection',
                summary:
                    'Logs, traces, and agent events become analyzable execution data, so anomalies and root causes surface before failures spread.',
            },
            {
                id: 'sla',
                icon: 'clock',
                title: 'User Experience & SLA',
                summary:
                    'System health maps to real user impact: latency, errors, answer accuracy, task completion, and whether responses are grounded.',
            },
            {
                id: 'cost',
                icon: 'chart',
                title: 'Lower Cost at Scale',
                summary:
                    'Hot data stays fast for troubleshooting, aggregates cover trends, and historical data moves to lower-cost storage as telemetry grows.',
            },
            {
                id: 'ai-quality',
                icon: 'sparkle',
                title: 'Continuous AI Improvement',
                summary:
                    'Prompts, responses, RAG context, tool calls, scores, and user feedback show where retrieval, prompting, and task completion can improve.',
            },
            {
                id: 'business',
                icon: 'link',
                title: 'Business-Aware Operations',
                summary:
                    'Every signal ties back to the customers, tenants, and workflows it affects, and to what AI failures cost in conversion, support load, and revenue.',
            },
        ],
    },
    cases: {
        title: 'Already running in production.',
        sub: 'Three teams run Apache Doris as the analytical foundation for observability: at scale, on live operational data, across logs, metrics, and events.',
        items: [
            {
                id: 'minimax',
                num: 'Case 01 · PB-Scale Logging',
                title: 'MiniMax: PB-Scale Logging on Apache Doris, Off Grafana Loki',
                summary:
                    'After moving off Grafana Loki, every MiniMax business line now logs to an Apache Doris system that serves petabytes with over 99.9% availability and answers queries over billions of log lines in seconds.',
                outcomes: [
                    'PB-scale log storage with 99.9%+ availability across all business lines',
                    'Keyword and aggregation queries on 1 billion logs return within 2 seconds',
                    '10 GB/s write throughput with second-level ingestion latency',
                    '5:1 compression and tiered storage cut storage costs by 70%',
                ],
                href: 'https://www.velodb.io/blog/ai-unicorn-minimax-migrated-loki',
                logo: { src: '/images/next/user-logos/minimax-color.png', alt: 'MiniMax', height: 34 },
            },
            {
                id: 'netease',
                num: 'Case 02 · Logs & Time Series',
                title: 'NetEase: Elasticsearch and InfluxDB Replaced by Apache Doris',
                summary:
                    'NetEase moved its Eagle monitoring platform off Elasticsearch and its IM time series platform off InfluxDB, and now runs both on Apache Doris with faster queries, less storage, and indexes it can change without rebuilding tables.',
                outcomes: [
                    '11× faster queries and 70% lower storage cost than Elasticsearch on monitoring logs',
                    '67% less storage and half the servers of InfluxDB on time series workloads',
                    '1 GB/s peak write throughput at up to 1 million TPS',
                    'Inverted indexes added or dropped incrementally, without rewriting tables',
                ],
                href: 'https://www.velodb.io/blog/apache-doris-log-series-analysis-net',
                logo: { src: '/images/next/user-logos/netease-on-dark.svg', alt: 'NetEase', height: 28 },
            },
            {
                id: 'tencent-music',
                num: 'Case 03 · Elasticsearch Migration',
                title: 'Tencent Music: Elasticsearch Replaced, Costs Cut by 80%',
                summary:
                    'Tencent Music Entertainment moved its tag-based search and analytics from Elasticsearch to Apache Doris, where inverted indexes serve full-text search and aggregations in a single SQL query.',
                outcomes: [
                    '80% lower overall operational cost than Elasticsearch',
                    '72% smaller storage footprint (697.7 GB → 195.4 GB on the same dataset)',
                    '4× faster writes, with ingestion time cut from 10+ hours to under 3 hours',
                    'Alerts down from 20+ per day to single digits per month',
                ],
                href: 'https://www.velodb.io/blog/tencent-music-saved-migrating-elasticsearch',
                logo: { src: '/images/next/user-logos/tencent-music-color.png', alt: 'Tencent Music', height: 40, text: 'TENCENT MUSIC' },
            },
        ],
    },
    tech: {
        title: ['What modern observability demands', 'and how Apache Doris answers.'],
        sub: 'Five things a modern observability platform has to be good at, and the specific Apache Doris capabilities that meet each one.',
        figure: <ObservabilityFigure />,
        requirements: [
            {
                id: 'ingest',
                title: 'Ingest Every Signal in Real Time',
                desc: 'Observability data streams in from applications, Kubernetes, APIs, gateways, databases, and AI systems. The platform has to absorb high-volume logs, traces, metrics, and AI agent events with low latency, so every signal, from LLM requests and tool calls to RAG retrievals, token costs, evaluations, and user feedback, is ready to query in near real time.',
            },
            {
                id: 'schema',
                title: 'Analyze Dynamic JSON Without Heavy ETL',
                desc: 'Logs, traces, tool outputs, model responses, and agent events often arrive as nested JSON whose fields keep changing. The platform must handle schema evolution and make any new field queryable at once, so teams can filter, investigate, and analyze new signals without rebuilding pipelines.',
            },
            {
                id: 'search',
                title: 'Fast Full-Text Search Across Logs & Agent Signals',
                desc: 'Observability data is full of searchable text: error messages, stack traces, and log lines, but also prompts, model responses, tool outputs, and agent failure reasons. Teams need fast keyword and full-text search to find failures, trace requests, and investigate agent behavior at scale.',
            },
            {
                id: 'analytics',
                title: 'Interactive Analytics on Metrics, Cost & Quality',
                desc: 'Observability is not only search. Teams slice, aggregate, and drill into large telemetry datasets to analyze reliability, cost, and AI quality: P99 latency and SLA trends, token usage, model cost, RAG quality, and agent task completion. That takes a high-performance analytical engine next to fast search.',
            },
            {
                id: 'hybrid',
                title: 'Hybrid Search for AI Agent Observability',
                desc: 'AI agent observability needs more than keyword search over logs. Teams correlate structured metadata with full-text and semantic search across prompts, responses, tool calls, and traces, so one query can find exact matches, similar failures, hallucinated outputs, and recurring agent behavior.',
            },
        ],
        capabilitiesTitle: 'Apache Doris capabilities for observability',
        capabilities: [
            {
                id: 'ingest',
                title: (
                    <>
                        Real-Time Ingestion
                        <br />
                        for Logs & Agent Traces
                    </>
                ),
                poweredBy: [
                    { label: 'Stream Load', href: `${KF}/stream-load` },
                    { label: 'Kafka and CDC Integration', href: `${KF}/kafka-cdc-integration` },
                    { label: 'Group Commit', href: `${KF}/group-commit` },
                    { label: 'Vertical Compaction', href: `${KF}/vertical-compaction` },
                ],
            },
            {
                id: 'variant',
                title: (
                    <>
                        Semi-Structured Analytics
                        <br />
                        with VARIANT
                    </>
                ),
                poweredBy: [{ label: 'VARIANT Data Type', href: `${KF}/variant-data-type` }],
            },
            {
                id: 'search',
                title: (
                    <>
                        Fast Full-Text Search
                        <br />
                        with Inverted Index & BM25
                    </>
                ),
                poweredBy: [
                    { label: 'Inverted Index', href: `${KF}/inverted-index` },
                    { label: 'Full-text Search', href: `${KF}/full-text-search` },
                    { label: 'BM25 Relevance Scoring', href: `${KF}/bm25` },
                ],
            },
            {
                id: 'analytics',
                title: (
                    <>
                        Interactive Analytics
                        <br />
                        for Observability Dashboards
                    </>
                ),
                poweredBy: [
                    { label: 'Incremental Materialized View', href: `${KF}/incremental-materialized-view` },
                    { label: 'Preaggregation and Rollup', href: `${KF}/preaggregation-and-rollup` },
                    { label: 'Vectorized Execution', href: `${KF}/vectorized-execution` },
                    { label: 'Query Cache', href: `${KF}/query-cache` },
                    { label: 'Prepared Statement', href: `${KF}/prepared-statement` },
                ],
            },
            {
                id: 'hybrid',
                title: (
                    <>
                        Hybrid Search Across
                        <br />
                        Structured, Text & Vector Data
                    </>
                ),
                poweredBy: [
                    { label: 'Hybrid Search', href: `${KF}/hybrid-search` },
                    { label: 'Vector Index', href: `${KF}/vector-index` },
                    { label: 'Embedding', href: `${KF}/embedding` },
                    { label: 'Reciprocal Rank Fusion', href: `${KF}/reciprocal-rank-fusion` },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                Build Observability for the AI Agent Era
                <br />
                with <span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function ObservabilityNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
