---
{
    "title": "Updating Transaction",
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

## Update Concurrency Control

By default, concurrent updates on the same table are not allowed in Doris.

The main reason is that Doris currently supports row-level updates, which means that even if the user specifies to update only a specific column (e.g., `SET v2 = 1`), all other value columns will be overwritten as well (even though their values remain unchanged).

This poses a problem when multiple update operations are performed concurrently on the same row. The behavior becomes unpredictable, and it may lead to inconsistent or "dirty" data.

However, in practical applications, if the user can ensure that concurrent updates will not affect the same row simultaneously, they can manually enable the concurrent update restriction. This can be done by modifying the FE (Frontend) configuration `enable_concurrent_update`. When this configuration is set to `true`, the update command will not have transaction guarantees.

## Sequence Column

The Unique model primarily caters to scenarios that require unique primary keys, ensuring the uniqueness constraint. When loading data in the same batch or different batches, the replacement order is not guaranteed. The uncertainty in the replacement order results in ambiguity in the specific data loaded into the table.

To address this issue, Doris supports sequence columns. Users can specify a sequence column during data load, allowing the replacement order to be controlled by the user. The sequence column determines the order of replacements for rows with the same key column. A higher sequence value can replace a lower one, but not vice versa. This method delegates the determination of order to the user, enabling control over the replacement sequence.

:::note
Sequence columns are currently supported only in the Unique model.
:::

### Basic Principles

The basic principle is achieved by adding a hidden column called **__DORIS_SEQUENCE_COL__**. The type of this column is specified by the user during table creation and its specific value is determined during data load. Based on this value, the row that takes effect is determined for rows with the same key column.

**Table Creation**

When creating a Unique table, an automatically added hidden column called __DORIS_SEQUENCE_COL__ is created, based on the user-specified type.

**Data load**

During data load, the FE (Frontend) sets the value of the hidden column as the value of the `ORDER BY` expression (for broker load and routine load) or the value of the `function_column.sequence_col` expression (for stream load). The value column is replaced based on this sequence value. The value of the hidden column, `__DORIS_SEQUENCE_COL__`, can be set as a column in the data source or a column in the table structure.

### Syntax Usage

**Sequence Column has two ways to create a table, one is to set the `sequence_col` attribute when creating a table, and the other is to set the `sequence_type` attribute when creating a table.**

**1. Set `sequence_col` (Recommended)**

When creating a Unique table, specify the mapping of the sequence column to other columns in the table.

```Plain
PROPERTIES (
    "function_column.sequence_col" = 'column_name',
);
```

`sequence_col` is used to specify the mapping of the sequence column to a column in the table. The column can be of type integer or time type (DATE, DATETIME), and its type cannot be changed after creation.

The load method is the same as when there is no sequence column, making it relatively simple. This method is recommended.

**2. Set `sequence_type`**

When creating a Unique table, specify the type of the sequence column.

```Plain
PROPERTIES (
    "function_column.sequence_type" = 'Date',
);
```

`sequence_type` is used to specify the type of the sequence column, which can be integer or time type (DATE, DATETIME).

**During data load, you need to specify the mapping of the sequence column to other columns.**

**1. Stream Load**

The syntax for stream load is to add the mapping of the hidden column `function_column.sequence_col` to the `source_sequence` in the header. Example:

```shell
curl --location-trusted -u root -H "columns: k1,k2,source_sequence,v1,v2" -H "function_column.sequence_col: source_sequence" -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**2. Broker Load**

Set the mapping of the hidden column `source_sequence` in the `ORDER BY` clause.

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
    WHERE k1  100 and k2 like "%doris%"
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

### Enabling Sequence Column Support

If `function_column.sequence_col` or `function_column.sequence_type` is set when creating a new table, the new table will support sequence columns.

For a table that does not support sequence columns, if you want to use this feature, you can use the following statement: `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` to enable it.

If you are unsure whether a table supports sequence columns, you can set a session variable to display hidden columns with `SET show_hidden_columns=true`, and then use `desc tablename`. If the output includes the `__DORIS_SEQUENCE_COL__` column, it means that the table supports sequence columns; otherwise, it does not.

### Usage Example

Here is an example using Stream Load to demonstrate the usage:

**1. Create a table with sequence col support**

Create a unique model `test_table` and specify the sequence column mapping to the `modify_date` column in the table.

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

Table structure:

```sql
MySQL> desc test_table;
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

**2. Load data normally:**

Load the following data:

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Here is an example using Stream Load:

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

The result is:

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

In the data load, because the value of the sequence column (i.e., modify_date) '2020-03-05' is the maximum, the keyword column retains the value 'c'.

**3. Guarantee the order of replacement**

After completing the above steps, load the following data:

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

Query the data:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

In the loaded data, the sequence column (modify_date) of all previously loaded data is compared, and '2020-03-05' is the maximum. Therefore, the keyword column retains the value 'c'.

**4. Try loading the following data again**

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

Query the data:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

Now the original data in the table can be replaced. In summary, during thestream load process, the sequence column is used to determine the order of replacement for duplicate records. The record with the maximum value in the sequence column will be retained in the table.

### Note

1. To prevent misuse, users must explicitly specify the sequence column in loading tasks such as StreamLoad/BrokerLoad and in insert statements for row updates (unless the default value of the sequence column is CURRENT_TIMESTAMP). Otherwise, the following error message will be received:

```Plain
Table test_tbl has sequence column, need to specify the sequence column
```

2. Since version 2.0, Doris has supported partial column updates for Merge-on-Write implementation of Unique Key tables. In partial column update, users can update only a subset of columns each time, so it is not necessary to include the sequence column. If the loading task submitted by the user includes the sequence column, it has no effect. If the loading task submitted by the user does not include the sequence column, Doris will use the value of the matching sequence column from the historical data as the value of the updated row's sequence column. If there is no existing column with the same key in the historical data, it will be automatically filled with null or the default value.

3. In cases of concurrent data load, Doris utilizes MVCC (Multi-Version Concurrency Control) mechanism to ensure data correctness. If two batches of loaded data update different columns of the same key, the load task with a higher system version will reapply the data for the same key written by the load task with a lower version after the lower version load task succeeds.
