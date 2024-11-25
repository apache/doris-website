---
{
    "title": "Release 2.1.7",
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

Dear community, **Apache Doris version 2.1.7 was officially released on November 10, 2024.** This version brings continuous upgrades and improvementsAdditionally, several fixes have been implemented in areas such as the  to the Lakehouse, Async Materialized Views, and Semi-Structured Data Management, Query Optimizer and Permission Management. 

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavior changes

- The following global variables will be forcibly set to the following default values:
  - enable_nereids_dml: true
  - enable_nereids_dml_with_pipeline: true
  - enable_nereids_planner: true
  - enable_fallback_to_original_planner: true
  - enable_pipeline_x_engine: true
- New columns have been added to the audit log. [#42262](https://github.com/apache/doris/pull/42262)
  - For more information, please  refer to [docs](https://doris.apache.org/docs/admin-manual/audit-plugin/)

## New features

### Async Materialized View

- An asynchronous materialized view has added a property called `use_for_rewrite` to control whether it participates in transparent rewriting. [#40332](https://github.com/apache/doris/pull/40332)

### Query Execution

- The list of changed session variables is now output in the Profile. [#41016](https://github.com/apache/doris/pull/41016)
- Support for `trim_in`, `ltrim_in`, and `rtrim_in` functions has been added. [#42641](https://github.com/apache/doris/pull/42641) (Note: This is a duplicate mention, but I'm including it as per your original list.)
- Support for several URL functions (top_level_domain, first_significant_subdomain, cut_to_first_significant_subdomain) has been added. [#42916](https://github.com/apache/doris/pull/42916)
- The `bit_set` function has been added. [#42916](https://github.com/apache/doris/pull/42099)
- The `count_substrings` function has been added. [#42055](https://github.com/apache/doris/pull/42055)
- The `translate` and `url_encode` functions have been added. [#41051](https://github.com/apache/doris/pull/41051)
- The `normal_cdf`, `to_iso8601`, and `from_iso8601_date` functions have been added. [#40695](https://github.com/apache/doris/pull/40695)


### Storage Management

- The `information_schema.table_options` and `table_properties` system tables have been added, supporting the querying of attributes set during table creation. [#34384](https://github.com/apache/doris/pull/34384)
- Support for `bitmap_empty` as a default value has been implemented. [#40364](https://github.com/apache/doris/pull/40364)
- A new session variable `require_sequence_in_insert` has been introduced to control whether a sequence column must be provided when performing `INSERT INTO SELECT` writes to a unique key table. [#41655](https://github.com/apache/doris/pull/41655)

### Others

- Allow for generating flame graphs on the BE WebUI page.[#41044](https://github.com/apache/doris/pull/41044)

## Improvements

### Lakehouse

- Support for writing data to Hive text format tables. [#40537](https://github.com/apache/doris/pull/40537)
  - For more information, please  refer to [docs](https://doris.apache.org/docs/lakehouse/datalake-building/hive-build)
- Access MaxCompute data using MaxCompute Open Storage API. [#41610](https://github.com/apache/doris/pull/41610)
  - For more information, please  refer to [docs](https://doris.apache.org/docs/lakehouse/database/max-compute)
- Support for Paimon DLF Catalog. [#41694](https://github.com/apache/doris/pull/41694)
  - For more information, please  refer to [docs](https://doris.apache.org/docs/lakehouse/datalake-analytics/paimon)
- Added `table$partitions` syntax to directly query Hive partition information.[#41230](https://github.com/apache/doris/pull/41230)
  - For more information, please  refer to [docs](https://doris.apache.org/docs/lakehouse/datalake-analytics/hive)
- Support for reading Parquet files in brotli compression format.[#42162](https://github.com/apache/doris/pull/42162)
- Support for reading DECIMAL 256 types in Parquet files. [#42241](https://github.com/apache/doris/pull/42241)
- Support for reading Hive tables in OpenCsvSerde format.[#42939](https://github.com/apache/doris/pull/42939)

### Async Materialized View

- Refined the granularity of lock holding during the build process for asynchronous materialized views. [#40402](https://github.com/apache/doris/pull/40402) [#41010](https://github.com/apache/doris/pull/41010).

### Query optimizer

- Improved the accuracy of statistic information collection and usage in extreme cases to enhance planning stability. [#40457](https://github.com/apache/doris/pull/40457)
- Runtime filters can now be generated in more scenarios to improve query performance. [#40815](https://github.com/apache/doris/pull/40815)
- Enhanced constant folding capabilities for numerical, date, and string functions to boost query performance.  [#40820](https://github.com/apache/doris/pull/40820)
- Optimized the column pruning algorithm to enhance query performance. [#41548](https://github.com/apache/doris/pull/41548)

### Query Execution

- Supported parallel preparation to reduce the time consumed by short queries. [#40270](https://github.com/apache/doris/pull/40270)
- Corrected the names of some counters in the profile to match the audit logs. [#41993](https://github.com/apache/doris/pull/41993)
- Added new local shuffle rules to speed up certain queries. [#40637](https://github.com/apache/doris/pull/40637)

### Storage Management

- The `SHOW PARTITIONS` command now supports displaying the commit version. [#28274](https://github.com/apache/doris/pull/28274)
- Checked for unreasonable partition expressions when creating tables. [#40158](https://github.com/apache/doris/pull/40158)
- Optimized the scheduling logic when encountering EOF in Routine Load. [#40509](https://github.com/apache/doris/pull/40509)
- Made Routine Load aware of schema changes. [#40508](https://github.com/apache/doris/pull/40508)
- Improved the timeout logic for Routine Load tasks. [#41135](https://github.com/apache/doris/pull/41135)

### Others

- Allowed closing the built-in service port of BRPC via BE configuration. [#41047](https://github.com/apache/doris/pull/41047)
- Fixed issues with missing fields and duplicate records in audit logs. [#43015](https://github.com/apache/doris/pull/43015)

## Bug fixes

### Lakehouse

- Fixed the inconsistency in the behavior of INSERT OVERWRITE with Hive. [#39840](https://github.com/apache/doris/pull/39840)
- Cleaned up temporarily created folders to address the issue of too many empty folders on HDFS.  [#40424](https://github.com/apache/doris/pull/40424)
- Resolved memory leaks in FE caused by using the JDBC Catalog in some cases. [#40923](https://github.com/apache/doris/pull/40923)
- Resolved memory leaks in BE caused by using the JDBC Catalog in some cases. [#41266](https://github.com/apache/doris/pull/41266)
- Fixed errors in reading Snappy compressed formats in certain scenarios. [#40862](https://github.com/apache/doris/pull/40862)
- Addressed potential FileSystem leaks on the FE side in certain scenarios. [#41108](https://github.com/apache/doris/pull/41108)
- Resolved issues where using EXPLAIN VERBOSE to view external table execution plans could cause null pointer exceptions in some cases. [#41231] (https://github.com/apache/doris/pull/41231)
- Fixed the inability to read tables in Paimon parquet format. [#41487](https://github.com/apache/doris/pull/41487)
- Addressed performance issues introduced by compatibility changes in the JDBC Oracle Catalog.  [#41407](https://github.com/apache/doris/pull/41407)
- Disabled predicate pushing down after implicit conversion to resolve incorrect query results in some cases with JDBC Catalog. [#42242](https://github.com/apache/doris/pull/42242)
- Fixed issues with case-sensitive access to table names in the External Catalog. [#42261](https://github.com/apache/doris/pull/42261)

### Async Materialized View

- Fixed the issue where user-specified start times were not effective. [#39573](https://github.com/apache/doris/pull/39573)
- Resolved the issue of nested materialized views not refreshing. [#40433](https://github.com/apache/doris/pull/40433)
- Fixed the issue where materialized views might not refresh after the base table was deleted and recreated.  [#41762](https://github.com/apache/doris/pull/41762)
- Addressed issues where partition compensation rewrites could lead to incorrect results. [#40803](https://github.com/apache/doris/pull/40803)
- Fixed potential errors in rewrite results when `sql_select_limit` was set. [#40106](https://github.com/apache/doris/pull/40106)

### Semi-Structured Data Management

- Fixed the issue of index file handle leaks. [#41915](https://github.com/apache/doris/pull/41915)
- Addressed inaccuracies in the `count()` function of inverted indexes in special cases. (#41127)[https://github.com/apache/doris/pull/41127]
- Fixed exceptions with variant when light schema change was not enabled. [#40908](https://github.com/apache/doris/pull/40908)
- Resolved memory leaks when variant returns arrays. [#41339](https://github.com/apache/doris/pull/41339)

### Query optimizer

- Corrected potential errors in nullable calculations for filter conditions during external table queries, leading to execution exceptions. [#41014](https://github.com/apache/doris/pull/41014)
- Fixed potential errors in optimizing range comparison expressions. [#41356](https://github.com/apache/doris/pull/41356)

### Query Execution

- The match_regexp function could not correctly handle empty strings. [#39503](https://github.com/apache/doris/pull/39503)
- Resolved issues where the scanner thread pool could become stuck in high-concurrency scenarios. [#40495](https://github.com/apache/doris/pull/40495)
- Fixed errors in the results of the `data_floor` function. [#41948](https://github.com/apache/doris/pull/41948)
- Addressed incorrect cancel messages in some scenarios. [#41798](https://github.com/apache/doris/pull/41798)
- Fixed issues with excessive warning logs printed by arrow flight. [#41770](https://github.com/apache/doris/pull/41770)
- Resolved issues where runtime filters failed to send in some scenarios. [#41698](https://github.com/apache/doris/pull/41698)
- Fixed problems where some system table queries could not end normally or became stuck. [#41592](https://github.com/apache/doris/pull/41592)
- Addressed incorrect results from window functions. ][#40761](https://github.com/apache/doris/pull/40761)
- Fixed issues where the encrypt and decrypt functions caused BE cores. [#40726](https://github.com/apache/doris/pull/40726)
- Resolved errors in the results of the conv function. [#40530](https://github.com/apache/doris/pull/40530)

### Storage Management

- Fixed import failures when Memtable migration was used in multi-replica scenarios with machine crashes.  [#38003](https://github.com/apache/doris/pull/38003)
- Addressed inaccurate memory statistics during the Memtable flush phase during imports. [#39536](https://github.com/apache/doris/pull/39536)
- Fixed fault tolerance issues with Memtable migration in multi-replica scenarios. [#40477](https://github.com/apache/doris/pull/40477)
- Resolved inaccurate bvar statistics with Memtable migration. [#40985](https://github.com/apache/doris/pull/40985)
- Fixed inaccurate progress reporting for S3 loads. [#40987](https://github.com/apache/doris/pull/40987)

### Permissions

- Fixed permission issues related to show columns, show sync, and show data from db.table. [#39726](https://github.com/apache/doris/pull/39726)

### Others

- Fixed the issue where the audit log plugin for version 2.0 could not be used in version 2.1. [#41400](https://github.com/apache/doris/pull/41400)
