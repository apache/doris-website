import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { Bolt } from './UseCaseIcons';
import { CustomerFacingFigure } from './figures/CustomerFacingFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'cfa',
    screenLabel: 'Customer-Facing Analytics',
    meta: {
        title: 'Apache Doris: Customer-Facing Analytics on Real-Time Data',
        description:
            'Deliver sub-second, interactive customer-facing analytics with Apache Doris: real-time data, high concurrency, and tenant isolation on one engine.',
    },
    hero: {
        title: (
            <>
                Customer-Facing Analytics,
                <br />
                Powered by{' '}
                <span className="uc-accent">
                    Real-Time
                    <Bolt /> Data
                </span>
            </>
        ),
        sub: 'Deliver sub-second, interactive analytics directly to your customers, at scale.',
    },
    value: {
        title: ['Why real-time', 'changes the product.'],
        lead: 'When analytics moves from an internal report into the product itself, four things change at once:',
        points: ['The user experience', 'Engagement', 'Revenue', 'The speed of decisions'],
        cards: [
            {
                id: 'better-ux',
                icon: 'bulb',
                title: 'Better User Experience',
                summary:
                    'Dashboards load the moment users arrive, so analytics feels like a native part of the product instead of a report to wait for.',
            },
            {
                id: 'engagement',
                icon: 'trend',
                title: 'Higher Engagement & Retention',
                summary: 'Live, responsive analytics turns product data into a reason for users to come back.',
            },
            {
                id: 'monetization',
                icon: 'dollar',
                title: 'Monetization',
                summary:
                    'Customer-facing analytics becomes a premium, revenue-generating feature inside your own product.',
            },
            {
                id: 'decisions',
                icon: 'bolt',
                title: 'Faster Decisions',
                summary:
                    'Real-time signals let teams act while an opportunity is still open, instead of reacting to yesterday’s data.',
            },
        ],
    },
    cases: {
        title: 'Already shipping in production.',
        sub: 'Three teams use Apache Doris to serve sub-second analytics to their customers, under real concurrency, on live data.',
        items: [
            {
                id: 'jd',
                num: 'Case 01 · JD.com',
                title: 'Real-Time OLAP for the JD.com Search Box',
                quote: 'Replacing Flink’s window computing with Doris can not only improve development efficiency, adapt to dimension changes, but also reduce computing resources.',
                scenario:
                    'Real-time analytics for the JD.com search box: overall search traffic, live A/B test monitoring, and trending search terms, all at SKU-level granularity for business analysts.',
                outcomes: [
                    '10 billion rows processed per day',
                    '10,000 QPS with query latency as low as 150 ms',
                    'Real-time ingestion at 1 million rows per second',
                ],
                href: 'https://www.velodb.io/blog/jd-com-s-exploration-practice-apache-doris',
                logo: { src: '/images/next/user-logos/jd-color.png', alt: 'JD.com', height: 40 },
            },
            {
                id: 'xanh-sm',
                num: 'Case 02 · Xanh SM',
                title: 'Real-Time Recommendations for Xanh SM',
                quote: 'Apache Doris and its Compute-Storage Decouple Mode allowed us to run both workloads from a single storage layer, cutting infrastructure cost and complexity without sacrificing performance.',
                scenario:
                    'Xanh SM, Vietnam’s leading EV ride-hailing platform, runs analytics and real-time serving on Apache Doris to power personalized destination recommendations.',
                outcomes: [
                    '175,000 records written per second with sub-second latency',
                    'Average query latency around 76 ms across most time windows',
                    'P9999 latency only occasionally above 100 ms',
                ],
                href: 'https://www.velodb.io/blog/how-xanhsm-built-real-time-recommendations-with-apache-doris',
                logo: { src: '/images/next/user-logos/green-sm.svg', alt: 'Xanh SM', height: 32 },
            },
            {
                id: 'zto',
                num: 'Case 03 · ZTO Express',
                title: 'Real-Time Analytics for ZTO Express',
                summary:
                    'ZTO Express rebuilt its real-time analytics over 500 million daily record updates, with inverted indexes on high-frequency filter fields serving monitoring, multi-dimensional analysis, and precise filtering.',
                outcomes: [
                    'Multi-dimensional filter queries down from over 1 minute to under 1 second (60×); complex aggregations from 5 to 10 minutes to under 1 minute',
                    'Concurrency on critical queries up from under 50 to 100+, with timeouts down from 30% to under 5%',
                    'One-third of the original hardware, with 500 million daily updates visible in queries within seconds',
                ],
                href: 'https://www.velodb.io/blog/how-zto-express-rebuilt-real-time-analytics-with-inverted-index',
                logo: {
                    src: '/images/next/user-logos/zto-circle.png',
                    alt: 'ZTO Express',
                    height: 56,
                    text: 'ZTO EXPRESS',
                    textColor: '#2989ff',
                },
            },
        ],
    },
    tech: {
        title: ['What customer-facing analytics demands', 'and how Apache Doris answers.'],
        sub: 'Customer-facing analytics is a different workload from internal BI. Four things the serving engine has to get right, and the specific Apache Doris capabilities that meet each one.',
        figure: <CustomerFacingFigure />,
        requirements: [
            {
                id: 'latency',
                title: 'End-to-End Low Latency',
                desc: 'Customer-facing apps need both fresh data and fast responses. New events must become queryable within seconds, and analytical queries must return in sub-second time for dashboards, embedded analytics, and in-product workflows.',
            },
            {
                id: 'concurrency',
                title: 'High Concurrency',
                desc: 'Thousands of users may query at the same time. The analytics engine must hold low latency under heavy concurrent load, not just in single-query benchmarks.',
            },
            {
                id: 'multi-tenancy',
                title: 'Multi-Tenancy & Resource Isolation',
                desc: 'Customer-facing analytics often serves many tenants, users, or embedded applications from one platform. The engine must isolate data, workloads, and resources so one tenant’s activity never affects another tenant’s performance, security, or experience.',
            },
            {
                id: 'lakehouse',
                title: 'Lakehouse & Open Data Access',
                desc: 'Data already lives in open lakehouse formats, object storage, and existing data lake architectures. The analytics engine must query it in place, combine it with real-time serving data, and deliver fresh insights without another data copy.',
            },
        ],
        capabilitiesTitle: 'Apache Doris capabilities for customer-facing analytics',
        capabilities: [
            {
                id: 'ingest',
                title: (
                    <>
                        Ingest to Query
                        <br />
                        in Seconds
                    </>
                ),
                poweredBy: [
                    { label: 'Load Transactions', href: `${KF}/load-transaction` },
                    { label: 'Data Compaction', href: `${KF}/data-compaction` },
                    { label: 'Data Update and Delete', href: `${KF}/data-update-delete` },
                    { label: 'Preaggregation and Rollup', href: `${KF}/preaggregation-and-rollup` },
                    { label: 'Group Commit', href: `${KF}/group-commit` },
                    { label: 'Kafka and CDC Integration', href: `${KF}/kafka-cdc-integration` },
                    { label: 'Incremental Materialized View', href: `${KF}/incremental-materialized-view` },
                    { label: 'Unique Key', href: `${KF}/unique-key` },
                ],
            },
            {
                id: 'subsecond',
                title: (
                    <>
                        Sub-Second
                        <br />
                        at High Concurrency
                    </>
                ),
                poweredBy: [
                    { label: 'Data Pruning', href: `${KF}/data-pruning` },
                    { label: 'High-Concurrency Point Query', href: `${KF}/high-concurrency-point-query` },
                    { label: 'Vectorized Execution', href: `${KF}/vectorized-execution` },
                    { label: 'Columnar Storage', href: `${KF}/columnar-storage` },
                    { label: 'Prepared Statement', href: `${KF}/prepared-statement` },
                    { label: 'Query Cache', href: `${KF}/query-cache` },
                    { label: 'Condition Cache', href: `${KF}/condition-cache` },
                ],
            },
            {
                id: 'multi-tenant',
                title: (
                    <>
                        Multi-Tenant &
                        <br />
                        Resource Isolation
                    </>
                ),
                poweredBy: [
                    { label: 'Workload Group', href: `${KF}/workload-group` },
                    { label: 'Resource Group', href: `${KF}/resource-group` },
                    { label: 'Compute Group', href: `${KF}/compute-group` },
                    { label: 'Pipeline Execution Engine', href: `${KF}/pipeline-execution-engine` },
                ],
            },
            {
                id: 'lakehouse',
                title: (
                    <>
                        Lakehouse
                        <br />
                        Integration
                    </>
                ),
                poweredBy: [
                    { label: 'Parquet Reader Optimization', href: `${KF}/parquet-reader-optimization` },
                    { label: 'Data Cache & Page Cache', href: `${KF}/data-cache-page-cache` },
                    { label: 'Metadata Cache', href: `${KF}/metadata-cache` },
                    { label: 'Iceberg', href: `${KF}/iceberg` },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                Build Customer-Facing Analytics
                <br />
                with <span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function CustomerFacingAnalyticsNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
