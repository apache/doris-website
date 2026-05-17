---
{
    "title": "Load Best Practices and Performance Tuning",
    "language": "en",
    "description": "Apache Doris data load best practices and internals: starting from user scenarios, this guide covers table design, batching, bucketing, memory and concurrency tuning, and explains the load workflow, MemTable forwarding, and the compute-storage decoupled architecture.",
    "keywords": [
        "Doris load best practices",
        "Doris load performance tuning",
        "Doris load internals",
        "Stream Load",
        "Broker Load",
        "Routine Load",
        "Group Commit",
        "MemTable forwarding",
        "Compute-storage decoupled load",
        "Random bucketing",
        "Tablet size",
        "Write amplification",
        "Memtable OOM",
        "Load throughput and latency"
    ]
}
---

<!-- Knowledge type: Operational guidance + Configuration parameters + Architectural internals + Performance tuning -->
<!-- Applicable scenarios: Load method selection / Performance optimization / Failure prevention / Troubleshooting -->

Data load is one of the most important capabilities of Apache Doris. Load efficiency directly determines the timeliness of real-time analytics and the stability of the system. Starting from typical business scenarios, this article first provides best practices that you can apply directly, and then dives into the load internals and tuning approach to help you:

- Choose an appropriate load method based on your business characteristics
- Make reasonable decisions in table design, batching, bucketing, memory, and concurrency
- Avoid common issues such as high-frequency small loads, write amplification, and Memtable OOM
- Find a balance between latency and throughput that matches your business

## Quick Navigation

| Concern | Recommended Practice | Section |
| --- | --- | --- |
| Choose a load method | Select by data source and real-time requirements | [Choose an Appropriate Load Method](#choose-an-appropriate-load-method) |
| Table model | Prefer the Duplicate Key model | [Table Model and Indexes](#table-model-and-indexes) |
| Partitioning and bucketing | Keep a single Tablet between 1 and 10 GB | [Partitioning and Bucketing Configuration](#partitioning-and-bucketing-configuration) |
| Random bucketing | Enable `load_to_single_tablet` to improve throughput | [Random Bucketing Load Optimization](#random-bucketing-load-optimization) |
| High-frequency small loads | Client-side batching plus Group Commit | [Batching Strategy](#batching-strategy) |
| Number of partitions per load | Restrict to a small number to avoid too many Memtables | [Partition Load and Memory Control](#partition-load-and-memory-control) |
| Large data load | Split into batches, with each batch no larger than 100 GB | [Large-Scale Data Batched Load](#large-scale-data-batched-load) |
| Broker Load concurrency | Split compressed or columnar files for concurrency | [Broker Load Concurrency](#broker-load-concurrency) |
| Stream Load concurrency | Keep concurrency per BE under 128 | [Stream Load Concurrency](#stream-load-concurrency) |

## Choose an Appropriate Load Method

Doris provides several load methods that share the same core workflow but are optimized for different scenarios. Choose one based on your data source and business requirements:

| Load Method | Protocol | Execution Mode | Typical Data Sources | Applicable Scenarios |
| --- | --- | --- | --- | --- |
| **Stream Load** | HTTP | Synchronous | Local files, data streams | Real-time writes (such as data pushed by applications) |
| **Broker Load** | SQL | Asynchronous | HDFS, S3, and other external storage | Large-scale batch load |
| **Routine Load** | SQL | Asynchronous streaming | Kafka | Real-time synchronization of message queue data, with Exactly-Once support |
| **Insert Into / Select** | SQL | Synchronous/Asynchronous | Doris tables, Hive, MySQL, S3 TVF | ETL jobs, external data integration |
| **MySQL Load** | MySQL `LOAD DATA` | Synchronous | Local CSV files | Small-scale tests or migration for MySQL users (FE forwards as Stream Load) |

## Load Best Practices

The following sections address several common concerns in data load and provide best practices that you can apply directly.

### Table Model and Indexes

#### Table Model Selection

Prefer the **Duplicate Key model**:

- It only stores raw data, with no aggregation or deduplication, giving the shortest load path.
- It outperforms other models in both load and query performance.
- The Aggregate model needs to aggregate by Key columns and the Unique Key model needs to deduplicate. Both add extra computation (sorting, deduplication) on the BE side during the MemTable stage and increase CPU and memory consumption.

Choose the Aggregate or Unique Key model only when you actually need aggregation or deduplication by Key. For more information, see [Data Model](../../../table-design/data-model/intro).

#### Index Control

Indexes (such as bitmap indexes and inverted indexes) need to be updated synchronously during load and increase write maintenance cost. Recommendations:

- Create indexes only for frequently queried fields.
- Avoid redundant indexes to reduce index building and validation on BE during writes, lowering CPU and memory usage and improving load throughput.

### Partitioning and Bucketing Configuration

Partitioning and bucketing determine how data is distributed across BE nodes and the degree of parallelism, directly affecting load and query performance.

#### Single Tablet Size: 1-10 GB

Keep the size of a single Tablet within the range of **1 to 10 GB**:

| Tablet Size | Impact |
| --- | --- |
| Too small | Poor aggregation effect, increased pressure on metadata management |
| Too large | Difficult for replica migration and replenishment |
| **1-10 GB (recommended)** | Balances load, query, and replica management |

Bucket count formula: `bucket count = total data size / (1-10 GB)`. Combine this with an appropriate bucket key (such as a random column) to avoid data skew, balance the load across BE nodes, and improve parallel write efficiency.

For details, see [Data Distribution](../../../table-design/data-partitioning/basic-concepts).

#### Partition Design: Reduce Distribution and Memory Pressure

Partition by the business query pattern (such as time or region) so that during load, data is distributed only to the target partitions, avoiding processing metadata and files of unrelated partitions. In addition:

- Writing to multiple partitions at the same time activates a large number of Tablets. Each Tablet occupies its own MemTable, significantly increasing memory pressure on BE.
- When memory is tight, an early Flush is triggered, generating many small Segment files and causing frequent Compaction and write amplification.

By limiting the number of active partitions (such as loading day by day), you can reduce the number of simultaneously active Tablets, ease memory pressure, generate larger Segment files, and reduce the Compaction load, thereby improving parallel write efficiency and subsequent query performance.

### Random Bucketing Load Optimization

When using Random bucketing, you can enable single-tablet load mode by setting `load_to_single_tablet=true`:

- Data is written directly to a single Tablet, bypassing the distribution to multiple Tablets and eliminating the CPU overhead of Tablet distribution computation as well as the RPC transmission overhead between BEs.
- Concentrating writes on a single Tablet reduces the generation of small Segment files and avoids the write amplification caused by frequent Compaction.
- It significantly improves the concurrency and throughput of large-scale data load.

For details, see [Random Bucketing](../../../table-design/data-partitioning/data-bucketing#random-bucketing).

### Batching Strategy

Each load is an independent transaction that involves writing to FE Edit Log (recording metadata changes) and flushing the BE MemTable to disk (generating Segment files). **High-frequency small-batch loads (KB-level)** cause:

- Frequent FE Edit Log writes, increasing FE disk I/O.
- Frequent BE MemTable flushes, generating many small Segment files.
- Frequent Compaction, leading to severe write amplification.

You can mitigate this by combining client-side and server-side batching:

| Batching Method | Applicable Scenarios | Recommended Practice |
| --- | --- | --- |
| **Client-side batching** | Batch writes that the client controls | Accumulate data on the client to **hundreds of MB to several GB** before initiating a load. Replacing many small transactions with a single large one reduces the frequency of FE Edit Log writes and BE MemTable flushes, avoiding storage fragmentation and the resource consumption of subsequent Compaction. |
| **Server-side batching (Group Commit)** | High-concurrency, small-data-volume loads | Enable [Group Commit](group-commit-manual.md) so that the server merges multiple small batches within a short window into a single transaction. The merged large transaction generates larger Segment files and reduces background Compaction pressure. This is especially suitable for high-frequency small-batch scenarios such as logs and IoT data. |

### Partition Load and Memory Control

During load, BE first writes data to the in-memory MemTable (200 MB by default). When the MemTable fills up, it is asynchronously flushed to disk to generate Segment files. Each Tablet has one active MemTable in memory, so the number of partitions covered by a single load directly affects memory usage:

1. Too many partitions leads to many active Tablets, which leads to many active MemTables, which increases memory usage.
2. When memory usage is too high, an early flush is triggered to avoid process OOM.
3. Early flushes generate many small files, which further degrades load performance.

To achieve stable load throughput:

- **Load partitions in order**: for example, load day by day so that data writes concentrate on a single partition, reducing MemTable scattering and the number of flushes, and lowering memory fragmentation and I/O pressure.
- **Strictly control the number of partitions covered by a single load** to avoid early flushes triggered by too many MemTables.

### Large-Scale Data Batched Load

When there are many files and the data volume is very large, **load in batches** to reduce the cost of retries and avoid concentrated impact on BE memory and disk:

| Data Source | Recommended Load Method | Recommended Batch Size |
| --- | --- | --- |
| Remote files such as HDFS or object storage | Broker Load | Each batch **no larger than 100 GB** |
| Large local files | Doris `streamloader` tool (auto-batching) | Controlled automatically by the tool |

### Broker Load Concurrency

Concurrency strategies vary by file type:

- **Compressed files / Parquet / ORC files**: split into multiple smaller files before loading to enable concurrent loads.
- **Uncompressed CSV and JSON files**: Doris automatically splits the files internally and loads them concurrently.

For the concurrency strategy, see [Broker Load Configuration Parameters](../import-way/broker-load-manual#load-configuration-parameters).

### Stream Load Concurrency

Stream Load concurrency is bounded by the BE thread pool parameters. Follow these thresholds:

| Parameter / Threshold | Recommended Value | Description |
| --- | --- | --- |
| Concurrency per BE (recommended upper bound) | **No more than 128** | Controlled by BE's `webserver_num_workers`. Exceeding this may exhaust webserver threads and degrade load performance. |
| Concurrency per BE (hard limit) | **Must not exceed 512** | Controlled by `doris_max_remote_scanner_thread_pool_thread_num`. Exceeding this may cause the BE process to hang. |

### Concurrency Trade-Offs for Low-Latency Scenarios

For low-latency scenarios such as real-time monitoring:

- **Reduce concurrency** appropriately to avoid resource contention.
- Combine with the asynchronous mode (`async_mode`) of Group Commit to merge small transactions and reduce transaction commit latency.

## Dive into Doris Load Internals

Understanding the following internals helps you make better tuning decisions in complex scenarios.

### Design Philosophy

Doris data load is built on its distributed architecture, which mainly involves Frontend (FE) and Backend (BE) nodes:

- **FE**: handles metadata management, query parsing, task scheduling, and transaction coordination.
- **BE**: handles actual data storage, computation, and write operations.

The data load design aims to meet diverse business needs such as real-time writes, streaming synchronization, batch loading, and external data source integration. Its core principles include:

| Design Goal | Implementation |
| --- | --- |
| **Consistency and atomicity** | Each load task is a transaction, ensuring atomic data writes and avoiding partial writes. The Label mechanism guarantees no data loss or duplication. |
| **Flexibility** | Supports a variety of data sources (local files, HDFS, S3, Kafka, and so on) and formats (CSV, JSON, Parquet, ORC, and so on) to fit different scenarios. |
| **Efficiency** | Leverages the distributed architecture to process data in parallel, with multiple BE nodes processing data concurrently to improve throughput. |
| **Simplicity** | Provides lightweight ETL functionality so that you can clean and transform data during load, reducing dependence on external tools. |
| **Flexible modeling** | Supports the Duplicate Key, Unique Key, and Aggregate Key models, allowing data aggregation or deduplication during load. |

### Common Load Workflow

Regardless of the load method (Stream Load, Broker Load, Routine Load, and so on), the core workflow is essentially the same:

1. **Submit the load task**

    1. You submit a load request through a client (such as HTTP, JDBC, or a MySQL client), specifying the data source (such as a local file, Kafka topic, or HDFS file path), target table, file format, and load parameters (such as delimiter and error tolerance).
    2. Each task can specify a unique **Label** to identify the task and support idempotency (preventing duplicate loads). For example, in Stream Load you specify the Label through an HTTP header.
    3. The Doris Frontend (FE) receives the request, validates permissions, checks whether the target table exists, and parses the load parameters.

2. **Task assignment and coordination**

    1. FE analyzes data distribution (based on the table's partitioning and bucketing rules), generates a load plan, and selects a Backend (BE) node as the **Coordinator** to coordinate the entire task.
    2. If you submit directly to a BE (as in Stream Load), that BE can act as the Coordinator, but it still needs to fetch metadata (such as the table schema) from FE.
    3. The load plan distributes data to multiple BE nodes to ensure parallel processing for higher efficiency.

3. **Data reading and distribution**

    1. The Coordinator BE reads data from the data source (for example, pulling messages from Kafka, reading files from S3, or directly receiving an HTTP data stream).
    2. Doris parses the data format (such as splitting CSV or parsing JSON) and supports user-defined **lightweight ETL** operations, including:
        - **Pre-filtering**: filter raw data to reduce processing overhead.
        - **Column mapping**: adjust the correspondence between source columns and target table columns.
        - **Data transformation**: process data using expressions.
        - **Post-filtering**: filter the transformed data.
    3. After parsing, the Coordinator BE distributes data to multiple downstream Executor BEs according to the partitioning and bucketing rules.

4. **Data write**

    1. Data is distributed to multiple BE nodes and written into in-memory tables (MemTables), sorted by Key columns. For the Aggregate or Unique Key model, Doris aggregates or deduplicates by Key (using SUM, REPLACE, and so on).
    2. When a MemTable fills up (200 MB by default) or the task ends, the data is asynchronously written to disk, forming columnar **Segment files** that make up a **Rowset**.
    3. Each BE processes its assigned data independently and reports its status to the Coordinator after the write completes.

5. **Transaction commit and publish**

    1. The Coordinator initiates a transaction commit (Commit) to FE. After FE confirms that a majority of replicas have written successfully, it notifies BEs to publish the data version (Publish Version). Once BE Publish succeeds, FE marks the transaction as **VISIBLE** and the data becomes queryable.
    2. On failure, FE triggers a rollback to remove temporary data and ensure data consistency.

6. **Result return**

    1. Synchronous methods (such as Stream Load and Insert Into) return the load result directly, including success/failure status and error details (such as ErrorURL).
    2. Asynchronous methods (such as Broker Load) return a task ID and Label. You can use `SHOW LOAD` to view progress, error row count, and detailed information.
    3. Operations are recorded in audit logs to support later traceability.

### MemTable Forwarding

MemTable forwarding is an optimization introduced in Apache Doris 2.1.0 that significantly improves the performance of `INSERT INTO...SELECT` loads:

- **Bottleneck of the traditional flow**: the Sink node has to encode data into Block format and transfer it to downstream nodes via Ping-pong RPC, which involves multiple rounds of encoding and decoding and increases overhead.
- **Optimization**: the Sink node directly handles MemTables, generates Segment data, and transfers it via Streaming RPC. This reduces encoding/decoding and transfer waiting, and provides more accurate memory backpressure.
- **Performance gain**: official tests show that load time drops to 36% in single-replica scenarios and 54% in three-replica scenarios, with overall performance improving by more than 100%.
- **Applicable scope**: currently this feature is supported only in the integrated storage and compute deployment mode.

### Load in the Compute-Storage Decoupled Architecture

In the compute-storage decoupled architecture, load optimization focuses on decoupling data storage and transaction management:

- **Data storage**
    - BE does not persist data. After a MemTable Flush, the generated Segment files are uploaded directly to shared storage (such as S3 or HDFS), leveraging the high availability and low cost of object storage to support elastic scaling.
    - The BE local File Cache asynchronously caches hot data, improving query hit rate through TTL and Warmup strategies.
    - Metadata (such as Tablet and Rowset metadata) is stored by Meta Service in FoundationDB, instead of in the local RocksDB on BE.
- **Transaction processing**
    - Transaction management is moved from FE to Meta Service, eliminating the FE Edit Log write bottleneck.
    - Meta Service manages transactions through standard interfaces (`beginTransaction`, `commitTransaction`) and relies on FoundationDB's global transaction capabilities to ensure consistency.
    - The BE Coordinator interacts directly with Meta Service to record transaction state and uses atomic operations to handle conflicts and timeout reclamation, simplifying synchronization logic and improving the throughput of high-concurrency small-batch loads.

## Trade-Offs Between Latency and Throughput

The **latency** and **throughput** of data load often need to be balanced in real business scenarios:

- **Lower latency**: lets you see the latest data sooner, but smaller write batches and higher write frequency lead to more frequent background Compaction, consuming more CPU, I/O, and memory, and increasing pressure on metadata management.
- **Higher throughput**: by increasing the data volume per load and reducing the number of loads, you significantly lower metadata pressure and background Compaction overhead, improving overall system performance. However, the latency between writing data and its visibility increases.

Therefore, while meeting the latency requirements of your business, **maximize the data volume per load** as much as possible to improve throughput and reduce system overhead.

### Test Data

#### Flink End-to-End Latency

The test uses the Flink Connector in batched-write mode, focusing on end-to-end latency and load throughput. The batching interval is controlled by the Flink Connector parameter `sink.buffer-flush.interval`. For details on using the Flink Connector, see [Flink-Doris-Connector](../../../connection-integration/data-integration/flink-doris-connector#usage).

**Machine configuration:**

- 1 FE: 8-core CPU, 16 GB memory
- 3 BEs: 16-core CPU, 64 GB memory

**Dataset:**

- TPCH lineitem data

Load performance under different batching intervals and concurrency levels:

| Batching interval (s) | Load concurrency | Bucket count | Throughput (rows/s) | End-to-end average latency (s) | End-to-end P99 latency (s) |
| --- | --- | --- | --- | --- | --- |
| 0.2 | 1 | 32 | 6073 | 0.211 | 0.517 |
| 1 | 1 | 32 | 31586 | 0.71 | 1.39 |
| 10 | 1 | 32 | 67437 | 5.65 | 10.90 |
| 20 | 1 | 32 | 93769 | 10.962 | 20.682 |
| 60 | 1 | 32 | 125000 | 32.46 | 62.17 |
| 0.2 | 10 | 32 | 9300 | 0.38 | 0.704 |
| 1 | 10 | 32 | 34633 | 0.75 | 1.47 |
| 10 | 10 | 32 | 82023 | 5.44 | 10.43 |
| 20 | 10 | 32 | 139731 | 11.12 | 22.68 |
| 60 | 10 | 32 | 171642 | 32.37 | 61.93 |

Effect of different bucket counts on load performance:

| Batching interval (s) | Load concurrency | Bucket count | Throughput (rows/s) | End-to-end average latency (s) | End-to-end P99 latency (s) |
| --- | --- | --- | --- | --- | --- |
| 1 | 10 | 4 | 34722 | 0.86 | 2.28 |
| 1 | 10 | 16 | 34526 | 0.8 | 1.52 |
| 1 | 10 | 32 | 34633 | 0.75 | 1.47 |
| 1 | 10 | 64 | 34829 | 0.81 | 1.51 |
| 1 | 10 | 128 | 34722 | 0.83 | 1.55 |

#### Group Commit Test

For high-frequency small-batch loads, enabling Group Commit is recommended and significantly improves load performance. For Group Commit performance test data, see [Group Commit Performance](group-commit-manual.md#performance).

## FAQ

<!-- Knowledge type: Frequently asked questions -->

**Q1: How do I choose an appropriate load method?**

Choose by data source and real-time requirements: use Stream Load for real-time pushes of local files; Broker Load for large batches in HDFS/S3; Routine Load for streaming data from Kafka; Insert Into / Select for ETL between external tables or Doris tables; and MySQL Load for MySQL-compatible scenarios.

**Q2: Why do high-frequency small-batch loads significantly affect performance?**

High-frequency small loads cause Doris to perform Compaction frequently, leading to severe write amplification. Either accumulate data on the client to several MB to several GB, or enable [Group Commit](group-commit-manual.md) to batch on the server side.

**Q3: What should I do if loads produce many small files and Compaction pressure is high?**

Enable Group Commit to merge small transactions, or accumulate data on the client to hundreds of MB to several GB before loading. At the same time, review the partitioning and bucketing design to avoid having too many active Tablets.

**Q4: Why should a single load not cover too many partitions?**

Each Tablet holds one active Memtable in memory. When the total memory occupied by active Memtables is too high, an early flush is triggered to avoid OOM, generating many small files and degrading load performance. Limiting the number of partitions in a single load alleviates this issue.

**Q5: Is the data volume per load always better when larger?**

No. Keep each batch no larger than 100 GB. An overly large batch increases retry cost and the impact on BE memory and disk. For large local files, you can use the `streamloader` tool, which automatically batches.

**Q6: Why is a Tablet size of 1-10 GB recommended?**

A Tablet that is too small weakens the aggregation effect and increases metadata management pressure; a Tablet that is too large is more costly to migrate and replenish. 1-10 GB is the empirical range that balances load, query, and replica management.

**Q7: How should I set Stream Load concurrency?**

Stream Load concurrency on a single BE should not exceed 128 (limited by `webserver_num_workers`) and must be below 512 (limited by `doris_max_remote_scanner_thread_pool_thread_num`); otherwise, the BE process may hang.

**Q8: In which scenarios does MemTable forwarding take effect?**

It takes effect only for `INSERT INTO...SELECT` in the integrated storage and compute deployment mode. Single-replica load time drops to 36% of the original, and three-replica drops to 54%. The compute-storage decoupled mode does not currently support this optimization.

**Q9: How do I avoid data skew?**

Set a reasonable bucket count (single Tablet is 1-10 GB after compression) and choose an appropriate bucket key. In random bucketing scenarios, you can enable `load_to_single_tablet=true` to reduce distribution overhead.

## Troubleshooting

<!-- Knowledge type: Troubleshooting -->

| Symptom | Possible Cause | Investigation and Resolution |
| --- | --- | --- |
| Low load throughput, frequent Compaction | High-frequency small-batch loads cause write amplification | Batch on the client side, or enable [Group Commit](group-commit-manual.md) |
| Many small files generated during load | A single load covers too many partitions, causing early Memtable flush | Reduce the number of partitions per load; load partitions in order |
| Long delay before loaded data is visible | Replicas have not reached the majority, slow Publish | Use `SHOW LOAD` to view task status; verify BE health and increase the publish timeout if needed |
| BE OOM or frequent Flush | Too many simultaneously active partitions/Tablets, MemTables scattered | Load partitions in order; reduce bucket count; lower concurrency |
| High pressure on FE Edit Log | High-frequency small-batch loads, too many transactions | Enable Group Commit, or batch on the client side; evaluate whether concurrency is too high |
| Compaction cannot keep up, queries slow down | Too many small files, severe write amplification | Increase the data volume per load; tune bucketing; adjust Compaction parameters when necessary |
| Load jitter under compute-storage decoupling | Object storage QPS throttling | Control concurrency; increase the data volume per batch; confirm the QPS quota with the object storage side |
| Load reports error rows | Data format mismatch, column mapping error | Inspect error samples through the returned ErrorURL; adjust column mapping, delimiters, or error tolerance |
| BE process hangs | Stream Load concurrency on a single BE exceeds 512 | Reduce concurrency, adjust `doris_max_remote_scanner_thread_pool_thread_num` |
| Webserver threads exhausted, Stream Load slow | Concurrency on a single BE exceeds 128 | Keep concurrency under 128 or adjust `webserver_num_workers` |
| Low Broker Load concurrency | A single compressed / Parquet / ORC file is too large and not split | Split the large file into multiple smaller files before loading |
| High retry cost when a single Broker Load fails | Batch size is too large | Keep each batch under 100 GB and submit in batches |
