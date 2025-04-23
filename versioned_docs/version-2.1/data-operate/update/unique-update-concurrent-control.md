---
{
    "title": "Concurrency Control for Updates in the Primary Key Model",
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

## Overview

Doris employs Multi-Version Concurrency Control (MVCC) to handle concurrent updates. Each data write operation is assigned a write transaction, ensuring atomicity (i.e., the write operation either fully succeeds or fully fails). Upon committing the write transaction, the system assigns it a version number. In the Unique Key model, when loading data multiple times, if there are duplicate primary keys, Doris determines the overwrite order based on the version number: data with a higher version number will overwrite data with a lower version number.

In some scenarios, users may need to adjust the effective order of data by specifying a sequence column in the table creation statement. For example, when synchronizing data to Doris concurrently through multiple threads, data from different threads may arrive out of order. In this case, old data arriving later may incorrectly overwrite new data. To solve this problem, users can assign a lower sequence value to old data and a higher sequence value to new data, allowing Doris to correctly determine the update order based on the user-provided sequence values.

Additionally, the `UPDATE` statement differs significantly from updates implemented through data loads at the underlying mechanism level. The `UPDATE` operation involves two steps: reading the data to be updated from the database and writing the updated data. By default, the `UPDATE` statement provides transaction capabilities with Serializable isolation level through table-level locks, meaning multiple `UPDATE` operations can only be executed serially. Users can also bypass this restriction by adjusting the configuration, as detailed in the following sections.

## UPDATE Concurrency Control

By default, concurrent `UPDATE` operations on the same table are not allowed.

The main reason is that Doris currently supports row updates, which means that even if the user declares `SET v2 = 1`, all other value columns will also be overwritten (even if the values have not changed).

This can lead to a problem where if two `UPDATE` operations update the same row simultaneously, the behavior may be indeterminate, potentially resulting in dirty data.

However, in practical applications, if users can ensure that concurrent updates do not operate on the same row simultaneously, they can manually enable concurrent updates. By modifying the FE configuration `enable_concurrent_update`, setting this configuration value to `true` will disable transaction guarantees for update commands.

## Sequence Column

The Unique model is mainly for scenarios requiring unique primary keys, ensuring the uniqueness constraint of the primary key. The replacement order of data loaded in the same batch or different batches is not guaranteed. Without a guaranteed replacement order, the specific data ultimately loaded into the table is uncertain.

To solve this problem, Doris supports sequence columns. By specifying a sequence column during loading, data with the same key column is replaced based on the sequence column value, with larger values replacing smaller ones, and vice versa. This method allows users to control the replacement order.

In implementation, Doris adds a hidden column **__DORIS_SEQUENCE_COL__**, whose type is specified by the user during table creation. The specific value of this column is determined during data loading, and the effective row for the same key column is decided based on this value.

:::caution Note
The sequence column currently only supports the Unique model.
:::

### Enabling Sequence Column Support

When creating a new table, if `function_column.sequence_col` or `function_column.sequence_type` is set, the new table will support sequence columns.

For a table that does not support sequence columns, you can enable this feature using the following statement: `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")`.

To check if a table supports sequence columns, you can set a session variable to display hidden columns `SET show_hidden_columns=true`, then use `desc tablename`. If the output includes the `__DORIS_SEQUENCE_COL__` column, it is supported; otherwise, it is not.

### Usage Example

Below is an example of using Stream Load:

**1. Create a table supporting sequence columns**

Create a unique model `test_table` and map the sequence column to the `modify_date` column.

```sql
CREATE TABLE test.test_table
(
    user_id bigint,
    date date,
    group_id bigint,
    modify_date date,
    keyword VARCHAR(128)
)
UNIQUE KEY(user_id, date, group_id)
DISTRIBUTED BY HASH (user_id) BUCKETS 32
PROPERTIES(
    "function_column.sequence_col" = 'modify_date',
    "replication_num" = "1",
    "in_memory" = "false"
);
```

The `sequence_col` specifies the mapping of the sequence column to a column in the table. This column can be of integer or date/time type (DATE, DATETIME) and cannot be changed after creation.

The table structure is as follows:

```sql
MySQL>  desc test_table;
+-------------+--------------+------+-------+---------+---------+
| Field       | Type         | Null | Key   | Default | Extra   |
+-------------+--------------+------+-------+---------+---------+
| user_id     | BIGINT       | No   | true  | NULL    |         |
| date        | DATE         | No   | true  | NULL    |         |
| group_id    | BIGINT       | No   | true  | NULL    |         |
| modify_date | DATE         | No   | false | NULL    | REPLACE |
| keyword     | VARCHAR(128) | No   | false | NULL    | REPLACE |
+-------------+--------------+------+-------+---------+---------+
```

In addition to specifying the sequence column through column mapping, Doris also supports creating a sequence column based on a specified type. This method does not require a column in the schema for mapping. The syntax is as follows:

```Plain
PROPERTIES (
    "function_column.sequence_type" = 'Date',
);
```

The `sequence_type` specifies the type of the sequence column, which can be integer or date/time type (DATE, DATETIME).

**2. Load Data:**

Using column mapping (`function_column.sequence_col`) to specify the sequence column does not require modifying any parameters. Below is an example of loading data using Stream Load:

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Stream load command:

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

Result:

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

In this load job, the value '2020-03-05' in the sequence column (modify_date) is the largest, so the keyword column retains 'c'.

If the sequence column is specified using `function_column.sequence_col` during table creation, the sequence column mapping must be specified during load.

**1. Stream Load**

In Stream Load, specify the sequence column mapping in the header:

```shell
curl --location-trusted -u root -H "columns: k1,k2,source_sequence,v1,v2" -H "function_column.sequence_col: source_sequence" -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**2. Broker Load**

Set the hidden column mapping in the `ORDER BY` clause:

```sql
LOAD LABEL db1.label1
(
    DATA INFILE("hdfs://host:port/user/data/*/test.txt")
    INTO TABLE `tbl1`
    COLUMNS TERMINATED BY ","
    (k1,k2,source_sequence,v1,v2)
    ORDER BY source_sequence
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

**3. Routine Load**

The mapping method is the same as above. Example:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
    [WITH MERGE|APPEND|DELETE]
    COLUMNS(k1, k2, source_sequence, v1, v2),
    WHERE k1 > 100 and k2 like "%doris%"
    [ORDER BY source_sequence]
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

**3. Ensuring Replacement Order**

After completing the above steps, load the following data:

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

Query data:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

In this load, the sequence column value '2020-03-05' is the largest, so the keyword column retains 'c'.

**4. Try Loading the Following Data**

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

Query data:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

This time, the data in the table is replaced. In summary, during the load process, the sequence column values of all batches are compared, and the record with the largest value is loaded into the Doris table.

### Note

1. To prevent misuse, in Stream Load/Broker Load load tasks and row update insert statements, users must explicitly specify the sequence column (unless the default value of the sequence column is CURRENT_TIMESTAMP), otherwise, the following error message will be received:

```Plain
Table test_tbl has sequence column, need to specify the sequence column
```

2. Since version 2.0, Doris supports partial column update capability for Unique Key tables with Merge-on-Write implementation. In partial column update loads, users can update only a portion of the columns each time, so it is not necessary to include the sequence column. If the load task submitted by the user includes the sequence column, the behavior is unaffected; if the load task does not include the sequence column, Doris will use the sequence column from the matching historical data as the value of the sequence column for the updated row. If there is no matching key column in the historical data, null or the default value will be used.

3. During concurrent loads, Doris uses the MVCC mechanism to ensure data correctness. If two batches of data loads update different columns of the same key, the load task with the higher system version will use the data row written by the lower version load task to fill in the same key after the lower version load task succeeds.
