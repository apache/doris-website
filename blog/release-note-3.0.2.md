---
{
    'title': 'Apache Doris 3.0.2 just released',
    'summary': 'In this version, Apache Doris has improvements in compute-storage decoupling, data storage, lakehouse, query optimizer, query execution and more.',
    'description': 'In this version, Apache Doris has improvements in compute-storage decoupling, data storage, lakehouse, query optimizer, query execution and more.',
    'date': '2024-10-15',
    'author': 'Apache Doris',
    'tags': ['Release Notes'],
    "image": '/images/3.0.2.jpg'
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



Dear community members, the Apache Doris 3.0.2 version was officially released on October 15, 2024, featuring updates and improvements in compute-storage decoupling, data storage, lakehouse, query optimizer, query execution and more.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavioral Changes

### Storage

- Limited the number of tablets in a single backup task to prevent FE memory overflow. [#40518](https://github.com/apache/doris/pull/40518)  
- The `SHOW PARTITIONS` command now displays the `CommittedVersion` of partitions. [#28274](https://github.com/apache/doris/pull/28274)  

### Other

- The default printing mode (asynchronous) of `fe.log` now includes file line number information. If performance issues are encountered due to line number output, please switch to BRIEF mode. [#39419](https://github.com/apache/doris/pull/39419)  
- The default value of the session variable `ENABLE_PREPARED_STMT_AUDIT_LOG` has been changed from `true` to `false`, and the audit log of prepare statements will no longer be printed. [#38865](https://github.com/apache/doris/pull/38865)  
- The default value of the session variable `max_allowed_packet` has been adjusted from 1MB to 16MB to align with MySQL 8.4. [#38697](https://github.com/apache/doris/pull/38697)  
- The JVM of FE and BE defaults to using the UTF-8 character set. [#39521](https://github.com/apache/doris/pull/39521)  

## New Features

### Storage

- Backup and recovery now support clearing tables or partitions that are not in the backup. [#39028](https://github.com/apache/doris/pull/39028)  

### Compute-Storage Decoupled

- Support for parallel recycling of expired data on multiple tablets. [#37630](https://github.com/apache/doris/pull/37630)  
- Support for changing storage vaults through `ALTER` statements. [#38685](https://github.com/apache/doris/pull/38685)  [#37606](https://github.com/apache/doris/pull/37606)  
- Support for importing a large number of tablets (5000+) in a single transaction (experimental feature). [#38243](https://github.com/apache/doris/pull/38243)  
- Support for automatically aborting pending transactions caused by reasons such as node restarts, solving the issue of pending transactions blocking decommission or schema change. [#37669](https://github.com/apache/doris/pull/37669)  
- A new session variable `enable_segment_cache` has been added to control whether to use segment cache during queries (default is `true`). [#37141](https://github.com/apache/doris/pull/37141)  
- Resolved the issue of not being able to import a large amount of data during schema changes in compute-storage decoupled mode. [#39558](https://github.com/apache/doris/pull/39558)  
- Support for adding multiple follower roles of FE in compute-storage decoupled mode. [#38388](https://github.com/apache/doris/pull/38388)  
- Support for using memory as file cache to accelerate queries in environments with no disks or low-performance HDDs. [#38811](https://github.com/apache/doris/pull/38811)  

### Lakehouse

- New Lakesoul Catalog has been added. [Apache Doris Docs](https://doris.apache.org/zh-CN/docs/dev/lakehouse/datalake-analytics/lakesoul)  
- A new system table `catalog_meta_cache_statistics` has been added to view the usage of various metadata caches in external catalog. [#40155](https://github.com/apache/doris/pull/40155)  

### Query Optimizer

- Support for `is [not] true/false` expressions. [#38623](https://github.com/apache/doris/pull/38623)  

### Query Execution

- A new CRC32 function has been added. [#38204](https://github.com/apache/doris/pull/38204)  
- New aggregate functions skew and kurt have been added. [#41277](https://github.com/apache/doris/pull/41277)  
- Profiles are now persisted to the FE's disk to retain more profiles. [#33690](https://github.com/apache/doris/pull/33690)  
- A new system table `workload_group_privileges` has been added to view permission information related to workload groups. [#38436](https://github.com/apache/doris/pull/38436)  
- A new system table `workload_group_resource_usage` has been added to monitor resource statistics of workload groups. [#39177](https://github.com/apache/doris/pull/39177)  
- Workload groups now support limiting reads of local IO and remote IO. [#39012](https://github.com/apache/doris/pull/39012)  
- Workload groups now support cgroupv2 to limit CPU usage. [#39374](https://github.com/apache/doris/pull/39374)  
- A new system table `information_schema.partitions` has been added to view some table creation attributes. [#40636](https://github.com/apache/doris/pull/40636)  

### Other

- Support for using the `SHOW` statement to display BE's configuration information, such as `SHOW BACKEND CONFIG LIKE ${pattern}`. [#36525](https://github.com/apache/doris/pull/36525)  

## Improvements

### Load

- Improved the import efficiency of routine load when encountering frequent EOFs from Kafka. [#39975](https://github.com/apache/doris/pull/39975)  
- The stream load result now includes the time taken to read HTTP data, `ReceiveDataTimeMs`, which can quickly determine slow stream load issues caused by network reasons. [#40735](https://github.com/apache/doris/pull/40735)  
- Optimized the routine load timeout logic to avoid frequent timeouts during inverted index and mow writes. [#40818](https://github.com/apache/doris/pull/40818)  

### Storage

- Support for batch addition of partitions. [#37114](https://github.com/apache/doris/pull/37114)  

### Compute-Storage Decoupled

- Added the meta-service HTTP interface `/MetaService/http/show_meta_ranges` to facilitate the statistics of KV distribution in FDB. [#39208](https://github.com/apache/doris/pull/39208)  
- The meta-service/recycler stop script ensures that the process fully exits before returning. [#40218](https://github.com/apache/doris/pull/40218)  
- Support for using the session variable `version_comment` (Cloud Mode) to display the current deployment mode as compute-storage decoupled. [#38269](https://github.com/apache/doris/pull/38269)  
- Fixed the detailed message returned when transaction submission fails. [#40584](https://github.com/apache/doris/pull/40584)  
- Support for using one meta-service process to provide both metadata services and data recycling services. [#40223](https://github.com/apache/doris/pull/40223)  
- Optimized the default configuration of file_cache to avoid potential issues when not set. [#41421](https://github.com/apache/doris/pull/41421)  [#41507](https://github.com/apache/doris/pull/41507)  
- Improved query performance by batch retrieving the version of multiple partitions. [#38949](https://github.com/apache/doris/pull/38949)  
- Delayed the redistribution of tablets to avoid query performance issues caused by temporary network fluctuations. [#40371](https://github.com/apache/doris/pull/40371)  
- Optimized the read-write lock logic in the balance. [#40633](https://github.com/apache/doris/pull/40633)  
- Enhanced the robustness of file cache in handling TTL filenames during restarts/crashes. [#40226](https://github.com/apache/doris/pull/40226)  
- Added the BE HTTP interface `/api/file_cache?op=hash` to facilitate the calculation of the hash file names of segment files on disk. [#40831](https://github.com/apache/doris/pull/40831)  
- Optimized the unified naming to be compatible with using compute group to represent BE groups (original cloud cluster). [#40767](https://github.com/apache/doris/pull/40767)  
- Optimized the waiting time for obtaining locks when calculating delete bitmaps in primary key tables. [#40341](https://github.com/apache/doris/pull/40341) 
- When there are many delete bitmaps in primary key tables, optimized the high CPU consumption during queries by pre-merging multiple delete bitmaps. [#40204](https://github.com/apache/doris/pull/40204)  
- Support for managing FE/BE nodes in compute-storage decoupled mode through SQL statements, hiding the logic of direct interaction with meta-service when deploying in compute-storage decoupled mode. [#40264](https://github.com/apache/doris/pull/40264)  
- Added a script for rapid deployment of FDB. [#39803](https://github.com/apache/doris/pull/39803)  
- Optimized the output of `SHOW CACHE HOTSPOT` to unify the column name style with other `SHOW` statements. [#41322](https://github.com/apache/doris/pull/41322)  
- When using a storage vault as the storage backend, disallowed the use of `latest_fs()` to avoid binding different storage backends to the same table. [#40516](https://github.com/apache/doris/pull/40516)  
- Optimized the timeout strategy for calculating delete bitmaps when importing mow tables. [#40562](https://github.com/apache/doris/pull/40562)  [#40333](https://github.com/apache/doris/pull/40333)  
- The enable_file_cache in be.conf is now enabled by default in compute-storage decoupled mode. [#41502](https://github.com/apache/doris/pull/41502)  

### Lakehouse

- When reading tables in CSV format, support for the session `keep_carriage_return` setting to control the reading behavior of the `\r` symbol. [#39980](https://github.com/apache/doris/pull/39980)  
- The default maximum memory of BE's JVM has been adjusted to 2GB (affecting only new deployments). [#41403](https://github.com/apache/doris/pull/41403)  
- Hive Catalog has added `hive.recursive_directories_table` and `hive.ignore_absent_partitions` properties to specify whether to recursively traverse data directories and whether to ignore missing partitions. [#39494](https://github.com/apache/doris/pull/39494)  
- Optimized the Catalog refresh logic to avoid generating a large number of connections during refresh. [#39205](https://github.com/apache/doris/pull/39205)  
- `SHOW CREATE DATABASE` and `SHOW CREATE TABLE` for external data sources now display location information. [#39179](https://github.com/apache/doris/pull/39179)  
- The new optimizer supports inserting data into JDBC external tables using the `INSERT INTO` statement. [#41511](https://github.com/apache/doris/pull/41511)  
- MaxCompute Catalog now supports complex data types. [#39259](https://github.com/apache/doris/pull/39259)  
- Optimized the logic for reading and merging data shards of external tables. [#38311](https://github.com/apache/doris/pull/38311)  
- Optimized some refresh strategies for metadata caches of external tables. [#38506](https://github.com/apache/doris/pull/38506)  
- Paimon tables now support pushing down `IN/NOT IN` predicates. [#38390](https://github.com/apache/doris/pull/38390)  
- Compatible with tables created in Parquet format by Paimon version 0.9. [#41020](https://github.com/apache/doris/pull/41020)  

### Asynchronous Materialized Views

- Building asynchronous materialized views now supports the use of both immediate and starttime. [#39573](https://github.com/apache/doris/pull/39573)  
- Asynchronous materialized views based on external tables will refresh the metadata cache of the external tables before refreshing the materialized views, ensuring construction based on the latest external table data. [#38212](https://github.com/apache/doris/pull/38212)  
- Partition incremental construction now supports rolling up according to weekly and quarterly granularities. [#39286](https://github.com/apache/doris/pull/39286)  

### Query Optimizer

- The aggregate function `GROUP_CONCAT` now supports the use of both `DISTINCT` and `ORDER BY`. [#38080](https://github.com/apache/doris/pull/38080)  
- Optimized the collection and use of statistical information, as well as the logic for estimating row counts and cost calculations, to generate more efficient and stable execution plans.
- Window function partition data pre-filtering now supports cases containing multiple window functions. [#38393](https://github.com/apache/doris/pull/38393)  

### Query Execution

- Reduced query latency by running prepare pipeline tasks in parallel. [#40874](https://github.com/apache/doris/pull/40874)  
- Display Catalog information in Profile. [#38283](https://github.com/apache/doris/pull/38283)  
- Optimized the computational performance of `IN` filtering conditions. [#40917](https://github.com/apache/doris/pull/40917)  
- Supported cgroupv2 in K8S to limit Doris's memory usage. [#39256](https://github.com/apache/doris/pull/39256)  
- Optimized the performance of converting strings to datetime types. [#38385](https://github.com/apache/doris/pull/38385)  
- When a `string` is a decimal number, support casting it to an `int`, which will be more compatible with certain behaviors of MySQL. [#38847](https://github.com/apache/doris/pull/38847)  

### Semi-Structured Data Management

- Optimized the performance of inverted index matching. [#41122](https://github.com/apache/doris/pull/41122)  
- Temporarily prohibited the creation of inverted indexes with tokenization on arrays. [#39062](https://github.com/apache/doris/pull/39062)  
- `explode_json_array` now supports binary JSON types. [#37278](https://github.com/apache/doris/pull/37278)  
- IP data types now support bloomfilter indexes. [#39253](https://github.com/apache/doris/pull/39253)  
- IP data types now support row storage. [#39258](https://github.com/apache/doris/pull/39258)  
- Nested data types such as ARRAY, MAP, and STRUCT now support schema changes. [#39210](https://github.com/apache/doris/pull/39210)  
- When creating MTMV, automatically truncate KEYs encountered in VARIANT data types. [#39988](https://github.com/apache/doris/pull/39988)  
- Lazy loading of inverted indexes during queries to improve performance. [#38979](https://github.com/apache/doris/pull/38979)  
- `add inverted index file size for open file`. [#37482](https://github.com/apache/doris/pull/37482)  
- Reduced access to object storage interfaces during compaction to improve performance. [#41079](https://github.com/apache/doris/pull/41079)  
- Added three new query profile metrics related to inverted indexes. [#36696](https://github.com/apache/doris/pull/36696)  
- Reduced cache overhead for non-PreparedStatement SQL to improve performance. [#40910](https://github.com/apache/doris/pull/40910)  
- Pre-warming cache now supports inverted indexes. [#38986](https://github.com/apache/doris/pull/38986)  
- Inverted indexes are now cached immediately after writing. [#39076](https://github.com/apache/doris/pull/39076)  

### Compatibility

- Fixed the issue of Thrift ID incompatibility on the master with branch-2.1. [#41057](https://github.com/apache/doris/pull/41057)  

### Other

- BE HTTP API now supports authentication; set config::enable_all_http_auth to true (default is false) when authentication is required. [#39577](https://github.com/apache/doris/pull/39577)  
- Optimized the user permissions required for the REFRESH operation. Permissions have been relaxed from ALTER to SHOW. [#39008](https://github.com/apache/doris/pull/39008)  
- Reduced the range of nextId when calling advanceNextId(). [#40160](https://github.com/apache/doris/pull/40160)  
- Optimized the caching mechanism for Java UDFs. [#40404](https://github.com/apache/doris/pull/40404)  

## Bug Fixes

### Load

- Fixed the issue where `abortTransaction` did not handle return codes. [#41275](https://github.com/apache/doris/pull/41275)  
- Fixed the issue where transactions failed to commit or abort in compute-storage decoupled mode without calling `afterCommit/afterAbort`. [#41267](https://github.com/apache/doris/pull/41267)  
- Fixed the issue where Routine Load could not work properly when modifying consumer offsets in compute-storage decoupled mode. [#39159](https://github.com/apache/doris/pull/39159)  
- Fixed the issue of repeatedly closing file handles when obtaining error log file paths. [#41320](https://github.com/apache/doris/pull/41320)  
- Fixed the issue of incorrect job progress caching for Routine Load in compute-storage decoupled mode. [#39313](https://github.com/apache/doris/pull/39313)  
- Fixed the issue where Routine Load could get stuck when failing to commit transactions in compute-storage decoupled mode. [#40539](https://github.com/apache/doris/pull/40539)  
- Fixed the issue where Routine Load kept reporting data quality check errors in compute-storage decoupled mode. [#39790](https://github.com/apache/doris/pull/39790)  
- Fixed the issue where Routine Load did not check transactions before committing in compute-storage decoupled mode. [#39775](https://github.com/apache/doris/pull/39775)  
- Fixed the issue where Routine Load did not check transactions before aborting in compute-storage decoupled mode. [#40463](https://github.com/apache/doris/pull/40463)  
- Fixed the issue where cluster keys did not support certain data types. [#38966](https://github.com/apache/doris/pull/38966)  
- Fixed the issue of transactions being repeatedly committed. [#39786](https://github.com/apache/doris/pull/39786)  
- Fixed the issue of use after free with WAL when BE exits. [#33131](https://github.com/apache/doris/pull/33131)  
- Fixed the issue where WAL playback did not skip completed import transactions in compute-storage decoupled mode. [#41262](https://github.com/apache/doris/pull/41262)  
- Fixed the logic for selecting BE in group commit in compute-storage decoupled mode. [#39986](https://github.com/apache/doris/pull/39986)  [#38644](https://github.com/apache/doris/pull/38644)  
- Fixed the issue where BE might crash when group commit was enabled for insert into. [#39339](https://github.com/apache/doris/pull/39339)  
- Fixed the issue where insert into with group commit enabled might get stuck. [#39391](https://github.com/apache/doris/pull/39391)  
- Fixed the issue where not enabling the group commit option during import might result in a table not found error. [#39731](https://github.com/apache/doris/pull/39731)  
- Fixed the issue of transaction submission timeouts due to too many tablets. [#40031](https://github.com/apache/doris/pull/40031)  
- Fixed the issue of concurrent opens with Auto Partition. [#38605](https://github.com/apache/doris/pull/38605)  
- Fixed the issue of import lock granularity being too large. [#40134](https://github.com/apache/doris/pull/40134)  
- Fixed the issue of coredumps caused by zero-length varchars. [#40940](https://github.com/apache/doris/pull/40940)  
- Fixed the issue of incorrect index Id values in log prints. [#38790](https://github.com/apache/doris/pull/38790)  
- Fixed the issue of memtable shifting not closing BRPC streaming. [#40105](https://github.com/apache/doris/pull/40105)  
- Fixed the issue of inaccurate bvar statistics during memtable shifting. [#39075](https://github.com/apache/doris/pull/39075)  
- Fixed the issue of multi-replication fault tolerance during memtable shifting. [#38003](https://github.com/apache/doris/pull/38003)  
- Fixed the issue of incorrect message length calculations for Routine Load with multiple tables in one stream. [#40367](https://github.com/apache/doris/pull/40367)  
- Fixed the issue of inaccurate progress reporting for Broker Load. [#40325](https://github.com/apache/doris/pull/40325)  
- Fixed the issue of inaccurate data scan volume reporting for Broker Load. [#40694](https://github.com/apache/doris/pull/40694)  
- Fixed the issue of concurrency with Routine Load in compute-storage decoupled mode. [#39242](https://github.com/apache/doris/pull/39242)  
- Fixed the issue of Routine Load jobs being canceled in compute-storage decoupled mode. [#39514](https://github.com/apache/doris/pull/39514)  
- Fixed the issue of progress not being reset when deleting Kafka topics. [#38474](https://github.com/apache/doris/pull/38474)  
- Fixed the issue of updating progress during transaction state transitions in Routine Load. [#39311](https://github.com/apache/doris/pull/39311)  
- Fixed the issue of Routine Load switching from a paused state to a paused state. [#40728](https://github.com/apache/doris/pull/40728)  
- Fixed the issue of Stream Load records being missed due to database deletion. [#39360](https://github.com/apache/doris/pull/39360)  

### Storage

- Fixed the issue of missing storage policies. [#38700](https://github.com/apache/doris/pull/38700)  
- Fixed the issue of errors during cross-version backup and recovery. [#38370](https://github.com/apache/doris/pull/38370)  
- Fixed the NPE issue with ccr binlog. [#39909](https://github.com/apache/doris/pull/39909)  
- Fixed potential issues with duplicate keys in mow. [#41309](https://github.com/apache/doris/pull/41309)  [#39791](https://github.com/apache/doris/pull/39791)  [#39958](https://github.com/apache/doris/pull/39958)  [#38369](https://github.com/apache/doris/pull/38369)  [#38331](https://github.com/apache/doris/pull/38331)  
- Fixed the issue of not being able to write after backup and recovery in high-frequency write scenarios. [#40118](https://github.com/apache/doris/pull/40118)  [#38321](https://github.com/apache/doris/pull/38321)  
- Fixed the issue of data errors potentially triggered by deleting empty strings and schema changes. [#41064](https://github.com/apache/doris/pull/41064)  
- Fixed the issue of incorrect statistics due to column updates. [#40880](https://github.com/apache/doris/pull/40880)  
- Limited the size of tablet meta pb to prevent BE crashes due to oversized meta. [#39455](https://github.com/apache/doris/pull/39455)  
- Fixed the potential column misalignment issue with the new optimizer in `begin; insert into values; commit`. [#39295](https://github.com/apache/doris/pull/39295)  

### Compute-Storage Decoupled

- Fixed the issue where the tablet distribution might be inconsistent across multiple FEs in compute-storage decoupled mode. [#41458](https://github.com/apache/doris/pull/41458)  
- Fixed the issue where TVF might not work in multi-computing group environments. [#39249](https://github.com/apache/doris/pull/39249)  
- Fixed the issue where compaction used resources that had already been released when BE exited in compute-storage decoupled mode. [#39302](https://github.com/apache/doris/pull/39302)  
- Fixed the issue where automatic start-stop might cause FE replay to get stuck. [#40027](https://github.com/apache/doris/pull/40027)  
- Fixed the issue where the BE status and the stored status in meta-service were inconsistent. [#40799](https://github.com/apache/doris/pull/40799)  
- Fixed the issue where the FE->meta-service connection pool could not automatically expire and reconnect. [#41202](https://github.com/apache/doris/pull/41202)  [#40661](https://github.com/apache/doris/pull/40661)  
- Fixed the issue where some tablets might repeatedly undergo unexpected balance processes during rebalance. [#39792](https://github.com/apache/doris/pull/39792)  
- Fixed the issue where storage vault permissions were lost after FE restarted. [#40260](https://github.com/apache/doris/pull/40260)  
- Fixed the issue where tablet row counts and other statistical information might be incomplete due to FDB scan range pagination. [#40494](https://github.com/apache/doris/pull/40494)  
- Fixed the performance issue caused by a large number of aborted transactions associated with the same label. [#40606](https://github.com/apache/doris/pull/40606)  
- Fixed the issue where `commit_txn` did not automatically re-enter, maintaining consistent behavior between compute-storage decoupled and integrated modes. [#39615](https://github.com/apache/doris/pull/39615)  
- Fixed the issue where the number of projected columns increased when dropping columns. [#40187](https://github.com/apache/doris/pull/40187)  
- Fixed the issue where delete statements did not correctly handle return values, causing data to still be visible after deletion. [#39428](https://github.com/apache/doris/pull/39428)  
- Fixed the coredump issue caused by rowset metadata competition during file cache preheating. [#39361](https://github.com/apache/doris/pull/39361)  
- Fixed the issue where the entire cache space would be used up when TTL cache enabled LRU eviction. [#39814](https://github.com/apache/doris/pull/39814)  
- Fixed the issue where temporary files could not be recycled when importing commit rowset failed with HDFS storage backend. [#40215](https://github.com/apache/doris/pull/40215)  

### Lakehouse

- Fixed some issues with predicate pushdown in JDBC Catalog. [#39064](https://github.com/apache/doris/pull/39064)  
- Fixed the issue of not being able to read when `S``TRUCT` type columns are missing in Parquet format. [#38718](https://github.com/apache/doris/pull/38718)  
- Fixed the issue of FileSystem leaks on the FE side in some cases. [#38610](https://github.com/apache/doris/pull/38610)  
- Fixed the issue of metadata cache information being inconsistent when Hive/Iceberg tables write back in some cases. [#40729](https://github.com/apache/doris/pull/40729)  
- Fixed the issue of unstable partition ID generation for external tables in some cases. [#39325](https://github.com/apache/doris/pull/39325)  
- Fixed the issue of external table queries selecting BE nodes in the blacklist in some cases. [#39451](https://github.com/apache/doris/pull/39451)  
- Optimized the timeout time for batch retrieval of external table partition information to avoid long-term thread occupation. [#39346](https://github.com/apache/doris/pull/39346)  
- Fixed the issue of memory leaks when querying Hudi tables in some cases. [#41256](https://github.com/apache/doris/pull/41256)  
- Fixed the issue of connection pool connection leaks in JDBC Catalog in some cases. [#39582](https://github.com/apache/doris/pull/39582)  
- Fixed the issue of BE memory leaks in JDBC Catalog in some cases. [#41041](https://github.com/apache/doris/pull/41041)  
- Fixed the issue of not being able to query Hudi data on Alibaba Cloud OSS. [#41316](https://github.com/apache/doris/pull/41316)  
- Fixed the issue of not being able to read empty partitions in MaxCompute. [#40046](https://github.com/apache/doris/pull/40046)  
- Fixed the issue of poor performance when querying Oracle through JDBC Catalog. [#41513](https://github.com/apache/doris/pull/41513)  
- Fixed the issue of BE crashes when querying deletion vector of Paimon tables after enabling file cache features. [#39877](https://github.com/apache/doris/pull/39877)  
- Fixed the issue of not being able to access Paimon tables on HDFS clusters with HA enabled. [#39806](https://github.com/apache/doris/pull/39806)  
- Temporarily disabled the page index filtering feature of Parquet to avoid potential issues. [#38691](https://github.com/apache/doris/pull/38691)  
- Fixed the issue of not being able to read unsigned types in Parquet files. [#39926](https://github.com/apache/doris/pull/39926)  
- Fixed the issue of potential infinite loops when reading Parquet files in some cases. [#39523](https://github.com/apache/doris/pull/39523)  

### Asynchronous Materialized Views

- Fixed the issue where partition construction might select the wrong table to track partitions if both sides have the same column names. [#40810](https://github.com/apache/doris/pull/40810)  
- Fixed the issue where transparent rewrite partition compensation might result in incorrect results. [#40803](https://github.com/apache/doris/pull/40803)  
- Fixed the issue where transparent rewrite did not take effect on external tables. [#38909](https://github.com/apache/doris/pull/38909)  
- Fixed the issue where nested materialized views might not refresh properly. [#40433](https://github.com/apache/doris/pull/40433)  

### Synchronous Materialized Views

- Fixed the issue where creating synchronous materialized views on MOW tables might result in incorrect query results. [#39171](https://github.com/apache/doris/pull/39171)  

### Query Optimizer

- Fixed the issue where existing synchronous materialized views might not be usable after upgrading. [#41283](https://github.com/apache/doris/pull/41283)  
- Fixed the issue of not correctly handling milliseconds when comparing datetime literals. [#40121](https://github.com/apache/doris/pull/40121)  
- Fixed the issue of potential errors in conditional function partition pruning. [#39298](https://github.com/apache/doris/pull/39298)  
- Fixed the issue where MOW tables with synchronous materialized views could not perform delete operations. [#39578](https://github.com/apache/doris/pull/39578)  
- Fixed the issue where the nullable of slots in JDBC external table query predicates might be incorrectly planned, causing query errors. [#41014](https://github.com/apache/doris/pull/41014)  

### Query Execution

- Fixed the memory leak issue caused by the use of runtime filters. [#39155](https://github.com/apache/doris/pull/39155)  
- Fixed the issue of excessive memory usage by window functions. [#39581](https://github.com/apache/doris/pull/39581)  
- Fixed a series of function compatibility issues during rolling upgrades. [#41023](https://github.com/apache/doris/pull/41023)  [#40438](https://github.com/apache/doris/pull/40438)  [#39648](https://github.com/apache/doris/pull/39648)  
- Fixed the issue of incorrect results with `encryption_function` when used with constants. [#40201](https://github.com/apache/doris/pull/40201)  
- Fixed the issue of errors when importing single-table materialized views. [#39061](https://github.com/apache/doris/pull/39061)  
- Fixed the issue of incorrect partition result calculations for window functions. [#39100](https://github.com/apache/doris/pull/39100)  [#40761](https://github.com/apache/doris/pull/40761)  
- Fixed the issue of incorrect calculations for topn when null values are present. [#39497](https://github.com/apache/doris/pull/39497)  
- Fixed the issue of incorrect results with the `map_agg` function. [#39743](https://github.com/apache/doris/pull/39743)  
- Fixed the issue of incorrect messages returned by cancel. [#38982](https://github.com/apache/doris/pull/38982)  
- Fixed the issue of BE core dumps caused by encrypt and decrypt functions. [#40726](https://github.com/apache/doris/pull/40726)  
- Fixed the issue of queries getting stuck due to too many scanners in high-concurrency scenarios. [#40495](https://github.com/apache/doris/pull/40495)  
- Supported time types in runtime filters. [#38258](https://github.com/apache/doris/pull/38258)  
- Fixed the issue of incorrect results with window funnel functions. [#40960](https://github.com/apache/doris/pull/40960)  

### Semi-Structured Data Management

- Fixed the issue of match function errors when no indexes were present. [#38989](https://github.com/apache/doris/pull/38989)  
- Fixed the issue of crashes when ARRAY data types were used as parameters for array_min/array_max functions. [#39492](https://github.com/apache/doris/pull/39492)  
- Fixed the issue of nullable with the `array_enumerate_uniq` function. [#38384](https://github.com/apache/doris/pull/38384)  
- Fixed the issue of bloomfilter indexes not being updated when adding or deleting columns. [#38431](https://github.com/apache/doris/pull/38431)  
- Fixed the issue of es-catalog parsing exceptions with array data. [#39104](https://github.com/apache/doris/pull/39104)  
- Fixed the issue of improper predicate push-down in es-catalog. [#40111](https://github.com/apache/doris/pull/40111)  
- Fixed the issue of exceptions caused by modifying input data with`map()` and `struct()` functions. [#39699](https://github.com/apache/doris/pull/39699)  
- Fixed the issue of index compaction crashes in special cases. [#40294](https://github.com/apache/doris/pull/40294)  
- Fixed the issue of ARRAY type inverted indexes missing nullbitmaps. [#38907](https://github.com/apache/doris/pull/38907)  
- Fixed the issue of incorrect results with the `count()` function on inverted indexes. [#41152](https://github.com/apache/doris/pull/41152)  
- Fixed the issue of correct results with the `explode_map` function when using aliases. [#39757](https://github.com/apache/doris/pull/39757)  
- Fixed the issue of VARIANT type not being able to use row storage for exceptional JSON data. [#39394](https://github.com/apache/doris/pull/39394)  
- Fixed the issue of memory leaks when returning ARRAY results with VARIANT type. [#41358](https://github.com/apache/doris/pull/41358)  
- Fixed the issue of changing column names with VARIANT type. [#40320](https://github.com/apache/doris/pull/40320)  
- Fixed the issue of potential precision loss when converting VARIANT type to DECIMAL type. [#39650](https://github.com/apache/doris/pull/39650)  
- Fixed the issue of nullable handling with VARIANT type. [#39732](https://github.com/apache/doris/pull/39732)  
- Fixed the issue of sparse column reading with VARIANT type. [#40295](https://github.com/apache/doris/pull/40295)  

### Other

- Fixed the compatibility issue between new and old audit log plugins. [#41401](https://github.com/apache/doris/pull/41401)  
- Fixed the issue where users could see processes of others in certain cases. [#39747](https://github.com/apache/doris/pull/39747)  
- Fixed the issue where users with permissions could not export. [#38365](https://github.com/apache/doris/pull/38365)  
- Fixed the issue where create table like required create permissions for the existing table. [#37879](https://github.com/apache/doris/pull/37879)  
- Fixed the issue where some features did not verify permissions. [#39726](https://github.com/apache/doris/pull/39726)  
- Fixed the issue of not correctly closing connections when using SSL. [#38587](https://github.com/apache/doris/pull/38587)  
- Fixed the issue where executing ALTER VIEW operations in some cases caused FE to fail to start. [#40872](https://github.com/apache/doris/pull/40872)  