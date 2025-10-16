---
{
    "title": "Remote Storage",
    "language": "en-US"
}
---

## Overview

Remote storage supports placing cold data in external storage (such as object storage, HDFS).

:::warning Note
The data in remote storage has only one copy, and the reliability of the data depends on the reliability of the remote storage. You need to ensure that the remote storage has erasure coding (EC) or multi-replica technology to ensure data reliability.
:::

## Usage

### Saving Cold Data to S3 Compatible Storage

*Step 1:* Create S3 Resource.

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
When creating the S3 RESOURCE, a link verification to the S3 remote will be performed to ensure the correctness of the RESOURCE creation.
:::

*Step 2:* Create STORAGE POLICY.

Then create a STORAGE POLICY associated with the RESOURCE created above:

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

*Step 3:* Use STORAGE POLICY when creating a table.

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

:::warning Note
If the UNIQUE table is set with `"enable_unique_key_merge_on_write" = "true"`, this feature cannot be used.
:::

### Saving Cold Data to HDFS

*Step 1:* Create HDFS RESOURCE:

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
        "type"="hdfs",
        "fs.defaultFS"="fs_host:default_fs_port",
        "hadoop.username"="hive",
        "hadoop.password"="hive",
        "root_path"="/my/root/path",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
```

*Step 2:* Create STORAGE POLICY.

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
)
```

*Step 3:* Use STORAGE POLICY to create a table.

```sql
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

:::warning Note
If the UNIQUE table is set with `"enable_unique_key_merge_on_write" = "true"`, this feature cannot be used.
:::

### Cooling Existing Tables to Remote Storage

In addition to new tables supporting the setting of remote storage, Doris also supports setting remote storage for an existing table or PARTITION.

For an existing table, set remote storage by associating the created STORAGE POLICY with the table:

```sql
ALTER TABLE create_table_not_have_policy set ("storage_policy" = "test_policy");
```

For an existing PARTITION, set remote storage by associating the created STORAGE POLICY with the PARTITION:

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="test_policy");
```

:::tip
Note that if the user specifies different Storage Policies for the entire Table and some Partitions when creating the table, the Storage Policy set for the Partition will be ignored, and all Partitions of the table will use the table's Policy. If you need a Partition's Policy to differ from others, you can modify it using the method described above for associating a Storage Policy with an existing Partition.

For more details, please refer to the Docs directory under [RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE), [STORAGE POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY), [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE), [ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN), etc.
:::

### Configuring Compaction

-   The BE parameter `cold_data_compaction_thread_num` can set the concurrency for executing remote storage Compaction, with a default of 2.

-   The BE parameter `cold_data_compaction_interval_sec` can set the time interval for executing remote storage Compaction, with a default of 1800 seconds, which is half an hour.

## Limitations

-   Tables using remote storage do not support backup.

-   Modifying the location information of remote storage, such as endpoint, bucket, or path, is not supported.

-   Unique model tables with Merge-on-Write enabled do not support remote storage.

-   Storage policies support creation, modification, and deletion. Before deleting a storage policy, ensure that no tables are referencing it.

-   Once a storage policy is set, it cannot be unset.

## Cold Data Space

### Viewing

Method 1: You can view the size uploaded to the object by each BE through `show proc '/backends'`, in the RemoteUsedCapacity item, this method has a slight delay.

Method 2: You can view the size of each tablet occupied by the table through `show tablets from tableName`, in the RemoteDataSize item.

### Garbage Collection

There may be situations that generate garbage data on remote storage:

1.  Rowset upload fails but some segments are successfully uploaded.

2.  The uploaded rowset did not reach consensus in multiple replicas.

3.  Rowsets participating in compaction after compaction is completed.

Garbage data will not be cleaned up immediately. The BE parameter `remove_unused_remote_files_interval_sec` can set the time interval for garbage collection on remote storage, with a default of 21600 seconds, which is 6 hours.

## Query and Performance Optimization

To optimize query performance and save object storage resources, local Cache has been introduced. When querying data from remote storage for the first time, Doris will load the data from remote storage to the local disk of the BE for caching. The Cache has the following characteristics:

-   The Cache is actually stored on the local disk of the BE and does not occupy memory space.

-   The Cache is managed through LRU and does not support TTL.

For specific configurations, please refer to (../../lakehouse/data-cache).

## FAQ

1.  `ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository: connect to s3 failed: Unable to marshall request to JSON: host must not be null.`

The S3 SDK defaults to using the virtual-hosted style method. However, some object storage systems (such as MinIO) may not have virtual-hosted style access enabled or supported. In this case, we can add the `use_path_style` parameter to force the use of the path style method:

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

2. What happens after modifying parameters related to cooldown time?

   Changes to cooldown-related parameters only take effect for data that has not yet been cooled to remote storage. For data that has already been cooled to remote storage, the changes do not apply. For example, if you change `cooldown_ttl` from 21 days to 7 days, data that is already in remote storage will not be moved back to local storage;
