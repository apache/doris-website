---
{
    "title": "Batch Deletion",
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

Why do we need to introduce import-based Batch Delete when we have the Delete operation?

- **Limitations of Delete operation**

When you delete by Delete statement, each execution of Delete generates an empty rowset to record the deletion conditions and a new version of the data. Each time you read, you have to filter the deletion conditions. If you delete too often or have too many deletion conditions, it will seriously affect the query performance.

- **Insert data interspersed with Delete data**

For scenarios like importing data from a transactional database via CDC, Insert and Delete are usually interspersed in the data. In this case, the current Delete operation cannot be implemented.

When importing data, there are several ways to merge it:

1. APPEND: Append all data to existing data.

2. DELETE: Delete all rows that have the same value as the key column of the imported data (when a `sequence` column exists in the table, it is necessary to satisfy the logic of having the same primary key as well as the size of the sequence column in order to delete it correctly, see Use Case 4 below for details).

3. MERGE: APPEND or DELETE according to DELETE ON decision

:::caution Warning
Batch Delete only works on Unique models.
:::

## Fundamental

This is achieved by adding a hidden column `__DORIS_DELETE_SIGN__` to the Unique table.

When FE parses the query, `__DORIS_DELETE_SIGN__` is removed when it encounters * and so on, and `__DORIS_DELETE_SIGN__ !` `= true`, BE will add a column for judgement when reading, and determine whether to delete by the condition.

- Import

    On import, the value of the hidden column is set to the value of the `DELETE ON` expression during the FE parsing stage.

- Read

    The read adds `__DORIS_DELETE_SIGN__ !` `= true` condition, BE does not sense this process and executes normally.

- Cumulative Compaction

    In Cumulative Compaction, hidden columns are treated as normal columns and the Compaction logic remains unchanged.

- Base Compaction

    When Base Compaction is performed, the rows marked for deletion are deleted to reduce the space occupied by the data.

## Enable Batch Delete Support

There are two forms of enabling Batch Delete support:

1. Batch Delete is supported by adding `enable_batch_delete_by_default=true` in the FE configuration file for all new tables created after restarting FE;

2. For tables that do not have the above FE configuration changed or for existing tables that do not support Batch Delete, the following statement can be used: `ALTER TABLE tablename ENABLE FEATURE "BATCH_DELETE"` to enable Batch Delete. This is essentially a schema change operation, which returns immediately and can be confirmed by `showing alter table column`.

Then how to determine whether a table supports Batch Delete, you can set a session variable to show hidden columns `SET show_hidden_columns=true`, and after that use `desc tablename`, if there is a `__DORIS_DELETE_SIGN__` column in the output then it is supported, if there is not then it is not supported.

## Syntax Description

The syntax design of the import is mainly to add a column mapping that specifies the field of the delete marker column, and it is necessary to add a column to the imported data. The syntax of various import methods is as follows:

### Stream Load

The writing method of `Stream Load` adds a field to set the delete label column in the columns field in the header. Example: `-H "columns: k1, k2, label_c3" -H "merge_type: [MERGE|APPEND|DELETE]" -H "delete: label_c3=1"`

### Broker Load

The writing method of `Broker Load` sets the field of the delete marker column at `PROPERTIES`. The syntax is as follows:

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1,tmp_c2, label_c3)
    SET
    (
        id=tmp_c2,
        name=tmp_c1,
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Routine Load

The writing method of `Routine Load` adds a mapping to the `columns` field. The mapping method is the same as above. The syntax is as follows:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
 [WITH MERGE|APPEND|DELETE]
 COLUMNS(k1, k2, k3, v1, v2, label),
 WHERE k1  100 and k2 like "%doris%"
 [DELETE ON label=true]
 PROPERTIES
 (
     "desired_concurrent_number"="3",
     "max_batch_interval" = "20",
     "max_batch_rows" = "300000",
     "max_batch_size" = "209715200",
     "strict_mode" = "false"
 )
 FROM KAFKA
 (
     "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
     "kafka_topic" = "my_topic",
     "kafka_partitions" = "0,1,2,3",
     "kafka_offsets" = "101,0,0,200"
 );
```

## Note

1. Since import operations other than stream load may be executed out of order inside doris, if it is not stream load when importing using the `MERGE` method, it needs to be used with load sequence. For the specific syntax, please refer to the `sequence` column related documents

2. `DELETE ON` condition can only be used with MERGE.

:::tip Tip
if session variable `SET show_hidden_columns = true` was executed before running import task to show whether table support batch delete feature, then execute `select count(*) from xxx` statement in the same session after finishing `DELETE/MERGE` import task, it will result in a unexpected result that the statement result set will include the deleted results. To avoid this problem, you should execute `SET show_hidden_columns = false` before selecting statement or open a new session to run the select statement.
:::

## Usage Examples

### Check if Batch Delete Support is Enabled

```sql
mysql> CREATE TABLE IF NOT EXISTS table1 (
    ->     siteid INT,
    ->     citycode INT,
    ->     username VARCHAR(64),
    ->     pv BIGINT
    -> ) UNIQUE KEY (siteid, citycode, username)
    -> DISTRIBUTED BY HASH(siteid) BUCKETS 10
    -> PROPERTIES (
    ->     "replication_num" = "3"
    -> );
Query OK, 0 rows affected (0.34 sec)

mysql> SET show_hidden_columns=true;
Query OK, 0 rows affected (0.00 sec)

mysql> DESC table1;
+-----------------------+-------------+------+-------+---------+-------+
| Field                 | Type        | Null | Key   | Default | Extra |
+-----------------------+-------------+------+-------+---------+-------+
| siteid                | int         | Yes  | true  | NULL    |       |
| citycode              | int         | Yes  | true  | NULL    |       |
| username              | varchar(64) | Yes  | true  | NULL    |       |
| pv                    | bigint      | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint     | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint      | No   | false | 0       | NONE  |
+-----------------------+-------------+------+-------+---------+-------+
6 rows in set (0.01 sec)
```

### Stream Load Usage Examples
Please refer to the sections "Specifying merge_type for DELETE operations" and "Specifying merge_type for MERGE operations" in the [Stream Load Manual](../import/import-way/stream-load-manual.md)
