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
# 建表和生成列
CREATE TABLE 支持指定生成列，生成列的值是从列定义中指定的表达式中计算得到的。
下面是一个使用生成列的例子：
```sql
CREATE TABLE products (
product_id INT,
price DECIMAL(10,2),
quantity INT,
total_value DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity)
) DISTRIBUTED BY HASH(product_id) PROPERTIES ("replication_num" = "1");

insert into products values(1, 10.00, 10, default);
insert into products(product_id, price, quantity) values(1, 20.00, 10);
```
从表中查询数据：
```sql
mysql> select * from products;
+------------+-------+----------+-------------+
| product_id | price | quantity | total_value |
+------------+-------+----------+-------------+
|          1 | 10.00 |       10 |      100.00 |
|          1 | 20.00 |       10 |      200.00 |
+------------+-------+----------+-------------+
```
在这个示例中, total_value 列是一个生成列，其值由 price 和 quantity 列的值相乘计算而来。
在导入或更新时计算并存储在表中。
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

## 导入数据
导入数据时，如果违反了生成列的NOT NULL限制，例如导入数据时，没有指定生成列引用的列，并且此列没有默认值，将导致导入失败。
### INSERT
指定列时，指定的列不能包含生成列，否则将报错。
```sql
insert into products(product_id, price, quantity) values(1, 20.00, 10);
```
没有指定列时，生成列需要使用default关键字进行占位。
```sql
insert into products values(1, 10.00, 10, default);
```

### LOAD
使用load方式进行数据导入时，需要显式指定导入列。不应当指定生成列为导入列，当指定导入生成列并在数据文件中有对应的数据时，生成列不会使用数据文件中的值，生成列的值仍然是根据表达式计算得到的结果。
#### STREAM LOAD
创建表:
```sql
mysql> create table gen_col_stream_load(a int,b int,c double generated always as (abs(a+b)) not null)
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
mysql> select * from gen_col_stream_load;
+------+------+------+
| a    | b    | c    |
+------+------+------+
|    1 |    2 |    3 |
|    2 |    9 |   11 |
|    3 |    5 |    8 |
+------+------+------+
3 rows in set (0.07 sec)
```
#### HTTP STREAM LOAD
创建表:
```sql
mysql> create table gencol_refer_gencol_http_load(a int,c double generated always as (abs(a+b)) not null,b int, d int generated always as(c+1))
DISTRIBUTED BY HASH(a)
PROPERTIES("replication_num" = "1");
```
准备数据，并进行http stream load。
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
mysql> select * from gencol_refer_gencol_http_load;                                                                                                                          +------+------+------+------+
| a    | c    | b    | d    |
+------+------+------+------+
|    2 |   11 |    9 |   12 |
|    1 |    3 |    2 |    4 |
|    3 |    8 |    5 |    9 |
+------+------+------+------+
3 rows in set (0.04 sec)
```
#### MYSQL LOAD
```sql
mysql> create table gen_col_mysql_load(a int,b int,c double generated always as (abs(a+b)) not null)
DISTRIBUTED BY HASH(a)
PROPERTIES("replication_num" = "1");

mysql> LOAD DATA LOCAL
INFILE '/path_to_data/gen_col_data.csv'
INTO TABLE gen_col_mysql_load
COLUMNS TERMINATED BY ','
(a,b);
Query OK, 3 rows affected (0.14 sec)
Records: 3  Deleted: 0  Skipped: 0  Warnings: 0

mysql> select * from gen_col_mysql_load;
+------+------+------+
| a    | b    | c    |
+------+------+------+
|    2 |    9 |   11 |
|    3 |    5 |    8 |
|    1 |    2 |    3 |
+------+------+------+
3 rows in set (0.06 sec)
```
#### 其它LOAD
BROKER LOAD, ROUTINE LOAD等方式都可以将数据导入有生成列的表，不再一一列举。

## 删除生成列
```sql
alter table products drop column total_value;
```
注意事项：
如果表中某列（生成列或者普通列）被其它生成列引用，需要先删除其它生成列后，才能删除此被引用的生成列或者普通列。

