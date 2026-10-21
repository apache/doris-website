import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { Bolt } from './UseCaseIcons';
import { DataWarehouseFigure } from './figures/DataWarehouseFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'dw',
    screenLabel: translate({ id: "marketing.warehouse.001", message: "Data Warehousing" }),
    meta: {
        title: translate({ id: "marketing.warehouse.002", message: "Apache Doris: Modern Data Warehousing for Real-Time Insights" }),
        description:
            translate({ id: "marketing.warehouse.003", message: "Apache Doris is a modern data warehousing layer for low-latency dashboards, high-concurrency BI, and operational reporting on familiar SQL models." }),
    },
    hero: {
        title: (
            <>
                {translate({ id: "marketing.warehouse.004", message: "Modern Data Warehousing," })}<br />
                {translate({ id: "marketing.warehouse.005", message: "Built for" })}{' '}
                <span className="uc-accent">
                    {translate({ id: "marketing.warehouse.006", message: "Real-Time" })}<Bolt />
                </span>{' '}
                {translate({ id: "marketing.warehouse.007", message: "Insights" })}</>
        ),
        sub: translate({ id: "marketing.warehouse.008", message: "Unify batch and streaming data, speed up BI, and serve trusted business metrics at scale from one real-time analytical database." }),
    },
    value: {
        title: [translate({ id: "marketing.warehouse.009", message: "Why modern data warehousing" }), translate({ id: "marketing.warehouse.010", message: "changes the business." })],
        lead: translate({ id: "marketing.extra.009", message: "When the warehouse is unified, fast, real-time, and elastic, four things shift at once:" }),
        points: [translate({ id: "marketing.warehouse.011", message: "Trust in the data" }), translate({ id: "marketing.warehouse.012", message: "The speed of analysis" }), translate({ id: "marketing.warehouse.013", message: "The freshness of decisions" }), translate({ id: "marketing.warehouse.014", message: "The cost of running it all" })],
        cards: [
            {
                id: 'unified-view',
                icon: 'table',
                title: translate({ id: "marketing.warehouse.015", message: "Unified Business View" }),
                summary:
                    translate({ id: "marketing.warehouse.016", message: "Orders, customers, payments, CRM, ERP, ads, and logs become one trusted analytical layer, so every team works from the same metrics." }),
            },
            {
                id: 'faster-bi',
                icon: 'bolt',
                title: translate({ id: "marketing.warehouse.017", message: "Faster BI & Self-Service" }),
                summary:
                    translate({ id: "marketing.warehouse.018", message: "Sub-second SQL keeps drill-downs and ad hoc questions interactive in Tableau, Power BI, Superset, and Looker." }),
            },
            {
                id: 'real-time',
                icon: 'pulse',
                title: translate({ id: "marketing.warehouse.019", message: "Real-Time Monitoring" }),
                summary:
                    translate({ id: "marketing.warehouse.020", message: "Continuous ingestion from CDC, Kafka, and Flink keeps dashboards, alerts, and operational reports in step with what is happening now." }),
            },
            {
                id: 'scalable',
                icon: 'layers',
                title: translate({ id: "marketing.warehouse.021", message: "Scalable & Cost-Efficient" }),
                summary:
                    translate({ id: "marketing.warehouse.022", message: "Analytics grows from terabytes to petabytes, and BI concurrency grows with it, without adding systems, pipelines, or serving layers." }),
            },
        ],
    },
    cases: {
        title: translate({ id: "marketing.warehouse.023", message: "Already running in production." }),
        sub: translate({ id: "marketing.warehouse.024", message: "Three teams run Apache Doris as the analytical core of their data warehouse: at scale, under real concurrency, on live business data." }),
        items: [
            {
                id: 'sf-technology',
                num: translate({ id: "marketing.extra.010", message: "Case 01 · SF Technology" }),
                title: translate({ id: "marketing.warehouse.025", message: "SF Express: From Presto to Apache Doris for BI and Ad Hoc Analytics" }),
                summary:
                    translate({ id: "marketing.warehouse.026", message: "SF Technology moved its main BI platform, over 1 million queries a day, from Presto to Apache Doris, and cut P95 latency by nearly 70% while migrating every ad hoc and BI workload." }),
                outcomes: [
                    translate({ id: "marketing.warehouse.027", message: "P95 query latency down nearly 70%; queries under 10 s up from 72% to 88%" }),
                    translate({ id: "marketing.warehouse.028", message: "48% less hardware, with a 96% data cache hit rate on lakehouse queries" }),
                    translate({ id: "marketing.warehouse.029", message: "100% of ad hoc and BI workloads migrated, at 97% SQL compatibility" }),
                ],
                href: 'https://www.velodb.io/blog/sf-technology-replaced-presto-apache-doris',
                logo: { src: '/images/next/user-logos/sf-express-white.png', alt: 'SF Express', height: 44, text: translate({ id: "marketing.warehouse.030", message: "SF EXPRESS" }) },
            },
            {
                id: 'xiaomi',
                num: translate({ id: "marketing.extra.011", message: "Case 02 · Xiaomi" }),
                title: translate({ id: "marketing.warehouse.031", message: "Xiaomi: A Unified Lakehouse with Apache Doris and Apache Paimon" }),
                summary:
                    translate({ id: "marketing.warehouse.032", message: "Xiaomi consolidated Presto, Druid, and a spread of storage formats into one lakehouse on Apache Doris and Apache Paimon, with 6× faster queries than before." }),
                outcomes: [
                    translate({ id: "marketing.warehouse.033", message: "Average query latency cut from 60 s to 10 s; aggregations from 40 s to 8 s" }),
                    translate({ id: "marketing.warehouse.034", message: "5× higher concurrent throughput than Presto, with latency down 25% to 75% under load" }),
                    translate({ id: "marketing.warehouse.035", message: "One stack for hot data in Doris and cold data in Paimon across user behavior, device, and operations analytics" }),
                ],
                href: 'https://www.velodb.io/blog/unified-lakehouse-apache-doris-apache-paimon-xiaomi',
                logo: { src: '/images/next/user-logos/xiaomi.svg', alt: 'Xiaomi', height: 36, invert: true, text: translate({ id: "marketing.warehouse.036", message: "XIAOMI" }) },
            },
            {
                id: 'cainiao',
                num: translate({ id: "marketing.extra.012", message: "Case 03 · Cainiao" }),
                title: translate({ id: "marketing.warehouse.037", message: "Cainiao: A Real-Time Lakehouse for Global Logistics" }),
                quote: translate({ id: "marketing.warehouse.038", message: "Data updates can be completed within seconds, and queries can be responded to within hundreds of milliseconds." }),
                outcomes: [
                    translate({ id: "marketing.warehouse.039", message: "90% lower cost and 72% faster average response on the real-time data platform" }),
                    translate({ id: "marketing.warehouse.040", message: "1,000 to 2,000 QPS point queries in 10 to 100 ms, and 200 to 300 QPS sub-second multi-table joins" }),
                    translate({ id: "marketing.warehouse.041", message: "25+ clusters and 10,000+ CPUs across 3 regions, tracking inventory, packages, and orders for 80 million daily packages" }),
                ],
                href: 'https://www.velodb.io/blog/apache-doris-empowers-realtime-lakehouse-cainiao',
                logo: { src: '/images/next/user-logos/cainiao-icon.png', alt: 'Cainiao', height: 44, text: translate({ id: "marketing.warehouse.042", message: "CAINIAO" }) },
            },
        ],
    },
    tech: {
        title: [translate({ id: "marketing.warehouse.043", message: "What data warehousing demands" }), translate({ id: "marketing.warehouse.044", message: "and how Apache Doris answers." })],
        sub: translate({ id: "marketing.warehouse.045", message: "Five things a modern data warehouse has to be good at, and the specific Apache Doris capabilities that meet each one." }),
        figure: <DataWarehouseFigure />,
        requirements: [
            {
                id: 'freshness',
                title: translate({ id: "marketing.warehouse.046", message: "Real-Time Data Freshness" }),
                desc: translate({ id: "marketing.warehouse.047", message: "Business teams need to see what is happening now. That takes streaming ingestion, CDC, incremental updates, and data that becomes queryable within seconds rather than after the nightly batch." }),
            },
            {
                id: 'modeling',
                title: translate({ id: "marketing.warehouse.048", message: "Modeling for Warehouse Workloads" }),
                desc: translate({ id: "marketing.warehouse.049", message: "A modern data warehouse has to hold detail records, fact and dimension tables, wide tables, aggregated metrics, and business-ready datasets. Solid modeling keeps definitions consistent, speeds up queries, and lets teams reuse trusted data." }),
            },
            {
                id: 'incremental',
                title: translate({ id: "marketing.warehouse.050", message: "Incremental Updates & Reliable Batch" }),
                desc: translate({ id: "marketing.warehouse.051", message: "Warehouse workloads need both incremental refresh and large batch runs. Materialized views and incremental computation keep aggregates, rollups, and reporting tables fresh without full recomputation, while dependable batch execution covers end-of-day jobs, backfills, and historical workloads." }),
            },
            {
                id: 'lakehouse',
                title: translate({ id: "marketing.warehouse.052", message: "Lakehouse & Open Architecture" }),
                desc: translate({ id: "marketing.warehouse.053", message: "Operational databases, event streams, SaaS applications, and open lakehouse tables all hold critical business data. The warehouse has to integrate these sources and query data in place across Iceberg, Hudi, Delta Lake, and Hive, without copying everything into another silo." }),
            },
            {
                id: 'governance',
                title: translate({ id: "marketing.warehouse.054", message: "Enterprise Governance & Operations" }),
                desc: translate({ id: "marketing.warehouse.055", message: "Once the warehouse is the shared analytics foundation, it must be secure, reliable, auditable, and easy to run. That means fine-grained access control, workload isolation, high availability, audit logs, and simple operations, so every team can depend on the same platform." }),
            },
        ],
        capabilitiesTitle: translate({ id: "marketing.extra.013", message: "Apache Doris capabilities for data warehousing" }),
        capabilities: [
            {
                id: 'modeling',
                title: (
                    <>
                        {translate({ id: "marketing.warehouse.056", message: "Flexible Warehouse" })}<br />
                        {translate({ id: "marketing.warehouse.057", message: "Data Modeling" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.warehouse.058", message: "Data Model" }), href: `${KF}/data-model` },
                    { label: translate({ id: "marketing.warehouse.059", message: "Preaggregation and Rollup" }), href: `${KF}/preaggregation-and-rollup` },
                    { label: translate({ id: "marketing.warehouse.060", message: "Analytic Functions" }), href: `${KF}/analytic-functions` },
                    { label: translate({ id: "marketing.warehouse.061", message: "Partitioning and Bucketing" }), href: `${KF}/partitioning-and-bucketing` },
                    { label: translate({ id: "marketing.warehouse.062", message: "Unique Key" }), href: `${KF}/unique-key` },
                ],
            },
            {
                id: 'ingest',
                title: (
                    <>
                        {translate({ id: "marketing.warehouse.063", message: "Real-Time Ingestion" })}<br />
                        {translate({ id: "marketing.warehouse.064", message: "& Updates" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.warehouse.065", message: "Load Transactions" }), href: `${KF}/load-transaction` },
                    { label: translate({ id: "marketing.warehouse.066", message: "Data Compaction" }), href: `${KF}/data-compaction` },
                    { label: translate({ id: "marketing.warehouse.067", message: "Data Update and Delete" }), href: `${KF}/data-update-delete` },
                    { label: translate({ id: "marketing.warehouse.068", message: "Group Commit" }), href: `${KF}/group-commit` },
                    { label: translate({ id: "marketing.warehouse.069", message: "Kafka and CDC Integration" }), href: `${KF}/kafka-cdc-integration` },
                ],
            },
            {
                id: 'incremental',
                title: (
                    <>
                        {translate({ id: "marketing.warehouse.070", message: "Incremental Refresh" })}<br />
                        {translate({ id: "marketing.warehouse.071", message: "& Batch Execution" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.warehouse.072", message: "Batch Load" }), href: `${KF}/batch-load` },
                    { label: translate({ id: "marketing.warehouse.073", message: "Incremental Materialized View" }), href: `${KF}/incremental-materialized-view` },
                    { label: translate({ id: "marketing.warehouse.074", message: "Spill to Disk" }), href: `${KF}/spill-to-disk` },
                    { label: translate({ id: "marketing.warehouse.075", message: "Changelog / Table Stream (coming soon)" }), href: `${KF}/changelog-table-stream` },
                ],
            },
            {
                id: 'lakehouse',
                title: (
                    <>
                        {translate({ id: "marketing.warehouse.076", message: "Lakehouse" })}<br />
                        {translate({ id: "marketing.warehouse.077", message: "Compute Engine" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.warehouse.078", message: "Multi Catalog" }), href: `${KF}/multi-catalog` },
                    { label: translate({ id: "marketing.warehouse.079", message: "Managing Lake Tables" }), href: `${KF}/managing-lake-table` },
                    { label: 'Iceberg', href: `${KF}/iceberg` },
                ],
            },
            {
                id: 'governance',
                title: (
                    <>
                        {translate({ id: "marketing.warehouse.080", message: "Enterprise-Grade" })}<br />
                        {translate({ id: "marketing.warehouse.081", message: "Governance" })}</>
                ),
                poweredBy: [
                    { label: translate({ id: "marketing.warehouse.082", message: "Pluggable Authentication" }), href: `${KF}/pluggable-auth` },
                    { label: translate({ id: "marketing.warehouse.083", message: "Catalog Integrations" }), href: `${KF}/catalog-integrations` },
                    { label: translate({ id: "marketing.warehouse.084", message: "Data Lineage" }), href: `${KF}/data-lineage` },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                {translate({ id: "marketing.warehouse.085", message: "Build a Modern Data Warehouse" })}<br />
                {translate({ id: "marketing.warehouse.086", message: "with" })}{" "}<span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function DataWarehousingNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
