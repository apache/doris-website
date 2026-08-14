---
{
    "title": "File Cache Configuration and Usage Guide (Compute-Storage Decoupled)",
    "sidebar_label": "File Cache Configuration",
    "language": "en",
    "description": "Covers file cache configuration, index-only cache writes, query-level cache controls, cache warmup and eviction, hit-rate monitoring, and TTL policies for Doris in compute-storage decoupled mode to improve query performance and reduce object storage costs.",
    "keywords": ["Doris file cache", "compute-storage decoupled cache", "file cache", "index-only cache writes", "cache warmup", "cache quota", "file_cache_query_limit_bytes", "TTL cache", "LRU", "cache hit rate", "object storage acceleration"]
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

### Configuring Index-Only Cache Writes

When local cache space is limited and query performance depends more heavily on indexes and Segment metadata, you can enable the index-only write policy. This policy limits what ingestion, Schema Change, Compaction, and other write paths **actively write** to File Cache. It does not affect query-side cache fill after a cache miss or cache warmup.

Doris provides one global policy and two Compaction-specific policies:

| Parameter | Type | Default | Scope | Description |
|---|---|---|---|---|
| `enable_file_cache_write_index_file_only` | Boolean | `false` | All rowset writes in compute-storage decoupled mode, including ingestion, Schema Change, Cumulative Compaction, and Base Compaction | **Supported starting from version 4.0.8.** When set to `true`, Segment data is not actively cached. After a Segment is closed, its footer and internal index ranges are synchronously preloaded, while independent inverted index files are still written to File Cache. This parameter takes precedence over the two Compaction-specific parameters |
| `enable_file_cache_write_base_compaction_index_only` | Boolean | `false` | Base Compaction | Only when the existing Base Compaction policy has already decided to write output to File Cache, prevents the Segment file from being actively cached while still caching independent inverted index files. This parameter does not cause Base Compaction output that would otherwise bypass the cache to be cached |
| `enable_file_cache_write_cumu_compaction_index_only` | Boolean | `false` | Cumulative Compaction | When Cumulative Compaction output is written to File Cache, prevents the Segment file from being actively cached while still caching independent inverted index files |

The write path determines cache behavior in the following priority order:

1. `enable_file_cache=false` has the highest priority and disables all File Cache writes, including Segment footer/internal-index preload and independent inverted-index writes.
2. When `enable_file_cache=true` and `enable_file_cache_write_index_file_only=true`, the global index-only policy is enabled. The two Compaction-specific parameters no longer change the final behavior. Adaptive writes, Compaction retention policies, cache-hit-ratio thresholds, and request-level `write_file_cache` settings cannot cause Segment data to be actively cached; index-related content is still written according to the global policy described above.
3. When the global index-only policy is disabled, the Base/Cumulative Compaction-specific parameters only further restrict output of the matching type that has **already been selected for caching**. They do not affect other write scenarios or the query read path.
4. When all three index-only parameters are `false`, existing active cache writes, adaptive writes, and Compaction output retention behavior remain unchanged.

:::caution

The two Compaction-specific parameters distinguish only between independent inverted index files and Segment files. They do not trigger the Segment footer/internal-index range preload used by the global index-only policy. To actively preserve both independent inverted indexes and Segment internal indexes and metadata, use `enable_file_cache_write_index_file_only`.

:::

#### Enabling the Global Index-Only Policy

Configure the following settings in `be.conf` on every BE node:

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=true
enable_file_cache_write_base_compaction_index_only=false
enable_file_cache_write_cumu_compaction_index_only=false
```

The expected behavior is as follows:

| Scenario | Content Actively Written to File Cache |
|---|---|
| Ingestion, Schema Change, Cumulative Compaction, and Base Compaction | Segment data is not actively written; Segment footer/internal-index ranges are synchronously preloaded; independent inverted-index files are written |
| Query data-page reads | Behavior is unchanged. After a cache miss, Segment data can still be filled according to the existing read-path rules |
| Cache warmup | Behavior is unchanged |
| Packed File | Packed small Segment files are not cached as whole files; packed independent small index files can still be cached as whole files |

Under the global index-only policy, Segment footer/internal-index ranges are written to the cache through synchronous reads and are not controlled by `enable_flush_file_cache_async`. Independent inverted-index files continue to use the existing direct-write and asynchronous-flush behavior.

#### Restricting Only Compaction Output

To reduce cache pressure from Compaction output without changing active cache writes for ingestion and Schema Change, configure:

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=false
enable_file_cache_write_base_compaction_index_only=true
enable_file_cache_write_cumu_compaction_index_only=true
```

Cumulative Compaction writes output to the cache by default, so enabling its corresponding parameter skips Segment files and retains only independent inverted-index files. Base Compaction still first uses `enable_file_cache_keep_base_compaction_output` and the input-rowset cache hit ratio to determine whether to cache its output. The Base Compaction index-only parameter restricts the written content only after that decision is made.

#### Recommendations

- These three parameters are BE parameters. Keep them consistent across all BE nodes in the same compute group to prevent nodes from using different cache-write policies.
- "Index-only" does not mean that File Cache never contains Segment data. Query-side reads of cache-missed data pages can still fill Segment data into the cache.
- This policy can reduce cache pollution from ingestion and Compaction, but a large data scan immediately after a write can increase remote-storage reads. Benchmark it with the production query workload, and monitor Index queue eviction and index-read metrics in the SQL Profile.

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

Doris provides two independent query-level File Cache controls. Choose the parameter according to whether you need to control the cache footprint already held by a query or stop later cache fills:

| Control | Primary parameter | Behavior after the limit | Use case |
|---|---|---|---|
| Limit by cache footprint percentage | `file_cache_query_limit_percent` | New cache blocks can still be written. BE first evicts releasable blocks recorded for the current query and then evicts from other cache queues when necessary | Limit a query's cache footprint while allowing later cache fills |
| Stop remote-scan cache writes by byte threshold | `file_cache_query_limit_bytes` | When the next cache block would make the admitted byte count exceed the threshold, the query enters remote-only-on-miss mode on that BE. Later misses are read from remote storage without further File Cache writes | Limit cache writes and churn caused by a large remote scan |
| Stop cache writes in TopN lazy materialization phase 2 | `enable_topn_lazy_mat_phase2_no_write_file_cache` | Phase-2 lookup reads in TopN lazy materialization go remote-only on a cache miss and do not fill File Cache | Prevent low-reuse TopN lookup reads from polluting the cache |

### Limit by Cache Footprint Percentage

> This feature is supported starting from version 4.0.3.

The cache-footprint percentage limit controls the maximum percentage of each File Cache instance that a single query can use. When multiple users or complex queries share cache resources, it reduces the risk that one large query retains too much cache and evicts other hot data.

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

| Variable | Type | Default | Description |
|---|---|---|---|
| `file_cache_query_limit_percent` | Integer | `-1` | When explicitly set, the value must be in `[1, file_cache_query_limit_max_percent]`. It specifies the maximum percentage of cache that a single query may use. The calculated quota should not be lower than 256 MB; otherwise, BE writes a warning to the log |

Before using this control, enable both `enable_file_cache` and `enable_file_cache_query_limit` on the BE, and ensure that `enable_file_cache` is `true` in the query session.

**Usage Example**

```sql
-- Limit a single query to using at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute the query
SELECT * FROM large_table;
```

Later cache misses remain eligible for File Cache writes. When the query's cache footprint exceeds the quota, BE releases space through the query-level LRU record and other cache queues. This control does not switch the query into a no-more-write mode.

### Stop Remote-Scan Cache Writes by Byte Threshold

`file_cache_query_limit_bytes` limits the cumulative bytes admitted for read-through File Cache writes caused by remote-scan cache misses for one SELECT query on **each BE**. It takes effect only in compute-storage decoupled mode when `enable_file_cache=true` on the BE. It does not depend on `enable_file_cache_query_limit` or `file_cache_query_limit_max_percent`.

Parallel scanners for the same query share one threshold on a BE, but the threshold is not a query-wide or cluster-wide total. For example, if a query runs on 10 BEs with a 1 GiB threshold, each BE can admit approximately 1 GiB independently; the limit is not 1 GiB across all BEs.

**Parameters**

| Parameter | Location | Type | Default | Required | Description |
|---|---|---|---|---|---|
| `file_cache_query_limit_bytes` | Session Variable | BigInt | `-1` | Yes | Remote-scan cache-fill threshold for one query on each BE, in bytes. A value below `0` disables the control; `0` disables cache fills from the start of the query; a positive value accumulates admitted bytes by cache block |
| `enable_file_cache_query_limit_segment_meta` | BE configuration | Boolean | `false` | No | Whether Segment footer and Segment metadata cache writes count toward the same byte threshold. This parameter is dynamically configurable. Data-page and inverted-index writes are subject to the byte threshold whenever this control is active |

`file_cache_query_limit_bytes` has the following behavior:

| Value | Behavior |
|---|---|
| `< 0` | Disables this control and preserves the original cache-miss fill behavior |
| `= 0` | Places the query in remote-only-on-miss mode on every BE from the start. A request range fully covered by local cache can still be read locally; a range that is not fully covered is read directly from remote storage without a cache fill |
| `> 0` | Allows cache blocks while their cumulative admitted bytes do not exceed the threshold. When the next block would exceed it, that block is rejected and later misses for the query on that BE no longer fill the cache |

Admission is evaluated by cache block, so actual writes are not guaranteed to equal the threshold. If the remaining budget is smaller than the next cache block, the entire block is skipped, and the remaining budget is not used for smaller later blocks. After the query enters remote-only-on-miss mode on a BE, cache filling does not resume there.

**Limit Remote-Scan Cache Fills**

The following example assumes that `large_table` is in a compute-storage decoupled cluster and File Cache is enabled on every BE. It allows up to 1 GiB of remote-scan cache blocks to be admitted on each BE:

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM large_table;
```

The query result is unchanged. When the next cache block on a BE would make admitted bytes exceed 1 GiB, later cache misses for that query on the same BE read remote data without additional local cache writes.

To prevent a one-time scan from filling File Cache from the start, set the threshold to `0`, and restore the default after the query:

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM large_table;

SET file_cache_query_limit_bytes = -1;
```

**Whether Segment Metadata Is Counted**

By default, data-page and inverted-index cache writes count toward the threshold, while Segment footer and Segment metadata writes do not. Segment footer and metadata may therefore still be written after the query enters remote-only-on-miss mode, and the total write volume shown in the Profile may exceed `file_cache_query_limit_bytes`.

To stop Segment footer and metadata fills as well, set the following configuration on every BE in the same compute group:

```properties
enable_file_cache_query_limit_segment_meta=true
```

This parameter can be changed immediately through the BE dynamic configuration API. To retain it across restarts, add it to `be.conf` or use persistent dynamic configuration. For details, see [BE Configuration](../../admin-manual/config/be-config.md).

**Verify with Query Profile**

After enabling Query Profile, inspect the `FileCache` metric group under the Scanner:

| Metric | Description |
|---|---|
| `RemoteOnlyOnMissTriggered` | A value of `1` means that the Scanner observed the query entering remote-only-on-miss mode |
| `RemoteOnlyOnMissThresholdBytes` | Byte threshold configured for the query |
| `BytesWriteIntoCache` | Total bytes actually written to File Cache |
| `InvertedIndexBytesWriteIntoCache` | Inverted-index bytes actually written to File Cache |
| `SegmentFooterIndexBytesWriteIntoCache` | Segment footer and metadata bytes actually written to File Cache |
| `NumSkipCacheIOTotal` | Number of I/O operations that skipped the cache. This metric can also include I/O skipped by other cache policies, so evaluate it together with `RemoteOnlyOnMissTriggered` |

If admitted bytes equal the threshold exactly and no later cache block attempts to exceed it before the query finishes, `RemoteOnlyOnMissTriggered` can remain `0`. The state changes only when a subsequent block would exceed the threshold.

**Recommendations and Caveats**

- For one-time full scans, low-reuse ETL, or ad hoc queries, use a small positive threshold or `0` to disable cache fills from the start and avoid replacing hot data with cold data.
- This parameter limits File Cache fills after query-read misses. It does not limit remote bytes read, terminate the query, or affect cache writes produced by ingestion, Compaction, Schema Change, or explicit cache warmup.
- In remote-only-on-miss mode, request ranges fully covered by local cache can still be read locally. Ranges that are not fully covered access remote storage directly, which may increase object-storage I/O and query latency.
- Use `file_cache_query_limit_percent` when the goal is to limit the cache footprint retained by a query while allowing later cache misses to fill the cache. Use `file_cache_query_limit_bytes` when the goal is to stop later fills after a specified amount has been admitted.
- Excluding Segment footer and metadata by default preserves the cache benefit of highly reusable metadata. Enable `enable_file_cache_query_limit_segment_meta` only when those writes must also stop after the threshold, and verify the result with Query Profile.

### Stop Cache Writes in TopN Lazy Materialization Phase 2

> This feature is supported starting from version 4.0.8.

Queries with `ORDER BY ... LIMIT` use TopN lazy materialization: phase 1 reads only the sort columns to select candidate rows, and phase 2 looks up the remaining columns by row id. Phase-2 reads are sparse and rarely reused, so filling File Cache with them easily displaces hot data in compute-storage decoupled mode.

| Variable | Type | Default | Description |
|---|---|---|---|
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | Boolean | `false` | When enabled, phase-2 reads of TopN lazy materialization read directly from remote storage on a File Cache miss and do not fill that range into File Cache |

**Usage example**

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

SELECT * FROM large_table ORDER BY create_time DESC LIMIT 100;
```

**Notes**

- The variable only takes effect in compute-storage decoupled mode; setting it in integrated storage-compute mode has no effect.
- It only affects the phase-2 lookup reads of TopN lazy materialization. Phase-1 sort-column reads, cache fills of other queries, and cache writes from ingestion, Compaction, and cache warmup are unaffected.
- Ranges that phase 2 finds in File Cache are still read locally. Ranges that miss access remote storage directly, which may increase object-storage I/O.
- If TopN queries repeatedly hit the same hot rows, disabling the fill may increase remote reads. Evaluate against your query pattern.

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

### Cache Block Details

Starting from Doris 4.1, you can query [`information_schema.file_cache_info`](../../admin-manual/system-tables/information_schema/file_cache_info.md) to inspect block-level cache entries and summarize cache space by tablet, BE, cache path, or cache type. Doris 4.0.x does not support this system table.

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

After enabling index-only cache writes, monitor the following categorized metrics to determine whether independent inverted indexes and Segment footer/internal-index data are hitting the cache:

| Metric | Description |
|---|---|
| `InvertedIndexBytesScannedFromCache` / `InvertedIndexBytesScannedFromRemote` | Amount of independent inverted-index data read from File Cache / remote storage |
| `InvertedIndexNumLocalIOTotal` / `InvertedIndexNumRemoteIOTotal` | Number of local / remote reads for independent inverted indexes |
| `InvertedIndexLocalIOUseTimer` / `InvertedIndexRemoteIOUseTimer` | Time spent on local / remote reads for independent inverted indexes |
| `SegmentFooterIndexBytesScannedFromCache` / `SegmentFooterIndexBytesScannedFromRemote` | Amount of Segment footer and internal-index data read from File Cache / remote storage |
| `SegmentFooterIndexNumLocalIOTotal` / `SegmentFooterIndexNumRemoteIOTotal` | Number of local / remote reads for Segment footer and internal-index data |
| `SegmentFooterIndexLocalIOUseTimer` / `SegmentFooterIndexRemoteIOUseTimer` | Time spent on local / remote reads for Segment footer and internal-index data |

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
