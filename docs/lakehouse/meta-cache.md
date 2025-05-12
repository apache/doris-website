---
{
    "title": "Metadata Cache",
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

To improve the performance of accessing external data sources, Doris caches the **metadata** of external data sources.

Metadata includes information such as databases, tables, columns, partition information, snapshot information, file list, etc.

This document provides a detailed introduction to the types, strategies, and related parameter configurations of cached metadata.

For **data caching**, please refer to the [data cache documentation](./filecache.md).

:::notice
This document applies to versions after 2.1.6.
:::

## Cache Strategy

Most caches have the following three strategy indicators:

- Maximum Cache Quantity

	The maximum number of objects the cache can hold. For example, up to 1000 tables can be cached. When the cache quantity exceeds the threshold, the LRU (Least-Recent-Used) strategy will be used to remove some caches.

- Expiration Time

	After a cache object is written into the cache for a period of time, it will be automatically removed from the cache, and the latest information will be retrieved from the data source and updated in the cache upon the next access.

	For example, if a user first accesses table A at 08:00 and writes it into the cache, and the expiration time is 4 hours, then the user will directly access the cached table A between 08:00-14:00, provided it is not replaced due to capacity issues. After 14:00, the cache is expired. If the user accesses table A again, the latest information will be retrieved from the data source and updated in the cache.

	This strategy is mainly used to automatically remove objects that are no longer accessed from the cache, reducing cache space usage.

- Minimum Refresh Time

	After a cache object is written into the cache for a period of time, it will automatically trigger a refresh.

	For example, if a user first accesses table A at 08:00 and writes it into the cache, and the minimum refresh time is 10 minutes, then the user will directly access the cached table A between 08:00-8:10, provided it is not replaced due to capacity issues. At 08:10, the cache object will be marked as "ready to refresh", and when the user accesses this cache object again, the current object will still be returned, but the cache refresh operation will be triggered simultaneously. Assuming the cache update takes 1 minute, the updated cache object will be obtained upon the next access after 1 minute.

	Note that the time to trigger a cache refresh is the first access to the cache object after the "minimum refresh time" has been exceeded, and it is an asynchronous refresh. Therefore, for example, if the minimum refresh time is 10 minutes, it does not mean that the latest object will be obtained after 10 minutes.

	This strategy is different from the "expiration time" and is mainly used to adjust the timeliness of the cache and avoid cache update blocking the current operation through asynchronous refresh.

## Cache Types

### Database and Table Name List

The database name list refers to a list of all database names under a Catalog.

The table name list refers to a list of all table names under a database.

The name list is only used for operations that need to enumerate names, such as `SHOW TABLES` or `SHOW DATABASES` statements.

Each Catalog has a database name list cache. Each database has a table name list cache.

- Maximum Cache Quantity

	Each cache has only one entry. So the maximum cache quantity is 1.

- Expiration Time

	Fixed at 86400 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time viewing of the latest name list in Doris, but it will increase the frequency of accessing external data sources.

### Database and Table Objects

Caches individual database and table objects. Any access operation to a database or table, such as query, write, etc., will obtain the corresponding object from this cache.

Note that the list of objects in this cache may be inconsistent with the **database and table name list** cache.

For example, through the `SHOW TABLES` command, tables `A`, `B`, and `C` are obtained from the name list cache. Suppose table `D` is added to the external data source at this time, then `SELECT * FROM D` can access table `D`, and the [table object] cache will add the table `D` object, but the [table name list] cache may still be `A`, `B`, `C`. Only when the [table name list] cache is refreshed will it become `A`, `B`, `C`, `D`.

Each Catalog has a database name list cache. Each database has a table name list cache.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_meta_object_cache_num`, the default is 1000. This parameter can be adjusted appropriately according to the number of databases under a single Catalog or the number of tables under a single database.

- Expiration Time

	Fixed at 86400 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest database or table in Doris, but it will increase the frequency of accessing external data sources.

### Table Schema

Caches the Schema information of the table, such as column names, etc. This cache is mainly used to load the Schema of the accessed table on demand to prevent occupying FE memory by synchronizing a large number of tables that do not need to be accessed.

This cache is shared by all Catalogs and is globally unique.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_external_schema_cache_num`, the default is 10000.

	This parameter can be adjusted appropriately according to the number of all tables under a Catalog.

- Expiration Time

	Fixed at 86400 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest Schema in Doris, but it will increase the frequency of accessing external data sources.

### Hive Metastore Table Partition List

Used to cache the partition list of tables synchronized from the Hive Metastore. The partition list is used for partition pruning during queries.

This cache has one for each Hive Catalog.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_hive_partition_table_cache_num`, the default is 1000.

	This parameter can be adjusted appropriately according to the number of all tables under a Catalog.

- Expiration Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest partition list in Doris, but it will increase the frequency of accessing external data sources.

### Hive Metastore Table Partition Properties

Used to cache the properties of each partition of a Hive table, such as file format, partition root path, etc. After partition pruning, the detailed properties of each partition will be obtained through this cache.

This cache has one for each Hive Catalog.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_hive_partition_cache_num`, the default is 10000.

	This parameter can be adjusted appropriately according to the total number of partitions that need to be accessed under a Catalog.

- Expiration Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest partition properties in Doris, but it will increase the frequency of accessing external data sources.

### Hive Metastore Table Partition File List

Used to cache the file list information under a single partition of a Hive table. This cache is used to reduce the overhead of the List operation of the file system.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_external_file_cache_num`, the default is 100000.

	This parameter can be adjusted appropriately according to the number of files that need to be accessed.

- Expiration Time

	The default is 28800 seconds. If the `file.meta.cache.ttl-second` property is set in the Catalog properties, the set time will be used.

	In some cases, the data files of Hive tables change frequently, causing the cache to fail to meet timeliness. This cache can be turned off by setting this parameter to 0. In this case, the file list will be obtained in real-time for each query, performance may decrease, and file timeliness will improve.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest partition properties in Doris, but it will increase the frequency of accessing external data sources.

### Hudi Table Partition

Used to cache the partition information of Hudi tables.

This cache has one for each Hudi Catalog.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_external_table_cache_num`, the default is 1000.

	This parameter can be adjusted appropriately according to the number of Hudi tables.

- Expiration Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest Hudi partition properties in Doris, but it will increase the frequency of accessing external data sources.

### Iceberg Table Information

Used to cache Iceberg table objects. These objects are loaded and constructed through the Iceberg API.

This cache has one for each Iceberg Catalog.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_external_table_cache_num`, the default is 1000.

	This parameter can be adjusted appropriately according to the number of Iceberg tables.

- Expiration Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest Iceberg table properties in Doris, but it will increase the frequency of accessing external data sources.

### Iceberg Table Snapshot

Used to cache the Snapshot list of Iceberg tables. These objects are loaded and constructed through the Iceberg API.
This cache has one for each Iceberg Catalog.

- Maximum Cache Quantity

	Controlled by the FE configuration item `max_external_table_cache_num`, the default is 1000.

	This parameter can be adjusted appropriately according to the number of Iceberg tables.

- Expiration Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes. The default is 10 minutes. Reducing this time can allow more real-time access to the latest Iceberg table properties in Doris, but it will increase the frequency of accessing external data sources.

## Cache Refresh

In addition to the refresh and expiration strategies of each cache mentioned above, users can also manually or regularly refresh the metadata cache.

### Manual Refresh

Users can manually refresh metadata through the `REFRESH` command.

1. `REFRESH CATALOG`

	Refresh the specified Catalog.

	`REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

	- This command will refresh the database list, table column names, and all cache information of the specified Catalog.
	- `invalid_cache` indicates whether to refresh caches such as partition and file lists. The default is true. If false, only the database and table lists of the Catalog will be refreshed, and caches such as partition and file lists will not be refreshed. This parameter is applicable when the user only wants to synchronize newly added or deleted database and table information and can be set to false.

2. `REFRESH DATABASE`

	Refresh the specified Database.

	`REFRESH DATABASE [ctl.]db1 PROPERTIES("invalid_cache" = "true");`

	- This command will refresh the table column names and all cache information under the specified Database.
	- The meaning of the `invalid_cache` property is the same as above. The default is true. If false, only the table list of the Database will be refreshed, and cache information will not be refreshed. This parameter is applicable when the user only wants to synchronize newly added or deleted table information.

3. `REFRESH TABLE`

	Refresh the specified Table.

	`REFRESH TABLE [ctl.][db.]tbl1;`

	- This command will refresh all cache information under the specified Table.

### Regular Refresh

Users can set the regular refresh of the Catalog when creating the Catalog.

```
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '3600'
);
```

In the above example, `metadata_refresh_interval_sec` means refreshing the Catalog every 3600 seconds. It is equivalent to automatically executing once every 3600 seconds:

`REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

## Best Practices

Caching can significantly improve the performance of metadata access, avoiding frequent remote access to metadata that causes performance jitter or puts pressure on metadata services. However, caching will reduce data timeliness. For example, if the cache refresh time is 10 minutes, only cached metadata can be read within ten minutes. Therefore, it is necessary to set the cache reasonably according to the situation.

### Default Behavior

This section mainly introduces the cache behavior that users may be concerned about under the default parameter configuration.

- After a new database or table is added to the external data source, it can be queried in real-time in Doris through SELECT. However, SHOW DATABASES and SHOW TABLES may not be visible, and the cache needs to be manually refreshed or waited for up to 10 minutes.
- New partitions added to the external data source need to be manually refreshed or waited for up to 10 minutes to query the new partition data.
- Changes in partition data files need to be manually refreshed or waited for up to 10 minutes to query the new partition data.

### Disable Hive Catalog Metadata Cache

For the Hive Catalog, if you want to disable the cache to query real-time updated data, you can configure the following parameters:

```
-- fe.conf
max_external_file_cache_num=0    // Disable file list cache
max_hive_partition_table_cache_num=0  // Disable partition list cache

-- Catalog property
"file.meta.cache.ttl-second" = "0" // Disable file list cache for a specific Catalog
"partition.cache.ttl-second" = "0" // Disable partition list cache for a specific Catalog(Since 2.1.11, 3.0.6)
```

After setting the above parameters:

- New partitions in the external data source can be queried in real-time.
- Changes in partition data files can be queried in real-time.

But it will increase the access pressure on external source data (such as Hive Metastore and HDFS), which may lead to unstable metadata access delays.

