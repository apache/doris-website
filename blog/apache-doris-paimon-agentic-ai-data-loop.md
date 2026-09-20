---
title: 'Apache Doris x Paimon 2.0: Closing the Agentic AI Data Loop'
summary: 'See how Paimon stores changing business facts and vectors while Doris connects retrieval, analysis, and SQL write-back for agents.'
description: 'A technical look at Apache Doris and Paimon 2.0 for Agentic AI, covering vector indexes, fresh business context, SQL queries, and feedback write-back.'
keywords:
  - 'Apache Doris'
  - 'Apache Paimon 2.0'
  - 'Agentic AI'
  - 'vector search'
date: '2026-09-09'
author: 'Apache Doris · Wenqiang Li'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-paimon-agentic-ai-data-loop/cover.jpg'
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

> **Abstract**
>
> [Apache Doris 5.0 Multimodal Lakehouse Preview](/blog/apache-doris-5-multimodal-lakehouse-preview) (2) | Scenario solutions:
>
> Agentic AI is moving enterprise AI beyond one-off question answering and into a continuous "perceive-retrieve-analyze-act-feedback" cycle. Paimon 2.0 manages changing business facts, multimodal data, and indexes in one system, while Doris uses unified SQL to connect vector retrieval, real-time analytics, and result write-back. Together, they give agents current, consistent, and verifiable business context.

---

Large models determine what an agent can understand. The data platform determines what the agent knows and can trust at a given moment, along with what it retains after taking action. Agentic AI is moving enterprise AI beyond one-off question answering and into a continuous "perceive-retrieve-analyze-act-feedback" cycle.

Agents need access to more than documents and knowledge bases. They also need current orders, inventory, device status, images, videos, vectors, model outputs, and historical results. A real request requires more than semantic retrieval. It may combine vector and full-text search with structured filtering, cross-table joins, metric computation, and permission checks. This creates two requirements for the data platform. The underlying data must support continuous updates and schema evolution in an open format. The query engine must connect multimodal retrieval, real-time analytics, and result write-back in one execution pipeline.

Apache Paimon 2.0 and Apache Doris address these requirements at different layers. Paimon 2.0 manages continuously changing business facts, multimodal content, model features, and indexes. Doris provides unified SQL for reads, writes, vector retrieval, relational computation, and application serving. Together, they supply agents with current, consistent, and verifiable business context.

![Open data loop for Agentic AI: Paimon 2.0 manages evolving data and indexes, while Doris unifies retrieval, analytics, and serving](/images/blogs/apache-doris-paimon-agentic-ai-data-loop/open-ai-lakehouse-architecture.jpg)

## 1. Core challenges of Agentic AI

Traditional BI primarily answers, "What happened in the past?" Traditional RAG primarily answers, "Which documents are relevant to this question?" Agentic AI must answer additional questions: Does the current state permit an action? Do separate pieces of evidence support the same conclusion? What happened after similar actions in the past? How will this action become part of the context for the next request? Consider an industrial fault-diagnosis agent that receives a new defect image. Returning a few visually similar historical images is not enough.

The agent must also determine whether those defects came from the same equipment model and production stage. It needs to check whether sensor metrics were abnormal before or after the event, whether the equipment is currently under maintenance, whether similar problems are occurring in a cluster, and which remediation method improved the yield of subsequent batches. Requests of this kind expose four data challenges.

### 1.1 Context: continuously growing multimodal data

A business record is rarely completed in one operation. Orders, equipment records, and user states may arrive first. Images, videos, and logs appear later. Different jobs then add OCR results, captions, embeddings, model scores, and human-generated labels asynchronously. Model upgrades add new versions of features to the same data. Agents therefore need more than a static wide table. They need a data asset that can keep acquiring fields, content, features, and indexes.

### 1.2 Retrieval produces candidates; business analysis produces answers

Vector retrieval can find semantically or visually similar objects, but it cannot determine inventory, permissions, equipment status, time ranges, or business outcomes on its own. To produce context on which an agent can act, the system must combine vector or full-text retrieval with structured filtering, joins, aggregations, window computations, and business-specific ranking.

### 1.3 Agents need current and consistent context

When business facts and model features are spread across lake tables, object storage, vector databases, and search systems, each system may have different update times, versions, and deletion states. A stale index may still return a delisted product, a device under maintenance, or a withdrawn document and pass it to an agent.

### 1.4 Agent actions must feed back into the data loop

Agents produce classifications, summaries, risk scores, tool-call results, and processing states. Human review adds final labels. If those results remain in the application layer, the next analysis cannot use the latest feedback. The data platform must support reads and write-back while preserving transactional consistency. Agentic AI therefore needs more than a vector database. It needs a complete data pipeline in which multimodal data can evolve, indexes can expand their coverage, business facts remain current, retrieval results can be analyzed, and action results can be written back.

## 2. Paimon 2.0: continuously evolving the data required by agents

Paimon has traditionally used Flink to ingest database CDC and message streams continuously. It maintains real-time lake tables on object storage and supports updates, deletions, snapshots, and incremental reads. Paimon 2.0 expands that scope from "continuously updated structured rows" to "continuously growing multimodal data assets."

- `BLOB` stores large objects such as images, videos, and audio in separate files. Queries do not need to read the object contents when the column is not selected.
- `VECTOR<t, n>` provides fixed-dimension semantics and a specialized storage layout for embeddings.
- `VARIANT` stores events, model outputs, and tool-call parameters with flexible structures, while allowing frequently used fields to be extracted into typed subcolumns.
- Data Evolution allows models to add or update only changed columns without repeatedly rewriting unchanged large objects and business fields.
- Global Row ID aligns data files, BLOBs, vectors, indexes, and deletion states with the same logical record.
- Global Index incorporates scalar, full-text, and vector indexes into the lake table's metadata and snapshot system.

These capabilities do not force every type of data into the same file format. Each modality can use a suitable physical layout while remaining consistent with the same table, snapshot, and logical record. The system can identify newly written data and the current index coverage, then address freshness by backfilling indexes or selecting an appropriate query mode.

Paimon 2.0 handles how agent data is stored, updated, evolved, and indexed. It does not, by itself, perform cross-table joins, global Top-K computation, real-time metric calculation, permission checks, or high-concurrency serving. Turning this open data into context that agents can use also requires Doris's query and execution capabilities.

## 3. Doris and Paimon integration: turning open data into agent context

Doris support for Paimon 2.0 goes beyond scanning Paimon files as ordinary Parquet files. The integration connects three paths: snapshot-consistent lake-table reads, multimodal retrieval through Vector Index, and standard SQL writes to Paimon.

### 3.1 Reading the latest business facts while preserving Paimon table semantics

Doris discovers databases and tables through the Paimon Catalog and caches their metadata. Within one SQL statement, it binds a consistent snapshot and schema. The query planner understands manifests, Primary Key merging, Deletion Vector, incremental ranges, Time Travel, Branch, and Tag, so it does not treat Paimon Primary Key tables as ordinary file scans. Agents can retrieve a consistent business state from a specified snapshot and use incremental queries to detect changes in orders, inventory, equipment, and user states.

### 3.2 Vector retrieval: bringing Vector Index into the Doris query plan

Doris FE plans and distributes splits, while BE calls the Paimon Rust Reader through the C ABI. A vector query first reads the Vector Index, searches index shards in parallel, and merges the candidates. It then pushes the candidate range down to files, Row Groups, and Parquet Pages. The reader loads vectors, BLOB metadata, and other wide columns only after confirming matches. Results from Rust enter C++ through the Arrow C Data Interface and are converted into Doris Blocks.

The candidate set then enters the Doris MPP engine for scalar filtering, cross-table joins, aggregation, permission checks, reranking, and global Top-K computation. Vector retrieval is a candidate-generation stage within a distributed SQL plan, not a separate system beside Doris. Paimon Vector Index finds relevant data, while Doris determines whether that data is valid, important, and actionable in the current business context.

Community work and Kwai's production deployments have validated this path. Paimon external tables connect to Doris through the Rust Reader, with data scales ranging from millions to billions of records and Top-K values ranging from 100 to 1 million. Candidate pushdown and on-demand materialization limit the cost of reading wide vectors.

![Vector Index in the Doris query plan: Paimon retrieves and prunes candidates, while Doris performs business filtering, joins, reranking, and global Top-K](/images/blogs/apache-doris-paimon-agentic-ai-data-loop/vector-index-query-plan.jpg)

### 3.3 Real-time writes: writing to Paimon with standard SQL

An Agentic AI data pipeline cannot stop after reading data. If aggregation results, model labels, risk scores, and human-review states produced by Doris still require separate Spark or Flink jobs for write-back, the architecture again has fragmented transactional boundaries and additional operational pipelines.

For Doris 4.2, the Paimon Catalog is planned to expand from read-only access to integrated read and write support, including:

- `INSERT INTO ... SELECT` and `INSERT ... VALUES` for appending query results or application data to Paimon.
- `INSERT OVERWRITE` for overwriting non-partitioned tables or data in static or dynamic partitions.
- `UPDATE`, `DELETE`, and `MERGE` for updating business states, model labels, and human feedback in Primary Key tables.
- `CREATE TABLE` and schema evolution for adding, deleting, renaming, and changing the types of fields.
- Variant reads and writes, allowing model results and tool-call parameters with continuously changing structures to enter open lake tables directly.

Doris distributes data across BEs according to Paimon's partitioning and bucket rules, and the BEs generate files in parallel. The FE then collects Commit Messages from multiple writers and creates an atomically visible Paimon snapshot. When a failure or retry occurs, the commit coordinator handles termination, cleanup, deduplication, and idempotent recovery. This prevents partially visible data and duplicate commits. Results produced by agents can return to the same open dataset and become context for later queries and decisions.

## 4. Execution framework: how an agent request completes retrieval, analysis, and write-back

![Doris and Paimon vector-search execution flow](/images/blogs/apache-doris-paimon-agentic-ai-data-loop/agent-vector-search.jpg)

For vector retrieval in an agent request, Paimon Vector Index first narrows the candidates. Doris then performs the business analysis. After a vector query enters Doris, execution proceeds in three stages:

1. **Plan the context.** Doris FE parses the Vector SQL, binds the Paimon snapshot and schema used by the query, and generates parallel splits.
2. **Retrieve and read on demand.** BE invokes Paimon Rust through the C ABI. Vector Index produces Top-K candidates, after which the reader prunes files, Row Groups, and Pages according to the candidate range and materializes only matching columns.
3. **Generate the business answer.**

   1. Arrow data is converted into Doris Blocks and enters the MPP engine for joins, filters, aggregation, reranking, and global Top-K computation. The result is then returned to the agent through SQL, an API, or a tool call.
   2. When an agent or human confirmation produces new labels, states, or processing results, Doris starts another write path. Nereids generates a DML plan, data is routed to parallel writers on the BEs, and Commit Messages are returned to the FE for aggregation and atomic commit as a new Paimon snapshot. The new results then become available for the next round of incremental reads, index backfilling, and agent analysis.
   3. With further native integration, Doris will directly consume Paimon Global Index Results, use Global Row IDs to read matching rows, and understand index coverage, the `fast` / `full` / `detail` freshness modes, and the Deletion Vector of the current snapshot. Manifests, index shards, vector pages, and matching data pages will also be managed separately through a tiered local cache.

## 5. Production use: Kwai brings vector retrieval back to Paimon lake tables

![Kwai's large-scale vector retrieval architecture using Apache Doris and Paimon 2.0](/images/blogs/apache-doris-paimon-agentic-ai-data-loop/kwai-vector-search.jpg)

In Kwai's production environment, vectors and business data remain in Paimon, while Doris handles retrieval, row lookup, and analysis. Kwai needed to provide large-scale vector retrieval on its existing Paimon real-time lakehouse while keeping business data, vectors, permission fields, and update states consistent.

Copying vectors, filter fields, and return fields into a separate vector database would create a second copy of the business data and another synchronization pipeline that would need long-term maintenance. As model versions, business states, and deletion states change, the retrieval system could return stale results that no longer match the current business state.

Kwai chose to keep vectors and business data in Paimon Primary Key tables and connect vector retrieval to Doris external-table queries:

1. Paimon tables store business fields and 2,048-dimensional vectors inline. An IVF-RQ Vector Index retrieves candidates, while remote Alluxio provides caching for data and index reads.
2. Users continue to use Doris SQL. Doris FE plans and distributes splits, and BE invokes the Paimon Rust Reader through the C ABI.
3. Paimon Rust executes vector retrieval in parallel and merges the candidates. Candidate ranges are pushed down to files, Row Groups, and Parquet Pages, avoiding the need to scan and decode the complete vector column in advance.
4. When only business identifiers are required, queries can skip materializing wide vectors. When vectors need to be returned, candidate identifiers are used to look up the corresponding rows, reading only matching pages and records.
5. Read results are converted into Doris Blocks through the Arrow C Data Interface and continue through MPP computations such as filtering, joins, aggregation, and Top-K.

Production validation covered datasets with tens of millions and hundreds of millions of records. Public tests used 16 million and 128 million real 2,048-dimensional vectors, with Top-K values of 100, 10,000, and 1 million. Recall through the Paimon external-table path ranged from 96.0% to 99.6%. When comparing "Paimon external tables with remote Alluxio caching" against "Doris internal tables with local caching," query latency was 1.07 to 4.18 times that of the latter. At a Top-K of 1 million, the gap narrowed to 1.07 to 1.36 times.

These results show that users can keep open data in Paimon and use Doris SQL for vector retrieval and business analysis, even with hundreds of millions of high-dimensional vectors and Top-K values as large as 1 million. They do not have to copy the entire dataset into Doris internal tables or another vector database first.

For Agentic AI, retrieval results can be joined directly with the latest business state in Paimon. Doris can then apply permission filters, compute metrics, and perform relational analysis. Agents receive similar objects together with context that matches current business facts and can be verified before the system acts on it.

> Availability: The Paimon capabilities used in these examples are in the Doris 4.2 release branch and are scheduled for public release at the end of September. Use the examples as preview syntax until that release is available.

## 6. Getting started

Teams already using Flink and Paimon do not need to change their existing data pipeline as a first step. They can create a Paimon Catalog in Doris:

```SQL
CREATE CATALOG paimon_catalog PROPERTIES (
    'type' = 'paimon',
    'warehouse' = 's3://example-bucket/warehouse',
    's3.endpoint' = 'https://object-storage.example.com',
    's3.region' = 'region-id',
    's3.access_key' = 'YOUR_ACCESS_KEY',
    's3.secret_key' = 'YOUR_SECRET_KEY'
);


```

Perform structured analysis through Doris SQL:

```SQL
SELECT device_model, defect_type, COUNT(*) AS defect_count
FROM paimon_catalog.quality.inspection_records
WHERE event_time >= NOW() - INTERVAL 30 DAY
GROUP BY device_model, defect_type
ORDER BY defect_count DESC;
```

In the community-developed vector retrieval path, express Top-K queries through Doris SQL:

```SQL
SELECT id
FROM paimon_catalog.quality.vector_items
ORDER BY l2_distance_approximate(embedding, [...])
LIMIT 100;


```

After the analysis is complete, write the aggregated results directly back to Paimon:

```SQL
INSERT INTO paimon_catalog.quality.daily_defect_summary
SELECT DATE(event_time), device_model, defect_type, COUNT(*)
FROM paimon_catalog.quality.inspection_records
GROUP BY DATE(event_time), device_model, defect_type;
```

For Primary Key tables that require continuous state corrections, use `MERGE` to incorporate human reviews or new model results:

```SQL
MERGE INTO paimon_catalog.quality.inspection_records AS target
USING review_results AS source
ON target.record_id = source.record_id
WHEN MATCHED THEN
    UPDATE SET review_status = source.review_status,
               defect_type = source.defect_type
WHEN NOT MATCHED THEN
    INSERT (record_id, review_status, defect_type)
    VALUES (source.record_id, source.review_status, source.defect_type);
```

## 7. Conclusion: using business facts as they emerge

The data problem in Agentic AI is broader than adding a vector field or deploying a vector database. The system must keep changing business facts, multimodal content, model features, retrieval indexes, and action results consistent. It must then turn that data into verifiable context when an agent needs it.

Paimon 2.0 provides an open foundation for storing, updating, evolving, and indexing this data. Apache Doris connects Paimon snapshot reads, Vector Index, MPP OLAP, and standard SQL writes. This allows agents to maintain a continuous "perceive changes-retrieve evidence-analyze and decide-take action-write back feedback" loop.

Doris users do not need to maintain a separate closed copy of their data for AI workloads. The data can remain in Paimon while Doris handles retrieval and analysis. Doris can then write query results and agent feedback back to the open lake tables. Paimon allows the data used by agents to evolve continuously, while Doris turns that data into current, verifiable business context on which agents can act.

We will publish more articles about the Apache Doris 5.0 multimodal lakehouse and open formats such as Iceberg and Paimon. The series will cover the underlying technical principles, performance evaluations, and typical deployment scenarios.

---

Multimodal lakehouse capabilities for Iceberg, Paimon, Lance, and other formats have now been merged into the Doris 4.2 release branch and are scheduled for official release with version 4.2 at the end of September.
