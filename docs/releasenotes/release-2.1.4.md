---
{
    "title": "Release 2.1.4",
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

**Apache Doris version 2.1.4 was officially released on June 26, 2024.** In this update, we have optimized various functional experiences for data lakehouse scenarios, with a focus on resolving the abnormal memory usage issue in the previous version. Additionally, we have implemented several improvemnents and bug fixes to enhance the stability.  Welcome to download and use it.


**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases


## Behavior changes

- Non-existent files will be ignored when querying external tables such as Hive. [#35319](https://github.com/apache/doris/pull/35319)

  The file list is obtained from the meta cache, and it may not be consistent with the actual file list.
  
  Ignoring non-existent files helps to avoid query errors.

- By default, creating a Bitmap Index will no longer be automatically changed to an Inverted Index. [#35521](https://github.com/apache/doris/pull/35521)

  This behavior is controlled by the FE configuration item `enable_create_bitmap_index_as_inverted_index`, which defaults to false.

- When starting FE and BE processes using `--console`, all logs will be output to the standard output and differentiated by prefixes indicating the log type. [#35679](https://github.com/apache/doris/pull/35679)

	For more infomation, please see the documentations:
	
	- [Log Management - FE Log](../admin-manual/log-management/fe-log.md)

	- [Log Management - BE Log](../admin-manual/log-management/be-log.md)

- If no table comment is provided when creating a table, the default comment will be empty instead of using the table type as the default comment. [#36025](https://github.com/apache/doris/pull/36025)

- The default precision of DECIMALV3 has been adjusted from (9, 0) to (38, 9) to maintain compatibility with the version in which this feature was initially released. [#36316](https://github.com/apache/doris/pull/36316)

## New features

### Query optimizer

- Support FE flame graph tool
  
  For more information, see the [documentation](/community/developer-guide/fe-profiler.md)
  
- Support `SELECT DISTINCT` to be used with aggregation.

- Support single table query rewrite without `GROUP BY`. This is useful for complex filters or expressions. [#35242](https://github.com/apache/doris/pull/35242).

- The new optimizer fully supports point query functionality [#36205](https://github.com/apache/doris/pull/36205).

### Data Lakehouse

- Support native reader of Apache Paimon deletion vector  [#35241](https://github.com/apache/doris/pull/35241)

- Support using Resource in Table Valued Functions [#35139](https://github.com/apache/doris/pull/35139)

- Access controller with Hive Ranger plugin supports Data Mask

### Asynchronous materialized views

- Build support for internal table triggered updates, where if a materialized view uses an internal table and the data in the internal table changes, it can trigger a refresh of the materialized view, specifying REFRESH ON COMMIT when creating the materialized view.

- Support transparent rewriting for single tables. For more information, see [Querying Async Materialized View](../query/view-materialized-view/query-async-materialized-view.md).

- Transparent rewriting supports aggregation roll-up for agg_state, agg_union types; materialized views can be defined as agg_state or agg_union, queries can use specific aggregation functions, or use agg_merge. For more information, see [AGG_STATE](../sql-manual/sql-types/Data-Types/AGG_STATE.md).

### Others

- Added function `replace_empty`. 

	For more information, see [documentation]../sql-manual/sql-functions/string-functions/replace_empty).

- Support `show storage policy using` statement.

	For more information, see [documentation](../sql-manual/sql-statements/Show-Statements/SHOW-STORAGE-POLICY-USING.md).

- Support JVM metrics on the BE side.

  By setting `enable_jvm_monitor=true` in `be.conf` to enable this feature.

## Improvements

- Supported creating inverted indexes for columns with Chinese names. [#36321](https://github.com/apache/doris/pull/36321)

- Estimate memory consumed by segment cache more accurately so that unused memory can be released more quickly. [#35751](https://github.com/apache/doris/pull/35751)

- Filter empty partitions before exporting tables to remote storage. [#35542](https://github.com/apache/doris/pull/35542)

- Optimize routine load task allocation algorithm to balance the load among Backends. [#34778](https://github.com/apache/doris/pull/34778)

- Provide hints when a related variable is not found during a set operation. [#35775](https://github.com/apache/doris/pull/35775)

- Support placing Java UDF jar files in the FE's `custom_lib` directory for default loading. [#35984](https://github.com/apache/doris/pull/35984)

- Add a timeout global variable `audit_plugin_load_timeout` for audit log load jobs.

- Optimize the performance of transparent rewrite planning for asynchronous materialized views.

- Optimize the `INSERT` operation that when the source is empty, the BE will not execute. [#34418](https://github.com/apache/doris/pull/34418)

- Support fetching file lists of Hive/Hudi tables in batches. In a senario with 1.2 million files, the time taken to obtain the list of files has been reduced from 390 seconds to 46 seconds. [#35107](https://github.com/apache/doris/pull/35107)

- Forbid dynamic partitioning when creating asynchronous materialized views.

- Support detecting whether the partition data of external data of external tables in Hive is synchronized with asynchronous materialized views.

- Allow to create index for asynchronous materialized views.

## Bug fixes

### Query optimizer

- Fixed the issue where SQL cache returns old results after truncating a partition. [#34698](https://github.com/apache/doris/pull/34698)

- Fixed the issue where casting from JSON to other types did not correctly handle nullable attributes. [#34707](https://github.com/apache/doris/pull/34707)

- Fixed occasional DATETIMEV2 literal simplification errors. [#35153](https://github.com/apache/doris/pull/35153)

- Fixed the issue where `COUNT(*)` could not be used in window functions. [#35220](https://github.com/apache/doris/pull/35220)

- Fixed the issue where nullable attributes could be incorrect when all `SELECT` statements under `UNION ALL` have no `FROM` clause. [#35074](https://github.com/apache/doris/pull/35074)

- Fixed the issue where `bitmap in join` and subquery unnesting could not be used simultaneously. [#35435](https://github.com/apache/doris/pull/35435)

- Fixed the performance issue where filter conditions could not be pushed down to the CTE producer in specific situations. [#35463](https://github.com/apache/doris/pull/35463)

- Fixed the issue where aggregate combinators written in uppercase could not be found. [#35540](https://github.com/apache/doris/pull/35540)

- Fixed the performance issue where window functions were not properly pruned by column pruning. [#35504](https://github.com/apache/doris/pull/35504)

- Fixed the issue where queries might parse incorrectly leading to wrong results when multiple tables with the same name but in different databases appeared simultaneously in the query. [#35571](https://github.com/apache/doris/pull/35571)

- Fixed the query error caused by generating runtime filters during schema table scans. [#35655](https://github.com/apache/doris/pull/35655)

- Fixed the issue where nested correlated subqueries could not execute because the join condition was folded into a null literal. [#35811](https://github.com/apache/doris/pull/35811)

- Fixed the occasional issue where decimal literals were set with incorrect precision during planning. [#36055](https://github.com/apache/doris/pull/36055)

- Fixed the occasional issue where multiple layers of aggregation were merged incorrectly during planning. [#36145](https://github.com/apache/doris/pull/36145)

- Fixed the occasional issue where the input-output mismatch error occurred after aggregate expansion planning. [#36207](https://github.com/apache/doris/pull/36207)

- Fixed the occasional issue where `<=>` was incorrectly converted to `=`. [#36521](https://github.com/apache/doris/pull/36521)

### Query execution

- Fixed the issue where the query hangs if the limited rows are reached on the pipeline engine and memory is not released. [#35746](https://github.com/apache/doris/pull/35746)

- Fixed the BE coredump when `enable_decimal256` is true but falls back to the old planner. [#35731](https://github.com/apache/doris/pull/35731)

### Asynchronous materialized views

- Fixed the issue in the asynchronous materialized view build where the store_row_column attribute specified was not being recognized by the core.

- Fixed the problem in the asynchronous materialized view build where specifying the storage_medium was not taking effect.

- Resolved the error occurring in the asynchronous materialized view show partitions after the base table is deleted.

- Fixed the issue where asynchronous materialized views caused backup and restore exceptions. [#35703](https://github.com/apache/doris/pull/35703)

- Fixed the issue where partition rewrite could lead to incorrect results. [#35236](https://github.com/apache/doris/pull/35236)

### Semi-structured

- Fixed the core dump problem when a VARIANT with an empty key is used. [#35671](https://github.com/apache/doris/pull/35671)
- Bitmap and BloomFilter index should not perform light index changes. [#35225](https://github.com/apache/doris/pull/35225)

### Primary key

- Fixed the issue where an exception BE restart occurred in the case of partial column updates during import, which could result in duplicate keys. [#35678](https://github.com/apache/doris/pull/35678)

- Fixed the issue where BE might core dump during clone operations when memory is tight. [#34702](https://github.com/apache/doris/pull/34702)

### Data Lakehouse

- Fixed the issue where a Hive table could not be created with a fully qualified name such as `ctl.db.tbl` [#34984](https://github.com/apache/doris/pull/34984)

- Fixed the issue where the Hive metastore connection did not close when refreshing [#35426](https://github.com/apache/doris/pull/35426)

- Fixed a potential meta replay issue when upgrading from 2.0.x to 2.1.x. [#35532](https://github.com/apache/doris/pull/35532)

- Fixed the issue where the Table Valued Function could not read an empty snappy compressed file. [#34926](https://github.com/apache/doris/pull/34926)

- Fixed the issue where unable to read Parquet files with invalid min-max column statistics [#35041](https://github.com/apache/doris/pull/35041)

- Fixed the issue where unable to handle pushdown predicates with null-aware functions in the Parquet/ORC reader [#35335](https://github.com/apache/doris/pull/35335)

- Fixed the issue about the order of partition columns when creating a Hive table [#35347](https://github.com/apache/doris/pull/35347)

- Fixed the issue where writing to a Hive table on S3 failed when partition values contained spaces [#35645](https://github.com/apache/doris/pull/35645)

- Fixed the issue about incorrect scheme of Aliyun OSS endpoint [#34907](https://github.com/apache/doris/pull/34907)

- Fixed the issue where the Parquet format Hive table written by Doris could not be read by Hive [#34981](https://github.com/apache/doris/pull/34981)

- Fixed the issue where unable to read ORC files after the schema change of a Hive table [#35583](https://github.com/apache/doris/pull/35583)

- Fixed the issue where unable to read Paimon tables via JNI after the schema change of the Paimon table [#35309](https://github.com/apache/doris/pull/35309)

- Fixed the issue of too small Row Groups in Parquet format files written out. [#36042](https://github.com/apache/doris/pull/36042) [#36143](https://github.com/apache/doris/pull/36143)

- Fixed the issue where unable to read Paimon tables after schema changes [#36049](https://github.com/apache/doris/pull/36049)

- Fixed the issue where unable to read Hive Parquet format tables after schema changes [#36182](https://github.com/apache/doris/pull/36182)

- Fixed the FE OOM issue caused by Hadoop FS cache [#36403](https://github.com/apache/doris/pull/36403)

- Fixed the issue where FE could not start after enabling the Hive Metastore Listener [#36533](https://github.com/apache/doris/pull/36533)

- Fixed the issue of query performance degradation with a large number of files [#36431](https://github.com/apache/doris/pull/36431)

- Fixed the timezone issue when reading the timestamp column type in Iceberg [#36435](https://github.com/apache/doris/pull/36435)

- Fixed DATETIME conversion error and data path error on Iceberg Table. [#35708](https://github.com/apache/doris/pull/35708)

- Support retain and pass the additional user-defined properties fo Table Valued Functions to the S3 SDK. [#35515](https://github.com/apache/doris/pull/35515)


### Data import

- Fixed the issue where `CANCEL LOAD` did not work [#35352](https://github.com/apache/doris/pull/35352)

- Fixed the issue where a null pointer error in the Publish phase of load transactions prevented the load from completing [#35977](https://github.com/apache/doris/pull/35977)

- Fixed the issue with bRPC serializing large data files when sent via HTTP [#36169](https://github.com/apache/doris/pull/36169)

### Data management

- Fixed the isseu that the resource tag in ConnectionContext was not set after forwarding DDL or DML to master FE. [#35618](https://github.com/apache/doris/pull/35618)

- Fixed the issue where the restored table name was incorrect when `lower_case_table_names` was enabled [#35508](https://github.com/apache/doris/pull/35508)

- Fixed the issue where `admin clean trash` could not work [#35271](https://github.com/apache/doris/pull/35271)

- Fixed the issue where a storage policy could not be deleted from a partition [#35874](https://github.com/apache/doris/pull/35874)

- Fixed the issue of data loss when importing into a multi-replica automatic partition table [#36586](https://github.com/apache/doris/pull/36586)

- Fixed the issue where the partition column of a table changed when querying or inserting into an automatic partition table using the old optimizer [#36514](https://github.com/apache/doris/pull/36514)

### Memory management

- Fixed the issue of frequent errors in the logs due to failure in obtaining Cgroup meminfo. [#35425](https://github.com/apache/doris/pull/35425)

- Fixed the issue where the Segment cache size was uncontrolled when using BloomFilter, leading to abnormal process memory growth. [#34871](https://github.com/apache/doris/pull/34871)

### Permissions

- Fixed the issue where permission settings were ineffective after enabling case-insensitive table names. [#36557](https://github.com/apache/doris/pull/36557)

- Fixed the issue where setting LDAP passwords through non-Master FE nodes did not take effect. [#36598](https://github.com/apache/doris/pull/36598)

- Fixed the issue where authorization could not be checked for the `SELECT COUNT(*)` statement. [#35465](https://github.com/apache/doris/pull/35465)

### Others

- Fixed the issue where the client JDBC program could not close the connection if the MySQL connection was broken. [#36616](https://github.com/apache/doris/pull/36616)

- Fixed MySQL protocol compatibility issue with the `SHOW PROCEDURE STATUS` statement. [#35350](https://github.com/apache/doris/pull/35350)

- The `libevent` now forces Keepalive to solve the issue of connection leaks in certain situations. [#36088](https://github.com/apache/doris/pull/36088)

## Credits

Thanks to every one who contributes to this release.

@airborne12, @amorynan, @AshinGau, @BePPPower, @BiteTheDDDDt, @ByteYue, @caiconghui, @CalvinKirs, @cambyzju, @catpineapple, @cjj2010, @csun5285, @DarvenDuan, @dataroaring, @deardeng, @Doris-Extras, @eldenmoon, @englefly, @feiniaofeiafei, @felixwluo, @freemandealer, @Gabriel39, @gavinchou, @GoGoWen, @HappenLee, @hello-stephen, @hubgeter, @hust-hhb, @jacktengg, @jackwener, @jeffreys-cat, @Jibing-Li, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @lide-reed, @luennng, @luwei16, @mongo360, @morningman, @morrySnow, @mrhhsg, @Mryange, @mymeiyi, @nextdreamblue, @platoneko, @qidaye, @qzsee, @seawinde, @shuke987, @sollhui, @starocean999, @suxiaogang223, @TangSiyang2001, @Thearas, @Vallishp, @w41ter, @wangbo, @whutpencil, @wsjz, @wuwenchi, @xiaokang, @xiedeyantu, @XieJiann, @xinyiZzz, @XuPengfei-1020, @xy720, @xzj7019, @yiguolei, @yongjinhou, @yujun777, @Yukang-Lian, @Yulei-Yang, @zclllyybb, @zddr, @zfr9527, @zgxme, @zhangbutao, @zhangstar333, @zhannngchen, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993