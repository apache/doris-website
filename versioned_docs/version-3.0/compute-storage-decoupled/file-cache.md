---
{
    "title": "File Cache",
    "language": "en"
}
---

In a decoupled architecture, data is stored in remote storage. The Doris database accelerates data access by utilizing a cache on local disks and employs an advanced multi-queue LRU (Least Recently Used) strategy to efficiently manage cache space. This strategy particularly optimizes the access paths for indexes and metadata, aiming to maximize the caching of frequently accessed user data. For multi-compute group (Compute Group) scenarios, Doris also provides a cache warming feature to quickly load specific data (such as tables or partitions) into the cache when a new compute group is established, thereby enhancing query performance.

## Role of Cache

In a decoupled architecture, data is typically stored in remote storage systems, such as object storage S3, HDFS, etc. In this scenario, the Doris database can leverage local disk space as a cache to store some data locally, thereby reducing the frequency of access to remote storage,improving data access efficiency, and lowering operating costs.

Remote storage (such as object storage) usually has higher access latency and may be subject to constraints of QPS (queries per second) and bandwidth limits. For example, QPS limits on object storage can cause bottlenecks during high-concurrency queries, while network bandwidth limits can affect data transfer speeds. By using local file caching, Doris can store hot data on local disks, thereby significantly reducing query latency and enhancing query performance.

On the other hand, object storage services typically charge based on the number of requests and the amount of data transferred. Frequent access and large volumes of data downloads can increase query costs. Through caching mechanisms, the number of accesses and the amount of data transferred to object storage can be reduced, thereby lowering costs.

Doris's file cache typically caches the following two types of files in a decoupled architecture:

- Segment data files: The basic unit of data storage in Doris's internal tables. Caching these files can accelerate data read operations and enhance query performance.

- Inverted index files: Used to accelerate filtering operations in queries.By caching these files, data that meets query conditions can be located more quickly, further improving query efficiency and supporting complex query scenarios.

## Cache Configuration

Doris provides a range of configuration options to help users manage file caching flexibly. These configuration options include enabling/disabling caching, setting cache paths and sizes, configuring cache block sizes,enabling/disabling automatic cleanup,and pre-eviction mechanisms, among others. The detailed configuration instructions are as follows:

1. Enabling File Cache

```plaintext
enable_file_cache Default: "false"
```

Parameter Description: This configuration item controls whether the file cache function is enabled. If set to`true`, file caching is enabled; if set to`false`, file caching is disabled.

2. Configuring File Cache Paths and Sizes

```plaintext
file_cache_path Default: storage directory under the BE deployment path
```

Parameter Description: This configuration item specifies the path and size of the file cache. The format is a JSON array, with each element being a JSON object containing the following fields:

- `path`: The path where cache files are stored.
- `total_size`: The total size of the cache under this path (in bytes).
- `ttl_percent`: The proportion of the TTL queue(as a percentage).
- `normal_percent`: The proportion of the Normal queue(as a percentage).
- `disposable_percent`: The proportion of the Disposable queue (as a percentage).
- `index_percent`: The proportion of the Index queue (as a percentage).
- `storage`: The type of cache storage,which can be`disk`or`memory`. The default value is`disk`.

Example:
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

3. Automatic Cache Cleanup

```plaintext
clear_file_cache Default: "false"
```

Parameter Description: This configuration item controls whether to automatically clear cached data when BE restarts. If set to`true`, the cache will be automatically cleared each time BE restarts; if set to`false`, the cache will not be automatically cleared.

4. Pre-eviction Mechanism

```plaintext
enable_evict_file_cache_in_advance Default: "true"
```

- Parameter Description: This configuration item controls whether the pre-eviction mechanism is enabled. If set to`true`, when the cache space reaches a certain threshold, the system will proactively perform pre-eviction to free up space for future queries; if set to`false`, pre-eviction will not be performed.

```plaintext
file_cache_enter_need_evict_cache_in_advance_percent Default: "88"
```

- Parameter Description: This configuration item sets the threshold percentage for triggering pre-eviction. When the cache space/inode count reaches this percentage, the system begins pre-eviction.

```plaintext
file_cache_exit_need_evict_cache_in_advance_percent Default: "85"
```

- Parameter Description: This configuration item sets the threshold percentage for stopping pre-eviction. When the cache space drops to this percentage,the system stops pre-eviction.

## Cache Warm Up

Doris provides a cache warming feature that allows users to actively pull data from remote storage into the local cache. This feature supports the following three modes:


- **Inter-Compute Group Warming**: Warm the cache data of Compute Group A to Compute Group B. Doris periodically collects hotspot information of tables/partitions accessed in each compute group over a period and selectively warms certain tables/partitions based on this information.
- **Table Data Warming**: Specify to warm the data of Table A to the new compute group.
- **Partition Data Warming**: Specify to warm the data of partition `p1` of Table A to the new compute group.

For specific usage, please refer to the[WARM-UP SQL documentation](#).


## Cache Cleanup

Doris provides both synchronous and asynchronous cleanup methods:

- Synchronous Cleanup:The command is`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'`. When the command returns, it indicates that the cleanup is complete.When Doris needs to clear the cache immediately, it will synchronously delete the cache files in the local file system directory and clean up the management metadata in memory. This method can quickly free up space but may have a certain impact on the efficiency of ongoing queries and even system stability. It is usually used for quick testing.
- Asynchronous Cleanup: The command is`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'`. The command returns immediately,and the cleanup steps are executed asynchronously. During asynchronous cleanup, Doris traverses the management metadata in memory and deletes the corresponding cache files one by one. If it finds that some cache files are being used by queries, Doris will delay the deletion of these files until they are no longer in use. This method can reduce the impact on ongoing queries but usually takes longer to completely clean up the cache compared to synchronous cleanup.

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

| Metric Name (excluding path prefix)          | Meaning                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| file_cache_cache_size                        | Current total size of the File Cache                         |
| file_cache_disposable_queue_cache_size       | Current size of the disposable queue                         |
| file_cache_disposable_queue_element_count    | Current number of elements in the disposable queue           |
| file_cache_disposable_queue_evict_size       | Total amount of data evicted from the disposable queue since startup |
| file_cache_index_queue_cache_size            | Current size of the index queue                              |
| file_cache_index_queue_element_count         | Current number of elements in the index queue                |
| file_cache_index_queue_evict_size            | Total amount of data evicted from the index queue since startup |
| file_cache_normal_queue_cache_size           | Current size of the normal queue                             |
| file_cache_normal_queue_element_count        | Current number of elements in the normal queue               |
| file_cache_normal_queue_evict_size           | Total amount of data evicted from the normal queue since startup |
| file_cache_total_evict_size                  | Total amount of data evicted from the entire File Cache since startup |
| file_cache_ttl_cache_evict_size              | Total amount of data evicted from the TTL queue since startup |
| file_cache_ttl_cache_lru_queue_element_count | Current number of elements in the TTL queue                  |
| file_cache_ttl_cache_size                    | Current size of the TTL queue                                |
| file_cache_evict_by_heat\_[A]\_to\_[B]       | Data from cache type A evicted due to cache type B (time-based expiration) |
| file_cache_evict_by_size\_[A]\_to\_[B]       | Data from cache type A evicted due to cache type B (space-based expiration) |
| file_cache_evict_by_self_lru\_[A]            | Data from cache type A evicted by its own LRU policy for new data |

### SQL Profile

Cache-related metrics in the SQL profile are found under SegmentIterator, including:

| Metric Name            | Meaning                                                      |
| ---------------------- | ------------------------------------------------------------ |
| BytesScannedFromCache  | Amount of data read from the File Cache                      |
| BytesScannedFromRemote | Amount of data read from remote storage                      |
| BytesWriteIntoCache    | Amount of data written into the File Cache                   |
| LocalIOUseTimer        | Time taken to read from the File Cache                       |
| NumLocalIOTotal        | Number of times the File Cache was read                      |
| NumRemoteIOTotal       | Number of times remote storage was read                      |
| NumSkipCacheIOTotal    | Number of times data read from remote storage did not enter the File Cache |
| RemoteIOUseTimer       | Time taken to read from remote storage                       |
| WriteCacheIOUseTimer   | Time taken to write to the File Cache                        |

You can view query performance analysis through [Query Performance Analysis](../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile).



## TTL Usage

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


## Practical Case

A user has a series of data tables with a total data volume exceeding 3TB, while the available cache capacity is only 1.2TB. Among them, there are two tables with high access frequency: one is a dimension table of size 200MB (`dimension_table`), and the other is a fact table of size 100GB (`fact_table`), which has new data imported daily and requires T+1 query operations. Additionally, other large tables have low access frequency.

Under the LRU caching strategy, if large table data is queried, it may replace the small table data that needs to remain in the cache, causing performance fluctuations. To solve this problem, the user adopts a TTL caching strategy, setting the TTL times for the two tables to 1 year and 1 day, respectively.

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```

For the dimension table, due to its smaller size and less variability, the user sets a TTL time of 1 year to ensure that its data can be accessed quickly within a year; for the fact table, the user needs to perform a table backup daily and then conduct a full import, so the TTL time is set to 1 day.
