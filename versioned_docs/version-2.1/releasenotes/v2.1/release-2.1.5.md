---
{
    "title": "Release 2.1.5",
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

**Apache Doris version 2.1.5 was officially released on July 24, 2024.** In this update, we have optimized various functional experiences for data lakehouse and high concurrency scenarios, functionalities of asynchronous materialized views. Additionaly, we have implemented several improvemnents and bug fixes to enhance the stability. 

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavior changes

- The default connection pool size for the JDBC Catalog has been increased from 10 to 30 to prevent connection exhaustion in high-concurrency scenarios. [#37023](https://github.com/apache/doris/pull/37023). 

- The system's reserved memory (low water mark) has been adjusted to `min(6.4GB, MemTotal * 5%)` to mitigate BE OOM issues.

- When processing multiple statements in a single request, only the last statement's result is returned if the `CLIENT_MULTI_STATEMENTS` flag is not set.

- Direct modifications to data in asynchronous materialized views are no longer permitted.[#37129](https://github.com/apache/doris/pull/37129)

- A session variable `use_max_length_of_varchar_in_ctas` has been added to control the behavior of varchar and char type length generation during CTAS (Create Table As Select). The default value is true. When set to false, the derived varchar length is used instead of the maximum length. [#37284](https://github.com/apache/doris/pull/37284)

- Statistics collection now defaults to enabling the functionality of estimating the number of rows in Hive tables based on file size. [#37694](https://github.com/apache/doris/pull/37694)

- Transparent rewrite for asynchronous materialized views is now enabled by default. [#35897](https://github.com/apache/doris/pull/35897)

- Transparent rewrite utilizes partitioned materialized views. If partitions fail, the base tables are unioned with the materialized view to ensure data correctness. [#35897](https://github.com/apache/doris/pull/35897)

## New features

### Lakehouse

- The session variable `read_csv_empty_line_as_null` can be used to control whether empty lines are ignored when reading CSV format files. [#37153](https://github.com/apache/doris/pull/37153) 

  By default, empty lines are ignored. When set to true, empty lines will be read as rows where all columns are null.

- Compatibility with Presto's complex type output format can be enabled by setting `serde_dialect="presto"`. [#37253](https://github.com/apache/doris/pull/37253)

### Multi-Table Materialized View

- Supports non-deterministic functions in materialized view building. [#37651](https://github.com/apache/doris/pull/37651)

- Atomically replaces definitions of asynchronous materialized views. [#37147](https://github.com/apache/doris/pull/37147)

- Views creation statements can be viewed via `SHOW CREATE MATERIALIZED VIEW`. [#37125](https://github.com/apache/doris/pull/37125)

- Transparent rewrites for multi-dimensional aggregation and non-aggregate queries. [#37436](https://github.com/apache/doris/pull/37436) [#37497](https://github.com/apache/doris/pull/37497)

- Supports DISTINCT aggregations with key columns and partitioning for roll-ups. [#37651](https://github.com/apache/doris/pull/37651)  

- Support for partitioning materialized views to roll up partitions using `date_trunc` [#31812](https://github.com/apache/doris/pull/31812) [#35562](https://github.com/apache/doris/pull/35562)

- Partitioned table-valued functions (TVFs) are supported. [#36479](https://github.com/apache/doris/pull/36479)

### Semi-Structured Data Management

- Tables using the VARIANT type now support partial column updates. [#34925](https://github.com/apache/doris/pull/34925)

- PreparedStatement support is now enabled by default. [#36581](https://github.com/apache/doris/pull/36581)

- The VARIANT type can be exported to CSV format. [#37857](https://github.com/apache/doris/pull/37857)

- `explode_json_object` function transposes JSON Object rows into columns. [#36887](https://github.com/apache/doris/pull/36887)

- The ES Catalog now maps ES NESTED or OBJECT types to the Doris JSON type.[#37101](https://github.com/apache/doris/pull/37101)

- By default, support_phrase is enabled for inverted indexes with specified analyzers to improve the performance of match_phrase series queries. [#37949](https://github.com/apache/doris/pull/37949)

### Query Optimizer

- Support for explaining `DELETE FROM` statements. [#37100](https://github.com/apache/doris/pull/37100)

- Support for hint form of constant expression parameters [#37988](https://github.com/apache/doris/pull/37988)

### Memory Management

- Added an HTTP API to clear the cache. [#36599](https://github.com/apache/doris/pull/36599)

### Permissions

- Support for authorization of resources within Table-Valued Functions (TVFs) [#37132](https://github.com/apache/doris/pull/37132)

## Improvements

### Lakehouse

- Upgraded Paimon to version 0.8.1

- Fixes ClassNotFoundException for org.apache.commons.lang.StringUtils when querying Paimon tables. [#37512](https://github.com/apache/doris/pull/37512)

- Added support for Tencent Cloud LakeFS. [#36891](https://github.com/apache/doris/pull/36891)

- Optimized the timeout duration when fetching file lists for external table queries. [#36842](https://github.com/apache/doris/pull/36842)

- Configurable via the session variable `fetch_splits_max_wait_time_ms`.

- Improved default connection logic for SQLServer JDBC Catalog. [#36971](https://github.com/apache/doris/pull/36971)

  By default, the connection encryption settings are not intervened. Only when `force_sqlserver_jdbc_encrypt_false` is set to true, encrypt=false is forcibly added to the JDBC URL to reduce authentication errors. This allows for more flexible control over encryption behavior, enabling it to be turned on or off as needed.

- Added serde properties to the show create table statements for Hive tables. [#37096](https://github.com/apache/doris/pull/37096)

- Changed the default cache time for Hive table lists on the FE from 1 day to 4 hours

- Data export (Export/Outfile) now supports specifying compression formats for Parquet and ORC

  For more information, please refer to [docs](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/EXPORT/?_highlight=compress_type).

- When creating a table using CTAS+TVF, partition columns in the TVF are automatically mapped to Varchar(65533) instead of String, allowing them to be used as partition columns for internal tables [#37161](https://github.com/apache/doris/pull/37161)

- Optimized the number of metadata accesses for Hive write operations [#37127](https://github.com/apache/doris/pull/37127)

- ES Catalog now supports mapping nested/object types to Doris's Json type. [#37182](https://github.com/apache/doris/pull/37182)

- Improved error messages when connecting to Oracle using older versions of the ojdbc driver [#37634](https://github.com/apache/doris/pull/37634)

- When Hudi tables return an empty set during Incremental Read, Doris now also returns an empty set instead of error [#37636](https://github.com/apache/doris/pull/37636)

- Fixed an issue where inner-outer table join queries could lead to FE timeouts in some cases [#37757](https://github.com/apache/doris/pull/37757)

- Fixed an issue with FE metadata replay errors during upgrades from older versions to newer versions when the Hive metastore event listener is enabled. [#37757](https://github.com/apache/doris/pull/37757)

### Multi-Table Materialized View

- Automate key column selection for asynchronous materialized views. [#36601](https://github.com/apache/doris/pull/36601)

- Support date_trunc in materialized view partition definitions.. [#35562](https://github.com/apache/doris/pull/35562)

- Enable transparent rewrites across nested materialized view aggregations. [#37651](https://github.com/apache/doris/pull/37651)

- Asynchronous materialized views remain available when schema changes do not affect the correctness of their data. [#37122](https://github.com/apache/doris/pull/37122)

- Improve planning speed for transparent rewrites. [#37935](https://github.com/apache/doris/pull/37935)

- When calculating the availability of asynchronous materialized views, the current refresh status is no longer taken into account. [#36617](https://github.com/apache/doris/pull/36617)

### Semi-Structured Data Management

- Optimize DESC performance for viewing VARIANT sub-columns through sampling. [#37217](https://github.com/apache/doris/pull/37217)

- Support for special JSON data with empty keys in the JSON type. [#36762](https://github.com/apache/doris/pull/36762)

### Inverted Index

- Reduce latency by minimizing the invocation of inverted index exists to avoid delays in accessing object storage. [#36945](https://github.com/apache/doris/pull/36945)

- Optimize the overhead of the inverted index query process. [#35357](https://github.com/apache/doris/pull/35357)

- Prevent inverted indices in materialized views. [#36869](https://github.com/apache/doris/pull/36869)

### Query Optimizer

- When both sides of a comparison expression are literals, the string literal will attempt to convert to the type of the other side. [#36921](https://github.com/apache/doris/pull/36921)

- Refactored the sub-path pushdown functionality for the variant type, now better supporting complex pushdown scenarios. [#36923](https://github.com/apache/doris/pull/36923)

- Optimized the logic for calculating the cost of materialized views, enabling more accurate selection of lower-cost materialized views. [#37098](https://github.com/apache/doris/pull/37098)

- Improved the SQL cache planning speed when using user variables in SQL. [#37119](https://github.com/apache/doris/pull/37119)

- Optimized the row estimation logic for NOT NULL expressions, resulting in better performance when NOT NULL is present in queries. [#37498](https://github.com/apache/doris/pull/37498)

- Optimized the null rejection derivation logic for LIKE expressions. [#37864](https://github.com/apache/doris/pull/37864)

- Improved error messages when querying a specific partition fails, making it clearer which table is causing the issue. [#37280](https://github.com/apache/doris/pull/37280)

### Query Execution

- Improved the performance of the bitmap_union operator up to 3 times in certain scenarios.

- Enhanced the reading performance of Arrow Flight in ARM environments.

- Optimized the execution performance of the explode, explode_map, and explode_json functions.

### Data Loading

- Support setting `max_filter_ratio` for `INSERT INTO ... FROM TABLE VALUE FUNCTION`

## Bug fixes

### Lakehouse

- Fixed an issue that caused BE crashes in some cases when querying Parquet format [#37086](https://github.com/apache/doris/pull/37086)

- Fixed an issue where BE printed excessive logs when querying Parquet format. [#37012](https://github.com/apache/doris/pull/37012)

- Fixed an issue where the FE side created a large number of duplicate FileSystem objects in some cases. [#37142](https://github.com/apache/doris/pull/37142)

- Fixed an issue where transaction information was not cleaned up after writing to Hive in some cases. [#37172](https://github.com/apache/doris/pull/37172)

- Fixed a thread leak issue caused by Hive table write operations in some cases. [#37247](https://github.com/apache/doris/pull/37247)

- Fixed an issue where Hive Text format row and column delimiters could not be correctly obtained in some cases. [#37188](https://github.com/apache/doris/pull/37188)

- Fixed a concurrency issue when reading lz4 compressed blocks in some cases. [#37187](https://github.com/apache/doris/pull/37187)

- Fixed an issue where `count(*)` on Iceberg tables returned incorrect results in some cases. [#37810](https://github.com/apache/doris/pull/37810)

- Fixed an issue where creating a Paimon catalog based on MinIO caused FE metadata replay errors in some cases. [#37249](https://github.com/apache/doris/pull/37249)

- Fixed an issue where using Ranger to create a catalog caused the client to hang in some cases. [#37551](https://github.com/apache/doris/pull/37551)

### Multi-Table Materialized View

- Fixed an issue where adding new partitions to the base table could lead to incorrect results after partition aggregation roll-up rewrites. [#37651](https://github.com/apache/doris/pull/37651)

- Fixed an issue where the materialized view partition status was not set to out-of-sync after deleting associated base table partitions. [#36602](https://github.com/apache/doris/pull/36602)

- Fixed an occasional deadlock issue during asynchronous materialized view builds. [#37133](https://github.com/apache/doris/pull/37133)

- Fixed an occasional "nereids cost too much time" error when refreshing a large number of partitions in a single asynchronous materialized view refresh. [#37589](https://github.com/apache/doris/pull/37589)

- Fixed an issue where an asynchronous materialized view could not be created if the final select list contained a null literal. [#37281](https://github.com/apache/doris/pull/37281)

- Fixed an issue with single-table materialized views where, even though the aggregation materialized view was successfully rewritten, the CBO did not select it. [#35721](https://github.com/apache/doris/pull/35721) [#36058](https://github.com/apache/doris/pull/36058)

- Fixed an issue where partition derivation failed when building a partitioned materialized view with both join inputs being aggregations. [#34781](https://github.com/apache/doris/pull/34781)

### Semi-Structured Data Management

- Fixed issues with VARIANT in special cases such as concurrency and abnormal data.[#37976](https://github.com/apache/doris/pull/37976) [#37839](https://github.com/apache/doris/pull/37839) [#37794](https://github.com/apache/doris/pull/37794) [#37674](https://github.com/apache/doris/pull/37674) [#36997](https://github.com/apache/doris/pull/36997)

- Fixed coredump issues when using VARIANT in unsupported SQL. [#37640](https://github.com/apache/doris/pull/37640)

- Fixed coredump issues related to MAP data type when upgrading from 1.x to 2.x or higher versions. [#36937](https://github.com/apache/doris/pull/36937)

- Improved ES Catalog support for Array types. [#36936](https://github.com/apache/doris/pull/36936)

### Inverted Index

- Fixed an issue where DROP INDEX for Inverted Index v2 did not delete metadata. [#37646](https://github.com/apache/doris/pull/37646)

- Fixed query accuracy issues when string length exceeded the "ignore above" threshold. [#37679](https://github.com/apache/doris/pull/37679)

- Fixed issues with index size statistics. [#37232](https://github.com/apache/doris/pull/37232) [#37564](https://github.com/apache/doris/pull/37564)

### Query Optimizer

- Fixed an issue that prevented import operations from executing due to the use of reserved keywords. [#35938](https://github.com/apache/doris/pull/35938)

- Fixed a type error where char(255) was incorrectly recorded as char(1) when creating a table. [#37671](https://github.com/apache/doris/pull/37671)

- Fixed incorrect results when the join expression in a correlated subquery was a complex expression. [#37683](https://github.com/apache/doris/pull/37683)

- Fixed a potential issue with incorrect bucket pruning for decimal types. [#38013](https://github.com/apache/doris/pull/38013)

- Fixed incorrect aggregation operator results when pipeline local shuffle was enabled in certain scenarios. [#38016](https://github.com/apache/doris/pull/38016)

- Fixed planning errors that could occur when equal expressions existed in aggregation operators. [#36622](https://github.com/apache/doris/pull/36622)

- Fixed planning errors that could occur when lambda expressions were present in aggregation operators. [#37285](https://github.com/apache/doris/pull/37285)

- Fixed an issue where a literal generated from a window function being optimized to a literal had the wrong type, preventing execution. [#37283](https://github.com/apache/doris/pull/37283)

- Fixed an issue with the null attribute being incorrectly output by the aggregate function foreach combinator. [#37980](https://github.com/apache/doris/pull/37980)

- Fixed an issue where the acos function could not be planned when its parameter was a literal out of range. [#37996](https://github.com/apache/doris/pull/37996)

- Fixed planning errors when specifying partitions for a query on a synchronized materialized view. [#36982](https://github.com/apache/doris/pull/36982)

- Fixed occasional Null Pointer Exceptions (NPEs) during planning. [#38024](https://github.com/apache/doris/pull/38024)

### Query Execution

- Fixed an error in delete where statements when using decimal data types as conditions. [#37801](https://github.com/apache/doris/pull/37801)

- Fixed an issue where BE memory was not released after query execution ended. [#37792](https://github.com/apache/doris/pull/37792) [#37297](https://github.com/apache/doris/pull/37297)

- Fixed a problem where audit logs occupied too much FE memory under high QPS scenarios. [#37786](https://github.com/apache/doris/pull/37786)

- Fixed BE core dumps when the sleep function received illegal input values. [#37681](https://github.com/apache/doris/pull/37681)

- Fixed an error encountered during sync filter size execution. [#37103](https://github.com/apache/doris/pull/37103)

- Fixed incorrect results when using time zones during execution. [#37062](https://github.com/apache/doris/pull/37062)

- Fixed incorrect results when casting strings to integers. [#36788](https://github.com/apache/doris/pull/36788)

- Fixed query errors when using the Arrow Flight protocol with pipelinex enabled. [#35804](https://github.com/apache/doris/pull/35804)

- Fixed errors when casting strings to dates/datetimes. [#35637](https://github.com/apache/doris/pull/35637)

- Fixed BE core dumps during large table join queries using <=>. [#36263](https://github.com/apache/doris/pull/36263)

### Storage Management

- Fixed the issue of invisible DELETE SIGN data encountered during column update and write operations. [#36755](https://github.com/apache/doris/pull/36755)

- Optimized FE's memory usage during schema changes. [#36756](https://github.com/apache/doris/pull/36756)

- Fixed the issue where BE would hang during restart due to transactions not being aborted [#36437](https://github.com/apache/doris/pull/36437)

- Fixed occasional errors when changing from NOT NULL to NULL data types. [#36389](https://github.com/apache/doris/pull/36389)

- Optimized replica repair scheduling when BE goes down. [#36897](https://github.com/apache/doris/pull/36897)

- Supported round-robin disk selection for tablet creation on a single BE. [#36900](https://github.com/apache/doris/pull/36900)

- Fixed query error -230 caused by slow publishing. [#36222](https://github.com/apache/doris/pull/36222)

- Improved the speed of partition balancing. [#36976](https://github.com/apache/doris/pull/36976)

- Controlled segment cache using the number of file descriptors (FDs) and memory to avoid FD exhaustion. [#37035](https://github.com/apache/doris/pull/37035)

- Fixed potential replica loss caused by concurrent clone and alter operations [#36858](https://github.com/apache/doris/pull/36858)

- Fixed the issue of not being able to adjust column order.[#37226](https://github.com/apache/doris/pull/37226)

- Prohibited certain schema change operations on auto-increment columns. [#37331](https://github.com/apache/doris/pull/37331)

- Fixed inaccurate error reporting for DELETE operations. [#37374](https://github.com/apache/doris/pull/37374)

- Adjusted the trash expiration time on BE side to one day. [#37409](https://github.com/apache/doris/pull/37409)

- Optimized compaction memory usage and scheduling. [#37491](https://github.com/apache/doris/pull/37491)

- Checked for potential oversized backups causing FE restarts. [#37466](https://github.com/apache/doris/pull/37466)

- Restored dynamic partition deletion policies and cross-partition behaviors to 2.1.3. [#37570](https://github.com/apache/doris/pull/37570) [#37506](https://github.com/apache/doris/pull/37506)

- Fixed errors related to decimal types in DELETE predicates. [#37710](https://github.com/apache/doris/pull/37710)

### Data Loading

- Fixed data invisibility issues caused by race conditions in error handling during imports [#36744](https://github.com/apache/doris/pull/36744)

- Added support for hhl_from_base64 in streamload imports. [#36819](https://github.com/apache/doris/pull/36819)

- Fixed potential FE OOM issues when importing very large numbers of tablets for a single table. [#36944](https://github.com/apache/doris/pull/36944)

- Fixed possible auto-increment column duplication during FE master-slave switchovers. [#36961](https://github.com/apache/doris/pull/36961)

- Fixed errors when inserting into select with auto-increment columns. [#37029](https://github.com/apache/doris/pull/37029)

- Reduced the number of data flush threads to optimize memory usage. [#37092](https://github.com/apache/doris/pull/37092)

- Improved automatic recovery and error messaging for routine load tasks. [#37371](https://github.com/apache/doris/pull/37371)

- Increased the default batch size for routine load. [#37388](https://github.com/apache/doris/pull/37388)

- Fixed routine load task stoppage due to Kafka EOF expiration. [#37983](https://github.com/apache/doris/pull/37983)

- Fixed coredump issues in multi-table streaming. [#37370](https://github.com/apache/doris/pull/37370)

- Fixed premature backpressure caused by inaccurate memory estimation in groupcommit. [#37379](https://github.com/apache/doris/pull/37379)

- Optimized BE-side thread usage in groupcommit. [#37380](https://github.com/apache/doris/pull/37380)

- Fixed the issue of no error URL when data was not partitioned. [#37401](https://github.com/apache/doris/pull/37401)

- Fixed potential memory misoperations during imports. [#38021](https://github.com/apache/doris/pull/38021)

### Merge on Write Unique Key

- Reduced memory usage during compaction for primary key tables. [#36968](https://github.com/apache/doris/pull/36968)

- Fixed potential duplicate data issues when primary key replica cloning fails. [#37229](https://github.com/apache/doris/pull/37229)

### Permissions

- Fixed the issue of missing authorization when a table-valued function references a resource. [#37132](https://github.com/apache/doris/pull/37132)

- Fixed the issue where the SHOW ROLE statement did not include workload group permissions. [#36032](https://github.com/apache/doris/pull/36032)

- Fixed the issue where executing two statements simultaneously when creating a row policy could cause FE to fail to restart. [#37342](https://github.com/apache/doris/pull/37342)

- Fixed the issue where, in some cases, upgrading from an older version could result in FE metadata replay failures due to row policies. [#37342](https://github.com/apache/doris/pull/37342)

### Others

- Fixed the issue of compute nodes participating in internal table creation. [#37961](https://github.com/apache/doris/pull/37961)

- Fixed the read lag issue when  `enable_strong_read_consistency` is set to true. [#37641](https://github.com/apache/doris/pull/37641)