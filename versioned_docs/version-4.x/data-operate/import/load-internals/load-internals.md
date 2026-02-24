---
{
    "title": "Load Internals and Performance Optimization",
    "language": "en",
    "description": "Apache Doris is a high-performance distributed analytical database that adopts the MPP (Massively Parallel Processing) architecture and is widely "
}
---

## Overview

Apache Doris is a high-performance distributed analytical database that adopts the MPP (Massively Parallel Processing) architecture and is widely used in real-time data analysis, data warehousing, and stream computing scenarios. Data loading is a core functionality of Doris that directly affects the real-time nature and accuracy of data analysis. An efficient loading mechanism ensures that large-scale data can enter the system quickly and reliably, providing support for subsequent queries. This article will analyze the load internals of Doris data loading, covering key processes, components, transaction management, etc., explore factors affecting loading performance, and provide practical optimization methods and best practices to help users choose appropriate loading strategies and optimize loading performance.

## Data Load Internals

### Load Internals Overview

Doris's data loading internals are built on its distributed architecture, mainly involving Frontend nodes (FE) and Backend nodes (BE). FE is responsible for metadata management, query parsing, task scheduling, and transaction coordination, while BE handles actual data storage, computation, and write operations. Doris's data loading design aims to meet diverse business needs, including real-time writing, streaming synchronization, batch loading, and external data source integration. Its core concepts include:

- **Consistency and Atomicity**: Each load task acts as a transaction, ensuring atomic data writes and avoiding partial writes. The Label mechanism guarantees that loaded data is neither lost nor duplicated.
- **Flexibility**: Supports multiple data sources (such as local files, HDFS, S3, Kafka, etc.) and formats (such as CSV, JSON, Parquet, ORC, etc.) to meet different scenarios.
- **Efficiency**: Leverages distributed architecture for parallel data processing, with multiple BE nodes processing data in parallel to improve throughput.
- **Simplicity**: Provides lightweight ETL functionality, allowing users to perform data cleaning and transformation directly during loading, reducing dependency on external tools.
- **Flexible Modeling**: Supports detail models (Duplicate Key), primary key models (Unique Key), and aggregate models (Aggregate Key), allowing data aggregation or deduplication during loading.

### General Load Process

Doris's data loading process can be divided into several intuitive steps. Regardless of the loading method used (such as Stream Load, Broker Load, Routine Load, etc.), the core process is basically consistent.

1. **Submit Load Task**
   1. Users submit load requests through clients (such as HTTP, JDBC, MySQL client), specifying data sources (such as local files, Kafka Topics, HDFS file paths), target tables, file formats, and load parameters (such as delimiters, error tolerance).
   2. Each task can specify a unique **Label** for task identification and idempotency support (preventing duplicate loads). For example, users specify Labels through HTTP headers in Stream Load.
   3. Doris's Frontend node (FE) receives the request, validates permissions, checks if the target table exists, and parses load parameters.

2. **Task Assignment and Coordination**
   1. FE analyzes data distribution (based on table partitioning and bucketing rules), generates a load plan, and selects a Backend node (BE) as the **Coordinator** to coordinate the entire task.
   2. If users submit directly to BE (such as Stream Load), BE can directly serve as Coordinator but still needs to obtain metadata (such as table Schema) from FE.
   3. The load plan distributes data to multiple BE nodes, ensuring parallel processing to improve efficiency.

3. **Data Reading and Distribution**
   1. Coordinator BE reads data from data sources (for example, pulling messages from Kafka, reading files from S3, or directly receiving HTTP data streams).
   2. Doris parses data formats (such as CSV splitting, JSON parsing) and supports user-defined **lightweight ETL** operations, including:
      - **Pre-filtering**: Filters raw data to reduce processing overhead.
      - **Column mapping**: Adjusts the correspondence between data columns and target table columns.
      - **Data transformation**: Processes data through expressions.
      - **Post-filtering**: Filters transformed data.
   3. After parsing data, Coordinator BE distributes it to multiple downstream Executor BEs according to partitioning and bucketing rules.

4. **Data Writing**
   1. Data is distributed to multiple BE nodes and written to memory tables (MemTable), sorted by Key columns. For Aggregate or Unique Key models, Doris performs aggregation or deduplication according to Keys (such as SUM, REPLACE).
   2. When MemTable is full (default 200MB) or the task ends, data is asynchronously written to disk, forming columnar storage **Segment files** and composing **Rowsets**.
   3. Each BE independently processes assigned data and reports status to the Coordinator after writing is complete.

5. **Transaction Commit and Publishing**
   1. Coordinator initiates transaction commit (Commit) to FE. After FE ensures that most replicas are successfully written, it notifies BE to publish data versions (Publish Version). After BE Publish succeeds, FE marks the transaction as **VISIBLE**, at which point data becomes queryable.
   2. If it fails, FE triggers rollback (Rollback), deletes temporary data, and ensures data consistency.

6. **Result Return**
   1. Synchronous methods (such as Stream Load, Insert Into) directly return load results, including success/failure status and error details (such as ErrorURL).
   2. Asynchronous methods (such as Broker Load) provide task IDs and Labels. Users can view progress, error row counts, and detailed information through SHOW LOAD.
   3. Operations are recorded in audit logs for subsequent tracing.

### Memtable Forwarding

Memtable forwarding is an optimization mechanism introduced in Apache Doris 2.1.0 that significantly improves performance for INSERT INTO…SELECT load methods. Official tests show that load time is reduced to 36% in single-replica scenarios and 54% in three-replica scenarios, with overall performance improvements exceeding 100%. In traditional processes, Sink nodes need to encode data into Block format and transmit to downstream nodes through Ping-pong RPC, involving multiple encoding and decoding operations that increase overhead. Memtable forwarding optimizes this process: Sink nodes directly process MemTable, generate Segment data, and transmit through Streaming RPC, reducing encoding/decoding and transmission waiting while providing more accurate memory backpressure. Currently, this feature only supports storage-compute integrated deployment mode.

### Separation of Storage and Compute Load

In storage-compute separation architecture, load optimization focuses on decoupling data storage and transaction management:

- **Data Storage**: BE does not persist data. After MemTable flush, Segment files are directly uploaded to shared storage (such as S3, HDFS), leveraging object storage's high availability and low cost to support elastic scaling. BE local File Cache asynchronously caches hot data, improving query hit rates through TTL and Warmup strategies. Metadata (such as Tablet, Rowset metadata) is stored by Meta Service in FoundationDB rather than BE local RocksDB.
- **Transaction Processing**: Transaction management migrates from FE to Meta Service, eliminating FE Edit Log write bottlenecks. Meta Service manages transactions through standard interfaces (beginTransaction, commitTransaction), relying on FoundationDB's global transaction capabilities to ensure consistency. BE coordinators directly interact with Meta Service, recording transaction states and handling conflicts and timeout recovery through atomic operations, simplifying synchronization logic and improving high-concurrency small-batch load throughput.

### Load Methods

Doris provides multiple load methods that share the above principles but are optimized for different scenarios. Users can choose based on data sources and business needs:

- **Stream Load**: Load local files or data streams through HTTP, returning results synchronously, suitable for real-time writing (such as application data pushing).
- **Broker Load**: Load HDFS, S3, and other external storage through SQL, executing asynchronously, suitable for large-scale batch loads.
- **Routine Load**: Continuously consume data from Kafka, asynchronous streaming load with Exactly-Once support, suitable for real-time synchronization of message queue data.
- **Insert Into/Select**: Load from Doris tables or external sources (such as Hive, MySQL, S3 TVF) through SQL, suitable for ETL jobs and external data integration.
- **MySQL Load**: Compatible with MySQL LOAD DATA syntax, loads local CSV files with data forwarded through FE as Stream Load, suitable for small-scale testing or MySQL user migration.

## How to Improve Doris Load Performance

Doris's load performance is affected by its distributed architecture and storage mechanisms, with core aspects involving FE metadata management, BE parallel processing, MemTable cache flushing, and transaction management. The following optimization strategies and their effectiveness are explained from the dimensions of table structure design, batching strategies, bucket configuration, memory management, and concurrency control, combined with load principles.

### **Table Structure Design Optimization: Reduce Distribution Overhead and Memory Pressure**

In Doris's load process, data needs to be parsed by FE and then distributed to Tablets (data shards) on BE nodes according to table partitioning and bucketing rules, cached and sorted in BE memory through MemTable, and then flushed to disk to generate Segment files. Table structure (partitioning, models, indexes) directly affects data distribution efficiency, computational load, and storage fragmentation.

- **Partition Design: Isolate Data Ranges, Reduce Distribution and Memory Pressure**

By partitioning according to business query patterns (such as time, region), data is only distributed to target partitions during loading, avoiding processing metadata and files from unrelated partitions. Writing to multiple partitions simultaneously causes many Tablets to be active, with each Tablet occupying independent MemTable, significantly increasing BE memory pressure and potentially triggering early Flush, generating numerous small Segment files. This not only increases disk or object storage I/O overhead but also causes frequent Compaction and write amplification due to small files, degrading performance. By limiting the number of active partitions (such as daily loads), the number of simultaneously active Tablets can be reduced, alleviating memory pressure, generating larger Segment files, reducing Compaction burden, and thus improving parallel write efficiency and subsequent query performance.

- **Model Selection: Reduce Computational Load, Accelerate Writing**

Detail models (Duplicate Key) only store raw data without aggregation or deduplication computation; while Aggregate models need aggregation by Key columns and Unique Key models need deduplication, both increasing CPU and memory consumption. For scenarios without deduplication or aggregation needs, prioritizing detail models can avoid additional computation (such as sorting, deduplication) at the MemTable stage on BE nodes, reducing memory usage and CPU pressure, accelerating the data write process.

- **Index Control: Balance Query and Write Overhead**

Indexes (such as bitmap indexes, inverted indexes) need synchronous updates during loading, increasing maintenance costs during writing. Creating indexes only for high-frequency query fields and avoiding redundant indexes can reduce index update operations (such as index building, verification) during BE writing, reducing CPU and memory usage and improving load throughput.

### **Batching Optimization: Reduce Transactions and Storage Fragmentation**

Each load task in Doris is an independent transaction, involving FE Edit Log writing (recording metadata changes) and BE MemTable flushing (generating Segment files). High-frequency small-batch loads (such as KB-level) cause frequent Edit Log writing (increasing FE disk I/O) and frequent MemTable flushing (generating numerous small Segment files, triggering Compaction write amplification), significantly degrading performance.

- **Client-side Batching: Reduce Transaction Count, Lower Metadata Overhead**

Clients accumulate data to hundreds of MB to several GB before loading at once, reducing transaction count. Single large transactions replacing multiple small transactions can reduce FE Edit Log write frequency (reducing metadata operations) and BE MemTable flush frequency (reducing small file generation), avoiding storage fragmentation and subsequent Compaction resource consumption.

- **Server-side Batching (Group Commit): Merge Small Transactions, Optimize Storage Efficiency**

After enabling Group Commit, the server merges multiple small-batch loads within a short time into a single transaction, reducing Edit Log write count and MemTable flush frequency. Merged large transactions generate larger Segment files (reducing small files), alleviating background Compaction pressure, particularly suitable for high-frequency small-batch scenarios (such as logging, IoT data writing).

### **Bucket Count Optimization: Balance Load and Distribution Efficiency**

Bucket count determines Tablet count (each bucket corresponds to one Tablet), directly affecting data distribution on BE nodes. Too few buckets easily cause data skew (single BE overloaded), while too many buckets increase metadata management and distribution overhead (BE needs to handle more Tablets' MemTable and Segment files).

- **Reasonable Bucket Count Configuration: Ensure Balanced Tablet Size**

Bucket count should be set according to BE node count and data volume, with recommended single Tablet compressed data size of 1-10GB (calculation formula: bucket count = total data volume / (1-10GB)). Simultaneously, adjust bucket keys (such as random number columns) to avoid data skew. Reasonable bucketing can balance BE node load, avoiding single node overload or multi-node resource waste, improving parallel write efficiency.

- **Random Bucketing Optimization: Reduce RPC Overhead and Compaction Pressure**

In random bucketing scenarios, enabling `load_to_single_tablet=true` can write data directly to a single Tablet, bypassing distribution to multiple Tablets. This eliminates CPU overhead for computing Tablet distribution and RPC transmission overhead between BEs, significantly improving write speed. Simultaneously, concentrated writing to a single Tablet reduces small Segment file generation, avoids frequent Compaction-induced write amplification, reduces BE resource consumption and storage fragmentation, improving load and query efficiency.

### **Memory Optimization: Reduce Flushing and Resource Impact**

During data loading, BE first writes data to memory MemTable (default 200MB), then asynchronously flushes to disk to generate Segment files (triggering disk I/O) when full. High-frequency flushing increases disk or object storage (storage-compute separation scenarios) I/O pressure; insufficient memory causes MemTable dispersion (in multi-partition/bucket scenarios), easily triggering frequent flushing or OOM.

- **Sequential Load by Partition: Concentrate Memory Usage**

Loading by partition sequence (such as daily), concentrating data writing to a single partition, reduces MemTable dispersion (multi-partitions need MemTable allocation for each partition) and flush frequency, reducing memory fragmentation and I/O pressure.

- **Large-scale Data Batch Load: Reduce Resource Impact**

For large file or multi-file loads (such as Broker Load), recommend batching (≤100GB per batch) to avoid high retry costs after load errors while reducing concentrated occupation of BE memory and disk. Local large files can use the `streamloader` tool for automatic batch loading.

### **Concurrency Optimization: Balance Throughput and Resource Competition**

Doris's distributed architecture supports multi-BE parallel writing. Increasing concurrency can improve throughput, but excessive concurrency causes CPU, memory, or object storage QPS competition (storage-compute separation scenarios need to consider QPS limits of APIs like S3), increasing transaction conflicts and latency.

- **Reasonable Concurrency Control: Match Hardware Resources**

Set concurrent threads based on BE node count and hardware resources (CPU, memory, disk I/O). Moderate concurrency can fully utilize BE parallel processing capabilities, improving throughput; excessive concurrency reduces efficiency due to resource competition.

- **Low Latency Scenarios: Reduce Concurrency and Asynchronous Submission**

For low latency requirement scenarios (such as real-time monitoring), reduce concurrency count (avoiding resource competition) and combine Group Commit's asynchronous mode (`async_mode`) to merge small transactions, reducing transaction commit latency.

## Doris Data Load Latency and Throughput Trade-offs

When using Apache Doris, data load **Latency** and **Throughput** often need to be balanced in actual business scenarios:

- **Lower Latency**: Means users can see the latest data faster, but smaller write batches and higher write frequency lead to more frequent background Compaction, consuming more CPU, IO, and memory resources while increasing metadata management pressure.
- **Higher Throughput**: Reduces load count by increasing single load data volume, which can significantly reduce metadata pressure and background Compaction overhead, thus improving overall system performance. However, latency between data writing and visibility will increase.

Therefore, it's recommended that users **maximize single load data volume** while meeting business latency requirements to improve throughput and reduce system overhead.

### Test Data

#### Flink End-to-End Latency

Using Flink Connector with batching mode for writing, mainly focusing on end-to-end latency and load throughput. Batching time is controlled by the Flink Connector's sink.buffer-flush.interval parameter. For detailed usage of Flink Connector, refer to [Flink-Doris-Connector](../../../ecosystem/flink-doris-connector#usage).

**Machine Configuration:**

- 1 FE: 8-core CPU, 16GB memory
- 3 BEs: 16-core CPU, 64GB memory

**Dataset:**

- TPCH lineitem data

Load performance under different batching times and concurrency levels, test results:

| Batch Time (s) | Load Concurrency | Bucket Count | Throughput (rows/s) | End-to-End Avg Latency (s) | End-to-End P99 Latency (s) |
| -------------- | ---------------- | ------------ | ------------------- | -------------------------- | -------------------------- |
| 0.2            | 1                | 32           | 6073                | 0.211                      | 0.517                      |
| 1              | 1                | 32           | 31586               | 0.71                       | 1.39                       |
| 10             | 1                | 32           | 67437               | 5.65                       | 10.90                      |
| 20             | 1                | 32           | 93769               | 10.962                     | 20.682                     |
| 60             | 1                | 32           | 125000              | 32.46                      | 62.17                      |
| 0.2            | 10               | 32           | 9300                | 0.38                       | 0.704                      |
| 1              | 10               | 32           | 34633               | 0.75                       | 1.47                       |
| 10             | 10               | 32           | 82023               | 5.44                       | 10.43                      |
| 20             | 10               | 32           | 139731              | 11.12                      | 22.68                      |
| 60             | 10               | 32           | 171642              | 32.37                      | 61.93                      |

Impact of different bucket counts on load performance, test results:

| Batch Time (s) | Load Concurrency | Bucket Count | Throughput (rows/s) | End-to-End Avg Latency (s) | End-to-End P99 Latency (s) |
| -------------- | ---------------- | ------------ | ------------------- | -------------------------- | -------------------------- |
| 1              | 10               | 4            | 34722               | 0.86                       | 2.28                       |
| 1              | 10               | 16           | 34526               | 0.8                        | 1.52                       |
| 1              | 10               | 32           | 34633               | 0.75                       | 1.47                       |
| 1              | 10               | 64           | 34829               | 0.81                       | 1.51                       |
| 1              | 10               | 128          | 34722               | 0.83                       | 1.55                       |

#### GroupCommit Testing

For small-batch high-frequency loads, it is recommended to enable Group Commit, which can significantly improve load performance. For Group Commit performance test data, refer to [Group Commit Performance](../group-commit-manual.md#performance)

## Summary

Apache Doris's data load mechanism relies on distributed collaboration between FE and BE, combined with transaction management and lightweight ETL functionality, ensuring efficient and reliable data writing. Frequent small-batch loads increase transaction overhead, storage fragmentation, and Compaction pressure. The following optimization strategies can effectively alleviate these issues:

- **Table Structure Design**: Reasonable partitioning and detail models reduce scanning and computational overhead, streamlined indexes reduce write burden.
- **Batching Optimization**: Client-side and server-side batching reduce transaction and flush frequency, generate large files, optimize storage and queries.
- **Bucket Count Optimization**: Appropriate bucketing balances load, avoiding hotspots or management overhead.
- **Memory Optimization**: Control MemTable size, load by partition.
- **Concurrency Optimization**: Moderate concurrency improves throughput, combined with batching and resource monitoring to control latency.

Users can combine these strategies according to business scenarios (such as real-time logging, batch ETL), optimize table design, parameter configuration, and resource allocation to significantly improve load performance.
