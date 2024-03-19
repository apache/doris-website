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
| Boolean      | - 支持 - 范围：0 代表 false，1 代表 true                         | - 支持 - 关键字：Boolean - 范围：0 代表 false，1 代表 true |
| Bit          | - 支持 - 范围：1 ~ 64                                        | 不支持                                                 |
| Tinyint      | - 支持 - 支持 signed,unsigned - 范围：  - signed: -128 ~ 127  - unsigned: 0 ~ 255 | - 支持 - 只支持 signed - 范围：-128 ~ 127               |
| Smallint     | - 支持 - 支持 signed,unsigned - 范围：  - signed: -2^15 ~ 2^15-1  - unsigned: 0 ~ 2^16-1 | - 支持 - 只支持 signed - 范围：-32768 ~ 32767           |
| Mediumint    | - 支持 - 支持 signed,unsigned - 范围：  - signed: -2^23 ~ 2^23-1  - unsigned: 0 ~ -2^24-1 | - 不支持                                               |
| int          | - 支持 - 支持 signed,unsigned - 范围：  - signed: -2^31 ~ 2^31-1  - unsigned: 0 ~ -2^32-1 | - 支持 - 只支持 signed - 范围： -2147483648~ 2147483647 |
| Bigint       | - 支持 - 支持 signed,unsigned - 范围：  - signed: -2^63 ~ 2^63-1  - unsigned: 0 ~ 2^64-1 | - 支持 - 只支持 signed - 范围： -2^63 ~ 2^63-1          |
| Largeint     | - 不支持                                                     | - 支持 - 只支持 signed - 范围：-2^127 ~ 2^127-1         |
| Decimal      | - 支持 - 支持 signed,unsigned（8.0.17 以前支持，以后被标记为 deprecated） - 默认值：Decimal(10, 0) | - 支持 - 只支持 signed - 默认值：Decimal(9, 0)          |
| Float/Double | - 支持 - 支持 signed,unsigned（8.0.17 以前支持，以后被标记为 deprecated） | - 支持 - 只支持 signed                                  |

### 日期类型

| 类型      | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Date      | - 支持 - 范围：['1000-01-01','9999-12-31'] - 格式：YYYY-MM-DD | - 支持 - 范围：['0000-01-01', '9999-12-31'] - 格式：YYYY-MM-DD |
| DateTime  | - 支持 - DATETIME([P])，可选参数 P 表示精度 - 范围：'1000-01-01 00:00:00.000000' ,'9999-12-31 23:59:59.999999' - 格式：YYYY-MM-DD hh:mm:ss[.fraction] | - 支持 - DATETIME([P])，可选参数 P 表示精度 - 范围：['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]'] - 格式：YYYY-MM-DD hh:mm:ss[.fraction] |
| Timestamp | - 支持 - Timestamp[(p)]，可选参数 P 表示精度 - 范围：['1970-01-01 00:00:01.000000' UTC , '2038-01-19 03:14:07.999999' UTC] - 格式：YYYY-MM-DD hh:mm:ss[.fraction] | - 不支持                                                     |
| Time      | - 支持 - Time[(p)] - 范围：['-838:59:59.000000' to '838:59:59.000000'] - 格式：hh:mm:ss[.fraction] | - 不支持                                                     |
| Year      | - 支持 - 范围：1901 to 2155, or 0000 - 格式：yyyy            | - 不支持                                                     |

### 字符串类型

| 类型      | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Char      | - 支持 - CHAR[(M)，M 为字符长度，缺省表示长度为 1, - 定长 - 范围：[0,255]，字节大小 | - 支持 - CHAR[(M)，M 为字节长度 - 可变 - 范围：[1,255]        |
| Varchar   | - 支持 - VARCHAR(M)，M 为字符长度 - 范围：[0,65535]，字节大小 | - 支持 - VARCHAR(M)，M 为字节长度。 - 范围：[1, 65533]        |
| String    | - 不支持                                                     | - 支持 - 1048576 字节（1MB），可调大到 2147483643 字节（2G） |
| Binary    | - 支持 - 类似于 Char                                          | - 不支持                                                     |
| Varbinary | - 支持 - 类似于 Varchar                                       | - 不支持                                                     |
| Blob      | - 支持 - TinyBlob、Blob、MediumBlob、LongBlob                | - 不支持                                                     |
| Text      | - 支持 - TinyText、Text、MediumText、LongText                | - 不支持                                                     |
| Enum      | - 支持 - 最多支持 65535 个 elements                             | - 不支持                                                     |
| Set       | - 支持 - 最多支持 64 个 elements                                | - 不支持                                                     |

### JSON 数据类型

| 类型 | MySQL  | Doris  |
| ---- | ------ | ------ |
| JSON | - 支持 | - 支持 |

### Doris 特有的数据类型

- **HyperLogLog**

    HLL HLL 不能作为 key 列使用，支持在 Aggregate 模型、Duplicate 模型和 Unique 模型的表中使用。在 Aggregate 模型表中使用时，建表时配合的聚合类型为 HLL_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。并且 HLL 列只能通过配套的 hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash 进行查询或使用。

    HLL 是模糊去重，在数据量大的情况性能优于 Count Distinct。HLL 的误差通常在 1% 左右，有时会达到 2%。

- **Bitmap**

    BITMAP 类型的列可以在 Aggregate 表、Unique 表或 Duplicate 表中使用。在 Unique 表或 duplicate 表中使用时，其必须作为非 key 列使用。在 Aggregate 表中使用时，其必须作为非 key 列使用，且建表时配合的聚合类型为 BITMAP_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。并且 BITMAP 列只能通过配套的 bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64 等函数进行查询或使用。

    离线场景下使用 BITMAP 会影响导入速度，在数据量大的情况下查询速度会慢于 HLL，并优于 Count Distinct。注意：实时场景下 BITMAP 如果不使用全局字典，使用了 bitmap_hash() 可能会导致有千分之一左右的误差。如果这个误差不可接受，可以使用 bitmap_hash64。

- **QUANTILE_PERCENT**

    QUANTILE_STATE 不能作为 key 列使用，支持在 Aggregate 模型、Duplicate 模型和 Unique 模型的表中使用。在 Aggregate 模型表中使用时，建表时配合的聚合类型为 QUANTILE_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。并且 QUANTILE_STATE 列只能通过配套的 QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE 等函数进行查询或使用。

    QUANTILE_STATE 是一种计算分位数近似值的类型，在导入时会对相同的 key，不同 value 进行预聚合，当 value 数量不超过 2048 时采用明细记录所有数据，当 value 数量大于 2048 时采用 [TDigest](https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) 算法，对数据进行聚合（聚类）保存聚类后的质心点。

- **Array<T\>**

    由 T 类型元素组成的数组，不能作为 key 列使用。目前支持在 Duplicate 模型的表中使用，也支持在 Unique 模型的表中非 key 列使用。

    T 类型：BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME,CHAR, VARCHAR, STRING

- **MAP<K, V>**

        由 K, V 类型元素组成的 map，不能作为 key 列使用。目前支持在 Duplicate，Unique 模型的表中使用。

K,V 支持的类型有：BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME,  CHAR, VARCHAR, STRING

- **STRUCT<field_name:field_type, ... >**

    由多个 Field 组成的结构体，也可被理解为多个列的集合。不能作为 Key 使用，目前 STRUCT 仅支持在 Duplicate 模型的表中使用。

    一个 Struct 中的 Field 的名字和数量固定，总是为 Nullable，一个 Field 通常由下面部分组成。

    - field_name: Field 的标识符，不可重复

    - field_type: Field 的类型

    当前可支持的类型有：BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL, DATE, DATETIME, CHAR, VARCHAR, STRING

- Agg_State

    AGG_STATE 不能作为 key 列使用，建表时需要同时声明聚合函数的签名。

    用户不需要指定长度和默认值。实际存储的数据大小与函数实现有关。

    AGG_STATE 只能配合[state](../../sql-manual/sql-functions/combinators/state) /[merge](../../sql-manual/sql-functions/combinators/merge)/[union](../../sql-manual/sql-functions/combinators/union)函数组合器使用。 

## 语法区别

### DDL

**Create-Table**

**01 Doris 建表语法**

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

**02 与 MySQL 的不同之处**

- column_definition_list 
 
  - 字段列表定义，基本语法与 MySQL 类似，会多出一个**聚合类型**的操作
 
  - **聚合类型**的操作，主要支持数据模型为 AGGREGATE，Duplicate
 
  - MySQL 可以在建表定义字段列表的时候，还可以在字段后面加上 Index 等约束，例如 primary key,unique key 等，但是 Doris 是通过定义数据模型来约束和计算的。

- index_definition_list 

  - 索引列表定义，基本语法与 MySQL 类似，支持位图索引、倒排索引和 N-Gram 索引，但是布隆过滤器索引是通过属性设置。

  - 而 MySQL 支持的 index 有 B+Tree，Hash。

- engine_type 

  - 表引擎类型，可选

  - 目前支持的表引擎主要是 olap 这种原生引擎。

  - MySQL 支持的存储引擎有：Innodb，MyISAM 等

- keys_type 

  - 数据模型，可选

  - 支持的类型 

    - DUPLICATE KEY（默认）：其后指定的列为排序列。

    - AGGREGATE KEY：其后指定的列为维度列。

    - UNIQUE KEY：其后指定的列为主键列。

  - MySQL 则没有数据模型的概念。

- table_comment 

  - 表注释

- partition_info 

  - 分区算法，可选

  - 支持的分区算法 

    - LESS THAN：仅定义分区上界。下界由上一个分区的上界决定。

    - FIXED RANGE：定义分区的左闭右开区间。

    - MULTI RANGE：批量创建 RANGE 分区，定义分区的左闭右开区间，设定时间单位和步长，时间单位支持年、月、日、周和小时。

    - MULTI RANGE：批量创建数字类型的 RANGE 分区，定义分区的左闭右开区间，设定步长。

  - MySQL 支持的算法：Hash，Range，List，并且还支持子分区，子分区支持的算法只有 Hash。

- distribution_desc 

  - 分桶算法，必选

  - 分桶算法 

    - Hash 分桶语法：DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num|auto] 说明：使用指定的 key 列进行哈希分桶。

    - Random 分桶语法：DISTRIBUTED BY RANDOM [BUCKETS num|auto] 说明：使用随机数进行分桶。

  - MySQL 没有分桶算法

- rollup_list 

  - 建表的同时可以创建多个物化视图，可选

  - rollup_name (col1[, col2, ...]) [DUPLICATE KEY(col1[, col2, ...])] [PROPERTIES("key" = "value")]

  - MySQL 不支持

- properties: 

  - 表属性

  - 表属性与 MySQL 的表属性不一致，定义表属性的语法也与 MySQL 不一致

**03 Create-Index**

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP];
```

- 目前支持：位图索引、倒排索引和 N-Gram 索引，布隆过滤器索引（单独的语法设置）

- MySQL 支持的索引算法有：B+Tree，Hash

**04 Create-View**

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

- Doris 支持两种物化视图，同步物化视图和异步物化视图（从 v2.1 开始）。Doris 的异步物化视图更加强大。

- MySQL 仅支持异步物化视图

**05 Alter-Table/Alter-Index**

Doris Alter 的语法与 MySQL 的基本一致。 

### Drop-Table/Drop-Index

Doris Drop 的语法与 MySQL 的基本一致 

### DML

**Insert**

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

Doris Insert 语法与 MySQL 的基本一致。

**update**

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

Doris Update 语法与 MySQL 基本一致，但需要注意的是**必须加上 where 条件。**

**Delete**

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

Doris 该语法只能在 UNIQUE KEY 模型表上使用。

Doris Delete 语法与 MySQL 基本一致。但是由于 Doris 是一个分析数据库，所以删除不能过于频繁。

**Select**

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

Doris Select 语法与 MySQL 基本一致 

## SQL Function

Doris Function 基本覆盖绝大部分 MySQL Function。