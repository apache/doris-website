---
{
    "title": "File Cache Configuration and Usage Guide (Compute-Storage Decoupled)",
    "sidebar_label": "File Cache Configuration",
    "language": "en",
    "description": "Covers file cache configuration, quota management, cache warmup and eviction, hit-rate monitoring, and TTL policies for Doris in compute-storage decoupled mode to improve query performance and reduce object storage costs.",
    "keywords": ["Doris file cache", "compute-storage decoupled cache", "file cache", "cache warmup", "cache quota", "TTL cache", "LRU", "cache hit rate", "object storage acceleration"]
}
---

<!-- Knowledge type: Architecture and design decisions -->
<!-- Applicable scenarios: Compute-storage decoupled deployment / Query performance optimization / Object storage cost optimization -->

In compute-storage decoupled mode, data is stored in remote object storage (such as S3 or HDFS). Doris uses the local disks of BE nodes as a file cache layer and manages cache space efficiently with a multi-queue LRU (Least Recently Used) strategy. The access paths for indexes and metadata are specially optimized to maximize the cache hit rate for hot data.

For multi-compute-group scenarios, Doris provides a **cache warmup** feature that proactively pulls data for specified tables or partitions into a new compute group when it starts, quickly establishing a local cache and improving first-query performance.

## The Role of File Cache

<!-- Knowledge type: Architecture and design decisions -->

In compute-storage decoupled mode, accessing remote storage typically introduces the following two categories of problems:

| Problem | Description |
|---|---|
| High access latency | Object storage latency is much higher than local disk latency, and this is especially noticeable under high concurrency |
| QPS / bandwidth limits | Object storage usually has QPS ceilings and bandwidth constraints, which become bottlenecks under high-concurrency queries |
| Pay-per-use costs | Object storage is billed by request count and data transfer volume, so frequent access increases operational costs |

By caching hot data on local disks, Doris can significantly reduce query latency while reducing direct requests to object storage, thereby lowering costs.

### Cached File Types

Doris file cache primarily caches the following two types of files:

- **Segment data files**: The basic storage unit for Doris internal table data. Caching these files accelerates data reads and improves query performance.
- **Inverted index files**: Used to accelerate filter operations in queries. Caching these files allows faster location of data that satisfies conditions and supports complex query scenarios.

## Cache Configuration

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Pre-deployment configuration for compute-storage decoupled mode / BE parameter tuning -->

Doris controls file cache behavior through the following parameters in the BE configuration file.

### Enabling File Cache

| Parameter | Default | Description |
|---|---|---|
| `enable_file_cache` | `false` | Whether to enable the file cache feature. Set to `true` in compute-storage decoupled mode. |

### Configuring Cache Paths and Size

```plaintext
file_cache_path  Default: the storage directory under the BE deployment path
```

This parameter is a JSON array. Each element specifies a cache path and its attributes. The supported fields are:

| Field | Description |
|---|---|
| `path` | Path where cache files are stored |
| `total_size` | Total cache size for this path (in bytes) |
| `ttl_percent` | Percentage of space allocated to the TTL queue |
| `normal_percent` | Percentage of space allocated to the Normal queue |
| `disposable_percent` | Percentage of space allocated to the Disposable queue |
| `index_percent` | Percentage of space allocated to the Index queue |
| `storage` | Cache storage type: `disk` (default) or `memory` |

**Configuration examples:**

- Single-path configuration:

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480}]
    ```

- Multi-path configuration:

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
    ```

- Memory storage configuration:

    ```json
    [{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
    ```

### Automatic Cache Clearing

| Parameter | Default | Description |
|---|---|---|
| `clear_file_cache` | `false` | Whether to automatically clear cached data when BE restarts. When set to `true`, the cache is cleared on every restart. |

### Proactive Eviction

Proactive eviction actively frees space when cache utilization reaches a threshold, preventing passive eviction from being triggered during queries and causing performance jitter.

| Parameter | Default | Description |
|---|---|---|
| `enable_evict_file_cache_in_advance` | `true` | Whether to enable proactive eviction |
| `file_cache_enter_need_evict_cache_in_advance_percent` | `88` | Utilization threshold (%) at which proactive eviction is triggered. Proactive eviction begins when used cache space or inode count reaches this percentage |
| `file_cache_exit_need_evict_cache_in_advance_percent` | `85` | Utilization threshold (%) at which proactive eviction stops. Eviction stops when used cache space drops to this percentage |

## Cache Quota

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-user shared cache / Preventing large-query cache thrashing -->

> This feature is supported starting from version 4.0.3.

The **Cache Query Limit** feature allows you to limit the proportion of the file cache that a single query can fill. In scenarios where multiple users or complex queries share cache resources, a single large query may occupy too much cache and evict hot data belonging to other queries. Setting a query quota ensures fair use of resources and prevents cache thrashing.

The cache space occupied by a query refers to the total size of data that the query fills into the cache due to cache misses. If the total fill reaches the quota ceiling, subsequent data written by the query replaces data that the same query wrote earlier, based on the LRU algorithm.

### Configuration

This feature involves three levels of configuration: BE configuration, FE configuration, and session variables.

**BE Configuration**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `enable_file_cache_query_limit` | Boolean | `false` | Master switch for the cache query limit on the BE side. The BE processes the query limit parameter passed from FE only when this is enabled |

**FE Configuration**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `file_cache_query_limit_max_percent` | Integer | `100` | Maximum constraint value for the query quota, used to validate the upper bound of the session variable |

**Session Variables**

| Variable | Type | Description |
|---|---|---|
| `file_cache_query_limit_percent` | Integer (1-100) | Maximum percentage of cache that a single query may use. The upper bound is governed by `file_cache_query_limit_max_percent`. The calculated cache quota should not be lower than 256 MB; if it is, BE outputs a warning in the log |

### Usage Example

```sql
-- Limit a single query to using at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute the query
SELECT * FROM large_table;
```

> **Note:** The value must be within the range `[0, file_cache_query_limit_max_percent]`.

## Cache Warmup

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New compute group going online / Fast loading of hot data -->

Doris provides a cache warmup feature that allows you to proactively pull data from remote storage into the local cache. The following three warmup modes are supported:

| Mode | Description |
|---|---|
| Cross-compute-group warmup | Warms up the hot-data cache from compute group A into compute group B. Doris periodically collects table/partition access hot spots for each compute group and selectively warms up based on this information |
| Table data warmup | Pulls the full data of a specified table into the target compute group |
| Partition data warmup | Pulls data for a specific partition of a specified table into the target compute group |

For detailed usage, see the [WARM-UP SQL documentation](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md).

## Cache Clearing

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Insufficient cache space / Test environment reset / Troubleshooting -->

Doris provides both synchronous and asynchronous cache clearing methods:

| Method | Command | Description |
|---|---|---|
| Synchronous clearing | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'` | The command returns only after clearing is complete. Doris synchronously deletes cache files from the local filesystem and clears in-memory metadata, which frees space quickly but may affect queries that are currently executing. Typically used for rapid testing |
| Asynchronous clearing | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'` | The command returns immediately; the clearing steps execute asynchronously, and you can observe cache space shrinking gradually. Doris traverses in-memory metadata and deletes cache files one by one, deferring deletion for files that are currently in use. This has less impact on executing queries but takes longer to complete fully |

## Cache Monitoring

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cache hit rate analysis / Troubleshooting / Performance tuning -->

### Hotspot Information

Doris collects cache hotspot information for each compute group every 10 minutes and writes it to the internal system table `__internal_schema.cloud_cache_hotspot`. You can analyze hot data with the following queries to guide cache planning.

:::info Note
Before version 3.0.4, you could use the `SHOW CACHE HOTSPOT` statement to query cache hotspot information. Starting from version 3.0.4, that statement is no longer supported. Query the system table `__internal_schema.cloud_cache_hotspot` directly instead.
:::

#### View the Most Frequently Accessed Tables Across All Compute Groups

```sql
-- Equivalent to SHOW CACHE HOTSPOT "/" before version 3.0.4
WITH t1 AS (
    SELECT
        cluster_id,
        cluster_name,
        table_id,
        table_name,
        insert_day,
        SUM(query_per_day) AS query_per_day_total,
        SUM(query_per_week) AS query_per_week_total
    FROM __internal_schema.cloud_cache_hotspot
    GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
    cluster_id AS ComputeGroupId,
    cluster_name AS ComputeGroupName,
    table_id AS TableId,
    table_name AS TableName
FROM (
    SELECT
        ROW_NUMBER() OVER (
            PARTITION BY cluster_id
            ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
        ) AS dr2,
        *
    FROM t1
) t2
WHERE dr2 = 1;
```

#### View the Most Frequently Accessed Tables in a Specific Compute Group

Replace `cluster_name = "compute_group_name0"` with the actual compute group name.

```sql
-- Equivalent to SHOW CACHE HOTSPOT '/compute_group_name0' before version 3.0.4
WITH t1 AS (
    SELECT
        cluster_id,
        cluster_name,
        table_id,
        table_name,
        insert_day,
        SUM(query_per_day) AS query_per_day_total,
        SUM(query_per_week) AS query_per_week_total
    FROM __internal_schema.cloud_cache_hotspot
    WHERE cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g. "default_compute_group"
    GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
    cluster_id AS ComputeGroupId,
    cluster_name AS ComputeGroupName,
    table_id AS TableId,
    table_name AS TableName
FROM (
    SELECT
        ROW_NUMBER() OVER (
            PARTITION BY cluster_id
            ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
        ) AS dr2,
        *
    FROM t1
) t2
WHERE dr2 = 1;
```

### Cache Space and Hit Rate Metrics

<!-- Knowledge type: Configuration parameters -->

Use the following endpoint to retrieve cache statistics for a BE node (`brpc_port` defaults to 8060):

```bash
curl {be_ip}:{brpc_port}/vars
```

The returned metric names are prefixed with the disk path. For example, the prefix `_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_` corresponds to the path `/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/`. After stripping the path prefix, the meaning of each metric is as follows (all sizes are in bytes):

| Metric name (excluding path prefix) | Description |
|---|---|
| `file_cache_cache_size` | Current total size of the file cache |
| `file_cache_disposable_queue_cache_size` | Current size of the Disposable queue |
| `file_cache_disposable_queue_element_count` | Current number of elements in the Disposable queue |
| `file_cache_disposable_queue_evict_size` | Cumulative amount of data evicted from the Disposable queue since startup |
| `file_cache_index_queue_cache_size` | Current size of the Index queue |
| `file_cache_index_queue_element_count` | Current number of elements in the Index queue |
| `file_cache_index_queue_evict_size` | Cumulative amount of data evicted from the Index queue since startup |
| `file_cache_normal_queue_cache_size` | Current size of the Normal queue |
| `file_cache_normal_queue_element_count` | Current number of elements in the Normal queue |
| `file_cache_normal_queue_evict_size` | Cumulative amount of data evicted from the Normal queue since startup |
| `file_cache_total_evict_size` | Cumulative amount of data evicted from the entire file cache since startup |
| `file_cache_ttl_cache_evict_size` | Cumulative amount of data evicted from the TTL queue since startup |
| `file_cache_ttl_cache_lru_queue_element_count` | Current number of elements in the TTL queue |
| `file_cache_ttl_cache_size` | Current size of the TTL queue |
| `file_cache_evict_by_heat_[A]_to_[B]` | Amount of type-A cache data evicted to make room for type-B cache data (eviction based on expiration time) |
| `file_cache_evict_by_size_[A]_to_[B]` | Amount of type-A cache data evicted to make room for type-B cache data (eviction based on space) |
| `file_cache_evict_by_self_lru_[A]` | Amount of type-A cache data that the type-A queue evicted from itself to write new data (LRU-based eviction) |

### SQL Profile Cache Metrics

Cache-related metrics in the SQL Profile are located under the `SegmentIterator` node:

| Metric name | Description |
|---|---|
| `BytesScannedFromCache` | Amount of data read from the file cache |
| `BytesScannedFromRemote` | Amount of data read from remote storage |
| `BytesWriteIntoCache` | Amount of data written into the file cache |
| `LocalIOUseTimer` | Time spent reading from the file cache |
| `NumLocalIOTotal` | Number of reads from the file cache |
| `NumRemoteIOTotal` | Number of reads from remote storage |
| `NumSkipCacheIOTotal` | Number of reads from remote storage that were not written into the file cache |
| `RemoteIOUseTimer` | Time spent reading from remote storage |
| `WriteCacheIOUseTimer` | Time spent writing into the file cache |

You can view the complete query performance report through [Query Performance Analysis](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile).

## TTL Cache Policy

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Keeping hot tables resident in cache / Preventing large queries from evicting hot data -->

The TTL (Time-To-Live) cache policy allows you to set a cache retention duration for data belonging to specific tables. This ensures that small hot tables or recently ingested data remain in the cache long enough to avoid being replaced by the LRU eviction logic triggered by large queries.

### Setting TTL at Table Creation

Set `file_cache_ttl_seconds` (in seconds) in the `PROPERTIES` clause of `CREATE TABLE`:

```sql
CREATE TABLE IF NOT EXISTS customer (
    C_CUSTKEY     INTEGER NOT NULL,
    C_NAME        VARCHAR(25) NOT NULL,
    C_ADDRESS     VARCHAR(40) NOT NULL,
    C_NATIONKEY   INTEGER NOT NULL,
    C_PHONE       CHAR(15) NOT NULL,
    C_ACCTBAL     DECIMAL(15,2) NOT NULL,
    C_MKTSEGMENT  CHAR(10) NOT NULL,
    C_COMMENT     VARCHAR(117) NOT NULL
)
DUPLICATE KEY(C_CUSTKEY, C_NAME)
DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
PROPERTIES (
    "file_cache_ttl_seconds" = "300"
);
```

All newly ingested data for the table above is retained in the cache for 300 seconds.

### Modifying the TTL Setting for a Table

```sql
ALTER TABLE customer SET ("file_cache_ttl_seconds" = "3000");
```

:::info Note
The updated TTL value does not take effect immediately; there is a short delay. If TTL was not set at table creation time, you can add it later with an `ALTER TABLE` statement.
:::

## Practical Example

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Mixed large-and-small table scenarios / TTL policy tuning -->

**Scenario description:**

A user has a collection of data tables with a total data size exceeding 3 TB, but available cache capacity is only 1.2 TB. Among these tables, two are accessed frequently:

| Table | Size | Access pattern |
|---|---|---|
| `dimension_table` | 200 MB | Accessed frequently; data changes infrequently |
| `fact_table` | 100 GB | New data is ingested daily and must be queryable on a T+1 basis |

Other large tables are accessed infrequently.

**Problem:** Under the default LRU policy, queries against large tables may evict `dimension_table` data from the cache, causing query performance for the dimension table to fluctuate.

**Solution:** Set TTL for both frequently accessed tables to guarantee that their data is retained in the cache for a sufficient duration.

```sql
-- Dimension table: small data volume, infrequent changes; set a 1-year TTL to keep it resident in the cache
ALTER TABLE dimension_table SET ("file_cache_ttl_seconds" = "31536000");

-- Fact table: full load ingested daily; set a 1-day TTL aligned with the ingestion cycle
ALTER TABLE fact_table SET ("file_cache_ttl_seconds" = "86400");
```

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Low cache hit rate / Cache configuration troubleshooting -->

**Q: The cache hit rate is low and queries are still slow. How do I troubleshoot this?**

1. Use `curl {be_ip}:{brpc_port}/vars` to check the `evict_size` metrics for each queue and determine whether frequent eviction is occurring.
2. Check the ratio of `BytesScannedFromRemote` to `BytesScannedFromCache` in the SQL Profile to confirm the actual hit rate.
3. If large queries are frequently evicting hot data, consider enabling the **Cache Query Limit** feature (`enable_file_cache_query_limit`) or configuring a **TTL policy** for hot tables.

**Q: Cache data is lost after BE restarts.**

Check whether `clear_file_cache` is set to `true`. If you do not want the cache cleared on restart, set it to `false` (the default value).

**Q: The first query after a new compute group comes online is very slow.**

Use the **cache warmup** feature to proactively pull hot table or partition data from remote storage into the local cache of the new compute group before queries arrive. For detailed usage, see the [WARM-UP SQL documentation](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md).

**Q: How do I tell whether the current cache space is full?**

Compare the `file_cache_cache_size` metric against the `total_size` configured in `file_cache_path`. If it is approaching the limit, check whether capacity needs to be expanded or whether the allocation percentages for each queue need adjustment.
