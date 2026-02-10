---
{
    "title": "Release 3.0.5",
    "language": "en",
    "description": "Dear community members, the Apache Doris 3.0.5 version was officially released on Apr 28, 2025."
}
---

Dear community members, the Apache Doris 3.0.5 version was officially released on Apr 28, 2025.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases


## New Features

### Lakehouse

- Added Catalog/Database/Table quantity monitoring metrics to FE Metrics ([#47891](https://github.com/apache/doris/pull/47891))
- MaxCompute Catalog now supports Timestamp type ([#48768](https://github.com/apache/doris/pull/48768))

### Query Execution

- Added URL processing functions: `top_level_domain`, `first_significant_subdomain`, `cut_to_first_significant_subdomain` ([#42488](https://github.com/apache/doris/pull/42488))
- Added `year_of_week` function with Trino-compatible implementation ([#48870](https://github.com/apache/doris/pull/48870))
- `percentile_array` function now supports Float and Double data types ([#48094](https://github.com/apache/doris/pull/48094))

### Storage-Compute Separation

- Added compute group renaming support ([#46221](https://github.com/apache/doris/pull/46221))

## Improvements

### Storage

- Accelerated Compaction task generation to improve performance ([#49547](https://github.com/apache/doris/pull/49547))
- Stream Load now supports compressed JSON file ingestion ([#49044](https://github.com/apache/doris/pull/49044))
- Enhanced error messages for various ingestion scenarios ([#48436](https://github.com/apache/doris/pull/48436) [#47721](https://github.com/apache/doris/pull/47721) [#47804](https://github.com/apache/doris/pull/47804) [#48638](https://github.com/apache/doris/pull/48638) [#48344](https://github.com/apache/doris/pull/48344) [#49287](https://github.com/apache/doris/pull/49287) [#48009](https://github.com/apache/doris/pull/48009))
- Added multiple metrics for Routine Load ([#49045](https://github.com/apache/doris/pull/49045) [#48764](https://github.com/apache/doris/pull/48764))
- Optimized Routine Load scheduling algorithm to prevent single job failure from affecting overall scheduling ([#47847](https://github.com/apache/doris/pull/47847))
- Added Routine Load system table ([#49284](https://github.com/apache/doris/pull/49284))
- Improved query performance for Merge-On-Write (MOW) tables under high-frequency ingestion ([#48968](https://github.com/apache/doris/pull/48968))
- Enhanced Profile information display for Key Range queries ([#48191](https://github.com/apache/doris/pull/48191))

### Compute-Storage Decoupled

- Fixed multiple File Cache stability and performance issues ([#48786](https://github.com/apache/doris/pull/48786) [#48623](https://github.com/apache/doris/pull/48623) [#48687](https://github.com/apache/doris/pull/48687) [#49050](https://github.com/apache/doris/pull/49050) [#48318](https://github.com/apache/doris/pull/48318))
- Improved validation logic for Storage Vault creation ([#48073](https://github.com/apache/doris/pull/48073) [#48369](https://github.com/apache/doris/pull/48369))

### Lakehouse

- Optimized BE Scanner closure logic for Trino Connector Catalog to accelerate memory release ([#47857](https://github.com/apache/doris/pull/47857))
- ClickHouse JDBC Catalog now auto-adapts to different driver versions ([#46026](https://github.com/apache/doris/pull/46026))

### Asynchronous Materialized Views

- Enhanced planning performance for transparent rewrite ([#48782](https://github.com/apache/doris/pull/48782))
- Optimized `tvf mv_infos` performance ([#47415](https://github.com/apache/doris/pull/47415))
- Disabled catalog metadata refresh during external table-based MV construction to reduce memory usage ([#48767](https://github.com/apache/doris/pull/48767))

### Query Optimizer

- Improved statistics collection performance for key columns and partition columns ([#46534](https://github.com/apache/doris/pull/46534))
- Query result aliases now strictly match user input ([#47093](https://github.com/apache/doris/pull/47093))
- Enhanced column pruning after common subexpression extraction in aggregation operators ([#46627](https://github.com/apache/doris/pull/46627))
- Improved error messages for function binding failures and unsupported subqueries ([#47919](https://github.com/apache/doris/pull/47919) [#47985](https://github.com/apache/doris/pull/47985))

### Semi-structured Data Management

- `json_object` function now supports complex type parameters ([#47779](https://github.com/apache/doris/pull/47779))
- Added support for writing UInt128 to IPv6 type ([#48802](https://github.com/apache/doris/pull/48802))
- Enabled inverted index support for ARRAY fields in VARIANT type ([#47688](https://github.com/apache/doris/pull/47688) [#48117](https://github.com/apache/doris/pull/48117))

### Security

- Improved Ranger authorization performance ([#49352](https://github.com/apache/doris/pull/49352))

### Others

- Optimized JVM Metrics interface performance ([#49380](https://github.com/apache/doris/pull/49380))

## Bug Fixes

### Storage

- Fixed data correctness issues in several edge cases ([#48056](https://github.com/apache/doris/pull/48056) [#48399](https://github.com/apache/doris/pull/48399) [#48400](https://github.com/apache/doris/pull/48400) [#48748](https://github.com/apache/doris/pull/48748) [#48775](https://github.com/apache/doris/pull/48775) [#48867](https://github.com/apache/doris/pull/48867) [#49165](https://github.com/apache/doris/pull/49165) [#49193](https://github.com/apache/doris/pull/49193) [#49350](https://github.com/apache/doris/pull/49350) [#49710](https://github.com/apache/doris/pull/49710) [#49825](https://github.com/apache/doris/pull/49825))
- Fixed untimely cleanup of completed transactions ([#49564](https://github.com/apache/doris/pull/49564))
- Changed JSONB default value to `{}` for partial column updates ([#49066](https://github.com/apache/doris/pull/49066))
- Fixed delete bitmap update lock release issue in Storage-Compute Separation model ([#47766](https://github.com/apache/doris/pull/47766))
- Fixed data loss in Stream Load on ARM architecture ([#49666](https://github.com/apache/doris/pull/49666))
- Fixed missing error URL return for data quality issues in Insert Into Select ([#49687](https://github.com/apache/doris/pull/49687))
- Fixed error URL reporting for multi-table Routine Load data quality issues ([#49130](https://github.com/apache/doris/pull/49130))
- Fixed incorrect results when using Insert Into Values during Schema Change ([#49338](https://github.com/apache/doris/pull/49338))
- Fixed core dump caused by tablet commit info reporting ([#48732](https://github.com/apache/doris/pull/48732))
- Added Azure China region support for S3 Load ([#48642](https://github.com/apache/doris/pull/48642))
- Fixed "get image failed" error in K8s environment ([#49072](https://github.com/apache/doris/pull/49072))
- Reduced CPU consumption in dynamic partition scheduling ([#48577](https://github.com/apache/doris/pull/48577))
- Fixed column exception after materialized view renaming ([#48328](https://github.com/apache/doris/pull/48328))
- Fixed memory and file cache leakage after failed Schema Change ([#48426](https://github.com/apache/doris/pull/48426))
- Fixed base compaction failure for tables with empty partitions ([#49062](https://github.com/apache/doris/pull/49062))
- Fixed data correctness issues in complex type modifications ([#49452](https://github.com/apache/doris/pull/49452))
- Fixed core dump in cold compaction ([#48329](https://github.com/apache/doris/pull/48329))
- Fixed cumulative point stagnation with delete operations ([#47282](https://github.com/apache/doris/pull/47282))
- Fixed memory insufficiency in large-scale full compaction ([#48958](https://github.com/apache/doris/pull/48958))

### Compute-Storage Decoupled

- Fixed file cache cleanup failure in K8s environment ([#49199](https://github.com/apache/doris/pull/49199))
- Fixed FE CPU spike caused by read-write locks during high-frequency ingestion ([#48564](https://github.com/apache/doris/pull/48564))

### Lakehouse

**Data Lakes**

- Fixed BE core dump during concurrent writes to Hive/Iceberg tables ([#49842](https://github.com/apache/doris/pull/49842))
- Fixed write failures to Hive/Iceberg tables on AWS S3 ([#47162](https://github.com/apache/doris/pull/47162))
- Fixed incorrect Iceberg Position Deletion reads ([#47977](https://github.com/apache/doris/pull/47977))
- Added Tencent Cloud COS support for Iceberg table creation ([#49885](https://github.com/apache/doris/pull/49885))
- Fixed Kerberos authentication for Paimon data on HDFS ([#47192](https://github.com/apache/doris/pull/47192))
- Fixed memory leak in Hudi Jni Scanner ([#48955](https://github.com/apache/doris/pull/48955))
- Fixed multi-partition list reading in MaxCompute Catalog ([#48325](https://github.com/apache/doris/pull/48325))

**JDBC**

- Fixed NPE when fetching row count from JDBC Catalog ([#49442](https://github.com/apache/doris/pull/49442))
- Fixed OceanBase Oracle mode connection test ([#49442](https://github.com/apache/doris/pull/49442))
- Fixed column type length inconsistency in concurrent JDBC Catalog access ([#48541](https://github.com/apache/doris/pull/48541))
- Fixed Classloader leak in JDBC Catalog BE ([#46912](https://github.com/apache/doris/pull/46912))
- Fixed connection thread leak in PostgreSQL JDBC Catalog ([#49568](https://github.com/apache/doris/pull/49568))

**Export**

- Fixed EXPORT job stuck in EXPORTING state ([#47974](https://github.com/apache/doris/pull/47974))
- Disabled OUTFILE auto-retry to prevent duplicate files ([#48095](https://github.com/apache/doris/pull/48095))

**Others**

- Fixed NPE when executing TVF queries via FE WebUI ([#49213](https://github.com/apache/doris/pull/49213))
- Fixed Hadoop Libhdfs thread local null pointer exception ([#48280](https://github.com/apache/doris/pull/48280))
- Fixed "Filesystem already closed" error in FE Hadoop access ([#48351](https://github.com/apache/doris/pull/48351))
- Fixed Catalog comment persistence issue ([#46946](https://github.com/apache/doris/pull/46946))
- Fixed Parquet complex type reading errors ([#47734](https://github.com/apache/doris/pull/47734))

### Asynchronous Materialized Views

- Fixed slow MV construction in extreme scenarios ([#48074](https://github.com/apache/doris/pull/48074))
- Fixed nested MV transparent rewrite failure ([#48222](https://github.com/apache/doris/pull/48222))

### Query Optimizer

- Fixed constant folding calculation errors ([#49225](https://github.com/apache/doris/pull/49225) [#47966](https://github.com/apache/doris/pull/47966) [#49416](https://github.com/apache/doris/pull/49416) [#49087](https://github.com/apache/doris/pull/49087) [#49033](https://github.com/apache/doris/pull/49033) [#49061](https://github.com/apache/doris/pull/49061) [#48895](https://github.com/apache/doris/pull/48895) [#48957](https://github.com/apache/doris/pull/48957) [#47288](https://github.com/apache/doris/pull/47288) [#48641](https://github.com/apache/doris/pull/48641) [#49413](https://github.com/apache/doris/pull/49413) [#48783](https://github.com/apache/doris/pull/48783))
- Fixed unexpected errors with ORDER BY in nested window functions ([#48492](https://github.com/apache/doris/pull/48492))

### Query Execution

- Fixed pipeline task scheduling deadlocks/performance issues ([#49976](https://github.com/apache/doris/pull/49976) [#49007](https://github.com/apache/doris/pull/49007))
- Fixed memory corruption on FE connection failure ([#48370](https://github.com/apache/doris/pull/48370) [#48313](https://github.com/apache/doris/pull/48313))
- Fixed memory corruption with lambda and array functions ([#49140](https://github.com/apache/doris/pull/49140))
- Fixed BE core caused by null string-to-JSONB conversion ([#49810](https://github.com/apache/doris/pull/49810))
- Standardized undefined behaviors in `parse_url` ([#49149](https://github.com/apache/doris/pull/49149))
- Fixed `array_overlap` null handling ([#49403](https://github.com/apache/doris/pull/49403))
- Fixed case conversion errors for non-ASCII characters ([#49763](https://github.com/apache/doris/pull/49763))
- Fixed BE core in `percentile` function ([#48563](https://github.com/apache/doris/pull/48563))
- Fixed multiple memory corruption issues ([#48288](https://github.com/apache/doris/pull/48288) [#49737](https://github.com/apache/doris/pull/49737) [#48018](https://github.com/apache/doris/pull/48018) [#47964](https://github.com/apache/doris/pull/47964))
- Fixed incorrect SET operator results ([#48001](https://github.com/apache/doris/pull/48001))
- Reduced default Arrow Flight thread pool size to prevent FD exhaustion ([#48530](https://github.com/apache/doris/pull/48530))
- Fixed window function memory corruption ([#48458](https://github.com/apache/doris/pull/48458))

### Semi-structured Data Management

- Fixed chunked Stream Load JSON import ([#48474](https://github.com/apache/doris/pull/48474))
- Enhanced JSONB format validation ([#48731](https://github.com/apache/doris/pull/48731))
- Fixed crash with large STRUCT fields ([#49552](https://github.com/apache/doris/pull/49552))
- Extended VARCHAR length support in complex types ([#48025](https://github.com/apache/doris/pull/48025))
- Fixed `array_avg` crash with specific parameters ([#48691](https://github.com/apache/doris/pull/48691))
- Fixed `ColumnObject::pop_back` crash in VARIANT type ([#48935](https://github.com/apache/doris/pull/48935) [#48978](https://github.com/apache/doris/pull/48978))
- Disabled index building on VARIANT type ([#49844](https://github.com/apache/doris/pull/49844))
- Disabled inverted index v1 format for VARIANT type ([#49890](https://github.com/apache/doris/pull/49890))
- Fixed multi-layer CAST errors in VARIANT type ([#47954](https://github.com/apache/doris/pull/47954))
- Optimized inverted index metadata lookup for VARIANT with many subcolumns ([#48153](https://github.com/apache/doris/pull/48153))
- Reduced VARIANT schema memory consumption in Storage-Compute Separation mode ([#47629](https://github.com/apache/doris/pull/47629) [#48463](https://github.com/apache/doris/pull/48463))
- Fixed PreparedStatement ID overflow ([#48116](https://github.com/apache/doris/pull/48116))
- Fixed row storage with DELETE operations ([#49609](https://github.com/apache/doris/pull/49609))

### Inverted Index

- Fixed ARRAY type null bitmap handling ([#48052](https://github.com/apache/doris/pull/48052))
- Fixed Date/Datetimev1 Bloomfilter comparison ([#47005](https://github.com/apache/doris/pull/47005))
- Fixed UTF-8 4-byte character truncation ([#48792](https://github.com/apache/doris/pull/48792))
- Fixed index loss after immediate column addition ([#48547](https://github.com/apache/doris/pull/48547))
- Fixed empty data handling in ARRAY inverted index ([#48264](https://github.com/apache/doris/pull/48264))
- Improved FE metadata upgrade compatibility ([#49283](https://github.com/apache/doris/pull/49283))
- Fixed `match_phrase_prefix` cache error ([#46517](https://github.com/apache/doris/pull/46517))
- Fixed file cache cleanup after compaction ([#49738](https://github.com/apache/doris/pull/49738))

### Security

- Removed Select_Priv check for DELETE operations ([#49239](https://github.com/apache/doris/pull/49239))
- Prevented non-root users from modifying root privileges ([#48752](https://github.com/apache/doris/pull/48752))
- Fixed intermittent LDAP PartialResultException ([#47858](https://github.com/apache/doris/pull/47858))

### Others

- Fixed JAVA_OPTS_FOR_JDK_17 recognition ([#48170](https://github.com/apache/doris/pull/48170))
- Fixed BDB metadata write failure caused by InterruptException ([#47874](https://github.com/apache/doris/pull/47874))
- Improved SQL hash generation for multi-statement requests ([#48242](https://github.com/apache/doris/pull/48242))
- User attribute variables now override session variables ([#48548](https://github.com/apache/doris/pull/48548))