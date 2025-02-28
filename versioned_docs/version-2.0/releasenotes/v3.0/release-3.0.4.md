---
{
    "title": "Release 3.0.4",
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


Dear community members, the Apache Doris 3.0.4 version was officially released on February 02, 2025, this version further enhances the performance and stability of the system.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavior Changes

- In the Audit log, the `force` flag is retained for `drop table` and `drop database` statements.  [#43227](https://github.com/apache/doris/pull/43227) 

- When exporting data to Parquet/ORC formats, the `bitmap`, `quantile_state`, and `hll` types are exported in Binary format. Additionally, support has been added for exporting `jsonb` and `variant` types, which are exported as `string`. [#44041](https://github.com/apache/doris/pull/44041) 

  - For more information, please refer to documentation: [Export Overview - Apache Doris](https://doris.apache.org/docs/3.0/data-operate/export/export-overview)

- The Hudi JNI Scanner has been replaced from Spark API to Hadoop API to enhance compatibility. Users can switch by setting the session variable `set hudi_jni_scanner=spark/hadoop`. [#44396](https://github.com/apache/doris/pull/44396) 
- The use of `auto bucket` in Colocate tables is prohibited.  [#44396](https://github.com/apache/doris/pull/44396) 
- Paimon cache has been added to the Catalog, eliminating real-time data queries.  [#44911 ](https://github.com/apache/doris/pull/44911)
- The default value of `max_broker_concurrency` has been increased to improve performance for large-scale data imports with Broker Load. [#44929](https://github.com/apache/doris/pull/44929) 
- The default value of the `storage medium` for Auto Partition partitions has been changed to the attribute value of the current table's `storage medium`, rather than using the system default value. [#45955](https://github.com/apache/doris/pull/45955) 
- Column updates are prohibited during Schema Change execution for Key columns. [#46347](https://github.com/apache/doris/pull/46347) 
- For Key columns containing auto-increment columns, support has been added to allow column updates without providing the auto-increment column.  [#44528](https://github.com/apache/doris/pull/44528) 
- The FE ID generator strategy has been switched to a time-based approach, and IDs no longer start from 10000. [#44790](https://github.com/apache/doris/pull/44790) 
- In the compute-storage separation mode, the default stale rowset recycling delay for Compaction has been reduced to 1800 seconds to decrease the recycling interval. This may cause large queries to fail in extreme scenarios, and adjustments can be made as needed. [#45460](https://github.com/apache/doris/pull/45460) 
- The `show cache hotspot` statement has been disabled in compute-storage separation mode, and direct access to system tables is required. [#47332](https://github.com/apache/doris/pull/47332) 
- Deleting the system-created `admin` user is prohibited. [#44751](https://github.com/apache/doris/pull/44751) 

## Improvements

### Storage

- Optimized the issue of Routine Load tasks frequently timing out due to a small `max_match_interval` setting. [#46292](https://github.com/apache/doris/pull/46292) 
- Improved performance for Broker Load when importing multiple compressed files. [#43975](https://github.com/apache/doris/pull/43975) 
- Increased the default value of `webserver_num_workers` to enhance Stream Load performance. [#46593](https://github.com/apache/doris/pull/46593) 
- Optimized the load imbalance issue for Routine Load import tasks during BE node scaling. [#44798](https://github.com/apache/doris/pull/44798) 
- Improved the use of Routine Load thread pools to prevent timeouts from affecting queries. [#45039](https://github.com/apache/doris/pull/45039) 

### Compute-Storage Separation

- Enhanced the stability and observability of the Meta-service. [#44036](https://github.com/apache/doris/pull/44036), [#45617](https://github.com/apache/doris/pull/45617), [#45255](https://github.com/apache/doris/pull/45255), [#45068](https://github.com/apache/doris/pull/45068) 
- Optimized File Cache by adding an early eviction strategy, reducing lock time, and improving query performance. [#47473](https://github.com/apache/doris/pull/47473), [#45678](https://github.com/apache/doris/pull/45678), [#47472](https://github.com/apache/doris/pull/47472) 
- Improved initialization checks and queue transitions for File Cache to enhance stability. [#44004](https://github.com/apache/doris/pull/44004), [#44429](https://github.com/apache/doris/pull/44429), [#45057](https://github.com/apache/doris/pull/45057), [#47229](https://github.com/apache/doris/pull/47229) 
- Increased the speed of HDFS data recycling. [#46393](https://github.com/apache/doris/pull/46393) 
- Optimized performance issues when the FE acquires compute groups during ultra-high-frequency imports.  [#47203](https://github.com/apache/doris/pull/47203) 
- Improved several import-related parameters for primary key tables in compute-storage separation to enhance the stability of real-time high-concurrency imports. [#47295](https://github.com/apache/doris/pull/47295), [#46750](https://github.com/apache/doris/pull/46750), [#46365](https://github.com/apache/doris/pull/46365) 

### Lakehouse

- Supported reading Hive tables in JSON format. [#43469](https://github.com/apache/doris/pull/46393) 

  - For more information, please refer to documentation: [Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#json)

- Introduced the session variable `enable_text_validate_utf8` to skip UTF-8 encoding checks for CSV formats.  [#45537](https://github.com/apache/doris/pull/45537) 

  - For more information, please refer to documentation: [Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#character-set)

- Updated the Hudi version to 0.15 and optimized query planning performance for Hudi tables.
- Improved read performance for MaxCompute partitioned tables.  [#45148](https://github.com/apache/doris/pull/45148) 
- Optimized performance for Parquet file delayed materialization under high filter rates.  [#46183](https://github.com/apache/doris/pull/46183) 
- Supported delayed materialization for complex Parquet types. [#44098](https://github.com/apache/doris/pull/44098) 
- Optimized predicate pushdown logic for ORC types, supporting more predicate conditions for index filtering. [#43255](https://github.com/apache/doris/pull/43255) 

### Asynchronous Materialized Views

- Supported more scenarios for aggregate roll-up rewriting.  [#44412](https://github.com/apache/doris/pull/44412) 

### Query Optimizer

- Improved partition pruning performance. [#46261](https://github.com/apache/doris/pull/46261) 
- Added rules to eliminate `group by` keys based on data characteristics.  [#43391](https://github.com/apache/doris/pull/43391) 
- Adaptively adjusted the wait time for Runtime Filters based on the target table size. [#42640](https://github.com/apache/doris/pull/42640) 
- Improved the ability to push down aggregations in joins to fit more scenarios. [#43856](https://github.com/apache/doris/pull/43856), [#43380](https://github.com/apache/doris/pull/43380) 
- Improved Limit pushdown for aggregations to fit more scenarios. [#44042](https://github.com/apache/doris/pull/44042) 

### Others

- Optimized startup scripts for FE, BE, and MS processes to provide clearer output. [#45610](https://github.com/apache/doris/pull/45610), [#45490](https://github.com/apache/doris/pull/45490), [#45883](https://github.com/apache/doris/pull/45883) 
- The case sensitivity of table names in `show tables` now matches MySQL behavior. [#46030](https://github.com/apache/doris/pull/46030) 
- `show index` now supports arbitrary target table types. [#45861](https://github.com/apache/doris/pull/45861) 
- `information_schema.columns` now supports displaying default values. [#44849](https://github.com/apache/doris/pull/44849) 
- `information_schema.views` now supports displaying view definitions. [#45857](https://github.com/apache/doris/pull/45857) 
- Supported the MySQL protocol `COM_RESET_CONNECTION` command. [#44747](https://github.com/apache/doris/pull/44747) 

## Bug Fixes

### Storage

- Fixed potential memory errors during the import process for aggregate table models.  [#46997](https://github.com/apache/doris/pull/46997) 
- Resolved the issue of Routine Load offset loss during FE master node restarts in compute-storage separation mode. [#46566](https://github.com/apache/doris/pull/46566) 
- Fixed memory leaks in FE Observer nodes during batch import scenarios in compute-storage mode. [#47244](https://github.com/apache/doris/pull/47244) 
- Resolved the issue of Cumulative Point rollback during Full Compaction with Order Data Compaction. [#44359](https://github.com/apache/doris/pull/44359) 
- Fixed the issue where Delete operations could temporarily prevent Tablet Compaction scheduling. [#43466](https://github.com/apache/doris/pull/43466) 
- Resolved incorrect Tablet states after Schema Change in multi-compute-cluster scenarios. [#45821](https://github.com/apache/doris/pull/45821) 
- Fixed the potential NPE error when performing Column Rename Schema Change on primary key tables with `sequence_type`. [#46906](https://github.com/apache/doris/pull/46906) 
- **Data Correctness**: Fixed correctness issues for primary key tables when importing partial column updates containing DELETE SIGN columns. [#46194](https://github.com/apache/doris/pull/46194) 
- Resolved potential memory leaks in FE when Publish tasks for primary key tables were continuously stuck. [#44846](https://github.com/apache/doris/pull/44846) 

### Compute-Storage Decoupled

- Fixed the issue where File Cache size could exceed the table data size. [#46561](https://github.com/apache/doris/pull/46561), [#46390](https://github.com/apache/doris/pull/46390) 
- Resolved upload failures at the 5MB boundary during data uploads.  [#47333](https://github.com/apache/doris/pull/47333) 
- Enhanced robustness by adding more parameter checks for several `alter` operations in Storage Vault.  [#45155](https://github.com/apache/doris/pull/45155), [#45156](https://github.com/apache/doris/pull/45156), [#46625](https://github.com/apache/doris/pull/46625), [#47078](https://github.com/apache/doris/pull/47078), [#45685](https://github.com/apache/doris/pull/45685), [#46779](https://github.com/apache/doris/pull/46779) 
- Resolved issues with data recycling failures or slow recycling due to improper Storage Vault configurations. [#46798](https://github.com/apache/doris/pull/46798), [#47536](https://github.com/apache/doris/pull/47536), [#47475](https://github.com/apache/doris/pull/47475), [#47324](https://github.com/apache/doris/pull/47324), [#45072](https://github.com/apache/doris/pull/45072) 
- Fixed the issue where data recycling could stall, preventing timely recycling.  [#45760](https://github.com/apache/doris/pull/45760) 
- Resolved incorrect retries for MTTM-230 errors in compute-storage separation mode.  [#47370](https://github.com/apache/doris/pull/47370), [#47326](https://github.com/apache/doris/pull/47326) 
- Fixed the issue where Group Commit WAL was not fully replayed during BE decommissioning in compute-storage separation mode.  [#47187](https://github.com/apache/doris/pull/47187) 
- Resolved the issue where Tablet Meta exceeding 2GB rendered MS unavailable.  [#44780](https://github.com/apache/doris/pull/44780) 
- **Data Correctness**: Fixed two duplicate Key issues in primary key tables in compute-storage separation mode. [#46039](https://github.com/apache/doris/pull/46039), [#44975](https://github.com/apache/doris/pull/44975) 
- Resolved the issue where Base Compaction could continuously fail due to large Delete Bitmaps in primary key tables during high-frequency real-time imports.  [#46969](https://github.com/apache/doris/pull/46969) 
- Modified incorrect retry logic for Schema Change in primary key tables in compute-storage separation mode to enhance robustness. [#46748](https://github.com/apache/doris/pull/46748) 

### Lakehouse

#### Hive

- Fixed the issue where Hive views created by Spark could not be queried.  [#43553](https://github.com/apache/doris/pull/43553) 
- Resolved the issue where certain Hive Transaction tables could not be read correctly. [#45753](https://github.com/apache/doris/pull/45753) 
- Fixed the issue where partition pruning failed for Hive tables with special characters in partitions.  [#42906](https://github.com/apache/doris/pull/42906) 

#### Iceberg

- Fixed the issue where Iceberg tables could not be created in Kerberos authentication environments.  [#43445](https://github.com/apache/doris/pull/43445) 
- Resolved the issue where `count(*)` queries were inaccurate for Iceberg tables with dangling deletes. [#44039](https://github.com/apache/doris/pull/44039) 
- Fixed the issue where query errors occurred due to mismatched column names in Iceberg tables. [#44470](https://github.com/apache/doris/pull/44470) 
- Resolved the issue where Iceberg tables could not be read after partition modifications. [#45367](https://github.com/apache/doris/pull/45367) 

#### Paimon

- Fixed the issue where Paimon Catalog could not access Alibaba Cloud OSS-HDFS.  [#42585](https://github.com/apache/doris/pull/42585) 

#### Hudi

- Fixed the issue where partition pruning failed for Hudi tables in certain scenarios.  [#44669](https://github.com/apache/doris/pull/44669) 

#### JDBC

- Fixed the issue where tables could not be retrieved using JDBC Catalog after enabling case-insensitive table names.

#### MaxCompute

- Fixed the issue where partition pruning failed for MaxCompute tables in certain scenarios. [#44508](https://github.com/apache/doris/pull/44508) 

#### Others

- Fixed the issue where export tasks caused memory leaks in FE. [#44019](https://github.com/apache/doris/pull/44019) 
- Resolved the issue where S3 object storage could not be accessed via HTTPS protocol. [#44242](https://github.com/apache/doris/pull/44242) 
- Fixed the issue where Kerberos authentication tickets could not be automatically refreshed.  [#44916](https://github.com/apache/doris/pull/44916) 
- Resolved the issue where reading Hadoop Block compressed format files failed. [#45289](https://github.com/apache/doris/pull/45289) 
- When querying ORC format data, CHAR type predicates are no longer pushed down to avoid potential result errors. [#45484](https://github.com/apache/doris/pull/45484) 

### Asynchronous Materialized Views

- Fixed the issue where transparent query rewriting could lead to planning or result errors in extreme scenarios.  [#44575](https://github.com/apache/doris/pull/44575), [#45744](https://github.com/apache/doris/pull/45744) 
- Resolved the issue where multiple build tasks could be generated during asynchronous materialized view scheduling in extreme scenarios. [#46020](https://github.com/apache/doris/pull/46020), [#46280](https://github.com/apache/doris/pull/46280) 

### Query Optimizer

- Fixed the issue where some expression rewrites could produce incorrect expressions. [#44770](https://github.com/apache/doris/pull/44770), [#44920](https://github.com/apache/doris/pull/44920), [#45922](https://github.com/apache/doris/pull/45922), [#45596](https://github.com/apache/doris/pull/45596) 
- Resolved occasional incorrect results from SQL Cache. [#44782](https://github.com/apache/doris/pull/44782), [#44631](https://github.com/apache/doris/pull/44631), [#46443](https://github.com/apache/doris/pull/46443), [#47266](https://github.com/apache/doris/pull/47266) 
- Fixed the issue where limit pushdown for aggregation operators could produce incorrect results in some scenarios. [#45369](https://github.com/apache/doris/pull/45369) 
- Resolved the issue where delayed materialization optimization could produce incorrect execution plans in some scenarios. [#45693](https://github.com/apache/doris/pull/45693), [#46551](https://github.com/apache/doris/pull/46551) 

### Query Execution

- Fixed the issue where regular expressions and `like` functions produced incorrect results with special characters. [#44547](https://github.com/apache/doris/pull/44547) 
- Resolved the issue where SQL Cache results could be incorrect when switching databases. [#44782](https://github.com/apache/doris/pull/44782) 
- Fixed a series of Arrow Flight-related issues. [#45023](https://github.com/apache/doris/pull/45023), [#43929](https://github.com/apache/doris/pull/43929) 
- Resolved the issue where results were incorrect when the Hash table for HashJoin exceeded 4GB in some cases. [#46461](https://github.com/apache/doris/pull/46461) 
- Fixed the overflow issue of the `convert_to` function with Chinese characters. [#46405](https://github.com/apache/doris/pull/46405) 
- Resolved the issue where results could be incorrect in extreme scenarios when `group by` was used with Limit. [#47844](https://github.com/apache/doris/pull/47844) 
- Fixed the issue where results could be incorrect when accessing certain system tables. [#47498](https://github.com/apache/doris/pull/47498) 
- Resolved the issue where the `percentile` function could cause system crashes. [#47068](https://github.com/apache/doris/pull/47068) 
- Fixed the performance degradation issue for single-table queries with Limit. [#46090](https://github.com/apache/doris/pull/46090) 
- Resolved the issue where `StDistanceSphere` and `StAngleSphere` functions caused system crashes. [#45508](https://github.com/apache/doris/pull/45508) 
- Fixed the issue where `map_agg` results were incorrect. [#40454](https://github.com/apache/doris/pull/40454) 

### Semi-structured Data Management

#### BloomFilter Index

- Fixed the exception caused by large parameters in BloomFilter Index. [#45780](https://github.com/apache/doris/pull/45780) 
- Resolved the issue of high memory usage during BloomFilter Index writes. [#45833](https://github.com/apache/doris/pull/45833) 
- Fixed the issue where BloomFilter Index was not correctly deleted when columns were dropped. [#44361](https://github.com/apache/doris/pull/44361), [#43378](https://github.com/apache/doris/pull/43378) 

#### Inverted Index

- Fixed the occasional crash during inverted index construction. [#43246](https://github.com/apache/doris/pull/43246) 
- Resolved the issue where words with zero occurrences occupied space during inverted index merging. [#43113](https://github.com/apache/doris/pull/43113) 
- Prevented abnormal large values in Index Size statistics. [#46549](https://github.com/apache/doris/pull/46549) 
- Fixed the issue with inverted indexes for VARIANT type fields. [#43375](https://github.com/apache/doris/pull/43375) 
- Optimized local cache locality for inverted indexes to improve cache hit rates. [#46518](https://github.com/apache/doris/pull/46518) 
- Added the metric `NumInvertedIndexRemoteIOTotal` to query profiles for remote storage reads of inverted indexes. [#45675](https://github.com/apache/doris/pull/45675), [#44863](https://github.com/apache/doris/pull/44863)

#### Others

- Fixed the crash issue of the `ipv6_cidr_to_range` function with special NULL data. [#44700](https://github.com/apache/doris/pull/44700) 

### Permissions

- When granting `CREATE_PRIV`, the existence of the corresponding resource is no longer checked. [#45125](https://github.com/apache/doris/pull/45125) 
- Fixed the issue where queries on views with permissions could fail due to missing permissions for referenced tables in extreme scenarios. [#44621](https://github.com/apache/doris/pull/44621) 
- Resolved the issue where permission checks for `use db` did not distinguish between internal and external Catalogs. [#45720](https://github.com/apache/doris/pull/45720) 