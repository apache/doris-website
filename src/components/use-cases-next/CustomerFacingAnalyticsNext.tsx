import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { Bolt } from './UseCaseIcons';
import { CustomerFacingFigure } from './figures/CustomerFacingFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'cfa',
    screenLabel: translate({ id: "marketing.customer.001", message: "Customer-Facing Analytics" }),
    meta: {
        title: translate({ id: "marketing.customer.002", message: "Apache Doris: Customer-Facing Analytics on Real-Time Data" }),
        description:
            translate({ id: "marketing.customer.003", message: "Deliver sub-second, interactive customer-facing analytics with Apache Doris: real-time data, high concurrency, and tenant isolation on one engine." }),
    },
    hero: {
        title: (
            <>
                {translate({ id: "marketing.customer.004", message: "Customer-Facing Analytics," })}<br />
                {translate({ id: "marketing.customer.005", message: "Powered by" })}{' '}
                <span className="uc-accent">
                    {translate({ id: "marketing.customer.006", message: "Real-Time" })}<Bolt /> {translate({ id: "marketing.customer.007", message: "Data" })}</span>
            </>
        ),
        sub: translate({ id: "marketing.customer.008", message: "Deliver sub-second, interactive analytics directly to your customers, at scale." }),
    },
    value: {
        title: [translate({ id: "marketing.customer.009", message: "Why real-time" }), translate({ id: "marketing.customer.010", message: "changes the product." })],
        lead: translate({ id: "marketing.extra.004", message: "When analytics moves from an internal report into the product itself, four things change at once:" }),
        points: [translate({ id: "marketing.customer.011", message: "The user experience" }), translate({ id: "marketing.customer.012", message: "Engagement" }), translate({ id: "marketing.customer.013", message: "Revenue" }), translate({ id: "marketing.customer.014", message: "The speed of decisions" })],
        cards: [
            {
                id: 'better-ux',
                icon: 'bulb',
                title: translate({ id: "marketing.customer.015", message: "Better User Experience" }),
                summary:
                    translate({ id: "marketing.customer.016", message: "Dashboards load the moment users arrive, so analytics feels like a native part of the product instead of a report to wait for." }),
            },
            {
                id: 'engagement',
                icon: 'trend',
                title: translate({ id: "marketing.customer.017", message: "Higher Engagement & Retention" }),
                summary: translate({ id: "marketing.customer.018", message: "Live, responsive analytics turns product data into a reason for users to come back." }),
            },
            {
                id: 'monetization',
                icon: 'dollar',
                title: translate({ id: "marketing.customer.019", message: "Monetization" }),
                summary:
                    translate({ id: "marketing.customer.020", message: "Customer-facing analytics becomes a premium, revenue-generating feature inside your own product." }),
            },
            {
                id: 'decisions',
                icon: 'bolt',
                title: translate({ id: "marketing.customer.021", message: "Faster Decisions" }),
                summary:
                    translate({ id: "marketing.customer.022", message: "Real-time signals let teams act while an opportunity is still open, instead of reacting to yesterday’s data." }),
            },
        ],
    },
    cases: {
        title: translate({ id: "marketing.customer.023", message: "Already shipping in production." }),
        sub: translate({ id: "marketing.customer.024", message: "Three teams use Apache Doris to serve sub-second analytics to their customers, under real concurrency, on live data." }),
        items: [
            {
                id: 'jd',
                num: translate({ id: "marketing.extra.005", message: "Case 01 · JD.com" }),
                title: translate({ id: "marketing.customer.025", message: "Real-Time OLAP for the JD.com Search Box" }),
                quote: translate({ id: "marketing.customer.026", message: "Replacing Flink’s window computing with Doris can not only improve development efficiency, adapt to dimension changes, but also reduce computing resources." }),
                scenario:
                    translate({ id: "marketing.customer.027", message: "Real-time analytics for the JD.com search box: overall search traffic, live A/B test monitoring, and trending search terms, all at SKU-level granularity for business analysts." }),
                outcomes: [
                    translate({ id: "marketing.customer.028", message: "10 billion rows processed per day" }),
                    translate({ id: "marketing.customer.029", message: "10,000 QPS with query latency as low as 150 ms" }),
                    translate({ id: "marketing.customer.030", message: "Real-time ingestion at 1 million rows per second" }),
                ],
                href: 'https://www.velodb.io/blog/jd-com-s-exploration-practice-apache-doris',
                logo: { src: '/images/next/user-logos/jd-color.png', alt: 'JD.com', height: 40 },
            },
            {
                id: 'xanh-sm',
                num: translate({ id: "marketing.extra.006", message: "Case 02 · Xanh SM" }),
                title: translate({ id: "marketing.customer.031", message: "Real-Time Recommendations for Xanh SM" }),
                quote: translate({ id: "marketing.customer.032", message: "Apache Doris and its Compute-Storage Decouple Mode allowed us to run both workloads from a single storage layer, cutting infrastructure cost and complexity without sacrificing performance." }),
                scenario:
                    translate({ id: "marketing.customer.033", message: "Xanh SM, Vietnam’s leading EV ride-hailing platform, runs analytics and real-time serving on Apache Doris to power personalized destination recommendations." }),
                outcomes: [
                    translate({ id: "marketing.customer.034", message: "175,000 records written per second with sub-second latency" }),
                    translate({ id: "marketing.customer.035", message: "Average query latency around 76 ms across most time windows" }),
                    translate({ id: "marketing.customer.036", message: "P9999 latency only occasionally above 100 ms" }),
                ],
                href: 'https://www.velodb.io/blog/how-xanhsm-built-real-time-recommendations-with-apache-doris',
                logo: { src: '/images/next/user-logos/green-sm.svg', alt: 'Xanh SM', height: 32 },
            },
            {
                id: 'zto',
                num: translate({ id: "marketing.extra.007", message: "Case 03 · ZTO Express" }),
                title: translate({ id: "marketing.customer.037", message: "Real-Time Analytics for ZTO Express" }),
                summary:
                    translate({ id: "marketing.customer.038", message: "ZTO Express rebuilt its real-time analytics over 500 million daily record updates, with inverted indexes on high-frequency filter fields serving monitoring, multi-dimensional analysis, and precise filtering." }),
                outcomes: [
                    translate({ id: "marketing.customer.039", message: "Multi-dimensional filter queries down from over 1 minute to under 1 second (60×); complex aggregations from 5 to 10 minutes to under 1 minute" }),
                    translate({ id: "marketing.customer.040", message: "Concurrency on critical queries up from under 50 to 100+, with timeouts down from 30% to under 5%" }),
                    translate({ id: "marketing.customer.041", message: "One-third of the original hardware, with 500 million daily updates visible in queries within seconds" }),
                ],
                href: 'https://www.velodb.io/blog/how-zto-express-rebuilt-real-time-analytics-with-inverted-index',
                logo: {
                    src: '/images/next/user-logos/zto-circle.png',
                    alt: 'ZTO Express',
                    height: 56,
                    text: translate({ id: "marketing.customer.042", message: "ZTO EXPRESS" }),
                    textColor: '#2989ff',
                },
            },
        ],
    },
    tech: {
        title: [translate({ id: "marketing.customer.043", message: "What customer-facing analytics demands" }), translate({ id: "marketing.customer.044", message: "and how Apache Doris answers." })],
        sub: translate({ id: "marketing.customer.045", message: "Customer-facing analytics is a different workload from internal BI. Four things the serving engine has to get right, and the specific Apache Doris capabilities that meet each one." }),
        figure: <CustomerFacingFigure />,
        requirements: [
            {
                id: 'latency',
                title: translate({ id: "marketing.customer.046", message: "End-to-End Low Latency" }),
                desc: translate({ id: "marketing.customer.047", message: "Customer-facing apps need both fresh data and fast responses. New events must become queryable within seconds, and analytical queries must return in sub-second time for dashboards, embedded analytics, and in-product workflows." }),
            },
            {
                id: 'concurrency',
                title: translate({ id: "marketing.customer.048", message: "High Concurrency" }),
                desc: translate({ id: "marketing.customer.049", message: "Thousands of users may query at the same time. The analytics engine must hold low latency under heavy concurrent load, not just in single-query benchmarks." }),
            },
            {
                id: 'multi-tenancy',
                title: translate({ id: "marketing.customer.050", message: "Multi-Tenancy & Resource Isolation" }),
                desc: translate({ id: "marketing.customer.051", message: "Customer-facing analytics often serves many tenants, users, or embedded applications from one platform. The engine must isolate data, workloads, and resources so one tenant’s activity never affects another tenant’s performance, security, or experience." }),
            },
            {
                id: 'lakehouse',
                title: translate({ id: "marketing.customer.052", message: "Lakehouse & Open Data Access" }),
                desc: translate({ id: "marketing.customer.053", message: "Data already lives in open lakehouse formats, object storage, and existing data lake architectures. The analytics engine must query it in place, combine it with real-time serving data, and deliver fresh insights without another data copy." }),
            },
        ],
        capabilitiesTitle: translate({ id: "marketing.extra.008", message: "Apache Doris capabilities for customer-facing analytics" }),
        capabilities: [
            {
                id: 'ingest',
                title: (
                    <>
                        {translate({ id: "marketing.customer.054", message: "Ingest to Query" })}<br />
                        {translate({ id: "marketing.customer.055", message: "in Seconds" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.customer.056", message: "Load Transactions" }), href: `${KF}/load-transaction` },
                    { label: translate({ id: "marketing.customer.057", message: "Data Compaction" }), href: `${KF}/data-compaction` },
                    { label: translate({ id: "marketing.customer.058", message: "Data Update and Delete" }), href: `${KF}/data-update-delete` },
                    { label: translate({ id: "marketing.customer.059", message: "Preaggregation and Rollup" }), href: `${KF}/preaggregation-and-rollup` },
                    { label: translate({ id: "marketing.customer.060", message: "Group Commit" }), href: `${KF}/group-commit` },
                    { label: translate({ id: "marketing.customer.061", message: "Kafka and CDC Integration" }), href: `${KF}/kafka-cdc-integration` },
                    { label: translate({ id: "marketing.customer.062", message: "Incremental Materialized View" }), href: `${KF}/incremental-materialized-view` },
                    { label: translate({ id: "marketing.customer.063", message: "Unique Key" }), href: `${KF}/unique-key` },
                ],
            },
            {
                id: 'subsecond',
                title: (
                    <>
                        {translate({ id: "marketing.customer.064", message: "Sub-Second" })}<br />
                        {translate({ id: "marketing.customer.065", message: "at High Concurrency" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.customer.066", message: "Data Pruning" }), href: `${KF}/data-pruning` },
                    { label: translate({ id: "marketing.customer.067", message: "High-Concurrency Point Query" }), href: `${KF}/high-concurrency-point-query` },
                    { label: translate({ id: "marketing.customer.068", message: "Vectorized Execution" }), href: `${KF}/vectorized-execution` },
                    { label: translate({ id: "marketing.customer.069", message: "Columnar Storage" }), href: `${KF}/columnar-storage` },
                    { label: translate({ id: "marketing.customer.070", message: "Prepared Statement" }), href: `${KF}/prepared-statement` },
                    { label: translate({ id: "marketing.customer.071", message: "Query Cache" }), href: `${KF}/query-cache` },
                    { label: translate({ id: "marketing.customer.072", message: "Condition Cache" }), href: `${KF}/condition-cache` },
                ],
            },
            {
                id: 'multi-tenant',
                title: (
                    <>
                        {translate({ id: "marketing.customer.073", message: "Multi-Tenant &" })}<br />
                        {translate({ id: "marketing.customer.074", message: "Resource Isolation" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.customer.075", message: "Workload Group" }), href: `${KF}/workload-group` },
                    { label: translate({ id: "marketing.customer.076", message: "Resource Group" }), href: `${KF}/resource-group` },
                    { label: translate({ id: "marketing.customer.077", message: "Compute Group" }), href: `${KF}/compute-group` },
                    { label: translate({ id: "marketing.customer.078", message: "Pipeline Execution Engine" }), href: `${KF}/pipeline-execution-engine` },
                ],
            },
            {
                id: 'lakehouse',
                title: (
                    <>
                        {translate({ id: "marketing.customer.079", message: "Lakehouse" })}<br />
                        {translate({ id: "marketing.customer.080", message: "Integration" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.customer.081", message: "Parquet Reader Optimization" }), href: `${KF}/parquet-reader-optimization` },
                    { label: translate({ id: "marketing.customer.082", message: "Data Cache & Page Cache" }), href: `${KF}/data-cache-page-cache` },
                    { label: translate({ id: "marketing.customer.083", message: "Metadata Cache" }), href: `${KF}/metadata-cache` },
                    { label: 'Iceberg', href: `${KF}/iceberg` },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                {translate({ id: "marketing.customer.084", message: "Build Customer-Facing Analytics" })}<br />
                {translate({ id: "marketing.customer.085", message: "with" })}{" "}<span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function CustomerFacingAnalyticsNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
