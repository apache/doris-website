---
{
    "title": "File Cache",
    "language": "en"
}
---

In a decoupled architecture, data is stored in remote storage. The Doris database accelerates data access by utilizing a cache on local disks and employs an advanced multi-queue LRU (Least Recently Used) strategy to efficiently manage cache space. This strategy particularly optimizes the access paths for indexes and metadata, aiming to maximize the caching of frequently accessed user data. For multi-compute group (Compute Group) scenarios, Doris also provides a cache warming feature to quickly load specific data (such as tables or partitions) into the cache when a new compute group is established, thereby enhancing query performance.

## Multi-Queue LRU

### LRU

* LRU manages the cache by maintaining a data access queue. When data is accessed, it is moved to the front of the queue. Newly added data to the cache is also placed at the front of the queue to prevent it from being evicted too early. When the cache space reaches its limit, data at the tail of the queue will be removed first.

### TTL (Time-To-Live)

* The TTL strategy ensures that newly imported data remains in the cache for a certain period without being evicted. During this time, the data has the highest priority, and all TTL data are treated equally. When cache space is insufficient, the system will prioritize evicting data from other queues to ensure that TTL data can be written to the cache.

* Application scenarios: The TTL strategy is particularly suitable for small-scale data tables that require local persistence. For resident tables, a longer TTL value can be set to protect their data; for dynamically partitioned tables, the TTL value can be set according to the active time of Hot Partitions.

* Note: Currently, the system does not support directly viewing the proportion of TTL data in the cache.

### Multi-Queue

* Doris adopts a multi-queue strategy based on LRU, categorizing data into four types based on TTL attributes and data properties, and placing them in TTL queues, Index queues, NormalData queues, and Disposable queues. Data with a TTL attribute is placed in the TTL queue, index data without a TTL attribute is placed in the Index queue, normal data without a TTL attribute is placed in the NormalData queue, and temporary data is placed in the Disposable queue.

* During data read and write processes, Doris selects the queues to fill and read from to maximize cache utilization. The specific mechanism is as follows:

| Operation      | Queue Filled on Miss | Queue Filled on Write    |
| -------------- | --------------------- | ------------------------- |
| Import         | TTL / Index / NormalData | TTL / Index / NormalData    |
| Query          | TTL / Index / NormalData | N/A                       |
| Schema Change   | Disposable            | TTL / Index / NormalData   |
| Compaction     | Disposable            | TTL / Index / NormalData   |
| Warm-up        | N/A                   | TTL / Index / NormalData   |

### Eviction

All types of caches share the total cache space, and proportions can be allocated based on their importance. These proportions can be set in the `be` configuration file using `file_cache_path`, with the default being: TTL: Normal: Index: Disposable = 50%: 30%: 10%: 10%.

These proportions are not rigid limits; Doris dynamically adjusts them to make full use of space. E.g., if users do not utilize TTL cache, other types can exceed the preset proportion and use the space originally allocated for TTL.

Cache eviction is triggered by two conditions: garbage collection or insufficient cache space. When users delete data or when compaction tasks end, expired cache data is asynchronously evicted. When there is not enough space to write to the cache, eviction follows the order of Disposable, Normal Data, Index, and TTL. For instance, if there is not enough space to write Normal Data, Doris will sequentially evict some Disposable, Index, and TTL data in LRU order. Note that we do not evict all data of the target type before moving on to the next type; instead, we retain at least the aforementioned proportions to ensure other types can function properly. If this process does not free up enough space, LRU eviction for the type itself will be triggered. E.g., if not enough space can be freed from other types when writing Normal Data, Normal Data will then evict its own data in LRU order.

Specifically, for the TTL queue with expiration times, when data expires, it is moved to the Normal Data queue and participates in eviction as Normal Data.

## Cache Warming

In a decoupled mode, Doris supports multi-compute group deployment, where compute groups share data but do not share cache. When a new compute group is created, its cache is empty, which may affect query performance. Therefore, Doris provides a cache warming feature that allows users to actively pull data from remote storage to local cache. This feature supports the following three modes:

- **Inter-Compute Group Warming**: Warm the cache data of Compute Group A to Compute Group B. Doris periodically collects hotspot information of tables/partitions accessed in each compute group over a period and selectively warms certain tables/partitions based on this information.
- **Table Data Warming**: Specify to warm the data of Table A to the new compute group.
- **Partition Data Warming**: Specify to warm the data of partition `p1` of Table A to the new compute group.

## Compute Group Scaling

When scaling Compute Groups, to avoid cache fluctuations, Doris will first remap the affected tablets and warm the data.

## Cache Observation

### Hotspot Information

Doris collects cache hotspot information for each compute group every 10 minutes and stores it in an internal system table. You can view this hotspot information using query statements. Users can better plan their cache usage based on this information.

:::info Note
Before version 3.0.4, the `SHOW CACHE HOTSPOT` statement could be used to query cache hotspot information statistics. Starting from version 3.0.4, the `SHOW CACHE HOTSPOT` statement is no longer supported for querying cache hotspot information statistics. Please directly query the system table `__internal_schema.cloud_cache_hotspot`.
:::

Users typically focus on cache usage information at two levels: compute groups and database tables. The following provides some commonly used query statements and examples.

#### Viewing the Most Frequently Accessed Tables Across All Compute Groups

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

#### Viewing the Most Frequently Accessed Tables Under a Specific Compute Group

Viewing the most frequently accessed tables under compute group `compute_group_name0`.

Note: Replace the condition `cluster_name = "compute_group_name0"` with the actual compute group name.

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
  WHERE cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g., "default_compute_group"
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

#### Viewing the Most Frequently Accessed Partitions for a Specific Compute Group and Table

Viewing the most frequently accessed partitions for table `regression_test_cloud_load_copy_into_tpch_sf1_p1.customer` under compute group `compute_group_name0`.

Note: Replace the conditions `cluster_name = "compute_group_name0"` and `table_name = "regression_test_cloud_load_copy_into_tpch_sf1_p1.customer"` with the actual compute group name and database table name.

```sql
-- Equivalent to SHOW CACHE HOTSPOT '/compute_group_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer' before version 3.0.4
SELECT
  partition_id AS PartitionId,
  partition_name AS PartitionName
FROM __internal_schema.cloud_cache_hotspot
WHERE
  cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g., "default_compute_group"
  AND table_name = "regression_test_cloud_load_copy_into_tpch_sf1_p1.customer" -- Replace with the actual database table name, e.g., "db1.t1"
GROUP BY
  cluster_id,
  cluster_name,
  table_id,
  table_name,
  partition_id,
  partition_name;
```

### Cache Space and Hit Rate

Doris BE nodes can obtain cache statistics by using `curl {be_ip}:{brpc_port}/vars` (where brpc_port defaults to 8060), and the names of the metrics start with the disk path.

In the above example, the metric prefix for File Cache is the path, for example, the prefix "_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_" indicates "/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/"
The part after the prefix is the statistical metric, for example, "file_cache_cache_size" indicates that the current size of the File Cache at this path is 26111 bytes.

The following table lists the meanings of all metrics (all size units are in bytes):

Metric Name (excluding path prefix) | Meaning
-----|------
file_cache_cache_size | Current total size of the File Cache
file_cache_disposable_queue_cache_size | Current size of the disposable queue
file_cache_disposable_queue_element_count | Current number of elements in the disposable queue
file_cache_disposable_queue_evict_size | Total amount of data evicted from the disposable queue since startup
file_cache_index_queue_cache_size | Current size of the index queue
file_cache_index_queue_element_count | Current number of elements in the index queue
file_cache_index_queue_evict_size | Total amount of data evicted from the index queue since startup
file_cache_normal_queue_cache_size | Current size of the normal queue
file_cache_normal_queue_element_count | Current number of elements in the normal queue
file_cache_normal_queue_evict_size | Total amount of data evicted from the normal queue since startup
file_cache_total_evict_size | Total amount of data evicted from the entire File Cache since startup
file_cache_ttl_cache_evict_size | Total amount of data evicted from the TTL queue since startup
file_cache_ttl_cache_lru_queue_element_count | Current number of elements in the TTL queue
file_cache_ttl_cache_size | Current size of the TTL queue
file_cache_evict_by_heat\_[A]\_to\_[B] | Data from cache type A evicted due to cache type B (time-based expiration) 
file_cache_evict_by_size\_[A]\_to\_[B] | Data from cache type A evicted due to cache type B (space-based expiration) 
file_cache_evict_by_self_lru\_[A] | Data from cache type A evicted by its own LRU policy for new data 

### SQL Profile

Cache-related metrics in the SQL profile are found under SegmentIterator, including:

| Metric Name                     | Meaning      |
|----------------------------------|-------------|
| BytesScannedFromCache            | Amount of data read from the File Cache    |
| BytesScannedFromRemote           | Amount of data read from remote storage     |
| BytesWriteIntoCache              | Amount of data written into the File Cache   |
| LocalIOUseTimer                  | Time taken to read from the File Cache      |
| NumLocalIOTotal                  | Number of times the File Cache was read     |
| NumRemoteIOTotal                 | Number of times remote storage was read      |
| NumSkipCacheIOTotal              | Number of times data read from remote storage did not enter the File Cache |
| RemoteIOUseTimer                 | Time taken to read from remote storage       |
| WriteCacheIOUseTimer             | Time taken to write to the File Cache        |

You can view query performance analysis through [Query Performance Analysis](../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile).

## Usage

### Setting TTL Strategy

When creating a table, set the corresponding PROPERTY to use the TTL strategy for caching that table's data.

- `file_cache_ttl_seconds`: The expected time for newly imported data to remain in the cache, in seconds.

```shell
CREATE TABLE IF NOT EXISTS customer (
  C_CUSTKEY     INTEGER NOT NULL,
  C_NAME        VARCHAR(25) NOT NULL,
  C_ADDRESS     VARCHAR(40) NOT NULL,
  C_NATIONKEY   INTEGER NOT NULL,
  C_PHONE       CHAR(15) NOT NULL,
  C_ACCTBAL     DECIMAL(15,2)   NOT NULL,
  C_MKTSEGMENT  CHAR(10) NOT NULL,
  C_COMMENT     VARCHAR(117) NOT NULL
)
DUPLICATE KEY(C_CUSTKEY, C_NAME)
DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
PROPERTIES(
    "file_cache_ttl_seconds"="300"
)
```

In the above table, all newly imported data will be retained in the cache for 300 seconds. The system currently supports modifying the TTL time of the table, and users can extend or shorten the TTL time based on actual needs.

```SQL
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```

:::info Note

The modified TTL value will not take effect immediately and will have a certain delay.

If no TTL is set when creating the table, users can also modify the table's TTL attribute by executing the ALTER statement.
:::

### Cache Warming

- Inter-Compute Group Warming. Warm the cache data of `compute_group_name0` to `compute_group_name1`.

When executing the following SQL, the `compute_group_name1` compute group will obtain the access information of the `compute_group_name0` compute group to restore the cache as closely as possible to that of `compute_group_name0`.

```sql
WARM UP COMPUTE GROUP compute_group_name1 WITH COMPUTE GROUP compute_group_name0
```

- Table Data Warming. Warm the data of the table `customer` to `compute_group_name1`. Executing the following SQL will pull all data of that table from remote storage to local.

```sql
WARM UP COMPUTE GROUP compute_group_name1 WITH TABLE customer
```

- Partition Data Warming. Warm the data of partition `p1` of the table `customer` to `compute_group_name1`. Executing the following SQL will pull all data of that partition from remote storage to local.

```sql
WARM UP COMPUTE GROUP compute_group_name1 with TABLE customer PARTITION p1
```

The above three cache warming SQL statements will return a JobID result. For example:

```sql
WARM UP COMPUTE GROUP cloud_warm_up WITH TABLE test_warm_up;
```

You can then check the cache warming progress with the following SQL.

```sql
SHOW WARM UP JOB WHERE ID = 13418; 
```

You can determine the current task progress based on `FinishBatch` and `AllBatch`, with each Batch's data size being approximately 10GB. Currently, only one warming job is supported to run at a time within a compute group. Users can stop an ongoing warming job.

```sql
CANCEL WARM UP JOB WHERE id = 13418;
```

## Practical Case

A user has a series of data tables with a total data volume exceeding 3TB, while the available cache capacity is only 1.2TB. Among them, there are two tables with high access frequency: one is a dimension table of size 200MB (`dimension_table`), and the other is a fact table of size 100GB (`fact_table`), which has new data imported daily and requires T+1 query operations. Additionally, other large tables have low access frequency.

Under the LRU caching strategy, if large table data is queried, it may replace the small table data that needs to remain in the cache, causing performance fluctuations. To solve this problem, the user adopts a TTL caching strategy, setting the TTL times for the two tables to 1 year and 1 day, respectively.

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```

For the dimension table, due to its smaller size and less variability, the user sets a TTL time of 1 year to ensure that its data can be accessed quickly within a year; for the fact table, the user needs to perform a table backup daily and then conduct a full import, so the TTL time is set to 1 day.
