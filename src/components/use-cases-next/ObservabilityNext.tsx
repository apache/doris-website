import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { Bolt } from './UseCaseIcons';
import { ObservabilityFigure } from './figures/ObservabilityFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'ob',
    screenLabel: translate({ id: "marketing.observability.001", message: "Observability" }),
    meta: {
        title: translate({ id: "marketing.observability.002", message: "Apache Doris: Observability for the AI Agent Era" }),
        description:
            translate({ id: "marketing.observability.003", message: "Apache Doris is a high-performance analytical foundation for logs, metrics, traces, and AI agent events: real-time ingestion, full-text search, OLAP, and hybrid vector search in one engine." }),
    },
    hero: {
        title: (
            <>
                <span className="uc-accent">
                    {translate({ id: "marketing.observability.004", message: "Real-Time" })}<Bolt />
                </span>{' '}
                {translate({ id: "marketing.observability.001", message: "Observability" })}<br />
                {translate({ id: "marketing.observability.005", message: "for the AI Agent Era" })}</>
        ),
        sub: translate({ id: "marketing.observability.006", message: "Apache Doris unifies logs, metrics, traces, and AI agent events on one high-performance analytical engine, so teams troubleshoot faster, control costs, and keep improving AI quality." }),
    },
    value: {
        title: [translate({ id: "marketing.observability.007", message: "Why observability" }), translate({ id: "marketing.observability.008", message: "matters for" }), translate({ id: "marketing.observability.009", message: "the agent era." })],
        lead: translate({ id: "marketing.extra.014", message: "When teams unify observability across logs, traces, metrics, and AI agent events, five things shift at once:" }),
        points: [
            translate({ id: "marketing.observability.010", message: "Incident detection" }),
            translate({ id: "marketing.observability.011", message: "User experience" }),
            translate({ id: "marketing.observability.012", message: "Cost at scale" }),
            translate({ id: "marketing.observability.013", message: "AI quality" }),
            translate({ id: "marketing.observability.014", message: "The link between system behavior and business outcomes" }),
        ],
        cards: [
            {
                id: 'incidents',
                icon: 'pulse',
                title: translate({ id: "marketing.observability.015", message: "Faster Incident Detection" }),
                summary:
                    translate({ id: "marketing.observability.016", message: "Logs, traces, and agent events become analyzable execution data, so anomalies and root causes surface before failures spread." }),
            },
            {
                id: 'sla',
                icon: 'clock',
                title: translate({ id: "marketing.observability.017", message: "User Experience & SLA" }),
                summary:
                    translate({ id: "marketing.observability.018", message: "System health maps to real user impact: latency, errors, answer accuracy, task completion, and whether responses are grounded." }),
            },
            {
                id: 'cost',
                icon: 'chart',
                title: translate({ id: "marketing.observability.019", message: "Lower Cost at Scale" }),
                summary:
                    translate({ id: "marketing.observability.020", message: "Hot data stays fast for troubleshooting, aggregates cover trends, and historical data moves to lower-cost storage as telemetry grows." }),
            },
            {
                id: 'ai-quality',
                icon: 'sparkle',
                title: translate({ id: "marketing.observability.021", message: "Continuous AI Improvement" }),
                summary:
                    translate({ id: "marketing.observability.022", message: "Prompts, responses, RAG context, tool calls, scores, and user feedback show where retrieval, prompting, and task completion can improve." }),
            },
            {
                id: 'business',
                icon: 'link',
                title: translate({ id: "marketing.observability.023", message: "Business-Aware Operations" }),
                summary:
                    translate({ id: "marketing.observability.024", message: "Every signal ties back to the customers, tenants, and workflows it affects, and to what AI failures cost in conversion, support load, and revenue." }),
            },
        ],
    },
    cases: {
        title: translate({ id: "marketing.observability.025", message: "Already running in production." }),
        sub: translate({ id: "marketing.observability.026", message: "Three teams run Apache Doris as the analytical foundation for observability: at scale, on live operational data, across logs, metrics, and events." }),
        items: [
            {
                id: 'minimax',
                num: translate({ id: "marketing.extra.015", message: "Case 01 · PB-Scale Logging" }),
                title: translate({ id: "marketing.observability.027", message: "MiniMax: PB-Scale Logging on Apache Doris, Off Grafana Loki" }),
                summary:
                    translate({ id: "marketing.observability.028", message: "After moving off Grafana Loki, every MiniMax business line now logs to an Apache Doris system that serves petabytes with over 99.9% availability and answers queries over billions of log lines in seconds." }),
                outcomes: [
                    translate({ id: "marketing.observability.029", message: "PB-scale log storage with 99.9%+ availability across all business lines" }),
                    translate({ id: "marketing.observability.030", message: "Keyword and aggregation queries on 1 billion logs return within 2 seconds" }),
                    translate({ id: "marketing.observability.031", message: "10 GB/s write throughput with second-level ingestion latency" }),
                    translate({ id: "marketing.observability.032", message: "5:1 compression and tiered storage cut storage costs by 70%" }),
                ],
                href: 'https://www.velodb.io/blog/ai-unicorn-minimax-migrated-loki',
                logo: { src: '/images/next/user-logos/minimax-color.png', alt: 'MiniMax', height: 34 },
            },
            {
                id: 'netease',
                num: translate({ id: "marketing.extra.016", message: "Case 02 · Logs & Time Series" }),
                title: translate({ id: "marketing.observability.033", message: "NetEase: Elasticsearch and InfluxDB Replaced by Apache Doris" }),
                summary:
                    translate({ id: "marketing.observability.034", message: "NetEase moved its Eagle monitoring platform off Elasticsearch and its IM time series platform off InfluxDB, and now runs both on Apache Doris with faster queries, less storage, and indexes it can change without rebuilding tables." }),
                outcomes: [
                    translate({ id: "marketing.observability.035", message: "11× faster queries and 70% lower storage cost than Elasticsearch on monitoring logs" }),
                    translate({ id: "marketing.observability.036", message: "67% less storage and half the servers of InfluxDB on time series workloads" }),
                    translate({ id: "marketing.observability.037", message: "1 GB/s peak write throughput at up to 1 million TPS" }),
                    translate({ id: "marketing.observability.038", message: "Inverted indexes added or dropped incrementally, without rewriting tables" }),
                ],
                href: 'https://www.velodb.io/blog/apache-doris-log-series-analysis-net',
                logo: { src: '/images/next/user-logos/netease-on-dark.svg', alt: 'NetEase', height: 28 },
            },
            {
                id: 'tencent-music',
                num: translate({ id: "marketing.extra.017", message: "Case 03 · Elasticsearch Migration" }),
                title: translate({ id: "marketing.observability.039", message: "Tencent Music: Elasticsearch Replaced, Costs Cut by 80%" }),
                summary:
                    translate({ id: "marketing.observability.040", message: "Tencent Music Entertainment moved its tag-based search and analytics from Elasticsearch to Apache Doris, where inverted indexes serve full-text search and aggregations in a single SQL query." }),
                outcomes: [
                    translate({ id: "marketing.observability.041", message: "80% lower overall operational cost than Elasticsearch" }),
                    translate({ id: "marketing.observability.042", message: "72% smaller storage footprint (697.7 GB → 195.4 GB on the same dataset)" }),
                    translate({ id: "marketing.observability.043", message: "4× faster writes, with ingestion time cut from 10+ hours to under 3 hours" }),
                    translate({ id: "marketing.observability.044", message: "Alerts down from 20+ per day to single digits per month" }),
                ],
                href: 'https://www.velodb.io/blog/tencent-music-saved-migrating-elasticsearch',
                logo: { src: '/images/next/user-logos/tencent-music-color.png', alt: 'Tencent Music', height: 40, text: 'TENCENT MUSIC' },
            },
        ],
    },
    tech: {
        title: [translate({ id: "marketing.observability.045", message: "What modern observability demands" }), translate({ id: "marketing.observability.046", message: "and how Apache Doris answers." })],
        sub: translate({ id: "marketing.observability.047", message: "Five things a modern observability platform has to be good at, and the specific Apache Doris capabilities that meet each one." }),
        figure: <ObservabilityFigure />,
        requirements: [
            {
                id: 'ingest',
                title: translate({ id: "marketing.observability.048", message: "Ingest Every Signal in Real Time" }),
                desc: translate({ id: "marketing.observability.049", message: "Observability data streams in from applications, Kubernetes, APIs, gateways, databases, and AI systems. The platform has to absorb high-volume logs, traces, metrics, and AI agent events with low latency, so every signal, from LLM requests and tool calls to RAG retrievals, token costs, evaluations, and user feedback, is ready to query in near real time." }),
            },
            {
                id: 'schema',
                title: translate({ id: "marketing.observability.050", message: "Analyze Dynamic JSON Without Heavy ETL" }),
                desc: translate({ id: "marketing.observability.051", message: "Logs, traces, tool outputs, model responses, and agent events often arrive as nested JSON whose fields keep changing. The platform must handle schema evolution and make any new field queryable at once, so teams can filter, investigate, and analyze new signals without rebuilding pipelines." }),
            },
            {
                id: 'search',
                title: translate({ id: "marketing.observability.052", message: "Fast Full-Text Search Across Logs & Agent Signals" }),
                desc: translate({ id: "marketing.observability.053", message: "Observability data is full of searchable text: error messages, stack traces, and log lines, but also prompts, model responses, tool outputs, and agent failure reasons. Teams need fast keyword and full-text search to find failures, trace requests, and investigate agent behavior at scale." }),
            },
            {
                id: 'analytics',
                title: translate({ id: "marketing.observability.054", message: "Interactive Analytics on Metrics, Cost & Quality" }),
                desc: translate({ id: "marketing.observability.055", message: "Observability is not only search. Teams slice, aggregate, and drill into large telemetry datasets to analyze reliability, cost, and AI quality: P99 latency and SLA trends, token usage, model cost, RAG quality, and agent task completion. That takes a high-performance analytical engine next to fast search." }),
            },
            {
                id: 'hybrid',
                title: translate({ id: "marketing.observability.056", message: "Hybrid Search for AI Agent Observability" }),
                desc: translate({ id: "marketing.observability.057", message: "AI agent observability needs more than keyword search over logs. Teams correlate structured metadata with full-text and semantic search across prompts, responses, tool calls, and traces, so one query can find exact matches, similar failures, hallucinated outputs, and recurring agent behavior." }),
            },
        ],
        capabilitiesTitle: translate({ id: "marketing.extra.018", message: "Apache Doris capabilities for observability" }),
        capabilities: [
            {
                id: 'ingest',
                title: (
                    <>
                        {translate({ id: "marketing.observability.058", message: "Real-Time Ingestion" })}<br />
                        {translate({ id: "marketing.observability.059", message: "for Logs & Agent Traces" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.observability.060", message: "Stream Load" }), href: `${KF}/stream-load` },
                    { label: translate({ id: "marketing.observability.061", message: "Kafka and CDC Integration" }), href: `${KF}/kafka-cdc-integration` },
                    { label: translate({ id: "marketing.observability.062", message: "Group Commit" }), href: `${KF}/group-commit` },
                    { label: translate({ id: "marketing.observability.063", message: "Vertical Compaction" }), href: `${KF}/vertical-compaction` },
                ],
            },
            {
                id: 'variant',
                title: (
                    <>
                        {translate({ id: "marketing.observability.064", message: "Semi-Structured Analytics" })}<br />
                        {translate({ id: "marketing.observability.065", message: "with VARIANT" })}</>
                ),
                poweredBy: [{ label: translate({ id: "marketing.observability.066", message: "VARIANT Data Type" }), href: `${KF}/variant-data-type` }],
            },
            {
                id: 'search',
                title: (
                    <>
                        {translate({ id: "marketing.observability.067", message: "Fast Full-Text Search" })}<br />
                        {translate({ id: "marketing.observability.068", message: "with Inverted Index & BM25" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.observability.069", message: "Inverted Index" }), href: `${KF}/inverted-index` },
                    { label: translate({ id: "marketing.observability.070", message: "Full-text Search" }), href: `${KF}/full-text-search` },
                    { label: translate({ id: "marketing.observability.071", message: "BM25 Relevance Scoring" }), href: `${KF}/bm25` },
                ],
            },
            {
                id: 'analytics',
                title: (
                    <>
                        {translate({ id: "marketing.observability.072", message: "Interactive Analytics" })}<br />
                        {translate({ id: "marketing.observability.073", message: "for Observability Dashboards" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.observability.074", message: "Incremental Materialized View" }), href: `${KF}/incremental-materialized-view` },
                    { label: translate({ id: "marketing.observability.075", message: "Preaggregation and Rollup" }), href: `${KF}/preaggregation-and-rollup` },
                    { label: translate({ id: "marketing.observability.076", message: "Vectorized Execution" }), href: `${KF}/vectorized-execution` },
                    { label: translate({ id: "marketing.observability.077", message: "Query Cache" }), href: `${KF}/query-cache` },
                    { label: translate({ id: "marketing.observability.078", message: "Prepared Statement" }), href: `${KF}/prepared-statement` },
                ],
            },
            {
                id: 'hybrid',
                title: (
                    <>
                        {translate({ id: "marketing.observability.079", message: "Hybrid Search Across" })}<br />
                        {translate({ id: "marketing.observability.080", message: "Structured, Text & Vector Data" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.observability.081", message: "Hybrid Search" }), href: `${KF}/hybrid-search` },
                    { label: translate({ id: "marketing.observability.082", message: "Vector Index" }), href: `${KF}/vector-index` },
                    { label: translate({ id: "marketing.observability.083", message: "Embedding" }), href: `${KF}/embedding` },
                    { label: translate({ id: "marketing.observability.084", message: "Reciprocal Rank Fusion" }), href: `${KF}/reciprocal-rank-fusion` },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                {translate({ id: "marketing.observability.085", message: "Build Observability for the AI Agent Era" })}<br />
                {translate({ id: "marketing.observability.086", message: "with" })}{" "}<span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function ObservabilityNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
