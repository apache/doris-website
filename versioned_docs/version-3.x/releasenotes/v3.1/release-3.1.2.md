---
{
    "title": "Release 3.1.2",
    "language": "en",
    "description": "#56276"
}
---

## New Features

### Storage and Compression

- **Configurable table compression type** — allows selecting specific compression algorithms per table.

[#56276](https://github.com/apache/doris/pull/56276)

- **Adaptive compaction write caching** — dynamically tunes write caching during base compaction rowset flush.

[#56278](https://github.com/apache/doris/pull/56278)

### Cloud and Object Storage

- **Cloud mode query freshness control** — adds user-defined tolerance between data latency and consistency.

[#56390](https://github.com/apache/doris/pull/56390)

- **Object storage endpoint validation relaxed** — enables private or custom storage endpoints.

[#56641](https://github.com/apache/doris/pull/56641)

### Datalake

- **OSS support for Datalake** **VPC** **Endpoints (**`dlf/datalake-vpc`)**.

[#56476](https://github.com/apache/doris/pull/56476)

- **AWS Glue Catalog** now supports accessing S3 via IAM AssumeRole.

[#57036](https://github.com/apache/doris/pull/57036)

- **S3 Client** updated to use `CustomAwsCredentialsProviderChain` for improved credential management.

[#56943](https://github.com/apache/doris/pull/56943)

### Functional Enhancements

- **Java UDF** now supports IP type.

[#56346](https://github.com/apache/doris/pull/56346)

- **BE REST** **API** adds `RunningTasks` output for monitoring.

[#56781](https://github.com/apache/doris/pull/56781)

- **Transaction monitoring** adds BRPC write-amplification metrics.

[#56832](https://github.com/apache/doris/pull/56832)

## Optimizations

### Query Execution and Planner

- **`COUNT(\*)`** optimization** — automatically selects the smallest column to reduce scan load.

[#56483](https://github.com/apache/doris/pull/56483)

- **Compaction** skips empty rowsets to improve throughput.

[#56768](https://github.com/apache/doris/pull/56768)

- **Warmup statistics** add “skipped rowset” metric for better visibility.

[#56373](https://github.com/apache/doris/pull/56373)

### Storage Layer

- **Variant column cache added** for sparse columns to speed up reads.

[#56730](https://github.com/apache/doris/pull/56730)

- **Segment footer** is now cached in Index Page Cache to reduce latency.

[#56459](https://github.com/apache/doris/pull/56459)

- **Recycler** supports parallel cleanup tasks to increase throughput.

[#56573](https://github.com/apache/doris/pull/56573)

### Datalake

- **Paimon Time Travel** improved and schema mismatch fixed.

[#56338](https://github.com/apache/doris/pull/56338)

- **Iceberg scan error messages refined** and nested namespaces supported.

[#56370](https://github.com/apache/doris/pull/56370), [#57035](https://github.com/apache/doris/pull/57035)

- **Legacy DLF catalog properties removed.**

[#56196](https://github.com/apache/doris/pull/56196), [#56505](https://github.com/apache/doris/pull/56505)

- **JSON** **Load** now defaults to row-by-row parsing mode for line-based data.

[#56736](https://github.com/apache/doris/pull/56736)

## Bug Fixes

### Datalake

- Fixed **Iceberg system table classloader** error.

[#56220](https://github.com/apache/doris/pull/56220)

- Fixed **Iceberg partition table** failure when no partition values exist.

[#57043](https://github.com/apache/doris/pull/57043)

- Fixed **S3A catalog** not using IAM AssumeRole profile properly.

[#56250](https://github.com/apache/doris/pull/56250)

- Disabled Hadoop FileSystem cache for multi-config object storage catalogs.

[#57153](https://github.com/apache/doris/pull/57153)

### Query Execution and SQL Engine

- Fixed `COUNT` pushdown logic error.

[#56482](https://github.com/apache/doris/pull/56482)

- Fixed `UNION` local shuffle behavior bug.

[#56556](https://github.com/apache/doris/pull/56556)

- Fixed crash in `IN` predicate for OLAP storage types.

[#56834](https://github.com/apache/doris/pull/56834)

- Fixed `timestampdiff` computation error for `datetimev1`.

[#56893](https://github.com/apache/doris/pull/56893)

- Fixed crash caused by `explode()` function.

[#57002](https://github.com/apache/doris/pull/57002)

### Storage and Load

- Fixed S3 Load check failure when no source file exists.

[#56376](https://github.com/apache/doris/pull/56376)

- Fixed FileCache cleanup crash.

[#56584](https://github.com/apache/doris/pull/56584)

- Fixed delete bitmap not cleared in MOW compression.

[#56785](https://github.com/apache/doris/pull/56785)

- Fixed Outfile bz2 compression failure for small files.

[#57041](https://github.com/apache/doris/pull/57041)

### Cloud and Recycler Mechanism

- Fixed Warmup skipping multi-segment rowsets.

[#56680](https://github.com/apache/doris/pull/56680)

- Fixed CloudTablet Warmup coredump on reference capture.

[#56627](https://github.com/apache/doris/pull/56627)

- Fixed Recycler null pointer crash in cleanup task.

[#56773](https://github.com/apache/doris/pull/56773)

- Fixed uncaught partition boundary error in Cloud mode.

[#56968](https://github.com/apache/doris/pull/56968)

### System and Miscellaneous

- Fixed incorrect Prometheus metric format in FE.

[#57082](https://github.com/apache/doris/pull/57082)

- Fixed auto-increment value incorrect after FE restart.

[#57118](https://github.com/apache/doris/pull/57118)

- Fixed `SHOW CREATE VIEW` missing column definitions.

[#57045](https://github.com/apache/doris/pull/57045)

- Fixed HDFS Reader crash when sampling Profile data.

[#56950](https://github.com/apache/doris/pull/56950)