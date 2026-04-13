---
{
    "title": "Release 2.1.9",
    "language": "en",
    "description": "Dear Community, Apache Doris version 2.1.9 is now available, featuring improved SQLHash calculation, enhanced query results accuracy,"
}
---

Dear Community, **Apache Doris version 2.1.9 is now available**, featuring improved SQLHash calculation, enhanced query results accuracy, and new metrics for better storage management. This update also resolves critical bugs across multiple areas for a more robust data management experience.


- [Quick Download](https://doris.apache.org/download)

- [GitHub Release](https://github.com/apache/doris/releases/tag/2.1.9-rc02)


## Behavior Changes

- The SQLHash in Audit Log is now accurately calculated per SQL query, resolving the issue of identical hashes in a single request. [#48242](https://github.com/apache/doris/pull/48242)
- Query results match ColumnLabelName exactly. [#47093](https://github.com/apache/doris/pull/47093)
- User property variables now take precedence over session variables. [#47185](https://github.com/apache/doris/pull/47185)

## New Features

### Storage Management

- Disallow renaming partition columns. [#47596](https://github.com/apache/doris/pull/47596)

### Others

- Added FE monitoring metrics for Catalogs, Databases, and Tables counts. [#47891](https://github.com/apache/doris/pull/47891)

## Improvements

### Inverted Index

- Support for ARRAY type in VARIANT inverted indexes. [#47688](https://github.com/apache/doris/pull/47688)
- Profile now shows performance metrics for each filter condition. [#47504](https://github.com/apache/doris/pull/47504)

### Query Optimizer

- Support for using `SELECT *` in aggregate queries with only aggregation key columns. [#48006](https://github.com/apache/doris/pull/48006)

### Storage Management

- Enhanced CCR for binlog recycling and small file transfer efficiency, and robustness in chaotic environments. [#47547](https://github.com/apache/doris/pull/47547) [#47313](https://github.com/apache/doris/pull/47313) [#45061](https://github.com/apache/doris/pull/45061)
- Enhanced import error messages to be more specific. [#47918](https://github.com/apache/doris/pull/47918) [#47470](https://github.com/apache/doris/pull/47470)

## Bug Fixes

### Lakehouse

- Fixed BE krb5.conf path configuration issue. [#47679](https://github.com/apache/doris/pull/47679)
- Prevented `SELECT OUTFILE` statement retries to avoid duplicate data export. [#48095](https://github.com/apache/doris/pull/48095)
- Fixed JAVA API access to Paimon tables. [#47192](https://github.com/apache/doris/pull/47192)
- Resolved writing to Hive tables with `s3a://` storage location. [#47162](https://github.com/apache/doris/pull/47162)
- Fixed the issue of Catalog's Comment field not being persisted. [#46946](https://github.com/apache/doris/pull/46946)
- Addressed JDBC BE class loading leaks under certain conditions. [#46912](https://github.com/apache/doris/pull/46912)
- Resolved high version ClickHouse JDBC Driver compatibility with JDBC Catalog. [#46026](https://github.com/apache/doris/pull/46026)
- Fixed BE crash when reading Iceberg Position Delete. [#47977](https://github.com/apache/doris/pull/47977)
- Corrected reading MaxCompute table data under multi-partition columns. [#48325](https://github.com/apache/doris/pull/48325)
- Fixed reading Parquet complex column types errors. [#47734](https://github.com/apache/doris/pull/47734)

### Inverted Index

- Fixed ARRAY type inverted index null value handling. [#48231](https://github.com/apache/doris/pull/48231)
- Resolved `BUILD INDEX` exception for newly added columns. [#48389](https://github.com/apache/doris/pull/48389)
- Corrected UTF8 encoding index truncation issues leading to errors. [#48657](https://github.com/apache/doris/pull/48657)

### Semi-structured Data Types

- Fixed `array_agg` function crashes under special conditions. [#46927](https://github.com/apache/doris/pull/46927)
- Resolved JSON import crashes due to incorrect chunk parameters. [#48196](https://github.com/apache/doris/pull/48196)

### Query Optimizer

- Fixed constant folding issues with nested time functions like `current_date`. [#47288](https://github.com/apache/doris/pull/47288)
- Addressed non-deterministic function result errors. [#48321](https://github.com/apache/doris/pull/48321)
- Resolved `CREATE TABLE LIKE` execution issues with on update column properties. [#48007](https://github.com/apache/doris/pull/48007)
- Fixed unexpected planning errors for materialized views of aggregate model tables. [#47658](https://github.com/apache/doris/pull/47658)
- Resolved `PreparedStatement` exceptions due to internal ID overflow. [#47950](https://github.com/apache/doris/pull/47950)

### Query Execution Engine

- Resolved query hang or null pointer issues when querying system tables. [#48370](https://github.com/apache/doris/pull/48370)
- Added DOUBLE type support for LEAD/LAG functions. [#47940](https://github.com/apache/doris/pull/47940)
- Fixed query errors when `case when` conditions exceed 256. [#47179](https://github.com/apache/doris/pull/47179)
- Corrected `str_to_date` function errors with spaces. [#48920](https://github.com/apache/doris/pull/48920)
- Fixed `split_part` function errors during constant folding with `||`. [#48910](https://github.com/apache/doris/pull/48910)
- Corrected `log` function result errors. [#47228](https://github.com/apache/doris/pull/47228)
- Resolved core dump issues with `array` / `map` functions in lambda expressions. [#49140](https://github.com/apache/doris/pull/49140)

### Storage Management

- Fixed memory corruption issues during import of aggregate tables. [#47523](https://github.com/apache/doris/pull/47523)
- Resolved occasional core dump during MoW import under memory pressure. [#47715](https://github.com/apache/doris/pull/47715)
- Fixed potential duplicate key issues with MoW during BE restart and schema change. [#48056](https://github.com/apache/doris/pull/48056) [#48775](https://github.com/apache/doris/pull/48775)
- Corrected group commit and global column update issues with memtable promotion. [#48120](https://github.com/apache/doris/pull/48120) [#47968](https://github.com/apache/doris/pull/47968)

### Permission Management

- No longer throws PartialResultException when using LDAP. [#47858](https://github.com/apache/doris/pull/47858)