---
{
    "title": "Release 2.1.10",
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

## Behavior Changes

- DELETE no longer incorrectly requires the SELECT_PRIV permission on the target table. [ #49794](https://github.com/apache/doris/pull/49794)
- Insert Overwrite no longer restricts concurrent operations on the same table to 1. [ #48673](https://github.com/apache/doris/pull/48673)
- Merge on write unique tables prohibit the use of time-series compaction. [ #49905](https://github.com/apache/doris/pull/49905)
- Building indexes on VARIANT type columns is prohibited. [ #49159](https://github.com/apache/doris/pull/49159)

## New Features

### Query Execution Engine

- Added support for more GEO type computation functions: `ST_CONTAINS`, `ST_INTERSECTS`, `ST_TOUCHES`, `GeometryFromText`, `ST_Intersects`, `ST_Disjoint`, `ST_Touches`. [ #49665](https://github.com/apache/doris/pull/49665) [ #48695](https://github.com/apache/doris/pull/48695)
- Added support for the `years_of_week` function. [ #48870](https://github.com/apache/doris/pull/48870)

### Lakehouse

- Hive Catalog now supports catalog-level partition cache control. [ #50724](https://github.com/apache/doris/pull/50724)
  - For more details, refer to the[ ](https://doris.apache.org/docs/dev/lakehouse/meta-cache)[documentation](https://doris.apache.org/docs/dev/lakehouse/meta-cache#disable-hive-catalog-metadata-cache).

## Improvements

### Lakehouse

- Upgraded the Paimon dependency version to 1.0.1.
- Upgraded the Iceberg dependency version to 1.6.1.
- Included the memory overhead of Parquet Footer in the Memory Tracker to avoid potential OOM issues. [ #49037](https://github.com/apache/doris/pull/49037)
- Optimized the predicate pushdown logic for JDBC Catalog, supporting pushdown of AND/OR connected predicates. [ #50542](https://github.com/apache/doris/pull/50542)
- Precompiled versions now include the Jindofs extension package by default to support Alibaba Cloud oss-hdfs access.

### Semi-Structured Data Management

- ANY function now supports JSON type. [ #50311](https://github.com/apache/doris/pull/50311)
- JSON_REPLACE, JSON_INSERT, JSON_SET, JSON_ARRAY functions now support JSON data type and complex data types. [ #50308](https://github.com/apache/doris/pull/50308)

### Query Optimizer

- When the number of options in an IN expression exceeds `Config.max_distribution_pruner_recursion_depth`, bucket pruning is not performed to improve planning speed. [ #49387](https://github.com/apache/doris/pull/49387)

### Storage Management

- Reduced logging and improved some log messages. [ #47647](https://github.com/apache/doris/pull/47647) [ #48523](https://github.com/apache/doris/pull/48523)

### Other

- Avoided the thrift rpc END_OF_FILE exception. [ #49649](https://github.com/apache/doris/pull/49649)

## Bug Fixes

### Lakehouse 

- Fixed the issue where newly created tables in Hive were not immediately visible in Doris. [ #50188](https://github.com/apache/doris/pull/50188)
- Fixed the error "Storage schema reading not supported" when accessing certain Text format Hive tables. [ #50038](https://github.com/apache/doris/pull/50038)
  - Refer to the[ get_schema_from_table documentation](https://doris.apache.org/docs/dev/lakehouse/catalogs/hive-catalog?_highlight=get_schema_from_table#syntax) for details.
- Fixed concurrency issues with metadata submission when writing to Hive/Iceberg tables. [ #49842](https://github.com/apache/doris/pull/49842)
- Fixed the issue where writing to Hive tables stored on oss-hdfs failed. [ #49754](https://github.com/apache/doris/pull/49754)
- Fixed the issue where accessing Hive tables with partition key values containing commas failed. [ #49382](https://github.com/apache/doris/pull/49382)
- Fixed the issue where Split allocation for Paimon tables was uneven in certain cases. [ #50083](https://github.com/apache/doris/pull/50083)
- Fixed the issue where Delete files were not correctly handled when reading Paimon tables stored on oss. [ #49645](https://github.com/apache/doris/pull/49645)
- Fixed the issue where reading high-precision Timestamp columns in MaxCompute Catalog failed. [ #49600](https://github.com/apache/doris/pull/49600)
- Fixed the potential resource leakage when deleting a Catalog in certain cases. [ #49621](https://github.com/apache/doris/pull/49621)
- Fixed the issue where reading LZO compressed data failed in certain cases. [ #49538](https://github.com/apache/doris/pull/49538)
- Fixed the issue where ORC deferred materialization caused errors when reading complex types. [ #50136](https://github.com/apache/doris/pull/50136)
- Fixed the issue where reading ORC files generated by pyorc-0.3 version failed. [ #50358](https://github.com/apache/doris/pull/50358)
- Fixed the issue where EXPORT operations caused metadata deadlocks. [ #50088](https://github.com/apache/doris/pull/50088)

### Indexing

- Fixed errors in building inverted indexes after multiple add, delete, and rename column operations. [ #50056](https://github.com/apache/doris/pull/50056)
- Added validation for unique column IDs in index compaction to avoid potential data anomalies and system errors. [ #47562](https://github.com/apache/doris/pull/47562)

### Semi-Structured Data Types

- Fixed the issue where converting VARIANT type to JSON type returned NULL in certain cases. [ #50180](https://github.com/apache/doris/pull/50180)
- Fixed the crash caused by JSONB CAST in certain cases. [ #49810](https://github.com/apache/doris/pull/49810)
- Prohibited building indexes on VARIANT type columns. [ #49159](https://github.com/apache/doris/pull/49159)
- Fixed the precision correctness of decimal type in the named_struct function. [ #48964](https://github.com/apache/doris/pull/48964)

### Query Optimizer

- Fixed several issues in constant folding. [#49413](https://github.com/apache/doris/pull/49413) [#50425](https://github.com/apache/doris/pull/50425) [#49686](https://github.com/apache/doris/pull/49686) [#49575](https://github.com/apache/doris/pull/49575) [#50142](https://github.com/apache/doris/pull/50142)
- Common subexpression extraction may not work properly on lambda expressions. [#49166](https://github.com/apache/doris/pull/49166)
- Fixed the issue where eliminating constants in group by keys might not work properly. [#49589](https://github.com/apache/doris/pull/49589)
- Fixed the issue where planning failed in extreme scenarios due to incorrect statistics inference. [#49415](https://github.com/apache/doris/pull/49415)
- Fixed the issue where some information_schema tables depending on BE metadata could not retrieve complete data. [#50721](https://github.com/apache/doris/pull/50721)

### Query Execution Engine

- Fixed the issue where the explode_json_array_json_outer function was not found. [#50164](https://github.com/apache/doris/pull/50164)
- Fixed the issue where substring_index did not support dynamic parameters. [#50149](https://github.com/apache/doris/pull/50149)
- Fixed the issue where the st_contains function returned incorrect results in many cases. [#50115](https://github.com/apache/doris/pull/50115)
- Fixed the core dump issue that could be caused by the array_range function. [#49993](https://github.com/apache/doris/pull/49993)
- Fixed the issue where the date_diff function returned incorrect results. [#49429](https://github.com/apache/doris/pull/49429)
- Fixed a series of issues with string functions causing garbled output or incorrect results in non-ASCII encodings. [#49231](https://github.com/apache/doris/pull/49231) [#49846](https://github.com/apache/doris/pull/49846) [#49127](https://github.com/apache/doris/pull/49127) [#40710](https://github.com/apache/doris/pull/40710)

### Storage Management

- Fixed the issue where metadata replay for dynamic partition tables failed in certain cases. [#49569](https://github.com/apache/doris/pull/49569)
- Fixed the issue where streamload on ARM might lose data due to operation sequence. [#48948](https://github.com/apache/doris/pull/48948)
- Fixed the error in full compaction and the potential issue of mow data duplication. [#49825](https://github.com/apache/doris/pull/49825) [#48958](https://github.com/apache/doris/pull/48958)
- Fixed the issue where partition storage policy was not persisted. [#49721](https://github.com/apache/doris/pull/49721)
- Fixed the extremely rare issue where imported files did not exist. [#50343](https://github.com/apache/doris/pull/50343)
- Fixed the issue where ccr and disk balancing concurrency might cause files to go missing. [#50663](https://github.com/apache/doris/pull/50663)
- Fixed the connection reset issue that might occur during backup and restore of large snapshots. [#49649](https://github.com/apache/doris/pull/49649)
- Fixed the issue where FE follower lost local backup snapshots. [#49550](https://github.com/apache/doris/pull/49550)

### Others

- Fixed the issue where audit logs might be lost in certain scenarios. [#50357](https://github.com/apache/doris/pull/50357)
- Fixed the issue where the isQuery flag in audit logs might be incorrect. [#49959](https://github.com/apache/doris/pull/49959)
- Fixed the issue where some query sqlHash values in audit logs were incorrect. [#49984](https://github.com/apache/doris/pull/49984)