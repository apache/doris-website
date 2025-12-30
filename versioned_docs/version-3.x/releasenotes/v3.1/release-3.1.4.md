---
{
    "title": "Release 3.1.4",
    "language": "en",
    "description": "Apache Doris 3.1.4 brings major improvements in:"
}
---

## New Features

### Query Engine

- Support Dereference Expressions [#58550](https://github.com/apache/doris/pull/58550)

### Data Lake & External Catalogs

- Catalog supports loading credentials via `AwsCredentialsProviderChain` [#59054](https://github.com/apache/doris/pull/59054)
- Support passing `credentials_provider_type` to BE for S3 access [#59158](https://github.com/apache/doris/pull/59158)
- Support Elasticsearch `flatten` data type [#58793](https://github.com/apache/doris/pull/58793)

### Observability & Audit

- Support encrypting SQL statements stored in audit logs [#58508](https://github.com/apache/doris/pull/58508)
- QueryPlanAction supports writing SQL from table query plans into audit logs [#59121](https://github.com/apache/doris/pull/59121)
- Generate SQL Digest for statements parsed by Nereids [#59215](https://github.com/apache/doris/pull/59215)

## Optimizations & Improvements

### Query Engine

- Adjust type inference and coercion behavior to improve expression consistency [#57961](https://github.com/apache/doris/pull/57961)
- Prevent analysis tasks from polluting column statistics cache, improving statistics accuracy [#58742](https://github.com/apache/doris/pull/58742)
- Improve execution of queries with multiple DISTINCT aggregate functions [#58973](https://github.com/apache/doris/pull/58973)
- Optimize Join / Set / CTE / predicate pushdown rules to avoid unnecessary plan complexity [#58664](https://github.com/apache/doris/pull/58664), [#59141](https://github.com/apache/doris/pull/59141), [#59151](https://github.com/apache/doris/pull/59151)

### Data Lake & External Catalogs

- Accelerate Hive partition pruning and write performance, significantly reducing write latency for large partitioned tables [#58886](https://github.com/apache/doris/pull/58886), [#58932](https://github.com/apache/doris/pull/58932)
- Iceberg supports ignoring dangling deletes to improve COUNT pushdown [#59069](https://github.com/apache/doris/pull/59069)
- Enhance Iceberg REST Catalog connectivity checks and network timeout handling [#58433](https://github.com/apache/doris/pull/58433), [#58434](https://github.com/apache/doris/pull/58434)
- Align Paimon incremental query behavior with Spark in single-snapshot scenarios [#58253](https://github.com/apache/doris/pull/58253)

### Doris Cloud (Compute-Storage Separation)

- Support dynamically updating tablet rebalancer configuration to improve operational flexibility in cloud environments [#58376](https://github.com/apache/doris/pull/58376)
- Optimize TopN queries in compute-storage separation scenarios to avoid unnecessary remote broadcast reads [#58112](https://github.com/apache/doris/pull/58112), [#58155](https://github.com/apache/doris/pull/58155)
- Improve tablet performance consistency during upgrade processes, reducing hotspot risks [#58247](https://github.com/apache/doris/pull/58247)
- Make File Cache adaptive during Schema Change to reduce cache impact for large tables [#58622](https://github.com/apache/doris/pull/58622)
- Add download wait time metrics to query profiles to improve IO observability [#58870](https://github.com/apache/doris/pull/58870)
- Enhance File Cache debugging capabilities with LRU dump support [#58871](https://github.com/apache/doris/pull/58871)

### Security & Stability

- Enforce HTTPS for Glue Catalog to improve external catalog security [#58366](https://github.com/apache/doris/pull/58366)
- Add SSRF validation for Create Stage [#58874](https://github.com/apache/doris/pull/58874)

## Bug Fixes

### Query Engine (Nereids Optimizer)

- Fix potential infinite loops triggered by TopN / Limit / Join rules in specific scenarios [#58697](https://github.com/apache/doris/pull/58697)
- Fix logic errors in aggregation, window functions, Repeat, and type conversion [#58080](https://github.com/apache/doris/pull/58080), [#58114](https://github.com/apache/doris/pull/58114), [#58330](https://github.com/apache/doris/pull/58330), [#58548](https://github.com/apache/doris/pull/58548)

### Materialized Views (MV)

- Disallow creating invalid materialized views with value column predicates on MOW tables [#57937](https://github.com/apache/doris/pull/57937)

### Data Ingestion

- Fix undefined behavior caused by multiple invocations of the JSON Reader, preventing potential data corruption [#58192](https://github.com/apache/doris/pull/58192)
- Fix incorrect behavior related to `COLUMNS FROM PATH` in Broker Load [#58351](https://github.com/apache/doris/pull/58351), [#58904](https://github.com/apache/doris/pull/58904)
- Fix abnormal behavior of Group Commit when nodes are offline or decommissioned [#59118](https://github.com/apache/doris/pull/59118)
- Fix failures in Load / Delete / Partial Update under specific edge conditions [#58553](https://github.com/apache/doris/pull/58553), [#58230](https://github.com/apache/doris/pull/58230), [#59096](https://github.com/apache/doris/pull/59096)

### Doris Cloud (Compute-Storage Separation)

- Fix stability issues in compute-storage separation scenarios, including Tablet Drop, Compaction, and slow initial startup [#58157](https://github.com/apache/doris/pull/58157), [#58195](https://github.com/apache/doris/pull/58195), [#58761](https://github.com/apache/doris/pull/58761)
- Fix crashes and resource leaks in File Cache under abnormal conditions or BE failures [#58196](https://github.com/apache/doris/pull/58196), [#58819](https://github.com/apache/doris/pull/58819), [#59058](https://github.com/apache/doris/pull/59058)
- Fix abnormal read behavior caused by uncleared Segment Footer Cache after compaction [#59185](https://github.com/apache/doris/pull/59185)
- Fix failures when executing Copy Into with ORC / Parquet formats [#58551](https://github.com/apache/doris/pull/58551)