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

The DELETE statement conditionally deletes data from a specified table or partition using the MySQL protocol.The Delete operation differs from import-based bulk deletion in that it is similar to the INSERT INTO statement, which is a synchronous process.All Delete operations are a separate import job in Doris.

The DELETE statement generally requires the specification of tables and partitions as well as deletion conditions to filter the data to be deleted, and will delete data from both the base and rollup tables.

The syntax of the DELETE statement is detailed in the [DELETE](../../sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/DELETE) syntax. Unlike the Insert into command, Delete cannot specify `label` manually. For the concept of `label` , refer to the [Insert Into](../../data-operate/import/insert-into-manual) documentation.

### Delete by Specifying a Filter Predicate

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### Required Parameters

- table_name: Specify the table from which the data should be deleted;

- column_name: Columns belonging to table_name

- op: Logical comparison operators, optional types include: =, >, <, >=, <=, !=, in, not in

- value | value_list: Values or lists of values for logical comparisons

### Optional Parameters

- PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): Specify the name of the partition in which the deletion is to be performed. If the partition does not exist in the table, an error will be reported.

- table_alias: Aliases of the Table

### Note

- When using the table model Aggregate, you can only specify conditions on the key column.

- If the selected key column does not exist in a rollup, it cannot be deleted.

- Conditions can only be related to each other by "and". If you want an "or" relationship, you need to write the conditions in two separate DELETE statements;

- If the table is partitioned, you need to specify the partition. If not, doris will infer the partition from the condition.In two cases, doris cannot infer the partition from the condition:

  - The condition does not contain a partition column

  - The op for the partition column is "not in". When the partition table does not specify a partition, or a partition cannot be inferred from the condition, you need to set the session variable `delete_without_partition` to true, in which case delete is applied to all partitions.

- This statement may reduce query efficiency for a period of time after execution. The extent of the impact depends on the number of deleted conditions specified in the statement. The more conditions specified, the greater the impact.

### Examples

**1. Delete the row in my_table partition p1 where column k1 is 3.**

```sql
DELETE FROM my_table PARTITION p1
    WHERE k1 = 3;
```

**2. Delete rows in my_table partition p1 where column k1 is greater than or equal to 3 and column k2 is "abc".**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 = 3 AND k2 = "abc";
```

**3. Delete rows in my_table partition (p1, p2) where column k1 is greater than or equal to 3 and column k2 is "abc".**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 = 3 AND k2 = "abc";
```

## Delete via the USING clause

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

### Required parameters

- table_name: Specify the table from which the data should be deleted;

- WHERE condition: Specify a condition for selecting rows for deletion;

### Optional parameters

- PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): Specify the name of the partition in which the deletion is to be performed. If the partition does not exist in the table, an error will be reported.

- table_alias: Aliases of the Table

### Note

- Only conditions on the key column can be specified when using the UNIQUE model.

### Example

Use the result of joining the `t2` and `t3` tables to delete the data in `t1`. The deleted table only supports the UNIQUE model.

```sql
-- Create t1, t2, t3 tables
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

The expected result is that the column with `id=1` in table `t1` is deleted.

```Plain
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## Returned Results

Delete command is a SQL command that return results synchronously. The results are classified as follows:

### Implementation Success

If Delete completes successfully and is visible, the following results are returned.`Query OK`indicates success.

```sql
mysql> delete from test_tbl PARTITION p1 where k1 = 1;
Query OK, 0 rows affected (0.04 sec)
{'label':'delete_e7830c72-eb14-4cb9-bbb6-eebd4511d251', 'status':'VISIBLE', 'txnId':'4005'}
```

### Submitted Successfully but Invisible

Doris transaction commit is divided into two steps: commit and release version, only after the completion of the release version step, the results will be visible to the user.

If the commit has been successful, then it can be assumed that it will eventually be published successfully, Doris will try to wait for a certain period of time after the commit is completed, if the timeout period is exceeded even if the published version is not yet complete, it will be preferred to return to the user, prompting the user that the commit has been completed.

 If Delete has been submitted and executed, but the release version is still not published and visible, the following result will be returned:

```sql
mysql> delete from test_tbl PARTITION p1 where k1 = 1;
Query OK, 0 rows affected (0.04 sec)
{'label':'delete_e7830c72-eb14-4cb9-bbb6-eebd4511d251', 'status':'COMMITTED', 'txnId':'4005', 'err':'delete job is committed but may be taking effect later' }
```

The result will also return a json string:

- `affected rows`：Indicates the rows affected by this deletion. Since Doris deletion is currently a logical deletion, this value is constant at 0;

- `label`：The automatically generated label identifies the import job. Each import job has a Label that is unique within a single database;

- `status`：Indicates whether the data deletion is visible. If it's visible, the result displays `VISIBLE`; if  it's invisible, the result displays `COMMITTED`;

- `txnId`：The transaction id corresponding to Delete;

- `err`：This field will display the details of Delete.

### Commit Failed, Transaction Cancelled

If the Delete statement fails to commit, the transaction will be automatically aborted by Doris and the following result will be returned:

```sql
mysql> delete from test_tbl partition p1 where k1 > 80;
ERROR 1064 (HY000): errCode = 2, detailMessage = {Cause of error}
```

For example, a timeout deletion will return the timeout time and the outstanding `(tablet=replica)`

```sql
mysql> delete from test_tbl partition p1 where k1 > 80;
ERROR 1064 (HY000): errCode = 2, detailMessage = failed to delete replicas from job: 4005, Unfinished replicas:10000=60000, 10001=60000, 10002=60000
```

### Summary

The correct logic for handling the results returned by Delete is:

- If returns `ERROR 1064 (HY000)` , the deletion failed;

- If returns`Query OK`, the deletion is successful;

  - If `status` is `COMMITTED`, it means that the data is still not visible, users can wait for a while and then check the result with `show delete`;

  - If `STATUS` is `VISIBLE`, the deletion is successful.

## FE Configurations

**TIMEOUT Configurations**

总体来说，Doris 的删除作业的超时时间计算规则为如下（单位：秒）：

Overall, the timeout calculation rules for Doris Delete jobs are as follows (in seconds):

```Plain
TIMEOUT = MIN(delete_job_max_timeout_second, MAX(30, tablet_delete_timeout_second * tablet_num))
```

- `tablet_delete_timeout_second`

The delete timeout time is elastically changed by the number of tablets under the specified partition. This item is configured so that the default value of the timeout time contributed by one tablet on average is 2.

Assuming that there are 5 tablets under the partition specified for this deletion, the timeout time available for delete is 10 seconds, and since it is less than the minimum timeout time of 30 seconds, the final timeout time is 30 seconds.

- `query_timeout`

Because delete itself is a SQL command, the delete statement is also subject to session limitations. Timeout is also affected by the `query_timeout` value in the session, which can be increased in seconds by `SET query_timeout = xxx`.

**IN Predicate Configuration**

- `max_allowed_in_element_num_of_delete`

If the user needs to occupy more elements when using the in predicate, the user can adjust the maximum number of elements allowed to be carried by `max_allowed_in_element_num_of_delete`. The default value is 1024.

## View History

Users can view the history of deletions that have been performed by using the show delete statement.

### Syntax

```sql
SHOW DELETE [FROM db_name]
```

### Example

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
