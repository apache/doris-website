import React, { JSX } from 'react';
import { UseCasePage, UseCasePageContent } from './UseCasePage';
import { Bolt } from './UseCaseIcons';
import { DataWarehouseFigure } from './figures/DataWarehouseFigure';

const KF = '/docs/dev/key-features';

const content: UseCasePageContent = {
    slug: 'dw',
    screenLabel: 'Data Warehousing',
    meta: {
        title: 'Apache Doris: Modern Data Warehousing for Real-Time Insights',
        description:
            'Apache Doris is a modern data warehousing layer for low-latency dashboards, high-concurrency BI, and operational reporting on familiar SQL models.',
    },
    hero: {
        title: (
            <>
                Modern Data Warehousing,
                <br />
                Built for{' '}
                <span className="uc-accent">
                    Real-Time
                    <Bolt />
                </span>{' '}
                Insights
            </>
        ),
        sub: 'Unify batch and streaming data, speed up BI, and serve trusted business metrics at scale from one real-time analytical database.',
    },
    value: {
        title: ['Why modern data warehousing', 'changes the business.'],
        lead: 'When the warehouse is unified, fast, real-time, and elastic, four things shift at once:',
        points: ['Trust in the data', 'The speed of analysis', 'The freshness of decisions', 'The cost of running it all'],
        cards: [
            {
                id: 'unified-view',
                icon: 'table',
                title: 'Unified Business View',
                summary:
                    'Orders, customers, payments, CRM, ERP, ads, and logs become one trusted analytical layer, so every team works from the same metrics.',
            },
            {
                id: 'faster-bi',
                icon: 'bolt',
                title: 'Faster BI & Self-Service',
                summary:
                    'Sub-second SQL keeps drill-downs and ad hoc questions interactive in Tableau, Power BI, Superset, and Looker.',
            },
            {
                id: 'real-time',
                icon: 'pulse',
                title: 'Real-Time Monitoring',
                summary:
                    'Continuous ingestion from CDC, Kafka, and Flink keeps dashboards, alerts, and operational reports in step with what is happening now.',
            },
            {
                id: 'scalable',
                icon: 'layers',
                title: 'Scalable & Cost-Efficient',
                summary:
                    'Analytics grows from terabytes to petabytes, and BI concurrency grows with it, without adding systems, pipelines, or serving layers.',
            },
        ],
    },
    cases: {
        title: 'Already running in production.',
        sub: 'Three teams run Apache Doris as the analytical core of their data warehouse: at scale, under real concurrency, on live business data.',
        items: [
            {
                id: 'sf-technology',
                num: 'Case 01 · SF Technology',
                title: 'SF Express: From Presto to Apache Doris for BI and Ad Hoc Analytics',
                summary:
                    'SF Technology moved its main BI platform, over 1 million queries a day, from Presto to Apache Doris, and cut P95 latency by nearly 70% while migrating every ad hoc and BI workload.',
                outcomes: [
                    'P95 query latency down nearly 70%; queries under 10 s up from 72% to 88%',
                    '48% less hardware, with a 96% data cache hit rate on lakehouse queries',
                    '100% of ad hoc and BI workloads migrated, at 97% SQL compatibility',
                ],
                href: 'https://www.velodb.io/blog/sf-technology-replaced-presto-apache-doris',
                logo: { src: '/images/next/user-logos/sf-express-white.png', alt: 'SF Express', height: 44, text: 'SF EXPRESS' },
            },
            {
                id: 'xiaomi',
                num: 'Case 02 · Xiaomi',
                title: 'Xiaomi: A Unified Lakehouse with Apache Doris and Apache Paimon',
                summary:
                    'Xiaomi consolidated Presto, Druid, and a spread of storage formats into one lakehouse on Apache Doris and Apache Paimon, with 6× faster queries than before.',
                outcomes: [
                    'Average query latency cut from 60 s to 10 s; aggregations from 40 s to 8 s',
                    '5× higher concurrent throughput than Presto, with latency down 25% to 75% under load',
                    'One stack for hot data in Doris and cold data in Paimon across user behavior, device, and operations analytics',
                ],
                href: 'https://www.velodb.io/blog/unified-lakehouse-apache-doris-apache-paimon-xiaomi',
                logo: { src: '/images/next/user-logos/xiaomi.svg', alt: 'Xiaomi', height: 36, invert: true, text: 'XIAOMI' },
            },
            {
                id: 'cainiao',
                num: 'Case 03 · Cainiao',
                title: 'Cainiao: A Real-Time Lakehouse for Global Logistics',
                quote: 'Data updates can be completed within seconds, and queries can be responded to within hundreds of milliseconds.',
                outcomes: [
                    '90% lower cost and 72% faster average response on the real-time data platform',
                    '1,000 to 2,000 QPS point queries in 10 to 100 ms, and 200 to 300 QPS sub-second multi-table joins',
                    '25+ clusters and 10,000+ CPUs across 3 regions, tracking inventory, packages, and orders for 80 million daily packages',
                ],
                href: 'https://www.velodb.io/blog/apache-doris-empowers-realtime-lakehouse-cainiao',
                logo: { src: '/images/next/user-logos/cainiao-icon.png', alt: 'Cainiao', height: 44, text: 'CAINIAO' },
            },
        ],
    },
    tech: {
        title: ['What data warehousing demands', 'and how Apache Doris answers.'],
        sub: 'Five things a modern data warehouse has to be good at, and the specific Apache Doris capabilities that meet each one.',
        figure: <DataWarehouseFigure />,
        requirements: [
            {
                id: 'freshness',
                title: 'Real-Time Data Freshness',
                desc: 'Business teams need to see what is happening now. That takes streaming ingestion, CDC, incremental updates, and data that becomes queryable within seconds rather than after the nightly batch.',
            },
            {
                id: 'modeling',
                title: 'Modeling for Warehouse Workloads',
                desc: 'A modern data warehouse has to hold detail records, fact and dimension tables, wide tables, aggregated metrics, and business-ready datasets. Solid modeling keeps definitions consistent, speeds up queries, and lets teams reuse trusted data.',
            },
            {
                id: 'incremental',
                title: 'Incremental Updates & Reliable Batch',
                desc: 'Warehouse workloads need both incremental refresh and large batch runs. Materialized views and incremental computation keep aggregates, rollups, and reporting tables fresh without full recomputation, while dependable batch execution covers end-of-day jobs, backfills, and historical workloads.',
            },
            {
                id: 'lakehouse',
                title: 'Lakehouse & Open Architecture',
                desc: 'Operational databases, event streams, SaaS applications, and open lakehouse tables all hold critical business data. The warehouse has to integrate these sources and query data in place across Iceberg, Hudi, Delta Lake, and Hive, without copying everything into another silo.',
            },
            {
                id: 'governance',
                title: 'Enterprise Governance & Operations',
                desc: 'Once the warehouse is the shared analytics foundation, it must be secure, reliable, auditable, and easy to run. That means fine-grained access control, workload isolation, high availability, audit logs, and simple operations, so every team can depend on the same platform.',
            },
        ],
        capabilitiesTitle: 'Apache Doris capabilities for data warehousing',
        capabilities: [
            {
                id: 'modeling',
                title: (
                    <>
                        Flexible Warehouse
                        <br />
                        Data Modeling
                    </>
                ),
                poweredBy: [
                    { label: 'Data Model', href: `${KF}/data-model` },
                    { label: 'Preaggregation and Rollup', href: `${KF}/preaggregation-and-rollup` },
                    { label: 'Analytic Functions', href: `${KF}/analytic-functions` },
                    { label: 'Partitioning and Bucketing', href: `${KF}/partitioning-and-bucketing` },
                    { label: 'Unique Key', href: `${KF}/unique-key` },
                ],
            },
            {
                id: 'ingest',
                title: (
                    <>
                        Real-Time Ingestion
                        <br />
                        & Updates
                    </>
                ),
                poweredBy: [
                    { label: 'Load Transactions', href: `${KF}/load-transaction` },
                    { label: 'Data Compaction', href: `${KF}/data-compaction` },
                    { label: 'Data Update and Delete', href: `${KF}/data-update-delete` },
                    { label: 'Group Commit', href: `${KF}/group-commit` },
                    { label: 'Kafka and CDC Integration', href: `${KF}/kafka-cdc-integration` },
                ],
            },
            {
                id: 'incremental',
                title: (
                    <>
                        Incremental Refresh
                        <br />
                        & Batch Execution
                    </>
                ),
                poweredBy: [
                    { label: 'Batch Load', href: `${KF}/batch-load` },
                    { label: 'Incremental Materialized View', href: `${KF}/incremental-materialized-view` },
                    { label: 'Spill to Disk', href: `${KF}/spill-to-disk` },
                    { label: 'Binlog / Table Stream (coming soon)', href: `${KF}/binlog-table-stream` },
                ],
            },
            {
                id: 'lakehouse',
                title: (
                    <>
                        Lakehouse
                        <br />
                        Compute Engine
                    </>
                ),
                poweredBy: [
                    { label: 'Multi Catalog', href: `${KF}/multi-catalog` },
                    { label: 'Managing Lake Tables', href: `${KF}/managing-lake-table` },
                    { label: 'Iceberg', href: `${KF}/iceberg` },
                ],
            },
            {
                id: 'governance',
                title: (
                    <>
                        Enterprise-Grade
                        <br />
                        Governance
                    </>
                ),
                poweredBy: [
                    { label: 'Pluggable Authentication', href: `${KF}/pluggable-auth` },
                    { label: 'Catalog Integrations', href: `${KF}/catalog-integrations` },
                    { label: 'Data Lineage', href: `${KF}/data-lineage` },
                ],
            },
        ],
    },
    cta: {
        title: (
            <>
                Build a Modern Data Warehouse
                <br />
                with <span className="uc-accent">Apache Doris.</span>
            </>
        ),
    },
};

export default function DataWarehousingNext(): JSX.Element {
    return <UseCasePage content={content} />;
}
