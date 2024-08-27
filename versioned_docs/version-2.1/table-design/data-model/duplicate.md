---
{
    "title": "Duplicate Key Model",
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

In certain multidimensional analysis scenarios, the data lacks both a primary key and aggregation requirements. For these cases, the Duplicate Data Model can be employed.

In the Duplicate Data Model, data is stored precisely as it appears in the imported file, without any aggregation. Even if two rows of data are identical, both will be retained. The Duplicate Key specified in the table creation statement serves solely to indicate which columns the data should be sorted by during storage. It is advisable to select the first 2-4 columns for the Duplicate Key.

For instance, consider a table with the following data columns that has no requirements for primary key updates or aggregations based on aggregate keys:

:::tip
The actual table structure and data columns have not been provided in the original text. Hence, a specific example cannot be given here. If needed, you can add the specific table structure and data columns based on your actual situation.
:::

| ColumnName | Type          | SortKey | Comment        |
| ---------- | ------------- | ------- | -------------- |
| timstamp   | DATETIME      | Yes     | Log time       |
| type       | INT           | Yes     | Log type       |
| error_code | INT           | Yes     | Error code     |
| Error_msg  | VARCHAR (128) | No      | Error details  |
| op_id      | BIGINT        | No      | Operator ID    |
| op_time    | DATETIME      | No      | Operation time |

## **Default Duplicate Model**

When no data model (Unique, Aggregate, or Duplicate) is specified during table creation, a Duplicate model table is created by default, and the sort columns are automatically selected according to certain rules. For example, in the following table creation statement, if no data model is specified, a Duplicate model table will be established, and the system will automatically select the first three columns as the sort columns.

```
CREATE TABLE IF NOT EXISTS example_tbl_by_default
(
    `timestamp` DATETIME NOT NULL COMMENT "Log time",
    `type` INT NOT NULL COMMENT "Log type",
    `error_code` INT COMMENT "Error code",
    `error_msg` VARCHAR(1024) COMMENT "Error detail message",
    `op_id` BIGINT COMMENT "Operator ID",
    `op_time` DATETIME COMMENT "Operation time"
)
DISTRIBUTED BY HASH(`type`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);

MySQL > desc example_tbl_by_default; 
+------------+---------------+------+-------+---------+-------+
| Field      | Type          | Null | Key   | Default | Extra |
+------------+---------------+------+-------+---------+-------+
| timestamp  | DATETIME      | No   | true  | NULL    | NONE  |
| type       | INT           | No   | true  | NULL    | NONE  |
| error_code | INT           | Yes  | true  | NULL    | NONE  |
| error_msg  | VARCHAR(1024) | Yes  | false | NULL    | NONE  |
| op_id      | BIGINT        | Yes  | false | NULL    | NONE  |
| op_time    | DATETIME      | Yes  | false | NULL    | NONE  |
+------------+---------------+------+-------+---------+-------+
6 rows in set (0.01 sec)
```

## **Default Duplicate Model without Sort Columns (Since V2.0 )**

When users have no sorting requirements, they can add the following configuration to the table properties. This way, when creating the default Duplicate model , the system will not automatically select any sort columns.

```
"enable_duplicate_without_keys_by_default" = "true"
```

The corresponding to CREATE TABLE statement is as follows:

```
CREATE TABLE IF NOT EXISTS example_tbl_duplicate_without_keys_by_default
(
    `timestamp` DATETIME NOT NULL COMMENT "Log time",
    `type` INT NOT NULL COMMENT "Log type",
    `error_code` INT COMMENT "Error code",
    `error_msg` VARCHAR(1024) COMMENT "Error detail message",
    `op_id` BIGINT COMMENT "Operator ID",
    `op_time` DATETIME COMMENT "Operation time"
)
DISTRIBUTED BY HASH(`type`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"enable_duplicate_without_keys_by_default" = "true"
);

MySQL > desc example_tbl_duplicate_without_keys_by_default;
+------------+---------------+------+-------+---------+-------+
| Field      | Type          | Null | Key   | Default | Extra |
+------------+---------------+------+-------+---------+-------+
| timestamp  | DATETIME      | No   | false | NULL    | NONE  |
| type       | INT           | No   | false | NULL    | NONE  |
| error_code | INT           | Yes  | false | NULL    | NONE  |
| error_msg  | VARCHAR(1024) | Yes  | false | NULL    | NONE  |
| op_id      | BIGINT        | Yes  | false | NULL    | NONE  |
| op_time    | DATETIME      | Yes  | false | NULL    | NONE  |
+------------+---------------+------+-------+---------+-------+
6 rows in set (0.01 sec)
```

## **Duplicate Model with Sort Columns **

In the table creation statement, the `Duplicate Key` can be designated to indicate that data storage should be sorted according to these key columns. When choosing the `Duplicate Key`, it is recommended to select the first 2-4 columns.

An example of a table creation statement is as follows, specifying sorting based on the `timestamp`, `type`, and `error_code` columns.

```
CREATE TABLE IF NOT EXISTS example_tbl_duplicate
(
    `timestamp` DATETIME NOT NULL COMMENT "Log time",
    `type` INT NOT NULL COMMENT "Log type",
    `error_code` INT COMMENT "Error code",
    `error_msg` VARCHAR(1024) COMMENT "Error detail message",
    `op_id` BIGINT COMMENT "Operator ID",
    `op_time` DATETIME COMMENT "Operation time"
)
DUPLICATE KEY(`timestamp`, `type`, `error_code`)
DISTRIBUTED BY HASH(`type`) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);

MySQL > desc example_tbl_duplicate; 
+------------+---------------+------+-------+---------+-------+
| Field      | Type          | Null | Key   | Default | Extra |
+------------+---------------+------+-------+---------+-------+
| timestamp  | DATETIME      | No   | true  | NULL    | NONE  |
| type       | INT           | No   | true  | NULL    | NONE  |
| error_code | INT           | Yes  | true  | NULL    | NONE  |
| error_msg  | VARCHAR(1024) | Yes  | false | NULL    | NONE  |
| op_id      | BIGINT        | Yes  | false | NULL    | NONE  |
| op_time    | DATETIME      | Yes  | false | NULL    | NONE  |
+------------+---------------+------+-------+---------+-------+
6 rows in set (0.01 sec)
```

Data will be stored according to the original data in the imported file without any aggregation. Even if two rows of data are exactly the same, the system will retain them all. The `Duplicate Key` specified in the table creation statement is only used to indicate which columns should be used for sorting during data storage. When choosing the `Duplicate Key`, it is recommended to select the first 2-4 columns.