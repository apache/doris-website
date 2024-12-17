---
{
    "title": "Release 3.0.1",
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

Dear community members, the Apache Doris 3.0.1 version was officially released on August 23, 2024, featuring updates and improvements in compute-storage decoupling, lakehouse, semi-structured data analysis, asynchronous materialized views, and more.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavior Changes

### Query Optimizer

- Added the variable `use_max_length_of_varchar_in_ctas` to control the length behavior of VARCHAR type when executing `CREATE TABLE AS SELECT` (CTAS) operations.  [#37069](https://github.com/apache/doris/pull/37069)
  
  - This variable is set to true by default. 
  
  - When set to true, if the VARCHAR type column originates from a table, the derived length is used; otherwise, the maximum length is used. 
  
  - When set to false, the VARCHAR type will always use the derived length.

- All data types will now be displayed in lowercase to maintain compatibility with MySQL format. [#38012](https://github.com/apache/doris/pull/38012)

- Multiple query statements in the same query request must now be separated by semicolons. [#38670](https://github.com/apache/doris/pull/38670)

### Query Execution

- The default number of parallel tasks after shuffle operations in the cluster is set to 100, which will improve query stability and concurrent processing capability in large clusters. [#38196](https://github.com/apache/doris/pull/38196)

### Storage

- The default value of `trash_file_expire_time_sec` has been changed from 86400 seconds to 0 seconds, which means that if files are deleted by mistake and the FE trash is cleared, the data cannot be recovered.

- The table attribute `enable_mow_delete_on_delete_predicate` (introduced in version 3.0.0) has been renamed to `enable_mow_light_delete`.

- Explicit transactions are now prohibited from performing delete operations on tables with written data.

- Heavy schema change operations are prohibited on tables with auto-increment fields.



## New Features

### Job Scheduling

- Optimized the execution logic of internal scheduling jobs, decoupling the strong association between start time and immediate execution parameters. Now, tasks can be created with a specified start time or selected for immediate execution, without conflict, enhancing scheduling flexibility. [#36805](https://github.com/apache/doris/pull/36805)

### Compute-Storage Decoupled

- Supports dynamic modification of the upper limit for file cache usage. [#37484](https://github.com/apache/doris/pull/37484)

- Recycler now supports object storage rate limiting and server-side rate limiting retry functionality. [#37663](https://github.com/apache/doris/pull/37663) [#37680](https://github.com/apache/doris/pull/37680)

### Lakehouse

- Added the session variable `serde_dialect` to set the output format for complex types. [#37039](https://github.com/apache/doris/pull/37039)

- SQL interception now supports external tables.

  - For more information, refer to the documentation on  [SQL Interception](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception).

- Insert overwrite now supports Iceberg tables. [#37191](https://github.com/apache/doris/pull/37191)

### Asynchronous Materialized Views

- Supports partition roll-up and build at the hourly level. [#37678](https://github.com/apache/doris/pull/37678)

- Supports atomic replacement of asynchronous materialized view definition statements. [#36749](https://github.com/apache/doris/pull/36749)

- Transparent rewriting now supports Insert statements. [#38115](https://github.com/apache/doris/pull/38115)

- Transparent rewriting now supports the VARIANT type. [#37929](https://github.com/apache/doris/pull/37929)

### Query Execution

- The group concat function now supports DISTINCT and ORDER BY options. [#38744](https://github.com/apache/doris/pull/38744)

### Semi-Structured Data Management

- The ES Catalog now maps `nested` or `object` types in Elasticsearch to the JSON type in Doris. [#37101](https://github.com/apache/doris/pull/37101)

- Added the `MULTI_MATCH` function, which supports matching keywords across multiple fields and can leverage inverted indexes to accelerate searches. [#37722](https://github.com/apache/doris/pull/37722)

- Added the `explode_json_object` function, which can unfold objects in JSON data into multiple rows. [#36887](https://github.com/apache/doris/pull/36887)

- Inverted indexes now support memtable advancement, requiring index construction only once during multi-replica writes, reducing CPU consumption and improving performance. [#35891](https://github.com/apache/doris/pull/35891)

- Added `MATCH_PHRASE` support for positive slop, e.g., `msg MATCH_PHRASE 'a b 2+'` can match instances containing words a and b with a slop of no more than two, and a preceding b; regular slop without the final `+` does not guarantee this order. [#36356](https://github.com/apache/doris/pull/36356)

### Other

- Added the FE parameter `skip_audit_user_list`, where user operations specified in this configuration will not be recorded in the audit log. [#38310](https://github.com/apache/doris/pull/38310)

  - For more information, refer to the documentation on [Audit Plugin](https://doris.apache.org/docs/admin-manual/audit-plugin/).



## Improvements

### Storage

- Reduced the likelihood of write failures caused by disk balancing within a single BE. [#38000](https://github.com/apache/doris/pull/38000)

- Decreased memory consumption by the memtable limiter. [#37511](https://github.com/apache/doris/pull/37511)

- Moved old partitions to the FE trash during partition replacement operations. [#36361](https://github.com/apache/doris/pull/36361)

- Optimized memory consumption during compaction. [#37099](https://github.com/apache/doris/pull/37099)

- Added a session variable to control audit logs for JDBC PreparedStatement, with default setting to not print. [#38419](https://github.com/apache/doris/pull/38419)

- Optimized the logic for selecting BEs for group commits. [#35558](https://github.com/apache/doris/pull/35558)

- Improved the performance of column updates. [#38487](https://github.com/apache/doris/pull/38487)

- Optimized the use of `delete bitmap cache`. [#38761](https://github.com/apache/doris/pull/38761)

- Added a configuration to control query affinity during hot and cold tiering. [#37492](https://github.com/apache/doris/pull/37492)

### Compute-Storage Decoupled

- Implemented automatic retries when encountering object storage server rate limiting. [#37199](https://github.com/apache/doris/pull/37199)

- Adapted the number of threads for memtable flush in the compute-storage decoupled mode. [#38789](https://github.com/apache/doris/pull/38789)

- Added Azure as a compile option to support compilation in environments without Azure support.

- Optimized the observability of object storage access rate limiting. [#38294](https://github.com/apache/doris/pull/38294)

- Allowed the file cache TTL queue to perform LRU eviction, enhancing TTL queue usability. [#37312](https://github.com/apache/doris/pull/37312)

- Optimized the number of balance writeeditlog IO operations in the storage and compute separation mode. [#37787](https://github.com/apache/doris/pull/37787)

- Improved table creation speed in the storage and compute separation mode by sending tablet creation requests in batches. [#36786](https://github.com/apache/doris/pull/36786)

- Optimized read failures caused by potential inconsistencies in the local file cache through backoff retries. [#38645](https://github.com/apache/doris/pull/38645)

### Lakehouse

- Optimized memory statistics for Parquet/ORC format read and write operations. [#37234](https://github.com/apache/doris/pull/37234)

- Trino Connector Catalog now supports predicate pushdown. [#37874](https://github.com/apache/doris/pull/37874)

- Added a session variable `enable_count_push_down_for_external_table` to control whether to enable `count(*)` pushdown optimization for external tables. [#37046](https://github.com/apache/doris/pull/37046)

- Optimized the read logic for Hudi snapshot reads, returning an empty set when the snapshot is empty, consistent with Spark behavior. [#37702](https://github.com/apache/doris/pull/37702)

- Improved the read performance of partition columns for Hive tables. [#37377](https://github.com/apache/doris/pull/37377)

### Asynchronous Materialized Views

- Improved transparent rewrite plan speed by 20%. [#37197](https://github.com/apache/doris/pull/37197)

- Eliminated roll-up during transparent rewrite if the group key satisfies data uniqueness for better nested matching. [#38387](https://github.com/apache/doris/pull/38387)

- Transparent rewrite now performs better aggregation elimination to improve the matching success rate of nested materialized views. [#36888](https://github.com/apache/doris/pull/36888)

### MySQL Compatibility

- Now correctly populates the database name, table name, and original name in the MySQL protocol result columns. [#38126](https://github.com/apache/doris/pull/38126)

- Supported the hint format `/*+ func(value) */`. [#37720](https://github.com/apache/doris/pull/37720)

### Query Optimizer

- Significantly improved the plan speed for complex queries. [#38317](https://github.com/apache/doris/pull/38317)

- Adaptively chose whether to perform bucket shuffle based on the number of data buckets to avoid performance degradation in extreme cases. [#36784](https://github.com/apache/doris/pull/36784)

- Optimized the cost estimation logic for SEMI / ANTI JOIN. [#37951](https://github.com/apache/doris/pull/37951) [#37060](https://github.com/apache/doris/pull/37060)

- Supported pushing Limit down to the first stage of aggregation to improve performance. [#34853](https://github.com/apache/doris/pull/34853)

- Partition pruning now supports filter conditions containing the `date_trunc` or `date` function. [#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- SQL cache now supports query scenarios that include user variables. [#37915](https://github.com/apache/doris/pull/37915)

- Optimized error messages for invalid aggregation semantics. [#38122](https://github.com/apache/doris/pull/38122)

### Query Execution

- Adapted AggState compatibility from 2.1 to 3.x and fixed Coredump issues. [#37104](https://github.com/apache/doris/pull/37104)

- Refactored the strategy selection for local shuffle without Join. [#37282](https://github.com/apache/doris/pull/37282)

- Modified the scanner for internal table queries to be asynchronous to prevent stalling during such queries. [#38403](https://github.com/apache/doris/pull/38403)

- Optimized the block merge process during Hash table construction for Join operators. [#37471](https://github.com/apache/doris/pull/37471)

- Optimized the duration of lock holding for MultiCast. [#37462](https://github.com/apache/doris/pull/37462)

- Optimized gRPC keepAliveTime and added link monitoring to reduce the probability of query failure due to RPC errors. [#37304](https://github.com/apache/doris/pull/37304)

- Cleaned up all dirty pages in jemalloc when memory limits were exceeded. [#37164](https://github.com/apache/doris/pull/37164)

- Optimized the processing performance of `aes_encrypt`/`decrypt` functions for constant types. [#37194](https://github.com/apache/doris/pull/37194)

- Optimized the processing performance of the `json_extract` function for constant data. [#36927](https://github.com/apache/doris/pull/36927)

- Optimized the processing performance of the `ParseUrl` function for constant data. [#36882](https://github.com/apache/doris/pull/36882)

### Semi-Structured Data Management

- Bitmap indexes now default to using inverted indexes, with `enable_create_bitmap_index_as_inverted_index` set to true by default. [#36692](https://github.com/apache/doris/pull/36692)

- In the compute-storage decoupled mode, DESC can now view sub-columns of VARIANT type. [#38143](https://github.com/apache/doris/pull/38143)

- Removed the step of checking file existence during inverted index queries to reduce access latency to remote storage. [#36945](https://github.com/apache/doris/pull/36945)

- Complex types ARRAY / MAP / STRUCT now support `replace_if_not_null` for AGG tables. [#38304](https://github.com/apache/doris/pull/38304)

- Escape characters for JSON data are now supported. [#37176](https://github.com/apache/doris/pull/37176) [#37251](https://github.com/apache/doris/pull/37251)

- Inverted index queries now behave consistently on MOW tables and DUP tables. [#37428](https://github.com/apache/doris/pull/37428)

- Optimized the performance of inverted index acceleration for IN queries. [#37395](https://github.com/apache/doris/pull/37395)

- Reduced unnecessary memory allocation during TOPN queries to improve performance. [#37429](https://github.com/apache/doris/pull/37429)

- When creating an inverted index with tokenization, the `support_phrase` option is now automatically enabled to accelerate `match_phrase` series phrase queries. [#37949](https://github.com/apache/doris/pull/37949)

### Other

- Audit log now can record SQL types. [#37790](https://github.com/apache/doris/pull/37790)

- Added support for `information_schema.processlist` to show all FE. [#38701](https://github.com/apache/doris/pull/38701)

- Cached ranger's `atamask` and `rowpolicy` to accelerate query efficiency. [#37723](https://github.com/apache/doris/pull/37723)

- Optimized metadata management in job manager to release locks immediately after modifying metadata, reducing lock holding time. [#38162](https://github.com/apache/doris/pull/38162)



## Bug Fixes

### Upgrade

- Fix the issue where `mtmv load` fails during upgrade from version 2.1. [#38799](https://github.com/apache/doris/pull/38799)

- Resolve the issue where `null_type` cannot be found during the upgrade to version 2.1. [#39373](https://github.com/apache/doris/pull/39373)

- Address the compatibility issue with permission persistence during the upgrade from version 2.1 to 3.0. [#39288](https://github.com/apache/doris/pull/39288)

### Load

- Fix the issue where parsing fails when the newline character is surrounded by delimiters in CSV format parsing. [#38347](https://github.com/apache/doris/pull/38347)
- Resolve potential exception issues when FE forwards group commit. [#38228](https://github.com/apache/doris/pull/38228) [#38265](https://github.com/apache/doris/pull/38265)

- Group commit now supports the new optimizer. [#37002](https://github.com/apache/doris/pull/37002)

- Fix the issue where group commit reports data errors when JDBC setNull is used. [#38262](https://github.com/apache/doris/pull/38262)

- Optimize the retry logic for group commit when encountering `delete bitmap lock` errors. [#37600](https://github.com/apache/doris/pull/37600)

- Resolve the issue where routine load cannot use CSV delimiters and escape characters. [#38402](https://github.com/apache/doris/pull/38402)

- Fix the issue where routine load job names with mixed case cannot be displayed. [#38523](https://github.com/apache/doris/pull/38523)

- Optimize the logic for actively recovering routine load during FE master-slave switching. [#37876](https://github.com/apache/doris/pull/37876)

- Resolve the issue where routine load pauses when all data in Kafka is expired. [#37288](https://github.com/apache/doris/pull/37288)

- Fix the issue where `show routine load` returns empty results. [#38199](https://github.com/apache/doris/pull/38199)

- Resolve the memory leak issue during multi-table stream import in routine load. [#38255](https://github.com/apache/doris/pull/38255)

- Fix the issue where stream load does not return the error URL. [#38325](https://github.com/apache/doris/pull/38325)

- Resolve potential load channel leak issues. [#38031](https://github.com/apache/doris/pull/38031) [#37500](https://github.com/apache/doris/pull/37500)

- Fix the issue where no error may be reported when importing fewer segments than expected. [#36753](https://github.com/apache/doris/pull/36753)

- Resolve the load stream leak issue. [#38912](https://github.com/apache/doris/pull/38912)

- Optimize the impact of offline nodes on import operations. [#38198](https://github.com/apache/doris/pull/38198)

- Fix the issue where transactions do not end when inserting into empty data. [#38991](https://github.com/apache/doris/pull/38991)

### Storage

**01 Backup and Restoration**

- Fix the issue where tables cannot be written after backup and restoration. [#37089](https://github.com/apache/doris/pull/37089)

- Resolve the issue where view database names are incorrect after backup and restoration. [#37412](https://github.com/apache/doris/pull/37412)

**02 Compaction**

- Fix the issue where cumu compaction handles delete errors incorrectly during ordered data compression. [#38742](https://github.com/apache/doris/pull/38742)

- Resolve the issue of duplicate keys in aggregate tables caused by sequential compression optimization. [#38224](https://github.com/apache/doris/pull/38224)

- Fix the issue where compression operations cause coredump in large wide tables. [#37960](https://github.com/apache/doris/pull/37960)

- Resolve the compression starvation issue caused by inaccurate concurrent statistics of compression tasks. [#37318](https://github.com/apache/doris/pull/37318)

**03 MOW Unique Key**

- Resolve the issue of inconsistent data between replicas caused by cumulative compression deletion of delete sign. [#37950](https://github.com/apache/doris/pull/37950)

- MOW delete now uses partial column updates with the new optimizer. [#38751](https://github.com/apache/doris/pull/38751)

- Fix the potential duplicate key issue in MOW tables under compute-storage decoupled. [#39018](https://github.com/apache/doris/pull/39018)

- Resolve the issue where MOW unique and duplicate tables cannot modify column order. [#37067](https://github.com/apache/doris/pull/37067)

- Fix the potential data correctness issue caused by segcompaction. [#37760](https://github.com/apache/doris/pull/37760)

- Resolve the potential memory leak issue during column updates. [#37706](https://github.com/apache/doris/pull/37706)

**04 Other**

- Fix the small probability of exceptions in TOPN queries. [#39119](https://github.com/apache/doris/pull/39119) [#39199](https://github.com/apache/doris/pull/39199)

- Resolve the issue where auto-increment IDs may duplicate during FE restart. [#37306](https://github.com/apache/doris/pull/37306)

- Fix the potential queuing issue in the delete operation priority queue. [#37169](https://github.com/apache/doris/pull/37169)

- Optimize the delete retry logic. [#37363](https://github.com/apache/doris/pull/37363)

- Resolve the issue with `bucket = 0` in table creation statements under the new optimizer. [#38971](https://github.com/apache/doris/pull/38971)

- Fix the issue where FE reports success incorrectly when image generation fails. [#37508](https://github.com/apache/doris/pull/37508)

- Resolve the issue where using the wrong nodename during FE offline nodes may cause inconsistent FE members. [#37987](https://github.com/apache/doris/pull/37987)

- Fix the issue where CCR partition addition may fail. [#37295](https://github.com/apache/doris/pull/37295)

- Resolve the `int32` overflow issue in inverted index files. [#38891](https://github.com/apache/doris/pull/38891)

- Fix the issue where TRUNCATE TABLE failure may cause BE to fail to go offline. [#37334](https://github.com/apache/doris/pull/37334)

- Resolve the issue where publish cannot continue due to null pointers. [#37724](https://github.com/apache/doris/pull/37724) [#37531](https://github.com/apache/doris/pull/37531)

- Fix the potential coredump issue when manually triggering disk migration. [#37712](https://github.com/apache/doris/pull/37712)

### Compute-Storage Decoupled

- Fixed the issue where `show create table` might display the `file_cache_ttl_seconds` attribute twice. [#38052](https://github.com/apache/doris/pull/38052)

- Fixed the issue where segment Footer TTL was not set correctly after setting file cache TTL. [#37485](https://github.com/apache/doris/pull/37485)

- Fixed the issue where file cache might cause coredump due to massive conversion of cache types. [#38518](https://github.com/apache/doris/pull/38518)

- Fixed the potential file descriptor (fd) leak in file cache. [#38051](https://github.com/apache/doris/pull/38051)

- Fixed the issue where schema change Job overwriting compaction Job prevented base tablet compaction from completing normally. [#38210](https://github.com/apache/doris/pull/38210)

- Fixed the potential inaccuracy of base compaction score due to data race. [#38006](https://github.com/apache/doris/pull/38006)

- Fixed the issue where error messages from imports might not be uploaded correctly to object storage. [#38359](https://github.com/apache/doris/pull/38359)

- Fixed the inconsistency in return information between compute-storage decoupled mode and storage and compute integration mode for 2PC imports. [#38076](https://github.com/apache/doris/pull/38076)

- Fix the issue where incorrect file size setting during file cache warm-up leads to coredump. [#38939](https://github.com/apache/doris/pull/38939)

- Fixed the issue where partial column updates did not correctly dequeue delete operations. [#37151](https://github.com/apache/doris/pull/37151)

- Fixed compatibility issues with permission persistence in compute-storage decoupled mode. [#38136](https://github.com/apache/doris/pull/38136) [#37708](https://github.com/apache/doris/pull/37708)

- Fixed the issue where observer did not retry correctly when encountering a `-230` error. [#37625](https://github.com/apache/doris/pull/37625)

- Fixed the issue where `show load` with conditions did not perform correct analysis. [#37656](https://github.com/apache/doris/pull/37656)

- Fixed the issue where `show streamload` in compute-storage decoupled mode caused BE coredump. [#37903](https://github.com/apache/doris/pull/37903)

- Fixed the issue where `copy into` did not correctly verify column names in strict mode. [#37650](https://github.com/apache/doris/pull/37650)

- Fixed the issue where multi-stream imports into a single table lacked permissions. [#38878](https://github.com/apache/doris/pull/38878)

- Fixed the potential overflow issue in `getVersionUpdateTimeMs`. [#38074](https://github.com/apache/doris/pull/38074)

- Fixed the issue where FE azure blob list was not implemented correctly. [#37986](https://github.com/apache/doris/pull/37986)

- Fixed the issue where inaccurate azure blob recycling time calculation prevented recycling. [#37535](https://github.com/apache/doris/pull/37535)

- Fixed the issue where inverted index files were not deleted in compute-storage decoupled mode. [#38306](https://github.com/apache/doris/pull/38306)

### Lakehouse

- Fixed the issue with reading binary data from Oracle Catalog. [#37078](https://github.com/apache/doris/pull/37078)

- Fixed the potential deadlock issue when acquiring external table metadata in multi-FE scenarios. [#37756](https://github.com/apache/doris/pull/37756)

- Fixed the issue where JNI scanner failure caused BE nodes to crash. [#37697](https://github.com/apache/doris/pull/37697)

- Fixed the issue with slow reading of date types from Trino Connector Catalog. [#37266](https://github.com/apache/doris/pull/37266)

- Optimized kerberos authentication logic for Hive Catalog. [#37301](https://github.com/apache/doris/pull/37301)

- Fixed the issue where region attributes might be parsed incorrectly when parsing MinIO properties. [#37249](https://github.com/apache/doris/pull/37249)

- Fixed the issue where creating too many FileSystems by FE caused memory leaks. [#36954](https://github.com/apache/doris/pull/36954)

- Fixed the issue with reading incorrect time zone information from Paimon. [#37716](https://github.com/apache/doris/pull/37716)

- Fixed the potential thread leak issue caused by Hive write-back operations. [#36990](https://github.com/apache/doris/pull/36990)

- Fixed the null pointer issue caused by enabling Hive metastore event synchronization. [#38421](https://github.com/apache/doris/pull/38421)

- Fixed the issue where error messages were unclear or caused stalling when creating catalogs. [#37551](https://github.com/apache/doris/pull/37551)

- Fixed the issue where reading Hive text format tables behaved differently from Hive. [#37638](https://github.com/apache/doris/pull/37638)

- Fixed the logic error when switching between catalogs and databases. [#37828](https://github.com/apache/doris/pull/37828)

### MySQL Compatibility

- Fixed the issue where certain flags in the MySQL protocol were set incorrectly when SSL was enabled. [#38086](https://github.com/apache/doris/pull/38086)

### Asynchronous Materialized Views

- Fixed the issue where construction might fail when the base table had a very large number of partitions. [#37589](https://github.com/apache/doris/pull/37589)

- Fixed the issue where nested materialized views incorrectly performed full table refreshes even when partition refreshes were possible. [#38698](https://github.com/apache/doris/pull/38698)

- Fixed the issue where partition refresh could not handle the simultaneous existence of valid and invalid dependencies when analyzing partition dependencies. [#38367](https://github.com/apache/doris/pull/38367)

- Fixed the issue where the final result containing NULL type might cause asynchronous materialized views to fail. [#37019](https://github.com/apache/doris/pull/37019)

- Fixed the planning error that might occur during transparent rewriting when both synchronous and asynchronous materialized views with the same name were present. [#37311](https://github.com/apache/doris/pull/37311)

### Synchronous Materialized Views

- The rewritten synchronous materialized views now can correctly perform partition pruning. [#38527](https://github.com/apache/doris/pull/38527)

- When rewriting synchronous materialized views, those with unready data are no longer selected. [#38148](https://github.com/apache/doris/pull/38148)

### Query Optimizer

- Fixed the deadlock issue that might occur when queries and delete operations are performed simultaneously. [#38660](https://github.com/apache/doris/pull/38660)

- Fixed the issue where bucket pruning might incorrectly prune on decimal column buckets. [#37889](https://github.com/apache/doris/pull/37889)

- Fixed the issue where planning might be incorrect when mark join participates in join reorder. [#39152](https://github.com/apache/doris/pull/39152)

- Fixed the issue where the result is incorrect when the correlation condition of a correlated subquery is not a simple column. [#37644](https://github.com/apache/doris/pull/37644)

- Fixed the issue where partition pruning cannot correctly handle or expressions. [#38897](https://github.com/apache/doris/pull/38897)

- Fixed the planning error that might occur when optimizing the execution order of JOIN and AGG. [#37343](https://github.com/apache/doris/pull/37343)

- Fixed the issue where `str_to_date` performs incorrect constant folding calculations on datev1 types. [#37360](https://github.com/apache/doris/pull/37360)

- Fixed the issue where the ACOS function's constant folding returns non-NaN values. [#37932](https://github.com/apache/doris/pull/37932)

- Fixed the occasional planning error: "The children format needs to be [WhenClause+, DefaultValue?]". [#38491](https://github.com/apache/doris/pull/38491)

- Fixed the issue where planning might be incorrect when the projection includes window functions and there is both the original column and its alias. [#38166](https://github.com/apache/doris/pull/38166)

- Fixed the issue where planning might report an error when the aggregation parameter contains a lambda expression. [#37109](https://github.com/apache/doris/pull/37109)

- Fixed the insert error that might occur in extreme cases: "MultiCastDataSink cannot be cast to DataStreamSink". [#38526](https://github.com/apache/doris/pull/38526)

- Fixed the issue where the new optimizer does not correctly handle `char(0)/varchar(0)` when creating a table. [#38427](https://github.com/apache/doris/pull/38427)

- Fixed the incorrect behavior of `char(255) toSql`. [#37340](https://github.com/apache/doris/pull/37340)

- Fixed the issue where the nullable attribute within the `agg_state` type might lead to planning errors. [#37489](https://github.com/apache/doris/pull/37489)
- Fixed the issue where row count statistics are inaccurate during mark Join. [#38270](https://github.com/apache/doris/pull/38270)

### Query Execution

- Fixed issues where the Pipeline execution engine was stuck, causing queries to not end, in multiple scenarios. [#38657](https://github.com/apache/doris/pull/38657), [#38206](https://github.com/apache/doris/pull/38206), [#38885](https://github.com/apache/doris/pull/38885), [#38151](https://github.com/apache/doris/pull/38151), [#37297](https://github.com/apache/doris/pull/37297)

- Fixed the coredump issue caused by NULL and non-NULL columns during set difference calculations. [#38750](https://github.com/apache/doris/pull/38750)

- Fixed the error when using the DECIMAL type with pure decimals in delete statements. [#37801](https://github.com/apache/doris/pull/37801)

- Fixed the issue where the `width_bucket` function returned incorrect results. [#37892](https://github.com/apache/doris/pull/37892)

- Fixed the query error when a single row of data was very large and the result set was also large (exceeding 2GB). [#37990](https://github.com/apache/doris/pull/37990)

- Fixed the coredump issue caused by incorrect release of rpc connections during single-replica imports. [#38087](https://github.com/apache/doris/pull/38087)

- Fixed the coredump issue caused by processing NULL values with the `foreach` function. [#37349](https://github.com/apache/doris/pull/37349)

- Fixed the issue where stddev returned incorrect results for DECIMALV2 types. [#38731](https://github.com/apache/doris/pull/38731)

- Fixed the slow performance of `bitmap union` calculations. [#37816](https://github.com/apache/doris/pull/37816)

- Fixed the issue where RowsProduced for aggregation operators was not set in the profile. [#38271](https://github.com/apache/doris/pull/38271)

- Fixed the overflow issue when calculating the number of buckets for the hash table under hash join. [#37193](https://github.com/apache/doris/pull/37193), [#37493](https://github.com/apache/doris/pull/37493)

- Fixed the inaccurate recording of the `jemalloc cache memory tracker`. [#37464](https://github.com/apache/doris/pull/37464)

- Added the `enable_stacktrace` configuration option, allowing users to control whether exception stacks are output in BE logs. [#37713](https://github.com/apache/doris/pull/37713)

- Fixed the issue where Arrow Flight SQL did not work correctly when `enable_parallel_result_sink` was set to false. [#37779](https://github.com/apache/doris/pull/37779)

- Fixed the incorrect use of colocate Join. [#37361](https://github.com/apache/doris/pull/37361), [#37729](https://github.com/apache/doris/pull/37729)

- Fixed the calculation overflow issue of the `round` function on DECIMAL128 types. [#37733](https://github.com/apache/doris/pull/37733), [#38106](https://github.com/apache/doris/pull/38106)

- Fixed the coredump issue when passing a const string to the `sleep` function. [#37681](https://github.com/apache/doris/pull/37681)

- Increased the queue length for audit logs, solving the issue where audit logs could not be recorded normally under high concurrency scenarios with thousands of concurrent connections. [#37786](https://github.com/apache/doris/pull/37786)

- Fixed the issue where creating a workload group caused too many threads, leading to BE coredump. [#38096](https://github.com/apache/doris/pull/38096)

- Fixed the coredump issue caused by the `MULTI_MATCH_ANY` function. [#37959](https://github.com/apache/doris/pull/37959)

- Fixed the transaction rollback issue caused by `insert overwrite auto partition`. [#38103](https://github.com/apache/doris/pull/38103)

- Fixed the issue where the TimeUtils formatter did not use the correct time zone. [#37465](https://github.com/apache/doris/pull/37465)

- Fixed the issue where results were incorrect under constant folding scenarios for week/yearweek. [#37376](https://github.com/apache/doris/pull/37376)

- Fixed the issue where the `convert_tz` function returned incorrect results. [#37358](https://github.com/apache/doris/pull/37358), [#38764](https://github.com/apache/doris/pull/38764)

- Fixed the coredump issue when using the `collect_set` function with window functions. [#38234](https://github.com/apache/doris/pull/38234)

- Fixed the coredump issue caused by `percentile_approx` during rolling upgrades. [#39321](https://github.com/apache/doris/pull/39321)

- Fixed the coredump issue caused by the `mod` function when encountering abnormal input. [#37999](https://github.com/apache/doris/pull/37999)

- Fixed the issue where the hash table was not fully built when the broadcast join probe started running. [#37643](https://github.com/apache/doris/pull/37643)

- Fixed the issue where executing the same expression in multithreaded environments might lead to incorrect results for Java UDFs. [#38612](https://github.com/apache/doris/pull/38612)

- Fixed the overflow issue caused by incorrect return types of the `conv` function. [#38001](https://github.com/apache/doris/pull/38001)

- Fixed the issue where the `json_replace` function returned incorrect types. [#3701](https://github.com/apache/doris/pull/37014)

- Fixed the issue where the nullable attribute setting was unreasonable for the `percentile` aggregation function. [#37330](https://github.com/apache/doris/pull/37330)

- Fixed the issue where the results of the `histogram` function were unstable. [#38608](https://github.com/apache/doris/pull/38608)

- Fixed the issue where task state was displayed incorrectly in the profile. [#38082](https://github.com/apache/doris/pull/38082)

- Fixed the issue where some queries were incorrectly canceled when the system just started. [#37662](https://github.com/apache/doris/pull/37662)

### Semi-Structured Data Management

- Fix some issues with time series compression. [#39170](https://github.com/apache/doris/pull/39170) [#39176](https://github.com/apache/doris/pull/39176)

- Fix the issue of incorrect index size statistics during compression. [#37232](https://github.com/apache/doris/pull/37232)

- Fix the potential incorrect matching of ultra-long strings without tokenization in inverted indexes. [#37679](https://github.com/apache/doris/pull/37679) [#38218](https://github.com/apache/doris/pull/38218)

- Fix the high memory usage issue of `array_range` and `array_with_const` functions when dealing with large data volumes. [#38284](https://github.com/apache/doris/pull/38284) [#37495](https://github.com/apache/doris/pull/37495)

- Fix the potential coredump issue when selecting columns of ARRAY / MAP / STRUCT types. [#37936](https://github.com/apache/doris/pull/37936) 

- Fix the import failure issue caused by simdjson parsing errors when specifying jsonpath in Stream Load. [#38490](https://github.com/apache/doris/pull/38490)

- Fix the exception handling issue when there are duplicate keys in JSON data. [#38146](https://github.com/apache/doris/pull/38146)

- Fix the potential query error after DROP INDEX. [#37646](https://github.com/apache/doris/pull/37646)

- Fix the error return issue in row merging checks during index compression. [#38732](https://github.com/apache/doris/pull/38732)

- Inverted index v2 format now supports renaming columns. [#38079](https://github.com/apache/doris/pull/38079)

- Fix the coredump issue when the `MATCH` function matches an empty string without an index. [#37947](https://github.com/apache/doris/pull/37947)

- Fix the handling of NULL values in inverted indexes. [#37921](https://github.com/apache/doris/pull/37921) [#37842](https://github.com/apache/doris/pull/37842) [#38741](https://github.com/apache/doris/pull/38741)

- Fix the incorrect `row_store_page_size` after FE restart. [#38240](https://github.com/apache/doris/pull/38240)

### Other

- Fix the timezone configuration issue. The default timezone is no longer fixed at UTC+8 and is now obtained from system configuration. [#37294](https://github.com/apache/doris/pull/37294)

- Fix the class conflict issue when using ranger due to multiple JSR specification implementations. [#37575](https://github.com/apache/doris/pull/37575)

- Fix the potential uninitialized field issue in some BE code. [#37403](https://github.com/apache/doris/pull/37403)

- Fix the error in delete statements for random distributed tables. [#37985](https://github.com/apache/doris/pull/37985)

- Fix the incorrect requirement for `alter_priv` permission on the base table when creating a synchronized materialized view. [#38011](https://github.com/apache/doris/pull/38011)

- Fix the issue of not authenticating resources when used in TVF. [#36928](https://github.com/apache/doris/pull/36928)


## Credits

Thanks all who contribute to this release: 

@133tosakarin, @924060929, @AshinGau, @Baymine, @BePPPower, @BiteTheDDDDt, @ByteYue, @CalvinKirs, @Ceng23333, @DarvenDuan, @FreeOnePlus, @Gabriel39, @HappenLee, @JNSimba, @Jibing-Li, @KassieZ, @Lchangliang, @LiBinfeng-01, @Mryange, @SWJTU-ZhangLei, @TangSiyang2001, @Tech-Circle-48, @Vallishp, @Yukang-Lian, @Yulei-Yang, @airborne12, @amorynan, @bobhan1, @cambyzju, @cjj2010, @csun5285, @dataroaring, @deardeng, @eldenmoon, @englefly, @feiniaofeiafei, @felixwluo, @freemandealer, @gavinchou, @ghkang98, @hello-stephen, @hubgeter, @hust-hhb, @jacktengg, @kaijchen, @kaka11chen, @keanji-x, @liaoxin01, @liutang123, @luwei16, @luzhijing, @lxr599, @morningman, @morrySnow, @mrhhsg, @mymeiyi, @platoneko, @qidaye, @qzsee, @seawinde, @shuke987, @sollhui, @starocean999, @suxiaogang223, @w41ter, @wangbo, @wangshuo128, @whutpencil, @wsjz, @wuwenchi, @wyxxxcat, @xiaokang, @xiedeyantu, @xinyiZzz, @xy720, @xzj7019, @yagagagaga, @yiguolei, @yujun777, @z404289981, @zclllyybb, @zddr, @zfr9527, @zhangbutao, @zhangstar333, @zhannngchen, @zhiqiang-hhhh, @zjj, @zy-kkk, @zzzxl1993