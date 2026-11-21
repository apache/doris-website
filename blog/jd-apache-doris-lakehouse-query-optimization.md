---
title: 'How JD.com Uses Apache Doris for Millions of Daily Lakehouse Queries and PB-Scale Scans'
summary: 'JD.com is consolidating Presto and StarRocks workloads on Apache Doris. Explore its optimizations for split scheduling, partition pruning, file listing, and execution across BI, data quality, and AI agent queries.'
description: 'How JD.com builds a unified Apache Doris lakehouse query engine for millions of daily queries and petabyte-scale scans, with push-based scheduling, partition pruning, and vectorized execution.'
picked: "true"
order: "2"
keywords:
  - 'Apache Doris'
  - 'JD.com'
  - 'lakehouse query optimization'
  - 'partition pruning'
  - 'split scheduling'
  - 'Nereids optimizer'
date: '2026-11-10'
author: 'JD.com · Conghui Cai'
tags:
  - 'Best Practice'
image: '/images/blogs/jd-apache-doris-lakehouse-query-optimization/cover.jpg'
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

:::tip

Adapted from Conghui Cai's presentation at Doris Summit 2026. Cai is the OLAP Engine Tech Lead at JD Retail and an Apache Doris PMC member. The [original article](https://selectdb.com/blog/jd-apache-doris-lakehouse-query-optimization) was published on November 10, 2026. The optimizations below describe JD.com's production implementation.

:::

Growing business analytics demand and new AI agent queries have made JD.com's lakehouse workloads more varied. Running several query engines in parallel added architectural complexity, made resource scheduling harder, and complicated unified governance.

JD.com is gradually moving workloads from Presto, StarRocks, and other analytical engines to Apache Doris. Using Doris's Multi-Catalog capabilities, Nereids optimizer, and vectorized execution engine, the team has optimized the path from query scheduling and partition pruning to file scanning and execution resource management.

The unified engine now handles **millions of queries and petabyte-scale data scans each day**. AI agent queries account for approximately **20% of queries**, alongside BI reports and data quality tasks.

This article explains how JD.com's architecture evolved and how the team adapted Doris to large-scale lakehouse queries and mixed workloads.

## 1. From multiple engines to a unified lakehouse

JD.com adopted Apache Doris early in its open source history to support advertising reports, while Presto remained its main lakehouse query engine. The team later introduced StarRocks and other analytical engines. During 2024 and 2025, it began consolidating OLAP workloads by migrating Presto and StarRocks workloads to Doris. In 2026, it continued building a unified architecture around Doris to reduce complexity and support a broader range of analytical needs over time.

![JD.com's lakehouse query architecture evolves from Presto in 2021 and StarRocks exploration in 2022 to migration during 2024–2025 and a unified Doris architecture in 2026](/images/blogs/jd-apache-doris-lakehouse-query-optimization/architecture-evolution.png)

Historically, lakehouse queries followed a daily pattern with two peaks. Morning traffic mainly came from business analysis and BI reports. Overnight, large numbers of data quality tasks ran complex SQL queries.

As AI agent queries grew to about 20% of the total, that pattern began changing into a **continuous, 24/7 mixed workload**. Interactive queries, batch scans, and agent requests have different latency, throughput, and isolation requirements. JD.com needed an engine that could access existing lake data efficiently while supporting complex planning and execution.

## 2. Building the unified query architecture

### Why Apache Doris

Three capabilities provided the foundation for JD.com's choice.

**Multi-Catalog access to lake data.** Doris can query Hive, Iceberg, Hudi, Paimon, and other external sources through one engine. This lets JD.com consolidate compute while keeping its existing lakehouse storage, reducing migration and architectural changes. See the [Catalog overview](https://doris.apache.org/docs/dev/lakehouse/catalog-overview/) for how Doris connects to external systems.

**Query optimization.** Lakehouse SQL performance depends on partition pruning, statistics, join planning, and scan task generation as well as scan speed. Doris's [Nereids optimizer](https://doris.apache.org/docs/dev/query-acceleration/optimization-technology-principle/query-optimizer/) provides rule-based, cost-based, and history-based optimization capabilities and a framework for JD.com's workload-specific improvements.

**Vectorized and distributed execution.** Doris's backend execution engine supports scanning, filtering, aggregation, and distributed computation across several file formats. This provides a common execution foundation for BI, data quality, and agent workloads.

### Four layers of the architecture

JD.com's unified lakehouse architecture has four main layers:

- **Business access:** BI reports, business analysis, data quality tasks, and AI agents submit concurrent interactive queries and large batch scans.
- **Unified query entry point:** SQL dialect compatibility, authentication, and access governance prepare requests for Doris. Compatibility conversion accommodates existing Presto SQL and Spark SQL within the supported scope.
- **Doris compute engine:** Frontends (FEs) handle query planning, metadata access, partition pruning, and task coordination. Backends (BEs) scan files, evaluate expressions, aggregate results, and exchange data.
- **Lakehouse storage:** JD.com retains its existing data organization and storage systems, including Hive, Hudi, ORC, and Parquet, with adapters for internal storage systems.

Together, these layers support millions of daily queries, PB-scale daily scans, and increasingly continuous mixed workloads.

## 3. Optimizing the path from planning to execution

At this scale, computation is only part of query latency. Metadata retrieval, partition pruning, file listing, scan task scheduling, and resource management can all become bottlenecks. JD.com's work addresses the preparation and execution of queries together.

### Push-based scheduling reduces scanner wait time

For large lakehouse scans, the FE continually creates and distributes scan splits. In the Doris implementation JD.com previously used, BEs pulled batches of tasks on demand. When a local batch ran out, scanner threads could block while waiting for the FE. Metadata latency fluctuations could therefore occupy scan resources without doing useful work.

The team changed the scheduling protocol between the FE Coordinator and BE Scanner to a **push model**. The FE asynchronously pushes splits, while the BE maintains a bounded queue. When no local task is ready, the scanner suspends and releases CPU resources. New tasks wake it again. Capacity and consumption feedback regulate the supply of work.

![Pull scheduling blocks a scanner while fetching another batch; push scheduling supplies splits asynchronously and uses queue capacity and consumption feedback](/images/blogs/jd-apache-doris-lakehouse-query-optimization/split-scheduling.png)

The change has three main benefits:

1. **Release scanner resources while waiting.** Suspending scanners reduces the resources occupied by metadata waits, especially during concurrent file listing or metadata latency fluctuations.
2. **Limit task accumulation.** When queues lack capacity, backpressure pauses producers and limits split buffering during scans over many files and partitions.
3. **Account for different consumption rates.** Scheduling considers BE queue and execution state, avoids full queues, and reduces imbalance and slow tails caused by different BE processing rates.

![Comparison of pull and push scheduling across waiting behavior, buffer control, assignment feedback, and task replenishment](/images/blogs/jd-apache-doris-lakehouse-query-optimization/pull-push-comparison.png)

The practical lesson is to **reduce the compute resources consumed by task preparation and waiting**, alongside improving execution speed.

### Earlier partition pruning avoids unnecessary metadata requests

Large Hive tables can contain many partitions. With a cold cache, fetching metadata for all of them can make planning expensive before execution even begins.

Using the Nereids framework, JD.com moved query predicates earlier into candidate partition retrieval. The goal is to **fetch partitions on demand and exclude irrelevant data as early as possible**. The team extended predicate inference in several ways:

- Rewrite conditions involving functions such as `date_trunc` into ranges on partition columns when the rewrite preserves semantics.
- For very long `IN` lists, use a range to prefilter candidate partitions, then retain the original predicate in the FE for exact filtering.
- Use constant folding and other simplifications early in planning to keep unnecessary partitions out of later stages.

![File-level splitting and predicate-aware partition retrieval reduce unnecessary scan splits and metadata work](/images/blogs/jd-apache-doris-lakehouse-query-optimization/partition-pruning.png)

The presentation also illustrates Hive bucket pruning, partition-extrema scans, and filtering zero-byte files before split generation. Bucket pruning applies to eligible non-ACID Hive tables when the bucket key values can be computed; it still requires file listing and retains the original row predicate. The partition-extrema optimization described here is limited to `MIN/MAX` on the same partition column without `GROUP BY`, with filters covered by partition columns, on the supported Hive ORC/Parquet or Hudi native scan paths. File footers must confirm that an endpoint partition actually contains rows.

JD.com also addressed duplicated preparation work between file listing and cost-based optimizer statistics collection. **List files once, then reuse the result** for both cost estimation and scan split generation. Within a query, accesses to the same table and partition range can share the enumeration result.

For data volume estimates, the engine first uses valid statistics for the selected partitions. If those statistics are missing, it estimates from total file size, a decompression factor, and row width. This reduces dependence on fetching per-column statistics from the metastore while preserving useful planning information.

![A pruned partition set feeds one file listing whose query-scoped file information serves both CBO cost estimation and scan split generation](/images/blogs/jd-apache-doris-lakehouse-query-optimization/shared-file-listing.png)

Coordinating partition pruning, file enumeration, and scan planning extends optimization across the entire query preparation phase. The [Hive Catalog documentation](https://doris.apache.org/docs/dev/lakehouse/catalogs/hive-catalog/) explains the corresponding external data access capabilities in Doris.

### Faster scanning and computation with vectorized execution

After planning, file reads and operator execution determine throughput. JD.com optimized BE execution for complex predicates, multiple file formats, and frequently evaluated expressions.

For expression evaluation, the team uses common subexpression elimination (CSE) to reduce repeated work. It adjusts predicate order based on evaluation cost and filtering effectiveness, uses runtime feedback to adapt selected predicate strategies, and reuses results for frequently called functions with constant arguments.

For file reads, optimizations cover ORC, Parquet, and Hive Text/LZO. They reuse reader context, read columns on demand, reduce random access, and improve decompression and parsing. Concurrent file opening and reuse of HDFS connections further reduce scan overhead.

For filtering and aggregation, eligible `COUNT(*)` and `MIN/MAX` queries use file statistics to avoid unnecessary reads. Selected function predicates are converted into column ranges that can be pushed down to finer-grained units such as row groups. **The original predicate remains for exact filtering when a range rewrite is not exact.**

Adaptive batch sizes, byte-based shuffle flow control, and improvements to aggregation state and memory management reduce buffering and memory pressure for wide rows. These changes improve execution efficiency and stability under mixed workloads.

![Eligible COUNT and MIN/MAX queries use metadata, while function-to-range rewrites support row-group pruning with residual predicates for correctness](/images/blogs/jd-apache-doris-lakehouse-query-optimization/scan-and-execution.png)

Across FE planning and BE execution, these optimizations address task waits, metadata access, scanning, and computation as parts of the same query path.

## 4. Compatibility and security governance

A unified enterprise engine must fit existing SQL, storage, and security systems. JD.com extended its Doris integration in three areas.

**SQL dialect compatibility.** The system converts both outer SQL and SQL stored in external views from a specified dialect, such as Spark SQL or Presto SQL, into Doris SQL for planning and execution. Within the supported compatibility scope, users can retain their existing SQL conventions.

**Storage compatibility.** JD.com adapted the reading path for its customized Hudi LSM-tree architecture, including incremental queries over commit-time ranges and schema evolution handling. It added support for existing Hive RCFile and SequenceFile data and integrated native ChubaoFS reads for ORC, Parquet, and the Hudi native scan paths in use.

**Security and auditability.** The query path associates business identity, request origin, and big data accounts. Unified authentication, credential management, and authorization control data access, including row-level and column-level permissions and data masking. Hive view authorization was also adapted so users can access authorized views according to the applicable rules. Linking business requests to underlying data access records improves traceability and auditing.

These storage and governance adaptations describe JD.com's environment; check the official documentation for the capabilities supported by a particular Doris release.

## 5. Next steps for AI agent workloads

JD.com's architecture is evolving from several parallel engines toward a unified lakehouse query engine built on Doris. Multi-Catalog, Nereids, and vectorized execution let the team retain its lakehouse data while consolidating query compute and tuning it for production workloads.

The team plans four further directions:

1. **Agent-oriented workload optimization:** Build session-level caching and faster metadata access for agent workflows made up of multiple small queries, keeping end-to-end latency and cost manageable.
2. **Predictive acceleration:** Use the predictability of daily traffic peaks and agent behavior for query result warm-up and execution plan reuse across queries.
3. **Elastic lakehouse compute:** Use Doris's [compute-storage decoupled architecture](https://doris.apache.org/docs/dev/compute-storage-decoupled/intro/) and scaling capabilities to handle traffic peaks, moving capacity planning toward dynamic scheduling along the workload curve.
4. **A shared semantic entry point:** Coordinate the engine with a Text-to-SQL semantic layer for schema-aware SQL generation and validation.

These directions build on the same production requirement: one analytical foundation must serve interactive reports, large data quality scans, and continuous AI agent requests efficiently.
