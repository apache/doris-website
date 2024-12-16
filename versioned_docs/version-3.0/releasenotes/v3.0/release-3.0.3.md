---
{
    "title": "Release 3.0.3",
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


Dear community members, the Apache Doris 3.0.2 version was officially released on December 02, 2024, this version further enhances the performance and stability of the system.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavioral Changes

- Prohibited column updates on MOW tables with synchronous materialized views. [#40190](https://github.com/apache/doris/pull/40190)
- Adjusted the default parameters of RoutineLoad to improve import efficiency. [#42968](https://github.com/apache/doris/pull/42968)
- When StreamLoad fails, the return value of LoadedRows is adjusted to 0. [#41946](https://github.com/apache/doris/pull/41946) [#42291](https://github.com/apache/doris/pull/42291)
- Adjusted the default memory limit of Segment cache to 5%. [#42308](https://github.com/apache/doris/pull/42308) [#42436](https://github.com/apache/doris/pull/42436)

## New Features

- Introduced the session variable `enable_cooldown_replica_affinity` to control the affinity of cold and hot tiered replicas. [#42677](https://github.com/apache/doris/pull/42677)

- Added `table$partition` syntax for querying partition information of Hive tables. [#40774](https://github.com/apache/doris/pull/40774)
  
  - [View Documentation](https://doris.apache.org/docs/3.0/lakehouse/datalake-analytics/hive)

- Supported creation of Hive tables in Text format. [#41860](https://github.com/apache/doris/pull/41860) [#42175](https://github.com/apache/doris/pull/42175)

  - [View Documentation](https://doris.apache.org/zh-CN/docs/3.0/lakehouse/datalake-building/hive-build#table)

### Asynchronous Materialized Views

- Introduced new materialized view attribute `use_for_rewrite`. When `use_for_rewrite` is set to false, the materialized view does not participate in transparent rewriting. [#40332](https://github.com/apache/doris/pull/40332)

### Query Optimizer

- Supported correlated non-aggregate subqueries. [#42236](https://github.com/apache/doris/pull/42236)

### Query Execution

- Added functions `ngram_search`, `normal_cdf`, `to_iso8601`, `from_iso8601_date`, `SESSION_USER()`, `last_query_id`. [#38226](https://github.com/apache/doris/pull/38226) [#40695](https://github.com/apache/doris/pull/40695) [#41075](https://github.com/apache/doris/pull/41075) [#41600](https://github.com/apache/doris/pull/41600) [#39575](https://github.com/apache/doris/pull/39575) [#40739](https://github.com/apache/doris/pull/40739)
- The `aes_encrypt` and `aes_decrypt` functions support GCM mode. [#40004](https://github.com/apache/doris/pull/40004)
- Profile outputs the changed session variable values. [#41016](https://github.com/apache/doris/pull/41016) [#41318](https://github.com/apache/doris/pull/41318)

### Semi-structured Data Management

- Added array functions `array_match_all` and `array_match_any`. [#40605](https://github.com/apache/doris/pull/40605) [#43514](https://github.com/apache/doris/pull/43514)
- The array function `array_agg` supports nesting ARRAY/MAP/STRUCT within ARRAY. [#42009](https://github.com/apache/doris/pull/42009)
- Added approximate aggregate statistical functions `approx_top_k` and `approx_top_sum`. [#44082](https://github.com/apache/doris/pull/44082)

## Improvements

### Storage

- Supported `bitmap_empty` as the default value. [#40364](https://github.com/apache/doris/pull/40364)
- Introduced the session variable `insert_timeout` to control the timeout of DELETE statements. [#41063](https://github.com/apache/doris/pull/41063)
- Improved some error message prompts. [#41048](https://github.com/apache/doris/pull/41048) [#39631](https://github.com/apache/doris/pull/39631)
- Improved the priority scheduling of replica repair. [#41076](https://github.com/apache/doris/pull/41076)
- Enhanced the robustness of timezone handling when creating tables. [#41926](https://github.com/apache/doris/pull/41926) [#42389](https://github.com/apache/doris/pull/42389)
- Checked the validity of partition expressions when creating tables. [#40158](https://github.com/apache/doris/pull/40158)
- Supported Unicode-encoded column names in DELETE operations. [#39381](https://github.com/apache/doris/pull/39381)

### Compute-Storage Decoupled

- Supported ARM architecture deployment in storage and compute separation mode. [#42467](https://github.com/apache/doris/pull/42467) [#43377](https://github.com/apache/doris/pull/43377)
- Optimized the eviction strategy and lock competition of file cache, improving hit rate and high concurrency point query performance. [#42451](https://github.com/apache/doris/pull/42451) [#43201](https://github.com/apache/doris/pull/43201) [#41818](https://github.com/apache/doris/pull/41818) [#43401](https://github.com/apache/doris/pull/43401)
- S3 storage vault supported `use_path_style`, solving the problem of using custom domain names for object storage. [#43060](https://github.com/apache/doris/pull/43060) [#43343](https://github.com/apache/doris/pull/43343) [#43330](https://github.com/apache/doris/pull/43330)
- Optimized storage and compute separation configuration and deployment, preventing misoperations in different modes. [#43381](https://github.com/apache/doris/pull/43381) [#43522](https://github.com/apache/doris/pull/43522) [#43434](https://github.com/apache/doris/pull/43434) [#40764](https://github.com/apache/doris/pull/40764) [#43891](https://github.com/apache/doris/pull/43891)
- Optimized observability and provided an interface for deleting specified segment file cache. [#38489](https://github.com/apache/doris/pull/38489) [#42896](https://github.com/apache/doris/pull/42896) [#41037](https://github.com/apache/doris/pull/41037) [#43412](https://github.com/apache/doris/pull/43412)
- Optimized Meta-service operation and maintenance interface: RPC rate limiting and tablet metadata correction. [#42413](https://github.com/apache/doris/pull/42413) [#43884](https://github.com/apache/doris/pull/43884) [#41782](https://github.com/apache/doris/pull/41782) [#43460](https://github.com/apache/doris/pull/43460)

### Lakehouse

- Paimon Catalog supported Alibaba Cloud DLF and OSS-HDFS storage. [#41247](https://github.com/apache/doris/pull/41247) [#42585](https://github.com/apache/doris/pull/42585)
  
  - View [Documentation](https://doris.apache.org/docs/3.0/lakehouse/datalake-analytics/paimon)

- Supported reading of Hive tables in OpenCSV format. [#42257](https://github.com/apache/doris/pull/42257) [#42942](https://github.com/apache/doris/pull/42942)
- Optimized the performance of accessing the `information_schema.columns` table in External Catalog. [#41659](https://github.com/apache/doris/pull/41659) [#41962](https://github.com/apache/doris/pull/41962)
- Used the new Max Compute open storage API to access Max Compute data sources. [#41614](https://github.com/apache/doris/pull/41614)
- Optimized the scheduling policy of the JNI part of Paimon tables, making scan tasks more balanced. [#43310](https://github.com/apache/doris/pull/43310)
- Optimized the read performance of small ORC files. [#42004](https://github.com/apache/doris/pull/42004) [#43467](https://github.com/apache/doris/pull/43467)
- Supported reading of parquet files in brotli compressed format. [#42177](https://github.com/apache/doris/pull/42177)
- Added `file_cache_statistics` table under the `information_schema` library to view metadata cache statistics. [#42160](https://github.com/apache/doris/pull/42160)

### Query Optimizer

- Optimization: When queries only differ in comments, the same SQL Cache can be reused. [#40049](https://github.com/apache/doris/pull/40049)
- Optimization: Improved the stability of statistical information when data is frequently updated. [#43865](https://github.com/apache/doris/pull/43865) [#39788](https://github.com/apache/doris/pull/39788) [#43009](https://github.com/apache/doris/pull/43009) [#40457](https://github.com/apache/doris/pull/40457) [#42409](https://github.com/apache/doris/pull/42409) [#41894](https://github.com/apache/doris/pull/41894)
- Optimization: Enhanced the stability of constant folding. [#42910](https://github.com/apache/doris/pull/42910) [#41164](https://github.com/apache/doris/pull/41164) [#39723](https://github.com/apache/doris/pull/39723) [#41394](https://github.com/apache/doris/pull/41394) [#42256](https://github.com/apache/doris/pull/42256) [#40441](https://github.com/apache/doris/pull/40441)
- Optimization: Column pruning can generate better execution plans. [#41719](https://github.com/apache/doris/pull/41719) [#41548](https://github.com/apache/doris/pull/41548)

### Query Execution

- Optimized the memory usage of the sort operator. [#39306](https://github.com/apache/doris/pull/39306)
- Optimized the performance of computations on ARM. [#38888](https://github.com/apache/doris/pull/38888) [#38759](https://github.com/apache/doris/pull/38759)
- Optimized the computational performance of a series of functions. [#40366](https://github.com/apache/doris/pull/40366) [#40821](https://github.com/apache/doris/pull/40821) [#40670](https://github.com/apache/doris/pull/40670) [#41206](https://github.com/apache/doris/pull/41206) [#40162](https://github.com/apache/doris/pull/40162)
- Used SSE instructions to optimize the performance of the `match_ipv6_subnet` function. [#38755](https://github.com/apache/doris/pull/38755)
- Supported automatic creation of new partitions during insert overwrite. [#38628](https://github.com/apache/doris/pull/38628) [#42645](https://github.com/apache/doris/pull/42645)
- Added the status of each PipelineTask in Profile. [#42981](https://github.com/apache/doris/pull/42981)
- IP type supported runtime filter. [#39985](https://github.com/apache/doris/pull/39985)

### Semi-structured Data Management

- Output the real SQL of prepared statements in audit logs. [#43321](https://github.com/apache/doris/pull/43321)
- The filebeat doris output plugin supports fault tolerance and progress reporting. [#36355](https://github.com/apache/doris/pull/36355)
- Optimized the performance of inverted index queries. [#41547](https://github.com/apache/doris/pull/41547) [#41585](https://github.com/apache/doris/pull/41585) [#41567](https://github.com/apache/doris/pull/41567) [#41577](https://github.com/apache/doris/pull/41577) [#42060](https://github.com/apache/doris/pull/42060) [#42372](https://github.com/apache/doris/pull/42372)
- The array function `array overlaps` supports acceleration using inverted indexes. [#41571](https://github.com/apache/doris/pull/41571)
- The IP function `is_ip_address_in_range` supports acceleration using inverted indexes. [#41571](https://github.com/apache/doris/pull/41571)
- Optimized the CAST performance of the VARIANT data type. [#41775](https://github.com/apache/doris/pull/41775) [#42438](https://github.com/apache/doris/pull/42438) [#43320](https://github.com/apache/doris/pull/43320)
- Optimized the CPU resource consumption of the Variant data type. [#42856](https://github.com/apache/doris/pull/42856) [#43062](https://github.com/apache/doris/pull/43062) [#43634](https://github.com/apache/doris/pull/43634)
- Optimized the metadata and execution memory resource consumption of the Variant data type. [#42448](https://github.com/apache/doris/pull/42448) [#43326](https://github.com/apache/doris/pull/43326) [#41482](https://github.com/apache/doris/pull/41482) [#43093](https://github.com/apache/doris/pull/43093) [#43567](https://github.com/apache/doris/pull/43567) [#43620](https://github.com/apache/doris/pull/43620)

### Permissions

- Added a new configuration item `ldap_group_filter` in LDAP for custom group filtering. [#43292](https://github.com/apache/doris/pull/43292)

### Other

- Supported displaying connection count information by user in FE monitoring items. [#39200](https://github.com/apache/doris/pull/39200)

## Bug Fixes

### Storage

- Fixed the issue with using IPv6 hostnames. [#40074](https://github.com/apache/doris/pull/40074)
- Fixed the inaccurate display of broker/s3 load progress. [#43535](https://github.com/apache/doris/pull/43535)
- Fixed the issue where queries might hang from FE. [#41303](https://github.com/apache/doris/pull/41303) [#42382](https://github.com/apache/doris/pull/42382)
- Fixed the issue of duplicate auto-increment IDs under exceptional circumstances. [#43774](https://github.com/apache/doris/pull/43774)  [#43983](https://github.com/apache/doris/pull/43983)
- Fixed occasional NPE issues with groupcommit. [#43635](https://github.com/apache/doris/pull/43635)
- Fixed the inaccurate calculation of auto bucket. [#41675](https://github.com/apache/doris/pull/41675) [#41835](https://github.com/apache/doris/pull/41835)
- Fixed the issue where FE might not correctly plan multi-table flows after restart. [#41677](https://github.com/apache/doris/pull/41677) [#42290](https://github.com/apache/doris/pull/42290)

### Compute-Storage Decoupled

- Fixed the issue that MOW primary key tables with large delete bitmaps might cause coredump. [#43088](https://github.com/apache/doris/pull/43088) [#43457](https://github.com/apache/doris/pull/43457) [#43479](https://github.com/apache/doris/pull/43479) [#43407](https://github.com/apache/doris/pull/43407) [#43297](https://github.com/apache/doris/pull/43297) [#43613](https://github.com/apache/doris/pull/43613) [#43615](https://github.com/apache/doris/pull/43615) [#43854](https://github.com/apache/doris/pull/43854) [#43968](https://github.com/apache/doris/pull/43968) [#44074](https://github.com/apache/doris/pull/44074) [#41793](https://github.com/apache/doris/pull/41793) [#42142](https://github.com/apache/doris/pull/42142)
- Fixed the issue that segment files, when being a multiple of 5MB, would fail to upload objects. [#43254](https://github.com/apache/doris/pull/43254)
- Fixed the issue that the default retry policy of aws sdk did not take effect. [#43575](https://github.com/apache/doris/pull/43575) [#43648](https://github.com/apache/doris/pull/43648)
- Fixed the issue that altering storage vault could continue execution even when the wrong type was specified. [#43489](https://github.com/apache/doris/pull/43489) [#43352](https://github.com/apache/doris/pull/43352) [#43495](https://github.com/apache/doris/pull/43495)
- Fixed the issue that tablet_id might be 0 during the delayed commit process of large transactions. [#42043](https://github.com/apache/doris/pull/42043) [#42905](https://github.com/apache/doris/pull/42905)
- Fixed the issue that constant folding RCP and FE forwarding SQL might not be executed in the expected computation group. [#43110](https://github.com/apache/doris/pull/43110) [#41819](https://github.com/apache/doris/pull/41819) [#41846](https://github.com/apache/doris/pull/41846)
- Fixed the issue that meta-service did not strictly check instance_id upon receiving RPC. [#43253](https://github.com/apache/doris/pull/43253) [#43832](https://github.com/apache/doris/pull/43832)
- Fixed the issue that FE follower information_schema version did not update in time. [#43496](https://github.com/apache/doris/pull/43496)
- Fixed the issue of atomicity in file cache rename and inaccurate metrics. [#42869](https://github.com/apache/doris/pull/42869) [#43504](https://github.com/apache/doris/pull/43504) [#43220](https://github.com/apache/doris/pull/43220)

### Lakehouse

- Prohibited implicit conversion predicates from being pushed down to JDBC data sources to avoid inconsistent query results. [#42102](https://github.com/apache/doris/pull/42102)
- Fixed some read issues with high-version Hive transactional tables. [#42226](https://github.com/apache/doris/pull/42226)
- Fixed the issue that the Export command might cause deadlocks. [#43083](https://github.com/apache/doris/pull/43083) [#43402](https://github.com/apache/doris/pull/43402)
- Fixed the issue of being unable to query Hive views created by Spark. [#43552](https://github.com/apache/doris/pull/43552)
- Fixed the issue that Hive partition paths containing special characters led to incorrect partition pruning. [#42906](https://github.com/apache/doris/pull/42906)
- Fixed the issue that Iceberg Catalog could not use AWS Glue. [#41084](https://github.com/apache/doris/pull/41084)

### Asynchronous Materialized Views

- Fixed the issue that asynchronous materialized views might not refresh after the base table is rebuilt. [#41762](https://github.com/apache/doris/pull/41762)

### Query Optimizer

- Fixed the issue that partition pruning results might be incorrect when using multi-column range partitioning. [#43332](https://github.com/apache/doris/pull/43332)
- Fixed the issue of incorrect calculation results in some limit offset scenarios. [#42576](https://github.com/apache/doris/pull/42576)

### Query Execution

- Fixed the issue that hash join with array types larger than 4G could cause BE Core. [#43861](https://github.com/apache/doris/pull/43861)
- Fixed the issue that is null predicate operations might yield incorrect results in some scenarios. [#43619](https://github.com/apache/doris/pull/43619)
- Fixed the issue that bitmap types might produce incorrect output results in hash join. [#43718](https://github.com/apache/doris/pull/43718)
- Fixed some issues where function results were calculated incorrectly. [#40710](https://github.com/apache/doris/pull/40710) [#39358](https://github.com/apache/doris/pull/39358) [#40929](https://github.com/apache/doris/pull/40929) [#40869](https://github.com/apache/doris/pull/40869) [#40285](https://github.com/apache/doris/pull/40285) [#39891](https://github.com/apache/doris/pull/39891) [#40530](https://github.com/apache/doris/pull/40530) [#41948](https://github.com/apache/doris/pull/41948) [#43588](https://github.com/apache/doris/pull/43588)
- Fixed some issues with JSON type parsing. [#39937](https://github.com/apache/doris/pull/39937)
- Fixed issues with varchar and char types in runtime filter operations. [#43758](https://github.com/apache/doris/pull/43758) [#43919](https://github.com/apache/doris/pull/43919)
- Fixed some issues with the use of decimal256 in scalar and aggregate functions. [#42136](https://github.com/apache/doris/pull/42136) [#42356](https://github.com/apache/doris/pull/42356)
- Fixed the issue that arrow flight reported `Reach limit of connections` errors upon connection. [#39127](https://github.com/apache/doris/pull/39127)
- Fixed the issue of incorrect memory usage statistics for BE in k8s environments. [#41123](https://github.com/apache/doris/pull/41123)

### Semi-structured Data Management

- Adjusted the default values of `segment_cache_fd_percentage` and `inverted_index_fd_number_limit_percent`. [#42224](https://github.com/apache/doris/pull/42224)
- logstash now supports group_commit. [#40450](https://github.com/apache/doris/pull/40450)
- Fixed the issue of coredump when building index. [#43246](https://github.com/apache/doris/pull/43246) [#43298](https://github.com/apache/doris/pull/43298)
- Fixed issues with variant index. [#43375](https://github.com/apache/doris/pull/43375) [#43773](https://github.com/apache/doris/pull/43773)
- Fixed potential fd and memory leaks under abnormal compaction circumstances. [#42374](https://github.com/apache/doris/pull/42374)
- Inverted index match null now correctly returns null instead of false. [#41786](https://github.com/apache/doris/pull/41786)
- Fixed the issue of coredump when ngram bloomfilter index bf_size is set to 65536. [#43645](https://github.com/apache/doris/pull/43645)
- Fixed the issue of potential coredump during complex data type JOINs. [#40398](https://github.com/apache/doris/pull/40398)
- Fixed the issue of coredump with TVF JSON data. [#43187](https://github.com/apache/doris/pull/43187)
- Fixed the precision issue of bloom filter calculations for dates and times. [#43612](https://github.com/apache/doris/pull/43612)
- Fixed the issue of coredump with IPv6 type storage. [#43251](https://github.com/apache/doris/pull/43251)
- Fixed the issue of coredump when using VARIANT type with light_schema_change disabled. [#40908](https://github.com/apache/doris/pull/40908)
- Improved cache performance for high-concurrency point queries. [#44077](https://github.com/apache/doris/pull/44077)
- Fixed the issue that bloom filter indexes were not synchronized when columns were deleted. [#43378](https://github.com/apache/doris/pull/43378)
- Fixed instability issues with es catalog under special circumstances such as mixed array and scalar data. [#40314](https://github.com/apache/doris/pull/40314) [#40385](https://github.com/apache/doris/pull/40385) [#43399](https://github.com/apache/doris/pull/43399) [#40614](https://github.com/apache/doris/pull/40614)
- Fixed coredump issues caused by abnormal regular pattern matching. [#43394](https://github.com/apache/doris/pull/43394)

### Permissions

- Fixed several issues where permissions were not properly restricted after authorization. [#43193](https://github.com/apache/doris/pull/43193) [#41723](https://github.com/apache/doris/pull/41723) [#42107](https://github.com/apache/doris/pull/42107) [#43306](https://github.com/apache/doris/pull/43306)
- Enhanced several permission checks. [#40688](https://github.com/apache/doris/pull/40688) [#40533](https://github.com/apache/doris/pull/40533) [#41791](https://github.com/apache/doris/pull/41791) [#42106](https://github.com/apache/doris/pull/42106)

### Other

- Supplemented missing audit log fields in audit log tables and files. [#43303](https://github.com/apache/doris/pull/43303)
  
  - [View Documentation](https://doris.apache.org/docs/3.0/admin-manual/system-tables/internal_schema/audit_log)