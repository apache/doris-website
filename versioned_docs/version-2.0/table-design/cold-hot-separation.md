---
{
"title": "Tiered Storage",
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

## Use Case

One significant use case in the future is similar to ES log storage, where data in the log scenario is split based on dates. Many of the data are cold data with infrequent queries, requiring a reduction in storage costs for such data. Considering cost-saving:

- The pricing of regular cloud disks from various vendors is more expensive than object storage.

- In actual online usage of the Doris Cluster, the utilization of regular cloud disks cannot reach 100%.

- Cloud disks are not billed on demand, while object storage can be billed on demand.

- Using regular cloud disks for high availability requires multiple replicas and replica migration in case of failures. In contrast, storing data on object storage eliminates these issues as it is shared.

## Solution

Set the freeze time at the partition level, which indicates how long a partition will be frozen, and define the location of remote storage for storing data after freezing. In the BE (Backend) daemon thread, the table's freeze condition is periodically checked. If a freeze condition is met, the data will be uploaded to object storage compatible with the S3 protocol and HDFS.

Cold-hot tiering supports all Doris functionalities and only moves some data to object storage to save costs without sacrificing functionality. Therefore, it has the following characteristics:

- Cold data is stored on object storage, and users do not need to worry about data consistency and security.

- Flexible freeze strategy, where the cold remote storage property can be applied to both table and partition levels.

- Users can query data without worrying about data distribution. If the data is not local, it will be pulled from the object storage and cached locally in the BE (Backend).

- Replica clone optimization. If the stored data is on object storage, there is no need to fetch the stored data locally during replica cloning.

- Remote object space recycling. If a table or partition is deleted or if space waste occurs during the cold-hot tiering process due to exceptional situations, a recycler thread will periodically recycle the space, saving storage resources.

- Cache optimization, caching accessed cold data locally in the BE to achieve query performance similar to non-cold-hot tiering.

- BE thread pool optimization, distinguishing between data sources from local and object storage to prevent delays in reading objects from impacting query performance.

## Usage of Storage Policy

The storage policy is the entry point for using the cold-hot tiering feature. Users only need to associate the storage policy with a table or partition during table creation or when using Doris.

:::tip
When creating an S3 resource, a remote S3 connection validation is performed to ensure the correct creation of the resource.
:::

Here is an example of creating an S3 resource:

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000"
);

CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);

CREATE TABLE IF NOT EXISTS create_table_use_created_policy 
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning Notice
If you set `"enable_unique_key_merge_on_write" = "true"` in UNIQUE table, you can't use this feature.
:::

And here is an example of creating an HDFS resource:

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="fs_host:default_fs_port",
        "hadoop.username"="hive",
        "hadoop.password"="hive",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );

CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
)

CREATE TABLE IF NOT EXISTS create_table_use_created_policy (
    k1 BIGINT,
    k2 LARGEINTv1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning Notice
If you set `"enable_unique_key_merge_on_write" = "true"` in UNIQUE table, you can't use this feature.
:::

Associate a storage policy with an existing table by using the following command:

```sql
ALTER TABLE create_table_not_have_policy SET ("storage_policy" = "test_policy");
```

Associate a storage policy with an existing partition by using the following command:

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET ("storage_policy" = "test_policy");
```

:::tip
If you specify different storage policies for the entire table and some partitions during table creation, the storage policy set for the partitions will be ignored, and all partitions of the table will use the table's storage policy. If you want a specific partition to have a different storage policy than the others, you can use the method mentioned above to modify the association for that specific partition.

For more details, please refer to the following documents in the Docs directory: [RESOURCE](../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-RESOURCE), [POLICY](../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY), [CREATE TABLE](../sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE), [ALTER TABLE](../sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN), which provide detailed explanations.
:::

### Limitations

- A single table or partition can only be associated with one storage policy. Once associated, the storage policy cannot be dropped without first removing the association between them.

- The object information associated with a storage policy does not support modifying the data storage path, such as bucket, endpoint, root_path, and other information.

- Storage policies support creation, modification, and deletion. Before deleting a storage policy, ensure that no tables are referencing the storage policy.

- When the Merge-on-Write feature is enabled, the Unique model does not support setting a storage policy.


## Occupied Size of Cold Data Objects

Method 1: You can use the `show proc '/backends'` command to view the size of each backend's uploaded objects. Look for the `RemoteUsedCapacity` field. Please note that this method may have some latency.

Method 2: You can use the `show tablets from tableName` command to view the size of each tablet in a table, indicated by the `RemoteDataSize` field.

## Cache for Cold Data

As mentioned earlier, caching is introduced for cold data to optimize query performance and save object storage resources. When cold data is first accessed after cooling, Doris reloads the cooled data onto the local disk of the backend (BE). The cold data cache has the following characteristics:

- The cache is stored on the BE's disk and does not occupy memory space.

- The cache can be limited in size and uses LRU (Least Recently Used) for data eviction.

- The implementation of the cache for cold data is the same as the cache for federated query catalog. Please refer to the documentation at [Filecache](../lakehouse/filecache) for more details.

## Compaction of Cold Data

The time at which cold data enters is counted from the moment the data rowset file is written to the local disk, plus the cooling duration. Since data is not written and cooled all at once, Doris performs compaction on cold data to avoid the issue of small files within object storage. However, the frequency and resource prioritization of cold data compaction are not very high. It is recommended to perform compaction on local hot data before cooling. You can adjust the following BE parameters:

- The BE parameter `cold_data_compaction_thread_num` sets the concurrency for cold data compaction. The default value is 2.

- The BE parameter `cold_data_compaction_interval_sec` sets the time interval for cold data compaction. The default value is 1800 seconds (30 minutes).

## Schema Change for Cold Data

The following schema change types are supported for cold data:

- Adding or deleting columns

- Modifying column types

- Adjusting column order

- Adding or modifying indexes

## Garbage Collection of Cold Data

Garbage data for cold data refers to data that is not used by any replica. The following situations may generate garbage data on object storage:

1. Partial segment upload succeeds while the upload of the rowset fails.

2. After the FE reselects the CooldownReplica, the rowset versions of the old and new CooldownReplica do not match. FollowerReplicas synchronize the CooldownMeta of the new CooldownReplica, and the rowsets with inconsistent versions in the old CooldownReplica become garbage data.

3. After cold data compaction, the rowsets before merging cannot be immediately deleted because they may still be used by other replicas. However, eventually, all FollowerReplicas use the latest merged rowset, and the rowsets before merging become garbage data.

Furthermore, the garbage data on objects is not immediately cleaned up. The BE parameter `remove_unused_remote_files_interval_sec` sets the time interval for garbage collection of cold data. The default value is 21600 seconds (6 hours).

## TODOs

- Some remote occupancy metrics may not have comprehensive update retrieval.

## FAQs

1. `ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository: connect to s3 failed: Unable to marshall request to JSON: host must not be null.`

The S3 SDK defaults to using the virtual-hosted style. However, some object storage systems (e.g., MinIO) may not have virtual-hosted style access enabled or supported. In such cases, you can add the `use_path_style` parameter to force the use of path-style access:

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000",
    "use_path_style" = "true"
);
```
