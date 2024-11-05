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

In certain multidimensional analysis scenarios, it is necessary to retain all raw data records. For this requirement, the duplicated data model can be used. In the duplicated data model, the storage layer will preserve all written data. Even if two rows of data are identical, both will be retained. The Duplicate Key specified in the table creation statement is used to indicate the columns by which the data should be sorted, and it can be used to optimize common queries. It is recommended to choose the first 2-4 columns for the Duplicate Key.

For example, a table has the following data columns and requires the retention of all raw data records. There are two ways to create a duplicated data model table: by specifying sorting columns or by using the default duplicated data model.


| ColumnName | Type          | SortKey | Comment        |
| ---------- | ------------- | ------- | -------------- |
| timstamp   | DATETIME      | Yes     | Log time       |
| type       | INT           | Yes     | Log type       |
| error_code | INT           | Yes     | Error code     |
| Error_msg  | VARCHAR (128) | No      | Error details  |
| op_id      | BIGINT        | No      | Operator ID    |
| op_time    | DATETIME      | No      | Operation time |

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
DISTRIBUTED BY HASH(`type`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

MySQL> desc example_tbl_duplicate; 
+------------+---------------+------+-------+---------+-------+
| Field      | Type          | Null | Key   | Default | Extra |
+------------+---------------+------+-------+---------+-------+
| timestamp  | datetime      | No   | true  | NULL    |       |
| type       | int           | No   | true  | NULL    |       |
| error_code | int           | Yes  | true  | NULL    |       |
| error_msg  | varchar(1024) | Yes  | false | NULL    | NONE  |
| op_id      | bigint        | Yes  | false | NULL    | NONE  |
| op_time    | datetime      | Yes  | false | NULL    | NONE  |
+------------+---------------+------+-------+---------+-------+
```

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
DISTRIBUTED BY HASH(`type`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

MySQL > desc example_tbl_by_default; 
+------------+---------------+------+-------+---------+-------+
| Field      | Type          | Null | Key   | Default | Extra |
+------------+---------------+------+-------+---------+-------+
| timestamp  | datetime      | No   | true  | NULL    |       |
| type       | int           | No   | true  | NULL    |       |
| error_code | int           | Yes  | true  | NULL    |       |
| error_msg  | varchar(1024) | Yes  | false | NULL    | NONE  |
| op_id      | bigint        | Yes  | false | NULL    | NONE  |
| op_time    | datetime      | Yes  | false | NULL    | NONE  |
+------------+---------------+------+-------+---------+-------+
```