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

To improve the performance of accessing external data sources, Apache Doris caches the **metadata** of external data sources.

Metadata includes information about databases, tables, columns, partitions, snapshots, file column names, and more.

This document provides detailed information on the types, strategies, and related parameter configurations of cached metadata.

For information on **data caching**, refer to the [Data Cache Documentation](./filecache.md).

:::tip
This document is applicable for versions 2.1.6 and later.
:::

## Cache Policy Explanation

Most caches have the following three policy metrics:

- Maximum Cache Count

	The maximum number of objects that the cache can hold. For example, caching up to 1000 tables. When the cache count exceeds the threshold, the LRU (Least-Recently-Used) policy is used to remove some cache entries.

- Eviction Time

	After a certain period of time, an object written to the cache will be automatically removed from the cache. Upon the next access, the cache will fetch the latest information from the data source and update the cache.

	For example, if a user accesses table A for the first time at 08:00 and it is cached, with an eviction time of 4 hours, between 08:00 and 14:00 without being evicted due to capacity issues, the user will directly access table A from the cache. After 14:00, the cache is evicted. If the user accesses table A again, the cache will be updated with the latest information from the data source.

	This policy is mainly used to automatically remove objects from the cache that are no longer accessed, reducing cache space usage.

- Minimum Refresh Time

	After a certain period of time, an object written to the cache will be automatically refreshed.

	For example, if a user accesses table A for the first time at 08:00 and it is cached, with a minimum refresh time of 10 minutes, between 08:00 and 08:10 without being evicted due to capacity issues, the user will directly access table A from the cache. At 08:10, the cache object will be marked as **ready to refresh**. When the user accesses this cache object again, the cache refresh operation will be triggered. Assuming the cache update takes 1 minute, accessing the cache again after 1 minute will return the updated cache object.

	Note that the cache refresh is triggered when the cache object is accessed for the first time after exceeding the minimum refresh time, and it is done asynchronously. Therefore, a minimum refresh time of 10 minutes does not guarantee that the latest object will be obtained after 10 minutes.

	This policy differs from the **Eviction Time** and is mainly used to adjust the timeliness of the cache and avoid blocking current operations by updating the cache asynchronously.

## Cache Types

### Database and Table Name Lists

The database name list refers to a list of names of all databases under a Catalog.

The table name list refers to a list of names of all tables under a database.

Name lists are used only for operations that require listing names, such as `SHOW TABLES` or `SHOW DATABASES` statements.

Each Catalog has a database name list cache, and each database has a table name list cache.

- Maximum Cache Count

	Each cache has only one entry. Therefore, the maximum cache count is 1.

- Eviction Time

	Fixed at 86400 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. The unit is minutes, with a default of 10 minutes. Reducing this time allows for more real-time viewing of the latest name lists in Doris but increases the frequency of accessing external data sources.

### Database and Table Objects

Cache individual library and table objects. Any access operations on libraries or tables, such as queries, writes, etc., will retrieve the corresponding objects from this cache.

Note that the list of objects in this cache may be inconsistent with the cache of **Database and Table Name Lists** Cache .

For example, by using the `SHOW TABLES` command, you can retrieve tables `A`, `B`, `C` from the name list cache. Suppose an external data source adds table `D` at this time, then `SELECT * FROM D` can access table `D`, and the cache of table objects will add the object of table `D`, but the cache of table names may still be `A`, `B`, `C`. Only when the cache of table names is refreshed, it will become `A`, `B`, `C`, `D`.

Each Catalog has a cache of library names. Each library has a cache of table names.

- Maximum cache count

	Controlled by the FE configuration item `max_meta_object_cache_num`, default is 1000. This parameter can be adjusted according to the number of databases under a single Catalog or the number of tables under a single database.

- Eviction time

	Fixed at 86400 seconds.

- Minimum refresh time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is minutes. Default is 10 minutes. Decreasing this time can provide more real-time access to the latest libraries or tables in Doris, but will increase the frequency of accessing external data sources.

### Table Schema

Cache schema information of tables, such as column names. This cache is mainly used to lazily load the schema of tables that are accessed to prevent synchronizing the schema of a large number of tables that are not needed to be accessed and occupying the FE's memory.

This cache is shared by all Catalogs and is globally unique.

- Maximum cache count

	Controlled by the FE configuration item `max_external_schema_cache_num`, default is 10000.

	This parameter can be adjusted according to the number of all tables under a Catalog.

- Eviction time

	Fixed at 86400 seconds.

- Minimum refresh time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is minutes. Default is 10 minutes. Decreasing this time can provide more real-time access to the latest Schema in Doris, but will increase the frequency of accessing external data sources.

### Hive Metastore Table Partition List

Used to cache the partition list of tables synchronized from Hive Metastore. The partition list is used for partition pruning during queries.

Each Hive Catalog has this cache.

- Maximum cache count

	Controlled by the FE configuration item `max_hive_partition_table_cache_num`, default is 1000.

	This parameter can be adjusted according to the number of all tables under a Catalog.

- Eviction time

	Fixed at 28800 seconds.

- Minimum refresh time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is minutes. Default is 10 minutes. Decreasing this time can provide more real-time access to the latest partition list in Doris, but will increase the frequency of accessing external data sources.

### Hive Metastore Table Partition Properties

Used to cache the properties of each partition of Hive tables, such as file format, partition root path, etc. After each query, when the partition list to be accessed is obtained through partition pruning, this cache is used to retrieve detailed properties of each partition.

Each Hive Catalog has this cache.

- Maximum cache count

	Controlled by the FE configuration item `max_hive_partition_cache_num`, default is 10000.

	This parameter can be adjusted according to the total number of partitions that need to be accessed under a Catalog.

- Eviction time

	Fixed at 28800 seconds.

- Minimum refresh time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is minutes. Default is 10 minutes. Decreasing this time can provide more real-time access to the latest partition properties in Doris, but will increase the frequency of accessing external data sources.

### Hive Metastore Table Partition File List

Used to cache the file list information of files under a single partition of Hive tables. This cache is used to reduce the overhead of listing operations on the file system.

- Maximum cache count

	Controlled by the FE configuration item `max_external_file_cache_num`, default is 100000.

	This parameter can be adjusted according to the number of files that need to be accessed.

- Eviction time

	Default is 28800 seconds. If the `file.meta.cache.ttl-second` property is set in the Catalog attributes, then the set time will be used.

	In some cases, the data files of Hive tables may change frequently, making the cache unable to meet the timeliness. By setting this parameter to 0, the cache can be disabled. In this case, the file list will be obtained in real-time for each query, which may reduce performance but improve file timeliness.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is in minutes. Default is 10 minutes. Decreasing this time allows for more real-time access to the latest partition properties in Doris, but will increase the frequency of accessing external data sources.

### Hudi Table Partition

Used to cache partition information for Hudi tables.

Each Hudi Catalog has this cache.

- Maximum Cache Count

	Controlled by the FE configuration item `max_hive_table_cache_num`, default is 1000.

	This parameter can be adjusted based on the number of Hudi tables.

- Eviction Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is in minutes. Default is 10 minutes. Decreasing this time allows for more real-time access to the latest Hudi partition properties in Doris, but will increase the frequency of accessing external data sources.

### Iceberg Table Information

Used to cache Iceberg table objects. These objects are loaded and constructed through the Iceberg API.

Each Iceberg Catalog has this cache.

- Maximum Cache Count

	Controlled by the FE configuration item `max_hive_table_cache_num`, default is 1000.

	This parameter can be adjusted based on the number of Iceberg tables.

- Eviction Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is in minutes. Default is 10 minutes. Decreasing this time allows for more real-time access to the latest Iceberg table properties in Doris, but will increase the frequency of accessing external data sources.

### Iceberg Table Snapshot

Used to cache the Snapshot list of Iceberg tables. These objects are loaded and constructed through the Iceberg API.

Each Iceberg Catalog has this cache.

- Maximum Cache Count

	Controlled by the FE configuration item `max_hive_table_cache_num`, default is 1000.

	This parameter can be adjusted based on the number of Iceberg tables.

- Eviction Time

	Fixed at 28800 seconds.

- Minimum Refresh Time

	Controlled by the FE configuration item `external_cache_expire_time_minutes_after_access`. Unit is in minutes. Default is 10 minutes. Decreasing this time allows for more real-time access to the latest Iceberg table properties in Doris, but will increase the frequency of accessing external data sources.

## Cache Refresh

In addition to the individual refresh and eviction strategies for each cache mentioned above, users can also manually or periodically refresh metadata caches directly.

### Manual Refresh

Users can manually refresh metadata using the `REFRESH` command.

1. REFRESH CATALOG

	Refreshes the specified Catalog.

	`REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");`

	- This command will refresh the library list, table column names, and all cache information of the specified Catalog.
	- `invalid_cache` indicates whether to refresh cache such as partition and file lists. Default is true. If set to false, it will only refresh the library and table lists of the Catalog without refreshing cache information like partition and file lists. This parameter is useful when users only want to synchronize newly added or deleted library and table information, it can be set to false.

2. REFRESH DATABASE

	Refreshes the specified Database.

	`REFRESH DATABASE [ctl.]db1 PROPERTIES("invalid_cache" = "true");`

	- This command will refresh the table column names of the specified Database and all cache information under the Database.
	- The meaning of `invalid_cache` property is the same as above. Default is true. If set to false, it will only refresh the table lists of the Database without refreshing cache information. This parameter is useful when users only want to synchronize newly added or deleted table information.

3. REFRESH TABLE

	Refreshes the specified Table.

	`REFRESH TABLE [ctl.][db.]tbl1;`

	- This command will refresh all cache information under the specified Table.

### Scheduled Refresh

Users can set a scheduled refresh for a Catalog when creating it.

```
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'metadata_refresh_interval_sec' = '600'
);
```

In the above example, `metadata_refresh_interval_sec` indicates refreshing the Catalog every 600 seconds. This is equivalent to automatically executing:

`REFRESH CATALOG ctl1 PROPERTIES("invalid_cache" = "true");` every 600 seconds.

The refresh interval must not be less than 5 seconds.

## Best Practices

Caching can significantly improve the accessibility of metadata, avoiding frequent remote access to metadata causing performance fluctuations or putting pressure on metadata services. However, caching will reduce the timeliness of data. For example, if the cache refresh time is 10 minutes, only cached metadata can be read within ten minutes. Therefore, it is necessary to set the cache reasonably according to the situation.

### Default Behavior

Here mainly introduces the caching behavior that users may be concerned about under default parameter configurations.

- After adding a new database or table in an external data source, it can be queried in Doris in real-time using SELECT. However, SHOW DATABASES and SHOW TABLES may not be visible and require manual cache refresh or a maximum wait of 10 minutes.
- After adding a new partition in an external data source, manual cache refresh is required, or after a maximum wait of 10 minutes, data from the new partition can be queried.
- If there are changes in partition data files, manual cache refresh is required, or after a maximum wait of 10 minutes, data from the new partition can be queried.

### Disabling Hive Catalog Metadata Cache

For Hive Catalog, if you want to disable the cache to query real-time updated data, you can configure the following parameter:

```
-- fe.conf
max_hive_partition_table_cache_num=0  // Close partition list cache
max_external_file_cache_num=0    // Close file list cache

-- Catalog property
"file.meta.cache.ttl-second" = "0" // Close file list cache for certain catalog
```

After setting the above parameter:

- New partitions from external data sources can be queried in real-time.
- Changes in partition data files can be queried in real-time.

However, this may increase the access pressure on external data sources (such as Hive Metastore and HDFS), which may lead to unstable metadata access delays and other phenomena.

## Version Behavior Changes

In version 2.1.5, the `use_meta_cache` attribute was added to the Catalog properties, defaulting to false.

:::warning
Do not set `use_meta_cache` to true before 2.1.6.
:::

In version 2.1.6, for newly created Catalogs, this attribute is default changed to true to correspond to the caching behavior described in this document. It is recommended that users upgrade to version 2.1.6 and rebuild existing Catalogs to align the default behavior with the description in this document.

