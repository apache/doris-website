---
{
    "title": "File Cache",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

In the compute-storage decoupled mode, data is stored on remote storage. To accelerate data access, Doris implements a cache mechanism based on local disks and provides two efficient cache management strategies: the LRU (Least Recently Used) strategy and the TTL (Time-to-Live) strategy. It optimizes the index-related data, aiming to cache the data most commonly used by users as much as possible.

In use cases involving multiple compute clusters, Doris provides cache warmup. When a new compute cluster is established, users can choose to warm up specific data (such as tables or partitions) to improve query efficiency.

## Cache space management

### Data cache

Data enters the cache in the following three ways:

- **Import**: Newly imported data will be asynchronously written to the cache to accelerate first-time access.
- **Query**: If the data requested by a query is not in the cache, the system will read the data from the remote storage into memory and write it to the cache simultaneously to speed up subsequent queries.
- **Warmup**: Although the data in the remote storage can be shared across multiple compute clusters, the cached data is not shared. When a new compute cluster is created, the cache for it is empty. In this case, users can manually warm up the cache, which means pulling the required data from the remote storage to the local cache.

### Cache eviction

Doris supports two cache management strategies: LRU and TTL.

- **LRU (Least Recently Used)**: As the default strategy, LRU manages data by maintaining a queue. If certain data in the queue is accessed, that piece of data will be moved to the front of the queue. New data written to the cache will also be placed at the front of the queue to avoid being evicted too early. If the cache space is full, the data at the tail of the queue will be prioritized for eviction.
- **TTL (Time-to-Live)**: The TTL strategy is to ensure that newly imported data is retained in the cache for a certain period of time. The time when such data is evicted from the cache depends on its import time and the TTL value set by the user. Data under TTL has the highest priority in the cache and is treated equally. When the cache is full, the system will evict data from the LRU queue to ensure that new TTL data can be written to the cache. Additionally, all data set with TTL will be treated equally despite differences in eviction time. When TTL data occupies the entire cache space, neither newly imported data (whether set with TTL or not) nor cold data pulled from the remote storage will be written to the cache.
  -  The TTL strategy can be applied to small data tables that are supposed to be persisted locally. It is recommended to set a relatively large TTL value for such tables to ensure that their data in the cache will not be evicted prematurely due to query operations on other large data tables.

  -  For tables using a dynamic partitioning strategy, it is recommended to set a TTL value based on how long their hot partitions remain active. This can ensure the retention of hot partition data in the cache and avoid it being affected by queries on cold partitions.

  -  Currently, the system does not support directly viewing the proportion of TTL data in the cache.

### Cache warmup

In the compute-storage decoupled mode, Doris supports multiple compute clusters, with the stored data shared across the clusters but not the cache. When a new compute cluster is created, its cache is initially empty, which may impact query performance. To address this, Doris provides cache warmup that allows users to actively pull data from the remote storage to the local cache. Currently, it supports cache warmup from:

- **Compute cluster**: Warm up the cache of compute cluster B with the cached data from compute cluster A. Doris periodically collects information of the hot tables/partitions accessed by each compute cluster over a period of time and stores it as an internal table. Based on such information, it selectively pulls data from certain tables/partitions to the cache during cache warmup.
- **Table**: Warm up the cache of a new compute cluster with data from table A.
- **Partition**: Warm up the cache of a new compute cluster with data from partition `p1` of table A.

## Usage

### Set TTL strategy

To apply the TTL strategy for a table, set the TTL strategy in the PROPERTIES of the table creation statement. 

- `file_cache_ttl_seconds`: The expected time (measured in seconds) for newly imported data to be retained in the cache.

```Bash
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

All newly imported data into this table will be retained in the cache for 300 seconds. Users can modify the TTL time of a table based on their needs. 

```SQL
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```

:::info 

There is a certain delay before the modified TTL value takes effect.

For tables that are not set with a TTL strategy upon creation, users can still modify their TTL properties by executing the ALTER statement.

:::

### Cache warmup

The system currently supports three types of cache warmup:

- Warm up the cache of compute cluster `cluster_name1` with the cached data from compute cluster `cluster_name0`.

When the following SQL is executed, `cluster_name1` will retrieve the access information from `cluster_name0` to recreate a cache as consistent as possible with `cluster_name0`.

```Plain
warm up cluster cluster_name1 with cluster cluster_name0
```

View the most frequently accessed tables across all compute clusters.

```Plain
show cache hotspot '/';
+------------------------+-----------------------+----------------------------------------+
| cluster_name           | total_file_cache_size | top_table_name                         |
+------------------------+-----------------------+----------------------------------------+
| cluster_name0          |          751620511367 | regression_test.doris_cache_hotspot    |
+------------------------+-----------------------+----------------------------------------+
```

View the most frequently accessed partitions within the compute cluster `cluster_name0`.

```Plain
mysql> show cache hotspot '/cluster_name0';
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

View the access information of table `regression_test_cloud_load_copy_into_tpch_sf1_p1.customer`) in `cluster_name0`.

```Plain
show cache hotspot '/cluster_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer';
+----------------+---------------------+
| partition_name | last_access_time    |
+----------------+---------------------+
| supplier       | 2023-06-06 10:56:12 |
+----------------+---------------------+
```

- Warm up the cache of `cluster_name1` with data from table `customer`. Execute the following SQL statement to pull all the data of this table from the remote storage to the local cache:

```Plain
warm up cluster cluster_name1 with table customer
```

- Warm up the cache of `cluster_name1` with data from partition `p1` of table `customer`. Execute the following SQL statement to pull all the data of this partition from the remote storage to the local cache:

```Plain
warm up cluster cluster_name1 with table customer partition p1
```

All three of the above cache warmup SQL statements will return a `JobID` result. For example:

```Plain
mysql> warm up cluster cloud_warm_up with table test_warm_up;
+-------+
| JobId |
+-------+
| 13418 |
+-------+
1 row in set (0.01 sec)
```

Check the progress of the cache warmup using the following SQL:

```Plain
SHOW WARM UP JOB;
SHOW WARM UP JOB WHERE ID = 13418;
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| JobId | ClusterName       | Status  | Type  | CreateTime              | FinishBatch | AllBatch | FinishTime |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
| 13418 | cloud_warm_up     | RUNNING | TABLE | 2023-05-30 20:19:34.059 | 0           | 1        | NULL       |
+-------+-------------------+---------+-------+-------------------------+-------------+----------+------------+
1 row in set (0.02 sec)
```

The cache warmup progress can be shown by `FinishBatch` and `AllBatch`. Each batch of data is approximately 10GB in size. Currently, within a single compute cluster, only one cache warmup job can be executed at a time. Users can stop an ongoing cache warmup job if needed.

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

## Best practice

A user has a total data volume of over 3TB, but the available cache capacity is only 1.2TB. Two of the tables are frequently accessed: one is a 200MB dimension table, the other is a 100GB fact table. The latter has new data imported every day and is queried on a daily basis. Additionally, the user has other large tables that are queried from time to time.

Under the LRU strategy, if a large table is queried and accessed, its data will replace that of the small table in the cache, causing performance fluctuations. To solve this, the user adopts a TTL strategy, setting the TTL time of the dimension table and fact table to 1 year and 1 day, respectively. 

```Bash
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```

For the dimension table, due to its small data volume and infrequent data changes, the user sets a TTL time of up to 1 year to ensure that its data can be accessed quickly within a long time. For the fact table, the user needs to perform a daily table backup and then a full import, so its TTL time is set to 1 day.
