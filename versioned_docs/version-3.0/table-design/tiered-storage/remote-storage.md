---
{
"title": "Remote Storage",
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

### Feature Overview

Remote storage supports placing some data in external storage (such as object storage or HDFS), which saves costs without sacrificing functionality.

:::warning Note
Data in remote storage only has one replica. The reliability of the data depends on the reliability of the remote storage. You need to ensure that the remote storage employs EC (Erasure Coding) or multi-replica technology to guarantee data reliability.
:::

### Usage Guide

Using S3 object storage as an example, start by creating an S3 RESOURCE:

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
```

:::tip
When creating the S3 RESOURCE, a remote connection check will be performed to ensure the resource is created correctly.
:::

Next, create a STORAGE POLICY and associate it with the previously created RESOURCE:

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

Finally, specify the STORAGE POLICY when creating a table:

```sql
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

:::warning
If the UNIQUE table has `"enable_unique_key_merge_on_write" = "true"`, this feature cannot be used.
:::

Create an HDFS RESOURCE:

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
);

CREATE TABLE IF NOT EXISTS create_table_use_created_policy (
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

:::warning
If the UNIQUE table has `"enable_unique_key_merge_on_write" = "true"`, this feature cannot be used.
:::

In addition to creating tables with remote storage, Doris also supports setting remote storage for existing tables or partitions.

For an existing table, associate a remote storage policy by running:

```sql
ALTER TABLE create_table_not_have_policy set ("storage_policy" = "test_policy");
```

For an existing PARTITION, associate a remote storage policy by running:

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="test_policy");
```

:::tip
Note that if you specify different storage policies for the entire table and certain partitions, the storage policy of the table will take precedence for all partitions. If you need a partition to use a different storage policy, you can modify it using the method above for existing partitions.
:::

For more details, please refer to the documentation in the **Docs** directory, such as [RESOURCE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-RESOURCE), [POLICY](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-POLICY), [CREATE TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-TABLE), and [ALTER TABLE](../../sql-manual/sql-statements/Data-Definition-Statements/Alter/ALTER-TABLE-COLUMN), which provide detailed explanations.

### Limitations

- A single table or partition can only be associated with one storage policy. Once associated, the storage policy cannot be dropped until the association is removed.

- The storage path information associated with a storage policy (e.g., bucket, endpoint, root_path) cannot be modified after the policy is created.

- Storage policies support creation, modification, and deletion. However, before deleting a policy, you need to ensure that no tables are referencing this storage policy.

- The Unique model with Merge-on-write enabled may face restrictions... 

## Viewing Remote Storage Usage

Method 1: You can view the size uploaded to the object storage by each BE by using `show proc '/backends'`, specifically the `RemoteUsedCapacity` item. Note that this method may have some delay.

Method 2: You can view the object size used by each tablet of a table by using `show tablets from tableName`, specifically the `RemoteDataSize` item.

## Remote Storage Cache

To optimize query performance and save object storage resources, the concept of cache is introduced. When querying data from remote storage for the first time, Doris will load the data from remote storage to the BE's local disk as a cache. The cache has the following characteristics:

- The cache is stored on the BE's disk and does not occupy memory space.
- The cache can be limited in size, with data cleanup performed using an LRU (Least Recently Used) policy.
- The implementation of the cache is the same as the federated query catalog cache. For more information, refer to the [documentation](../../lakehouse/filecache).

## Remote Storage Compaction

The data in remote storage is considered to be "ingested" at the moment the rowset file is written to the local disk, plus the cooldown time. Since data is not written and cooled all at once, to avoid the small file problem in object storage, Doris will perform compaction on remote storage data. However, the frequency and priority of remote storage compaction are not very high. It is recommended to perform compaction on local hot data before executing cooldown. The following BE parameters can be adjusted:

- The BE parameter `cold_data_compaction_thread_num` sets the concurrency for performing compaction on remote storage. The default value is 2.
- The BE parameter `cold_data_compaction_interval_sec` sets the time interval for executing remote storage compaction. The default value is 1800 seconds (30 minutes).

## Remote Storage Schema Change

Remote storage schema changes are supported. These include:

- Adding or removing columns
- Modifying column types
- Adjusting column order
- Adding or modifying indexes

## Remote Storage Garbage Collection

Remote storage garbage data refers to data that is not being used by any replica. Garbage data may occur on object storage in the following cases:

1. Rowsets upload fails but some segments are successfully uploaded.
2. The FE re-selects a CooldownReplica, causing an inconsistency between the rowset versions of the old and new CooldownReplica. FollowerReplicas synchronize the CooldownMeta of the new CooldownReplica, and the rowsets with version mismatches in the old CooldownReplica become garbage data.
3. After a remote storage compaction, the rowsets before merging cannot be immediately deleted because they may still be used by other replicas. Eventually, once all FollowerReplicas use the latest merged rowset, the pre-merge rowsets become garbage data.

Additionally, garbage data on objects will not be cleaned up immediately. The BE parameter `remove_unused_remote_files_interval_sec` sets the time interval for remote storage garbage collection, with a default value of 21600 seconds (6 hours).

## Common Issues

1. `ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository: connect to s3 failed: Unable to marshall request to JSON: host must not be null.`

   The S3 SDK uses the virtual-hosted style access method by default. However, some object storage systems (such as MinIO) may not have virtual-hosted style access enabled or supported. In this case, you can add the `use_path_style` parameter to force path-style access:

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