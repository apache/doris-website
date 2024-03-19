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

明细模型，也成为 Duplicate 数据模型。

在某些多维分析场景下，数据既没有主键，也没有聚合需求。针对这种需求，可以使用明细数据模型。

在明细数据模型中，数据按照导入文件中的数据进行存储，不会有任何聚合。即使两行数据完全相同，也都会保留。而在建表语句中指定的 DUPLICATE KEY，只是用来指明数据存储按照哪些列进行排序。在 DUPLICATE KEY 的选择上，建议选择前 2-4 列即可。

举例如下，一个表有如下的数据列，没有主键更新和基于聚合键的聚合需求。

| ColumnName | Type         | Comment      |
| ---------- | ------------ | ------------ |
| timestamp  | DATETIME     | 日志时间     |
| type       | INT          | 日志类型     |
| error_code | INT          | 错误码       |
| error_msg  | VARCHAR(128) | 错误详细信息 |
| op_id      | BIGINT       | 负责人 ID    |
| op_time    | DATETIME     | 处理时间     |

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

## 无排序列的默认明细模型

当用户并没有排序需求的时候，可以通过在表属性中增加如下配置。这样在创建默认明细模型时，系统就不会自动选择任何排序列。

```Plain
"enable_duplicate_without_keys_by_default" = "true"
```

建表举例如下：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_duplicate_without_keys_by_default
(
    `timestamp` DATETIME NOT NULL COMMENT "日志时间",
    `type` INT NOT NULL COMMENT "日志类型",
    `error_code` INT COMMENT "错误码",
    `error_msg` VARCHAR(1024) COMMENT "错误详细信息",
    `op_id` BIGINT COMMENT "负责人id",
    `op_time` DATETIME COMMENT "处理时间"
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

## 指定排序列的明细模型

在建表语句中指定 DUPLICATE KEY，用来指明数据存储按照这些 Key 列进行排序。在 DUPLICATE KEY 的选择上，建议选择前 2-4 列即可。

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

数据按照导入文件中的数据进行存储，不会有任何聚合。即使两行数据完全相同，也都会保留。而在建表语句中指定的 DUPLICATE KEY，只是用来指明数据存储按照哪些列进行排序。在 DUPLICATE KEY 的选择上，建议选择前 2-4 列即可。