---
{
    "title": "MySQL Compatibility Notes",
    "language": "en",
    "description": "Quick reference for compatibility differences between Doris and MySQL: covers data types, DDL/DML syntax, SQL functions, and SQL Mode.",
    "keywords": [
        "Doris MySQL compatibility",
        "Doris vs MySQL",
        "Doris data types",
        "Doris DDL syntax",
        "Doris DML syntax",
        "Doris SQL Mode",
        "MySQL protocol",
        "standard SQL"
    ]
}
---

<!-- Knowledge type: Compatibility comparison / Syntax reference -->
<!-- Applicable scenario: Migrating from MySQL to Doris / SQL syntax selection and troubleshooting -->

Doris is highly compatible with the MySQL protocol and standard SQL syntax. Business systems, BI tools, and operations scripts can usually connect without major changes. However, as an analytics-oriented MPP database, Doris still differs from MySQL in areas such as data types, table creation syntax, data models, and DML behavior.

This document organizes the main differences between Doris and MySQL from two perspectives, migration and daily use, to help you quickly locate syntax or behavior incompatibilities.

## Intended Readers and Scenarios

- You plan to migrate a MySQL application or data warehouse to Doris and need to quickly assess SQL compatibility.
- You run into syntax or behavior differences when writing SQL on Doris with MySQL habits.
- You need to check whether a specific data type or DDL/DML statement is supported in Doris.

## Data Type Differences

The differences from MySQL are listed below, grouped by numeric, date, string, JSON, and Doris-specific types.

### Numeric Types

| Type | MySQL | Doris |
| --- | --- | --- |
| Boolean | - Supported<br />- Range: 0 stands for false, 1 stands for true | - Supported<br />- Keyword: Boolean<br />- Range: 0 stands for false, 1 stands for true |
| Bit | - Supported<br />- Range: 1 to 64 | Not supported |
| Tinyint | - Supported<br />- Supports signed and unsigned<br />- Range: signed is -128 to 127, unsigned is 0 to 255 | - Supported<br />- Only signed is supported<br />- Range: -128 to 127 |
| Smallint | - Supported<br />- Supports signed and unsigned<br />- Range: signed is -2^15 to 2^15-1, unsigned is 0 to 2^16-1 | - Supported<br />- Only signed is supported<br />- Range: -32768 to 32767 |
| Mediumint | - Supported<br />- Supports signed and unsigned<br />- Range: signed is -2^23 to 2^23-1, unsigned is 0 to 2^24-1 | Not supported |
| Int | - Supported<br />- Supports signed and unsigned<br />- Range: signed is -2^31 to 2^31-1, unsigned is 0 to 2^32-1 | - Supported<br />- Only signed is supported<br />- Range: -2147483648 to 2147483647 |
| Bigint | - Supported<br />- Supports signed and unsigned<br />- Range: signed is -2^63 to 2^63-1, unsigned is 0 to 2^64-1 | - Supported<br />- Only signed is supported<br />- Range: -2^63 to 2^63-1 |
| Largeint | Not supported | - Supported<br />- Only signed is supported<br />- Range: -2^127 to 2^127-1 |
| Decimal | - Supported<br />- Supports signed and unsigned (supported before 8.0.17, marked as deprecated in later versions)<br />- Default: Decimal(10, 0) | - Supported<br />- Only signed is supported<br />- Default: Decimal(9, 0) |
| Float/Double | - Supported<br />- Supports signed and unsigned (supported before 8.0.17, marked as deprecated in later versions) | - Supported<br />- Only signed is supported |

### Date Types

| Type | MySQL | Doris |
| --- | --- | --- |
| Date | - Supported<br />- Range: ['1000-01-01', '9999-12-31']<br />- Format: YYYY-MM-DD | - Supported<br />- Range: ['0000-01-01', '9999-12-31']<br />- Format: YYYY-MM-DD |
| DateTime | - Supported<br />- DATETIME([P]), where the optional parameter P is the precision<br />- Range: '1000-01-01 00:00:00.000000' to '9999-12-31 23:59:59.999999'<br />- Format: YYYY-MM-DD hh:mm:ss[.fraction] | - Supported<br />- DATETIME([P]), where the optional parameter P is the precision<br />- Range: ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']<br />- Format: YYYY-MM-DD hh:mm:ss[.fraction] |
| Timestamp | - Supported<br />- Timestamp[(p)], where the optional parameter P is the precision<br />- Range: ['1970-01-01 00:00:01.000000' UTC, '2038-01-19 03:14:07.999999' UTC]<br />- Format: YYYY-MM-DD hh:mm:ss[.fraction] | - Supported<br />- TIMESTAMPTZ([P]), where the optional parameter P is the precision<br />- Range: ['0000-01-01 00:00:00[.000000]' UTC, '9999-12-31 23:59:59[.999999]' UTC]<br />- Format: YYYY-MM-DD hh:mm:ss[.fraction]+XX.XX |
| Time | - Supported<br />- Time[(p)]<br />- Range: ['-838:59:59.000000', '838:59:59.000000']<br />- Format: hh:mm:ss[.fraction] | - Supported for computation, cannot be stored as a column in OLAP tables<br />- Time[(p)]<br />- Range: ['-838:59:59.999999', '838:59:59.999999']<br />- Format: hh:mm:ss[.fraction] |
| Year | - Supported<br />- Range: 1901 to 2155, or 0000<br />- Format: yyyy | Not supported |

### String Types

| Type | MySQL | Doris |
| --- | --- | --- |
| Char | - Supported<br />- CHAR(M), where M is the character length, defaults to 1<br />- Fixed length<br />- Range: [0, 255], in bytes | - Supported<br />- CHAR(M), where M is the byte length<br />- Variable<br />- Range: [1, 255] |
| Varchar | - Supported<br />- VARCHAR(M), where M is the character length<br />- Range: [0, 65535], in bytes | - Supported<br />- VARCHAR(M), where M is the byte length<br />- Range: [1, 65533] |
| String | Not supported | - Supported<br />- 1048576 bytes (1 MB), can be increased up to 2147483643 bytes (2 GB) |
| Binary | - Supported<br />- Similar to Char | Not supported |
| Varbinary | - Supported<br />- Similar to Varchar | Not supported |
| Blob | - Supported<br />- TinyBlob, Blob, MediumBlob, LongBlob | Not supported |
| Text | - Supported<br />- TinyText, Text, MediumText, LongText | Not supported |
| Enum | - Supported<br />- Up to 65535 elements | Not supported |
| Set | - Supported<br />- Up to 64 elements | Not supported |

### JSON Data Type

| Type | MySQL | Doris |
| --- | --- | --- |
| JSON | Supported | Supported |

### Doris-Specific Data Types

The following types are analytics-oriented data types that Doris extends beyond MySQL. They are commonly used for distinct counting, quantile computation, and semi-structured scenarios.

- **HyperLogLog**

    The HLL type cannot be used as a Key column. When used in an Aggregate model table, the matching aggregation type at table creation is HLL_UNION. You do not need to specify length or default value; the length is controlled internally by the system based on the aggregation level of the data. HLL columns can only be queried or used through the matching HLL_UNION_AGG, HLL_RAW_AGG, HLL_CARDINALITY, and HLL_HASH functions.

    HLL is approximate distinct counting and outperforms Count Distinct on large data volumes. The error rate of HLL is typically around 1%, and may sometimes reach 2%.

- **BITMAP**

    The BITMAP type cannot be used as a Key column. When used in an Aggregate table, it must be paired with the BITMAP_UNION aggregation definition. You do not need to specify length or default value; the length is controlled internally by the system based on the aggregation level of the data. BITMAP columns can only be queried or used through the matching BITMAP_UNION_COUNT, BITMAP_UNION, BITMAP_HASH, BITMAP_HASH64, and other functions.

    Using BITMAP in offline scenarios may affect import speed. With large data volumes, its query speed is slower than HLL but faster than Count Distinct. Note: in real-time scenarios, if BITMAP is used without a global dictionary and BITMAP_HASH() is used instead, an error of about one in a thousand may occur. If this error is unacceptable, you can use BITMAP_HASH64.

- **QUANTILE_PERCENT (QUANTILE_STATE)**

    The QUANTILE_STATE type cannot be used as a Key column. When used in an Aggregate model table, the matching aggregation type at table creation is QUANTILE_UNION. You do not need to specify length or default value; the length is controlled internally by the system based on the aggregation level of the data. QUANTILE_STATE columns can only be queried or used through the matching QUANTILE_PERCENT, QUANTILE_UNION, TO_QUANTILE_STATE, and other functions.

    QUANTILE_STATE is a type for computing approximate quantiles. During import, it pre-aggregates different Values for the same Key: when the number of Values does not exceed 2048, all data is recorded in detail; when the number of Values exceeds 2048, the [TDigest](https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) algorithm is used to aggregate (cluster) the data and store the centroids of the clusters.

- **Array\<T\>**

    Array\<T\> is an array of elements of type T and cannot be used as a Key column.

- **MAP\<K, V\>**

    Map is a mapping table of elements of type K and V and cannot be used as a Key column.

- **STRUCT\<field_name:field_type, ...\>**

    Struct is a structure composed of multiple Fields, which can also be understood as a collection of multiple columns. It cannot be used as a Key.

    The Field names and number in a Struct are fixed and always Nullable. A Field typically consists of:

    - field_name: the identifier of the Field, which must be unique
    - field_type: the type of the Field

- **Agg_State**

    AGG_STATE cannot be used as a Key column. When creating a table, you must also declare the signature of the aggregate function.

    You do not need to specify length or default value; the actual storage size depends on the function implementation.

    AGG_STATE can only be used together with the [STATE](../sql-manual/sql-functions/combinators/state) / [MERGE](../sql-manual/sql-functions/combinators/merge) / [UNION](../sql-manual/sql-functions/combinators/union) function combinators.

## Syntax Differences

Doris SQL syntax is overall close to MySQL, but it has some unique extensions or restrictions in scenarios such as table creation, indexes, and views. Pay particular attention to these during migration.

### DDL Differences

#### CREATE TABLE

The Doris table creation syntax is as follows:

```sql
CREATE TABLE [IF NOT EXISTS] [database.]table
(
    column_definition_list
    [, index_definition_list]
)
[engine_type]
[keys_type]
[table_comment]
[partition_info]
distribution_desc
[rollup_list]
[properties]
[extra_properties]
```

The differences between each clause and MySQL are as follows:

| Parameter | Differences from MySQL |
| --- | --- |
| column_definition_list | - Defines the column list. The basic syntax is similar to MySQL.<br />- Doris additionally supports an aggregation type operation, primarily for the Aggregate Key data model.<br />- MySQL allows constraints such as Index, Primary Key, and Unique Key to be added after the column list definition; Doris implements support for these constraints and computations through data models. |
| index_definition_list | - Defines the index list. The basic syntax is similar to MySQL.<br />- Doris supports bitmap indexes, inverted indexes, and N-Gram indexes, and can also enable Bloom filter indexes through properties.<br />- MySQL supports B+Tree indexes and Hash indexes. |
| engine_type | - Specifies the table engine type. Optional.<br />- The currently supported table engine is mainly the OLAP native engine.<br />- MySQL supports storage engines such as InnoDB and MyISAM. |
| keys_type | - Specifies the data model. Optional.<br />- Supported types include:<br />&nbsp;&nbsp;1) DUPLICATE KEY (default): the columns specified after it are sort columns;<br />&nbsp;&nbsp;2) AGGREGATE KEY: the columns specified after it are dimension columns;<br />&nbsp;&nbsp;3) UNIQUE KEY: the columns specified after it are primary key columns.<br />- MySQL has no concept of a data model. |
| table_comment | Table comment. |
| partition_info | Partitioning algorithm. Optional.<br />Doris supports the following partitioning algorithms:<br />- LESS THAN: defines only the upper bound of the partition; the lower bound is determined by the upper bound of the previous partition.<br />- FIXED RANGE: defines a left-closed, right-open interval for the partition.<br />- MULTI RANGE: creates RANGE partitions in batch, defining left-closed, right-open intervals with a time unit and step size. Supported time units are year, month, day, week, and hour.<br /><br />MySQL supported algorithms: Hash, Range, and List Key, with subpartitions supported. Subpartitions support Hash and Key. |
| distribution_desc | - Bucketing algorithm. Required. Includes:<br />&nbsp;&nbsp;1) Hash bucketing: `DISTRIBUTED BY HASH (k1[, k2 ...]) [BUCKETS num\|auto]`, uses the specified key columns for hash bucketing;<br />&nbsp;&nbsp;2) Random bucketing: `DISTRIBUTED BY RANDOM [BUCKETS num\|auto]`, uses random numbers for bucketing.<br />- MySQL has no bucketing algorithm. |
| rollup_list | - Multiple synchronous materialized views can be created at the same time as table creation.<br />- Syntax: `rollup_name (col1[, col2, ...]) [DUPLICATE KEY(col1[, col2, ...])][PROPERTIES("key" = "value")]`.<br />- Not supported by MySQL. |
| properties | Table properties. The properties differ from those of MySQL, and the syntax for defining them also differs from MySQL. |

#### CREATE INDEX

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP];
```

- Doris currently supports bitmap indexes, inverted indexes, N-Gram indexes, and Bloom filter indexes (configured through separate syntax).
- MySQL supports B+Tree and Hash index algorithms.

#### CREATE VIEW

```sql
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt

CREATE MATERIALIZED VIEW [IF NOT EXISTS] mvName=multipartIdentifier
        (LEFT_PAREN cols=simpleColumnDefs RIGHT_PAREN)? buildMode?
        (REFRESH refreshMethod? refreshTrigger?)?
        (KEY keys=identifierList)?
        (COMMENT STRING_LITERAL)?
        (PARTITION BY LEFT_PAREN partitionKey = identifier RIGHT_PAREN)?
        (DISTRIBUTED BY (HASH hashKeys=identifierList | RANDOM) (BUCKETS (INTEGER_VALUE | AUTO))?)?
        propertyClause?
        AS query
```

- The basic syntax is the same as MySQL.
- In addition to logical views, Doris also supports two types of materialized views: synchronous materialized views and asynchronous materialized views.
- MySQL does not support materialized views.

#### ALTER TABLE / ALTER INDEX

The Doris ALTER syntax is essentially the same as MySQL.

#### DROP TABLE / DROP INDEX

The Doris DROP syntax is essentially the same as MySQL.

### DML Differences

#### INSERT

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

The Doris INSERT syntax is essentially the same as MySQL.

#### UPDATE

```sql
UPDATE target_table [table_alias]
    SET assignment_list
    WHERE condition

assignment_list:
    assignment [, assignment] ...

assignment:
    col_name = value

value:
    {expr | DEFAULT}
```

The Doris UPDATE syntax is essentially the same as MySQL, but note that **a WHERE condition is required**.

#### DELETE

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

In Doris, the syntax above only allows specifying filter predicates.

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

In Doris, the syntax above can only be used on Unique Key model tables.

The Doris DELETE syntax is essentially the same as MySQL. However, since Doris is an analytics-oriented database, delete operations should not be performed too frequently.

#### SELECT

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT]
    select_expr [, select_expr ...]
    [EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    [FROM table_references
      [PARTITION partition_list]
      [TABLET tabletid_list]
      [TABLESAMPLE sample_value [ROWS | PERCENT]
        [REPEATABLE pos_seek]]
    [WHERE where_condition]
    [GROUP BY [GROUPING SETS | ROLLUP | CUBE] {col_name | expr | position}]
    [HAVING where_condition]
    [ORDER BY {col_name | expr | position} [ASC | DESC], ...]
    [LIMIT {[offset_count,] row_count | row_count OFFSET offset_count}]
    [INTO OUTFILE 'file_name']
```

The Doris SELECT syntax is essentially the same as MySQL.

## SQL Functions

Doris functions cover the vast majority of MySQL functions. Common string, date, aggregate, and window functions can be used directly.

## SQL Mode

Doris supports setting some SQL Modes to control SQL parsing and execution behavior, making it easier to stay aligned with MySQL conventions.

| Name | Behavior when set | Behavior when not set | Notes |
| :-- | :-- | :-- | :-- |
| PIPES_AS_CONCAT | Parses the `\|\|` symbol as the concat function | Parses the `\|\|` symbol as the logical OR operator | - |
| NO_BACKSLASH_ESCAPES | Treats backslashes in strings as normal characters | Treats backslashes in strings as the start of an escape sequence | - |
| ONLY_FULL_GROUP_BY | Allows only standard aggregation | Allows aggregation result output to include scalar values that are not in the aggregation KEY | Supported since version 3.1.0 |
