---
{
    "title": "Metadata Cache",
    "language": "en",
    "description": "To improve the performance of accessing external data sources, Apache Doris caches the metadata of external data sources."
}
---

To improve the performance of accessing external data sources, Apache Doris caches the **metadata** of external data sources.

Metadata includes information such as databases, tables, columns, partitions, snapshots, file lists, etc.

This article details the types, strategies, and related parameter configurations of cached metadata.

For **data cache**, refer to the [data cache documentation](./data-cache.md).

:::tip
This document applies to versions after 2.1.6.
:::

## Cache Strategies

Most caches have the following three strategy indicators:

- Maximum cache count

    The maximum number of objects the cache can hold. For example, up to 1000 tables can be cached. When the cache count exceeds the threshold, the LRU (Least-Recent-Used) strategy is used to remove some caches.

- Eviction time

    - Before version 3.0.6 (inclusive):

        After a cache object is written to the cache for a period of time, the object will be automatically removed from the cache. The next access will re-fetch the latest information from the data source and update the cache.

        For example, a user first accesses table A at 08:00 and writes it to the cache. If the eviction time is 4 hours, then, unless replaced due to capacity issues, the user will directly access table A in the cache between 08:00-14:00. After 14:00, the cache is evicted. If the user accesses table A again, the latest information will be fetched from the data source and the cache will be updated.

    - After version 3.0.7 (inclusive):

        Starting from version 3.0.7, this strategy is changed to **the cache object will be automatically removed after being accessed** for a period of time, instead of **after being written** for a period of time. Each time the cache object is accessed, the timer is reset to ensure that frequently accessed objects always remain in the cache.

        For example, a user first accesses table A at 08:00 and writes it to the cache. If the eviction time is 4 hours, then, unless replaced due to capacity issues, the user will directly access table A in the cache between 08:00-14:00. Suppose the user accesses this object again at 09:00, then the cache eviction time will be recalculated from 09:00, i.e., it becomes 15:00.

- Minimum refresh time

    After a cache object is written to the cache for a period of time, it will automatically trigger a refresh.

    For example, a user first accesses table A at 08:00 and writes it to the cache. If the minimum refresh time is 10 minutes, then, unless replaced due to capacity issues, the user will directly access table A in the cache between 08:00-8:10. At 08:10, the cache object will be marked as [ready to refresh]. When the user accesses this cache object again, the current object will still be returned, but the cache refresh operation will be triggered at the same time. Suppose the cache update takes 1 minute, then after 1 minute, accessing the cache again will get the updated cache object.

    Note that the time to trigger the cache refresh is [the first access to the cache object after exceeding the minimum refresh time], and it is an asynchronous refresh. So, for example, if the minimum refresh time is 10 minutes, it does not mean that the latest object will be obtained after 10 minutes.

    This strategy is different from [eviction time], mainly used to adjust the timeliness of the cache, and avoids blocking the current operation by asynchronously refreshing the cache.

## Cache Types

### Database and Table Name Lists

The database name list refers to the list of all database names under a Catalog.

The table name list refers to the list of all table names under a database.

The name list is only used for operations that need to enumerate names, such as the `SHOW TABLES` or `SHOW DATABASES` statements.

Each Catalog has a database name list cache. Each database has a table name list cache.

- Maximum cache count

    Each cache has only one entry. So the maximum cache count is 1.

- Eviction time

    Fixed at 86400 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest name list in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Database and Table Objects

Caches individual database and table objects. Any access operation to a database or table, such as query, write, etc., will obtain the corresponding object from this cache.

Note that the list of objects in this cache may be inconsistent with the **database and table name list** cache.

For example, through the `SHOW TABLES` command, you get tables `A`, `B`, and `C` from the name list cache. Suppose table `D` is added to the external data source at this time, then `SELECT * FROM D` can access table `D`, and the [table object] cache will add the table `D` object, but the [table name list] cache may still be `A`, `B`, `C`. Only when the [table name list] cache is refreshed will it become `A`, `B`, `C`, `D`.

Each Catalog has a database name list cache. Each database has a table name list cache.

- Maximum cache count

    Controlled by the FE configuration item `max_meta_object_cache_num`, default is 1000. You can adjust this parameter appropriately according to the number of databases under a single Catalog or the number of tables under a single database.

- Eviction time

    Fixed at 86400 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest database or table in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Table Schema

Caches the schema information of tables, such as column names. This cache is mainly used to load the schema of accessed tables on demand, to prevent synchronizing a large number of unnecessary table schemas and occupying FE memory.

This cache is shared by all Catalogs and is globally unique.

- Maximum cache count

    Controlled by the FE configuration item `max_external_schema_cache_num`, default is 10000.

    You can adjust this parameter appropriately according to the total number of tables under a Catalog.

- Eviction time

    Fixed at 86400 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest schema in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Hive Metastore Table Partition List

Used to cache the partition list of tables synchronized from Hive Metastore. The partition list is used for partition pruning during queries.

This cache, each Hive Catalog has one.

- Maximum cache count

    Controlled by the FE configuration item `max_hive_partition_table_cache_num`, default is 1000.

    You can adjust this parameter appropriately according to the total number of tables under a Catalog.

- Eviction time

    Fixed at 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest partition list in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Hive Metastore Table Partition Properties

Used to cache the properties of each partition of a Hive table, such as file format, partition root path, etc. For each query, after partition pruning to get the list of partitions to be accessed, the detailed properties of each partition are obtained through this cache.

This cache, each Hive Catalog has one.

- Maximum cache count

    Controlled by the FE configuration item `max_hive_partition_cache_num`, default is 10000.

    You can adjust this parameter appropriately according to the total number of partitions to be accessed under a Catalog.

- Eviction time

    Fixed at 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest partition properties in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Hive Metastore Table Partition File List

Used to cache the file list information under a single partition of a Hive table. This cache is used to reduce the overhead of file system List operations.

- Maximum cache count

    Controlled by the FE configuration item `max_external_file_cache_num`, default is 100000.

    You can adjust this parameter appropriately according to the number of files to be accessed.

- Eviction time

    Default is 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

    If the `file.meta.cache.ttl-second` property is set in the Catalog properties, the set time is used.

    In some cases, the data files of Hive tables change frequently, resulting in the cache not meeting timeliness requirements. You can set this parameter to 0 to disable this cache. In this case, the file list will be obtained in real time for each query, which may reduce performance but improve file timeliness.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest partition properties in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Hudi Table Partitions

Used to cache partition information of Hudi tables.

This cache, each Hudi Catalog has one.

- Maximum cache count

    Controlled by the FE configuration item `max_external_table_cache_num`, default is 1000.

    You can adjust this parameter appropriately according to the number of Hudi tables.

- Eviction time

    Fixed at 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest Hudi partition properties in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Iceberg Table Information

Used to cache Iceberg table objects. The object is loaded and constructed through the Iceberg API.

This cache, each Iceberg Catalog has one.

- Maximum cache count

    Controlled by the FE configuration item `max_external_table_cache_num`, default is 1000.

    You can adjust this parameter appropriately according to the number of Iceberg tables.

- Eviction time

    Fixed at 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest Iceberg table properties in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Iceberg Table Snapshot

Used to cache the snapshot list of Iceberg tables. The object is loaded and constructed through the Iceberg API.

This cache, each Iceberg Catalog has one.

- Maximum cache count

    Controlled by the FE configuration item `max_external_table_cache_num`, default is 1000.

    You can adjust this parameter appropriately according to the number of Iceberg tables.

- Eviction time

    Fixed at 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest Iceberg table properties in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

## Iceberg Metadata Cache Enhancements (Since 4.0.3)

:::tip Version Note
The following enhancements are available starting from version 4.0.3. For earlier versions, please refer to the basic cache configurations above.
:::

Starting from version 4.0.3, Doris introduces significant improvements to Iceberg metadata caching with enhanced configurability, better performance, and clearer semantics.

Starting from version 4.0.3, Doris introduces significant improvements to Iceberg metadata caching with enhanced configurability, better performance, and clearer semantics.

### Overall Architecture

The new Iceberg metadata caching architecture contains two core caching components, with each Iceberg Catalog having its own independent cache instance:

#### **Architecture Hierarchy**

**Iceberg Catalog**
└── **IcebergMetadataCache** (one instance per Catalog)
    ├── **1. Table Cache** (Core Component)
    │   ├── Cached Content
    │   │   ├── Table Object (IcebergTableCacheValue)
    │   │   │   ├── Schema ID (schema version)
    │   │   │   ├── Current Snapshot ID (current snapshot)
    │   │   │   ├── Partition Spec (partition specification)
    │   │   │   └── Snapshot List (lazy-loaded, for MTMV)
    │   │   └── View Object (separate cache, same configuration)
    │   ├── Impact Scope
    │   │   ├── ✓ Schema version
    │   │   ├── ✓ Snapshot version (data visibility)
    │   │   └── ✓ Partition information
    │   └── Configuration: `iceberg.table.meta.cache.ttl-second`
    │
    └── **2. Manifest Cache** (Added in 4.0.3)
        ├── Cached Content
        │   ├── Parsed DataFile objects
        │   │   └── File path, partition values, statistics
        │   └── Parsed DeleteFile objects
        │       └── Equality Delete metadata
        ├── Impact Scope
        │   ├── ✓ Only affects query performance
        │   └── ✗ Does not affect data correctness or visibility
        └── Configuration: `iceberg.manifest.cache.enable`

#### **Query Execution Flow**

1. **Table Cache** determines which Snapshot to use
2. Load Manifest List based on Snapshot
3. **Manifest Cache** accelerates Manifest file parsing
4. Return DataFile list for query execution

#### **Optional External Cache Layers**

- **Iceberg Native Manifest Cache**: Caches Manifest file bytes to accelerate I/O (optional configuration)
- **Object Storage/HDFS**: Stores original Manifest files

**Key Design Points:**

1. **Table Cache** controls metadata versioning and data visibility
   - Caches Iceberg Table objects containing Schema, Snapshot, and other core metadata
   - View Cache is independent but shares the same configuration with Table Cache
   - When TTL expires or is set to 0, it forces reloading to see the latest data

2. **Manifest Cache** only optimizes query performance
   - Caches parsed Manifest file content (DataFile/DeleteFile objects)
   - Manifest files are immutable, so caching does not affect data correctness
   - Even with cached old Manifests, Table Cache controls which Snapshot to use

3. **Multi-tier cache collaboration**
   - Optionally combine with Iceberg native Manifest Cache for a three-tier caching architecture
   - Native cache accelerates I/O, Doris Manifest Cache accelerates parsing

### Cache Component Details

#### 1. Table Cache

**Purpose:**

Table Cache is the core component of Iceberg metadata caching, responsible for caching Iceberg Table objects and controlling which metadata version queries use. This is the most critical part of the entire caching system.

:::info About View Cache
`IcebergMetadataCache` also includes a View Cache for caching Iceberg View objects. It works similarly to Table Cache. This documentation primarily focuses on Table Cache, with View Cache configuration and behavior being identical.
:::

**Cached Content:**

Table Cache caches the core object `IcebergTableCacheValue`, which includes:

| Component | Information | Purpose |
|-----------|-------------|---------|
| **Iceberg Table Object** | • Schema ID (schema version)<br>• Current Snapshot ID (current snapshot)<br>• Partition Spec (partition specification)<br>• Table Properties | Determines the data version and table schema seen by queries |
| **Snapshot Information**<br>(Lazy-loaded) | • Snapshot information<br>• Partition information | Mainly for Materialized View (MTMV) scenarios |

**Impact on Data Visibility:**

Table Cache is the only cache component that controls data visibility, directly affecting:

| Dimension | Description | Consequence of Stale Cache |
|-----------|-------------|---------------------------|
| **Schema** | `schemaId` determines column definitions seen by queries | Cannot see newly added/modified columns |
| **Snapshot** | `currentSnapshotId` determines which data snapshot to query | Cannot see latest written data |
| **Partition** | Partition Spec and Snapshot determine partition metadata | Partition list is not up-to-date |

:::warning Important
**Table Cache is the sole control point for data freshness:**
- To see the latest data, you must refresh or disable Table Cache
- Setting `iceberg.table.meta.cache.ttl-second=0` disables the cache, forcing fresh metadata retrieval on every query
- Manifest Cache and other caches do not affect data visibility
:::

#### 2. Manifest Cache

**Purpose:**

Manifest Cache is a pure performance optimization component introduced in version 4.0.3, accelerating query execution by caching parsed Manifest file content.

**Cached Content:**

Manifest Cache stores **parsed objects** rather than raw file bytes:

| Cached Object | Information | Purpose |
|---------------|-------------|---------|
| `DataFile` objects | • File path<br>• Partition values<br>• Record count<br>• File size<br>• Column statistics (min/max/null count) | For file scan planning and partition pruning |
| `DeleteFile` objects | • Delete file path<br>• Delete conditions<br>• Related DataFile references | For MOR (Merge-On-Read) queries |

**Performance Benefits:**

Manifest Cache provides two types of performance optimizations:

1. **Reduced I/O overhead**: Avoids repeatedly reading the same Manifest files
2. **Reduced CPU overhead**: Avoids repeatedly parsing Avro-formatted Manifest files

:::tip Performance Best Practice
**Recommended to enable three-tier caching architecture for optimal performance:**

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    ...
    -- Level 1: Iceberg native file I/O cache
    'io.manifest.cache-enabled' = 'true',

    -- Level 2: Doris Manifest object cache
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '1024'
);
```

**Three-tier cache collaboration:**
1. **Object Storage/HDFS** → Original Manifest files
2. **Iceberg Native Cache** → Caches file bytes, accelerates I/O
3. **Doris Manifest Cache** → Caches parsed DataFile/DeleteFile objects, skips parsing
:::

**Important Note on Data Correctness:**

:::info Manifest Immutability
Iceberg Manifest files follow an **Immutable design**:

- **New commits create new files**: Each data commit generates new Manifest files without modifying existing ones
- **File content never changes**: Once created, Manifest file content never changes
- **Path-based uniqueness**: Manifest files with the same path always have the same content

**Therefore:**
- ✅ Manifest Cache **does not affect data correctness**
- ✅ Manifest Cache **does not affect data visibility**
- ✅ Even with cached "old" Manifest files, queries will not see incorrect data
  - Table Cache controls which Snapshot to use
  - Snapshot determines which Manifest files to read
  - Even if a Manifest is cached, it won't be used unless it's in the current Snapshot's Manifest List
- ❌ Disabling Manifest Cache **will not** show you newer data, only reduce performance
:::

### Configuration Parameters

#### Table Cache Configuration

Table Cache supports configuration at both Catalog level and FE global level.

:::info
View Cache uses the same configuration parameters as Table Cache and requires no separate configuration.
:::

**Catalog-level Parameters**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `iceberg.table.meta.cache.ttl-second` | `86400` (24 hours) | Table metadata cache expiration time (seconds)<br>• Controls both Table Cache and View Cache<br>• Set to `0` to disable cache and force reload every time<br>• Recommended 1-2 hours for production environments |

**FE Global Parameters (`fe.conf`)**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `external_cache_expire_time_seconds_after_access` | `86400` (24 hours) | Global default cache expiration time (seconds)<br>Used when Catalog does not specify TTL |
| `max_external_table_cache_num` | `1000` | Maximum number of Table/View entries cached per Catalog |
| `external_cache_refresh_time_minutes` | `10` | Minimum interval for cache asynchronous refresh (minutes)<br>Updates non-expired cache in background without blocking queries |

:::info Parameter Priority
Catalog-level `iceberg.table.meta.cache.ttl-second` > FE global `external_cache_expire_time_seconds_after_access`
:::

#### Manifest Cache Configuration

Manifest Cache only supports Catalog-level configuration:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `iceberg.manifest.cache.enable` | `false` | Whether to enable Manifest cache<br>• **Recommended to enable** for improved query performance |
| `iceberg.manifest.cache.capacity-mb` | `1024` | Maximum cache capacity (MB)<br>• Adjust based on table count and query frequency<br>• Uses LRU eviction when limit is reached |
| `iceberg.manifest.cache.ttl-second` | `172800` (48 hours) | Cache entry expiration time (seconds)<br>• Manifest files are immutable, can set longer TTL |
| `io.manifest.cache-enabled` | `false` | Iceberg native Manifest I/O cache<br>• **Recommended to enable together with Doris Manifest Cache** |

### Configuration Examples

#### Example 1: Production Environment Recommended Configuration (Balance Performance and Data Freshness)

```sql
CREATE CATALOG iceberg_prod PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: 1 hour TTL, balances data freshness and performance
    'iceberg.table.meta.cache.ttl-second' = '3600',

    -- Manifest Cache: Enable with reasonable capacity
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '2048',
    'iceberg.manifest.cache.ttl-second' = '172800',

    -- Iceberg native cache: Use together
    'io.manifest.cache-enabled' = 'true'
);
```

Also configure in `fe.conf`:
```properties
external_cache_refresh_time_minutes = 5    # 5-minute async refresh
max_external_table_cache_num = 2000        # Adjust based on table count
```

**Effects of this configuration:**
- ✅ Table Cache expires in 1 hour, synchronously reloads latest metadata on access
- ✅ Asynchronous refresh every 5 minutes, mostly sees data within 5 minutes
- ✅ Manifest Cache accelerates queries, reduces I/O and parsing overhead
- ✅ Three-tier cache collaboration for optimal performance

#### Example 2: Development/Test Environment Configuration (Prioritize Data Real-time)

```sql
CREATE CATALOG iceberg_dev PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: Disable, always get latest metadata
    'iceberg.table.meta.cache.ttl-second' = '0',

    -- Manifest Cache: Can still enable without affecting data freshness
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '512'
);
```

**Effects of this configuration:**
- ✅ Every query gets latest Table metadata, sees latest data
- ✅ Manifest Cache still works, improves performance without affecting data correctness
- ⚠️ Every query needs to access Metastore, slightly higher latency

#### Example 3: High-Performance Read-Only Scenario (Prioritize Query Performance)

```sql
CREATE CATALOG iceberg_readonly PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: Longer TTL, reduces Metastore access
    'iceberg.table.meta.cache.ttl-second' = '7200',

    -- Manifest Cache: Large capacity, long TTL
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '4096',
    'iceberg.manifest.cache.ttl-second' = '259200',  -- 3 days

    -- Iceberg native cache
    'io.manifest.cache-enabled' = 'true'
);
```

Also configure in `fe.conf`:
```properties
external_cache_refresh_time_minutes = 30   # Reduce refresh frequency
max_external_table_cache_num = 5000        # Larger cache capacity
```

**Effects of this configuration:**
- ✅ Table Cache expires in 2 hours, significantly reduces Metastore access
- ✅ Large-capacity Manifest Cache, optimal query performance
- ⚠️ Suitable for scenarios with infrequent metadata changes
- ⚠️ Manual REFRESH required to see latest data

#### Example 4: Enable Only Manifest Cache (Performance Optimization Without Affecting Data Freshness)

```sql
CREATE CATALOG iceberg_balance PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hms',
    'hive.metastore.uris' = 'thrift://your-hive-metastore:9083',

    -- Table Cache: Disable, always get latest metadata
    'iceberg.table.meta.cache.ttl-second' = '0',

    -- Manifest Cache: Enable, only optimize performance
    'iceberg.manifest.cache.enable' = 'true',
    'iceberg.manifest.cache.capacity-mb' = '2048',

    -- Iceberg native cache
    'io.manifest.cache-enabled' = 'true'
);
```

**Effects of this configuration:**
- ✅ Always sees latest Snapshot and Schema
- ✅ Manifest parsing performance still optimized
- ✅ Suitable for scenarios requiring data real-time but also query performance

## Cache Refresh

In addition to the refresh and eviction strategies of each cache above, users can also directly refresh the metadata cache manually or on a schedule.

### Manual Refresh

Users can manually refresh metadata using the `REFRESH` command.

1. REFRESH CATALOG

    Refresh the specified Catalog.

    `REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

    - This command refreshes the database list, table column names, and all cache information of the specified Catalog.
    - `invalid_cache` indicates whether to refresh caches such as partitions and file lists. The default is true. If false, only the database and table lists of the Catalog will be refreshed, but not caches such as partitions and file lists. This parameter is suitable for cases where the user only wants to synchronize newly added or deleted databases and tables, and can be set to false.

2. REFRESH DATABASE

    Refresh the specified Database.

    `REFRESH DATABASE [ctl.]db1 PROPERTIES("invalid_cache" = "true");`

    - This command refreshes the table column names and all cache information under the specified Database.
    - The meaning of the `invalid_cache` property is the same as above. The default is true. If false, only the table list of the Database will be refreshed, but not the cache information. This parameter is suitable for cases where the user only wants to synchronize newly added or deleted tables.

3. REFRESH TABLE

    Refresh the specified Table.

    `REFRESH TABLE [ctl.][db.]tbl1;`

    - This command refreshes all cache information under the specified Table.

### Scheduled Refresh

Users can set up scheduled refreshes for a Catalog when creating it.

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '3600'
);
```

In the above example, `metadata_refresh_interval_sec` means the Catalog is refreshed every 3600 seconds. This is equivalent to automatically executing once every 3600 seconds:

`REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

## Best Practices

Caching can significantly improve metadata access performance and avoid frequent remote access to metadata, which can cause performance jitter or put pressure on the metadata service. However, caching also reduces data timeliness. For example, if the cache refresh time is 10 minutes, only cached metadata can be read within ten minutes. Therefore, it is necessary to set the cache reasonably according to the situation.

### Default Behavior

This section mainly introduces the cache behavior that users may be concerned about under the default parameter configuration.

- After a new database or table is added to the external data source, it can be queried in real time in Doris through SELECT. But SHOW DATABASES and SHOW TABLES may not see it; you need to manually refresh the cache or wait up to 10 minutes.
- When a new partition is added to the external data source, you need to manually refresh the cache or wait up to 10 minutes to query the new partition data.
- When partition data files change, you need to manually refresh the cache or wait up to 10 minutes to query the new partition data.

### Disable Schema Cache

For all types of External Catalogs, if you want to see the latest Table Schema in real time, you can disable the Schema Cache:

- Disable globally

    ```text
    -- fe.conf
    max_external_schema_cache_num=0 // Disable Schema cache.
    ```

- Disable at Catalog level

    ```text
    -- Catalog property
    "schema.cache.ttl-second" = "0" // For a specific Catalog, disable Schema cache (supported in 2.1.11, 3.0.6)
    ```

:::note
For **Iceberg Catalog**, disabling Schema Cache alone does **not** guarantee real-time schema visibility. The schemaId is obtained from the cached Table object (controlled by Table Cache). To see the latest schema, you must disable Table Cache.

For versions **4.0.3 and above**, use `iceberg.table.meta.cache.ttl-second=0` in Catalog properties. See [Iceberg Metadata Cache Enhancements](#iceberg-metadata-cache-enhancements-since-403) for details.

Schema Cache only affects whether to re-parse the schema (performance optimization), not which schema version is used.
:::

After setting, Doris will see the latest Table Schema in real time. However, this setting may increase the pressure on the metadata service.

### Disable Hive Catalog Metadata Cache

For Hive Catalog, if you want to disable the cache to query real-time updated data, you can configure the following parameters:

- Disable globally

    ```text
    -- fe.conf
    max_external_file_cache_num=0    // Disable file list cache
    max_hive_partition_table_cache_num=0  // Disable partition list cache
    ```

- Disable at Catalog level

    ```text
    -- Catalog property
    "file.meta.cache.ttl-second" = "0" // For a specific Catalog, disable file list cache
    "partition.cache.ttl-second" = "0" // For a specific Catalog, disable partition list cache (supported in 2.1.11, 3.0.6)
    ```

After setting the above parameters:

- New partitions in the external data source can be queried in real time.
- Changes in partition data files can be queried in real time.

But this will increase the access pressure on external data sources (such as Hive Metastore and HDFS), which may cause unstable metadata access latency and other phenomena.

### Disable Iceberg Catalog Metadata Cache

For Iceberg Catalog, if you want to disable the cache to query real-time updated data, you can configure the following parameters:

- **For versions 4.0.3 and above**:

    ```sql
    CREATE CATALOG iceberg_catalog PROPERTIES (
        'type' = 'iceberg',
        ...
        'iceberg.table.meta.cache.ttl-second' = '0'       -- Disable table/view cache
        -- Note: Manifest cache is disabled by default, no need to set explicitly
    );
    ```

    See [Iceberg Metadata Cache Enhancements (Since 4.0.3)](#iceberg-metadata-cache-enhancements-since-403) for more details.

- **For versions before 4.0.3**:

    Use global FE configuration to control cache behavior:

    ```text
    -- fe.conf
    max_external_table_cache_num=0  // Disable table cache globally
    ```

After setting the above parameters:

- New table snapshots can be queried in real time.

:::note
In version 4.0.3+, the Manifest Cache is **disabled by default**. Since Iceberg manifest files are **immutable** (they are never modified after creation), **the Manifest Cache does not affect the visibility of the latest data**. When new data is committed to an Iceberg table, new manifest files are created, and the table's snapshot is updated to reference these new manifests. It is the **Table Cache** that controls which snapshot version is used, thereby affecting data visibility. By disabling the Table Cache (as shown above), you ensure queries always use the latest snapshot.
:::

But this will increase the access pressure on external data sources (such as Iceberg Catalog service and object storage), which may cause unstable metadata access latency.

