---
{
  "title": "CREATE-TABLE-AND-GENERATED-COLUMN",
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
CREATE TABLE supports specifying generated columns, where the value of a generated column is calculated from the expression specified in the column definition.
Here is an example using a generated column:
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
Query data from the table:
```sql
mysql> SELECT * FROM products;
+------------+-------+----------+-------------+
| product_id | price | quantity | total_value |
+------------+-------+----------+-------------+
|          1 | 10.00 |       10 |      100.00 |
|          1 | 20.00 |       10 |      200.00 |
+------------+-------+----------+-------------+
```
In this example, the total_value column is a generated column whose value is calculated by multiplying the values ​​of the price and quantity columns.
The values of generated columns are calculated and stored in the table when importing or updating.
## Grammar
```sql
col_name data_type [GENERATED ALWAYS] AS (expr)
[NOT NULL | NULL] [COMMENT 'string']
```
## Restrictions on generated columns
1. The functions used can only be built-in scalar functions and operators. UDF, aggregate functions, etc. are not allowed.
2. Variables, subqueries, and Lambda expressions are not allowed.
3. AUTO_INCREMENT columns cannot be used as base columns in generated column definitions.
4. Generated column definitions can reference other generated columns, but only columns that appear earlier in the table definition. Generated column definitions can reference any base (non-generated) column in the table, regardless of whether its definition occurs earlier or later.
5. In the aggregate model, when the generated column is a VALUE column, only REPLACE and REPLACE_IF_NOT_NULL aggregate types are allowed.
## Import data
When importing data, if the NOT NULL restriction of the generated column is violated, for example, when importing data, the column referenced by the generated column is not specified, and this column has no default value, the import will fail.
### INSERT
When specifying columns, the specified columns cannot contain generated columns, otherwise an error will be reported.
```sql
INSERT INTO products(product_id, price, quantity) VALUES(1, 20.00, 10);
```
When no columns are specified, the DEFAULT keyword must be used as a placeholder for the generated columns.。
```sql
INSERT INTO products VALUES(1, 10.00, 10, default);
```

### Load
When using the load method to import data, you need to explicitly specify the import column. You should not specify a generated column as an import column. When you specify an import generated column and there is corresponding data in the data file, the generated column will not use the value in the data file, and the value of the generated column is still the result of the expression calculation.
#### Stream Load
Create table:
```sql
mysql> CREATE TABLE gen_col_stream_load(a INT,b INT,c DOUBLE GENERATED ALWAYS AS (abs(a+b)) not null)
DISTRIBUTED BY HASH(a)
PROPERTIES("replication_num" = "1");
```
Prepare data and perform stream loading:
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
View the data import results:
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
Create table:
```sql
mysql> CREATE TABLE gencol_refer_gencol_http_load(a INT,c DOUBLE GENERATED ALWAYS AS (abs(a+b)) NOT NULL,b INT, d INT GENERATED ALWAYS AS(c+1))
DISTRIBUTED BY HASH(a)
PROPERTIES("replication_num" = "1");
```
Prepare data and perform HTTP stream loading:
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
View the data import results:
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
#### Other Load
BROKER LOAD, ROUTINE LOAD and other methods can import data into a table with generated columns, which will not be listed here.
## Generated columns and partial update
When updating some columns, you must specify all the common columns referenced by the generated columns in columns, otherwise an error will be reported.

The following is an example to create a table, insert a row of data, and set the session variable:
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
If all referenced normal columns are not specified, an error will be reported:
```sql
mysql> INSERT INTO test_partial_column_unique_gen_col(a) VALUES(3);
ERROR 1105 (HY000): errCode = 2, detailMessage = Partial update should include all ordinary columns referenced by generated columns, missing: b
```
The same is true for LOAD. All referenced normal columns need to be specified in -H "columns: a, b". The following is an example of using stream load:
```shell
curl --location-trusted -u root: -H "Expect:100-continue" -H "column_separator:," \
-H "columns: a, b" -H "partial_columns:true" \
-T /Users/moailing/Documents/tmp/gen_col_data.csv \
http://127.0.0.1:8030/api/testdb/partial_column_unique_gen_col/_stream_load
```
