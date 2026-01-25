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

### Enhanced Iceberg Table/View Cache

The enhanced Table/View cache in version 4.0.3 provides more granular control and better understanding of cache behavior.

**Architecture:**

This cache is maintained in `IcebergMetadataCache`, where each Iceberg Catalog has its own instance with separate `tableCache` and `viewCache`.

The cached table object (`IcebergTableCacheValue`) also contains snapshot information, which is lazily loaded on demand (mainly for MTMV scenarios).

**Impact on Data Visibility:**

The Table Cache controls which version of the Iceberg table metadata is used. This affects:

- **Schema**: The `schemaId` is obtained from the cached table object. If the cache contains an older table object, you will see the old schema (column definitions).
- **Snapshot**: The current snapshot ID is obtained from the cached table object. If the cache contains an older table object, queries will use the old snapshot and may not see the latest data.
- **Partition**: Partition information is loaded using the cached table object's metadata (specs, snapshots). Older cache means outdated partition information.

:::tip
To see real-time schema, snapshot, and partition information, disable the table cache by setting `iceberg.table.meta.cache.ttl-second=0`. The Schema cache does not affect which version is used—it only caches the parsed result for performance.
:::

**Enhanced Configuration (4.0.3+):**

- **Catalog-level TTL Control**

    Starting from 4.0.3, you can configure TTL at the Catalog level via `iceberg.table.meta.cache.ttl-second` (in seconds).

    ```sql
    CREATE CATALOG iceberg_catalog PROPERTIES (
        'type' = 'iceberg',
        ...
        'iceberg.table.meta.cache.ttl-second' = '7200'  -- 2 hours
    );
    ```

    If not specified, it falls back to the FE parameter `external_cache_expire_time_seconds_after_access` (default is 86400 seconds).

    Set to `0` to disable the cache, forcing metadata to be fetched on every access.

- **Maximum cache count**

    Controlled by the FE configuration item `max_external_table_cache_num`, default is 1000.

    You can adjust this parameter appropriately according to the number of Iceberg tables.

- **Minimum refresh time**

    Controlled by the FE configuration item `external_cache_refresh_time_minutes`, in minutes. Default is 10 minutes. This is an asynchronous refresh that does not block current operations.

### New Iceberg Manifest Cache (4.0.3+)

Version 4.0.3 introduces a brand new **Manifest Cache** to significantly improve query performance on Iceberg tables.

**What is Cached:**

This cache stores **parsed** Iceberg manifest file contents—specifically the `DataFile` and `DeleteFile` objects extracted from manifest files (not raw file bytes):

- `DataFile` objects: File metadata including path, partition values, metrics, etc.
- `DeleteFile` objects: Delete metadata for equality deletes.

**Performance Benefits:**

:::tip Best Practice
For optimal performance, **enable and combine Doris Manifest Cache with Iceberg native manifest cache** by setting:

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    ...
    'iceberg.manifest.cache.enable' = 'true',     -- Enable Doris Manifest Cache
    'io.manifest.cache-enabled' = 'true'          -- Enable Iceberg native cache
);
```

This provides two-level caching:
1. **Iceberg native cache** (`io.manifest.cache-enabled`): Caches raw manifest file I/O
2. **Doris Manifest Cache**: Caches parsed `DataFile`/`DeleteFile` objects, avoiding repeated parsing
:::

**Important Note on Data Correctness:**

Iceberg manifest files are **immutable**—once created, they are never modified. New commits create new manifest files rather than modifying existing ones. Therefore:

- The Manifest Cache **does not affect data correctness** or what users see.
- It only affects **query performance** (reducing I/O and parsing overhead).
- Even with cached (stale) manifest entries, queries will still see the correct data because the Table Cache controls which snapshot is used.
- Disabling this cache will not help you see "newer" data—it will only increase I/O and CPU overhead.

**Configuration:**

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    "iceberg.manifest.cache.enable" = "true",
    "iceberg.manifest.cache.capacity-mb" = "1024",
    "iceberg.manifest.cache.ttl-second" = "172800"
);
```

| Config | Default | Description |
|--------|---------|-------------|
| `iceberg.manifest.cache.enable` | `false` | Enable/disable manifest cache |
| `iceberg.manifest.cache.capacity-mb` | `1024` | Maximum cache capacity in MB |
| `iceberg.manifest.cache.ttl-second` | `172800` (48 hours) | Cache entry expiration after access |

When the cache reaches capacity, older entries are evicted using LRU policy.

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

