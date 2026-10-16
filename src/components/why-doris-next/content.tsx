import { translate } from '@docusaurus/Translate';
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
        sub: translate({ id: "marketing.compare.006", message: "Doris and ClickHouse are both leading real-time analytical databases. Doris pulls ahead on the workloads modern data teams run every day." }),
        valueProps: [
            {
                stat: '2–10',
                unit: '×',
                arrow: '↑',
                label: translate({ id: "marketing.compare.007", message: "Faster Joins" }),
                headline: translate({ id: "marketing.compare.008", message: "Distributed multi-table joins, no wide-table workarounds." }),
                text: translate({ id: "marketing.compare.009", message: "MPP architecture with a cost-based optimizer that automatically picks Broadcast, Shuffle, or Colocate joins. Doris completes the full TPC-DS suite; ClickHouse fails about 50% of the queries." }),
            },
            {
                stat: '70',
                unit: '%',
                arrow: '↓',
                label: translate({ id: "marketing.compare.010", message: "Lower Cost" }),
                headline: translate({ id: "marketing.compare.011", message: "Storage-compute separation, open-source." }),
                text: translate({ id: "marketing.compare.012", message: "Elastic compute scales without rebalancing. The cost model ships with open-source 3.0+, with no commercial-cloud lock-in." }),
            },
            {
                stat: '1000',
                unit: '+',
                label: translate({ id: "marketing.compare.013", message: "Concurrent Queries" }),
                headline: translate({ id: "marketing.compare.014", message: "Real-time UPSERTs without sacrificing query speed." }),
                text: translate({ id: "marketing.compare.015", message: "Merge-on-Write keeps reads stable under high-frequency updates. Full ACID, MySQL-compatible, with thousands of concurrent queries instead of fewer than 100." }),
            },
        ],
    },
    cases: {
        sub: translate({ id: "marketing.compare.016", message: "Real production migrations at internet-scale companies running the same SQL workloads, with very different outcomes." }),
        items: [
            {
                name: 'Kuaishou',
                mark: 'K',
                industry: translate({ id: "marketing.compare.017", message: "Short-Form Video · 600M+ DAU" }),
                rank: translate({ id: "marketing.compare.018", message: "Case 01" }),
                color: '#FF6B35',
                quote: translate({ id: "marketing.compare.019", message: "After replacing ClickHouse with Apache Doris, Kuaishou successfully upgraded to a unified lakehouse architecture, achieving unified storage and a simplified data pipeline." }),
                benefits: [
                    <><strong>{translate({ id: "marketing.compare.020", message: "Direct lakehouse queries" })}</strong>{translate({ id: "marketing.compare.021", message: ": no ingestion, shorter pipeline" })}</>,
                    <><strong>{translate({ id: "marketing.compare.022", message: "Materialized view rewriting" })}</strong> {translate({ id: "marketing.compare.023", message: "for query acceleration across scenarios" })}</>,
                    <>{translate({ id: "marketing.compare.024", message: "Flexible" })}{" "}<strong>{translate({ id: "marketing.compare.025", message: "data governance" })}</strong> {translate({ id: "marketing.compare.026", message: "via automatic materialization" })}</>,
                ],
            },
            {
                name: 'Tencent Music',
                mark: 'T',
                industry: translate({ id: "marketing.compare.027", message: "Music Streaming · 800M MAU" }),
                rank: translate({ id: "marketing.compare.028", message: "Case 02" }),
                color: '#1DB954',
                quote: translate({ id: "marketing.compare.029", message: "After migrating the analytical engine from ClickHouse to Apache Doris, the platform effectively improved data timeliness, reduced operational costs, and resolved fragmented data management." }),
                benefits: [
                    <>{translate({ id: "marketing.compare.030", message: "Strong" })}{" "}<strong>{translate({ id: "marketing.compare.031", message: "multi-table" })}</strong> {translate({ id: "marketing.compare.032", message: "and" })}{" "}<strong>{translate({ id: "marketing.compare.033", message: "federated query" })}</strong> {translate({ id: "marketing.compare.034", message: "performance" })}</>,
                    <><strong>{translate({ id: "marketing.compare.035", message: "MySQL-protocol compatible" })}</strong>{translate({ id: "marketing.compare.036", message: ": lower operational overhead" })}</>,
                    <><strong>{translate({ id: "marketing.compare.037", message: "Partial-column updates" })}</strong> {translate({ id: "marketing.compare.038", message: "for diverse data update patterns" })}</>,
                ],
            },
            {
                name: 'Youzan',
                mark: 'Y',
                industry: translate({ id: "marketing.compare.039", message: "E-Commerce SaaS · 5M+ Merchants" }),
                rank: translate({ id: "marketing.compare.040", message: "Case 03" }),
                color: '#FF4949',
                quote: translate({ id: "marketing.compare.041", message: "Apache Doris has faster query response times than ClickHouse in the vast majority of scenarios, especially in complex join scenarios, where its performance is significantly superior." }),
                benefits: [
                    <>{translate({ id: "marketing.compare.042", message: "Core business queries" })}{" "}<strong>{translate({ id: "marketing.compare.043", message: "2–3× faster" })}</strong></>,
                    <>{translate({ id: "marketing.compare.044", message: "Complex join queries" })}{" "}<strong>{translate({ id: "marketing.compare.045", message: "2–10× faster" })}</strong></>,
                    <>{translate({ id: "marketing.compare.046", message: "Runs" })}{" "}<strong>{translate({ id: "marketing.compare.047", message: "all ClickHouse OOM" })}</strong> {translate({ id: "marketing.compare.048", message: "queries successfully" })}</>,
                ],
            },
        ],
    },
    table: {
        sub: translate({ id: "marketing.compare.049", message: "Side-by-side, every dimension that matters." }),
        rows: [
            {
                label: translate({ id: "marketing.compare.050", message: "System Architecture" }),
                doris: [
                    translate({ id: "marketing.compare.051", message: "MPP distributed architecture" }),
                    translate({ id: "marketing.compare.052", message: "MySQL-protocol compatible, standard SQL" }),
                    translate({ id: "marketing.compare.053", message: "CBO automatic optimization" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.054", message: "Scatter-Gather architecture" }),
                    translate({ id: "marketing.compare.055", message: "SQL-like syntax, non-standard" }),
                    translate({ id: "marketing.compare.056", message: "Requires manual tuning" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.057", message: "Join Query Performance" }),
                doris: [
                    translate({ id: "marketing.compare.058", message: "2–10× faster, cross-node distributed" }),
                    translate({ id: "marketing.compare.059", message: "CBO chooses Join strategy" }),
                    translate({ id: "marketing.compare.060", message: "Full TPC-DS suite passes" }),
                    translate({ id: "marketing.compare.061", message: "Efficient memory, avoids OOM" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.062", message: "Subqueries + wide-table modeling" }),
                    translate({ id: "marketing.compare.063", message: "No CBO, manual tuning" }),
                    translate({ id: "marketing.compare.064", message: "~50% TPC-DS queries fail" }),
                    translate({ id: "marketing.compare.065", message: "Frequent OOM on large queries" }),
                ],
                dorisStrong: [true, true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.066", message: "Real-time Updates" }),
                doris: [
                    translate({ id: "marketing.compare.067", message: "Merge-on-Write engine" }),
                    translate({ id: "marketing.compare.068", message: "Strong consistency, immediate visibility" }),
                    translate({ id: "marketing.compare.069", message: "High-throughput UPSERT, no degradation" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.070", message: "ReplacingMergeTree, eventual consistency" }),
                    translate({ id: "marketing.compare.071", message: "FINAL causes 2–10× slowdown" }),
                    translate({ id: "marketing.compare.072", message: "High-frequency updates → merge overhead" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.073", message: "Transaction Support" }),
                doris: [translate({ id: "marketing.compare.074", message: "Full ACID transactions" }), translate({ id: "marketing.compare.075", message: "Atomic batch ingestion" })],
                competitor: [translate({ id: "marketing.compare.076", message: "No transaction support" }), translate({ id: "marketing.compare.077", message: "Partial data may become visible" })],
                dorisStrong: [true, true],
            },
            {
                label: translate({ id: "marketing.compare.078", message: "Query Concurrency" }),
                doris: [
                    translate({ id: "marketing.compare.079", message: "Thousands of concurrent queries, 10×+" }),
                    translate({ id: "marketing.compare.080", message: "Efficient memory management" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.081", message: "Usually below 100 concurrent" }),
                    translate({ id: "marketing.compare.082", message: "Memory-intensive workloads destabilize cluster" }),
                ],
                dorisStrong: [true, true],
            },
            {
                label: translate({ id: "marketing.compare.083", message: "Data API & Lakehouse" }),
                doris: [
                    translate({ id: "marketing.compare.084", message: "Arrow-Flight high-throughput protocol" }),
                    translate({ id: "marketing.compare.085", message: "Hive / Hudi / Iceberg / Parquet" }),
                    translate({ id: "marketing.compare.086", message: "Auto-scaling + multi-replica balancing" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.087", message: "JDBC only" }),
                    translate({ id: "marketing.compare.088", message: "Limited lakehouse integration" }),
                    translate({ id: "marketing.compare.089", message: "Scaling requires manual rebalancing" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.090", message: "Storage-Compute Separation" }),
                doris: [
                    translate({ id: "marketing.compare.091", message: "Open-source 3.0+" }),
                    translate({ id: "marketing.compare.092", message: "Elastic compute, no rebalance on scale" }),
                    translate({ id: "marketing.compare.093", message: "Up to 70% cost reduction" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.094", message: "Commercial Cloud edition only" }),
                    translate({ id: "marketing.compare.095", message: "Tightly coupled, scaling requires rebalance" }),
                    translate({ id: "marketing.compare.096", message: "Over-provisioning required for peaks" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.097", message: "Open-Source License" }),
                doris: [translate({ id: "marketing.compare.098", message: "Apache Foundation, community-maintained" })],
                competitor: [translate({ id: "marketing.compare.099", message: "Controlled by a commercial company" })],
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
        sub: translate({ id: "marketing.compare.100", message: "Doris and Elasticsearch both serve observability, security, and real-time analytics. Doris pulls ahead on storage cost, write efficiency, and analytical depth, all without a custom DSL." }),
        valueProps: [
            {
                stat: '5–10',
                unit: '×',
                arrow: '↑',
                label: translate({ id: "marketing.compare.101", message: "Compression Ratio" }),
                headline: translate({ id: "marketing.compare.102", message: "Far smaller storage footprint." }),
                text: translate({ id: "marketing.compare.103", message: "Doris compresses logs and metrics at 1:5 to 1:10, versus Elasticsearch's 1:1.5. The same data fits on a fraction of the disk." }),
            },
            {
                stat: '<10',
                unit: '%',
                arrow: '↓',
                label: translate({ id: "marketing.compare.104", message: "Write Overhead" }),
                headline: translate({ id: "marketing.compare.105", message: "High write throughput, low overhead." }),
                text: translate({ id: "marketing.compare.106", message: "Doris indexes once across multiple replicas, keeping overhead under 10%. Elasticsearch indexes each replica separately and pays up to 3× per write under deduplication." }),
            },
            {
                stat: '2–3',
                unit: '×',
                arrow: '↑',
                label: translate({ id: "marketing.compare.107", message: "Faster Search" }),
                headline: translate({ id: "marketing.compare.108", message: "Full-text search and SQL, no DSL." }),
                text: translate({ id: "marketing.compare.109", message: "Production migrations report 2–3× faster full-text search, with multi-table joins, materialized views, and the open MySQL ecosystem on top." }),
            },
        ],
    },
    cases: {
        sub: translate({ id: "marketing.compare.110", message: "Real Elasticsearch-to-Doris migrations across observability, financial security, and logistics. Same workload, dramatically smaller bill." }),
        items: [
            {
                name: 'True Watch',
                mark: 'T',
                industry: translate({ id: "marketing.compare.111", message: "Observability · GuanceDB" }),
                rank: translate({ id: "marketing.compare.018", message: "Case 01" }),
                color: '#FF6B35',
                quote: translate({ id: "marketing.compare.112", message: "By replacing Elasticsearch with Apache Doris, GuanceDB took a big stride in improving data processing speed and reducing costs." }),
                benefits: [
                    <><strong>{translate({ id: "marketing.compare.113", message: "70% cost reduction" })}</strong> {translate({ id: "marketing.compare.114", message: "after replacing Elasticsearch" })}</>,
                    <><strong>{translate({ id: "marketing.compare.043", message: "2–3× faster" })}</strong> {translate({ id: "marketing.compare.115", message: "full-text search performance" })}</>,
                    <><strong>{translate({ id: "marketing.compare.116", message: "Variant data type" })}</strong> {translate({ id: "marketing.compare.117", message: "for semi-structured log tracing" })}</>,
                ],
            },
            {
                name: 'Bestpay',
                mark: 'B',
                industry: translate({ id: "marketing.compare.118", message: "FinTech · Security Analytics" }),
                rank: translate({ id: "marketing.compare.028", message: "Case 02" }),
                color: '#1E5DFF',
                quote: translate({ id: "marketing.compare.119", message: "After unifying the architecture with Apache Doris, write throughput, complex query response, and storage efficiency all improved significantly." }),
                benefits: [
                    <><strong>{translate({ id: "marketing.compare.120", message: "4× faster" })}</strong> {translate({ id: "marketing.compare.121", message: "write speed" })}</>,
                    <><strong>{translate({ id: "marketing.compare.122", message: "3× faster" })}</strong> {translate({ id: "marketing.compare.123", message: "query performance" })}</>,
                    <><strong>{translate({ id: "marketing.compare.124", message: "50% less storage" })}</strong> {translate({ id: "marketing.compare.125", message: "for the same data" })}</>,
                ],
            },
            {
                name: 'ZTO Express',
                mark: 'Z',
                industry: translate({ id: "marketing.compare.126", message: "Logistics · 23B+ Parcels/Yr" }),
                rank: translate({ id: "marketing.compare.040", message: "Case 03" }),
                color: '#E63946',
                quote: translate({ id: "marketing.compare.127", message: "After introducing Doris, query performance improved 5–10× and concurrent processing capability doubled — 90% of analytics fell from 10 min to under 1 min." }),
                benefits: [
                    <><strong>{translate({ id: "marketing.compare.128", message: "2× better" })}</strong> {translate({ id: "marketing.compare.129", message: "high-concurrency report analysis" })}</>,
                    <><strong>{translate({ id: "marketing.compare.130", message: "65% less" })}</strong> {translate({ id: "marketing.compare.131", message: "storage space" })}</>,
                    <><strong>{translate({ id: "marketing.compare.132", message: "Standard SQL" })}</strong> {translate({ id: "marketing.compare.133", message: "simplifies operations and usage" })}</>,
                ],
            },
        ],
    },
    table: {
        sub: translate({ id: "marketing.compare.049", message: "Side-by-side, every dimension that matters." }),
        rows: [
            {
                label: translate({ id: "marketing.compare.134", message: "Open Source" }),
                doris: [
                    translate({ id: "marketing.compare.135", message: "Apache License 2.0" }),
                    translate({ id: "marketing.compare.136", message: "Apache Software Foundation, vendor-neutral" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.137", message: "License changed Apache 2.0 → Elastic License → AGPL" }),
                    translate({ id: "marketing.compare.138", message: "Operated by Elastic, a commercial company" }),
                ],
                dorisStrong: [true, true],
            },
            {
                label: translate({ id: "marketing.compare.050", message: "System Architecture" }),
                doris: [
                    translate({ id: "marketing.compare.139", message: "Strict read/write separation across business units" }),
                    translate({ id: "marketing.compare.140", message: "Both integrated and separated storage-compute" }),
                    translate({ id: "marketing.compare.141", message: "Workload isolation across mixed query patterns" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.142", message: "Thread-group isolation, only weak compute isolation" }),
                    translate({ id: "marketing.compare.143", message: "Integrated storage-compute only" }),
                    translate({ id: "marketing.compare.144", message: "Limited workload elasticity" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.145", message: "Real-time Ingestion" }),
                doris: [
                    translate({ id: "marketing.compare.146", message: "Index once across replicas: high throughput, low overhead" }),
                    translate({ id: "marketing.compare.147", message: "Push and Pull (from Kafka) without external tools" }),
                    translate({ id: "marketing.compare.148", message: "Logstash and Beats compatible" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.149", message: "Index per replica, up to 3× write overhead" }),
                    translate({ id: "marketing.compare.150", message: "Push only; Pull requires external tools like Logstash" }),
                    translate({ id: "marketing.compare.151", message: "Heavier ingestion pipeline overall" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.152", message: "Real-time Storage" }),
                doris: [
                    translate({ id: "marketing.compare.153", message: "1:5–1:10 compression ratio: a fraction of the disk footprint" }),
                    translate({ id: "marketing.compare.154", message: "Primary key supports both Merge-on-Write and Merge-on-Read" }),
                    translate({ id: "marketing.compare.155", message: "Strongly consistent aggregations, coexist with raw data" }),
                    translate({ id: "marketing.compare.156", message: "Flexible Schema Change for evolving business needs" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.157", message: "1:1.5 compression ratio" }),
                    translate({ id: "marketing.compare.158", message: "Primary key Merge-on-Write only, up to 3× write overhead" }),
                    translate({ id: "marketing.compare.159", message: "Aggregations only eventually consistent, no raw-data coexistence" }),
                    translate({ id: "marketing.compare.160", message: "Limited Schema Change" }),
                ],
                dorisStrong: [true, true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.161", message: "Real-time Query" }),
                doris: [
                    translate({ id: "marketing.compare.162", message: "Fast across point queries, aggregation, and analytics" }),
                    translate({ id: "marketing.compare.163", message: "Multi-table joins, materialized views, UDFs, lakehouse" }),
                    translate({ id: "marketing.compare.164", message: "Standard SQL, easy to use" }),
                    translate({ id: "marketing.compare.165", message: "Open MySQL ecosystem" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.166", message: "Strong on point queries, weak on analytics" }),
                    translate({ id: "marketing.compare.167", message: "No multi-table joins, only simple workloads" }),
                    translate({ id: "marketing.compare.168", message: "Custom DSL with a steep learning curve" }),
                    translate({ id: "marketing.compare.169", message: "Proprietary Elasticsearch ecosystem" }),
                ],
                dorisStrong: [true, true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.170", message: "Total Cost of Ownership" }),
                doris: [
                    translate({ id: "marketing.compare.171", message: "Open-source storage-compute separation" }),
                    translate({ id: "marketing.compare.172", message: "Elastic compute scales without rebalancing" }),
                    translate({ id: "marketing.compare.173", message: "Up to 70% cost reduction in production migrations" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.174", message: "Tightly coupled storage and compute" }),
                    translate({ id: "marketing.compare.089", message: "Scaling requires manual rebalancing" }),
                    translate({ id: "marketing.compare.175", message: "Over-provisioning required for peak workloads" }),
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
        sub: translate({ id: "marketing.compare.176", message: "Doris and Trino/Presto are both mainstream lakehouse query engines. Doris unifies the data warehouse and the lakehouse query engine, running the same SQL dramatically faster across both." }),
        valueProps: [
            {
                stat: '10',
                unit: '×',
                arrow: '↑',
                label: translate({ id: "marketing.compare.177", message: "Internal Tables" }),
                headline: translate({ id: "marketing.compare.178", message: "Fully vectorized C++ engine." }),
                text: translate({ id: "marketing.compare.179", message: "Doris runs internal-table queries up to 10× faster than Presto/Trino. The fully vectorized C++ engine handles the warehouse workloads that Trino has to defer to a downstream system." }),
            },
            {
                stat: '2–3',
                unit: '×',
                arrow: '↑',
                label: translate({ id: "marketing.compare.180", message: "Faster Lakehouse" }),
                headline: translate({ id: "marketing.compare.181", message: "Better acceleration on external tables." }),
                text: translate({ id: "marketing.compare.182", message: "Doris executes lakehouse queries 2–3× faster than Presto/Trino, measured on the TPC-DS 1TB benchmark with both engines querying the same external Hive tables." }),
            },
            {
                stat: '1000',
                unit: '+',
                label: translate({ id: "marketing.compare.183", message: "Concurrent QPS" }),
                headline: translate({ id: "marketing.compare.184", message: "Real-time analytics, not just interactive." }),
                text: translate({ id: "marketing.compare.185", message: "Built for high-concurrency real-time analytics with thousands of concurrent queries, well beyond the interactive-only workloads Trino targets." }),
            },
        ],
    },
    cases: {
        sub: translate({ id: "marketing.compare.186", message: "Real Trino/Presto-to-Doris migrations across networking, gaming, and logistics. Same SQL, simpler architecture, faster queries." }),
        items: [
            {
                name: 'Cisco',
                mark: 'C',
                industry: translate({ id: "marketing.compare.187", message: "Networking · Big Data Platform" }),
                rank: translate({ id: "marketing.compare.018", message: "Case 01" }),
                color: '#049FD9',
                quote: translate({ id: "marketing.compare.188", message: "By introducing Apache Doris to replace several technology stacks, we achieved a unified lakehouse, significantly improved query performance and system stability, and reduced resource costs by 30%." }),
                benefits: [
                    <><strong>{translate({ id: "marketing.compare.189", message: "Unified lakehouse" })}</strong> {translate({ id: "marketing.compare.190", message: "replacing Trino, Pinot, Iceberg, Kyuubi" })}</>,
                    <>{translate({ id: "marketing.compare.191", message: "Significantly improved" })}{" "}<strong>{translate({ id: "marketing.compare.123", message: "query performance" })}</strong> {translate({ id: "marketing.compare.192", message: "and system stability" })}</>,
                    <><strong>{translate({ id: "marketing.compare.193", message: "30% reduction" })}</strong> {translate({ id: "marketing.compare.194", message: "in resource costs" })}</>,
                ],
            },
            {
                name: 'NetEase Games',
                mark: 'N',
                industry: translate({ id: "marketing.compare.195", message: "Gaming · Top-3 China Studio" }),
                rank: translate({ id: "marketing.compare.028", message: "Case 02" }),
                color: '#E60020',
                quote: translate({ id: "marketing.compare.196", message: "With Presto, multidimensional analysis queries previously took 20 to 40 seconds, while Doris reduced this to 1 to 2 seconds." }),
                benefits: [
                    <>{translate({ id: "marketing.compare.197", message: "Query time cut from" })}{" "}<strong>{translate({ id: "marketing.compare.198", message: "20–40s to 1–2s" })}</strong></>,
                    <><strong>{translate({ id: "marketing.compare.199", message: "Automatic materialized view matching" })}</strong> {translate({ id: "marketing.compare.200", message: "for complex analytics" })}</>,
                    <>{translate({ id: "marketing.compare.201", message: "Substantial gain on" })}{" "}<strong>{translate({ id: "marketing.compare.202", message: "multidimensional analysis" })}</strong></>,
                ],
            },
            {
                name: 'ZTO Express',
                mark: 'Z',
                industry: translate({ id: "marketing.compare.126", message: "Logistics · 23B+ Parcels/Yr" }),
                rank: translate({ id: "marketing.compare.040", message: "Case 03" }),
                color: '#FF6B35',
                quote: translate({ id: "marketing.compare.203", message: "After migrating to Apache Doris, overall query performance improved by more than 2×, and the unified architecture eliminated data silos and resource redundancy." }),
                benefits: [
                    <><strong>{translate({ id: "marketing.compare.204", message: "2×+ faster" })}</strong> {translate({ id: "marketing.compare.205", message: "overall query performance" })}</>,
                    <>{translate({ id: "marketing.compare.206", message: "Eliminated" })}{" "}<strong>{translate({ id: "marketing.compare.207", message: "data silos" })}</strong> {translate({ id: "marketing.compare.208", message: "and resource redundancy" })}</>,
                    <>{translate({ id: "marketing.compare.209", message: "Accelerated" })}{" "}<strong>{translate({ id: "marketing.compare.210", message: "real-time analytics" })}</strong> {translate({ id: "marketing.compare.211", message: "and ad-hoc queries" })}</>,
                ],
            },
        ],
    },
    table: {
        sub: translate({ id: "marketing.compare.049", message: "Side-by-side, every dimension that matters." }),
        rows: [
            {
                label: translate({ id: "marketing.compare.050", message: "System Architecture" }),
                doris: [
                    translate({ id: "marketing.compare.212", message: "Unified architecture: data warehouse and lakehouse" }),
                    translate({ id: "marketing.compare.213", message: "Built-in storage layer" }),
                    translate({ id: "marketing.compare.214", message: "Single engine for the full analytics stack" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.215", message: "Federated query engine across heterogeneous sources" }),
                    translate({ id: "marketing.compare.216", message: "No built-in storage layer" }),
                    translate({ id: "marketing.compare.217", message: "Requires a separate warehouse for serving" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.218", message: "Execution Engine" }),
                doris: [
                    translate({ id: "marketing.compare.219", message: "Fully vectorized engine in C++" }),
                    translate({ id: "marketing.compare.220", message: "High-performance data processing out of the box" }),
                    translate({ id: "marketing.compare.221", message: "Up to 10× faster internal-table queries" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.222", message: "Primarily Java-based execution" }),
                    translate({ id: "marketing.compare.223", message: "Vectorized engine still in development (Hummingbird project)" }),
                    translate({ id: "marketing.compare.224", message: "Slower internal-table performance" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.225", message: "Query Optimization" }),
                doris: [
                    translate({ id: "marketing.compare.226", message: "Cost-based optimizer (CBO) for joins, aggregation, sorting" }),
                    translate({ id: "marketing.compare.227", message: "Automatic statistics collection" }),
                    translate({ id: "marketing.compare.228", message: "Tunes complex queries without manual hints" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.229", message: "Cost-based optimization supported" }),
                    translate({ id: "marketing.compare.230", message: "Statistics collection is incomplete" }),
                    translate({ id: "marketing.compare.231", message: "Requires manual full collection to be effective" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.232", message: "Caching" }),
                doris: [
                    translate({ id: "marketing.compare.233", message: "Metadata cache with TTL, auto-refresh, incremental sync" }),
                    translate({ id: "marketing.compare.234", message: "Local SSD hot-data cache reduces network I/O" }),
                    translate({ id: "marketing.compare.235", message: "SQL cache and partition cache built in" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.236", message: "Relies on external caching solutions like Alluxio" }),
                    translate({ id: "marketing.compare.237", message: "No built-in metadata or query cache" }),
                    translate({ id: "marketing.compare.238", message: "Extra system to operate and tune" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.239", message: "Materialized Views" }),
                doris: [
                    translate({ id: "marketing.compare.240", message: "Incremental refresh with multiple data strategies" }),
                    translate({ id: "marketing.compare.241", message: "Transparent query acceleration via auto-rewriting" }),
                    translate({ id: "marketing.compare.242", message: "Optimizer matches the optimal MV automatically" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.243", message: "Manual full refresh only" }),
                    translate({ id: "marketing.compare.244", message: "No transparent query rewriting" }),
                    translate({ id: "marketing.compare.245", message: "Users must hand-pick the MV per query" }),
                ],
                dorisStrong: [true, true, true],
            },
            {
                label: translate({ id: "marketing.compare.246", message: "Use Cases" }),
                doris: [
                    translate({ id: "marketing.compare.247", message: "High-concurrency real-time analytics" }),
                    translate({ id: "marketing.compare.248", message: "Interactive ad-hoc analytics" }),
                    translate({ id: "marketing.compare.249", message: "Unified serving and lakehouse query engine" }),
                ],
                competitor: [
                    translate({ id: "marketing.compare.250", message: "Interactive analytics only" }),
                    translate({ id: "marketing.compare.251", message: "Strong at federated cross-source querying" }),
                    translate({ id: "marketing.compare.252", message: "Pairs with a separate warehouse for serving" }),
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
