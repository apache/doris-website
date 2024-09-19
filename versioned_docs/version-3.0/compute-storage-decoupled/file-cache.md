---
{
    "title": "File Cache",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

In a decoupled architecture of storage and computation, data is stored on remote storage. To accelerate data access, Doris implements a local disk-based caching mechanism and provides two efficient cache management strategies: LRU (Least Recently Used) and TTL (Time to Live) strategies, optimizing index-related data to maximize the caching of frequently used user data.

In scenarios involving multiple compute groups, Doris offers a cache warming feature. When a new compute group is established, users can choose to pre-warm specific data (such as tables or partitions) to improve query efficiency.

## Cache Types

File Cache is divided into three types: TTL, LRU, and Disposable. Various operations read will check all types for hits by default, but the types of operations that write to File Cache differ.

| Operation      | Type of File Cache for Missed Data Entry | Type of Data Written to File Cache | Read Data Using Cache |
|----------------|------------------------------------------|------------------------------------|-----------------------|
| Import         | TTL / LRU (insert into ... from select) | TTL / LRU                          | ALL                   |
| Query          | TTL / LRU                                | N/A                                | ALL                   |
| Schema Change   | Disposable                               | TTL / LRU                          | ALL                   |
| Compaction     | Disposable                               | TTL / LRU                          | ALL                   |
| Pre-warm       | N/A                                      | TTL / LRU                          | ALL                   |

## Cache Strategies

Doris provides two main cache management strategies: LRU (Least Recently Used) and TTL (Time to Live). These strategies aim to optimize data access efficiency and cache usage, ensuring the system maintains good performance under high load.

### LRU Strategy

The LRU strategy is the default cache management strategy. It manages cached data by maintaining a queue. When a piece of data in the queue is accessed, it is moved to the front of the queue. Newly written data to the cache is also placed at the front of the queue to avoid premature eviction. When the cache space is full, data at the tail of the queue will be prioritized for eviction.

### TTL Strategy

The TTL strategy ensures that newly imported data is retained in the cache for a certain period (expiration time = import time + set timeout). Under the TTL strategy, data in the cache has the highest priority, and all TTL data are treated equally. When the cache is full, the system will evict data from the LRU queue to ensure that TTL data can be written to the cache.

*Application Scenarios*
- The TTL strategy is suitable for small-scale data tables that are expected to be persisted locally. For resident tables, a larger TTL value can be set to ensure that their data is not prematurely evicted due to queries from other large data tables.
- For data tables using a dynamic partitioning strategy, the TTL value can be set according to the active time of the Hot Partition to ensure the retention of Hot Partition data in the cache.

*Notes*
- Currently, the system does not support directly viewing the proportion of TTL data in the cache.

## Cache Eviction

### Eviction Steps

When Cache space is insufficient, Doris adopts the following steps to evict data from various types of Cache until enough space is freed.

1. Evict expired data from disposable and LRU caches. Expired data refers to cached data that has exceeded the specified validity period since the last access. The validity periods for LRU and Disposable caches are:
   - LRU Index Cache: 7 days
   - LRU Normal Data: 1 day
   - LRU Disposable (Temporary Data): 1 hour

2. If the `file_cache_enable_evict_from_other_queue_by_size` switch is enabled and the current queue's cache size and count are within limits (this limit can be set via `file_cache_path`, with a default limit of 85% of total File Cache capacity), data can be forcibly evicted from the Disposable type.

3. Release its own data according to the LRU strategy.

*Note*

Data in TTL will move to LRU after expiration and will be evicted according to LRU.

### TTL Eviction

TTL type caches have the highest priority in cache management and can preempt space from other caches until the remaining space meets requirements.

- To ensure the survival space of other cache types, the preemption of TTL is limited, meaning TTL cannot exceed 90% of total Cache capacity (this can be specified by the `be` configuration `max_ttl_cache_ratio`). If this limit is exceeded, no data from other cache types will be evicted.
- If the switch for TTL to support LRU eviction strategy is enabled (`be` configuration `enable_ttl_cache_evict_using_lru = true`), then TTL can evict its own data according to LRU; otherwise, no data will be evicted, which may cause access to skip File Cache and directly access remote data, affecting performance.
- The TTL type cache has a background thread that asynchronously scans the expiration time of TTL. If expired, it will be downgraded to Normal and deleted according to the above Normal eviction order.

### Deletion Eviction

When a file is deleted, its data in the cache will also be evicted.

## Cache Pre-warming

In a decoupled storage and computation model, Doris supports multi-compute group deployment, where compute groups share data but do not share cache. When a new compute group is created, its cache is empty, which may affect query performance. To address this, Doris provides a cache warming feature that allows users to actively pull data from remote storage to local cache. This feature supports the following three modes:

- **Inter-compute Group Pre-warming**: Pre-warm the cache data of compute group A to compute group B. Doris periodically collects hotspot information of tables/partitions accessed in each compute group over a period and selectively pre-warms certain tables/partitions based on this information.
- **Table Data Pre-warming**: Specify to pre-warm the data of table A to the new compute group.
- **Partition Data Pre-warming**: Specify to pre-warm the data of partition `p1` of table A to the new compute group.

## Cache Observation

### Hotspot Information

Doris collects hotspot information of caches from each compute group every 10 minutes into an internal system table, which can be viewed using the `SHOW CACHE HOTSPOT '/'` command.

### Cache Space and Hit Rate

Doris BE nodes obtain cache statistics through `curl {be_ip}:{brpc_port}/vars (brpc_port defaults to 8060)`, where the names of the metric items start with the disk path.

In the above example, the prefix for metrics is the path of File Cache, for example, the prefix "_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_" indicates "/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/"
The part after the prefix is the statistical metric, for example, "file_cache_cache_size" indicates that the current size of File Cache at this path is 26111 bytes.

The following table lists the meanings of all metrics (the size units below are in bytes):

Metric Name (excluding path prefix) | Meaning
-----|------
file_cache_cache_size | Current total size of File Cache
file_cache_disposable_queue_cache_size | Current size of disposable queue
file_cache_disposable_queue_element_count | Current number of elements in the disposable queue
file_cache_disposable_queue_evict_size | Total amount of data evicted from the disposable queue since startup
file_cache_index_queue_cache_size | Current size of index queue
file_cache_index_queue_element_count | Current number of elements in the index queue
file_cache_index_queue_evict_size | Total amount of data evicted from the index queue since startup
file_cache_normal_queue_cache_size | Current size of normal queue
file_cache_normal_queue_element_count | Current number of elements in the normal queue
file_cache_normal_queue_evict_size | Total amount of data evicted from the normal queue since startup
file_cache_total_evict_size | Total amount of data evicted from the entire File Cache since startup
file_cache_ttl_cache_evict_size | Total amount of data evicted from the TTL queue since startup
file_cache_ttl_cache_lru_queue_element_count | Current number of elements in the TTL queue
file_cache_ttl_cache_size | Current size of TTL queue

### SQL Profile

Cache-related metrics in the SQL profile are under SegmentIterator, including:

| Metric Name                     | Meaning      |
|----------------------------------|-------------|
| BytesScannedFromCache            | Amount of data read from File Cache    |
| BytesScannedFromRemote           | Amount of data read from remote storage   |
| BytesWriteIntoCache              | Amount of data written to File Cache     |
| LocalIOUseTimer                  | Time taken to read from File Cache       |
| NumLocalIOTotal                  | Number of times File Cache was read      |
| NumRemoteIOTotal                 | Number of times remote storage was read   |
| NumSkipCacheIOTotal              | Number of times data read from remote storage did not enter File Cache |
| RemoteIOUseTimer             | Time taken to read from remote storage     |
| WriteCacheIOUseTimer         | Time taken to write to File Cache     |

You can view query performance analysis by [query analysis](../query/query-analysis/query-analytics).

## Usage

### Setting TTL Strategy

When creating a table, set the corresponding PROPERTY to cache the data of that table using the TTL strategy.

- `file_cache_ttl_seconds` : The expected duration for which newly imported data should be retained in the cache, in seconds.

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

In the above table, all newly imported data will be retained in the cache for 300 seconds. The system currently supports modifying the TTL time for a table, allowing users to extend or shorten the TTL time as needed.

```SQL
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```

:::info Note

The modified TTL value will not take effect immediately but will have a certain delay.

If the TTL was not set when the table was created, users can also modify the TTL property of the table by executing an ALTER statement.

### Cache Pre-warming

Three cache pre-warming modes are currently supported:

- Pre-warm the cache data of `compute_group_name0` to `compute_group_name1`.

When executing the following SQL, `compute_group_name1` compute group will obtain the access information from `compute_group_name0` compute group to try to restore the same cache as `compute_group_name0` compute group.

```Plain
warm up cluster compute_group_name1 with cluster compute_group_name0
```

View the most frequently accessed tables across all compute groups.

```Plain
show cache hotspot '/';
+------------------------+-----------------------+----------------------------------------+
| compute_group_name           | total_file_cache_size | top_table_name                         |
+------------------------+-----------------------+----------------------------------------+
| compute_group_name0          |          751620511367 | regression_test.doris_cache_hotspot    |
+------------------------+-----------------------+----------------------------------------+
```

View the most frequently accessed partitions of all tables under `compute_group_name0`.

```Plain
mysql> show cache hotspot '/compute_group_name0';
+-----------------------------------------------------------+---------------------+--------------------+
| table_name                                                | last_access_time    | top_partition_name |
+-----------------------------------------------------------+---------------------+--------------------+
| regression_test.doris_cache_hotspot                       | 2023-05-29 12:38:02 | p20230529          |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.customer | 2023-06-06 10:56:12 | customer           |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.nation   | 2023-06-06 10:56:12 | nation             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.orders   | 2023-06-06 10:56:12 | orders             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.part     | 2023-06-06 10:56:12 | part               |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.partsupp | 2023-06-06 10:56:12 | partsupp           |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.region   | 2023-06-06 10:56:12 | region             |
| regression_test_cloud_load_copy_into_tpch_sf1_p1.supplier | 2023-06-06 10:56:12 | supplier           |
+-----------------------------------------------------------+---------------------+--------------------+
```

View the access information of table `regression_test_cloud_load_copy_into_tpch_sf1_p1.customer` under `compute_group_name0`.

```Plain
show cache hotspot '/compute_group_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer';
+----------------+---------------------+
| partition_name | last_access_time    |
+----------------+---------------------+
| supplier       | 2023-06-06 10:56:12 |
+----------------+---------------------+
```

- Pre-warm the data of table `customer` to `compute_group_name1`. Executing the following SQL will pull all the data of this table from remote storage to local.

```Plain
warm up cluster compute_group_name1 with table customer
```

- Pre-warm the data of partition `p1` of table `customer` to `compute_group_name1`. Executing the following SQL will pull all the data of this partition from remote storage to local.

```Plain
warm up cluster compute_group_name1 with table customer partition p1
```

The above three cache pre-warming SQLs will return a JobID result. For example:

```Plain
mysql> warm up cluster cloud_warm_up with table test_warm_up;
+-------+
| JobId |
+-------+
| 13418 |
+-------+
1 row in set (0.01 sec)
```

Then you can view the cache pre-warming progress using the following SQL.

```Plain
SHOW WARM UP JOB; // Get Job information
SHOW WARM UP JOB WHERE ID = 13418; // Specify JobID
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| JobId | ComputeGroup       | Status  | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| 13418 | cloud_warm_up     | RUNNING | TABLE | 2023-05-30 20:19:34.059 | 0           | 1        | NULL       |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
1 row in set (0.02 sec)
```

You can determine the current task progress based on `FinishBatch` and `AllBatch`, with each Batch containing approximately 10GB of data. Currently, only one pre-warming Job can be executed at a time in a compute group. Users can stop the currently running pre-warming Job.

```Plain
mysql> cancel warm up job where id = 13418;
Query OK, 0 rows affected (0.02 sec)

mysql> show warm up job where id = 13418;
+-------+-------------------+-----------+-------+-------------------------+-------------+----------+-------------------------+
| JobId | ClusterName       | Status    | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime              |
+-------+-------------------+-----------+-------+-------------------------+-------------+----------+-------------------------+
| 13418 | cloud_warm_up     | CANCELLED | TABLE | 2023-05-30 20:19:34.059 | 0           | 1        | 2023-05-30 20:27:14.186 |
+-------+-------------------+-----------+-------+-------------------------+-------------+----------+-------------------------+
1 row in set (0.00 sec)
```

## Practical Examples

A user has a series of data tables with a total data volume of over 3TB, while the available cache capacity is only 1.2TB. Among these, two tables have high access frequency: one is a 200MB dimension table (`dimension_table`), and the other is a 100GB fact table (`fact_table`), which has new data imported daily and requires T+1 query operations. Other large tables have low access frequency.

Under the LRU cache strategy, if large table data is queried and accessed, it may replace the small table data that needs to be resident in the cache, causing performance fluctuations. To solve this problem, the user adopts the TTL cache strategy and sets the TTL time for the two tables to 1 year and 1 day, respectively.

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```

For the dimension table, since its data volume is small and changes infrequently, the user sets a TTL time of 1 year to ensure that its data can be quickly accessed within a year; for the fact table, the user needs to perform a full table backup and then full import every day, so the TTL time is set to 1 day.
