---
{
    "title": "Release 2.1.6",
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

Dear community, **Apache Doris version 2.1.6 was officially released on September 10, 2024.** This version brings continuous upgrades and improvements to the Lakehouse, Async Materialized Views, and Semi-Structured Data Management. Additionally, several fixes have been implemented in areas such as the query optimizer, execution engine, storage management, permission management. 

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavior changes

- Removed the `delete_if_exists` option from create repository. [#38192](https://github.com/apache/doris/pull/38192)

- Added the `enable_prepared_stmt_audit_log` session variable to control whether JDBC prepared statements record audit logs, with the default being no recording. [#38624](https://github.com/apache/doris/pull/38624) [#39009](https://github.com/apache/doris/pull/39009)

- Implemented fd limit and memory constraints for segment cache. [#39689](https://github.com/apache/doris/pull/39689)

- When the FE configuration item `sys_log_mode` is set to BRIEF, file location information is added to the logs. [#39571](https://github.com/apache/doris/pull/39571)

- Changed the default value of the session variable `max_allowed_packet` to 16MB. [#38697](https://github.com/apache/doris/pull/38697)

- When a single request contains multiple statements, semicolons must be used to separate them. [#38670](https://github.com/apache/doris/pull/38670)

- Added support for statements to begin with a semicolon. [#39399](https://github.com/apache/doris/pull/39399)

- Aligned type formatting with MySQL in statements such as `show create table`. [#38012](https://github.com/apache/doris/pull/38012)

- When the new optimizer planning times out, it no longer falls back to prevent the old optimizer from using longer planning times. [#39499](https://github.com/apache/doris/pull/39499)

## New features

### Lakehouse

- Supported writeback for Iceberg tables. 

  - For more information, please refer to the [documentation](https://doris.apache.org/docs/lakehouse/datalake-building/iceberg-build). 

- SQL interception rules now support external tables. 

  - For more information, please refer to the [documentation](https://doris.apache.org/docs/admin-manual/query-admin/sql-interception).

- Added the system table `file_cache_statistics` to view BE data cache metrics.

  - For more information, please refer to the [documentation](https://doris.apache.org/docs/admin-manual/system-tables/file_cache_statistics).

### Async Materialized View

- Supported transparent rewriting during inserts. [#38115](https://github.com/apache/doris/pull/38115)

- Supported transparent rewriting when variant types exist in queries.[ #37929](https://github.com/apache/doris/pull/37929)

### Semi-Structured Data Management

- Supported casting ARRAY MAP to JSON type.[ #36548](https://github.com/apache/doris/pull/36548)

- Supported the `json_keys` function.[ #36411](https://github.com/apache/doris/pull/36411)

- Supported specifying the JSON path $. when importing JSON. [#38213](https://github.com/apache/doris/pull/38213)

- ARRAY, MAP, STRUCT types now support `replace_if_not_null`[#38304](https://github.com/apache/doris/pull/38304)

- ARRAY, MAP, STRUCT types now support adjusting column order.[#39210](https://github.com/apache/doris/pull/39210)

- Added the `multi_match` function to match keywords across multiple fields, with support for inverted index acceleration. [#37722](https://github.com/apache/doris/pull/37722)

### Query Optimizer

- Filled in the original database name, table name, column name, and alias for returned columns in the MySQL protocol. [ #38126](https://github.com/apache/doris/pull/38126)

- Supported the aggregation function `group_concat` with both order by and distinct simultaneously. [#38080](https://github.com/apache/doris/pull/38080)

- SQL cache now supports reusing cached results for queries with different comments. [#40049](https://github.com/apache/doris/pull/40049)

- In partition pruning, supported including `date_trunc` and date functions in filter conditions. [#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- Allowed using the database name where the table resides as a qualifier prefix for table aliases. [#38640](https://github.com/apache/doris/pull/38640)

- Supported hint-style comments.[#39113](https://github.com/apache/doris/pull/39113)

### Others

- Added the system table `table_properties` for viewing table properties.

  - For more information, please refer to the [documentation](https://doris.apache.org/docs/admin-manual/system-tables/information_schema/table_properties). 

- Introduced deadlock and slow lock detection in FE. 

  - For more information, please refer to the [documentation](https://doris.apache.org/docs/admin-manual/maint-monitor/frontend-lock-manager). 

## Improvements

### Lakehouse

- Reimplemented the external table metadata caching mechanism. 

  - For details, refer to the [documentation](https://doris.apache.org/docs/lakehouse/metacache). 

- Added the session variable `keep_carriage_return` with a default value of false. By default, reading Hive Text format tables treats both `\r\n` and `\n` as newline characters. [#38099](https://github.com/apache/doris/pull/38099)

- Optimized memory statistics for Parquet/ORC file read/write operations.[#37257](https://github.com/apache/doris/pull/37257)

- Supported pushing down IN/NOT IN predicates for Paimon tables. [#38390](https://github.com/apache/doris/pull/38390)

- Enhanced the optimizer to support Time Travel syntax for Hudi tables. [#38591](https://github.com/apache/doris/pull/38591)

- Optimized Kerberos authentication-related processes. [ #37301](https://github.com/apache/doris/pull/37301)

- Enabled reading Hive tables after renaming column operations. [#38809](https://github.com/apache/doris/pull/38809)

- Optimized the reading performance of partition columns for external tables. [#38810](https://github.com/apache/doris/pull/38810)

- Improved the data shard merging strategy during external table query planning to avoid performance degradation caused by a large number of small shards.[#38964](https://github.com/apache/doris/pull/38964)

- Added attributes such as location to `SHOW CREATE DATABASE/TABLE`. [#39644](https://github.com/apache/doris/pull/39644)

- Supported complex types in MaxCompute Catalog. [#39822](https://github.com/apache/doris/pull/39822)

- Optimized the file cache loading strategy by using asynchronous loading to avoid long BE startup times. [#39036](https://github.com/apache/doris/pull/39036)

- Improved the file cache eviction strategy, such as evicting locks held for extended periods. [#39721](https://github.com/apache/doris/pull/39721)

### Async Materialized View

- Supported hourly, weekly, and quarterly partition roll-up construction. [#37678](https://github.com/apache/doris/pull/37678)

- For materialized views based on Hive external tables, the metadata cache is now updated before refresh to ensure the latest data is obtained during each refresh. [#38212](https://github.com/apache/doris/pull/38212)

- Improved the performance of transparent rewrite planning in storage-compute decoupled mode by batch fetching metadata. [#39301](https://github.com/apache/doris/pull/39301)

- Enhanced the performance of transparent rewrite planning by prohibiting duplicate enumerations. [#39541](https://github.com/apache/doris/pull/39541)

- Improved the performance of transparent rewrite for refreshing materialized views based on Hive external table partitions.[#38525](https://github.com/apache/doris/pull/38525)

### Semi-Structured Data Management

- Optimized memory allocation for TOPN queries to improve performance. [#37429](https://github.com/apache/doris/pull/37429)

- Enhanced the performance of string processing in inverted indexes.[#37395](https://github.com/apache/doris/pull/37395)

- Optimized the performance of inverted indexes in MOW tables. [#37428](https://github.com/apache/doris/pull/37428)

- Supported specifying the row-store `page_size` during table creation to control compression effectiveness. [#37145](https://github.com/apache/doris/pull/37145)

### Query Optimizer

- Adjusted the row count estimation algorithm for mark joins, resulting in more accurate cardinality estimates for mark joins. [#38270](https://github.com/apache/doris/pull/38270)

- Optimized the cost estimation algorithm for semi/anti joins, enabling more accurate selection of semi/anti join orders. [#37951](https://github.com/apache/doris/pull/37951)

- Adjusted the filter estimation algorithm for cases where some columns have no statistical information, leading to more accurate cardinality estimates. [#39592](https://github.com/apache/doris/pull/39592)

- Modified the instance calculation logic for set operation operators to prevent insufficient parallelism in extreme cases. [#39999](https://github.com/apache/doris/pull/39999)

- Adjusted the usage strategy of bucket shuffle, achieving better performance when data is not sufficiently shuffled. [#36784](https://github.com/apache/doris/pull/36784)

- Enabled early filtering of window function data, supporting multiple window functions in a single projection. [#38393](https://github.com/apache/doris/pull/38393)

- When a `NullLiteral` exists in a filter condition, it can now be folded into false, further converted to an `EmptySet` to reduce unnecessary data scanning and computation. [#38135](https://github.com/apache/doris/pull/38135)

- Expanded the scope of predicate derivation, reducing data scanning in queries with specific patterns. [#37314](https://github.com/apache/doris/pull/37314)

- Supported partial short-circuit evaluation logic in partition pruning to improve partition pruning performance, achieving over 100% improvement in specific scenarios. [#38191](https://github.com/apache/doris/pull/38191)

- Enabled the computation of arbitrary scalar functions within user variables. [#39144](https://github.com/apache/doris/pull/39144)

- Maintained error messages consistent with MySQL when alias conflicts exist in queries. [#38104](https://github.com/apache/doris/pull/38104)

### Query Execution

- Adapted AggState for compatibility from 2.1 to 3.x and fixed coredump issues. [#37104](https://github.com/apache/doris/pull/37104)

- Refactored the strategy selection for local shuffle when no joins are involved. [#37282](https://github.com/apache/doris/pull/37282)

- Modified the scanner for internal table queries to an asynchronous approach to prevent blocking during internal table queries. [#38403](https://github.com/apache/doris/pull/38403)

- Optimized the block merge process when building hash tables in Join operators. [#37471](https://github.com/apache/doris/pull/37471)

- Reduced the lock holding time for MultiCast operations. [37462](https://github.com/apache/doris/pull/37462)

- Optimized gRPC's keepAliveTime and added a connection monitoring mechanism, reducing the probability of query failures due to RPC errors during query execution. [#37304](https://github.com/apache/doris/pull/37304)

- Cleaned up all dirty pages in jemalloc when memory limits are exceeded. [#37164](https://github.com/apache/doris/pull/37164)

- Improved the performance of `aes_encrypt`/`decrypt` functions when handling constant types. [#37194](https://github.com/apache/doris/pull/37194)

- Optimized the performance of `json_extract` functions when processing constant data. [#36927](https://github.com/apache/doris/pull/36927)

- Optimized the performance of ParseURL functions when processing constant data. [#36882](https://github.com/apache/doris/pull/36882)

### Backup Recovery / CCR

- Restore now supports deleting redundant tablets and partition options. [#39363](https://github.com/apache/doris/pull/39363)

- Check storage connectivity when creating a repository. [#39538](https://github.com/apache/doris/pull/39538)

- Enables binlog to support `DROP TABLE`, allowing CCR to incrementally synchronize `DROP TABLE` operations. [#38541](https://github.com/apache/doris/pull/38541)

### Compaction

- Improves the issue where high-priority compaction tasks were not subject to task concurrency control limits. [#38189](https://github.com/apache/doris/pull/38189)

- Automatically reduces compaction memory consumption based on data characteristics. [#37486](https://github.com/apache/doris/pull/37486)

- Fixes an issue where the sequential data optimization strategy could lead to incorrect data in aggregate tables or MOR UNIQUE tables. [ #38299](https://github.com/apache/doris/pull/38299)

- Optimizes the rowset selection strategy during compaction during replica replenishment to avoid triggering -235 errors. [#39262](https://github.com/apache/doris/pull/39262)

### MOW (Merge-On-Write)

- Optimizes slow column updates caused by concurrent column updates and compactions. [#38682](https://github.com/apache/doris/pull/38682)

- Fixes an issue where segcompaction during bulk data imports could lead to incorrect MOW data. [#38992](https://github.com/apache/doris/pull/38992) [#39707](https://github.com/apache/doris/pull/39707)

- Fixes data loss in column updates that may occur after BE restarts. [#39035](https://github.com/apache/doris/pull/39035)

### Storage Management

- Adds FE configuration to control whether queries under hot-cold tiering prefer local data replicas. [#38322](https://github.com/apache/doris/pull/38322)

- Optimizes expired BE report messages to include newly created tablets. [#38839](https://github.com/apache/doris/pull/38839) [#39605](https://github.com/apache/doris/pull/39605)

- Optimizes replica scheduling priority strategy to prioritize replicas with missing data. [#38884](https://github.com/apache/doris/pull/38884)

- Prevents tablets with unfinished ALTER jobs from being balanced. [#39202](https://github.com/apache/doris/pull/39202)

- Enables modifying the number of buckets for tables with list partitioning. [#39688](https://github.com/apache/doris/pull/39688)

- Prefers querying from online disk services. [#39654](https://github.com/apache/doris/pull/39654)

- Improves error messages for materialized view base tables that do not support deletion during synchronization. [#39857](https://github.com/apache/doris/pull/39857)

- Improves error messages for single columns exceeding 4GB. [#39897](https://github.com/apache/doris/pull/39897)

- Fixes an issue where aborted transactions were omitted when plan errors occurred during `INSERT` statements.[#38260](https://github.com/apache/doris/pull/38260)

- Fixes exceptions during SSL connection closure.[#38677](https://github.com/apache/doris/pull/38677)

- Fixes an issue where table locks were not held when aborting transactions using labels. [#38842](https://github.com/apache/doris/pull/38842)

- Fixes `gson pretty` causing large image issues. [#39135](https://github.com/apache/doris/pull/39135)

- Fixes an issue where the new optimizer did not check for bucket values of 0 in `CREATE TABLE` statements.[#38999](https://github.com/apache/doris/pull/38999)

- Fixes errors when Chinese column names are included in `DELETE` condition predicates. [#39500](https://github.com/apache/doris/pull/39500)

- Fixes frequent tablet balancing issues in partition balancing mode. [#39606](https://github.com/apache/doris/pull/39606)

- Fixes an issue where partition storage policy attributes were lost. [#39677](https://github.com/apache/doris/pull/39677)

- Fixes incorrect statistics when importing multiple tables within a transaction. [#39548](https://github.com/apache/doris/pull/39548)

- Fixes errors when deleting random bucket tables. [#39830](https://github.com/apache/doris/pull/39830)

- Fixes issues where FE fails to start due to non-existent UDFs. [#39868](https://github.com/apache/doris/pull/39868)

- Fixes inconsistencies in the last failed version between FE master and slave. [#39947](https://github.com/apache/doris/pull/39947)

- Fixes an issue where related tablets may still be in schema change state when schema change jobs are canceled. [ #39327](https://github.com/apache/doris/pull/39327)

- Fixes errors when modifying type and column order in a single statement schema change (SC). [#39107](https://github.com/apache/doris/pull/39107)

### Data Loading

- Improves error messages for -238 errors during imports. [#39182](https://github.com/apache/doris/pull/39182)

- Allows importing to other partitions while restoring a partition. [#39915](https://github.com/apache/doris/pull/39915)

- Optimizes the strategy for FE to select BEs during group commit. [#37830](https://github.com/apache/doris/pull/37830) [#39010](https://github.com/apache/doris/pull/39010)

- Avoids printing stack traces for some common streamload error messages. [#38418](https://github.com/apache/doris/pull/38418)

- Improves handling of issues where offline BEs may affect import errors. [#38256](https://github.com/apache/doris/pull/38256)

### Permissions

- Optimizes access performance after enabling the Ranger authentication plugin. [#38575](https://github.com/apache/doris/pull/38575)
- Optimizes permission strategies for Refresh Catalog/Database/Table operations, allowing users to perform these operations with only SHOW permissions. [#39008](https://github.com/apache/doris/pull/39008)

## Bug fixes

### Lakehouse

- Fixes the issue where switching catalogs may result in an error of not finding the database. [#38114](https://github.com/apache/doris/pull/38114)

- Addresses exceptions caused by attempting to read non-existent data on S3. [#38253](https://github.com/apache/doris/pull/38253)

- Resolves the issue where specifying an abnormal path during export operations may lead to incorrect export locations. [#38602](https://github.com/apache/doris/pull/38602)

- Fixes the timezone issue for time columns in Paimon tables. [#37716](https://github.com/apache/doris/pull/37716)

- Temporarily disables the Parquet PageIndex feature to avoid certain erroneous behaviors.

- Corrects the selection of Backend nodes in the blacklist during external table queries. [#38984](https://github.com/apache/doris/pull/38984)

- Resolves errors caused by missing subcolumns in Parquet Struct column types.[#39192](https://github.com/apache/doris/pull/39192)

- Addresses several issues with predicate pushdown in JDBC Catalog. [#39082](https://github.com/apache/doris/pull/39082)

- Fixes issues where some historical Parquet formats led to incorrect query results. [#39375](https://github.com/apache/doris/pull/39375)

- Improves compatibility with ojdbc6 drivers for Oracle JDBC Catalog. [#39408](https://github.com/apache/doris/pull/39408)

- Resolves potential FE memory leaks caused by Refresh Catalog/Database/Table operations. [#39186](https://github.com/apache/doris/pull/39186) [#39871](https://github.com/apache/doris/pull/39871)

- Fixes thread leaks in JDBC Catalog under certain conditions. [#39666](https://github.com/apache/doris/pull/39666) [#39582](https://github.com/apache/doris/pull/39582)

- Addresses potential event processing failures after enabling Hive Metastore event subscription. [#39239](https://github.com/apache/doris/pull/39239)

- Disables reading Hive Text format tables with custom escape characters and null formats to prevent data errors. [#39869](https://github.com/apache/doris/pull/39869)

- Resolves issues accessing Iceberg tables created via the Iceberg API under certain conditions. [#39203](https://github.com/apache/doris/pull/39203)

- Fixes the inability to read Paimon tables stored on HDFS clusters with high availability enabled. [#39876](https://github.com/apache/doris/pull/39876)

- Addresses errors that may occur when reading Paimon table deletion vectors after enabling file caching. [#39875](https://github.com/apache/doris/pull/39875)

- Resolves potential deadlocks when reading Parquet files under certain conditions. [#39945](https://github.com/apache/doris/pull/39945)

### Async Materialized View

- Fixes the inability to use `SHOW CREATE MATERIALIZED VIEW` on follower FEs. [#38794](https://github.com/apache/doris/pull/38794)

- Unifies the object type of asynchronous materialized views in metadata as tables to enable proper display in data tools. [#38797](https://github.com/apache/doris/pull/38797)

- Resolves the issue where nested asynchronous materialized views always perform full refreshes. [#38698](https://github.com/apache/doris/pull/38698)

- Fixes the issue where canceled tasks may show as running after restarting FEs. [ #39424](https://github.com/apache/doris/pull/39424)

- Addresses incorrect use of contexts, which may lead to unexpected failures of materialized view refresh tasks. [#39690](https://github.com/apache/doris/pull/39690)

- Resolves issues that may cause varchar type write failures due to unreasonable lengths when creating asynchronous materialized views based on external tables.[#37668](https://github.com/apache/doris/pull/37668)

- Fixes the potential invalidation of asynchronous materialized views based on external tables after FE restarts or catalog rebuilds. [#39355](https://github.com/apache/doris/pull/39355)

- Prohibits the use of partition rollup for materialized views with list partitions to prevent the generation of incorrect data. [#38124](https://github.com/apache/doris/pull/38124)

- Fixes incorrect results when literals exist in the select list during transparent rewriting for aggregation rollup. [#38958](https://github.com/apache/doris/pull/38958)

- Addresses potential errors during transparent rewriting when queries contain filters like `a = a`. [#39629](https://github.com/apache/doris/pull/39629)

- Fixes issues where transparent rewriting for direct external table queries fails. [#39041](https://github.com/apache/doris/pull/39041)

### Semi-Structured Data Management

- Removes support for prepared statements in the old optimizer. [#39465](https://github.com/apache/doris/pull/39465)

- Fixes issues with JSON escape character handling. [#37251](https://github.com/apache/doris/pull/37251)

- Resolves issues with duplicate processing of JSON fields. [#38490](https://github.com/apache/doris/pull/38490)

- Fixes issues with some ARRAY and MAP functions. [#39307](https://github.com/apache/doris/pull/39307) [#39699](https://github.com/apache/doris/pull/39699) [#39757](https://github.com/apache/doris/pull/39757)

- Resolves complex combinations of inverted index queries and LIKE queries. [#36687](https://github.com/apache/doris/pull/36687)

### Query Optimizer

- Fixed the potential partition pruning error issue when the 'OR' condition exists in partition filter conditions. [#38897](https://github.com/apache/doris/pull/38897)

- Fixed the potential partition pruning error issue when complex expressions are involved. [#39298](https://github.com/apache/doris/pull/39298)

- Fixed the issue where nullable in `agg_state` subtypes might be planned incorrectly, leading to execution errors. [#37489](https://github.com/apache/doris/pull/37489)

- Fixed the issue where nullable in set operation operators might be planned incorrectly, leading to execution errors. [#39109](https://github.com/apache/doris/pull/39109)

- Fixed the incorrect execution priority issue of intersect operator. [#39095](https://github.com/apache/doris/pull/39095)

- Fixed the NPE issue that may occur when the maximum valid date literal exists in the query. [#39482](https://github.com/apache/doris/pull/39482)

- Fixed the occasional planning error that results in an illegal slot error during execution. [#39640](https://github.com/apache/doris/pull/39640)

- Fixed the issue where repeatedly referencing columns in cte may lead to missing data in some columns in the result. [#39850](https://github.com/apache/doris/pull/39850)

- Fixed the occasional planning error issue when 'case when' exists in the query. [#38491](https://github.com/apache/doris/pull/38491)

- Fixed the issue where IP types cannot be implicitly converted to string types. [#39318](https://github.com/apache/doris/pull/39318)

- Fixed the potential planning error issue when using multi-dimensional aggregation and the same column and its alias exist in the select list. [ #38166](https://github.com/apache/doris/pull/38166)

- Fixed the issue where boolean types might be handled incorrectly when using BE constant folding. [#39019](https://github.com/apache/doris/pull/39019)

- Fixed the planning error issue caused by `default_cluster`: as a prefix for the database name in expressions. [#39114](https://github.com/apache/doris/pull/39114)

- Fixed the potential deadlock issue caused by` insert into`. [#38660](https://github.com/apache/doris/pull/38660)

- Fixed the potential planning error issue caused by not holding table locks throughout the planning process. [#38950](https://github.com/apache/doris/pull/38950)

- Fixed the issue where CHAR(0), VARCHAR(0) are not handled correctly when creating tables. [#38427](https://github.com/apache/doris/pull/38427)

- Fixed the issue where `show create table` may incorrectly display hidden columns. [#38796](https://github.com/apache/doris/pull/38796)

- Fixed the issue where columns with the same name as hidden columns are not prohibited when creating tables. [#38796](https://github.com/apache/doris/pull/38796)

- Fixed the occasional planning error issue when executing `insert into as select` with CTEs. [#38526](https://github.com/apache/doris/pull/38526)

- Fixed the issue where `insert into values` cannot automatically fill null default values. **[[fix](Nereids) fix insert into table with null literal default value #39122](https://github.com/apache/doris/pull/39122)**

- Fixed the NPE issue caused by using cte in delete without using it. [#39379](https://github.com/apache/doris/pull/39379)

- Fixed the issue where deleting from a randomly distributed aggregation model table fails. [#37985](https://github.com/apache/doris/pull/37985)

### Query Execution

- Fixed the issue where the pipeline execution engine gets stuck in multiple scenarios, causing queries not to end. [#38657](https://github.com/apache/doris/pull/38657) [#38206](https://github.com/apache/doris/pull/38206) [#38885](https://github.com/apache/doris/pull/38885)

- Fixed the coredump issue caused by null and non-null columns in set difference calculations.[#38737](https://github.com/apache/doris/pull/38737)

- Fixed the incorrect result issue of the `width_bucket` function. [#37892](https://github.com/apache/doris/pull/37892)

- Fixed the query error issue when a single row of data is large and the result set is also large (exceeding 2GB). [#37990](https://github.com/apache/doris/pull/37990)

- Fixed the incorrect result issue of `stddev` with DecimalV2 type. [#38731](https://github.com/apache/doris/pull/38731)

- Fixed the coredump issue caused by the `MULTI_MATCH_ANY` function. [#37959](https://github.com/apache/doris/pull/37959)

- Fixed the issue where `insert overwrite auto partition` causes transaction rollback. [#38103](https://github.com/apache/doris/pull/38103)

- Fixed the incorrect result issue of the `convert_tz` function. [#37358](https://github.com/apache/doris/pull/37358) [#38764](https://github.com/apache/doris/pull/38764)

- Fixed the coredump issue when using the `collect_set` function with window functions. [#38234](https://github.com/apache/doris/pull/38234)

- Fixed the coredump issue caused by the mod function with abnormal input. [#37999](https://github.com/apache/doris/pull/37999)

- Fixed the issue where executing the same expression in multiple threads may lead to incorrect Java UDF results. [#38612](https://github.com/apache/doris/pull/38612)

- Fixed the overflow issue caused by the incorrect return type of the `conv` function. [#38001](https://github.com/apache/doris/pull/38001)

- Fixed the unstable result issue of the histogram function. [#38608](https://github.com/apache/doris/pull/38608)

### Backup & Recovery / CCR

- Fixed the issue where the data version after backup and recovery may be incorrect, leading to unreadability. [#38343](https://github.com/apache/doris/pull/38343)

- Fixed the issue of using restore version across versions. [#38396](https://github.com/apache/doris/pull/38396)

- Fixed the issue where the job is not canceled when backup fails. [#38993](https://github.com/apache/doris/pull/38993)

- Fixed the NPE issue in ccr during the upgrade from 2.1.4 to 2.1.5, causing the FE to fail to start. [#39910](https://github.com/apache/doris/pull/39910)

- Fixed the issue where views and materialized views cannot be used after restoration. [#38072](https://github.com/apache/doris/pull/38072) [#39848](https://github.com/apache/doris/pull/39848)

### Storage Management

- Fixed possible memory leaks in routine load when loading multiple tables from a single stream. [#38824](https://github.com/apache/doris/pull/38824)

- Fixed the issue where delimiters and escape characters in routine load were not effective. [#38825](https://github.com/apache/doris/pull/38825)

- Fixed incorrectly show routine load results when the routine load task name contained uppercase letters. [#38826](https://github.com/apache/doris/pull/38826)

- Fixed the issue where the offset cache was not reset when changing the routineload topic. [#38474](https://github.com/apache/doris/pull/38474)

- Fixed the potential exception triggered by show routineload under concurrent scenarios. [#39525](https://github.com/apache/doris/pull/39525)

- Fixed the issue where routine load might import data repeatedly. [#39526](https://github.com/apache/doris/pull/39526)

- Fixed the data error caused by `setNull` when enabling group commit via JDBC. [#38276](https://github.com/apache/doris/pull/38276)

- Fixed the potential NPE issue when enabling group commit insert to a non-master FE. [#38345](https://github.com/apache/doris/pull/38345)

- Fixed incorrect error handling during internal data writing in group commit. [#38997](https://github.com/apache/doris/pull/38997)

- Fixed the coredump that might be triggered when the group commit execution plan failed. [#39396](https://github.com/apache/doris/pull/39396)

- Fixed the issue where concurrent imports into auto partition tables might report non-existent tablets. [#38793](https://github.com/apache/doris/pull/38793)

- Fixed potential load stream leakage issues. [#39039](https://github.com/apache/doris/pull/39039)

- Fixed the issue where transactions were opened for `insert into select` with no data. [#39108](https://github.com/apache/doris/pull/39108)

- Ignored the single-replica import configuration when using memtable prefetching. [#39154](https://github.com/apache/doris/pull/39154)

- Fixed the issue where background imports of stream load records might be abnormally aborted upon encountering db deletion. [#39527](https://github.com/apache/doris/pull/39527)

- Fixed inaccurate error messages when data errors occurred in strict mode. [#39587](https://github.com/apache/doris/pull/39587)

- Fixed the issue where streamload did not return an error URL upon encountering erroneous data. [#38417](https://github.com/apache/doris/pull/38417)

- Fixed the issue with the combined use of insert overwrite and auto partition. [#38442](https://github.com/apache/doris/pull/38442)

- Fixed parsing errors when CSV encountered data where the line delimiter was enclosed by the enclosing character. [#38445](https://github.com/apache/doris/pull/38445)

### Data Exporting

- Fixed the issue where enabling the delete_existing_files property during export operations might result in duplicate deletion of exported data. [#39304](https://github.com/apache/doris/pull/39304))

### Permissions

- Fixed the incorrect requirement of ALTER TABLE permission when creating a materialized view. [#38011](https://github.com/apache/doris/pull/38011)

- Fixed the issue where the db was explicitly displayed as empty when showing routine load. [#38365](https://github.com/apache/doris/pull/38365)

- Fixed the incorrect requirement of CREATE permission on the original table when using CREATE TABLE LIKE. [#37879](https://github.com/apache/doris/pull/37879)

- Fixed the issue where grant operations did not check if the object existed. [#39597](https://github.com/apache/doris/pull/39597)

## Upgrade suggestions

When upgrading Doris, please follow the principle of not skipping two minor versions and upgrade sequentially.

For example, if you are upgrading from version 0.15.x to 2.0.x, it is recommended to first upgrade to the latest version of 1.1, then upgrade to the latest version of 1.2, and finally upgrade to the latest version of 2.0.

For more upgrade information, see the documentation: [Cluster Upgrade](../../admin-manual/cluster-management/upgrade)