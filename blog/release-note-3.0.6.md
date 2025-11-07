---
{
    'title': 'Apache Doris 3.0.6 Released',
    'summary': 'Dear community members, the Apache Doris 3.0.6 version was officially released on Jun 16, 2025, this version introduces continuous upgrades and enhancements in Lakehouse, Query Execution and Compute-Storage Decoupled.',
    'description': 'Dear community members, the Apache Doris 3.0.6 version was officially released on Jun 16, 2025, this version introduces continuous upgrades and enhancements in Lakehouse, Query Execution and Compute-Storage Decoupled.',
    'date': '2025-06-16',
    'author': 'Apache Doris',
    'tags': ['Release Notes'],
    "image": '/images/3.0.6.jpg'
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




Dear community members, the Apache Doris 3.0.6 version was officially released on Jun 16, 2025.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavior Changes

- **Prohibited time-series compaction for Unique tables** [#49905](https://github.com/apache/doris/pull/49905)
- **Adjusted Auto Bucket size to 10GB per bucket in compute-storage separation scenarios** [#50566](https://github.com/apache/doris/pull/50566)

## New Features

### Lakehouse

- **Added support for accessing Iceberg table formats in AWS S3 Table Buckets** 
	- For detailed information, please refer to documentation: [Iceberg on S3 Tables](https://doris.apache.org/docs/dev/lakehouse/catalogs/iceberg-catalog#iceberg-on-s3-tables)

### Storage

- **IAM Role authorization support for object storage access** Applies to import/export, backup/restore, and compute-storage separation scenarios [#50252](https://github.com/apache/doris/pull/50252) [#50682](https://github.com/apache/doris/pull/50682) [#49541](https://github.com/apache/doris/pull/49541) [#49565](https://github.com/apache/doris/pull/49565) [#49422](https://github.com/apache/doris/pull/49422) 
	- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/admin-manual/auth/integrations/aws-authentication-and-authorization)

### New Functions

- `json_extract_no_quotes`
	- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/json-functions/json-extract)
- `unhex_null`
	- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/string-functions/unhex)
- `xpath_string` 
	- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/string-functions/xpath-string)
- `str_to_map`
- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/map-functions/str-to-map)
- `months_between`
	- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/date-time-functions/months-between)
- `next_day`
	- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/date-time-functions/next-day)
- `format_round`: 
	- For detailed information, please refer to [documentation](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/numeric-functions/format-round)

## Improvements

### Storage 

- Streamlined Compaction Profile and logs [#50950](https://github.com/apache/doris/pull/50950)
- Enhanced scheduling strategy to improve Compaction throughput [#49882](https://github.com/apache/doris/pull/49882) [#48759](https://github.com/apache/doris/pull/48759) [#51482](https://github.com/apache/doris/pull/51482) [#50672](https://github.com/apache/doris/pull/50672) [#49953](https://github.com/apache/doris/pull/49953) [#50819](https://github.com/apache/doris/pull/50819)
- **Reduced redundant log output** [#51093](https://github.com/apache/doris/pull/51093)
- **Implemented blacklist mechanism** to prevent Routine Load from distributing metadata to unavailable BEs [#50587](https://github.com/apache/doris/pull/50587)
- **Increased default value** of `load_task_high_priority_threshold_second` [#50478](https://github.com/apache/doris/pull/50478)

### Storage-Compute Decoupled

- **Startup optimization**: Accelerated File Cache initialization [#50726](https://github.com/apache/doris/pull/50726)
- **Query acceleration**: Improved File Cache performance [#50275](https://github.com/apache/doris/pull/50275) [#50387](https://github.com/apache/doris/pull/50387) [#50555](https://github.com/apache/doris/pull/50555)
- **Metadata optimization**: Resolved performance bottlenecks caused by `get_version` [#51111](https://github.com/apache/doris/pull/51111) [#50439](https://github.com/apache/doris/pull/50439)
- **Garbage collection acceleration**: Improved object reclamation efficiency [#50037](https://github.com/apache/doris/pull/50037) [#50766](https://github.com/apache/doris/pull/50766)
- **Stability enhancement**: Optimized object storage retry strategy [#50957](https://github.com/apache/doris/pull/50957)
- **Granular profiling**: Added tablet/segment footer dimension metrics [#49945](https://github.com/apache/doris/pull/49945) [#50564](https://github.com/apache/doris/pull/50564) [#50326](https://github.com/apache/doris/pull/50326)
- **Schema Change resilience**: Enabled New Tablet Compaction by default to prevent -230 errors [#51070](https://github.com/apache/doris/pull/51070)

### Lakehouse

#### Catalog enhancements

- Added partition cache TTL control (`partition.cache.ttl-second`) for Hive Catalog [#50724](https://github.com/apache/doris/pull/50724) 
	- For detailed information, please refer to documentation: [Metadata Cache](https://doris.apache.org/docs/dev/lakehouse/meta-cache)
- Supported `skip.header.line.count` property for Hive tables [#49929](https://github.com/apache/doris/pull/49929)
- Added compatibility for Hive tables using `org.openx.data.jsonserde.JsonSerDe` [#49958](https://github.com/apache/doris/pull/49958) 
	- For detailed information, please refer to documentation: [Text Format](https://doris.apache.org/docs/dev/lakehouse/file-formats/text)
- Upgraded Paimon to v1.0.1
- Upgraded Iceberg to v1.6.1

#### Functional extensions
- Added support for Alibaba Cloud OSS-HDFS Root Policy [#50678](https://github.com/apache/doris/pull/50678)
- Dialect compatibility: Returned query results in Hive format [#49931](https://github.com/apache/doris/pull/49931) 
  - For detailed information, please refer to documentation: [SQL Convertor](https://doris.apache.org/docs/dev/lakehouse/sql-convertor/sql-convertor-overview)

### Asynchronous Materialized Views

- **Memory optimization**: Reduced memory footprint during transparent rewriting [#48887](https://github.com/apache/doris/pull/48887)

### Query Optimizer

- **Improved bucket pruning performance** [#49388](https://github.com/apache/doris/pull/49388)
- **Enhanced lambda expressions**: Supported external slot references [#44365](https://github.com/apache/doris/pull/44365)

### Query Execution

- **TopN query acceleration**: Optimized performance in compute-storage separation scenarios [#50803](https://github.com/apache/doris/pull/50803)
- **Function extension**: Added variable parameter support for `substring_index` [#50149](https://github.com/apache/doris/pull/50149)
- **Geospatial functions**: Added `ST_CONTAINS`, `ST_INTERSECTS`, `ST_TOUCHES`, and `ST_DISJOINT` [#49665](https://github.com/apache/doris/pull/49665)

### Core Components

- **Memory tracker optimization**: ~10% performance gain in high-concurrency scenarios [#50462](https://github.com/apache/doris/pull/50462)
- **Audit log enhancement**: Added `audit_plugin_max_insert_stmt_length` to limit INSERT statement length [#51314](https://github.com/apache/doris/pull/51314) 
	- For detailed information, please refer to documentation: [Audit Plugin](https://doris.apache.org/docs/3.0/admin-manual/audit-plugin)
- **SQL converter control**: Introduced session variables `sql_convertor_config` and `enable_sql_convertor_features` 
	- For detailed information, please refer to documentation: [SQL Dialect](https://doris.apache.org/docs/dev/lakehouse/sql-convertor/sql-convertor-overview)

## Bug Fixes

### Data Ingestion

- Fixed transaction cleanup failures in BE [#50103](https://github.com/apache/doris/pull/50103)
- Improved error reporting accuracy for Routine Load [#51078](https://github.com/apache/doris/pull/51078)
- Prevented metadata task distribution to `disable_load=true` nodes [#50421](https://github.com/apache/doris/pull/50421)
- Fixed consumption progress rollback after FE restart [#50221](https://github.com/apache/doris/pull/50221)
- Resolved Group Commit and Schema Change conflict causing Core Dump [#51144](https://github.com/apache/doris/pull/51144)
- Fixed S3 Load errors when using HTTPS protocol [#51246](https://github.com/apache/doris/pull/51246) [#51529](https://github.com/apache/doris/pull/51529)

### Primary Key Model

- Fixed duplicate key issues caused by race conditions [#50019](https://github.com/apache/doris/pull/50019) [#50051](https://github.com/apache/doris/pull/50051) [#50106](https://github.com/apache/doris/pull/50106) [#50417](https://github.com/apache/doris/pull/50417) [#50847](https://github.com/apache/doris/pull/50847) [#50974](https://github.com/apache/doris/pull/50974)

### Storage

- Fixed CCR and disk balancing race conditions [#50663](https://github.com/apache/doris/pull/50663)
- Corrected missing persistence of default partition keys [#50489](https://github.com/apache/doris/pull/50489)
- Added Rollup table support for CCR [#50337](https://github.com/apache/doris/pull/50337)
- Fixed edge case when `cooldown_ttl=0` [#50830](https://github.com/apache/doris/pull/50830)
- Resolved data loss caused by GC and Publish contention [#50343](https://github.com/apache/doris/pull/50343)
- Fixed partition pruning failure in Delete Job [#50674](https://github.com/apache/doris/pull/50674)

### Storage-Compute Decoupled

- Fixed Schema Change blocking Compaction [#50908](https://github.com/apache/doris/pull/50908)
- Solved object reclamation failure when `storage_vault_prefix` is empty [#50352](https://github.com/apache/doris/pull/50352)
- Resolved query performance issues caused by Tablet Cache [#51193](https://github.com/apache/doris/pull/51193) [#49420](https://github.com/apache/doris/pull/49420)
- Eliminated performance jitter from residual Tablet Cache [#50200](https://github.com/apache/doris/pull/50200)

### Lakehouse

- **Export fixes** 
  - Fixed FE memory leaks [#51171](https://github.com/apache/doris/pull/51171)
  - Prevented FE deadlocks [#50088](https://github.com/apache/doris/pull/50088)
- **Catalog fixes** 
  - Enabled composite predicate pushdown for JDBC Catalog [#50542](https://github.com/apache/doris/pull/50542)
  - Fixed Deletion Vector reading for Alibaba Cloud OSS Paimon tables [#49645](https://github.com/apache/doris/pull/49645)
  - Supported comma-containing Hive partition values [#49382](https://github.com/apache/doris/pull/49382)
  - Corrected MaxCompute Timestamp column parsing [#49600](https://github.com/apache/doris/pull/49600)
  - Enabled `information_schema` system tables for Trino Catalog [#49912](https://github.com/apache/doris/pull/49912)
- **File formats** 
  - Fixed LZO compression reading failures [#49538](https://github.com/apache/doris/pull/49538)
  - Added legacy ORC file compatibility [#50358](https://github.com/apache/doris/pull/50358)
  - Corrected complex type parsing in ORC files [#50136](https://github.com/apache/doris/pull/50136)

### Asynchronous Materialized Views

- Fixed refresh miss when specifying both `start time` and immediate trigger modes [#50624](https://github.com/apache/doris/pull/50624)

### Query Optimizer

- Fixed rewriting errors with lambda expressions [#49166](https://github.com/apache/doris/pull/49166)
- Resolved planning failures with constant group by keys [#49473](https://github.com/apache/doris/pull/49473)
- Corrected constant folding logic [#50142](https://github.com/apache/doris/pull/50142) [#50810](https://github.com/apache/doris/pull/50810)
- Completed system table information retrieval [#50721](https://github.com/apache/doris/pull/50721)
- Fixed column type handling when creating views with NULL Literal [#49881](https://github.com/apache/doris/pull/49881)

### Query Execution

- Fixed BE crashes caused by illegal JSON values during import [#50978](https://github.com/apache/doris/pull/50978)
- Corrected Intersect results with NULL constant inputs [#50951](https://github.com/apache/doris/pull/50951)
- Fixed predicate mis-execution with Variant types [#50934](https://github.com/apache/doris/pull/50934)
- Resolved `get_json_string` errors with illegal JSON Paths [#50859](https://github.com/apache/doris/pull/50859)
- Aligned function behaviors (JSON_REPLACE/INSERT/SET/ARRAY) with MySQL [#50308](https://github.com/apache/doris/pull/50308)
- Fixed `array_map` crashes with empty parameters [#50201](https://github.com/apache/doris/pull/50201)
- Prevented core dumps during abnormal Variant-to-JSONB conversion [#50180](https://github.com/apache/doris/pull/50180)
- Added missing `explode_json_array_json_outer` function [#50164](https://github.com/apache/doris/pull/50164)
- Aligned results between `percentile` and `percentile_array` [#49351](https://github.com/apache/doris/pull/49351)
- Optimized UTF8 handling for functions (url_encode/strright/append_trailing_char_if_absent) [#49127](https://github.com/apache/doris/pull/49127)

### Others

- Fixed audit log loss in high-concurrency scenarios [#50357](https://github.com/apache/doris/pull/50357)
- Prevented metadata replay failures during dynamic partition creation [#49569](https://github.com/apache/doris/pull/49569)
- Solved Global UDF loss after restart [#50279](https://github.com/apache/doris/pull/50279)
- Aligned View metadata return format with MySQL [#51058](https://github.com/apache/doris/pull/51058)