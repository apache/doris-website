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

:::note
For Doris 4.1.x and later, external meta cache has been refactored with unified configuration keys `meta.cache.*`.
See [Unified External Meta Cache (4.1.x+)](./meta-cache/unified-meta-cache.md).

Starting from Doris 4.1.x, external metadata caching can be understood as two layers:

- Generic catalog caches: database/table name lists and database/table objects. These are still controlled by FE configs such as `max_meta_object_cache_num`, `external_cache_refresh_time_minutes`, and `external_cache_expire_time_seconds_after_access`.
- Engine-specific entry caches: schema, partition metadata, manifests, file lists, and similar engine-dependent entries. These use unified per-catalog keys in the form `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}`.

The unified document focuses on the second layer.
:::

This page mainly records FE-level defaults and legacy catalog properties used by the 2.1.x / 3.x cache model.
For the current engine-specific cache entry matrix in Doris 4.1.x+, use the unified page and the catalog-specific pages.

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

The following sections describe representative FE-level defaults and legacy cache controls.
They should not be read as the complete cache entry matrix for Doris 4.1.x+.

| Category | Scope | Main FE defaults | Notes |
|---|---|---|---|
| Database / table name lists | Per catalog / per database | `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Used by `SHOW DATABASES` / `SHOW TABLES` |
| Database / table objects | Per catalog / per database | `max_meta_object_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Object cache can diverge temporarily from name-list cache |
| Table schema | Per catalog | `max_external_schema_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Legacy per-catalog override: `schema.cache.ttl-second` |
| Hive partition values | Per Hive catalog | `max_hive_partition_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Legacy per-catalog override: `partition.cache.ttl-second` |
| Hive partition properties | Per Hive catalog | `max_hive_partition_cache_num`, `external_cache_expire_time_seconds_after_access` | No legacy per-catalog TTL override |
| Hive file lists | Per Hive catalog | `max_external_file_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | Legacy per-catalog override: `file.meta.cache.ttl-second` |
| Hudi / Iceberg / Paimon legacy table-level metadata | Per catalog | `max_external_table_cache_num`, `external_cache_expire_time_seconds_after_access`, `external_cache_refresh_time_minutes` | For Doris 4.1.x+, use the catalog pages for current cache entries such as `fs_view`, `meta_client`, `view`, and `manifest` |

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

Each Catalog has a database object cache. Each database has a table object cache.

- Maximum cache count

    Controlled by the FE configuration item `max_meta_object_cache_num`, default is 1000. You can adjust this parameter appropriately according to the number of databases under a single Catalog or the number of tables under a single database.

- Eviction time

    Fixed at 86400 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest database or table in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Table Schema

Caches the schema information of tables, such as column names. This cache is mainly used to load the schema of accessed tables on demand, to prevent synchronizing a large number of unnecessary table schemas and occupying FE memory.

This cache is managed per catalog.

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

    Controlled by the FE configuration item `max_external_file_cache_num`, default is 10000.

    You can adjust this parameter appropriately according to the number of files to be accessed.

- Eviction time

    Default is 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

    If the `file.meta.cache.ttl-second` property is set in the Catalog properties, the set time is used.

    In some cases, the data files of Hive tables change frequently, resulting in the cache not meeting timeliness requirements. You can set this parameter to 0 to disable this cache. In this case, the file list will be obtained in real time for each query, which may reduce performance but improve file timeliness.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest file list in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Hudi Table Partitions

Legacy summary of Hudi partition metadata caching.
Current Hudi cache entries in Doris 4.1.x+ also include `fs_view` and `meta_client`; see [Hudi Catalog](./catalogs/hudi-catalog.md#meta-cache-unified).

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

Legacy summary of Iceberg table metadata caching. The table object is loaded and constructed through the Iceberg API.
For Doris 4.1.x+, the current observable cache entries are documented in [Iceberg Catalog](./catalogs/iceberg-catalog.mdx#meta-cache-unified).

This cache, each Iceberg Catalog has one.

- Maximum cache count

    Controlled by the FE configuration item `max_external_table_cache_num`, default is 1000.

    You can adjust this parameter appropriately according to the number of Iceberg tables.

- Eviction time

    Fixed at 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest Iceberg table properties in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

### Iceberg Snapshot-Related Metadata

Legacy summary of snapshot-related metadata derived from Iceberg table metadata.
In current implementations, this should not be read as a separate 4.1.x cache entry alongside `table`, `view`, or `manifest`.

- Maximum cache count

    Controlled by the FE configuration item `max_external_table_cache_num`, default is 1000.

    You can adjust this parameter appropriately according to the number of Iceberg tables.

- Eviction time

    Fixed at 28800 seconds. After version 3.0.7, configured by the FE parameter `external_cache_expire_time_seconds_after_access`, default is 86400 seconds.

- Minimum refresh time

    Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`, in minutes. Default is 10 minutes. Reducing this time allows you to see the latest Iceberg table properties in Doris more in real time, but increases the frequency of accessing external data sources.

    After version 3.0.7, the configuration item name is changed to `external_cache_refresh_time_minutes`. The default value remains unchanged.

## Cache Refresh

In addition to the refresh and eviction strategies above, users can also refresh metadata manually or on a schedule.

### Manual Refresh

Use the `REFRESH` statement to invalidate catalog, database, or table metadata.
For current syntax, privileges, and examples, see [REFRESH](../sql-manual/sql-statements/catalog/REFRESH.md).

Behavior summary:

- `REFRESH CATALOG` invalidates catalog-level object caches and, by default, lower-level metadata caches.
- `REFRESH DATABASE` invalidates metadata under one database.
- `REFRESH TABLE` invalidates metadata for one table.
- For `REFRESH CATALOG`, `invalid_cache = false` keeps lower-level caches and refreshes only object/name lists.

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

`REFRESH CATALOG ctl1;`

## Best Practices

Caching can significantly improve metadata access performance and avoid frequent remote access to metadata, which can cause performance jitter or put pressure on the metadata service. However, caching also reduces data timeliness. For example, if the cache refresh time is 10 minutes, only cached metadata can be read within ten minutes. Therefore, it is necessary to set the cache reasonably according to the situation.

### Default Behavior

This section mainly introduces the cache behavior that users may be concerned about under the default parameter configuration.

- After a new database or table is added to the external data source, it can be queried in real time in Doris through SELECT. But SHOW DATABASES and SHOW TABLES may not see it; you need to manually refresh the cache or wait up to 10 minutes.
- When a new partition is added to the external data source, you need to manually refresh the cache or wait up to 10 minutes to query the new partition data.
- When partition data files change, you need to manually refresh the cache or wait up to 10 minutes to query the new partition data.

### Disable Schema Cache

For all types of External Catalogs, if you want to see the latest Table Schema in real time, you can disable the Schema Cache:

:::note
For Doris 4.1.x+, prefer the unified per-catalog property `meta.cache.<engine>.schema.ttl-second = "0"`.
See [Unified External Meta Cache (4.1.x+)](./meta-cache/unified-meta-cache.md).
:::

- Disable globally

    ```text
    -- fe.conf
    max_external_schema_cache_num=0 // Disable Schema cache.
    ```

- Disable at Catalog level in Doris 4.1.x+

    ```text
    -- Catalog property
    "meta.cache.<engine>.schema.ttl-second" = "0"
    ```

- Legacy catalog-level property

    ```text
    -- Catalog property
    "schema.cache.ttl-second" = "0" // Legacy property, supported in 2.1.11 / 3.0.6
    ```

After setting, Doris will see the latest Table Schema in real time. However, this setting may increase the pressure on the metadata service.

### Disable Hive Catalog Metadata Cache

For Hive Catalog, if you want to disable the cache to query real-time updated data, you can configure the following parameters:

:::note
For Doris 4.1.x+, prefer unified `meta.cache.hive.*` properties. See:
[Hive Catalog](./catalogs/hive-catalog.mdx#meta-cache-unified) and
[Unified External Meta Cache (4.1.x+)](./meta-cache/unified-meta-cache.md).
:::

- Disable globally

    ```text
    -- fe.conf
    max_external_file_cache_num=0    // Disable file list cache
    max_hive_partition_table_cache_num=0  // Disable partition list cache
    max_hive_partition_cache_num=0   // Disable partition property cache
    ```

- Disable at Catalog level in Doris 4.1.x+

    ```text
    -- Catalog property
    "meta.cache.hive.partition_values.ttl-second" = "0" // Disable partition list cache
    "meta.cache.hive.partition.ttl-second" = "0"        // Disable partition property cache
    "meta.cache.hive.file.ttl-second" = "0"             // Disable file list cache
    ```

- Legacy catalog-level properties

    ```text
    -- Catalog property
    "file.meta.cache.ttl-second" = "0" // Disable file list cache
    "partition.cache.ttl-second" = "0" // Disable partition list cache (supported in 2.1.11 / 3.0.6)
    ```

After setting the above parameters:

- New partitions in the external data source can be queried in real time.
- Changes in partition data files can be queried in real time.
- Changes in partition properties require disabling the partition property cache as well.

But this will increase the access pressure on external data sources (such as Hive Metastore and HDFS), which may cause unstable metadata access latency and other phenomena.
