---
{
    "title": "MySQL Compatibility",
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

Doris is highly compatible with MySQL syntax and supports standard SQL. However, there are several differences between Doris and MySQL, as outlined below.

## Data Types

### Numeric Types

| Type         | MySQL                                                        | Doris                                                        |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Boolean      | <p>- Supported</p>  <p>- Range: 0 represents false, 1 represents true</p>  | <p>- Supported</p>  <p>- Keyword: Boolean</p>  <p>- Range: 0 represents false, 1 represents true</p> |
| Bit          | <p>- Supported</p>  <p>- Range: 1 to 64</p>                                | Not supported                                                |
| Tinyint      | <p>- Supported</p> <p>- Supports signed and unsigned</p>  <p>- Range:</p>    <p>- signed: -128 to 127</p>   <p>- unsigned: 0 to 255</p> | <p>- Supported</p>  <p>- Only supports signed</p>  <p>- Range: -128 to 127</p>    |
| Smallint     | <p>- Supported</p> <p>- Supports signed and unsigned</p> <p> - Range:</p>    <p>- signed: -2^15 to 2^15-1</p>   <p>- unsigned: 0 to 2^16-1</p> | <p>- Supported</p>  <p>- Only supports signed</p>  <p>- Range: -32768 to 32767</p> |
| Mediumint    | <p>- Supported</p> <p>- Supports signed and unsigned</p>  <p>- Range:</p>    <p>- signed: -2^23 to 2^23-1</p>  <p>- unsigned: 0 to -2^24-1</p> | - Not supported                                              |
| Int          | <p>- Supported</p> <p>- Supports signed and unsigned</p>  <p>- Range:</p>    <p>- signed: -2^31 to 2^31-1</p>   <p>- unsigned: 0 to -2^32-1</p> | <p>- Supported</p>  <p>- Only supports signed</p>  <p>- Range: -2147483648 to 2147483647</p> |
| Bigint       | <p>- Supported</p> <p>- Supports signed and unsigned</p> <p>- Range:</p>    <p>- signed: -2^63 to 2^63-1</p>  <p>- unsigned: 0 to 2^64-1</p> | <p>- Supported</p>  <p>- Only supports signed</p>  <p>- Range: -2^63 to 2^63-1</p> |
| Largeint     | - Not supported                                              | <p>- Supported</p>  <p>- Only supports signed</p>  <p>- Range: -2^127 to 2^127-1</p> |
| Decimal      | <p>- Supported</p>  <p>- Supports signed and unsigned (deprecated after 8.0.17)</p>  <p>- Default: Decimal(10, 0)</p> | <p>- Supported</p>  <p>- Only supports signed</p>  <p>- Default: Decimal(9, 0)</p> |
| Float/Double | <p>-Supported</p>  <p>- Supports signed and unsigned (deprecated after 8.0.17)</p> | <p>- Supported</p>  <p>- Only supports signed</p>                          |

### Date Types

| Type      | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Date      | <p>- Supported</p> <p>- Range: ['1000-01-01', '9999-12-31']</p>   - Format: YYYY-MM-DD | <p>- Supported</p> <p>- Range: ['0000-01-01', '9999-12-31']</p>   - Format: YYYY-MM-DD |
| DateTime  | <p>- Supported</p> <p>- DATETIME([P]), where P is an optional parameter defined precision</p>  - Range: '1000-01-01 00:00:00.000000' to '9999-12-31 23:59:59.999999'  <p>- Format: YYYY-MM-DD hh:mm:ss[.fraction]</p> | <p>- Supported</p> <p>- DATETIME([P]), where P is an optional parameter defined precision</p>  <p>- Range: ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']</p>   - Format: YYYY-MM-DD hh:mm:ss[.fraction] |
| Timestamp | <p>- Supported</p> <p>- Timestamp[(p)], where P is an optional parameter defined precision</p> <p>- Range: ['1970-01-01 00:00:01.000000' UTC, '2038-01-19 03:14:07.999999' UTC]</p>   <p>- Format: YYYY-MM-DD hh:mm:ss[.fraction]</p> | - Not supported                                              |
| Time      | <p>- Supported</p> <p>- Time[(p)]</p>  <p>- Range: ['-838:59:59.000000' to '838:59:59.000000']</p>   <p>- Format: hh:mm:ss[.fraction]</p> | - Not supported                                              |
| Year      | <p>- Supported</p> <p>- Range: 1901 to 2155, or 0000</p>   - Format: yyyy  | - Not supported                                              |

### String Types

| Type      | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Char      | <p>-Supported - CHAR[(M)], where M is the character length. If omitted, default length is 1</p>  <p>- Fixed-length</p>  - Range: [0, 255] bytes | <p>- Supported</p> <p>- CHAR[(M)], where M is the byte length</p>  <p>- Variable-length</p>  - Range: [1, 255] |
| Varchar   | <p>- Supported</p> <p>- VARCHAR(M), where M is the character length</p> <p>- Range: [0, 65535] bytes</p> | <p>- Supported</p> <p>- VARCHAR(M), where M is the byte length</p>  <p>- Range: [1, 65533]</p> |
| String    | - Not supported                                              | <p>- Supported</p> <p>- 1,048,576 bytes (1MB), can be increased to 2,147,483,643 bytes (2GB)</p> |
| Binary    | <p>- Supported</p> <p>- Similar to Char</p>                                | - Not supported                                              |
| Varbinary | <p>- Supported</p> <p>- Similar to Varchar</p>                             | <p>- Not supported</p>                                              |
| Blob      | <p>- Supported</p> <p>- TinyBlob, Blob, MediumBlob, LongBlob</p>           | - Not supported                                              |
| Text      | <p>- Supported</p> <p>- TinyText, Text, MediumText, LongText</p>           | - Not supported                                              |
| Enum      | <p>- Supported</p> <p>- Supports up to 65,535 elements</p>                 | - Not supported                                              |
| Set       | <p>- Supported</p> <p>- Supports up to 64 elements</p>                     | - Not supported                                              |

### JSON Type

| Type | MySQL       | Doris     |
| ---- | ----------- | --------- |
| JSON | - Supported | Supported |

### Doris unique data type

Doris has several unique data types. Here are the details:

- **HyperLogLog**

  HLL (HyperLogLog) is a data type that cannot be used as a key column. It can be used in aggregate, duplicate, and unique models. In an aggregate model table, the corresponding aggregation type for HLL is HLL_UNION. The length and default value do not need to be specified. The length is controlled internally based on the data aggregation level. HLL columns can only be queried or used with `hll_union_agg`, `hll_raw_agg`, `hll_cardinality`, `hll_hash`, and other related functions. 

  HLL is used for approximate fuzzy deduplication and performs better than count distinct when dealing with large amounts of data. The typical error rate of HLL is around 1%, sometimes reaching up to 2%.

- **Bitmap**

  Bitmap is another data type in Doris. It can be used in aggregate, unique, or duplicate models. In Unique or Duplicate models, it must be used as a non-key column. In aggregate models, it must also be used as a non-key column, and the corresponding aggregation type during table creation is BITMAP_UNION. Similar to HLL, the length and default values do not need to be specified, and the length is controlled internally based on the data aggregation level. Bitmap columns can only be queried or used with functions like `bitmap_union_count`, `bitmap_union`, `bitmap_hash`, `bitmap_hash64`, and others. 

  Using BITMAP in traditional scenarios may impact loading speed, but it generally performs better than Count Distinct when dealing with large amounts of data. Please note that in real-time scenarios, using BITMAP without a global dictionary and with bitmap_hash() function may introduce an error of around 0.1%. If this error is not acceptable, you can use bitmap_hash64 instead.

- **QUANTILE_PERCENT**

  QUANTILE_STATE is another data type in Doris, which cannot be used as a key column. It can be used in aggregate, duplicate, and iuique models. In an aggregate model table, the corresponding aggregation type for QUANTILE_STATE is QUANTILE_UNION. The length and default value do not need to be specified, and the length is controlled internally based on the data aggregation level. QUANTILE_STATE columns can only be queried or used with functions like `QUANTILE_PERCENT`, `QUANTILE_UNION`, `TO_QUANTILE_STATE`, and others. 

  QUANTILE_STATE is used for calculating approximate quantile values. During import, it performs pre-aggregation on the same key with different values. When the number of values does not exceed 2048, it stores all the data in detail. When the number of values exceeds 2048, it uses the TDigest algorithm to aggregate (cluster) the data and save the centroids of the clusters.

- **Array<T\>**

  Array is a data type in Doris that represents an array composed of elements of type T. It cannot be used as a key column. Currently, it supports usage in duplicate models and non-key column usage in unique models. 

  The supported types for T are `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, `DECIMAL`, `DATE`, DATETIME, CHAR, VARCHAR, and STRING.

- **MAP<K, V\>**

  MAP is a data type in Doris that represents a map composed of elements of types K and V. It cannot be used as a key column and can be used in both duplicate and unique models. 

  The supported types for K and V are `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, `DECIMAL`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR`, and `STRING`.

- **STRUCT<field_name:field_type,...>**

  A structure (STRUCT) is composed of multiple fields. It can also be identified as a collection of multiple columns. It cannot be used as a key and is currently only supported in tables of the duplicate model.

  - field_name: The identifier of the field, which must be unique.
  
  - field_type: The type of field.

  The supported types for fields are `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, `DECIMAL`, `DATE`, `DATETIME`, `CHAR`, `VARCHAR`, and `STRING`.

- Agg_State

 AGG_STATE is a data type in Doris that cannot be used as a key column. During table creation, the signature of the aggregation function needs to be declared. 

  The length and default value do not need to be specified, and the actual storage size depends on the implementation of the function.

  AGG_STATE can only be used in combination with [state](../../sql-manual/sql-functions/combinators/state) /[merge](../../sql-manual/sql-functions/combinators/merge)/[union](../../sql-manual/sql-functions/combinators/union) functions from the SQL manual for aggregators.

## Syntax

### DDL

#### 01 Create Table Syntax in Doris

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

#### 02 Differences with MySQL

- column_definition_list:
  
  - Defines the list of columns, and the basic syntax is similar to MySQL. However, there are additional operations for **aggregation types**.
  
  - The **aggregation types** mainly support data models such as Aggregate Key.
  
  - In MySQL, you can define constraints like Primary Key and Unique Key after each column in the column definition list. In Doris, these constraints are defined and calculated through data models.

- index_definition_list:
  
  - Defines the list of indexes, and the basic syntax is similar to MySQL. Doris supports bitmap indexes, inverted indexes, and N-Gram indexes, while Bloom filter indexes are set through properties.
  
  - MySQL supports B+Tree and Hash indexes.

- engine_type:
  
  - Specifies the table engine type, and it is optional.
  
  - Currently, Doris mainly supports native engines like OLAP.
  
  - MySQL supports storage engines like InnoDB and MyISAM.

- keys_type:
  
  - Specifies the data model, and it is optional.
  
  - Supported types are:
  
    - DUBLICATE KEY (default): The specified columns are sorting columns.
  
    - AGGREGATE KEY: The specified columns are dimension columns.
  
    - UNIQUE KEY: The specified columns are primary key columns.
  
  - MySQL does not have the concept of data models.

- table_comment:
  
  - Table comment or description.

- partition_info:
  
  - Specifies the partitioning algorithm, and it is optional.
  
  - Supported partitioning algorithms are:
  
    - LESS THAN: Defines only the upper bound of the partition. The lower bound is determined by the upper bound of the previous partition.
    
    - FIXED RANGE: Defines a closed-open interval for the partition.
    
    - MULTI RANGE: Creates multiple RANGE partitions in batches, defines closed-open intervals, sets time units and steps. Time units supported are year, month, day, week, and hour.
    
    - MULTI RANGE: Creates multiple RANGE partitions for numeric types, defines closed-open intervals, and sets steps.
  
  - MySQL supports algorithms like Hash, Range, and List. It also supports subpartitions, but only with the Hash algorithm.

- distribution_desc:
  
  - Specifies the bucketing algorithm, and it is mandatory.
  
  - Bucketing algorithms:
  
    - Hash bucketing syntax: DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num|auto]. It uses the specified key columns for hash bucketing.
  
    - Random bucketing syntax: DISTRIBUTED BY RANDOM [BUCKETS num|auto]. It uses random numbers for bucketing.
  
  - MySQL does not have bucketing algorithms.

- rollup_list:
 
  - Allows creating multiple materialized views while creating the table, and it is optional.
 
  - Syntax: rollup_name (col1[, col2, ...]) [DUPLICATE KEY(col1[, col2, ...])] [PROPERTIES("key" = "value")]
 
  - MySQL does not support this feature.

- properties:
 
  - Table properties.
 
  - Table properties in Doris are different from MySQL, and the syntax for defining table properties is also different from MySQL.

#### 03 Create-Index

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP];
```

- Doris currently supports Bitmap index, Inverted index, and N-Gram index. BloomFilter index are supported as well, but they have a separate syntax for setting them.

- MySQL supports index algorithms such as B+Tree and Hash.

#### 04 Create-View

```sql
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt

CREATE MATERIALIZED VIEW (IF NOT EXISTS)? mvName=multipartIdentifier
        (LEFT_PAREN cols=simpleColumnDefs RIGHT_PAREN)? buildMode?
        (REFRESH refreshMethod? refreshTrigger?)?
        (KEY keys=identifierList)?
        (COMMENT STRING_LITERAL)?
        (PARTITION BY LEFT_PAREN partitionKey = identifier RIGHT_PAREN)?
        (DISTRIBUTED BY (HASH hashKeys=identifierList | RANDOM) (BUCKETS (INTEGER_VALUE | AUTO))?)?
        propertyClause?
        AS query
```

- The basic syntax is consistent with MySQL.

- Doris supports two types of materialized views: synchronous materialized views and asynchronous materialized views (supported for v2.1). The asynchronous materialized views in Doris are more powerful.

- MySQL only supports asynchronous materialized views.

#### 05 Alter-Table/Alter-Index

The syntax of Doris ALTER is basically the same as that of MySQL.

### Drop-Table/Drop-Index

The syntax of Doris DROP is basically the same as MySQL.

### DML

#### Insert

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

The Doris INSERT syntax is basically the same as MySQL.

#### Update

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

The Doris UPDATE syntax is basically the same as MySQL, but it should be noted that the **`WHERE` condition must be added.**

#### Delete

```sql
DELETE FROM table_name [table_alias] 
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

The syntax can only specify filter predicates

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

This syntax can only be used on the UNIQUE KEY model table.

The DELETE syntax in Doris is basically the same as in MySQL. However, since Doris is an analytical database, deletions cannot be too frequent.

#### Select

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT | DISTINCTROW | ALL EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    select_expr [, select_expr ...]
    [FROM table_references
      [PARTITION partition_list]
      [TABLET tabletid_list]
      [TABLESAMPLE sample_value [ROWS | PERCENT]
        [REPEATABLE pos_seek]]
    [WHERE where_condition]
    [GROUP BY [GROUPING SETS | ROLLUP | CUBE] {col_name | expr | position}]
    [HAVING where_condition]
    [ORDER BY {col_name | expr | position}
      [ASC | DESC], ...]
    [LIMIT {[offset,] row_count | row_count OFFSET offset}]
    [INTO OUTFILE 'file_name']
```

The Doris SELECT syntax is basically the same as MySQL.

## SQL Function

Doris Function covers most MySQL functions.
