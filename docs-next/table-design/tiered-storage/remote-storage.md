---
{
    "title": "Local-Remote Tiered Storage",
    "language": "en",
    "description": "Apache Doris remote storage automatically migrates cold data to S3-compatible object storage or HDFS, reducing local storage costs. It is suitable for hot-cold data tiering scenarios.",
    "keywords": [
        "Doris remote storage",
        "hot-cold tiering",
        "cold data archiving",
        "S3 object storage",
        "HDFS storage",
        "Storage Policy",
        "cooldown_ttl"
    ]
}
---

<!-- Knowledge type: Feature overview + Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Hot-cold data tiering / Reducing storage costs / Historical data archiving -->


Local-remote tiered storage is the hot-cold data tiering capability provided by Apache Doris. It automatically migrates cold data to external storage systems (such as S3-compatible object storage or HDFS), reducing local disk usage and overall storage costs.

**Applicable scenarios**:

- Historical data archiving: migrate infrequently accessed historical data to low-cost object storage.
- Hot-cold tiering: keep hot data on local SSD/HDD, and offload cold data to remote storage.
- Storage cost optimization: replace local high-performance storage with object storage to reduce TCO.

:::warning Note
Data in remote storage has **only one replica**. Data reliability depends on the remote storage's own reliability guarantees. Make sure the remote storage has EC (erasure coding) or multi-replica mechanisms enabled.
:::

## Quick navigation

| Section | Content |
| --- | --- |
| [Storing cold data on S3-compatible storage](#storing-cold-data-on-s3-compatible-storage) | Offload cold data to S3-compatible object storage |
| [Storing cold data on HDFS](#storing-cold-data-on-hdfs) | Offload cold data to HDFS |
| [Cooling down existing tables to remote storage](#cooling-down-existing-tables-to-remote-storage) | Configure remote storage for existing tables or partitions |
| [Configuring Compaction](#configuring-compaction) | Adjust Compaction behavior for remote storage |
| [Limitations](#limitations) | Functional limitations of remote storage |
| [Cold data space management](#cold-data-space-management) | View and reclaim cold data |
| [Query and performance optimization](#query-and-performance-optimization) | Local Cache mechanism |
| [FAQ](#faq) | Error troubleshooting and configuration notes |

## Usage

<!-- Knowledge type: Operation steps -->

The remote storage workflow consists of three steps: **create a Resource, create a Storage Policy, and associate the Policy when creating or altering a table**.

### Storing cold data on S3-compatible storage

<!-- Applicable scenarios: Use AWS S3, MinIO, Alibaba Cloud OSS, Tencent Cloud COS, or other object storage -->

#### Step 1: Create an S3 Resource

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
Creating an S3 Resource performs a remote connection check to ensure the Resource configuration is correct.
:::

#### Step 2: Create a Storage Policy

Associate the Resource created in the previous step:

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

#### Step 3: Use the Storage Policy when creating a table

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
A Unique table with `"enable_unique_key_merge_on_write" = "true"` cannot use remote storage.
:::

### Storing cold data on HDFS

<!-- Applicable scenarios: An existing Hadoop/HDFS cluster is used as the cold data storage pool -->

#### Step 1: Create an HDFS Resource

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
    "type" = "hdfs",
    "fs.defaultFS" = "fs_host:default_fs_port",
    "hadoop.username" = "hive",
    "hadoop.password" = "hive",
    "root_path" = "/my/root/path",
    "dfs.nameservices" = "my_ha",
    "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
    "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
    "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
    "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

#### Step 2: Create a Storage Policy

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
);
```

#### Step 3: Create a table that uses the Storage Policy

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
A Unique table with `"enable_unique_key_merge_on_write" = "true"` cannot use remote storage.
:::

### Cooling down existing tables to remote storage

<!-- Applicable scenarios: Existing tables or partitions that need remote storage capability added -->

In addition to creating new tables, Doris also supports configuring remote storage for existing tables or partitions (PARTITION).

**Configure remote storage for an entire table**:

```sql
ALTER TABLE create_table_not_have_policy SET ("storage_policy" = "test_policy");
```

**Configure remote storage for a specific partition**:

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy" = "test_policy");
```

:::tip Priority of table-level and partition-level Policies
If both the entire table and some partitions are assigned **different** Storage Policies at table creation time, the partition-level Policies are ignored, and all partitions of the table use the table-level Policy.

To assign a different Policy to a specific partition, use the `ALTER TABLE ... MODIFY PARTITION` statement shown above.

For more syntax details, see:

- [CREATE RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)
- [CREATE STORAGE POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)
- [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)
- [ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)
:::

### Configuring Compaction

<!-- Knowledge type: Configuration parameters -->

Compaction behavior for remote storage is controlled by BE parameters:

| Parameter | Default | Unit | Description |
| --- | --- | --- | --- |
| `cold_data_compaction_thread_num` | 2 | count | Number of concurrent threads for remote storage Compaction |
| `cold_data_compaction_interval_sec` | 1800 | seconds | Execution interval of remote storage Compaction (default 30 minutes) |

## Limitations

<!-- Knowledge type: Functional limitations -->

Remote storage has the following limitations:

- Tables that use remote storage **do not support backup**.
- The location information of remote storage (such as endpoint, bucket, and path) **cannot be modified**.
- A Unique model table with Merge-on-Write enabled **does not support** remote storage.
- Storage Policies support creation, modification, and deletion. **Before deletion, make sure no table references** the Storage Policy.
- Once a Storage Policy is set on a table, it **cannot be unset**.

## Cold data space management

### Viewing cold data usage

You can view cold data space usage in two ways:

| Method | Command | Field | Notes |
| --- | --- | --- | --- |
| Method 1 | `SHOW PROC '/backends'` | `RemoteUsedCapacity` | View the total size of objects uploaded by each BE. **Slightly delayed** |
| Method 2 | `SHOW TABLETS FROM tableName` | `RemoteDataSize` | View the object size occupied by each Tablet |

### Garbage collection

Scenarios in which garbage data may be generated in remote storage:

1. A Rowset upload fails, but some Segments have been uploaded successfully.
2. Uploaded Rowsets are not consistent across multiple replicas.
3. After Compaction completes, the old Rowsets that participated in Compaction.

**Reclamation policy**: garbage data is not cleaned up immediately. The reclamation interval is controlled by the BE parameter `remove_unused_remote_files_interval_sec`, which defaults to `21600` seconds (6 hours).

## Query and performance optimization

<!-- Knowledge type: Performance optimization -->

To optimize query performance and save object storage API call costs, Doris introduces a **local Cache** mechanism. When data in remote storage is queried for the first time, Doris loads it into the BE local disk as a cache.

**Cache characteristics**:

- The cache is stored on the BE local disk and **does not consume memory**.
- The cache is managed by an LRU (least recently used) policy and **does not support TTL**.

For configuration details, see the [Data Cache](../../lakehouse/data-cache) documentation.

## FAQ

<!-- Knowledge type: Troubleshooting -->

### Q1: What should I do if creating an S3 Resource reports `host must not be null`?

**Error message**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository:
connect to s3 failed: Unable to marshall request to JSON: host must not be null.
```

**Cause**: by default, the S3 SDK uses virtual-hosted style access, but some object storage services (such as MinIO) do not enable or do not support this style.

**Solution**: add `"use_path_style" = "true"` to the Resource configuration to force path-style access:

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

### Q2: How does modifying cooldown parameters such as `cooldown_ttl` behave?

After cooldown-related parameters are modified, the changes **only take effect for data that has not yet been cooled down to remote storage**. They do not affect data that is already in remote storage.

**Example**: if `cooldown_ttl` is changed from 21 days to 7 days, data that is already in remote storage **will not be moved back to local**.

### Q3: Which table models do not support remote storage?

A Unique model table does not support remote storage when Merge-on-Write is enabled (that is, `"enable_unique_key_merge_on_write" = "true"`). Other models (Duplicate, Aggregate, and Unique with MoW disabled) all support it.

### Q4: How is the data reliability of remote storage guaranteed?

Doris keeps **only one replica** in remote storage, so data reliability fully depends on the remote storage itself. It is recommended to enable mechanisms such as **EC (erasure coding)** or **multi-replica** on the remote storage to safeguard data.
