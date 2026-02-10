---
{
    "title": "Release 4.0.2",
    "language": "en",
    "description": "Here's a professional translation of the Apache Doris release notes:"
}
---

## New Feature

### AI & Search

- Inverted index supports custom analyzers, including Pinyin tokenizer and Pinyin filter (#57097)
- Added support for multi-position PhraseQuery in inverted index search functions (#57588)
- Added Ann index only-scan capability (#57243)

### Function

- Added the `sem` aggregate function (#57545)
- Supported the `factorial` simple SQL function derived from Hive (#57144)
- Added support for zero-width assertions in some regular expression functions (#57643)
- Enabled GROUP BY and DISTINCT operations for JSON type (#57679)
- Added the `add_time`/`sub_time` time functions (#56200)
- Added the `deduplicate_map` function (#58403)

### Materialized View (MTMV)

- Materialized views can still participate in transparent query rewrite when data changes occur in their non-partitioned base tables (#56745)
- Supported creating MTMV based on views (#56423)
- MTMV refresh supports multiple PCT tables (#58140)
- Supported window function rewrite when materialized views contain window functions (#55066)

### Data Lake

Here's a professional translation of the Apache Doris release notes:

- Added Doris Catalog
  -  This feature enables users to connect multiple independent Doris clusters through the Catalog capability and perform efficient federated data queries, addressing the inability to query data across Doris clusters.
  -  Documentation: https://doris.apache.org/docs/4.x/lakehouse/catalogs/doris-catalog
- Support for Iceberg table compaction via rewrite_data_files method
  -  This operation allows users to merge small Iceberg files, thereby optimizing read performance.
  -  Documentation: https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#rewrite_data_files
- Support for cache warmup of external tables (Hive, Iceberg, Paimon, etc.) using the WARM UP statement
  -  Documentation: https://doris.apache.org/docs/4.x/lakehouse/data-cache#cache-warmup
- Support for Iceberg table Partition Evolution operations via ALTER statement
  -  Documentation: https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#partition-evolution
- Support for HTTP Table Valued Function
  -  Enables direct reading of HTTP resource files through Table Valued Functions.
  -  Documentation: https://doris.apache.org/docs/4.x/sql-manual/sql-functions/table-valued-functions/http
- Supports direct access to datasets on Hugging Face.
  -  Documentation: https://doris.apache.org/docs/4.x/lakehouse/huggingface
- Support for accessing Microsoft OneLake via Iceberg REST Catalog protocol
  -  Documentation: https://doris.apache.org/docs/4.x/lakehouse/best-practices/doris-onelake
- Support for direct mapping of binary types from Hive, Iceberg, Paimon, and JDBC external tables to Doris varbinary type
  -  Please refer to the "Column Mapping" section in each Catalog's documentation.

## Optimizations

- Optimized performance of the `FROM_UNIXTIME` function (#57423)
- Removed `castTo` conversion operations in PartitionKey comparisons to improve partition processing efficiency (#57518)
- Reduced memory footprint of the Column class in Catalog (#57401)
- Ann index now accumulates multiple small batches of data before training to improve training efficiency (#57623)
- Upgraded Hadoop dependency to version 3.4.2 (#58307)
- Optimized graceful shutdown mechanism for FE and BE to minimize the impact of node exits on queries (#56601)
- Improved write efficiency for Hive tables containing a large number of partitions (#58166)
- Optimized the issue of excessive memory consumption by Paimon table Splits (#57950)
- Improved read efficiency for Parquet RLE_DICTIONARY encoding (#57208)
- Optimized graceful shutdown mechanism for FE and BE to minimize the impact of node exits on queries (#56601)

## Bug Fixes

### Query

- Fixed the issue where the `utc_time` function returned incorrect results when the input was null (#57716)
- Fixed the exception thrown when UNION ALL is combined with TVF (#57889)
- Fixed the problem that the WHERE clause contained non-key columns when creating a materialized view on a unique key table (#57915)
- Fixed window functions: enabled constant expression evaluation for the offset parameter of LAG/LEAD (#58200)
- Fixed aggregate functions: abnormal push-down of aggregate operations before projection on nullable columns; count push-down aggregation issue on non-null columns (#58234)
- Fixed time functions: the `second`/`microsecond` functions did not handle time literals; `time_to_sec` reported errors due to garbage values when processing null values (#56659, #58410)
- Fixed AI functions: unknown error occurred when `_exec_plan_fragment_impl` called AI functions (#58521)
- Fixed geo module: memory leak in the geo module (#58004)
- Fixed information_schema: timezone format incompatibility when using offset timezone (#58412)

### Materialized View and Schema Change

- Fixed the failure of rewrite when materialized views contain group sets and filters above scan (#57343)
- Fixed the coredump issue caused by reading non-overlapping segments from a single rowset during heavy schema change (#57191)

### Storage-Compute Separation

- Fixed the issue of broadcast remote read in TopN queries (#58044)
- Fixed the accumulation of tablet deletion tasks in the cloud environment (#58131)
- Fixed the problem of long service startup time during the first boot in the cloud environment (#58152)

### Data Lake

- Fixed an issue where Hive partition changes could cause metadata cache inconsistency in certain cases (#58707)
- Fixed an error when writing to Iceberg tables with TIMESTAMP type partitions (#58603)
- Fixed inconsistent Paimon table Incremental Read behavior compared to Spark (#58239)
- Fixed a potential deadlock issue caused by external table metadata cache in certain cases (#57856)
- Fixed low I/O throughput caused by unreasonable s3 client thread count on the BE side (#58511)
- Fixed failures when writing to external tables stored on non-S3 object storage in certain cases (#58504)
- Fixed SQL passthrough failures for JDBC Catalog using query() in certain cases (#57745)
- Fixed performance degradation in read operations caused by JNI Reader time statistics (#58224)
- Fixed an issue where jni.log could not be printed on the BE side (#58457)

### Others

- Fixed an error when using UNSET GLOBAL variable during non-Master phase (#58285)
- Fixed an issue where abnormal export tasks could not be canceled in certain cases (#57488)