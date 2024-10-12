---
{
    "title": "MySQL 兼容性",
    "language": "zh-CN"
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


Doris 是高度兼容 MySQL 语法，支持标准 SQL。但是 Doris 与 MySQL 还是有很多不同的地方，下面给出了他们的差异点介绍。

## 数据类型

### 数字类型

| 类型         | MySQL                                                        | Doris                                                  |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------ |
| Boolean      | - 支持<br />- 范围：0 代表 false，1 代表 true                    | - 支持<br />- 关键字：Boolean <br />- 范围：0 代表 false，1 代表 true |
| Bit          | - 支持 <br />- 范围：1 ~ 64                                     | 不支持                                                 |
| Tinyint      | - 支持 <br />- 支持 signed,unsigned <br />- 范围：signed 的范围是 -128 ~ 127，unsigned 的范围是 0 ~ 255 | - 支持 <br />- 只支持 signed <br />- 范围：-128 ~ 127 |
| Smallint     | - 支持 <br />- 支持 signed,unsigned <br />- 范围：signed 的范围是 -2^15 ~ 2^15-1，unsigned 的范围是 0 ~ 2^16-1 | - 支持 <br />- 只支持 signed <br />- 范围：-32768 ~ 32767           |
| Mediumint    | - 支持 <br />- 支持 signed,unsigned <br />- 范围：signed 的范围是 -2^23 ~ 2^23-1，unsigned 的范围是 0 ~ -2^24-1 | - 不支持                  |
| int          | - 支持 <br />- 支持 signed,unsigned <br />- 范围：signed 的范围是 -2^31 ~ 2^31-1，unsigned 的范围是 0 ~ -2^32-1 | - 支持 <br />- 只支持 signed <br />- 范围： -2147483648~ 2147483647 |
| Bigint       | - 支持 <br />- 支持 signed,unsigned <br />- 范围：signed 的范围是 -2^63 ~ 2^63-1，unsigned 的范围是 0 ~ 2^64-1 | - 支持 <br />- 只支持 signed <br />- 范围： -2^63 ~ 2^63-1      |
| Largeint     | - 不支持                                                     | - 支持 <br />- 只支持 signed <br />- 范围：-2^127 ~ 2^127-1       |
| Decimal      | - 支持 <br />- 支持 signed,unsigned（8.0.17 以前支持，该版本以上标记为 deprecated）<br />- 默认值：Decimal(10, 0)| - 支持 <br />- 只支持 signed <br />- 默认值：Decimal(9, 0)        |
| Float/Double | - 支持 <br />- 支持 signed,unsigned（8.0.17 以前支持，该版本以上标记为 deprecated） | - 支持 <br />- 只支持 signed                                 |

### 日期类型

| 类型      | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Date      | - 支持 <br />- 范围：['1000-01-01','9999-12-31'] <br />- 格式：YYYY-MM-DD | - 支持 <br />- 范围：['0000-01-01', '9999-12-31'] <br />- 格式：YYYY-MM-DD|
| DateTime  | - 支持 <br />- DATETIME([P])，可选参数 P 表示精度 <br />- 范围：'1000-01-01 00:00:00.000000' ,'9999-12-31 23:59:59.999999' <br />- 格式：YYYY-MM-DD hh:mm:ss[.fraction] | - 支持 <br />- DATETIME([P])，可选参数 P 表示精度 <br />- 范围：['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]'] <br />- 格式：YYYY-MM-DD hh:mm:ss[.fraction] |
| Timestamp | - 支持 <br />- Timestamp[(p)]，可选参数 P 表示精度 <br />- 范围：['1970-01-01 00:00:01.000000' UTC , '2038-01-19 03:14:07.999999' UTC] <br />- 格式：YYYY-MM-DD hh:mm:ss[.fraction] | - 不支持                                                     |
| Time      | - 支持 <br />- Time[(p)] <br /> - 范围：['-838:59:59.000000' to '838:59:59.000000'] <br />- 格式：hh:mm:ss[.fraction] | - 不支持                                                     |
| Year      | - 支持 <br />- 范围：1901 to 2155, or 0000 <br />- 格式：yyyy          | - 不支持                                                     |

### 字符串类型

| 类型      | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Char      | - 支持 <br />- CHAR(M)，M 为字符长度，缺省表示长度为 1 <br />- 定长 <br />- 范围：[0,255]，字节大小 | - 支持 <br />- CHAR(M)，M 为字节长度 <br />- 可变 <br />- 范围：[1,255]      |
| Varchar   | - 支持 <br />- VARCHAR(M)，M 为字符长度 <br />- 范围：[0,65535]，字节大小 | - 支持 <br />- VARCHAR(M)，M 为字节长度。<br />- 范围：[1, 65533]      |
| String    | - 不支持                                                     | - 支持 <br />- 1048576 字节（1MB），可调大到 2147483643 字节（2G）|
| Binary    | - 支持 <br />- 类似于 Char                                         | - 不支持                                                     |
| Varbinary | - 支持 <br />- 类似于 Varchar                                      | - 不支持                                                     |
| Blob      | - 支持 <br />- TinyBlob、Blob、MediumBlob、LongBlob              | - 不支持                                                     |
| Text      | - 支持 <br />- TinyText、Text、MediumText、LongText           | - 不支持                                                     |
| Enum      | - 支持 <br />- 最多支持 65535 个 elements                            | - 不支持                                                     |
| Set       | - 支持 <br />- 最多支持 64 个 elements                              | - 不支持                                                     |

### JSON 数据类型

| 类型 | MySQL  | Doris  |
| ---- | ------ | ------ |
| JSON | 支持 | 支持 |

### Doris 特有的数据类型

- **HyperLogLog**

  HLL 不能作为 Key 列使用，支持在 Aggregate 模型、Duplicate 模型和 Unique 模型的表中使用。在 Aggregate 模型表中使用时，建表时配合的聚合类型为 HLL_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。并且 HLL 列只能通过配套的 HLL_UNION_AGG、HLL_RAW_AGG、HLL_CARDINALITY、HLL_HASH 进行查询或使用。

  HLL 是模糊去重，在处理大数据量时，其性能优于 Count Distinct。HLL 的误差率通常在 1% 左右，有时可能会达到 2%。

- **BITMAP**

  BITMAP 类型的列可以在 Aggregate 表、Unique 表或 Duplicate 表中使用，但必须作为非 Key 列。在 Unique 表或 Duplicate 表中使用时，同样需遵循此规则。在 Aggregate 表中使用时，还需配合 BITMAP_UNION 聚合类型。用户无需指定长度和默认值，长度会根据数据的聚合程度由系统内部控制。并且，BITMAP 列只能通过配套的 BITMAP_UNION_COUNT、BITMAP_UNION、BITMAP_HASH、BITMAP_HASH64 等函数进行查询或使用。

  离线场景下使用 BITMAP 可能会影响导入速度，在数据量大的情况下，其查询速度会慢于 HLL，但优于 Count Distinct。注意：在实时场景下，如果 BITMAP 不使用全局字典，而使用了 BITMAP_HASH()，可能会导致约千分之一的误差。如果此误差不可接受，可以使用 BITMAP_HASH64。

- **QUANTILE_PERCENT（QUANTILE_STATE）**

  QUANTILE_STATE 不能作为 Key 列使用，支持在 Aggregate 模型、Duplicate 模型和 Unique 模型的表中使用。在 Aggregate 模型表中使用时，建表时配合的聚合类型为 QUANTILE_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。并且 QUANTILE_STATE 列只能通过配套的 QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE 等函数进行查询或使用。

  QUANTILE_STATE 是一种计算分位数近似值的类型，在导入时会对相同的 Key，不同 Value 进行预聚合，当 Value 数量不超过 2048 时，会采用明细记录所有数据，当 Value 数量大于 2048 时采用 [TDigest](https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) 算法，对数据进行聚合（聚类），并保存聚类后的质心点。

- **Array<T\>**

  Array 由 T 类型元素组成的数组，不能作为 Key 列使用。目前支持在 Duplicate 模型的表中使用，也支持在 Unique 模型的表中非 Key 列使用。

  T 类型包括：BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME,CHAR, VARCHAR, STRING

- **MAP<K, V>**

  Map 是由 K, V 类型元素组成的映射表，不能作为 Key 列使用。目前支持在 Duplicate，Unique 模型的表中使用。

  K,V 支持的类型包括：BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME,  CHAR, VARCHAR, STRING

- **STRUCT<field_name:field_type, ... >**

  Struct 由多个 Field 组成的结构体，也可被理解为多个列的集合。不能作为 Key 使用，目前 Struct 仅支持在 Duplicate 模型的表中使用。

  一个 Struct 中的 Field 的名字和数量固定，且总是为 Nullable，一个 Field 通常由下面部分组成：

  - field_name: Field 的标识符，不可重复

  - field_type: Field 的类型

  当前可支持的类型包括：BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, CHAR, VARCHAR, STRING

- **Agg_State**

  AGG_STATE 不能作为 Key 列使用，建表时需要同时声明聚合函数的签名。

  用户不需要指定长度和默认值。实际存储的数据大小与函数实现有关。

  AGG_STATE 只能配合[STATE](../sql-manual/sql-functions/combinators/state) / [MERGE](../sql-manual/sql-functions/combinators/merge) / [UNION](../sql-manual/sql-functions/combinators/union)函数组合器使用。 

## 语法区别

### DDL

**1 CREATE TABLE**

Doris 建表语法：

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

与 MySQL 的不同之处：

| 参数                   | 与 MySQL 不同之处                                            |
| ---------------------- | ------------------------------------------------------------ |
| column_definition_list | - 字段列表定义，其基本语法与 MySQL 类似，但会额外包含一个聚合类型的操作。<br />- 该聚合类型的操作，主要支持的数据模型为 Aggregate 和 Duplicate。<br />- 在创建表时，MySQL 允许在字段列表定义后添加 Index 等约束，如 Primary Key、Unique Key 等；而 Doris 则是通过定义数据模型来实现对这些约束和计算的支持。 |
| index_definition_list  | - 索引列表定义，基本语法与 MySQL 类似，支持位图索引、倒排索引和 N-Gram 索引，但是布隆过滤器索引是通过属性设置。<br />- 而 MySQL 支持的 index 有 B+Tree，Hash。 |
| engine_type            | - 表引擎类型，可选。<br />- 目前支持的表引擎主要是 OLAP 原生引擎。<br />- MySQL 支持的存储引擎有：Innodb，MyISAM 等 |
| keys_type              | - 数据模型，可选。<br />- 支持的类型包括：1）DUPLICATE KEY（默认）：其后指定的列为排序列。2）AGGREGATE KEY：其后指定的列为维度列。3）UNIQUE KEY：其后指定的列为主键列。<br />- MySQL 则没有数据模型的概念。 |
| table_comment          | 表注释                                                       |
| partition_info         | - 分区算法，可选。支持的分区算法，包括：<br /> LESS THAN：仅定义分区上界。下界由上一个分区的上界决定。FIXED RANGE：定义分区的左闭右开区间。<br />- MULTI RANGE：批量创建 RANGE 分区，定义分区的左闭右开区间，设定时间单位和步长，时间单位支持年、月、日、周和小时。<br /> MULTI RANGE：批量创建数字类型的 RANGE 分区，定义分区的左闭右开区间，设定步长。<br />- MySQL 支持的算法：Hash，Range，List，并且还支持子分区，子分区支持的算法只有 Hash。 |
| distribution_desc      | - 分桶算法，必选，包括：1）Hash 分桶语法：DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num\|auto] 说明：使用指定的 key 列进行哈希分桶。2）Random 分桶语法：DISTRIBUTED BY RANDOM [BUCKETS num\|auto] 说明：使用随机数进行分桶。<br />- MySQL 没有分桶算法。 |
| rollup_list            | - 建表的同时可以创建多个物化视图。 <br />- 语法：`rollup_name (col1[, col2, ...]) [DUPLICATE KEY(col1[, col2, ...])][PROPERTIES("key" = "value")]` <br />- MySQL 不支持 |
| properties             | 表属性，与 MySQL 的表属性不一致，定义表属性的语法也与 MySQL 不一致 |


**2 CREATE INDEX**

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP];
```

- 目前支持：位图索引、倒排索引和 N-Gram 索引，布隆过滤器索引（单独的语法设置）

- MySQL 支持的索引算法有：B+Tree，Hash

**3 CREATE VIEW**

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

- 基本语法与 MySQL 一致

- Doris 支持两种物化视图，同步物化视图和异步物化视图（异步物化视图从 v2.1 开始支持）。Doris 的异步物化视图更加强大。

- MySQL 仅支持异步物化视图

**4 ALTER TABLE / ALTER INDEX**

Doris Alter 的语法与 MySQL 的基本一致。 

### DROP TABLE / DROP INDEX

Doris Drop 的语法与 MySQL 的基本一致 

### DML

**1 INSERT**

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

Doris Insert 语法与 MySQL 的基本一致。

**2 UPDATE**

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

Doris Update 语法与 MySQL 基本一致，但需要注意的是**必须加上 WHERE 条件。**

**3 DELETE**

```sql
DELETE FROM table_name [table_alias] 
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

Doris 该语法只能指定过滤谓词

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

Doris 该语法只能在 UNique Key 模型表上使用。

Doris Delete 语法与 MySQL 基本一致。但是由于 Doris 是一个分析数据库，所以删除不能过于频繁。

**4 SELECT**

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

Doris Select 语法与 MySQL 基本一致 

## SQL Function

Doris Function 基本覆盖绝大部分 MySQL Function。