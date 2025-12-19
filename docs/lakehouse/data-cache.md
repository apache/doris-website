---
{
    "title": "Data Cache",
    "language": "en",
    "description": "Data Cache accelerates subsequent queries of the same data by caching recently accessed data files from remote storage systems (HDFS or object "
}
---

Data Cache accelerates subsequent queries of the same data by caching recently accessed data files from remote storage systems (HDFS or object storage) to local disks. In scenarios where the same data is frequently accessed, Data Cache can avoid the overhead of repeated remote data access, improving the performance and stability of query analysis on hot data.

## Applicable Scenarios

The data cache function only works for queries on Hive, Iceberg, Hudi, and Paimon tables. It has no effect on internal table queries or non-file external table queries (such as JDBC, Elasticsearch).

Whether data caching can improve query efficiency depends on multiple factors. Below are the applicable scenarios for data caching:

* High-speed local disk

  It is recommended to use high-speed local disks, such as SSD or NVME media local disks, as the data cache directory. It is not recommended to use mechanical hard drives as the data cache directory. Essentially, the local disk's IO bandwidth and IOPS must be significantly higher than the network bandwidth and the source storage system's IO bandwidth and IOPS to bring noticeable performance improvements.

* Sufficient cache space size

  Data caching uses the LRU strategy as the cache eviction policy. If the queried data does not have a clear distinction between hot and cold, the cached data may be frequently updated and replaced, which may reduce query performance. It is recommended to enable data caching in scenarios where the query pattern has a clear distinction between hot and cold (e.g., most queries only access today's data and rarely access historical data), and the cache space is sufficient to store hot data.

* Unstable IO latency of remote storage

  This situation usually occurs on HDFS storage. In most enterprises, different business departments share the same HDFS, which may lead to very unstable IO latency during peak periods. In this case, if you need to ensure stable IO latency, it is recommended to enable data caching. However, the first two conditions should still be considered.

## Enabling Data Cache

The data cache function is disabled by default and needs to be enabled by setting relevant parameters in FE and BE.

### BE Configuration

First, configure the cache path information in `be.conf` and restart the BE node to make the configuration effective.

| Parameter            | Required | Description                              |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | Yes   | Whether to enable Data Cache, default is false               |
| `file_cache_path`   | Yes   | Configuration related to the cache directory, in JSON format.                      |
| `clear_file_cache`  | No   | Default is false. If true, the cache directory will be cleared when the BE node restarts. |

Example configuration of `file_cache_path`:

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```

`path` is the path where the cache is stored, and one or more paths can be configured. It is recommended to configure only one path per disk.

`total_size` is the upper limit of the cache space size, in bytes. When the cache space is exceeded, the LRU strategy will be used to evict cached data.

### FE Configuration

Enable Data Cache in a single session:

```sql
SET enable_file_cache = true;
```

Enable Data Cache globally:

```sql
SET GLOBAL enable_file_cache = true;
```

Note that if `enable_file_cache` is not enabled, the cache will not be used even if the BE is configured with a cache directory. Similarly, if the BE is not configured with a cache directory, the cache will not be used even if `enable_file_cache` is enabled.

## Cache Observability

### View Cache Hit Rate

Execute `set enable_profile=true` to open the session variable, and you can view the job's Profile on the `Queries` tab of the FE web page. The data cache-related metrics are as follows:

```sql
-  FileCache:  0ns
    -  BytesScannedFromCache:  2.02  GB
    -  BytesScannedFromRemote:  0.00  
    -  BytesWriteIntoCache:  0.00  
    -  LocalIOUseTimer:  2s723ms
    -  NumLocalIOTotal:  444
    -  NumRemoteIOTotal:  0
    -  NumSkipCacheIOTotal:  0
    -  RemoteIOUseTimer:  0ns
    -  WriteCacheIOUseTimer:  0ns
```

* `BytesScannedFromCache`: The amount of data read from the local cache.

* `BytesScannedFromRemote`: The amount of data read from the remote.

* `BytesWriteIntoCache`: The amount of data written into the cache.

* `LocalIOUseTimer`: The IO time of the local cache.

* `RemoteIOUseTimer`: The IO time of remote reading.

* `NumLocalIOTotal`: The number of IO operations on the local cache.

* `NumRemoteIOTotal`: The number of remote IO operations.

* `WriteCacheIOUseTimer`: The IO time of writing into the cache.

If `BytesScannedFromRemote` is 0, it means the cache is fully hit.

### Monitoring Metrics

Users can view cache statistics for each Backend node through the system table [`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics).

## Cache Warmup

Data Cache provides a cache "warmup" feature that allows preloading external data into the local cache of BE nodes, thereby improving cache hit rates and query performance for subsequent first-time queries.

> This feature is supported since version 4.0.2.

### Syntax

```sql
WARM UP SELECT <select_expr_list>
FROM <table_reference>
[WHERE <boolean_expression>]
```

Usage restrictions:

* Supported:

  * Single table queries (only one table_reference allowed)
  * Simple SELECT for specified columns
  * WHERE filtering (supports regular predicates)

* Not supported:

  * JOIN, UNION, subqueries, CTE
  * GROUP BY, HAVING, ORDER BY
  * LIMIT
  * INTO OUTFILE
  * Multi-table / complex query plans
  * Other complex syntax

### Examples

1. Warm up the entire table

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```

2. Warm up partial columns by partition

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```
3. Warm up partial columns by filter conditions

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```

### Execution Results

After executing `WARM UP SELECT`, the FE dispatches tasks to each BE. The BE scans remote data and writes it to Data Cache.

The system directly returns scan and cache write statistics for each BE (Note: Statistics are generally accurate but may have some margin of error). For example:

```
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| BackendId     | ScanRows  | ScanBytes   | ScanBytesFromLocalStorage | ScanBytesFromRemoteStorage | BytesWriteIntoCache |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| 1755134092928 | 294744184 | 11821864798 | 538154009                 | 11283717130                | 11899799492         |
| 1755134092929 | 305293718 | 12244439301 | 560970435                 | 11683475207                | 12332861380         |
| TOTAL         | 600037902 | 24066304099 | 1099124444                | 22967192337                | 24232660872         |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
```

Field explanations:

* ScanRows: Number of rows scanned and read.
* ScanBytes: Amount of data scanned and read.
* ScanBytesFromLocalStorage: Amount of data scanned and read from local cache.
* ScanBytesFromRemoteStorage: Amount of data scanned and read from remote storage.
* BytesWriteIntoCache: Amount of data written to Data Cache during this warmup.

## Appendix

### Principle

Data caching caches accessed remote data to the local BE node. The original data file is split into Blocks based on the accessed IO size, and Blocks are stored in the local file `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset`, with Block metadata saved in the BE node. When accessing the same remote file, doris checks whether the cache data of the file exists in the local cache and determines which data to read from the local Block and which data to pull from the remote based on the Block's offset and size, caching the newly pulled remote data. When the BE node restarts, it scans the `cache_path` directory to restore Block metadata. When the cache size reaches the upper limit, it cleans up long-unused Blocks according to the LRU principle.