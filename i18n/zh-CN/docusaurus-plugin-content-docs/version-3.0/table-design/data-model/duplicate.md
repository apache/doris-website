---
{
    "title": "明细模型",
    "language": "zh-CN"
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

在某些多维分析场景下，必须保留所有原始数据记录，针对这种需求，可以使用明细数据模型。在明细数据模型中，存储层会保留写入的所有数据。即使两行数据完全相同，也都会保留。建表语句中指定的 Duplicate Key，只是用来指明数据存储按照哪些列进行排序，可以用于优化常用查询。在 Duplicate Key 的选择上，建议选择前 2-4 列即可。

举例如下，一个表有如下的数据列，需要保留所有原始数据记录，有两种方法可以创建明细模型的表，分别为：指定排序列以及默认为明细模型。

| ColumnName | Type         | Comment      |
| ---------- | ------------ | ------------ |
| timestamp  | DATETIME     | 日志时间     |
| type       | INT          | 日志类型     |
| error_code | INT          | 错误码       |
| error_msg  | VARCHAR(128) | 错误详细信息 |
| op_id      | BIGINT       | 负责人 ID    |
| op_time    | DATETIME     | 处理时间     |

## 指定排序列的明细模型

在建表语句中指定 Duplicate Key，用来指明数据存储按照这些 Key 列进行排序。在 Duplicate Key 的选择上，建议选择前 2-4 列即可。

建表语句举例如下，指定了按照 timestamp、type 和 error_code 三列进行排序。

```sql
CREATE TABLE IF NOT EXISTS example_tbl_duplicate
(
    `timestamp` DATETIME NOT NULL COMMENT "日志时间",
    `type` INT NOT NULL COMMENT "日志类型",
    `error_code` INT COMMENT "错误码",
    `error_msg` VARCHAR(1024) COMMENT "错误详细信息",
    `op_id` BIGINT COMMENT "负责人id",
    `op_time` DATETIME COMMENT "处理时间"
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

## 默认为明细模型

当创建表的时候没有指定 Unique、Aggregate 或 Duplicate 时，会默认创建一个 Duplicate 模型的表，并自动按照一定规则选定排序列。建表语句举例如下，没有指定任何数据模型，则建立的是明细模型（Duplicate），排序列系统自动选定了前 3 列。

```sql
CREATE TABLE IF NOT EXISTS example_tbl_by_default
(
    `timestamp` DATETIME NOT NULL COMMENT "日志时间",
    `type` INT NOT NULL COMMENT "日志类型",
    `error_code` INT COMMENT "错误码",
    `error_msg` VARCHAR(1024) COMMENT "错误详细信息",
    `op_id` BIGINT COMMENT "负责人id",
    `op_time` DATETIME COMMENT "处理时间"
)
DISTRIBUTED BY HASH(`type`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 3"
);

MySQL> desc example_tbl_by_default; 
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