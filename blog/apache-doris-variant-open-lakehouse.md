---
title: 'Apache Doris 5.0 Variant Across Internal and Open Lakehouse Tables'
summary: 'A look at Variant in Doris internal tables and open lake formats, with an agent-trace example and guidance for choosing where to store data.'
description: 'How Apache Doris 5.0 plans to use Variant across internal, Iceberg, and Paimon tables, with SQL examples and selection guidance.'
keywords:
  - 'Apache Doris 5.0'
  - 'Variant'
  - 'Iceberg'
  - 'Paimon'
  - 'semi-structured data'
date: '2026-09-15'
author: 'Apache Doris · Mingyu Chen'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-variant-open-lakehouse/cover.jpg'
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

> **Preview: Apache Doris 5.0 multimodal lakehouse (4) | Scenario and solution**
>
> Apache Doris introduced Variant as a column type in version 2.1 for storing semi-structured data such as JSON. Users do not need to define fields before creating a table. During ingestion, Doris automatically splits the data into typed subcolumns. This retains the flexibility of JSON ingestion while providing analytical performance close to columnar storage. Apache Doris 5.0 will extend the Variant type from internal tables to open lake formats such as Iceberg and Paimon. The same VARIANT type, SQL syntax, and execution engine will process Variant data across these formats. Using an Agent trace data pipeline as an example, this article explains the need for this capability, the business problems it addresses, and when to use Variant in internal tables or data lakes.

## 1. Agent traces: The divide between Variant producers and consumers

JSON is a natural representation for an AI Agent execution trace. Protocols such as MCP and A2A use JSON-RPC, while tool-call parameters, model output, and span attributes for each step all contain nested structures. A complete trace can range from tens of KB to several MB and may be seven or eight levels deep. Tool lists and parameters also change as models evolve. Eight fields yesterday may become twelve today, so defining a stable schema in advance is often impossible.

Analytical systems have traditionally handled this type of data in three ways:

| Approach | Advantage | Cost |
|-|-|-|
| Flatten data through ETL into a wide table | Fast queries | Every new upstream field requires changes to jobs and tables, followed by historical backfills |
| Store data as JSON strings or JSONB | Flexible ingestion | Every SQL query must parse the entire JSON document |
| Hard-code the structure with STRUCT or MAP | Better read performance | Still strongly typed and insufficiently flexible |

![Comparison of three approaches to semi-structured data](/images/blogs/apache-doris-variant-open-lakehouse/traditional-approaches.jpg)

The Variant type addresses the trade-off between flexibility and query performance. Apache Doris has provided the Variant column type since version 2.1 for storing semi-structured data such as JSON:

- When creating a table, users declare a single VARIANT column without defining its fields in advance.
- During ingestion, Doris automatically splits JSON into typed subcolumns, performs type inference and promotion, stores infrequently used fields in sparse columns, and allows indexes on subcolumns.
- Queries access values by path and read only the relevant subcolumns instead of parsing the entire JSON document.

Variant combines the ingestion flexibility of JSON with query performance close to columnar storage.

For Agent observability platforms, the recommended data model is:

- Store stable fields such as `trace_id`, `tool_name`, and latency as regular columns.
- Store inputs, outputs, and tool parameters in a VARIANT column, allowing upstream systems to add fields without altering the table.
- Use regular SQL with path-based value access for failure attribution, cost aggregation by tool, and effectiveness comparisons across model versions.
- Use inverted indexes for full-text searches over text in model outputs.

Later Apache Doris releases added Variant features such as Schema Template, secondary indexes at the subcolumn level, DOC mode for JSON documents hundreds of MB in size, and NestedGroup for searching nested arrays.

Changes in enterprise data architectures created another problem. Agent traces are produced by ingestion pipelines running on Flink or Spark. The data usually lands in Paimon first, then feeds training, evaluation, observability, and other workloads. Before version 5.0, Doris could process Variant data only in its own format. Consumers that wanted to analyze the data with Variant had to write and synchronize it to both internal tables and the lake. This duplicated storage and introduced synchronization delays and data inconsistencies.

![Figure 1: Dual-write divide between Agent trace producers and consumers](/images/blogs/apache-doris-variant-open-lakehouse/agent-trace-dual-write.jpg)

Other Variant use cases have the same problem:

- **Event tracking:** Event properties can be stored in a VARIANT column, allowing product teams to add properties without altering the table. The same event data is also a shared enterprise asset that algorithm teams need for training features. This requires another copy in Iceberg.
- **IoT telemetry:** Device properties vary by model and firmware. A wide table would be excessively sparse, while a VARIANT column allows one SQL query to aggregate data across device models. Complete datasets must also be retained for years, and object storage with an open format is the only way to reduce storage costs significantly. Real-time alerts and historical analysis must therefore access different systems, which fragments the user experience.

Variant needs to follow the data. When data resides in the lake, Variant must be available there too, and the compute engine must support unified analysis of that Variant data.

## 2. Variant standardization: Bringing semi-structured data into the "one copy, multiple engines" model

Semi-structured data in a lake traditionally had two options: storage as strings or conversion to STRUCT through ETL. As this data became more widely used, the performance and operational costs of those approaches became harder to ignore. Variant began moving toward open standardization in 2025:

- In March 2025, Apache Parquet 2.11 defined a binary encoding for Variant and introduced the Shredding specification. Writers can split frequently accessed fields into typed columns while retaining the remaining data in a binary value, giving the file itself a columnar shape. The specification was finalized in August of the same year.
- In June 2025, the Apache Iceberg V3 specification was approved, making Variant a first-class table type. Apache Paimon has supported Variant and Shredding since version 1.4.
- Spark 4.0/4.1, Flink 2.1, and DuckDB subsequently added support, while Trino began offering experimental support. Snowflake and Databricks also announced general availability of their respective support for Variant in open formats in 2026.

The open lakehouse model of "one copy of data shared by multiple engines" is extending to semi-structured data. With a standard format, any compliant engine can read and write Variant data in a lake. We therefore decided to extend the Variant processing capabilities available for internal tables to standard Variant formats.

![Figure 2: Open standards allow multiple engines to share one copy of Variant data](/images/blogs/apache-doris-variant-open-lakehouse/open-variant-standard.jpg)

An engine needs to solve three problems to use Variant effectively in a lake:

1. **High-performance reads:** The engine must be able to use the Shredded layout directly.
2. **Variant production:** An engine that can read but not write Variant cannot write its analytical results back to the open lakehouse for reuse.
3. **Interoperability between internal and external formats:** Variant should behave consistently across formats.

The following sections describe the unified Variant solution planned for Apache Doris 5.0. A later article about Variant internals will explain how Doris reads the Shredded layout.

## 3. Doris 5.0: One Variant type, one SQL syntax, one execution engine

Doris 5.0 will bring the Variant analytical capabilities of internal tables to open lake formats such as Iceberg and Paimon while keeping the user experience consistent across formats.

![Figure 3: Variant support in Doris 5.0](/images/blogs/apache-doris-variant-open-lakehouse/unified-variant-execution.jpg)

### 3.1 Three layers of unification

- **Upper layer: Unified type and SQL syntax.** Doris has one VARIANT type, with consistent SQL syntax and semantics for internal and external tables.

  - Unified path access syntax: `payload['event']['type']`
  - Unified conversion logic: use `CAST` for type conversion and `VARIANT_TYPE` to inspect the actual type
  - Unified constructor: use `PARSE_TO_VARIANT` to construct values from JSON text
  - Unified nesting: ARRAY, MAP, and STRUCT support nested VARIANT values
  - Unified NULL semantics: SQL NULL is distinguished from JSON null

- **Middle layer: Unified execution operators.** Data read from internal table files or Parquet files in the lake is converted into the execution engine's internal Variant column representation. The same operators then process the data, providing consistent behavior.

  - Variant values from internal and lake tables can appear in the same SQL statement and participate in UNION, JOIN, and other operations.
  - Internal and external tables can write to each other, for example, `INSERT INTO LakeTable SELECT ... FROM DorisTable`.
  - Variant can participate directly in GROUP BY and DISTINCT, with deduplication based on logical values rather than byte representations.

- **Lower layer: Unified format access interfaces.** Logical abstractions for Scan and Sink operators allow each format to implement only its own reader and writer. The Doris internal table format, for example, supports subcolumn splitting, inverted indexes, BloomFilters, real-time ingestion, and primary-key updates. Open lake formats support both Plain and Shredded layouts, with each format implementing its own write layout as described in Section 3.2. Format-specific differences remain at the lowest layer wherever possible, allowing most of the execution pipeline to be reused.

### 3.2 Capability matrix

The following Variant capabilities for data lakes are planned for Doris 5.0:

| Area | Capability | Iceberg | Paimon |
| --- | --- | --- | --- |
| Read | File layout | Plain, Shredded, and mixed within the same table | Plain, Shredded, and mixed within the same table |
| Read | Nested Variant (STRUCT / ARRAY / MAP) | Supported | Supported |
| Read | Path extraction, CAST, predicate filtering, and page-level pruning | Supported | Supported |
| Read | Existing lake-format capabilities | Time Travel, Deletion Vector, and schema evolution | Append tables and primary-key tables |
| Read | Asynchronous materialized views built on lake Variant tables | Supported | Supported |
| Write | INSERT INTO / INSERT OVERWRITE / INSERT ... SELECT | Supported (format-version 3 + Parquet) | Supported (Append tables, primary-key tables, and partitioned and bucketed tables) |
| Write | Row-level UPDATE / DELETE / MERGE INTO | Supported | Supported |
| Write | Nested Variant writes | Supported | Supported |
| Write | On-disk layout | Plain (see note below) | Written according to the Shredding Schema, specified explicitly or inferred automatically |
| Interoperability | Spark writes → Doris reads; Doris writes → Spark reads | Verified | Verified |
| Interoperability | Internal table ↔ lake table INSERT ... SELECT | Bidirectional | Bidirectional |
| Interoperability | Query internal and lake tables in the same SQL statement | Supported | Supported |

![Doris 5.0 lake Variant capability matrix for Iceberg and Paimon](/images/blogs/apache-doris-variant-open-lakehouse/variant-capabilities.jpg)

> Iceberg currently writes only the Plain layout. Reading the Shredded layout is fully supported. Shredded writes are planned for a later iteration, as described in the conclusion.

> Availability: The lake Variant capabilities and SQL workflow below are planned for Doris 5.0. They describe the intended behavior rather than a currently released feature.

### 3.3 Example: Unified lakehouse analysis of Agent traces

The following example uses an Agent observability platform.

First, Flink writes trace data to Paimon. Stable fields are stored as regular columns, while variable data is stored in a VARIANT column.

```sql
-- Flink writes the paimon.obs.agent_traces trace table:
-- (trace_id, tool_name, latency_ms, dt, payload VARIANT)

-- 1. Analyze failures in lake tables using path extraction, type conversion, and predicates
SELECT tool_name, COUNT(*) AS failures
FROM paimon.obs.agent_traces
WHERE CAST(payload['result']['status'] AS STRING) = 'error'
  AND CAST(payload['model']['version'] AS STRING) = 'v2'
GROUP BY tool_name;

-- 2. Load hot data into internal tables for real-time alerts and full-text search
INSERT INTO internal.obs.agent_traces_hot
SELECT * FROM paimon.obs.agent_traces WHERE dt = CURRENT_DATE();

-- 3. Write derived results and the VARIANT column back to the lake for other engines
INSERT INTO paimon.obs.failed_traces
SELECT trace_id, tool_name, payload
FROM internal.obs.agent_traces_hot
WHERE CAST(payload['result']['status'] AS STRING) = 'error';
```

In this pipeline:

- The lake table and internal table use the same VARIANT type, so they do not require separate schemas.
- Internal and lake tables use the same SQL query syntax.
- Standard SQL `INSERT ... SELECT` statements handle data synchronization and write-back.

The same pipeline also works for event tracking and IoT:

- **Event tracking:** Events are shared as Iceberg Variant data. Spark creates features, while Doris produces reports. Both use one copy of the data and one schema-evolution process.
- **IoT:** The complete dataset remains in the lake for long-term retention. Hot data enters internal tables through `INSERT ... SELECT` for real-time alerting, while hot and cold data use the same data model.

## 4. Recommendations for choosing a Variant format

The following comparison of Variant in internal and external tables can help users select a format.

![Figure 4: Choosing between internal Variant, lake Variant, and hot-cold collaboration](/images/blogs/apache-doris-variant-open-lakehouse/hot-cold-data.jpg)

| Dimension | Variant in internal tables | Variant in the lake |
|-|-|-|
| Storage and format | Doris proprietary format | Parquet Variant in Iceberg V3 or Paimon |
| Engines that can read and write | Doris | ✅ **Any standards-compliant engine** |
| Query performance | ✅ **Best performance through subcolumns and indexes** | Depends on the Shredding strategy; readers access subcolumns directly |
| Indexing and search | ✅ **Inverted indexes, BloomFilter, DOC mode, and NestedGroup** | Parquet statistics with page-level pruning |
| Schema control | ✅ **Schema Template, with Doris splitting subcolumns** | The writer's Shredding strategy |
| Ingestion latency and updates | ✅ **Real-time ingestion and primary-key updates** | Batch or micro-batch commits; Iceberg row-level updates |
| Cost | Integrated or decoupled storage and compute | ✅ **Object storage with low per-unit storage cost** |

![Comparison of Variant in internal tables and data lakes](/images/blogs/apache-doris-variant-open-lakehouse/internal-lake-variant-comparison.jpg)

Variant in internal tables provides more features and better read and write performance. Variant in the lake allows multiple engines to access the same data and offers lower storage costs.

The recommendations are:

| Scenario | Recommendation |
|-|-|
| Data is primarily produced and consumed within Doris; workloads require subsecond real-time ingestion and updates, full-text search, or high-concurrency point lookups and filtering | Variant in internal tables |
| Data is an enterprise asset shared by multiple engines; ingestion is primarily batch or micro-batch; long-term retention and storage costs matter; Spark or Flink production pipelines already exist | Variant in the lake |
| Both scenarios apply | Put hot data in internal tables and retain the complete dataset in the lake; query both with one SQL statement; accelerate lake Variant tables with asynchronous materialized views; write processing results back to the lake |

![Variant format recommendations by scenario](/images/blogs/apache-doris-variant-open-lakehouse/variant-selection.jpg)

## 5. Conclusion: Variant follows the data

Doris introduced Variant for internal tables in version 2.1 and plans to support open lake formats in version 5.0. Future work will strengthen Shredded writes for Variant and improve the performance of reading Variant from data lakes. These changes are intended to meet enterprise requirements for semi-structured data analysis and cover more use cases.

The next article, *Apache Doris Variant in the Lake: How Shredding Works and Performance Benchmarks*, will examine the implementation details of Variant and compare the performance characteristics of different formats. It will explain in more detail how Variant works and how to use it.
