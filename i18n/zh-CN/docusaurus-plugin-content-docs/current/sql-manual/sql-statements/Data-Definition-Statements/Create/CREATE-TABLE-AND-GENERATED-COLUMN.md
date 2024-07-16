---
{
  "title": "CREATE-TABLE-AND-GENERATED-COLUMN",
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

生成列是一种特殊的数据库表列，其值由其他列的值计算而来，而不是直接由用户插入或更新。该功能支持预先计算表达式的结果，并存储在数据库中，适用于需要频繁查询或进行复杂计算的场景。

生成列可以在数据导入或更新时自动根据预定义的表达式计算结果，并将这些结果持久化存储。这样，在后续的查询过程中，可以直接访问这些已经计算好的结果，而无需在查询时再进行复杂的计算，从而显著减少查询时的计算负担，提升查询性能。

下面是一个使用生成列的例子：

```sql
CREATE TABLE products (
product_id INT,
price DECIMAL(10,2),
quantity INT,
total_value DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity)
) UNIQUE KEY(product_id) 
DISTRIBUTED BY HASH(product_id) PROPERTIES ("replication_num" = "1");

INSERT INTO products VALUES(1, 10.00, 10, default);
INSERT INTO products(product_id, price, quantity) VALUES(1, 20.00, 10);
```

从表中查询数据：

```sql
mysql> SELECT * FROM products;
+------------+-------+----------+-------------+
| product_id | price | quantity | total_value |
+------------+-------+----------+-------------+
|          1 | 10.00 |       10 |      100.00 |
|          1 | 20.00 |       10 |      200.00 |
+------------+-------+----------+-------------+
```

在这个示例中, total_value 列是一个生成列，其值由 price 和 quantity 列的值相乘计算而来。
生成列的值在导入或更新时计算并存储在表中。
## 语法

```sql
col_name data_type [GENERATED ALWAYS] AS (expr)
[NOT NULL | NULL] [COMMENT 'string']
```

## 生成列的限制
1. 使用的函数只能是内置的标量函数和运算符，不允许使用udf，聚合函数等其它。
2. 不允许使用变量，子查询，Lambda表达式。
3. AUTO_INCREMENT列不能用作生成的列定义中的基列。
4. 生成的列定义可以引用其他生成的列，但只能引用表定义中较早出现的列。 生成的列定义可以引用表中的任何基本（非生成）列，无论其定义发生得早还是晚。
5. 聚合模型中，生成列是VALUE列时，仅允许使用REPLACE和REPLACE_IF_NOT_NULL聚合类型。

## 导入数据
导入数据时，如果违反了生成列的NOT NULL限制，例如导入数据时，没有指定生成列引用的列，并且此列没有默认值，将导致导入失败。
### INSERT
指定列时，指定的列不能包含生成列，否则将报错。

```sql
INSERT INTO products(product_id, price, quantity) VALUES(1, 20.00, 10);
```

没有指定列时，生成列需要使用DEFAULT关键字进行占位。

```sql
INSERT INTO products VALUES(1, 10.00, 10, default);
```

### Load
使用load方式进行数据导入时，需要显式指定导入列。不应当指定生成列为导入列，当指定导入生成列并在数据文件中有对应的数据时，生成列不会使用数据文件中的值，生成列的值仍然是根据表达式计算得到的结果。
#### Stream Load
创建表:

```sql
mysql> CREATE TABLE gen_col_stream_load(a INT,b INT,c DOUBLE GENERATED ALWAYS AS (abs(a+b)) not null)
DISTRIBUTED BY HASH(a)
PROPERTIES("replication_num" = "1");
```

准备数据，并进行stream load:

```shell
cat gen_col_data.csv 
1,2
3,5
2,9

curl --location-trusted -u root: \
-H "Expect:100-continue" \
-H "column_separator:," \
-H "columns:a,b" \
-T gen_col_data.csv \
-XPUT http://127.0.0.1:8030/api/testdb/gen_col_stream_load/_stream_load
{
    "TxnId": 223227,
    "Label": "d4a615c9-6e73-4d95-a8a4-e4c30d3b2262",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 3,
    "NumberLoadedRows": 3,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 12,
    "LoadTimeMs": 152,
    "BeginTxnTimeMs": 5,
    "StreamLoadPutTimeMs": 39,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 66,
    "CommitAndPublishTimeMs": 37
}
```

查看数据导入结果:

```sql
mysql> SELECT * FROM gen_col_stream_load;
+------+------+------+
| a    | b    | c    |
+------+------+------+
|    1 |    2 |    3 |
|    2 |    9 |   11 |
|    3 |    5 |    8 |
+------+------+------+
3 rows in set (0.07 sec)
```

#### HTTP Stream Load
创建表:

```sql
mysql> CREATE TABLE gencol_refer_gencol_http_load(a INT,c DOUBLE GENERATED ALWAYS AS (abs(a+b)) NOT NULL,b INT, d INT GENERATED ALWAYS AS(c+1))
DISTRIBUTED BY HASH(a)
PROPERTIES("replication_num" = "1");
```

准备数据，并进行http stream load:

```shell
curl  --location-trusted -u root: -T gen_col_data.csv  -H "Expect: 100-Continue" \
-H "sql:insert into testdb.gencol_refer_gencol_http_load(a, b) select * from http_stream(\"format\" = \"CSV\", \"column_separator\" = \",\" )" \
http://127.0.0.1:8030/api/_http_stream
{
    "TxnId": 223244,
    "Label": "label_824464cba2a1eabc_bee78e427ea55e81",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 3,
    "NumberLoadedRows": 3,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 12,
    "LoadTimeMs": 142,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 45,
    "ReadDataTimeMs": 46,
    "WriteDataTimeMs": 59,
    "CommitAndPublishTimeMs": 36
}
```

查看数据导入结果:

```sql
mysql> SELECT * FROM gencol_refer_gencol_http_load;                                                                                                                          +------+------+------+------+
| a    | c    | b    | d    |
+------+------+------+------+
|    2 |   11 |    9 |   12 |
|    1 |    3 |    2 |    4 |
|    3 |    8 |    5 |    9 |
+------+------+------+------+
3 rows in set (0.04 sec)
```

#### MySQL Load
建表，加载数据和查询的过程如下:

```sql
mysql> CREATE TABLE gen_col_mysql_load(a INT,b INT,c DOUBLE GENERATED ALWAYS AS (abs(a+b)) NOT NULL)
DISTRIBUTED BY HASH(a)
PROPERTIES("replication_num" = "1");

mysql> LOAD DATA LOCAL
INFILE '/path_to_data/gen_col_data.csv'
INTO TABLE gen_col_mysql_load
COLUMNS TERMINATED BY ','
(a,b);
Query OK, 3 rows affected (0.14 sec)
Records: 3  Deleted: 0  Skipped: 0  Warnings: 0

mysql> SELECT * FROM gen_col_mysql_load;
+------+------+------+
| a    | b    | c    |
+------+------+------+
|    2 |    9 |   11 |
|    3 |    5 |    8 |
|    1 |    2 |    3 |
+------+------+------+
3 rows in set (0.06 sec)
```

#### 其它Load
BROKER LOAD, ROUTINE LOAD等方式都可以将数据导入有生成列的表，不再一一列举。

## 生成列与部分列更新
在进行部分列更新时，必须在columns中指定生成列引用的所有普通列，否则会报错。

下面是一个示例， 建表和插入一行数据，并设置session变量:

```sql
CREATE TABLE test_partial_column_unique_gen_col (a INT, b INT, c INT AS (a+b), d INT AS (c+1), e INT)
UNIQUE KEY(a) DISTRIBUTED BY HASH(a) PROPERTIES(
 "enable_unique_key_merge_on_write" = "true",
 "replication_num"="1"
);
SET enable_unique_key_partial_update=true;
SET enable_insert_strict=false;
SET enable_fallback_to_original_planner=false;
INSERT INTO test_partial_column_unique_gen_col(a,b,e) VALUES(1,2,7);
```

如果没有指定所有被引用的普通列会报错:

```sql
mysql> INSERT INTO test_partial_column_unique_gen_col(a) VALUES(3);
ERROR 1105 (HY000): errCode = 2, detailMessage = Partial update should include all ordinary columns referenced by generated columns, missing: b
```

LOAD也是这样，-H "columns: a, b"中需要指定所有被引用的普通列，下面是使用stream load的示例:

```shell
curl --location-trusted -u root: -H "Expect:100-continue" -H "column_separator:," \
-H "columns: a, b" -H "partial_columns:true" \
-T /Users/moailing/Documents/tmp/gen_col_data.csv \
http://127.0.0.1:8030/api/testdb/partial_column_unique_gen_col/_stream_load
```
