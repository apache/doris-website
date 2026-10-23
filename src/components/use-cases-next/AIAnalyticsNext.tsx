import Translate, { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { AccentWithBolt } from './UseCaseIcons';
import { AIAnalyticsFigure } from './figures/AIAnalyticsFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'ai',
    screenLabel: translate({ id: "marketing.ai.001", message: "AI-Ready Analytics" }),
    meta: {
        title: translate({ id: "marketing.ai.002", message: "Apache Doris: AI-Ready Analytics for the Agent Era" }),
        description:
            translate({ id: "marketing.ai.003", message: "Apache Doris is a high-performance analytical foundation for AI applications, RAG systems, and AI observability: real-time analytics, hybrid search, and AI-native SQL in one engine." }),
    },
    hero: {
        title: (
            <Translate id="marketing.ai.hero" values={{
                realTime: <AccentWithBolt>
                    {translate({ id: "marketing.ai.004", message: "Real-Time" })}
                </AccentWithBolt>,
                aiReady: translate({ id: "marketing.ai.005", message: "AI-Ready" }),
                analytics: translate({ id: "marketing.ai.006", message: "Analytics for the Agent Era" }),
                lineBreak: <br />,
            }}>
                {'{realTime} {aiReady}{lineBreak}{analytics}'}
            </Translate>
        ),
        sub: translate({ id: "marketing.ai.007", message: "Apache Doris gives AI applications real-time access to trusted, queryable enterprise data. Build data-aware agents, improve RAG quality, monitor AI behavior, and run analytics and hybrid search across structured, semi-structured, and unstructured data at scale." }),
    },
    value: {
        title: [translate({ id: "marketing.ai.008", message: "Why AI-ready" }), translate({ id: "marketing.ai.009", message: "analytics matters for" }), translate({ id: "marketing.ai.010", message: "the agent era." })],
        lead: translate({ id: "marketing.extra.019", message: "When the analytical foundation is fresh, hybrid, observable, and unified, five things shift at once:" }),
        points: [translate({ id: "marketing.ai.011", message: "Decision quality" }), translate({ id: "marketing.ai.012", message: "Application context" }), translate({ id: "marketing.ai.013", message: "Retrieval relevance" }), translate({ id: "marketing.ai.014", message: "Agent visibility" }), translate({ id: "marketing.ai.015", message: "The cost of running it all" })],
        cards: [
            {
                id: 'real-time',
                icon: 'bolt',
                title: translate({ id: "marketing.ai.016", message: "Real-Time AI Decisions" }),
                summary:
                    translate({ id: "marketing.ai.017", message: "AI agents query live operational data and act while the user interaction or business process is still in progress." }),
            },
            {
                id: 'data-aware',
                icon: 'database',
                title: translate({ id: "marketing.ai.018", message: "Data-Aware Applications" }),
                summary:
                    translate({ id: "marketing.ai.019", message: "Copilots, agents, and RAG systems draw on fresh, trusted enterprise data for context, memory, and reliable actions." }),
            },
            {
                id: 'rag-quality',
                icon: 'search',
                title: translate({ id: "marketing.ai.020", message: "RAG & Knowledge Retrieval" }),
                summary:
                    translate({ id: "marketing.ai.021", message: "SQL filters, full-text search, BM25, and vector search run in one query, so LLMs get accurate context and hallucinate less." }),
            },
            {
                id: 'observable',
                icon: 'eye',
                title: translate({ id: "marketing.ai.022", message: "AI Observability" }),
                summary:
                    translate({ id: "marketing.ai.023", message: "Prompts, responses, traces, tool calls, token usage, and cost sit in one queryable store for debugging and ongoing quality control." }),
            },
            {
                id: 'simplify',
                icon: 'layers',
                title: translate({ id: "marketing.ai.024", message: "Simplified AI Data Stack" }),
                summary:
                    translate({ id: "marketing.ai.025", message: "One engine covers real-time analytics, full-text and vector search, log analysis, and AI-native SQL, with fewer pipelines to run." }),
            },
        ],
    },
    tech: {
        title: [translate({ id: "marketing.ai.026", message: "What AI-ready analytics demands" }), translate({ id: "marketing.ai.027", message: "and how Apache Doris answers." })],
        sub: translate({ id: "marketing.ai.028", message: "Five things an AI-ready analytics platform has to do well, and the specific Apache Doris capabilities that meet each one." }),
        figure: <AIAnalyticsFigure />,
        requirements: [
            {
                id: 'latency',
                title: translate({ id: "marketing.ai.029", message: "End-to-End Low Latency for AI Applications" }),
                desc: translate({ id: "marketing.ai.030", message: "AI applications and autonomous agents act on fresh data in real time. New events, CDC updates, and streaming data must become queryable within seconds, and analytical queries must return in sub-second time, even under high-concurrency production traffic." }),
            },
            {
                id: 'hybrid-search',
                title: translate({ id: "marketing.ai.031", message: "Hybrid Search Across Structured, Text & Vector Data" }),
                desc: translate({ id: "marketing.ai.032", message: "AI applications search across documents, logs, prompts, responses, feedback, knowledge bases, support tickets, and embeddings. SQL, keyword search, and vector search each solve part of the problem. AI-ready analytics combines structured filters, full-text search, semantic similarity, and relevance-aware ranking in one workflow." }),
            },
            {
                id: 'schema',
                title: translate({ id: "marketing.ai.033", message: "Flexible Schema for AI-Native Data" }),
                desc: translate({ id: "marketing.ai.034", message: "AI-native applications emit constantly changing, semi-structured events from models, agents, tools, frameworks, and workflows. The platform must handle dynamic JSON, nested fields, schema evolution, fast filtering, and ad hoc SQL without heavy ETL, so teams can analyze every agent step, tool call, retrieval event, and model response directly." }),
            },
            {
                id: 'observability',
                title: translate({ id: "marketing.ai.035", message: "Analytics for AI Observability Data" }),
                desc: translate({ id: "marketing.ai.036", message: "AI observability goes beyond logs, metrics, and traces. Teams analyze model calls, prompts, responses, tool executions, retrieval events, token usage, latency, cost, evaluation scores, and user feedback in one place. The serving layer must handle flexible schemas, fast search, and interactive aggregation over large volumes of AI-native data." }),
            },
            {
                id: 'ecosystem',
                title: translate({ id: "marketing.ai.037", message: "LLM Ecosystem Integration" }),
                desc: translate({ id: "marketing.ai.038", message: "AI applications rely on a fast-changing ecosystem of agent frameworks, LLMOps platforms, observability tools, MCP workflows, and custom pipelines. The platform must plug into that ecosystem so agents, copilots, RAG systems, and LLMOps tools can read trusted data and write AI signals through SQL, APIs, connectors, and MCP." }),
            },
        ],
        capabilitiesTitle: translate({ id: "marketing.extra.020", message: "Apache Doris capabilities for AI" }),
        capabilities: [
            {
                id: 'realtime',
                title: (
                    <>
                        {translate({ id: "marketing.ai.039", message: "Real-Time Ingestion &" })}<br />
                        {translate({ id: "marketing.ai.040", message: "Low-Latency Serving" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.ai.041", message: "Kafka and CDC Integration" }), href: `${KF}/kafka-cdc-integration` },
                    { label: translate({ id: "marketing.ai.042", message: "Group Commit" }), href: `${KF}/group-commit` },
                    { label: translate({ id: "marketing.ai.043", message: "MPP Architecture" }), href: `${KF}/mpp` },
                    { label: translate({ id: "marketing.ai.044", message: "High-Concurrency Point Query" }), href: `${KF}/high-concurrency-point-query` },
                ],
                related: { to: '/use-cases/customer-facing-analytics', title: translate({ id: "marketing.ai.045", message: "Customer-Facing Analytics" }) },
            },
            {
                id: 'ai-obs',
                title: (
                    <>
                        {translate({ id: "marketing.ai.046", message: "AI Observability for Prompts," })}<br />
                        {translate({ id: "marketing.ai.047", message: "Traces, Cost & Quality" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.ai.048", message: "Stream Load" }), href: `${KF}/stream-load` },
                    { label: translate({ id: "marketing.ai.049", message: "Inverted Index" }), href: `${KF}/inverted-index` },
                    { label: translate({ id: "marketing.ai.050", message: "Incremental Materialized View" }), href: `${KF}/incremental-materialized-view` },
                ],
                related: { to: '/use-cases/observability', title: translate({ id: "marketing.ai.051", message: "Observability for the AI Agent Era" }) },
            },
            {
                id: 'variant',
                title: (
                    <>
                        {translate({ id: "marketing.ai.052", message: "Flexible JSON Analytics" })}<br />
                        {translate({ id: "marketing.ai.053", message: "with VARIANT" })}</>
                ),
                poweredBy: [{ label: translate({ id: "marketing.ai.054", message: "VARIANT Data Type" }), href: `${KF}/variant-data-type` }],
            },
            {
                id: 'hybrid',
                title: (
                    <>
                        {translate({ id: "marketing.ai.055", message: "Hybrid Search Across" })}<br />
                        {translate({ id: "marketing.ai.056", message: "SQL, Text & Vectors" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.ai.057", message: "Hybrid Search" }), href: `${KF}/hybrid-search` },
                    { label: translate({ id: "marketing.ai.049", message: "Inverted Index" }), href: `${KF}/inverted-index` },
                    { label: translate({ id: "marketing.ai.058", message: "Full-text Search" }), href: `${KF}/full-text-search` },
                    { label: translate({ id: "marketing.ai.059", message: "BM25 Relevance Scoring" }), href: `${KF}/bm25` },
                    { label: translate({ id: "marketing.ai.060", message: "Vector Index" }), href: `${KF}/vector-index` },
                    { label: translate({ id: "marketing.ai.061", message: "Embedding" }), href: `${KF}/embedding` },
                    { label: translate({ id: "marketing.ai.062", message: "Reciprocal Rank Fusion" }), href: `${KF}/reciprocal-rank-fusion` },
                ],
            },
            {
                id: 'ai-sql',
                title: (
                    <>
                        {translate({ id: "marketing.ai.063", message: "AI-Native SQL &" })}<br />
                        {translate({ id: "marketing.ai.064", message: "Toolchain Integration" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.ai.065", message: "LLM SQL Functions" }), href: `${KF}/llm-sql-functions` },
                    { label: translate({ id: "marketing.ai.066", message: "MCP Server" }), href: `${KF}/mcp-server` },
                    { label: translate({ id: "marketing.ai.067", message: "Semantic Layer (coming soon)" }) },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                {translate({ id: "marketing.ai.068", message: "Build AI-Ready Analytics" })}<br />
                {translate({ id: "marketing.ai.069", message: "with" })}{" "}<span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function AIAnalyticsNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
