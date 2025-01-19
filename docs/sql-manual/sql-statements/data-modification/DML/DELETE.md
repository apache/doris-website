---
{
    "title": "DELETE",
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



## Description

This statement is used to conditionally delete data in the specified table (base index) partition.

This operation will also delete the data of the rollup index related to this base index.

#### Syntax

Syntax 1: This syntax can only specify filter predicates

```SQL
DELETE FROM table_name [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
WHERE
column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

Syntax 2: This syntax can only used on UNIQUE KEY model

```sql
[cte]
DELETE FROM table_name
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

#### Required Parameters

+ table_name: Specifies the table from which rows are removed.
+ column_name: column belong to table_name
+ op: Logical comparison operator, The optional types of op include: =, >, <, >=, <=, !=, in, not in
+ value | value_list: value or value list used for logial comparison
+ WHERE condition: Specifies a condition to use to select rows for removal

#### Optional Parameters

+ cte: Common Table Expression, e.g. 'WITH a AS SELECT * FROM tbl'.
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): Specifies the partition or partitions to select rows for removal
+ table_alias: alias of table
+ USING additional_tables: If you need to refer to additional tables in the WHERE clause to help identify the rows to be removed, then specify those table names in the USING clause. You can also use the USING clause to specify subqueries that identify the rows to be removed.

#### Note

1. Only conditions on the key column can be specified when using AGGREGATE (UNIQUE) model.
2. When the selected key column does not exist in a rollup, delete cannot be performed.
3. Wheny you use syntax 1, conditions can only have an "and" relationship. If you want to achieve an "or" relationship, you need to write the conditions in two DELETE statements.
4. In syntax 1, if it is a partitioned table, you can specify a partition. If not specified, Doris will infer partition from the given conditions. In two cases, Doris cannot infer the partition from conditions: 1) the conditions do not contain partition columns; 2) The operator of the partition column is not in. When a partition table does not specify the partition, or the partition cannot be inferred from the conditions, the session variable delete_without_partition needs to be true to make delete statement be applied to all partitions.

:::tip Tips
This feature is supported since the Apache Doris 1.2 version
:::

5. This statement may reduce query efficiency for a period of time after execution. The degree of impact depends on the number of delete conditions specified in the statement. The more conditions you specify, the greater the impact.

## Example

1. Delete the data row whose k1 column value is 3 in my_table partition p1

   ```sql
   DELETE FROM my_table PARTITION p1
       WHERE k1 = 3;
   ```

2. Delete the data rows where the value of column k1 is greater than or equal to 3 and the value of column k2 is "abc" in my_table partition p1

   ```sql
   DELETE FROM my_table PARTITION p1
   WHERE k1 >= 3 AND k2 = "abc";
   ```

3. Delete the data rows where the value of column k1 is greater than or equal to 3 and the value of column k2 is "abc" in my_table partition p1, p2

   ```sql
   DELETE FROM my_table PARTITIONS (p1, p2)
   WHERE k1 >= 3 AND k2 = "abc";
   ```

4. use the result of `t2` join `t3` to romve rows from `t1`,delete table only support unique key model

   ```sql
   -- create t1, t2, t3 tables
   CREATE TABLE t1
     (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
   UNIQUE KEY (id)
   DISTRIBUTED BY HASH (id)
   PROPERTIES('replication_num'='1', "function_column.sequence_col" = "c4");
   
   CREATE TABLE t2
     (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
   DISTRIBUTED BY HASH (id)
   PROPERTIES('replication_num'='1');
   
   CREATE TABLE t3
     (id INT)
   DISTRIBUTED BY HASH (id)
   PROPERTIES('replication_num'='1');
   
   -- insert data
   INSERT INTO t1 VALUES
     (1, 1, '1', 1.0, '2000-01-01'),
     (2, 2, '2', 2.0, '2000-01-02'),
     (3, 3, '3', 3.0, '2000-01-03');
   
   INSERT INTO t2 VALUES
     (1, 10, '10', 10.0, '2000-01-10'),
     (2, 20, '20', 20.0, '2000-01-20'),
     (3, 30, '30', 30.0, '2000-01-30'),
     (4, 4, '4', 4.0, '2000-01-04'),
     (5, 5, '5', 5.0, '2000-01-05');
   
   INSERT INTO t3 VALUES
     (1),
     (4),
     (5);
   
   -- remove rows from t1
   DELETE FROM t1
     USING t2 INNER JOIN t3 ON t2.id = t3.id
     WHERE t1.id = t2.id;
   ```
   
   the expect result is only remove the row where id = 1 in table t1
   
   ```
   +----+----+----+--------+------------+
   | id | c1 | c2 | c3     | c4         |
   +----+----+----+--------+------------+
   | 2  | 2  | 2  |    2.0 | 2000-01-02 |
   | 3  | 3  | 3  |    3.0 | 2000-01-03 |
   +----+----+----+--------+------------+
   ```

5. using cte

   ```sql
   create table orders(
    o_orderkey bigint,
    o_totalprice decimal(15, 2)
   ) unique key(o_orderkey)
   distributed by hash(o_orderkey) buckets 1
   properties (
   "replication_num" = "1"
   );
   
   insert into orders values
   (1, 34.1),
   (2, 432.8);
   
   create table lineitem(
   l_linenumber int,
   o_orderkey bigint,
   l_discount  decimal(15, 2)
   ) unique key(l_linenumber)
   distributed by hash(l_linenumber) buckets 1
   properties (
   "replication_num" = "1"
   );
   
   insert into lineitem values
   (1, 1, 1.23),
   (2, 1, 3.21),
   (3, 2, 18.08),
   (4, 2, 23.48);
   
   with discount_orders as (
   select * from orders
   where o_totalprice > 100
   )
   delete from lineitem
   using discount_orders
   where lineitem.o_orderkey = discount_orders.o_orderkey;
   ```

## Keywords

    DELETE

## Best Practice

