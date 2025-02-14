---
{
    "title": "Batch Deletion Based on Load",
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

## Batch Deletion Based on Load

The delete operation is a special form of data update. In the primary key model (Unique Key) table, Doris supports deletion by adding a delete sign when loading data.

Compared to the `DELETE` statement, using delete signs offers better usability and performance in the following scenarios:

1. **CDC Scenario**: When synchronizing data from an OLTP database to Doris, Insert and Delete operations in the binlog usually appear alternately. The `DELETE` statement cannot efficiently handle these operations. Using delete signs allows Insert and Delete operations to be processed uniformly, simplifying the CDC code for writing to Doris and improving data load and query performance.
2. **Batch Deletion of Specified Primary Keys**: If a large number of primary keys need to be deleted, using the `DELETE` statement is inefficient. Each execution of `DELETE` generates an empty rowset to record the delete condition and produces a new data version. Frequent deletions or too many delete conditions can severely affect query performance.

## Working Principle of Delete Signs

### Principle Explanation

- **Table Structure**: The delete sign is stored as a hidden column `__DORIS_DELETE_SIGN__` in the primary key table. When the value of this column is 1, it indicates that the delete sign is effective.
- **Data Load**: Users can specify the mapping condition of the delete sign column in the load task. The usage varies for different load tasks, as detailed in the syntax explanation below.
- **Query**: During the query, Doris FE automatically adds the filter condition `__DORIS_DELETE_SIGN__ != true` in the query plan to filter out data with a delete sign value of 1.
- **Data Compaction**: Doris's background data compaction periodically cleans up data with a delete sign value of 1.

### Data Example

#### Table Structure

Create an example table:

```sql
CREATE TABLE example_table (
    id BIGINT NOT NULL,
    value STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);
```

Use the session variable `show_hidden_columns` to view hidden columns:

```sql
mysql> set show_hidden_columns=true;

mysql> desc example_table;
+-----------------------+---------+------+-------+---------+-------+
| Field                 | Type    | Null | Key   | Default | Extra |
+-----------------------+---------+------+-------+---------+-------+
| id                    | bigint  | No   | true  | NULL    |       |
| value                 | text    | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint  | No   | false | 0       | NONE  |
+-----------------------+---------+------+-------+---------+-------+
```

#### Data Load

The table has the following existing data:

```sql
+------+-------+
| id   | value |
+------+-------+
|    1 | foo   |
|    2 | bar   |
+------+-------+
```

Insert a delete sign for id 1 (this is only for principle demonstration, not introducing various methods of using delete signs in load):

```sql
mysql> insert into example_table (id, __DORIS_DELETE_SIGN__) values (1, 1);
```

#### Query

Directly view the data, and you can find that the record with id 1 has been deleted:

```sql
mysql> select * from example_table;
+------+-------+
| id   | value |
+------+-------+
|    2 | bar   |
+------+-------+
```

Use the session variable `show_hidden_columns` to view hidden columns, and you can see that the row with id 1 has not been actually deleted. Its hidden column `__DORIS_DELETE_SIGN__` value is 1 and is filtered out during the query:

```sql
mysql> set show_hidden_columns=true;
mysql> select * from example_table;
+------+-------+-----------------------+-----------------------+
| id   | value | __DORIS_DELETE_SIGN__ | __DORIS_VERSION_COL__ |
+------+-------+-----------------------+-----------------------+
|    1 | NULL  |                     1 |                     3 |
|    2 | bar   |                     0 |                     2 |
+------+-------+-----------------------+-----------------------+
```

## Syntax Explanation

Different load types have different syntax for setting delete signs. Below are the usage syntax for delete signs in various load types.

### Load Merge Type Selection

There are several merge types when loading data:

1. **APPEND**: All data is appended to the existing data.
2. **DELETE**: Delete all rows with the same key column values as the loaded data.
3. **MERGE**: Decide whether to APPEND or DELETE based on the DELETE ON condition.

### Stream Load

The `Stream Load` syntax is to add a field for setting the delete sign column in the header's columns field, for example: `-H "columns: k1, k2, label_c3" -H "merge_type: [MERGE|APPEND|DELETE]" -H "delete: label_c3=1"`.

For usage examples of Stream Load, please refer to the "Specify merge_type for Delete Operation" and "Specify merge_type for Merge Operation" sections in the [Stream Load Manual](../import/import-way/stream-load-manual.md).

### Broker Load

The `Broker Load` syntax is to set the delete sign column field in `PROPERTIES`, as follows:

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

The `Routine Load` syntax is to add a mapping in the `columns` field, with the same mapping method as above, as follows:

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
