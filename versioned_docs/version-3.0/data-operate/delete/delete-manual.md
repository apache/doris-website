---
{
    "title": "Deleting Data with DELETE Command",
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
The `DELETE` statement removes data from a specified table or partition based on conditions through the MySQL protocol. It supports specifying the data to be deleted using simple predicate combinations and also supports using the `USING` clause to join multiple tables for deletion on primary key tables.

## Delete by Specifying Filter Predicates

```sql
DELETE FROM table_name [table_alias]
  [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
  WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### Required Parameters

- `table_name`: The table from which data needs to be deleted.

- `column_name`: A column belonging to `table_name`.

- `op`: Logical comparison operators, including: =, >, <, >=, <=, !=, in, not in.

- `value | value_list`: The value or list of values for logical comparison.

### Optional Parameters

- `PARTITION partition_name | PARTITIONS (partition_name [, partition_name])`: Specifies the partition name where the data deletion is to be executed. If the table does not have this partition, an error will be reported.

- `table_alias`: Alias for the table.

### Usage Restrictions

- When using the Aggregate table model, conditions can only be specified on Key columns. If the selected Key column does not exist in a Rollup, deletion cannot be performed.

- For partitioned tables, partitions need to be specified. If not specified, Doris will infer the partition from the conditions.

  - Doris cannot infer the partition from the conditions in two cases:
    1. The conditions do not include partition columns.
    2. The `op` of the partition column is `not in`.

  - When the partitioned table does not specify a partition or cannot infer the partition from the conditions, the session variable `delete_without_partition` needs to be set to `true`, and the delete operation will apply to all partitions.

### Examples

**1. Delete rows in partition `p1` of `my_table` where the value of column `k1` is 3**

```sql
DELETE FROM my_table PARTITION p1
  WHERE k1 = 3;
```

**2. Delete rows in partition `p1` of `my_table` where the value of column `k1` is greater than or equal to 3 and the value of column `status` is "outdated"**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 >= 3 AND status = "outdated";
```

**3. Delete rows in partitions `p1` and `p2` of `my_table` where the value of column `k1` is greater than or equal to 3 and the value of column `dt` is between "2024-10-01" and "2024-10-31"**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 >= 3 AND dt >= "2024-10-01" AND dt <= "2024-10-31";
```

## Delete Using the `USING` Clause

In some scenarios, users need to join multiple tables to accurately determine the data to be deleted. In such cases, the `USING` clause is very useful. The syntax is as follows:

```sql
DELETE FROM table_name [table_alias]
  [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
  [USING additional_tables]
  WHERE condition
```

### Required Parameters

- `table_name`: The table from which data needs to be deleted.
- `WHERE condition`: Specifies the condition for selecting the rows to be deleted.

### Optional Parameters

- `PARTITION partition_name | PARTITIONS (partition_name [, partition_name])`: Specifies the partition name where the data deletion is to be executed. If the table does not have this partition, an error will be reported.
- `table_alias`: Alias for the table.

### Notes

- This form can only be used on UNIQUE KEY model tables.

### Example

Using the join result of tables `t2` and `t3`, delete data from `t1`. The table to be deleted only supports the unique model.

```sql
-- Create tables t1, t2, t3
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

-- Insert data
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

-- Delete data from t1
DELETE FROM t1
  USING t2 INNER JOIN t3 ON t2.id = t3.id
  WHERE t1.id = t2.id;
```

The expected result is to delete the row in table `t1` where `id` is `1`.

```Plain
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## Related Configuration

**Timeout Configuration**

- `insert_timeout`: Since the delete operation is an SQL command and is considered a special load, the delete statement is affected by the `insert_timeout` value in the Session. You can increase the timeout by `SET insert_timeout = xxx`, where the unit is seconds.

**IN Predicate Configuration**

- `max_allowed_in_element_num_of_delete`: If the user needs to use a large number of elements in the `in` predicate, this item can be adjusted to increase the allowed element limit. The default value is 1024.

## View History

Users can view the history of completed delete records using the `SHOW DELETE` statement.

The syntax is as follows:

```sql
SHOW DELETE [FROM db_name]
```

Example:

```sql
mysql> show delete from test_db;
+-----------+---------------+---------------------+-----------------+----------+
| TableName | PartitionName | CreateTime          | DeleteCondition | State    |
+-----------+---------------+---------------------+-----------------+----------+
| empty_tbl | p3            | 2020-04-15 23:09:35 | k1 EQ "1"       | FINISHED |
| test_tbl  | p4            | 2020-04-15 23:09:53 | k1 GT "80"      | FINISHED |
+-----------+---------------+---------------------+-----------------+----------+
2 rows in set (0.00 sec)
```

## Performance Recommendations

1. On detail tables (Duplicate Key) and aggregate tables (Aggregate Key), the delete operation executes quickly, but a large number of delete operations in a short period will affect query performance.

2. On primary key tables (Unique Key), the delete operation is converted into an `INSERT INTO` statement. When deleting a large range, the execution speed is slow, but a large number of delete operations in a short period will not significantly affect query performance.

## Syntax

For detailed delete syntax, refer to the [DELETE](../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/DELETE) syntax manual.
