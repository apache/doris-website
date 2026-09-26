import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { Bolt } from './UseCaseIcons';
import { AIAnalyticsFigure } from './figures/AIAnalyticsFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'ai',
    screenLabel: 'AI-Ready Analytics',
    meta: {
        title: 'Apache Doris: AI-Ready Analytics for the Agent Era',
        description:
            'Apache Doris is a high-performance analytical foundation for AI applications, RAG systems, and AI observability: real-time analytics, hybrid search, and AI-native SQL in one engine.',
    },
    hero: {
        title: (
            <>
                <span className="uc-accent">
                    Real-Time
                    <Bolt />
                </span>{' '}
                AI-Ready
                <br />
                Analytics for the Agent Era
            </>
        ),
        sub: 'Apache Doris gives AI applications real-time access to trusted, queryable enterprise data. Build data-aware agents, improve RAG quality, monitor AI behavior, and run analytics and hybrid search across structured, semi-structured, and unstructured data at scale.',
    },
    value: {
        title: ['Why AI-ready', 'analytics matters for', 'the agent era.'],
        lead: 'When the analytical foundation is fresh, hybrid, observable, and unified, five things shift at once:',
        points: ['Decision quality', 'Application context', 'Retrieval relevance', 'Agent visibility', 'The cost of running it all'],
        cards: [
            {
                id: 'real-time',
                icon: 'bolt',
                title: 'Real-Time AI Decisions',
                summary:
                    'AI agents query live operational data and act while the user interaction or business process is still in progress.',
            },
            {
                id: 'data-aware',
                icon: 'database',
                title: 'Data-Aware Applications',
                summary:
                    'Copilots, agents, and RAG systems draw on fresh, trusted enterprise data for context, memory, and reliable actions.',
            },
            {
                id: 'rag-quality',
                icon: 'search',
                title: 'RAG & Knowledge Retrieval',
                summary:
                    'SQL filters, full-text search, BM25, and vector search run in one query, so LLMs get accurate context and hallucinate less.',
            },
            {
                id: 'observable',
                icon: 'eye',
                title: 'AI Observability',
                summary:
                    'Prompts, responses, traces, tool calls, token usage, and cost sit in one queryable store for debugging and ongoing quality control.',
            },
            {
                id: 'simplify',
                icon: 'layers',
                title: 'Simplified AI Data Stack',
                summary:
                    'One engine covers real-time analytics, full-text and vector search, log analysis, and AI-native SQL, with fewer pipelines to run.',
            },
        ],
    },
    tech: {
        title: ['What AI-ready analytics demands', 'and how Apache Doris answers.'],
        sub: 'Five things an AI-ready analytics platform has to do well, and the specific Apache Doris capabilities that meet each one.',
        figure: <AIAnalyticsFigure />,
        requirements: [
            {
                id: 'latency',
                title: 'End-to-End Low Latency for AI Applications',
                desc: 'AI applications and autonomous agents act on fresh data in real time. New events, CDC updates, and streaming data must become queryable within seconds, and analytical queries must return in sub-second time, even under high-concurrency production traffic.',
            },
            {
                id: 'hybrid-search',
                title: 'Hybrid Search Across Structured, Text & Vector Data',
                desc: 'AI applications search across documents, logs, prompts, responses, feedback, knowledge bases, support tickets, and embeddings. SQL, keyword search, and vector search each solve part of the problem. AI-ready analytics combines structured filters, full-text search, semantic similarity, and relevance-aware ranking in one workflow.',
            },
            {
                id: 'schema',
                title: 'Flexible Schema for AI-Native Data',
                desc: 'AI-native applications emit constantly changing, semi-structured events from models, agents, tools, frameworks, and workflows. The platform must handle dynamic JSON, nested fields, schema evolution, fast filtering, and ad hoc SQL without heavy ETL, so teams can analyze every agent step, tool call, retrieval event, and model response directly.',
            },
            {
                id: 'observability',
                title: 'Analytics for AI Observability Data',
                desc: 'AI observability goes beyond logs, metrics, and traces. Teams analyze model calls, prompts, responses, tool executions, retrieval events, token usage, latency, cost, evaluation scores, and user feedback in one place. The serving layer must handle flexible schemas, fast search, and interactive aggregation over large volumes of AI-native data.',
            },
            {
                id: 'ecosystem',
                title: 'LLM Ecosystem Integration',
                desc: 'AI applications rely on a fast-changing ecosystem of agent frameworks, LLMOps platforms, observability tools, MCP workflows, and custom pipelines. The platform must plug into that ecosystem so agents, copilots, RAG systems, and LLMOps tools can read trusted data and write AI signals through SQL, APIs, connectors, and MCP.',
            },
        ],
        capabilitiesTitle: 'Apache Doris capabilities for AI',
        capabilities: [
            {
                id: 'realtime',
                title: (
                    <>
                        Real-Time Ingestion &
                        <br />
                        Low-Latency Serving
                    </>
                ),
                poweredBy: [
                    { label: 'Kafka and CDC Integration', href: `${KF}/kafka-cdc-integration` },
                    { label: 'Group Commit', href: `${KF}/group-commit` },
                    { label: 'MPP Architecture', href: `${KF}/mpp` },
                    { label: 'High-Concurrency Point Query', href: `${KF}/high-concurrency-point-query` },
                ],
                related: { to: '/use-cases/customer-facing-analytics', title: 'Customer-Facing Analytics' },
            },
            {
                id: 'ai-obs',
                title: (
                    <>
                        AI Observability for Prompts,
                        <br />
                        Traces, Cost & Quality
                    </>
                ),
                poweredBy: [
                    { label: 'Stream Load', href: `${KF}/stream-load` },
                    { label: 'Inverted Index', href: `${KF}/inverted-index` },
                    { label: 'Incremental Materialized View', href: `${KF}/incremental-materialized-view` },
                ],
                related: { to: '/use-cases/observability', title: 'Observability for the AI Agent Era' },
            },
            {
                id: 'variant',
                title: (
                    <>
                        Flexible JSON Analytics
                        <br />
                        with VARIANT
                    </>
                ),
                poweredBy: [{ label: 'VARIANT Data Type', href: `${KF}/variant-data-type` }],
            },
            {
                id: 'hybrid',
                title: (
                    <>
                        Hybrid Search Across
                        <br />
                        SQL, Text & Vectors
                    </>
                ),
                poweredBy: [
                    { label: 'Hybrid Search', href: `${KF}/hybrid-search` },
                    { label: 'Inverted Index', href: `${KF}/inverted-index` },
                    { label: 'Full-text Search', href: `${KF}/full-text-search` },
                    { label: 'BM25 Relevance Scoring', href: `${KF}/bm25` },
                    { label: 'Vector Index', href: `${KF}/vector-index` },
                    { label: 'Embedding', href: `${KF}/embedding` },
                    { label: 'Reciprocal Rank Fusion', href: `${KF}/reciprocal-rank-fusion` },
                ],
            },
            {
                id: 'ai-sql',
                title: (
                    <>
                        AI-Native SQL &
                        <br />
                        Toolchain Integration
                    </>
                ),
                poweredBy: [
                    { label: 'LLM SQL Functions', href: `${KF}/llm-sql-functions` },
                    { label: 'MCP Server', href: `${KF}/mcp-server` },
                    { label: 'Semantic Layer (coming soon)' },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                Build AI-Ready Analytics
                <br />
                with <span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function AIAnalyticsNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
