import React from 'react';
import type { ValueProp } from './sections/WhyChooseSection';
import type { CaseStudy } from './sections/CoverFlowSection';
import type { TableRow } from './sections/ComparisonTableSection';

export interface ComparisonContent {
    competitorName: string;
    competitorMark: string;
    whyChoose: { sub: string; valueProps: ValueProp[] };
    cases: { sub: string; items: CaseStudy[] };
    table: { sub: string; rows: TableRow[] };
}

// ─── Doris vs. ClickHouse ────────────────────────────────────────────────────

const CLICKHOUSE: ComparisonContent = {
    competitorName: 'ClickHouse',
    competitorMark: 'C',
    whyChoose: {
        sub: 'Doris and ClickHouse are both leading real-time analytical databases. Doris pulls ahead on the workloads modern data teams run every day.',
        valueProps: [
            {
                stat: '2–10',
                unit: '×',
                arrow: '↑',
                label: 'Faster Joins',
                headline: 'Distributed multi-table joins, no wide-table workarounds.',
                text: 'MPP architecture with a cost-based optimizer that automatically picks Broadcast, Shuffle, or Colocate joins. Doris completes the full TPC-DS suite; ClickHouse fails about 50% of the queries.',
            },
            {
                stat: '70',
                unit: '%',
                arrow: '↓',
                label: 'Lower Cost',
                headline: 'Storage-compute separation, open-source.',
                text: 'Elastic compute scales without rebalancing. The cost model ships with open-source 3.0+, with no commercial-cloud lock-in.',
            },
            {
                stat: '1000',
                unit: '+',
                label: 'Concurrent Queries',
                headline: 'Real-time UPSERTs without sacrificing query speed.',
                text: 'Merge-on-Write keeps reads stable under high-frequency updates. Full ACID, MySQL-compatible, with thousands of concurrent queries instead of fewer than 100.',
            },
        ],
    },
    cases: {
        sub: 'Real production migrations at internet-scale companies running the same SQL workloads, with very different outcomes.',
        items: [
            {
                name: 'Kuaishou',
                mark: 'K',
                industry: 'Short-Form Video · 600M+ DAU',
                rank: 'Case 01',
                color: '#FF6B35',
                quote: 'After replacing ClickHouse with Apache Doris, Kuaishou successfully upgraded to a unified lakehouse architecture, achieving unified storage and a simplified data pipeline.',
                benefits: [
                    <><strong>Direct lakehouse queries</strong>: no ingestion, shorter pipeline</>,
                    <><strong>Materialized view rewriting</strong> for query acceleration across scenarios</>,
                    <>Flexible <strong>data governance</strong> via automatic materialization</>,
                ],
            },
            {
                name: 'Tencent Music',
                mark: 'T',
                industry: 'Music Streaming · 800M MAU',
                rank: 'Case 02',
                color: '#1DB954',
                quote: 'After migrating the analytical engine from ClickHouse to Apache Doris, the platform effectively improved data timeliness, reduced operational costs, and resolved fragmented data management.',
                benefits: [
                    <>Strong <strong>multi-table</strong> and <strong>federated query</strong> performance</>,
                    <><strong>MySQL-protocol compatible</strong>: lower operational overhead</>,
                    <><strong>Partial-column updates</strong> for diverse data update patterns</>,
                ],
            },
            {
                name: 'Youzan',
                mark: 'Y',
                industry: 'E-Commerce SaaS · 5M+ Merchants',
                rank: 'Case 03',
                color: '#FF4949',
                quote: 'Apache Doris has faster query response times than ClickHouse in the vast majority of scenarios, especially in complex join scenarios, where its performance is significantly superior.',
                benefits: [
                    <>Core business queries <strong>2–3× faster</strong></>,
                    <>Complex join queries <strong>2–10× faster</strong></>,
                    <>Runs <strong>all ClickHouse OOM</strong> queries successfully</>,
                ],
            },
        ],
    },
    table: {
        sub: 'Side-by-side, every dimension that matters.',
        rows: [
            {
                label: 'System Architecture',
                doris: [
                    'MPP distributed architecture',
                    'MySQL-protocol compatible, standard SQL',
                    'CBO automatic optimization',
                ],
                competitor: [
                    'Scatter-Gather architecture',
                    'SQL-like syntax, non-standard',
                    'Requires manual tuning',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Join Query Performance',
                doris: [
                    '2–10× faster, cross-node distributed',
                    'CBO chooses Join strategy',
                    'Full TPC-DS suite passes',
                    'Efficient memory, avoids OOM',
                ],
                competitor: [
                    'Subqueries + wide-table modeling',
                    'No CBO, manual tuning',
                    '~50% TPC-DS queries fail',
                    'Frequent OOM on large queries',
                ],
                dorisStrong: [true, true, true, true],
            },
            {
                label: 'Real-time Updates',
                doris: [
                    'Merge-on-Write engine',
                    'Strong consistency, immediate visibility',
                    'High-throughput UPSERT, no degradation',
                ],
                competitor: [
                    'ReplacingMergeTree, eventual consistency',
                    'FINAL causes 2–10× slowdown',
                    'High-frequency updates → merge overhead',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Transaction Support',
                doris: ['Full ACID transactions', 'Atomic batch ingestion'],
                competitor: ['No transaction support', 'Partial data may become visible'],
                dorisStrong: [true, true],
            },
            {
                label: 'Query Concurrency',
                doris: [
                    'Thousands of concurrent queries, 10×+',
                    'Efficient memory management',
                ],
                competitor: [
                    'Usually below 100 concurrent',
                    'Memory-intensive workloads destabilize cluster',
                ],
                dorisStrong: [true, true],
            },
            {
                label: 'Data API & Lakehouse',
                doris: [
                    'Arrow-Flight high-throughput protocol',
                    'Hive / Hudi / Iceberg / Parquet',
                    'Auto-scaling + multi-replica balancing',
                ],
                competitor: [
                    'JDBC only',
                    'Limited lakehouse integration',
                    'Scaling requires manual rebalancing',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Storage-Compute Separation',
                doris: [
                    'Open-source 3.0+',
                    'Elastic compute, no rebalance on scale',
                    'Up to 70% cost reduction',
                ],
                competitor: [
                    'Commercial Cloud edition only',
                    'Tightly coupled, scaling requires rebalance',
                    'Over-provisioning required for peaks',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Open-Source License',
                doris: ['Apache Foundation, community-maintained'],
                competitor: ['Controlled by a commercial company'],
                dorisStrong: [true],
            },
        ],
    },
};

// ─── Doris vs. Elasticsearch ─────────────────────────────────────────────────

const ELASTIC: ComparisonContent = {
    competitorName: 'Elasticsearch',
    competitorMark: 'E',
    whyChoose: {
        sub: 'Doris and Elasticsearch both serve observability, security, and real-time analytics. Doris pulls ahead on storage cost, write efficiency, and analytical depth, all without a custom DSL.',
        valueProps: [
            {
                stat: '5–10',
                unit: '×',
                arrow: '↑',
                label: 'Compression Ratio',
                headline: 'Far smaller storage footprint.',
                text: 'Doris compresses logs and metrics at 1:5 to 1:10, versus Elasticsearch\'s 1:1.5. The same data fits on a fraction of the disk.',
            },
            {
                stat: '<10',
                unit: '%',
                arrow: '↓',
                label: 'Write Overhead',
                headline: 'High write throughput, low overhead.',
                text: 'Doris indexes once across multiple replicas, keeping overhead under 10%. Elasticsearch indexes each replica separately and pays up to 3× per write under deduplication.',
            },
            {
                stat: '2–3',
                unit: '×',
                arrow: '↑',
                label: 'Faster Search',
                headline: 'Full-text search and SQL, no DSL.',
                text: 'Production migrations report 2–3× faster full-text search, with multi-table joins, materialized views, and the open MySQL ecosystem on top.',
            },
        ],
    },
    cases: {
        sub: 'Real Elasticsearch-to-Doris migrations across observability, financial security, and logistics. Same workload, dramatically smaller bill.',
        items: [
            {
                name: 'True Watch',
                mark: 'T',
                industry: 'Observability · GuanceDB',
                rank: 'Case 01',
                color: '#FF6B35',
                quote: 'By replacing Elasticsearch with Apache Doris, GuanceDB took a big stride in improving data processing speed and reducing costs.',
                benefits: [
                    <><strong>70% cost reduction</strong> after replacing Elasticsearch</>,
                    <><strong>2–3× faster</strong> full-text search performance</>,
                    <><strong>Variant data type</strong> for semi-structured log tracing</>,
                ],
            },
            {
                name: 'Bestpay',
                mark: 'B',
                industry: 'FinTech · Security Analytics',
                rank: 'Case 02',
                color: '#1E5DFF',
                quote: 'After unifying the architecture with Apache Doris, write throughput, complex query response, and storage efficiency all improved significantly.',
                benefits: [
                    <><strong>4× faster</strong> write speed</>,
                    <><strong>3× faster</strong> query performance</>,
                    <><strong>50% less storage</strong> for the same data</>,
                ],
            },
            {
                name: 'ZTO Express',
                mark: 'Z',
                industry: 'Logistics · 23B+ Parcels/Yr',
                rank: 'Case 03',
                color: '#E63946',
                quote: 'After introducing Doris, query performance improved 5–10× and concurrent processing capability doubled — 90% of analytics fell from 10 min to under 1 min.',
                benefits: [
                    <><strong>2× better</strong> high-concurrency report analysis</>,
                    <><strong>65% less</strong> storage space</>,
                    <><strong>Standard SQL</strong> simplifies operations and usage</>,
                ],
            },
        ],
    },
    table: {
        sub: 'Side-by-side, every dimension that matters.',
        rows: [
            {
                label: 'Open Source',
                doris: [
                    'Apache License 2.0',
                    'Apache Software Foundation, vendor-neutral',
                ],
                competitor: [
                    'License changed Apache 2.0 → Elastic License → AGPL',
                    'Operated by Elastic, a commercial company',
                ],
                dorisStrong: [true, true],
            },
            {
                label: 'System Architecture',
                doris: [
                    'Strict read/write separation across business units',
                    'Both integrated and separated storage-compute',
                    'Workload isolation across mixed query patterns',
                ],
                competitor: [
                    'Thread-group isolation, only weak compute isolation',
                    'Integrated storage-compute only',
                    'Limited workload elasticity',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Real-time Ingestion',
                doris: [
                    'Index once across replicas: high throughput, low overhead',
                    'Push and Pull (from Kafka) without external tools',
                    'Logstash and Beats compatible',
                ],
                competitor: [
                    'Index per replica, up to 3× write overhead',
                    'Push only; Pull requires external tools like Logstash',
                    'Heavier ingestion pipeline overall',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Real-time Storage',
                doris: [
                    '1:5–1:10 compression ratio: a fraction of the disk footprint',
                    'Primary key supports both Merge-on-Write and Merge-on-Read',
                    'Strongly consistent aggregations, coexist with raw data',
                    'Flexible Schema Change for evolving business needs',
                ],
                competitor: [
                    '1:1.5 compression ratio',
                    'Primary key Merge-on-Write only, up to 3× write overhead',
                    'Aggregations only eventually consistent, no raw-data coexistence',
                    'Limited Schema Change',
                ],
                dorisStrong: [true, true, true, true],
            },
            {
                label: 'Real-time Query',
                doris: [
                    'Fast across point queries, aggregation, and analytics',
                    'Multi-table joins, materialized views, UDFs, lakehouse',
                    'Standard SQL, easy to use',
                    'Open MySQL ecosystem',
                ],
                competitor: [
                    'Strong on point queries, weak on analytics',
                    'No multi-table joins, only simple workloads',
                    'Custom DSL with a steep learning curve',
                    'Proprietary Elasticsearch ecosystem',
                ],
                dorisStrong: [true, true, true, true],
            },
            {
                label: 'Total Cost of Ownership',
                doris: [
                    'Open-source storage-compute separation',
                    'Elastic compute scales without rebalancing',
                    'Up to 70% cost reduction in production migrations',
                ],
                competitor: [
                    'Tightly coupled storage and compute',
                    'Scaling requires manual rebalancing',
                    'Over-provisioning required for peak workloads',
                ],
                dorisStrong: [true, true, true],
            },
        ],
    },
};

// ─── Doris vs. Trino / Presto ────────────────────────────────────────────────

const TRINO: ComparisonContent = {
    competitorName: 'Trino / Presto',
    competitorMark: 'T',
    whyChoose: {
        sub: 'Doris and Trino/Presto are both mainstream lakehouse query engines. Doris unifies the data warehouse and the lakehouse query engine, running the same SQL dramatically faster across both.',
        valueProps: [
            {
                stat: '10',
                unit: '×',
                arrow: '↑',
                label: 'Internal Tables',
                headline: 'Fully vectorized C++ engine.',
                text: 'Doris runs internal-table queries up to 10× faster than Presto/Trino. The fully vectorized C++ engine handles the warehouse workloads that Trino has to defer to a downstream system.',
            },
            {
                stat: '2–3',
                unit: '×',
                arrow: '↑',
                label: 'Faster Lakehouse',
                headline: 'Better acceleration on external tables.',
                text: 'Doris executes lakehouse queries 2–3× faster than Presto/Trino, measured on the TPC-DS 1TB benchmark with both engines querying the same external Hive tables.',
            },
            {
                stat: '1000',
                unit: '+',
                label: 'Concurrent QPS',
                headline: 'Real-time analytics, not just interactive.',
                text: 'Built for high-concurrency real-time analytics with thousands of concurrent queries, well beyond the interactive-only workloads Trino targets.',
            },
        ],
    },
    cases: {
        sub: 'Real Trino/Presto-to-Doris migrations across networking, gaming, and logistics. Same SQL, simpler architecture, faster queries.',
        items: [
            {
                name: 'Cisco',
                mark: 'C',
                industry: 'Networking · Big Data Platform',
                rank: 'Case 01',
                color: '#049FD9',
                quote: 'By introducing Apache Doris to replace several technology stacks, we achieved a unified lakehouse, significantly improved query performance and system stability, and reduced resource costs by 30%.',
                benefits: [
                    <><strong>Unified lakehouse</strong> replacing Trino, Pinot, Iceberg, Kyuubi</>,
                    <>Significantly improved <strong>query performance</strong> and system stability</>,
                    <><strong>30% reduction</strong> in resource costs</>,
                ],
            },
            {
                name: 'NetEase Games',
                mark: 'N',
                industry: 'Gaming · Top-3 China Studio',
                rank: 'Case 02',
                color: '#E60020',
                quote: 'With Presto, multidimensional analysis queries previously took 20 to 40 seconds, while Doris reduced this to 1 to 2 seconds.',
                benefits: [
                    <>Query time cut from <strong>20–40s to 1–2s</strong></>,
                    <><strong>Automatic materialized view matching</strong> for complex analytics</>,
                    <>Substantial gain on <strong>multidimensional analysis</strong></>,
                ],
            },
            {
                name: 'ZTO Express',
                mark: 'Z',
                industry: 'Logistics · 23B+ Parcels/Yr',
                rank: 'Case 03',
                color: '#FF6B35',
                quote: 'After migrating to Apache Doris, overall query performance improved by more than 2×, and the unified architecture eliminated data silos and resource redundancy.',
                benefits: [
                    <><strong>2×+ faster</strong> overall query performance</>,
                    <>Eliminated <strong>data silos</strong> and resource redundancy</>,
                    <>Accelerated <strong>real-time analytics</strong> and ad-hoc queries</>,
                ],
            },
        ],
    },
    table: {
        sub: 'Side-by-side, every dimension that matters.',
        rows: [
            {
                label: 'System Architecture',
                doris: [
                    'Unified architecture: data warehouse and lakehouse',
                    'Built-in storage layer',
                    'Single engine for the full analytics stack',
                ],
                competitor: [
                    'Federated query engine across heterogeneous sources',
                    'No built-in storage layer',
                    'Requires a separate warehouse for serving',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Execution Engine',
                doris: [
                    'Fully vectorized engine in C++',
                    'High-performance data processing out of the box',
                    'Up to 10× faster internal-table queries',
                ],
                competitor: [
                    'Primarily Java-based execution',
                    'Vectorized engine still in development (Hummingbird project)',
                    'Slower internal-table performance',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Query Optimization',
                doris: [
                    'Cost-based optimizer (CBO) for joins, aggregation, sorting',
                    'Automatic statistics collection',
                    'Tunes complex queries without manual hints',
                ],
                competitor: [
                    'Cost-based optimization supported',
                    'Statistics collection is incomplete',
                    'Requires manual full collection to be effective',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Caching',
                doris: [
                    'Metadata cache with TTL, auto-refresh, incremental sync',
                    'Local SSD hot-data cache reduces network I/O',
                    'SQL cache and partition cache built in',
                ],
                competitor: [
                    'Relies on external caching solutions like Alluxio',
                    'No built-in metadata or query cache',
                    'Extra system to operate and tune',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Materialized Views',
                doris: [
                    'Incremental refresh with multiple data strategies',
                    'Transparent query acceleration via auto-rewriting',
                    'Optimizer matches the optimal MV automatically',
                ],
                competitor: [
                    'Manual full refresh only',
                    'No transparent query rewriting',
                    'Users must hand-pick the MV per query',
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: 'Use Cases',
                doris: [
                    'High-concurrency real-time analytics',
                    'Interactive ad-hoc analytics',
                    'Unified serving and lakehouse query engine',
                ],
                competitor: [
                    'Interactive analytics only',
                    'Strong at federated cross-source querying',
                    'Pairs with a separate warehouse for serving',
                ],
                dorisStrong: [true, true, true],
            },
        ],
    },
};

export const CONTENT: Record<string, ComparisonContent> = {
    clickhouse: CLICKHOUSE,
    elastic: ELASTIC,
    trino: TRINO,
};
